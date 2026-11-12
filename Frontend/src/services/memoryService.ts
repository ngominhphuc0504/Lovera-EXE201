import { apiFetch, ApiError, BASE_API_URL, getStoredToken, getSessionKey } from './apiClient';

const timelineRequests = new Map<string, Promise<BackendMemoryItem[]>>();

export interface BackendMemoryItem {
  id: string;
  coupleId?: string;
  creatorUserId?: string;
  userId?: string;
  authorName?: string;
  authorAvatar?: string;
  text?: string;
  hasImage: boolean;
  imageUrl?: string | null;
  createdAtUtc: string;
}

export function getMemoryImageUrl(memoryId: string): string {
  return `${BASE_API_URL}/memories/${memoryId}/image`;
}

export const memoryService = {
  /**
   * Lấy danh sách timeline bài viết kỷ niệm từ backend
   * GET /api/memories
   */
  getTimeline(): Promise<BackendMemoryItem[]> {
    const session = getSessionKey();
    const existing = timelineRequests.get(session);
    if (existing) return existing;
    const request = apiFetch<BackendMemoryItem[]>('/memories', {
      method: 'GET',
    }).finally(() => {
      if (timelineRequests.get(session) === request) timelineRequests.delete(session);
    });
    timelineRequests.set(session, request);
    return request;
  },

  /**
   * Tạo bài viết kỷ niệm kèm ảnh hoặc chỉ ghi chú
   * POST /api/memories (multipart/form-data)
   */
  async createMemory(text?: string, imageFile?: File): Promise<BackendMemoryItem> {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    return apiFetch<BackendMemoryItem>('/memories', {
      method: 'POST',
      body: formData,
    });
  },

  async getImage(memoryId: string): Promise<Blob> {
    const session = getSessionKey();
    const token = getStoredToken();
    if (!token) {
      throw new ApiError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401, 'unauthenticated');
    }

    let response: Response;
    try {
      response = await fetch(getMemoryImageUrl(memoryId), {
        headers: {
          Accept: 'image/*',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Không thể tải ảnh kỷ niệm.',
        0,
        'network_error',
      );
    }

    if (!response.ok) {
      throw new ApiError(
        response.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem ảnh.'
          : response.status === 403 || response.status === 404
            ? 'Không tìm thấy ảnh hoặc bạn không có quyền truy cập.'
            : 'Không thể tải ảnh kỷ niệm. Vui lòng thử lại.',
        response.status,
        response.status === 401 ? 'unauthenticated' : `HTTP_${response.status}`,
      );
    }

    const image = await response.blob();
    if (session !== getSessionKey()) throw new ApiError('Phiên đăng nhập đã thay đổi.', 0, 'stale_session');
    if (!image.type.startsWith('image/')) {
      throw new ApiError('Dữ liệu ảnh không hợp lệ.', response.status, 'invalid_image_response');
    }
    return image;
  },

  /**
   * Xóa bài viết kỷ niệm
   * DELETE /api/memories/{id}
   */
  async deleteMemory(memoryId: string): Promise<void> {
    return apiFetch<void>(`/memories/${memoryId}`, {
      method: 'DELETE',
    });
  },
};
