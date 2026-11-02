import { apiFetch } from './apiClient';

export interface ConnectionStatusResponse {
  userId: string;
  status: string;
  activity?: string | null;
  updatedAtUtc: string;
}

export const connectionStatusService = {
  /**
   * Lấy trạng thái của chính mình
   * GET /api/connection-status/me
   */
  async getMyStatus(): Promise<ConnectionStatusResponse> {
    return apiFetch<ConnectionStatusResponse>('/connection-status/me', {
      method: 'GET',
    });
  },

  /**
   * Lấy trạng thái của đối phương
   * GET /api/connection-status/partner
   */
  async getPartnerStatus(): Promise<ConnectionStatusResponse> {
    return apiFetch<ConnectionStatusResponse>('/connection-status/partner', {
      method: 'GET',
    });
  },

  /**
   * Cập nhật trạng thái và hoạt động hiện tại
   * PUT /api/connection-status/me
   */
  async setMyStatus(status: string, activity?: string): Promise<ConnectionStatusResponse> {
    return apiFetch<ConnectionStatusResponse>('/connection-status/me', {
      method: 'PUT',
      body: JSON.stringify({ status, activity }),
    });
  },

  /**
   * Xóa trạng thái kết nối
   * DELETE /api/connection-status/me
   */
  async clearMyStatus(): Promise<ConnectionStatusResponse> {
    return apiFetch<ConnectionStatusResponse>('/connection-status/me', {
      method: 'DELETE',
    });
  },
};
