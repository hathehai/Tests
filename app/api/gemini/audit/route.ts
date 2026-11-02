import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, formatGeminiError } from '@/lib/gemini-server';

const AUDIT_SYSTEM_INSTRUCTION = `# ROLE & OBJECTIVE
Bạn là một Senior Performance Marketing Data Analyst chuyên sâu về Paid Social (Meta Ads & TikTok Ads). Nhiệm vụ của bạn là phân tích dữ liệu đã chuẩn hóa và kiểm chứng bằng công cụ Python Code Execution, xuất ra báo cáo phân tích hiệu suất chiến dịch sắc bén, dựa hoàn toàn trên số liệu thực tế.

# NGUYÊN TẮC CỐT LÕI (STRICT RULES)
1. KHÔNG BỊA ĐẶT SỐ LIỆU: Mọi phép tính tổng (SUM) và trung bình trọng số (Weighted Average) bắt buộc phải tính từ tổng cấu phần (Ví dụ: Tổng CTR = Tổng Clicks / Tổng Impressions, TUYỆT ĐỐI KHÔNG lấy trung bình cộng của cột CTR từng dòng).
2. THẲNG THẮN & TRỰC DIỆN: Không dùng từ ngữ tâng bốc, sáo rỗng. Chiến dịch nào lỗ, CPA vượt ngưỡng, hoặc dấu hiệu Ad Fatigue (bão hòa nội dung) phải chỉ đích danh tên Campaign/Ad Group/Creative đó kèm số liệu chứng minh.
3. XỬ LÝ DỮ LIỆU THIẾU: Nếu dữ liệu tải lên thiếu cột quan trọng (như Spend, Impressions, Conversions, Video Views), hãy báo lỗi thiếu cột cụ thể ngay ở đầu báo cáo và chỉ tính toán trên các trường hiện có.

# CẤU TRÚC BÁO CÁO ĐẦU RA (BẮT BUỘC ĐÚNG 4 MỤC MARKDOWN):
## 1. TỔNG QUAN HIỆU SUẤT ĐA KÊNH (EXECUTIVE SUMMARY)
Xuất bảng so sánh tổng hợp giữa Facebook Ads, TikTok Ads và Tổng cộng (Total):
| Nền tảng | Chi tiêu (VND) | % Ngân sách | Impressions | Clicks | CTR (%) | CPC (VND) | Kết quả (Conversions) | CVR (%) | CPA/CPL (VND) |
Kèm đúng 3 gạch đầu dòng nhận xét ngắn gọn về hiệu quả phân bổ ngân sách giữa 2 kênh (Kênh nào gánh volume chuyển đổi, kênh nào có CPA rẻ hơn).

## 2. PHÂN TÍCH PHỄU CHUYỂN ĐỔI & CHẤT LƯỢNG CREATIVE
- Giai đoạn Thu hút (Upper Funnel - CPM, CTR, Hook Rate chuẩn > 25%, Hold Rate).
- Giai đoạn Tương tác & Chuyển đổi (Lower Funnel - CPC, CVR chuẩn > 2%, CPA; chỉ rõ điểm nghẽn ở Landing Page/Shop hoặc Targeting nếu CTR > 1.5% nhưng CVR < 2%).

## 3. BẢNG XẾP HẠNG CHIẾN DỊCH / NHÓM QUẢNG CÁO (TOP WINNERS & LOSERS)
- Top 3 Chiến dịch/Adset hiệu quả nhất (Best Performers): CPA thấp nhất và Volume chuyển đổi đáng kể.
- Top 3 Chiến dịch/Adset đốt tiền (Underperformers / Bleeding Budget): Chi tiêu cao nhưng không ra chuyển đổi, hoặc CPA vượt quá 150% mức trung bình của toàn tài khoản.

## 4. KẾ HOẠCH HÀNH ĐỘNG TỐI ƯU HÓA (ACTIONABLE RECOMMENDATIONS)
- TẮT NGAY (Kill/Pause): Liệt kê chính xác tên Campaign/Adset/Ad cần tắt để cắt lỗ kèm lý do số liệu.
- TĂNG NGÂN SÁCH (Scale): Liệt kê Campaign/Adset đủ điều kiện tăng ngân sách (CPA tốt, Frequency < 2.2 trên Meta, volume ổn định) và đề xuất mức tăng 15-20% ngân sách/ngày để không vỡ Learning Phase.
- CẢI THIỆN CREATIVE / TARGETING: Đề xuất hướng sửa cụ thể cho các nhóm có Hook Rate thấp (<25%) hoặc Frequency quá cao.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      normalizedSummaryJson,
      missingCriticalColumns,
      missingOptionalColumns,
      pythonScript,
      preferredModel = 'gemini-4-argon',
    } = body;

    if (!normalizedSummaryJson) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu chuẩn hóa để phân tích.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    const prompt = `Hãy thực thi kiểm chứng số liệu (bằng Python Code Execution nếu cần) và xuất báo cáo Audit Paid Social chuyên sâu theo đúng 4 phần Markdown bắt buộc.

DỮ LIỆU KIỂM TRA CỘT THIẾU:
- Cột quan trọng bị thiếu: ${
      missingCriticalColumns?.length > 0 ? missingCriticalColumns.join(', ') : 'Không thiếu'
    }
- Cột bổ sung bị thiếu: ${
      missingOptionalColumns?.length > 0 ? missingOptionalColumns.join(', ') : 'Đầy đủ'
    }

SCRIPT PYTHON CHUẨN HÓA & WEIGHTED METRICS:
\`\`\`python
${pythonScript || '# No script'}
\`\`\`

DỮ LIỆU ĐÃ TÍNH WEIGHTED AVERAGE CHÍNH XÁC (TUYỆT ĐỐI GIỮ NGUYÊN CÁC CON SỐ NÀY, KHÔNG TỰ Ý LÀM TRÒN SAI LỆCH):
${JSON.stringify(normalizedSummaryJson, null, 2)}
`;

    let usedModel = preferredModel;
    let response;

    try {
      response = await ai.models.generateContent({
        model: preferredModel,
        contents: prompt,
        config: {
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          tools: [{ codeExecution: {} }],
        },
      });
    } catch (primaryErr) {
      // Graceful fallback to gemini-3.8-flash if gemini-4-argon requires paid billing key
      usedModel = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          tools: [{ codeExecution: {} }],
        },
      });
      void primaryErr;
    }

    // Extract any executableCode / codeExecutionResult parts if returned by Gemini
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const executedPythonBlocks: { code?: string; output?: string }[] = [];
    for (const part of parts) {
      const anyPart = part as Record<string, unknown>;
      if (anyPart.executableCode || anyPart.codeExecutionResult) {
        const execCode = anyPart.executableCode as { code?: string } | undefined;
        const execRes = anyPart.codeExecutionResult as { output?: string } | undefined;
        executedPythonBlocks.push({
          code: execCode?.code,
          output: execRes?.output,
        });
      }
    }

    return NextResponse.json({
      markdown: response.text ?? '',
      modelUsed: usedModel,
      executedPythonBlocks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    );
  }
}
