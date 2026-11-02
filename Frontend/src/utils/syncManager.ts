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
} as const;

export type SyncMessageType = 
  | 'SYNC_MEMORIES'
  | 'SYNC_COUPLE'
  | 'SYNC_ADMIN_USERS'
  | 'SYNC_ADMIN_LOGS'
  | 'SYNC_ADMIN_METRICS'
  | 'SYNC_DATE_PLANS'
  | 'SYNC_POINT_HISTORY'
  | 'REQUEST_SYNC'
  | 'SYNC_ALL';

export interface SyncMessage<T = any> {
  type: SyncMessageType;
  payload: T;
  timestamp: number;
  senderId: string;
}

// Generate unique ID per browser tab to avoid echo loops
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
  } catch (err) {
    console.warn(`[SyncManager] Failed to load key "${key}" from localStorage:`, err);
    return fallback;
  }
}

/**
 * Safely saves data to localStorage.
 */
export function saveStoredData<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[SyncManager] Failed to save key "${key}" to localStorage:`, err);
    return false;
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
}

/**
 * Subscribes to cross-tab sync events (both BroadcastChannel and window storage events).
 */
export function subscribeToSync(onMessage: (msg: SyncMessage) => void): () => void {
  const handleBcMessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data && event.data.senderId !== TAB_ID) {
      onMessage(event.data);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue);
      if (event.key === STORAGE_KEYS.MEMORIES) {
        onMessage({ type: 'SYNC_MEMORIES', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.COUPLE) {
        onMessage({ type: 'SYNC_COUPLE', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_USERS) {
        onMessage({ type: 'SYNC_ADMIN_USERS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_LOGS) {
        onMessage({ type: 'SYNC_ADMIN_LOGS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.ADMIN_METRICS) {
        onMessage({ type: 'SYNC_ADMIN_METRICS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.DATE_PLANS) {
        onMessage({ type: 'SYNC_DATE_PLANS', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      } else if (event.key === STORAGE_KEYS.POINT_HISTORY) {
        onMessage({ type: 'SYNC_POINT_HISTORY', payload: parsed, timestamp: Date.now(), senderId: 'storage_event' });
      }
    } catch (err) {
      // ignore
    }
  };

  channel?.addEventListener('message', handleBcMessage);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    channel?.removeEventListener('message', handleBcMessage);
    window.removeEventListener('storage', handleStorageEvent);
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
