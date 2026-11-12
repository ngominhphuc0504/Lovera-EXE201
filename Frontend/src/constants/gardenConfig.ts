import { GardenStage } from '../types';

/**
 * CẤU HÌNH HỆ THỐNG KHU VƯỜN TÌNH YÊU (LOVE GARDEN CONFIGURATION)
 * Tách biệt hoàn toàn dưới dạng constants để dễ dàng cân bằng game logic.
 */
export const GARDEN_CONFIG = {
  // Khoảng thời gian cơ sở tính hao hụt (5 phút = 300,000 ms)
  DECAY_INTERVAL_MS: 5 * 60 * 1000,
  DECAY_INTERVAL_MINUTES: 5,

  // Tỷ lệ hao hụt theo thời gian thực (sau mỗi 5 phút)
  DECAY_RATES: {
    MOISTURE: 2,   // Độ ẩm đất: Giảm 2% / 5 phút
    FRESHNESS: 1,  // Độ tươi tốt: Giảm 1% / 5 phút
    SUNLIGHT: 3,   // Ánh nắng: Giảm 3% / 5 phút
  },

  // Thời gian hồi chiêu (Cooldown) giữa các lần chăm sóc: 5 phút
  COOLDOWN_MS: 5 * 60 * 1000,

  // Điểm thưởng Love Points cho mỗi hành động
  ACTION_POINTS: {
    WATER: 10,     // Tưới cây: +10 pts
    FERTILIZE: 10, // Bón phân: +10 pts
    SUNBATH: 5,    // Tắm nắng: +5 pts
  },

  // Mức tăng chỉ số cho mỗi hành động chăm sóc (% mỗi lần)
  ACTION_BOOST: {
    WATER_MOISTURE: 20,    // +20% độ ẩm
    FERTILIZE_FRESHNESS: 15, // +15% độ tươi tốt
    SUNBATH_SUNLIGHT: 20,  // +20% ánh nắng
  },

  // Mức chỉ số khởi tạo ban đầu khi gieo mầm cây mới (0 - 100)
  INITIAL_STATS: {
    MOISTURE: 60,
    FRESHNESS: 60,
    SUNLIGHT: 50,
  },

  // Giới hạn phần trăm chỉ số
  LIMITS: {
    MIN: 0,
    MAX: 100,
  },

  // Mốc điểm mở khóa cấp độ (Stage Level Requirements)
  STAGE_REQUIREMENTS: {
    1: { minPts: 0, nextTarget: 100, name: 'Hạt Mầm Trái Tim' },
    2: { minPts: 100, nextTarget: 300, name: 'Cây Non Đâm Chồi' },
    3: { minPts: 300, nextTarget: 500, name: 'Hoa Hồng Nở Rộ' },
    4: { minPts: 500, nextTarget: 1000, name: 'Cây Đại Thụ Hạnh Phúc' },
    5: { minPts: 1000, nextTarget: 2000, name: 'Cổ Thụ Bách Niên Bốn Mùa' },
  } as Record<GardenStage, { minPts: number; nextTarget: number; name: string }>,
} as const;
