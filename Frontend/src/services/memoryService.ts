import { apiFetch, BASE_API_URL } from './apiClient';

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

export const memoryService = {
  /**
   * Lấy danh sách timeline bài viết kỷ niệm từ backend
   * GET /api/memories
   */
  async getTimeline(): Promise<BackendMemoryItem[]> {
    return apiFetch<BackendMemoryItem[]>('/memories', {
      method: 'GET',
    });
  },

  /**
   * Tạo bài viết kỷ niệm kèm ảnh
   * POST /api/memories (multipart/form-data)
   */
  async createMemory(text: string, imageFile?: File): Promise<BackendMemoryItem> {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (imageFile) formData.append('image', imageFile);

    return apiFetch<BackendMemoryItem>('/memories', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Lấy URL ảnh kỷ niệm trực tiếp từ backend
   * GET /api/memories/{id}/image
   */
  getImageUrl(memoryId: string): string {
    return `${BASE_API_URL}/memories/${memoryId}/image`;
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
