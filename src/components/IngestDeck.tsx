import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  Clapperboard,
  Trash2,
  Loader2,
  X,
  Film,
  ShieldCheck,
  CheckSquare,
  Square,
  Send,
  Wand2,
  FileJson,
  AlertTriangle,
} from "lucide-react";
import type { ClipItem, PipelineConfig, QaStatus, StreamerPolicyEntry } from "../types";
import {
  computeSaturationLevel,
  computeTitleSimilarity,
  computeViewsPerMinute,
  formatCompactNumber,
} from "../utils/ffmpeg";

interface IngestDeckProps {
  clips: ClipItem[];
  config: PipelineConfig;
  selectedClipId: string;
  auditingClipId: string | null;
  generatingHooksClipId: string | null;
  isScanning: boolean;
  isBatchRunning: boolean;
  onSelectClip: (clipId: string) => void;
  onScanRadar: () => void;
  onAuditClip: (clipId: string) => void;
  onGenerateHooks: (clipId: string) => void;
  onOpenInStudio: (clipId: string) => void;
  onBatchAction: (clipIds: string[], action: "approve" | "queue" | "delete" | "audit") => Promise<void>;
  onAddClip: (payload: {
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
  }) => Promise<void>;
  onDeleteClip: (clipId: string) => void;
  onUpdateStreamerPolicies: (policies: StreamerPolicyEntry[]) => Promise<void>;
  onNotify?: (type: "success" | "error", message: string) => void;
}

function MediaThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="w-20 h-12 rounded-sm bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
        <Film className="w-4 h-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-20 h-12 rounded-sm object-cover bg-slate-200 dark:bg-slate-900 shrink-0 border border-[#D9DEE7] dark:border-[#262B37]"
    />
  );
}

export function IngestDeck({
  clips,
  config,
  selectedClipId,
  auditingClipId,
  generatingHooksClipId,
  isScanning,
  isBatchRunning,
  onSelectClip,
  onScanRadar,
  onAuditClip,
  onGenerateHooks,
  onOpenInStudio,
  onBatchAction,
  onAddClip,
  onDeleteClip,
  onUpdateStreamerPolicies,
  onNotify,
}: IngestDeckProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | QaStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newPolicyHandle, setNewPolicyHandle] = useState("");
  const [newPolicyStatus, setNewPolicyStatus] = useState<"allow" | "opt-out">("allow");
  const [newPolicyNote, setNewPolicyNote] = useState("");

  const [formState, setFormState] = useState({
    title: "",
    streamerName: "",
    sourcePlatform: "Twitch" as "Twitch" | "Kick" | "YouTube Live",
    sourceUrl: "",
    gameCategory: config.targetGames.find((g) => g.enabled)?.name || "Grand Theft Auto VI",
    views: 4200,
    ageMinutes: 35,
    durationSec: 28,
    duplicateCrossPosts: 0,
    transcript: "",
  });

  const filteredClips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clips.filter((clip) => {
      if (statusFilter !== "all" && clip.qaStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        clip.title.toLowerCase().includes(q) ||
        clip.streamerName.toLowerCase().includes(q) ||
        clip.gameCategory.toLowerCase().includes(q)
      );
    });
  }, [clips, statusFilter, searchQuery]);

  // Content deduplication fingerprint scan across media bin
  const duplicateAlerts = useMemo(() => {
    const flagged = new Set<string>();
    for (let i = 0; i < clips.length; i++) {
      for (let j = i + 1; j < clips.length; j++) {
        if (computeTitleSimilarity(clips[i].title, clips[j].title) >= 0.48) {
          flagged.add(clips[i].id);
          flagged.add(clips[j].id);
        }
      }
    }
    return flagged;
  }, [clips]);

  const inspectedClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || filteredClips[0] || clips[0],
    [clips, filteredClips, selectedClipId]
  );

  const stats = useMemo(() => {
    const approved = clips.filter((c) => c.qaStatus === "approved").length;
    const pending = clips.filter((c) => c.qaStatus === "pending").length;
    const dmcaFlagged = clips.filter((c) => c.qaResult && c.qaResult.dmcaMusicRisk !== "none").length;
    return { approved, pending, dmcaFlagged };
  }, [clips]);

  function toggleChecked(id: string) {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    const visibleIds = filteredClips.map((c) => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));
    setCheckedIds(allSelected ? [] : visibleIds);
  }

  async function runBatch(action: "approve" | "queue" | "delete" | "audit") {
    if (checkedIds.length === 0) return;
    await onBatchAction(checkedIds, action);
    setCheckedIds([]);
  }

  /**
   * Bulk Metadata Export: downloads selected clips' transcripts, hook variants,
   * captions, QA verdicts, and DMCA flags as a clean JSON file.
   */
  function handleBulkMetadataExport(targetIds?: string[]) {
    const ids = targetIds && targetIds.length > 0 ? targetIds : checkedIds.length > 0 ? checkedIds : filteredClips.map((c) => c.id);
    const exportClips = clips.filter((c) => ids.includes(c.id));
    if (exportClips.length === 0) {
      onNotify?.("error", "Select at least one clip to export metadata.");
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      projectName: config.projectName,
      clipCount: exportClips.length,
      clips: exportClips.map((clip) => ({
        id: clip.id,
        title: clip.title,
        gameCategory: clip.gameCategory,
        streamerName: clip.streamerName,
        streamerHandle: clip.streamerHandle,
        sourcePlatform: clip.sourcePlatform,
        sourceUrl: clip.sourceUrl,
        durationSec: clip.durationSec,
        views: clip.views,
        qaStatus: clip.qaStatus,
        activeLocale: clip.activeLocale,
        transcript: clip.transcript,
        hookVariants: clip.hookVariants,
        activeHookVariantId: clip.activeHookVariantId || null,
        activeHookBanner: clip.layout.hookBannerText,
        captions: clip.captions,
        localizations: clip.localizations,
        qaSummary: clip.qaResult
          ? {
              detectedGame: clip.qaResult.detectedGame,
              dmcaMusicRisk: clip.qaResult.dmcaMusicRisk,
              recommendedHookStartSec: clip.qaResult.recommendedHookStartSec,
              tiktokCaption: clip.qaResult.tiktokCaption,
              reelsCaption: clip.qaResult.reelsCaption,
              shortsTitle: clip.qaResult.shortsTitle,
            }
          : null,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipforge-metadata-${exportClips.length}clips-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("success", `Exported transcripts & hook variants for ${exportClips.length} clip(s) to JSON.`);
  }

  async function handleSubmitNewClip(e: React.FormEvent) {
    e.preventDefault();
    if (!formState.title.trim() || !formState.streamerName.trim()) return;
    setSubmitting(true);
    try {
      await onAddClip(formState);
      setShowAddModal(false);
      setFormState({
        title: "",
        streamerName: "",
        sourcePlatform: "Twitch",
        sourceUrl: "",
        gameCategory: config.targetGames.find((g) => g.enabled)?.name || "Grand Theft Auto VI",
        views: 4200,
        ageMinutes: 35,
        durationSec: 28,
        duplicateCrossPosts: 0,
        transcript: "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!newPolicyHandle.trim()) return;
    const formatted = newPolicyHandle.startsWith("@") ? newPolicyHandle.trim() : `@${newPolicyHandle.trim()}`;
    const next: StreamerPolicyEntry[] = [
      { handle: formatted, status: newPolicyStatus, note: newPolicyNote.trim() || "Configured in Ingest Deck" },
      ...config.streamerPolicies.filter((p) => p.handle.toLowerCase() !== formatted.toLowerCase()),
    ];
    await onUpdateStreamerPolicies(next);
    setNewPolicyHandle("");
    setNewPolicyNote("");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Broadcast Media Bin Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37]">
            {(["all", "pending", "approved", "review", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors whitespace-nowrap capitalize ${
                  statusFilter === tab
                    ? "bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F1115] dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bin..."
              className="h-8 pl-8 pr-3 w-44 sm:w-52 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] text-xs text-[#0F1115] dark:text-[#EEF0F4] placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
            />
          </div>

          <div className="hidden xl:flex items-center gap-3 pl-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>{clips.length} in bin</span>
            <span aria-hidden="true">/</span>
            <span className="text-emerald-600 dark:text-emerald-400">{stats.approved} cleared</span>
            <span aria-hidden="true">/</span>
            <span>{stats.pending} pending</span>
            <span aria-hidden="true">/</span>
            <span className={stats.dmcaFlagged > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
              {stats.dmcaFlagged} DMCA flags
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleBulkMetadataExport()}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileJson className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>
              {checkedIds.length > 0 ? `Export JSON (${checkedIds.length})` : "Export Bin JSON"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Policy ({config.streamerPolicies.length})</span>
          </button>

          <button
            type="button"
            onClick={onScanRadar}
            disabled={isScanning}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Pull Radar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Clip</span>
          </button>
        </div>
      </div>

      {/* Batch Selection Action Strip (includes Bulk Metadata JSON Export) */}
      {checkedIds.length > 0 && (
        <div className="px-6 py-2 border-b border-[#E1392B]/30 bg-[#E1392B]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-mono font-medium text-[#0F1115] dark:text-[#EEF0F4]">
            {checkedIds.length} clip(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkMetadataExport(checkedIds)}
              className="h-7 px-2.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] font-semibold inline-flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>Export Transcripts &amp; Hooks JSON</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("audit")}
              className="h-7 px-2.5 rounded-sm bg-[#E1392B] text-white font-medium inline-flex items-center gap-1 disabled:opacity-50"
            >
              {isBatchRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Batch Gemini QA</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("queue")}
              className="h-7 px-2.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-slate-800 dark:text-slate-100 font-medium inline-flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Queue Ready</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("delete")}
              className="h-7 px-2.5 rounded-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCheckedIds([])}
              className="h-7 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 2-Pane Split: Left Media Bin (65%) + Right Live Clip Inspector (35%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-112px)]">
        <div className="lg:col-span-8 border-r border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0A0B0E] overflow-x-auto">
          {filteredClips.length === 0 ? (
            <div className="p-14 text-center space-y-2">
              <p className="text-sm font-medium text-[#0F1115] dark:text-[#EEF0F4]">Media bin is empty for this filter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pull fresh clips from Twitch Radar or ingest a custom clip URL.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9DEE7] dark:border-[#222631] text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-[#F6F7F9] dark:bg-[#111318]">
                  <th className="py-2.5 pl-4 pr-2 w-8">
                    <button
                      type="button"
                      onClick={toggleAllVisible}
                      aria-label="Select all visible clips"
                      className="text-slate-500 hover:text-[#0F1115] dark:hover:text-white"
                    >
                      {filteredClips.length > 0 && filteredClips.every((c) => checkedIds.includes(c.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#E1392B]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Clip / Creator</th>
                  <th className="py-2.5 px-3 text-right">Velocity</th>
                  <th className="py-2.5 px-3 text-right">Hooks</th>
                  <th className="py-2.5 px-3">DMCA</th>
                  <th className="py-2.5 px-3">QA Gate</th>
                  <th className="py-2.5 pr-4 pl-2 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1A1D26] text-sm">
                {filteredClips.map((clip) => {
                  const isSelected = inspectedClip?.id === clip.id;
                  const isChecked = checkedIds.includes(clip.id);
                  const vel = computeViewsPerMinute(clip.views, clip.ageMinutes);
                  const sat = computeSaturationLevel(clip.duplicateCrossPosts, config.qaRules.maxExistingCrossPosts);
                  const dmca = clip.qaResult?.dmcaMusicRisk || "none";
                  const hasDupAlert = duplicateAlerts.has(clip.id);

                  return (
                    <tr
                      key={clip.id}
                      onClick={() => onSelectClip(clip.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#ECEFF3]/80 dark:bg-[#161922]"
                          : "hover:bg-[#F6F7F9] dark:hover:bg-[#11131A]"
                      }`}
                    >
                      <td
                        className="py-3 pl-4 pr-2 align-middle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChecked(clip.id);
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#E1392B]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <MediaThumb src={clip.gameplayThumbnail} alt={clip.title} />
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm text-[#0F1115] dark:text-[#EEF0F4] line-clamp-1">
                              {clip.title}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{clip.streamerHandle}</span>
                              <span aria-hidden="true">·</span>
                              <span>{clip.sourcePlatform}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{formatCompactNumber(clip.views)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{clip.durationSec}s</span>
                              {sat === "Saturated" && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-rose-500 font-medium">{clip.duplicateCrossPosts}x rival copies</span>
                                </>
                              )}
                              {hasDupAlert && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-500 inline-flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    Similar in bin
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-[#0F1115] dark:text-slate-200 whitespace-nowrap">
                        {vel}/m
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {clip.hookVariants.length}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <span
                          className={
                            dmca === "high"
                              ? "text-rose-600 dark:text-rose-400 font-medium"
                              : dmca === "possible"
                                ? "text-amber-600 dark:text-amber-400 font-medium"
                                : "text-slate-500 dark:text-slate-400"
                          }
                        >
                          {dmca === "high" ? "Music Risk" : dmca === "possible" ? "Check Audio" : "Clear"}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs font-medium capitalize">
                        <span
                          className={
                            clip.qaStatus === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : clip.qaStatus === "rejected"
                                ? "text-rose-600 dark:text-rose-400"
                                : clip.qaStatus === "review"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-500 dark:text-slate-400"
                          }
                        >
                          {clip.qaStatus}
                        </span>
                      </td>

                      <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenInStudio(clip.id)}
                          className="h-7 px-2.5 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Clapperboard className="w-3 h-3" />
                          <span>Cut</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Live Clip Inspector Pane */}
        <aside className="lg:col-span-4 bg-[#F6F7F9] dark:bg-[#0F1117] p-5 space-y-5 overflow-y-auto">
          {inspectedClip ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{inspectedClip.id}</span>
                  <span>{inspectedClip.layout.template}</span>
                </div>
                <h2 className="font-display text-base font-bold text-[#0F1115] dark:text-[#EEF0F4] leading-snug">
                  {inspectedClip.title}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span>{inspectedClip.streamerHandle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedClip.gameCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{inspectedClip.layout.targetLufs} LUFS</span>
                </div>
              </div>

              <div className="relative aspect-video rounded-sm overflow-hidden border border-[#D9DEE7] dark:border-[#262B37] bg-black">
                <img
                  src={inspectedClip.gameplayThumbnail}
                  alt={inspectedClip.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between text-[11px] font-mono text-white">
                  <span>{inspectedClip.durationSec}s · {formatCompactNumber(inspectedClip.views)} views</span>
                  <span>Hook @ {inspectedClip.layout.hookStartSec.toFixed(1)}s</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAuditClip(inspectedClip.id)}
                  disabled={auditingClipId === inspectedClip.id}
                  className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] inline-flex items-center justify-center gap-1.5"
                >
                  {auditingClipId === inspectedClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>{inspectedClip.qaResult ? "Re-Run QA" : "Gemini QA + DMCA"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onGenerateHooks(inspectedClip.id)}
                  disabled={generatingHooksClipId === inspectedClip.id}
                  className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] inline-flex items-center justify-center gap-1.5"
                >
                  {generatingHooksClipId === inspectedClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>A/B/C Hooks</span>
                </button>
              </div>

              {/* QA & DMCA Readout */}
              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 dark:text-slate-400">QA &amp; DMCA Audit</span>
                  <span
                    className={`font-semibold capitalize ${
                      inspectedClip.qaStatus === "approved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : inspectedClip.qaStatus === "rejected"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {inspectedClip.qaStatus}
                  </span>
                </div>

                {inspectedClip.qaResult ? (
                  <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>{inspectedClip.qaResult.summaryReason}</p>
                    <div className="pt-2 border-t border-[#D9DEE7]/70 dark:border-[#222631] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Detected Title</span>
                        <span className="font-medium text-[#0F1115] dark:text-slate-100">{inspectedClip.qaResult.detectedGame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DMCA Audio Risk</span>
                        <span className="font-medium capitalize">{inspectedClip.qaResult.dmcaMusicRisk}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Not audited yet. Run Gemini QA to verify authentic footage, copyrighted music risk, and optimal hook timestamp.
                  </p>
                )}
              </div>

              {/* Hook Variants Summary */}
              {inspectedClip.hookVariants.length > 0 && (
                <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2 text-xs">
                  <div className="font-medium text-slate-500 dark:text-slate-400">
                    Hook Variants ({inspectedClip.hookVariants.length})
                  </div>
                  <div className="space-y-1.5">
                    {inspectedClip.hookVariants.map((hv) => (
                      <div key={hv.id} className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]">
                        <div className="font-mono text-[11px] font-semibold text-[#0F1115] dark:text-[#EEF0F4]">
                          {hv.bannerText}
                        </div>
                        <div className="text-[11px] text-slate-500">{hv.label} · {hv.predictedHoldLift}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Snippet */}
              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5 text-xs">
                <div className="font-medium text-slate-500 dark:text-slate-400">Source Transcript</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{inspectedClip.transcript}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInStudio(inspectedClip.id)}
                  className="flex-1 h-9 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Open in Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMetadataExport([inspectedClip.id])}
                  title="Download this clip's transcript & hook variants JSON"
                  aria-label="Export clip JSON"
                  className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-600 dark:text-slate-300 hover:text-[#E1392B] flex items-center justify-center"
                >
                  <FileJson className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteClip(inspectedClip.id)}
                  aria-label="Delete selected clip"
                  className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-500 hover:text-rose-500 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">Select a clip from the media bin to inspect.</div>
          )}
        </aside>
      </div>

      {/* Add Clip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">Ingest Source Clip</h2>
              <button type="button" onClick={() => setShowAddModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitNewClip} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Clip Title</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g., Last-Second Helicopter Stunt Through Pier"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Streamer Name</label>
                  <input
                    type="text"
                    required
                    value={formState.streamerName}
                    onChange={(e) => setFormState((s) => ({ ...s, streamerName: e.target.value }))}
                    placeholder="KadeVelo"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                  <select
                    value={formState.sourcePlatform}
                    onChange={(e) => setFormState((s) => ({ ...s, sourcePlatform: e.target.value as "Twitch" | "Kick" | "YouTube Live" }))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  >
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="YouTube Live">YouTube Live</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Views</label>
                  <input type="number" min={0} value={formState.views} onChange={(e) => setFormState((s) => ({ ...s, views: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (s)</label>
                  <input type="number" min={5} max={180} value={formState.durationSec} onChange={(e) => setFormState((s) => ({ ...s, durationSec: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Rival Copies</label>
                  <input type="number" min={0} value={formState.duplicateCrossPosts} onChange={(e) => setFormState((s) => ({ ...s, duplicateCrossPosts: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Spoken Transcript</label>
                <textarea rows={3} value={formState.transcript} onChange={(e) => setFormState((s) => ({ ...s, transcript: e.target.value }))} placeholder="Paste dialogue for Gemini QA, DMCA screening, and hook extraction..." className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="h-9 px-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37]">Cancel</button>
                <button type="submit" disabled={submitting} className="h-9 px-4 rounded-sm bg-[#E1392B] text-white font-semibold">{submitting ? "Adding..." : "Add to Bin"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creator Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Creator Allowlist &amp; Opt-Out Ledger
              </h2>
              <button type="button" onClick={() => setShowPolicyModal(false)} aria-label="Close policy modal" className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Opted-out creators are automatically skipped by both Twitch Radar scans and GitHub Actions workers.
              </p>

              <form onSubmit={handleAddPolicy} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  required
                  value={newPolicyHandle}
                  onChange={(e) => setNewPolicyHandle(e.target.value)}
                  placeholder="@handle"
                  className="col-span-4 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono"
                />
                <select
                  value={newPolicyStatus}
                  onChange={(e) => setNewPolicyStatus(e.target.value as "allow" | "opt-out")}
                  className="col-span-3 h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                >
                  <option value="allow">Whitelist</option>
                  <option value="opt-out">Opt-Out</option>
                </select>
                <input
                  type="text"
                  value={newPolicyNote}
                  onChange={(e) => setNewPolicyNote(e.target.value)}
                  placeholder="Permission note"
                  className="col-span-3 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                />
                <button type="submit" className="col-span-2 h-8 rounded-sm bg-[#E1392B] text-white font-semibold">
                  Add
                </button>
              </form>

              <div className="divide-y divide-[#ECEFF3] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] rounded-sm max-h-60 overflow-y-auto">
                {config.streamerPolicies.map((p) => (
                  <div key={p.handle} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{p.handle}</span>
                        <span className={p.status === "opt-out" ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}>
                          {p.status === "opt-out" ? "Opted Out" : "Whitelisted"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{p.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStreamerPolicies(config.streamerPolicies.filter((x) => x.handle !== p.handle))
                      }
                      className="text-slate-400 hover:text-rose-500"
                      aria-label={`Remove ${p.handle}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
