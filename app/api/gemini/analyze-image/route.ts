import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, formatGeminiError } from '@/lib/gemini-server';

const IMAGE_ANALYSIS_SYSTEM_INSTRUCTION = `Bạn là Senior Performance Marketing Creative & Funnel Strategist (Meta Ads & TikTok Ads).
Khi người dùng tải lên hình ảnh (Creative Banner, Thumbnail Video 3s đầu, Landing Page/TikTok Shop screenshot, hoặc ảnh chụp bảng số liệu Ads Manager):
1. Nếu là Ảnh Creative / Thumbnail quảng cáo:
   - Đánh giá trực diện khả năng giữ chân 3 giây đầu (Thumb-stop / Visual Hook): Bố cục thị giác, điểm nhìn đầu tiên (Focal Point), độ tương phản, Text Overlay (có bị che bởi UI của TikTok/Reels hay vượt quá 20% diện tích không).
   - Đánh giá Value Proposition & Call-To-Action (CTA): Thông điệp nỗi đau (Pain point) hoặc ưu đãi có rõ ngay trong 2 giây đầu không?
   - Đề xuất 3 phương án sửa đổi Creative cụ thể để kéo tăng Hook Rate (>25%) và CTR (>1.5%).
2. Nếu là Ảnh chụp màn hình trình quản lý quảng cáo (Meta Ads Manager / TikTok Ads Manager):
   - Trích xuất chính xác các con số trong bảng ra định dạng CSV chuẩn và phân tích nhanh các chiến dịch lỗ/lãi theo đúng công thức Weighted Average.
3. Nếu là Ảnh chụp Landing Page / trang sản phẩm:
   - Chỉ ra điểm nghẽn khiến khách nhấp chuột (CTR cao) nhưng thoát trang không mua (CVR < 2%): tốc độ truyền tải thông tin Above-the-fold, nút mua hàng, bằng chứng xã hội (Social proof).`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/png', prompt, datasetSummary = '' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Vui lòng tải lên một hình ảnh để phân tích.' },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const ai = getGeminiClient();

    const userPrompt =
      prompt && prompt.trim().length > 0
        ? `${prompt}\n\nBối cảnh dữ liệu chiến dịch hiện tại:\n${datasetSummary}`
        : `Hãy phân tích toàn diện hình ảnh này dưới góc độ Senior Performance Marketing Analyst (Meta Ads & TikTok Ads). Chỉ rõ điểm mạnh, điểm nghẽn làm rớt Hook Rate / CTR / CVR và đề xuất phương án tối ưu hóa trực diện.\n\nBối cảnh dữ liệu chiến dịch hiện tại:\n${datasetSummary}`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };
    const textPart = {
      text: userPrompt,
    };

    let modelUsed = 'gemini-4-argon';
    let response;

    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: IMAGE_ANALYSIS_SYSTEM_INSTRUCTION,
        },
      });
    } catch (primaryErr) {
      // Fallback to gemini-3.8-flash only if free-tier key blocks gemini-4-argon
      modelUsed = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: IMAGE_ANALYSIS_SYSTEM_INSTRUCTION,
        },
      });
      void primaryErr;
    }

    return NextResponse.json({
      analysis: response.text ?? '',
      modelUsed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    );
  }
}
