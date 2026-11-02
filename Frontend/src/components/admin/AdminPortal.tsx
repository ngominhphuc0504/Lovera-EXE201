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
  RefreshCw
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
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  const handleTabChange = (tab: AdminTab) => {
    playSound('click');
    setCurrentTab(tab);
  };

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
                    PORTAL
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
                <span>Dashboard Tổng Quan</span>
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
                <span>Người Dùng & Cặp Đôi</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
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
                <span>Nội Dung & Kỷ Niệm</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
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

        {/* Footer Area with Switch to Couple App Button */}
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
                Lovera Management System • Phiên bản 2.5
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
