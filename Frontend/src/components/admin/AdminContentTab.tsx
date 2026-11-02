import React, { useState } from 'react';
import { 
  Camera, 
  Trash2, 
  CalendarHeart, 
  Tag, 
  Heart, 
  MapPin, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Radio
} from 'lucide-react';
import { MemoryItem, DatePlan } from '../../types';
import { playSound } from '../../utils/audio';

interface AdminContentTabProps {
  memories: MemoryItem[];
  datePlans: DatePlan[];
  onDeleteMemory: (memoryId: string) => void;
  onDeleteDatePlan: (planId: string) => void;
  onManualSync?: () => void;
}

export const AdminContentTab: React.FC<AdminContentTabProps> = ({
  memories,
  datePlans,
  onDeleteMemory,
  onDeleteDatePlan,
  onManualSync,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'memories' | 'plans'>('memories');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = () => {
    if (onManualSync) {
      setIsSyncing(true);
      playSound('click');
      onManualSync();
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleDeleteMem = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn gỡ bỏ ảnh kỷ niệm này khỏi Không Gian Chung không?')) {
      playSound('click');
      onDeleteMemory(id);
    }
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kế hoạch hẹn hò này không?')) {
      playSound('click');
      onDeleteDatePlan(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER & SUB-TABS                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-500" />
              <span>Kiểm Duyệt Nội Dung & Kế Hoạch Hẹn Hò</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync 2 Chiều</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tất cả ảnh đăng bên App Cặp Đôi (Shared Space) sẽ hiển thị ngay lập tức tại đây
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onManualSync && (
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Đồng bộ lại toàn bộ dữ liệu mới nhất từ App"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ từ App'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => {
                playSound('click');
                setActiveSubTab('memories');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'memories'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kỷ Niệm ({memories.length})</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setActiveSubTab('plans');
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'plans'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarHeart className="w-3.5 h-3.5" />
              <span>Kế Hoạch Hẹn Hò ({datePlans.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: SHARED SPACE MEMORIES GALLERY                      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'memories' && (
        <>
          {memories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-800 text-sm">Chưa có bài viết kỷ niệm nào</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Khi cặp đôi đăng ảnh kỷ niệm trong mục Không Gian Chung trên App, bài viết sẽ tự động xuất hiện tại đây theo thời gian thực.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group animate-fade-in"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                    <img
                      src={mem.imageUrl}
                      alt={mem.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(mem.imageUrl)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    >
                      <Eye className="w-6 h-6 drop-shadow-md" />
                    </button>
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-white/90 backdrop-blur-xs text-rose-700 px-2 py-0.5 rounded-full border border-rose-100 shadow-2xs">
                      {mem.tag}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                      <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                      <span>{mem.likes}</span>
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-xs text-stone-800 line-clamp-2 leading-relaxed font-medium">
                      {mem.caption}
                    </p>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={mem.authorAvatar}
                          alt={mem.authorName}
                          className="w-5 h-5 rounded-full object-cover border border-stone-200"
                        />
                        <span className="font-semibold text-stone-700">{mem.authorName}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">{mem.date}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMem(mem.id)}
                      className="w-full py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Gỡ bài vi phạm</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: DATE PLANS TABLE                                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'plans' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/90 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tên Buổi Hẹn</th>
                  <th className="py-3.5 px-4">Địa Điểm</th>
                  <th className="py-3.5 px-4">Phong Cách</th>
                  <th className="py-3.5 px-4 text-center">Ngân Sách Dự Kiến</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-normal">
                {datePlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                          <CalendarHeart className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="font-bold text-stone-900 block leading-tight">{plan.title}</strong>
                          <span className="text-[10px] text-stone-400">{plan.duration}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{plan.location}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {plan.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-800">
                      ${plan.totalCost} / ${plan.budget}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {plan.isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã đi hẹn</span>
                        </span>
                      ) : plan.isSaved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span>Đã lưu</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                          <span>Mới tạo</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Xóa kế hoạch này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* IMAGE PREVIEW LIGHTBOX                                        */}
      {/* ------------------------------------------------------------- */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl relative">
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};
