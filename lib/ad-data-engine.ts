export type AdPlatform = 'Meta Ads' | 'TikTok Ads';

export interface NormalizedAdRow {
  id: string;
  platform: AdPlatform;
  campaignName: string;
  adGroupName: string;
  creativeName: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  conversions: number;
  videoViews3s: number;
  thruPlays: number;
  // Derived row-level weighted ratios
  cpm: number;
  cpc: number;
  ctr: number;
  cvr: number;
  cpa: number;
  hookRate: number | null;
  holdRate: number | null;
}

export interface PlatformSummary {
  platform: AdPlatform | 'Total';
  spend: number;
  budgetShare: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  conversions: number;
  videoViews3s: number;
  thruPlays: number;
  // Strictly Weighted Averages from component sums
  cpm: number;
  cpc: number;
  ctr: number;
  cvr: number;
  cpa: number;
  hookRate: number | null;
  holdRate: number | null;
}

export interface SchemaMappingResult {
  rawHeader: string;
  mappedField: string;
  detectedSource: 'Meta Ads' | 'TikTok Ads' | 'Universal';
}

export interface AuditAnalysisResult {
  rows: NormalizedAdRow[];
  mappings: SchemaMappingResult[];
  missingCriticalColumns: string[];
  missingOptionalColumns: string[];
  hasVideoViews3s: boolean;
  hasThruPlays: boolean;
  hasReach: boolean;
  summaries: {
    meta: PlatformSummary;
    tiktok: PlatformSummary;
    total: PlatformSummary;
  };
  winners: NormalizedAdRow[];
  losers: NormalizedAdRow[];
  killList: { row: NormalizedAdRow; reason: string }[];
  scaleList: { row: NormalizedAdRow; reason: string; suggestedIncrease: string }[];
  creativeFixList: { row: NormalizedAdRow; issue: string; action: string }[];
  pythonScript: string;
  deterministicMarkdownReport: string;
}

export const SAMPLE_DATASETS: Record<
  string,
  { label: string; description: string; rawText: string }
> = {
  omni_q4: {
    label: 'Q4 Paid Social (Meta + TikTok Mix)',
    description: '10 chiến dịch thực tế từ Meta Ads Manager & TikTok Ads Manager (VND)',
    rawText: `Platform,Campaign Name,Ad set name,Ad name,Amount spent (VND),Impressions,Reach,Link clicks,Results,3-second video plays,ThruPlays
Meta Ads,[META]_CONV_Retargeting_CartAbandon_Hot,AS_01_WebVisitors_14D,VID_Testimonial_KOL_MinhAnh,18500000,295000,152000,6490,265,98500,46200
Meta Ads,[META]_CONV_Lookalike_1Pct_HighLTV,AS_02_LAL_Purchasers_VN,VID_BeforeAfter_SerumB5,34200000,680000,395000,12920,412,224400,98700
Meta Ads,[META]_CONV_Broad_Women_22_34,AS_03_Broad_Skincare,IMG_Static_FlashSale_50Off,29800000,510000,168000,4335,48,45000,11200
Meta Ads,[META]_LEAD_Clinic_Consultation_HCM,AS_04_Interest_Spa_Beauty,VID_Doctor_Explain_Acne,22400000,420000,245000,8820,89,142800,61400
Meta Ads,[META]_CONV_Broad_GenZ_Unisex,AS_05_Broad_18_24,VID_Meme_Office_Skincare,14600000,310000,112000,2480,0,52700,9800
TikTok Ads,[TT]_CONV_SparkAds_KOC_Review,AG_01_KOC_BeautyHaul,TT_Spark_VyVy_Unbox_3sHook,26500000,1120000,790000,19040,385,392000,168500
TikTok Ads,[TT]_CONV_ShopPurchases_FlashDeal,AG_02_InFeed_Promo_11_11,TT_Video_FounderStory_Lab,21000000,890000,610000,15130,310,284800,119600
TikTok Ads,[TT]_CONV_Broad_TrendingAudio,AG_03_DanceChallenge_Remix,TT_Trend_Sound_NoCTA,19200000,950000,680000,16150,72,313500,62700
TikTok Ads,[TT]_LEAD_AcneCombo_Trial,AG_04_Interest_Skincare_VN,TT_UGC_Student_Routine,15800000,640000,470000,5120,128,115200,43700
TikTok Ads,[TT]_CONV_ColdTraffic_ProductDemo,AG_05_AutoTargeting_VN,TT_Slideshow_ProductSpec,12900000,480000,350000,2880,14,72000,15800`,
  },
  meta_raw: {
    label: 'Meta Ads Export (Chuẩn cột Meta)',
    description: 'Báo cáo xuất trực tiếp từ Meta Ads Manager với Amount spent (VND), ThruPlays',
    rawText: `Campaign name,Ad set name,Ad name,Amount spent (VND),Impressions,Reach,Link clicks,Purchases,3-second video plays,ThruPlays
[FB]_PROSPECTING_T11_WinterCollection,LAL_VIP_1%,Creative_01_Reel_Lookbook,42000000,780000,450000,15600,490,265200,119300
[FB]_PROSPECTING_T11_WinterCollection,Interest_Streetwear_VN,Creative_02_Carousel_Hoodie,31500000,490000,158000,4410,62,68600,19200
[FB]_RETARGETING_Warm_30Days,Engagers_IG_FB_30D,Creative_03_UGC_FitCheck,16800000,260000,135000,6240,245,88400,44200
[FB]_TESTING_Catalog_Broad,Broad_Men_18_30,Creative_04_Dynamic_DPA,19500000,340000,115000,2720,18,40800,8900`,
  },
  tiktok_raw: {
    label: 'TikTok Ads Export (Chuẩn cột TikTok)',
    description: 'Báo cáo xuất từ TikTok Ads Manager với Cost, Clicks (Destination), 2s/6s Views',
    rawText: `Campaign name,Ad group name,Ad name,Cost,Impressions,Reach,Clicks (Destination),Real-time Conversions,2-second video views,6-second video views
[TT]_SCALE_SmartPerformance_VN,SPC_Auto_Group_01,KOC_LinhKa_HookA_ProblemSolve,38000000,1650000,1180000,29700,610,594000,267300
[TT]_SCALE_SmartPerformance_VN,SPC_Auto_Group_02,KOC_Minh_HookB_PriceDrop,24500000,980000,720000,18620,115,313600,78400
[TT]_TEST_SearchAds_Toggle,AG_Keyword_KemChongNang,Studio_MacroTexture_Shot,17200000,710000,540000,4970,135,113600,48800
[TT]_AWARENESS_Turn_Conversion,AG_Broad_18_24_All,Trend_CapCut_Template_09,14800000,820000,610000,4100,0,139400,22300`,
  },
  missing_cols_demo: {
    label: 'Test Thiếu Cột (Rule #3 Check)',
    description: 'Dữ liệu thiếu cột Video Views & Reach để kiểm tra cơ chế cảnh báo thiếu cột',
    rawText: `Campaign name,Ad set name,Amount spent (VND),Impressions,Link clicks,Results
[META]_Search_Retargeting_Q4,AS_Warm_Cart,12500000,240000,5280,190
[META]_Cold_Broad_Test,AS_Broad_All,18900000,390000,3120,22
[TT]_InFeed_Conversion_Push,AG_TikTok_Core,21400000,880000,14960,315
[TT]_Spark_Creator_Boost,AG_Creator_Mix,16200000,620000,9920,41`,
  },
};

function parseCleanNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') {
    return 0;
  }
  // Remove currency symbols, spaces, percentage signs
  let cleaned = str.replace(/[₫$€£¥%\sA-Za-z]/g, '');
  // Handle Vietnamese dot thousands separator vs decimal (e.g., 18.500.000 vs 1.54)
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (dotCount > 1 && commaCount === 0) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (commaCount > 1 && dotCount === 0) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (dotCount === 1 && commaCount === 1) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // European/VN style: 18.500,50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US style: 18,500.50
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (commaCount === 1 && dotCount === 0) {
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length === 3) {
      cleaned = cleaned.replace(',', '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  } else if (dotCount === 1 && commaCount === 0) {
    const parts = cleaned.split('.');
    if (parts[1] && parts[1].length === 3 && Number(parts[0]) >= 10) {
      // Likely thousand separator if 3 digits after dot and large integer
      cleaned = cleaned.replace('.', '');
    }
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseRawInputToRecords(rawInput: string): Record<string, unknown>[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];

  // 1. Check if JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
    } catch {
      // Fall through to CSV/TSV parser
    }
  }

  // 2. Parse CSV / TSV / Pipe table
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('|--') && !l.startsWith('---'));

  if (lines.length < 2) return [];

  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.split(';').length > firstLine.split(',').length) {
    delimiter = ';';
  } else if (firstLine.includes('|') && firstLine.split('|').length > 3) {
    delimiter = '|';
  }

  const headers = splitDelimitedLine(firstLine, delimiter).map((h) =>
    h.replace(/^["']|["']$/g, '').trim()
  );

  const records: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitDelimitedLine(lines[i], delimiter);
    if (values.length === 1 && !values[0]) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) {
        obj[h] = values[idx] ?? '';
      }
    });
    records.push(obj);
  }
  return records;
}

const COLUMN_ALIASES: Record<
  string,
  { aliases: string[]; sourceHint: 'Meta Ads' | 'TikTok Ads' | 'Universal' }[]
> = {
  platform: [
    {
      aliases: ['platform', 'nền tảng', 'kênh', 'channel', 'network', 'source'],
      sourceHint: 'Universal',
    },
  ],
  campaignName: [
    {
      aliases: [
        'campaign name',
        'campaign',
        'tên chiến dịch',
        'chiến dịch',
        'campaign_name',
      ],
      sourceHint: 'Universal',
    },
  ],
  adGroupName: [
    {
      aliases: ['ad set name', 'adset name', 'ad set', 'tên nhóm quảng cáo'],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: ['ad group name', 'adgroup name', 'ad group', 'nhóm quảng cáo'],
      sourceHint: 'TikTok Ads',
    },
  ],
  creativeName: [
    {
      aliases: ['ad name', 'creative name', 'creative', 'tên quảng cáo', 'quảng cáo', 'ad_name'],
      sourceHint: 'Universal',
    },
  ],
  spend: [
    {
      aliases: [
        'amount spent (vnd)',
        'amount spent',
        'số tiền đã chi tiêu (vnd)',
        'số tiền đã chi tiêu',
      ],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: ['cost', 'total cost', 'cost (vnd)', 'chi phí', 'chi tiêu', 'spend'],
      sourceHint: 'TikTok Ads',
    },
  ],
  impressions: [
    {
      aliases: ['impressions', 'lượt hiển thị', 'hiển thị', 'impr'],
      sourceHint: 'Universal',
    },
  ],
  reach: [
    {
      aliases: ['reach', 'người tiếp cận', 'tiếp cận', 'unique users'],
      sourceHint: 'Universal',
    },
  ],
  clicks: [
    {
      aliases: [
        'link clicks',
        'clicks (all)',
        'lượt nhấp vào liên kết',
        'số lần nhấp (tất cả)',
        'outbound clicks',
      ],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: [
        'clicks (destination)',
        'clicks',
        'lượt nhấp (đích)',
        'nhấp chuột',
        'số lần nhấp',
      ],
      sourceHint: 'TikTok Ads',
    },
  ],
  conversions: [
    {
      aliases: [
        'results',
        'leads',
        'purchases',
        'app installs',
        'kết quả',
        'lượt mua hàng',
        'khách hàng tiềm năng',
        'website purchases',
      ],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: [
        'conversions',
        'real-time conversions',
        'chuyển đổi',
        'chuyển đổi thời gian thực',
        'complete payment',
      ],
      sourceHint: 'TikTok Ads',
    },
  ],
  videoViews3s: [
    {
      aliases: [
        '3-second video plays',
        '3-second video views',
        'lượt phát video tối thiểu 3 giây',
        'video plays at 3s',
        '3s video views',
      ],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: [
        '2-second video views',
        '2s video views',
        'lượt xem video 2 giây',
        'video views (2s)',
      ],
      sourceHint: 'TikTok Ads',
    },
  ],
  thruPlays: [
    {
      aliases: ['thruplays', 'thruplay', 'lượt xem thruplay', '15-second video views'],
      sourceHint: 'Meta Ads',
    },
    {
      aliases: [
        '6-second video views',
        '6s video views',
        'lượt xem video 6 giây',
        'focused views',
      ],
      sourceHint: 'TikTok Ads',
    },
  ],
};

function detectPlatformForRow(
  rawPlatformValue: string,
  campaignName: string,
  adGroupName: string,
  creativeName: string,
  headerHints: Set<'Meta Ads' | 'TikTok Ads'>
): AdPlatform {
  const combined = `${rawPlatformValue} ${campaignName} ${adGroupName} ${creativeName}`.toLowerCase();
  if (
    combined.includes('tiktok') ||
    combined.includes('[tt]') ||
    combined.includes('tt_') ||
    combined.includes('spark') ||
    combined.includes('koc') ||
    combined.includes('ag_')
  ) {
    return 'TikTok Ads';
  }
  if (
    combined.includes('meta') ||
    combined.includes('facebook') ||
    combined.includes('[fb]') ||
    combined.includes('[meta]') ||
    combined.includes('ig_') ||
    combined.includes('as_') ||
    combined.includes('lal_')
  ) {
    return 'Meta Ads';
  }
  if (headerHints.has('TikTok Ads') && !headerHints.has('Meta Ads')) {
    return 'TikTok Ads';
  }
  return 'Meta Ads';
}

function computeWeightedSummary(
  platform: AdPlatform | 'Total',
  rows: NormalizedAdRow[],
  totalAccountSpend: number,
  hasVideoViews3s: boolean,
  hasThruPlays: boolean,
  hasReach: boolean
): PlatformSummary {
  const spend = rows.reduce((acc, r) => acc + r.spend, 0);
  const impressions = rows.reduce((acc, r) => acc + r.impressions, 0);
  const reach = rows.reduce((acc, r) => acc + r.reach, 0);
  const clicks = rows.reduce((acc, r) => acc + r.clicks, 0);
  const conversions = rows.reduce((acc, r) => acc + r.conversions, 0);
  const videoViews3s = rows.reduce((acc, r) => acc + r.videoViews3s, 0);
  const thruPlays = rows.reduce((acc, r) => acc + r.thruPlays, 0);

  const budgetShare = totalAccountSpend > 0 ? (spend / totalAccountSpend) * 100 : 0;
  const frequency = hasReach && reach > 0 ? impressions / reach : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const hookRate =
    hasVideoViews3s && impressions > 0 ? (videoViews3s / impressions) * 100 : null;
  const holdRate =
    hasThruPlays && hasVideoViews3s && videoViews3s > 0
      ? (thruPlays / videoViews3s) * 100
      : null;

  return {
    platform,
    spend,
    budgetShare,
    impressions,
    reach,
    frequency,
    clicks,
    conversions,
    videoViews3s,
    thruPlays,
    cpm,
    cpc,
    ctr,
    cvr,
    cpa,
    hookRate,
    holdRate,
  };
}

function formatDeterministicInt(val: number): string {
  const rounded = Math.round(val);
  const sign = rounded < 0 ? '-' : '';
  const absStr = Math.abs(rounded).toString();
  return sign + absStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatVND(val: number): string {
  if (!Number.isFinite(val) || val === 0) return '0 ₫';
  return `${formatDeterministicInt(val)} ₫`;
}

export function formatNum(val: number): string {
  if (!Number.isFinite(val)) return '0';
  return formatDeterministicInt(val);
}

export function formatPct(val: number | null): string {
  if (val === null || !Number.isFinite(val)) return 'N/A';
  return `${val.toFixed(2)}%`;
}

export function analyzeAdDataset(rawInput: string): AuditAnalysisResult {
  const rawRecords = parseRawInputToRecords(rawInput);
  if (rawRecords.length === 0) {
    throw new Error(
      'Không tìm thấy dòng dữ liệu hợp lệ. Vui lòng kiểm tra định dạng CSV, TSV hoặc JSON.'
    );
  }

  const rawHeaders = Object.keys(rawRecords[0]);
  const fieldToHeader: Record<string, string> = {};
  const mappings: SchemaMappingResult[] = [];
  const headerPlatformHints = new Set<'Meta Ads' | 'TikTok Ads'>();

  for (const rawHeader of rawHeaders) {
    const normalizedH = rawHeader.toLowerCase().trim();
    for (const [standardField, aliasGroups] of Object.entries(COLUMN_ALIASES)) {
      if (fieldToHeader[standardField]) continue;
      for (const group of aliasGroups) {
        if (group.aliases.some((a) => normalizedH === a || normalizedH.includes(a))) {
          fieldToHeader[standardField] = rawHeader;
          mappings.push({
            rawHeader,
            mappedField: standardField,
            detectedSource: group.sourceHint,
          });
          if (group.sourceHint !== 'Universal') {
            headerPlatformHints.add(group.sourceHint);
          }
          break;
        }
      }
    }
  }

  // Rule #3: Missing Critical & Optional Columns Detection
  const missingCriticalColumns: string[] = [];
  if (!fieldToHeader.spend) missingCriticalColumns.push('Spend (Amount spent / Cost)');
  if (!fieldToHeader.impressions) missingCriticalColumns.push('Impressions (Lượt hiển thị)');
  if (!fieldToHeader.clicks) missingCriticalColumns.push('Clicks (Link clicks / Clicks Destination)');
  if (!fieldToHeader.conversions)
    missingCriticalColumns.push('Conversions / Results (Kết quả / Chuyển đổi)');

  const missingOptionalColumns: string[] = [];
  const hasReach = Boolean(fieldToHeader.reach);
  const hasVideoViews3s = Boolean(fieldToHeader.videoViews3s);
  const hasThruPlays = Boolean(fieldToHeader.thruPlays);

  if (!hasReach) missingOptionalColumns.push('Reach (Không thể tính Frequency chuẩn)');
  if (!hasVideoViews3s)
    missingOptionalColumns.push('3s/2s Video Views (Không thể tính Hook Rate %)');
  if (!hasThruPlays)
    missingOptionalColumns.push('ThruPlays / 6s Video Views (Không thể tính Hold Rate %)');

  const rows: NormalizedAdRow[] = rawRecords.map((rec, idx) => {
    const rawPlatform = fieldToHeader.platform ? String(rec[fieldToHeader.platform] ?? '') : '';
    const campaignName = fieldToHeader.campaignName
      ? String(rec[fieldToHeader.campaignName] ?? `Campaign_${idx + 1}`)
      : `Campaign_${idx + 1}`;
    const adGroupName = fieldToHeader.adGroupName
      ? String(rec[fieldToHeader.adGroupName] ?? `AdGroup_${idx + 1}`)
      : `AdGroup_${idx + 1}`;
    const creativeName = fieldToHeader.creativeName
      ? String(rec[fieldToHeader.creativeName] ?? `Creative_${idx + 1}`)
      : `Creative_${idx + 1}`;

    const platform = detectPlatformForRow(
      rawPlatform,
      campaignName,
      adGroupName,
      creativeName,
      headerPlatformHints
    );

    const spend = fieldToHeader.spend ? parseCleanNumber(rec[fieldToHeader.spend]) : 0;
    const impressions = fieldToHeader.impressions
      ? parseCleanNumber(rec[fieldToHeader.impressions])
      : 0;
    const reach = fieldToHeader.reach ? parseCleanNumber(rec[fieldToHeader.reach]) : 0;
    const clicks = fieldToHeader.clicks ? parseCleanNumber(rec[fieldToHeader.clicks]) : 0;
    const conversions = fieldToHeader.conversions
      ? parseCleanNumber(rec[fieldToHeader.conversions])
      : 0;
    const videoViews3s = fieldToHeader.videoViews3s
      ? parseCleanNumber(rec[fieldToHeader.videoViews3s])
      : 0;
    const thruPlays = fieldToHeader.thruPlays
      ? parseCleanNumber(rec[fieldToHeader.thruPlays])
      : 0;

    const frequency = hasReach && reach > 0 ? impressions / reach : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const hookRate =
      hasVideoViews3s && impressions > 0 ? (videoViews3s / impressions) * 100 : null;
    const holdRate =
      hasThruPlays && hasVideoViews3s && videoViews3s > 0
        ? (thruPlays / videoViews3s) * 100
        : null;

    return {
      id: `row-${idx + 1}`,
      platform,
      campaignName,
      adGroupName,
      creativeName,
      spend,
      impressions,
      reach,
      frequency,
      clicks,
      conversions,
      videoViews3s,
      thruPlays,
      cpm,
      cpc,
      ctr,
      cvr,
      cpa,
      hookRate,
      holdRate,
    };
  });

  const totalAccountSpend = rows.reduce((sum, r) => sum + r.spend, 0);
  const metaRows = rows.filter((r) => r.platform === 'Meta Ads');
  const tiktokRows = rows.filter((r) => r.platform === 'TikTok Ads');

  const metaSummary = computeWeightedSummary(
    'Meta Ads',
    metaRows,
    totalAccountSpend,
    hasVideoViews3s,
    hasThruPlays,
    hasReach
  );
  const tiktokSummary = computeWeightedSummary(
    'TikTok Ads',
    tiktokRows,
    totalAccountSpend,
    hasVideoViews3s,
    hasThruPlays,
    hasReach
  );
  const totalSummary = computeWeightedSummary(
    'Total',
    rows,
    totalAccountSpend,
    hasVideoViews3s,
    hasThruPlays,
    hasReach
  );

  const avgAccountCPA = totalSummary.cpa;

  // Winners: Conversions >= 20 (or top half of conversion volume) sorted by lowest CPA
  const convertingRows = rows.filter((r) => r.conversions > 0);
  const medianConversions =
    convertingRows.length > 0
      ? convertingRows.reduce((s, r) => s + r.conversions, 0) / convertingRows.length
      : 1;

  const winners = [...convertingRows]
    .filter((r) => r.conversions >= Math.max(5, medianConversions * 0.35))
    .sort((a, b) => a.cpa - b.cpa)
    .slice(0, 3);

  // Losers: Zero conversions with high spend OR CPA > 150% of account average
  const losers = [...rows]
    .filter((r) => r.conversions === 0 || (avgAccountCPA > 0 && r.cpa > avgAccountCPA * 1.4))
    .sort((a, b) => {
      if (a.conversions === 0 && b.conversions > 0) return -1;
      if (b.conversions === 0 && a.conversions > 0) return 1;
      if (a.conversions === 0 && b.conversions === 0) return b.spend - a.spend;
      return b.cpa - a.cpa;
    })
    .slice(0, 3);

  // Action Matrix: Kill / Scale / Creative Fix
  const killList: { row: NormalizedAdRow; reason: string }[] = [];
  const scaleList: {
    row: NormalizedAdRow;
    reason: string;
    suggestedIncrease: string;
  }[] = [];
  const creativeFixList: {
    row: NormalizedAdRow;
    issue: string;
    action: string;
  }[] = [];

  for (const r of rows) {
    if (r.conversions === 0 && r.spend > 0) {
      killList.push({
        row: r,
        reason: `Đốt ${formatVND(r.spend)} (${formatNum(r.clicks)} clicks, CTR ${formatPct(
          r.ctr
        )}) nhưng 0 chuyển đổi.`,
      });
    } else if (avgAccountCPA > 0 && r.cpa > avgAccountCPA * 1.5) {
      const pctOver = Math.round((r.cpa / avgAccountCPA) * 100);
      killList.push({
        row: r,
        reason: `CPA thực tế ${formatVND(r.cpa)} vượt ${pctOver}% mức trung bình tài khoản (${formatVND(
          avgAccountCPA
        )}), CVR chỉ đạt ${formatPct(r.cvr)}.`,
      });
    }

    if (
      r.conversions > 0 &&
      avgAccountCPA > 0 &&
      r.cpa <= avgAccountCPA * 0.85 &&
      (r.platform === 'TikTok Ads' || !hasReach || r.frequency < 2.2)
    ) {
      const freqNote =
        r.platform === 'Meta Ads' && hasReach
          ? `, Frequency ${r.frequency.toFixed(2)} (< 2.2 chưa bão hòa)`
          : '';
      scaleList.push({
        row: r,
        reason: `CPA tối ưu ở mức ${formatVND(r.cpa)} (thấp hơn TB tài khoản ${Math.round(
          (1 - r.cpa / avgAccountCPA) * 100
        )}%), mang về ${formatNum(r.conversions)} chuyển đổi (CVR ${formatPct(r.cvr)}${freqNote}).`,
        suggestedIncrease: 'Tăng +15% đến +20% ngân sách/ngày để giữ nguyên Learning Phase',
      });
    }

    // Creative / Targeting diagnostics
    if (r.hookRate !== null && r.hookRate < 25) {
      creativeFixList.push({
        row: r,
        issue: `Hook Rate yếu (${formatPct(r.hookRate)} < chuẩn 25%)${
          r.frequency >= 2.5 ? ` kèm Frequency cao (${r.frequency.toFixed(2)} - Ad Fatigue)` : ''
        }`,
        action:
          'Thay mới 3 giây đầu (Pattern Interrupt, chèn text-hook trực diện nỗi đau hoặc ưu đãi ngay frame đầu tiên).',
      });
    } else if (r.ctr >= 1.5 && r.cvr < 2.0 && r.conversions > 0) {
      creativeFixList.push({
        row: r,
        issue: `Điểm nghẽn Lower Funnel: CTR tốt (${formatPct(
          r.ctr
        )} > 1.5%) nhưng CVR tụt sâu (${formatPct(r.cvr)} < 2.0%)`,
        action:
          'Kiểm tra lại độ khớp giữa thông điệp Video và Landing Page/TikTok Shop; lọc lại tệp đối tượng tránh click ảo hoặc tò mò nhưng không có nhu cầu mua.',
      });
    } else if (r.platform === 'Meta Ads' && hasReach && r.frequency >= 2.3) {
      creativeFixList.push({
        row: r,
        issue: `Dấu hiệu bão hòa hiển thị (Frequency = ${r.frequency.toFixed(2)} > 2.2)`,
        action:
          'Mở rộng tệp đối tượng (Broad / Lookalike 2%-5%) và bổ sung 2-3 biến thể định dạng Creative mới.',
      });
    }
  }

  const pythonScript = generatePythonVerificationScript(rows);
  const deterministicMarkdownReport = buildDeterministicMarkdownReport({
    missingCriticalColumns,
    missingOptionalColumns,
    metaSummary,
    tiktokSummary,
    totalSummary,
    winners,
    losers,
    killList,
    scaleList,
    creativeFixList,
    rows,
  });

  return {
    rows,
    mappings,
    missingCriticalColumns,
    missingOptionalColumns,
    hasVideoViews3s,
    hasThruPlays,
    hasReach,
    summaries: {
      meta: metaSummary,
      tiktok: tiktokSummary,
      total: totalSummary,
    },
    winners,
    losers,
    killList,
    scaleList,
    creativeFixList,
    pythonScript,
    deterministicMarkdownReport,
  };
}

function generatePythonVerificationScript(rows: NormalizedAdRow[]): string {
  const compactData = rows.map((r) => ({
    platform: r.platform,
    campaign: r.campaignName,
    adgroup: r.adGroupName,
    creative: r.creativeName,
    spend: r.spend,
    impressions: r.impressions,
    reach: r.reach,
    clicks: r.clicks,
    conversions: r.conversions,
    video_3s: r.videoViews3s,
    thruplays: r.thruPlays,
  }));

  return `import pandas as pd
import numpy as np

# 1. Load Normalized Schema Data (Meta Ads & TikTok Ads)
data = ${JSON.stringify(compactData, null, 2)}
df = pd.DataFrame(data)

# 2. Strict Weighted Average Aggregation Function (NEVER simple mean of ratios)
def calc_weighted_metrics(group, total_spend):
    spend = group['spend'].sum()
    impr = group['impressions'].sum()
    reach = group['reach'].sum()
    clicks = group['clicks'].sum()
    conv = group['conversions'].sum()
    v3s = group['video_3s'].sum()
    thru = group['thruplays'].sum()
    
    return pd.Series({
        'Spend (VND)': spend,
        'Budget Share (%)': (spend / total_spend * 100) if total_spend > 0 else 0,
        'Impressions': impr,
        'Clicks': clicks,
        'CTR (%)': (clicks / impr * 100) if impr > 0 else 0,
        'CPC (VND)': (spend / clicks) if clicks > 0 else 0,
        'Conversions': conv,
        'CVR (%)': (conv / clicks * 100) if clicks > 0 else 0,
        'CPA (VND)': (spend / conv) if conv > 0 else np.nan,
        'CPM (VND)': (spend / impr * 1000) if impr > 0 else 0,
        'Hook Rate (%)': (v3s / impr * 100) if impr > 0 else 0,
        'Hold Rate (%)': (thru / v3s * 100) if v3s > 0 else 0
    })

total_account_spend = df['spend'].sum()
platform_summary = df.groupby('platform').apply(
    lambda g: calc_weighted_metrics(g, total_account_spend)
)
total_row = calc_weighted_metrics(df, total_account_spend).to_frame('Total').T
executive_table = pd.concat([platform_summary, total_row])
print(executive_table.round(2))`;
}

function buildDeterministicMarkdownReport(params: {
  missingCriticalColumns: string[];
  missingOptionalColumns: string[];
  metaSummary: PlatformSummary;
  tiktokSummary: PlatformSummary;
  totalSummary: PlatformSummary;
  winners: NormalizedAdRow[];
  losers: NormalizedAdRow[];
  killList: { row: NormalizedAdRow; reason: string }[];
  scaleList: { row: NormalizedAdRow; reason: string; suggestedIncrease: string }[];
  creativeFixList: { row: NormalizedAdRow; issue: string; action: string }[];
  rows: NormalizedAdRow[];
}): string {
  const {
    missingCriticalColumns,
    missingOptionalColumns,
    metaSummary,
    tiktokSummary,
    totalSummary,
    winners,
    losers,
    killList,
    scaleList,
    creativeFixList,
    rows,
  } = params;

  const alerts: string[] = [];
  if (missingCriticalColumns.length > 0) {
    alerts.push(
      `> **CẢNH BÁO THIẾU CỘT QUAN TRỌNG (RULE #3):** Dữ liệu tải lên đang thiếu các cột: **${missingCriticalColumns.join(
        ', '
      )}**. Hệ thống chỉ thực hiện phép tính trên các trường hiện có.`
    );
  }
  if (missingOptionalColumns.length > 0) {
    alerts.push(
      `> **LƯU Ý TRƯỜNG BỔ SUNG:** Dữ liệu không có cột **${missingOptionalColumns.join(
        ', '
      )}**.`
    );
  }

  const hasBothPlatforms = metaSummary.spend > 0 && tiktokSummary.spend > 0;
  const volumeLeader =
    metaSummary.conversions >= tiktokSummary.conversions ? metaSummary : tiktokSummary;
  const cheaperChannel =
    metaSummary.cpa > 0 && tiktokSummary.cpa > 0
      ? metaSummary.cpa <= tiktokSummary.cpa
        ? metaSummary
        : tiktokSummary
      : metaSummary.cpa > 0
      ? metaSummary
      : tiktokSummary;

  const upperFunnelRowsWithHook = rows.filter((r) => r.hookRate !== null);
  const strongHookRows = upperFunnelRowsWithHook.filter((r) => (r.hookRate ?? 0) >= 25);
  const weakHookRows = upperFunnelRowsWithHook.filter((r) => (r.hookRate ?? 0) < 25);
  const leakyBucketRows = rows.filter((r) => r.ctr >= 1.5 && r.cvr < 2.0);

  return `${alerts.length > 0 ? alerts.join('\n\n') + '\n\n' : ''}## 1. TỔNG QUAN HIỆU SUẤT ĐA KÊNH (EXECUTIVE SUMMARY)

| Nền tảng | Chi tiêu (VND) | % Ngân sách | Impressions | Clicks | CTR (%) | CPC (VND) | Kết quả (Conversions) | CVR (%) | CPA/CPL (VND) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Facebook Ads (Meta)** | ${formatVND(metaSummary.spend)} | ${formatPct(
    metaSummary.budgetShare
  )} | ${formatNum(metaSummary.impressions)} | ${formatNum(metaSummary.clicks)} | ${formatPct(
    metaSummary.ctr
  )} | ${formatVND(metaSummary.cpc)} | ${formatNum(metaSummary.conversions)} | ${formatPct(
    metaSummary.cvr
  )} | ${metaSummary.conversions > 0 ? formatVND(metaSummary.cpa) : 'Không ra KQ'} |
| **TikTok Ads** | ${formatVND(tiktokSummary.spend)} | ${formatPct(
    tiktokSummary.budgetShare
  )} | ${formatNum(tiktokSummary.impressions)} | ${formatNum(
    tiktokSummary.clicks
  )} | ${formatPct(tiktokSummary.ctr)} | ${formatVND(tiktokSummary.cpc)} | ${formatNum(
    tiktokSummary.conversions
  )} | ${formatPct(tiktokSummary.cvr)} | ${
    tiktokSummary.conversions > 0 ? formatVND(tiktokSummary.cpa) : 'Không ra KQ'
  } |
| **Tổng cộng (Total)** | **${formatVND(totalSummary.spend)}** | **100.00%** | **${formatNum(
    totalSummary.impressions
  )}** | **${formatNum(totalSummary.clicks)}** | **${formatPct(
    totalSummary.ctr
  )}** | **${formatVND(totalSummary.cpc)}** | **${formatNum(
    totalSummary.conversions
  )}** | **${formatPct(totalSummary.cvr)}** | **${
    totalSummary.conversions > 0 ? formatVND(totalSummary.cpa) : 'N/A'
  }** |

* **Kênh gánh Volume chuyển đổi chính:** **${volumeLeader.platform}** đang đóng góp **${formatNum(
    volumeLeader.conversions
  )}/${formatNum(totalSummary.conversions)} kết quả** (${formatPct(
    totalSummary.conversions > 0
      ? (volumeLeader.conversions / totalSummary.conversions) * 100
      : 0
  )} tổng sản lượng toàn tài khoản) với tỷ trọng ngân sách **${formatPct(
    volumeLeader.budgetShare
  )}**.
* **Hiệu quả Chi phí trên mỗi kết quả (CPA Efficiency):** ${
    hasBothPlatforms
      ? `**${cheaperChannel.platform}** có CPA trung bình trọng số rẻ hơn ở mức **${formatVND(
          cheaperChannel.cpa
        )}** (so với Meta Ads **${formatVND(metaSummary.cpa)}** và TikTok Ads **${formatVND(
          tiktokSummary.cpa
        )}**).`
      : `CPA trung bình trọng số toàn tài khoản hiện đạt **${formatVND(totalSummary.cpa)}** trên nền tảng **${cheaperChannel.platform}**.`
  }
* **Chênh lệch Giá thầu & Traffic:** Meta Ads có CPM **${formatVND(
    metaSummary.cpm
  )}** (CPC **${formatVND(metaSummary.cpc)}**), trong khi TikTok Ads có CPM **${formatVND(
    tiktokSummary.cpm
  )}** (CPC **${formatVND(
    tiktokSummary.cpc
  )}**). Tổng tỷ lệ chuyển đổi toàn phễu (Weighted CVR) đạt **${formatPct(totalSummary.cvr)}**.

## 2. PHÂN TÍCH PHỄU CHUYỂN ĐỔI & CHẤT LƯỢNG CREATIVE

* **Giai đoạn Thu hút (Upper Funnel - CPM, CTR, Hook Rate):**
  * Toàn tài khoản đạt Weighted CTR **${formatPct(totalSummary.ctr)}** và CPM trung bình **${formatVND(
    totalSummary.cpm
  )}**${
    totalSummary.hookRate !== null
      ? `, Hook Rate 3s tổng thể đạt **${formatPct(
          totalSummary.hookRate
        )}** và Hold Rate đạt **${formatPct(totalSummary.holdRate)}**.`
      : '.'
  }
  * ${
    upperFunnelRowsWithHook.length > 0
      ? `Có **${strongHookRows.length}/${upperFunnelRowsWithHook.length} nhóm quảng cáo** vượt chuẩn ngành Hook Rate (> 25%), dẫn đầu bởi \`${
          strongHookRows[0]?.creativeName ?? 'N/A'
        }\` (${formatPct(
          strongHookRows[0]?.hookRate ?? null
        )}). Ngược lại, các creative bị trượt người xem ngay 3 giây đầu gồm: ${
          weakHookRows
            .map((r) => `\`${r.creativeName}\` (Hook Rate ${formatPct(r.hookRate)}, CTR ${formatPct(r.ctr)})`)
            .join(', ') || 'Không có'
        }.`
      : 'Dữ liệu hiện không bao gồm cột Video Views 3s/2s nên đánh giá Upper Funnel dựa trực tiếp trên CPM và CTR.'
  }
* **Giai đoạn Tương tác & Chuyển đổi (Lower Funnel - CPC, CVR, CPA):**
  * ${
    leakyBucketRows.length > 0
      ? `**Cảnh báo rò rỉ phễu (High CTR > 1.5% nhưng Low CVR < 2.0%):** Phát hiện **${
          leakyBucketRows.length
        } chiến dịch/nhóm quảng cáo** thu hút nhấp chuột tốt nhưng rớt chuyển đổi nặng tại trang đích: ${leakyBucketRows
          .map(
            (r) =>
              `\`${r.campaignName}\` / \`${r.adGroupName}\` (CTR **${formatPct(
                r.ctr
              )}** nhưng CVR chỉ đạt **${formatPct(r.cvr)}**, CPA đội lên **${
                r.conversions > 0 ? formatVND(r.cpa) : 'Vô cực - 0 KQ'
              }**)`
          )
          .join(
            '; '
          )}. Điểm nghẽn nằm ở sự lệch pha giữa nội dung giải trí/kích thích tò mò trên quảng cáo và trải nghiệm chốt đơn tại Landing Page / TikTok Shop.`
      : `Tỷ lệ chuyển đổi Lower Funnel duy trì ở mức **${formatPct(
          totalSummary.cvr
        )}**, không xuất hiện nhóm có CTR > 1.5% mà CVR tụt dưới ngưỡng 2.0%.`
  }

## 3. BẢNG XẾP HẠNG CHIẾN DỊCH / NHÓM QUẢNG CÁO (TOP WINNERS & LOSERS)

### Top 3 Chiến dịch / Adset hiệu quả nhất (Best Performers)
${
  winners.length > 0
    ? winners
        .map(
          (w, idx) =>
            `${idx + 1}. **${w.campaignName}** (\`${w.adGroupName}\` · Creative: \`${
              w.creativeName
            }\` · ${w.platform}): **CPA ${formatVND(w.cpa)}** — Mang về **${formatNum(
              w.conversions
            )} kết quả** với chi tiêu ${formatVND(w.spend)} (CTR **${formatPct(
              w.ctr
            )}**, CVR **${formatPct(w.cvr)}**${
              w.hookRate !== null ? `, Hook Rate **${formatPct(w.hookRate)}**` : ''
            }).`
        )
        .join('\n')
    : '- Không có chiến dịch nào đạt ngưỡng chuyển đổi tối ưu.'
}

### Top 3 Chiến dịch / Adset đốt tiền (Underperformers / Bleeding Budget)
${
  losers.length > 0
    ? losers
        .map(
          (l, idx) =>
            `${idx + 1}. **${l.campaignName}** (\`${l.adGroupName}\` · Creative: \`${
              l.creativeName
            }\` · ${l.platform}): Chi tiêu **${formatVND(l.spend)}** — Kết quả: **${formatNum(
              l.conversions
            )}** (${
              l.conversions > 0
                ? `CPA **${formatVND(l.cpa)}**, bằng **${Math.round(
                    (l.cpa / (totalSummary.cpa || 1)) * 100
                  )}%** mức CPA trung bình tài khoản`
                : '**0 chuyển đổi - Lỗ 100% ngân sách**'
            }, CTR ${formatPct(l.ctr)}, CVR ${formatPct(l.cvr)}).`
        )
        .join('\n')
    : '- Không phát hiện chiến dịch đốt ngân sách vượt ngưỡng 140% CPA trung bình.'
}

## 4. KẾ HOẠCH HÀNH ĐỘNG TỐI ƯU HÓA (ACTIONABLE RECOMMENDATIONS)

* **TẮT NGAY (Kill / Pause):**
${
  killList.length > 0
    ? killList
        .map(
          (item) =>
            `  * **${item.row.campaignName}** → Nhóm \`${item.row.adGroupName}\` (\`${item.row.creativeName}\`): ${item.reason}`
        )
        .join('\n')
    : '  * Hiện không có chiến dịch nào vượt ngưỡng cắt lỗ khẩn cấp (>150% CPA TB hoặc 0 chuyển đổi).'
}
* **TĂNG NGÂN SÁCH (Scale):**
${
  scaleList.length > 0
    ? scaleList
        .map(
          (item) =>
            `  * **${item.row.campaignName}** → Nhóm \`${item.row.adGroupName}\` (\`${item.row.creativeName}\`): ${item.reason} **Đề xuất:** ${item.suggestedIncrease}.`
        )
        .join('\n')
    : '  * Chưa có nhóm quảng cáo nào đủ điều kiện tăng ngân sách an toàn trong kỳ này.'
}
* **CẢI THIỆN CREATIVE / TARGETING:**
${
  creativeFixList.length > 0
    ? creativeFixList
        .map(
          (item) =>
            `  * **${item.row.campaignName}** (\`${item.row.creativeName}\`): ${item.issue}. **Hành động:** ${item.action}`
        )
        .join('\n')
    : '  * Duy trì theo dõi định kỳ tần suất Frequency và thay mới Hook 3s khi CTR giảm dưới 1.2%.'
}`;
}
