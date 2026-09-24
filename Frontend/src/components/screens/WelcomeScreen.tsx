import React from 'react';
import { Heart, Sparkles, Shield, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-rose-50/80 via-white to-purple-50/70 text-stone-800 overflow-y-auto overflow-x-hidden select-none">
      
      {/* Ambient background blur circles wrapped in overflow-hidden */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-16 w-44 h-44 bg-purple-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Top Brand & Logo */}
      <div className="pt-6 text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-600 to-purple-600 text-white shadow-lg shadow-rose-500/25 mb-4 animate-soft-float">
          <Heart className="w-8 h-8 fill-white animate-heart-pulse" />
        </div>
        <h1 className="font-serif-romantic text-3xl font-bold tracking-tight text-stone-900">
          LOVERA
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mt-1">
          Couple Relationship App
        </p>
      </div>

      {/* Center Value Proposition Card */}
      <div className="my-auto py-4 z-10 space-y-4">
        <div className="text-center space-y-2">
          <h2 className="font-serif-romantic text-xl font-bold text-stone-800">
            Không Gian Dành Riêng Cho Hai Bạn
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            Cùng nhau đếm ngày yêu thương, nuôi dưỡng vườn hoa tình cảm và lên kế hoạch hẹn hò hoàn hảo với AI.
          </p>
        </div>

        {/* Feature Highlights Pill Cards */}
        <div className="space-y-2 max-w-xs mx-auto">
          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-xs rounded-2xl border border-rose-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-stone-800">Ghép Đôi 1:1 Độc Quyền</h3>
              <p className="text-[10px] text-stone-400">Bảo mật tuyệt đối, chỉ hai người kết nối</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-xs rounded-2xl border border-rose-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-stone-800">Lên Lịch Hẹn Hò Bằng AI</h3>
              <p className="text-[10px] text-stone-400">Gợi ý địa điểm & chi phí vừa vặn ngân sách</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-xs rounded-2xl border border-rose-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-sm">🌱</span>
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-stone-800">Vườn Hoa Tình Yêu (Love Garden)</h3>
              <p className="text-[10px] text-stone-400">Tích lũy điểm để cây tình yêu đơm hoa kết trái</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Đăng Ký / Đăng Nhập */}
      <div className="space-y-2.5 pb-4 z-10 w-full max-w-xs mx-auto">
        <button
          onClick={() => {
            playSound('click');
            onNavigateToRegister();
          }}
          className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Tài Khoản Mới (Đăng Ký)</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            onNavigateToLogin();
          }}
          className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-white hover:bg-rose-50/60 text-stone-800 font-semibold text-xs border border-rose-200/80 shadow-2xs active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4 text-rose-500" />
          <span>Đã có tài khoản? Đăng Nhập</span>
        </button>
      </div>

    </div>
  );
};
