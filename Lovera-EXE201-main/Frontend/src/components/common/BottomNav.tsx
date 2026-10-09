import React from 'react';
import { Heart, Sparkles, Droplets, User } from 'lucide-react';
import { Screen } from '../../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  gardenNotification?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  gardenNotification = true,
}) => {
  const navItems: { id: Screen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'planner', label: 'Date Plan', icon: Sparkles },
    { id: 'garden', label: 'Garden', icon: Droplets },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav 
      aria-label="Thanh điều hướng chính"
      className="fixed sm:absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-rose-100/90 px-3 py-1.5 flex items-center justify-around z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-2xl transition-all relative select-none ${
              isActive
                ? 'text-rose-600 font-bold'
                : 'text-stone-400 hover:text-stone-600 active:scale-95'
            }`}
            aria-label={item.label}
          >
            <div 
              className={`relative px-3 py-1 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-rose-50/90 shadow-2xs text-rose-600' 
                  : 'text-stone-400'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? 'scale-110 text-rose-600 fill-rose-100' : 'text-stone-400'
                }`}
              />
              {item.id === 'garden' && gardenNotification && (
                <span className="absolute 1 top-0.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </div>
            <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-rose-600' : 'font-medium text-stone-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
