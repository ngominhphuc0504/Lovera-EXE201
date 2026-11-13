import { 
  MemoryItem, 
  CoupleData, 
  AdminUserAccount, 
  AdminActivityLog, 
  AdminSystemMetric, 
  DatePlan, 
  PointHistoryItem 
} from '../types';

export const STORAGE_KEYS = {
  MEMORIES: 'lovera_memories',
  COUPLE: 'lovera_couple',
  ADMIN_USERS: 'lovera_admin_users',
  ADMIN_LOGS: 'lovera_admin_logs',
  ADMIN_METRICS: 'lovera_admin_metrics',
  DATE_PLANS: 'lovera_date_plans',
  POINT_HISTORY: 'lovera_point_history',
  GARDEN_METRICS: 'lovera_garden_metrics',
} as const;

export type SyncMessageType = 
  | 'SYNC_MEMORIES'
  | 'SYNC_MEMORY_LIKES'
  | 'SYNC_COUPLE'
  | 'SYNC_ADMIN_USERS'
  | 'SYNC_ADMIN_LOGS'
  | 'SYNC_ADMIN_METRICS'
  | 'SYNC_DATE_PLANS'
  | 'SYNC_POINT_HISTORY'
  | 'SYNC_GARDEN_METRICS'
  | 'SYNC_MEMORY_NOTIFICATION'
  | 'SYNC_AVATAR'
  | 'SYNC_NICKNAMES'
  | 'SHARED_STATE_INIT'
  | 'REQUEST_SYNC'
  | 'SYNC_ALL';

export interface SyncMessage<T = any> {
  type: SyncMessageType;
  payload: T;
  timestamp: number;
  senderId: string;
}

// Generate unique ID per browser tab to avoid echo loops
export function cleanupOversizedStorage(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalChars += val.length;
        if (val.startsWith('/api/') || (val.length > 2 * 1024 * 1024 && !key.startsWith('lovera_'))) {
          keysToRemove.push(key);
        }
      }
    }
    // If total storage is approaching 3.5MB (5MB browser limit), purge heavy non-essential caches
    if (totalChars > 3.5 * 1024 * 1024) {
      keysToRemove.push('lovera_admin_logs', 'lovera_admin_users', 'lovera_point_history', 'lovera_date_plans', 'lovera_chat_history');
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch {}
}

cleanupOversizedStorage();

export const TAB_ID = 'tab_' + Math.random().toString(36).slice(2, 9);

/**
 * Safely loads data from localStorage with JSON parsing and fallback.
 */
export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely saves a single string value to localStorage without throwing QuotaExceededError.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      localStorage.removeItem('lovera_admin_logs');
      localStorage.removeItem('lovera_admin_users');
      localStorage.removeItem('lovera_point_history');
      localStorage.removeItem('lovera_date_plans');
      localStorage.removeItem('lovera_chat_history');
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

const warnedKeys = new Set<string>();

/**
 * Safely saves data to localStorage.
 * Automatically keeps lovera_couple lightweight by avoiding duplicated massive base64 strings in the couple JSON,
 * preventing QuotaExceededError in strict Incognito browser windows.
 */
export function saveStoredData<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    let payload = value;
    if (typeof value === 'object' && value !== null) {
      if (key === STORAGE_KEYS.COUPLE) {
        const c = { ...value } as any;
        if (c.userA?.avatar?.length > 10000) c.userA = { ...c.userA, avatar: '' };
        if (c.userB?.avatar?.length > 10000) c.userB = { ...c.userB, avatar: '' };
        payload = c as T;
      } else if (key === 'lovera_admin_users' && Array.isArray(value)) {
        payload = (value as any[]).map(u => ({
          ...u,
          avatar: u.avatar && u.avatar.length > 500 ? '' : u.avatar,
        })) as T;
      }
    }
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    try {
      localStorage.removeItem('lovera_admin_logs');
      localStorage.removeItem('lovera_admin_users');
      localStorage.removeItem('lovera_point_history');
      localStorage.removeItem('lovera_date_plans');
      localStorage.removeItem('lovera_chat_history');
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        setTimeout(() => warnedKeys.delete(key), 60000);
      }
      return false;
    }
  }
}

// Global broadcast channel for instant inter-tab communication
let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('lovera_cross_tab_sync');
  }
} catch (err) {
  console.warn('[SyncManager] BroadcastChannel not supported:', err);
}

/**
 * Broadcasts an update to all open tabs/windows of the Lovera web app.
 */
export function broadcastMessage(type: SyncMessageType, payload: any): void {
  const message: SyncMessage = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: TAB_ID,
  };

  // 1. Send via BroadcastChannel (instant zero-delay cross-tab)
  try {
    channel?.postMessage(message);
  } catch (err) {
    console.warn('[SyncManager] Error posting to BroadcastChannel:', err);
  }

  // 2. Local in-tab dispatch
  try {
    window.dispatchEvent(new CustomEvent('lovera_local_sync', { detail: message }));
  } catch (err) {
    // ignore
  }

  // 3. Instant cross-browser dev bridge dispatch (POST /__lovera_sync)
  if (typeof window !== 'undefined') {
    try {
      fetch('/__lovera_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Subscribes to cross-tab sync events (both BroadcastChannel and window storage events).
 */
export function subscribeToSync(onMessage: (msg: SyncMessage) => void): () => void {
  const seenSeq = new Set<string>();

  const deliver = (msg: SyncMessage) => {
    if (!msg || msg.senderId === TAB_ID) return;
    const msgId = (msg as any)._seq ? String((msg as any)._seq) : `${msg.type}_${msg.timestamp}_${JSON.stringify(msg.payload || {}).slice(0, 40)}`;
    if (seenSeq.has(msgId)) return;
    seenSeq.add(msgId);
    if (seenSeq.size > 200) {
      const first = seenSeq.values().next().value;
      if (first) seenSeq.delete(first);
    }
    onMessage(msg);
  };

  const handleBcMessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data) {
      deliver(event.data);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue);
      if (event.key === STORAGE_KEYS.MEMORIES) {
        deliver({ type: 'SYNC_MEMORIES', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.COUPLE) {
        deliver({ type: 'SYNC_COUPLE', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_USERS) {
        deliver({ type: 'SYNC_ADMIN_USERS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_LOGS) {
        deliver({ type: 'SYNC_ADMIN_LOGS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_METRICS) {
        deliver({ type: 'SYNC_ADMIN_METRICS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.DATE_PLANS) {
        deliver({ type: 'SYNC_DATE_PLANS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.POINT_HISTORY) {
        deliver({ type: 'SYNC_POINT_HISTORY', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.GARDEN_METRICS) {
        deliver({ type: 'SYNC_GARDEN_METRICS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      }
    } catch (err) {
      // ignore
    }
  };

  channel?.addEventListener('message', handleBcMessage);
  window.addEventListener('storage', handleStorageEvent);

  // 3. Connect to Vite Dev Server SSE stream (/__lovera_sync?stream=true) for instant (<50ms) cross-browser sync
  let sse: EventSource | null = null;
  let lastSeq = 0;
  let lastPollTimestamp = Date.now() - 5000;

  try {
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      sse = new EventSource('/__lovera_sync?stream=true');
      sse.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.seq && msg.seq > lastSeq) lastSeq = msg.seq;
          deliver(msg);
        } catch {}
      };
    }
  } catch {}

  // 4. Balanced background sync polling (2500ms) + focus/visibility/click wakeup
  // Ensures normal <-> incognito tabs sync smoothly without freezing network or consuming GBs of bandwidth
  const pollNow = () => {
    if (typeof window === 'undefined') return;
    if (typeof document !== 'undefined' && document.hidden) return;
    fetch(`/__lovera_sync?since_seq=${lastSeq}&since=${lastPollTimestamp}`)
      .then(res => res.json())
      .then(data => {
        if (typeof data?.maxSeq === 'number' && data.maxSeq > lastSeq) {
          lastSeq = data.maxSeq;
        }
        if (data?.sharedState) {
          deliver({
            type: 'SHARED_STATE_INIT',
            payload: data.sharedState,
            timestamp: Date.now(),
            senderId: 'dev_server_state',
          });
        }
        if (data?.messages && Array.isArray(data.messages)) {
          data.messages.forEach((m: any) => {
            if (m.seq && m.seq > lastSeq) lastSeq = m.seq;
            if (m.timestamp && m.timestamp > lastPollTimestamp) {
              lastPollTimestamp = m.timestamp;
            }
            deliver(m);
          });
        }
      })
      .catch(() => {});
  };

  const pollTimer = setInterval(pollNow, 2500);

  const handleWakeup = () => {
    pollNow();
  };

  window.addEventListener('focus', handleWakeup);
  window.addEventListener('pointerdown', handleWakeup);
  document.addEventListener('visibilitychange', handleWakeup);

  return () => {
    channel?.removeEventListener('message', handleBcMessage);
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleWakeup);
    window.removeEventListener('pointerdown', handleWakeup);
    document.removeEventListener('visibilitychange', handleWakeup);
    clearInterval(pollTimer);
    if (sse) {
      try { sse.close(); } catch {}
    }
  };
}

/**
 * Compresses an image file (from <input type="file">) into an optimized DataURL JPEG.
 * Automatically scales down large camera photos (e.g. 4000x3000 down to 1080px width)
 * and outputs a ~80-180KB JPEG instead of 5MB+, preventing localStorage quota limits
 * while maintaining crystal clear visual display on Retina and desktop screens.
 */
export function compressImageFile(file: File, maxWidth = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 DataURL to a native File object for multipart/form-data upload.
 */
export function dataUrlToFile(dataUrl: string, filename = 'avatar.jpg'): File {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return new File([], filename, { type: 'image/jpeg' });
  }
}

