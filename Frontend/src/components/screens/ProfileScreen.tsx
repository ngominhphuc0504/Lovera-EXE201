import React, { useState } from 'react';
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
  Edit2
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
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  couple,
  onUpdateNicknames,
  onOpenLoveDayModal,
  onUnpair,
  onLogout,
  onResetDemoFlow,
}) => {
  const { userA, userB, startDate, coupleId } = couple;
  const totalDays = calculateTotalDays(startDate);

  const [nickA, setNickA] = useState(userA.name);
  const [nickB, setNickB] = useState(userB.name);
  const [savedToast, setSavedToast] = useState('');
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);

  const handleSaveNicknames = () => {
    onUpdateNicknames(nickA, nickB);
    setSavedToast('Đã lưu biệt danh mới của hai bạn!');
    playSound('success');
    setTimeout(() => setSavedToast(''), 2500);
  };

  return (
    <div className="space-y-4 pb-28 pt-3 text-stone-800 select-none">
      
      {/* Screen Header */}
      <div className="mx-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wide">
            <User className="w-3.5 h-3.5" />
            <span>Tài Khoản & Cài Đặt</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 font-serif-romantic">
            Không Gian Chung
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full border border-stone-200">
          Mã: {coupleId}
        </span>
      </div>

      {/* Couple Hero Summary Card */}
      <div className="mx-4 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-5 text-white shadow-md text-center relative overflow-hidden">
        <div className="flex items-center justify-center -space-x-3 mb-2.5">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={userA.avatar} alt={userA.name} className="w-full h-full object-cover" />
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

      {savedToast && (
        <div className="mx-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-fade-in shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. NICKNAME SETTINGS                                          */}
      {/* ------------------------------------------------------------- */}
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

      {/* ------------------------------------------------------------- */}
      {/* 2. ANNIVERSARY SETTINGS                                       */}
      {/* ------------------------------------------------------------- */}
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

      {/* ------------------------------------------------------------- */}
      {/* 3. TEST BENCH & DEMO FLOW SWITCHER                            */}
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
      {/* 4. UNPAIR & LOGOUT ACTIONS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-4 bg-white/95 rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-xs space-y-3">
        {!showUnpairConfirm ? (
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
                onClick={onUnpair}
                className="flex-1 min-h-[38px] py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Xác nhận Hủy
              </button>
            </div>
          </div>
        )}

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
