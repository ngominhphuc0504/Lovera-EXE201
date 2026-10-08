import React, { useState } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  Clock, 
  MapPin, 
  Utensils, 
  Heart, 
  Bookmark, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft,
  Calendar,
  Layers,
  Compass
} from 'lucide-react';
import { DatePlan, DateType } from '../../types';
import { playSound } from '../../utils/audio';

interface DatePlannerScreenProps {
  currentPlan: DatePlan | null;
  onSavePlan: (plan: DatePlan) => void;
  onCompletePlan: (plan: DatePlan) => void;
  onGeneratePlan: (params: {
    budget: number;
    time: string;
    location: string;
    foodPref: string;
    activityPref: DateType;
    simulateBr05Error?: boolean;
  }) => void;
  isGenerating: boolean;
}

export const DatePlannerScreen: React.FC<DatePlannerScreenProps> = ({
  currentPlan,
  onSavePlan,
  onCompletePlan,
  onGeneratePlan,
  isGenerating,
}) => {
  const [viewState, setViewState] = useState<'form' | 'result'>(currentPlan ? 'result' : 'form');

  // Form Preferences
  const [budget, setBudget] = useState<number | string>(65);
  const [time, setTime] = useState<string>('Tối hoàng hôn (18:00 - 21:30)');
  const [location, setLocation] = useState<string>('Quận trung tâm & View bờ sông');
  const [foodPref, setFoodPref] = useState<string>('Món Âu lãng mạn dưới ánh nến');
  const [activityPref, setActivityPref] = useState<DateType>('Romantic');
  const [formError, setFormError] = useState<string>('');

  // BR05 Simulation Flag for QA testing
  const [simulateBr05Violation, setSimulateBr05Violation] = useState<boolean>(false);

  const timeOptions = [
    'Buổi sáng tinh mơ (08:30 - 11:30)',
    'Buổi chiều cà phê (14:00 - 17:30)',
    'Tối hoàng hôn (18:00 - 21:30)',
    'Cả ngày cuối tuần trọn vẹn'
  ];

  const locationOptions = [
    'Quận trung tâm & View bờ sông',
    'Góc phố nhỏ yên tĩnh',
    'Tại nhà ấm cúng riêng tư',
    'Ngoại ô & Dã ngoại thiên nhiên'
  ];

  const foodOptions = [
    'Món Âu lãng mạn dưới ánh nến',
    'Tiệm trà hoa & Bánh ngọt thủ công',
    'Nồi lẩu gia đình nghi ngút khói',
    'Ẩm thực đường phố & Món ăn vặt'
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numBudget = Number(budget);

    if (!budget || isNaN(numBudget) || numBudget <= 0) {
      setFormError('Ngân sách phải lớn hơn $0 (Vui lòng nhập tối thiểu $15).');
      playSound('error');
      return;
    }

    if (numBudget < 15) {
      setFormError('Ngân sách tối thiểu cho một buổi hẹn trọn vẹn là $15.');
      playSound('error');
      return;
    }

    playSound('click');
    onGeneratePlan({
      budget: numBudget,
      time,
      location,
      foodPref,
      activityPref,
      simulateBr05Error: simulateBr05Violation,
    });
    setViewState('result');
  };

  return (
    <div className="space-y-4 pb-24 pt-3 text-stone-800 select-none">
      
      {/* Screen Header */}
      <div className="mx-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Dating Planner</span>
          </div>
          <h2 className="text-base font-bold text-stone-900 font-serif-romantic">
            {viewState === 'form' ? 'Thiết Kế Buổi Hẹn Hò' : 'Lịch Trình Hẹn Hò Đã Tạo'}
          </h2>
        </div>

        {viewState === 'result' && !isGenerating && (
          <button
            onClick={() => setViewState('form')}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tạo mới</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DATE PREFERENCES FORM                                      */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'form' && !isGenerating && (
        <form onSubmit={handleGenerate} className="mx-4 bg-white/95 rounded-3xl p-5 border border-rose-100/90 shadow-xs space-y-4">
          
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Budget Input */}
          <div className="space-y-2.5 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/80">
            <div className="flex items-center justify-between">
              <label htmlFor="budget-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-500" />
                <span>Ngân sách cặp đôi (Budget):</span>
              </label>
              <span className="text-[11px] text-rose-500 font-bold bg-rose-100/60 px-2 py-0.5 rounded-full">
                USD ($)
              </span>
            </div>

            {/* Direct Number Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base font-bold text-stone-400 select-none">
                $
              </span>
              <input
                id="budget-input"
                type="number"
                inputMode="numeric"
                min="15"
                step="5"
                placeholder="Ví dụ: 65"
                value={budget}
                onChange={(e) => {
                  const val = e.target.value;
                  setBudget(val === '' ? '' : Number(val));
                }}
                className="w-full text-base font-bold pl-8 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs transition-all"
              />
            </div>

            {/* Quick Preset Buttons for Convenience */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-stone-400 font-medium shrink-0">Chọn nhanh:</span>
              {[30, 50, 65, 100, 150].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setBudget(preset);
                    playSound('click');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    Number(budget) === preset
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'bg-white hover:bg-rose-100/70 text-stone-600 border border-stone-200/80'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Type Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">
              Phong cách buổi hẹn ưa thích:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Romantic', 'Cozy', 'Adventure'] as DateType[]).map((type) => {
                const isSelected = activityPref === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setActivityPref(type);
                      playSound('click');
                    }}
                    className={`min-h-[44px] py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-rose-50 text-stone-600 border border-stone-200/80'
                    }`}
                  >
                    {type === 'Romantic' ? '🌹 Lãng Mạn' : type === 'Cozy' ? '☕ Ấm Cúng' : '🎒 Phiêu Lưu'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>Khung giờ hẹn hò:</span>
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {timeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Location Preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Khu vực / Địa điểm hẹn:</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Food Preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>Sở thích ẩm thực:</span>
            </label>
            <select
              value={foodPref}
              onChange={(e) => setFoodPref(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {foodOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* QA BR05 Tester Simulation Toggle */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 bg-stone-50/50 p-2.5 rounded-xl border border-stone-100">
            <span>Mô phỏng thử nghiệm vi phạm BR05 (Cost &gt; Budget):</span>
            <input
              type="checkbox"
              checked={simulateBr05Violation}
              onChange={(e) => setSimulateBr05Violation(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full min-h-[46px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo Kế Hoạch Hẹn Hò Bằng AI (+5 pts)</span>
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LOADING STATE (SKELETON SHIMMER CARD)                         */}
      {/* ------------------------------------------------------------- */}
      {isGenerating && (
        <div className="mx-4 bg-white/95 rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4">
          <div className="text-center py-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 mx-auto flex items-center justify-center animate-heart-pulse">
              <Sparkles className="w-6 h-6 fill-rose-400 text-rose-500" />
            </div>
            <h3 className="font-serif-romantic text-sm font-bold text-stone-900">
              AI Cupid đang thiết kế buổi hẹn...
            </h3>
            <p className="text-xs text-stone-500 max-w-[260px] mx-auto">
              Đang tối ưu lịch trình và tính toán chi phí khớp với ngân sách <strong>${budget}</strong>
            </p>
          </div>

          {/* Shimmer Skeleton items */}
          <div className="space-y-3 pt-2">
            <div className="h-4 bg-rose-100/60 rounded-full w-2/3 animate-pulse"></div>
            <div className="h-16 bg-stone-100 rounded-2xl animate-pulse"></div>
            <div className="h-16 bg-stone-100 rounded-2xl animate-pulse"></div>
            <div className="h-10 bg-purple-50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EMPTY STATE (WHEN RESULT IS EMPTY)                            */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'result' && !currentPlan && !isGenerating && (
        <div className="mx-4 bg-white/95 rounded-3xl p-8 border border-rose-100/90 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="font-serif-romantic text-base font-bold text-stone-900">
            Chưa có kế hoạch hẹn hò nào
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Hãy bắt đầu bằng việc chia sẻ ngân sách và phong cách mong muốn để AI gợi ý buổi hẹn hoàn hảo!
          </p>
          <button
            onClick={() => setViewState('form')}
            className="py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Tạo kế hoạch ngay
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DATE PLAN RESULT CARD                                      */}
      {/* ------------------------------------------------------------- */}
      {viewState === 'result' && currentPlan && !isGenerating && (
        <div className="mx-4 space-y-3.5">
          
          {/* BR05 Business Rule Validation Alert Check */}
          {currentPlan.totalCost > currentPlan.budget ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 text-rose-900 space-y-2.5 shadow-xs animate-shake">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wide text-rose-900">
                  Cảnh Báo Vi Phạm Quy Tắc BR05
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-rose-800">
                Tổng chi phí do AI tính toán (<strong>${currentPlan.totalCost}</strong>) vượt quá ngân sách bạn đã đặt (<strong>${currentPlan.budget}</strong>). Theo quy tắc nghiệp vụ BR05, hệ thống từ chối lưu kế hoạch này.
              </p>
              <button
                onClick={() => setViewState('form')}
                className="w-full min-h-[40px] py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Điều chỉnh ngân sách & Thử lại</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đạt chuẩn BR05: Chi phí (${currentPlan.totalCost}) &le; Ngân sách (${currentPlan.budget})</span>
              </span>
              <span className="font-bold bg-white px-2 py-0.5 rounded-md text-[10px] text-emerald-700 shadow-2xs border border-emerald-200/60">
                Dư ${currentPlan.budget - currentPlan.totalCost}
              </span>
            </div>
          )}

          {/* Plan Result Main Card */}
          <div className="bg-white rounded-3xl p-5 border border-rose-100/90 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  {currentPlan.type} Date
                </span>
                <h3 className="font-serif-romantic text-base font-bold text-stone-900 mt-1.5">
                  {currentPlan.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-stone-400 block font-medium">Tổng chi phí</span>
                <span className="text-lg font-black text-rose-600 font-serif-romantic">
                  ${currentPlan.totalCost}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/80 p-3 rounded-2xl border border-stone-100/80">
              {currentPlan.summary}
            </p>

            {/* Timeline Breakdown (Chi phí từng mục) */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Lịch trình & Chi phí từng hoạt động:</span>
              </h4>
              <div className="space-y-2">
                {currentPlan.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-rose-600 text-[11px] bg-white px-1.5 py-0.5 rounded-md border border-rose-100">
                          {item.time}
                        </span>
                        <span className="font-bold text-stone-900">{item.activity}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-stone-400" />
                        <span>{item.location}</span>
                      </div>
                      <p className="text-[10px] text-rose-700/90 italic pt-0.5">
                        Gợi ý: "{item.tip}"
                      </p>
                    </div>
                    <span className="font-bold text-stone-800 shrink-0 text-xs bg-white px-2 py-1 rounded-xl border border-stone-200">
                      ${item.cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Couple Romantic Tip */}
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-purple-600 shrink-0 mt-0.5 fill-purple-200" />
              <div>
                <strong className="font-bold block text-[11px]">Mẹo gắn kết từ LOVERA:</strong>
                <p className="text-[10px] leading-relaxed mt-0.5 text-purple-800">{currentPlan.coupleTip}</p>
              </div>
            </div>

            {/* Out of Scope Notice */}
            <div className="text-[10px] text-stone-400 text-center pt-0.5">
              💡 Lưu ý: Bản MVP hỗ trợ gợi ý kế hoạch; không tích hợp đặt bàn/thanh toán trực tiếp.
            </div>

            {/* Action Buttons: Save Plan & Complete Plan */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  playSound('success');
                  onSavePlan(currentPlan);
                }}
                className={`min-h-[44px] py-2.5 px-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  currentPlan.isSaved
                    ? 'bg-stone-100 text-stone-600 border border-stone-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentPlan.isSaved ? 'fill-stone-600' : ''}`} />
                <span>{currentPlan.isSaved ? 'Đã lưu kế hoạch' : 'Lưu kế hoạch (+10 pts)'}</span>
              </button>

              <button
                onClick={() => {
                  playSound('success');
                  onCompletePlan(currentPlan);
                }}
                disabled={currentPlan.isCompleted}
                className={`min-h-[44px] py-2.5 px-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  currentPlan.isCompleted
                    ? 'bg-emerald-600 text-white opacity-90'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{currentPlan.isCompleted ? 'Đã hoàn thành (+20 pts)' : 'Hoàn thành buổi hẹn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
