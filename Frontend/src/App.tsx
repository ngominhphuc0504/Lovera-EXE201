import React, { useState } from 'react';
import { Screen, CoupleData, DatePlan, DateType, ConnectionActivityType, ConnectionStatusType, MemoryItem, MemoryTag, PointHistoryItem, GardenEcoMetrics } from './types';
import { 
  INITIAL_COUPLE, 
  INITIAL_DATE_PLANS, 
  INITIAL_POINT_HISTORY, 
  INITIAL_NOTIFICATIONS,
  INITIAL_MEMORIES 
} from './data/mockData';
import { playSound } from './utils/audio';
import { GARDEN_CONFIG } from './constants/gardenConfig';
import { calculateDecayedMetrics, getCooldownRemaining, isTreeReadyToEvolve } from './utils/gardenDecay';

import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';

import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { PairingScreen, PairingStage } from './components/screens/PairingScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { SharedSpaceScreen } from './components/screens/SharedSpaceScreen';
import { ChatbotScreen } from './components/screens/ChatbotScreen';
import { GardenScreen } from './components/screens/GardenScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

import { StatusModal } from './components/modals/StatusModal';
import { LoveDayModal } from './components/modals/LoveDayModal';
import { NotificationsModal } from './components/modals/NotificationsModal';

import { AdminPortal } from './components/admin/AdminPortal';
import { 
  INITIAL_ADMIN_METRICS, 
  INITIAL_ADMIN_USERS, 
  INITIAL_ADMIN_LOGS 
} from './data/mockAdminData';
import { AdminUserAccount, AdminSystemMetric, AdminActivityLog } from './types';
import { Heart, Smartphone, Monitor, Shield } from 'lucide-react';
import { STORAGE_KEYS, loadStoredData, saveStoredData, safeSetItem, broadcastMessage, subscribeToSync, cleanupOversizedStorage } from './utils/syncManager';
import { getStoredToken, getStoredUserProfile, clearStoredToken, getSessionKey, isRouteRateLimited } from './services/apiClient';
import { saveKnownUser, findKnownUserById, saveUserAvatar, getUserAvatar, findKnownUserByName, isValidDisplayAvatar, blobToDataUrl, isMockAvatar, isGuid } from './utils/userDirectory';
import { authService, ProfileResponse } from './services/authService';
import { coupleService } from './services/coupleService';
import { getMemoryImageUrl, memoryService } from './services/memoryService';
import { gardenService } from './services/gardenService';

const cleanName = (n?: string | null): string | null => {
  if (!n) return null;
  const t = n.trim();
  if (!t || t === 'Người Thương' || t === 'Chưa kết nối' || isGuid(t)) return null;
  return t;
};

function purgeCorruptedStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const rawPartnerNick = localStorage.getItem('lovera_partner_nickname');
    if (isGuid(rawPartnerNick) || rawPartnerNick === 'Người Thương') {
      localStorage.removeItem('lovera_partner_nickname');
    }

    const rawMyNick = localStorage.getItem('lovera_my_nickname');
    if (isGuid(rawMyNick) || rawMyNick === 'Người Thương') {
      localStorage.removeItem('lovera_my_nickname');
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('lovera_partner_name_')) {
        const v = localStorage.getItem(k);
        if (isGuid(v) || v === 'Người Thương') localStorage.removeItem(k);
      }
    }

    const rawCouple = localStorage.getItem('lovera_couple');
    if (rawCouple) {
      const c = JSON.parse(rawCouple);
      let changed = false;
      const cleanSavedMy = (!isGuid(localStorage.getItem('lovera_my_nickname')) && localStorage.getItem('lovera_my_nickname') !== 'Người Thương') ? localStorage.getItem('lovera_my_nickname') : null;
      const cleanSavedPartner = (!isGuid(localStorage.getItem('lovera_partner_nickname')) && localStorage.getItem('lovera_partner_nickname') !== 'Người Thương') ? localStorage.getItem('lovera_partner_nickname') : null;

      if (isGuid(c.userA?.name)) {
        c.userA.name = cleanSavedMy || 'Tôi';
        changed = true;
      }
      if (isGuid(c.userB?.name)) {
        c.userB.name = cleanSavedPartner || 'Người Thương';
        changed = true;
      }
      if (changed) {
        safeSetItem('lovera_couple', JSON.stringify(c));
      }
    }
  } catch {}
}
purgeCorruptedStorage();

export default function App() {
  // Main Screen Navigation State (Dedicated link for admin: /admin or ?mode=admin)
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path.endsWith('/admin') || path === '/admin' || params.get('mode') === 'admin' || params.get('admin') === 'true') {
        return 'admin';
      }
    } catch {}

    if (getStoredToken()) {
      const stored = loadStoredData(STORAGE_KEYS.COUPLE, INITIAL_COUPLE);
      return stored?.isPaired ? 'home' : 'pairing';
    }
    return 'welcome';
  });
  const [isDemoMode, setIsDemoMode] = useState(() => !getStoredToken());
  const [pairingInitialStage, setPairingInitialStage] = useState<PairingStage>('idle');
  const [pairingBannerMessage, setPairingBannerMessage] = useState<string>('');

  // Couple & Domain State with persistent storage across tabs & reloads
  const [couple, setCouple] = useState<CoupleData>(() => {
    const stored = loadStoredData(STORAGE_KEYS.COUPLE, INITIAL_COUPLE);
    const savedDate = localStorage.getItem('lovera_anniversary_date');
    const savedPoints = localStorage.getItem('lovera_love_points');

    const sanitizeDate = (d?: string | null) => {
      if (!d || d === '2025-09-22') return '2025-09-07';
      return d;
    };

    const resolvedStartDate = sanitizeDate(savedDate || stored.startDate);
    localStorage.setItem('lovera_anniversary_date', resolvedStartDate);

    let resolvedPoints = stored.lovePoints ?? 0;
    if (savedPoints !== null) {
      resolvedPoints = Math.max(resolvedPoints, parseInt(savedPoints, 10) || 0);
    }
    // Restore user past 85 pts to Cấp 2 threshold (100 Pts) - Points never decrease
    resolvedPoints = Math.max(resolvedPoints, 100);
    localStorage.setItem('lovera_love_points', String(resolvedPoints));

    // Custom Nicknames & Avatars from local persistence
    const cleanNick = (n?: string | null) => {
      if (!n) return undefined;
      const t = n.trim();
      return (t && t !== 'Người Thương' && t !== 'Chưa kết nối' && !isGuid(t)) ? t : undefined;
    };

    const savedMyNickname = cleanNick(localStorage.getItem('lovera_my_nickname'));
    const savedPartnerNickname = cleanNick(localStorage.getItem('lovera_partner_nickname'));
    const savedMyAvatar = localStorage.getItem('lovera_my_avatar') || localStorage.getItem('lovera_alex_avatar');
    const savedPartnerAvatar = localStorage.getItem('lovera_partner_avatar');

    const myRealAvatar = (savedMyAvatar && isValidDisplayAvatar(savedMyAvatar) && !isMockAvatar(savedMyAvatar))
      ? savedMyAvatar
      : (getUserAvatar(stored.userA.id) || getUserAvatar('me') || stored.userA.avatar);

    const partnerRealAvatar = (savedPartnerAvatar && isValidDisplayAvatar(savedPartnerAvatar) && !isMockAvatar(savedPartnerAvatar))
      ? savedPartnerAvatar
      : (getUserAvatar(stored.userB.id) || getUserAvatar('partner') || (isValidDisplayAvatar(stored.userB.avatar) && !isMockAvatar(stored.userB.avatar) ? stored.userB.avatar : INITIAL_COUPLE.userB.avatar));

    const next: CoupleData = {
      ...stored,
      startDate: resolvedStartDate,
      lovePoints: resolvedPoints,
      userA: {
        ...stored.userA,
        name: savedMyNickname || (cleanNick(stored.userA.name) || 'Người Thương'),
        avatar: myRealAvatar,
      },
      userB: {
        ...stored.userB,
        name: savedPartnerNickname || (cleanNick(stored.userB.name) || 'Người Thương'),
        avatar: partnerRealAvatar,
      }
    };
    saveStoredData(STORAGE_KEYS.COUPLE, next);
    return next;
  });
  const [datePlans, setDatePlans] = useState<DatePlan[]>(() =>
    loadStoredData(STORAGE_KEYS.DATE_PLANS, INITIAL_DATE_PLANS)
  );
  const [activePlan, setActivePlan] = useState<DatePlan | null>(INITIAL_DATE_PLANS[0]);
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>(() =>
    loadStoredData(STORAGE_KEYS.POINT_HISTORY, INITIAL_POINT_HISTORY)
  );
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [memories, setMemories] = useState<MemoryItem[]>(() =>
    loadStoredData(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES)
  );
  const [backendMemories, setBackendMemories] = useState<MemoryItem[]>([]);
  const [isLoadingBackendMemories, setIsLoadingBackendMemories] = useState(false);
  const [backendMemoriesError, setBackendMemoriesError] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUserAccount[]>(() =>
    loadStoredData(STORAGE_KEYS.ADMIN_USERS, INITIAL_ADMIN_USERS)
  );
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>(() =>
    loadStoredData(STORAGE_KEYS.ADMIN_LOGS, INITIAL_ADMIN_LOGS)
  );
  const [adminMetrics, setAdminMetrics] = useState<AdminSystemMetric>(() =>
    loadStoredData(STORAGE_KEYS.ADMIN_METRICS, INITIAL_ADMIN_METRICS)
  );

  const INITIAL_GARDEN_METRICS: GardenEcoMetrics = {
    moisture: GARDEN_CONFIG.INITIAL_STATS.MOISTURE,
    freshness: GARDEN_CONFIG.INITIAL_STATS.FRESHNESS,
    sunlight: GARDEN_CONFIG.INITIAL_STATS.SUNLIGHT,
    lastUpdateUtc: new Date().toISOString(),
    lastWaterUtc: null,
    lastFertilizeUtc: null,
    lastSunUtc: null,
    completedCycles: 0,
  };

  const [gardenMetrics, setGardenMetrics] = useState<GardenEcoMetrics>(() => {
    const loaded = loadStoredData<GardenEcoMetrics>(STORAGE_KEYS.GARDEN_METRICS, INITIAL_GARDEN_METRICS);
    const decayed = calculateDecayedMetrics(loaded);
    saveStoredData(STORAGE_KEYS.GARDEN_METRICS, decayed);
    return decayed;
  });
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');
  const lastSyncedPartnerAvatarMemId = React.useRef<string>('');
  const lastSyncedMyAvatarMemId = React.useRef<string>('');

  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const isCurrentSession = (session: string) => mountedRef.current && session === getSessionKey();
  const timelineFlight = React.useRef<{ key: string; promise: Promise<boolean>; revalidate: boolean; revision: number } | null>(null);
  const timelineRevision = React.useRef(0);
  const timelineLoaded = React.useRef({ key: '', at: 0 });
  const coupleFlight = React.useRef<{ key: string; promise: Promise<boolean | undefined> } | null>(null);
  const MEMORY_LIKES_KEY = 'lovera_memory_likes';

  const getMemoryLikesMap = (): Record<string, { likes: number; isLiked: boolean }> => {
    try {
      const raw = localStorage.getItem(MEMORY_LIKES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveMemoryLikesMap = (map: Record<string, { likes: number; isLiked: boolean }>) => {
    try {
      localStorage.setItem(MEMORY_LIKES_KEY, JSON.stringify(map));
    } catch {}
  };

  const mapBackendMemory = (
    item: Awaited<ReturnType<typeof memoryService.getTimeline>>[number],
    remoteLikesMap?: Record<string, { likerUserIds: Set<string>; myLikeItemIds: string[] }>,
  ): MemoryItem => {
    const creatorId = (item.creatorUserId || item.userId || '').toLowerCase();
    const storedProfile = getStoredUserProfile<{ id: string; displayName?: string }>();
    const myId = (storedProfile?.id || couple.userA.id || '').toLowerCase();
    const isMine = Boolean(myId && creatorId && myId === creatorId);

    const authorName = isMine
      ? (couple.userA.name || storedProfile?.displayName || 'Tôi')
      : (couple.userB.name && couple.userB.name !== 'Chưa kết nối' && couple.userB.name !== 'Người Thương'
          ? couple.userB.name
          : (findKnownUserById(creatorId)?.name || localStorage.getItem(`lovera_partner_name_${creatorId}`) || localStorage.getItem('lovera_partner_nickname') || 'Người Thương'));

    const authorAvatar = isMine ? couple.userA.avatar : (couple.userB.avatar || INITIAL_COUPLE.userB.avatar);
    const createdAt = new Date(item.createdAtUtc);
    const validDate = !Number.isNaN(createdAt.getTime());

    const remoteLikeInfo = remoteLikesMap?.[item.id];
    const likesMap = getMemoryLikesMap();
    const savedLike = likesMap[item.id];

    const likes = remoteLikeInfo ? remoteLikeInfo.likerUserIds.size : (savedLike?.likes ?? 0);
    const isLiked = remoteLikeInfo ? (remoteLikeInfo.myLikeItemIds.length > 0) : (savedLike?.isLiked ?? false);

    return {
      id: item.id,
      imageUrl: item.hasImage ? getMemoryImageUrl(item.id) : '',
      caption: item.text || 'Một khoảnh khắc đáng nhớ của hai đứa.',
      date: validDate ? createdAt.toISOString().slice(0, 10) : '',
      location: undefined,
      tag: 'Kỷ niệm' as MemoryTag,
      authorName,
      authorAvatar,
      creatorUserId: creatorId,
      isMyMemory: isMine,
      likes,
      isLiked,
      createdAt: validDate ? createdAt.toLocaleString('vi-VN') : item.createdAtUtc,
    };
  };

  const refreshBackendMemories = (isBackground = false, force = true): Promise<boolean> => {
    const key = `${getSessionKey()}:${couple.coupleId || ''}`;
    if (!getStoredToken() || isDemoMode || !mountedRef.current) return Promise.resolve(false);
    if (timelineFlight.current?.key === key) {
      timelineFlight.current.revalidate ||= force && timelineFlight.current.revision !== timelineRevision.current;
      return timelineFlight.current.promise;
    }
    if (!force && timelineLoaded.current.key === key && Date.now() - timelineLoaded.current.at < 30000) return Promise.resolve(true);
    const promise = loadBackendMemories(isBackground).then(ok => {
      if (ok && key === `${getSessionKey()}:${latestSync.current.coupleId || ''}`) timelineLoaded.current = { key, at: Date.now() };
      return ok;
    }).finally(() => {
      if (timelineFlight.current?.promise === promise) {
        const revalidate = timelineFlight.current.revalidate;
        timelineFlight.current = null;
        if (revalidate && mountedRef.current && key === `${getSessionKey()}:${latestSync.current.coupleId || ''}`) {
          return latestSync.current.refreshBackendMemories(true);
        }
      }
    });
    timelineFlight.current = { key, promise, revalidate: false, revision: timelineRevision.current };
    return promise;
  };

  const loadBackendMemories = async (isBackground = false): Promise<boolean> => {
    const session = getSessionKey();
    const coupleId = couple.coupleId;
    const revision = timelineRevision.current;
    const active = () => isCurrentSession(session) && latestSync.current.coupleId === coupleId && timelineRevision.current === revision;
    if (!isBackground && backendMemories.length === 0) {
      setIsLoadingBackendMemories(true);
    }
    setBackendMemoriesError('');
    try {
      const items = await memoryService.getTimeline();
      if (!active()) return false;
      
      const storedProfile = getStoredUserProfile<{ id: string; displayName?: string; email?: string }>();
      const myId = (storedProfile?.id || couple.userA.id || '').toLowerCase();
      let partnerId = (couple.userB.id || '').toLowerCase();
      if (partnerId === 'usr_sam' || partnerId === 'usr_partner') partnerId = '';

      // 1. Cross-device like aggregator: calculate likes from [LIKE]:<memoryId> on backend
      const remoteLikesMap: Record<string, { likerUserIds: Set<string>; myLikeItemIds: string[] }> = {};
      for (const m of items) {
        if (m.text && m.text.startsWith('[LIKE]:')) {
          const targetId = m.text.replace('[LIKE]:', '').trim();
          if (!targetId) continue;
          const creator = (m.creatorUserId || m.userId || '').toLowerCase();
          const isByMe = Boolean(myId && creator && creator === myId);

          if (!remoteLikesMap[targetId]) {
            remoteLikesMap[targetId] = { likerUserIds: new Set<string>(), myLikeItemIds: [] };
          }
          if (creator) {
            remoteLikesMap[targetId].likerUserIds.add(creator);
          } else {
            remoteLikesMap[targetId].likerUserIds.add(m.id);
          }
          if (isByMe) {
            remoteLikesMap[targetId].myLikeItemIds.push(m.id);
          }
        }
      }

      // Sync likes into localStorage map
      const likesMap = getMemoryLikesMap();
      for (const targetId of Object.keys(remoteLikesMap)) {
        const info = remoteLikesMap[targetId];
        likesMap[targetId] = {
          likes: info.likerUserIds.size,
          isLiked: info.myLikeItemIds.length > 0,
        };
      }
      saveMemoryLikesMap(likesMap);

      // Filter out internal sync memories so they don't appear in user date memories preview
      const isInternalSyncMemory = (text?: string | null) => {
        if (!text) return false;
        const t = text.trim();
        return (
          t === '[AVATAR]' ||
          t === '[AVATAR_PROFILE]' ||
          t.startsWith('[AVATAR:') ||
          t.startsWith('[PROFILE_NAME]:') ||
          t.startsWith('[SYNC_NAME]:') ||
          t.startsWith('[PROFILE]:') ||
          t.startsWith('[LIKE]:') ||
          t.startsWith('[START_DATE]:') ||
          t.startsWith('[ANNIVERSARY_DATE]:') ||
          t.startsWith('[GARDEN_POINTS]:') ||
          t.startsWith('[LOVE_POINTS]:') ||
          t.startsWith('[NICKNAME_PAIR]:') ||
          t.startsWith('[PARTNER_NAME]:') ||
          t.startsWith('[GARDEN_METRICS]:')
        );
      };

      const dateMemories = items.filter(m => !isInternalSyncMemory(m.text));
      
      setBackendMemories(prev => {
        if (!active()) return prev;
        const nextList = dateMemories.map(item => mapBackendMemory(item, remoteLikesMap));
        if (prev.length === nextList.length) {
          const isIdentical = prev.every((m, idx) => {
            const next = nextList[idx];
            return (
              m.id === next.id &&
              m.caption === next.caption &&
              m.authorName === next.authorName &&
              m.authorAvatar === next.authorAvatar &&
              m.isLiked === next.isLiked &&
              m.likes === next.likes
            );
          });
          if (isIdentical) return prev;
        }
        return nextList;
      });

      // SMART BACKEND PROFILE & AVATAR LINKER:
      // Auto-link partner and my avatar and name directly from shared memories on server
      const isPartnerMemory = (m: Awaited<ReturnType<typeof memoryService.getTimeline>>[number]) => {
        const creator = (m.creatorUserId || m.userId || '').toLowerCase();
        if (partnerId && creator === partnerId) return true;
        if (myId && myId !== 'usr_alex' && creator && creator !== myId) return true;
        return false;
      };

      const isMyMemory = (m: Awaited<ReturnType<typeof memoryService.getTimeline>>[number]) => {
        const creator = (m.creatorUserId || m.userId || '').toLowerCase();
        return Boolean(myId && myId !== 'usr_alex' && creator === myId);
      };

      // 1. Detect if partner published nickname pair via memory tag
      const nicknamePairMem = items.find(m =>
        m.text && m.text.startsWith('[NICKNAME_PAIR]:')
      );
      if (nicknamePairMem?.text) {
        try {
          const raw = nicknamePairMem.text.replace('[NICKNAME_PAIR]:', '').trim();
          const parsed = JSON.parse(raw);
          const isFromPartner = Boolean(parsed.senderId && myId && parsed.senderId.toLowerCase() !== myId.toLowerCase());
          const isFromMe = Boolean(parsed.senderId && myId && parsed.senderId.toLowerCase() === myId.toLowerCase());

          const nextMy = isFromPartner ? (parsed.partnerName || '') : (isFromMe ? (parsed.senderName || '') : '');
          const nextPartner = isFromPartner ? (parsed.senderName || '') : (isFromMe ? (parsed.partnerName || '') : '');

          if (nextPartner && nextPartner !== 'Người Thương' && !isGuid(nextPartner)) {
            localStorage.setItem('lovera_partner_nickname', nextPartner);
            if (partnerId) {
              localStorage.setItem(`lovera_partner_name_${partnerId.toLowerCase()}`, nextPartner);
              saveKnownUser({ id: partnerId, name: nextPartner });
            }
          }
          if (nextMy && !isGuid(nextMy)) {
            localStorage.setItem('lovera_my_nickname', nextMy);
            if (myId) saveKnownUser({ id: myId, name: nextMy });
          }

          if ((nextMy && !isGuid(nextMy)) || (nextPartner && !isGuid(nextPartner))) {
            setCouple(prev => {
              if (!active()) return prev;
              const resolvedMy = (nextMy && !isGuid(nextMy)) ? nextMy : prev.userA.name;
              const resolvedPartner = (nextPartner && !isGuid(nextPartner)) ? nextPartner : prev.userB.name;
              if (prev.userA.name === resolvedMy && prev.userB.name === resolvedPartner) return prev;
              const next = {
                ...prev,
                userA: { ...prev.userA, name: resolvedMy },
                userB: { ...prev.userB, name: resolvedPartner },
              };
              saveStoredData(STORAGE_KEYS.COUPLE, next);
              return next;
            });
          }
        } catch (e) {}
      }

      const partnerNickMem = items.find(m => isPartnerMemory(m) && m.text && m.text.startsWith('[PARTNER_NAME]:'));
      if (partnerNickMem?.text) {
        const myAssignedNick = partnerNickMem.text.replace('[PARTNER_NAME]:', '').trim();
        if (myAssignedNick && !isGuid(myAssignedNick)) {
          localStorage.setItem('lovera_my_nickname', myAssignedNick);
          setCouple(prev => {
            if (!active() || prev.userA.name === myAssignedNick) return prev;
            const next = { ...prev, userA: { ...prev.userA, name: myAssignedNick } };
            saveStoredData(STORAGE_KEYS.COUPLE, next);
            return next;
          });
        }
      }

      // 1.1 Detect if partner published their profile name via memory tag
      const partnerNameMem = items.find(m =>
        isPartnerMemory(m) && m.text && (
          m.text.startsWith('[PROFILE_NAME]:') ||
          m.text.startsWith('[SYNC_NAME]:')
        )
      );

      let detectedPartnerName: string | undefined;
      if (partnerNameMem?.text) {
        detectedPartnerName = partnerNameMem.text.replace(/^\[(PROFILE_NAME|SYNC_NAME)\]:/, '').trim();
      }

      if (detectedPartnerName && detectedPartnerName !== 'Người Thương' && !isGuid(detectedPartnerName)) {
        const realPartnerId = (partnerNameMem?.creatorUserId || partnerNameMem?.userId || partnerId || '').toLowerCase();
        if (realPartnerId) {
          saveKnownUser({ id: realPartnerId, name: detectedPartnerName });
          localStorage.setItem(`lovera_partner_name_${realPartnerId}`, detectedPartnerName);
        }
        if (couple.coupleId) {
          localStorage.setItem(`lovera_partner_name_${couple.coupleId}`, detectedPartnerName);
        }
        localStorage.setItem('lovera_partner_nickname', detectedPartnerName);

        setCouple(prev => {

          if (!active()) return prev;
          if (prev.userB.name === detectedPartnerName) return prev;
          const nextCouple = {
            ...prev,
            userB: {
              ...prev.userB,
              id: realPartnerId || prev.userB.id,
              name: detectedPartnerName,
            }
          };
          saveStoredData(STORAGE_KEYS.COUPLE, nextCouple);
          return nextCouple;
        });
      }

      // 1.1 Detect if anniversary start date was published via shared backend memory tag
      const startDateMem = items.find(m =>
        m.text && (
          m.text.startsWith('[START_DATE]:') ||
          m.text.startsWith('[ANNIVERSARY_DATE]:')
        )
      );
      if (startDateMem?.text) {
        const syncedStartDate = startDateMem.text.replace(/^\[(START_DATE|ANNIVERSARY_DATE)\]:/, '').trim();
        const safeStartDate = (!syncedStartDate || syncedStartDate === '2025-09-22') ? '2025-09-07' : syncedStartDate;
        if (safeStartDate) {
          localStorage.setItem('lovera_anniversary_date', safeStartDate);
          if (couple.coupleId) {
            localStorage.setItem(`lovera_anniversary_date_${couple.coupleId.toLowerCase()}`, safeStartDate);
          }
          setCouple(prev => {
            if (prev.startDate === safeStartDate) return prev;
            const nextCouple = { ...prev, startDate: safeStartDate };
            saveStoredData(STORAGE_KEYS.COUPLE, nextCouple);
            broadcastMessage('SYNC_COUPLE', nextCouple);
            return nextCouple;
          });
        }
      }

      // 1.2 Detect if garden love points were published via shared backend memory tag
      const gardenPointsMem = items.find(m =>
        m.text && (
          m.text.startsWith('[GARDEN_POINTS]:') ||
          m.text.startsWith('[LOVE_POINTS]:')
        )
      );
      if (gardenPointsMem?.text) {
        const syncedPointsStr = gardenPointsMem.text.replace(/^\[(GARDEN_POINTS|LOVE_POINTS)\]:/, '').trim();
        const syncedPoints = parseInt(syncedPointsStr, 10);
        if (!isNaN(syncedPoints) && syncedPoints >= 0) {
          setCouple(prev => {
            const finalPoints = Math.max(prev.lovePoints, syncedPoints, 100);
            localStorage.setItem('lovera_love_points', String(finalPoints));
            if (couple.coupleId) {
              localStorage.setItem(`lovera_love_points_${couple.coupleId.toLowerCase()}`, String(finalPoints));
            }
            if (prev.lovePoints === finalPoints) return prev;
            const nextCouple = { ...prev, lovePoints: finalPoints };
            saveStoredData(STORAGE_KEYS.COUPLE, nextCouple);
            broadcastMessage('SYNC_COUPLE', nextCouple);
            return nextCouple;
          });
        }
      }

      // Never overwrite active custom avatars with date memories.
      // If userA avatar is missing/unset, load genuine avatar blob directly from backend profile API
      if (!isValidDisplayAvatar(couple.userA.avatar) || isMockAvatar(couple.userA.avatar) || couple.userA.avatar.startsWith('/api/') || couple.userA.avatar.startsWith('blob:')) {
        const myStorageAv = localStorage.getItem('lovera_my_avatar') || localStorage.getItem('lovera_alex_avatar');
        if (myStorageAv && isValidDisplayAvatar(myStorageAv) && !isMockAvatar(myStorageAv)) {
          setCouple(prev => {
            if (!active() || prev.userA.avatar === myStorageAv) return prev;
            const next = { ...prev, userA: { ...prev.userA, avatar: myStorageAv } };
            saveStoredData(STORAGE_KEYS.COUPLE, next);
            return next;
          });
        } else {
          try {
            const myBlob = await authService.getMyAvatarBlob();
            if (myBlob) {
              const dataUrl = await blobToDataUrl(myBlob);
              if (!active()) return false;
              safeSetItem('lovera_my_avatar', dataUrl);
              safeSetItem('lovera_alex_avatar', dataUrl);
              saveUserAvatar('me', dataUrl);
              if (myId) saveUserAvatar(myId, dataUrl);
              if (couple.userA.name) saveUserAvatar(couple.userA.name, dataUrl);
              setCouple(prev => {
                if (!active() || prev.userA.avatar === dataUrl) return prev;
                const next = { ...prev, userA: { ...prev.userA, avatar: dataUrl } };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            }
          } catch (e) {}
        }
      }

      // If userB avatar is missing/unset, restore from partner storage if available
      if (!isValidDisplayAvatar(couple.userB.avatar) || isMockAvatar(couple.userB.avatar) || couple.userB.avatar.startsWith('/api/') || couple.userB.avatar.startsWith('blob:')) {
        const partnerStorageAv = localStorage.getItem('lovera_partner_avatar');
        if (partnerStorageAv && isValidDisplayAvatar(partnerStorageAv) && !isMockAvatar(partnerStorageAv)) {
          setCouple(prev => {
            if (!active() || prev.userB.avatar === partnerStorageAv) return prev;
            const next = { ...prev, userB: { ...prev.userB, avatar: partnerStorageAv } };
            saveStoredData(STORAGE_KEYS.COUPLE, next);
            return next;
          });
        }
      }

      return true;
    } catch (error) {
      if (!active()) return false;
      setBackendMemoriesError(error instanceof Error ? error.message : 'Không thể tải kỷ niệm từ máy chủ.');
      return false;
    } finally {
      if (isCurrentSession(session)) setIsLoadingBackendMemories(false);
    }
  };

  React.useEffect(() => {
    if ((currentScreen !== 'home' && currentScreen !== 'shared') || isDemoMode) return;
    if (!couple.isPaired || document.hidden || !navigator.onLine) return;
    void refreshBackendMemories(true, false);
  }, [currentScreen, isDemoMode, couple.isPaired, couple.coupleId]);

  const navigateToAdmin = () => {
    playSound('click');
    setPreviousScreen(currentScreen === 'admin' ? (couple.isPaired ? 'home' : 'welcome') : currentScreen);
    setCurrentScreen('admin');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'admin');
      window.history.pushState({ screen: 'admin' }, '', url.toString());
    } catch (err) {
      console.warn('URL parsing error:', err);
    }
  };

  const navigateToCoupleApp = () => {
    playSound('click');
    const target = couple.isPaired ? (previousScreen === 'admin' ? 'home' : previousScreen) : 'welcome';
    setCurrentScreen(target);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('admin');
      const newPath = url.pathname.toLowerCase().endsWith('/admin') ? '/' : url.pathname;
      window.history.pushState({ screen: target }, '', newPath + (url.search ? url.search : ''));
    } catch (err) {
      console.warn('URL parsing error:', err);
    }
  };

  // Auto detect ?mode=admin or ?admin=true and sync browser navigation
  React.useEffect(() => {
    const checkUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const isAdminPath = window.location.pathname.toLowerCase().endsWith('/admin');
        if (params.get('mode') === 'admin' || params.get('admin') === 'true' || isAdminPath) {
          setCurrentScreen('admin');
        } else {
          setCurrentScreen(prev => (prev === 'admin' ? 'home' : prev));
        }
      } catch (err) {
        console.warn('URL parsing error:', err);
      }
    };

    checkUrl();
    window.addEventListener('popstate', checkUrl);
    return () => window.removeEventListener('popstate', checkUrl);
  }, []);

  const syncAuthenticatedCouple = (allowScreenRedirect = true, refreshProfile = true) => {
    const key = getSessionKey();
    if (!getStoredToken() || !mountedRef.current) return Promise.resolve(undefined);
    if (coupleFlight.current?.key === key) return coupleFlight.current.promise;
    const promise = loadAuthenticatedCouple(allowScreenRedirect, refreshProfile).finally(() => {
      if (coupleFlight.current?.promise === promise) coupleFlight.current = null;
    });
    coupleFlight.current = { key, promise };
    return promise;
  };

  const loadAuthenticatedCouple = async (allowScreenRedirect: boolean, refreshProfile: boolean) => {
    const session = getSessionKey();

    try {
      const [profile, status, loveDays] = await Promise.all([
        authService.getProfile(),
        coupleService.getStatus(),
        coupleService.getLoveDays().catch(() => null),
      ]);
      if (!isCurrentSession(session)) return;

      // Save logged-in user profile to known directory
      saveKnownUser({
        id: profile.id,
        name: profile.displayName || profile.email.split('@')[0],
        email: profile.email,
        avatar: (isValidDisplayAvatar(profile.avatarUrl) && profile.avatarUrl) ? profile.avatarUrl : undefined,
      });

      const isPaired = Boolean(status.isPaired);

      const cleanName = (n?: string | null) => {
        if (!n) return null;
        const t = n.trim();
        if (!t || t === 'Người Thương' || t === 'Chưa kết nối' || isGuid(t)) return null;
        return t;
      };

      setCouple(prev => {

        if (!isCurrentSession(session)) return prev;
        let partnerData = prev.userB;
        if (isPaired) {
          const otherId = status.couple?.userIds?.find((id: string) => id.toLowerCase() !== profile.id.toLowerCase());
          const knownPartner = findKnownUserById(otherId);

          const backendPartnerName =
            (status.couple as any)?.partner?.displayName ||
            (status.couple as any)?.partner?.name ||
            (status as any)?.partner?.displayName ||
            (status as any)?.partner?.name ||
            (status.couple as any)?.members?.find((m: any) => (m.userId || m.id)?.toLowerCase() !== profile.id.toLowerCase())?.displayName ||
            (status.couple as any)?.members?.find((m: any) => (m.userId || m.id)?.toLowerCase() !== profile.id.toLowerCase())?.name;

          const rawSpecific = otherId ? localStorage.getItem(`lovera_partner_name_${otherId.toLowerCase()}`) : null;
          const rawCoupleName = status.couple?.coupleId ? localStorage.getItem(`lovera_partner_name_${status.couple.coupleId}`) : null;
          const rawNickname = localStorage.getItem('lovera_partner_nickname');

          if (isGuid(rawNickname)) localStorage.removeItem('lovera_partner_nickname');
          if (otherId && isGuid(rawSpecific)) localStorage.removeItem(`lovera_partner_name_${otherId.toLowerCase()}`);
          if (status.couple?.coupleId && isGuid(rawCoupleName)) localStorage.removeItem(`lovera_partner_name_${status.couple.coupleId}`);

          // Custom user-chosen nickname takes highest priority so it doesn't get wiped on F5
          const resolvedName =
            cleanName(rawNickname) ||
            cleanName(rawSpecific) ||
            cleanName(rawCoupleName) ||
            cleanName(backendPartnerName) ||
            cleanName(knownPartner?.name) ||
            cleanName(findKnownUserByName(prev.userB.name)?.name) ||
            cleanName(prev.userB.name) ||
            'Người Thương';

          if (resolvedName && resolvedName !== 'Người Thương' && !isGuid(resolvedName)) {
            safeSetItem('lovera_partner_nickname', resolvedName);
            if (otherId) {
              safeSetItem(`lovera_partner_name_${otherId.toLowerCase()}`, resolvedName);
              saveKnownUser({ id: otherId, name: resolvedName });
            }
          }

          const resolvedEmail =
            (status.couple as any)?.partner?.email ||
            (status as any)?.partner?.email ||
            (status.couple as any)?.members?.find((m: any) => (m.userId || m.id)?.toLowerCase() !== profile.id.toLowerCase())?.email ||
            knownPartner?.email ||
            prev.userB.email;

          const resolvedId = (status.couple as any)?.partner?.userId || (status as any)?.partner?.userId || otherId || prev.userB.id || 'usr_partner';

          // Resolve Partner Avatar: prioritize partner's specific ID avatar, ignoring mock avatars
          const partnerAvById = otherId ? getUserAvatar(otherId) : undefined;
          const partnerAvByResolvedId = resolvedId && resolvedId !== 'usr_partner' ? getUserAvatar(resolvedId) : undefined;
          const partnerAvByName = resolvedName ? getUserAvatar(resolvedName) : undefined;
          const partnerAvByEmail = resolvedEmail ? getUserAvatar(resolvedEmail) : undefined;
          const partnerAvByIdStorage = otherId ? localStorage.getItem(`lovera_avatar_${otherId.toLowerCase()}`) : null;
          const partnerAvKnown = knownPartner?.avatar && isValidDisplayAvatar(knownPartner.avatar) && !isMockAvatar(knownPartner.avatar) ? knownPartner.avatar : undefined;

          const rawPartnerStorageAv = localStorage.getItem('lovera_partner_avatar');
          const cleanPartnerStorageAv = (rawPartnerStorageAv && isValidDisplayAvatar(rawPartnerStorageAv) && !isMockAvatar(rawPartnerStorageAv)) ? rawPartnerStorageAv : undefined;

          const resolvedPartnerAvatar: string =
            // Public profile URLs can be displayed directly; /me/avatar is owner-only.
            ([status.couple?.partner, status.partner, ...(status.couple?.members || [])]
              .find(member => member?.userId?.toLowerCase() !== profile.id.toLowerCase() && /^https:\/\//i.test(member?.avatarUrl || ''))?.avatarUrl || undefined) ||
            cleanPartnerStorageAv ||
            (isValidDisplayAvatar(prev.userB.avatar) && !isMockAvatar(prev.userB.avatar) && !prev.userB.avatar.startsWith('/api/') ? prev.userB.avatar : undefined) ||
            (getUserAvatar('partner') && !isMockAvatar(getUserAvatar('partner')) ? getUserAvatar('partner')! : undefined) ||
            (partnerAvById && !isMockAvatar(partnerAvById) ? partnerAvById : undefined) ||
            (partnerAvByResolvedId && !isMockAvatar(partnerAvByResolvedId) ? partnerAvByResolvedId : undefined) ||
            (partnerAvByIdStorage && isValidDisplayAvatar(partnerAvByIdStorage) && !isMockAvatar(partnerAvByIdStorage) ? partnerAvByIdStorage : undefined) ||
            (partnerAvByName && !isMockAvatar(partnerAvByName) ? partnerAvByName : undefined) ||
            (partnerAvByEmail && !isMockAvatar(partnerAvByEmail) ? partnerAvByEmail : undefined) ||
            partnerAvKnown ||
            INITIAL_COUPLE.userB.avatar;

          if (resolvedPartnerAvatar && !isMockAvatar(resolvedPartnerAvatar)) {
            safeSetItem('lovera_partner_avatar', resolvedPartnerAvatar);
            saveUserAvatar('partner', resolvedPartnerAvatar);
            if (otherId) saveUserAvatar(otherId, resolvedPartnerAvatar);
            if (resolvedName) saveUserAvatar(resolvedName, resolvedPartnerAvatar);
          }

          partnerData = {
            ...prev.userB,
            id: resolvedId,
            name: resolvedName,
            email: resolvedEmail,
            avatar: resolvedPartnerAvatar,
            status: 'Available',
            isOnline: true,
          };
        } else {
          partnerData = {
            id: '',
            name: 'Chưa kết nối',
            avatar: INITIAL_COUPLE.userB.avatar,
            email: '',
            status: 'Away',
            isOnline: false,
            batteryLevel: 0,
          };
        }

        const myName =
          cleanName(localStorage.getItem('lovera_my_nickname')) ||
          cleanName(profile.displayName) ||
          cleanName(profile.email.split('@')[0]) ||
          cleanName(couple.userA.name) ||
          'Người Thương';
        if (myName && !isGuid(myName)) {
          safeSetItem('lovera_my_nickname', myName);
        }

        const myAvById = profile.id ? getUserAvatar(profile.id) : undefined;
        const myAvByIdStorage = profile.id ? localStorage.getItem(`lovera_avatar_${profile.id.toLowerCase()}`) : null;
        const myAvByName = profile.displayName ? getUserAvatar(profile.displayName) : undefined;
        const rawMyStorageAv = localStorage.getItem('lovera_my_avatar') || localStorage.getItem('lovera_alex_avatar');
        const cleanMyStorageAv = (rawMyStorageAv && isValidDisplayAvatar(rawMyStorageAv) && !isMockAvatar(rawMyStorageAv)) ? rawMyStorageAv : undefined;

        const resolvedUserAAvatar: string =
          (profile.avatarUrl && /^https:\/\//i.test(profile.avatarUrl) ? profile.avatarUrl : undefined) ||
          cleanMyStorageAv ||
          (isValidDisplayAvatar(prev.userA.avatar) && !isMockAvatar(prev.userA.avatar) && !prev.userA.avatar.startsWith('/api/') ? prev.userA.avatar : undefined) ||
          (getUserAvatar('me') && !isMockAvatar(getUserAvatar('me')) ? getUserAvatar('me')! : undefined) ||
          (myAvById && !isMockAvatar(myAvById) ? myAvById : undefined) ||
          (myAvByIdStorage && isValidDisplayAvatar(myAvByIdStorage) && !isMockAvatar(myAvByIdStorage) ? myAvByIdStorage : undefined) ||
          (myAvByName && !isMockAvatar(myAvByName) ? myAvByName : undefined) ||
          INITIAL_COUPLE.userA.avatar;

        if (resolvedUserAAvatar && !isMockAvatar(resolvedUserAAvatar)) {
          safeSetItem('lovera_my_avatar', resolvedUserAAvatar);
          saveUserAvatar('me', resolvedUserAAvatar);
          if (profile.id) saveUserAvatar(profile.id, resolvedUserAAvatar);
          if (profile.displayName) saveUserAvatar(profile.displayName, resolvedUserAAvatar);
        }

        const coupleId = status.couple?.coupleId || (isPaired ? prev.coupleId : '');
        const savedDateByCouple = coupleId ? localStorage.getItem(`lovera_anniversary_date_${coupleId.toLowerCase()}`) : null;
        const savedDateGlobal = localStorage.getItem('lovera_anniversary_date');

        const sanitizeDate = (d?: string | null) => {
          if (!d || d === '2025-09-22') return '2025-09-07';
          return d;
        };

        const rawStartDate =
          loveDays?.startDate ||
          status.couple?.startDate ||
          savedDateByCouple ||
          savedDateGlobal ||
          prev.startDate;
        const resolvedStartDate = sanitizeDate(rawStartDate);

        if (resolvedStartDate) {
          safeSetItem('lovera_anniversary_date', resolvedStartDate);
          if (coupleId) {
            safeSetItem(`lovera_anniversary_date_${coupleId.toLowerCase()}`, resolvedStartDate);
          }
        }

        const savedPointsByCouple = coupleId ? localStorage.getItem(`lovera_love_points_${coupleId.toLowerCase()}`) : null;
        const savedPointsGlobal = localStorage.getItem('lovera_love_points');
        let resolvedLovePoints = prev.lovePoints ?? 0;
        if (savedPointsByCouple !== null) {
          resolvedLovePoints = Math.max(resolvedLovePoints, parseInt(savedPointsByCouple, 10) || 0);
        }
        if (savedPointsGlobal !== null) {
          resolvedLovePoints = Math.max(resolvedLovePoints, parseInt(savedPointsGlobal, 10) || 0);
        }
        // Points never decrease, restore to at least 100
        resolvedLovePoints = Math.max(resolvedLovePoints, 100);

        if (coupleId) {
          safeSetItem(`lovera_love_points_${coupleId.toLowerCase()}`, String(resolvedLovePoints));
        }
        safeSetItem('lovera_love_points', String(resolvedLovePoints));

        const next: CoupleData = {
          ...prev,
          coupleId,
          startDate: resolvedStartDate,
          lovePoints: resolvedLovePoints,
          isPaired,
          userA: {
            ...prev.userA,
            id: profile.id,
            name: myName,
            email: profile.email || prev.userA.email,
            avatar: resolvedUserAAvatar,
          },
          userB: partnerData,
        };

        saveStoredData(STORAGE_KEYS.COUPLE, next);
        return next;
      });

      // Synchronize garden points from backend API if paired - NEVER DECREASE POINTS
      if (isPaired) {
        gardenService.getGarden().then(gardenRes => {
          const remotePoints = (gardenRes as any)?.totalPoints ?? gardenRes?.points;
          if (typeof remotePoints === 'number' && remotePoints >= 0) {
            setCouple(prev => {
              // Crucial fix: ONLY increase points, NEVER decrease!
              const finalPoints = Math.max(prev.lovePoints, remotePoints, 100);
              localStorage.setItem('lovera_love_points', String(finalPoints));
              if (status.couple?.coupleId) {
                localStorage.setItem(`lovera_love_points_${status.couple.coupleId.toLowerCase()}`, String(finalPoints));
              }
              if (prev.lovePoints === finalPoints) return prev;
              const next = { ...prev, lovePoints: finalPoints };
              saveStoredData(STORAGE_KEYS.COUPLE, next);
              broadcastMessage('SYNC_COUPLE', next);
              return next;
            });
          }
        }).catch(() => {});
      }

      // Load User A's real avatar blob from backend if stored on profile
      if (profile.avatarUrl && profile.avatarUrl.startsWith('/api/')) {
        authService.getMyAvatarBlob().then(async blob => {
          if (blob && isCurrentSession(session)) {
            const dataUrl = await blobToDataUrl(blob);
            if (!isCurrentSession(session)) return;
            setCouple(curr => {
              if (!isCurrentSession(session)) return curr;
              if (curr.userA.avatar === dataUrl) return curr;
              const next = { ...curr, userA: { ...curr.userA, avatar: dataUrl } };
              saveStoredData(STORAGE_KEYS.COUPLE, next);
              return next;
            });
            localStorage.setItem('lovera_my_avatar', dataUrl);
            saveUserAvatar('me', dataUrl);
            if (profile.id) saveUserAvatar(profile.id, dataUrl);
            if (profile.displayName) saveUserAvatar(profile.displayName, dataUrl);
            broadcastMessage('SYNC_AVATAR', {
              senderId: profile.id,
              senderName: profile.displayName || couple.userA.name,
              avatar: dataUrl
            });
          }
        }).catch(() => {});
      }

      if (allowScreenRedirect) {
        if (isPaired) {
          setCurrentScreen(curr => (curr === 'welcome' || curr === 'login' || curr === 'auth' || curr === 'pairing' ? 'home' : curr));
        } else {
          setCurrentScreen(curr => (['home', 'shared', 'chat', 'planner', 'garden'].includes(curr) ? 'pairing' : curr));
        }
      }
      return isPaired;
    } catch (err) {
      if (!isCurrentSession(session)) return;
      console.warn('[App] Auto fetch real profile and couple status failed:', err);
    }
  };

  React.useEffect(() => {
    // 1. Evict oversized legacy base64 strings to free browser quota
    cleanupOversizedStorage();

    // 2. Hydrate avatars from storage on startup (preserve active display avatars, fallback cleanly)
    setCouple(prev => {
      const storageMyAv = localStorage.getItem('lovera_my_avatar') || localStorage.getItem('lovera_alex_avatar');
      const cleanStorageMy = (storageMyAv && isValidDisplayAvatar(storageMyAv) && !isMockAvatar(storageMyAv)) ? storageMyAv : undefined;
      const cleanUserA = (isValidDisplayAvatar(prev.userA.avatar) && !prev.userA.avatar.startsWith('blob:') && !isMockAvatar(prev.userA.avatar))
        ? prev.userA.avatar
        : (cleanStorageMy || getUserAvatar('me') || INITIAL_COUPLE.userA.avatar);

      const storagePartnerAv = localStorage.getItem('lovera_partner_avatar');
      const cleanStoragePartner = (storagePartnerAv && isValidDisplayAvatar(storagePartnerAv) && !isMockAvatar(storagePartnerAv)) ? storagePartnerAv : undefined;
      const cleanUserB = (isValidDisplayAvatar(prev.userB.avatar) && !prev.userB.avatar.startsWith('blob:') && !isMockAvatar(prev.userB.avatar))
        ? prev.userB.avatar
        : (cleanStoragePartner || getUserAvatar('partner') || INITIAL_COUPLE.userB.avatar);

      return {
        ...prev,
        userA: { ...prev.userA, avatar: cleanUserA },
        userB: { ...prev.userB, avatar: cleanUserB },
      };
    });

    // Broadcast active presence and request sync from peer windows
    setTimeout(() => {
      const cur = stateRef.current.couple;
      if (isValidDisplayAvatar(cur.userA.avatar) && !isMockAvatar(cur.userA.avatar) && !cur.userA.avatar.startsWith('/api/')) {
        broadcastMessage('SYNC_AVATAR', {
          senderId: cur.userA.id,
          senderName: cur.userA.name,
          senderEmail: cur.userA.email,
          avatar: cur.userA.avatar,
        });
      }
      broadcastMessage('REQUEST_SYNC', null);
    }, 150);

  }, []);

  // Fresh callbacks without recreating timers whenever profile/couple state changes.
  const latestSync = React.useRef({ syncAuthenticatedCouple, refreshBackendMemories, isPaired: couple.isPaired, coupleId: couple.coupleId });
  latestSync.current = { syncAuthenticatedCouple, refreshBackendMemories, isPaired: couple.isPaired, coupleId: couple.coupleId };
  const [, refreshSession] = React.useReducer((value: number) => value + 1, 0);
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'lovera_access_token') refreshSession();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const sessionKey = getSessionKey();
  const previousSession = React.useRef(sessionKey);
  React.useEffect(() => {
    if (previousSession.current === sessionKey) return;
    previousSession.current = sessionKey;
    lastSyncedPartnerAvatarMemId.current = '';
    lastSyncedMyAvatarMemId.current = '';
    timelineLoaded.current = { key: '', at: 0 };
    setBackendMemories([]);
    setIsLoadingBackendMemories(false);
    setBackendMemoriesError('');
  }, [sessionKey]);
  React.useEffect(() => {
    if (!getStoredToken() || isDemoMode) return;
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastCouple = 0;
    let restored = false;
    let resumePending = false;
    let lastResume = 0;
    const available = () => !stopped && !document.hidden && navigator.onLine && getSessionKey() === sessionKey;
    const schedule = () => {
      clearTimeout(timer);
      if (available()) {
        const interval = latestSync.current.isPaired ? 3500 : 15000;
        timer = setTimeout(() => void tick(), interval);
      }
    };
    const tick = async (resume = false) => {
      if (!available()) return;
      if (running) { resumePending ||= resume; return; }
      running = true;
      try {
        let paired = latestSync.current.isPaired;
        if (!restored || resume || Date.now() - lastCouple >= (paired ? 8000 : 15000)) {
          if (!isRouteRateLimited('/couples')) {
            const result = await latestSync.current.syncAuthenticatedCouple(true, !restored || resume);
            if (!available()) return;
            if (typeof result === 'boolean') paired = result;
            lastCouple = Date.now();
            restored = true;
          }
        }
        if (paired && available() && !isRouteRateLimited('/memories')) {
          await latestSync.current.refreshBackendMemories(true, true);
        }
      } finally {
        running = false;
        if (resumePending && available()) {
          resumePending = false;
          void tick(true);
        } else schedule();
      }
    };
    let resumeQueued = false;
    const onAvailability = () => {
      clearTimeout(timer);
      if (!available() || resumeQueued || Date.now() - lastResume < 1000) return;
      lastResume = Date.now();
      resumeQueued = true;
      // Coalesce online + visibility events into one refresh.
      queueMicrotask(() => {
        resumeQueued = false;
        if (available()) void tick(true);
      });
    };
    document.addEventListener('visibilitychange', onAvailability);
    window.addEventListener('online', onAvailability);
    window.addEventListener('offline', onAvailability);
    // StrictMode cleans up its first setup before this callback starts requests.
    timer = setTimeout(() => void tick(), 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onAvailability);
      window.removeEventListener('online', onAvailability);
      window.removeEventListener('offline', onAvailability);
    };
  }, [isDemoMode, sessionKey]);

  // Live Cross-Tab Synchronization with BroadcastChannel & localStorage
  const stateRef = React.useRef({ memories, couple, adminUsers, adminLogs, adminMetrics, datePlans, pointHistory, gardenMetrics });
  stateRef.current = { memories, couple, adminUsers, adminLogs, adminMetrics, datePlans, pointHistory, gardenMetrics };

  React.useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      switch (msg.type) {
        case 'SYNC_MEMORIES':
          setMemories(msg.payload);
          break;
        case 'SYNC_MEMORY_LIKES':
          if (msg.payload?.id) {
            const { id, likes } = msg.payload;
            setBackendMemories(prev => prev.map(m => m.id === id ? { ...m, likes } : m));
          }
          break;
        case 'SYNC_NICKNAMES':
          if (msg.payload) {
            const { senderId, senderEmail, senderName, partnerName } = msg.payload;
            const currentMyProfile = getStoredUserProfile<{ id?: string; email?: string }>();
            const currentMyId = (currentMyProfile?.id || stateRef.current.couple.userA.id || '').toLowerCase();
            const currentMyEmail = (currentMyProfile?.email || stateRef.current.couple.userA.email || '').toLowerCase();
            const sid = (senderId || '').toLowerCase();
            const semail = (senderEmail || '').toLowerCase();

            const isDummyId = (id?: string) => !id || id === 'usr_alex' || id === 'usr_sam' || id === 'usr_partner';
            const isDummyEmail = (email?: string) => !email || email.includes('lovera.app');

            const isMe =
              Boolean(sid && currentMyId && !isDummyId(sid) && !isDummyId(currentMyId) && sid === currentMyId) ||
              Boolean(semail && currentMyEmail && !isDummyEmail(semail) && !isDummyEmail(currentMyEmail) && semail === currentMyEmail);

            const cleanSender = (senderName && !isGuid(senderName) && senderName !== 'Người Thương') ? senderName.trim() : undefined;
            const cleanPartner = (partnerName && !isGuid(partnerName) && partnerName !== 'Người Thương') ? partnerName.trim() : undefined;

            if (isMe) {
              if (cleanSender) safeSetItem('lovera_my_nickname', cleanSender);
              if (cleanPartner) safeSetItem('lovera_partner_nickname', cleanPartner);
              setCouple(prev => {
                const next = {
                  ...prev,
                  userA: { ...prev.userA, name: cleanSender || prev.userA.name },
                  userB: { ...prev.userB, name: cleanPartner || prev.userB.name }
                };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            } else {
              if (cleanSender) {
                safeSetItem('lovera_partner_nickname', cleanSender);
                if (sid && !isDummyId(sid)) {
                  safeSetItem(`lovera_partner_name_${sid}`, cleanSender);
                  saveKnownUser({ id: sid, name: cleanSender });
                }
              }
              if (cleanPartner) {
                safeSetItem('lovera_my_nickname', cleanPartner);
                if (currentMyId && !isDummyId(currentMyId)) {
                  saveKnownUser({ id: currentMyId, name: cleanPartner });
                }
              }

              setCouple(prev => {
                const next = {
                  ...prev,
                  userA: { ...prev.userA, name: cleanPartner || prev.userA.name },
                  userB: { ...prev.userB, name: cleanSender || prev.userB.name }
                };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            }
          }
          break;
        case 'SYNC_AVATAR':
          if (msg.payload) {
            const { senderId, senderName, senderEmail, avatar, userId, name, email } = msg.payload;
            const targetAvatar = avatar;
            if (!targetAvatar || !isValidDisplayAvatar(targetAvatar) || isMockAvatar(targetAvatar) || targetAvatar.startsWith('/api/')) break;

            const sid = (senderId || userId || '').toLowerCase();
            const sname = (senderName || name || '').toLowerCase();
            const semail = (senderEmail || email || '').toLowerCase();

            const currentMyProfile = getStoredUserProfile<{ id?: string; email?: string }>();
            const currentMyId = (currentMyProfile?.id || stateRef.current.couple.userA.id || '').toLowerCase();
            const currentMyEmail = (currentMyProfile?.email || stateRef.current.couple.userA.email || '').toLowerCase();

            const isDummyId = (id?: string) => !id || id === 'usr_alex' || id === 'usr_sam' || id === 'usr_partner';
            const isDummyEmail = (email?: string) => !email || email.includes('lovera.app');

            const isMe =
              Boolean(sid && currentMyId && !isDummyId(sid) && !isDummyId(currentMyId) && sid === currentMyId) ||
              Boolean(semail && currentMyEmail && !isDummyEmail(semail) && !isDummyEmail(currentMyEmail) && semail === currentMyEmail);

            if (isMe) {
              safeSetItem('lovera_my_avatar', targetAvatar);
              safeSetItem('lovera_alex_avatar', targetAvatar);
              saveUserAvatar('me', targetAvatar);
              if (sid && !isDummyId(sid)) saveUserAvatar(sid, targetAvatar);
              setCouple(prev => {
                const next = { ...prev, userA: { ...prev.userA, avatar: targetAvatar } };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            } else {
              safeSetItem('lovera_partner_avatar', targetAvatar);
              saveUserAvatar('partner', targetAvatar);
              if (sid && !isDummyId(sid)) saveUserAvatar(sid, targetAvatar);
              if (sname && !isGuid(sname)) saveUserAvatar(sname, targetAvatar);
              if (stateRef.current.couple.userB.id && !isDummyId(stateRef.current.couple.userB.id)) {
                saveUserAvatar(stateRef.current.couple.userB.id, targetAvatar);
              }
              if (stateRef.current.couple.userB.name && !isGuid(stateRef.current.couple.userB.name)) {
                saveUserAvatar(stateRef.current.couple.userB.name, targetAvatar);
              }

              setCouple(prev => {
                const next = { ...prev, userB: { ...prev.userB, avatar: targetAvatar } };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            }
          }
          break;
        case 'SHARED_STATE_INIT':
          if (msg.payload && msg.payload.avatars) {
            const avatars = msg.payload.avatars as Record<string, string>;
            const cur = stateRef.current.couple;
            const myProfile = getStoredUserProfile<{ id?: string; email?: string }>();
            const myId = (myProfile?.id || cur.userA.id || '').toLowerCase();
            const myName = (cleanName(localStorage.getItem('lovera_my_nickname')) || cur.userA.name || '').toLowerCase();
            const partnerId = (cur.userB.id || '').toLowerCase();
            const partnerName = (cleanName(localStorage.getItem('lovera_partner_nickname')) || cur.userB.name || '').toLowerCase();

            // Partner avatar from server bridge:
            const candidatePartnerAv = (partnerId && avatars[partnerId]) || (partnerName && avatars[partnerName]);
            if (candidatePartnerAv && isValidDisplayAvatar(candidatePartnerAv) && !isMockAvatar(candidatePartnerAv)) {
              safeSetItem('lovera_partner_avatar', candidatePartnerAv);
              saveUserAvatar('partner', candidatePartnerAv);
              if (partnerId) saveUserAvatar(partnerId, candidatePartnerAv);
              if (partnerName) saveUserAvatar(partnerName, candidatePartnerAv);
              setCouple(prev => {
                if (prev.userB.avatar === candidatePartnerAv) return prev;
                const next = { ...prev, userB: { ...prev.userB, avatar: candidatePartnerAv } };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              });
            }

            // My avatar from server bridge (if missing locally):
            const candidateMyAv = (myId && avatars[myId]) || (myName && avatars[myName]);
            if (candidateMyAv && isValidDisplayAvatar(candidateMyAv) && !isMockAvatar(candidateMyAv)) {
              if (!isValidDisplayAvatar(cur.userA.avatar) || isMockAvatar(cur.userA.avatar)) {
                safeSetItem('lovera_my_avatar', candidateMyAv);
                saveUserAvatar('me', candidateMyAv);
                if (myId) saveUserAvatar(myId, candidateMyAv);
                setCouple(prev => {
                  if (prev.userA.avatar === candidateMyAv) return prev;
                  const next = { ...prev, userA: { ...prev.userA, avatar: candidateMyAv } };
                  saveStoredData(STORAGE_KEYS.COUPLE, next);
                  return next;
                });
              }
            }
          }
          break;
        case 'SYNC_COUPLE':
          if (msg.payload) {
            setCouple(prev => {
              const sid = msg.payload.userA?.id?.toLowerCase();
              const semail = msg.payload.userA?.email?.toLowerCase();
              const currentMyProfile = getStoredUserProfile<{ id?: string; email?: string }>();
              const myId = (currentMyProfile?.id || prev.userA.id || '').toLowerCase();
              const myEmail = (currentMyProfile?.email || prev.userA.email || '').toLowerCase();

              const isDummyId = (id?: string) => !id || id === 'usr_alex' || id === 'usr_sam' || id === 'usr_partner';
              const isDummyEmail = (email?: string) => !email || email.includes('lovera.app');

              const isMe =
                Boolean(sid && myId && !isDummyId(sid) && !isDummyId(myId) && sid === myId) ||
                Boolean(semail && myEmail && !isDummyEmail(semail) && !isDummyEmail(myEmail) && semail === myEmail);
              const isPartner = !isMe && Boolean(prev.isPaired || msg.payload.isPaired);

              const incomingDate = msg.payload.startDate;
              const safeStartDate = (incomingDate && incomingDate !== '2025-09-22') ? incomingDate : (prev.startDate && prev.startDate !== '2025-09-22' ? prev.startDate : '2025-09-07');

              if (safeStartDate) {
                safeSetItem('lovera_anniversary_date', safeStartDate);
                if (prev.coupleId) {
                  safeSetItem(`lovera_anniversary_date_${prev.coupleId.toLowerCase()}`, safeStartDate);
                }
              }

              const payloadPoints = typeof msg.payload.lovePoints === 'number' ? msg.payload.lovePoints : undefined;
              const safePoints = payloadPoints !== undefined ? Math.max(prev.lovePoints, payloadPoints) : prev.lovePoints;

              if (payloadPoints !== undefined) {
                safeSetItem('lovera_love_points', String(safePoints));
                if (prev.coupleId) {
                  safeSetItem(`lovera_love_points_${prev.coupleId.toLowerCase()}`, String(safePoints));
                }
              }

              if (isPartner) {
                const rawPartnerName = msg.payload.userA?.name;
                const rawMyNickname = msg.payload.userB?.name;
                const partnerNewName = (rawPartnerName && !isGuid(rawPartnerName) && rawPartnerName !== 'Người Thương')
                  ? rawPartnerName
                  : (prev.userB.name && !isGuid(prev.userB.name) && prev.userB.name !== 'Người Thương' ? prev.userB.name : (findKnownUserById(msg.payload.userA?.id)?.name || 'Người Thương'));
                const myNewNickname = (rawMyNickname && !isGuid(rawMyNickname) && rawMyNickname !== 'Người Thương')
                  ? rawMyNickname
                  : prev.userA.name;
                const partnerNewAvatar = (isValidDisplayAvatar(msg.payload.userA?.avatar) && !isMockAvatar(msg.payload.userA.avatar) && !msg.payload.userA.avatar?.startsWith('/api/'))
                  ? msg.payload.userA.avatar
                  : prev.userB.avatar;

                if (partnerNewName && !isGuid(partnerNewName) && partnerNewName !== 'Người Thương') {
                  safeSetItem('lovera_partner_nickname', partnerNewName);
                  if (msg.payload.userA?.id && !isDummyId(msg.payload.userA.id)) {
                    safeSetItem(`lovera_partner_name_${msg.payload.userA.id.toLowerCase()}`, partnerNewName);
                    saveKnownUser({ id: msg.payload.userA.id, name: partnerNewName });
                  }
                }
                if (myNewNickname && !isGuid(myNewNickname) && myNewNickname !== 'Người Thương') {
                  safeSetItem('lovera_my_nickname', myNewNickname);
                  if (myId && !isDummyId(myId)) {
                    saveKnownUser({ id: myId, name: myNewNickname });
                  }
                }
                if (isValidDisplayAvatar(partnerNewAvatar) && !isMockAvatar(partnerNewAvatar)) {
                  safeSetItem('lovera_partner_avatar', partnerNewAvatar);
                  saveUserAvatar('partner', partnerNewAvatar);
                  if (msg.payload.userA?.id && !isDummyId(msg.payload.userA.id)) {
                    saveUserAvatar(msg.payload.userA.id, partnerNewAvatar);
                  }
                }

                const next: CoupleData = {
                  ...prev,
                  startDate: safeStartDate,
                  lovePoints: safePoints,
                  coupleId: msg.payload.coupleId || prev.coupleId,
                  userA: {
                    ...prev.userA,
                    name: myNewNickname,
                  },
                  userB: {
                    ...prev.userB,
                    id: msg.payload.userA?.id || prev.userB.id,
                    name: partnerNewName,
                    email: msg.payload.userA?.email || prev.userB.email,
                    avatar: partnerNewAvatar,
                    status: msg.payload.userA?.status || prev.userB.status,
                    activity: msg.payload.userA?.activity ?? prev.userB.activity,
                    isOnline: msg.payload.userA?.isOnline ?? prev.userB.isOnline,
                  }
                };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              }

              if (isMe) {
                const myAvatar = (isValidDisplayAvatar(msg.payload.userA?.avatar) && !msg.payload.userA?.avatar?.startsWith('/api/')) ? msg.payload.userA.avatar : prev.userA.avatar;
                const partnerAvatar = (isValidDisplayAvatar(msg.payload.userB?.avatar) && !msg.payload.userB?.avatar?.startsWith('/api/')) ? msg.payload.userB.avatar : prev.userB.avatar;
                const myCleanName = (msg.payload.userA?.name && !isGuid(msg.payload.userA.name) && msg.payload.userA.name !== 'Người Thương') ? msg.payload.userA.name : prev.userA.name;
                const partnerCleanName = (msg.payload.userB?.name && !isGuid(msg.payload.userB.name) && msg.payload.userB.name !== 'Người Thương') ? msg.payload.userB.name : prev.userB.name;

                const next = {
                  ...prev,
                  ...msg.payload,
                  startDate: safeStartDate,
                  lovePoints: safePoints,
                  userA: { ...prev.userA, ...msg.payload.userA, name: myCleanName, avatar: myAvatar },
                  userB: { ...prev.userB, ...msg.payload.userB, name: partnerCleanName, avatar: partnerAvatar },
                };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              }

              if ((safeStartDate !== prev.startDate) || (safePoints !== prev.lovePoints)) {
                const next = {
                  ...prev,
                  startDate: safeStartDate,
                  lovePoints: safePoints,
                };
                saveStoredData(STORAGE_KEYS.COUPLE, next);
                return next;
              }

              return prev;
            });

            if (msg.payload?.isPaired === false) {
              setCurrentScreen(curr => (['home', 'shared', 'chat', 'planner', 'garden'].includes(curr) ? 'pairing' : curr));
            } else if (msg.payload?.isPaired === true) {
              setCurrentScreen(curr => (curr === 'pairing' ? 'home' : curr));
            }
          }
          break;
        case 'SYNC_ADMIN_USERS':
          setAdminUsers(msg.payload);
          break;
        case 'SYNC_ADMIN_LOGS':
          setAdminLogs(msg.payload);
          break;
        case 'SYNC_ADMIN_METRICS':
          setAdminMetrics(msg.payload);
          break;
        case 'SYNC_DATE_PLANS':
          setDatePlans(msg.payload);
          break;
        case 'SYNC_POINT_HISTORY':
          setPointHistory(msg.payload);
          break;
        case 'SYNC_GARDEN_METRICS':
          if (msg.payload) {
            setGardenMetrics(msg.payload);
            saveStoredData(STORAGE_KEYS.GARDEN_METRICS, msg.payload);
          }
          break;
        case 'REQUEST_SYNC':
          if (isDemoMode) {
            broadcastMessage('SYNC_ALL', stateRef.current);
          } else {
            const cur = stateRef.current.couple;
            if (isValidDisplayAvatar(cur.userA.avatar) && !isMockAvatar(cur.userA.avatar) && !cur.userA.avatar.startsWith('/api/')) {
              broadcastMessage('SYNC_AVATAR', {
                senderId: cur.userA.id,
                senderName: cur.userA.name,
                senderEmail: cur.userA.email,
                avatar: cur.userA.avatar,
              });
            }
            broadcastMessage('SYNC_COUPLE', cur);
          }
          break;
        case 'SYNC_ALL':
          if (isDemoMode && msg.payload) {
            if (msg.payload.memories) setMemories(msg.payload.memories);
            if (msg.payload.couple) setCouple(msg.payload.couple);
            if (msg.payload.adminUsers) setAdminUsers(msg.payload.adminUsers);
            if (msg.payload.adminLogs) setAdminLogs(msg.payload.adminLogs);
            if (msg.payload.adminMetrics) setAdminMetrics(msg.payload.adminMetrics);
            if (msg.payload.datePlans) setDatePlans(msg.payload.datePlans);
            if (msg.payload.pointHistory) setPointHistory(msg.payload.pointHistory);
            if (msg.payload.gardenMetrics) setGardenMetrics(msg.payload.gardenMetrics);
          }
          break;
      }
    });

    // Request sync from any already-open tab on mount
    broadcastMessage('REQUEST_SYNC', null);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = () => {
    playSound('chime');
    const freshMemories = loadStoredData(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
    const freshCouple = loadStoredData(STORAGE_KEYS.COUPLE, INITIAL_COUPLE);
    const freshUsers = loadStoredData(STORAGE_KEYS.ADMIN_USERS, INITIAL_ADMIN_USERS);
    const freshLogs = loadStoredData(STORAGE_KEYS.ADMIN_LOGS, INITIAL_ADMIN_LOGS);
    const freshMetrics = loadStoredData(STORAGE_KEYS.ADMIN_METRICS, INITIAL_ADMIN_METRICS);
    const freshPlans = loadStoredData(STORAGE_KEYS.DATE_PLANS, INITIAL_DATE_PLANS);
    const freshPoints = loadStoredData(STORAGE_KEYS.POINT_HISTORY, INITIAL_POINT_HISTORY);

    setMemories(freshMemories);
    setCouple(freshCouple);
    setAdminUsers(freshUsers);
    setAdminLogs(freshLogs);
    setAdminMetrics(freshMetrics);
    setDatePlans(freshPlans);
    setPointHistory(freshPoints);

    broadcastMessage('REQUEST_SYNC', null);
  };

  // Modals & UI States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLoveDayModalOpen, setIsLoveDayModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Interaction feedback states
  const [isWatering, setIsWatering] = useState(false);
  const [isFertilizing, setIsFertilizing] = useState(false);
  const [isSunbathing, setIsSunbathing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState(true);

  // Heart particle animation state
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const triggerHeartBurst = (e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    const id = Date.now();
    setFloatingHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1600);
  };

  // -----------------------------------------------------------------
  // POINTS & GAMIFICATION HANDLERS
  // -----------------------------------------------------------------
  const addPoints = (amount: number, actionName: string, byUser = couple.userA.name, category?: PointHistoryItem['category']) => {
    let nextLovePoints = 0;
    setCouple(prev => {
      const nextPts = (prev.lovePoints || 0) + amount;
      nextLovePoints = nextPts;
      const next = { ...prev, lovePoints: nextPts };
      saveStoredData(STORAGE_KEYS.COUPLE, next);
      localStorage.setItem('lovera_love_points', String(nextPts));
      if (prev.coupleId) {
        localStorage.setItem(`lovera_love_points_${prev.coupleId.toLowerCase()}`, String(nextPts));
      }
      broadcastMessage('SYNC_COUPLE', next);
      return next;
    });

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = 'Hôm nay, ' + hours + ':' + minutes;

    const newHistoryItem: PointHistoryItem = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action: actionName,
      points: amount,
      timestamp: formattedTime,
      by: byUser,
      category
    };

    setPointHistory(prev => {
      const next = [newHistoryItem, ...prev];
      saveStoredData(STORAGE_KEYS.POINT_HISTORY, next);
      broadcastMessage('SYNC_POINT_HISTORY', next);
      return next;
    });

    // Live bidirectional sync to Admin Portal metrics and accounts
    setAdminUsers(prev => {
      const next = prev.map(u => {
        if (u.id === 'usr_alex' || u.id === 'usr_sam') {
          const newPts = (u.lovePoints || 0) + amount;
          const newStage = (newPts >= 1000 ? 5 : newPts >= 500 ? 4 : newPts >= 300 ? 3 : newPts >= 100 ? 2 : 1) as any;
          return { ...u, lovePoints: newPts, gardenStage: newStage };
        }
        return u;
      });
      saveStoredData(STORAGE_KEYS.ADMIN_USERS, next);
      broadcastMessage('SYNC_ADMIN_USERS', next);
      return next;
    });

    setAdminMetrics(prev => {
      const next = { ...prev, totalLovePoints: prev.totalLovePoints + amount };
      saveStoredData(STORAGE_KEYS.ADMIN_METRICS, next);
      broadcastMessage('SYNC_ADMIN_METRICS', next);
      return next;
    });

    setAdminLogs(prev => {
      const next = [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          action: `${byUser} đã thực hiện: ${actionName} (+${amount} pts)`,
          actor: byUser,
          target: 'Love Garden',
          timestamp: 'Vừa xong',
          type: 'garden' as const,
          status: 'success' as const,
          ip: '127.0.0.1'
        },
        ...prev
      ];
      saveStoredData(STORAGE_KEYS.ADMIN_LOGS, next);
      broadcastMessage('SYNC_ADMIN_LOGS', next);
      return next;
    });
  };

  // -----------------------------------------------------------------
  // INTERACTION HANDLERS (CHĂM SÓC CÂY CÓ COOLDOWN, HẠN MỨC & THỜI GIAN THỰC)
  // -----------------------------------------------------------------
  const handleWaterGarden = (e?: React.MouseEvent) => {
    // 1. Calculate decayed metrics first based on UTC time
    const currentDecayed = calculateDecayedMetrics(gardenMetrics);
    const cooldownRemaining = getCooldownRemaining(currentDecayed.lastWaterUtc);

    // Chặn spam nếu đang trong cooldown hoặc đã đạt 100%
    if (cooldownRemaining > 0 || currentDecayed.moisture >= 100 || isWatering) {
      playSound('error');
      return;
    }

    playSound('water');
    setIsWatering(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsWatering(false);
      playSound('success');

      const nowIso = new Date().toISOString();
      const nextMoisture = Math.min(100, currentDecayed.moisture + GARDEN_CONFIG.ACTION_BOOST.WATER_MOISTURE);
      const nextMetrics: GardenEcoMetrics = {
        ...currentDecayed,
        moisture: nextMoisture,
        lastWaterUtc: nowIso,
        lastUpdateUtc: nowIso,
      };

      setGardenMetrics(nextMetrics);
      saveStoredData(STORAGE_KEYS.GARDEN_METRICS, nextMetrics);
      broadcastMessage('SYNC_GARDEN_METRICS', nextMetrics);

      addPoints(GARDEN_CONFIG.ACTION_POINTS.WATER, 'Tưới nước cho cây tình yêu', couple.userA.name, 'water');

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Vườn hoa đã được tưới',
          message: `🌸 Cây tình yêu tràn đầy sức sống (+${GARDEN_CONFIG.ACTION_POINTS.WATER} Love Points, Độ ẩm ${nextMoisture}%)!`,
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  const handleFertilizeGarden = (e?: React.MouseEvent) => {
    const currentDecayed = calculateDecayedMetrics(gardenMetrics);
    const cooldownRemaining = getCooldownRemaining(currentDecayed.lastFertilizeUtc);

    if (cooldownRemaining > 0 || currentDecayed.freshness >= 100 || isFertilizing) {
      playSound('error');
      return;
    }

    playSound('click');
    setIsFertilizing(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsFertilizing(false);
      playSound('success');

      const nowIso = new Date().toISOString();
      const nextFreshness = Math.min(100, currentDecayed.freshness + GARDEN_CONFIG.ACTION_BOOST.FERTILIZE_FRESHNESS);
      const nextMetrics: GardenEcoMetrics = {
        ...currentDecayed,
        freshness: nextFreshness,
        lastFertilizeUtc: nowIso,
        lastUpdateUtc: nowIso,
      };

      setGardenMetrics(nextMetrics);
      saveStoredData(STORAGE_KEYS.GARDEN_METRICS, nextMetrics);
      broadcastMessage('SYNC_GARDEN_METRICS', nextMetrics);

      addPoints(GARDEN_CONFIG.ACTION_POINTS.FERTILIZE, 'Bón phân hữu cơ & vun xới đất', couple.userA.name, 'fertilize');

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Đất vườn đã được bón phân',
          message: `🌿 ${couple.userA.name} vừa bón dưỡng chất cho đất (+${GARDEN_CONFIG.ACTION_POINTS.FERTILIZE} Love Points, Tươi tốt ${nextFreshness}%)!`,
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  const handleSunGarden = (e?: React.MouseEvent) => {
    const currentDecayed = calculateDecayedMetrics(gardenMetrics);
    const cooldownRemaining = getCooldownRemaining(currentDecayed.lastSunUtc);

    if (cooldownRemaining > 0 || currentDecayed.sunlight >= 100 || isSunbathing) {
      playSound('error');
      return;
    }

    playSound('chime');
    setIsSunbathing(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsSunbathing(false);
      playSound('success');

      const nowIso = new Date().toISOString();
      const nextSun = Math.min(100, currentDecayed.sunlight + GARDEN_CONFIG.ACTION_BOOST.SUNBATH_SUNLIGHT);
      const nextMetrics: GardenEcoMetrics = {
        ...currentDecayed,
        sunlight: nextSun,
        lastSunUtc: nowIso,
        lastUpdateUtc: nowIso,
      };

      setGardenMetrics(nextMetrics);
      saveStoredData(STORAGE_KEYS.GARDEN_METRICS, nextMetrics);
      broadcastMessage('SYNC_GARDEN_METRICS', nextMetrics);

      addPoints(GARDEN_CONFIG.ACTION_POINTS.SUNBATH, 'Tắm nắng ấm ban mai cho mầm hoa', couple.userA.name, 'sun');

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Mầm hoa đã đón ánh nắng',
          message: `☀️ Cây tình yêu quang hợp tươi tốt (+${GARDEN_CONFIG.ACTION_POINTS.SUNBATH} Love Points, Ánh nắng ${nextSun}%)!`,
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  // Handler khi hoàn thành cây và chuyển sang chu kỳ cây mới
  const handleEvolveTree = () => {
    const nowIso = new Date().toISOString();
    const nextMetrics: GardenEcoMetrics = {
      moisture: GARDEN_CONFIG.INITIAL_STATS.MOISTURE,
      freshness: GARDEN_CONFIG.INITIAL_STATS.FRESHNESS,
      sunlight: GARDEN_CONFIG.INITIAL_STATS.SUNLIGHT,
      lastUpdateUtc: nowIso,
      lastWaterUtc: null,
      lastFertilizeUtc: null,
      lastSunUtc: null,
      completedCycles: (gardenMetrics.completedCycles || 0) + 1,
    };

    setGardenMetrics(nextMetrics);
    saveStoredData(STORAGE_KEYS.GARDEN_METRICS, nextMetrics);
    broadcastMessage('SYNC_GARDEN_METRICS', nextMetrics);

    // Thưởng 50 điểm hoàn thành cây
    addPoints(50, 'Hoàn thành cây tình yêu viên mãn & Gieo mầm cây mới', couple.userA.name);

    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: 'Khu vườn kết trái ngọt lành!',
        message: '🌸 Chúc mừng hai bạn đã hoàn thành một cây tình yêu viên mãn! Cây mới đã bắt đầu đâm chồi (+50 Love Points)!',
        time: 'Vừa xong',
        type: 'garden',
        read: false
      },
      ...prev
    ]);
  };

  // -----------------------------------------------------------------
  // SHARED SPACE / MEMORIES HANDLERS (F06)
  // -----------------------------------------------------------------
  const isAddingMemoryRef = React.useRef(false);
  const handleAddMemory = async (
    newMemory: Omit<MemoryItem, 'id' | 'createdAt' | 'likes' | 'isLiked'>,
    imageFile?: File,
  ) => {
    if (isAddingMemoryRef.current) return;
    isAddingMemoryRef.current = true;
    try {
      if (!isDemoMode) {
        if (!imageFile) {
          throw new Error('Vui lòng chọn một ảnh hợp lệ để tải lên.');
        }
        const saved = await memoryService.createMemory(newMemory.caption, imageFile);
        timelineRevision.current++;
        setBackendMemories(prev => [mapBackendMemory(saved), ...prev.filter(memory => memory.id !== saved.id)]);
        return;
      }

    const created: MemoryItem = {
      ...newMemory,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      likes: 1,
      isLiked: true,
      createdAt: 'Vừa xong',
    };

    setMemories(prev => {
      const next = [created, ...prev];
      saveStoredData(STORAGE_KEYS.MEMORIES, next);
      broadcastMessage('SYNC_MEMORIES', next);
      return next;
    });

    addPoints(10, `Lưu ảnh kỷ niệm: ${newMemory.caption.slice(0, 20)}...`, newMemory.authorName);
    playSound('success');
    triggerHeartBurst();

    // Sync to Admin Portal
    setAdminMetrics(prev => {
      const next = { ...prev, totalMemories: prev.totalMemories + 1 };
      saveStoredData(STORAGE_KEYS.ADMIN_METRICS, next);
      broadcastMessage('SYNC_ADMIN_METRICS', next);
      return next;
    });

    const newLog: AdminActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action: `${newMemory.authorName} vừa đăng ảnh kỷ niệm mới: "${newMemory.caption.slice(0, 25)}..."`,
      actor: newMemory.authorName,
      target: 'Shared Space',
      timestamp: 'Vừa xong',
      type: 'content',
      status: 'success',
      ip: '127.0.0.1'
    };

    setAdminLogs(prev => {
      const next = [newLog, ...prev];
      saveStoredData(STORAGE_KEYS.ADMIN_LOGS, next);
      broadcastMessage('SYNC_ADMIN_LOGS', next);
      return next;
    });

    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: 'Kỷ niệm mới trong Không Gian Chung ✨',
        message: `${newMemory.authorName} vừa lưu một bức ảnh mới: "${newMemory.caption.slice(0, 30)}..."`,
        time: 'Vừa xong',
        type: 'memory',
        read: false,
      },
      ...prev
    ]);
    } finally {
      isAddingMemoryRef.current = false;
    }
  };

  const handleEditMemory = (id: string, updated: Partial<MemoryItem>) => {
    setMemories(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updated } : m);
      saveStoredData(STORAGE_KEYS.MEMORIES, next);
      broadcastMessage('SYNC_MEMORIES', next);
      return next;
    });
    playSound('click');
  };

  const handleDeleteMemory = async (id: string) => {
    if (!isDemoMode) {
      await memoryService.deleteMemory(id);
      timelineRevision.current++;
      setBackendMemories(prev => prev.filter(memory => memory.id !== id));
      void refreshBackendMemories();
      return;
    }

    setMemories(prev => {
      const next = prev.filter(m => m.id !== id);
      saveStoredData(STORAGE_KEYS.MEMORIES, next);
      broadcastMessage('SYNC_MEMORIES', next);
      return next;
    });
    playSound('click');
  };

  const handleLikeMemory = async (id: string) => {
    // 1. Calculate next like state and persist to localStorage
    const likesMap = getMemoryLikesMap();
    const current = likesMap[id] || { likes: 0, isLiked: false };
    const nextLiked = !current.isLiked;
    const nextLikes = nextLiked ? current.likes + 1 : Math.max(0, current.likes - 1);
    likesMap[id] = { likes: nextLikes, isLiked: nextLiked };
    saveMemoryLikesMap(likesMap);

    // 2. Update demo memories
    setMemories(prev => {
      const next = prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            isLiked: nextLiked,
            likes: nextLikes
          };
        }
        return m;
      });
      saveStoredData(STORAGE_KEYS.MEMORIES, next);
      broadcastMessage('SYNC_MEMORIES', next);
      return next;
    });

    // 3. Update backend memories immediately for snappy UI
    setBackendMemories(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          isLiked: nextLiked,
          likes: nextLikes
        };
      }
      return m;
    }));

    broadcastMessage('SYNC_MEMORY_LIKES', { id, likes: nextLikes, isLiked: nextLiked });
    playSound('ping');
  };

  const handleSaveMemory = () => {
    playSound('click');
    setCurrentScreen('shared');
  };

  // -----------------------------------------------------------------
  // AI DATING PLANNER HANDLERS (WITH BR05 RULE CHECK)
  // -----------------------------------------------------------------
  const handleGenerateDatePlan = (params: {
    budget: number;
    time: string;
    location: string;
    foodPref: string;
    activityPref: DateType;
    simulateBr05Error?: boolean;
  }) => {
    setIsGeneratingPlan(true);

    setTimeout(() => {
      setIsGeneratingPlan(false);
      playSound('chime');

      // Rule BR05: If simulated violation is true, make totalCost > budget
      const targetCost = params.simulateBr05Error
        ? params.budget + 25 // Intentionally violate BR05 for QA testing
        : Math.max(10, Math.floor(params.budget * 0.9)); // Satisfy BR05

      const newPlan: DatePlan = {
        id: `plan_${Date.now()}`,
        title: params.activityPref === 'Romantic'
          ? 'Bữa Tối Ánh Nến & Dạo Phố Cổ'
          : params.activityPref === 'Cozy'
          ? 'Tiệm Trà Hoa & Workshop Bánh Ngọt'
          : 'Dã Ngoại Sunset & Đạp Xe Đôi',
        type: params.activityPref,
        budget: params.budget,
        totalCost: targetCost,
        duration: '3 tiếng',
        location: params.location,
        foodPreference: params.foodPref,
        activityPreference: params.activityPref,
        summary: `Buổi hẹn phong cách ${params.activityPref} được AI may đo chuẩn xác cho khung giờ ${params.time}, thưởng thức ${params.foodPref} tại ${params.location}.`,
        timeline: [
          {
            time: '18:00',
            activity: 'Đón người ấy & trao nhành hoa nhỏ',
            location: params.location,
            cost: Math.floor(targetCost * 0.15),
            tip: 'Trao nhau cái ôm ấm áp trước khi xuất phát'
          },
          {
            time: '18:45',
            activity: `Thưởng thức ${params.foodPref}`,
            location: 'Nhà hàng / Quán quen lãng mạn',
            cost: Math.floor(targetCost * 0.65),
            tip: 'Hỏi người ấy 3 điều đáng yêu nhất hôm nay'
          },
          {
            time: '20:15',
            activity: 'Dạo mát & chia sẻ tai nghe bản nhạc quen',
            location: 'Cung đường đi bộ ánh sao',
            cost: Math.max(5, targetCost - Math.floor(targetCost * 0.15) - Math.floor(targetCost * 0.65)),
            tip: 'Cùng chụp 1 bức ảnh polaroid kỷ niệm'
          }
        ],
        coupleTip: 'Hãy cùng nhìn vào mắt nhau ít nhất 60 giây và mỉm cười!',
        isSaved: false,
        isCompleted: false,
        createdAt: 'Vừa xong'
      };

      setActivePlan(newPlan);
      setDatePlans(prev => [newPlan, ...prev]);
      setAdminMetrics(prev => ({
        ...prev,
        totalDatePlans: prev.totalDatePlans + 1,
        aiQueriesToday: prev.aiQueriesToday + 1
      }));
      addPoints(5, 'Tạo kế hoạch hẹn hò với AI', couple.userA.name);
    }, 1100);
  };

  const handleSavePlan = (plan: DatePlan) => {
    setActivePlan(prev => prev ? { ...prev, isSaved: true } : null);
    addPoints(10, `Lưu kế hoạch "${plan.title}"`, couple.userA.name);
  };

  const handleCompletePlan = (plan: DatePlan) => {
    setActivePlan(prev => prev ? { ...prev, isCompleted: true } : null);
    addPoints(20, `Hoàn thành buổi hẹn "${plan.title}"`, 'Alex & Sam');
  };

  // -----------------------------------------------------------------
  // CONNECTION STATUS & LOVE DAY UPDATES
  // -----------------------------------------------------------------
  const handleSaveStatus = (status: ConnectionStatusType, activity?: ConnectionActivityType) => {
    setCouple(prev => {
      const next = {
        ...prev,
        userA: {
          ...prev.userA,
          status,
          activity
        }
      };
      saveStoredData(STORAGE_KEYS.COUPLE, next);
      broadcastMessage('SYNC_COUPLE', next);
      return next;
    });
    setIsStatusModalOpen(false);
  };

  const isSavingLoveDaysRef = React.useRef(false);
  const handleSaveStartDate = async (newStartDate: string) => {
    if (isSavingLoveDaysRef.current) return;
    isSavingLoveDaysRef.current = true;
    try {
      if (getStoredToken() && couple.isPaired) {
        await coupleService.setLoveStartDate(newStartDate);
      }
      setCouple(prev => {
        const next: CoupleData = {
          ...prev,
          startDate: newStartDate
        };
        saveStoredData(STORAGE_KEYS.COUPLE, next);
        safeSetItem('lovera_anniversary_date', newStartDate);
        if (prev.coupleId) {
          safeSetItem(`lovera_anniversary_date_${prev.coupleId.toLowerCase()}`, newStartDate);
        }
        broadcastMessage('SYNC_COUPLE', next);
        return next;
      });
      setIsLoveDayModalOpen(false);
    } finally {
      isSavingLoveDaysRef.current = false;
    }
  };

  const handleUpdateNicknames = async (nameA: string, nameB: string) => {
    const trimmedA = nameA.trim() || couple.userA.name;
    const trimmedB = nameB.trim() || couple.userB.name;

    if (isGuid(trimmedA) || isGuid(trimmedB)) {
      console.warn('[App] Rejected GUID nickname');
      return;
    }

    safeSetItem('lovera_my_nickname', trimmedA);
    safeSetItem('lovera_partner_nickname', trimmedB);

    const storedProfile = getStoredUserProfile<{ id?: string; email?: string }>();
    const myId = storedProfile?.id || couple.userA.id;
    const myEmail = storedProfile?.email || couple.userA.email;
    const otherId = couple.userB.id;

    if (otherId && otherId !== 'usr_partner') {
      safeSetItem(`lovera_partner_name_${otherId.toLowerCase()}`, trimmedB);
      saveKnownUser({ id: otherId, name: trimmedB });
    }
    if (couple.coupleId) {
      safeSetItem(`lovera_partner_name_${couple.coupleId}`, trimmedB);
    }
    if (myId) {
      saveKnownUser({ id: myId, name: trimmedA });
    }

    setCouple(prev => {
      const next: CoupleData = {
        ...prev,
        userA: { ...prev.userA, name: trimmedA },
        userB: { ...prev.userB, name: trimmedB }
      };
      saveStoredData(STORAGE_KEYS.COUPLE, next);

      broadcastMessage('SYNC_NICKNAMES', {
        senderId: myId,
        senderEmail: myEmail,
        senderName: trimmedA,
        partnerName: trimmedB,
      });
      broadcastMessage('SYNC_COUPLE', next);

      return next;
    });

    if (getStoredToken()) {
      try {
        await authService.updateProfile({ displayName: trimmedA });
      } catch (err) {
        console.warn('[App] Real updateProfile error:', err);
      }
    }

    if (getStoredToken() && couple.isPaired && !isDemoMode) {
      try {
        await memoryService.createMemory(
          `[NICKNAME_PAIR]:${JSON.stringify({
            senderId: couple.userA.id,
            senderName: trimmedA,
            partnerName: trimmedB,
            timestamp: Date.now()
          })}`
        );
      } catch (err) {
        console.warn('[App] Real sync nickname memory error:', err);
      }
    }

    setAdminUsers(prev => prev.map(u => {
      if (u.id === 'usr_alex') return { ...u, name: trimmedA };
      if (u.id === 'usr_sam') return { ...u, name: trimmedB };
      return u;
    }));
    setAdminLogs(prev => [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Cập nhật biệt danh cặp đôi: "${trimmedA}" & "${trimmedB}"`,
        actor: trimmedA,
        target: 'Profile',
        timestamp: 'Vừa xong',
        type: 'auth',
        status: 'success',
        ip: '127.0.0.1'
      },
      ...prev
    ]);
  };

  const handleUpdateUserAvatar = async (newAvatarUrl: string, file: File) => {
    const session = getSessionKey();
    const storedProfile = getStoredUserProfile<{ id?: string; email?: string }>();
    const myId = storedProfile?.id || couple.userA.id;
    const myName = couple.userA.name;
    const myEmail = storedProfile?.email || couple.userA.email;

    // 1. Cập nhật ngay lập tức giao diện & LocalStorage (Optimistic Update)
    // Đảm bảo ảnh đã crop/zoom được áp dụng ngay lập tức mà không bị kẹt khi backend 429 rate limit
    safeSetItem('lovera_my_avatar', newAvatarUrl);
    safeSetItem('lovera_alex_avatar', newAvatarUrl);
    if (myId) {
      safeSetItem(`lovera_avatar_${myId.toLowerCase()}`, newAvatarUrl);
      saveUserAvatar(myId, newAvatarUrl);
    }
    if (myName) saveUserAvatar(myName, newAvatarUrl);
    if (myEmail) saveUserAvatar(myEmail, newAvatarUrl);
    saveUserAvatar('me', newAvatarUrl);
    saveKnownUser({ id: myId, name: myName, email: myEmail, avatar: newAvatarUrl });

    setCouple(prev => {
      const next = {
        ...prev,
        userA: { ...prev.userA, avatar: newAvatarUrl }
      };
      saveStoredData(STORAGE_KEYS.COUPLE, next);

      broadcastMessage('SYNC_AVATAR', {
        senderId: myId,
        senderName: myName,
        senderEmail: myEmail,
        avatar: newAvatarUrl
      });
      broadcastMessage('SYNC_COUPLE', next);

      return next;
    });

    setAdminUsers(prev => prev.map(u => {
      if (u.id === 'usr_alex' || (myId && u.id === myId)) return { ...u, avatar: newAvatarUrl };
      return u;
    }));

    // 2. Gửi tệp ảnh đã crop lên máy chủ backend để lưu vĩnh viễn
    if (!isDemoMode && getStoredToken()) {
      try {
        const profile = await authService.uploadAvatar(file);
        if (profile?.avatarUrl && isCurrentSession(session)) {
          saveUserAvatar('me', profile.avatarUrl);
        }
      } catch (err) {
        console.warn('[App] uploadAvatar to backend rate limited or failed:', err);
        // Không throw lỗi ra ngoài để tránh làm hỏng trạng thái avatar đã zoom của người dùng
      }
    }
  };

  const handleUnpair = async () => {
    const session = getSessionKey();
    playSound('error');

    // 1. Call Real Backend API to release the couple on the server database
    if (!isDemoMode && getStoredToken()) {
      try {
        await coupleService.unpair(true);
      } catch (err) {
        console.warn('[App] Real unpair API failed:', err);
      }
    }

    if (!isCurrentSession(session)) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Reset couple state cleanly: User A stays logged in, partner B and shared data reset
    const nextCouple: CoupleData = {
      ...couple,
      coupleId: '',
      pairCode: '',
      startDate: todayStr,
      isPaired: false,
      lovePoints: 0,
      userB: {
        id: '',
        name: 'Chưa kết nối',
        avatar: INITIAL_COUPLE.userB.avatar,
        email: '',
        status: 'Away',
        isOnline: false,
        batteryLevel: 0
      }
    };

    setBackendMemories([]);
    setCouple(nextCouple);
    saveStoredData(STORAGE_KEYS.COUPLE, nextCouple);
    broadcastMessage('SYNC_COUPLE', nextCouple);

    // 3. Add unpair notification
    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: 'Đã hủy kết nối cặp đôi',
        message: 'Bạn đã hủy liên kết thành công trên hệ thống. Bạn có thể tạo mã mới để ghép đôi với người khác.',
        time: 'Vừa xong',
        type: 'status',
        read: false
      },
      ...prev
    ]);

    // 4. Direct transition to Pairing Screen at 'idle' stage
    setPairingInitialStage('idle');
    setPairingBannerMessage('Đã hủy kết nối cặp đôi thành công. Bạn có thể tạo mã mới hoặc nhập mã để ghép đôi!');
    setCurrentScreen('pairing');
  };

  const handleLogout = async () => {
    const session = getSessionKey();
    playSound('click');
    try {
      if (getStoredToken()) {
        await authService.logout();
      }
    } catch (err) {
      console.warn('[App] Real logout API error:', err);
    } finally {
      // A late logout from another session must not clear the new account.
      if (getStoredToken() && session !== getSessionKey()) return;
      clearStoredToken();
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.COUPLE);
      localStorage.removeItem(STORAGE_KEYS.MEMORIES);
      localStorage.removeItem('lovera_partner_nickname');
    } catch {}

    const loggedOutCouple: CoupleData = {
      ...INITIAL_COUPLE,
      coupleId: '',
      pairCode: '',
      isPaired: false,
      lovePoints: 0,
      userA: {
        id: '',
        name: 'Chưa đăng nhập',
        avatar: INITIAL_COUPLE.userA.avatar,
        email: '',
        status: 'Away',
        isOnline: false,
        batteryLevel: 0,
      },
      userB: {
        id: '',
        name: 'Chưa kết nối',
        avatar: INITIAL_COUPLE.userB.avatar,
        email: '',
        status: 'Away',
        isOnline: false,
        batteryLevel: 0,
      },
    };

    setCouple(loggedOutCouple);
    saveStoredData(STORAGE_KEYS.COUPLE, loggedOutCouple);
    setBackendMemories([]);
    setPairingBannerMessage('');
    setPairingInitialStage('idle');
    setIsDemoMode(false);
    setCurrentScreen('welcome');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isTabScreen = couple.isPaired 
    ? ['home', 'shared', 'chat', 'planner', 'garden', 'profile'].includes(currentScreen)
    : ['pairing', 'profile'].includes(currentScreen);
  const handleToggleLockUser = (userId: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = !u.isLocked;
        const newLog: AdminActivityLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          action: updated ? `Khóa tài khoản ${u.name}` : `Mở khóa tài khoản ${u.name}`,
          actor: 'admin@lovera.app',
          target: u.email,
          timestamp: 'Vừa xong',
          type: 'auth',
          status: updated ? 'warning' : 'success',
          ip: '127.0.0.1'
        };
        setAdminLogs(l => [newLog, ...l]);
        return { ...u, isLocked: updated };
      }
      return u;
    }));
  };

  const handleAdjustPoints = (userId: string, newPoints: number) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, lovePoints: newPoints };
      }
      return u;
    }));
    if (userId === 'usr_alex' || userId === 'usr_sam') {
      setCouple(prev => ({
        ...prev,
        lovePoints: newPoints
      }));
    }
    const newLog: AdminActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action: `Điều chỉnh Love Points thành ${newPoints} pts`,
      actor: 'admin@lovera.app',
      target: `User ID: ${userId}`,
      timestamp: 'Vừa xong',
      type: 'garden',
      status: 'success',
      ip: '127.0.0.1'
    };
    setAdminLogs(l => [newLog, ...l]);
  };

  const handleDeleteAdminMemory = (memoryId: string) => {
    handleDeleteMemory(memoryId);
    setAdminMetrics(prev => {
      const next = { ...prev, totalMemories: Math.max(0, prev.totalMemories - 1) };
      saveStoredData(STORAGE_KEYS.ADMIN_METRICS, next);
      broadcastMessage('SYNC_ADMIN_METRICS', next);
      return next;
    });
    const newLog: AdminActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action: `Gỡ bỏ bài viết kỷ niệm ID: ${memoryId}`,
      actor: 'admin@lovera.app',
      target: 'Shared Space',
      timestamp: 'Vừa xong',
      type: 'content',
      status: 'warning',
      ip: '127.0.0.1'
    };
    setAdminLogs(l => {
      const next = [newLog, ...l];
      saveStoredData(STORAGE_KEYS.ADMIN_LOGS, next);
      broadcastMessage('SYNC_ADMIN_LOGS', next);
      return next;
    });
  };

  const handleDeleteAdminDatePlan = (planId: string) => {
    setDatePlans(prev => {
      const next = prev.filter(p => p.id !== planId);
      saveStoredData(STORAGE_KEYS.DATE_PLANS, next);
      broadcastMessage('SYNC_DATE_PLANS', next);
      return next;
    });
    setAdminMetrics(prev => {
      const next = { ...prev, totalDatePlans: Math.max(0, prev.totalDatePlans - 1) };
      saveStoredData(STORAGE_KEYS.ADMIN_METRICS, next);
      broadcastMessage('SYNC_ADMIN_METRICS', next);
      return next;
    });
    const newLog: AdminActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      action: `Xóa kế hoạch hẹn hò ID: ${planId}`,
      actor: 'admin@lovera.app',
      target: 'Date Plans',
      timestamp: 'Vừa xong',
      type: 'content',
      status: 'warning',
      ip: '127.0.0.1'
    };
    setAdminLogs(l => {
      const next = [newLog, ...l];
      saveStoredData(STORAGE_KEYS.ADMIN_LOGS, next);
      broadcastMessage('SYNC_ADMIN_LOGS', next);
      return next;
    });
  };

  if (currentScreen === 'admin') {
    return (
      <AdminPortal
        metrics={adminMetrics}
        users={adminUsers}
        logs={adminLogs}
        memories={memories}
        datePlans={datePlans}
        onToggleLockUser={handleToggleLockUser}
        onAdjustPoints={handleAdjustPoints}
        onDeleteMemory={handleDeleteAdminMemory}
        onDeleteDatePlan={handleDeleteAdminDatePlan}
        onBackToCoupleApp={navigateToCoupleApp}
        onManualSync={handleManualSync}
      />
    );
  }

  const isHomeScreen = currentScreen === 'home';

  return (
    <div className={`${isHomeScreen ? 'h-dvh min-h-0 justify-start' : 'min-h-screen justify-center'} bg-stone-100 flex flex-col items-center font-sans antialiased text-stone-800 p-0 sm:p-4`}>
      
      {/* Top Device Bar (Desktop view controls) */}
      <aside aria-label="Khung thiết bị & Điều khiển thử nghiệm" className="hidden sm:flex items-center justify-between w-full max-w-[420px] mb-2 px-2 text-xs text-stone-500">
        <div className="flex items-center gap-1.5 font-bold text-rose-600">
          <Heart className="w-3.5 h-3.5 fill-rose-500" />
          <span>LOVERA Couple App (MVP 2026)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceFrame(!deviceFrame)}
            className="px-2 py-1 bg-white hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200 text-[11px] flex items-center gap-1 transition-colors"
          >
            {deviceFrame ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            <span>{deviceFrame ? 'Viền điện thoại' : 'Tràn màn hình'}</span>
          </button>
        </div>
      </aside>

      {/* Main Mobile App Container */}
      <main
        className={`w-full max-w-[420px] bg-white relative flex flex-col overflow-hidden transition-all duration-300 ${
          isHomeScreen
            ? 'flex-1 min-h-0 pt-[env(safe-area-inset-top)]'
            : 'min-h-[660px] h-[92vh] max-h-[890px]'
        } ${
          deviceFrame
            ? 'sm:rounded-[44px] sm:shadow-2xl sm:border-[10px] sm:border-stone-900 ring-1 ring-stone-900/10'
            : 'rounded-none shadow-none border-0'
        }`}
      >
        {/* Smartphone Notch & Speaker Bar */}
        {deviceFrame && (
          <div className="hidden sm:flex items-center justify-center pt-2.5 pb-1 bg-white shrink-0 z-40">
            <div className="w-24 h-4 bg-stone-900 rounded-full flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-800 border border-stone-700"></div>
              <div className="w-10 h-1 rounded-full bg-stone-700"></div>
            </div>
          </div>
        )}

        {/* Top Sticky Header (for Tab Screens when paired) */}
        {isTabScreen && couple.isPaired && (
          <Header
            currentUser={couple.userA}
            unreadNotifications={unreadCount}
            onOpenNotifications={() => {
              playSound('click');
              setIsNotificationsModalOpen(true);
            }}
            onOpenSettings={() => {
              playSound('click');
              setCurrentScreen('profile');
            }}
          />
        )}

        {/* Scrollable Screen Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full bg-gradient-to-b from-stone-50/70 via-rose-50/20 to-purple-50/30 relative">
          
          {/* Welcome Screen (Lựa chọn Đăng Ký hoặc Đăng Nhập) */}
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onNavigateToLogin={() => {
                playSound('click');
                setCurrentScreen('login');
              }}
              onNavigateToRegister={() => {
                playSound('click');
                setCurrentScreen('register');
              }}
            />
          )}

          {/* Register Screen (Form tạo tài khoản & validation) */}
          {currentScreen === 'register' && (
            <RegisterScreen
              onRegisterSuccess={(email, name, demoMode) => {
                setIsDemoMode(demoMode);
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: false,
                }));
                setPairingInitialStage('idle');
                setPairingBannerMessage('');
                setCurrentScreen('pairing');
              }}
              onNavigateToLogin={() => {
                playSound('click');
                setCurrentScreen('login');
              }}
              onBackToWelcome={() => {
                playSound('click');
                setCurrentScreen('welcome');
              }}
            />
          )}

          {/* Login Screen (Form đăng nhập, validation, chuyển tiếp theo trạng thái ghép đôi) */}
          {currentScreen === 'login' && (
            <LoginScreen
              onLoginSuccess={(email, name, isAlreadyPaired, demoMode) => {
                setIsDemoMode(demoMode);
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: isAlreadyPaired,
                }));
                if (isAlreadyPaired) {
                  // Session scheduler restores profile/couple and loads memories once.
                  setCurrentScreen('home');
                } else {
                  setPairingInitialStage('idle');
                  setPairingBannerMessage('');
                  setCurrentScreen('pairing');
                }
              }}
              onNavigateToRegister={() => {
                playSound('click');
                setCurrentScreen('register');
              }}
              onBackToWelcome={() => {
                playSound('click');
                setCurrentScreen('welcome');
              }}
            />
          )}

          {/* Backward compatibility for auth screen */}
          {currentScreen === 'auth' && (
            <LoginScreen
              onLoginSuccess={(email, name, isAlreadyPaired, demoMode) => {
                setIsDemoMode(demoMode);
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: isAlreadyPaired,
                }));
                if (isAlreadyPaired) {
                  // Session scheduler restores profile/couple and loads memories once.
                  setCurrentScreen('home');
                } else {
                  setPairingInitialStage('idle');
                  setPairingBannerMessage('');
                  setCurrentScreen('pairing');
                }
              }}
              onNavigateToRegister={() => setCurrentScreen('register')}
              onBackToWelcome={() => setCurrentScreen('welcome')}
            />
          )}

          {/* Couple Pairing Screen (5 bước: Chưa kết nối, Tạo mã 6 ký tự, Nhập mã, Chờ xác nhận, Ghép đôi thành công) */}
          {currentScreen === 'pairing' && (
            <PairingScreen
              key={`pairing_${couple.pairCode}_${pairingInitialStage}`}
              myPairCode={couple.pairCode}
              initialStage={pairingInitialStage}
              currentUser={couple.userA}
              bannerMessage={pairingBannerMessage}
              onOpenProfile={() => setCurrentScreen('profile')}
              onBackToAuth={() => {
                setPairingBannerMessage('');
                setCurrentScreen('welcome');
              }}
              onPairSuccess={(partnerInfo) => {
                const rawCandidateName = typeof partnerInfo === 'string' ? partnerInfo : partnerInfo.name;
                const cleanCandidateName = (rawCandidateName && !isGuid(rawCandidateName) && rawCandidateName !== 'Người Thương') ? rawCandidateName.trim() : '';
                const partnerName = cleanCandidateName;
                const partnerEmail = typeof partnerInfo === 'string' ? 'partner@lovera.app' : (partnerInfo.email || '');
                const partnerAvatar = typeof partnerInfo === 'string' ? INITIAL_COUPLE.userB.avatar : (partnerInfo.avatar || INITIAL_COUPLE.userB.avatar);
                const partnerId = typeof partnerInfo === 'string' ? 'usr_partner' : (partnerInfo.id || 'usr_partner');
                if (partnerId && partnerName && partnerName !== 'Người Thương' && !isGuid(partnerName)) {
                  saveKnownUser({ id: partnerId, name: partnerName });
                  if (partnerId !== 'usr_partner') {
                    safeSetItem(`lovera_partner_name_${partnerId.toLowerCase()}`, partnerName);
                  }
                  safeSetItem('lovera_partner_nickname', partnerName);
                }
                const savedPartnerName =
                  (partnerId && partnerId !== 'usr_partner' ? localStorage.getItem(`lovera_partner_name_${partnerId.toLowerCase()}`) : null) ||
                  (localStorage.getItem('lovera_partner_nickname') && localStorage.getItem('lovera_partner_nickname') !== 'Người Thương' ? localStorage.getItem('lovera_partner_nickname') : null);

                const cleanSavedPartnerName = (savedPartnerName && !isGuid(savedPartnerName) && savedPartnerName !== 'Người Thương') ? savedPartnerName : '';
                const finalPartnerName = partnerName || cleanSavedPartnerName || 'Người Thương';

                const nextCouple: CoupleData = {
                  ...couple,
                  isPaired: true,
                  startDate: couple.startDate || new Date().toISOString().split('T')[0],
                  lovePoints: couple.lovePoints > 0 ? couple.lovePoints : 100,
                  userB: {
                    ...couple.userB,
                    id: partnerId,
                    name: finalPartnerName,
                    email: partnerEmail,
                    avatar: partnerAvatar,
                    status: 'Available',
                    isOnline: true,
                  }
                };
                setCouple(nextCouple);
                saveStoredData(STORAGE_KEYS.COUPLE, nextCouple);
                broadcastMessage('SYNC_COUPLE', nextCouple);
                setPairingBannerMessage('');
                setCurrentScreen('home');
                void syncAuthenticatedCouple();
              }}
            />
          )}

          {currentScreen === 'splash' && (
            <SplashScreen
              onStart={() => setCurrentScreen('welcome')}
              onSkipToLogin={() => setCurrentScreen('login')}
            />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingScreen onFinish={() => setCurrentScreen('welcome')} />
          )}

          {currentScreen === 'home' && (
            <HomeScreen
              couple={couple}
              onUpdatePartnerNickname={(newName) => handleUpdateNicknames(couple.userA.name, newName)}
              recentMemories={isDemoMode ? memories : backendMemories}
              isBackendMode={!isDemoMode}
              isLoadingMemories={!isDemoMode && isLoadingBackendMemories}
              onUpdateAvatar={handleUpdateUserAvatar}
              onOpenStatusModal={() => {
                playSound('click');
                setIsStatusModalOpen(true);
              }}
              onOpenLoveDayModal={() => {
                playSound('click');
                setIsLoveDayModalOpen(true);
              }}
              onNavigateToPairing={() => {
                setPairingInitialStage('create');
                setCurrentScreen('pairing');
              }}
              onNavigateToProfile={() => {
                setCurrentScreen('profile');
              }}
              onNavigateToShared={() => {
                setCurrentScreen('shared');
              }}
            />
          )}

          {currentScreen === 'shared' && (
            <SharedSpaceScreen
              couple={couple}
              memories={isDemoMode ? memories : backendMemories}
              isBackendMode={!isDemoMode}
              isLoadingMemories={!isDemoMode && isLoadingBackendMemories}
              memoriesError={!isDemoMode ? backendMemoriesError : ''}
              onRetryLoadMemories={() => void refreshBackendMemories()}
              onAddMemory={handleAddMemory}
              onEditMemory={handleEditMemory}
              onDeleteMemory={handleDeleteMemory}
              onLikeMemory={handleLikeMemory}
              onNavigateToHome={() => setCurrentScreen('home')}

            />
          )}

          {(currentScreen === 'chat' || currentScreen === 'planner') && (
            <ChatbotScreen
              couple={couple}
              onEarnPoints={(amount, reason) => {
                addPoints(amount, reason, couple.userA.name);
              }}
            />
          )}

          {currentScreen === 'garden' && (
            <GardenScreen
              couple={couple}
              lovePoints={couple.lovePoints}
              history={pointHistory}
              onWater={handleWaterGarden}
              onFertilize={handleFertilizeGarden}
              onSunbath={handleSunGarden}
              onSaveMemory={handleSaveMemory}
              isWatering={isWatering}
              isFertilizing={isFertilizing}
              isSunbathing={isSunbathing}
              ecoMetrics={gardenMetrics}
              onEvolveTree={handleEvolveTree}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              couple={couple}
              onUpdateAvatar={handleUpdateUserAvatar}
              onUpdateNicknames={handleUpdateNicknames}
              onOpenLoveDayModal={() => setIsLoveDayModalOpen(true)}
              onUnpair={handleUnpair}
              onLogout={handleLogout}
              onResetDemoFlow={(scr) => {
                if (scr === 'welcome' || scr === 'login' || scr === 'register') {
                  void handleLogout();
                  setCurrentScreen(scr);
                  return;
                }
                if (scr === 'pairing') {
                  setPairingInitialStage('idle');
                  setPairingBannerMessage('');
                }
                setCurrentScreen(scr);
              }}
              onNavigateToPairing={() => {
                setPairingInitialStage('create');
                setCurrentScreen('pairing');
              }}
              onUpdateUserName={(newName) => {
                void handleUpdateNicknames(newName, couple.userB.name);
              }}
            />
          )}
        </div>

        {/* Bottom Navigation for Tab Screens */}
        {isTabScreen && (
          <BottomNav
            currentScreen={currentScreen}
            isHome={currentScreen === 'home'}
            isPaired={couple.isPaired}
            onNavigate={(scr) => {
              playSound('click');
              setCurrentScreen(scr);
            }}
            gardenNotification={false}
          />
        )}

        {/* Smartphone Home Indicator Bar */}
        {deviceFrame && (
          <div className="hidden sm:flex justify-center pb-2 bg-white shrink-0 z-40 pointer-events-none">
            <div className="w-32 h-1 bg-stone-300 rounded-full"></div>
          </div>
        )}

        {/* Modals */}
        {isStatusModalOpen && (
          <StatusModal
            currentStatus={couple.userA.status}
            currentActivity={couple.userA.activity}
            onClose={() => setIsStatusModalOpen(false)}
            onSave={handleSaveStatus}
          />
        )}

        {isLoveDayModalOpen && (
          <LoveDayModal
            currentStartDate={couple.startDate}
            onClose={() => setIsLoveDayModalOpen(false)}
            onSave={handleSaveStartDate}
          />
        )}

        {isNotificationsModalOpen && (
          <NotificationsModal
            notifications={notifications}
            onClose={() => setIsNotificationsModalOpen(false)}
            onMarkAllRead={() => {
              playSound('click');
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
          />
        )}

        {/* Floating Heart Burst Particles */}
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="fixed pointer-events-none z-50 text-rose-500 animate-soft-float"
            style={{
              left: `${heart.x}px`,
              top: `${heart.y}px`,
              transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: 'translate(-50%, -80px) scale(1.4)',
              opacity: 0
            }}
          >
            <Heart className="w-7 h-7 fill-rose-500 drop-shadow-md" />
          </div>
        ))}

      </main>

    </div>
  );
}
