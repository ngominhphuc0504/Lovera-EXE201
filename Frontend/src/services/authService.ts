import { 
  apiFetch, 
  setStoredToken, 
  clearStoredToken, 
  setStoredUserProfile,
  BASE_API_URL,
  getStoredToken,
  getSessionKey
} from './apiClient';

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  profile: ProfileResponse;
}

export interface UpdateProfileRequest {
  displayName: string;
  avatarUrl?: string | null;
}

export const authService = {
  /**
   * Đăng Ký Tài Khoản Mới
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Xác Thực Email Qua Mã OTP 6 Số
   * POST /api/auth/verify
   */
  async verify(data: VerifyRequest): Promise<void> {
    return apiFetch<void>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Gửi Lại Mã Xác Thực OTP
   * POST /api/auth/resend-verification
   */
  async resendVerification(email: string): Promise<void> {
    return apiFetch<void>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Đăng Nhập
   * POST /api/auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const result = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.accessToken) {
      setStoredToken(result.accessToken);
    }
    if (result.profile) {
      setStoredUserProfile(result.profile);
    }

    return result;
  },

  /**
   * Đăng Xuất
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    const session = getSessionKey();
    try {
      await apiFetch<void>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      if (session === getSessionKey()) clearStoredToken();
    }
  },

  /**
   * Lấy Thông Tin Cá Nhân Của Tài Khoản Đang Đăng Nhập
   * GET /api/profile/me
   */
  async getProfile(): Promise<ProfileResponse> {
    const profile = await apiFetch<ProfileResponse>('/profile/me', {
      method: 'GET',
    });
    setStoredUserProfile(profile);
    return profile;
  },

  /**
   * Cập Nhật Tên Hiển Thị / Avatar URL
   * PUT /api/profile/me
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    const profile = await apiFetch<ProfileResponse>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setStoredUserProfile(profile);
    return profile;
  },

  /**
   * Tải Lên Ảnh Đại Diện Avatar (File Upload)
   * PUT /api/profile/me/avatar
   */
  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const profile = await apiFetch<ProfileResponse>('/profile/me/avatar', {
      method: 'PUT',
      body: formData,
    });
    setStoredUserProfile(profile);
    return profile;
  },

  /**
   * Tải ảnh đại diện của chính mình từ backend dưới dạng Blob
   * GET /api/profile/me/avatar
   */
  async getMyAvatarBlob(): Promise<Blob | null> {
    const session = getSessionKey();
    const token = getStoredToken();
    if (!token) return null;
    try {
      const response = await fetch(`${BASE_API_URL}/profile/me/avatar`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'image/*',
        },
      });
      if (!response.ok) return null;
      const blob = await response.blob();
      if (session !== getSessionKey()) return null;
      if (!blob.type.startsWith('image/')) return null;
      return blob;
    } catch {
      return null;
    }
  },

  /**
   * Yêu Cầu Đặt Lại Mật Khẩu (Quên Mật Khẩu)
   * POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Xác Nhận Đặt Lại Mật Khẩu Bằng Mã OTP
   * POST /api/auth/reset-password
   */
  async resetPassword(data: { email: string; code: string; newPassword: string }): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
