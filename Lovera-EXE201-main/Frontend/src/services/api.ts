// ============================================================================
// LOVERA BACKEND API CLIENT (ASP.NET Core .NET 8)
// ============================================================================

export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5164/api';

// --- Types & Data Contracts matching Lovera.Api Swagger ---
export interface RegisterRequest {
  email: string;       // max 320 chars, valid email
  password: string;    // min 12 chars, max 128 chars
  displayName: string; // min 1, max 80 chars
}

export interface VerifyRequest {
  email: string;
  code: string;        // 6-digit verification code
}

export interface EmailRequest {
  email: string;
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

export interface ApiProblemError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// --- Token Management Helpers ---
const TOKEN_KEY = 'lovera_access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// --- HTTP Request Helper with structured error parsing ---
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_API_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorData: any = null;
    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
    }

    const code = errorData?.code || `HTTP_${response.status}`;
    let message = errorData?.message;

    if (!message) {
      if (response.status === 401) message = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.';
      else if (response.status === 403) message = 'Tài khoản chưa được kích hoạt hoặc không có quyền truy cập.';
      else if (response.status === 404) message = 'Không tìm thấy dữ liệu yêu cầu.';
      else if (response.status === 409) message = 'Dữ liệu đã tồn tại trong hệ thống.';
      else if (response.status === 429) message = 'Thao tác quá nhanh. Vui lòng đợi trong giây lát.';
      else if (response.status >= 500) message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
      else message = `Lỗi yêu cầu: Mã phản hồi ${response.status}`;
    }

    const problem: ApiProblemError = {
      code,
      message,
      errors: errorData?.errors,
      status: response.status,
    };

    const err = new Error(problem.message);
    (err as any).problem = problem;
    (err as any).code = problem.code;
    (err as any).status = problem.status;
    throw err;
  }

  return isJson ? response.json() : (response.text() as any);
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * 1. Đăng Ký Tài Khoản: POST /api/auth/register
 * - Yêu cầu: Email, Password (tối thiểu 12 ký tự), DisplayName
 * - Phản hồi: 202 Accepted { message: "Đã gửi mã xác thực tới email. Mã có hiệu lực 10 phút." }
 */
export async function registerUser(data: RegisterRequest): Promise<{ message: string; otp?: string }> {
  return request<{ message: string; otp?: string }>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * 2. Xác Thực Email (OTP): POST /api/auth/verify-email
 * - Yêu cầu: Email, Code (6 chữ số)
 * - Phản hồi: 200 OK { message: "Email đã được xác thực." }
 */
export async function verifyEmail(data: VerifyRequest): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * 3. Gửi Lại Mã Xác Thực: POST /api/auth/resend-verification
 * - Yêu cầu: Email
 * - Phản hồi: 202 Accepted { message: "Nếu tài khoản cần xác thực, mã mới đã được gửi." }
 */
export async function resendVerification(email: string): Promise<{ message: string; otp?: string }> {
  return request<{ message: string; otp?: string }>('/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

/**
 * 4. Đăng Nhập: POST /api/auth/login
 * - Yêu cầu: Email, Password
 * - Phản hồi: 200 OK { accessToken, expiresAtUtc, profile }
 */
export async function loginUser(emailOrReq: string | LoginRequest, maybePassword?: string): Promise<LoginResponse> {
  const payload: LoginRequest = typeof emailOrReq === 'string'
    ? { email: emailOrReq, password: maybePassword || '' }
    : emailOrReq;

  const result = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.accessToken) {
    setStoredToken(result.accessToken);
  }

  return result;
}

/**
 * 5. Đăng Xuất: POST /api/auth/logout
 * - Yêu cầu: Bearer Token trong header
 * - Phản hồi: 204 No Content
 */
export async function logoutUser(): Promise<void> {
  try {
    await request<void>('/auth/logout', {
      method: 'POST',
    });
  } finally {
    clearStoredToken();
  }
}

/**
 * 6. Lấy Thông Tin Cá Nhân: GET /api/profile/me
 * - Yêu cầu: Bearer Token
 * - Phản hồi: 200 OK { id, email, emailVerified, displayName, avatarUrl }
 */
export async function getProfile(): Promise<ProfileResponse> {
  return request<ProfileResponse>('/profile/me', {
    method: 'GET',
  });
}

/**
 * 7. Cập Nhật Thông Tin Cá Nhân: PUT /api/profile/me
 * - Yêu cầu: Bearer Token, DisplayName, AvatarUrl (optional)
 * - Phản hồi: 200 OK ProfileResponse
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
  return request<ProfileResponse>('/profile/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * 8. Tải Lên Ảnh Avatar: PUT /api/profile/me/avatar
 * - Yêu cầu: Bearer Token, File (PNG, JPEG, WebP, max 5MB)
 * - Phản hồi: 200 OK ProfileResponse
 */
export async function uploadAvatar(file: File): Promise<ProfileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_API_URL}/profile/me/avatar`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch { }
    throw new Error(errorData?.message || 'Không thể tải lên ảnh avatar.');
  }

  return response.json();
}

/**
 * 9. Lấy Đường Dẫn Xem Trực Tiếp Avatar: GET /api/profile/me/avatar
 */
export function getAvatarImageUrl(): string {
  return `${BASE_API_URL}/profile/me/avatar`;
}

/**
 * 10. Kiểm tra trạng thái Backend: GET /health/live
 */
export async function checkBackendLive(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL.replace('/api', '')}/health/live`);
    return res.ok;
  } catch {
    return false;
  }
}