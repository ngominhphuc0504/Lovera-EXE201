import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { ConnectionActivityType, ConnectionStatusType } from '../../types';
import { INITIAL_ACTIVITY_OPTIONS, INITIAL_STATUS_OPTIONS } from '../../data/mockData';
import { playSound } from '../../utils/audio';

interface StatusModalProps {
  currentStatus: ConnectionStatusType;
  currentActivity?: ConnectionActivityType;
  onClose: () => void;
  onSave: (status: ConnectionStatusType, activity?: ConnectionActivityType) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  currentStatus,
  currentActivity,
  onClose,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ConnectionStatusType>(currentStatus);
  const [selectedActivity, setSelectedActivity] = useState<ConnectionActivityType | undefined>(currentActivity);

  const handleSave = () => {
    playSound('success');
    onSave(selectedStatus, selectedActivity);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-white rounded-t-[2rem] max-h-[90dvh] flex flex-col shadow-2xl border-t border-rose-100 overflow-hidden text-stone-800 animate-slide-up">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0"></div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Cập Nhật Trạng Thái (Status)</h3>
            <p className="text-[11px] text-stone-500">Người thương sẽ biết bạn đang bận hay rảnh</p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 min-h-0 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Trạng thái (Status)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INITIAL_STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(opt.type);
                      playSound('click');
                    }}
                    className={`min-h-[76px] p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-400'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{opt.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 leading-tight">{opt.label}</h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Hoạt động hiện tại (không bắt buộc)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INITIAL_ACTIVITY_OPTIONS.map((opt) => {
                const isSelected = selectedActivity === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedActivity(isSelected ? undefined : opt.type);
                      playSound('click');
                    }}
                    className={`min-h-[68px] p-3 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-400'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.icon}</span>
                    <span className="font-bold text-xs text-stone-900 leading-tight">{opt.label}</span>
                    {isSelected && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 pt-3 border-t border-stone-100 shrink-0 bg-white">
          <button
            onClick={handleSave}
            className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Lưu & Đồng Bộ Trạng Thái</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
