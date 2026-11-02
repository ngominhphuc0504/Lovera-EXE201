import React, { useState } from 'react';
import { Heart, Lock, Mail, User as UserIcon, ArrowLeft, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { authService } from '../../services/authService';
import { VerifyOtpModal } from '../modals/VerifyOtpModal';

interface RegisterScreenProps {
  onRegisterSuccess: (email: string, name: string) => void;
  onNavigateToLogin: () => void;
  onBackToWelcome: () => void;
  onNavigateToAdmin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToWelcome,
  onNavigateToAdmin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  // Email format validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowOfflineFallback(false);

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

    try {
      // Call Real Backend API: POST /api/auth/register
      await authService.register({
        email: trimmedEmail,
        password,
        displayName: trimmedName,
      });

      setIsLoading(false);
      playSound('success');
      setRegisteredEmail(trimmedEmail);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setIsLoading(false);
      playSound('error');
      setError(err?.message || 'Không thể đăng ký tài khoản qua API backend.');
      setShowOfflineFallback(true);
    }
  };

  // Called when OTP verification succeeds
  const handleOtpVerified = async () => {
    setIsOtpModalOpen(false);
    try {
      // Auto-login with credentials
      await authService.login({ email: registeredEmail, password });
    } catch {
      // ignore auto-login failure
    }
    onRegisterSuccess(registeredEmail, name.trim());
  };

  // Continue demo/offline mode
  const handleBypassToDemo = () => {
    playSound('chime');
    setIsOtpModalOpen(false);
    onRegisterSuccess(email.trim() || 'user@lovera.app', name.trim() || 'Alex');
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
            className="w-10 h-10 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
              LOVERA AUTH API
            </span>
          </div>

          {onNavigateToAdmin ? (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onNavigateToAdmin();
              }}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Chuyển sang Web Admin"
            >
              <Shield className="w-3 h-3 text-purple-600" />
              <span>Admin</span>
            </button>
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        {/* Title */}
        <div className="text-center mt-3 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white mb-2 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
            Tạo Tài Khoản Mới
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kết nối API Backend thực tế .NET 8 (Brevo OTP)
          </p>
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleRegister} className="my-auto space-y-3 max-w-sm mx-auto w-full py-2">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex flex-col gap-1.5 animate-shake shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            {showOfflineFallback && (
              <button
                type="button"
                onClick={handleBypassToDemo}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline text-left pt-1 cursor-pointer"
              >
                👉 Máy chủ Database chưa bật? Nhấn đây để tiếp tục chế độ Thử nghiệm (Demo)
              </button>
            )}
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
              placeholder="alex@example.com"
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-700">
            Mật khẩu (Tối thiểu 6 ký tự):
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
              className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
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
          className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Đăng Ký Tài Khoản & Nhận OTP</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Switcher */}
      <div className="pt-2 text-center space-y-1">
        <p className="text-xs text-stone-500">
          Đã có tài khoản LOVERA?{' '}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onNavigateToLogin();
            }}
            className="font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Đăng nhập
          </button>
        </p>

        {onNavigateToAdmin && (
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onNavigateToAdmin();
            }}
            className="text-[11px] font-bold text-purple-600 hover:text-purple-700 underline underline-offset-2 inline-flex items-center gap-1 mx-auto cursor-pointer"
          >
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Vào Bảng Điều Khiển Quản Trị (Web Admin)</span>
          </button>
        )}
      </div>

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <VerifyOtpModal
          email={registeredEmail}
          onSuccess={handleOtpVerified}
          onClose={() => setIsOtpModalOpen(false)}
        />
      )}

    </div>
  );
};
