import React, { useEffect } from 'react';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onStart: () => void;
  onSkipToLogin: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onSkipToLogin }) => {
  // Auto-progress or let user tap
  useEffect(() => {
    const timer = setTimeout(() => {
      onStart();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onStart]);

  return (
    <div className="relative min-h-[640px] h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-rose-50 via-pink-50/60 to-purple-50 text-stone-800 text-center select-none overflow-hidden">
      {/* Background Soft Blobs */}
      <div className="absolute top-10 -left-12 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -right-12 w-56 h-56 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full flex justify-end pt-2">
        <button
          onClick={onSkipToLogin}
          className="text-xs font-semibold text-rose-500/80 hover:text-rose-600 bg-white/60 hover:bg-white/90 px-3 py-1.5 rounded-full border border-rose-100 transition-all shadow-2xs"
        >
          Đăng nhập ngay
        </button>
      </div>

      {/* Main Logo & Romantic Emblem */}
      <div className="flex flex-col items-center my-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-400 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-rose-400/30 animate-heart-pulse">
            <Heart className="w-12 h-12 fill-white drop-shadow-md" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-400 shadow-md border border-rose-100">
            <Sparkles className="w-4 h-4 fill-amber-300" />
          </div>
        </div>

        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 bg-clip-text text-transparent mb-2">
          LOVERA
        </h1>
        <p className="text-xs uppercase tracking-widest font-bold text-rose-400 mb-3">
          Couple Relationship App
        </p>
        <p className="text-xs text-stone-600 max-w-[240px] leading-relaxed font-medium">
          Không gian ngọt ngào vun đắp tình yêu của hai bạn mỗi ngày.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="w-full space-y-3 pb-4">
        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Bắt đầu trải nghiệm</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-stone-400">Phiên bản OC1 - MVP 2026</p>
      </div>
    </div>
  );
};
