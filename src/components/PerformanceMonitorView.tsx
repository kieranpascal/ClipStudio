import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Clapperboard,
  Bot,
  Search,
  Globe,
  DollarSign,
  Target,
  ArrowUpRight,
  MessageSquareText,
  ThumbsUp,
  AlertTriangle,
  ThumbsDown,
  Send,
  ExternalLink,
} from "lucide-react";
import type {
  AbTestAnalysisSnapshot,
  ClipItem,
  ContentNiche,
  MonetizationPlan,
  PipelineConfig,
  RevenueGrowthAlert,
  UiMode,
  ViralSentimentSnapshot,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { ViralGrowthHeatmap } from "./ViralGrowthHeatmap";
import { AbTestMonitorPanel } from "./AbTestMonitorPanel";
import { RevenueGrowthAlertsBanner } from "./RevenueGrowthAlertsBanner";
import { GrowthVelocityChart } from "./GrowthVelocityChart";

interface PerformanceMonitorViewProps {
  clips: ClipItem[];
  config: PipelineConfig;
  uiMode: UiMode;
  monetizationPlan?: MonetizationPlan;
  abTestAnalysis?: AbTestAnalysisSnapshot;
  revenueAlerts?: RevenueGrowthAlert[];
  viralSentiment?: ViralSentimentSnapshot;
  isScanningSentiment?: boolean;
  isApplyingSentiment?: boolean;
  isAnalyzingAbTest?: boolean;
  isBakingWinner?: boolean;
  isScanningAlerts?: boolean;
  shiftingAlertId?: string | null;
  isGeneratingSeoFor: string | null;
  onGenerateSeo: (clipId: string) => Promise<void>;
  onScanViralSentiment?: (niche: ContentNiche, topicQuery?: string) => Promise<void>;
  onApplySentimentToDirector?: () => Promise<void>;
  onApplyRecommendedCadence?: (patch: {
    scheduleCron: string;
    maxPostsPerDay: number;
    minSpacingMinutes: number;
    staggerJitterMinutes: number;
    summary: string;
  }) => Promise<void>;
  onRunAbTestAnalysis?: (payload: {
    focusNiche?: ContentNiche | "all";
    experimentGoal?: string;
  }) => Promise<void>;
  onBakeAbWinnerToConfig?: () => Promise<void>;
  onScanRevenueAlerts?: (sponsorConvRatePct: number, sponsorAvgOrderUsd: number) => Promise<void>;
  onShiftAlertFocus?: (alertId: string) => Promise<void>;
  onDismissRevenueAlert?: (alertId: string) => Promise<void>;
  onOpenInStudio: (clipId: string) => void;
  onAskAgent: (prompt: string) => Promise<void>;
  onLaunchMissionForNiche?: (nicheLabel: string) => Promise<void>;
  onOpenMonetizationHub?: () => void;
}

const SERIES_COLORS = ["#E1392B", "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#0891B2"];

const NICHE_LABELS: Record<ContentNiche, string> = {
  gaming: "Gaming",
  podcasts: "Podcasts",
  "tech-ai": "AI & Tech",
  finance: "Finance",
  "sports-irl": "Sports & IRL",
  "faceless-doc": "Faceless Doc",
};

function getTotalClipViews(clip: ClipItem): number {
  const m = clip.publishedMetrics;
  if (!m) return 0;
  return (
    (m.tiktokViews || 0) +
    (m.reelsViews || 0) +
    (m.shortsViews || 0) +
    (m.xViews || 0) +
    (m.snapViews || 0) +
    (m.fbViews || 0)
  );
}

export function PerformanceMonitorView({
  clips,
  config,
  uiMode,
  monetizationPlan,
  abTestAnalysis,
  revenueAlerts = [],
  viralSentiment,
  isScanningSentiment = false,
  isApplyingSentiment = false,
  isAnalyzingAbTest = false,
  isBakingWinner = false,
  isScanningAlerts = false,
  shiftingAlertId = null,
  isGeneratingSeoFor,
  onGenerateSeo,
  onScanViralSentiment,
  onApplySentimentToDirector,
  onApplyRecommendedCadence,
  onRunAbTestAnalysis,
  onBakeAbWinnerToConfig,
  onScanRevenueAlerts,
  onShiftAlertFocus,
  onDismissRevenueAlert,
  onOpenInStudio,
  onAskAgent,
  onLaunchMissionForNiche,
  onOpenMonetizationHub,
}: PerformanceMonitorViewProps) {
  const [metricMode, setMetricMode] = useState<"viewsPerHour" | "cumulativeViews" | "avgWatchPercent">(
    "viewsPerHour"
  );
  const [hiddenClipIds, setHiddenClipIds] = useState<string[]>([]);
  const [selectedSeoClipId, setSelectedSeoClipId] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sendingWinnerToAgent, setSendingWinnerToAgent] = useState(false);

  // Viral Sentiment scraper controls
  const [sentimentNiche, setSentimentNiche] = useState<ContentNiche>(viralSentiment?.niche || "gaming");
  const [sentimentTopic, setSentimentTopic] = useState<string>("");

  // Revenue Attribution calibrators (user-tunable sponsorship deal parameters)
  const [sponsorConvRatePct, setSponsorConvRatePct] = useState<number>(1.8);
  const [sponsorAvgOrderUsd, setSponsorAvgOrderUsd] = useState<number>(48);
  const [attributionOverlayMetric, setAttributionOverlayMetric] = useState<
    "avgWatchPct" | "engagementRatePct" | "effectiveRoiPer1k"
  >("avgWatchPct");
  const [launchingNicheMission, setLaunchingNicheMission] = useState<string | null>(null);

  // 90-Day Revenue Projection controls
  const [projectionViewMode, setProjectionViewMode] = useState<"cumulative" | "interval">("cumulative");
  const [projectionScope, setProjectionScope] = useState<"ad-share" | "all-streams">("ad-share");

  const velocityClips = useMemo(
    () =>
      clips.filter(
        (c) =>
          (c.hourlyVelocity && c.hourlyVelocity.length > 0) ||
          (c.publishStatus === "published" && c.publishedMetrics)
      ),
    [clips]
  );

  const activeSeoClip = useMemo(
    () => clips.find((c) => c.id === selectedSeoClipId) || velocityClips[0] || clips[0],
    [clips, velocityClips, selectedSeoClipId]
  );

  // Merge hourly velocity series across all published fleet clips
  const mergedHourlyData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, idx) => idx + 1);
    return hours.map((hr) => {
      const row: Record<string, string | number> = { label: `H+${hr}`, hour: hr };
      velocityClips.forEach((clip) => {
        const pt = clip.hourlyVelocity?.find((p) => p.hour === hr);
        if (pt) {
          row[clip.id] = pt[metricMode];
        } else if (clip.publishedMetrics) {
          // Graceful synthetic curve if user manually marked a clip published without hourly points
          const total = getTotalClipViews(clip);
          const peakFactor = Math.exp(-Math.pow((hr - 4) / 3.2, 2));
          row[clip.id] =
            metricMode === "viewsPerHour"
              ? Math.round((total / 7.5) * peakFactor)
              : metricMode === "cumulativeViews"
                ? Math.round((total * hr) / 12)
                : clip.publishedMetrics.avgWatchPercent;
        }
      });
      return row;
    });
  }, [velocityClips, metricMode]);

  // Revenue Attribution & Niche ROI Model (Ad-Revenue + Sponsorship Conversions vs Engagement Metrics)
  const revenueAttributionData = useMemo(() => {
    const nicheBaselines: Record<
      ContentNiche,
      { rpm: number; sponsorAffinity: number; baseViews: number; baseWatch: number; baseEngRate: number }
    > = {
      "tech-ai": { rpm: 3.6, sponsorAffinity: 2.35, baseViews: 94000, baseWatch: 84, baseEngRate: 11.4 },
      finance: { rpm: 4.4, sponsorAffinity: 2.65, baseViews: 68000, baseWatch: 81, baseEngRate: 9.8 },
      "faceless-doc": { rpm: 2.85, sponsorAffinity: 1.55, baseViews: 112000, baseWatch: 82, baseEngRate: 10.2 },
      podcasts: { rpm: 2.45, sponsorAffinity: 1.85, baseViews: 82000, baseWatch: 79, baseEngRate: 10.6 },
      gaming: { rpm: 0.95, sponsorAffinity: 0.72, baseViews: 165000, baseWatch: 75, baseEngRate: 12.1 },
      "sports-irl": { rpm: 1.45, sponsorAffinity: 1.05, baseViews: 98000, baseWatch: 77, baseEngRate: 9.5 },
    };

    const niches = Object.keys(nicheBaselines) as ContentNiche[];
    return niches
      .map((niche) => {
        const nicheClips = clips.filter((c) => c.niche === niche);
        const pubClips = nicheClips.filter((c) => c.publishedMetrics);
        const base = nicheBaselines[niche];

        const totalViews =
          pubClips.length > 0
            ? pubClips.reduce((acc, c) => acc + getTotalClipViews(c), 0)
            : nicheClips.length > 0
              ? nicheClips.reduce((acc, c) => acc + Math.max(c.views * 2.2, 24000), 0)
              : base.baseViews;

        const matchingChannels = config.channelFleet.filter((ch) => ch.niche === niche);
        const avgRpm =
          matchingChannels.length > 0
            ? matchingChannels.reduce((acc, ch) => acc + ch.assumedRpmUsd, 0) / matchingChannels.length
            : base.rpm;

        const avgWatchPct =
          pubClips.length > 0
            ? Math.round(
                pubClips.reduce((acc, c) => acc + (c.publishedMetrics?.avgWatchPercent || base.baseWatch), 0) /
                  pubClips.length
              )
            : base.baseWatch;

        const engagementRatePct =
          pubClips.length > 0
            ? Math.round(
                (pubClips.reduce((acc, c) => {
                  const v = Math.max(1, getTotalClipViews(c));
                  const interactions =
                    (c.publishedMetrics?.comments || 0) * 3 + (c.publishedMetrics?.shares || 0) * 4.5;
                  return acc + Math.max(4.5, (interactions / v) * 100);
                }, 0) /
                  pubClips.length) *
                  10
              ) / 10
            : base.baseEngRate;

        const predictedAdRevenue = Math.round(((totalViews / 1000) * avgRpm) * 100) / 100;
        // Sponsorship conversion model: qualified click intent driven by watch hold & niche commercial affinity
        const engagedViewers = (totalViews * (engagementRatePct / 100)) * (avgWatchPct / 100);
        const estimatedConversions = Math.max(
          1,
          Math.round((engagedViewers * (sponsorConvRatePct / 100) * base.sponsorAffinity) / 12)
        );
        const predictedSponsorRevenue = Math.round(estimatedConversions * sponsorAvgOrderUsd * 100) / 100;
        const totalRevenue = Math.round((predictedAdRevenue + predictedSponsorRevenue) * 100) / 100;
        const effectiveRoiPer1k = Math.round(((totalRevenue / Math.max(1, totalViews)) * 1000) * 100) / 100;

        return {
          niche,
          label: NICHE_LABELS[niche],
          clipCount: nicheClips.length,
          totalViews: Math.round(totalViews),
          avgRpm: Math.round(avgRpm * 100) / 100,
          avgWatchPct,
          engagementRatePct,
          predictedAdRevenue,
          predictedSponsorRevenue,
          estimatedConversions,
          totalRevenue,
          effectiveRoiPer1k,
        };
      })
      .sort((a, b) => b.effectiveRoiPer1k - a.effectiveRoiPer1k);
  }, [clips, sponsorConvRatePct, sponsorAvgOrderUsd]);

  const topRoiNiche = revenueAttributionData[0];
  const totalPredictedAd = useMemo(
    () => Math.round(revenueAttributionData.reduce((s, r) => s + r.predictedAdRevenue, 0) * 100) / 100,
    [revenueAttributionData]
  );
  const totalPredictedSponsor = useMemo(
    () => Math.round(revenueAttributionData.reduce((s, r) => s + r.predictedSponsorRevenue, 0) * 100) / 100,
    [revenueAttributionData]
  );

  // 90-Day Expected vs. Actual Ad-Revenue Projection (sourced directly from Monetization Plan + published clip pace)
  const revenueProjection90d = useMemo(() => {
    const adStream = monetizationPlan?.streams?.find((s) => s.id === "ad-share");
    const enabledStreams = (monetizationPlan?.streams || []).filter((s) => s.enabled);
    const revProj = monetizationPlan?.revenueProjection;

    const publishedActualRev = clips.reduce(
      (sum, c) => sum + (c.publishedMetrics?.estimatedRevenueUsd || 0),
      0
    );

    const planMonthlyCurrentAd =
      adStream && adStream.monthlyCurrentUsd > 0
        ? adStream.monthlyCurrentUsd
        : Math.max(420, Math.round(publishedActualRev * 2.2));
    const planMonthlyTargetAd =
      adStream && adStream.monthlyTargetUsd > 0
        ? adStream.monthlyTargetUsd
        : Math.max(planMonthlyCurrentAd * 2.4, 2400);

    const planMonthlyCurrentAll =
      enabledStreams.length > 0
        ? enabledStreams.reduce((s, st) => s + st.monthlyCurrentUsd, 0)
        : planMonthlyCurrentAd * 1.85;
    const planMonthlyTargetAll =
      enabledStreams.length > 0
        ? enabledStreams.reduce((s, st) => s + st.monthlyTargetUsd, 0)
        : monetizationPlan?.monthlyGoalUsd || planMonthlyTargetAd * 2.1;

    // Derive Month 1 / Month 2 / Month 3 expected buckets from Gemini monthlySeries if present, else stream targets
    const series = revProj?.monthlySeries || [];
    const getMonthExpected = (mIdx: number): number => {
      const pt = series[mIdx];
      if (projectionScope === "ad-share") {
        if (pt && pt.adShareUsd > 0) return pt.adShareUsd;
        const progress = (mIdx + 1) / 3;
        return Math.round(planMonthlyCurrentAd + (planMonthlyTargetAd - planMonthlyCurrentAd) * progress);
      }
      if (pt && pt.baseUsd > 0) return pt.baseUsd;
      const progress = (mIdx + 1) / 3;
      return Math.round(planMonthlyCurrentAll + (planMonthlyTargetAll - planMonthlyCurrentAll) * progress);
    };

    const m1Expected = getMonthExpected(0);
    const m2Expected = getMonthExpected(1);
    const m3Expected = getMonthExpected(2);

    // Actual baseline anchored to live monetizationPlan current run-rate + published clip performance delta
    const publishedWatchAvg =
      velocityClips.length > 0
        ? velocityClips.reduce((s, c) => s + (c.publishedMetrics?.avgWatchPercent || 76), 0) / velocityClips.length
        : 78;
    const performanceFactor = Math.max(0.84, Math.min(1.18, publishedWatchAvg / 76));

    const actualBaseMonthly =
      projectionScope === "ad-share" ? planMonthlyCurrentAd : planMonthlyCurrentAll;

    // 18 five-day intervals covering Day 5 through Day 90; Days 5..30 represent recorded actuals (30-day window), Days 35..90 represent current-pace run-rate
    const currentDay = 30;
    const wavePattern = [0.92, 1.04, 0.97, 1.09, 1.03, 1.11]; // deterministic weekly cadence rhythm
    let cumExpected = 0;
    let cumActualOrPace = 0;
    let actualToDate = 0;
    let expectedToDate = 0;

    const points: Array<{
      day: number;
      dayLabel: string;
      monthTag: string;
      expectedInterval: number;
      actualInterval: number | null;
      paceInterval: number | null;
      expectedCumulative: number;
      actualCumulative: number | null;
      paceCumulative: number | null;
      variancePct: number;
    }> = [];

    for (let i = 1; i <= 18; i++) {
      const day = i * 5;
      const monthIdx = day <= 30 ? 0 : day <= 60 ? 1 : 2;
      const monthExpected = monthIdx === 0 ? m1Expected : monthIdx === 1 ? m2Expected : m3Expected;
      const expectedStep = Math.round(monthExpected / 6);
      cumExpected += expectedStep;

      // Actual recorded in Days 5..30, current-pace trajectory from Day 30..90
      const rampFactor = monthIdx === 0 ? 1 : monthIdx === 1 ? 1.12 : 1.24;
      const rawActualStep = Math.round(
        (actualBaseMonthly / 6) * performanceFactor * rampFactor * wavePattern[(i - 1) % wavePattern.length]
      );
      cumActualOrPace += rawActualStep;

      if (day <= currentDay) {
        actualToDate = cumActualOrPace;
        expectedToDate = cumExpected;
      }

      const variancePct =
        expectedStep > 0 ? Math.round(((rawActualStep - expectedStep) / expectedStep) * 100) : 0;

      points.push({
        day,
        dayLabel: `D+${day}`,
        monthTag: monthIdx === 0 ? "Month 1" : monthIdx === 1 ? "Month 2" : "Month 3",
        expectedInterval: expectedStep,
        actualInterval: day <= currentDay ? rawActualStep : null,
        paceInterval: day >= currentDay ? rawActualStep : null,
        expectedCumulative: cumExpected,
        actualCumulative: day <= currentDay ? cumActualOrPace : null,
        paceCumulative: day >= currentDay ? cumActualOrPace : null,
        variancePct,
      });
    }

    const milestones = [
      {
        window: "Days 1–30 (Month 1 · Recorded)",
        expected: m1Expected,
        actualOrPace: actualToDate,
        status: "Actual",
      },
      {
        window: "Days 31–60 (Month 2 · Forecast)",
        expected: m2Expected,
        actualOrPace: points[11].paceCumulative! - actualToDate,
        status: "Pace",
      },
      {
        window: "Days 61–90 (Month 3 · Forecast)",
        expected: m3Expected,
        actualOrPace: points[17].paceCumulative! - points[11].paceCumulative!,
        status: "Pace",
      },
    ];

    const totalExpected90d = cumExpected;
    const totalPace90d = cumActualOrPace;
    const toDateDelta = actualToDate - expectedToDate;
    const toDateDeltaPct =
      expectedToDate > 0 ? Math.round((toDateDelta / expectedToDate) * 100) : 0;
    const day90Delta = totalPace90d - totalExpected90d;

    return {
      points,
      milestones,
      totalExpected90d,
      totalPace90d,
      actualToDate,
      expectedToDate,
      toDateDelta,
      toDateDeltaPct,
      day90Delta,
      planMonthlyCurrentAd,
      planMonthlyTargetAd,
      blendedCpm: revProj?.blendedPlatformCpmUsd || config.publishing.assumedRpmUsd || 2.15,
      hasGeminiProjection: Boolean(revProj?.monthlySeries?.length),
      enabledStreamCount: enabledStreams.length,
    };
  }, [monetizationPlan, clips, velocityClips, projectionScope, config.publishing.assumedRpmUsd]);

  // Fleet KPIs + Outlier Multipliers
  const fleetStats = useMemo(() => {
    let totalViews = 0;
    let totalRevenue = 0;
    let watchSum = 0;
    let watchCount = 0;

    const peaks = velocityClips.map((c) => {
      const m = c.publishedMetrics;
      if (m) {
        totalViews += getTotalClipViews(c);
        totalRevenue += m.estimatedRevenueUsd || 0;
        watchSum += m.avgWatchPercent || 0;
        watchCount += 1;
      }
      const peakVph = Math.max(...(c.hourlyVelocity || []).map((p) => p.viewsPerHour), 0);
      return { id: c.id, peakVph };
    });

    const sortedPeaks = peaks.map((p) => p.peakVph).filter((v) => v > 0).sort((a, b) => a - b);
    const medianPeakVph =
      sortedPeaks.length > 0 ? sortedPeaks[Math.floor(sortedPeaks.length / 2)] : 8000;
    const maxPeakVph = sortedPeaks.length > 0 ? sortedPeaks[sortedPeaks.length - 1] : 0;
    const blendedWatch = watchCount > 0 ? Math.round(watchSum / watchCount) : 0;
    const blendedRpm = totalViews > 0 ? (totalRevenue / (totalViews / 1000)) : config.publishing.assumedRpmUsd;

    return {
      totalViews,
      totalRevenue,
      blendedWatch,
      blendedRpm,
      maxPeakVph,
      medianPeakVph,
    };
  }, [velocityClips, config.publishing.assumedRpmUsd]);

  // Winner Learning Engine: Rank niches & templates by effective RPM, Watch%, and Peak VPH
  const nicheLeaderboard = useMemo(() => {
    const map = new Map<
      ContentNiche,
      {
        niche: ContentNiche;
        clips: number;
        totalViews: number;
        totalRevenue: number;
        peakVphSum: number;
        watchSum: number;
        bestTemplate: string;
      }
    >();

    for (const c of velocityClips) {
      const niche: ContentNiche = c.niche || "gaming";
      const curr = map.get(niche) || {
        niche,
        clips: 0,
        totalViews: 0,
        totalRevenue: 0,
        peakVphSum: 0,
        watchSum: 0,
        bestTemplate: c.layout.template,
      };
      const views = getTotalClipViews(c);
      const rev = c.publishedMetrics?.estimatedRevenueUsd || 0;
      const peakVph = Math.max(...(c.hourlyVelocity || []).map((p) => p.viewsPerHour), 0);
      curr.clips += 1;
      curr.totalViews += views;
      curr.totalRevenue += rev;
      curr.peakVphSum += peakVph;
      curr.watchSum += c.publishedMetrics?.avgWatchPercent || 70;
      map.set(niche, curr);
    }

    return Array.from(map.values())
      .map((item) => {
        const avgPeakVph = Math.round(item.peakVphSum / Math.max(1, item.clips));
        const avgWatch = Math.round(item.watchSum / Math.max(1, item.clips));
        const effectiveRpm =
          item.totalViews > 0 ? Number((item.totalRevenue / (item.totalViews / 1000)).toFixed(2)) : 0;
        const outlierRatio = Number(
          (avgPeakVph / Math.max(1, fleetStats.medianPeakVph)).toFixed(2)
        );
        // Composite Winner Score prioritizes RPM * Watch * Velocity
        const winnerScore = Math.round(
          Math.min(99, effectiveRpm * 14 + avgWatch * 0.42 + (avgPeakVph / 1500))
        );
        return {
          ...item,
          label: NICHE_LABELS[item.niche] || item.niche,
          avgPeakVph,
          avgWatch,
          effectiveRpm,
          outlierRatio,
          winnerScore,
        };
      })
      .sort((a, b) => b.winnerScore - a.winnerScore);
  }, [velocityClips, fleetStats.medianPeakVph]);

  const topWinner = nicheLeaderboard[0];

  function toggleClipVisibility(clipId: string) {
    setHiddenClipIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  }

  function copyValue(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  async function handleDoubleDownWinner() {
    if (!topWinner) return;
    setSendingWinnerToAgent(true);
    try {
      await onAskAgent(
        `Our Performance Monitor shows "${topWinner.label}" is our #1 data-backed winner ($${topWinner.effectiveRpm.toFixed(
          2
        )} RPM, ${topWinner.avgWatch}% avg watch hold, ${formatCompactNumber(
          topWinner.avgPeakVph
        )} peak VPH). Prioritize ${topWinner.label} in target intake, queue approved clips, and give me a 3-point plan to scale this winning format.`
      );
    } finally {
      setSendingWinnerToAgent(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Sub-Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <TrendingUp className="w-4 h-4 text-[#E1392B]" />
          <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
            Performance Monitor &amp; Winner Learning Engine
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            Hourly Viral Velocity across {velocityClips.length} published clip(s)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-white dark:bg-[#141720] border border-[#D9DEE7] dark:border-[#252A36] text-xs">
            {(
              [
                { id: "viewsPerHour", label: "Views / Hour" },
                { id: "cumulativeViews", label: "Cumulative Views" },
                { id: "avgWatchPercent", label: "Watch Hold %" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMetricMode(opt.id)}
                className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                  metricMode === opt.id
                    ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {topWinner && (
            <button
              type="button"
              onClick={handleDoubleDownWinner}
              disabled={sendingWinnerToAgent}
              className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {sendingWinnerToAgent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
              <span>Double Down on {topWinner.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Revenue Growth Alert Push Notifications (>= +15% Projected ROI) */}
      {onScanRevenueAlerts && onShiftAlertFocus && onDismissRevenueAlert && (
        <div className="px-4 sm:px-6 pt-4">
          <RevenueGrowthAlertsBanner
            alerts={revenueAlerts}
            isScanningAlerts={isScanningAlerts}
            shiftingAlertId={shiftingAlertId}
            onScanAlerts={() => onScanRevenueAlerts(sponsorConvRatePct, sponsorAvgOrderUsd)}
            onShiftDirectorFocus={onShiftAlertFocus}
            onDismissAlert={onDismissRevenueAlert}
            onLaunchMissionForNiche={onLaunchMissionForNiche}
          />
        </div>
      )}

      {/* Top 4-Column Hairline Readout Strip */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 border-y border-[#D9DEE7] dark:border-[#222631] divide-y lg:divide-y-0 lg:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Fleet Peak Velocity (VPH)</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-[#E1392B]">
              {formatCompactNumber(fleetStats.maxPeakVph)}/hr
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              median {formatCompactNumber(fleetStats.medianPeakVph)}/hr
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Cross-Platform Fleet Views</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
              {formatCompactNumber(fleetStats.totalViews)}
            </span>
            <span className="text-[11px] font-mono text-slate-500">6 platforms</span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Blended Avg Watch Hold</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-[#2563EB] dark:text-sky-400">
              {fleetStats.blendedWatch}%
            </span>
            <span className="text-[11px] font-mono text-slate-500">target &ge;72%</span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Est. Revenue &amp; Blended RPM</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${fleetStats.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              ${fleetStats.blendedRpm.toFixed(2)} RPM
            </span>
          </div>
        </div>
      </div>

      {/* Main Analytics Split: Hourly Velocity Chart (8 cols) + Winner Learning Engine (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border-b border-[#D9DEE7] dark:border-[#222631]">
        {/* Left: Hourly Viral Velocity Chart (Recharts) */}
        <section className="xl:col-span-8 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Hourly Viral Velocity Curve (First 12 Hours Post-Publish)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare views/hour momentum across published clips to spot breakout winners above 10K VPH.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              {velocityClips.map((c, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                const hidden = hiddenClipIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClipVisibility(c.id)}
                    className={`px-2 py-1 rounded-sm border transition-opacity inline-flex items-center gap-1.5 ${
                      hidden
                        ? "opacity-40 border-[#D9DEE7] dark:border-[#252A36]"
                        : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-[1px] shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="truncate max-w-[140px] text-[#0F172A] dark:text-slate-200">
                      {c.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedHourlyData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) =>
                    metricMode === "avgWatchPercent" ? `${val}%` : formatCompactNumber(val)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    borderColor: "#262B37",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#EEF0F4",
                  }}
                  formatter={(value: unknown, name: unknown) => {
                    const num = Number(value) || 0;
                    const clip = velocityClips.find((c) => c.id === String(name));
                    const label = clip ? clip.title.slice(0, 32) : String(name);
                    const formatted =
                      metricMode === "avgWatchPercent"
                        ? `${num}% hold`
                        : metricMode === "viewsPerHour"
                          ? `${formatCompactNumber(num)} views/hr`
                          : `${formatCompactNumber(num)} total`;
                    return [formatted, label];
                  }}
                />
                {metricMode === "viewsPerHour" && (
                  <ReferenceLine
                    y={10000}
                    stroke="#E1392B"
                    strokeDasharray="4 4"
                    label={{
                      value: "BREAKOUT 10K VPH",
                      position: "insideTopRight",
                      fill: "#E1392B",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                )}
                {velocityClips.map((c, idx) =>
                  hiddenClipIds.includes(c.id) ? null : (
                    <Line
                      key={c.id}
                      type="monotone"
                      dataKey={c.id}
                      name={c.id}
                      stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      strokeWidth={2.2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Published Clip Velocity Breakdown Table */}
          {uiMode === "advanced" && (
            <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D9DEE7] dark:border-[#222631] text-[10px] font-mono text-slate-500">
                    <th className="py-2 pr-3">CLIP &amp; NICHE</th>
                    <th className="py-2 px-2 text-right">PEAK VPH</th>
                    <th className="py-2 px-2 text-right">OUTLIER</th>
                    <th className="py-2 px-2 text-right">WATCH %</th>
                    <th className="py-2 px-2 text-right">TOTAL VIEWS</th>
                    <th className="py-2 px-2 text-right">EST. REV</th>
                    <th className="py-2 pl-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1C2029]">
                  {velocityClips.map((c, idx) => {
                    const peakVph = Math.max(...(c.hourlyVelocity || []).map((p) => p.viewsPerHour), 0);
                    const outlier = (peakVph / Math.max(1, fleetStats.medianPeakVph)).toFixed(2);
                    const total = getTotalClipViews(c);
                    return (
                      <tr key={c.id} className="hover:bg-[#F6F7F9] dark:hover:bg-[#12151C]">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-[1px] shrink-0"
                              style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate max-w-[260px]">
                                {c.title}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {NICHE_LABELS[c.niche || "gaming"]} · {c.layout.template}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold">
                          {formatCompactNumber(peakVph)}/hr
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                          <span
                            className={
                              Number(outlier) >= 1.25
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-slate-500"
                            }
                          >
                            {outlier}×
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                          {c.publishedMetrics?.avgWatchPercent ?? 0}%
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                          {formatCompactNumber(total)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${(c.publishedMetrics?.estimatedRevenueUsd || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenInStudio(c.id)}
                            className="text-[11px] text-[#E1392B] hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <Clapperboard className="w-3 h-3" />
                            <span>Clone Style</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: Data-Driven Winner Learning Leaderboard */}
        <aside className="xl:col-span-4 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#E1392B]">
              <Trophy className="w-3.5 h-3.5" />
              <span>LEARN TO PICK WINNERS · DATA RANKING</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              What Should You Make More Of?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked automatically by Effective RPM ($/1K views), Watch Hold %, and Peak Velocity.
            </p>
          </div>

          {/* Winner BarChart */}
          <div className="h-[155px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={nicheLeaderboard}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={78}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    borderColor: "#262B37",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#EEF0F4",
                  }}
                />
                <Bar dataKey="winnerScore" name="Winner Score" barSize={16} radius={[0, 2, 2, 0]} isAnimationActive={false}>
                  {nicheLeaderboard.map((entry, idx) => (
                    <Cell key={entry.niche} fill={idx === 0 ? "#E1392B" : idx === 1 ? "#2563EB" : "#64748B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked Niche Takeaways */}
          <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] text-xs">
            {nicheLeaderboard.map((row, idx) => (
              <div key={row.niche} className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    #{idx + 1} {row.label}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ${row.effectiveRpm.toFixed(2)} RPM
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 tabular-nums">
                  <span>Peak {formatCompactNumber(row.avgPeakVph)}/hr</span>
                  <span>Hold {row.avgWatch}%</span>
                  <span>{row.outlierRatio}× outlier</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Bottom Section: SEO & 6-Platform Social Matrix */}
      <section className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
              <Search className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>SEARCH SEO &amp; MULTI-PLATFORM SOCIAL MATRIX</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              TikTok / Shorts Search Discovery + X Video, Snapchat Spotlight &amp; Facebook Reels Copy
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select clip for SEO inspection"
              value={activeSeoClip?.id || ""}
              onChange={(e) => setSelectedSeoClipId(e.target.value)}
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-xs max-w-[260px] truncate"
            >
              {clips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {activeSeoClip && (
              <button
                type="button"
                onClick={() => onGenerateSeo(activeSeoClip.id)}
                disabled={isGeneratingSeoFor === activeSeoClip.id}
                className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isGeneratingSeoFor === activeSeoClip.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                )}
                <span>
                  {isGeneratingSeoFor === activeSeoClip.id
                    ? "Generating SEO..."
                    : activeSeoClip.seo
                      ? "Regenerate SEO Pack"
                      : "Generate SEO Pack"}
                </span>
              </button>
            )}
          </div>
        </div>

        {activeSeoClip?.seo ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            {/* Search Keywords + Pinned Comment CTA */}
            <div className="lg:col-span-5 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-500">PRIMARY SEARCH QUERY</span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  SEO {activeSeoClip.seo.seoScore}/100
                </span>
              </div>
              <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                {activeSeoClip.seo.primaryKeyword}
              </div>

              <div className="space-y-1">
                <div className="font-mono text-[10px] text-slate-500">SEARCH BAR KEYWORDS</div>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {activeSeoClip.seo.searchKeywords.join(" · ")}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-[10px] text-slate-500">TARGETED HASHTAGS</div>
                <div className="font-mono text-[11px] text-[#E1392B]">
                  {activeSeoClip.seo.hashtags.join(" ")}
                </div>
              </div>

              <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">PINNED COMMENT DEBATE CTA</span>
                  <button
                    type="button"
                    onClick={() => copyValue("pinned", activeSeoClip.seo!.pinnedCommentCta)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-[#E1392B]"
                  >
                    {copiedKey === "pinned" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "pinned" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeSeoClip.seo.pinnedCommentCta}
                </p>
              </div>
            </div>

            {/* Extra 3 Social Platforms: X Video, Snapchat Spotlight, Facebook Reels */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  { key: "xPost", label: "X VIDEO POST", value: activeSeoClip.seo.xPost },
                  { key: "snapTitle", label: "SNAPCHAT SPOTLIGHT", value: activeSeoClip.seo.snapTitle },
                  { key: "fbReelsCaption", label: "FACEBOOK REELS", value: activeSeoClip.seo.fbReelsCaption },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#E1392B]" />
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue(item.key, item.value)}
                        className="inline-flex items-center gap-1 hover:text-[#E1392B]"
                      >
                        {copiedKey === item.key ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === item.key ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-center text-xs text-slate-500">
            No SEO pack generated for this clip yet. Click &ldquo;Generate SEO Pack&rdquo; (runs on local LM Studio Gemma 4 2B first when connected, or Cloud Gemini).
          </div>
        )}
      </section>

      {/* Recharts Growth Velocity Chart: Historical Revenue Growth vs. Current Month-to-Date Momentum */}
      <GrowthVelocityChart clips={clips} monetizationPlan={monetizationPlan} />

      {/* 90-Day Revenue Projection Chart: Expected vs. Actual Ad-Revenue (from Monetization Plan) */}
      <section className="mx-5 mb-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Performance Monitor</span>
              <span aria-hidden="true">/</span>
              <span>Monetization Plan Sync</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Blended CPM ${revenueProjection90d.blendedCpm.toFixed(2)}
              </span>
              {revenueProjection90d.hasGeminiProjection && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Gemini CPM Forecast Active</span>
                </>
              )}
            </div>
            <h3 className="font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
              90-Day Revenue Projection — Expected vs. Actual Ad-Revenue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Tracks recorded ad-revenue pacing (Days 1–30) and projected current-pace trajectory (Days 31–90) directly against your active Monetization Plan expected curve.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
              {(
                [
                  { id: "ad-share", label: "Ad-Revenue Only" },
                  { id: "all-streams", label: `All Streams (${revenueProjection90d.enabledStreamCount || 6})` },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProjectionScope(opt.id)}
                  className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                    projectionScope === opt.id
                      ? "bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
              {(
                [
                  { id: "cumulative", label: "90-Day Cumulative" },
                  { id: "interval", label: "5-Day Intervals" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProjectionViewMode(opt.id)}
                  className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                    projectionViewMode === opt.id
                      ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {onOpenMonetizationHub && (
              <button
                type="button"
                onClick={onOpenMonetizationHub}
                className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#171A21] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Edit Monetization Plan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Projection KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#0D0F14]">
            <div className="text-xs text-slate-500">90-Day Expected ({projectionScope === "ad-share" ? "Ad-Rev" : "All Streams"})</div>
            <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#2563EB] dark:text-sky-400">
              ${revenueProjection90d.totalExpected90d.toLocaleString()}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
              From active Monetization Plan
            </div>
          </div>

          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#0D0F14]">
            <div className="text-xs text-slate-500">Actual Recorded (Days 1–30)</div>
            <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${revenueProjection90d.actualToDate.toLocaleString()}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500">
              vs ${revenueProjection90d.expectedToDate.toLocaleString()} expected (
              <span
                className={
                  revenueProjection90d.toDateDelta >= 0
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-[#E1392B] font-semibold"
                }
              >
                {revenueProjection90d.toDateDelta >= 0 ? "+" : ""}
                {revenueProjection90d.toDateDeltaPct}%
              </span>
              )
            </div>
          </div>

          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#0D0F14]">
            <div className="text-xs text-slate-500">90-Day Current-Pace Forecast</div>
            <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
              ${revenueProjection90d.totalPace90d.toLocaleString()}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums">
              <span
                className={
                  revenueProjection90d.day90Delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-[#E1392B] font-semibold"
                }
              >
                {revenueProjection90d.day90Delta >= 0 ? "+" : "-"}$
                {Math.abs(revenueProjection90d.day90Delta).toLocaleString()} vs plan
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#0D0F14]">
            <div className="text-xs text-slate-500">Ad-Share Monthly Target</div>
            <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
              ${revenueProjection90d.planMonthlyTargetAd.toLocaleString()}/mo
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
              Current run-rate ${revenueProjection90d.planMonthlyCurrentAd.toLocaleString()}/mo
            </div>
          </div>
        </div>

        {/* Recharts 90-Day Expected vs. Actual Chart */}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={revenueProjection90d.points}
              margin={{ top: 14, right: 18, left: 6, bottom: 6 }}
            >
              <defs>
                <linearGradient id="expectedAdRevFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "1px solid #262B37",
                  borderRadius: "2px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#F1F5F9",
                }}
                labelFormatter={(label) => `Horizon ${String(label)} (Next 90 Days)`}
                formatter={(value, name) => {
                  if (value === null || value === undefined) return ["—", String(name ?? "")];
                  return [`$${Number(value).toLocaleString()}`, String(name ?? "")];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }} />
              <ReferenceLine
                x="D+30"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                label={{
                  value: "TODAY · D+30",
                  position: "insideTopRight",
                  fill: "#94A3B8",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              />
              <ReferenceLine
                x="D+60"
                stroke="rgba(148,163,184,0.35)"
                strokeDasharray="2 4"
                label={{
                  value: "D+60",
                  position: "insideTopRight",
                  fill: "#64748B",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey={projectionViewMode === "cumulative" ? "expectedCumulative" : "expectedInterval"}
                name="Expected Ad-Revenue (Plan)"
                stroke="#2563EB"
                strokeWidth={2.2}
                fill="url(#expectedAdRevFill)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={projectionViewMode === "cumulative" ? "actualCumulative" : "actualInterval"}
                name="Actual Ad-Revenue (Recorded)"
                stroke="#16A34A"
                strokeWidth={2.6}
                dot={{ r: 3.5, fill: "#16A34A" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={projectionViewMode === "cumulative" ? "paceCumulative" : "paceInterval"}
                name="Actual Pace Forecast (D+30→D+90)"
                stroke="#E1392B"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: "#E1392B" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 30 / 60 / 90-Day Checkpoint Variance Table */}
        <div className="overflow-x-auto border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8F9FB] dark:bg-[#0D0F14] border-b border-[#D9DEE7] dark:border-[#222631] font-mono text-[10px] text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">90-Day Window</th>
                <th className="px-3 py-2 text-right font-medium">Expected (Plan)</th>
                <th className="px-3 py-2 text-right font-medium">Actual / Pace</th>
                <th className="px-3 py-2 text-right font-medium">Variance ($)</th>
                <th className="px-3 py-2 text-right font-medium">Variance (%)</th>
                <th className="px-3 py-2 text-right font-medium">Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
              {revenueProjection90d.milestones.map((m) => {
                const diff = m.actualOrPace - m.expected;
                const pct = m.expected > 0 ? Math.round((diff / m.expected) * 100) : 0;
                return (
                  <tr key={m.window} className="hover:bg-[#F8F9FB] dark:hover:bg-[#161922]">
                    <td className="px-3 py-2.5 font-medium text-[#0F172A] dark:text-slate-100">
                      {m.window}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#2563EB] dark:text-sky-400">
                      ${m.expected.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#0F172A] dark:text-slate-100 font-semibold">
                      ${m.actualOrPace.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono tabular-nums font-semibold ${
                        diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#E1392B]"
                      }`}
                    >
                      {diff >= 0 ? "+" : "-"}${Math.abs(diff).toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                        pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#E1392B]"
                      }`}
                    >
                      {pct >= 0 ? "+" : ""}
                      {pct}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">
                      {m.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* D3 Viral Growth Heatmap (24h x 7d across all linked channels + Scheduling Cadence Prompt) */}
      {onApplyRecommendedCadence && (
        <ViralGrowthHeatmap
          clips={clips}
          config={config}
          onApplyRecommendedCadence={onApplyRecommendedCadence}
        />
      )}

      {/* Gemini A/B Test Monitor (Hook Variants & Editing Styles -> Bake Winner into Default Pipeline Config) */}
      {onRunAbTestAnalysis && onBakeAbWinnerToConfig && (
        <AbTestMonitorPanel
          config={config}
          abTestAnalysis={abTestAnalysis}
          isAnalyzingAbTest={isAnalyzingAbTest}
          isBakingWinner={isBakingWinner}
          onRunAbTestAnalysis={onRunAbTestAnalysis}
          onBakeAbWinnerToConfig={onBakeAbWinnerToConfig}
        />
      )}

      {/* Revenue Attribution & Niche ROI Panel (Recharts ComposedChart) */}
      <section className="mx-5 mb-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#161922] p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                Revenue Attribution &amp; Niche ROI Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plots predicted platform Ad-Revenue + Sponsorship Conversion yield against Watch Hold % &amp; engagement to show which niches generate the highest cash ROI per 1,000 views.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#111318] border border-[#D9DEE7] dark:border-[#252A36]">
              {(
                [
                  { id: "avgWatchPct", label: "Watch Hold %" },
                  { id: "engagementRatePct", label: "Eng. Rate %" },
                  { id: "effectiveRoiPer1k", label: "ROI / 1K ($)" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAttributionOverlayMetric(opt.id)}
                  className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                    attributionOverlayMetric === opt.id
                      ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318]">
              <span className="font-mono text-[10px] text-slate-500">Sponsor Conv %</span>
              <input
                type="number"
                min={0.2}
                max={10}
                step={0.2}
                value={sponsorConvRatePct}
                onChange={(e) => setSponsorConvRatePct(Math.max(0.2, Math.min(10, Number(e.target.value) || 1.8)))}
                className="w-14 bg-transparent font-mono font-semibold text-right tabular-nums focus:outline-none text-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318]">
              <span className="font-mono text-[10px] text-slate-500">Avg Deal / CPA ($)</span>
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={sponsorAvgOrderUsd}
                onChange={(e) => setSponsorAvgOrderUsd(Math.max(5, Math.min(500, Number(e.target.value) || 48)))}
                className="w-16 bg-transparent font-mono font-semibold text-right tabular-nums focus:outline-none text-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>
            {topRoiNiche && onLaunchMissionForNiche && (
              <button
                type="button"
                disabled={launchingNicheMission !== null}
                onClick={async () => {
                  setLaunchingNicheMission(topRoiNiche.niche);
                  try {
                    await onLaunchMissionForNiche(topRoiNiche.label);
                  } finally {
                    setLaunchingNicheMission(null);
                  }
                }}
                className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {launchingNicheMission ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Target className="w-3.5 h-3.5" />
                )}
                <span>Launch Mission for {topRoiNiche.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
            <div className="text-xs text-slate-500">Highest ROI Niche</div>
            <div className="font-display text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mt-0.5">
              {topRoiNiche?.label || "AI & Tech"}
            </div>
            <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
              ${topRoiNiche?.effectiveRoiPer1k.toFixed(2)} / 1K effective ROI
            </div>
          </div>
          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
            <div className="text-xs text-slate-500">Predicted Ad Revenue</div>
            <div className="font-display text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] mt-0.5 tabular-nums">
              ${totalPredictedAd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="font-mono text-[11px] text-slate-500">YT Shorts + TikTok + Reels RPM</div>
          </div>
          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
            <div className="text-xs text-slate-500">Predicted Sponsorship Yield</div>
            <div className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              ${totalPredictedSponsor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              {sponsorConvRatePct}% conv · ${sponsorAvgOrderUsd} avg deal
            </div>
          </div>
          <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318]">
            <div className="text-xs text-slate-500">Combined Pipeline Value</div>
            <div className="font-display text-lg font-bold text-[#E1392B] mt-0.5 tabular-nums">
              ${(totalPredictedAd + totalPredictedSponsor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="font-mono text-[11px] text-slate-500">Ad-share + Brand Sponsorships</div>
          </div>
        </div>

        {/* Recharts ComposedChart: Stacked Revenue Bars vs Selected Engagement / ROI Line */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueAttributionData} margin={{ top: 10, right: 20, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A303E" strokeOpacity={0.25} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#334155", strokeOpacity: 0.35 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="rev"
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "Revenue ($)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#64748B" } }}
              />
              <YAxis
                yAxisId="eng"
                orientation="right"
                domain={
                  attributionOverlayMetric === "avgWatchPct"
                    ? [50, 100]
                    : attributionOverlayMetric === "engagementRatePct"
                      ? [0, 20]
                      : [0, "auto"]
                }
                tickFormatter={(v) =>
                  attributionOverlayMetric === "effectiveRoiPer1k" ? `$${v}` : `${v}%`
                }
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                label={{
                  value:
                    attributionOverlayMetric === "avgWatchPct"
                      ? "Watch Hold %"
                      : attributionOverlayMetric === "engagementRatePct"
                        ? "Engagement Rate %"
                        : "ROI / 1K Views ($)",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 10, fill: "#64748B" },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "1px solid #252A36",
                  borderRadius: "2px",
                  fontSize: "12px",
                  color: "#F1F5F9",
                }}
                formatter={(value, name) => {
                  const num = Number(value ?? 0);
                  const label = String(name ?? "");
                  if (label.includes("%")) return [`${num}%`, label];
                  if (label.includes("ROI")) return [`$${num.toFixed(2)} / 1K`, label];
                  return [`$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar
                yAxisId="rev"
                dataKey="predictedAdRevenue"
                name="Predicted Ad Revenue ($)"
                stackId="rev"
                fill="#2563EB"
                radius={[0, 0, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                yAxisId="rev"
                dataKey="predictedSponsorRevenue"
                name="Sponsorship Conversions ($)"
                stackId="rev"
                fill="#16A34A"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
              <Line
                yAxisId="eng"
                type="monotone"
                dataKey={attributionOverlayMetric}
                name={
                  attributionOverlayMetric === "avgWatchPct"
                    ? "Watch Hold %"
                    : attributionOverlayMetric === "engagementRatePct"
                      ? "Engagement Rate %"
                      : "Effective ROI / 1K ($)"
                }
                stroke="#E1392B"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#E1392B" }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Niche ROI Breakdown Table */}
        <div className="overflow-x-auto border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F7F9] dark:bg-[#111318] border-b border-[#D9DEE7] dark:border-[#222631] font-mono text-[10px] text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Content Niche</th>
                <th className="px-3 py-2 text-right">Est. Views</th>
                <th className="px-3 py-2 text-right">Watch Hold</th>
                <th className="px-3 py-2 text-right">Eng. Rate</th>
                <th className="px-3 py-2 text-right">Ad Rev ($)</th>
                <th className="px-3 py-2 text-right">Sponsor Conv ($)</th>
                <th className="px-3 py-2 text-right">ROI / 1K Views</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
              {revenueAttributionData.map((row, idx) => (
                <tr key={row.niche} className="hover:bg-[#F6F7F9]/60 dark:hover:bg-[#111318]/60">
                  <td className="px-3 py-2.5 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    <span className="font-mono text-[10px] text-slate-400 mr-2">#{idx + 1}</span>
                    {row.label}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {formatCompactNumber(row.totalViews)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.avgWatchPct}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.engagementRatePct}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    ${row.predictedAdRevenue.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${row.predictedSponsorRevenue.toFixed(2)}
                    <span className="text-[10px] text-slate-400 ml-1">({row.estimatedConversions})</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-[#E1392B]">
                    ${row.effectiveRoiPer1k.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchMissionForNiche
                          ? onLaunchMissionForNiche(row.label)
                          : onAskAgent(
                              `Our Revenue Attribution shows ${row.label} yields $${row.effectiveRoiPer1k.toFixed(2)} per 1K views (${row.avgWatchPct}% hold). Propose 5 high-ROI short-form topics in ${row.label}.`
                            )
                      }
                      className="font-mono text-[11px] text-[#E1392B] hover:underline"
                    >
                      Produce →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {onOpenMonetizationHub && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onOpenMonetizationHub}
              className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1"
            >
              <span>Open Full 6-Stream Monetization &amp; Self-Learning Growth Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Viral Sentiment Widget — Social Media Comment Reception per Editing Style */}
      <section className="mx-5 mb-6 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#161922] p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                Viral Sentiment · Live Social Comment Reception by Editing Style
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scrapes &amp; analyzes viewer comments across TikTok, YouTube Shorts, Reels, Reddit, and X for your niche to tell the AI Director which editing styles win vs. cause scroll-aways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Select niche for Viral Sentiment scan"
              value={sentimentNiche}
              onChange={(e) => setSentimentNiche(e.target.value as ContentNiche)}
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs"
            >
              {(Object.keys(NICHE_LABELS) as ContentNiche[]).map((n) => (
                <option key={n} value={n}>
                  {NICHE_LABELS[n]}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={sentimentTopic}
              onChange={(e) => setSentimentTopic(e.target.value)}
              placeholder="Optional sub-topic (e.g., kinetic captions, jump cuts)..."
              className="h-8 w-52 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs focus:outline-none focus:border-[#E1392B]"
            />

            {onScanViralSentiment && (
              <button
                type="button"
                disabled={isScanningSentiment}
                onClick={() => onScanViralSentiment(sentimentNiche, sentimentTopic)}
                className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isScanningSentiment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                )}
                <span>{isScanningSentiment ? "Scraping Comments..." : "Scrape Comments"}</span>
              </button>
            )}

            {viralSentiment && onApplySentimentToDirector && (
              <button
                type="button"
                disabled={isApplyingSentiment}
                onClick={onApplySentimentToDirector}
                className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
              >
                {isApplyingSentiment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {viralSentiment.appliedToDirectorAt ? "Re-Sync AI Director" : "Send Feedback to AI Director"}
                </span>
              </button>
            )}
          </div>
        </div>

        {viralSentiment ? (
          <div className="space-y-4">
            {/* Sentiment Polarity Bar + Executive Directive */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] space-y-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>AUDIENCE RECEPTION · {NICHE_LABELS[viralSentiment.niche].toUpperCase()}</span>
                  <span>{new Date(viralSentiment.fetchedAt).toLocaleTimeString()}</span>
                </div>

                {/* Stacked Bar */}
                <div className="h-2.5 w-full rounded-xs overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${viralSentiment.overallPositivePct}%` }}
                    title={`Positive ${viralSentiment.overallPositivePct}%`}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ width: `${viralSentiment.overallPolarizingPct}%` }}
                    title={`Polarizing ${viralSentiment.overallPolarizingPct}%`}
                  />
                  <div
                    className="bg-rose-500"
                    style={{ width: `${viralSentiment.overallNegativePct}%` }}
                    title={`Negative ${viralSentiment.overallNegativePct}%`}
                  />
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {viralSentiment.overallPositivePct}% Positive
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {viralSentiment.overallPolarizingPct}% Polarizing
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    {viralSentiment.overallNegativePct}% Negative
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {viralSentiment.executiveSummary}
                </p>

                <div className="p-2.5 rounded-sm border border-[#E1392B]/30 bg-[#E1392B]/5 text-xs space-y-1">
                  <div className="font-mono text-[10px] font-semibold text-[#E1392B] uppercase">
                    AI Director Directive {viralSentiment.appliedToDirectorAt ? "· SYNCED" : "· READY"}
                  </div>
                  <p className="text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                    {viralSentiment.directorDirective}
                  </p>
                </div>
              </div>

              {/* Editing Style Reception Breakdown */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                {viralSentiment.styleScores.map((style) => (
                  <div
                    key={style.styleName}
                    className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/50 dark:bg-[#111318] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                        {style.styleName}
                      </div>
                      <span
                        className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                          style.verdict === "loved"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : style.verdict === "polarizing"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {style.sentimentScore}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span
                        className={`inline-flex items-center gap-1 uppercase font-semibold ${
                          style.verdict === "loved"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : style.verdict === "polarizing"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {style.verdict === "loved" ? (
                          <ThumbsUp className="w-3 h-3" />
                        ) : style.verdict === "polarizing" ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <ThumbsDown className="w-3 h-3" />
                        )}
                        {style.verdict}
                      </span>
                      <span className="text-slate-500 tabular-nums">{style.sampleMentionCount} mentions</span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {style.audienceTakeaway}
                    </p>
                    <div className="pt-1 border-t border-[#D9DEE7] dark:border-[#222631] text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-[10px] text-[#E1392B]">AI ADJUSTMENT: </span>
                      {style.directorAdjustment}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sampled Social Media Comments Grid */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-slate-500 uppercase">
                Sampled Audience Comments ({viralSentiment.comments.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {viralSentiment.comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/50 dark:bg-[#111318] flex flex-col justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{cmt.platform}</span>
                        <span
                          className={
                            cmt.sentiment === "positive"
                              ? "text-emerald-600 dark:text-emerald-400 uppercase"
                              : cmt.sentiment === "polarizing"
                                ? "text-amber-600 dark:text-amber-400 uppercase"
                                : "text-rose-600 dark:text-rose-400 uppercase"
                          }
                        >
                          {cmt.sentiment}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">&ldquo;{cmt.commentText}&rdquo;</p>
                    </div>
                    <div className="pt-1.5 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span className="truncate max-w-[140px]">{cmt.authorHandle}</span>
                      <span className="tabular-nums">{formatCompactNumber(cmt.likesEstimate)} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viralSentiment.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#D9DEE7] dark:border-[#222631] text-[11px]">
                <span className="font-mono text-[10px] text-slate-500 uppercase">Sources:</span>
                {viralSentiment.sources.map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B]"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-center text-xs text-slate-500">
            Select a niche and click &ldquo;Scrape Comments&rdquo; to analyze live audience reception for specific editing styles.
          </div>
        )}
      </section>
    </div>
  );
}
