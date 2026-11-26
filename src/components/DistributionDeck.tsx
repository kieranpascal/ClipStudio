import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  BarChart3,
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ArrowRight,
  Film,
  Layers,
  Globe,
  Download,
  Repeat,
  ShieldCheck,
  Clock,
} from "lucide-react";
import type {
  ChannelAccount,
  ClipItem,
  ContentNiche,
  PipelineConfig,
  PublishStatus,
  SocialPlatform,
  StrategyRecommendation,
  SupportedLocale,
  SyndicationRule,
} from "../types";
import { computeRevenueTargets, formatCompactNumber } from "../utils/ffmpeg";

interface SyndicationDryRunResult {
  ruleId: string;
  summary: string;
  passCount: number;
  warnCount: number;
  checks: Array<{ clipId: string; title: string; status: "pass" | "warn"; detail: string }>;
}

interface DistributionDeckProps {
  clips: ClipItem[];
  config: PipelineConfig;
  recommendation: StrategyRecommendation | null;
  isOptimizing: boolean;
  isAutoScheduling: boolean;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onOpenInStudio: (clipId: string) => void;
  onUpdateChannelFleet: (fleet: ChannelAccount[]) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onDryRunSyndication: (ruleId: string) => Promise<SyndicationDryRunResult | null>;
  onRunOptimizer: () => Promise<void>;
  onAutoScheduleFleet: () => Promise<void>;
  onApplyStrategyPatch: (patch: StrategyRecommendation["configPatch"]) => Promise<void>;
  onNotify?: (type: "success" | "error", message: string) => void;
}

type DistSubTab = "desk" | "syndication" | "fleet" | "economics";

const ALL_PLATFORMS: SocialPlatform[] = [
  "TikTok",
  "YouTube Shorts",
  "Instagram Reels",
  "X Video",
  "Snapchat Spotlight",
  "Facebook Reels",
  "LinkedIn Video",
  "Reddit Native Video",
  "Pinterest Idea Pins",
  "Threads Video",
  "Bluesky Video",
  "Substack Video",
];

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HEATMAP_HOURS = [
  { hour: 9, label: "09:00" },
  { hour: 12, label: "12:00" },
  { hour: 15, label: "15:00" },
  { hour: 18, label: "18:00" },
  { hour: 21, label: "21:00" },
  { hour: 23, label: "23:00" },
] as const;

// Audience velocity index (0..100) calibrated for short-form gaming, tech & podcast feeds
const HEATMAP_SCORES: Record<string, number[]> = {
  Mon: [52, 68, 74, 84, 79, 58],
  Tue: [58, 72, 78, 89, 85, 62],
  Wed: [60, 75, 81, 92, 88, 65],
  Thu: [62, 78, 84, 95, 91, 69],
  Fri: [65, 80, 88, 97, 94, 78],
  Sat: [74, 88, 93, 96, 98, 84],
  Sun: [76, 90, 95, 94, 86, 66],
};

function QueueThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="w-16 h-10 rounded-sm bg-slate-200 dark:bg-[#171A21] flex items-center justify-center text-slate-500 shrink-0 border border-[#D9DEE7] dark:border-[#252A36]">
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
      className="w-16 h-10 rounded-sm object-cover shrink-0 border border-[#D9DEE7] dark:border-[#252A36] bg-slate-200 dark:bg-[#171A21]"
    />
  );
}

export function DistributionDeck({
  clips,
  config,
  recommendation,
  isOptimizing,
  isAutoScheduling,
  onUpdateClip,
  onOpenInStudio,
  onUpdateChannelFleet,
  onSaveConfig,
  onDryRunSyndication,
  onRunOptimizer,
  onAutoScheduleFleet,
  onApplyStrategyPatch,
  onNotify,
}: DistributionDeckProps) {
  const [subTab, setSubTab] = useState<DistSubTab>("desk");
  const [statusFilter, setStatusFilter] = useState<"all" | PublishStatus>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingCaptions, setEditingCaptions] = useState<
    Record<string, { tiktokCaption: string; reelsCaption: string; shortsTitle: string }>
  >({});

  // Auto-Syndication rules state
  const [dryRunResult, setDryRunResult] = useState<SyndicationDryRunResult | null>(null);
  const [checkingRuleId, setCheckingRuleId] = useState<string | null>(null);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleNiche, setNewRuleNiche] = useState<"all" | ContentNiche>("all");
  const [newRuleTargets, setNewRuleTargets] = useState<SocialPlatform[]>([
    "TikTok",
    "YouTube Shorts",
    "Instagram Reels",
    "X Video",
  ]);
  const [newRuleStripWatermark, setNewRuleStripWatermark] = useState(true);

  // Metrics Modal
  const [metricsClip, setMetricsClip] = useState<ClipItem | null>(null);
  const [metricsForm, setMetricsForm] = useState({
    tiktokViews: 0,
    reelsViews: 0,
    shortsViews: 0,
    shares: 0,
    comments: 0,
    avgWatchPercent: 72,
  });

  // Channel Fleet Add Form
  const [newChannel, setNewChannel] = useState({
    name: "",
    handle: "",
    locale: "en" as SupportedLocale,
    stage: "warmup" as "warmup" | "scaling" | "monetized",
    dailyPostCap: 3,
    staggerJitterMin: 18,
    assumedRpmUsd: 0.75,
  });

  // Unit Economics Calculator State
  const [targetDailyUsd, setTargetDailyUsd] = useState(config.publishing.targetDailyRevenueUsd || 100);
  const [assumedRpm, setAssumedRpm] = useState(config.publishing.assumedRpmUsd || 0.75);
  const [avgViewsPerShort, setAvgViewsPerShort] = useState(18000);
  const [applyingPatch, setApplyingPatch] = useState(false);

  const syndicationRules = config.syndicationRules || [];

  async function handleToggleRule(ruleId: string) {
    const next = syndicationRules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    await onSaveConfig({ ...config, syndicationRules: next });
  }

  async function handleDeleteRule(ruleId: string) {
    const next = syndicationRules.filter((r) => r.id !== ruleId);
    await onSaveConfig({ ...config, syndicationRules: next });
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRuleName.trim() || newRuleTargets.length === 0) return;
    const rule: SyndicationRule = {
      id: `syn_${Date.now().toString(36)}`,
      name: newRuleName.trim(),
      enabled: true,
      triggerNiche: newRuleNiche,
      minQaStatus: "approved",
      stripWatermark: newRuleStripWatermark,
      targets: newRuleTargets,
      retryOnApiFail: true,
      fallbackQueue: true,
    };
    await onSaveConfig({ ...config, syndicationRules: [rule, ...syndicationRules] });
    setNewRuleName("");
  }

  async function handleRunPreFlight(ruleId: string) {
    setCheckingRuleId(ruleId);
    try {
      const res = await onDryRunSyndication(ruleId);
      if (res) setDryRunResult(res);
    } finally {
      setCheckingRuleId(null);
    }
  }

  async function handleScheduleHeatmapSlot(dayIdx: number, hour: number, score: number) {
    const nextReady = clips.find((c) => c.publishStatus === "ready" || c.publishStatus === "draft");
    if (!nextReady) {
      onNotify?.("error", "No Ready or Draft clips available to schedule into this heatmap slot.");
      return;
    }
    const target = new Date();
    const todayMonIdx = (target.getDay() + 6) % 7;
    let deltaDays = dayIdx - todayMonIdx;
    if (deltaDays < 0 || (deltaDays === 0 && hour <= target.getHours())) deltaDays += 7;
    target.setDate(target.getDate() + deltaDays);
    target.setHours(hour, 15, 0, 0);
    await onUpdateClip(nextReady.id, {
      publishStatus: "scheduled",
      scheduledFor: target.toISOString(),
    });
    onNotify?.(
      "success",
      `Scheduled "${nextReady.title}" into ${HEATMAP_DAYS[dayIdx]} ${String(hour).padStart(2, "0")}:15 peak slot (velocity ${score}/100).`
    );
  }

  const filteredClips = useMemo(() => {
    if (statusFilter === "all") return clips;
    return clips.filter((c) => c.publishStatus === statusFilter);
  }, [clips, statusFilter]);

  const publishedClips = useMemo(
    () => clips.filter((c) => c.publishStatus === "published" && c.publishedMetrics),
    [clips]
  );

  const totalFleetDailyCap = useMemo(
    () => config.channelFleet.reduce((sum, ch) => sum + ch.dailyPostCap, 0),
    [config.channelFleet]
  );

  const economics = useMemo(
    () => computeRevenueTargets(targetDailyUsd, assumedRpm, avgViewsPerShort),
    [targetDailyUsd, assumedRpm, avgViewsPerShort]
  );

  const ledgerTotals = useMemo(() => {
    return publishedClips.reduce(
      (acc, c) => {
        const m = c.publishedMetrics!;
        acc.views += m.tiktokViews + m.reelsViews + m.shortsViews;
        acc.revenue += m.estimatedRevenueUsd;
        acc.watchSum += m.avgWatchPercent;
        return acc;
      },
      { views: 0, revenue: 0, watchSum: 0 }
    );
  }, [publishedClips]);

  const avgWatch = publishedClips.length > 0 ? Math.round(ledgerTotals.watchSum / publishedClips.length) : 0;

  function getActiveCopy(clip: ClipItem) {
    if (editingCaptions[clip.id]) return editingCaptions[clip.id];
    const loc = clip.activeLocale !== "en" ? clip.localizations[clip.activeLocale] : undefined;
    if (loc) {
      return {
        tiktokCaption: loc.tiktokCaption,
        reelsCaption: loc.reelsCaption,
        shortsTitle: loc.shortsTitle,
      };
    }
    return {
      tiktokCaption:
        clip.qaResult?.tiktokCaption ||
        `${clip.title} | Clip via ${clip.streamerHandle} #gaming #shorts`,
      reelsCaption:
        clip.qaResult?.reelsCaption ||
        `${clip.title} — Credit: ${clip.streamerHandle}`,
      shortsTitle: clip.qaResult?.shortsTitle || clip.title,
    };
  }

  function updateCaptionField(
    clip: ClipItem,
    field: "tiktokCaption" | "reelsCaption" | "shortsTitle",
    value: string
  ) {
    const current = getActiveCopy(clip);
    setEditingCaptions((prev) => ({
      ...prev,
      [clip.id]: { ...current, [field]: value },
    }));
  }

  async function saveClipCopy(clip: ClipItem) {
    const copy = editingCaptions[clip.id];
    if (!copy) return;

    if (clip.activeLocale !== "en" && clip.localizations[clip.activeLocale]) {
      const existingLoc = clip.localizations[clip.activeLocale]!;
      await onUpdateClip(clip.id, {
        localizations: {
          ...clip.localizations,
          [clip.activeLocale]: {
            ...existingLoc,
            tiktokCaption: copy.tiktokCaption,
            reelsCaption: copy.reelsCaption,
            shortsTitle: copy.shortsTitle,
          },
        },
      });
    } else if (clip.qaResult) {
      await onUpdateClip(clip.id, {
        qaResult: {
          ...clip.qaResult,
          tiktokCaption: copy.tiktokCaption,
          reelsCaption: copy.reelsCaption,
          shortsTitle: copy.shortsTitle,
        },
      });
    }
    setEditingCaptions((prev) => {
      const next = { ...prev };
      delete next[clip.id];
      return next;
    });
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function handleExportLedgerCsv() {
    if (publishedClips.length === 0) return;
    const headers = [
      "Clip ID",
      "Title",
      "Streamer",
      "Template",
      "Locale",
      "TikTok Views",
      "Reels Views",
      "Shorts Views",
      "Avg Watch %",
      "Est Revenue USD",
    ];
    const rows = publishedClips.map((c) => {
      const m = c.publishedMetrics!;
      return [
        c.id,
        `"${c.title.replace(/"/g, '""')}"`,
        c.streamerHandle,
        c.layout.template,
        c.activeLocale.toUpperCase(),
        m.tiktokViews,
        m.reelsViews,
        m.shortsViews,
        m.avgWatchPercent,
        m.estimatedRevenueUsd.toFixed(2),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipforge_revenue_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("success", `Exported ${publishedClips.length} published ledger row(s) to CSV.`);
  }

  function openMetricsModal(clip: ClipItem) {
    setMetricsClip(clip);
    setMetricsForm({
      tiktokViews: clip.publishedMetrics?.tiktokViews || 0,
      reelsViews: clip.publishedMetrics?.reelsViews || 0,
      shortsViews: clip.publishedMetrics?.shortsViews || 0,
      shares: clip.publishedMetrics?.shares || 0,
      comments: clip.publishedMetrics?.comments || 0,
      avgWatchPercent: clip.publishedMetrics?.avgWatchPercent || 74,
    });
  }

  async function handleSaveMetrics(e: React.FormEvent) {
    e.preventDefault();
    if (!metricsClip) return;
    const channel = config.channelFleet.find((ch) => ch.id === metricsClip.assignedChannelId);
    const rpm = channel?.assumedRpmUsd ?? config.publishing.assumedRpmUsd;
    const totalViews = metricsForm.tiktokViews + metricsForm.reelsViews + metricsForm.shortsViews;
    const estimatedRevenueUsd = Number(((totalViews / 1000) * rpm).toFixed(2));
    await onUpdateClip(metricsClip.id, {
      publishStatus: "published",
      publishedMetrics: {
        ...metricsForm,
        estimatedRevenueUsd,
      },
    });
    setMetricsClip(null);
  }

  async function handleAddChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannel.name.trim() || !newChannel.handle.trim()) return;
    const formattedHandle = newChannel.handle.startsWith("@")
      ? newChannel.handle.trim()
      : `@${newChannel.handle.trim()}`;
    const entry: ChannelAccount = {
      id: `ch_${Date.now().toString(36)}`,
      name: newChannel.name.trim(),
      handle: formattedHandle,
      locale: newChannel.locale,
      platforms: [
        "TikTok",
        "Instagram Reels",
        "YouTube Shorts",
        "X Video",
        "Snapchat Spotlight",
        "Facebook Reels",
      ],
      stage: newChannel.stage,
      dailyPostCap: Math.max(1, newChannel.dailyPostCap),
      staggerJitterMin: Math.max(5, newChannel.staggerJitterMin),
      assumedRpmUsd: Math.max(0.1, newChannel.assumedRpmUsd),
    };
    await onUpdateChannelFleet([...config.channelFleet, entry]);
    setNewChannel({
      name: "",
      handle: "",
      locale: "en",
      stage: "warmup",
      dailyPostCap: 3,
      staggerJitterMin: 18,
      assumedRpmUsd: 0.75,
    });
  }

  async function handleUpdateChannelField(channelId: string, patch: Partial<ChannelAccount>) {
    const next = config.channelFleet.map((ch) => (ch.id === channelId ? { ...ch, ...patch } : ch));
    await onUpdateChannelFleet(next);
  }

  async function handleRemoveChannel(channelId: string) {
    await onUpdateChannelFleet(config.channelFleet.filter((ch) => ch.id !== channelId));
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
      {/* Sub-Navigation Bar */}
      <div className="px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {(
            [
              { id: "desk", label: `Publish Desk (${clips.length})` },
              { id: "syndication", label: `Auto-Syndication & Heatmap (${syndicationRules.length})` },
              { id: "fleet", label: `Channel Fleet (${config.channelFleet.length})` },
              { id: "economics", label: "Economics & AI Loop" },
            ] as const
          ).map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`relative py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "text-[#0F172A] dark:text-[#F1F5F9]"
                    : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 py-2">
          <span>{totalFleetDailyCap} slots/day fleet cap</span>
          <span aria-hidden="true">/</span>
          <span>{publishedClips.length} published</span>
          <span aria-hidden="true">/</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            ${ledgerTotals.revenue.toFixed(2)} logged
          </span>
        </div>
      </div>

      {/* SUB-TAB 1: PUBLISH DESK */}
      {subTab === "desk" && (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0A0B0E]">
          {/* Filter & AI Fleet Auto-Scheduler Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center p-0.5 rounded-sm bg-[#F6F7F9] dark:bg-[#141720] border border-[#D9DEE7] dark:border-[#252A36]">
              {(["all", "ready", "scheduled", "published", "draft"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-xs capitalize transition-colors ${
                    statusFilter === status
                      ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400">
                Locale-matched channel routing + anti-bot stagger jitter.
              </span>
              <button
                type="button"
                onClick={onAutoScheduleFleet}
                disabled={isAutoScheduling}
                className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {isAutoScheduling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isAutoScheduling ? "Scheduling..." : "AI Auto-Schedule Fleet"}</span>
              </button>
            </div>
          </div>

          {filteredClips.length === 0 ? (
            <div className="p-14 text-center space-y-1.5">
              <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">No clips in this publish lane</p>
              <p className="text-xs text-slate-500">
                Finish a vertical cut in Studio and click Queue to route it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
              {filteredClips.map((clip) => {
                const copy = getActiveCopy(clip);
                const isDirty = Boolean(editingCaptions[clip.id]);
                const assignedChannel = config.channelFleet.find((ch) => ch.id === clip.assignedChannelId);
                const totalViews = clip.publishedMetrics
                  ? clip.publishedMetrics.tiktokViews +
                    clip.publishedMetrics.reelsViews +
                    clip.publishedMetrics.shortsViews
                  : 0;

                return (
                  <div
                    key={clip.id}
                    className="p-4 sm:px-6 space-y-4 hover:bg-[#F6F7F9]/60 dark:hover:bg-[#111318]/60 transition-colors"
                  >
                    {/* Top Row: Clip Meta + Channel Assignment + Status Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <QueueThumb src={clip.gameplayThumbnail} alt={clip.title} />
                        <div className="min-w-0">
                          <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                            {clip.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{clip.streamerHandle}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono uppercase">{clip.activeLocale}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{clip.layout.template}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-medium capitalize ${
                                clip.publishStatus === "published"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : clip.publishStatus === "scheduled"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : clip.publishStatus === "ready"
                                      ? "text-[#E1392B]"
                                      : "text-slate-500"
                              }`}
                            >
                              {clip.publishStatus}
                            </span>
                            {clip.scheduledFor && clip.publishStatus === "scheduled" && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[11px] tabular-nums">
                                  {new Date(clip.scheduledFor).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            )}
                            {clip.publishedMetrics && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {formatCompactNumber(totalViews)} views · ${clip.publishedMetrics.estimatedRevenueUsd.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <select
                          aria-label="Assign distribution channel"
                          value={clip.assignedChannelId || ""}
                          onChange={(e) => onUpdateClip(clip.id, { assignedChannelId: e.target.value || undefined })}
                          className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-xs font-mono text-[#0F172A] dark:text-slate-200"
                        >
                          <option value="">Unassigned Channel</option>
                          {config.channelFleet.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.handle} ({ch.locale.toUpperCase()} · ±{ch.staggerJitterMin}m)
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => onOpenInStudio(clip.id)}
                          className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:bg-slate-50 dark:hover:bg-[#1B1F2A] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                        >
                          <Clapperboard className="w-3.5 h-3.5" />
                          <span>Edit Cut</span>
                        </button>

                        {clip.publishStatus !== "scheduled" && clip.publishStatus !== "published" && (
                          <button
                            type="button"
                            onClick={() => {
                              const jitter = assignedChannel?.staggerJitterMin ?? config.publishing.staggerJitterMinutes;
                              const offsetMs = (config.publishing.minSpacingMinutes + Math.round(jitter * 0.5)) * 60_000;
                              onUpdateClip(clip.id, {
                                publishStatus: "scheduled",
                                scheduledFor: new Date(Date.now() + offsetMs).toISOString(),
                              });
                            }}
                            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:bg-slate-50 dark:hover:bg-[#1B1F2A] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>Stagger Schedule</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openMetricsModal(clip)}
                          className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1"
                        >
                          {clip.publishStatus === "published" ? (
                            <>
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Edit Metrics</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Published</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Editable Multi-Platform Metadata Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                      {(
                        [
                          { key: "tiktokCaption", label: "TIKTOK CAPTION" },
                          { key: "reelsCaption", label: "INSTAGRAM REELS" },
                          { key: "shortsTitle", label: "YOUTUBE SHORTS TITLE" },
                        ] as const
                      ).map((field) => {
                        const copyId = `${clip.id}_${field.key}`;
                        return (
                          <div
                            key={field.key}
                            className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <span>{field.label}</span>
                              <button
                                type="button"
                                onClick={() => copyText(copyId, copy[field.key])}
                                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B]"
                              >
                                {copiedKey === copyId ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedKey === copyId ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={copy[field.key]}
                              onChange={(e) => updateCaptionField(clip, field.key, e.target.value)}
                              className="w-full bg-transparent text-xs text-[#0F172A] dark:text-slate-200 focus:outline-none resize-none leading-relaxed"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {isDirty && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveClipCopy(clip)}
                          className="h-7 px-3 rounded-sm bg-[#E1392B] text-white text-xs font-semibold"
                        >
                          Save Metadata Edits ({clip.activeLocale.toUpperCase()})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 1B: AUTO-SYNDICATION RULES ENGINE & BEST-TIME-TO-POST HEATMAP */}
      {subTab === "syndication" && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 bg-white dark:bg-[#0A0B0E]">
          {/* Left 7 cols: Repurpose.io-Better Syndication Rules + Pre-Flight Guard */}
          <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] p-5 space-y-5 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                <Repeat className="w-4 h-4 text-[#E1392B]" />
                <span>Watermark-Free Auto-Syndication Rules &amp; Pre-Flight Health Guard</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Unlike brittle cross-posters that silently fail on API changes, every rule includes pre-flight metadata validation, automatic retries, and a safe fallback queue.
              </p>
            </div>

            <div className="space-y-3">
              {syndicationRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/70 dark:bg-[#111318] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4 accent-[#E1392B]"
                        aria-label={`Toggle ${rule.name}`}
                      />
                      <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                        {rule.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={checkingRuleId === rule.id}
                        onClick={() => handleRunPreFlight(rule.id)}
                        className="h-7 px-2.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1"
                      >
                        {checkingRuleId === rule.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        <span>Run Pre-Flight Check</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        aria-label={`Delete ${rule.name}`}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span>Trigger: {rule.triggerNiche.toUpperCase()}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rule.stripWatermark ? "Strip Watermark: ON" : "Keep Watermark"}</span>
                    <span aria-hidden="true">·</span>
                    <span>Auto-Retry + Fallback Queue: ON</span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-mono text-slate-500">Targets: </span>
                    {rule.targets.join(" · ")}
                  </div>

                  {rule.lastHealthSummary && (
                    <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Last Pre-Flight: {rule.lastHealthSummary}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {dryRunResult && (
              <div className="p-4 rounded-sm border border-[#E1392B]/40 bg-[#E1392B]/5 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-[#E1392B]">PRE-FLIGHT AUDIT REPORT</span>
                  <span className="text-slate-500">{dryRunResult.summary}</span>
                </div>
                <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
                  {dryRunResult.checks.map((chk) => (
                    <div key={chk.clipId} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate">{chk.title}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          chk.status === "pass"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {chk.status.toUpperCase()} — {chk.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Syndication Rule */}
            <form
              onSubmit={handleAddRule}
              className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#111318] space-y-3"
            >
              <div className="font-mono text-[11px] text-slate-500">NEW AUTO-SYNDICATION RULE</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Rule name (e.g. Podcast 6-Platform Blast)"
                  className="sm:col-span-2 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0D0F14]"
                />
                <select
                  value={newRuleNiche}
                  onChange={(e) => setNewRuleNiche(e.target.value as "all" | ContentNiche)}
                  className="h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0D0F14]"
                >
                  <option value="all">All Niches</option>
                  <option value="gaming">Gaming</option>
                  <option value="tech-ai">AI &amp; Tech</option>
                  <option value="podcasts">Podcasts</option>
                  <option value="finance">Finance</option>
                  <option value="faceless-doc">Faceless Doc</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_PLATFORMS.map((plat) => {
                  const active = newRuleTargets.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() =>
                        setNewRuleTargets((prev) =>
                          prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
                        )
                      }
                      className={`h-7 px-2.5 rounded-sm border text-[11px] font-medium ${
                        active
                          ? "border-[#E1392B] bg-[#E1392B]/10 text-[#E1392B]"
                          : "border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] text-slate-500"
                      }`}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newRuleStripWatermark}
                    onChange={(e) => setNewRuleStripWatermark(e.target.checked)}
                    className="accent-[#E1392B]"
                  />
                  <span>Strip source platform watermark before cross-posting</span>
                </label>
                <button
                  type="submit"
                  className="h-8 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 cols: Metricool-Style 7×24 Best-Time-to-Post Velocity Heatmap */}
          <div className="xl:col-span-5 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                <Clock className="w-4 h-4 text-[#E1392B]" />
                <span>Best-Time-to-Post Velocity Heatmap</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Click any peak crimson window (90+) to schedule your next Ready clip directly into that slot with anti-bot jitter.
              </p>
            </div>

            <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] p-3.5 rounded-sm space-y-2">
              <div className="grid grid-cols-7 gap-1.5 text-[10px] font-mono text-slate-500 text-center">
                <div className="text-left">DAY</div>
                {HEATMAP_HOURS.map((h) => (
                  <div key={h.hour}>{h.label}</div>
                ))}
              </div>
              {HEATMAP_DAYS.map((day, dIdx) => (
                <div key={day} className="grid grid-cols-7 gap-1.5 items-center">
                  <div className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {day}
                  </div>
                  {HEATMAP_HOURS.map((h, hIdx) => {
                    const score = HEATMAP_SCORES[day][hIdx];
                    const cellClass =
                      score >= 92
                        ? "bg-[#E1392B] text-white font-bold"
                        : score >= 82
                          ? "bg-[#E1392B]/65 text-white font-semibold"
                          : score >= 70
                            ? "bg-[#E1392B]/30 text-[#0F172A] dark:text-slate-100"
                            : "bg-[#ECEFF3] dark:bg-[#1B1F2A] text-slate-500";
                    return (
                      <button
                        key={`${day}_${h.hour}`}
                        type="button"
                        onClick={() => handleScheduleHeatmapSlot(dIdx, h.hour, score)}
                        title={`Schedule next ready clip for ${day} ${h.label} (Velocity ${score}/100)`}
                        className={`h-8 rounded-xs font-mono text-[11px] tabular-nums transition-transform hover:scale-[1.04] ${cellClass}`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Peak Breakout Windows: Thu–Sat 18:00–21:00</span>
                <span>Click cell to schedule</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MULTI-CHANNEL FLEET & WARMUP SCHEDULER */}
      {subTab === "fleet" && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 bg-white dark:bg-[#0A0B0E]">
          {/* Left: Fleet Matrix */}
          <div className="xl:col-span-8 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] overflow-x-auto">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <Layers className="w-3.5 h-3.5 text-[#E1392B]" />
                <span>ACTIVE CHANNEL FLEET &amp; WARMUP LIMITS</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                Total Capacity: {totalFleetDailyCap} posts/day
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/85 dark:bg-[#111318] font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">CHANNEL</th>
                  <th className="py-2.5 px-3">LOCALE</th>
                  <th className="py-2.5 px-3">STAGE</th>
                  <th className="py-2.5 px-3 text-right">DAILY CAP</th>
                  <th className="py-2.5 px-3 text-right">JITTER (±M)</th>
                  <th className="py-2.5 px-3 text-right">RPM ($)</th>
                  <th className="py-2.5 px-4 text-right">DEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1C2029]">
                {config.channelFleet.map((ch) => (
                  <tr key={ch.id} className="hover:bg-[#F6F7F9] dark:hover:bg-[#12151C]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{ch.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{ch.handle}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={ch.locale}
                        onChange={(e) =>
                          handleUpdateChannelField(ch.id, { locale: e.target.value as SupportedLocale })
                        }
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-mono uppercase"
                      >
                        {(["en", "es", "pt", "fr", "de", "ja", "ko", "hi", "ar", "id", "tr", "it"] as const).map((loc) => (
                          <option key={loc} value={loc}>
                            {loc.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={ch.stage}
                        onChange={(e) =>
                          handleUpdateChannelField(ch.id, {
                            stage: e.target.value as ChannelAccount["stage"],
                          })
                        }
                        className={`h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-medium capitalize ${
                          ch.stage === "monetized"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : ch.stage === "scaling"
                              ? "text-[#E1392B]"
                              : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <option value="warmup">Warmup (Low Vol)</option>
                        <option value="scaling">Scaling</option>
                        <option value="monetized">Monetized</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={ch.dailyPostCap}
                        onChange={(e) =>
                          handleUpdateChannelField(ch.id, { dailyPostCap: Math.max(1, Number(e.target.value)) })
                        }
                        className="w-14 h-7 px-2 text-right font-mono tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={ch.staggerJitterMin}
                        onChange={(e) =>
                          handleUpdateChannelField(ch.id, { staggerJitterMin: Math.max(5, Number(e.target.value)) })
                        }
                        className="w-16 h-7 px-2 text-right font-mono tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min={0.1}
                        max={10}
                        step={0.05}
                        value={ch.assumedRpmUsd}
                        onChange={(e) =>
                          handleUpdateChannelField(ch.id, { assumedRpmUsd: Math.max(0.1, Number(e.target.value)) })
                        }
                        className="w-16 h-7 px-2 text-right font-mono tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveChannel(ch.id)}
                        aria-label={`Remove ${ch.name}`}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: Provision Channel Form */}
          <div className="xl:col-span-4 p-5 bg-[#F6F7F9] dark:bg-[#111318] space-y-4 text-xs">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#E1392B]" />
                <span>ADD DISTRIBUTION CHANNEL</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Separate regional channels (e.g. EN Main, ES LATAM, PT BR) with independent warmup caps and anti-bot timing jitter.
              </p>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Channel Label</label>
                <input
                  type="text"
                  required
                  value={newChannel.name}
                  onChange={(e) => setNewChannel((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g., Vice City Clips DE"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Handle</label>
                  <input
                    type="text"
                    required
                    value={newChannel.handle}
                    onChange={(e) => setNewChannel((s) => ({ ...s, handle: e.target.value }))}
                    placeholder="@viceclips_de"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Language</label>
                  <select
                    value={newChannel.locale}
                    onChange={(e) => setNewChannel((s) => ({ ...s, locale: e.target.value as SupportedLocale }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono uppercase"
                  >
                    <option value="en">EN · English</option>
                    <option value="es">ES · Spanish</option>
                    <option value="pt">PT · Portuguese</option>
                    <option value="fr">FR · French</option>
                    <option value="de">DE · German</option>
                    <option value="ja">JA · Japanese</option>
                    <option value="ko">KO · Korean</option>
                    <option value="hi">HI · Hindi</option>
                    <option value="ar">AR · Arabic</option>
                    <option value="id">ID · Indonesian</option>
                    <option value="tr">TR · Turkish</option>
                    <option value="it">IT · Italian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Daily Cap</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={newChannel.dailyPostCap}
                    onChange={(e) => setNewChannel((s) => ({ ...s, dailyPostCap: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Jitter (±m)</label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={newChannel.staggerJitterMin}
                    onChange={(e) => setNewChannel((s) => ({ ...s, staggerJitterMin: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">RPM ($)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.05}
                    value={newChannel.assumedRpmUsd}
                    onChange={(e) => setNewChannel((s) => ({ ...s, assumedRpmUsd: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Channel to Fleet</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: UNIT ECONOMICS & CLOSED-LOOP AI OPTIMIZER */}
      {subTab === "economics" && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 bg-white dark:bg-[#0A0B0E]">
          {/* Left: Unit Economics Calculator & Published Ledger */}
          <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] flex flex-col">
            <div className="p-5 border-b border-[#D9DEE7] dark:border-[#222631] space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] text-slate-500">UNIT ECONOMICS SIMULATOR</div>
                <span className="text-[11px] font-mono text-slate-500">
                  Fleet Max: {totalFleetDailyCap} shorts/day
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Daily Goal ($/day)</label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={targetDailyUsd}
                    onChange={(e) => setTargetDailyUsd(Math.max(10, Number(e.target.value)))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Blended RPM ($/1K)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.05}
                    value={assumedRpm}
                    onChange={(e) => setAssumedRpm(Math.max(0.1, Number(e.target.value)))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Avg Views / Short</label>
                  <input
                    type="number"
                    min={500}
                    step={1000}
                    value={avgViewsPerShort}
                    onChange={(e) => setAvgViewsPerShort(Math.max(500, Number(e.target.value)))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Flat Hairline Strip Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D9DEE7] dark:border-[#222631] divide-y sm:divide-y-0 sm:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
                <div className="p-3">
                  <div className="text-[10px] font-mono text-slate-500">REQ. DAILY VIEWS</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                    {formatCompactNumber(economics.requiredDailyViews)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-mono text-slate-500">SHORTS / DAY</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums text-[#E1392B]">
                    {economics.shortsPerDayNeeded}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-mono text-slate-500">30-DAY RUN RATE</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${economics.projectedMonthlyUsd.toLocaleString()}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-mono text-slate-500">LOGGED AVG WATCH</div>
                  <div className="mt-1 font-mono text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                    {avgWatch}%
                  </div>
                </div>
              </div>
            </div>

            {/* Published Performance Ledger */}
            <div className="flex-1 overflow-x-auto">
              <div className="px-5 py-3 border-b border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-slate-500">PUBLISHED TELEMETRY LEDGER</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-slate-500">
                    {formatCompactNumber(ledgerTotals.views)} views · ${ledgerTotals.revenue.toFixed(2)}
                  </span>
                  {publishedClips.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportLedgerCsv}
                      className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] hover:border-[#E1392B] font-mono text-[11px] inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {publishedClips.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  Log views on published clips in Publish Desk to feed the Gemini feedback loop.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/85 dark:bg-[#111318] font-mono text-[11px] text-slate-500">
                      <th className="py-2 px-4">CLIP</th>
                      <th className="py-2 px-3 text-right">TIKTOK</th>
                      <th className="py-2 px-3 text-right">REELS</th>
                      <th className="py-2 px-3 text-right">SHORTS</th>
                      <th className="py-2 px-3 text-right">HOLD %</th>
                      <th className="py-2 px-4 text-right">EST. REV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1C2029]">
                    {publishedClips.map((c) => {
                      const m = c.publishedMetrics!;
                      return (
                        <tr key={c.id}>
                          <td className="py-2.5 px-4 max-w-[200px]">
                            <div className="font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate">{c.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {c.layout.template} · hook {c.layout.hookDurationSec}s
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCompactNumber(m.tiktokViews)}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCompactNumber(m.reelsViews)}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCompactNumber(m.shortsViews)}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{m.avgWatchPercent}%</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            ${m.estimatedRevenueUsd.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: Gemini Closed-Loop Feedback Optimizer */}
          <div className="xl:col-span-5 p-5 bg-[#F6F7F9] dark:bg-[#111318] space-y-5 text-xs">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#D9DEE7] dark:border-[#222631]">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-slate-500">CLOSED-LOOP STRATEGY ENGINE</div>
                <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Gemini Rule Optimizer
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Audits logged clip retention &amp; revenue to patch <code className="font-mono">pipeline.config.json</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={onRunOptimizer}
                disabled={isOptimizing}
                className="h-9 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isOptimizing ? "Analyzing..." : "Optimize"}</span>
              </button>
            </div>

            {recommendation ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] space-y-2">
                  <p className="text-[#0F172A] dark:text-slate-200 leading-relaxed">{recommendation.summary}</p>
                  <div className="pt-2 border-t border-[#ECEFF3] dark:border-[#222631] space-y-1">
                    <div>
                      <span className="font-mono text-slate-500">WINNING PATTERN: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {recommendation.topWinningPattern}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-slate-500">BOTTLENECK: </span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {recommendation.bottleneckDiagnosis}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-slate-500">PROPOSED CONFIG PATCH</div>
                  {recommendation.suggestedChanges.map((ch, idx) => (
                    <div
                      key={`${ch.field}_${idx}`}
                      className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 font-mono">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{ch.field}</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-400 line-through">{ch.currentValue}</span>
                          <ArrowRight className="w-3 h-3 text-[#E1392B]" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {ch.recommendedValue}
                          </span>
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{ch.rationale}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={applyingPatch}
                  onClick={async () => {
                    setApplyingPatch(true);
                    try {
                      await onApplyStrategyPatch(recommendation.configPatch);
                    } finally {
                      setApplyingPatch(false);
                    }
                  }}
                  className="w-full h-9 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                >
                  {applyingPatch ? "Applying Patch..." : "Apply Patch to pipeline.config.json"}
                </button>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-center text-slate-500 space-y-1.5">
                <p className="font-medium text-[#0F172A] dark:text-slate-300">No optimization patch generated yet</p>
                <p>Click Optimize to analyze published telemetry and tune thresholds for the next GitHub Action run.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Live Performance Metrics Modal */}
      {metricsClip && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Log Published Clip Performance
              </h3>
              <button
                type="button"
                onClick={() => setMetricsClip(null)}
                aria-label="Close metrics modal"
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetrics} className="p-5 space-y-3.5 text-xs">
              <div className="font-medium text-[#0F172A] dark:text-slate-200 truncate">{metricsClip.title}</div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-500 mb-1">TikTok Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.tiktokViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, tiktokViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Reels Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.reelsViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, reelsViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Shorts Views</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.shortsViews}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, shortsViews: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-500 mb-1">Shares</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.shares}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, shares: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Comments</label>
                  <input
                    type="number"
                    min={0}
                    value={metricsForm.comments}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, comments: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Avg Watch %</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={metricsForm.avgWatchPercent}
                    onChange={(e) => setMetricsForm((f) => ({ ...f, avgWatchPercent: Number(e.target.value) }))}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMetricsClip(null)}
                  className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36]"
                >
                  Cancel
                </button>
                <button type="submit" className="h-9 px-4 rounded-sm bg-[#E1392B] text-white font-semibold">
                  Save &amp; Feed Optimizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
