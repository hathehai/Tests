import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY chưa được cấu hình. Vui lòng kiểm tra trong mục Settings > Secrets của AI Studio.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function formatGeminiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return 'Lỗi xác thực API Key (403/400). Vui lòng kiểm tra hoặc chọn API Key hợp lệ trong bảng Settings > Secrets.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Hạn mức truy cập (Quota 429) đã tạm hết trên gói hiện tại. Bạn có thể nâng cấp hoặc chọn API Key có thanh toán trong mục Settings > Secrets.';
  }
  return msg || 'Đã xảy ra lỗi khi gọi Gemini API.';
}
