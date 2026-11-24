import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type {
  ClipItem,
  PipelineConfig,
  StrategyRecommendation,
  WorkspaceState,
  WorkspaceTab,
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ClipRadarView } from "./components/ClipRadarView";
import { VerticalStudioView } from "./components/VerticalStudioView";
import { GitOpsView } from "./components/GitOpsView";
import { RevenueFeedbackView } from "./components/RevenueFeedbackView";
import { PublishQueueView } from "./components/PublishQueueView";

interface Notice {
  type: "success" | "error";
  message: string;
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("radar");
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isDark, setIsDark] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [auditingClipId, setAuditingClipId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Keep <html class="dark"> synced with theme state
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

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

  useEffect(() => {
    loadWorkspace();
  }, []);

  const counts = useMemo(() => {
    const clips = workspace?.clips || [];
    return {
      pendingQa: clips.filter((c) => c.qaStatus === "pending").length,
      readyToPublish: clips.filter((c) => c.publishStatus === "ready" || c.publishStatus === "scheduled").length,
      publishedCount: clips.filter((c) => c.publishStatus === "published").length,
    };
  }, [workspace?.clips]);

  const activeClip = useMemo(
    () => workspace?.clips.find((c) => c.id === selectedClipId) || workspace?.clips[0],
    [workspace?.clips, selectedClipId]
  );

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
    showNotice("success", `Added "${data.title}" to Clip Radar.`);
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
      prev
        ? {
            ...prev,
            clips: prev.clips.map((c) => (c.id === clipId ? data : c)),
          }
        : prev
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
    showNotice("success", "Removed clip from radar.");
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
        prev
          ? {
              ...prev,
              clips: prev.clips.map((c) => (c.id === clipId ? data : c)),
            }
          : prev
      );
      showNotice("success", `Gemini QA completed: marked as ${data.qaStatus}.`);
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Gemini QA audit failed.");
    } finally {
      setAuditingClipId(null);
    }
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
    showNotice("success", data.message || "Saved pipeline.config.json.");
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
      if (!res.ok) throw new Error(data.error || "Pipeline execution failed.");
      await loadWorkspace();
      showNotice("success", data.run?.summary || "Pipeline execution completed.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Pipeline execution failed.");
    } finally {
      setIsRunningPipeline(false);
    }
  }

  async function handleRunOptimizer() {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/optimize-strategy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Strategy optimizer failed.");
      setRecommendation(data);
      showNotice("success", "Gemini strategy analysis ready.");
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "Strategy optimizer failed.");
    } finally {
      setIsOptimizing(false);
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
          ? { facecamHeightPercent: Math.max(22, Math.min(50, Math.round(patch.facecamHeightPercent))) }
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileNavOpen(false);
        }}
        counts={counts}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        integrations={
          workspace?.integrations || {
            runtime: "ai-studio-express",
            geminiConfigured: false,
            githubConfigured: false,
            githubRepo: null,
            githubBranch: "main",
            cloudflareConfigured: false,
            cloudflareProject: "clipforge",
            twitchConfigured: false,
          }
        }
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onRunPipeline={() => handleDispatchPipeline(true)}
          isRunningPipeline={isRunningPipeline}
          activeClipTitle={activeClip?.title}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Inline Status Notice */}
        {notice && (
          <div
            role="status"
            className={`mx-6 mt-4 px-4 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              notice.type === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <span className="flex items-center gap-2">
              {notice.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
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

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 max-w-[1360px] w-full mx-auto">
          {loading || !workspace ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721]"
                  />
                ))}
              </div>
              <div className="h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721]" />
            </div>
          ) : (
            <>
              {activeTab === "radar" && (
                <ClipRadarView
                  clips={workspace.clips}
                  config={workspace.config}
                  auditingClipId={auditingClipId}
                  isScanning={isScanning}
                  onScanRadar={handleScanRadar}
                  onAuditClip={handleAuditClip}
                  onOpenInStudio={(id) => {
                    setSelectedClipId(id);
                    setActiveTab("studio");
                  }}
                  onAddClip={handleAddClip}
                  onDeleteClip={handleDeleteClip}
                />
              )}

              {activeTab === "studio" && (
                <VerticalStudioView
                  clips={workspace.clips}
                  selectedClipId={selectedClipId}
                  onSelectClip={setSelectedClipId}
                  onUpdateClip={handleUpdateClip}
                  onAuditClip={handleAuditClip}
                  auditingClipId={auditingClipId}
                  onSendToQueue={async (id) => {
                    await handleUpdateClip(id, { publishStatus: "ready" });
                    setActiveTab("queue");
                  }}
                />
              )}

              {activeTab === "gitops" && (
                <GitOpsView
                  config={workspace.config}
                  runs={workspace.runs}
                  integrations={workspace.integrations}
                  onSaveConfig={handleSaveConfig}
                  onDispatchPipeline={handleDispatchPipeline}
                  isRunningPipeline={isRunningPipeline}
                />
              )}

              {activeTab === "revenue" && (
                <RevenueFeedbackView
                  clips={workspace.clips}
                  config={workspace.config}
                  recommendation={recommendation}
                  isOptimizing={isOptimizing}
                  onRunOptimizer={handleRunOptimizer}
                  onApplyPatch={handleApplyStrategyPatch}
                />
              )}

              {activeTab === "queue" && (
                <PublishQueueView
                  clips={workspace.clips}
                  assumedRpmUsd={workspace.config.publishing.assumedRpmUsd}
                  onUpdateClip={handleUpdateClip}
                  onOpenInStudio={(id) => {
                    setSelectedClipId(id);
                    setActiveTab("studio");
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
