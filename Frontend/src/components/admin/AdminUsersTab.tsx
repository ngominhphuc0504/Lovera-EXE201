import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Award, 
  Heart, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  Edit3, 
  Eye, 
  Sparkles,
  Sprout
} from 'lucide-react';
import { AdminUserAccount } from '../../types';
import { playSound } from '../../utils/audio';

interface AdminUsersTabProps {
  users: AdminUserAccount[];
  onToggleLockUser: (userId: string) => void;
  onAdjustPoints: (userId: string, newPoints: number) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  onToggleLockUser,
  onAdjustPoints,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'paired' | 'unpaired' | 'locked'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserAccount | null>(null);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [pointsInput, setPointsInput] = useState<number>(0);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRole === 'paired') return !!u.pairedWith;
    if (filterRole === 'unpaired') return !u.pairedWith;
    if (filterRole === 'locked') return u.isLocked;
    return true;
  });

  const handleOpenPointsModal = (user: AdminUserAccount) => {
    playSound('click');
    setSelectedUser(user);
    setPointsInput(user.lovePoints || 0);
    setIsPointsModalOpen(true);
  };

  const handleSavePoints = () => {
    if (!selectedUser) return;
    playSound('chime');
    onAdjustPoints(selectedUser.id, pointsInput);
    setIsPointsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER & SEARCH BAR                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <span>Quản Lý Người Dùng & Cặp Đôi ({filteredUsers.length})</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">Tra cứu thông tin tài khoản, trạng thái ghép đôi, cấp độ vườn và điểm thưởng</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'paired', 'unpaired', 'locked'] as const).map((mode) => {
            const labels = {
              all: 'Tất cả',
              paired: 'Đã ghép đôi',
              unpaired: 'Chưa ghép',
              locked: 'Bị khóa'
            }[mode];

            return (
              <button
                key={mode}
                onClick={() => {
                  playSound('click');
                  setFilterRole(mode);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filterRole === mode
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {labels}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo tên người dùng, email hoặc mã tài khoản..."
          className="w-full bg-white border border-stone-200/90 rounded-2xl pl-11 pr-4 py-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-xs transition-all"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* USERS DATA TABLE                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/90 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Đối Phương (Partner)</th>
                <th className="py-3.5 px-4 text-center">Điểm Tình Yêu</th>
                <th className="py-3.5 px-4 text-center">Cấp Vườn</th>
                <th className="py-3.5 px-4">Ngày Tham Gia</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal">
              {filteredUsers.map((u) => {
                const isPaired = !!u.pairedWith;
                return (
                  <tr key={u.id} className="hover:bg-rose-50/20 transition-colors">
                    
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover border border-stone-200 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">{u.name}</span>
                            {u.role === 'Admin' && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-md">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-stone-400 text-[11px] block">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Partner Info */}
                    <td className="py-3.5 px-4">
                      {isPaired ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={u.partnerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'}
                            alt={u.pairedWith}
                            className="w-7 h-7 rounded-lg object-cover border border-purple-200"
                          />
                          <div>
                            <span className="font-semibold text-purple-900 block leading-tight">{u.pairedWith}</span>
                            <span className="text-[10px] text-purple-600 flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 fill-purple-500" />
                              <span>Đã kết nối</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Chưa ghép đôi</span>
                      )}
                    </td>

                    {/* Love Points */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenPointsModal(u)}
                        className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                        title="Bấm để điều chỉnh điểm"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{u.lovePoints || 0} pts</span>
                        <Edit3 className="w-2.5 h-2.5 text-amber-600 ml-0.5 opacity-60" />
                      </button>
                    </td>

                    {/* Garden Stage */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        u.gardenStage === 5
                          ? 'bg-gradient-to-r from-amber-50 to-purple-50 text-purple-800 border-purple-200 shadow-2xs'
                          : u.gardenStage === 4
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.gardenStage === 3
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <Sprout className="w-3 h-3" />
                        <span>Cấp {u.gardenStage || 1}</span>
                      </span>
                    </td>

                    {/* Join Date */}
                    <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                      {u.createdAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.isLocked
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.isLocked ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Đã khóa</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Hoạt động</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            playSound('click');
                            onToggleLockUser(u.id);
                          }}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            u.isLocked
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                              : 'bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-600 border-stone-200'
                          }`}
                          title={u.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {u.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADJUST LOVE POINTS MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {isPointsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-rose-100 shadow-2xl animate-scale-up">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Điều Chỉnh Love Points</h3>
              <p className="text-xs text-stone-500">Cập nhật điểm thưởng cho <strong>{selectedUser.name}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Số điểm tình yêu:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPointsInput(prev => Math.max(0, prev - 50))}
                  className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(Number(e.target.value) || 0)}
                  className="flex-1 text-center font-black text-lg text-amber-600 bg-amber-50/50 border border-amber-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setPointsInput(prev => prev + 50)}
                  className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPointsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSavePoints}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
