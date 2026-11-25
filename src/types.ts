export type WorkspaceTab =
  | "studio"
  | "ingest"
  | "vod"
  | "templates"
  | "distribution"
  | "autopilot"
  | "gitops"
  | "guide";

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

export type SupportedLocale = "en" | "es" | "pt" | "fr" | "de" | "ja";

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

export interface BrollCue {
  id: string;
  timeSec: number;
  durationSec: number;
  effect: "zoom-punch" | "slow-mo" | "freeze-flash" | "meme-cutaway" | "hud-callout";
  label: string;
  promptNote: string;
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
  showHookBanner: boolean;
  captionStyle: CaptionStylePreset;
  showSafeZones: boolean;
  targetLufs: -11 | -14;
  truePeakDb: number;
  removeSilence: boolean;
  silenceThresholdDb: number;
  speedRampFactor: number;
  isolateVocalsDmca: boolean;
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

export interface ClipItem {
  id: string;
  sourcePlatform: "Twitch" | "Kick" | "YouTube Live";
  sourceUrl: string;
  title: string;
  gameCategory: string;
  streamerName: string;
  streamerHandle: string;
  views: number;
  ageMinutes: number;
  durationSec: number;
  duplicateCrossPosts: number;
  gameplayThumbnail: string;
  facecamThumbnail: string;
  transcript: string;
  qaStatus: QaStatus;
  qaResult?: ClipQaResult;
  layout: StudioLayout;
  captions: CaptionSegment[];
  sfxCues: SfxCue[];
  brollCues?: BrollCue[];
  hookVariants: HookVariant[];
  activeHookVariantId?: string;
  localizations: Partial<Record<SupportedLocale, LocalizedTrack>>;
  activeLocale: SupportedLocale;
  assignedChannelId?: string;
  publishStatus: PublishStatus;
  scheduledFor?: string;
  publishedMetrics?: {
    tiktokViews: number;
    reelsViews: number;
    shortsViews: number;
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
}

export interface ChannelAccount {
  id: string;
  name: string;
  handle: string;
  locale: SupportedLocale;
  platforms: Array<"TikTok" | "Instagram Reels" | "YouTube Shorts">;
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

export interface BrandKitPreset {
  id: string;
  name: string;
  watermarkHandle: string;
  watermarkOpacity: number;
  endCardCta: string;
  captionStyle: CaptionStylePreset;
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
    aspectRatio: string;
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
    platforms: string[];
    maxPostsPerDay: number;
    minSpacingMinutes: number;
    staggerJitterMinutes: number;
    targetDailyRevenueUsd: number;
    assumedRpmUsd: number;
  };
  channelFleet: ChannelAccount[];
  streamerPolicies: StreamerPolicyEntry[];
  aiDirector?: AiDirectorPolicy;
  brandPresets?: BrandKitPreset[];
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
  category: "gitops" | "gemini";
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

export interface WorkspaceState {
  clips: ClipItem[];
  config: PipelineConfig;
  runs: PipelineRun[];
  telemetry: TelemetryEvent[];
  vodSessions: VodSession[];
  directorHistory: DirectorRunResult[];
  integrations: IntegrationStatus;
}

export interface RepoFileEntry {
  path: string;
  language: string;
  description: string;
  content: string;
}
