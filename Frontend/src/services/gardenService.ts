import { apiFetch } from './apiClient';

export interface GardenResponse {
  stage: number;
  points: number;
  streakDays: number;
  lastCareUtc?: string | null;
  season?: string;
}

export interface GardenHistoryItem {
  id: string;
  action: string;
  points: number;
  timestamp: string;
  by: string;
  category?: string;
}

export const gardenService = {
  /**
   * Lấy trạng thái khu vườn, điểm tình yêu và cấp độ cây
   * GET /api/garden
   */
  async getGarden(): Promise<GardenResponse> {
    return apiFetch<GardenResponse>('/garden', {
      method: 'GET',
    });
  },

  /**
   * Điểm danh chăm sóc vườn hằng ngày
   * POST /api/garden/check-in
   */
  async checkIn(): Promise<GardenResponse> {
    return apiFetch<GardenResponse>('/garden/check-in', {
      method: 'POST',
    });
  },

  /**
   * Chăm sóc cây (Tưới nước / Bón phân)
   * POST /api/garden/care
   */
  async care(): Promise<GardenResponse> {
    return apiFetch<GardenResponse>('/garden/care', {
      method: 'POST',
    });
  },

  /**
   * Lấy lịch sử tích lũy điểm
   * GET /api/garden/points
   */
  async getHistory(): Promise<GardenHistoryItem[]> {
    return apiFetch<GardenHistoryItem[]>('/garden/points', {
      method: 'GET',
    });
  },
};
