import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Server,
  Sparkles,
  BookOpen,
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
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

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

const COMPUTE_TIER_LABELS: Record<AiComputeTierId, { name: string; cost: string }> = {
  "manual-free": { name: "Manual Free", cost: "$0 / mo" },
  "windows-pc-local": { name: "Windows PC LM Studio", cost: "$0 API" },
  "cloud-budget": { name: "Cloud Budget Flash", cost: "Low Cost" },
  "cloud-standard": { name: "Cloud Standard", cost: "Balanced" },
  "cloud-flagship": { name: "Cloud Pro Max", cost: "High Precision" },
};

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
  const [autoApplySafe, setAutoApplySafe] = useState(true);
  const [loopFocus, setLoopFocus] = useState("Revenue, CTA Conversions & Retention");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [pingingLocal, setPingingLocal] = useState(false);
  const [localPingNote, setLocalPingNote] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const enabledStreams = (monetizationPlan?.streams || []).filter((s) => s.enabled);
    const monthlyCurrent = enabledStreams.reduce((sum, s) => sum + s.monthlyCurrentUsd, 0);
    const monthlyGoal = monetizationPlan?.monthlyGoalUsd || 6000;
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
      clips.reduce((sum, c) => sum + (c.publishedMetrics?.avgWatchPercent || 69), 0) /
        Math.max(1, clips.length)
    );
    const pendingClips = clips.filter((c) => c.qaStatus === "pending" || c.publishStatus === "draft");
    const readyClips = clips.filter((c) => c.publishStatus === "ready" || c.publishStatus === "scheduled");
    const activeRevAlerts = revenueAlerts.filter((a) => a.status === "active");
    const activeCompAlerts = competitiveAlerts.filter((a) => a.status === "active");
    const aiSuccessRate =
      telemetry.length > 0
        ? Math.round((telemetry.filter((t) => t.success).length / telemetry.length) * 100)
        : 100;

    return {
      monthlyCurrent,
      monthlyGoal,
      affiliateRev30d,
      totalSubscribers,
      optInPct,
      totalViews,
      avgRetention,
      pendingClips,
      readyClips,
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
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Studio Dashboard"
        title="Operations & Revenue Command Center"
        subtitle="Actionable clips, live ROI alerts, and autonomous learning cycles sit on the left; revenue projections, fleet telemetry, and Windows PC / VPS worker health sit on the right."
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
              onClick={() => onSelectTab("monetization")}
              className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Monetization Hub</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("studio")}
              className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Clapperboard className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Open Cut Studio</span>
            </button>
            <button
              type="button"
              disabled={isRunningPipeline}
              onClick={onRunPipeline}
              className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {isRunningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Dispatch Pipeline</span>
            </button>
          </>
        }
      />

      {/* Executive Telemetry KPI Band */}
      <StudioKpiStrip
        items={[
          {
            id: "revenue",
            label: "Monthly Revenue Run-Rate",
            value: `$${metrics.monthlyCurrent.toLocaleString()}`,
            subtext: `Goal $${metrics.monthlyGoal.toLocaleString()}/mo · ${Math.round((metrics.monthlyCurrent / Math.max(1, metrics.monthlyGoal)) * 100)}% paced`,
            tone: "emerald",
            onClick: () => onSelectTab("monetization"),
          },
          {
            id: "funnel",
            label: "Affiliate + Email Capture (30d)",
            value: `$${metrics.affiliateRev30d.toLocaleString()}`,
            subtext: `${formatCompactNumber(metrics.totalSubscribers)} email leads · ${metrics.optInPct.toFixed(1)}% opt-in`,
            onClick: () => onSelectTab("monetization"),
          },
          {
            id: "views",
            label: "Fleet Views & Retention",
            value: formatCompactNumber(metrics.totalViews),
            subtext: `${metrics.avgRetention}% avg watch hold · ${longFormPipeline.length} long-form queued`,
            onClick: () => onSelectTab("performance"),
          },
          {
            id: "compute",
            label: "Active AI Compute Engine",
            value: COMPUTE_TIER_LABELS[activeTier].name,
            subtext: `${COMPUTE_TIER_LABELS[activeTier].cost} · Host: ${computeRouting?.hostingStage || "free-github-cloudflare"}`,
            tone: activeTier === "windows-pc-local" || activeTier === "manual-free" ? "emerald" : "default",
            onClick: onOpenComputeHub,
          },
        ]}
      />

      {/* 2-Column Studio Dashboard Split: Left Action Queue (7 cols) | Right Telemetry & Infra (5 cols) */}
      <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: ACTIONABLE OPERATIONS QUEUE */}
        <div className="xl:col-span-7 space-y-5">
          {/* Action Block 1: Clips Awaiting Review & Publishing */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Production Queue Requiring Action"
              detail={`${metrics.pendingClips.length} pending QA · ${metrics.readyClips.length} ready to publish`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("ingest")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Research &amp; Gaps</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {clips.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No clips in workspace yet. Open Research &amp; Gaps to pull trending topics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E7F0] dark:border-[#1E222D] text-[11px] text-slate-500">
                      <th className="py-2 pr-3 font-medium">Clip</th>
                      <th className="py-2 px-2 font-medium">Status</th>
                      <th className="py-2 px-2 font-medium text-right">Views</th>
                      <th className="py-2 pl-3 font-medium text-right">Next Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                    {clips.slice(0, 5).map((clip) => (
                      <tr key={clip.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#151821]">
                        <td className="py-2.5 pr-3 max-w-[260px]">
                          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {clip.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {clip.streamerHandle} · {clip.niche} · {clip.durationSec}s
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] whitespace-nowrap">
                          <span
                            className={
                              clip.qaStatus === "approved"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          >
                            {clip.qaStatus}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-600 dark:text-slate-300">{clip.publishStatus}</span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {formatCompactNumber(clip.views)}
                        </td>
                        <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {clip.qaStatus !== "approved" && (
                              <button
                                type="button"
                                disabled={approvingId === clip.id}
                                onClick={() => handleQuickApprove(clip.id)}
                                className="h-7 px-2.5 rounded-xs border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                {approvingId === clip.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenClipInStudio(clip.id)}
                              className="h-7 px-2.5 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-[11px] font-semibold hover:opacity-90"
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

          {/* Action Block 2: Priority Revenue Surges & Competitive Niche Alerts */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Live Revenue Surges & Competitor Triggers"
              detail={`${metrics.activeRevAlerts.length} ROI surge · ${metrics.activeCompAlerts.length} rival gap release`}
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
                <span>All revenue &amp; competitive alerts have been acted on.</span>
                <button
                  type="button"
                  onClick={() => onSelectTab("performance")}
                  className="h-7 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  Scan Signals
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                {metrics.activeRevAlerts.slice(0, 2).map((alert) => (
                  <div key={alert.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        ROI Surge +{alert.roiIncreasePct}% · {alert.niche || alert.targetType}
                      </div>
                      <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {alert.label}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {alert.directorSuggestion}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={shiftingAlertId === alert.id}
                      onClick={() => onShiftRevenueAlert(alert.id)}
                      className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      {shiftingAlertId === alert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                      )}
                      <span>Shift AI Focus</span>
                    </button>
                  </div>
                ))}

                {metrics.activeCompAlerts.slice(0, 2).map((alert) => (
                  <div key={alert.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[11px] font-mono text-[#E1392B]">
                        Competitor Release · {alert.competitorChannel} · Est. ${alert.estimatedUpsideRpmUsd.toFixed(2)} RPM
                      </div>
                      <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {alert.videoTitle}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {alert.rapidResponseAngle}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={launchingCompetitiveAlertId === alert.id}
                      onClick={() => onLaunchRapidMission(alert.id)}
                      className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
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

          {/* Action Block 3: Autonomous Self-Learning & Experiment Loop */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Autonomous Self-Learning & Experiment Loop"
              detail={`${autonomousLedger.length} recorded cycles · Self-tests hooks, CTAs & compute spend`}
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
                placeholder="Focus area (e.g., Affiliate EPC, Mid-roll CTA, Local LLM offload)..."
                className="flex-1 min-w-[200px] h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs focus:outline-none focus:border-[#E1392B]"
              />
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none px-2">
                <input
                  type="checkbox"
                  checked={autoApplySafe}
                  onChange={(e) => setAutoApplySafe(e.target.checked)}
                  className="accent-[#E1392B]"
                />
                <span>Auto-apply safe config patch</span>
              </label>
              <button
                type="button"
                disabled={isRunningAutonomousLoop}
                onClick={() => onRunAutonomousLoop({ autoApplySafe, focusArea: loopFocus })}
                className="h-8 px-3.5 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isRunningAutonomousLoop ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-[#E1392B]" />
                )}
                <span>Run Self-Learning Cycle</span>
              </button>
            </div>

            <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
              {autonomousLedger.slice(0, 3).map((entry) => (
                <div key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      Cycle #{entry.cycleNumber} · {entry.focusArea}
                    </span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{entry.projectedLiftPct}% est. lift · {entry.engine} · ${entry.computeCostUsd.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{entry.observation}</p>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Experiment:</span>{" "}
                    {entry.experimentTested}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Action:</span>{" "}
                    {entry.actionTaken} {entry.autoApplied ? "(Applied)" : "(Pending Review)"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: TELEMETRY & INFRASTRUCTURE */}
        <div className="xl:col-span-5 space-y-5">
          {/* Telemetry Block 1: Projected vs. Target Revenue Trajectory */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="telemetry"
              title="6-Month Revenue Trajectory"
              detail={`$${metrics.monthlyCurrent.toLocaleString()}/mo current vs. $${metrics.monthlyGoal.toLocaleString()} goal`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("monetization")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Open Monetization Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252A36" strokeOpacity={0.22} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141720",
                      borderColor: "#252A36",
                      borderRadius: "2px",
                      fontSize: "12px",
                      color: "#F1F5F9",
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
                    stroke="#E1392B"
                    fill="#E1392B"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EEF1F6] dark:divide-[#1A1E29] dark:border-[#1E222D] text-xs">
              <div>
                <div className="text-[11px] text-slate-500">Active Affiliates</div>
                <div className="font-mono font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                  {affiliateOffers.length} offers
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Email Pages</div>
                <div className="font-mono font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                  {emailLandingPages.length} active
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Winning CTA</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {monetizationPlan?.funnelTest?.winnerLabel?.split(" ")[0] || "Mid-Roll"}
                </div>
              </div>
            </div>
          </section>

          {/* Telemetry Block 2: Windows PC (LM Studio) & Cloud VPS Compute Router */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="telemetry"
              title="Windows PC LM Studio & VPS Scaling"
              detail={`${localModel} · ${localEndpoint}`}
              rightSlot={
                <button
                  type="button"
                  onClick={onOpenComputeHub}
                  className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Worker Pack</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
                        ? "border-[#E1392B] bg-[#E1392B]/[0.07] text-[#0F172A] dark:text-[#F8FAFC]"
                        : "border-[#D4DAE4] dark:border-[#232836] bg-[#F8FAFC] dark:bg-[#0D0F14] text-slate-600 dark:text-slate-400 hover:border-slate-400"
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEF1F6] dark:border-[#1E222D] text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                <span>{localPingNote || "Ping your Windows PC LM Studio server anytime"}</span>
              </div>
              <button
                type="button"
                disabled={pingingLocal}
                onClick={handlePingWindowsPc}
                className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#141720] hover:border-[#E1392B] text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
              >
                {pingingLocal ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Ping LM Studio</span>
              </button>
            </div>
          </section>

          {/* Telemetry Block 3: Fast Workspace Launchpad & Training Academy */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-3">
            <StudioSectionHeader
              zone="telemetry"
              title="All-Channel Fleet & Training Access"
              detail={`${config.channelFleet.length} linked accounts · 20-chapter interactive guide`}
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectTab("ingest")}
                className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0D0F14] text-left space-y-1 transition-colors"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Deep Gap Research</span>
                </div>
                <div className="text-[11px] text-slate-500">Google Search + Competitor Gaps</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("ai-lab")}
                className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0D0F14] text-left space-y-1 transition-colors"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Multimodal AI Lab</span>
                </div>
                <div className="text-[11px] text-slate-500">Voice, Video, Image &amp; Lyria Music</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("distribution")}
                className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0D0F14] text-left space-y-1 transition-colors"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Multi-Channel Fleet</span>
                </div>
                <div className="text-[11px] text-slate-500">{config.channelFleet.length} channels scheduled</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("guide")}
                className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] hover:border-[#E1392B] bg-[#F8FAFC] dark:bg-[#0D0F14] text-left space-y-1 transition-colors"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Pitch Deck &amp; Training</span>
                </div>
                <div className="text-[11px] text-slate-500">20 Chapters + 48-Feature Atlas</div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
