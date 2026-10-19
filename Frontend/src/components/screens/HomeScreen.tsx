import React from 'react';
import { 
  Heart, 
  Calendar, 
  Clock, 
  Smile, 
  Flame, 
  Edit3,
  Award
} from 'lucide-react';
import { CoupleData, ConnectionStatusType } from '../../types';
import { INITIAL_ACTIVITY_OPTIONS } from '../../data/mockData';
import { calculateTotalDays, formatVNDate, playSound } from '../../utils/audio';

const STATUS_LABELS: Record<ConnectionStatusType, string> = {
  Available: 'Đang rảnh',
  Busy: 'Đang bận',
  Away: 'Tạm vắng',
};

const getActivityLabel = (activity?: string) =>
  INITIAL_ACTIVITY_OPTIONS.find(option => option.type === activity)?.label ?? 'Chưa chọn hoạt động';

interface HomeScreenProps {
  couple: CoupleData;
  onOpenStatusModal: () => void;
  onOpenLoveDayModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  couple,
  onOpenStatusModal,
  onOpenLoveDayModal,
}) => {
  const { userA, userB, startDate } = couple;
  const totalDays = calculateTotalDays(startDate);

  // Milestone calculation
  const nextMilestone = totalDays < 100 ? 100 : totalDays < 365 ? 365 : totalDays < 500 ? 500 : totalDays < 730 ? 730 : 1000;
  const daysLeftToMilestone = Math.max(0, nextMilestone - totalDays);

  return (
    <div className="min-h-full flex flex-col justify-evenly gap-2 py-2 text-stone-800 select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* CARD 1: COUPLE PROFILE (Alex & Sam & Connection Line)         */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Hồ sơ cặp đôi" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-3 border border-rose-100/90 shadow-xs">
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
                <span>{STATUS_LABELS[userA.status]}</span>
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
                    Offline
                  </span>
                )}
                <h3 className="font-bold text-xs text-stone-900 leading-tight">{userB.name}</h3>
              </div>
              <p className="text-[10px] text-stone-500 flex items-center justify-end gap-0.5 mt-0.5">
                <Flame className="w-2.5 h-2.5 text-amber-500" />
                <span>{STATUS_LABELS[userB.status]}</span>
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* CARD 2: LOVE DAY COUNTER (Hero Romantic Card with Hierarchy)  */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Đếm ngày yêu" className="mx-4 relative overflow-hidden rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-purple-600 p-3 text-white shadow-md shadow-rose-950/10 text-center">
        {/* Soft Background Accents */}
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Top Header Badge & Edit Action */}
        <div className="flex items-center justify-between mb-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-100 bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            <Heart className="w-3 h-3 fill-rose-200 text-rose-200 animate-heart-pulse" />
            <span>Kỷ Niệm Tình Yêu</span>
          </div>

          <button
            onClick={onOpenLoveDayModal}
            className="min-h-[36px] flex items-center gap-1 text-[10px] font-semibold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full transition-colors active:scale-95 shadow-2xs"
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
        <div className="flex items-baseline justify-center gap-1.5 my-1">
          <span className="text-5xl sm:text-6xl font-black tracking-tight font-serif-romantic text-white drop-shadow-sm">
            {totalDays}
          </span>
          <span className="text-2xl font-serif-romantic font-semibold text-rose-100">
            Ngày
          </span>
        </div>

        {/* Anniversary Date & Next Milestone Pill */}
        <div className="pt-2 mt-1.5 border-t border-white/20 flex flex-col gap-1 text-[11px] text-rose-100 font-medium">
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
      <section aria-label="Trạng thái kết nối" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-3 border border-purple-100/90 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Trạng Thái Kết Nối (Connection Status)</span>
          </div>
          <button
            onClick={onOpenStatusModal}
            className="min-h-[40px] text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl transition-colors active:scale-95 border border-purple-100"
          >
            Cập nhật
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100/80">
            <span className="text-[10px] text-stone-400 font-semibold block mb-0.5">Bạn ({userA.name}):</span>
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <span>✨</span>
              <span>{STATUS_LABELS[userA.status]}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              {getActivityLabel(userA.activity)}
            </span>
          </div>

          <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100/80">
            <span className="text-[10px] text-purple-500 font-semibold block mb-0.5">{userB.name}:</span>
            <div className="font-bold text-stone-900 flex items-center gap-1">
              <span>📚</span>
              <span>{STATUS_LABELS[userB.status]}</span>
            </div>
            <span className="text-[10px] text-purple-700 font-medium">
              {getActivityLabel(userB.activity)}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
};
