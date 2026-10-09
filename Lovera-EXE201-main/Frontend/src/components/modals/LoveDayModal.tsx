import React, { useState } from 'react';
import { X, Calendar, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { calculateTotalDays, formatVNDate, playSound } from '../../utils/audio';

interface LoveDayModalProps {
  currentStartDate: string;
  onClose: () => void;
  onSave: (newDate: string) => void;
}

export const LoveDayModal: React.FC<LoveDayModalProps> = ({
  currentStartDate,
  onClose,
  onSave,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentStartDate);
  const [error, setError] = useState('');

  // Maximum allowed date is today (no future date allowed)
  const todayStr = new Date().toISOString().split('T')[0];

  const previewDays = calculateTotalDays(selectedDate);

  const handleDateChange = (val: string) => {
    if (val > todayStr) {
      setError('Ngày bắt đầu yêu không thể là ngày trong tương lai!');
      playSound('error');
    } else {
      setError('');
      setSelectedDate(val);
      playSound('click');
    }
  };

  const handleSave = () => {
    if (selectedDate > todayStr) {
      setError('Vui lòng chọn ngày hợp lệ trong quá khứ hoặc hôm nay.');
      playSound('error');
      return;
    }
    playSound('success');
    onSave(selectedDate);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-white rounded-t-[2rem] max-h-[90%] flex flex-col shadow-2xl border-t border-rose-100 overflow-hidden text-stone-800 animate-slide-up">
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0"></div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Love Day Counter</h3>
              <p className="text-[11px] text-stone-500">Chỉnh sửa ngày bắt đầu bên nhau</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Chọn ngày bắt đầu yêu (Start Date):
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <p className="text-[10px] text-stone-400">
              Quy tắc: Không cho phép chọn ngày tương lai lớn hơn ngày hiện tại ({todayStr}).
            </p>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-purple-500 text-white shadow-md text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-100">
              Kết Quả Tính Toán Tức Thì
            </span>
            <div className="flex items-baseline justify-center gap-2 my-2">
              <span className="text-4xl font-black font-serif-romantic tracking-tight drop-shadow-sm">
                {previewDays}
              </span>
              <span className="text-lg font-serif-romantic font-semibold text-rose-100">
                Ngày yêu
              </span>
            </div>
            <p className="text-[11px] text-rose-100 font-medium">
              Từ {formatVNDate(selectedDate)} đến nay
            </p>
          </div>

          {/* Milestone milestones */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <div className="flex items-center justify-between font-semibold text-stone-800">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>Mốc kỷ niệm tiếp theo</span>
              </span>
              <span className="text-rose-600 font-bold">
                {previewDays < 400 ? '400 Ngày' : previewDays < 500 ? '500 Ngày' : '2 Năm Yêu'}
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              Cặp đôi sẽ nhận được thông báo chúc mừng & huy hiệu kỷ niệm đặc biệt.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Lưu & Đồng Bộ Với Người Thương</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
