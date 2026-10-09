import React from 'react';
import { X, Bell, Heart, Droplets, Sparkles, CheckCheck } from 'lucide-react';
import { AppNotification } from '../../types';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'ping':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'garden':
        return <Droplets className="w-4 h-4 text-emerald-500 fill-emerald-100" />;
      case 'planner':
        return <Sparkles className="w-4 h-4 text-purple-500 fill-purple-100" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-white rounded-t-[2rem] max-h-[85%] flex flex-col shadow-2xl border-t border-rose-100 overflow-hidden text-stone-800 animate-slide-up">
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0"></div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Hộp Thư Tình Yêu</h3>
              <p className="text-[11px] text-stone-500">Hoạt động mới nhất từ đối phương</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              Chưa có thông báo mới nào
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  notif.read
                    ? 'bg-stone-50/70 border-stone-100 opacity-80'
                    : 'bg-rose-50/40 border-rose-200/90 shadow-2xs'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs border border-rose-100 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-xs text-stone-900 leading-tight truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-stone-400 shrink-0 ml-1">{notif.time}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 flex items-center justify-between text-xs bg-stone-50">
          <button
            onClick={onMarkAllRead}
            className="text-stone-600 hover:text-rose-600 font-semibold text-[11px] flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đánh dấu đã đọc tất cả</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 font-semibold text-[11px] hover:bg-stone-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
