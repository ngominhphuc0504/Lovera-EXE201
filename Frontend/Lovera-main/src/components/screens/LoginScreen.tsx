import React, { useState } from 'react';
import { Heart, Lock, Mail, ArrowLeft, Eye, EyeOff, AlertCircle, LogIn, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface LoginScreenProps {
  onLoginSuccess: (email: string, name: string, isAlreadyPaired: boolean) => void;
  onNavigateToRegister: () => void;
  onBackToWelcome: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onBackToWelcome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email format validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    // Basic input validations
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      playSound('error');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Địa chỉ email không đúng định dạng (Ví dụ: name@example.com).');
      playSound('error');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      playSound('error');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('click');

    setTimeout(() => {
      setIsLoading(false);
      playSound('success');

      // Determine default paired state for demo
      // If user typed alex or logged in as alex@lovera.app, we can simulate either
      const isPaired = trimmedEmail.toLowerCase().includes('paired');
      const name = trimmedEmail.split('@')[0] || 'Alex';
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      
      onLoginSuccess(trimmedEmail, capitalizedName, isPaired);
    }, 600);
  };

  // Quick preset helper for tester/demo
  const handleQuickPreset = (presetEmail: string, presetPass: string, alreadyPaired: boolean) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
    playSound('chime');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      playSound('success');
      const name = presetEmail.startsWith('alex') ? 'Alex' : 'Sam';
      onLoginSuccess(presetEmail, name, alreadyPaired);
    }, 400);
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/30 to-purple-50 text-stone-800 overflow-y-auto overflow-x-hidden w-full max-w-full select-none">
      
      {/* Top Navigation */}
      <div>
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              playSound('click');
              onBackToWelcome();
            }}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
            LOVERA AUTH
          </span>
          <div className="w-10"></div>
        </div>

        {/* Title */}
        <div className="text-center mt-4 mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mb-2 shadow-2xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
            Đăng Nhập
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Đăng nhập để vào không gian yêu của hai bạn
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="my-auto space-y-3.5 max-w-sm mx-auto w-full">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-shake shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-700">
            Địa chỉ Email:
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="alex@lovera.app"
              className="w-full text-xs font-medium pl-10 pr-4 py-3 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-stone-700">
              Mật khẩu:
            </label>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full text-xs font-medium pl-10 pr-10 py-3 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </>
          )}
        </button>

        {/* Quick Test Demo Presets */}
        <div className="pt-2">
          <p className="text-[10px] text-stone-400 text-center font-medium mb-1.5">
            Lối tắt kiểm thử nhanh cho Tester:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('alex.new@lovera.app', 'password123', false)}
              className="p-2 bg-white/90 hover:bg-rose-50 rounded-xl border border-rose-100 text-[10px] text-stone-700 font-semibold text-left transition-colors shadow-2xs flex flex-col"
            >
              <span className="text-rose-600 font-bold">1. Alex (Chưa kết nối)</span>
              <span className="text-[9px] text-stone-400">→ Chuyển đến Pairing</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('alex.paired@lovera.app', 'password123', true)}
              className="p-2 bg-white/90 hover:bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-stone-700 font-semibold text-left transition-colors shadow-2xs flex flex-col"
            >
              <span className="text-emerald-700 font-bold">2. Alex (Đã ghép đôi)</span>
              <span className="text-[9px] text-stone-400">→ Vào thẳng Couple Home</span>
            </button>
          </div>
        </div>
      </form>

      {/* Footer Switcher */}
      <div className="pt-4 text-center">
        <p className="text-xs text-stone-500">
          Chưa có tài khoản LOVERA?{' '}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onNavigateToRegister();
            }}
            className="font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>

    </div>
  );
};
