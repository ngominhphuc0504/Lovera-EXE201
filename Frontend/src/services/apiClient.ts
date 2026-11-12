// ============================================================================
// LOVERA REST API CLIENT (ASP.NET Core .NET 8)
// Base URL: http://localhost:5164/api
// ============================================================================

export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'lovera_access_token';
const USER_KEY = 'lovera_current_user_profile';
let sessionRevision = 0;

// Rate limit tracking map to prevent retry loops and hammering the backend
const rateLimitMap = new Map<string, number>();

function getRouteKey(path: string): string {
  const clean = path.split('?')[0].toLowerCase();
  if (clean.includes('/couples/love-days')) return '/couples/love-days';
  if (clean.includes('/couples')) return '/couples';
  if (clean.includes('/memories')) return '/memories';
  if (clean.includes('/garden')) return '/garden';
  if (clean.includes('/account')) return '/account';
  return clean;
}

export function recordRateLimit(path: string, seconds: number): void {
  const key = getRouteKey(path);
  rateLimitMap.set(key, Date.now() + Math.max(1, seconds) * 1000);
}

export function isRouteRateLimited(path: string): boolean {
  const key = getRouteKey(path);
  const expiry = rateLimitMap.get(key);
  if (!expiry) return false;
  if (Date.now() >= expiry) {
    rateLimitMap.delete(key);
    return false;
  }
  return true;
}

export function getRateLimitRemainingMinutes(path: string): number {
  const key = getRouteKey(path);
  const expiry = rateLimitMap.get(key);
  if (!expiry) return 0;
  const remainingSeconds = Math.ceil((expiry - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    rateLimitMap.delete(key);
    return 0;
  }
  return Math.max(1, Math.ceil(remainingSeconds / 60));
}

// Includes a revision so logging out and back into the same account invalidates old work.
export function getSessionKey(): string {
  return `${sessionRevision}:${getStoredToken() || ''}`;
}

export interface ApiProblemDetails {
  status?: number;
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status = 500, code = 'unknown_error', errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

// --- Token & User Profile Storage Helpers ---
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  sessionRevision++;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('[apiClient] Failed to store token:', err);
  }
}

export function clearStoredToken(): void {
  sessionRevision++;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('[apiClient] Failed to clear token:', err);
  }
}

export function getStoredUserProfile<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUserProfile(profile: any): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[apiClient] Failed to store user profile:', err);
  }
}

/**
 * Universal API Request Handler
 * Automatically appends Authorization Bearer Token and extracts structured errors.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getSessionKey();

  // If this route is currently in rate-limit cooldown, fail fast without hitting the network
  if (isRouteRateLimited(path)) {
    const minutes = getRateLimitRemainingMinutes(path);
    throw new ApiError(
      `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${minutes} phút.`,
      429,
      'rate_limit_cooldown'
    );
  }

  const url = path.startsWith('http') ? path : `${BASE_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  
  // Set default Accept header if not provided
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Auto-inject JWT token if available
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-set Content-Type for JSON payloads (if body is not FormData)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal,
    }).finally(() => clearTimeout(timeoutId));
    if (session !== getSessionKey()) {
      throw new ApiError('Phiên đăng nhập đã thay đổi.', 0, 'stale_session');
    }

    // 204 No Content
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

      if (response.status === 429) {
        const retryHeader = response.headers.get('Retry-After') || response.headers.get('retry-after');
        const retryAfter = Number(retryHeader || 60);
        const waitSeconds = isNaN(retryAfter) || retryAfter <= 0 ? 60 : retryAfter;
        const minutes = Math.max(1, Math.ceil(waitSeconds / 60));
        recordRateLimit(path, waitSeconds);
        throw new ApiError(
          `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${minutes} phút.`,
          429,
          'too_many_requests'
        );
      }

      const code = errorData?.code || `HTTP_${response.status}`;
      let message = errorData?.message;

      if (!message) {
        if (response.status === 400) message = 'Thông tin gửi lên không hợp lệ.';
        else if (response.status === 401) message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
        else if (response.status === 403) message = 'Bạn không có quyền thực hiện thao tác này.';
        else if (response.status === 404) message = 'Không tìm thấy dữ liệu yêu cầu.';
        else if (response.status === 409) message = 'Dữ liệu đã tồn tại trong hệ thống.';
        else if (response.status >= 500) message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
        else message = `Lỗi phản hồi từ máy chủ (${response.status})`;
      }

      throw new ApiError(message, response.status, code, errorData?.errors);
    }

    const result = isJson ? await response.json() : await response.text();
    if (session !== getSessionKey()) {
      throw new ApiError('Phiên đăng nhập đã thay đổi.', 0, 'stale_session');
    }
    return result as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err?.name === 'AbortError') {
      throw new ApiError(
        'Máy chủ Backend không phản hồi (Timeout sau 10 giây). Vui lòng thử lại hoặc sử dụng lối tắt kiểm thử.',
        504,
        'timeout'
      );
    }
    // Network errors (e.g. Failed to fetch when backend is offline)
    throw new ApiError(
      err.message === 'Failed to fetch' 
        ? 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.'
        : err.message || 'Lỗi kết nối mạng.',
      0,
      'network_error'
    );
  }
}

/**
 * Health check: Tests if Backend is live and reachable.
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_API_URL.replace('/api', '')}/swagger/v1/swagger.json`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return res.ok || res.status === 200 || res.status === 404;
  } catch {
    return false;
  }
}
