import { apiFetch, getSessionKey } from './apiClient';

const statusRequests = new Map<string, Promise<PairingStatusResponse>>();

export interface PairingCodeResponse {
  code: string;
  expiresAtUtc: string;
}

export interface CoupleMemberInfo {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface CoupleResponseMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CoupleResponse {
  coupleId: string;
  userIds: string[];
  createdAtUtc: string;
  startDate?: string | null;
  isActive: boolean;
  members: CoupleResponseMember[];
  partner: CoupleResponseMember;
}

export interface PairingStatusResponse {
  state: 'idle' | 'pending' | 'paired' | string;
  couple?: CoupleResponse | null;
  pendingUntilUtc?: string | null;
  isPaired?: boolean;
  partner?: CoupleMemberInfo | null;
}

export interface LoveDaysResponse {
  coupleId?: string;
  startDate?: string | null;
  today?: string;
  totalDays?: number | null;
  timeZone?: string;
}

export const coupleService = {
  /**
   * Lấy thông tin & trạng thái ghép đôi hiện tại của người dùng
   * GET /api/couples/me
   */
  getStatus(): Promise<PairingStatusResponse> {
    const key = getSessionKey();
    const existing = statusRequests.get(key);
    if (existing) return existing;
    const request = apiFetch<PairingStatusResponse>('/couples/me', {
      method: 'GET',
    }).then(res => ({
      ...res,
      isPaired: res.state === 'paired' || Boolean(res.couple?.isActive),
    })).finally(() => {
      if (statusRequests.get(key) === request) statusRequests.delete(key);
    });
    statusRequests.set(key, request);
    return request;
  },

  /**
   * Tạo mã mời kết nối cặp đôi
   * POST /api/couples/pairing-codes
   */
  async createPairingCode(): Promise<PairingCodeResponse> {
    return apiFetch<PairingCodeResponse>('/couples/pairing-codes', {
      method: 'POST',
    });
  },

  /**
   * Nhập mã để kết nối với đối phương
   * POST /api/couples/join
   */
  async joinCouple(code: string): Promise<CoupleResponse> {
    return apiFetch<CoupleResponse>('/couples/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Hủy kết nối cặp đôi
   * POST /api/couples/unpair
   */
  async unpair(confirmed = true): Promise<void> {
    return apiFetch<void>('/couples/unpair', {
      method: 'POST',
      body: JSON.stringify({ confirmed }),
    });
  },

  /**
   * Lấy số ngày yêu & ngày bắt đầu yêu
   * GET /api/couples/love-days
   */
  async getLoveDays(): Promise<LoveDaysResponse> {
    return apiFetch<LoveDaysResponse>('/couples/love-days', {
      method: 'GET',
    });
  },

  /**
   * Cài đặt / cập nhật ngày bắt đầu yêu
   * PUT /api/couples/love-days
   */
  async setLoveStartDate(startDate: string): Promise<LoveDaysResponse> {
    return apiFetch<LoveDaysResponse>('/couples/love-days', {
      method: 'PUT',
      body: JSON.stringify({ startDate }),
    });
  },
};
