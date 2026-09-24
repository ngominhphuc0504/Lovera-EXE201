import React, { useState } from 'react';
import { Heart, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface AuthScreenProps {
  onLoginSuccess: (email: string, name: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('alex@lovera.app');
  const [name, setName] = useState('Alex');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      playSound('error');
      return;
    }

    if (!email.includes('@')) {
      setError('Địa chỉ email không hợp lệ.');
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('click');

    setTimeout(() => {
      setIsLoading(false);
      playSound('success');
      onLoginSuccess(email, name || 'Alex');
    }, 600);
  };

  const handleQuickFill = (targetName: string, targetEmail: string) => {
    setName(targetName);
    setEmail(targetEmail);
    setPassword('lovera2026');
    playSound('chime');
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/30 to-purple-50 text-stone-800 overflow-y-auto">
      {/* Top Brand Header */}
      <div className="text-center pt-3 pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-md shadow-rose-400/20 mb-2">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
          LOVERA
        </h2>
        <p className="text-xs text-stone-500">
          {isLoginMode ? 'Đăng nhập vào không gian yêu của hai bạn' : 'Tạo tài khoản LOVERA mới'}
        </p>
      </div>

      {/* Tabs: Đăng nhập / Đăng ký */}
      <div className="bg-stone-200/60 p-1 rounded-2xl flex max-w-xs mx-auto w-full my-3">
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(true);
            setError('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            isLoginMode ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(false);
            setError('');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            !isLoginMode ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Đăng ký
        </button>
      </div>

      {/* Auth Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-rose-100/90 shadow-sm space-y-3.5 my-auto">
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {!isLoginMode && (
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Họ tên hoặc Biệt danh
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Alex"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50/80 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
            Email hoặc Tên tài khoản
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@lovera.app"
              required
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50/80 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50/80 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : (
            <>
              <span>{isLoginMode ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Quick Demo Selection for Tester convenience */}
        <div className="pt-2 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 mb-1.5 font-medium">Chọn nhanh tài khoản Demo:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('Alex', 'alex@lovera.app')}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-rose-500" />
              <span>Alex (Partner 1)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Sam', 'sam@lovera.app')}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-purple-500" />
              <span>Sam (Partner 2)</span>
            </button>
          </div>
        </div>
      </form>

      <div className="text-center pt-2 pb-1 text-[11px] text-stone-400">
        LOVERA · Bảo mật & Kết nối tình yêu chân thành
      </div>
    </div>
  );
};
