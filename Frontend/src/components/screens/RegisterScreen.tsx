import React, { useState } from 'react';
import { Heart, Lock, Mail, User as UserIcon, ArrowLeft, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, KeyRound, RotateCw } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { registerUser, verifyEmail, resendVerification } from '../../services/api';

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
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email format validation
  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  // 1. Submit Registration Form -> Backend POST /api/auth/register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

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
      setError('Vui lòng nhập mật khẩu bảo mật.');
      playSound('error');
      return;
    }
    // Backend yêu cầu tối thiểu 12 ký tự (MinLength: 12)
    if (password.length < 12) {
      setError('Mật khẩu bảo mật phải có tối thiểu 12 ký tự (theo yêu cầu của Backend .NET).');
      playSound('error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('click');

    try {
      const res = await registerUser({
        email: trimmedEmail,
        password,
        displayName: trimmedName,
      });

      playSound('chime');
      setSuccessMessage(res.message || 'Đã gửi mã xác thực tới email. Mã có hiệu lực 10 phút.');
      setStep('verify');
    } catch (err: any) {
      playSound('error');
      const code = err?.code || err?.problem?.code;
      if (code === 'email_exists') {
        setError('Địa chỉ email này đã được đăng ký trong hệ thống.');
      } else if (code === 'invalid_password') {
        setError('Mật khẩu phải dài từ 12 đến 128 ký tự.');
      } else {
        setError(err.message || 'Không thể đăng ký tài khoản. Vui lòng kiểm tra lại kết nối.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit OTP Verification -> Backend POST /api/auth/verify-email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError('Vui lòng nhập đúng mã xác thực gồm 6 chữ số.');
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('click');

    try {
      await verifyEmail({
        email: email.trim(),
        code: cleanCode,
      });

      playSound('success');
      onRegisterSuccess(email.trim(), name.trim());
    } catch (err: any) {
      playSound('error');
      const code = err?.code || err?.problem?.code;
      if (code === 'invalid_code') {
        setError('Mã xác thực không đúng, đã hết hạn hoặc hết lượt thử.');
      } else if (code === 'already_verified') {
        onRegisterSuccess(email.trim(), name.trim());
      } else {
        setError(err.message || 'Xác thực không thành công.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend OTP -> Backend POST /api/auth/resend-verification
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    playSound('click');

    try {
      const res = await resendVerification(email.trim());
      playSound('chime');
      setSuccessMessage(res.message || 'Đã gửi lại mã xác thực mới tới email.');
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      playSound('error');
      setError(err.message || 'Không thể gửi lại mã vào lúc này.');
    }
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/30 to-purple-50 text-stone-800 overflow-y-auto overflow-x-hidden w-full max-w-full select-none">
      
      {/* Top Navigation */}
      <div>
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              playSound('click');
              if (step === 'verify') {
                setStep('form');
              } else {
                onBackToWelcome();
              }
            }}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer"
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
            {step === 'form' ? <UserPlus className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
            {step === 'form' ? 'Tạo Tài Khoản' : 'Xác Thực Email'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {step === 'form'
              ? 'Bắt đầu hành trình gắn kết cùng người thương'
              : `Nhập mã 6 chữ số đã gửi tới ${email}`}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {step === 'form' ? (
        /* REGISTER FORM */
        <form onSubmit={handleRegister} className="my-auto space-y-3 max-w-sm mx-auto w-full py-2">
          
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
                placeholder="Ví dụ: Anh Phạm"
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
                placeholder="anhpham@gmail.com"
                className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700">
                Mật khẩu:
              </label>
              <span className="text-[10px] text-stone-400 font-medium">Tối thiểu 12 ký tự</span>
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
                placeholder="Tối thiểu 12 ký tự theo chuẩn Backend"
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
                placeholder="Nhập lại đúng mật khẩu"
                className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản & Gửi Mã OTP</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* VERIFY OTP FORM */
        <form onSubmit={handleVerifyOtp} className="my-auto space-y-4 max-w-sm mx-auto w-full py-2">
          
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-shake shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* 6-Digit Code Input */}
          <div className="space-y-1.5 text-center">
            <label className="block text-xs font-bold text-stone-700">
              Nhập mã xác thực (6 số):
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtpCode(val);
                if (error) setError('');
              }}
              placeholder="123456"
              className="w-full text-center text-xl tracking-[0.4em] font-mono font-bold py-3 bg-white rounded-2xl border-2 border-rose-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otpCode.length !== 6}
            className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận & Hoàn Tất</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer disabled:text-stone-400"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{resendTimer > 0 ? `Gửi lại sau (${resendTimer}s)` : 'Gửi lại mã OTP'}</span>
            </button>
          </div>
        </form>
      )}

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
            className="font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Đăng nhập
          </button>
        </p>
      </div>

    </div>
  );
};
