import React, { useState } from 'react';
import { Heart, Lock, Mail, User as UserIcon, ArrowLeft, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface RegisterScreenProps {
  onRegisterSuccess: (email: string, name: string) => void;
  onNavigateToLogin: () => void;
  onBackToWelcome: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToWelcome,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email format validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // 1. Name validation
    if (!trimmedName) {
      setError('Vui lòng nhập họ tên hoặc biệt danh của bạn.');
      playSound('error');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Họ tên hoặc biệt danh phải có ít nhất 2 ký tự.');
      playSound('error');
      return;
    }

    // 2. Email validation
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

    // 3. Password validation
    if (!password) {
      setError('Vui lòng nhập mật khẩu bảo mật.');
      playSound('error');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu bảo mật phải có tối thiểu 6 ký tự.');
      playSound('error');
      return;
    }

    // 4. Confirm Password validation
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('click');

    setTimeout(() => {
      setIsLoading(false);
      playSound('success');
      // Registered user is new -> always un-paired, moves to Pairing flow
      onRegisterSuccess(trimmedEmail, trimmedName);
    }, 700);
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
        <div className="text-center mt-3 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white mb-2 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
            Tạo Tài Khoản
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Bắt đầu hành trình gắn kết cùng người thương
          </p>
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleRegister} className="my-auto space-y-3 max-w-sm mx-auto w-full py-2">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-shake shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Name Field */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-700">
            Họ tên / Biệt danh:
          </label>
          <div className="relative flex items-center">
            <UserIcon className="absolute left-3.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: Alex"
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
          </div>
        </div>

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
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-700">
            Mật khẩu:
          </label>
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
              className="w-full text-xs font-medium pl-10 pr-10 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
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

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-700">
            Xác nhận mật khẩu:
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Nhập lại mật khẩu"
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
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
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản & Tiếp Tục</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Switcher */}
      <div className="pt-2 text-center">
        <p className="text-xs text-stone-500">
          Đã có tài khoản LOVERA?{' '}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onNavigateToLogin();
            }}
            className="font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Đăng nhập
          </button>
        </p>
      </div>

    </div>
  );
};
