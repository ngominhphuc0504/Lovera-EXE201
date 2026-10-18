import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { ConnectionActivityType, ConnectionStatusType } from '../../types';
import { CONNECTION_STATUS_OPTIONS, INITIAL_ACTIVITY_OPTIONS } from '../../data/mockData';
import { playSound } from '../../utils/audio';

interface StatusModalProps {
  currentStatus: ConnectionStatusType;
  currentActivity?: ConnectionActivityType | 'Available';
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
  const [selectedActivity, setSelectedActivity] = useState<ConnectionActivityType | null>(
    currentActivity && currentActivity !== 'Available' ? currentActivity : null
  );

  const handleSave = () => {
    playSound('success');
    onSave(selectedStatus, selectedActivity ?? undefined);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-white rounded-t-[2rem] max-h-[calc(100%-env(safe-area-inset-top))] flex flex-col shadow-2xl border-t border-rose-100 overflow-hidden text-stone-800 animate-slide-up">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0"></div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-stone-100 flex items-center justify-between shrink-0">
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

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              1. Chọn hoạt động hiện tại của bạn:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INITIAL_ACTIVITY_OPTIONS.map((opt, index) => {
                const isSelected = selectedActivity === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setSelectedActivity(opt.type);
                      playSound('click');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-400'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                    } ${index === INITIAL_ACTIVITY_OPTIONS.length - 1 ? 'col-span-2 mx-auto w-1/2' : ''}`}
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
                      <p className="text-[10px] text-stone-500 mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              2. Trạng thái (Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONNECTION_STATUS_OPTIONS.map((option) => {
                const isSelected = selectedStatus === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(option.type);
                      playSound('click');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-400'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{option.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 leading-tight">{option.label}</h4>
                      <p className="text-[10px] text-stone-500 mt-0.5">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-100 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
