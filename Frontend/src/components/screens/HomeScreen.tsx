import React from 'react';
import { 
  Heart, 
  Calendar, 
  Clock, 
  Smile, 
  Flame, 
  Edit3,
  Award,
  User,
  Sparkles,
  HeartHandshake,
  Camera,
  ChevronRight
} from 'lucide-react';
import { CoupleData, ConnectionStatusType, MemoryItem } from '../../types';
import { INITIAL_ACTIVITY_OPTIONS } from '../../data/mockData';
import { calculateTotalDays, formatVNDate, playSound } from '../../utils/audio';

interface HomeScreenProps {
  couple: CoupleData;
  recentMemories?: MemoryItem[];
  onOpenStatusModal: () => void;
  onOpenLoveDayModal: () => void;
  onSendLovePing?: () => void;
  pingSent?: boolean;
  onNavigateToPairing?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToShared?: () => void;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  couple,
  recentMemories = [],
  onOpenStatusModal,
  onOpenLoveDayModal,
  onSendLovePing,
  pingSent = false,
  onNavigateToPairing,
  onNavigateToProfile,
  onNavigateToShared,
  onUpdateAvatar,
}) => {
  const { userA, userB, startDate } = couple;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB theo tiêu chuẩn hệ thống.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          localStorage.setItem('lovera_alex_avatar', base64);
        } catch (err) {
          console.warn('LocalStorage error:', err);
        }
        onUpdateAvatar?.(base64);
        playSound('success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Nếu chưa ghép đôi, ẩn hoàn toàn ảnh người thứ hai và các chức năng cặp đôi
  if (!couple.isPaired) {
    return (
      <div className="min-h-full flex flex-col justify-center items-center p-6 text-stone-800 select-none">
        {/* Hidden file input for Alex's avatar */}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleAvatarChange} 
        />

        <div className="max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-rose-100 shadow-sm text-center space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative inline-block mx-auto cursor-pointer group select-none"
            title="Nhấn để đổi ảnh đại diện của bạn"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-md mx-auto ring-2 ring-rose-300 group-hover:scale-105 transition-transform">
              <img src={userA.avatar} alt={userA.name} className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-rose-600 shadow-md border border-rose-100 flex items-center justify-center group-hover:scale-110 active:scale-95 transition-transform"
              title="Đổi ảnh đại diện"
              aria-label="Đổi ảnh đại diện"
            >
              <Camera className="w-3.5 h-3.5 text-rose-600" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif-romantic text-xl font-bold text-stone-900">
              Chào {userA.name}!
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Bạn hiện chưa kết nối không gian cặp đôi. Các tính năng Trang chủ, Đếm ngày yêu và Gửi nhịp tim sẽ kích hoạt ngay khi bạn ghép đôi.
            </p>
          </div>

          {/* Locked features preview */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] text-stone-500 space-y-1.5 text-left">
            <div className="flex items-center justify-between text-stone-700 font-semibold text-xs pb-1 border-b border-stone-200/60">
              <span>Tính năng cặp đôi</span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">Khóa 🔒</span>
            </div>
            <p>🔒 Bộ đếm ngày yêu & Kỷ niệm 1:1</p>
            <p>🔒 Nhịp tim rung chuông Love Ping</p>
            <p>🔒 Chia sẻ trạng thái cảm xúc trực tiếp</p>
          </div>

          <div className="pt-1 space-y-2">
            <button
              onClick={() => {
                playSound('click');
                onNavigateToPairing?.();
              }}
              className="w-full min-h-[46px] py-3 px-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Ghép Đôi Ngay (Pairing)</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                onNavigateToProfile?.();
              }}
              className="w-full min-h-[42px] py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-stone-500" />
              <span>Xem Hồ Sơ Cá Nhân (Profile)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDays = calculateTotalDays(startDate);

  // Milestone calculation
  const nextMilestone = totalDays < 100 ? 100 : totalDays < 365 ? 365 : totalDays < 500 ? 500 : totalDays < 730 ? 730 : 1000;
  const daysLeftToMilestone = Math.max(0, nextMilestone - totalDays);

  return (
    <div className="min-h-full flex flex-col justify-evenly gap-2 py-2 text-stone-800 select-none">
      {/* Hidden file input for Alex's avatar in paired home */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarChange} 
      />
      
      {/* ------------------------------------------------------------- */}
      {/* CARD 1: COUPLE PROFILE (Alex & Sam & Connection Line)         */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Hồ sơ cặp đôi" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-3 border border-rose-100/90 shadow-xs">
        <div className="relative flex items-center justify-between">
          
          {/* Partner 1: Alex */}
          <div className="flex items-center gap-2.5 z-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group select-none"
              title="Nhấn để đổi ảnh đại diện của Alex"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-rose-400 ring-offset-2 ring-offset-white shadow-xs group-hover:scale-105 transition-transform">
                <img
                  src={userA.avatar}
                  alt={userA.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-white text-rose-600 shadow-xs border border-rose-100 flex items-center justify-center group-hover:scale-110 active:scale-95 transition-transform"
                title="Đổi ảnh đại diện Alex"
                aria-label="Đổi ảnh đại diện Alex"
              >
                <Camera className="w-2.5 h-2.5 text-rose-600" />
              </button>
              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 pointer-events-none">
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
              <span>{userA.status === 'Available' ? 'Đang rảnh' : userA.status}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Sẵn sàng trò chuyện</span>
          </div>

          <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100/80">
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
      {/* CARD 4: SHARED SPACE / MEMORIES PREVIEW                       */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Khoảnh khắc kỷ niệm" className="mx-4 bg-white/95 backdrop-blur-md rounded-3xl p-3 border border-rose-100/90 shadow-xs mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Camera className="w-3.5 h-3.5 text-rose-500" />
            <span>Khoảnh Khắc Kỷ Niệm</span>
            <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.2 rounded-full border border-rose-200">
              {recentMemories.length} ảnh
            </span>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onNavigateToShared?.();
            }}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 active:scale-95 transition-all"
          >
            <span>Vào Space</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMemories.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {recentMemories.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    playSound('click');
                    onNavigateToShared?.();
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-stone-100 shadow-2xs hover:shadow-sm transition-all"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <p className="text-[9px] text-white font-medium truncate leading-tight">
                      {item.caption}
                    </p>
                  </div>
                  <span className="absolute top-1 right-1 text-[8px] bg-black/40 backdrop-blur-xs text-white px-1 py-0.2 rounded-md font-medium">
                    ❤️ {item.likes}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-stone-500 text-center italic">
              "Lưu giữ từng nụ cười, từng chuyến đi cùng người thương" ✨
            </p>
          </div>
        ) : (
          <div className="py-4 text-center space-y-2 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
            <p className="text-xs text-stone-500 font-medium">Chưa có ảnh kỷ niệm nào được lưu</p>
            <button
              onClick={() => {
                playSound('click');
                onNavigateToShared?.();
              }}
              className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <span>+ Thêm ảnh đầu tiên (+10 pts)</span>
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
