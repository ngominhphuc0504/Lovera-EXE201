import { apiFetch } from './apiClient';

export interface AiConversationResponse {
  id: string;
  coupleId: string;
  createdByUserId: string;
  title: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  archivedAtUtc: string | null;
}

export interface AiMessageSourceResponse {
  url: string;
  title: string;
  startIndex?: number | null;
  endIndex?: number | null;
  checkedAtUtc?: string;
}

export interface AiDateSuggestion {
  name: string;
  type: string;
  summary: string;
  reason: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  priceText?: string | null;
  priceMinVnd?: number | null;
  priceMaxVnd?: number | null;
  priceUnit?: string | null;
  openingHours?: string | null;
  verificationStatus?: string;
  missingInformation?: string[];
}

export interface AiConversationContext {
  area?: string | null;
  budgetVnd?: number | null;
  desiredDateTime?: string | null;
  foodPreferences?: string[];
  activityPreferences?: string[];
  maxTravelDistanceKm?: number | null;
  otherConstraints?: string[];
}

export interface AiAssistantData {
  context?: AiConversationContext | null;
  suggestions?: AiDateSuggestion[];
}

export interface AiMessageResponse {
  id: string;
  conversationId: string;
  senderUserId?: string | null;
  role: 'user' | 'assistant';
  content: string;
  data?: AiAssistantData | null;
  replyToMessageId?: string | null;
  provider?: string | null;
  model?: string | null;
  createdAtUtc: string;
  sources?: AiMessageSourceResponse[];
}

export interface SendAiMessageResponse {
  userMessage: AiMessageResponse;
  assistantMessage: AiMessageResponse;
}

export interface SendAiMessageRequest {
  content: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  locationCapturedAt?: string;
}

export const aiChatService = {
  /**
   * Tạo cuộc trò chuyện AI mới
   */
  async createConversation(title?: string): Promise<AiConversationResponse> {
    return apiFetch<AiConversationResponse>('/ai-conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'Tư vấn hẹn hò Lovera' })
    });
  },

  /**
   * Lấy danh sách các cuộc trò chuyện AI của cặp đôi
   */
  async listConversations(take = 20): Promise<AiConversationResponse[]> {
    return apiFetch<AiConversationResponse[]>(`/ai-conversations?take=${take}`, {
      method: 'GET'
    });
  },

  /**
   * Lấy tin nhắn trong một cuộc trò chuyện
   */
  async getMessages(conversationId: string, take = 50): Promise<AiMessageResponse[]> {
    return apiFetch<AiMessageResponse[]>(`/ai-conversations/${conversationId}/messages?take=${take}`, {
      method: 'GET'
    });
  },

  /**
   * Gửi tin nhắn đến AI Assistant của backend
   */
  async sendMessage(
    conversationId: string,
    request: string | SendAiMessageRequest
  ): Promise<SendAiMessageResponse> {
    const payload: SendAiMessageRequest =
      typeof request === 'string' ? { content: request } : request;

    return apiFetch<SendAiMessageResponse>(`/ai-conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Lưu trữ cuộc trò chuyện
   */
  async archiveConversation(conversationId: string): Promise<AiConversationResponse> {
    return apiFetch<AiConversationResponse>(`/ai-conversations/${conversationId}/archive`, {
      method: 'POST'
    });
  }
};
