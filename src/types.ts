export type WorkspaceTab = "radar" | "studio" | "gitops" | "revenue" | "queue";

export type QaStatus = "pending" | "approved" | "review" | "rejected";

export type PublishStatus = "draft" | "ready" | "scheduled" | "published";

export type CaptionStylePreset = "kinetic-highlight" | "bold-clean" | "minimal-lower";

export interface CaptionSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  emphasisWord?: string;
}

export interface StudioLayout {
  facecamHeightPercent: number; // e.g., 36% top
  facecamZoom: number; // 1.0 - 2.2
  facecamPanX: number; // -50 to 50
  facecamPanY: number; // -50 to 50
  gameplayZoom: number; // 1.0 - 2.0
  gameplayPanX: number; // -50 to 50
  maskChatRegion: boolean;
  prependPeakHook: boolean;
  hookStartSec: number;
  hookDurationSec: number;
  captionStyle: CaptionStylePreset;
  showSafeZones: boolean;
}

export interface ClipQaResult {
  authenticTargetGame: boolean;
  detectedGame: string;
  saturationRisk: "low" | "medium" | "high";
  chatClutterDetected: boolean;
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
  };
  layoutDefaults: {
    aspectRatio: string;
    width: number;
    height: number;
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
    targetDailyRevenueUsd: number;
    assumedRpmUsd: number;
  };
}

export interface PipelineRun {
  id: string;
  trigger: "schedule" | "manual-ui" | "github-dispatch";
  startedAt: string;
  completedAt: string;
  status: "completed" | "failed";
  clipsScanned: number;
  clipsApproved: number;
  clipsRejected: number;
  summary: string;
  targetGame: string;
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
  integrations: IntegrationStatus;
}

export interface RepoFileEntry {
  path: string;
  language: string;
  description: string;
  content: string;
}
