import { ConnectionStatusOption, CoupleData, DatePlan, PointHistoryItem, AppNotification } from '../types';
import avatarAlex from '../assets/images/partner_avatar_alex_1790144456462.jpg';
import avatarSam from '../assets/images/partner_avatar_sam_1790144470464.jpg';

export const INITIAL_STATUS_OPTIONS: ConnectionStatusOption[] = [
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
  },
  {
    type: 'Available',
    label: 'Đang rảnh',
    icon: '✨',
    description: 'Sẵn sàng tâm sự cùng người yêu',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
    availableAt: 'Ngay bây giờ',
    isOnline: true,
    batteryLevel: 88
  },
  userB: {
    id: 'usr_sam',
    name: 'Sam',
    avatar: avatarSam,
    email: 'sam@lovera.app',
    status: 'Studying',
    availableAt: '16:30',
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
    action: 'Hoàn thành buổi hẹn "Làm Bánh Ngọt"',
    points: 20,
    timestamp: 'Hôm qua, 20:30',
    by: 'Alex & Sam'
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
    action: 'Check-in vườn hoa mỗi ngày',
    points: 5,
    timestamp: 'Hôm nay, 08:00',
    by: 'Sam'
  },
  {
    id: 'pt_4',
    action: 'Gửi Love Ping yêu thương',
    points: 5,
    timestamp: 'Hôm nay, 09:12',
    by: 'Alex'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Sam vừa gửi Love Ping!',
    message: '❤️ Sam đang nhớ bạn rất nhiều và muốn nghe giọng bạn.',
    time: '10 phút trước',
    type: 'ping',
    read: false
  },
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
