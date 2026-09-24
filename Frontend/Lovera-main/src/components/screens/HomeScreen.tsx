import React from 'react';
import { 
  Heart, 
  Sparkles, 
  Calendar, 
  Clock, 
  Smile, 
  Flame, 
  Droplets, 
  Send, 
  ArrowRight,
  Edit3,
  CheckCircle2,
  Award
} from 'lucide-react';
import { CoupleData } from '../../types';
import { calculateTotalDays, formatVNDate, playSound } from '../../utils/audio';
import gardenBanner from '../../assets/images/love_garden_blooms_1790144486251.jpg';

interface HomeScreenProps {
  couple: CoupleData;
  onNavigateToPlanner: () => void;
  onNavigateToGarden: () => void;
  onOpenStatusModal: () => void;
  onOpenLoveDayModal: () => void;
  onSendLovePing: () => void;
  onWaterGarden: () => void;
  isWatering: boolean;
  pingSent: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  couple,
  onNavigateToPlanner,
  onNavigateToGarden,
  onOpenStatusModal,
  onOpenLoveDayModal,
  onSendLovePing,
  onWaterGarden,
  isWatering,
  pingSent,
}) => {
  const { userA, userB, startDate, lovePoints } = couple;
  const totalDays = calculateTotalDays(startDate);

  // Determine stage from points: Stage 1 <100, Stage 2 100-299, Stage 3 >=300
  const stage = lovePoints >= 300 ? 3 : lovePoints >= 100 ? 2 : 1;
  const stageInfo = {
    1: { name: 'Giai đoạn 1: Hạt Giống (Seed)', icon: '🌱', target: 100 },
    2: { name: 'Giai đoạn 2: Cây Non (Small Plant)', icon: '🌿', target: 300 },
    3: { name: 'Giai đoạn 3: Hoa Nở Rực Rỡ (Blooms)', icon: '🌸', target: 500 },
  }[stage];

  // Milestone calculation
  const nextMilestone = totalDays < 100 ? 100 : totalDays < 365 ? 365 : totalDays < 500 ? 500 : totalDays < 730 ? 730 : 1000;
  const daysLeftToMilestone = Math.max(0, nextMilestone - totalDays);

  return (
    <div className="space-y-3.5 pb-24 pt-3 text-stone-800 select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* CARD 1: COUPLE PROFILE (Alex & Sam & Connection Line)         */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Hồ sơ cặp đôi" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-rose-100/90 shadow-xs">
        <div className="relative flex items-center justify-between">
          
          {/* Partner 1: Alex */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-rose-400 ring-offset-2 ring-offset-white shadow-xs">
                <img
                  src={userA.avatar}
                  alt={userA.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs text-stone-900 leading-tight">{userA.name}</h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Online
                </span>
              </div>
              <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                <Smile className="w-2.5 h-2.5 text-rose-400" />
                <span>{userA.status === 'Available' ? 'Đang rảnh' : userA.status}</span>
              </p>
            </div>
          </div>

          {/* Romantic Connection Line with Pulsing Heart */}
          <div className="absolute inset-x-20 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[1.5px] bg-gradient-to-r from-rose-300 via-rose-400 to-purple-300 rounded-full"></div>
            <div className="absolute bg-white px-2 py-0.5 rounded-full border border-rose-200 shadow-xs flex items-center">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-heart-pulse" />
            </div>
          </div>

          {/* Partner 2: Sam */}
          <div className="flex items-center gap-2.5 z-10 flex-row-reverse text-right">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-400 ring-offset-2 ring-offset-white shadow-xs">
                <img
                  src={userB.avatar}
                  alt={userB.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {userB.isOnline ? (
                <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-stone-300 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-end gap-1.5">
                {userB.isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
                    {userB.availableAt ? `Rảnh: ${userB.availableAt}` : 'Offline'}
                  </span>
                )}
                <h3 className="font-bold text-xs text-stone-900 leading-tight">{userB.name}</h3>
              </div>
              <p className="text-[10px] text-stone-500 flex items-center justify-end gap-0.5 mt-0.5">
                <Flame className="w-2.5 h-2.5 text-amber-500" />
                <span>{userB.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Send Love Ping CTA Row */}
        <div className="mt-3.5 pt-2.5 border-t border-rose-100/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
            <span className="text-[11px] font-medium text-stone-600">
              {pingSent ? '💌 Đã gửi: "Nhớ em rất nhiều!"' : 'Chia sẻ nhịp đập yêu thương'}
            </span>
          </div>

          <button
            onClick={onSendLovePing}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
              pingSent
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-rose-500/20'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{pingSent ? 'Đã gửi Ping!' : 'Gửi Love Ping'}</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CARD 2: LOVE DAY COUNTER (Hero Romantic Card with Hierarchy)  */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Đếm ngày yêu" className="mx-4 relative overflow-hidden rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-purple-600 p-5 text-white shadow-md shadow-rose-950/10 text-center">
        {/* Soft Background Accents */}
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Top Header Badge & Edit Action */}
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-100 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            <Heart className="w-3 h-3 fill-rose-200 text-rose-200 animate-heart-pulse" />
            <span>Kỷ Niệm Tình Yêu</span>
          </div>

          <button
            onClick={onOpenLoveDayModal}
            className="min-h-[32px] flex items-center gap-1 text-[10px] font-semibold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full transition-colors active:scale-95 shadow-2xs"
            title="Đổi ngày bắt đầu yêu"
          >
            <Edit3 className="w-3 h-3" />
            <span>Sửa ngày</span>
          </button>
        </div>

        {/* Romantic Subheading */}
        <h2 className="font-serif-romantic text-base sm:text-lg font-bold tracking-tight text-rose-50 mb-0.5">
          Chúng mình đã bên nhau
        </h2>

        {/* Hero Prominent Love Day Number */}
        <div className="flex items-baseline justify-center gap-1.5 my-1.5">
          <span className="text-5xl sm:text-6xl font-black tracking-tight font-serif-romantic text-white drop-shadow-sm">
            {totalDays}
          </span>
          <span className="text-2xl font-serif-romantic font-semibold text-rose-100">
            Ngày
          </span>
        </div>

        {/* Anniversary Date & Next Milestone Pill */}
        <div className="pt-2.5 mt-2 border-t border-white/20 flex flex-col gap-1.5 text-[11px] text-rose-100 font-medium">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-200" />
              <span>Yêu từ: {formatVNDate(startDate)}</span>
            </span>
            <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
              {totalDays >= 365 ? '1 Năm+' : `${totalDays * 24} Giờ`}
            </span>
          </div>

          {/* Next Milestone Badge */}
          {daysLeftToMilestone > 0 && (
            <div className="bg-black/15 rounded-xl px-2.5 py-1 flex items-center justify-between text-[10px] text-rose-100/90">
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-300" />
                <span>Mốc kế tiếp: {nextMilestone} Ngày</span>
              </span>
              <span className="font-bold text-amber-200">Còn {daysLeftToMilestone} ngày nữa ✨</span>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CARD 3: CONNECTION STATUS SUMMARY                             */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Trạng thái kết nối" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-purple-100/90 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Trạng Thái Kết Nối (Connection Status)</span>
          </div>
          <button
            onClick={onOpenStatusModal}
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl transition-colors active:scale-95 border border-purple-100"
          >
            Cập nhật
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-stone-50/80 p-3 rounded-2xl border border-stone-100/80">
            <span className="text-[10px] text-stone-400 font-semibold block mb-0.5">Bạn ({userA.name}):</span>
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <span>✨</span>
              <span>{userA.status === 'Available' ? 'Đang rảnh' : userA.status}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Sẵn sàng trò chuyện</span>
          </div>

          <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100/80">
            <span className="text-[10px] text-purple-500 font-semibold block mb-0.5">{userB.name}:</span>
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <span>📚</span>
              <span>{userB.status}</span>
            </div>
            <span className="text-[10px] text-purple-700 font-medium">
              {userB.availableAt ? `Dự kiến: ${userB.availableAt}` : 'Đang bận việc'}
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CARD 4: LOVE GARDEN PREVIEW                                   */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Khu vườn tình yêu" className="mx-4 bg-white/95 rounded-3xl p-4 border border-rose-100/90 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
              Khu Vườn Tình Yêu (Love Garden)
            </span>
            <h4 className="text-xs font-bold text-stone-900">{stageInfo.name}</h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80">
              {lovePoints} Pts
            </span>
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onNavigateToGarden();
          }}
          className="relative h-28 rounded-2xl overflow-hidden mb-3 group cursor-pointer" 
          onClick={onNavigateToGarden}
        >
          <img
            src={gardenBanner}
            alt="Love Garden"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-2.5 text-white">
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-semibold">Chạm để chăm sóc vườn hoa →</span>
              <span className="text-base animate-bounce">{stageInfo.icon}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={onWaterGarden}
            disabled={isWatering}
            className="flex-1 min-h-[40px] py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isWatering ? 'Đang tưới nước...' : 'Tưới nước (+5 pts)'}</span>
          </button>
          <button
            onClick={onNavigateToGarden}
            className="min-h-[40px] py-2 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Vào vườn
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* QUICK ACTIONS ROW (Plan a Date, Garden, Status)               */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Hành động nhanh" className="mx-4 pt-1">
        <span className="text-xs font-bold text-stone-700 block mb-2 uppercase tracking-wide text-[10px]">
          Hành Động Nhanh
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onNavigateToPlanner}
            className="min-h-[88px] p-3 bg-white/95 hover:bg-rose-50/60 rounded-2xl border border-rose-100 shadow-2xs text-center transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-stone-900 leading-tight">Plan a Date</span>
            <span className="text-[9px] text-stone-400 mt-0.5">AI hẹn hò</span>
          </button>

          <button
            onClick={onNavigateToGarden}
            className="min-h-[88px] p-3 bg-white/95 hover:bg-rose-50/60 rounded-2xl border border-rose-100 shadow-2xs text-center transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-stone-900 leading-tight">Love Garden</span>
            <span className="text-[9px] text-stone-400 mt-0.5">Khu vườn</span>
          </button>

          <button
            onClick={onOpenStatusModal}
            className="min-h-[88px] p-3 bg-white/95 hover:bg-rose-50/60 rounded-2xl border border-rose-100 shadow-2xs text-center transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-stone-900 leading-tight">Status</span>
            <span className="text-[9px] text-stone-400 mt-0.5">Trạng thái</span>
          </button>
        </div>
      </section>

    </div>
  );
};
