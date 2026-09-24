import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Users, 
  KeyRound, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Send,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { playSound } from '../../utils/audio';

export type PairingStage = 
  | 'idle'                // 1. Chưa kết nối: Chọn Tạo mã hoặc Nhập mã
  | 'create'              // 2. Tạo mã (User A hiển thị mã 6 ký tự)
  | 'join'                // 3. Nhập mã (User B nhập mã & gửi yêu cầu)
  | 'waiting_partner'     // 4a. Chờ xác nhận (User B chờ User A xác nhận)
  | 'confirm_request'     // 4b. Nhận yêu cầu (User A nhận yêu cầu và xác nhận)
  | 'success';            // 5. Ghép đôi thành công

interface PairingScreenProps {
  myPairCode: string;
  onPairSuccess: (partnerName: string) => void;
  onBackToAuth?: () => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({
  myPairCode,
  onPairSuccess,
  onBackToAuth,
}) => {
  // Generate 6-char clean code if needed
  const default6Char = (myPairCode.replace(/[^A-Z0-9]/gi, '').slice(0, 6) || 'LV8942').toUpperCase();
  const [currentCode, setCurrentCode] = useState<string>(default6Char);
  const [stage, setStage] = useState<PairingStage>('idle');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shared, setShared] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [partnerCandidate, setPartnerCandidate] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Sam',
    email: 'sam@lovera.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Handle regenerating a 6-character code
  const handleRegenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = 'LV';
    for (let i = 0; i < 4; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentCode(newCode);
    playSound('click');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentCode);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareCode = () => {
    setShared(true);
    playSound('chime');
    setTimeout(() => setShared(false), 2200);
  };

  // User B: Submits 6-character code to send pairing request
  const handleSendPairRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formatted = inputCode.trim().toUpperCase();

    if (!formatted) {
      setError('Vui lòng nhập mã kết nối gồm 6 ký tự.');
      playSound('error');
      return;
    }

    if (formatted.length !== 6) {
      setError('Mã kết nối phải có chính xác 6 ký tự (Ví dụ: LV8942).');
      playSound('error');
      return;
    }

    playSound('click');
    // Move to Waiting for confirmation stage
    setStage('waiting_partner');

    // Simulate notification arriving at User A after 2.5s for seamless testing
    const timer = setTimeout(() => {
      // If user is testing both sides, provide quick confirmation dialog
    }, 1500);

    return () => clearTimeout(timer);
  };

  // User A: Confirms partner request
  const handleAcceptRequest = () => {
    playSound('success');
    setStage('success');
  };

  // User A: Rejects partner request
  const handleRejectRequest = () => {
    playSound('click');
    setStage('create');
  };

  // Final confirmation to enter Home
  const handleEnterHome = () => {
    onPairSuccess(partnerCandidate.name);
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-50 via-rose-50/40 to-purple-50 text-stone-800 overflow-y-auto select-none">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1">
        {stage !== 'idle' && stage !== 'success' ? (
          <button
            onClick={() => {
              playSound('click');
              setError('');
              setStage('idle');
            }}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            title="Quay lại chọn cách ghép đôi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : onBackToAuth && stage === 'idle' ? (
          <button
            onClick={() => {
              playSound('click');
              onBackToAuth();
            }}
            className="w-10 h-10 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            title="Quay lại Đăng nhập"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-10"></div>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 border border-rose-200 text-rose-700 text-[11px] font-bold">
          <Heart className="w-3 h-3 fill-rose-500 text-rose-500 animate-heart-pulse" />
          <span>Ghép Đôi 1:1</span>
        </div>

        <div className="w-10"></div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TRẠNG THÁI: CHƯA KẾT NỐI (IDLE HUB)                         */}
      {/* ------------------------------------------------------------- */}
      {stage === 'idle' && (
        <div className="my-auto space-y-5 max-w-sm mx-auto w-full">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
              Kết Nối Cặp Đôi
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
              Để bảo đảm tính riêng tư, mỗi tài khoản LOVERA chỉ được liên kết độc quyền với 1 người duy nhất.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Choice 1: User A generates code */}
            <button
              onClick={() => {
                playSound('click');
                setStage('create');
              }}
              className="w-full p-4 bg-white hover:bg-rose-50/60 rounded-2xl border-2 border-rose-100 hover:border-rose-300 text-left transition-all active:scale-98 shadow-xs flex items-center gap-3.5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-rose-600 transition-colors">
                  Tôi là người tạo mã kết nối (User A)
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Tạo mã 6 ký tự để gửi cho người ấy
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Choice 2: User B enters code */}
            <button
              onClick={() => {
                playSound('click');
                setStage('join');
              }}
              className="w-full p-4 bg-white hover:bg-purple-50/60 rounded-2xl border-2 border-purple-100 hover:border-purple-300 text-left transition-all active:scale-98 shadow-xs flex items-center gap-3.5 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-purple-600 transition-colors">
                  Người ấy đã gửi mã cho tôi (User B)
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Nhập mã 6 ký tự để gửi yêu cầu ghép đôi
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-center text-[11px] text-rose-800 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Hai tài khoản chỉ liên kết sau khi cả 2 bên cùng xác nhận.</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TRẠNG THÁI: TẠO MÃ (USER A)                                */}
      {/* ------------------------------------------------------------- */}
      {stage === 'create' && (
        <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-100/70 px-3 py-0.5 rounded-full">
              Bước 1 / 3: Tạo Mã
            </span>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900 pt-1">
              Mã Ghép Đôi Của Bạn
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Gửi mã 6 ký tự này cho người ấy để bắt đầu ghép đôi.
            </p>
          </div>

          {/* 6-Character Code Display Card */}
          <div className="bg-white rounded-3xl p-6 border border-rose-200/90 shadow-sm text-center space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              Mã bảo mật 6 ký tự
            </span>

            {/* Prominent Monospace Characters */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              {currentCode.split('').map((char, index) => (
                <div
                  key={index}
                  className="w-10 h-12 rounded-xl bg-rose-50/80 border-2 border-rose-200 flex items-center justify-center font-mono font-black text-xl text-rose-600 shadow-2xs"
                >
                  {char}
                </div>
              ))}
            </div>

            {/* Quick Actions: Copy & Refresh */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyCode}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
              </button>

              <button
                onClick={handleRegenerateCode}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                title="Tạo mã 6 ký tự mới"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Đổi mã</span>
              </button>
            </div>

            {/* Share Link simulation */}
            <button
              onClick={handleShareCode}
              className="text-xs text-rose-600 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto pt-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{shared ? 'Đã sao chép link mời!' : 'Chia sẻ link mời qua Zalo / Messenger'}</span>
            </button>
          </div>

          {/* Radar Listening Status Card */}
          <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </div>
              <p className="text-xs font-semibold text-purple-900">
                Đang lắng nghe yêu cầu từ người ấy...
              </p>
            </div>
            <p className="text-[11px] text-purple-700 leading-snug">
              Khi người ấy nhập mã này trên thiết bị của họ, bạn sẽ nhận được thông báo để xác nhận.
            </p>

            {/* Tester Shortcut Button */}
            <div className="pt-2 border-t border-purple-100">
              <button
                onClick={() => {
                  playSound('chime');
                  setStage('confirm_request');
                }}
                className="w-full py-2 px-3 bg-white hover:bg-purple-100/70 text-purple-800 text-[11px] font-bold rounded-xl border border-purple-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>⚡ Mô phỏng: Nhận yêu cầu từ Sam (sam@lovera.app)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TRẠNG THÁI: NHẬP MÃ (USER B)                                */}
      {/* ------------------------------------------------------------- */}
      {stage === 'join' && (
        <form onSubmit={handleSendPairRequest} className="my-auto space-y-4 max-w-sm mx-auto w-full">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-100/70 px-3 py-0.5 rounded-full">
              Bước 1 / 3: Nhập Mã
            </span>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900 pt-1">
              Nhập Mã Của Người Ấy
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Nhập chính xác mã gồm 6 ký tự mà người ấy đã chia sẻ với bạn.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-shake shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* 6-Char Input Box */}
          <div className="bg-white rounded-3xl p-5 border border-purple-200/90 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-stone-700 text-center">
              Nhập mã 6 ký tự:
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                placeholder="LV8942"
                className="w-full text-center font-mono font-black text-2xl tracking-[0.35em] py-3.5 px-4 bg-stone-50 rounded-2xl border-2 border-stone-200 focus:border-purple-500 focus:bg-white text-purple-700 uppercase focus:outline-none transition-all shadow-inner"
              />
            </div>
            
            {/* Quick Fill for Testing */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setInputCode(currentCode);
                  playSound('click');
                }}
                className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold underline"
              >
                Dán mã mẫu ({currentCode})
              </button>
            </div>
          </div>

          {/* Action Button: Gửi yêu cầu ghép đôi */}
          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Yêu Cầu Ghép Đôi Tới Người Ấy</span>
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4a. TRẠNG THÁI: CHỜ XÁC NHẬN (USER B VIEW)                     */}
      {/* ------------------------------------------------------------- */}
      {stage === 'waiting_partner' && (
        <div className="my-auto space-y-5 max-w-sm mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center relative shadow-sm">
            <Radio className="w-8 h-8 animate-pulse text-purple-600" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-600 border-2 border-white"></span>
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-100 px-3 py-0.5 rounded-full">
              Bước 2 / 3: Chờ Xác Nhận
            </span>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900 pt-1">
              Đã Gửi Yêu Cầu!
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              Yêu cầu ghép đôi với mã <strong>{inputCode || currentCode}</strong> đã được gửi tới đối phương. Hãy nhắc người ấy mở app để nhấn xác nhận.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-2xs space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-800">Quy tắc bảo mật liên kết</h4>
                <p className="text-[10px] text-stone-500">Tài khoản chỉ chính thức kích hoạt sau khi người ấy chấp nhận yêu cầu.</p>
              </div>
            </div>

            {/* Simulation Shortcut for Testing */}
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  playSound('chime');
                  setStage('confirm_request');
                }}
                className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors text-center"
              >
                ⚡ Đổi sang vai User A (Để bấm Xác Nhận yêu cầu)
              </button>
            </div>
          </div>

          <button
            onClick={() => setStage('join')}
            className="text-xs text-stone-400 hover:text-stone-600 font-medium underline"
          >
            Hủy và nhập mã khác
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4b. TRẠNG THÁI: NHẬN YÊU CẦU & XÁC NHẬN (USER A VIEW)          */}
      {/* ------------------------------------------------------------- */}
      {stage === 'confirm_request' && (
        <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-100 px-3 py-0.5 rounded-full">
              Bước 2 / 3: Nhận Yêu Cầu Ghép Đôi
            </span>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900 pt-1">
              Lời Mời Kết Nối
            </h2>
            <p className="text-xs text-stone-500">
              Có người thương đang muốn cùng bạn chia sẻ không gian yêu!
            </p>
          </div>

          {/* Request Candidate Profile Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-rose-300 shadow-md text-center space-y-3.5 animate-scale-in">
            <div className="relative inline-block mx-auto">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-rose-200 shadow-sm mx-auto">
                <img
                  src={partnerCandidate.avatar}
                  alt={partnerCandidate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif-romantic">
                {partnerCandidate.name}
              </h3>
              <p className="text-xs text-stone-400">{partnerCandidate.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mã khớp: {currentCode}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-rose-50/60 p-3 rounded-2xl border border-rose-100 leading-relaxed">
              "Người ấy đã nhập mã kết nối của bạn và gửi yêu cầu ghép đôi. Bạn có đồng ý gắn kết tài khoản cùng nhau không?"
            </p>

            {/* Decision Buttons: Accept or Reject */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleRejectRequest}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4 text-stone-500" />
                <span>Từ chối</span>
              </button>

              <button
                onClick={handleAcceptRequest}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Ghép Đôi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TRẠNG THÁI: GHÉP ĐÔI THÀNH CÔNG (SUCCESS CELEBRATION)       */}
      {/* ------------------------------------------------------------- */}
      {stage === 'success' && (
        <div className="my-auto space-y-5 max-w-sm mx-auto w-full text-center animate-scale-in">
          <div className="relative inline-flex items-center justify-center">
            {/* Pulsing Backglow */}
            <div className="absolute w-32 h-32 bg-rose-400/25 rounded-full blur-xl animate-pulse"></div>

            {/* Connected Avatars */}
            <div className="flex items-center -space-x-3 relative z-10">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white ring-2 ring-rose-400 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
                  alt="Alex"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center z-20 border-2 border-white shadow-md animate-heart-pulse">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white ring-2 ring-purple-400 shadow-md">
                <img
                  src={partnerCandidate.avatar}
                  alt={partnerCandidate.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-3 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Liên Kết Thành Công</span>
            </div>
            <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
              Chúc Mừng Hai Bạn!
            </h2>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              Bạn và <strong>{partnerCandidate.name}</strong> đã chính thức kết nối. Khu vườn tình yêu và bộ đếm ngày đã sẵn sàng chào đón hai bạn!
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-2xs space-y-2 text-xs text-stone-700 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-stone-500">Mã cặp đôi:</span>
              <span className="font-mono font-bold text-rose-600">{currentCode}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-stone-500">Khu vườn tình yêu:</span>
              <span className="font-semibold text-emerald-600">+100 Pts Khởi tạo 🌱</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Trạng thái kết nối:</span>
              <span className="font-bold text-stone-900">Đã đồng bộ 1:1</span>
            </div>
          </div>

          {/* CTA into Couple Home */}
          <button
            onClick={handleEnterHome}
            className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Bắt Đầu Hành Trình Yêu Thương (Vào Home)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-stone-400 pb-1">
        LOVERA · Ghép đôi bảo mật 1:1 · MVP 2026
      </div>

    </div>
  );
};
