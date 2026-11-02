import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { playSound } from '../../utils/audio';

interface VerifyOtpModalProps {
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  email,
  onSuccess,
  onClose,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Vui lòng nhập mã OTP xác thực.');
      playSound('error');
      return;
    }

    setIsSubmitting(true);
    playSound('click');

    try {
      await authService.verify({ email, code: trimmedCode });
      playSound('success');
      onSuccess();
    } catch (err: any) {
      playSound('error');
      setError(err?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setResendSuccess('');
    playSound('click');

    try {
      await authService.resendVerification(email);
      playSound('success');
      setResendSuccess('Đã gửi lại mã xác thực mới vào email.');
      setCountdown(60);
    } catch (err: any) {
      playSound('error');
      setError(err?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-stone-100 animate-scale-in">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-rose-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
            Xác Thực Email (OTP)
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Hệ thống đã gửi mã OTP 6 số đến địa chỉ email:
          </p>
          <p className="text-xs font-bold text-rose-600 mt-0.5 truncate px-2">
            {email}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* OTP Code Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 text-center">
              Nhập mã xác thực 6 ký tự:
            </label>
            <input
              type="text"
              maxLength={10}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              placeholder="Ví dụ: 123456"
              className="w-full text-center text-xl tracking-widest font-mono font-bold py-3 bg-stone-50 rounded-2xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
              autoFocus
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Xác Thực & Kích Hoạt Tài Khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend Option */}
          <div className="pt-1 text-center">
            {countdown > 0 ? (
              <p className="text-[11px] text-stone-400">
                Gửi lại mã sau: <span className="font-bold text-stone-600">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 underline underline-offset-2 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Gửi lại mã xác thực mới</span>
              </button>
            )}
          </div>

          {/* Dev Helper: Mailpit auto fill */}
          <div className="pt-2 text-center border-t border-stone-100 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('http://localhost:8035/api/v1/messages');
                  const data = await res.json();
                  if (data?.messages?.length > 0) {
                    const latest = data.messages[0];
                    const match = latest.Snippet?.match(/(\d{6})/);
                    if (match && match[1]) {
                      setCode(match[1]);
                      playSound('chime');
                    }
                  }
                } catch {
                  // ignore
                }
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              ⚡ Lấy nhanh mã OTP từ Mailpit
            </button>
            <a
              href="http://localhost:8035"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-stone-500 hover:text-stone-700 underline"
            >
              Hòm thư Mailpit ↗
            </a>
          </div>

          {/* Helpful dev hint for Mailpit */}
          <div className="p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl text-[10px] text-purple-800 leading-relaxed text-center">
            <span>💡 <strong>Lưu ý:</strong> Khi chạy môi trường phát triển với Docker, bạn có thể xem hòm thư OTP tại </span>
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="font-bold underline text-purple-700 hover:text-purple-900"
            >
              Mailpit (localhost:8025)
            </a>.
          </div>

        </form>

      </div>
    </div>
  );
};
