import React from 'react';
import { 
  Users, 
  Heart, 
  Sparkles, 
  Camera, 
  CalendarHeart, 
  Bot, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Award,
  Layers,
  Sprout
} from 'lucide-react';
import { AdminSystemMetric, AdminActivityLog } from '../../types';
import { GARDEN_STAGE_DISTRIBUTION, SEASON_FAVORITE_DISTRIBUTION } from '../../data/mockAdminData';

interface AdminDashboardTabProps {
  metrics: AdminSystemMetric;
  logs: AdminActivityLog[];
  onNavigateToTab: (tab: 'users' | 'content' | 'settings') => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  metrics,
  logs,
  onNavigateToTab,
}) => {
  const WEEK_DAYS = [
    { day: 'T2', active: 380, height: '65%' },
    { day: 'T3', active: 420, height: '72%' },
    { day: 'T4', active: 460, height: '78%' },
    { day: 'T5', active: 410, height: '70%' },
    { day: 'T6', active: 520, height: '88%' },
    { day: 'T7', active: 640, height: '100%', highlight: true },
    { day: 'CN', active: 590, height: '94%', highlight: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO STATS CARDS GRID                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng Người Dùng</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 font-display">
              {metrics.totalUsers.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{metrics.activeUsersToday} đang trực tuyến hôm nay</span>
          </p>
        </div>

        {/* Paired Couples */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Cặp Đôi Đã Ghép</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Heart className="w-5 h-5 fill-purple-500 text-purple-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 font-display">
              {metrics.pairedCouples.toLocaleString()} cặp
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              96.2%
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            <span>{metrics.pendingPairings} lời mời đang chờ kết nối</span>
          </p>
        </div>

        {/* Total Love Points */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng Điểm Vườn Yêu</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 font-display">
              {metrics.totalLovePoints.toLocaleString()} pts
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
              <ArrowUpRight className="w-3 h-3" /> +2.1k
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            <span>Tích lũy từ tưới cây, bón phân & tâm sự</span>
          </p>
        </div>

        {/* AI Gemini Queries */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Lovera AI & Gemini</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900 font-display">
              {metrics.aiQueriesToday.toLocaleString()} lượt
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Gemini 2.5
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            <span>Tư vấn hẹn hò, quà tặng, lời chúc ngọt ngào</span>
          </p>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CHARTS & DISTRIBUTION SECTION                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Engagement Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <span>Mật Độ Hoạt Động & Tương Tác Cặp Đôi (7 Ngày)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Lượng cặp đôi chăm sóc vườn, đăng kỷ niệm & trò chuyện AI</p>
            </div>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100">
              Cao điểm cuối tuần 🔥
            </span>
          </div>

          <div className="h-48 pt-6 flex items-end justify-between gap-3 px-2 border-b border-stone-100 pb-2">
            {WEEK_DAYS.map((w, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {w.active}
                </span>
                <div
                  style={{ height: w.height }}
                  className={`w-full rounded-2xl transition-all duration-500 group-hover:scale-105 ${
                    w.highlight
                      ? 'bg-gradient-to-t from-rose-500 to-purple-600 shadow-sm'
                      : 'bg-gradient-to-t from-stone-200 to-rose-200 hover:from-rose-400 hover:to-purple-400'
                  }`}
                ></div>
                <span className={`text-xs font-bold ${w.highlight ? 'text-rose-600' : 'text-stone-500'}`}>
                  {w.day}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Cuối tuần tăng trưởng +38% hoạt động hẹn hò</span>
            </span>
            <button
              onClick={() => onNavigateToTab('content')}
              className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Xem bài đăng kỷ niệm</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Seasons Preference & Love Garden Levels */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Phân Bố Cấp Độ Love Garden</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Tiến trình phát triển vườn yêu của người dùng</p>

            <div className="mt-4 space-y-2.5">
              {GARDEN_STAGE_DISTRIBUTION.map((g, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-stone-700 font-semibold">{g.stage}</span>
                    <span className="text-stone-500">{g.count} cặp ({g.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${g.color} rounded-full`}
                      style={{ width: `${g.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Four Seasons Preference mini card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-rose-100/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="flex items-center gap-1">
                <span>🌸 Mùa Yêu Thích Nhất:</span>
                <strong className="text-rose-600">Mùa Xuân (46%)</strong>
              </span>
              <span className="text-[10px] text-stone-500 bg-white/70 px-2 py-0.5 rounded-full">4 Mùa</span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {SEASON_FAVORITE_DISTRIBUTION.map((s, i) => (
                <div
                  key={i}
                  title={`${s.season}: ${s.percent}%`}
                  style={{ width: `${s.percent}%` }}
                  className={`bg-gradient-to-r ${s.color}`}
                ></div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. RECENT ACTIVITY AUDIT LOG (Real-time feed)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Nhật Ký Hoạt Động & Bảo Mật Hệ Thống (Live Audit Log)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Ghi nhận các sự kiện đăng nhập, ghép đôi, nâng cấp vườn và kiểm duyệt</p>
          </div>
          <button
            onClick={() => onNavigateToTab('settings')}
            className="text-xs text-purple-600 hover:text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            Cấu hình bảo mật
          </button>
        </div>

        <div className="divide-y divide-stone-100 overflow-x-auto">
          {logs.map((log) => {
            const isWarning = log.status === 'warning';
            return (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-stone-50/70 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isWarning ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 leading-snug">{log.action}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      <span className="font-semibold text-purple-700">{log.actor}</span>
                      <span>•</span>
                      <span>{log.target}</span>
                      {log.ip && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-stone-400">IP: {log.ip}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isWarning
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isWarning ? 'Cảnh báo' : 'Thành công'}
                  </span>
                  <span className="text-[11px] text-stone-400 whitespace-nowrap">{log.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
