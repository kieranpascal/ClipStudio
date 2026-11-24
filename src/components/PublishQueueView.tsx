import { useMemo, useState } from "react";
import { Copy, Check, CheckCircle2, Clapperboard, BarChart3, X } from "lucide-react";
import type { ClipItem, PublishStatus } from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface PublishQueueViewProps {
  clips: ClipItem[];
  assumedRpmUsd: number;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onOpenInStudio: (clipId: string) => void;
}

export function PublishQueueView({
  clips,
  assumedRpmUsd,
  onUpdateClip,
  onOpenInStudio,
}: PublishQueueViewProps) {
  const [filter, setFilter] = useState<"all" | PublishStatus>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [metricsModalClip, setMetricsModalClip] = useState<ClipItem | null>(null);
  const [metricsForm, setMetricsForm] = useState({
    tiktokViews: 18000,
    reelsViews: 9200,
    shortsViews: 6400,
    shares: 420,
    comments: 84,
    avgWatchPercent: 78,
  });

  const queueClips = useMemo(() => {
    return clips.filter((c) => {
      if (filter === "all") return c.qaStatus !== "rejected";
      return c.publishStatus === filter;
    });
  }, [clips, filter]);

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function openLogMetrics(clip: ClipItem) {
    setMetricsModalClip(clip);
    setMetricsForm({
      tiktokViews: clip.publishedMetrics?.tiktokViews ?? 18000,
      reelsViews: clip.publishedMetrics?.reelsViews ?? 9200,
      shortsViews: clip.publishedMetrics?.shortsViews ?? 6400,
      shares: clip.publishedMetrics?.shares ?? 420,
      comments: clip.publishedMetrics?.comments ?? 84,
      avgWatchPercent: clip.publishedMetrics?.avgWatchPercent ?? 78,
    });
  }

  async function handleSaveMetrics(e: React.FormEvent) {
    e.preventDefault();
    if (!metricsModalClip) return;
    const totalViews = metricsForm.tiktokViews + metricsForm.reelsViews + metricsForm.shortsViews;
    const estimatedRevenueUsd = Number(((totalViews / 1000) * assumedRpmUsd).toFixed(2));
    await onUpdateClip(metricsModalClip.id, {
      publishStatus: "published",
      publishedMetrics: {
        ...metricsForm,
        estimatedRevenueUsd,
      },
    });
    setMetricsModalClip(null);
  }

  return (
    <div className="space-y-5">
      {/* Segmented Queue Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#141A25] border border-slate-200 dark:border-slate-800/80">
          {(["all", "ready", "scheduled", "published", "draft"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                filter === tab
                  ? "bg-white dark:bg-[#1E2636] text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          {queueClips.length} item(s) · TikTok, Instagram Reels &amp; YouTube Shorts
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {queueClips.length === 0 ? (
          <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] text-center text-xs text-slate-500 dark:text-slate-400">
            No clips in this publish stage. Approve a clip in Clip Radar or queue one from Vertical Studio.
          </div>
        ) : (
          queueClips.map((clip) => {
            const tiktokCopy =
              clip.qaResult?.tiktokCaption ||
              `${clip.title} (credit ${clip.streamerHandle}) #gta6 #gamingclips`;
            const reelsCopy =
              clip.qaResult?.reelsCaption ||
              `${clip.title} — via ${clip.streamerHandle} #gta6 #reels`;
            const shortsCopy =
              clip.qaResult?.shortsTitle ||
              `${clip.title.slice(0, 62)} (${clip.streamerHandle})`;

            return (
              <div
                key={clip.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span
                        className={`font-semibold capitalize ${
                          clip.publishStatus === "published"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : clip.publishStatus === "ready"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {clip.publishStatus}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Credit: {clip.streamerHandle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {clip.layout.facecamHeightPercent}% facecam / {clip.layout.prependPeakHook ? `${clip.layout.hookDurationSec}s hook` : "linear"}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {clip.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenInStudio(clip.id)}
                      className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                    >
                      <Clapperboard className="w-3.5 h-3.5" />
                      <span>Edit Cut</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openLogMetrics(clip)}
                      className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Log Metrics</span>
                    </button>

                    {clip.publishStatus !== "published" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateClip(clip.id, {
                            publishStatus: clip.publishStatus === "scheduled" ? "published" : "scheduled",
                            scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                          })
                        }
                        className="h-8 px-3 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{clip.publishStatus === "scheduled" ? "Mark Published" : "Schedule Post"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Platform Captions Grid (Editable) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/70">
                  {(
                    [
                      { platform: "TikTok Caption", field: "tiktokCaption" as const, key: `${clip.id}_tt`, text: tiktokCopy },
                      { platform: "Instagram Reels", field: "reelsCaption" as const, key: `${clip.id}_ig`, text: reelsCopy },
                      { platform: "YouTube Shorts Title", field: "shortsTitle" as const, key: `${clip.id}_yt`, text: shortsCopy },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0F131B] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.platform}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.key, item.text)}
                          className="text-slate-500 hover:text-orange-500 inline-flex items-center gap-1"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === item.key ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        defaultValue={item.text}
                        onBlur={(e) => {
                          const nextVal = e.target.value.trim();
                          if (nextVal && nextVal !== item.text) {
                            onUpdateClip(clip.id, {
                              qaResult: {
                                authenticTargetGame: clip.qaResult?.authenticTargetGame ?? true,
                                detectedGame: clip.qaResult?.detectedGame ?? clip.gameCategory,
                                saturationRisk: clip.qaResult?.saturationRisk ?? "low",
                                chatClutterDetected: clip.qaResult?.chatClutterDetected ?? false,
                                hookRecommendation: clip.qaResult?.hookRecommendation ?? "",
                                recommendedHookStartSec: clip.qaResult?.recommendedHookStartSec ?? clip.layout.hookStartSec,
                                summaryReason: clip.qaResult?.summaryReason ?? "Edited in Publish Queue",
                                tiktokCaption: tiktokCopy,
                                reelsCaption: reelsCopy,
                                shortsTitle: shortsCopy,
                                auditedAt: clip.qaResult?.auditedAt ?? new Date().toISOString(),
                                [item.field]: nextVal,
                              },
                            });
                          }
                        }}
                        aria-label={`${item.platform} for ${clip.title}`}
                        className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/40 rounded p-1 -m-1"
                      />
                    </div>
                  ))}
                </div>

                {clip.publishedMetrics && (
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <span>
                      Total Views:{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {formatCompactNumber(
                          clip.publishedMetrics.tiktokViews +
                            clip.publishedMetrics.reelsViews +
                            clip.publishedMetrics.shortsViews
                        )}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Avg Watch: {clip.publishedMetrics.avgWatchPercent}%</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ${clip.publishedMetrics.estimatedRevenueUsd.toFixed(2)} est. revenue
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Live Performance Metrics Modal */}
      {metricsModalClip && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Log Post Performance Telemetry
              </h2>
              <button
                type="button"
                onClick={() => setMetricsModalClip(null)}
                aria-label="Close metrics modal"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetrics} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {metricsModalClip.title}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">TikTok Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.tiktokViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, tiktokViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Reels Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.reelsViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, reelsViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Shorts Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.shortsViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, shortsViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Shares</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.shares}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, shares: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Comments</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.comments}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, comments: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Watch %</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={metricsForm.avgWatchPercent}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, avgWatchPercent: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMetricsModalClip(null)}
                  className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium"
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
