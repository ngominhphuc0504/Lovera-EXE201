import React, { useState } from 'react';
import { Screen, CoupleData, DatePlan, DateType, ConnectionActivityType, ConnectionStatusType, MemoryItem, PointHistoryItem } from './types';
import { 
  INITIAL_COUPLE, 
  INITIAL_DATE_PLANS, 
  INITIAL_POINT_HISTORY, 
  INITIAL_NOTIFICATIONS,
  INITIAL_MEMORIES 
} from './data/mockData';
import { playSound } from './utils/audio';

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
import { STORAGE_KEYS, loadStoredData, saveStoredData, broadcastMessage, subscribeToSync } from './utils/syncManager';
import { getStoredToken } from './services/apiClient';
import { authService } from './services/authService';
import { coupleService } from './services/coupleService';
import { getMemoryImageUrl, memoryService } from './services/memoryService';

export default function App() {
  // Main Screen Navigation State (First-time open -> Welcome Screen)
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isDemoMode, setIsDemoMode] = useState(() => !getStoredToken());
  const [pairingInitialStage, setPairingInitialStage] = useState<PairingStage>('idle');
  const [pairingBannerMessage, setPairingBannerMessage] = useState<string>('');

  // Couple & Domain State with persistent storage across tabs & reloads
  const [couple, setCouple] = useState<CoupleData>(() =>
    loadStoredData(STORAGE_KEYS.COUPLE, INITIAL_COUPLE)
  );
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
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');

  const mapBackendMemory = (item: Awaited<ReturnType<typeof memoryService.getTimeline>>[number]): MemoryItem => {
    const creatorId = (item.creatorUserId || item.userId || '').toLowerCase();
    const author = [couple.userA, couple.userB].find(partner => partner.id.toLowerCase() === creatorId);
    const createdAt = new Date(item.createdAtUtc);
    const validDate = !Number.isNaN(createdAt.getTime());

    return {
      id: item.id,
      imageUrl: item.hasImage ? getMemoryImageUrl(item.id) : '',
      caption: item.text || 'Một khoảnh khắc đáng nhớ của hai đứa.',
      date: validDate ? createdAt.toISOString().slice(0, 10) : '',
      location: undefined,
      tag: 'Kỷ niệm',
      authorName: author?.name || 'Thành viên cặp đôi',
      authorAvatar: author?.avatar || couple.userA.avatar,
      likes: 0,
      isLiked: false,
      createdAt: validDate ? createdAt.toLocaleString('vi-VN') : item.createdAtUtc,
    };
  };

  const refreshBackendMemories = async (): Promise<boolean> => {
    setIsLoadingBackendMemories(true);
    setBackendMemoriesError('');
    setBackendMemories([]);
    try {
      const items = await memoryService.getTimeline();
      setBackendMemories(items.map(mapBackendMemory));
      return true;
    } catch (error) {
      setBackendMemoriesError(error instanceof Error ? error.message : 'Không thể tải kỷ niệm từ máy chủ.');
      return false;
    } finally {
      setIsLoadingBackendMemories(false);
    }
  };

  React.useEffect(() => {
    if (currentScreen !== 'shared' || isDemoMode) return;
    void refreshBackendMemories();
  }, [
    currentScreen,
    isDemoMode,
    couple.userA.id,
    couple.userA.name,
    couple.userA.avatar,
    couple.userB.id,
    couple.userB.name,
    couple.userB.avatar,
  ]);

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

  const syncAuthenticatedCouple = async () => {
    if (!getStoredToken()) return;

    try {
      const [profile, status] = await Promise.all([
        authService.getProfile(),
        coupleService.getStatus(),
      ]);
      setCouple(prev => ({
        ...prev,
        coupleId: status.couple?.coupleId || prev.coupleId,
        startDate: status.couple?.startDate || prev.startDate,
        isPaired: Boolean(status.isPaired),
        userA: {
          ...prev.userA,
          id: profile.id,
          name: profile.displayName || prev.userA.name,
          email: profile.email || prev.userA.email,
          avatar: profile.avatarUrl || prev.userA.avatar,
        },
        userB: status.couple?.partner
          ? {
              ...prev.userB,
              id: status.couple.partner.userId,
              name: status.couple.partner.displayName,
              email: status.couple.partner.email,
              avatar: status.couple.partner.avatarUrl || prev.userB.avatar,
            }
          : prev.userB,
      }));
    } catch (err) {
      console.warn('[App] Auto fetch real profile and couple status failed:', err);
    }
  };

  React.useEffect(() => {
    void syncAuthenticatedCouple();
  }, []);

  // Live Cross-Tab Synchronization with BroadcastChannel & localStorage
  const stateRef = React.useRef({ memories, couple, adminUsers, adminLogs, adminMetrics, datePlans, pointHistory });
  stateRef.current = { memories, couple, adminUsers, adminLogs, adminMetrics, datePlans, pointHistory };

  React.useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      switch (msg.type) {
        case 'SYNC_MEMORIES':
          setMemories(msg.payload);
          break;
        case 'SYNC_COUPLE':
          setCouple(msg.payload);
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
        case 'REQUEST_SYNC':
          broadcastMessage('SYNC_ALL', stateRef.current);
          break;
        case 'SYNC_ALL':
          if (msg.payload) {
            if (msg.payload.memories) setMemories(msg.payload.memories);
            if (msg.payload.couple) setCouple(msg.payload.couple);
            if (msg.payload.adminUsers) setAdminUsers(msg.payload.adminUsers);
            if (msg.payload.adminLogs) setAdminLogs(msg.payload.adminLogs);
            if (msg.payload.adminMetrics) setAdminMetrics(msg.payload.adminMetrics);
            if (msg.payload.datePlans) setDatePlans(msg.payload.datePlans);
            if (msg.payload.pointHistory) setPointHistory(msg.payload.pointHistory);
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
    setCouple(prev => {
      const next = { ...prev, lovePoints: prev.lovePoints + amount };
      saveStoredData(STORAGE_KEYS.COUPLE, next);
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
  // INTERACTION HANDLERS
  // -----------------------------------------------------------------
  const handleWaterGarden = (e?: React.MouseEvent) => {
    playSound('water');
    setIsWatering(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsWatering(false);
      playSound('success');
      addPoints(5, 'Tưới nước cho cây tình yêu', couple.userA.name);

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Vườn hoa đã được tưới',
          message: '🌸 Cây tình yêu tràn đầy sức sống (+5 Love Points)!',
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  const handleFertilizeGarden = (e?: React.MouseEvent) => {
    playSound('click');
    setIsFertilizing(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsFertilizing(false);
      playSound('success');
      addPoints(10, 'Bón phân hữu cơ & vun xới đất', couple.userA.name, 'fertilize');

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Đất vườn đã được bón phân',
          message: `🌿 ${couple.userA.name} vừa bón dưỡng chất cho đất (+10 Love Points)!`,
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  const handleSunGarden = (e?: React.MouseEvent) => {
    playSound('chime');
    setIsSunbathing(true);
    triggerHeartBurst(e);

    setTimeout(() => {
      setIsSunbathing(false);
      playSound('success');
      addPoints(5, 'Tắm nắng ấm ban mai cho mầm hoa', couple.userA.name, 'sun');

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'Mầm hoa đã đón ánh nắng',
          message: `☀️ Cây tình yêu quang hợp tươi tốt dưới nắng ấm (+5 Love Points)!`,
          time: 'Vừa xong',
          type: 'garden',
          read: false
        },
        ...prev
      ]);
    }, 900);
  };

  // -----------------------------------------------------------------
  // SHARED SPACE / MEMORIES HANDLERS (F06)
  // -----------------------------------------------------------------
  const handleAddMemory = async (
    newMemory: Omit<MemoryItem, 'id' | 'createdAt' | 'likes' | 'isLiked'>,
    imageFile?: File,
  ) => {
    if (!isDemoMode) {
      if (!imageFile) {
        throw new Error('Vui lòng chọn một ảnh hợp lệ để tải lên.');
      }
      const saved = await memoryService.createMemory(newMemory.caption, imageFile);
      setBackendMemories(prev => [mapBackendMemory(saved), ...prev.filter(memory => memory.id !== saved.id)]);
      void refreshBackendMemories();
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

  const handleLikeMemory = (id: string) => {
    setMemories(prev => {
      const next = prev.map(m => {
        if (m.id === id) {
          const nextLiked = !m.isLiked;
          return {
            ...m,
            isLiked: nextLiked,
            likes: nextLiked ? m.likes + 1 : Math.max(0, m.likes - 1)
          };
        }
        return m;
      });
      saveStoredData(STORAGE_KEYS.MEMORIES, next);
      broadcastMessage('SYNC_MEMORIES', next);
      return next;
    });
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
    setCouple(prev => ({
      ...prev,
      userA: {
        ...prev.userA,
        status,
        activity
      }
    }));
    setIsStatusModalOpen(false);
  };

  const handleSaveStartDate = (newStartDate: string) => {
    setCouple(prev => ({
      ...prev,
      startDate: newStartDate
    }));
    setIsLoveDayModalOpen(false);
  };

  const handleUpdateNicknames = (nameA: string, nameB: string) => {
    setCouple(prev => ({
      ...prev,
      userA: { ...prev.userA, name: nameA },
      userB: { ...prev.userB, name: nameB }
    }));
    if (getStoredToken()) {
      authService.updateProfile({ displayName: nameA }).catch(err => {
        console.warn('[App] Real updateProfile error:', err);
      });
    }
    setAdminUsers(prev => prev.map(u => {
      if (u.id === 'usr_alex') return { ...u, name: nameA };
      if (u.id === 'usr_sam') return { ...u, name: nameB };
      return u;
    }));
    setAdminLogs(prev => [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        action: `Cập nhật biệt danh cặp đôi: "${nameA}" & "${nameB}"`,
        actor: nameA,
        target: 'Profile',
        timestamp: 'Vừa xong',
        type: 'auth',
        status: 'success',
        ip: '127.0.0.1'
      },
      ...prev
    ]);
  };

  const handleUpdateUserAvatar = (newAvatarUrl: string) => {
    try {
      localStorage.setItem('lovera_alex_avatar', newAvatarUrl);
    } catch (err) {
      console.warn('Failed to save avatar to localStorage:', err);
    }
    setCouple(prev => ({
      ...prev,
      userA: { ...prev.userA, avatar: newAvatarUrl }
    }));
    setAdminUsers(prev => prev.map(u => {
      if (u.id === 'usr_alex') return { ...u, avatar: newAvatarUrl };
      return u;
    }));
  };

  const handleUnpair = () => {
    playSound('error');
    // Generate fresh clean 6-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let freshCode = 'LV';
    for (let i = 0; i < 4; i++) {
      freshCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const todayStr = new Date().toISOString().split('T')[0];

    // Reset couple state cleanly: User A stays logged in, partner B and shared data reset
    setCouple(prev => ({
      ...prev,
      coupleId: `CP-${freshCode}`,
      pairCode: freshCode,
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
    }));

    // Reset interaction / checkin states

    // Add unpair notification
    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: 'Đã hủy kết nối cặp đôi',
        message: 'Bạn đã hủy liên kết với người thương cũ. Mã ghép đôi mới đã sẵn sàng để gửi cho đối phương.',
        time: 'Vừa xong',
        type: 'status',
        read: false
      },
      ...prev
    ]);

    // Direct transition to Pairing Screen at 'create' (màn hình gửi mã) stage
    setPairingInitialStage('create');
    setPairingBannerMessage('Đã hủy kết nối cặp đôi thành công. Mã ghép đôi mới đã sẵn sàng để gửi cho người ấy!');
    setCurrentScreen('pairing');
  };

  const handleLogout = () => {
    playSound('click');
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
                  void syncAuthenticatedCouple();
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
                  void syncAuthenticatedCouple();
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
                const partnerName = typeof partnerInfo === 'string' ? partnerInfo : partnerInfo.name;
                const partnerEmail = typeof partnerInfo === 'string' ? 'sam@lovera.app' : (partnerInfo.email || 'sam@lovera.app');
                const partnerAvatar = typeof partnerInfo === 'string' ? INITIAL_COUPLE.userB.avatar : (partnerInfo.avatar || INITIAL_COUPLE.userB.avatar);
                setCouple(prev => ({
                  ...prev,
                  isPaired: true,
                  startDate: new Date().toISOString().split('T')[0],
                  lovePoints: 100,
                  userB: {
                    ...prev.userB,
                    id: typeof partnerInfo === 'string' ? 'usr_partner' : (partnerInfo.id || 'usr_partner'),
                    name: partnerName,
                    email: partnerEmail,
                    avatar: partnerAvatar,
                    status: 'Available',
                    isOnline: true,
                  }
                }));
                setPairingBannerMessage('');
                setNotifications(prev => [
                  {
                    id: `notif_${Date.now()}`,
                    title: 'Ghép đôi thành công!',
                    message: `Bạn và ${partnerName} đã chính thức kết nối không gian yêu thương.`,
                    time: 'Vừa xong',
                    type: 'status',
                    read: false
                  },
                  ...prev
                ]);
                setCurrentScreen('home');
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
              recentMemories={memories}
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
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, name: newName }
                }));
                if (getStoredToken()) {
                  authService.updateProfile({ displayName: newName }).catch(err => {
                    console.warn('[App] Real updateProfile error:', err);
                  });
                }
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
