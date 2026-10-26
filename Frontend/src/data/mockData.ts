import { ConnectionActivityOption, ConnectionStatusOption, CoupleData, DatePlan, PointHistoryItem, AppNotification, MemoryItem } from '../types';
import avatarAlex from '../assets/images/partner_avatar_alex_1790144456462.jpg';
import avatarSam from '../assets/images/partner_avatar_sam_1790144470464.jpg';

export { avatarAlex, avatarSam };

export const INITIAL_STATUS_OPTIONS: ConnectionStatusOption[] = [
  {
    type: 'Available',
    label: 'Đang rảnh',
    icon: '✨',
    description: 'Sẵn sàng tâm sự cùng người yêu',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    type: 'Busy',
    label: 'Đang bận',
    icon: '⏳',
    description: 'Hiện chưa thể trò chuyện',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    type: 'Away',
    label: 'Tạm vắng',
    icon: '🌙',
    description: 'Tạm thời không có mặt',
    badgeColor: 'bg-stone-50 text-stone-700 border-stone-200'
  }
];

export const INITIAL_ACTIVITY_OPTIONS: ConnectionActivityOption[] = [
  {
    type: 'Studying',
    label: 'Đang học bài',
    icon: '📚',
    description: 'Tập trung ôn thi & làm bài tập',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    type: 'Working',
    label: 'Đang làm việc',
    icon: '💻',
    description: 'Đang trong ca làm hoặc họp',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    type: 'Sleeping',
    label: 'Đang ngủ',
    icon: '🌙',
    description: 'Đang chìm vào giấc mơ đẹp',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    type: 'On the road',
    label: 'Đang trên đường',
    icon: '🚗',
    description: 'Đang di chuyển, lái xe cẩn thận',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    type: 'Personal time',
    label: 'Giờ riêng tư',
    icon: '☕',
    description: 'Thư giãn, đọc sách hoặc thể thao',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export const INITIAL_COUPLE: CoupleData = {
  coupleId: 'CP-LOVERA-2025',
  pairCode: 'LV8942',
  startDate: '2025-09-22',
  isPaired: true,
  lovePoints: 1500,
  userA: {
    id: 'usr_alex',
    name: 'Alex',
    avatar: avatarAlex,
    email: 'alex@lovera.app',
    status: 'Available',
    isOnline: true,
    batteryLevel: 88
  },
  userB: {
    id: 'usr_sam',
    name: 'Sam',
    avatar: avatarSam,
    email: 'sam@lovera.app',
    status: 'Busy',
    activity: 'Studying',
    isOnline: false,
    batteryLevel: 62
  }
};

export const INITIAL_DATE_PLANS: DatePlan[] = [
  {
    id: 'plan_01',
    title: 'Bữa Tối Ánh Nến & Dạo Cầu Hoàng Hôn',
    type: 'Romantic',
    budget: 80,
    totalCost: 72,
    duration: '3.5 tiếng',
    location: 'Quận 1 - Bến Bạch Đằng',
    foodPreference: 'Món Âu lãng mạn',
    activityPreference: 'Romantic',
    summary: 'Một buổi tối dịu dàng dưới ánh nến lung linh, sau đó cùng dạo bước bên bờ sông nghe tiếng sóng và chia sẻ tai nghe.',
    timeline: [
      {
        time: '18:00',
        activity: 'Đón người ấy & trao tặng nhành hoa nhỏ',
        location: 'Điểm hẹn thân quen',
        cost: 8,
        tip: 'Tặng người ấy bông hồng pastel bất ngờ'
      },
      {
        time: '18:45',
        activity: 'Bữa tối ấm cúng tại Bistro ven sông',
        location: 'The Romantic Corner Cafe & Dining',
        cost: 48,
        tip: 'Hỏi đối phương điều làm họ cười nhiều nhất tuần qua'
      },
      {
        time: '20:30',
        activity: 'Đi dạo ngắm sao & nghe bản nhạc quen',
        location: 'Cầu đi bộ ánh sao',
        cost: 16,
        tip: 'Chia sẻ tai nghe bật list LOVERA Memories'
      }
    ],
    coupleTip: 'Để điện thoại chế độ Không Làm Phiền trong suốt bữa tối để chỉ có hai bạn.',
    isSaved: true,
    isCompleted: false,
    createdAt: 'Hôm nay, 10:30'
  }
];

export const INITIAL_POINT_HISTORY: PointHistoryItem[] = [
  {
    id: 'pt_1',
    action: 'Bón phân hữu cơ & vun xới đất',
    points: 10,
    timestamp: 'Hôm qua, 20:30',
    by: 'Alex'
  },
  {
    id: 'pt_2',
    action: 'Lưu kế hoạch hẹn hò mới',
    points: 10,
    timestamp: 'Hôm qua, 14:15',
    by: 'Alex'
  },
  {
    id: 'pt_3',
    action: 'Tưới nước cho cây tình yêu',
    points: 5,
    timestamp: 'Hôm nay, 08:00',
    by: 'Alex'
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_2',
    title: 'Vườn hoa đã được tưới',
    message: '🌸 Sam đã tưới nước cho cây tình yêu, cả hai nhận được +5 Love Points!',
    time: '1 giờ trước',
    type: 'garden',
    read: false
  },
  {
    id: 'notif_3',
    title: 'Kế hoạch hẹn hò sắp tới',
    message: '✨ Buổi hẹn "Bữa Tối Ánh Nến" đã sẵn sàng cho cuối tuần này.',
    time: 'Hôm qua',
    type: 'planner',
    read: true
  }
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    caption: 'Chuyến đi Đà Lạt đầu tiên của hai đứa, trời se lạnh nhưng có bàn tay ai đó thật ấm áp.',
    date: '2025-10-15',
    location: 'Hồ Xuân Hương, Đà Lạt',
    tag: 'Du lịch',
    authorName: 'Alex',
    authorAvatar: avatarAlex,
    likes: 24,
    isLiked: true,
    createdAt: '2025-10-15T18:30:00Z'
  },
  {
    id: 'mem_2',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    caption: 'Bữa tối lãng mạn kỷ niệm 100 ngày bên nhau dưới ánh nến và tiếng sóng ven sông.',
    date: '2025-12-31',
    location: 'Bistro Bạch Đằng, Quận 1',
    tag: 'Kỷ niệm',
    authorName: 'Sam',
    authorAvatar: avatarSam,
    likes: 38,
    isLiked: false,
    createdAt: '2025-12-31T20:45:00Z'
  },
  {
    id: 'mem_3',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    caption: 'Buổi chiều thảnh thơi cùng đọc sách và chia sẻ từng ngụm trà ấm tại quán quen.',
    date: '2026-01-18',
    location: 'The Workshop Coffee, Quận 1',
    tag: 'Hẹn hò',
    authorName: 'Alex',
    authorAvatar: avatarAlex,
    likes: 19,
    isLiked: true,
    createdAt: '2026-01-18T16:15:00Z'
  },
  {
    id: 'mem_4',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    caption: 'Cùng nhau tưới khu vườn tình yêu, đóa hoa đầu tiên đã nở rực rỡ như nụ cười của em.',
    date: '2026-02-14',
    location: 'Ban công nhỏ ngập nắng',
    tag: 'Khoảnh khắc',
    authorName: 'Sam',
    authorAvatar: avatarSam,
    likes: 45,
    isLiked: false,
    createdAt: '2026-02-14T09:20:00Z'
  },
  {
    id: 'mem_5',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    caption: 'Ngắm hoàng hôn trên cầu Ánh Sao, khoảnh khắc bình yên nhất sau chuỗi ngày bận rộn.',
    date: '2026-03-08',
    location: 'Cầu Ánh Sao, Quận 7',
    tag: 'Hẹn hò',
    authorName: 'Alex',
    authorAvatar: avatarAlex,
    likes: 31,
    isLiked: true,
    createdAt: '2026-03-08T18:00:00Z'
  }
];
