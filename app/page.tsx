'use client';

import React, { useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Upload,
  FileSpreadsheet,
  Play,
  Copy,
  Check,
  Download,
  Search,
  ArrowUpDown,
  AlertTriangle,
  Sparkles,
  Terminal,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
} from 'lucide-react';
import {
  analyzeAdDataset,
  SAMPLE_DATASETS,
  formatVND,
  formatNum,
  formatPct,
  type NormalizedAdRow,
  type AdPlatform,
} from '@/lib/ad-data-engine';

type ActiveTab = 'audit' | 'ledger' | 'python' | 'vision' | 'chat';
type ChatModelId = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

const CHAT_MODELS: { id: ChatModelId; label: string; purpose: string }[] = [
  {
    id: 'gemini-4-argon',
    label: 'gemini-4-argon',
    purpose: 'Tác vụ phức tạp: Tối ưu phân bổ ngân sách đa kênh, mô phỏng ROAS/CPA & kiểm toán sâu',
  },
  {
    id: 'gemini-3.8-flash',
    label: 'gemini-3.8-flash',
    purpose: 'Tác vụ tiêu chuẩn: Chẩn đoán phễu chuyển đổi, so sánh Adset & giải thích số liệu',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'gemini-3.1-flash-lite',
    purpose: 'Phản hồi siêu tốc: Tra cứu nhanh chỉ số chiến dịch & gợi ý Hook 3 giây tức thì',
  },
];

export default function PaidSocialAuditorPage() {
  // Raw input & preset state
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('omni_q4');
  const [rawInputText, setRawInputText] = useState<string>(
    SAMPLE_DATASETS.omni_q4.rawText
  );
  const [showDataIngestionEditor, setShowDataIngestionEditor] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('audit');

  // Filter & Sort state for Normalized Ledger
  const [platformFilter, setPlatformFilter] = useState<'ALL' | AdPlatform>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof NormalizedAdRow>('spend');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Gemini AI Deep Audit state
  const [aiAuditMarkdown, setAiAuditMarkdown] = useState<string | null>(null);
  const [aiAuditModelUsed, setAiAuditModelUsed] = useState<string | null>(null);
  const [aiExecutedPython, setAiExecutedPython] = useState<
    { code?: string; output?: string }[]
  >([]);
  const [isRunningAiAudit, setIsRunningAiAudit] = useState<boolean>(false);
  const [aiAuditError, setAiAuditError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  // Multi-turn Chatbot state
  const [chatModel, setChatModel] = useState<ChatModelId>('gemini-4-argon');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content:
        'Xin chào! Tôi là **Senior Performance Marketing Data Analyst** (Meta Ads & TikTok Ads). Toàn bộ dữ liệu chiến dịch đã chuẩn hóa và các chỉ số **Weighted Average** đang được nạp trực tiếp vào bộ nhớ phân tích. Bạn muốn kiểm tra điểm nghẽn CPA, viết lại kịch bản Hook 3 giây cho các nhóm bão hòa, hay tính toán phương án dịch chuyển ngân sách?',
      modelUsed: 'gemini-4-argon',
      timestamp: 'Sẵn sàng',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Image Analysis (gemini-4-argon) state
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/png');
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState<string>(
    'Phân tích hình ảnh quảng cáo / bảng số liệu này dưới góc nhìn Paid Social Analyst: Đánh giá khả năng giữ chân 3 giây đầu (Thumb-stop Hook), bố cục thị giác, thông điệp CTA, mật độ chữ trên khung hình (Safe Zone của Reels/TikTok) và đề xuất 3 hành động tối ưu hóa giúp tăng Hook Rate & CVR.'
  );
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);
  const [imageAnalysisModel, setImageAnalysisModel] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [imageAnalysisError, setImageAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Compute deterministic normalized analysis
  const { analysis, parseError } = useMemo(() => {
    try {
      const res = analyzeAdDataset(rawInputText);
      return { analysis: res, parseError: null };
    } catch (err) {
      return {
        analysis: null,
        parseError: err instanceof Error ? err.message : 'Lỗi phân tích dữ liệu đầu vào.',
      };
    }
  }, [rawInputText]);

  // Compact dataset context string for Gemini Chat & Image Analysis
  const datasetContextString = useMemo(() => {
    if (!analysis) return 'Chưa có dữ liệu hợp lệ.';
    const { meta, tiktok, total } = analysis.summaries;
    const rowsSummary = analysis.rows
      .map(
        (r) =>
          `- [${r.platform}] Campaign: ${r.campaignName} | AdGroup: ${r.adGroupName} | Creative: ${
            r.creativeName
          } | Spend: ${formatVND(r.spend)} | Impr: ${r.impressions} | Reach: ${
            r.reach
          } (Freq: ${r.frequency.toFixed(2)}) | Clicks: ${r.clicks} | CTR: ${formatPct(
            r.ctr
          )} | CPC: ${formatVND(r.cpc)} | Conv: ${r.conversions} | CVR: ${formatPct(
            r.cvr
          )} | CPA: ${r.conversions > 0 ? formatVND(r.cpa) : '0 KQ (Lỗ)'} | HookRate: ${formatPct(
            r.hookRate
          )} | HoldRate: ${formatPct(r.holdRate)}`
      )
      .join('\n');

    return `TỔNG QUAN WEIGHTED AVERAGE:
- Meta Ads: Spend ${formatVND(meta.spend)} (${formatPct(meta.budgetShare)}), Impr ${
      meta.impressions
    }, Clicks ${meta.clicks}, CTR ${formatPct(meta.ctr)}, CPC ${formatVND(meta.cpc)}, Conv ${
      meta.conversions
    }, CVR ${formatPct(meta.cvr)}, CPA ${formatVND(meta.cpa)}, HookRate ${formatPct(
      meta.hookRate
    )}, HoldRate ${formatPct(meta.holdRate)}
- TikTok Ads: Spend ${formatVND(tiktok.spend)} (${formatPct(tiktok.budgetShare)}), Impr ${
      tiktok.impressions
    }, Clicks ${tiktok.clicks}, CTR ${formatPct(tiktok.ctr)}, CPC ${formatVND(
      tiktok.cpc
    )}, Conv ${tiktok.conversions}, CVR ${formatPct(tiktok.cvr)}, CPA ${formatVND(
      tiktok.cpa
    )}, HookRate ${formatPct(tiktok.hookRate)}, HoldRate ${formatPct(tiktok.holdRate)}
- Total Account: Spend ${formatVND(total.spend)}, Impr ${total.impressions}, Clicks ${
      total.clicks
    }, Weighted CTR ${formatPct(total.ctr)}, Weighted CPC ${formatVND(
      total.cpc
    )}, Total Conv ${total.conversions}, Weighted CVR ${formatPct(
      total.cvr
    )}, Weighted CPA ${formatVND(total.cpa)}, Weighted HookRate ${formatPct(
      total.hookRate
    )}, Weighted HoldRate ${formatPct(total.holdRate)}

CHI TIẾT TỪNG DÒNG CHIẾN DỊCH:
${rowsSummary}`;
  }, [analysis]);

  // Filtered & sorted rows for Ledger tab
  const filteredRows = useMemo(() => {
    if (!analysis) return [];
    return analysis.rows
      .filter((r) => {
        if (platformFilter !== 'ALL' && r.platform !== platformFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.campaignName.toLowerCase().includes(q) ||
            r.adGroupName.toLowerCase().includes(q) ||
            r.creativeName.toLowerCase().includes(q) ||
            r.platform.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? -1;
        const valB = b[sortField] ?? -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [analysis, platformFilter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: keyof NormalizedAdRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectPreset = (key: string) => {
    const preset = SAMPLE_DATASETS[key];
    if (!preset) return;
    setSelectedPresetKey(key);
    setRawInputText(preset.rawText);
    setAiAuditMarkdown(null);
    setAiExecutedPython([]);
    setAiAuditError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result ?? '');
      if (content.trim()) {
        setSelectedPresetKey('custom');
        setRawInputText(content);
        setAiAuditMarkdown(null);
        setAiExecutedPython([]);
      }
    };
    reader.readAsText(file);
  };

  const handleRunGeminiDeepAudit = async () => {
    if (!analysis) return;
    setIsRunningAiAudit(true);
    setAiAuditError(null);
    try {
      const response = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          normalizedSummaryJson: {
            summaries: analysis.summaries,
            winners: analysis.winners,
            losers: analysis.losers,
            killList: analysis.killList,
            scaleList: analysis.scaleList,
            creativeFixList: analysis.creativeFixList,
            rows: analysis.rows,
          },
          missingCriticalColumns: analysis.missingCriticalColumns,
          missingOptionalColumns: analysis.missingOptionalColumns,
          pythonScript: analysis.pythonScript,
          preferredModel: 'gemini-4-argon',
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Không thể tạo báo cáo AI.');
      }
      setAiAuditMarkdown(data.markdown);
      setAiAuditModelUsed(data.modelUsed);
      if (Array.isArray(data.executedPythonBlocks)) {
        setAiExecutedPython(data.executedPythonBlocks);
      }
    } catch (err) {
      setAiAuditError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gọi Gemini API.'
      );
    } finally {
      setIsRunningAiAudit(false);
    }
  };

  const activeReportMarkdown =
    aiAuditMarkdown || analysis?.deterministicMarkdownReport || '';

  const handleCopyMarkdown = () => {
    if (!activeReportMarkdown) return;
    navigator.clipboard.writeText(activeReportMarkdown);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeReportMarkdown) return;
    const blob = new Blob([activeReportMarkdown], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paid_Social_Audit_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPython = () => {
    if (!analysis?.pythonScript) return;
    navigator.clipboard.writeText(analysis.pythonScript);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  // Multi-turn Chat Handler
  const handleSendChatMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? chatInput).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const historySnapshot = [...chatMessages];
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historySnapshot.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          newMessage: textToSend,
          model: chatModel,
          datasetContext: datasetContextString,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Lỗi phản hồi từ Gemini.');
      }

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 80);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Không thể kết nối tới trợ lý Gemini.'
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // Image Upload & Sample Canvas Generator for Creative Vision (gemini-4-argon)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImageMime(file.type || 'image/png');
    setUploadedImageName(file.name);
    setImageAnalysisResult(null);
    setImageAnalysisError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result ?? '');
      setUploadedImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const generateSampleAdCreativeImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 720, 900);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#1e293b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 900);

    // Top Attention Banner (3s Hook overlay)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(40, 48, 640, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('DA MỤN ẨN, THÂM ĐỎ SAU 7 NGÀY?', 68, 98);

    // Product Showcase Card area
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 165, 600, 410);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(260, 230, 200, 280);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SERUM B5 + ZINC 15%', 225, 365);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('Phục hồi màng bảo vệ da chuẩn Lab', 195, 410);

    // Performance Metrics Overlay Sticker
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(60, 610, 600, 95);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('FLASH SALE 11.11 - GIẢM 50% + FREESHIP', 88, 668);

    // Bottom CTA (intentionally near TikTok UI bottom zone for audit critique)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(140, 760, 440, 86);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('MUA NGAY TẠI GIỎ HÀNG', 175, 814);

    const dataUrl = canvas.toDataURL('image/png');
    setUploadedImagePreview(dataUrl);
    setUploadedImageMime('image/png');
    setUploadedImageName('Sample_TikTok_Meta_Ad_Creative_SerumB5.png');
    setImageAnalysisResult(null);
    setImageAnalysisError(null);
  };

  const handleAnalyzeImageWithGemini = async () => {
    if (!uploadedImagePreview || isAnalyzingImage) return;
    setIsAnalyzingImage(true);
    setImageAnalysisError(null);
    try {
      const response = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImagePreview,
          mimeType: uploadedImageMime,
          prompt: imagePrompt,
          datasetSummary: datasetContextString,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Lỗi khi phân tích hình ảnh.');
      }
      setImageAnalysisResult(data.analysis);
      setImageAnalysisModel(data.modelUsed);
    } catch (err) {
      setImageAnalysisError(
        err instanceof Error ? err.message : 'Không thể phân tích hình ảnh.'
      );
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* STRICT TOP BAR CONTRACT: 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('audit');
          }}
          className="text-lg font-display font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
        >
          AdPulse Paid Social Auditor
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'audit'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Báo cáo Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'ledger'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Bảng Chuẩn Hóa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'python'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Python Execution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vision')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'vision'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Phân tích Ảnh Creative
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'chat'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Trợ lý Analyst Chat
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Báo Cáo .MD</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        {(
          [
            { id: 'audit', label: 'Báo cáo Audit' },
            { id: 'ledger', label: 'Bảng Chuẩn Hóa' },
            { id: 'python', label: 'Python Execution' },
            { id: 'vision', label: 'Phân tích Ảnh' },
            { id: 'chat', label: 'Analyst Chat' },
          ] as { id: ActiveTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Workspace Toolbar: Dataset Presets, CSV Upload & Schema Status */}
        <section className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Senior Performance Marketing Data Analyst</span>
                <span aria-hidden="true">·</span>
                <span>Meta Ads & TikTok Ads</span>
                <span aria-hidden="true">·</span>
                <span>Weighted Average Engine</span>
              </div>
              <h1 className="text-xl font-display font-semibold text-slate-50">
                Hệ thống Chuẩn hóa Dữ liệu & Kiểm toán Hiệu suất Paid Social
              </h1>
            </div>

            {/* Functional Controls for Data Ingestion */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Tải file CSV / TSV / JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDataIngestionEditor((prev) => !prev)}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {showDataIngestionEditor
                    ? 'Đóng trình dán dữ liệu thô'
                    : 'Dán dữ liệu / Xem Schema Mapping'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRunGeminiDeepAudit}
                disabled={isRunningAiAudit || !analysis}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
              >
                {isRunningAiAudit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {isRunningAiAudit
                    ? 'Đang chạy Python & Gemini Audit...'
                    : 'Chạy AI Deep Audit (Gemini + Python)'}
                </span>
              </button>
            </div>
          </div>

          {/* Preset Dataset Selector Bar (Interactive Segmented Buttons) */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1.5">Bộ dữ liệu mẫu:</span>
              {Object.entries(SAMPLE_DATASETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedPresetKey === key
                      ? 'bg-slate-100 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {analysis && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                <span>{analysis.rows.length} dòng chiến dịch</span>
                <span aria-hidden="true">·</span>
                <span>{analysis.mappings.length} trường ánh xạ</span>
                <span aria-hidden="true">·</span>
                <span>Tổng Spend: {formatVND(analysis.summaries.total.spend)}</span>
              </div>
            )}
          </div>

          {/* Collapsible Raw Data Editor & Schema Mapping Inspector */}
          {showDataIngestionEditor && (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Dữ liệu thô đầu vào (CSV, TSV, JSON hoặc copy trực tiếp từ Meta / TikTok Ads Manager)
                  </label>
                  <span className="text-xs text-slate-500">
                    Tự động làm sạch ký tự tiền tệ (₫, VND, dấu phẩy)
                  </span>
                </div>
                <textarea
                  value={rawInputText}
                  onChange={(e) => {
                    setSelectedPresetKey('custom');
                    setRawInputText(e.target.value);
                    setAiAuditMarkdown(null);
                  }}
                  rows={9}
                  spellCheck={false}
                  className="w-full p-3.5 text-xs font-mono tabular-nums bg-slate-950 text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Dán dữ liệu CSV, TSV hoặc JSON vào đây..."
                />
              </div>

              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Bước 1: Kết quả Tự động Ánh xạ Trường (Schema Mapping)
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Meta / TikTok Auto-Detect
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden max-h-[225px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                        <th className="py-2 px-3 font-medium">Cột gốc (Raw Header)</th>
                        <th className="py-2 px-3 font-medium">Chuẩn hóa (Standard)</th>
                        <th className="py-2 px-3 font-medium">Nhận diện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono">
                      {analysis?.mappings.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-300">{m.rawHeader}</td>
                          <td className="py-2 px-3 text-blue-400">{m.mappedField}</td>
                          <td className="py-2 px-3 text-slate-400">{m.detectedSource}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rule #3: Missing Critical or Optional Column Warnings */}
          {parseError && (
            <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-lg flex items-start gap-3 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-100">Lỗi đọc dữ liệu đầu vào</p>
                <p className="mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {analysis &&
            (analysis.missingCriticalColumns.length > 0 ||
              analysis.missingOptionalColumns.length > 0) && (
              <div className="p-4 bg-amber-950/30 border border-amber-800/70 rounded-lg flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-100">
                    Cảnh báo Kiểm tra Cột Dữ liệu (Rule #3 — Xử lý dữ liệu thiếu)
                  </p>
                  {analysis.missingCriticalColumns.length > 0 && (
                    <p>
                      <strong className="text-red-300">Thiếu cột trọng yếu:</strong>{' '}
                      {analysis.missingCriticalColumns.join(' · ')}. Hệ thống chỉ tính toán
                      trên các trường hiện có.
                    </p>
                  )}
                  {analysis.missingOptionalColumns.length > 0 && (
                    <p>
                      <strong className="text-amber-300">Thiếu cột phụ trợ:</strong>{' '}
                      {analysis.missingOptionalColumns.join(' · ')}.
                    </p>
                  )}
                </div>
              </div>
            )}
        </section>

        {/* Top-Level KPI Strip (Strictly Weighted Averages from Component Sums) */}
        {analysis && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Tổng Chi Tiêu (Total Spend)</div>
              <div className="text-lg font-mono font-semibold text-slate-50 tabular-nums">
                {formatVND(analysis.summaries.total.spend)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Meta {formatPct(analysis.summaries.meta.budgetShare)} · TikTok{' '}
                {formatPct(analysis.summaries.tiktok.budgetShare)}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Tổng Kết Quả (Conversions)</div>
              <div className="text-lg font-mono font-semibold text-emerald-400 tabular-nums">
                {formatNum(analysis.summaries.total.conversions)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Weighted CVR: {formatPct(analysis.summaries.total.cvr)}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Weighted CPA / CPL</div>
              <div className="text-lg font-mono font-semibold text-slate-50 tabular-nums">
                {formatVND(analysis.summaries.total.cpa)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                SUM(Spend) / SUM(Conv)
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Weighted CTR (%)</div>
              <div className="text-lg font-mono font-semibold text-slate-50 tabular-nums">
                {formatPct(analysis.summaries.total.ctr)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                CPC: {formatVND(analysis.summaries.total.cpc)}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Weighted CPM</div>
              <div className="text-lg font-mono font-semibold text-slate-50 tabular-nums">
                {formatVND(analysis.summaries.total.cpm)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                {formatNum(analysis.summaries.total.impressions)} Impr
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Hook Rate 3s / Hold Rate</div>
              <div className="text-lg font-mono font-semibold text-blue-400 tabular-nums">
                {formatPct(analysis.summaries.total.hookRate)}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Hold: {formatPct(analysis.summaries.total.holdRate)} (Chuẩn Hook &gt;25%)
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: BÁO CÁO AUDIT 4 PHẦN CHUẨN & VISUAL DIAGNOSTICS */}
        {activeTab === 'audit' && analysis && (
          <div className="space-y-6">
            {/* Visual Quick-Matrix: Winners vs Bleeding Budget & Actionable Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 3 Winners */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-display font-semibold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Top 3 Chiến dịch / Adset Hiệu quả nhất (Best Performers)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      CPA thấp nhất kèm sản lượng chuyển đổi thực tế cao
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    Chuẩn Scale: +15–20%/ngày
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {analysis.winners.map((w, idx) => (
                    <div key={w.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          0{idx + 1}. {w.campaignName}
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums shrink-0">
                          CPA: {formatVND(w.cpa)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
                        <span>{w.platform}</span>
                        <span aria-hidden="true">·</span>
                        <span>Nhóm: {w.adGroupName}</span>
                        <span aria-hidden="true">·</span>
                        <span>Ad: {w.creativeName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-300 font-mono tabular-nums pt-0.5">
                        <span>Spend: {formatVND(w.spend)}</span>
                        <span>·</span>
                        <span className="text-emerald-300">
                          Kết quả: {formatNum(w.conversions)}
                        </span>
                        <span>·</span>
                        <span>CTR: {formatPct(w.ctr)}</span>
                        <span>·</span>
                        <span>CVR: {formatPct(w.cvr)}</span>
                        {w.hookRate !== null && (
                          <>
                            <span>·</span>
                            <span>Hook: {formatPct(w.hookRate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Bleeding Budget Losers */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-display font-semibold text-slate-100 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span>Top 3 Chiến dịch Đốt tiền (Bleeding Budget / Cắt lỗ)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chi tiêu cao nhưng 0 ra chuyển đổi hoặc CPA vượt ngưỡng 150% TB tài khoản
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    TB CPA: {formatVND(analysis.summaries.total.cpa)}
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {analysis.losers.map((l, idx) => (
                    <div key={l.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          0{idx + 1}. {l.campaignName}
                        </span>
                        <span className="text-xs font-mono font-semibold text-red-400 tabular-nums shrink-0">
                          {l.conversions > 0
                            ? `CPA: ${formatVND(l.cpa)}`
                            : '0 Chuyển đổi (Lỗ 100%)'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
                        <span>{l.platform}</span>
                        <span aria-hidden="true">·</span>
                        <span>Nhóm: {l.adGroupName}</span>
                        <span aria-hidden="true">·</span>
                        <span>Ad: {l.creativeName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-300 font-mono tabular-nums pt-0.5">
                        <span className="text-red-300">Đã đốt: {formatVND(l.spend)}</span>
                        <span>·</span>
                        <span>Kết quả: {formatNum(l.conversions)}</span>
                        <span>·</span>
                        <span>CTR: {formatPct(l.ctr)}</span>
                        <span>·</span>
                        <span>CVR: {formatPct(l.cvr)}</span>
                        {l.frequency > 0 && (
                          <>
                            <span>·</span>
                            <span>Freq: {l.frequency.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Structured Markdown Report Output (Bước 3 - 4 Phần) */}
            <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Báo cáo Phân tích Hiệu suất Chiến dịch</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {aiAuditMarkdown
                        ? `Được tổng hợp chuyên sâu bởi ${aiAuditModelUsed} + Python Verification`
                        : 'Báo cáo Chuẩn hóa Weighted-Average (Sẵn sàng)'}
                    </span>
                  </div>
                  <h2 className="text-base font-display font-semibold text-slate-50">
                    Báo cáo Kiểm toán Paid Social (Chuẩn Markdown 4 Phần)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {aiAuditMarkdown && (
                    <button
                      type="button"
                      onClick={() => setAiAuditMarkdown(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Khôi phục bản Gốc
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đã sao chép Markdown</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sao chép Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiAuditError && (
                <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-200 flex items-center justify-between">
                  <span>{aiAuditError}</span>
                  <button
                    type="button"
                    onClick={() => setAiAuditError(null)}
                    className="text-red-300 underline ml-4"
                  >
                    Đóng
                  </button>
                </div>
              )}

              <div className="audit-markdown overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeReportMarkdown}
                </ReactMarkdown>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: BẢNG DỮ LIỆU ĐÃ CHUẨN HÓA (HIGH-DENSITY NORMALIZED LEDGER) */}
        {activeTab === 'ledger' && analysis && (
          <section className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-50">
                  Bảng Dữ liệu Chiến dịch Đã Chuẩn hóa (Normalized Schema & Weighted Metrics)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhấp vào tiêu đề cột để sắp xếp. Dòng tổng kết dưới cùng được tính từ tổng thành phần (Weighted Average), tuyệt đối không lấy trung bình cộng từng dòng.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Interactive Segmented Platform Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {(['ALL', 'Meta Ads', 'TikTok Ads'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlatformFilter(plat)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        platformFilter === plat
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {plat === 'ALL' ? 'Tất cả kênh' : plat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Lọc tên Campaign / Adset / Creative..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3 text-left font-sans font-medium whitespace-nowrap">
                      Nền tảng
                    </th>
                    <th className="py-2.5 px-3 text-left font-sans font-medium whitespace-nowrap">
                      Chiến dịch / Nhóm / Creative
                    </th>
                    <th
                      onClick={() => handleSort('spend')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        Chi tiêu (VND) <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('impressions')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      Impr
                    </th>
                    <th
                      onClick={() => handleSort('frequency')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      Freq
                    </th>
                    <th
                      onClick={() => handleSort('clicks')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      Clicks
                    </th>
                    <th
                      onClick={() => handleSort('ctr')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        CTR (%) <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('cpc')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      CPC
                    </th>
                    <th
                      onClick={() => handleSort('conversions')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        Kết quả <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('cvr')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      CVR (%)
                    </th>
                    <th
                      onClick={() => handleSort('cpa')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        CPA (VND) <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('hookRate')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      Hook 3s
                    </th>
                    <th
                      onClick={() => handleSort('holdRate')}
                      className="py-2.5 px-3 text-right font-sans font-medium whitespace-nowrap cursor-pointer hover:text-slate-200"
                    >
                      Hold Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRows.map((r) => {
                    const isHighCpa =
                      r.conversions === 0 ||
                      (analysis.summaries.total.cpa > 0 &&
                        r.cpa > analysis.summaries.total.cpa * 1.45);
                    const isWinnerCpa =
                      r.conversions > 0 &&
                      analysis.summaries.total.cpa > 0 &&
                      r.cpa <= analysis.summaries.total.cpa * 0.85;

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-800/40 transition-colors h-10"
                      >
                        <td className="py-2 px-3 font-sans text-slate-300 whitespace-nowrap">
                          {r.platform}
                        </td>
                        <td className="py-2 px-3 font-sans max-w-[290px]">
                          <div className="font-medium text-slate-100 truncate">
                            {r.campaignName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {r.adGroupName} · {r.creativeName}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200 whitespace-nowrap">
                          {formatVND(r.spend)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                          {formatNum(r.impressions)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right whitespace-nowrap ${
                            r.frequency >= 2.3 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {r.frequency > 0 ? r.frequency.toFixed(2) : 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                          {formatNum(r.clicks)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right whitespace-nowrap ${
                            r.ctr >= 1.5 ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {formatPct(r.ctr)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                          {formatVND(r.cpc)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-100 whitespace-nowrap">
                          {formatNum(r.conversions)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right whitespace-nowrap ${
                            r.cvr < 2.0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatPct(r.cvr)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                            isHighCpa
                              ? 'text-red-400'
                              : isWinnerCpa
                              ? 'text-emerald-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {r.conversions > 0 ? formatVND(r.cpa) : '0 KQ (Lỗ)'}
                        </td>
                        <td
                          className={`py-2 px-3 text-right whitespace-nowrap ${
                            r.hookRate !== null && r.hookRate < 25
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {formatPct(r.hookRate)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                          {formatPct(r.holdRate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Weighted Average Total Footer */}
                <tfoot>
                  <tr className="bg-slate-950 border-t-2 border-slate-700 font-semibold text-slate-100">
                    <td className="py-3 px-3 font-sans" colSpan={2}>
                      TỔNG CỘNG (WEIGHTED AVERAGE TOÀN TÀI KHOẢN)
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatVND(analysis.summaries.total.spend)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatNum(analysis.summaries.total.impressions)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {analysis.summaries.total.frequency > 0
                        ? analysis.summaries.total.frequency.toFixed(2)
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatNum(analysis.summaries.total.clicks)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400">
                      {formatPct(analysis.summaries.total.ctr)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatVND(analysis.summaries.total.cpc)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400">
                      {formatNum(analysis.summaries.total.conversions)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400">
                      {formatPct(analysis.summaries.total.cvr)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400">
                      {formatVND(analysis.summaries.total.cpa)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400">
                      {formatPct(analysis.summaries.total.hookRate)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatPct(analysis.summaries.total.holdRate)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: PYTHON CODE EXECUTION & WEIGHTED FORMULA PROOF */}
        {activeTab === 'python' && analysis && (
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-50 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>
                    Bước 2: Công cụ Python Code Execution & Kiểm chứng Trọng số (Weighted Average)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mã nguồn Python (pandas) chuẩn hóa dữ liệu và tính toán chỉ số phái sinh từ tổng cấu phần (SUM).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunGeminiDeepAudit}
                  disabled={isRunningAiAudit}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isRunningAiAudit
                      ? 'Đang chạy trên Gemini Sandbox...'
                      : 'Thực thi trên Gemini Python Sandbox'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPython}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPython ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sao chép Python Script</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mathematical Formula Proof Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono tabular-nums">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400">Công thức CTR Trọng số (Weighted CTR)</div>
                <div className="text-slate-100 font-semibold">
                  (SUM(Clicks) / SUM(Impressions)) * 100
                </div>
                <div className="text-blue-400 pt-1">
                  = ({formatNum(analysis.summaries.total.clicks)} /{' '}
                  {formatNum(analysis.summaries.total.impressions)}) * 100 ={' '}
                  {formatPct(analysis.summaries.total.ctr)}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400">Công thức CVR Trọng số (Weighted CVR)</div>
                <div className="text-slate-100 font-semibold">
                  (SUM(Conversions) / SUM(Clicks)) * 100
                </div>
                <div className="text-emerald-400 pt-1">
                  = ({formatNum(analysis.summaries.total.conversions)} /{' '}
                  {formatNum(analysis.summaries.total.clicks)}) * 100 ={' '}
                  {formatPct(analysis.summaries.total.cvr)}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400">Công thức CPA Trọng số (Weighted CPA)</div>
                <div className="text-slate-100 font-semibold">
                  SUM(Spend) / SUM(Conversions)
                </div>
                <div className="text-amber-400 pt-1">
                  = {formatVND(analysis.summaries.total.spend)} /{' '}
                  {formatNum(analysis.summaries.total.conversions)} ={' '}
                  {formatVND(analysis.summaries.total.cpa)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-300">
                Python Data Normalization & Weighted Aggregation Script (`pandas`)
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
                {analysis.pythonScript}
              </pre>
            </div>

            {aiExecutedPython.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-medium text-emerald-400">
                  Kết quả thực thi trực tiếp từ Gemini Python Sandbox:
                </div>
                {aiExecutedPython.map((block, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 font-mono text-xs"
                  >
                    {block.code && (
                      <pre className="text-blue-300 overflow-x-auto">{block.code}</pre>
                    )}
                    {block.output && (
                      <pre className="text-emerald-300 pt-2 border-t border-slate-800 overflow-x-auto">
                        {block.output}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: PHÂN TÍCH HÌNH ẢNH CREATIVE / SCREENSHOT BẰNG GEMINI-4-ARGON */}
        {activeTab === 'vision' && (
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Multimodal Creative & Screenshot Auditor</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Model: gemini-4-argon</span>
                </div>
                <h2 className="text-base font-display font-semibold text-slate-50">
                  Kiểm toán Hình ảnh Quảng cáo (Ad Creative), Landing Page & Bảng Ads Manager
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={generateSampleAdCreativeImage}
                  className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nạp Ảnh Creative Mẫu</span>
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tải Ảnh Lên Để Phân Tích</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Preview & Prompt Configuration */}
              <div className="lg:col-span-5 space-y-4">
                {uploadedImagePreview ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate font-mono">{uploadedImageName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImagePreview(null);
                          setImageAnalysisResult(null);
                        }}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ảnh</span>
                      </button>
                    </div>
                    <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center max-h-[380px]">
                      <img
                        src={uploadedImagePreview}
                        alt="Ad Creative Preview"
                        referrerPolicy="no-referrer"
                        className="max-h-[360px] w-auto object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-950 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                    <div className="space-y-1 max-w-sm">
                      <p className="text-sm font-medium text-slate-200">
                        Chưa có ảnh Creative hoặc Screenshot nào được chọn
                      </p>
                      <p className="text-xs text-slate-400">
                        Tải lên ảnh Banner Meta Ads, Thumbnail TikTok 3s đầu, ảnh chụp Landing Page hoặc bảng số liệu Ads Manager để phân tích bằng mô hình <code className="text-blue-400">gemini-4-argon</code>.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                      >
                        Chọn ảnh từ máy
                      </button>
                      <button
                        type="button"
                        onClick={generateSampleAdCreativeImage}
                        className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Dùng Creative mẫu
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Yêu cầu phân tích cho Gemini Vision (`gemini-4-argon`)
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={4}
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeImageWithGemini}
                    disabled={!uploadedImagePreview || isAnalyzingImage}
                    className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAnalyzingImage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang phân tích hình ảnh với gemini-4-argon...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Phân Tích Hình Ảnh Ngay (gemini-4-argon)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Image Analysis Output */}
              <div className="lg:col-span-7 p-5 bg-slate-950 border border-slate-800 rounded-xl min-h-[360px] flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <span className="text-xs font-medium text-slate-300">
                    Báo cáo Chẩn đoán Thị giác & Chuyển đổi (Creative Audit Output)
                  </span>
                  {imageAnalysisModel && (
                    <span className="text-xs font-mono text-blue-400">
                      Model: {imageAnalysisModel}
                    </span>
                  )}
                </div>

                {imageAnalysisError && (
                  <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200 mb-4">
                    {imageAnalysisError}
                  </div>
                )}

                {imageAnalysisResult ? (
                  <div className="audit-markdown flex-1 overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {imageAnalysisResult}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-2">
                    <FileText className="w-7 h-7 text-slate-600" />
                    <p className="text-xs max-w-md">
                      Kết quả đánh giá Visual Hook, bố cục Safe Zone (Reels/TikTok), độ rõ ràng của Value Proposition & CTA hoặc dữ liệu trích xuất từ ảnh chụp màn hình sẽ hiển thị chi tiết tại đây.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: MULTI-TURN SENIOR PERFORMANCE MARKETING ANALYST CHATBOT */}
        {activeTab === 'chat' && (
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Multi-Turn Paid Social Strategy Chat</span>
                  <span aria-hidden="true">·</span>
                  <span>Kết nối trực tiếp với dữ liệu đã chuẩn hóa</span>
                </div>
                <h2 className="text-base font-display font-semibold text-slate-50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Trợ lý Senior Performance Marketing Analyst</span>
                </h2>
              </div>

              {/* Model Selector: gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Mô hình:</span>
                </span>
                {CHAT_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChatModel(m.id)}
                    title={m.purpose}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      chatModel === m.id
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Model Role Explanation */}
            <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
              <span>
                <strong className="text-slate-200 font-mono">{chatModel}</strong>:{' '}
                {CHAT_MODELS.find((m) => m.id === chatModel)?.purpose}
              </span>
              <button
                type="button"
                onClick={() =>
                  setChatMessages([
                    {
                      id: 'reset-msg',
                      role: 'model',
                      content:
                        'Đã làm mới luồng hội thoại. Dữ liệu chiến dịch hiện tại vẫn được giữ nguyên trong bộ nhớ phân tích. Bạn cần kiểm tra chiến dịch nào?',
                      modelUsed: chatModel,
                      timestamp: 'Vừa xong',
                    },
                  ])
                }
                className="text-slate-400 hover:text-slate-200 underline ml-4 shrink-0 cursor-pointer"
              >
                Xóa lịch sử chat
              </button>
            </div>

            {/* Quick Analyst Prompt Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                'Mô phỏng dịch chuyển 100% ngân sách từ các nhóm Kill sang Top 3 Winners thì tổng Conversions tăng thêm bao nhiêu?',
                'Viết 3 kịch bản Hook 3 giây đầu mới cho các Creative có Hook Rate dưới 25% trong bảng dữ liệu.',
                'Phân tích sâu các nhóm có CTR > 1.5% nhưng CVR < 2% và đề xuất checklist tối ưu Landing Page.',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChatMessage(q)}
                  disabled={isChatLoading}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-left cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Scrollable Conversation Thread */}
            <div
              ref={chatScrollRef}
              className="h-[440px] overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 px-1">
                    <span>
                      {msg.role === 'user' ? 'Bạn (Media Buyer)' : 'Senior Analyst AI'}
                    </span>
                    {msg.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-blue-400">{msg.modelUsed}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-3xl rounded-xl p-4 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 audit-markdown'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-900/60 border border-slate-800 rounded-lg w-fit font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Đang tính toán số liệu với {chatModel}...</span>
                </div>
              )}

              {chatError && (
                <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
                  {chatError}
                </div>
              )}
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Đặt câu hỏi về CPA, Hook Rate, phân bổ ngân sách Meta vs TikTok, hoặc yêu cầu viết kịch bản Creative..."
                className="flex-1 px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-5 py-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi yêu cầu</span>
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            AdPulse Paid Social Auditor · Chuẩn hóa dữ liệu Meta Ads & TikTok Ads theo công thức Weighted Average
          </span>
          <span className="font-mono tabular-nums">
            CPM · CPC · CTR · CVR · CPA · Hook Rate 3s · Hold Rate
          </span>
        </div>
      </footer>
    </div>
  );
}
