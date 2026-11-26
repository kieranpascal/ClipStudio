import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clapperboard,
  Compass,
  Cpu,
  DollarSign,
  Film,
  Kanban,
  LayoutGrid,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Server,
  Sparkles,
  BookOpen,
  Table as TableIcon,
} from "lucide-react";
import type {
  AffiliateOfferLink,
  AiComputeRoutingConfig,
  AiComputeTierId,
  AutonomousLearningEntry,
  ClipItem,
  CompetitiveNicheAlert,
  EmailCaptureLandingPage,
  LongFormGraduationItem,
  MonetizationPlan,
  PipelineConfig,
  RevenueGrowthAlert,
  TelemetryEvent,
  WorkspaceTab,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import {
  StudioKpiStrip,
  StudioMeterBar,
  StudioPageHeader,
  StudioRadialGauge,
  StudioSectionHeader,
  StudioViewSwitcher,
} from "./StudioChrome";

interface StudioDashboardViewProps {
  clips: ClipItem[];
  config: PipelineConfig;
  telemetry: TelemetryEvent[];
  monetizationPlan?: MonetizationPlan;
  affiliateOffers: AffiliateOfferLink[];
  emailLandingPages: EmailCaptureLandingPage[];
  longFormPipeline: LongFormGraduationItem[];
  revenueAlerts: RevenueGrowthAlert[];
  competitiveAlerts: CompetitiveNicheAlert[];
  autonomousLedger: AutonomousLearningEntry[];
  computeRouting?: AiComputeRoutingConfig;
  isRunningAutonomousLoop: boolean;
  isRunningPipeline: boolean;
  shiftingAlertId: string | null;
  launchingCompetitiveAlertId: string | null;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenClipInStudio: (clipId: string) => void;
  onApproveClip: (clipId: string) => Promise<void>;
  onShiftRevenueAlert: (alertId: string) => Promise<void>;
  onLaunchRapidMission: (alertId: string) => Promise<void>;
  onRunAutonomousLoop: (payload: { autoApplySafe: boolean; focusArea: string }) => Promise<void>;
  onUpdateComputeTier: (tier: AiComputeTierId) => Promise<void>;
  onTestLocalLlm: (baseUrl: string) => Promise<{
    reachable: boolean;
    latencyMs: number;
    models: string[];
    message: string;
  } | null>;
  onRunPipeline: () => void;
  onOpenComputeHub: () => void;
}

type QueueViewMode = "cards" | "board" | "table";

const COMPUTE_TIER_LABELS: Record<AiComputeTierId, { name: string; cost: string }> = {
  "manual-free": { name: "Manual Free", cost: "$0 / mo" },
  "windows-pc-local": { name: "Windows LM Studio", cost: "$0 API" },
  "cloud-budget": { name: "Cloud Flash", cost: "Low Cost" },
  "cloud-standard": { name: "Cloud Standard", cost: "Balanced" },
  "cloud-flagship": { name: "Cloud Pro Max", cost: "High Precision" },
};

function ClipThumbFrame({
  src,
  title,
  durationSec,
  niche,
}: {
  src: string;
  title: string;
  durationSec: number;
  niche?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-28 w-full bg-[#0B0E14] overflow-hidden border-b border-[#DCE2EC] dark:border-[#1E2534]">
      {!failed && src ? (
        <img
          src={src}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#161C28] to-[#0B0E14] text-slate-400">
          <Film className="w-5 h-5 text-[#E1392B]" />
          <span className="font-mono text-[10px]">{niche || "9:16 Clip"}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-white/90">
        <span className="truncate">{niche || "clip"}</span>
        <span className="tabular-nums font-bold">{durationSec}s</span>
      </div>
    </div>
  );
}

export function StudioDashboardView({
  clips,
  config,
  telemetry,
  monetizationPlan,
  affiliateOffers,
  emailLandingPages,
  longFormPipeline,
  revenueAlerts,
  competitiveAlerts,
  autonomousLedger,
  computeRouting,
  isRunningAutonomousLoop,
  isRunningPipeline,
  shiftingAlertId,
  launchingCompetitiveAlertId,
  onSelectTab,
  onOpenClipInStudio,
  onApproveClip,
  onShiftRevenueAlert,
  onLaunchRapidMission,
  onRunAutonomousLoop,
  onUpdateComputeTier,
  onTestLocalLlm,
  onRunPipeline,
  onOpenComputeHub,
}: StudioDashboardViewProps) {
  const [queueView, setQueueView] = useState<QueueViewMode>("cards");
  const [autoApplySafe, setAutoApplySafe] = useState(true);
  const [loopFocus, setLoopFocus] = useState("Revenue, CTA Conversions & Retention");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [pingingLocal, setPingingLocal] = useState(false);
  const [localPingNote, setLocalPingNote] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const enabledStreams = (monetizationPlan?.streams || []).filter((s) => s.enabled);
    const monthlyCurrent = enabledStreams.reduce((sum, s) => sum + s.monthlyCurrentUsd, 0);
    const monthlyGoal = monetizationPlan?.monthlyGoalUsd || 6000;
    const goalPct = Math.min(100, Math.round((monthlyCurrent / Math.max(1, monthlyGoal)) * 100));
    const affiliateRev30d = Math.round(
      affiliateOffers.reduce((sum, a) => sum + a.clicks30d * a.estEpcUsd, 0)
    );
    const totalSubscribers = emailLandingPages.reduce((sum, p) => sum + p.subscribers30d, 0);
    const totalVisitors = emailLandingPages.reduce((sum, p) => sum + p.visitors30d, 0);
    const optInPct = totalVisitors > 0 ? (totalSubscribers / totalVisitors) * 100 : 0;
    const totalViews = clips.reduce((sum, c) => {
      const m = c.publishedMetrics;
      if (!m) return sum + c.views;
      return (
        sum +
        (m.tiktokViews || 0) +
        (m.reelsViews || 0) +
        (m.shortsViews || 0) +
        (m.xViews || 0) +
        (m.snapViews || 0) +
        (m.fbViews || 0)
      );
    }, 0);
    const avgRetention = Math.round(
      clips.reduce((sum, c) => sum + (c.publishedMetrics?.avgWatchPercent || 71), 0) /
        Math.max(1, clips.length)
    );
    const pendingClips = clips.filter((c) => c.qaStatus === "pending");
    const readyClips = clips.filter(
      (c) => c.qaStatus === "approved" && (c.publishStatus === "ready" || c.publishStatus === "scheduled" || c.publishStatus === "draft")
    );
    const publishedClips = clips.filter((c) => c.publishStatus === "published");
    const activeRevAlerts = revenueAlerts.filter((a) => a.status === "active");
    const activeCompAlerts = competitiveAlerts.filter((a) => a.status === "active");
    const aiSuccessRate =
      telemetry.length > 0
        ? Math.round((telemetry.filter((t) => t.success).length / telemetry.length) * 100)
        : 100;

    return {
      monthlyCurrent,
      monthlyGoal,
      goalPct,
      affiliateRev30d,
      totalSubscribers,
      optInPct,
      totalViews,
      avgRetention,
      pendingClips,
      readyClips,
      publishedClips,
      activeRevAlerts,
      activeCompAlerts,
      aiSuccessRate,
    };
  }, [clips, monetizationPlan, affiliateOffers, emailLandingPages, revenueAlerts, competitiveAlerts, telemetry]);

  const sparkData = useMemo(() => {
    const base = Math.max(1400, metrics.monthlyCurrent);
    const goal = Math.max(base * 1.4, metrics.monthlyGoal);
    return [
      { label: "M1", actual: Math.round(base * 0.72), target: Math.round(goal * 0.52) },
      { label: "M2", actual: Math.round(base * 0.86), target: Math.round(goal * 0.64) },
      { label: "M3", actual: Math.round(base), target: Math.round(goal * 0.76) },
      { label: "M4", actual: Math.round(base * 1.18), target: Math.round(goal * 0.88) },
      { label: "M5", actual: Math.round(base * 1.36), target: Math.round(goal * 0.95) },
      { label: "M6", actual: Math.round(base * 1.58), target: Math.round(goal) },
    ];
  }, [metrics.monthlyCurrent, metrics.monthlyGoal]);

  const funnelStageData = useMemo(
    () => [
      { stage: "Total Clips", count: clips.length, color: "#38BDF8" },
      { stage: "Pending QA", count: metrics.pendingClips.length, color: "#F59E0B" },
      { stage: "Ready / Sched", count: metrics.readyClips.length, color: "#10B981" },
      { stage: "Published", count: metrics.publishedClips.length, color: "#E1392B" },
      { stage: "Long-Form 10m+", count: longFormPipeline.length, color: "#8B5CF6" },
    ],
    [clips.length, metrics.pendingClips.length, metrics.readyClips.length, metrics.publishedClips.length, longFormPipeline.length]
  );

  const activeTier: AiComputeTierId = computeRouting?.activeTier || "cloud-standard";
  const localEndpoint = config.localLlm?.baseUrl || "http://localhost:1234/v1";
  const localModel = config.localLlm?.model || "gemma-4-2b-it";

  async function handleQuickApprove(clipId: string) {
    setApprovingId(clipId);
    try {
      await onApproveClip(clipId);
    } finally {
      setApprovingId(null);
    }
  }

  async function handlePingWindowsPc() {
    setPingingLocal(true);
    setLocalPingNote(null);
    try {
      const res = await onTestLocalLlm(localEndpoint);
      if (res) {
        setLocalPingNote(
          res.reachable
            ? `Connected (${res.latencyMs}ms · ${res.models[0] || localModel})`
            : res.message || "Local LM Studio unreachable on this host"
        );
      }
    } finally {
      setPingingLocal(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F3F5F8] dark:bg-[#0E1117]">
      <StudioPageHeader
        section="Overview"
        title="Studio Dashboard"
        subtitle="Visual production control deck on the left; live revenue telemetry, pipeline funnel, and Windows PC / VPS compute on the right."
        metaItems={[
          { label: `${clips.length} Clips` },
          { label: `${config.channelFleet.length} Channels` },
          {
            label: `${metrics.activeRevAlerts.length + metrics.activeCompAlerts.length} Active Alerts`,
            emphasis:
              metrics.activeRevAlerts.length + metrics.activeCompAlerts.length > 0 ? "crimson" : "default",
          },
          { label: `${metrics.aiSuccessRate}% AI Health`, emphasis: "emerald" },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => onSelectTab("research-hub")}
              className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#252C3B] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-xs font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Research Commander</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("studio")}
              className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#252C3B] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-xs font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Clapperboard className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Cut Studio</span>
            </button>
            <button
              type="button"
              disabled={isRunningPipeline}
              onClick={onRunPipeline}
              className="h-7 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {isRunningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Dispatch Pipeline</span>
            </button>
          </>
        }
      />

      {/* Recessed Visual Telemetry Strip with Radial Gauges & Inline Sparklines */}
      <StudioKpiStrip
        items={[
          {
            id: "revenue",
            label: "Monthly Revenue Run-Rate",
            value: `$${metrics.monthlyCurrent.toLocaleString()}`,
            subtext: `Goal $${metrics.monthlyGoal.toLocaleString()}/mo`,
            tone: "emerald",
            progressPct: metrics.goalPct,
            onClick: () => onSelectTab("monetization"),
          },
          {
            id: "funnel",
            label: "Affiliate + Email Capture (30d)",
            value: `$${metrics.affiliateRev30d.toLocaleString()}`,
            subtext: `${formatCompactNumber(metrics.totalSubscribers)} leads · ${metrics.optInPct.toFixed(1)}% opt-in`,
            tone: "emerald",
            sparkline: [420, 560, 610, 740, 890, Math.max(500, metrics.affiliateRev30d)],
            onClick: () => onSelectTab("affiliates-funnels"),
          },
          {
            id: "views",
            label: "Fleet Views & Retention",
            value: formatCompactNumber(metrics.totalViews),
            subtext: `${longFormPipeline.length} long-form queued`,
            tone: "crimson",
            progressPct: metrics.avgRetention,
            onClick: () => onSelectTab("performance"),
          },
          {
            id: "compute",
            label: "Active AI Compute Engine",
            value: COMPUTE_TIER_LABELS[activeTier].name,
            subtext: `${COMPUTE_TIER_LABELS[activeTier].cost} · ${metrics.aiSuccessRate}% healthy`,
            tone: activeTier === "windows-pc-local" || activeTier === "manual-free" ? "emerald" : "default",
            sparkline: [92, 95, 94, 98, 97, metrics.aiSuccessRate],
            onClick: onOpenComputeHub,
          },
        ]}
      />

      {/* 2-Column Studio Split: Left Interactive Control Deck (8 cols) | Right Recessed Telemetry Rail (4 cols) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: CONTROL DECK */}
        <div className="xl:col-span-8 space-y-5">
          {/* Action Block 1: Visual Production Queue with Cards | Board | Table Switcher */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Production Queue"
              detail={`${metrics.pendingClips.length} pending QA · ${metrics.readyClips.length} ready`}
              rightSlot={
                <div className="flex flex-wrap items-center gap-2">
                  <StudioViewSwitcher<QueueViewMode>
                    value={queueView}
                    onChange={setQueueView}
                    options={[
                      { id: "cards", label: "Cards", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                      { id: "board", label: "Board", icon: <Kanban className="w-3.5 h-3.5" /> },
                      { id: "table", label: "Table", icon: <TableIcon className="w-3.5 h-3.5" /> },
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectTab("research-hub")}
                    className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] hover:border-[#E1392B] text-xs font-semibold text-[#E1392B] inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Research Commander</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            />

            {clips.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="text-sm font-display font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                  Production queue is empty
                </div>
                <p className="text-xs text-slate-500">
                  Open Research Commander to pull breakout trends, keyword gaps, or social pain points.
                </p>
              </div>
            ) : queueView === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clips.slice(0, 6).map((clip) => {
                  const hookScore = clip.hookGrade?.overallScore ?? clip.clipHealth?.overall ?? 78;
                  const watchHold = clip.publishedMetrics?.avgWatchPercent ?? 72;
                  return (
                    <article
                      key={clip.id}
                      className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-[#F8FAFC] dark:bg-[#10141D] hover:border-[#E1392B] transition-colors flex flex-col justify-between overflow-hidden"
                    >
                      <ClipThumbFrame
                        src={clip.gameplayThumbnail}
                        title={clip.title}
                        durationSec={clip.durationSec}
                        niche={clip.niche || clip.gameCategory}
                      />

                      <div className="p-3 space-y-2.5 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono text-slate-500 truncate">
                              {clip.streamerHandle} · {clip.qaStatus}
                            </div>
                            <h4 className="font-display text-xs font-bold text-[#0B1120] dark:text-[#F8FAFC] leading-snug line-clamp-2 mt-0.5">
                              {clip.title}
                            </h4>
                          </div>
                          <StudioRadialGauge
                            value={hookScore}
                            size={34}
                            strokeWidth={3.5}
                            tone={hookScore >= 80 ? "emerald" : hookScore >= 65 ? "amber" : "crimson"}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <StudioMeterBar
                            label="Watch Hold"
                            value={watchHold}
                            tone={watchHold >= 72 ? "emerald" : "amber"}
                          />
                          <StudioMeterBar
                            label="Views"
                            value={Math.min(100, Math.round((clip.views / 25000) * 100))}
                            displayValue={formatCompactNumber(clip.views)}
                            tone="sky"
                          />
                        </div>
                      </div>

                      <div className="px-3 py-2 border-t border-[#DCE2EC] dark:border-[#1E2534] bg-white dark:bg-[#151922] flex items-center justify-between gap-1.5">
                        {clip.qaStatus !== "approved" ? (
                          <button
                            type="button"
                            disabled={approvingId === clip.id}
                            onClick={() => handleQuickApprove(clip.id)}
                            className="h-7 px-2 rounded-xs border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            {approvingId === clip.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Approve</span>
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            QA Approved
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenClipInStudio(clip.id)}
                          className="h-7 px-2.5 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[11px] font-semibold hover:opacity-90"
                        >
                          Edit Cut
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : queueView === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                {[
                  { id: "pending", title: "Pending QA", accent: "#F59E0B", items: metrics.pendingClips },
                  { id: "ready", title: "Ready / Scheduled", accent: "#10B981", items: metrics.readyClips },
                  { id: "published", title: "Published", accent: "#E1392B", items: metrics.publishedClips },
                ].map((col) => (
                  <div
                    key={col.id}
                    className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-[#D6DDE8] dark:border-[#1E2534]">
                      <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                        <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: col.accent }} />
                        <span>{col.title}</span>
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-500">{col.items.length}</span>
                    </div>
                    {col.items.length === 0 ? (
                      <div className="py-6 text-center text-[11px] text-slate-500">No clips in column</div>
                    ) : (
                      col.items.slice(0, 4).map((clip) => (
                        <div
                          key={clip.id}
                          className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] p-2.5 space-y-2"
                        >
                          <div className="font-display text-xs font-bold text-[#0B1120] dark:text-[#F8FAFC] line-clamp-2">
                            {clip.title}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>{clip.streamerHandle}</span>
                            <span className="tabular-nums">{formatCompactNumber(clip.views)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 pt-1">
                            {clip.qaStatus !== "approved" && (
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(clip.id)}
                                className="h-6 px-2 rounded-xs border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenClipInStudio(clip.id)}
                              className="h-6 px-2 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[10px] font-semibold ml-auto"
                            >
                              Studio
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE2EC] dark:border-[#232A3A] text-[11px] font-mono text-slate-500">
                      <th className="py-2 pr-3 font-medium">Clip</th>
                      <th className="py-2 px-2 font-medium">QA / Stage</th>
                      <th className="py-2 px-2 font-medium text-right">Views</th>
                      <th className="py-2 pl-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECF3] dark:divide-[#1C2230]">
                    {clips.slice(0, 6).map((clip) => (
                      <tr key={clip.id} className="hover:bg-[#F3F5F8] dark:hover:bg-[#1A202D]">
                        <td className="py-2 pr-3 max-w-[260px]">
                          <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] truncate">
                            {clip.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {clip.streamerHandle} · {clip.niche} · {clip.durationSec}s
                          </div>
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">
                          <span className={clip.qaStatus === "approved" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                            {clip.qaStatus}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-600 dark:text-slate-300">{clip.publishStatus}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {formatCompactNumber(clip.views)}
                        </td>
                        <td className="py-2 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {clip.qaStatus !== "approved" && (
                              <button
                                type="button"
                                disabled={approvingId === clip.id}
                                onClick={() => handleQuickApprove(clip.id)}
                                className="h-7 px-2 rounded-xs border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenClipInStudio(clip.id)}
                              className="h-7 px-2.5 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[11px] font-semibold"
                            >
                              Edit Cut
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Action Block 2: High-Contrast Visual Alert Cards (2-Col Grid, Zero Stacked Text Soup) */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Live Revenue Surges & Rival Triggers"
              detail={`${metrics.activeRevAlerts.length} ROI surge · ${metrics.activeCompAlerts.length} competitor alert`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("performance")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Full ROI Monitor</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {metrics.activeRevAlerts.length === 0 && metrics.activeCompAlerts.length === 0 ? (
              <div className="py-5 text-xs text-slate-500 flex items-center justify-between">
                <span>All revenue and competitive alerts have been acted on.</span>
                <button
                  type="button"
                  onClick={() => onSelectTab("performance")}
                  className="h-7 px-3 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] text-xs font-semibold text-[#0B1120] dark:text-[#F8FAFC]"
                >
                  Scan Signals
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.activeRevAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-[#F8FAFC] dark:bg-[#10141D] p-3.5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          +{alert.roiIncreasePct}% ROI Surge · {alert.niche || alert.targetType}
                        </div>
                        <div className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC] mt-0.5 line-clamp-1">
                          {alert.label}
                        </div>
                      </div>
                      <StudioRadialGauge
                        value={Math.min(100, alert.roiIncreasePct * 3)}
                        size={36}
                        strokeWidth={3.5}
                        tone="emerald"
                        suffix="%"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {alert.directorSuggestion}
                    </p>
                    <button
                      type="button"
                      disabled={shiftingAlertId === alert.id}
                      onClick={() => onShiftRevenueAlert(alert.id)}
                      className="h-7 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      {shiftingAlertId === alert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                      )}
                      <span>Shift AI Director Focus</span>
                    </button>
                  </div>
                ))}

                {metrics.activeCompAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-[#F8FAFC] dark:bg-[#10141D] p-3.5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-[#E1392B]">
                          Rival Gap · {alert.competitorChannel}
                        </div>
                        <div className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC] mt-0.5 line-clamp-1">
                          {alert.videoTitle}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                        ${alert.estimatedUpsideRpmUsd.toFixed(2)} RPM
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {alert.rapidResponseAngle}
                    </p>
                    <button
                      type="button"
                      disabled={launchingCompetitiveAlertId === alert.id}
                      onClick={() => onLaunchRapidMission(alert.id)}
                      className="h-7 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      {launchingCompetitiveAlertId === alert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Rocket className="w-3.5 h-3.5" />
                      )}
                      <span>Launch Rapid Mission</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Block 3: Autonomous Self-Learning Loop */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Autonomous Self-Learning & Experiment Loop"
              detail={`${autonomousLedger.length} recorded cycles`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("autopilot")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Full Autopilot</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={loopFocus}
                onChange={(e) => setLoopFocus(e.target.value)}
                placeholder="Focus area (Affiliate EPC, Mid-roll CTA, LM Studio offload)..."
                className="flex-1 min-w-[200px] h-8 px-3 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs focus:outline-none focus:border-[#E1392B]"
              />
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none px-1.5">
                <input
                  type="checkbox"
                  checked={autoApplySafe}
                  onChange={(e) => setAutoApplySafe(e.target.checked)}
                  className="accent-[#E1392B]"
                />
                <span>Auto-apply safe patch</span>
              </label>
              <button
                type="button"
                disabled={isRunningAutonomousLoop}
                onClick={() => onRunAutonomousLoop({ autoApplySafe, focusArea: loopFocus })}
                className="h-8 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isRunningAutonomousLoop ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-[#E1392B]" />
                )}
                <span>Run Self-Learning Cycle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {autonomousLedger.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xs border border-[#DCE2EC] dark:border-[#222938] bg-[#F8FAFC] dark:bg-[#0F131C] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                      Cycle #{entry.cycleNumber}
                    </span>
                    <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      +{entry.projectedLiftPct}% lift
                    </span>
                  </div>
                  <div className="font-display text-xs font-bold text-[#0B1120] dark:text-[#F8FAFC] line-clamp-1">
                    {entry.focusArea}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {entry.actionTaken}
                  </p>
                  <div className="pt-1 border-t border-[#E2E7F0] dark:border-[#1E2534] font-mono text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{entry.engine}</span>
                    <span>${entry.computeCostUsd.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: RECESSED TELEMETRY & INFRASTRUCTURE RAIL */}
        <div className="xl:col-span-4 space-y-4">
          {/* Telemetry Block 1: Visual Production Funnel Chart */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
            <StudioSectionHeader
              zone="telemetry"
              title="Studio Pipeline Funnel"
              detail="Live clip progression across stages"
            />
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelStageData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 6, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.25} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="stage" width={92} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12161F",
                      borderColor: "#252C3B",
                      borderRadius: "2px",
                      fontSize: "11px",
                      color: "#F8FAFC",
                    }}
                  />
                  <Bar dataKey="count" name="Items" radius={[0, 2, 2, 0]}>
                    {funnelStageData.map((entry) => (
                      <Cell key={entry.stage} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Telemetry Block 2: 6-Month Revenue Trajectory */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
            <StudioSectionHeader
              zone="telemetry"
              title="6-Month Revenue Trajectory"
              detail={`$${metrics.monthlyCurrent.toLocaleString()}/mo vs. $${metrics.monthlyGoal.toLocaleString()}`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("monetization")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.24} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12161F",
                      borderColor: "#252C3B",
                      borderRadius: "2px",
                      fontSize: "11px",
                      color: "#F8FAFC",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Goal Target ($)"
                    stroke="#64748B"
                    strokeDasharray="4 4"
                    fill="transparent"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Projected Run-Rate ($)"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 border border-[#D6DDE8] dark:border-[#1E2534] divide-x divide-[#D6DDE8] dark:divide-[#1E2534] bg-white dark:bg-[#12161F] rounded-xs text-xs">
              <div className="p-2">
                <div className="text-[10px] text-slate-500">Affiliates</div>
                <div className="font-mono font-bold tabular-nums text-[#0B1120] dark:text-[#F8FAFC]">
                  {affiliateOffers.length}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-500">Opt-In Pages</div>
                <div className="font-mono font-bold tabular-nums text-[#0B1120] dark:text-[#F8FAFC]">
                  {emailLandingPages.length}
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-500">Winning CTA</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {monetizationPlan?.funnelTest?.winnerLabel?.split(" ")[0] || "Mid-Roll"}
                </div>
              </div>
            </div>
          </section>

          {/* Telemetry Block 3: Windows PC LM Studio & Compute Selector */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
            <StudioSectionHeader
              zone="telemetry"
              title="Windows PC LM Studio & Compute"
              detail={localModel}
              rightSlot={
                <button
                  type="button"
                  onClick={onOpenComputeHub}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Router</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-1.5">
              {(
                [
                  "manual-free",
                  "windows-pc-local",
                  "cloud-budget",
                  "cloud-standard",
                  "cloud-flagship",
                ] as AiComputeTierId[]
              ).map((tierId) => {
                const isSelected = activeTier === tierId;
                return (
                  <button
                    key={tierId}
                    type="button"
                    onClick={() => onUpdateComputeTier(tierId)}
                    className={`px-2.5 py-2 rounded-xs border text-left transition-colors ${
                      isSelected
                        ? "border-[#E1392B] bg-white dark:bg-[#171C27] text-[#0B1120] dark:text-[#F8FAFC]"
                        : "border-[#D4DCE8] dark:border-[#202636] bg-white/60 dark:bg-[#11151E] text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate">
                      {COMPUTE_TIER_LABELS[tierId].name}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {COMPUTE_TIER_LABELS[tierId].cost}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D6DDE8] dark:border-[#1E2534] text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] truncate">
                <Cpu className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                <span className="truncate">{localPingNote || localEndpoint}</span>
              </div>
              <button
                type="button"
                disabled={pingingLocal}
                onClick={handlePingWindowsPc}
                className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
              >
                {pingingLocal ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Ping</span>
              </button>
            </div>
          </section>

          {/* Compact Workspace Launchpad */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 space-y-3">
            <StudioSectionHeader
              zone="action"
              title="Quick Studio Shortcuts"
              detail={`${config.channelFleet.length} linked accounts`}
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectTab("research-hub")}
                className="p-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0F131C] text-left transition-colors"
              >
                <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Research</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">TrendPulse &amp; Sentiment</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("faceless-studio")}
                className="p-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0F131C] text-left transition-colors"
              >
                <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Long-Form</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{longFormPipeline.length} 10m+ blueprints</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("affiliates-funnels")}
                className="p-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0F131C] text-left transition-colors"
              >
                <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Funnels</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{affiliateOffers.length} affiliate links</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("distribution")}
                className="p-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0F131C] text-left transition-colors"
              >
                <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Fleet</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{config.channelFleet.length} channels</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("guide")}
                className="col-span-2 p-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0F131C] flex items-center justify-between transition-colors"
              >
                <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Pitch Deck &amp; Training Academy</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">20 Chapters · 61 Features</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
