import React, { useState, useEffect } from 'react';
import { Eye, Camera, X, ChevronRight, ArrowLeft } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface AvatarActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  userName: string;
  isOwnAvatar?: boolean;
  onEditAvatar?: () => void;
}

export const AvatarActionModal: React.FC<AvatarActionModalProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  userName,
  isOwnAvatar = true,
  onEditAvatar,
}) => {
  // mode: 'menu' (chọn 1 trong 2 mục) hoặc 'view' (phóng to xem ảnh)
  const [mode, setMode] = useState<'menu' | 'view'>('menu');

  // Reset về menu mỗi khi mở modal lại (nếu là ảnh của mình), hoặc view nếu là ảnh đối phương
  useEffect(() => {
    if (isOpen) {
      setMode(isOwnAvatar ? 'menu' : 'view');
    }
  }, [isOpen, isOwnAvatar]);

  if (!isOpen) return null;

  const handleClose = () => {
    playSound('click');
    onClose();
  };

  const handleSelectView = () => {
    playSound('click');
    setMode('view');
  };

  const handleSelectEdit = () => {
    playSound('click');
    onClose();
    if (onEditAvatar) {
      onEditAvatar();
    }
  };

  // -------------------------------------------------------------
  // 1. CHẾ ĐỘ XEM ẢNH ĐẠI DIỆN TOÀN MÀN HÌNH (VIEW MODE)
  // -------------------------------------------------------------
  if (mode === 'view') {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in select-none">
        {/* Top Navigation */}
        <div className="flex items-center justify-between text-white pt-2 px-1">
          {isOwnAvatar ? (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setMode('menu');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tùy chọn</span>
            </button>
          ) : (
            <div className="w-10"></div>
          )}

          <div className="text-center">
            <h3 className="font-bold text-sm text-white">Ảnh đại diện</h3>
            <p className="text-[11px] text-white/70">{userName}</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Large High-Res Avatar Display */}
        <div className="my-auto flex flex-col items-center justify-center p-2">
          <div className="relative max-w-[280px] sm:max-w-xs w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 ring-1 ring-white/10 group">
            <img
              src={avatarUrl}
              alt={userName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pb-4 max-w-sm mx-auto w-full">
          {isOwnAvatar && onEditAvatar && (
            <button
              type="button"
              onClick={handleSelectEdit}
              className="w-full sm:w-auto flex-1 min-h-[44px] py-2.5 px-5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Chỉnh sửa & thay ảnh</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-6 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. CHẾ ĐỘ CHỌN 2 MỤC (MENU MODE: 1. COI AVATAR, 2. CHỈNH SỬA)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-rose-100 animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-rose-400 ring-offset-1 ring-offset-white shadow-xs shrink-0">
              <img
                src={avatarUrl}
                alt={userName}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 leading-tight">
                {userName}
              </h3>
              <p className="text-[11px] text-stone-500">Tùy chọn ảnh đại diện</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Lựa chọn chính theo yêu cầu người dùng */}
        <div className="space-y-2.5 pt-1">
          {/* Mục 1: Coi ảnh đại diện */}
          <button
            type="button"
            onClick={handleSelectView}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 transition-all text-left group active:scale-98 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-stone-900">
                  1. Xem ảnh đại diện
                </h4>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded-md">
                  Toàn màn hình
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Xem ảnh phóng to rõ nét và chi tiết
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-rose-500 transition-colors" />
          </button>

          {/* Mục 2: Chỉnh sửa thay ảnh */}
          <button
            type="button"
            onClick={handleSelectEdit}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 transition-all text-left group active:scale-98 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-stone-900">
                  2. Chỉnh sửa & thay ảnh
                </h4>
                <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.2 rounded-md">
                  Tải ảnh mới
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Chọn ảnh từ máy, xoay và cắt tỉ lệ chuẩn
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-500 transition-colors" />
          </button>
        </div>

        {/* Nút Hủy / Đóng */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
