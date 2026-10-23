import React, { useState, useRef } from 'react';
import { 
  User, 
  Heart, 
  Calendar, 
  Settings, 
  LogOut, 
  AlertTriangle, 
  Check, 
  HeartHandshake, 
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Edit2,
  ArrowLeft,
  KeyRound,
  Lock,
  Camera
} from 'lucide-react';
import { CoupleData } from '../../types';
import { calculateTotalDays, formatVNDate, playSound } from '../../utils/audio';

interface ProfileScreenProps {
  couple: CoupleData;
  onUpdateNicknames: (nameA: string, nameB: string) => void;
  onOpenLoveDayModal: () => void;
  onUnpair: () => void;
  onLogout: () => void;
  onResetDemoFlow: (screen: 'welcome' | 'login' | 'register' | 'pairing' | 'splash' | 'onboarding') => void;
  onNavigateToPairing?: () => void;
  onUpdateUserName?: (newName: string) => void;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  couple,
  onUpdateNicknames,
  onOpenLoveDayModal,
  onUnpair,
  onLogout,
  onResetDemoFlow,
  onNavigateToPairing,
  onUpdateUserName,
  onUpdateAvatar,
}) => {
  const isPaired = couple.isPaired;
  const { userA, userB, startDate, coupleId } = couple;
  const totalDays = calculateTotalDays(startDate);

  const [nickA, setNickA] = useState(userA.name);
  const [nickB, setNickB] = useState(userB.name);
  const [savedToast, setSavedToast] = useState('');
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSavedToast('Đã đổi và đồng bộ avatar thành công!');
        setTimeout(() => setSavedToast(''), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNicknames = () => {
    onUpdateNicknames(nickA, nickB);
    setSavedToast('Đã lưu biệt danh mới của hai bạn!');
    playSound('success');
    setTimeout(() => setSavedToast(''), 2500);
  };

  const handleSavePersonalName = () => {
    if (onUpdateUserName) {
      onUpdateUserName(nickA);
    } else {
      onUpdateNicknames(nickA, userB.name);
    }
    setSavedToast('Đã lưu tên hiển thị của bạn!');
    playSound('success');
    setTimeout(() => setSavedToast(''), 2500);
  };

  return (
    <div className="space-y-4 pb-28 pt-3 text-stone-800 select-none">
      
      {/* Hidden file input for Alex's avatar */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarChange} 
      />

      {/* Screen Header */}
      <div className="mx-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isPaired && onNavigateToPairing && (
            <button
              onClick={() => {
                playSound('click');
                onNavigateToPairing();
              }}
              className="w-9 h-9 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
              title="Quay lại màn hình ghép đôi"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wide">
              <User className="w-3.5 h-3.5" />
              <span>Tài Khoản & Cài Đặt</span>
            </div>
            <h2 className="text-base font-bold text-stone-900 font-serif-romantic">
              {isPaired ? 'Không Gian Chung' : 'Hồ Sơ Cá Nhân'}
            </h2>
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${isPaired ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'}`}>
          {isPaired ? `Mã: ${coupleId}` : 'Chưa ghép đôi'}
        </span>
      </div>

      {/* Hero Summary Card: Conditionally render Paired vs Solo */}
      {isPaired ? (
        /* Couple Hero Summary Card (Alex & Sam) - Thẻ Không Gian Chung */
        <div className="mx-4 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-5 text-white shadow-md text-center relative overflow-hidden">
          <div className="flex items-center justify-center -space-x-3 mb-2.5">
            {/* Alex Avatar with Camera Icon Button */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group select-none"
              title="Nhấn để đổi ảnh đại diện của Alex"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-white/30 group-hover:scale-105 transition-transform">
                <img src={userA.avatar} alt={userA.name} className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-rose-600 shadow-md border border-rose-100 flex items-center justify-center group-hover:scale-110 active:scale-95 transition-transform"
                title="Đổi ảnh đại diện Alex"
                aria-label="Đổi ảnh đại diện Alex"
              >
                <Camera className="w-3 h-3 text-rose-600" />
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center z-10 shadow-xs">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>

            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src={userB.avatar} alt={userB.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <h3 className="font-serif-romantic text-lg font-bold">
            {userA.name} & {userB.name}
          </h3>
          <p className="text-xs text-rose-100 mt-0.5 font-medium">
            Bên nhau {totalDays} Ngày · Từ {formatVNDate(startDate)}
          </p>
        </div>
      ) : (
        /* Solo Personal Profile Hero Card (Ẩn hoàn toàn ảnh người thứ hai) */
        <div className="mx-4 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-md text-center relative overflow-hidden">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative inline-block mx-auto mb-3 cursor-pointer group select-none"
            title="Nhấn để đổi ảnh đại diện của bạn"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-md mx-auto ring-2 ring-white/60 group-hover:scale-105 transition-transform">
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

          <h3 className="font-serif-romantic text-xl font-bold">
            {userA.name}
          </h3>
          <p className="text-xs text-rose-100 mt-0.5 font-medium">
            {userA.email}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-amber-300"></span>
            <span>Tài khoản cá nhân · Đang chờ kết nối cặp đôi</span>
          </div>
        </div>
      )}

      {savedToast && (
        <div className="mx-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-fade-in shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedToast}</span>
        </div>
      )}

      {/* Call-to-action Card: Chỉ hiển thị khi CHƯA KẾT NỐI */}
      {!isPaired && (
        <div className="mx-4 bg-gradient-to-br from-rose-50 via-pink-50/50 to-purple-50 rounded-3xl p-5 border-2 border-dashed border-rose-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-stone-900 font-serif-romantic">
              Không Gian Cặp Đôi (Chưa Kết Nối)
            </h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              Kết nối với người ấy bằng mã ghép đôi 6 ký tự để mở khóa: Đếm ngày yêu, Lên lịch hẹn hò AI, Khu vườn tình yêu và Biệt danh ngọt ngào.
            </p>
          </div>
          <button
            onClick={() => {
              playSound('click');
              if (onNavigateToPairing) {
                onNavigateToPairing();
              } else {
                onResetDemoFlow('pairing');
              }
            }}
            className="w-full min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Bắt Đầu Ghép Đôi Ngay (Pairing)</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SETTINGS SECTION (Phân biệt Đã Ghép Đôi vs Chưa Ghép Đôi)      */}
      {/* ------------------------------------------------------------- */}
      {isPaired ? (
        /* CÁC CHỨC NĂNG DÀNH CHO CẶP ĐÔI (Khi đã ghép đôi) */
        <>
          {/* 1. NICKNAME SETTINGS */}
          <div className="mx-4 bg-white/95 rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Đổi Biệt Danh Cặp Đôi
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                  Biệt danh của bạn:
                </label>
                <input
                  type="text"
                  value={nickA}
                  onChange={(e) => setNickA(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                  Biệt danh người ấy:
                </label>
                <input
                  type="text"
                  value={nickB}
                  onChange={(e) => setNickB(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <button
              onClick={handleSaveNicknames}
              className="w-full min-h-[42px] py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Lưu Biệt Danh Mới</span>
            </button>
          </div>

          {/* 2. ANNIVERSARY SETTINGS */}
          <div className="mx-4 bg-white/95 rounded-3xl p-4 sm:p-5 border border-purple-100/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Ngày Bắt Đầu Yêu
                  </h4>
                  <p className="text-[10px] text-stone-400">Đồng bộ cho Love Day Counter</p>
                </div>
              </div>
              <button
                onClick={onOpenLoveDayModal}
                className="min-h-[36px] text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-xl border border-purple-200 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="p-3 bg-purple-50/40 rounded-2xl text-xs flex items-center justify-between text-stone-700 border border-purple-100/60">
              <span>Ngày kỷ niệm hiện tại:</span>
              <span className="font-bold text-purple-700">{formatVNDate(startDate)} ({totalDays} Ngày)</span>
            </div>
          </div>
        </>
      ) : (
        /* CÀI ĐẶT CÁ NHÂN KHI CHƯA GHÉP ĐÔI (Ẩn hoàn toàn tính năng cặp đôi) */
        <>
          {/* Tên hiển thị cá nhân */}
          <div className="mx-4 bg-white/95 rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Tên Hiển Thị Của Bạn
                </h4>
                <p className="text-[10px] text-stone-400">Tên sẽ hiển thị cho đối phương khi ghép đôi</p>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={nickA}
                onChange={(e) => setNickA(e.target.value)}
                placeholder="Nhập tên hiển thị của bạn"
                className="w-full text-xs font-semibold px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <button
              onClick={handleSavePersonalName}
              className="w-full min-h-[42px] py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Lưu Tên Hiển Thị</span>
            </button>
          </div>

          {/* Danh sách tính năng cặp đôi tạm khóa */}
          <div className="mx-4 bg-stone-50 rounded-3xl p-4 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>Tính Năng Dành Cho Cặp Đôi</span>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                Khóa 🔒
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] text-stone-500">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/60 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Bộ đếm ngày yêu & Kỷ niệm</span>
                </span>
                <span className="text-[10px] text-stone-400">Cần kết nối</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/60 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                  <span>Trợ lý tình yêu AI (AI Chatbot)</span>
                </span>
                <span className="text-[10px] text-stone-400">Cần kết nối</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/60 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-stone-400" />
                  <span>Khu vườn tình yêu (Love Garden 1:1)</span>
                </span>
                <span className="text-[10px] text-stone-400">Cần kết nối</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TEST BENCH & DEMO FLOW SWITCHER                               */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-stone-50 rounded-3xl p-4 border border-stone-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Kiểm Thử Toàn Bộ Luồng (Test Flows):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onResetDemoFlow('welcome')}
            className="p-2.5 bg-white hover:bg-rose-50 rounded-xl border border-stone-200 text-stone-700 font-medium text-left transition-colors shadow-2xs"
          >
            1. Welcome Screen
          </button>
          <button
            onClick={() => onResetDemoFlow('register')}
            className="p-2.5 bg-white hover:bg-rose-50 rounded-xl border border-stone-200 text-stone-700 font-medium text-left transition-colors shadow-2xs"
          >
            2. Đăng Ký (Register)
          </button>
          <button
            onClick={() => onResetDemoFlow('login')}
            className="p-2.5 bg-white hover:bg-rose-50 rounded-xl border border-stone-200 text-stone-700 font-medium text-left transition-colors shadow-2xs"
          >
            3. Đăng Nhập (Login)
          </button>
          <button
            onClick={() => onResetDemoFlow('pairing')}
            className="p-2.5 bg-white hover:bg-rose-50 rounded-xl border border-stone-200 text-stone-700 font-medium text-left transition-colors shadow-2xs"
          >
            4. Couple Pairing (5 bước)
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UNPAIR & LOGOUT ACTIONS                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-xs space-y-3">
        {/* Nút Hủy kết nối: CHỈ HIỂN THỊ KHI ĐÃ GHÉP ĐÔI (isPaired === true) */}
        {isPaired && (
          !showUnpairConfirm ? (
            <button
              onClick={() => {
                playSound('click');
                setShowUnpairConfirm(true);
              }}
              className="w-full min-h-[44px] py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors active:scale-98"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Hủy kết nối cặp đôi (Unpair)</span>
              </div>
              <span className="text-[10px] text-stone-400">Quy tắc 1:1 →</span>
            </button>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-2.5">
              <h5 className="text-xs font-bold text-rose-900">Xác nhận hủy kết nối với {userB.name}?</h5>
              <p className="text-[11px] text-stone-600 leading-snug">
                Tài khoản sẽ được giải phóng khỏi cặp đôi và quay trở lại màn hình ghép đôi.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowUnpairConfirm(false)}
                  className="flex-1 min-h-[38px] py-1.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-medium"
                >
                  Giữ liên kết
                </button>
                <button
                  onClick={() => {
                    setShowUnpairConfirm(false);
                    onUnpair();
                  }}
                  className="flex-1 min-h-[38px] py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Xác nhận Hủy
                </button>
              </div>
            </div>
          )
        )}

        {/* Nút Đăng xuất: Luôn hiển thị */}
        <button
          onClick={onLogout}
          className="w-full min-h-[44px] py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors active:scale-98"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>Đăng xuất (Logout)</span>
          </div>
          <span className="text-[10px] text-stone-400">{userA.email}</span>
        </button>
      </div>

      <div className="text-center text-[10px] text-stone-400 pt-1">
        LOVERA · Couple Relationship App · MVP Build 2026
      </div>

    </div>
  );
};
