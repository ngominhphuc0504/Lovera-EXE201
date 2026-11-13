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
 * Tạo câu trả lời thông minh bằng Google Gemini REST API
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
    const systemInstruction = `Bạn là Lovera AI (Lovera Cupid) — Trợ lý tình yêu 1:1 thông minh, ngọt ngào, tâm lý và tinh tế dành riêng cho ${couple.userA.name} (đang trò chuyện riêng tư với bạn, người yêu là ${couple.userB.name}).
Hai bạn đã yêu nhau từ ngày ${couple.startDate}.
Nhiệm vụ của bạn:
1. Gợi ý các ý tưởng hẹn hò ngọt ngào, bất ngờ, lãng mạn theo ngân sách và sở thích.
2. Gợi ý quà tặng tinh tế, mang đậm dấu ấn cảm xúc cho đối phương (${couple.userB.name}).
3. Chia sẻ lời khuyên tình yêu chân thành, tâm lý, bí quyết hòa giải khi giận dỗi hoặc bất đồng ý kiến.
4. Gợi ý thực đơn, món ăn ngon, địa điểm quán xá ấm cúng.
5. Luôn lắng nghe, thấu hiểu, an ủi khi mệt mỏi với sự ấm áp như người bạn thân tri kỷ.
🔒 BẢO MẬT & RIÊNG TƯ: Đây là cuộc trò chuyện 1:1 hoàn toàn bí mật giữa bạn và ${couple.userA.name}. Đối phương (${couple.userB.name}) tuyệt đối không nhìn thấy những gì ${couple.userA.name} hỏi bạn. Hãy giúp ${couple.userA.name} chuẩn bị những món quà bí mật, kế hoạch bất ngờ hoặc tâm sự khó nói một cách chu đáo và an tâm nhất!
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

    // Đảm bảo tin nhắn đầu tiên gửi lên Google API có role là 'user'
    const validContents = [...contents];
    while (validContents.length > 0 && validContents[0].role !== 'user') {
      validContents.shift();
    }
    if (validContents.length === 0) {
      validContents.push({ role: 'user', parts: [{ text: userQuery }] });
    }

    // Thử lần lượt các mô hình Gemini chính thức từ Google qua REST API
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro'
    ];
    let responseText = '';
    let lastError: unknown = null;

    const isBearer = apiKey.startsWith('AQ.') || apiKey.startsWith('ya29.') || apiKey.startsWith('Bearer ');
    const cleanToken = apiKey.replace(/^Bearer\s+/i, '').trim();

    for (const model of modelsToTry) {
      try {
        const body: any = {
          contents: validContents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1200,
          }
        };
        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        // Thử cả 2 dạng: API Key (?key=...) và OAuth Token (Authorization: Bearer ...)
        const requestAttempts: Array<{ url: string; headers: Record<string, string> }> = isBearer
          ? [
              { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanToken}` } },
              { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanToken)}`, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanToken } }
            ]
          : [
              { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanToken)}`, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanToken } },
              { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanToken}` } }
            ];

        for (const req of requestAttempts) {
          try {
            const res = await fetch(req.url, {
              method: 'POST',
              headers: req.headers,
              body: JSON.stringify(body)
            });

            if (res.ok) {
              const data = await res.json();
              const textCandidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textCandidate && typeof textCandidate === 'string' && textCandidate.trim()) {
                responseText = textCandidate;
                break;
              }
            } else {
              const errText = await res.text();
              console.warn(`Gemini ${model} call failed (${res.status}):`, errText);
            }
          } catch (fetchErr) {
            console.warn(`Gemini fetch attempt failed:`, fetchErr);
          }
        }

        if (responseText) break;
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
    console.warn('Gemini API call failed, falling back to local engine:', error);
    const fallback = fallbackFn(userQuery);
    return {
      text: fallback.text,
      suggestions: fallback.suggestions,
      isGeminiPowered: false,
    };
  }
}
