import React, { useState } from 'react';
import { 
  Droplets, 
  Sparkles, 
  Heart, 
  History, 
  CheckCircle2, 
  Bookmark, 
  CalendarCheck,
  Sun,
  Eye,
  Info
} from 'lucide-react';
import { PointHistoryItem } from '../../types';

interface GardenScreenProps {
  lovePoints: number;
  history: PointHistoryItem[];
  onWater: () => void;
  onDailyCheckIn: () => void;
  onSaveMemory: () => void;
  isWatering: boolean;
  hasCheckedInToday: boolean;
}

export const GardenScreen: React.FC<GardenScreenProps> = ({
  lovePoints,
  history,
  onWater,
  onDailyCheckIn,
  onSaveMemory,
  isWatering,
  hasCheckedInToday,
}) => {
  // Current natural stage based on points:
  // Stage 1: Seed (< 100 pts)
  // Stage 2: Small Plant (100 - 299 pts)
  // Stage 3: Flower (>= 300 pts)
  const realStage = lovePoints >= 300 ? 3 : lovePoints >= 100 ? 2 : 1;
  
  // Interactive Stage Previewer (allows couple to view their plant's evolution)
  const [selectedStagePreview, setSelectedStagePreview] = useState<number>(realStage);

  const stageData = {
    1: {
      title: 'Stage 1: Hạt Giống (Seed)',
      sub: 'Mầm yêu thương bắt đầu nảy nở',
      range: '0 – 99 Pts',
      desc: 'Hạt giống được gieo mầm bằng sự chân thành, cần được tưới nước và chăm sóc mỗi ngày.',
      minPts: 0,
      nextTarget: 100,
    },
    2: {
      title: 'Stage 2: Cây Non (Small Plant)',
      sub: 'Chồi non xanh mướt vươn lên đón nắng',
      range: '100 – 299 Pts',
      desc: 'Cây tình yêu đâm chồi với hai lá mầm hình trái tim, vững vàng qua từng ngày bên nhau.',
      minPts: 100,
      nextTarget: 300,
    },
    3: {
      title: 'Stage 3: Hoa Nở Rộ (Flower Blooms)',
      sub: 'Bông hoa ngát hương rực rỡ sắc màu',
      range: '300+ Pts',
      desc: 'Khu vườn thăng hoa, nở rộ những cánh hoa tình yêu ngập tràn hạnh phúc và ấm áp!',
      minPts: 300,
      nextTarget: 500,
    },
  }[selectedStagePreview as 1 | 2 | 3];

  // Calculate progress percent to next stage for current real points
  const progressPercent = realStage === 1 
    ? Math.min(100, Math.floor((lovePoints / 100) * 100))
    : realStage === 2
    ? Math.min(100, Math.floor(((lovePoints - 100) / 200) * 100))
    : 100;

  const pointsToNextStage = realStage === 1
    ? 100 - lovePoints
    : realStage === 2
    ? 300 - lovePoints
    : 0;

  return (
    <div className="space-y-4 pb-28 pt-3 text-stone-800 select-none">
      
      {/* Header */}
      <div className="mx-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
            <Droplets className="w-3.5 h-3.5" />
            <span>Khu Vườn Tình Yêu (Love Garden)</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 font-serif-romantic">
            Vườn Hoa Chung Đôi
          </h2>
        </div>

        <div className="bg-rose-50 border border-rose-200/90 px-3 py-1 rounded-2xl flex items-center gap-1.5 text-rose-600 font-bold text-xs shadow-2xs">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-heart-pulse" />
          <span>{lovePoints} Pts</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DIGITAL GARDEN VISUAL CARD (Interactive Growth)             */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-4 text-white shadow-md border border-stone-800 relative overflow-hidden">
        
        {/* Soft Ambient Glow in Garden */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Header inside Garden */}
        <div className="flex items-center justify-between z-10 relative mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">
              {selectedStagePreview === 1 ? '🌱' : selectedStagePreview === 2 ? '🌿' : '🌸'}
            </span>
            <span className="text-xs font-bold text-emerald-300">
              {stageData.title}
            </span>
          </div>

          <span className="text-[10px] bg-white/15 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-white/10 font-semibold">
            {stageData.range}
          </span>
        </div>

        {/* Plant Growth Interactive Art Stage */}
        <div className="relative h-48 w-full flex flex-col items-center justify-center my-1">
          {/* Sunny rays */}
          <div className="absolute top-3 w-16 h-16 bg-amber-400/20 rounded-full blur-lg"></div>

          {/* Render Plant by Selected Stage */}
          {selectedStagePreview === 1 && (
            <div className="flex flex-col items-center justify-center space-y-2 animate-soft-float">
              {/* Seed / Sprout Visual */}
              <div className="relative w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">🌱</span>
              </div>
              <div className="w-24 h-4 bg-stone-700/60 rounded-full blur-xs"></div>
              <span className="text-[11px] font-semibold text-emerald-200">Hạt Mầm Đang Thức Giấc</span>
            </div>
          )}

          {selectedStagePreview === 2 && (
            <div className="flex flex-col items-center justify-center space-y-2 animate-soft-float">
              {/* Small Plant Visual */}
              <div className="relative w-24 h-24 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <span className="text-5xl filter drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]">🌿</span>
              </div>
              <div className="w-28 h-4 bg-stone-700/60 rounded-full blur-xs"></div>
              <span className="text-[11px] font-semibold text-emerald-200">Cây Non Vươn Hai Lá Tim</span>
            </div>
          )}

          {selectedStagePreview === 3 && (
            <div className="flex flex-col items-center justify-center space-y-2 animate-soft-float">
              {/* Blooming Flower Visual */}
              <div className="relative w-28 h-28 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center shadow-inner">
                <span className="text-6xl filter drop-shadow-[0_0_16px_rgba(244,63,94,0.8)]">🌸</span>
                <span className="absolute -top-1 -right-1 text-base animate-bounce">✨</span>
              </div>
              <div className="w-32 h-4 bg-stone-700/60 rounded-full blur-xs"></div>
              <span className="text-[11px] font-semibold text-rose-200">Vườn Hoa Nở Rộ Rực Rỡ</span>
            </div>
          )}

          {/* Droplet Animation overlay when watering */}
          {isWatering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs rounded-2xl z-20">
              <div className="flex flex-col items-center gap-1">
                <Droplets className="w-8 h-8 text-cyan-400 animate-bounce" />
                <span className="text-xs font-bold text-cyan-200">Đang tưới nước mát lành...</span>
              </div>
            </div>
          )}
        </div>

        {/* Stage Timeline Selector: Let couple see past, current, future */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/30 rounded-2xl border border-white/10 mb-3">
          {[1, 2, 3].map((stg) => {
            const isSelected = selectedStagePreview === stg;
            const isReached = realStage >= stg;
            return (
              <button
                key={stg}
                onClick={() => setSelectedStagePreview(stg)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>{stg === 1 ? '🌱 Cấp 1' : stg === 2 ? '🌿 Cấp 2' : '🌸 Cấp 3'}</span>
                {isReached && <span className="text-[8px] text-emerald-300">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Current Points Progress Bar */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-300">
              {realStage === 3 ? 'Khu vườn đạt cấp độ nở rộ cao nhất!' : `Cần thêm ${pointsToNextStage} pts để lên Cấp ${realStage + 1}`}
            </span>
            <span className="font-bold text-emerald-400">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons: Water & Daily Check-in */}
        <div className="flex items-center gap-2 mt-3.5">
          <button
            onClick={onWater}
            disabled={isWatering}
            className="flex-1 min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Droplets className="w-4 h-4 text-emerald-200" />
            <span>{isWatering ? 'Đang tưới...' : 'Tưới Cây (+5 pts)'}</span>
          </button>

          <button
            onClick={onDailyCheckIn}
            disabled={hasCheckedInToday}
            className={`min-h-[44px] py-2.5 px-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
              hasCheckedInToday
                ? 'bg-white/10 text-stone-400 border border-white/10'
                : 'bg-rose-500/80 hover:bg-rose-500 text-white border border-rose-400/40'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{hasCheckedInToday ? 'Đã điểm danh' : 'Check-in (+5 pts)'}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. POINT RULES & ACTIONS (FRD Mapping)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 border border-purple-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Cách Tích Điểm Nuôi Dưỡng Vườn Hoa:</span>
          </h4>
          <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            FRD Quy Tắc
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
            <span className="text-stone-700">Điểm danh ngày:</span>
            <strong className="text-emerald-600 font-bold">+5 pts</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
            <span className="text-stone-700">Tạo date plan AI:</span>
            <strong className="text-purple-600 font-bold">+5 pts</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
            <span className="text-stone-700">Lưu kỷ niệm:</span>
            <strong className="text-rose-600 font-bold">+10 pts</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
            <span className="text-stone-700">Hoàn thành hẹn hò:</span>
            <strong className="text-amber-600 font-bold">+20 pts</strong>
          </div>
        </div>

        <button
          onClick={onSaveMemory}
          className="w-full min-h-[42px] py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl text-xs font-semibold border border-purple-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Bookmark className="w-3.5 h-3.5 text-purple-600" />
          <span>Lưu Kỷ Niệm Tình Yêu (+10 pts)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. POINT HISTORY (With Empty State if Empty)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-stone-500" />
            <span>Lịch Sử Điểm Tình Yêu (History)</span>
          </h4>
          <span className="text-[10px] text-stone-400">Thời gian thực</span>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 space-y-1">
            <p>Chưa có lịch sử điểm nào.</p>
            <p className="text-[10px]">Hãy tưới cây hoặc điểm danh để tích lũy điểm đầu tiên!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-100/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-stone-800 text-[11px] leading-tight">{item.action}</p>
                  <span className="text-[9px] text-stone-400 block">{item.timestamp} · bởi {item.by}</span>
                </div>
                <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                  +{item.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
