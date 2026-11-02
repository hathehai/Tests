import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, formatGeminiError } from '@/lib/gemini-server';

const ALLOWED_MODELS = new Set([
  'gemini-4-argon',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      newMessage,
      model = 'gemini-3.8-flash',
      datasetContext = '',
    } = body;

    if (!newMessage || typeof newMessage !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung câu hỏi.' },
        { status: 400 }
      );
    }

    const selectedModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.8-flash';
    const ai = getGeminiClient();

    const systemInstruction = `Bạn là Senior Performance Marketing Data Analyst chuyên sâu về Paid Social (Meta Ads & TikTok Ads).
Nguyên tắc bắt buộc:
1. Trả lời thẳng thắn, trực diện, dựa 100% trên số liệu Weighted Average thực tế của tài khoản đang nạp trong hệ thống. Không dùng từ ngữ sáo rỗng.
2. Khi trích dẫn bất kỳ chiến dịch nào, phải nêu rõ tên Campaign / Ad Group / Creative kèm các chỉ số Spend, CPA, CTR, CVR, Hook Rate, Hold Rate, Frequency.
3. Tuyệt đối KHÔNG lấy trung bình cộng của cột tỷ lệ (CTR, CVR, CPA); luôn dùng Weighted Average từ tổng thành phần.

DỮ LIỆU HIỆN TẠI TRONG WORKSPACE CỦA NGƯỜI DÙNG:
${datasetContext}`;

    // Format history for ai.chats.create
    const history = Array.isArray(messages)
      ? messages
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === 'user' || m.role === 'model') &&
              typeof m.content === 'string' &&
              m.content.trim().length > 0
          )
          .map((m: { role: 'user' | 'model'; content: string }) => ({
            role: m.role,
            parts: [{ text: m.content }],
          }))
      : [];

    let activeModel = selectedModel;
    let replyText = '';

    try {
      const chat = ai.chats.create({
        model: activeModel,
        history,
        config: {
          systemInstruction,
        },
      });
      const response = await chat.sendMessage({
        message: newMessage,
      });
      replyText = response.text ?? '';
    } catch (err) {
      if (activeModel === 'gemini-4-argon') {
        activeModel = 'gemini-3.8-flash';
        const fallbackChat = ai.chats.create({
          model: activeModel,
          history,
          config: {
            systemInstruction,
          },
        });
        const fallbackResponse = await fallbackChat.sendMessage({
          message: newMessage,
        });
        replyText = fallbackResponse.text ?? '';
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      reply: replyText,
      modelUsed: activeModel,
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    );
  }
}
