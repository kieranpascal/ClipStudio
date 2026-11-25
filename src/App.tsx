import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type {
  ChannelAccount,
  ClipItem,
  CompetitorBreakdown,
  DirectorRunResult,
  PipelineConfig,
  StrategyRecommendation,
  StreamerPolicyEntry,
  SupportedLocale,
  WorkspaceState,
  WorkspaceTab,
} from "./types";
import { TopBar } from "./components/TopBar";
import { IngestDeck } from "./components/IngestDeck";
import { VerticalStudioView } from "./components/VerticalStudioView";
import { VodHighlightsDeck } from "./components/VodHighlightsDeck";
import { TemplatesBrollDeck } from "./components/TemplatesBrollDeck";
import { DistributionDeck } from "./components/DistributionDeck";
import { AiDirectorDeck } from "./components/AiDirectorDeck";
import { GitOpsView } from "./components/GitOpsView";
import { PresentationDeck } from "./components/PresentationDeck";
import { AiCommandBar } from "./components/AiCommandBar";

interface Notice {
  type: "success" | "error";
  message: string;
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("studio");
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isDark, setIsDark] = useState(true);
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  const [auditingClipId, setAuditingClipId] = useState<string | null>(null);
  const [generatingHooksClipId, setGeneratingHooksClipId] = useState<string | null>(null);
  const [isSuggestingBroll, setIsSuggestingBroll] = useState(false);
  const [translatingLocale, setTranslatingLocale] = useState<SupportedLocale | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isAnalyzingVod, setIsAnalyzingVod] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [directorHistory, setDirectorHistory] = useState<DirectorRunResult[]>([]);
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

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
  }, []);

  const counts = useMemo(() => {
    const clips = workspace?.clips || [];
    return {
      pendingQa: clips.filter((c) => c.qaStatus === "pending").length,
      readyToPublish: clips.filter((c) => c.publishStatus === "ready" || c.publishStatus === "scheduled").length,
    };
  }, [workspace?.clips]);

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
    sourcePlatform: "Twitch" | "Kick" | "YouTube Live";
    sourceUrl: string;
    gameCategory: string;
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0A0B0E] text-[#0F172A] dark:text-[#F1F5F9]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenCommandBar={() => setCommandBarOpen(true)}
        onRunPipeline={() => handleDispatchPipeline(true)}
        isRunningPipeline={isRunningPipeline}
        pendingCount={counts.pendingQa}
        readyCount={counts.readyToPublish}
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
                onSelectClip={setSelectedClipId}
                onUpdateClip={handleUpdateClip}
                onAuditClip={handleAuditClip}
                onGenerateHooks={handleGenerateHooks}
                onSuggestBroll={handleSuggestBroll}
                onTranslateClip={handleTranslateClip}
                auditingClipId={auditingClipId}
                generatingHooksClipId={generatingHooksClipId}
                isSuggestingBroll={isSuggestingBroll}
                translatingLocale={translatingLocale}
                onSendToQueue={async (id) => {
                  await handleUpdateClip(id, { publishStatus: "ready" });
                  setActiveTab("distribution");
                }}
              />
            )}

            {activeTab === "ingest" && (
              <IngestDeck
                clips={workspace.clips}
                config={workspace.config}
                selectedClipId={selectedClipId}
                auditingClipId={auditingClipId}
                generatingHooksClipId={generatingHooksClipId}
                isScanning={isScanning}
                isBatchRunning={isBatchRunning}
                onSelectClip={setSelectedClipId}
                onScanRadar={handleScanRadar}
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
                onExtractMoment={handleExtractVodMoment}
                isAnalyzingVod={isAnalyzingVod}
              />
            )}

            {activeTab === "templates" && (
              <TemplatesBrollDeck
                clips={workspace.clips}
                selectedClipId={selectedClipId}
                config={workspace.config}
                onSelectClip={setSelectedClipId}
                onUpdateClip={handleUpdateClip}
                onSaveConfig={handleSaveConfig}
                onSuggestBroll={handleSuggestBroll}
                isSuggestingBroll={isSuggestingBroll}
                onOpenInStudio={(id) => {
                  setSelectedClipId(id);
                  setActiveTab("studio");
                }}
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
                onRunOptimizer={handleRunOptimizer}
                onAutoScheduleFleet={handleAutoScheduleFleet}
                onApplyStrategyPatch={handleApplyStrategyPatch}
                onNotify={showNotice}
              />
            )}

            {activeTab === "autopilot" && (
              <AiDirectorDeck
                config={workspace.config}
                directorHistory={directorHistory}
                isDirecting={isDirecting}
                onExecuteDirector={handleExecuteDirector}
                onSaveConfig={handleSaveConfig}
                onAnalyzeCompetitor={handleAnalyzeCompetitor}
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
    </div>
  );
}
