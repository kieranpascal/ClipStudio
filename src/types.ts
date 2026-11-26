export type WorkspaceTab =
  | "studio"
  | "ingest"
  | "vod"
  | "templates"
  | "assets"
  | "ai-lab"
  | "distribution"
  | "autopilot"
  | "performance"
  | "gitops"
  | "guide";

export type UiMode = "easy" | "advanced";

export type QaStatus = "pending" | "approved" | "review" | "rejected";

export type PublishStatus = "draft" | "ready" | "scheduled" | "published";

export type LayoutTemplate =
  | "split-stack"
  | "fullscreen-pip"
  | "blurred-backdrop"
  | "reaction-focus"
  | "dual-cam"
  | "hud-zoom";

export type CaptionStylePreset =
  | "kinetic-highlight"
  | "bold-clean"
  | "minimal-lower"
  | "broadcast-lower"
  | "arcade-pop"
  | "comic-impact";

export type SfxKind = "riser" | "bass-drop" | "whoosh" | "camera-click" | "glitch-cut";

export type SupportedLocale =
  | "en"
  | "es"
  | "pt"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "hi"
  | "ar"
  | "id"
  | "tr"
  | "it";

export type SocialPlatform =
  | "TikTok"
  | "Instagram Reels"
  | "YouTube Shorts"
  | "X Video"
  | "Snapchat Spotlight"
  | "Facebook Reels"
  | "LinkedIn Video"
  | "Reddit Native Video"
  | "Pinterest Idea Pins"
  | "Threads Video"
  | "Bluesky Video"
  | "Substack Video";

export type ContentNiche =
  | "gaming"
  | "podcasts"
  | "tech-ai"
  | "finance"
  | "sports-irl"
  | "faceless-doc";

export type SourcePlatform =
  | "Twitch"
  | "Kick"
  | "YouTube Live"
  | "YouTube Podcast"
  | "Reddit"
  | "X / News";

export type VoiceProfileId = "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";

export interface VoiceoverTrack {
  id: string;
  voiceName: VoiceProfileId;
  style: string;
  script: string;
  audioUrl: string;
  mimeType: string;
  durationEstSec: number;
  duckOriginalDb: number;
  generatedAt: string;
  // Broadcast Loudness Compliance & Audio Mastering
  loudnessCompliance?: boolean;
  targetLufs?: number;
  measuredLufs?: number;
  truePeakDbTp?: number;
  compliancePassed?: boolean;
  platformSpec?: string;
  highPassHz?: number;
  voicePresenceEq?: boolean;
  deEsserEnabled?: boolean;
  breathTrimEnabled?: boolean;
  paceMultiplier?: number;
}

export interface HourlyVelocityPoint {
  hour: number;
  label: string;
  viewsPerHour: number;
  cumulativeViews: number;
  avgWatchPercent: number;
  sharesPerHour: number;
}

export interface SeoProfile {
  primaryKeyword: string;
  searchKeywords: string[];
  hashtags: string[];
  pinnedCommentCta: string;
  seoScore: number;
  xPost: string;
  snapTitle: string;
  fbReelsCaption: string;
  updatedAt: string;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaptionSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  emphasisWord?: string;
}

export interface SfxCue {
  id: string;
  timeSec: number;
  kind: SfxKind;
  gainDb: number;
}

export type DiscoveredAssetType = "stock-footage" | "meme-template";

export interface BrollCue {
  id: string;
  timeSec: number;
  durationSec: number;
  effect: "zoom-punch" | "slow-mo" | "freeze-flash" | "meme-cutaway" | "hud-callout";
  label: string;
  promptNote: string;
  assetUrl?: string;
  assetType?: DiscoveredAssetType;
  license?: string;
  sourceName?: string;
}

export interface HookVariant {
  id: string;
  label: string;
  bannerText: string;
  hookStartSec: number;
  angle: string;
  predictedHoldLift: string;
}

export interface LocalizedTrack {
  locale: SupportedLocale;
  languageName: string;
  tiktokCaption: string;
  reelsCaption: string;
  shortsTitle: string;
  captions: CaptionSegment[];
}

export type HookBannerPosition = "top" | "upper-third" | "center" | "lower";

export type CaptionFontFamily = "jakarta" | "oswald" | "playfair" | "mono";

export type MusicBedId =
  | "none"
  | "cinematic-pulse"
  | "lofi-focus"
  | "phonk-drift"
  | "tech-minimal"
  | "suspense-riser";

export type HotkeyActionId =
  | "trim-to-selection"
  | "generate-hook"
  | "send-to-queue"
  | "play-pause"
  | "toggle-safe-zones"
  | "blade-split"
  | "generate-voiceover"
  | "add-review-note"
  | "next-clip"
  | "prev-clip";

export interface HookRetentionPoint {
  sec: number;
  retentionPct: number;
  note?: string;
}

export interface HookRetentionGrade {
  overallScore: number;
  curiosityScore: number;
  storyArcScore: number;
  pacingScore: number;
  captionScore: number;
  verdict: string;
  fixSummary: string;
  suggestedHookStartSec: number;
  suggestedHookBanner: string;
  retentionCurve: HookRetentionPoint[];
  gradedAt: string;
}

export interface ReviewNote {
  id: string;
  timeSec: number;
  author: string;
  text: string;
  resolved: boolean;
  createdAt: string;
}

export interface SyndicationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerNiche: "all" | ContentNiche;
  minQaStatus: "approved" | "any";
  stripWatermark: boolean;
  targets: SocialPlatform[];
  retryOnApiFail: boolean;
  fallbackQueue: boolean;
  lastCheckedAt?: string;
  lastHealthSummary?: string;
}

export interface SlangCorrection {
  wrong: string;
  right: string;
}

export interface StudioLayout {
  template: LayoutTemplate;
  facecamHeightPercent: number;
  facecamZoom: number;
  facecamPanX: number;
  facecamPanY: number;
  gameplayZoom: number;
  gameplayPanX: number;
  sourceFacecamRect: CropRect;
  sourceGameplayRect: CropRect;
  maskChatRegion: boolean;
  prependPeakHook: boolean;
  hookStartSec: number;
  hookDurationSec: number;
  hookBannerText: string;
  hookBannerPosition?: HookBannerPosition;
  showHookBanner: boolean;
  captionStyle: CaptionStylePreset;
  captionFont?: CaptionFontFamily;
  captionHighlightColor?: string;
  captionAutoEmoji?: boolean;
  showSafeZones: boolean;
  targetLufs: -11 | -14;
  truePeakDb: number;
  removeSilence: boolean;
  silenceThresholdDb: number;
  speedRampFactor: number;
  isolateVocalsDmca: boolean;
  musicBedId?: MusicBedId;
  musicBedGainDb?: number;
  originalAudioGainDb?: number;
  voiceoverGainDb?: number;
  studioVoiceEq?: boolean;
  watermarkHandle: string;
  watermarkOpacity: number;
  endCardCta: string;
}

export interface ClipQaResult {
  authenticTargetGame: boolean;
  detectedGame: string;
  saturationRisk: "low" | "medium" | "high";
  chatClutterDetected: boolean;
  dmcaMusicRisk: "none" | "possible" | "high";
  dmcaNote: string;
  hookRecommendation: string;
  recommendedHookStartSec: number;
  summaryReason: string;
  tiktokCaption: string;
  reelsCaption: string;
  shortsTitle: string;
  auditedAt: string;
}

export interface ClipHealthScore {
  overall: number;
  engagementParity: number;
  audioVideoSync: number;
  metadataCompleteness: number;
  grade: "Optimal" | "Healthy" | "Needs Attention" | "Critical";
  summary: string;
  recommendedAction: string;
  calculatedBy: "ai-director";
  calculatedAt: string;
}

export interface ClipItem {
  id: string;
  sourcePlatform: SourcePlatform;
  sourceUrl: string;
  title: string;
  gameCategory: string;
  niche?: ContentNiche;
  streamerName: string;
  streamerHandle: string;
  views: number;
  channelBaselineViews?: number;
  outlierMultiplier?: number;
  ageMinutes: number;
  durationSec: number;
  duplicateCrossPosts: number;
  gameplayThumbnail: string;
  facecamThumbnail: string;
  transcript: string;
  isFaceless?: boolean;
  facelessStyle?: "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop";
  qaStatus: QaStatus;
  qaResult?: ClipQaResult;
  clipHealth?: ClipHealthScore;
  hookGrade?: HookRetentionGrade;
  reviewNotes?: ReviewNote[];
  layout: StudioLayout;
  captions: CaptionSegment[];
  sfxCues: SfxCue[];
  brollCues?: BrollCue[];
  voiceover?: VoiceoverTrack;
  seo?: SeoProfile;
  hookVariants: HookVariant[];
  activeHookVariantId?: string;
  localizations: Partial<Record<SupportedLocale, LocalizedTrack>>;
  activeLocale: SupportedLocale;
  assignedChannelId?: string;
  publishStatus: PublishStatus;
  scheduledFor?: string;
  publishedAt?: string;
  hourlyVelocity?: HourlyVelocityPoint[];
  publishedMetrics?: {
    tiktokViews: number;
    reelsViews: number;
    shortsViews: number;
    xViews?: number;
    snapViews?: number;
    fbViews?: number;
    shares: number;
    comments: number;
    avgWatchPercent: number;
    estimatedRevenueUsd: number;
  };
}

export interface TargetGameConfig {
  name: string;
  twitchGameId: string;
  minViews: number;
  maxClipAgeHours: number;
  enabled: boolean;
  niche?: ContentNiche;
}

export interface ChannelAccount {
  id: string;
  name: string;
  handle: string;
  locale: SupportedLocale;
  niche?: ContentNiche;
  platforms: SocialPlatform[];
  stage: "warmup" | "scaling" | "monetized";
  dailyPostCap: number;
  staggerJitterMin: number;
  assumedRpmUsd: number;
}

export interface StreamerPolicyEntry {
  handle: string;
  status: "allow" | "opt-out";
  note: string;
}

export interface AiDirectorPolicy {
  mode: "supervised" | "autonomous";
  brandVoice: "hype-arcade" | "esports-analyst" | "storyteller-suspense" | "chaos-comedy";
  customVoicePrompt: string;
  autoAuditOnIngest: boolean;
  autoGenerateHooks: boolean;
  autoLocalizeLocales: SupportedLocale[];
  maxAutoActionsPerRun: number;
}

export interface LocalLlmConfig {
  enabled: boolean;
  routingMode: "cloud-only" | "hybrid-local-first" | "local-only";
  baseUrl: string;
  model: string;
  computeHost: "windows-pc" | "linux-vps";
  offloadTasks: Array<"seo-hashtags" | "script-draft" | "caption-cleanup" | "batch-prescore">;
}

export interface BrandKitPreset {
  id: string;
  name: string;
  watermarkHandle: string;
  watermarkOpacity: number;
  endCardCta: string;
  captionStyle: CaptionStylePreset;
  captionFont?: CaptionFontFamily;
  hookBannerPosition?: HookBannerPosition;
  template: LayoutTemplate;
  targetLufs: -11 | -14;
}

export interface PipelineConfig {
  projectName: string;
  scheduleCron: string;
  targetGames: TargetGameConfig[];
  qaRules: {
    strictGameVerification: boolean;
    rejectChatBoxOverlap: boolean;
    maxExistingCrossPosts: number;
    minHookEnergyScore: number;
    requireStreamerCredit: boolean;
    autoStripDmcaMusic: boolean;
  };
  audioProcessing: {
    targetLufs: -11 | -14;
    truePeakDb: number;
    removeSilence: boolean;
    silenceThresholdDb: number;
  };
  brandKit: {
    watermarkHandle: string;
    watermarkOpacity: number;
    endCardCta: string;
  };
  layoutDefaults: {
    aspectRatio: "9:16";
    width: number;
    height: number;
    template: LayoutTemplate;
    facecamHeightPercent: number;
    maskChatRegion: boolean;
    prependPeakHook: boolean;
    hookDurationSeconds: number;
    captionStyle: CaptionStylePreset;
  };
  publishing: {
    platforms: SocialPlatform[];
    maxPostsPerDay: number;
    minSpacingMinutes: number;
    staggerJitterMinutes: number;
    targetDailyRevenueUsd: number;
    assumedRpmUsd: number;
  };
  channelFleet: ChannelAccount[];
  streamerPolicies: StreamerPolicyEntry[];
  aiDirector?: AiDirectorPolicy;
  localLlm?: LocalLlmConfig;
  brandPresets?: BrandKitPreset[];
  hotkeys?: Partial<Record<HotkeyActionId, string>>;
  syndicationRules?: SyndicationRule[];
  slangDictionary?: SlangCorrection[];
}

export interface PipelineRun {
  id: string;
  trigger: "schedule" | "manual-ui" | "github-dispatch" | "ai-director";
  startedAt: string;
  completedAt: string;
  status: "completed" | "failed";
  clipsScanned: number;
  clipsApproved: number;
  clipsRejected: number;
  summary: string;
  targetGame: string;
  latencyMs?: number;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  label: string;
  category: "gitops" | "gemini" | "local-llm";
  endpoint: string;
  latencyMs: number;
  success: boolean;
  model?: string;
}

export interface VodMoment {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  peakEnergy: number;
  hookBanner: string;
  transcriptExcerpt: string;
  reason: string;
}

export interface VodSession {
  id: string;
  title: string;
  streamerName: string;
  streamerHandle: string;
  sourceUrl: string;
  gameCategory: string;
  durationSec: number;
  transcript: string;
  energySeries: Array<{ minuteLabel: string; timeSec: number; audioDb: number; chatPerMin: number }>;
  moments: VodMoment[];
}

export interface DirectorExecutionStep {
  action: string;
  target: string;
  status: "executed" | "skipped" | "failed";
  detail: string;
}

export interface DirectorRunResult {
  id: string;
  instruction: string;
  planSummary: string;
  executedAt: string;
  steps: DirectorExecutionStep[];
  latencyMs: number;
}

export interface AgentChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  engine: "gemini-cloud" | "lm-studio-local" | "hybrid";
  executedSteps?: DirectorExecutionStep[];
}

export interface ResearchOpportunity {
  id: string;
  niche: ContentNiche;
  topic: string;
  source: string;
  estimatedRpmUsd: number;
  competitionLevel: "low" | "medium" | "high";
  viralScore: number;
  outlierMultiplier?: number;
  whyNow: string;
  hookBlueprint: string;
  recommendedVoice: VoiceProfileId;
  recommendedTemplate: LayoutTemplate;
  suggestedScript: string;
  origin?: "knowledge-acquisition" | "manual-research" | "seed";
  newsletterOrFeed?: string;
  sourceUrl?: string;
  crawledAt?: string;
}

export interface CompetitorBreakdown {
  hookMechanic: string;
  pacingNotes: string;
  retentionTriggers: string[];
  weaknessToExploit: string;
  counterHookBanner: string;
  recommendedTemplate: LayoutTemplate;
  suggestedVoicePrompt: string;
  generatedAt: string;
}

export interface IntegrationStatus {
  runtime: "ai-studio-express" | "cloudflare-pages";
  geminiConfigured: boolean;
  githubConfigured: boolean;
  githubRepo: string | null;
  githubBranch: string;
  cloudflareConfigured: boolean;
  cloudflareProject: string | null;
  twitchConfigured: boolean;
}

export interface StrategyRecommendation {
  summary: string;
  topWinningPattern: string;
  bottleneckDiagnosis: string;
  suggestedChanges: Array<{
    field: string;
    currentValue: string;
    recommendedValue: string;
    rationale: string;
  }>;
  configPatch: {
    minViews?: number;
    maxExistingCrossPosts?: number;
    facecamHeightPercent?: number;
    hookDurationSeconds?: number;
    maxPostsPerDay?: number;
  };
  generatedAt: string;
}

export interface TrendPulseSource {
  title: string;
  uri: string;
}

export interface TrendPulseTopic {
  id: string;
  gameOrTopic: string;
  category: string;
  heatLevel: "breakout" | "rising" | "steady";
  summary: string;
  clipAngle: string;
  recommendedTemplate: LayoutTemplate;
  suggestedDirectorCommand: string;
  pinnedPriority?: boolean;
}

export interface TrendPulseSnapshot {
  fetchedAt: string;
  focus: string;
  topics: TrendPulseTopic[];
  sources: TrendPulseSource[];
  searchQueries: string[];
}

export type MissionStageId =
  | "research"
  | "select"
  | "edit"
  | "audio"
  | "captions"
  | "effects"
  | "translate"
  | "review"
  | "optimize"
  | "publish"
  | "monitor"
  | "learn";

export type MissionAutonomyMode = "walkthrough" | "approval-gates" | "full-auto";

export type MissionScheduleCadence = "manual" | "every-6h" | "daily-0900" | "twice-daily";

export interface MissionIdea {
  id: string;
  rank: number;
  title: string;
  niche: ContentNiche;
  gameOrTopic: string;
  outlierScore: number;
  estRpmUsd: number;
  hookVariantA: string;
  hookVariantB: string;
  angle: string;
  recommendedTemplate: LayoutTemplate;
  sourceSignal: string;
}

export interface MissionStageState {
  id: MissionStageId;
  order: number;
  label: string;
  shortLabel: string;
  description: string;
  status: "pending" | "awaiting-approval" | "running" | "completed" | "skipped";
  requiresApproval: boolean;
  summary?: string;
  completedAt?: string;
  metrics?: string[];
}

export interface SplitTestPlan {
  testName: string;
  variantA: { label: string; hook: string; expectedHoldPct: number };
  variantB: { label: string; hook: string; expectedHoldPct: number };
  primaryMetric: string;
  decisionWindowHours: number;
  status: "planned" | "running" | "winner-picked";
}

export interface AutonomousMission {
  id: string;
  prompt: string;
  nicheFocus: string;
  createdAt: string;
  updatedAt: string;
  autonomyMode: MissionAutonomyMode;
  scheduleCadence: MissionScheduleCadence;
  nextScheduledRunAt?: string;
  currentStageIndex: number;
  status: "active" | "awaiting-approval" | "completed";
  ideas: MissionIdea[];
  selectedIdeaId?: string;
  activeClipId?: string;
  splitTest?: SplitTestPlan;
  learnedUpdates: string[];
  stages: MissionStageState[];
  sources: TrendPulseSource[];
}

export type IndustryNewsCategory = "news" | "streams" | "videos" | "social" | "ai-tools";

export interface IndustryNewsItem {
  id: string;
  category: IndustryNewsCategory;
  title: string;
  source: string;
  url: string;
  publishedHint: string;
  summary: string;
  whyItMatters: string;
  actionableTakeaway: string;
  fedToAgent?: boolean;
}

export interface IndustryNewsSnapshot {
  fetchedAt: string;
  focus: string;
  items: IndustryNewsItem[];
  sources: TrendPulseSource[];
  searchQueries: string[];
}

export interface EditingStyleSentiment {
  styleName: string;
  templateHint?: LayoutTemplate;
  sentimentScore: number; // 0 - 100
  verdict: "loved" | "polarizing" | "fatigued";
  audienceTakeaway: string;
  directorAdjustment: string;
  sampleMentionCount: number;
}

export interface ScrapedSocialComment {
  id: string;
  platform: "TikTok" | "YouTube Shorts" | "Instagram Reels" | "Reddit" | "X";
  authorHandle: string;
  commentText: string;
  sentiment: "positive" | "polarizing" | "negative";
  editingStyleReferenced: string;
  likesEstimate: number;
}

export interface ViralSentimentSnapshot {
  fetchedAt: string;
  niche: ContentNiche;
  topicQuery: string;
  overallPositivePct: number;
  overallPolarizingPct: number;
  overallNegativePct: number;
  executiveSummary: string;
  directorDirective: string;
  appliedToDirectorAt?: string;
  styleScores: EditingStyleSentiment[];
  comments: ScrapedSocialComment[];
  sources: TrendPulseSource[];
  searchQueries: string[];
}

export interface DiscoveredAsset {
  id: string;
  title: string;
  assetType: DiscoveredAssetType;
  sourceName: string;
  sourceUrl: string;
  license: string;
  niche: ContentNiche | "all";
  trafficScore: number; // 0 - 100
  recommendedEffect: BrollCue["effect"];
  recommendedDurationSec: number;
  placementHint: string;
  blendNote: string;
  tags: string[];
  savedAt?: string;
}

export interface AssetDiscoverySnapshot {
  fetchedAt: string;
  query: string;
  niche: ContentNiche | "all";
  filter: "all" | DiscoveredAssetType;
  assets: DiscoveredAsset[];
  sources: TrendPulseSource[];
  searchQueries: string[];
}

export type MonetizationStreamId =
  | "ad-share"
  | "sponsorships"
  | "affiliates"
  | "digital-products"
  | "multilang-arbitrage"
  | "licensing-syndication";

export interface MonetizationStream {
  id: MonetizationStreamId;
  name: string;
  enabled: boolean;
  monthlyCurrentUsd: number;
  monthlyTargetUsd: number;
  effectiveRpmLiftUsd: number;
  effortLevel: "low" | "medium" | "high";
  primaryPlatforms: string[];
  actionNext: string;
}

export interface SponsorDeal {
  id: string;
  brand: string;
  niche: ContentNiche;
  model: "Flat Integration" | "CPA / Affiliate" | "Retainer Bundle";
  estMonthlyUsd: number;
  status: "prospect" | "pitched" | "active";
  ctaHook: string;
}

export interface PlatformCpmTrend {
  platform: SocialPlatform;
  currentCpmUsd: number;
  trendDirection: "up" | "flat" | "down";
  deltaPct: number;
  monetizationThreshold: string;
  bestNiche: string;
  insight: string;
}

export interface MonthlyProjectionPoint {
  monthLabel: string;
  conservativeUsd: number;
  baseUsd: number;
  breakoutUsd: number;
  adShareUsd: number;
  sponsorAffiliateUsd: number;
  projectedViews: number;
}

export interface RevenueProjectionSnapshot {
  generatedAt: string;
  modelUsed: string;
  horizonMonths: number;
  currentClipAvgWatchPct: number;
  currentMonthlyViewsEst: number;
  blendedPlatformCpmUsd: number;
  projectedMonth1Usd: number;
  projectedMonth6BaseUsd: number;
  projectedMonth6BreakoutUsd: number;
  executiveForecast: string;
  keyCpmDrivers: string[];
  platformCpmTrends: PlatformCpmTrend[];
  monthlySeries: MonthlyProjectionPoint[];
  sources: TrendPulseSource[];
}

export interface MonetizationPlan {
  monthlyGoalUsd: number;
  exitValuationMultipleMonths: number;
  streams: MonetizationStream[];
  sponsorPipeline: SponsorDeal[];
  aiPlaybookSummary?: string;
  aiSponsorPitchScript?: string;
  aiFunnelCtas?: string[];
  aiActionSteps?: Array<{
    title: string;
    expectedMonthlyLiftUsd: number;
    priority: "now" | "next" | "scale";
    detail: string;
  }>;
  revenueProjection?: RevenueProjectionSnapshot;
  funnelTest?: FunnelTestSnapshot;
  lastOptimizedAt?: string;
}

export type CtaPlacementType =
  | "pre-roll-hook-banner"
  | "mid-roll-verbal-lower-third"
  | "pinned-comment-bio"
  | "end-card-offer-slate"
  | "split-screen-callout";

export interface FunnelTestVariant {
  id: string;
  label: string;
  placement: CtaPlacementType;
  triggerSecond: number;
  ctaCopy: string;
  sponsorBrand: string;
  niche: ContentNiche;
  sampleClips: number;
  impressions: number;
  ctaClicks: number;
  ctrPct: number;
  sponsorConversions: number;
  conversionRatePct: number;
  retentionImpactPct: number;
  revenuePer1kUsd: number;
  estMonthlyLiftUsd: number;
  isWinner?: boolean;
}

export interface FunnelTestSnapshot {
  id: string;
  updatedAt: string;
  analyzedByModel?: string;
  winnerVariantId: string;
  winnerLabel: string;
  conversionLiftPct: number;
  executiveSummary: string;
  keyInsights: string[];
  recommendedCtaCopy: string;
  recommendedPlacement: CtaPlacementType;
  variants: FunnelTestVariant[];
  appliedToPipelineAt?: string;
}

export interface RevenueGrowthAlert {
  id: string;
  detectedAt: string;
  targetType: "niche" | "editing-style";
  niche?: ContentNiche;
  label: string;
  editingStyle?: string;
  baselineRoiPer1kUsd: number;
  projectedRoiPer1kUsd: number;
  roiIncreasePct: number;
  projectedMonthlyDeltaUsd: number;
  driverSummary: string;
  directorSuggestion: string;
  status: "active" | "actioned" | "dismissed";
  actionedAt?: string;
}

export type AiComputeTierId =
  | "manual-free"
  | "windows-pc-local"
  | "cloud-budget"
  | "cloud-standard"
  | "cloud-flagship";

export type HostingStageId =
  | "stage-1-free"
  | "stage-2-starter"
  | "stage-3-growth"
  | "stage-4-scale";

export interface AiCreditLedgerEntry {
  id: string;
  timestamp: string;
  tier: AiComputeTierId;
  feature: string;
  model: string;
  creditsUsed: number;
  estUsdCost: number;
  status: "success" | "fallback-free" | "error";
}

export interface AiComputeRoutingConfig {
  activeTier: AiComputeTierId;
  hostingStage: HostingStageId;
  creditsBalance: number;
  creditsMonthlyAllowance: number;
  monthlyBudgetCapUsd: number;
  estMonthSpendUsd: number;
  autoDowngradeOnBudgetCap: boolean;
  windowsPcEndpoint: string;
  windowsPcModel: string;
  supabaseConfigured?: boolean;
  ledger: AiCreditLedgerEntry[];
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "creator";
  planTier: "free-starter" | "pro-growth" | "agency-scale";
  createdAt: string;
}

export type LearningDiscoveryType = "platform" | "source" | "method" | "monetization";

export type SelfLearningCadence = "manual" | "every-6h" | "every-12h" | "daily" | "weekly";

export interface SelfLearningDiscovery {
  id: string;
  type: LearningDiscoveryType;
  title: string;
  categoryLabel: string;
  opportunityScore: number; // 0 - 100
  estRpmOrLift: string;
  summary: string;
  implementationBlueprint: string;
  sourceUrl?: string;
  discoveredAt: string;
  adopted: boolean;
  adoptedAt?: string;
  adoptTarget?: string;
}

export interface SelfLearningCycleLog {
  id: string;
  ranAt: string;
  trigger: "manual" | "scheduled";
  focusSummary: string;
  discoveriesFound: number;
  autoAdoptedCount: number;
  keyInsight: string;
}

export interface SelfLearningState {
  enabled: boolean;
  cadence: SelfLearningCadence;
  autoAdoptSafeUpgrades: boolean;
  focusAreas: LearningDiscoveryType[];
  lastRunAt?: string;
  nextRunAt?: string;
  totalCyclesRun: number;
  discoveries: SelfLearningDiscovery[];
  cycleLogs: SelfLearningCycleLog[];
  learnedRules: string[];
  sources: TrendPulseSource[];
}

export type KnowledgeCrawlCadence = "manual" | "every-1h" | "every-6h" | "daily";

export interface KnowledgeSourceFeed {
  id: string;
  name: string;
  category: "creator-newsletter" | "ai-tools" | "platform-changelog";
  url: string;
  enabled: boolean;
}

export interface KnowledgeCrawlRun {
  id: string;
  ranAt: string;
  trigger: "manual" | "scheduled";
  sourcesCrawled: string[];
  opportunitiesDrafted: number;
  headlineSummary: string;
}

export interface KnowledgeAcquisitionState {
  enabled: boolean;
  cadence: KnowledgeCrawlCadence;
  autoDraftOpportunities: boolean;
  feeds: KnowledgeSourceFeed[];
  lastRunAt?: string;
  nextRunAt?: string;
  totalRuns: number;
  totalDrafted: number;
  recentRuns: KnowledgeCrawlRun[];
}

export interface PlatformExpansionPattern {
  id: string;
  platform: SocialPlatform;
  formatName: string;
  aspectRatio: "9:16" | "4:5" | "1:1" | "16:9";
  idealDurationRange: string;
  viralPatternTitle: string;
  algorithmSignal: string;
  hookStructure: string;
  captionPackaging: string;
  targetCommunitiesOrTags: string[];
  recommendedNiche: ContentNiche | "all";
  viralPotentialScore: number;
  competitionLevel: "low" | "medium" | "high";
  estRpmOrValueLift: string;
  stripWatermarkRequired: boolean;
  recommendedDailyCap: number;
  sourceUrl?: string;
  discoveredAt: string;
  adoptedToDistribution: boolean;
  adoptedAt?: string;
}

export interface PlatformExpansionHistoryEntry {
  id: string;
  platform: SocialPlatform;
  formatName: string;
  appliedAt: string;
  mode: "auto-sync" | "manual";
  summary: string;
}

export interface PlatformExpansionState {
  autoSyncToDistribution: boolean;
  autoTargetMinScore: number;
  focusNiche: ContentNiche | "all";
  lastResearchedAt?: string;
  totalResearchRuns: number;
  executiveBrief: string;
  patterns: PlatformExpansionPattern[];
  sources: TrendPulseSource[];
  appliedHistory: PlatformExpansionHistoryEntry[];
}

export interface AbTestVariantMetrics {
  variantId: string;
  label: string;
  hookStyle: string;
  hookBannerSample: string;
  editingTemplate: LayoutTemplate;
  captionStyle: CaptionStylePreset;
  hookDurationSeconds: number;
  sampleClips: number;
  avgViews: number;
  avgRetentionPct: number;
  avgShareRatePct: number;
  estRpmUsd: number;
  isWinner?: boolean;
}

export interface AbTestRecommendedDefaults {
  template: LayoutTemplate;
  captionStyle: CaptionStylePreset;
  prependPeakHook: boolean;
  hookDurationSeconds: number;
  facecamHeightPercent: number;
  brandVoice?: AiDirectorPolicy["brandVoice"];
  customVoicePrompt?: string;
}

export interface AbTestAnalysisSnapshot {
  id: string;
  analyzedAt: string;
  modelUsed: string;
  focusNiche: ContentNiche | "all";
  winnerVariantId: string;
  winnerLabel: string;
  confidencePct: number;
  projectedViewsLiftPct: number;
  projectedRetentionLiftPct: number;
  executiveVerdict: string;
  keyFindings: string[];
  variants: AbTestVariantMetrics[];
  recommendedDefaults: AbTestRecommendedDefaults;
  bakedIntoConfigAt?: string;
  bakedSummary?: string;
}

export type OpportunityGapFreshness = "24h" | "7d" | "30d";

export interface OpportunityGapTopic {
  id: string;
  topic: string;
  niche: ContentNiche;
  subCategory: string;
  demandVelocity: "exploding" | "rising" | "steady";
  searchTrendSignal: string;
  whyUncovered: string;
  suggestedHook: string;
  angleBrief: string;
  recommendedFormat: "split-screen" | "faceless-narration" | "podcast-split" | "authority-breakdown";
  estimatedRpmUsd: number;
  noveltyPct: number; // 0 - 100 verified gap against current clip library
  closestLibraryClipTitle?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  discoveredAt: string;
  promotedToClipId?: string;
  savedToResearch?: boolean;
}

export interface OpportunityDiscoverySnapshot {
  lastScannedAt: string;
  focusNiche: ContentNiche | "all";
  freshness: OpportunityGapFreshness;
  customQuery?: string;
  modelUsed: string;
  libraryClipCountAudited: number;
  excludedCoveredTopics: string[];
  topics: OpportunityGapTopic[];
  sources: TrendPulseSource[];
  searchQueries: string[];
}

export interface WorkspaceState {
  clips: ClipItem[];
  config: PipelineConfig;
  runs: PipelineRun[];
  telemetry: TelemetryEvent[];
  vodSessions: VodSession[];
  directorHistory: DirectorRunResult[];
  agentMessages?: AgentChatMessage[];
  researchOpportunities?: ResearchOpportunity[];
  opportunityDiscovery?: OpportunityDiscoverySnapshot;
  trendPulse?: TrendPulseSnapshot;
  activeMission?: AutonomousMission;
  missionHistory?: AutonomousMission[];
  industryNews?: IndustryNewsSnapshot;
  viralSentiment?: ViralSentimentSnapshot;
  assetDiscovery?: AssetDiscoverySnapshot;
  savedAssets?: DiscoveredAsset[];
  monetizationPlan?: MonetizationPlan;
  selfLearning?: SelfLearningState;
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  platformExpansion?: PlatformExpansionState;
  abTestAnalysis?: AbTestAnalysisSnapshot;
  revenueAlerts?: RevenueGrowthAlert[];
  computeRouting?: AiComputeRoutingConfig;
  integrations: IntegrationStatus;
}

export interface RepoFileEntry {
  path: string;
  language: string;
  description: string;
  content: string;
}
