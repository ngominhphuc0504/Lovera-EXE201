import avatarAlex from '../assets/images/partner_avatar_alex_1790144456462.jpg';
import avatarSam from '../assets/images/partner_avatar_sam_1790144470464.jpg';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

const STORAGE_KEY = 'lovera_known_users';
const AVATAR_MAP_KEY = 'lovera_user_avatars';

// Pre-seeded known users from backend database
const DEFAULT_DIRECTORY: Record<string, UserDirectoryItem> = {
  '2cf726f2-6f85-4cfc-956a-9aaf8d62cfd7': {
    id: '2cf726f2-6f85-4cfc-956a-9aaf8d62cfd7',
    name: 'phuc',
    email: 'bapbo2k@gmail.com',
  },
  'a700181a-e732-4042-b085-7794b698312e': {
    id: 'a700181a-e732-4042-b085-7794b698312e',
    name: 'quan',
    email: 'ngominhphuc0504@gmail.com',
  },
};

export function isValidDisplayAvatar(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/api/') || trimmed.includes('/profile/me/avatar') || trimmed === 'avatar') return false;
  return (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('./')
  );
}

export function isGuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str.trim());
}

export function isMockAvatar(url?: string | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  return (
    trimmed === avatarSam ||
    trimmed === avatarAlex ||
    trimmed.includes('partner_avatar_sam') ||
    trimmed.includes('partner_avatar_alex') ||
    trimmed.includes('unsplash.com') ||
    trimmed.startsWith('/api/') ||
    trimmed === 'avatar'
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Auto-clean any legacy corrupted /api/ or dead blob: or mock avatar keys from storage on startup
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const rawMap = localStorage.getItem(AVATAR_MAP_KEY);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      let changed = false;
      for (const k of Object.keys(map)) {
        if (!map[k] || !isValidDisplayAvatar(map[k]) || isMockAvatar(map[k]) || map[k].startsWith('blob:')) {
          delete map[k];
          changed = true;
        }
      }
      if (changed) localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));
    }

    const rawDir = localStorage.getItem(STORAGE_KEY);
    if (rawDir) {
      const dir = JSON.parse(rawDir);
      let changed = false;
      for (const k of Object.keys(dir)) {
        if (dir[k]?.avatar && (!isValidDisplayAvatar(dir[k].avatar) || isMockAvatar(dir[k].avatar) || dir[k].avatar.startsWith('blob:'))) {
          dir[k].avatar = '';
          changed = true;
        }
        if (dir[k]?.name && (isGuid(dir[k].name) || dir[k].name === 'Người Thương')) {
          delete dir[k];
          changed = true;
        }
      }
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(dir));
    }
  } catch {}
}

export function saveUserAvatar(identifier: string, avatarUrl: string): void {
  if (!identifier || !avatarUrl || !isValidDisplayAvatar(avatarUrl) || isMockAvatar(avatarUrl)) return;
  const key = identifier.toLowerCase().trim();
  try {
    const raw = localStorage.getItem(AVATAR_MAP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[key] = avatarUrl;
    // Keep map compact (max 8 keys) to protect storage quota
    const keys = Object.keys(map);
    if (keys.length > 8) {
      delete map[keys[0]];
    }
    try {
      localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));
    } catch {
      const pruned: Record<string, string> = { [key]: avatarUrl };
      try { localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(pruned)); } catch {}
    }
  } catch {}
}

export function getUserAvatar(identifier?: string): string | undefined {
  if (!identifier) return undefined;
  const key = identifier.toLowerCase().trim();
  try {
    const raw = localStorage.getItem(AVATAR_MAP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (map[key] && isValidDisplayAvatar(map[key]) && !isMockAvatar(map[key]) && !map[key].startsWith('blob:')) return map[key];
  } catch {}

  // Fallback check known users directory
  try {
    const dir = getKnownUsers();
    if (dir[key]?.avatar && isValidDisplayAvatar(dir[key].avatar) && !isMockAvatar(dir[key].avatar) && !dir[key].avatar.startsWith('blob:')) return dir[key].avatar;
    for (const u of Object.values(dir)) {
      if (
        u.id.toLowerCase() === key ||
        u.name.toLowerCase().trim() === key ||
        (u.email && u.email.toLowerCase().trim() === key)
      ) {
        if (u.avatar && isValidDisplayAvatar(u.avatar) && !isMockAvatar(u.avatar) && !u.avatar.startsWith('blob:')) return u.avatar;
      }
    }
  } catch {}

  return undefined;
}

export function getKnownUsers(): Record<string, UserDirectoryItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_DIRECTORY, ...stored };
  } catch {
    return { ...DEFAULT_DIRECTORY };
  }
}

export function saveKnownUser(user: Partial<UserDirectoryItem> & { id: string; name: string }): void {
  if (!user.id || !user.name || user.name === 'Người Thương' || isGuid(user.name)) return;
  try {
    const current = getKnownUsers();
    const idKey = user.id.toLowerCase();
    const cleanUserAvatar = isValidDisplayAvatar(user.avatar) ? user.avatar : undefined;
    const existingAvatar = isValidDisplayAvatar(current[idKey]?.avatar) ? current[idKey]?.avatar : undefined;
    const finalAvatar = cleanUserAvatar || existingAvatar || getUserAvatar(user.id) || getUserAvatar(user.name);

    current[idKey] = {
      id: user.id,
      name: user.name,
      email: user.email || current[idKey]?.email || '',
      avatar: finalAvatar || '',
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // If storage is constrained in incognito, strip large avatar before saving
      current[idKey].avatar = '';
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
    }

    if (finalAvatar && isValidDisplayAvatar(finalAvatar)) {
      saveUserAvatar(user.id, finalAvatar);
      saveUserAvatar(user.name, finalAvatar);
      if (user.email) saveUserAvatar(user.email, finalAvatar);
    }
  } catch {}
}

export function findKnownUserById(userId?: string): UserDirectoryItem | null {
  if (!userId) return null;
  const dir = getKnownUsers();
  const found = dir[userId.toLowerCase()];
  if (!found) return null;
  if (isGuid(found.name)) return { ...found, name: '' };
  return found;
}

export function findKnownUserByName(name?: string): UserDirectoryItem | null {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  const dir = getKnownUsers();
  for (const item of Object.values(dir)) {
    if (item.name.toLowerCase().trim() === clean) return item;
  }
  return null;
}
