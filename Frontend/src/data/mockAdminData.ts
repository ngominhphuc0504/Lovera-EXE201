import { AdminUserAccount, AdminSystemMetric, AdminActivityLog } from '../types';

export const INITIAL_ADMIN_METRICS: AdminSystemMetric = {
  totalUsers: 1284,
  activeUsersToday: 492,
  pairedCouples: 618,
  pendingPairings: 48,
  totalLovePoints: 48520,
  totalMemories: 3420,
  totalDatePlans: 890,
  aiQueriesToday: 1340,
};

export const INITIAL_ADMIN_USERS: AdminUserAccount[] = [
  {
    id: 'usr_admin',
    name: 'Quản Trị Viên (Admin)',
    email: 'admin@lovera.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'Admin',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-01-01',
    lovePoints: 9999,
    gardenStage: 5,
    activeSeason: 'spring'
  },
  {
    id: 'usr_alex',
    name: 'Alex Johnson',
    email: 'alex@lovera.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-02-14',
    pairedWith: 'Sam Wilson',
    partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    lovePoints: 1500,
    gardenStage: 5,
    activeSeason: 'spring',
    startDate: '2023-10-24'
  },
  {
    id: 'usr_sam',
    name: 'Sam Wilson',
    email: 'sam@lovera.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-02-14',
    pairedWith: 'Alex Johnson',
    partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    lovePoints: 1500,
    gardenStage: 5,
    activeSeason: 'spring',
    startDate: '2023-10-24'
  },
  {
    id: 'usr_minh',
    name: 'Minh Hoàng',
    email: 'minh.hoang@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-03-08',
    pairedWith: 'Lan Anh',
    partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    lovePoints: 850,
    gardenStage: 4,
    activeSeason: 'autumn',
    startDate: '2024-03-15'
  },
  {
    id: 'usr_lan',
    name: 'Lan Anh',
    email: 'lananh.rose@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-03-08',
    pairedWith: 'Minh Hoàng',
    partnerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    lovePoints: 850,
    gardenStage: 4,
    activeSeason: 'autumn',
    startDate: '2024-03-15'
  },
  {
    id: 'usr_tuan',
    name: 'Tuấn Kiệt',
    email: 'tuankiet.design@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-04-12',
    pairedWith: 'Hà My',
    partnerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    lovePoints: 420,
    gardenStage: 3,
    activeSeason: 'summer',
    startDate: '2025-01-01'
  },
  {
    id: 'usr_my',
    name: 'Hà My',
    email: 'hamy.sweet@yahoo.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-04-12',
    pairedWith: 'Tuấn Kiệt',
    partnerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
    lovePoints: 420,
    gardenStage: 3,
    activeSeason: 'summer',
    startDate: '2025-01-01'
  },
  {
    id: 'usr_duy',
    name: 'Khánh Duy',
    email: 'duy.khanh99@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: true,
    isLocked: false,
    createdAt: '2026-06-20',
    lovePoints: 120,
    gardenStage: 2,
    activeSeason: 'winter'
  },
  {
    id: 'usr_spam',
    name: 'User Spam Test',
    email: 'bot_test_999@spam.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    role: 'Member',
    isEmailVerified: false,
    isLocked: true,
    createdAt: '2026-08-01',
    lovePoints: 0,
    gardenStage: 1,
    activeSeason: 'spring'
  }
];

export const INITIAL_ADMIN_LOGS: AdminActivityLog[] = [
  {
    id: 'log_1',
    action: 'Đăng nhập tài khoản Admin thành công',
    actor: 'admin@lovera.app',
    target: 'Hệ thống Quản Trị Lovera',
    timestamp: 'Vừa xong',
    type: 'auth',
    status: 'success',
    ip: '127.0.0.1'
  },
  {
    id: 'log_2',
    action: 'Cặp đôi hoàn thành mốc Cấp 5 (Cổ Thụ Bách Niên)',
    actor: 'Alex Johnson & Sam Wilson',
    target: 'Love Garden #CPL-8892',
    timestamp: '15 phút trước',
    type: 'garden',
    status: 'success',
    ip: '118.69.182.44'
  },
  {
    id: 'log_3',
    action: 'Tạo kế hoạch hẹn hò bằng AI Gemini 2.5 Flash',
    actor: 'Minh Hoàng',
    target: 'Date Plan "Buổi tối lãng mạn tại Landmark 81"',
    timestamp: '42 phút trước',
    type: 'content',
    status: 'success',
    ip: '14.241.229.12'
  },
  {
    id: 'log_4',
    action: 'Ghép đôi thành công bằng mã số 6 ký tự',
    actor: 'Tuấn Kiệt & Hà My',
    target: 'Couple Pair #CPL-9021',
    timestamp: '2 giờ trước',
    type: 'couple',
    status: 'success',
    ip: '113.161.72.8'
  },
  {
    id: 'log_5',
    action: 'Phát hiện đăng nhập sai mật khẩu quá 5 lần - Đã khóa',
    actor: 'bot_test_999@spam.com',
    target: 'Tài khoản #usr_spam',
    timestamp: '5 giờ trước',
    type: 'auth',
    status: 'warning',
    ip: '103.20.144.90'
  },
  {
    id: 'log_6',
    action: 'Tải lên 3 ảnh kỷ niệm mới vào Không Gian Chung',
    actor: 'Alex Johnson',
    target: 'Shared Space Gallery',
    timestamp: 'Hôm qua, 21:15',
    type: 'content',
    status: 'success',
    ip: '118.69.182.44'
  }
];

export const GARDEN_STAGE_DISTRIBUTION = [
  { stage: 'Cấp 1: Hạt Mầm', count: 142, color: 'bg-emerald-400', percent: 23 },
  { stage: 'Cấp 2: Cây Non', count: 184, color: 'bg-teal-400', percent: 30 },
  { stage: 'Cấp 3: Hoa Hồng', count: 156, color: 'bg-rose-400', percent: 25 },
  { stage: 'Cấp 4: Đại Thụ', count: 96, color: 'bg-purple-400', percent: 16 },
  { stage: 'Cấp 5: Bách Niên', count: 40, color: 'bg-amber-400', percent: 6 },
];

export const SEASON_FAVORITE_DISTRIBUTION = [
  { season: 'Mùa Xuân 🌸', count: 285, percent: 46, color: 'from-pink-500 to-rose-400' },
  { season: 'Mùa Thu 🍁', count: 172, percent: 28, color: 'from-amber-500 to-orange-400' },
  { season: 'Mùa Đông ❄️', count: 98, percent: 16, color: 'from-sky-500 to-blue-400' },
  { season: 'Mùa Hạ ☀️', count: 63, percent: 10, color: 'from-emerald-500 to-teal-400' },
];
