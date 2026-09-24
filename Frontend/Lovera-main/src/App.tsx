import React, { useState } from 'react';
import { Screen, CoupleData, DatePlan, DateType, ConnectionStatusType } from './types';
import { 
  INITIAL_COUPLE, 
  INITIAL_DATE_PLANS, 
  INITIAL_POINT_HISTORY, 
  INITIAL_NOTIFICATIONS 
} from './data/mockData';
import { playSound } from './utils/audio';

import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';

import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { PairingScreen } from './components/screens/PairingScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { DatePlannerScreen } from './components/screens/DatePlannerScreen';
import { GardenScreen } from './components/screens/GardenScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

import { StatusModal } from './components/modals/StatusModal';
import { LoveDayModal } from './components/modals/LoveDayModal';
import { NotificationsModal } from './components/modals/NotificationsModal';

import { Heart, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  // Main Screen Navigation State (First-time open -> Welcome Screen)
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  // Couple & Domain State
  const [couple, setCouple] = useState<CoupleData>(INITIAL_COUPLE);
  const [datePlans, setDatePlans] = useState<DatePlan[]>(INITIAL_DATE_PLANS);
  const [activePlan, setActivePlan] = useState<DatePlan | null>(INITIAL_DATE_PLANS[0]);
  const [pointHistory, setPointHistory] = useState(INITIAL_POINT_HISTORY);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Modals & UI States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLoveDayModalOpen, setIsLoveDayModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Interaction feedback states
  const [isWatering, setIsWatering] = useState(false);
  const [pingSent, setPingSent] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
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
  const addPoints = (amount: number, actionName: string, byUser = couple.userA.name) => {
    setCouple(prev => ({
      ...prev,
      lovePoints: prev.lovePoints + amount
    }));

    const newHistoryItem = {
      id: `pt_${Date.now()}`,
      action: actionName,
      points: amount,
      timestamp: 'Vừa xong',
      by: byUser
    };

    setPointHistory(prev => [newHistoryItem, ...prev]);
  };

  // -----------------------------------------------------------------
  // INTERACTION HANDLERS
  // -----------------------------------------------------------------
  const handleSendLovePing = (e?: React.MouseEvent) => {
    playSound('ping');
    triggerHeartBurst(e);
    setPingSent(true);
    addPoints(5, 'Gửi Love Ping rung chuông', couple.userA.name);

    // Add simulated notification for partner
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: `${couple.userA.name} vừa gửi Love Ping!`,
      message: '❤️ Đối phương đang nhớ bạn rất nhiều!',
      time: 'Vừa xong',
      type: 'ping' as const,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    setTimeout(() => setPingSent(false), 3000);
  };

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

  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) return;
    playSound('success');
    setHasCheckedInToday(true);
    addPoints(5, 'Check-in vườn hoa mỗi ngày', couple.userA.name);
  };

  const handleSaveMemory = () => {
    playSound('success');
    addPoints(10, 'Lưu kỷ niệm tình yêu mới', couple.userA.name);
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
  const handleSaveStatus = (status: ConnectionStatusType, availableAt: string) => {
    setCouple(prev => ({
      ...prev,
      userA: {
        ...prev.userA,
        status,
        availableAt: availableAt ? `Rảnh lúc ${availableAt}` : 'Ngay bây giờ'
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
  };

  const handleUnpair = () => {
    playSound('error');
    setCouple(prev => ({
      ...prev,
      isPaired: false
    }));
    setCurrentScreen('pairing');
  };

  const handleLogout = () => {
    playSound('click');
    setCurrentScreen('welcome');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isTabScreen = ['home', 'planner', 'garden', 'profile'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center font-sans antialiased text-stone-800 p-0 sm:p-4">
      
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
        className={`w-full max-w-[420px] bg-white min-h-[660px] h-[92vh] max-h-[890px] relative flex flex-col overflow-hidden transition-all duration-300 ${
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

        {/* Top Sticky Header (for Tab Screens) */}
        {isTabScreen && (
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full bg-gradient-to-b from-stone-50/70 via-rose-50/20 to-purple-50/30 relative">
          
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
              onRegisterSuccess={(email, name) => {
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: false,
                }));
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
              onLoginSuccess={(email, name, isAlreadyPaired) => {
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: isAlreadyPaired,
                }));
                if (isAlreadyPaired) {
                  setCurrentScreen('home');
                } else {
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
              onLoginSuccess={(email, name, isAlreadyPaired) => {
                setCouple(prev => ({
                  ...prev,
                  userA: { ...prev.userA, email, name },
                  isPaired: isAlreadyPaired,
                }));
                if (isAlreadyPaired) {
                  setCurrentScreen('home');
                } else {
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
              myPairCode={couple.pairCode}
              onBackToAuth={() => setCurrentScreen('welcome')}
              onPairSuccess={(partnerName) => {
                setCouple(prev => ({
                  ...prev,
                  isPaired: true,
                  userB: { ...prev.userB, name: partnerName }
                }));
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
              onNavigateToPlanner={() => {
                playSound('click');
                setCurrentScreen('planner');
              }}
              onNavigateToGarden={() => {
                playSound('click');
                setCurrentScreen('garden');
              }}
              onOpenStatusModal={() => {
                playSound('click');
                setIsStatusModalOpen(true);
              }}
              onOpenLoveDayModal={() => {
                playSound('click');
                setIsLoveDayModalOpen(true);
              }}
              onSendLovePing={handleSendLovePing}
              onWaterGarden={handleWaterGarden}
              isWatering={isWatering}
              pingSent={pingSent}
            />
          )}

          {currentScreen === 'planner' && (
            <DatePlannerScreen
              currentPlan={activePlan}
              onSavePlan={handleSavePlan}
              onCompletePlan={handleCompletePlan}
              onGeneratePlan={handleGenerateDatePlan}
              isGenerating={isGeneratingPlan}
            />
          )}

          {currentScreen === 'garden' && (
            <GardenScreen
              lovePoints={couple.lovePoints}
              history={pointHistory}
              onWater={handleWaterGarden}
              onDailyCheckIn={handleDailyCheckIn}
              onSaveMemory={handleSaveMemory}
              isWatering={isWatering}
              hasCheckedInToday={hasCheckedInToday}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              couple={couple}
              onUpdateNicknames={handleUpdateNicknames}
              onOpenLoveDayModal={() => setIsLoveDayModalOpen(true)}
              onUnpair={handleUnpair}
              onLogout={handleLogout}
              onResetDemoFlow={(scr) => setCurrentScreen(scr)}
            />
          )}
        </div>

        {/* Bottom Navigation for Tab Screens */}
        {isTabScreen && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={(scr) => {
              playSound('click');
              setCurrentScreen(scr);
            }}
            gardenNotification={!hasCheckedInToday}
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
            currentAvailableAt={couple.userA.availableAt}
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
