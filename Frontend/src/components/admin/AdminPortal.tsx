import React, { useState } from 'react';
import { 
  Shield, 
  Heart, 
  LayoutDashboard, 
  Users, 
  Camera, 
  Settings, 
  ArrowLeft, 
  Smartphone, 
  Bell, 
  Sparkles, 
  Search,
  ExternalLink,
  ChevronRight,
  LogOut,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { AdminSystemMetric, AdminUserAccount, AdminActivityLog, MemoryItem, DatePlan } from '../../types';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminContentTab } from './AdminContentTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { playSound } from '../../utils/audio';

interface AdminPortalProps {
  metrics: AdminSystemMetric;
  users: AdminUserAccount[];
  logs: AdminActivityLog[];
  memories: MemoryItem[];
  datePlans: DatePlan[];
  onToggleLockUser: (userId: string) => void;
  onAdjustPoints: (userId: string, newPoints: number) => void;
  onDeleteMemory: (memoryId: string) => void;
  onDeleteDatePlan: (planId: string) => void;
  onBackToCoupleApp: () => void;
  onManualSync?: () => void;
}

export type AdminTab = 'dashboard' | 'users' | 'content' | 'settings';

const ADMIN_AUTH_KEY = 'lovera_admin_authenticated';
const VALID_PASSCODES = ['lovera2026', 'admin123', 'admin', '2026'];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  metrics,
  users,
  logs,
  memories,
  datePlans,
  onToggleLockUser,
  onAdjustPoints,
  onDeleteMemory,
  onDeleteDatePlan,
  onBackToCoupleApp,
  onManualSync,
}) => {
  // Check if admin is authenticated in current browser session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  const handleTabChange = (tab: AdminTab) => {
    playSound('click');
    setCurrentTab(tab);
  };

  const handleUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = passcode.trim();

    if (!trimmed) {
      setPasscodeError('Vui lòng nhập mã bảo mật quản trị.');
      playSound('error');
      return;
    }

    if (VALID_PASSCODES.includes(trimmed.toLowerCase())) {
      try {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } catch (err) {
        console.warn('sessionStorage error:', err);
      }
      playSound('success');
      setIsAuthenticated(true);
      setPasscodeError('');
    } else {
      playSound('error');
      setPasscodeError('Mã bảo mật không chính xác. Quyền truy cập quản trị bị từ chối.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  const handleLockAdmin = () => {
    playSound('click');
    try {
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch (err) {
      console.warn('sessionStorage error:', err);
    }
    setIsAuthenticated(false);
    setPasscode('');
    onBackToCoupleApp();
  };

  // -----------------------------------------------------------------
  // PRIVATE ADMIN PASSCODE LOCK GATE (WHEN NOT AUTHENTICATED)
  // -----------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-4 text-stone-100 select-none relative overflow-hidden font-sans">
        
        {/* Ambient subtle backlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Security Card */}
        <div className={`w-full max-w-md bg-stone-900/90 backdrop-blur-xl border border-stone-800/80 rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10 transition-transform ${isShaking ? 'animate-bounce' : ''}`}>
          
          {/* Glowing Shield Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25 mb-5">
            <Lock className="w-8 h-8" />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>LOVERA Security Access</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight font-display">
              Cổng Quản Trị Hệ Thống
            </h1>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Trang quản trị ở chế độ Private. Vui lòng nhập mã bảo mật quản trị viên (Admin Passcode) để tiếp tục.
            </p>
          </div>

          {/* Error Message */}
          {passcodeError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{passcodeError}</span>
            </div>
          )}

          {/* Passcode Form */}
          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Mã Bảo Mật (Admin Passcode)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (passcodeError) setPasscodeError('');
                  }}
                  autoFocus
                  placeholder="Nhập mã bảo mật (vd: lovera2026)..."
                  className="w-full pl-10 pr-11 py-3 bg-stone-950/80 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono tracking-wider placeholder:text-stone-600 placeholder:font-sans placeholder:tracking-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở Khóa Quản Trị Viên</span>
            </button>
          </form>

          {/* Return to Couple App */}
          <div className="mt-5 pt-5 border-t border-stone-800/80 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onBackToCoupleApp();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay Lại Ứng Dụng Cặp Đôi (Lovera App)</span>
            </button>
            <p className="text-[11px] text-center text-stone-400">
              Mã mặc định hệ thống: <span className="font-mono text-purple-300 font-bold">lovera2026</span>
            </p>
          </div>

        </div>

      </div>
    );
  }

  // -----------------------------------------------------------------
  // AUTHENTICATED ADMIN PORTAL DASHBOARD
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-stone-100 flex flex-col md:flex-row text-stone-800 antialiased font-sans select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT ADMIN SIDEBAR                                         */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200/80 flex flex-col justify-between shrink-0 shadow-xs z-20">
        
        {/* Brand & Logo Header */}
        <div>
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-sm text-stone-900 tracking-tight font-display">
                    LOVERA ADMIN
                  </h1>
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.2 rounded-md">
                    PRIVATE
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Bảng điều hành quản trị 2026</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Thống Kê</span>
              </div>
              {currentTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>

            <button
              onClick={() => handleTabChange('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'users'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Quản Lý Người Dùng</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentTab === 'users' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('content')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'content'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4" />
                <span>Kiểm Duyệt Nội Dung</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentTab === 'content' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {memories.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Cấu Hình & Hệ Thống</span>
              </div>
              {currentTab === 'settings' && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          </nav>
        </div>

        {/* Footer Area with Switch to Couple App & Lock Admin */}
        <div className="p-3 border-t border-stone-100 space-y-2">
          
          {/* Quick Switch to User App */}
          <button
            onClick={() => {
              playSound('click');
              onBackToCoupleApp();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-50 to-purple-50 hover:from-rose-100 hover:to-purple-100 border border-rose-200/80 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs group"
          >
            <Smartphone className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span>Về App Cặp Đôi Lovera</span>
          </button>

          {/* Secure Lock & Exit Admin */}
          <button
            onClick={handleLockAdmin}
            className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-stone-200/80 text-stone-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Đăng xuất khỏi phiên quản trị và khóa cổng Admin"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Khóa & Đăng Xuất Admin</span>
          </button>

          {/* Admin User Profile */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-stone-50 border border-stone-200/60">
            <div className="flex items-center gap-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                alt="Admin"
                className="w-7 h-7 rounded-lg object-cover border border-purple-200"
              />
              <div>
                <span className="font-bold text-stone-900 text-[11px] block leading-tight">Super Admin</span>
                <span className="text-[10px] text-stone-400">admin@lovera.app</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online"></span>
          </div>

        </div>

      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN ADMIN CONTENT CONTAINER                               */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="px-6 py-4 bg-white/95 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-2xs">
          
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                {currentTab === 'dashboard' && 'Dashboard Thống Kê Tổng Quan'}
                {currentTab === 'users' && 'Quản Lý Tài Khoản & Cặp Đôi'}
                {currentTab === 'content' && 'Kiểm Duyệt Nội Dung & Kế Hoạch'}
                {currentTab === 'settings' && 'Cài Đặt Hệ Thống & Gemini AI'}
              </h2>
              <p className="text-[11px] text-stone-400">
                Lovera Management System • Phiên bản 2.5 (Private Mode)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Status pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>API .NET: Online</span>
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Gemini Flash 2.5</span>
              </span>
            </div>

            {/* Quick Button to Couple App */}
            {onManualSync && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onManualSync();
                }}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Làm mới & đồng bộ dữ liệu tức thì từ App Cặp Đôi"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                <span>Đồng Bộ Dữ Liệu</span>
              </button>
            )}

            <button
              onClick={() => {
                playSound('click');
                onBackToCoupleApp();
              }}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>Mở App Cặp Đôi</span>
            </button>

            <button
              onClick={handleLockAdmin}
              className="text-xs font-bold text-stone-600 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 border border-stone-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Khóa quyền quản trị"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Khóa Admin</span>
            </button>

          </div>

        </header>

        {/* Dynamic Tab Body */}
        <main className="p-6 flex-1 min-h-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <AdminDashboardTab
              metrics={metrics}
              logs={logs}
              onNavigateToTab={(tab) => handleTabChange(tab)}
            />
          )}

          {currentTab === 'users' && (
            <AdminUsersTab
              users={users}
              onToggleLockUser={onToggleLockUser}
              onAdjustPoints={onAdjustPoints}
            />
          )}

          {currentTab === 'content' && (
            <AdminContentTab
              memories={memories}
              datePlans={datePlans}
              onDeleteMemory={onDeleteMemory}
              onDeleteDatePlan={onDeleteDatePlan}
              onManualSync={onManualSync}
            />
          )}

          {currentTab === 'settings' && (
            <AdminSettingsTab />
          )}
        </main>

      </div>

    </div>
  );
};
