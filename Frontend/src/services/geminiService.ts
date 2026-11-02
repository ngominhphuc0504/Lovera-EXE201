import { GoogleGenAI } from '@google/genai';
import { CoupleData, ChatMessage } from '../types';

export interface GeminiResponse {
  text: string;
  suggestions: string[];
  isGeminiPowered: boolean;
}

const STORAGE_KEY = 'lovera_gemini_api_key';

/**
 * Lấy Gemini API key từ localStorage hoặc biến môi trường .env (VITE_GEMINI_API_KEY)
 */
export function getGeminiApiKey(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // Ignore localStorage errors
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof envKey === 'string' ? envKey.trim() : '';
}

/**
 * Lưu hoặc xóa Gemini API key trong localStorage
 */
export function setGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to save Gemini API key:', err);
  }
}

/**
 * Kiểm tra xem đã có API key để sử dụng Gemini chưa
 */
export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

/**
 * Tạo câu trả lời thông minh bằng Gemini 2.5 Flash thông qua @google/genai
 * Tự động dự phòng về bộ phản hồi cục bộ nếu chưa có API key hoặc lỗi mạng
 */
export async function generateGeminiReply(
  userQuery: string,
  history: ChatMessage[],
  couple: CoupleData,
  fallbackFn: (query: string) => { text: string; suggestions: string[] }
): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();

  // Nếu chưa có API key -> dùng fallback thông minh
  if (!apiKey) {
    const fallback = fallbackFn(userQuery);
    return {
      text: fallback.text,
      suggestions: fallback.suggestions,
      isGeminiPowered: false,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Bạn là Lovera AI (Lovera Cupid) — Trợ lý tình yêu 1:1 thông minh, ngọt ngào, tâm lý và tinh tế dành riêng cho cặp đôi ${couple.userA.name} và ${couple.userB.name}.
Hai bạn đã yêu nhau từ ngày ${couple.startDate}.
Nhiệm vụ của bạn:
1. Gợi ý các ý tưởng hẹn hò ngọt ngào, bất ngờ, lãng mạn theo ngân sách và sở thích.
2. Gợi ý quà tặng tinh tế, mang đậm dấu ấn cảm xúc cho đối phương.
3. Chia sẻ lời khuyên tình yêu chân thành, tâm lý, bí quyết hòa giải khi giận dỗi hoặc bất đồng ý kiến.
4. Gợi ý thực đơn, món ăn ngon, địa điểm quán xá ấm cúng.
5. Luôn lắng nghe, thấu hiểu, an ủi khi mệt mỏi với sự ấm áp như người bạn thân tri kỷ.
Phong cách giao tiếp:
- Giọng điệu gần gũi, dịu dàng, lãng mạn, ấm áp, tích cực và truyền cảm hứng yêu thương.
- Sử dụng emoji ngọt ngào tinh tế (💕, ✨, 🌸, ☕, 🎁, 🍽️, 💖).
- Trả lời bằng tiếng Việt tự nhiên, có định dạng Markdown đẹp, gạch đầu dòng rõ ràng, dễ đọc.
- Ở CUỐI câu trả lời, hãy LUÔN cung cấp 3 đến 4 câu hỏi hoặc chủ đề gợi ý tiếp theo sau dòng "---SUGGESTIONS---" với mỗi gợi ý trên một dòng (ngắn gọn dưới 40 từ, không đánh số, không gạch đầu dòng). Ví dụ:
---SUGGESTIONS---
Ý tưởng hẹn hò ngọt ngào cuối tuần
Chọn quà bất ngờ ngày kỷ niệm
Cách viết tin nhắn làm lành chân thành`;

    // Lấy 6 tin nhắn gần nhất để làm ngữ cảnh hội thoại
    const recentMessages = history.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const contents = [
      ...recentMessages,
      {
        role: 'user',
        parts: [{ text: userQuery }]
      }
    ];

    // Thử lần lượt các mô hình Gemini phổ biến
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let responseText = '';
    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
            maxOutputTokens: 1200,
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${model} call failed, trying next:`, err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Không nhận được phản hồi từ Gemini');
    }

    // Tách gợi ý nếu có
    let cleanText = responseText;
    let suggestions: string[] = [];

    if (responseText.includes('---SUGGESTIONS---')) {
      const parts = responseText.split('---SUGGESTIONS---');
      cleanText = parts[0].trim();
      const rawSuggestions = parts[1]
        .split('\n')
        .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(s => s.length > 0 && s.length < 80);
      if (rawSuggestions.length > 0) {
        suggestions = rawSuggestions.slice(0, 4);
      }
    }

    if (suggestions.length === 0) {
      suggestions = [
        '💡 Gợi ý thêm chi tiết cho mình',
        '🎁 Cách chuẩn bị bất ngờ lãng mạn',
        '🍲 Ý tưởng cho buổi tối hai đứa'
      ];
    }

    return {
      text: cleanText,
      suggestions,
      isGeminiPowered: true,
    };
  } catch (error) {
    console.error('Gemini API call failed, falling back to local engine:', error);
    const fallback = fallbackFn(userQuery);
    return {
      text: fallback.text,
      suggestions: fallback.suggestions,
      isGeminiPowered: false,
    };
  }
}
