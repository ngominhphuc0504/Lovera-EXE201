import React from 'react';
import { Bell, Heart, Sun, Sunrise, Moon } from 'lucide-react';
import { Partner } from '../../types';

interface HeaderProps {
  currentUser: Partner;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  unreadNotifications,
  onOpenNotifications,
}) => {
  // Determine greeting & icon by time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const TimeIcon = hour < 12 ? Sunrise : hour < 18 ? Sun : Moon;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-rose-100/80 px-4 py-2 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Brand & User Greeting */}
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-rose-300/80 ring-offset-1 ring-offset-white shadow-xs">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Subtle Online Badge */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-stone-500 flex items-center gap-1 leading-tight">
            <TimeIcon className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{greeting}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <h1 className="text-sm font-bold text-stone-900 leading-none truncate">
              {currentUser.name}
            </h1>
            <span className="text-[9px] font-bold tracking-wide text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 shrink-0">
              LOVERA
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons with Standard Hit Targets (min 44x44px) */}
      <div className="flex items-center">
        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-stone-600 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all relative"
          aria-label="Xem thông báo"
          title="Thông báo tình yêu"
        >
          <Bell className="w-5 h-5 text-stone-600 hover:text-rose-600 transition-colors" />
          {unreadNotifications > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
