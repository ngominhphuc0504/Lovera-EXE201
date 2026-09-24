import React, { useState } from 'react';
import { Heart, Sparkles, Droplets, ChevronRight, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: 'Connect with your love',
      viTitle: 'Kết nối sâu sắc với người thương',
      subtitle: 'Biết đối phương đang học bài, làm việc hay nghỉ ngơi với tính năng Connection Status thời gian thực.',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      badge: 'Trạng thái & Ping yêu thương',
      bgGlow: 'bg-rose-200/50'
    },
    {
      title: 'Make every day special',
      viTitle: 'Mỗi ngày bên nhau đều đặc biệt',
      subtitle: 'Bộ đếm ngày yêu rực rỡ và trợ lý AI Dating Planner gợi ý lịch trình hẹn hò vừa vặn với ngân sách.',
      icon: Sparkles,
      color: 'from-purple-500 to-rose-500',
      badge: 'Love Day Counter & AI Planner',
      bgGlow: 'bg-purple-200/50'
    },
    {
      title: 'Grow your love together',
      viTitle: 'Cùng nhau vun đắp tình yêu',
      subtitle: 'Chăm sóc khu vườn ảo, tích lũy điểm Love Points qua từng hoạt động để nâng cấp cây tình yêu nở rộ.',
      icon: Droplets,
      color: 'from-emerald-500 to-rose-500',
      badge: 'Love Garden & Love Points',
      bgGlow: 'bg-emerald-200/50'
    }
  ];

  const currentSlide = slides[step];
  const Icon = currentSlide.icon;

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/40 to-purple-50 text-stone-800 select-none overflow-hidden">
      {/* Top Header with Skip */}
      <div className="w-full flex items-center justify-between pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
          LOVERA
        </span>
        <button
          onClick={onFinish}
          className="text-xs font-semibold text-stone-400 hover:text-stone-700 px-2 py-1"
        >
          Bỏ qua
        </button>
      </div>

      {/* Slide Illustration & Content */}
      <div className="flex flex-col items-center text-center my-auto px-2">
        {/* Soft Glowing Circle with Icon */}
        <div className="relative mb-6">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${currentSlide.color} flex items-center justify-center text-white shadow-xl shadow-rose-400/20 animate-soft-float`}>
            <Icon className="w-14 h-14 fill-white/20" />
          </div>
          <span className="absolute -bottom-2 bg-white px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 border border-rose-200 shadow-2xs">
            {currentSlide.badge}
          </span>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-1">
          {currentSlide.title}
        </span>
        <h2 className="text-xl font-bold text-stone-900 mb-2 font-serif-romantic">
          {currentSlide.viTitle}
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed max-w-[280px]">
          {currentSlide.subtitle}
        </p>

        {/* Step Indicator Dots */}
        <div className="flex items-center gap-1.5 mt-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-6 bg-rose-500' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full space-y-2.5 pb-2">
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>{step === slides.length - 1 ? 'Bắt đầu ngay (Get Started)' : 'Tiếp tục'}</span>
          {step === slides.length - 1 ? <ArrowRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
