import React, { useState } from 'react';
import { Heart, Lock, Mail, ArrowLeft, Eye, EyeOff, AlertCircle, LogIn, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import loveraLogo from '../../assets/images/lovera_logo.png';
import { playSound } from '../../utils/audio';
import { authService } from '../../services/authService';
import { coupleService } from '../../services/coupleService';
import { VerifyOtpModal } from '../modals/VerifyOtpModal';

interface LoginScreenProps {
  onLoginSuccess: (email: string, name: string, isAlreadyPaired: boolean, isDemoMode: boolean) => void;
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
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  // Email format validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowOfflineFallback(false);

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

    try {
      // Call Real Backend API: POST /api/auth/login
      const result = await authService.login({
        email: trimmedEmail,
        password,
      });

      setIsLoading(false);
      playSound('success');

      let isPaired = false;
      try {
        const pairingStatus = await coupleService.getStatus();
        isPaired = Boolean(pairingStatus.isPaired);
      } catch (statusErr) {
        console.warn('[LoginScreen] Could not fetch pairing status from backend:', statusErr);
      }
      const displayName = result.profile?.displayName || trimmedEmail.split('@')[0] || 'Alex';
      const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

      onLoginSuccess(trimmedEmail, capitalizedName, isPaired, false);
    } catch (err: any) {
      setIsLoading(false);
      playSound('error');

      // If email is not verified yet, open OTP Modal
      if (err?.code === 'email_unverified' || err?.message?.includes('xác thực')) {
        setIsOtpModalOpen(true);
        setError('Tài khoản chưa xác thực email. Vui lòng nhập mã OTP đã nhận.');
        return;
      }

      setError(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu.');
      setShowOfflineFallback(true);
    }
  };

  // Continue demo/offline mode
  const handleBypassToDemo = () => {
    playSound('chime');
    const isPaired = email.toLowerCase().includes('paired');
    const name = email.split('@')[0] || 'User';
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    onLoginSuccess(email.trim() || 'user@lovera.app', capitalizedName, isPaired, true);
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/30 to-purple-50 text-stone-800 overflow-y-auto overflow-x-hidden w-full max-w-full select-none">
      
      {/* Top Navigation */}
      <div>
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              playSound('click');
              onBackToWelcome();
            }}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="w-9"></div>
        </div>

        {/* Brand Header & Logo */}
        <div className="text-center mt-0.5 mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-purple-600 text-white shadow-md shadow-rose-500/25 mb-1.5 animate-soft-float">
            <Heart className="w-7 h-7 fill-white animate-heart-pulse" />
          </div>
          <h1 className="font-serif-romantic text-2xl font-bold tracking-tight text-stone-900 leading-tight">
            LOVERA
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mt-0.5">
            COUPLE RELATIONSHIP APP
          </p>
          <h2 className="font-serif-romantic text-lg font-bold text-stone-800 mt-2">
            Đăng Nhập
          </h2>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="my-auto space-y-3.5 max-w-sm mx-auto w-full">
        
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
              placeholder="email@example.com hoặc admin@lovera.app"
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
              className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Qua API</span>
            </>
          )}
        </button>
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
            className="font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <VerifyOtpModal
          email={email.trim()}
          onSuccess={async () => {
            setIsOtpModalOpen(false);
            let isPaired = false;
            try {
              const pairingStatus = await coupleService.getStatus();
              isPaired = Boolean(pairingStatus.isPaired);
            } catch (statusErr) {
              console.warn('[LoginScreen] Could not fetch pairing status after OTP:', statusErr);
            }
            const name = email.split('@')[0] || 'Alex';
            onLoginSuccess(email.trim(), name, isPaired, false);
          }}
          onClose={() => setIsOtpModalOpen(false)}
        />
      )}

    </div>
  );
};
