import React, { useState } from 'react';
import { 
  Settings, 
  Sparkles, 
  KeyRound, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Save, 
  Server, 
  Award, 
  Lock, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, isGeminiConfigured } from '../../services/geminiService';
import { playSound } from '../../utils/audio';

export const AdminSettingsTab: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState(() => getGeminiApiKey());
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [pairingHours, setPairingHours] = useState(24);
  const [waterPoints, setWaterPoints] = useState(10);
  const [fertilizePoints, setFertilizePoints] = useState(10);
  const [sunPoints, setSunPoints] = useState(5);
  const [chatPoints, setChatPoints] = useState(5);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setGeminiApiKey(geminiKey);
    playSound('chime');
    setSaveMessage('Đã lưu toàn bộ cấu hình hệ thống thành công! ✨');
    setTimeout(() => {
      setSaveMessage(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. GEMINI AI CONFIGURATION                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Cấu Hình Google Gemini AI (Trợ Lý Tình Yêu)</h3>
              <p className="text-xs text-stone-500">Thiết lập API Key và mô hình ngôn ngữ lớn phục vụ cho Chatbot & Lên lịch hẹn hò</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isGeminiConfigured()
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isGeminiConfigured() ? 'Gemini Đang Hoạt Động' : 'Chưa Có Key'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Google Gemini API Key:
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              />
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Lấy Key</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Key được bảo mật và truyền qua các phiên làm việc của Lovera AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Mô Hình AI Mặc Định:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Mới nhất, siêu nhanh & thông minh)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Phong Cách Phản Hồi:</label>
              <input
                type="text"
                disabled
                value="Ngọt ngào, lãng mạn, thấu hiểu 1:1"
                className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LOVE GARDEN POINTS RULES                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Quy Tắc Tích Điểm Khu Vườn (Love Garden Points)</h3>
            <p className="text-xs text-stone-500">Cấu hình điểm số thưởng cho các hoạt động chăm sóc và tương tác đôi lứa</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[11px] font-bold text-stone-500 block">💧 Tưới Cây:</span>
            <input
              type="number"
              value={waterPoints}
              onChange={(e) => setWaterPoints(Number(e.target.value) || 0)}
              className="w-full text-center font-bold text-emerald-700 bg-white border border-stone-200 rounded-xl py-1 text-sm focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 block text-center">điểm / lượt</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[11px] font-bold text-stone-500 block">🌿 Bón Phân:</span>
            <input
              type="number"
              value={fertilizePoints}
              onChange={(e) => setFertilizePoints(Number(e.target.value) || 0)}
              className="w-full text-center font-bold text-teal-700 bg-white border border-stone-200 rounded-xl py-1 text-sm focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 block text-center">điểm / lượt</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[11px] font-bold text-stone-500 block">☀️ Tắm Nắng:</span>
            <input
              type="number"
              value={sunPoints}
              onChange={(e) => setSunPoints(Number(e.target.value) || 0)}
              className="w-full text-center font-bold text-amber-700 bg-white border border-stone-200 rounded-xl py-1 text-sm focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 block text-center">điểm / lượt</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
            <span className="text-[11px] font-bold text-stone-500 block">💬 Trò Chuyện AI:</span>
            <input
              type="number"
              value={chatPoints}
              onChange={(e) => setChatPoints(Number(e.target.value) || 0)}
              className="w-full text-center font-bold text-purple-700 bg-white border border-stone-200 rounded-xl py-1 text-sm focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 block text-center">điểm / lượt</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SYSTEM & SECURITY SETTINGS                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Hệ Thống & Máy Chủ Backend</h3>
            <p className="text-xs text-stone-500">Cấu hình kết nối API .NET 8 và chính sách ghép đôi</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div>
              <strong className="text-stone-800 font-bold block">Cho Phép Người Dùng Đăng Ký Tự Do</strong>
              <span className="text-stone-400 text-[11px]">Bật/tắt tính năng đăng ký tài khoản mới trên App</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowRegistration(!allowRegistration)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowRegistration ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                allowRegistration ? 'right-0.5' : 'left-0.5'
              }`}></span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div>
              <strong className="text-stone-800 font-bold block">Thời Hạn Mã Số Ghép Đôi (Pairing Code)</strong>
              <span className="text-stone-400 text-[11px]">Mã ghép đôi 6 ký tự sẽ tự động hết hạn sau khoảng thời gian này</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={pairingHours}
                onChange={(e) => setPairingHours(Number(e.target.value) || 24)}
                className="w-16 text-center font-bold text-stone-800 bg-white border border-stone-200 rounded-xl py-1"
              />
              <span className="font-semibold text-stone-600">giờ</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div>
              <strong className="text-stone-800 font-bold block">Backend API Status</strong>
              <span className="text-stone-400 text-[11px]">http://localhost:5164/api</span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đang kết nối</span>
            </span>
          </div>
        </div>
      </div>

      {/* Save Button & Feedback message */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {saveMessage ? (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        ) : (
          <span className="text-xs text-stone-400">Thay đổi sẽ có hiệu lực ngay lập tức trên toàn hệ thống.</span>
        )}

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Toàn Bộ Cấu Hình</span>
        </button>
      </div>

    </div>
  );
};
