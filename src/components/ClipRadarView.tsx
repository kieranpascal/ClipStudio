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
} from "lucide-react";
import type { ClipItem, PipelineConfig, QaStatus } from "../types";
import { computeSaturationLevel, computeViewsPerMinute, formatCompactNumber } from "../utils/ffmpeg";

interface ClipRadarViewProps {
  clips: ClipItem[];
  config: PipelineConfig;
  auditingClipId: string | null;
  isScanning: boolean;
  onScanRadar: () => void;
  onAuditClip: (clipId: string) => void;
  onOpenInStudio: (clipId: string) => void;
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
}

function ClipThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="w-24 h-14 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
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
      className="w-24 h-14 rounded-md object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800"
    />
  );
}

export function ClipRadarView({
  clips,
  config,
  auditingClipId,
  isScanning,
  onScanRadar,
  onAuditClip,
  onOpenInStudio,
  onAddClip,
  onDeleteClip,
}: ClipRadarViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | QaStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const summary = useMemo(() => {
    const approved = clips.filter((c) => c.qaStatus === "approved").length;
    const pending = clips.filter((c) => c.qaStatus === "pending").length;
    const rejected = clips.filter((c) => c.qaStatus === "rejected").length;
    const avgVelocity =
      clips.length > 0
        ? Math.round(clips.reduce((acc, c) => acc + computeViewsPerMinute(c.views, c.ageMinutes), 0) / clips.length)
        : 0;
    return { approved, pending, rejected, avgVelocity };
  }, [clips]);

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

  return (
    <div className="space-y-6">
      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Queued Source Clips</div>
          <div className="mt-1.5 text-2xl font-display font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {clips.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.pending} awaiting Gemini QA
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Verified Authentic</div>
          <div className="mt-1.5 text-2xl font-display font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary.approved}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Passed game &amp; saturation gate
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Filtered Out</div>
          <div className="mt-1.5 text-2xl font-display font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {summary.rejected}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mislabeled game or &gt;{config.qaRules.maxExistingCrossPosts} copies
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Mean Clip Velocity</div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {summary.avgVelocity}/min
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Views per minute since capture
          </div>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Segmented Status Filter */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#141A25] border border-slate-200 dark:border-slate-800/80">
            {(["all", "pending", "approved", "review", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                  statusFilter === tab
                    ? "bg-white dark:bg-[#1E2636] text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter clips or streamers..."
              className="h-9 pl-9 pr-3 w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onScanRadar}
            disabled={isScanning}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] hover:bg-slate-50 dark:hover:bg-[#1A2230] text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Scan Twitch Radar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-9 px-3.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clip</span>
          </button>
        </div>
      </div>

      {/* High-Density Clip Data Grid */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] overflow-hidden">
        {filteredClips.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No clips match the current filter
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Scan Twitch Radar to pull fresh high-velocity clips or ingest a custom Twitch/Kick clip URL directly.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Clip
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#0F131B]">
                  <th className="py-3 px-4">Clip &amp; Source</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Velocity</th>
                  <th className="py-3 px-4 text-right">Saturation</th>
                  <th className="py-3 px-4">Gemini QA Gate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/70 text-sm">
                {filteredClips.map((clip) => {
                  const velocity = computeViewsPerMinute(clip.views, clip.ageMinutes);
                  const saturation = computeSaturationLevel(
                    clip.duplicateCrossPosts,
                    config.qaRules.maxExistingCrossPosts
                  );
                  const isAuditing = auditingClipId === clip.id;

                  return (
                    <tr
                      key={clip.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3.5 min-w-[300px] max-w-[460px]">
                          <ClipThumbnail src={clip.gameplayThumbnail} alt={clip.title} />
                          <div className="min-w-0 space-y-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                              {clip.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {clip.streamerHandle}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{clip.sourcePlatform}</span>
                              <span aria-hidden="true">·</span>
                              <span>{clip.gameCategory}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{clip.durationSec}s</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div>{formatCompactNumber(clip.views)}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {clip.ageMinutes}m ago
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {velocity}/m
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className={`text-xs font-medium ${
                            saturation === "Saturated"
                              ? "text-rose-600 dark:text-rose-400"
                              : saturation === "Moderate"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {saturation}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {clip.duplicateCrossPosts} copies
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div
                          className={`text-xs font-semibold capitalize ${
                            clip.qaStatus === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : clip.qaStatus === "rejected"
                                ? "text-rose-600 dark:text-rose-400"
                                : clip.qaStatus === "review"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {clip.qaStatus === "pending"
                            ? "Pending Audit"
                            : clip.qaStatus === "approved"
                              ? "Approved"
                              : clip.qaStatus === "review"
                                ? "Needs Review"
                                : "Rejected"}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {clip.qaResult
                            ? clip.qaResult.summaryReason
                            : "Run Gemini QA to verify game authenticity, hook timing, and captions."}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAuditClip(clip.id)}
                            disabled={isAuditing}
                            className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18202E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isAuditing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                            )}
                            <span>{clip.qaResult ? "Re-Audit" : "Gemini QA"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenInStudio(clip.id)}
                            className="h-8 px-2.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Clapperboard className="w-3.5 h-3.5" />
                            <span>Studio</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteClip(clip.id)}
                            aria-label={`Delete ${clip.title}`}
                            className="h-8 w-8 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 inline-flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Clip Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-clip-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 id="add-clip-title" className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Ingest Source Clip
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewClip} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Clip Title
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g., Insane Helicopter Escape Through Oceanfront Pier"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Streamer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.streamerName}
                    onChange={(e) => setFormState((s) => ({ ...s, streamerName: e.target.value }))}
                    placeholder="e.g., KadeVelo"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={formState.sourcePlatform}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        sourcePlatform: e.target.value as "Twitch" | "Kick" | "YouTube Live",
                      }))
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  >
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="YouTube Live">YouTube Live</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Game Category
                  </label>
                  <input
                    type="text"
                    value={formState.gameCategory}
                    onChange={(e) => setFormState((s) => ({ ...s, gameCategory: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={formState.sourceUrl}
                    onChange={(e) => setFormState((s) => ({ ...s, sourceUrl: e.target.value }))}
                    placeholder="https://clips.twitch.tv/..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Views
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.views}
                    onChange={(e) => setFormState((s) => ({ ...s, views: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (sec)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={formState.durationSec}
                    onChange={(e) => setFormState((s) => ({ ...s, durationSec: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Rival Cross-Posts
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.duplicateCrossPosts}
                    onChange={(e) => setFormState((s) => ({ ...s, duplicateCrossPosts: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transcript / Audio Dialogue (used by Gemini QA &amp; Hook Finder)
                </label>
                <textarea
                  rows={3}
                  value={formState.transcript}
                  onChange={(e) => setFormState((s) => ({ ...s, transcript: e.target.value }))}
                  placeholder="Paste spoken transcript or dialogue from the clip..."
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? "Adding..." : "Add to Radar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
