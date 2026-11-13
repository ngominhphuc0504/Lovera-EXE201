import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'lovera-cross-browser-sync',
        configureServer(server) {
          let syncSubscribers: any[] = [];
          const recentMessages: any[] = [];
          let globalSeq = 0;

          const cacheFilePath = path.resolve(import.meta.dirname, 'node_modules/.lovera_sync_cache.json');
          let sharedState: {
            avatars: Record<string, string>;
            nicknames: Record<string, string>;
            startDate?: string;
            lovePoints?: number;
          } = { avatars: {}, nicknames: {} };

          try {
            if (fs.existsSync(cacheFilePath)) {
              const raw = fs.readFileSync(cacheFilePath, 'utf-8');
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                sharedState = {
                  avatars: parsed.avatars || {},
                  nicknames: parsed.nicknames || {},
                  startDate: parsed.startDate,
                  lovePoints: parsed.lovePoints,
                };
              }
            }
          } catch {}

          const persistState = () => {
            try {
              fs.writeFileSync(cacheFilePath, JSON.stringify(sharedState), 'utf-8');
            } catch {}
          };

          server.middlewares.use('/__lovera_sync', (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  data.seq = ++globalSeq;
                  data._seq = data.seq;
                  recentMessages.push(data);
                  if (recentMessages.length > 100) recentMessages.shift();

                  // Maintain persistent server state
                  if (data.type === 'SYNC_AVATAR' && data.payload?.avatar) {
                    const { senderId, senderName, senderEmail, avatar } = data.payload;
                    if (senderId) sharedState.avatars[String(senderId).toLowerCase()] = avatar;
                    if (senderName) sharedState.avatars[String(senderName).toLowerCase()] = avatar;
                    if (senderEmail) sharedState.avatars[String(senderEmail).toLowerCase()] = avatar;
                    persistState();
                  } else if (data.type === 'SYNC_COUPLE' && data.payload) {
                    const { userA, userB, startDate, lovePoints } = data.payload;
                    if (userA?.avatar) {
                      if (userA.id) sharedState.avatars[String(userA.id).toLowerCase()] = userA.avatar;
                      if (userA.name) sharedState.avatars[String(userA.name).toLowerCase()] = userA.avatar;
                    }
                    if (userB?.avatar) {
                      if (userB.id) sharedState.avatars[String(userB.id).toLowerCase()] = userB.avatar;
                      if (userB.name) sharedState.avatars[String(userB.name).toLowerCase()] = userB.avatar;
                    }
                    if (startDate && startDate !== '2025-09-22') sharedState.startDate = startDate;
                    if (typeof lovePoints === 'number') sharedState.lovePoints = Math.max(sharedState.lovePoints || 0, lovePoints);
                    persistState();
                  } else if (data.type === 'SYNC_NICKNAMES' && data.payload) {
                    const { senderName, partnerName } = data.payload;
                    if (senderName) sharedState.nicknames['sender'] = senderName;
                    if (partnerName) sharedState.nicknames['partner'] = partnerName;
                    persistState();
                  }

                  const jsonStr = JSON.stringify(data);
                  const sseMsg = jsonStr.split('\n').map(l => `data: ${l}`).join('\n') + '\n\n';

                  syncSubscribers = syncSubscribers.filter(sub => {
                    try {
                      sub.write(sseMsg);
                      if (typeof (sub as any).flush === 'function') (sub as any).flush();
                      return true;
                    } catch {
                      return false;
                    }
                  });

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, seq: data.seq }));
                } catch {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'invalid json' }));
                }
              });
              return;
            }

            if (req.method === 'GET') {
              const url = new URL(req.url || '', 'http://localhost');
              const isEventStream =
                (req.headers.accept && req.headers.accept.includes('text/event-stream')) ||
                url.searchParams.get('stream') === 'true';

              if (isEventStream) {
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*',
                });
                if (typeof res.flushHeaders === 'function') res.flushHeaders();
                res.write(': keepalive\n\n');

                // Send current shared state immediately upon SSE connection
                res.write(`data: ${JSON.stringify({ type: 'SHARED_STATE_INIT', payload: sharedState, seq: globalSeq })}\n\n`);

                syncSubscribers.push(res);
                const pingTimer = setInterval(() => {
                  try {
                    res.write(': ping\n\n');
                    if (typeof (res as any).flush === 'function') (res as any).flush();
                  } catch {
                    clearInterval(pingTimer);
                  }
                }, 10000);

                req.on('close', () => {
                  clearInterval(pingTimer);
                  syncSubscribers = syncSubscribers.filter(s => s !== res);
                });
                return;
              }

              // HTTP GET polling fallback: /__lovera_sync?since_seq=<seq> or ?since=<timestamp>
              const sinceSeq = parseInt(url.searchParams.get('since_seq') || '0', 10);
              const sinceTime = parseFloat(url.searchParams.get('since') || '0');
              const newMsgs = recentMessages.filter(m => {
                if (sinceSeq > 0) return (m.seq || 0) > sinceSeq;
                return (m.timestamp || 0) > sinceTime;
              });
              const isInit = sinceSeq === 0 || url.searchParams.get('init') === 'true';
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                messages: newMsgs,
                maxSeq: globalSeq,
                ...(isInit ? { sharedState } : {})
              }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_TARGET || process.env.VITE_BACKEND_TARGET || 'https://january-caught-photographers-zealand.trycloudflare.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
