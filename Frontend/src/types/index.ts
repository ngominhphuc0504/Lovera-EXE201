export type Screen = 
  | 'splash' 
  | 'onboarding' 
  | 'welcome' 
  | 'login' 
  | 'register' 
  | 'auth' 
  | 'pairing' 
  | 'home' 
  | 'chat'
  | 'planner' 
  | 'shared' 
  | 'garden' 
  | 'profile';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export type MemoryTag = 'Hẹn hò' | 'Kỷ niệm' | 'Du lịch' | 'Đời thường' | 'Khoảnh khắc';

export interface MemoryItem {
  id: string;
  imageUrl: string;
  caption: string;
  date: string; // YYYY-MM-DD
  location?: string;
  tag: MemoryTag;
  authorName: string;
  authorAvatar: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
}

export type DateType = 'Romantic' | 'Cozy' | 'Adventure';
export type TimePreference = 'Morning' | 'Afternoon' | 'Evening' | 'FullDay';
export type ActivityPreference = 'Romantic' | 'Cozy' | 'Adventure' | 'Cultural' | 'Foodie';

export interface Partner {
  id: string;
  name: string;
  avatar: string;
  email: string;
  status: ConnectionStatusType;
  availableAt?: string;
  activity?: string;
  isOnline: boolean;
  batteryLevel?: number;
}

export type ConnectionStatusType = 
  | 'Studying'
  | 'Working'
  | 'Sleeping'
  | 'On the road'
  | 'Personal time'
  | 'Available'
  | 'Busy'
  | 'Away';

export type ConnectionActivityType = ConnectionStatusType;

export interface ConnectionStatusOption {
  type: ConnectionStatusType;
  label: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export type ConnectionActivityOption = ConnectionStatusOption;

export interface CoupleData {
  coupleId: string;
  pairCode: string;
  startDate: string; // YYYY-MM-DD
  userA: Partner;
  userB: Partner;
  lovePoints: number;
  isPaired: boolean;
}

export interface TimelineItem {
  time: string;
  activity: string;
  location: string;
  cost: number;
  tip: string;
}

export interface DatePlan {
  id: string;
  title: string;
  type: DateType;
  budget: number;
  totalCost: number;
  duration: string;
  location: string;
  foodPreference: string;
  activityPreference: string;
  summary: string;
  timeline: TimelineItem[];
  coupleTip: string;
  isSaved: boolean;
  isCompleted: boolean;
  createdAt: string;
}

export type GardenStage = 1 | 2 | 3 | 4;

export interface PointHistoryItem {
  id: string;
  action: string;
  points: number;
  timestamp: string;
  by: string;
  category?: 'water' | 'fertilize' | 'sun' | 'memory' | 'chat' | 'dating';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'garden' | 'planner' | 'status' | 'memory';
  read: boolean;
}
