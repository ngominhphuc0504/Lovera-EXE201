// Offline regression checks. No requests leave this process.
// Run: node scripts/api-sync.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const storage = new Map();
const pending = [];
const modules = new Map();
const context = vm.createContext({
  console, Headers, FormData, AbortController,
  setTimeout, clearTimeout,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  },
  fetch: (url, options) => new Promise(resolve => pending.push({ url, options, resolve })),
});
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = fs.readFileSync(file, 'utf8').replace("import.meta.env.VITE_API_BASE_URL", "undefined");
  const code = transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
  const fn = vm.runInContext(`(function(require,module,exports){${code}\n})`, context);
  fn(name => load(path.resolve(path.dirname(file), name + '.ts')), module, module.exports);
  return module.exports;
}
function respond(request, body) {
  request.resolve({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body });
}
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

async function services() {
  const api = load(path.join(root, 'src/services/apiClient.ts'));
  const { memoryService } = load(path.join(root, 'src/services/memoryService.ts'));
  const { authService } = load(path.join(root, 'src/services/authService.ts'));
  const { coupleService } = load(path.join(root, 'src/services/coupleService.ts'));
  api.setStoredToken('account-a');
  const first = memoryService.getTimeline();
  assert.equal(memoryService.getTimeline(), first);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].options.headers.get('Authorization'), 'Bearer account-a');
  respond(pending.shift(), [{ id: 'memory-a' }]);
  assert.equal((await first)[0].id, 'memory-a');

  const status = coupleService.getStatus();
  assert.equal(coupleService.getStatus(), status);
  respond(pending.shift(), { state: 'paired', couple: { isActive: true } });
  assert.equal((await status).isPaired, true);

  const oldProfile = authService.getProfile();
  const rejectedProfile = assert.rejects(oldProfile, error => error.code === 'stale_session');
  const oldTimeline = memoryService.getTimeline();
  const rejectedTimeline = assert.rejects(oldTimeline, error => error.code === 'stale_session');
  api.clearStoredToken();
  api.setStoredToken('account-b');
  const newTimeline = memoryService.getTimeline();
  assert.notEqual(oldTimeline, newTimeline);
  respond(pending.shift(), { id: 'account-a' });
  respond(pending.shift(), [{ id: 'old' }]);
  respond(pending.shift(), [{ id: 'new' }]);
  await Promise.all([rejectedProfile, rejectedTimeline]);
  assert.equal(api.getStoredUserProfile(), null);
  assert.equal((await newTimeline)[0].id, 'new');
  const logout = authService.logout();
  const rejectedLogout = assert.rejects(logout, error => error.code === 'stale_session');
  api.setStoredToken('account-c');
  pending.shift().resolve({ ok: true, status: 204 });
  await rejectedLogout;
  assert.equal(api.getStoredToken(), 'account-c', 'late logout preserves the new session');
  assert.equal(pending.length, 0);
  console.log('PASS: timeline/status deduplication, bearer token, old-session rejection, profile storage protection');
}

async function timelineCoordinator() {
  const source = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const start = source.indexOf('  const refreshBackendMemories =');
  const end = source.indexOf('  const loadBackendMemories =', start);
  const code = transformSync(source.slice(start, end) + '\nrefreshBackendMemories;', { loader: 'ts', target: 'es2022' }).code;
  const requests = [];
  const latestSync = { current: { coupleId: 'couple-a' } };
  const mountedRef = { current: true };
  const timelineRevision = { current: 0 };
  const sandbox = {
    getSessionKey: () => 'session-a', getStoredToken: () => 'token',
    couple: { coupleId: 'couple-a' }, isDemoMode: false, mountedRef, latestSync, timelineRevision,
    timelineFlight: { current: null }, timelineLoaded: { current: { key: '', at: 0 } },
    Date, Promise,
    loadBackendMemories: () => new Promise(resolve => requests.push(resolve)),
  };
  const refresh = vm.runInNewContext(code, sandbox);
  latestSync.current.refreshBackendMemories = refresh;
  const first = refresh(true, false);
  assert.equal(refresh(true, false), first);
  assert.equal(requests.length, 1);
  requests.shift()(true);
  await first;
  await refresh(true, false);
  assert.equal(requests.length, 0, 'screen navigation uses fresh timeline');
  const mutation = refresh(true);
  timelineRevision.current++;
  assert.equal(refresh(true), mutation);
  assert.equal(refresh(true), mutation);
  assert.equal(requests.length, 1);
  requests.shift()(true);
  await flush();
  assert.equal(requests.length, 1, 'concurrent writes coalesce into one follow-up read');
  requests.shift()(true);
  await mutation;
  const last = refresh(true);
  timelineRevision.current++;
  refresh(true);
  mountedRef.current = false;
  requests.shift()(true);
  await last;
  assert.equal(requests.length, 0, 'unmount prevents queued revalidation');
  const read = source.slice(source.indexOf('  const loadBackendMemories ='), source.indexOf('  const navigateToAdmin ='));
  assert.ok(!read.includes('createMemory('), 'reading the timeline never publishes sync records');
  console.log('PASS: App timeline coalescing, navigation freshness, post-mutation revalidation, unmount, read-only timeline');
}

async function scheduler() {
  // Execute the actual App effect with fake time/events and mocked read-only services.
  const source = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const marker = source.indexOf('let lastCouple = 0');
  const start = source.lastIndexOf('React.useEffect(', marker) + 'React.useEffect('.length;
  const end = source.indexOf('}, [isDemoMode, sessionKey]);', marker) + 1;
  const effect = source.slice(start, end);
  assert.ok(marker > 0 && end > start, 'App sync effect exists');
  let now = 100000;
  let id = 0;
  let session = 'session-a';
  const timers = new Map();
  const listeners = new Map();
  const events = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); },
  };
  const document = { ...events, hidden: false };
  const navigator = { onLine: true };
  const calls = { profile: 0, couple: 0, memories: 0 };
  const latestSync = { current: {
    isPaired: true,
    syncAuthenticatedCouple: async (_, profile) => { calls.couple++; if (profile) calls.profile++; return true; },
    refreshBackendMemories: async () => { calls.memories++; return true; },
  } };
  const sandbox = {
    document, navigator, window: events, latestSync, isDemoMode: false,
    getStoredToken: () => 'token', getSessionKey: () => session, sessionKey: session,
    Date: { now: () => now }, queueMicrotask,
    setTimeout: (fn, delay) => { timers.set(++id, { fn, at: now + delay }); return id; },
    clearTimeout: key => timers.delete(key),
  };
  const compiled = transformSync(`const setup = ${effect}; setup;`, { loader: 'ts', target: 'es2022' }).code;
  const setup = vm.runInNewContext(compiled, sandbox);
  async function advance(ms) {
    now += ms;
    for (const [key, timer] of [...timers]) if (timer.at <= now) { timers.delete(key); timer.fn(); }
    await flush();
  }
  // StrictMode setup/cleanup/setup must only start one polling chain.
  setup()();
  const cleanup = setup();
  await advance(0);
  assert.deepEqual(calls, { profile: 1, couple: 1, memories: 1 });
  await advance(30000);
  assert.deepEqual(calls, { profile: 1, couple: 1, memories: 2 });
  await advance(30000);
  assert.deepEqual(calls, { profile: 1, couple: 2, memories: 3 });
  document.hidden = true;
  listeners.get('visibilitychange')();
  await advance(90000);
  assert.equal(calls.memories, 3);
  document.hidden = false;
  listeners.get('visibilitychange')();
  listeners.get('online')();
  await flush();
  assert.deepEqual(calls, { profile: 2, couple: 3, memories: 4 });
  navigator.onLine = false;
  listeners.get('offline')();
  await advance(90000);
  assert.equal(calls.memories, 4);
  navigator.onLine = true;
  listeners.get('online')();
  await flush();
  assert.deepEqual(calls, { profile: 3, couple: 4, memories: 5 });
  session = 'session-b';
  await advance(30000);
  assert.equal(calls.memories, 5);
  cleanup();
  assert.equal(timers.size, 0);
  assert.equal(listeners.size, 0);
  console.log('PASS: restore, 30s memories / 60s couple, no profile polling, hidden/offline pause, coalesced resume, session change, cleanup');
}

(async () => { await services(); await timelineCoordinator(); await scheduler(); })().catch(error => { console.error(error); process.exitCode = 1; });
