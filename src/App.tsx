import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type {
  AiComputeRoutingConfig,
  AiComputeTierId,
  AuthUser,
  CaptionFontFamily,
  CaptionStylePreset,
  ChannelAccount,
  ClipItem,
  CompetitorBreakdown,
  ContentNiche,
  CtaPlacementType,
  DirectorRunResult,
  DiscoveredAsset,
  DiscoveredAssetType,
  HookBannerPosition,
  HostingStageId,
  KnowledgeCrawlCadence,
  KnowledgeSourceFeed,
  LayoutTemplate,
  LearningDiscoveryType,
  MissionAutonomyMode,
  MissionScheduleCadence,
  MissionStageId,
  MonetizationPlan,
  OpportunityGapFreshness,
  OpportunityGapTopic,
  PipelineConfig,
  ResearchOpportunity,
  SelfLearningCadence,
  SocialPlatform,
  SourcePlatform,
  StrategyRecommendation,
  StreamerPolicyEntry,
  SupportedLocale,
  UiMode,
  VodMoment,
  VoiceProfileId,
  WorkspaceState,
  WorkspaceTab,
} from "./types";
import { TopBar } from "./components/TopBar";
import { IngestDeck } from "./components/IngestDeck";
import { VerticalStudioView } from "./components/VerticalStudioView";
import { VodHighlightsDeck } from "./components/VodHighlightsDeck";
import { TemplatesBrollDeck } from "./components/TemplatesBrollDeck";
import { AssetDiscoveryView } from "./components/AssetDiscoveryView";
import { DistributionDeck } from "./components/DistributionDeck";
import { AiDirectorDeck } from "./components/AiDirectorDeck";
import { PerformanceMonitorView } from "./components/PerformanceMonitorView";
import { MultimodalAiLabView } from "./components/MultimodalAiLabView";
import { GitOpsView } from "./components/GitOpsView";
import { PresentationDeck } from "./components/PresentationDeck";
import { AiCommandBar } from "./components/AiCommandBar";
import { SettingsHotkeysModal } from "./components/SettingsHotkeysModal";
import { AuthAccountModal } from "./components/AuthAccountModal";
import { DEFAULT_SLANG_DICTIONARY, resolveHotkeys } from "./utils/hotkeys";

interface Notice {
  type: "success" | "error";
  message: string;
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("studio");
  const [uiMode, setUiMode] = useState<UiMode>(() => {
    try {
      return localStorage.getItem("clipforge_ui_mode") === "easy" ? "easy" : "advanced";
    } catch {
      return "advanced";
    }
  });
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isDark, setIsDark] = useState(true);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  const [auditingClipId, setAuditingClipId] = useState<string | null>(null);
  const [generatingHooksClipId, setGeneratingHooksClipId] = useState<string | null>(null);
  const [isGradingHook, setIsGradingHook] = useState(false);
  const [isCalculatingHealth, setIsCalculatingHealth] = useState(false);
  const [isBuildingFaceless, setIsBuildingFaceless] = useState(false);
  const [isSuggestingBroll, setIsSuggestingBroll] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [isDraftingScript, setIsDraftingScript] = useState(false);
  const [isGeneratingSeoFor, setIsGeneratingSeoFor] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isDiscoveringOpportunities, setIsDiscoveringOpportunities] = useState(false);
  const [isChattingAgent, setIsChattingAgent] = useState(false);
  const [translatingLocale, setTranslatingLocale] = useState<SupportedLocale | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isAnalyzingVod, setIsAnalyzingVod] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [isStartingMission, setIsStartingMission] = useState(false);
  const [isAdvancingMission, setIsAdvancingMission] = useState(false);
  const [isScanningNews, setIsScanningNews] = useState(false);
  const [isScanningSentiment, setIsScanningSentiment] = useState(false);
  const [isApplyingSentiment, setIsApplyingSentiment] = useState(false);
  const [isDiscoveringAssets, setIsDiscoveringAssets] = useState(false);
  const [isInjectingAsset, setIsInjectingAsset] = useState(false);
  const [isOptimizingMonetization, setIsOptimizingMonetization] = useState(false);
  const [isProjectingRevenue, setIsProjectingRevenue] = useState(false);
  const [isAnalyzingFunnel, setIsAnalyzingFunnel] = useState(false);
  const [isApplyingFunnelWinner, setIsApplyingFunnelWinner] = useState(false);
  const [isScanningAlerts, setIsScanningAlerts] = useState(false);
  const [shiftingAlertId, setShiftingAlertId] = useState<string | null>(null);
  const [isRunningSelfLearn, setIsRunningSelfLearn] = useState(false);
  const [isCrawlingKnowledge, setIsCrawlingKnowledge] = useState(false);
  const [adoptingDiscoveryId, setAdoptingDiscoveryId] = useState<string | null>(null);
  const [isResearchingExpansion, setIsResearchingExpansion] = useState(false);
  const [applyingPatternId, setApplyingPatternId] = useState<string | null>(null);
  const [removingPlatform, setRemovingPlatform] = useState<SocialPlatform | null>(null);
  const [isAnalyzingAbTest, setIsAnalyzingAbTest] = useState(false);
  const [isBakingWinner, setIsBakingWinner] = useState(false);
  const [autopilotSubTab, setAutopilotSubTab] = useState<
    "mission" | "monetization" | "expansion" | "agent" | "compute" | "voice"
  >("mission");
  const [directorHistory, setDirectorHistory] = useState<DirectorRunResult[]>([]);
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  function handleToggleUiMode(nextMode: UiMode) {
    setUiMode(nextMode);
    try {
      localStorage.setItem("clipforge_ui_mode", nextMode);
    } catch {
      // Ignore storage errors
    }
    if (
      nextMode === "easy" &&
      !["studio", "ingest", "ai-lab", "performance", "autopilot", "distribution"].includes(activeTab)
    ) {
      setActiveTab("studio");
    }
  }

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  // Global Cmd+K / Ctrl+K AI Command Bar shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandBarOpen(false);
        setSettingsOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function showNotice(type: "success" | "error", message: string) {
    setNotice({ type, message });
  }

  async function loadWorkspace() {
    try {
      const res = await fetch("/api/workspace");
      if (!res.ok) throw new Error(`Failed to load workspace (${res.status})`);
      const data = (await res.json()) as WorkspaceState;
      setWorkspace(data);
      if (Array.isArray(data.directorHistory) && data.directorHistory.length > 0) {
        setDirectorHistory(data.directorHistory);
      }
      if (!selectedClipId && data.clips.length > 0) {
        setSelectedClipId(data.clips[0].id);
      }
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not load workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshTelemetry() {
    try {
      const res = await fetch("/api/telemetry");
      if (!res.ok) return;
      const data = await res.json();
      setWorkspace((prev) => (prev ? { ...prev, telemetry: data.events || [] } : prev));
    } catch {
      // Ignore silent telemetry refresh errors
    }
  }

  useEffect(() => {
    loadWorkspace();
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.supabaseConfigured === "boolean") {
          setSupabaseConfigured(data.supabaseConfigured);
        }
      })
      .catch(() => {
        // Ignore silent auth status check failures
      });
  }, []);

  const counts = useMemo(() => {
    const clips = workspace?.clips || [];
    const activeAlerts = (workspace?.revenueAlerts || []).filter(
      (a) => a.status === "active"
    ).length;
    return {
      pendingQa: clips.filter((c) => c.qaStatus === "pending").length,
      readyToPublish: clips.filter((c) => c.publishStatus === "ready" || c.publishStatus === "scheduled").length,
      activeAlerts,
    };
  }, [workspace?.clips, workspace?.revenueAlerts]);

  async function handleScanRadar() {
    setIsScanning(true);
    try {
      const res = await fetch("/api/radar/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Radar scan failed.");
      await loadWorkspace();
      showNotice("success", `Ingested ${data.discoveredCount} new clip(s) from ${data.source}.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Radar scan failed.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleAddClip(payload: {
    title: string;
    streamerName: string;
    sourcePlatform: SourcePlatform;
    sourceUrl: string;
    gameCategory: string;
    niche?: ContentNiche;
    views: number;
    ageMinutes: number;
    durationSec: number;
    duplicateCrossPosts: number;
    transcript: string;
  }) {
    const res = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("error", data.error || "Failed to add clip.");
      return;
    }
    setWorkspace((prev) => (prev ? { ...prev, clips: [data, ...prev.clips] } : prev));
    setSelectedClipId(data.id);
    showNotice("success", `Added "${data.title}" to media bin.`);
  }

  async function handleUpdateClip(clipId: string, updates: Partial<ClipItem>) {
    const res = await fetch(`/api/clips/${encodeURIComponent(clipId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("error", data.error || "Could not update clip.");
      return;
    }
    setWorkspace((prev) =>
      prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data : c)) } : prev
    );
    showNotice("success", "Saved clip changes.");
  }

  async function handleDeleteClip(clipId: string) {
    const res = await fetch(`/api/clips/${encodeURIComponent(clipId)}`, { method: "DELETE" });
    if (!res.ok) {
      showNotice("error", "Could not remove clip.");
      return;
    }
    setWorkspace((prev) => {
      if (!prev) return prev;
      const nextClips = prev.clips.filter((c) => c.id !== clipId);
      if (selectedClipId === clipId && nextClips.length > 0) {
        setSelectedClipId(nextClips[0].id);
      }
      return { ...prev, clips: nextClips };
    });
    showNotice("success", "Removed clip from media bin.");
  }

  async function handleBatchAction(clipIds: string[], action: "approve" | "queue" | "delete" | "audit") {
    setIsBatchRunning(true);
    try {
      const res = await fetch("/api/clips/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipIds, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch operation failed.");
      await loadWorkspace();
      showNotice(
        "success",
        `Batch ${action} applied to ${data.updatedCount ?? clipIds.length} clip(s).`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Batch operation failed.");
    } finally {
      setIsBatchRunning(false);
    }
  }

  async function handleAuditClip(clipId: string) {
    setAuditingClipId(clipId);
    try {
      const res = await fetch("/api/ai/analyze-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gemini QA audit failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Gemini QA & DMCA audit finished: ${data.qaStatus}.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Gemini QA audit failed.");
    } finally {
      setAuditingClipId(null);
    }
  }

  async function handleGenerateHooks(clipId: string) {
    setGeneratingHooksClipId(clipId);
    try {
      const res = await fetch("/api/ai/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hook generation failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Generated ${data.hookVariants?.length || 3} viral 0–3s hook variants.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Hook generation failed.");
    } finally {
      setGeneratingHooksClipId(null);
    }
  }

  async function handleSuggestBroll(clipId: string) {
    setIsSuggestingBroll(true);
    try {
      const res = await fetch("/api/ai/suggest-broll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "B-Roll generation failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Generated ${data.brollCues?.length || 0} timed B-Roll & motion cues.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "B-Roll generation failed.");
    } finally {
      setIsSuggestingBroll(false);
    }
  }

  async function handleTranslateClip(clipId: string, locale: SupportedLocale) {
    setTranslatingLocale(locale);
    try {
      const res = await fetch("/api/ai/translate-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Localization failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Localized captions and metadata to ${locale.toUpperCase()}.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Localization failed.");
    } finally {
      setTranslatingLocale(null);
    }
  }

  async function handleAnalyzeVod(payload: {
    title: string;
    streamerName: string;
    sourceUrl: string;
    gameCategory: string;
    durationSec: number;
    transcript: string;
  }) {
    setIsAnalyzingVod(true);
    try {
      const res = await fetch("/api/ai/analyze-vod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "VOD analysis failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, vodSessions: [data, ...(prev.vodSessions || [])] } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Extracted ${data.moments?.length || 0} viral highlight moments from VOD.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "VOD analysis failed.");
    } finally {
      setIsAnalyzingVod(false);
    }
  }

  async function handleExtractVodMoment(payload: {
    title: string;
    streamerName: string;
    streamerHandle: string;
    sourceUrl: string;
    gameCategory: string;
    durationSec: number;
    hookBanner: string;
    transcript: string;
  }) {
    const res = await fetch("/api/clips/extract-vod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("error", data.error || "Could not slice VOD moment.");
      return;
    }
    setWorkspace((prev) => (prev ? { ...prev, clips: [data, ...prev.clips] } : prev));
    setSelectedClipId(data.id);
    showNotice("success", `Sliced "${data.title}" directly into Ingest & Studio.`);
  }

  async function handleSaveConfig(nextConfig: PipelineConfig) {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextConfig),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice("error", data.error || "Failed to save pipeline configuration.");
      return;
    }
    setWorkspace((prev) => (prev ? { ...prev, config: data.config } : prev));
    await handleRefreshTelemetry();
    showNotice("success", data.message || "Saved pipeline.config.json.");
  }

  async function handleUpdateStreamerPolicies(policies: StreamerPolicyEntry[]) {
    if (!workspace) return;
    await handleSaveConfig({ ...workspace.config, streamerPolicies: policies });
  }

  async function handleUpdateChannelFleet(fleet: ChannelAccount[]) {
    if (!workspace) return;
    await handleSaveConfig({ ...workspace.config, channelFleet: fleet });
  }

  async function handleDispatchPipeline(dryRun = true) {
    setIsRunningPipeline(true);
    try {
      const res = await fetch("/api/gitops/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline dispatch failed.");
      await loadWorkspace();
      showNotice("success", data.run?.summary || "Pipeline execution completed.");
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Pipeline dispatch failed.");
    } finally {
      setIsRunningPipeline(false);
    }
  }

  async function handleAutoScheduleFleet() {
    setIsAutoScheduling(true);
    try {
      const res = await fetch("/api/distribution/auto-schedule", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fleet auto-scheduler failed.");
      await loadWorkspace();
      showNotice("success", `Auto-scheduled ${data.scheduledCount} clip(s) across regional fleet channels.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Fleet auto-scheduler failed.");
    } finally {
      setIsAutoScheduling(false);
    }
  }

  async function handleRunOptimizer() {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/optimize-strategy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Strategy optimizer failed.");
      setRecommendation(data);
      await handleRefreshTelemetry();
      showNotice("success", "Gemini closed-loop patch ready.");
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Strategy optimizer failed.");
    } finally {
      setIsOptimizing(false);
    }
  }

  async function handleFetchTrends(focus: string) {
    setIsFetchingTrends(true);
    try {
      const res = await fetch("/api/trendpulse/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "TrendPulse scan failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              trendPulse: data.trendPulse,
              telemetry: data.telemetry || prev.telemetry,
            }
          : prev
      );
      showNotice(
        "success",
        `TrendPulse loaded ${data.trendPulse?.topics?.length || 0} live Twitch gaming trends via Google Search.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "TrendPulse scan failed.");
    } finally {
      setIsFetchingTrends(false);
    }
  }

  async function handleToggleTrendPin(topicId: string) {
    try {
      const res = await fetch("/api/trendpulse/pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update TrendPulse priority.");
      setWorkspace((prev) => (prev ? { ...prev, trendPulse: data.trendPulse } : prev));
      showNotice("success", "Updated AI Director TrendPulse clipping priorities.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not pin trend.");
    }
  }

  async function handleTrackTrendGame(gameName: string) {
    if (!workspace) return;
    const exists = workspace.config.targetGames.some(
      (g) => g.name.trim().toLowerCase() === gameName.trim().toLowerCase()
    );
    if (exists) {
      showNotice("success", `"${gameName}" is already tracked in pipeline.config.json.`);
      return;
    }
    const nextConfig: PipelineConfig = {
      ...workspace.config,
      targetGames: [
        {
          name: gameName,
          twitchGameId: `trend_${Date.now().toString(36)}`,
          minViews: 2000,
          maxClipAgeHours: 12,
          enabled: true,
        },
        ...workspace.config.targetGames,
      ],
    };
    await handleSaveConfig(nextConfig);
  }

  async function handleExecuteDirector(instruction: string) {
    setIsDirecting(true);
    try {
      const res = await fetch("/api/ai/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Director command failed.");
      if (data.workspace) {
        setWorkspace(data.workspace);
      } else {
        await loadWorkspace();
      }
      if (data.result) {
        setDirectorHistory((prev) => [data.result as DirectorRunResult, ...prev.slice(0, 14)]);
        showNotice("success", data.result.summary || "AI Director finished executing actions.");
      }
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "AI Director failed.");
    } finally {
      setIsDirecting(false);
    }
  }

  async function handleGenerateVoiceover(
    clipId: string,
    payload: {
      voiceName: VoiceProfileId;
      style: string;
      script: string;
      duckOriginalDb: number;
      loudnessCompliance: boolean;
      targetLufs: number;
      highPassHz: number;
      voicePresenceEq: boolean;
      deEsserEnabled: boolean;
      breathTrimEnabled: boolean;
      paceMultiplier: number;
    }
  ) {
    setIsGeneratingVoiceover(true);
    try {
      const res = await fetch("/api/ai/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voiceover TTS generation failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data.clip : c)) } : prev
      );
      await handleRefreshTelemetry();
      const lufsMsg =
        typeof data.voiceover?.measuredLufs === "number"
          ? ` (${data.voiceover.measuredLufs.toFixed(1)} LUFS · ${data.voiceover.truePeakDbTp?.toFixed(1) ?? "-1.0"} dBTP)`
          : "";
      showNotice("success", `Generated ${payload.voiceName} .WAV voiceover${lufsMsg}.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Voiceover TTS generation failed.");
    } finally {
      setIsGeneratingVoiceover(false);
    }
  }

  async function handleStartMission(payload: {
    prompt: string;
    nicheFocus: string;
    autonomyMode: MissionAutonomyMode;
    scheduleCadence: MissionScheduleCadence;
  }) {
    setIsStartingMission(true);
    try {
      const res = await fetch("/api/ai/mission/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch autonomous mission.");
      if (data.workspace) {
        setWorkspace(data.workspace);
      } else if (data.mission) {
        setWorkspace((prev) => (prev ? { ...prev, activeMission: data.mission } : prev));
      }
      if (data.mission?.activeClipId) {
        setSelectedClipId(data.mission.activeClipId);
      }
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Mission ready: ranked ${data.mission?.ideas?.length || 10} live video ideas (${payload.autonomyMode}).`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to launch autonomous mission.");
    } finally {
      setIsStartingMission(false);
    }
  }

  async function handleAdvanceMission(payload: {
    mode: "step" | "until-gate" | "full-auto";
    selectedIdeaId?: string;
  }) {
    setIsAdvancingMission(true);
    try {
      const res = await fetch("/api/ai/mission/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, approveCurrent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mission advance failed.");
      if (data.workspace) {
        setWorkspace(data.workspace);
      } else if (data.mission) {
        setWorkspace((prev) => (prev ? { ...prev, activeMission: data.mission } : prev));
      }
      if (data.mission?.activeClipId) {
        setSelectedClipId(data.mission.activeClipId);
      }
      await handleRefreshTelemetry();
      showNotice(
        "success",
        data.mission?.status === "completed"
          ? "Autonomous 12-stage mission completed end-to-end & learnings saved."
          : `Advanced ${data.ranCount || 1} stage(s) in autonomous pipeline.`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Mission advance failed.");
    } finally {
      setIsAdvancingMission(false);
    }
  }

  async function handleUpdateMissionConfig(payload: {
    autonomyMode?: MissionAutonomyMode;
    scheduleCadence?: MissionScheduleCadence;
    selectedIdeaId?: string;
    toggleGateStageId?: MissionStageId;
  }) {
    try {
      const res = await fetch("/api/ai/mission/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update mission configuration.");
      setWorkspace((prev) => (prev ? { ...prev, activeMission: data.mission } : prev));
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to update mission configuration.");
    }
  }

  async function handleScanIndustryNews(focus: string) {
    setIsScanningNews(true);
    try {
      const res = await fetch("/api/ai/news-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Industry news radar scan failed.");
      setWorkspace((prev) => (prev ? { ...prev, industryNews: data.industryNews } : prev));
      await handleRefreshTelemetry();
      showNotice("success", `Synced ${data.industryNews?.items?.length || 0} live news, stream, video & AI tool updates.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Industry news radar scan failed.");
    } finally {
      setIsScanningNews(false);
    }
  }

  async function handleFeedNewsToAgent(itemId?: string) {
    try {
      const res = await fetch("/api/ai/news-radar/feed-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to feed intel to AI agent.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              industryNews: data.industryNews || prev.industryNews,
              agentMessages: data.agentMessages || prev.agentMessages,
            }
          : prev
      );
      showNotice("success", "Synced live industry intel into AI Agent planning memory.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to feed intel to AI agent.");
    }
  }

  async function handleDraftVoiceoverScript(clipId: string, tone: string): Promise<string | null> {
    setIsDraftingScript(true);
    try {
      const res = await fetch("/api/ai/draft-voiceover-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Script drafting failed.");
      await handleRefreshTelemetry();
      showNotice("success", `Drafted narration script via ${data.engine === "lm-studio-local" ? "LM Studio Local" : "Gemini Cloud"}.`);
      return String(data.script || "");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Script drafting failed.");
      return null;
    } finally {
      setIsDraftingScript(false);
    }
  }

  async function handleGenerateSeo(clipId: string) {
    setIsGeneratingSeoFor(clipId);
    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SEO generation failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data.clip : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Generated 6-platform SEO pack via ${data.engine === "lm-studio-local" ? "LM Studio Local" : "Gemini Cloud"}.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "SEO generation failed.");
    } finally {
      setIsGeneratingSeoFor(null);
    }
  }

  async function handleRunResearch(focus: string) {
    setIsResearching(true);
    try {
      const res = await fetch("/api/research/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Live research scan failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              researchOpportunities: data.opportunities || [],
              telemetry: data.telemetry || prev.telemetry,
            }
          : prev
      );
      showNotice("success", `Discovered ${data.opportunities?.length || 0} high-upside opportunities via Google Search.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Live research scan failed.");
    } finally {
      setIsResearching(false);
    }
  }

  async function handleCreateClipFromOpportunity(opp: ResearchOpportunity) {
    const res = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: opp.topic,
        streamerName: opp.source,
        sourcePlatform: opp.niche === "podcasts" ? "YouTube Podcast" : opp.niche === "tech-ai" ? "X / News" : "Twitch",
        sourceUrl: "",
        gameCategory: opp.niche.toUpperCase(),
        niche: opp.niche,
        views: 12000,
        ageMinutes: 25,
        durationSec: 26,
        duplicateCrossPosts: 0,
        transcript: opp.suggestedScript,
      }),
    });
    const created = await res.json();
    if (!res.ok) {
      showNotice("error", created.error || "Could not create clip from opportunity.");
      return;
    }
    // Apply the researched hook banner & template immediately
    await fetch(`/api/clips/${encodeURIComponent(created.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche: opp.niche,
        layout: {
          ...created.layout,
          template: opp.recommendedTemplate,
          hookBannerText: opp.hookBlueprint,
          showHookBanner: true,
        },
      }),
    });
    await loadWorkspace();
    setSelectedClipId(created.id);
    setActiveTab("studio");
    showNotice("success", `Created "${opp.topic}" and opened Studio Voiceover Engine.`);
  }

  async function handleRunOpportunityDiscovery(payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    customQuery?: string;
  }) {
    setIsDiscoveringOpportunities(true);
    try {
      const res = await fetch("/api/ingest/opportunity-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Opportunity Discovery Google Search scan failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              opportunityDiscovery: data.opportunityDiscovery,
              computeRouting: data.computeRouting || prev.computeRouting,
            }
          : prev
      );
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Found ${data.opportunityDiscovery?.topics?.length || 0} uncovered niche topics via live Google Search.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice(
        "error",
        err instanceof Error ? err.message : "Opportunity Discovery Google Search scan failed."
      );
    } finally {
      setIsDiscoveringOpportunities(false);
    }
  }

  async function handleCreateClipFromDiscoveredTopic(topic: OpportunityGapTopic) {
    const res = await fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: topic.topic,
        streamerName: topic.sourceTitle || "Google Search Discovery",
        sourcePlatform:
          topic.niche === "podcasts"
            ? "YouTube Podcast"
            : topic.niche === "gaming"
              ? "Twitch"
              : "X / News",
        sourceUrl: topic.sourceUrl || "",
        gameCategory: topic.subCategory || topic.niche.toUpperCase(),
        niche: topic.niche,
        views: 14500,
        ageMinutes: 18,
        durationSec: 32,
        duplicateCrossPosts: 0,
        transcript: `${topic.suggestedHook} ${topic.angleBrief}`,
      }),
    });
    const created = await res.json();
    if (!res.ok) {
      showNotice("error", created.error || "Could not create clip draft from discovered topic.");
      return;
    }

    const templateMap: Record<OpportunityGapTopic["recommendedFormat"], LayoutTemplate> = {
      "split-screen": "split-stack",
      "faceless-narration": "blurred-backdrop",
      "podcast-split": "dual-cam",
      "authority-breakdown": "blurred-backdrop",
    };

    await fetch(`/api/clips/${encodeURIComponent(created.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche: topic.niche,
        layout: {
          ...created.layout,
          template: templateMap[topic.recommendedFormat],
          hookBannerText: topic.suggestedHook,
          showHookBanner: true,
        },
      }),
    });

    await fetch(`/api/ingest/opportunity-discovery/${encodeURIComponent(topic.id)}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "clip", clipId: created.id }),
    });

    await loadWorkspace();
    setSelectedClipId(created.id);
    setActiveTab("studio");
    showNotice("success", `Created clip draft from uncovered topic "${topic.topic}" and opened Studio.`);
  }

  async function handleSaveDiscoveredTopicToResearch(topicId: string) {
    try {
      const res = await fetch(`/api/ingest/opportunity-discovery/${encodeURIComponent(topicId)}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "research" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save topic to Research queue.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              opportunityDiscovery: data.opportunityDiscovery || prev.opportunityDiscovery,
              researchOpportunities: data.researchOpportunities || prev.researchOpportunities,
            }
          : prev
      );
      showNotice("success", "Saved uncovered topic to your Research Opportunities queue.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not save topic to Research queue.");
    }
  }

  async function handleSendAgentMessage(message: string) {
    setIsChattingAgent(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ops Agent chat failed.");
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
      showNotice(
        "success",
        `Ops Agent responded via ${data.message?.engine === "lm-studio-local" ? "LM Studio Local" : "Gemini Cloud"}.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Ops Agent chat failed.");
    } finally {
      setIsChattingAgent(false);
    }
  }

  async function handleTestLocalLlm(baseUrl: string) {
    try {
      const res = await fetch("/api/local-llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "LM Studio ping failed.");
      return data;
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "LM Studio ping failed.");
      return null;
    }
  }

  async function handleFetchWorkerPack() {
    try {
      const res = await fetch("/api/deploy/worker-pack");
      if (!res.ok) throw new Error("Could not load worker deployment pack.");
      return await res.json();
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not load worker pack.");
      return null;
    }
  }

  async function handleAnalyzeCompetitor(
    rivalTitle: string,
    rivalTranscript: string
  ): Promise<CompetitorBreakdown | null> {
    try {
      const res = await fetch("/api/ai/competitor-spy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rivalTitle, rivalTranscript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Competitor breakdown failed.");
      await handleRefreshTelemetry();
      showNotice("success", `Reverse-engineered "${data.hookFormula}".`);
      return data as CompetitorBreakdown;
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Competitor breakdown failed.");
      return null;
    }
  }

  async function handleApplyStrategyPatch(patch: StrategyRecommendation["configPatch"]) {
    if (!workspace) return;
    const nextConfig: PipelineConfig = {
      ...workspace.config,
      targetGames: workspace.config.targetGames.map((g, i) =>
        i === 0 && typeof patch.minViews === "number" ? { ...g, minViews: Math.round(patch.minViews) } : g
      ),
      qaRules: {
        ...workspace.config.qaRules,
        ...(typeof patch.maxExistingCrossPosts === "number"
          ? { maxExistingCrossPosts: Math.round(patch.maxExistingCrossPosts) }
          : {}),
      },
      layoutDefaults: {
        ...workspace.config.layoutDefaults,
        ...(typeof patch.facecamHeightPercent === "number"
          ? { facecamHeightPercent: Math.max(22, Math.min(55, Math.round(patch.facecamHeightPercent))) }
          : {}),
        ...(typeof patch.hookDurationSeconds === "number"
          ? { hookDurationSeconds: Math.max(1.5, Math.min(5, Number(patch.hookDurationSeconds.toFixed(1)))) }
          : {}),
      },
      publishing: {
        ...workspace.config.publishing,
        ...(typeof patch.maxPostsPerDay === "number"
          ? { maxPostsPerDay: Math.max(1, Math.min(48, Math.round(patch.maxPostsPerDay))) }
          : {}),
      },
    };
    await handleSaveConfig(nextConfig);
  }

  async function handleBatchApplyTemplate(payload: {
    clipIds: string[];
    template: LayoutTemplate;
    captionStyle: CaptionStylePreset;
    captionFont: CaptionFontFamily;
    captionHighlightColor: string;
    captionAutoEmoji: boolean;
    hookBannerPosition: HookBannerPosition;
    watermarkHandle?: string;
  }) {
    try {
      const res = await fetch("/api/clips/batch-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch template apply failed.");
      await loadWorkspace();
      showNotice(
        "success",
        `Applied ${payload.template} + ${payload.captionFont} + ${payload.hookBannerPosition} banner to ${data.updatedCount} clip(s).`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Batch template apply failed.");
    }
  }

  async function handleGradeHookRetention(clipId: string) {
    setIsGradingHook(true);
    try {
      const res = await fetch("/api/ai/hook-retention-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hook retention grading failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data.clip : c)) } : prev
      );
      await handleRefreshTelemetry();
      showNotice("success", `Hook Grader scored ${data.hookGrade?.overallScore ?? 0}/100 with predicted retention curve.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Hook retention grading failed.");
    } finally {
      setIsGradingHook(false);
    }
  }

  async function handleCalculateClipHealth(clipId: string) {
    setIsCalculatingHealth(true);
    try {
      const res = await fetch("/api/ai/director/clip-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Director Clip Health calculation failed.");
      if (data.workspace) {
        setWorkspace(data.workspace);
      } else if (data.clip) {
        setWorkspace((prev) =>
          prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data.clip : c)) } : prev
        );
      }
      if (data.directorRun) {
        setDirectorHistory((prev) => [data.directorRun as DirectorRunResult, ...prev.slice(0, 14)]);
      }
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `AI Director scored Clip Health: ${data.clipHealth?.overall ?? 0}/100 (${data.clipHealth?.grade || "Scored"}).`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "AI Director Clip Health calculation failed.");
    } finally {
      setIsCalculatingHealth(false);
    }
  }

  async function handlePromptSearchVod(payload: {
    vodId: string;
    query: string;
    padContextArc: boolean;
  }): Promise<VodMoment[]> {
    try {
      const res = await fetch("/api/ai/vod-prompt-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "VOD prompt search failed.");
      await handleRefreshTelemetry();
      showNotice("success", `Found ${data.moments?.length || 0} moment(s) matching "${payload.query}".`);
      return (data.moments || []) as VodMoment[];
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "VOD prompt search failed.");
      return [];
    }
  }

  async function handleBuildFacelessShort(payload: {
    topic: string;
    niche: ContentNiche;
    facelessStyle: "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop";
    sourceText: string;
  }) {
    setIsBuildingFaceless(true);
    try {
      const res = await fetch("/api/ai/faceless-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Faceless builder failed.");
      setWorkspace((prev) => (prev ? { ...prev, clips: [data.clip, ...prev.clips] } : prev));
      setSelectedClipId(data.clip.id);
      setActiveTab("studio");
      await handleRefreshTelemetry();
      showNotice("success", `Built editorial "${payload.facelessStyle}" short and opened Studio.`);
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Faceless builder failed.");
    } finally {
      setIsBuildingFaceless(false);
    }
  }

  async function handleDryRunSyndication(ruleId: string) {
    try {
      const res = await fetch("/api/syndication/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Syndication pre-flight audit failed.");
      showNotice("success", data.summary || "Syndication Pre-Flight audit completed.");
      return data;
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Syndication pre-flight audit failed.");
      return null;
    }
  }

  async function handleScanViralSentiment(niche: ContentNiche, topicQuery?: string) {
    setIsScanningSentiment(true);
    try {
      const res = await fetch("/api/ai/viral-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, topicQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Viral Sentiment scrape failed.");
      setWorkspace((prev) => (prev ? { ...prev, viralSentiment: data.viralSentiment } : prev));
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Scraped live audience sentiment for ${niche} (${data.viralSentiment.overallPositivePct}% positive across ${data.viralSentiment.styleScores.length} editing styles).`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Viral Sentiment scrape failed.");
    } finally {
      setIsScanningSentiment(false);
    }
  }

  async function handleApplySentimentToDirector() {
    setIsApplyingSentiment(true);
    try {
      const res = await fetch("/api/ai/viral-sentiment/apply-director", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sync sentiment to AI Director.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              viralSentiment: data.viralSentiment,
              config: data.config || prev.config,
              agentMessages: data.agentMessages || prev.agentMessages,
              selfLearning: data.selfLearning || prev.selfLearning,
            }
          : prev
      );
      showNotice("success", "Synced audience editing-style sentiment feedback to AI Director & Self-Learning rules.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not sync sentiment feedback.");
    } finally {
      setIsApplyingSentiment(false);
    }
  }

  async function handleDiscoverAssets(payload: {
    query: string;
    niche: ContentNiche | "all";
    filter: "all" | DiscoveredAssetType;
  }) {
    setIsDiscoveringAssets(true);
    try {
      const res = await fetch("/api/ai/asset-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Asset discovery search failed.");
      setWorkspace((prev) => (prev ? { ...prev, assetDiscovery: data.assetDiscovery } : prev));
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Discovered ${data.assetDiscovery.assets.length} public domain stock & meme template assets.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Asset discovery search failed.");
    } finally {
      setIsDiscoveringAssets(false);
    }
  }

  async function handleSaveAsset(asset: DiscoveredAsset) {
    try {
      const res = await fetch("/api/assets/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save asset.");
      setWorkspace((prev) => (prev ? { ...prev, savedAssets: data.savedAssets } : prev));
      showNotice("success", `Saved "${asset.title}" to Asset Vault.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to save asset.");
    }
  }

  async function handleRemoveSavedAsset(assetId: string) {
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove saved asset.");
      setWorkspace((prev) => (prev ? { ...prev, savedAssets: data.savedAssets } : prev));
      showNotice("success", "Removed asset from vault.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to remove saved asset.");
    }
  }

  async function handleAutoInjectAsset(
    clipId: string,
    payload: { asset?: DiscoveredAsset; assetId?: string; mode?: "single" | "auto-blend-pack" }
  ) {
    setIsInjectingAsset(true);
    try {
      const res = await fetch(`/api/clips/${encodeURIComponent(clipId)}/auto-inject-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-inject failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, clips: prev.clips.map((c) => (c.id === clipId ? data.clip : c)) } : prev
      );
      showNotice(
        "success",
        `Auto-injected ${data.injectedCount} asset cue(s) + transition SFX seamlessly into "${data.clip.title}".`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Auto-inject failed.");
    } finally {
      setIsInjectingAsset(false);
    }
  }

  async function handleUpdateMonetizationPlan(patch: Partial<MonetizationPlan>) {
    try {
      const res = await fetch("/api/monetization/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update monetization plan.");
      setWorkspace((prev) => (prev ? { ...prev, monetizationPlan: data.monetizationPlan } : prev));
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not update monetization plan.");
    }
  }

  async function handleOptimizeMonetization() {
    setIsOptimizingMonetization(true);
    try {
      const res = await fetch("/api/ai/monetization/optimize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Monetization Playbook failed.");
      setWorkspace((prev) => (prev ? { ...prev, monetizationPlan: data.monetizationPlan } : prev));
      await handleRefreshTelemetry();
      showNotice("success", "Generated AI Monetization Playbook, Sponsor Pitch & Funnel CTAs.");
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "AI Monetization Playbook failed.");
    } finally {
      setIsOptimizingMonetization(false);
    }
  }

  async function handleUpdateSelfLearnConfig(patch: {
    enabled?: boolean;
    cadence?: SelfLearningCadence;
    autoAdoptSafeUpgrades?: boolean;
    focusAreas?: LearningDiscoveryType[];
  }) {
    try {
      const res = await fetch("/api/self-learn/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update learning schedule.");
      setWorkspace((prev) => (prev ? { ...prev, selfLearning: data.selfLearning } : prev));
      showNotice("success", "Updated scheduled self-research cadence.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Failed to update learning schedule.");
    }
  }

  async function handleRunSelfLearningCycle(customFocus?: string) {
    setIsRunningSelfLearn(true);
    try {
      const res = await fetch("/api/ai/self-learn/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFocus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Self-learning research cycle failed.");
      setWorkspace((prev) => (prev ? { ...prev, selfLearning: data.selfLearning } : prev));
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Completed Self-Learning Cycle #${data.selfLearning.totalCyclesRun}: surfaced fresh platform, source & monetization upgrades.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Self-learning cycle failed.");
    } finally {
      setIsRunningSelfLearn(false);
    }
  }

  async function handleAdoptDiscovery(discoveryId: string) {
    setAdoptingDiscoveryId(discoveryId);
    try {
      const res = await fetch("/api/ai/self-learn/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoveryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not adopt upgrade.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              selfLearning: data.selfLearning,
              config: data.config || prev.config,
              monetizationPlan: data.monetizationPlan || prev.monetizationPlan,
              agentMessages: data.agentMessages || prev.agentMessages,
            }
          : prev
      );
      showNotice("success", data.summary || "Adopted self-learning upgrade into ClipForge.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not adopt upgrade.");
    } finally {
      setAdoptingDiscoveryId(null);
    }
  }

  async function handleProjectRevenue(payload?: { horizonMonths?: number; dailyPostsTarget?: number }) {
    setIsProjectingRevenue(true);
    try {
      const res = await fetch("/api/ai/monetization/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Revenue projection failed.");
      setWorkspace((prev) =>
        prev ? { ...prev, monetizationPlan: data.monetizationPlan } : prev
      );
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Projected ${data.revenueProjection.horizonMonths}-month revenue using live CPM trends ($${data.revenueProjection.projectedMonth6BaseUsd.toLocaleString()}/mo Base Case).`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Revenue projection failed.");
    } finally {
      setIsProjectingRevenue(false);
    }
  }

  async function handleUpdateKnowledgeConfig(patch: {
    enabled?: boolean;
    cadence?: KnowledgeCrawlCadence;
    autoDraftOpportunities?: boolean;
    feeds?: KnowledgeSourceFeed[];
  }) {
    try {
      const res = await fetch("/api/knowledge/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update Knowledge Acquisition config.");
      setWorkspace((prev) => (prev ? { ...prev, knowledgeAcquisition: data.knowledgeAcquisition } : prev));
      showNotice("success", "Updated recurring Knowledge Acquisition crawler schedule & feeds.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not update Knowledge Acquisition config.");
    }
  }

  async function handleRunKnowledgeCrawl(customTopic?: string) {
    setIsCrawlingKnowledge(true);
    try {
      const res = await fetch("/api/ai/knowledge/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Knowledge Acquisition crawl failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              knowledgeAcquisition: data.knowledgeAcquisition,
              researchOpportunities: data.researchOpportunities || prev.researchOpportunities,
            }
          : prev
      );
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Crawled creator newsletters & AI-tool updates: auto-drafted ${data.drafted?.length || 3} new Opportunity card(s) in Ingest.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Knowledge Acquisition crawl failed.");
    } finally {
      setIsCrawlingKnowledge(false);
    }
  }

  async function handleUpdateExpansionConfig(patch: {
    autoSyncToDistribution?: boolean;
    autoTargetMinScore?: number;
    focusNiche?: ContentNiche | "all";
  }) {
    try {
      const res = await fetch("/api/expansion/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update Platform Expansion config.");
      setWorkspace((prev) => (prev ? { ...prev, platformExpansion: data.platformExpansion } : prev));
      showNotice("success", "Updated Platform Expansion auto-sync settings.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not update Platform Expansion config.");
    }
  }

  async function handleResearchExpansion(payload: {
    focusNiche?: ContentNiche | "all";
    customQuery?: string;
    autoApplyNow?: boolean;
  }) {
    setIsResearchingExpansion(true);
    try {
      const res = await fetch("/api/ai/expansion/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Secondary platform research failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              platformExpansion: data.platformExpansion,
              config: data.config || prev.config,
            }
          : prev
      );
      await handleRefreshTelemetry();
      const applied = Array.isArray(data.autoAppliedPlatforms) ? data.autoAppliedPlatforms : [];
      showNotice(
        "success",
        applied.length > 0
          ? `Researched ${data.platformExpansion?.patterns?.length || 0} secondary formats and auto-targeted ${applied.join(", ")} in Distribution Config.`
          : `Researched ${data.platformExpansion?.patterns?.length || 0} viral growth patterns across secondary platforms.`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Secondary platform research failed.");
    } finally {
      setIsResearchingExpansion(false);
    }
  }

  async function handleApplyExpansionPattern(payload: {
    patternId?: string;
    applyAllHighScore?: boolean;
  }) {
    setApplyingPatternId(payload.applyAllHighScore ? "__bulk__" : payload.patternId || "__single__");
    try {
      const res = await fetch("/api/expansion/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not apply platform expansion to Distribution Config.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              config: data.config || prev.config,
              platformExpansion: data.platformExpansion || prev.platformExpansion,
            }
          : prev
      );
      showNotice("success", data.summary || "Updated Distribution Config with secondary platform target.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not update Distribution Config.");
    } finally {
      setApplyingPatternId(null);
    }
  }

  async function handleRemoveExpansionPlatform(platform: SocialPlatform) {
    setRemovingPlatform(platform);
    try {
      const res = await fetch("/api/expansion/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove secondary platform.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              config: data.config || prev.config,
              platformExpansion: data.platformExpansion || prev.platformExpansion,
            }
          : prev
      );
      showNotice("success", data.summary || `Removed ${platform} from Distribution Config.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not remove secondary platform.");
    } finally {
      setRemovingPlatform(null);
    }
  }

  async function handleApplyRecommendedCadence(patch: {
    scheduleCron: string;
    maxPostsPerDay: number;
    minSpacingMinutes: number;
    staggerJitterMinutes: number;
    summary: string;
  }) {
    if (!workspace) return;
    const nextConfig: PipelineConfig = {
      ...workspace.config,
      scheduleCron: patch.scheduleCron,
      publishing: {
        ...workspace.config.publishing,
        maxPostsPerDay: patch.maxPostsPerDay,
        minSpacingMinutes: patch.minSpacingMinutes,
        staggerJitterMinutes: patch.staggerJitterMinutes,
      },
    };
    await handleSaveConfig(nextConfig);
    showNotice("success", patch.summary);
  }

  async function handleRunAbTestAnalysis(payload: {
    focusNiche?: ContentNiche | "all";
    experimentGoal?: string;
  }) {
    setIsAnalyzingAbTest(true);
    try {
      const res = await fetch("/api/ai/ab-test/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "A/B Test analysis failed.");
      setWorkspace((prev) => (prev ? { ...prev, abTestAnalysis: data.abTestAnalysis } : prev));
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `Gemini A/B Test winner identified: ${data.abTestAnalysis?.winnerLabel || "Top Variant"} (${data.abTestAnalysis?.confidencePct || 92}% confidence).`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "A/B Test analysis failed.");
    } finally {
      setIsAnalyzingAbTest(false);
    }
  }

  async function handleBakeAbWinnerToConfig() {
    setIsBakingWinner(true);
    try {
      const res = await fetch("/api/ab-test/bake-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not bake Winner into Pipeline config.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              config: data.config || prev.config,
              abTestAnalysis: data.abTestAnalysis || prev.abTestAnalysis,
            }
          : prev
      );
      showNotice("success", data.summary || "Baked A/B Test Winner into default Pipeline configuration.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not bake Winner into Pipeline config.");
    } finally {
      setIsBakingWinner(false);
    }
  }

  async function handleAddFunnelVariant(payload: {
    label: string;
    placement: CtaPlacementType;
    triggerSecond: number;
    ctaCopy: string;
    sponsorBrand: string;
    niche: ContentNiche;
    impressions: number;
    ctrPct: number;
    conversionRatePct: number;
    retentionImpactPct: number;
    avgDealValueUsd: number;
  }) {
    try {
      const res = await fetch("/api/monetization/funnel-tests/variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add CTA funnel variant.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              monetizationPlan: prev.monetizationPlan
                ? { ...prev.monetizationPlan, funnelTest: data.funnelTest }
                : prev.monetizationPlan,
            }
          : prev
      );
      showNotice("success", `Added CTA funnel variant "${payload.label}".`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not add CTA funnel variant.");
    }
  }

  async function handleAnalyzeFunnel(focusSponsor?: string) {
    setIsAnalyzingFunnel(true);
    try {
      const res = await fetch("/api/ai/monetization/funnel-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusSponsor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Funnel analysis failed.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              monetizationPlan: prev.monetizationPlan
                ? { ...prev.monetizationPlan, funnelTest: data.funnelTest }
                : prev.monetizationPlan,
              computeRouting: data.computeRouting || prev.computeRouting,
            }
          : prev
      );
      await handleRefreshTelemetry();
      showNotice(
        "success",
        `CTA Funnel Winner: ${data.funnelTest?.winnerLabel || "Top Placement"} (${data.funnelTest?.confidencePct || 93}% confidence).`
      );
    } catch (err) {
      await handleRefreshTelemetry();
      showNotice("error", err instanceof Error ? err.message : "Funnel analysis failed.");
    } finally {
      setIsAnalyzingFunnel(false);
    }
  }

  async function handleApplyFunnelWinner() {
    setIsApplyingFunnelWinner(true);
    try {
      const res = await fetch("/api/monetization/funnel-tests/apply-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not apply winning CTA placement.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              config: data.config || prev.config,
              clips: data.clips || prev.clips,
              monetizationPlan: prev.monetizationPlan
                ? { ...prev.monetizationPlan, funnelTest: data.funnelTest || prev.monetizationPlan.funnelTest }
                : prev.monetizationPlan,
            }
          : prev
      );
      showNotice("success", data.summary || "Applied winning CTA placement to Brand Kit & active clips.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not apply winning CTA placement.");
    } finally {
      setIsApplyingFunnelWinner(false);
    }
  }

  async function handleScanRevenueAlerts(sponsorConvRatePct: number, sponsorAvgOrderUsd: number) {
    setIsScanningAlerts(true);
    try {
      const res = await fetch("/api/performance/revenue-alerts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorConvRatePct, sponsorAvgOrderUsd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Revenue alert scan failed.");
      setWorkspace((prev) => (prev ? { ...prev, revenueAlerts: data.revenueAlerts || [] } : prev));
      showNotice(
        "success",
        data.summary || `ROI scan complete — ${data.newAlertsCount || 0} new +15% surge alert(s) detected.`
      );
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Revenue alert scan failed.");
    } finally {
      setIsScanningAlerts(false);
    }
  }

  async function handleShiftAlertFocus(alertId: string) {
    setShiftingAlertId(alertId);
    try {
      const res = await fetch(`/api/performance/revenue-alerts/${encodeURIComponent(alertId)}/shift-focus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not shift AI Director focus.");
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              config: data.config || prev.config,
              revenueAlerts: data.revenueAlerts || prev.revenueAlerts,
            }
          : prev
      );
      showNotice("success", data.summary || "Shifted AI Director focus to surging ROI niche.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not shift AI Director focus.");
    } finally {
      setShiftingAlertId(null);
    }
  }

  async function handleDismissRevenueAlert(alertId: string) {
    try {
      const res = await fetch(`/api/performance/revenue-alerts/${encodeURIComponent(alertId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not dismiss alert.");
      setWorkspace((prev) => (prev ? { ...prev, revenueAlerts: data.revenueAlerts || prev.revenueAlerts } : prev));
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not dismiss alert.");
    }
  }

  async function handleUpdateComputeRouting(patch: {
    activeTier?: AiComputeTierId;
    hostingStage?: HostingStageId;
    monthlyBudgetCapUsd?: number;
    autoDowngradeOnBudgetCap?: boolean;
    windowsPcEndpoint?: string;
    windowsPcModel?: string;
    topUpCredits?: number;
    resetSpend?: boolean;
  }) {
    try {
      const res = await fetch("/api/compute/routing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update compute routing.");
      setWorkspace((prev) => (prev ? { ...prev, computeRouting: data.computeRouting } : prev));
      showNotice("success", "Updated AI compute tier, credits, and hosting stage.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Could not update compute routing.");
    }
  }

  function handleSyncComputeRouting(routing: AiComputeRoutingConfig) {
    setWorkspace((prev) => (prev ? { ...prev, computeRouting: routing } : prev));
  }

  async function handleApplyTranscriptToClip(clipId: string, transcript: string) {
    await handleUpdateClip(clipId, { transcript });
    showNotice("success", "Applied transcribed audio text directly to clip captions.");
  }

  async function handleLogout() {
    try {
      if (authToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch {
      // Clear local session state regardless of network response
    }
    setAuthToken(null);
    setAuthUser(null);
    showNotice("success", "Signed out of your workspace account.");
  }

  const resolvedHotkeys = useMemo(
    () => resolveHotkeys(workspace?.config.hotkeys),
    [workspace?.config.hotkeys]
  );

  const slangDictionary = useMemo(
    () =>
      workspace?.config.slangDictionary && workspace.config.slangDictionary.length > 0
        ? workspace.config.slangDictionary
        : DEFAULT_SLANG_DICTIONARY,
    [workspace?.config.slangDictionary]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0A0B0E] text-[#0F172A] dark:text-[#F1F5F9]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        uiMode={uiMode}
        onToggleUiMode={handleToggleUiMode}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenCommandBar={() => setCommandBarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        authUser={authUser}
        onRunPipeline={() => handleDispatchPipeline(true)}
        isRunningPipeline={isRunningPipeline}
        pendingCount={counts.pendingQa}
        readyCount={counts.readyToPublish}
        activeAlertCount={counts.activeAlerts}
      />

      {notice && (
        <div
          role="status"
          className={`px-4 sm:px-6 py-2 border-b text-xs flex items-center justify-between gap-3 ${
            notice.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {notice.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{notice.message}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-0">
        {loading || !workspace ? (
          <div className="flex-1 flex items-center justify-center p-12 text-xs font-mono text-slate-500">
            LOADING CLIPFORGE STUDIO...
          </div>
        ) : (
          <>
            {activeTab === "studio" && (
              <VerticalStudioView
                clips={workspace.clips}
                selectedClipId={selectedClipId}
                uiMode={uiMode}
                hotkeys={resolvedHotkeys}
                slangDictionary={slangDictionary}
                onSelectClip={setSelectedClipId}
                onUpdateClip={handleUpdateClip}
                onAuditClip={handleAuditClip}
                onGenerateHooks={handleGenerateHooks}
                onGradeHookRetention={handleGradeHookRetention}
                onCalculateClipHealth={handleCalculateClipHealth}
                onSuggestBroll={handleSuggestBroll}
                onTranslateClip={handleTranslateClip}
                onGenerateVoiceover={handleGenerateVoiceover}
                onDraftVoiceoverScript={handleDraftVoiceoverScript}
                auditingClipId={auditingClipId}
                generatingHooksClipId={generatingHooksClipId}
                isGradingHook={isGradingHook}
                isCalculatingHealth={isCalculatingHealth}
                isSuggestingBroll={isSuggestingBroll}
                isGeneratingVoiceover={isGeneratingVoiceover}
                isDraftingScript={isDraftingScript}
                translatingLocale={translatingLocale}
                onSendToQueue={async (id) => {
                  await handleUpdateClip(id, { publishStatus: "ready" });
                  setActiveTab("distribution");
                }}
                onOpenSettings={() => setSettingsOpen(true)}
                onSwitchToAdvanced={() => handleToggleUiMode("advanced")}
                onNotify={showNotice}
              />
            )}

            {activeTab === "ingest" && (
              <IngestDeck
                clips={workspace.clips}
                config={workspace.config}
                uiMode={uiMode}
                researchOpportunities={workspace.researchOpportunities || []}
                opportunityDiscovery={workspace.opportunityDiscovery}
                knowledgeAcquisition={workspace.knowledgeAcquisition}
                isResearching={isResearching}
                isDiscoveringOpportunities={isDiscoveringOpportunities}
                isCrawlingKnowledge={isCrawlingKnowledge}
                isBuildingFaceless={isBuildingFaceless}
                selectedClipId={selectedClipId}
                auditingClipId={auditingClipId}
                generatingHooksClipId={generatingHooksClipId}
                isScanning={isScanning}
                isBatchRunning={isBatchRunning}
                onSelectClip={setSelectedClipId}
                onScanRadar={handleScanRadar}
                onRunResearch={handleRunResearch}
                onRunOpportunityDiscovery={handleRunOpportunityDiscovery}
                onCreateClipFromDiscoveredTopic={handleCreateClipFromDiscoveredTopic}
                onSaveDiscoveredTopicToResearch={handleSaveDiscoveredTopicToResearch}
                onUpdateKnowledgeConfig={handleUpdateKnowledgeConfig}
                onRunKnowledgeCrawl={handleRunKnowledgeCrawl}
                onCreateClipFromOpportunity={handleCreateClipFromOpportunity}
                onBuildFacelessShort={handleBuildFacelessShort}
                onAuditClip={handleAuditClip}
                onGenerateHooks={handleGenerateHooks}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
                onBatchAction={handleBatchAction}
                onAddClip={handleAddClip}
                onDeleteClip={handleDeleteClip}
                onUpdateStreamerPolicies={handleUpdateStreamerPolicies}
                onNotify={showNotice}
              />
            )}

            {activeTab === "vod" && (
              <VodHighlightsDeck
                vodSessions={workspace.vodSessions || []}
                clips={workspace.clips}
                onAnalyzeVod={handleAnalyzeVod}
                onPromptSearchVod={handlePromptSearchVod}
                onExtractMoment={handleExtractVodMoment}
                isAnalyzingVod={isAnalyzingVod}
              />
            )}

            {activeTab === "templates" && (
              <TemplatesBrollDeck
                clips={workspace.clips}
                selectedClipId={selectedClipId}
                config={workspace.config}
                discoveredAssets={workspace.assetDiscovery?.assets || []}
                savedAssets={workspace.savedAssets || []}
                isInjectingAsset={isInjectingAsset}
                onSelectClip={setSelectedClipId}
                onUpdateClip={handleUpdateClip}
                onBatchApplyTemplate={handleBatchApplyTemplate}
                onSaveConfig={handleSaveConfig}
                onSuggestBroll={handleSuggestBroll}
                onAutoInjectAsset={handleAutoInjectAsset}
                onOpenAssetDiscovery={() => setActiveTab("assets")}
                isSuggestingBroll={isSuggestingBroll}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
              />
            )}

            {activeTab === "assets" && (
              <AssetDiscoveryView
                clips={workspace.clips}
                selectedClipId={selectedClipId}
                assetDiscovery={workspace.assetDiscovery}
                savedAssets={workspace.savedAssets || []}
                isDiscoveringAssets={isDiscoveringAssets}
                isInjectingAsset={isInjectingAsset}
                onSelectClip={setSelectedClipId}
                onDiscoverAssets={handleDiscoverAssets}
                onSaveAsset={handleSaveAsset}
                onRemoveSavedAsset={handleRemoveSavedAsset}
                onAutoInjectAsset={handleAutoInjectAsset}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
                onJumpToTemplates={() => setActiveTab("templates")}
              />
            )}

            {activeTab === "ai-lab" && (
              <MultimodalAiLabView
                clips={workspace.clips}
                selectedClipId={selectedClipId}
                computeRouting={workspace.computeRouting}
                onSyncComputeRouting={handleSyncComputeRouting}
                onApplyTranscriptToClip={handleApplyTranscriptToClip}
                onJumpToComputeHub={() => {
                  setAutopilotSubTab("compute");
                  setActiveTab("autopilot");
                }}
                onNotify={showNotice}
              />
            )}

            {activeTab === "distribution" && (
              <DistributionDeck
                clips={workspace.clips}
                config={workspace.config}
                recommendation={recommendation}
                isOptimizing={isOptimizing}
                isAutoScheduling={isAutoScheduling}
                onUpdateClip={handleUpdateClip}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
                onUpdateChannelFleet={handleUpdateChannelFleet}
                onSaveConfig={handleSaveConfig}
                onDryRunSyndication={handleDryRunSyndication}
                onRunOptimizer={handleRunOptimizer}
                onAutoScheduleFleet={handleAutoScheduleFleet}
                onApplyStrategyPatch={handleApplyStrategyPatch}
                onNotify={showNotice}
              />
            )}

            {activeTab === "autopilot" && (
              <AiDirectorDeck
                key={autopilotSubTab}
                config={workspace.config}
                uiMode={uiMode}
                directorHistory={directorHistory}
                agentMessages={workspace.agentMessages || []}
                trendPulse={workspace.trendPulse}
                activeMission={workspace.activeMission}
                industryNews={workspace.industryNews}
                monetizationPlan={workspace.monetizationPlan}
                selfLearning={workspace.selfLearning}
                knowledgeAcquisition={workspace.knowledgeAcquisition}
                platformExpansion={workspace.platformExpansion}
                computeRouting={workspace.computeRouting}
                initialSubTab={autopilotSubTab}
                isStartingMission={isStartingMission}
                isAdvancingMission={isAdvancingMission}
                isScanningNews={isScanningNews}
                isOptimizingMonetization={isOptimizingMonetization}
                isProjectingRevenue={isProjectingRevenue}
                isAnalyzingFunnel={isAnalyzingFunnel}
                isApplyingFunnelWinner={isApplyingFunnelWinner}
                isRunningSelfLearn={isRunningSelfLearn}
                isCrawlingKnowledge={isCrawlingKnowledge}
                adoptingDiscoveryId={adoptingDiscoveryId}
                isResearchingExpansion={isResearchingExpansion}
                applyingPatternId={applyingPatternId}
                removingPlatform={removingPlatform}
                isFetchingTrends={isFetchingTrends}
                isDirecting={isDirecting}
                isChattingAgent={isChattingAgent}
                onStartMission={handleStartMission}
                onAdvanceMission={handleAdvanceMission}
                onUpdateMissionConfig={handleUpdateMissionConfig}
                onScanIndustryNews={handleScanIndustryNews}
                onFeedNewsToAgent={handleFeedNewsToAgent}
                onUpdateMonetizationPlan={handleUpdateMonetizationPlan}
                onOptimizeMonetization={handleOptimizeMonetization}
                onProjectRevenue={handleProjectRevenue}
                onAddFunnelVariant={handleAddFunnelVariant}
                onAnalyzeFunnel={handleAnalyzeFunnel}
                onApplyFunnelWinner={handleApplyFunnelWinner}
                onUpdateComputeRouting={handleUpdateComputeRouting}
                onUpdateSelfLearnConfig={handleUpdateSelfLearnConfig}
                onRunSelfLearningCycle={handleRunSelfLearningCycle}
                onAdoptDiscovery={handleAdoptDiscovery}
                onRunKnowledgeCrawl={handleRunKnowledgeCrawl}
                onOpenIngestOpportunities={() => setActiveTab("ingest")}
                onUpdateExpansionConfig={handleUpdateExpansionConfig}
                onResearchExpansion={handleResearchExpansion}
                onApplyExpansionPattern={handleApplyExpansionPattern}
                onRemoveExpansionPlatform={handleRemoveExpansionPlatform}
                onOpenDistributionTab={() => setActiveTab("distribution")}
                onOpenClipInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
                onFetchTrends={handleFetchTrends}
                onToggleTrendPin={handleToggleTrendPin}
                onTrackTrendGame={handleTrackTrendGame}
                onExecuteDirector={handleExecuteDirector}
                onSendAgentMessage={handleSendAgentMessage}
                onSaveConfig={handleSaveConfig}
                onAnalyzeCompetitor={handleAnalyzeCompetitor}
                onTestLocalLlm={handleTestLocalLlm}
                onFetchWorkerPack={handleFetchWorkerPack}
              />
            )}

            {activeTab === "performance" && (
              <PerformanceMonitorView
                clips={workspace.clips}
                config={workspace.config}
                uiMode={uiMode}
                monetizationPlan={workspace.monetizationPlan}
                abTestAnalysis={workspace.abTestAnalysis}
                revenueAlerts={workspace.revenueAlerts || []}
                viralSentiment={workspace.viralSentiment}
                isScanningSentiment={isScanningSentiment}
                isApplyingSentiment={isApplyingSentiment}
                isAnalyzingAbTest={isAnalyzingAbTest}
                isBakingWinner={isBakingWinner}
                isScanningAlerts={isScanningAlerts}
                shiftingAlertId={shiftingAlertId}
                isGeneratingSeoFor={isGeneratingSeoFor}
                onGenerateSeo={handleGenerateSeo}
                onScanViralSentiment={handleScanViralSentiment}
                onApplySentimentToDirector={handleApplySentimentToDirector}
                onApplyRecommendedCadence={handleApplyRecommendedCadence}
                onRunAbTestAnalysis={handleRunAbTestAnalysis}
                onBakeAbWinnerToConfig={handleBakeAbWinnerToConfig}
                onScanRevenueAlerts={handleScanRevenueAlerts}
                onShiftAlertFocus={handleShiftAlertFocus}
                onDismissRevenueAlert={handleDismissRevenueAlert}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
                onAskAgent={async (prompt) => {
                  setAutopilotSubTab("agent");
                  setActiveTab("autopilot");
                  await handleSendAgentMessage(prompt);
                }}
                onLaunchMissionForNiche={async (nicheLabel) => {
                  setAutopilotSubTab("mission");
                  setActiveTab("autopilot");
                  await handleStartMission({
                    prompt: `Give me the top 10 highest-ROI viral short-form video ideas in ${nicheLabel} based on our Revenue Attribution matrix`,
                    nicheFocus: nicheLabel,
                    autonomyMode: "approval-gates",
                    scheduleCadence: "daily-0900",
                  });
                }}
                onOpenMonetizationHub={() => {
                  setAutopilotSubTab("monetization");
                  setActiveTab("autopilot");
                }}
              />
            )}

            {activeTab === "gitops" && (
              <GitOpsView
                config={workspace.config}
                runs={workspace.runs}
                telemetry={workspace.telemetry || []}
                integrations={workspace.integrations}
                onSaveConfig={handleSaveConfig}
                onDispatchPipeline={handleDispatchPipeline}
                onRefreshTelemetry={handleRefreshTelemetry}
                isRunningPipeline={isRunningPipeline}
              />
            )}

            {activeTab === "guide" && (
              <PresentationDeck
                clips={workspace.clips}
                config={workspace.config}
                telemetry={workspace.telemetry || []}
                onJumpToTab={setActiveTab}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
          </>
        )}
      </main>

      <AiCommandBar
        open={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        clips={workspace?.clips || []}
        isDirecting={isDirecting}
        onSelectTab={setActiveTab}
        onSelectClip={(id) => {
          setSelectedClipId(id);
          setActiveTab("studio");
        }}
        onExecuteDirector={handleExecuteDirector}
      />

      {workspace && (
        <SettingsHotkeysModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          config={workspace.config}
          onSaveConfig={handleSaveConfig}
        />
      )}

      <AuthAccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={authUser}
        supabaseConfigured={supabaseConfigured}
        onAuthSuccess={(token, user) => {
          setAuthToken(token);
          setAuthUser(user);
          showNotice("success", `Signed in as ${user.displayName} (${user.email}).`);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
