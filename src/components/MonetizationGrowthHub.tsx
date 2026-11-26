import { useMemo, useState } from "react";
import {
  DollarSign,
  Sparkles,
  Loader2,
  Brain,
  Clock,
  CheckCircle2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Layers,
  Radar,
  ShieldCheck,
  BarChart3,
  Newspaper,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type {
  ContentNiche,
  CtaPlacementType,
  KnowledgeAcquisitionState,
  LearningDiscoveryType,
  MonetizationPlan,
  MonetizationStream,
  SelfLearningCadence,
  SelfLearningState,
  SponsorDeal,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { AbFunnelTestPanel } from "./AbFunnelTestPanel";

interface MonetizationGrowthHubProps {
  monetizationPlan?: MonetizationPlan;
  selfLearning?: SelfLearningState;
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  isOptimizingMonetization: boolean;
  isProjectingRevenue?: boolean;
  isAnalyzingFunnel?: boolean;
  isApplyingFunnelWinner?: boolean;
  isRunningSelfLearn: boolean;
  isCrawlingKnowledge?: boolean;
  adoptingDiscoveryId: string | null;
  onUpdateMonetizationPlan: (patch: Partial<MonetizationPlan>) => Promise<void>;
  onOptimizeMonetization: () => Promise<void>;
  onProjectRevenue?: (payload?: { horizonMonths?: number; dailyPostsTarget?: number }) => Promise<void>;
  onAddFunnelVariant?: (payload: {
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
  }) => Promise<void>;
  onAnalyzeFunnel?: (focusSponsor?: string) => Promise<void>;
  onApplyFunnelWinner?: () => Promise<void>;
  onUpdateSelfLearnConfig: (patch: {
    enabled?: boolean;
    cadence?: SelfLearningCadence;
    autoAdoptSafeUpgrades?: boolean;
    focusAreas?: LearningDiscoveryType[];
  }) => Promise<void>;
  onRunSelfLearningCycle: (customFocus?: string) => Promise<void>;
  onAdoptDiscovery: (discoveryId: string) => Promise<void>;
  onRunKnowledgeCrawl?: (customTopic?: string) => Promise<void>;
  onOpenIngestOpportunities?: () => void;
}

const CADENCE_OPTIONS: Array<{ id: SelfLearningCadence; label: string }> = [
  { id: "manual", label: "Manual Only" },
  { id: "every-6h", label: "Every 6 Hours" },
  { id: "every-12h", label: "Every 12 Hours" },
  { id: "daily", label: "Daily (24h)" },
  { id: "weekly", label: "Weekly" },
];

const FOCUS_AREAS: Array<{ id: LearningDiscoveryType; label: string }> = [
  { id: "platform", label: "New Platforms" },
  { id: "source", label: "New Ingest Sources" },
  { id: "method", label: "New Editing Methods" },
  { id: "monetization", label: "Monetization Plays" },
];

export function MonetizationGrowthHub({
  monetizationPlan,
  selfLearning,
  knowledgeAcquisition,
  isOptimizingMonetization,
  isProjectingRevenue = false,
  isAnalyzingFunnel = false,
  isApplyingFunnelWinner = false,
  isRunningSelfLearn,
  isCrawlingKnowledge = false,
  adoptingDiscoveryId,
  onUpdateMonetizationPlan,
  onOptimizeMonetization,
  onProjectRevenue,
  onAddFunnelVariant,
  onAnalyzeFunnel,
  onApplyFunnelWinner,
  onUpdateSelfLearnConfig,
  onRunSelfLearningCycle,
  onAdoptDiscovery,
  onRunKnowledgeCrawl,
  onOpenIngestOpportunities,
}: MonetizationGrowthHubProps) {
  const [discoveryFilter, setDiscoveryFilter] = useState<"all" | LearningDiscoveryType>("all");
  const [customResearchFocus, setCustomResearchFocus] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [projHorizon, setProjHorizon] = useState<number>(6);
  const [projDailyPosts, setProjDailyPosts] = useState<number>(4);
  const projection = monetizationPlan?.revenueProjection;

  // Add Sponsor Deal form state
  const [newBrand, setNewBrand] = useState("");
  const [newNiche, setNewNiche] = useState<ContentNiche>("tech-ai");
  const [newModel, setNewModel] = useState<SponsorDeal["model"]>("Flat Integration");
  const [newMonthlyUsd, setNewMonthlyUsd] = useState(800);
  const [newCta, setNewCta] = useState("");

  const streams = monetizationPlan?.streams || [];
  const sponsorPipeline = monetizationPlan?.sponsorPipeline || [];
  const monthlyGoal = monetizationPlan?.monthlyGoalUsd || 6500;
  const exitMultiple = monetizationPlan?.exitValuationMultipleMonths || 30;

  const totals = useMemo(() => {
    const activeStreams = streams.filter((s) => s.enabled);
    const currentMonthly = activeStreams.reduce((acc, s) => acc + s.monthlyCurrentUsd, 0);
    const targetMonthly = activeStreams.reduce((acc, s) => acc + s.monthlyTargetUsd, 0);
    const sponsorCommitted = sponsorPipeline
      .filter((d) => d.status === "active")
      .reduce((acc, d) => acc + d.estMonthlyUsd, 0);
    const sponsorPipelinePotential = sponsorPipeline.reduce((acc, d) => acc + d.estMonthlyUsd, 0);
    const progressPct = Math.min(100, Math.round((currentMonthly / Math.max(1, monthlyGoal)) * 100));
    const exitValCurrent = currentMonthly * exitMultiple;
    const exitValTarget = targetMonthly * exitMultiple;
    return {
      activeCount: activeStreams.length,
      currentMonthly,
      targetMonthly,
      sponsorCommitted,
      sponsorPipelinePotential,
      progressPct,
      exitValCurrent,
      exitValTarget,
    };
  }, [streams, sponsorPipeline, monthlyGoal, exitMultiple]);

  const filteredDiscoveries = useMemo(() => {
    const list = selfLearning?.discoveries || [];
    if (discoveryFilter === "all") return list;
    return list.filter((d) => d.type === discoveryFilter);
  }, [selfLearning?.discoveries, discoveryFilter]);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  async function handleToggleStream(streamId: MonetizationStream["id"]) {
    const nextStreams = streams.map((s) => (s.id === streamId ? { ...s, enabled: !s.enabled } : s));
    await onUpdateMonetizationPlan({ streams: nextStreams });
  }

  async function handleUpdateStreamTarget(streamId: MonetizationStream["id"], monthlyTargetUsd: number) {
    const nextStreams = streams.map((s) =>
      s.id === streamId ? { ...s, monthlyTargetUsd: Math.max(0, monthlyTargetUsd) } : s
    );
    await onUpdateMonetizationPlan({ streams: nextStreams });
  }

  async function handleAddSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newBrand.trim()) return;
    const deal: SponsorDeal = {
      id: `sp_${Date.now().toString(36)}`,
      brand: newBrand.trim(),
      niche: newNiche,
      model: newModel,
      estMonthlyUsd: Math.max(50, Number(newMonthlyUsd) || 500),
      status: "prospect",
      ctaHook: newCta.trim() || "Pinned comment + bio link CTA",
    };
    await onUpdateMonetizationPlan({ sponsorPipeline: [deal, ...sponsorPipeline] });
    setNewBrand("");
    setNewCta("");
  }

  async function handleCycleSponsorStatus(dealId: string) {
    const order: SponsorDeal["status"][] = ["prospect", "pitched", "active"];
    const next = sponsorPipeline.map((d) => {
      if (d.id !== dealId) return d;
      const nextStatus = order[(order.indexOf(d.status) + 1) % order.length];
      return { ...d, status: nextStatus };
    });
    await onUpdateMonetizationPlan({ sponsorPipeline: next });
  }

  async function handleToggleFocusArea(area: LearningDiscoveryType) {
    if (!selfLearning) return;
    const exists = selfLearning.focusAreas.includes(area);
    const next = exists
      ? selfLearning.focusAreas.filter((a) => a !== area)
      : [...selfLearning.focusAreas, area];
    if (next.length === 0) return;
    await onUpdateSelfLearnConfig({ focusAreas: next });
  }

  return (
    <div className="space-y-6">
      {/* SECTION 0: GEMINI MONTHLY REVENUE PROJECTION & LIVE PLATFORM CPM TRENDS DASHBOARD */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Gemini Monthly Revenue Projection &amp; Platform CPM Trends
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projects monthly revenue trajectories from your live clip watch-hold performance and current short-form CPM trends across 6 platforms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Projection horizon months"
              value={projHorizon}
              onChange={(e) => setProjHorizon(Number(e.target.value) || 6)}
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
            >
              <option value={6}>6-Month Forecast</option>
              <option value={12}>12-Month Forecast</option>
            </select>

            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]">
              <span className="font-mono text-[10px] text-slate-500">POSTS/DAY</span>
              <input
                type="number"
                min={1}
                max={12}
                value={projDailyPosts}
                onChange={(e) => setProjDailyPosts(Math.max(1, Math.min(12, Number(e.target.value) || 4)))}
                className="w-10 bg-transparent font-mono font-bold text-right tabular-nums focus:outline-none"
              />
            </div>

            {onProjectRevenue && (
              <button
                type="button"
                disabled={isProjectingRevenue}
                onClick={() => onProjectRevenue({ horizonMonths: projHorizon, dailyPostsTarget: projDailyPosts })}
                className="h-8 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {isProjectingRevenue ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isProjectingRevenue ? "Forecasting CPMs..." : "Project Revenue with Gemini"}</span>
              </button>
            )}
          </div>
        </div>

        {projection && (
          <>
            {/* 4-Column Projection Telemetry Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#D9DEE7] dark:border-[#222631] divide-y lg:divide-y-0 lg:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-[#F6F7F9]/75 dark:bg-[#0F1117]">
              <div className="px-5 py-3.5">
                <div className="font-mono text-[10px] text-slate-500">MONTH 1 PROJECTED (BASE)</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                    ${projection.projectedMonth1Usd.toLocaleString()}/mo
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {formatCompactNumber(projection.currentMonthlyViewsEst)} views
                  </span>
                </div>
              </div>
              <div className="px-5 py-3.5">
                <div className="font-mono text-[10px] text-slate-500">MONTH {projection.horizonMonths} BASE CASE</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${projection.projectedMonth6BaseUsd.toLocaleString()}/mo
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {projection.currentClipAvgWatchPct}% watch hold
                  </span>
                </div>
              </div>
              <div className="px-5 py-3.5">
                <div className="font-mono text-[10px] text-slate-500">MONTH {projection.horizonMonths} BREAKOUT UPSIDE</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold tabular-nums text-[#E1392B]">
                    ${projection.projectedMonth6BreakoutUsd.toLocaleString()}/mo
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">outlier scenario</span>
                </div>
              </div>
              <div className="px-5 py-3.5">
                <div className="font-mono text-[10px] text-slate-500">BLENDED LIVE PLATFORM CPM</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                    ${projection.blendedPlatformCpmUsd.toFixed(2)}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">per 1K views · 6 platforms</span>
                </div>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* Left 7 Cols: Recharts Monthly Revenue Projection ComposedChart */}
              <div className="xl:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wide text-[#0F172A] dark:text-[#F1F5F9]">
                      {projection.horizonMonths}-Month Projected Revenue Curve (Ad-Share + Sponsors vs Breakout)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {projection.executiveForecast}
                    </p>
                  </div>
                </div>

                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projection.monthlySeries} margin={{ top: 10, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                        tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
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
                        formatter={(value, name) => [`$${Number(value || 0).toLocaleString()}`, String(name || "")]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="adShareUsd" name="Ad-Share (Base)" stackId="base" fill="#2563EB" barSize={26} isAnimationActive={false} />
                      <Bar dataKey="sponsorAffiliateUsd" name="Sponsors & Affiliates" stackId="base" fill="#16A34A" barSize={26} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                      <Line
                        type="monotone"
                        dataKey="breakoutUsd"
                        name="Breakout Scenario"
                        stroke="#E1392B"
                        strokeWidth={2.3}
                        dot={{ r: 3.5, fill: "#E1392B" }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="conservativeUsd"
                        name="Conservative Floor"
                        stroke="#64748B"
                        strokeDasharray="4 4"
                        strokeWidth={1.8}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {projection.keyCpmDrivers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    {projection.keyCpmDrivers.slice(0, 3).map((driver, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] text-[11px] text-slate-600 dark:text-slate-300 leading-snug"
                      >
                        <span className="font-mono text-[10px] text-[#E1392B] block mb-0.5">CPM DRIVER #{i + 1}</span>
                        {driver}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Live Platform CPM Trends Table */}
              <div className="xl:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase text-slate-500">
                    Live Platform CPM Benchmarks
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Updated {new Date(projection.generatedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] rounded-sm bg-[#F6F7F9]/40 dark:bg-[#111318]">
                  {projection.platformCpmTrends.map((plat) => (
                    <div key={plat.platform} className="p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{plat.platform}</span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${plat.currentCpmUsd.toFixed(2)} CPM
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              plat.trendDirection === "up"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : plat.trendDirection === "down"
                                  ? "text-rose-500"
                                  : "text-slate-500"
                            }`}
                          >
                            {plat.deltaPct >= 0 ? `+${plat.deltaPct}%` : `${plat.deltaPct}%`}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Top Niche: <strong className="text-slate-700 dark:text-slate-300">{plat.bestNiche}</strong> · {plat.monetizationThreshold}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{plat.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* SECTION 0.5: A/B FUNNEL TEST (CTA PLACEMENTS VS SPONSORSHIP CONVERSION RATES) */}
      {onAddFunnelVariant && onAnalyzeFunnel && onApplyFunnelWinner && (
        <AbFunnelTestPanel
          funnelTest={monetizationPlan?.funnelTest}
          isAnalyzingFunnel={isAnalyzingFunnel}
          isApplyingFunnelWinner={isApplyingFunnelWinner}
          onAddFunnelVariant={onAddFunnelVariant}
          onAnalyzeFunnel={onAnalyzeFunnel}
          onApplyFunnelWinner={onApplyFunnelWinner}
        />
      )}

      {/* RECURRING KNOWLEDGE ACQUISITION BRIDGE BANNER */}
      {knowledgeAcquisition && (
        <div className="px-4 py-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Newspaper className="w-4 h-4 text-[#E1392B] shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                Background Knowledge Acquisition Task ({knowledgeAcquisition.enabled ? `ACTIVE · ${knowledgeAcquisition.cadence}` : "PAUSED"})
              </div>
              <div className="font-mono text-[11px] text-slate-500 truncate">
                Crawls {knowledgeAcquisition.feeds.filter((f) => f.enabled).length} creator economy newsletters &amp; AI-tool trackers · {knowledgeAcquisition.totalDrafted} Opportunity cards auto-drafted into Ingest
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRunKnowledgeCrawl && (
              <button
                type="button"
                disabled={isCrawlingKnowledge}
                onClick={() => onRunKnowledgeCrawl()}
                className="h-7 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCrawlingKnowledge ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-[#E1392B]" />}
                <span>{isCrawlingKnowledge ? "Crawling..." : "Crawl Now"}</span>
              </button>
            )}
            {onOpenIngestOpportunities && (
              <button
                type="button"
                onClick={onOpenIngestOpportunities}
                className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-[#E1392B] font-semibold inline-flex items-center gap-1 hover:border-[#E1392B]"
              >
                <span>View Drafted Cards</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: FULL-FOCUS MONETIZATION COMMAND */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Multi-Stream Monetization Command &amp; Asset Valuation
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stack Ad-Share RPM, Brand Sponsorships, Recurring Affiliates, Multi-Language Arbitrage &amp; Digital Products into a scalable media asset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]">
              <span className="font-mono text-[10px] text-slate-500">MONTHLY GOAL ($)</span>
              <input
                type="number"
                min={500}
                step={500}
                value={monthlyGoal}
                onChange={(e) =>
                  onUpdateMonetizationPlan({ monthlyGoalUsd: Math.max(500, Number(e.target.value) || 6500) })
                }
                className="w-20 bg-transparent font-mono font-bold text-right tabular-nums focus:outline-none text-[#0F172A] dark:text-[#F1F5F9]"
              />
            </div>

            <button
              type="button"
              onClick={onOptimizeMonetization}
              disabled={isOptimizingMonetization}
              className="h-8 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {isOptimizingMonetization ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isOptimizingMonetization ? "Building Playbook..." : "AI Monetization Playbook & Pitch"}</span>
            </button>
          </div>
        </div>

        {/* 4-Column Financial Readout Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#D9DEE7] dark:border-[#222631] divide-y lg:divide-y-0 lg:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-[#F6F7F9]/70 dark:bg-[#0F1117]">
          <div className="px-5 py-3.5">
            <div className="font-mono text-[10px] text-slate-500">CURRENT MONTHLY RUN-RATE</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                ${totals.currentMonthly.toLocaleString()}/mo
              </span>
              <span className="font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
                {totals.progressPct}% of goal
              </span>
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="font-mono text-[10px] text-slate-500">STACKED TARGET ({totals.activeCount} STREAMS)</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                ${totals.targetMonthly.toLocaleString()}/mo
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                ${(totals.targetMonthly * 12).toLocaleString()}/yr
              </span>
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="font-mono text-[10px] text-slate-500">SPONSOR PIPELINE</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                ${totals.sponsorPipelinePotential.toLocaleString()}/mo
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                ${totals.sponsorCommitted.toLocaleString()} active
              </span>
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="font-mono text-[10px] text-slate-500">EST. CHANNEL ASSET VALUATION ({exitMultiple}×)</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-[#E1392B]">
                ${totals.exitValTarget.toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                now ${totals.exitValCurrent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left 7 Cols: 6-Stream Revenue Stack */}
          <div className="xl:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[11px] font-semibold uppercase text-slate-500">
                6-Stream Revenue Architecture
              </h3>
              <span className="font-mono text-[10px] text-slate-500">Toggle streams &amp; tune targets</span>
            </div>

            <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className={`p-3.5 space-y-2 transition-opacity ${
                    stream.enabled ? "bg-white dark:bg-[#111318]" : "bg-[#F6F7F9]/60 dark:bg-[#0D0F14] opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stream.enabled}
                        onChange={() => handleToggleStream(stream.id)}
                        className="accent-[#E1392B] w-3.5 h-3.5"
                      />
                      <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {stream.name}
                      </span>
                    </label>
                    <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                      <span className="text-slate-500">Now ${stream.monthlyCurrentUsd.toLocaleString()}</span>
                      <div className="flex items-center gap-1 border border-[#D9DEE7] dark:border-[#252A36] rounded-sm px-2 py-0.5 bg-[#F6F7F9] dark:bg-[#141720]">
                        <span className="text-[10px] text-slate-500">Target $</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={stream.monthlyTargetUsd}
                          onChange={(e) => handleUpdateStreamTarget(stream.id, Number(e.target.value) || 0)}
                          className="w-16 bg-transparent text-right font-semibold focus:outline-none text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{stream.actionNext}</span>
                    <span className="font-mono text-[10px] text-[#E1392B] shrink-0">
                      +${stream.effectiveRpmLiftUsd.toFixed(2)}/1K RPM lift · {stream.effortLevel} effort
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Sponsor Pipeline + AI Monetization Playbook & Pitch */}
          <div className="xl:col-span-5 space-y-4">
            {/* Sponsor Deal Pipeline */}
            <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  BRAND SPONSORSHIP &amp; CPA PIPELINE
                </span>
                <span className="font-mono text-[10px] text-slate-500">Click status to advance</span>
              </div>

              <div className="space-y-2">
                {sponsorPipeline.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{deal.brand}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ${deal.estMonthlyUsd}/mo
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCycleSponsorStatus(deal.id)}
                          className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase border ${
                            deal.status === "active"
                              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                              : deal.status === "pitched"
                                ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500"
                          }`}
                        >
                          {deal.status}
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {deal.model} · {deal.niche} · CTA: {deal.ctaHook}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSponsor} className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] grid grid-cols-12 gap-1.5 text-xs">
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Add sponsor brand..."
                  className="col-span-5 h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720]"
                />
                <select
                  aria-label="Sponsor niche"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value as ContentNiche)}
                  className="col-span-3 h-8 px-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720]"
                >
                  <option value="tech-ai">AI/Tech</option>
                  <option value="gaming">Gaming</option>
                  <option value="finance">Finance</option>
                  <option value="podcasts">Podcasts</option>
                </select>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={newMonthlyUsd}
                  onChange={(e) => setNewMonthlyUsd(Number(e.target.value) || 500)}
                  className="col-span-2 h-8 px-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono text-right"
                />
                <button
                  type="submit"
                  aria-label="Add sponsor prospect"
                  className="col-span-2 h-8 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* AI Monetization Playbook & Ready-to-Send Sponsor Pitch */}
            <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-[#E1392B]">
                  AI MONETIZATION PLAYBOOK
                </span>
                {monetizationPlan?.lastOptimizedAt && (
                  <span className="font-mono text-[10px] text-slate-500">
                    Updated {new Date(monetizationPlan.lastOptimizedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {monetizationPlan?.aiPlaybookSummary && (
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {monetizationPlan.aiPlaybookSummary}
                </p>
              )}

              {monetizationPlan?.aiActionSteps && monetizationPlan.aiActionSteps.length > 0 && (
                <div className="space-y-1.5">
                  {monetizationPlan.aiActionSteps.map((step, idx) => (
                    <div
                      key={`${step.title}_${idx}`}
                      className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{step.title}</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          +${step.expectedMonthlyLiftUsd}/mo · {step.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {monetizationPlan?.aiSponsorPitchScript && (
                <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                    <span>READY-TO-SEND SPONSOR PITCH</span>
                    <button
                      type="button"
                      onClick={() => copyText("pitch", monetizationPlan.aiSponsorPitchScript!)}
                      className="inline-flex items-center gap-1 hover:text-[#E1392B]"
                    >
                      {copiedKey === "pitch" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "pitch" ? "Copied" : "Copy Pitch"}</span>
                    </button>
                  </div>
                  <p className="p-2.5 rounded-sm bg-white dark:bg-[#141720] border border-[#D9DEE7] dark:border-[#222631] text-[11px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {monetizationPlan.aiSponsorPitchScript}
                  </p>
                </div>
              )}

              {monetizationPlan?.aiFunnelCtas && monetizationPlan.aiFunnelCtas.length > 0 && (
                <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1">
                  <div className="font-mono text-[10px] text-slate-500">HIGH-CONVERTING PINNED FUNNEL CTAs</div>
                  {monetizationPlan.aiFunnelCtas.map((cta, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="truncate">{cta}</span>
                      <button
                        type="button"
                        onClick={() => copyText(`cta_${i}`, cta)}
                        className="text-slate-400 hover:text-[#E1392B] shrink-0"
                        aria-label="Copy funnel CTA"
                      >
                        {copiedKey === `cta_${i}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SCHEDULED SELF-RESEARCH & CONTINUOUS APP LEARNING ENGINE */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Scheduled Self-Research &amp; Continuous App Learning Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatically researches new creator platforms, high-alpha ingest sources, retention editing methods, and monetization upgrades so ClipForge improves itself on schedule.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] cursor-pointer">
              <input
                type="checkbox"
                checked={selfLearning?.enabled ?? true}
                onChange={(e) => onUpdateSelfLearnConfig({ enabled: e.target.checked })}
                className="accent-[#E1392B]"
              />
              <span className="font-medium">Scheduler ON</span>
            </label>

            <select
              aria-label="Self-learning schedule cadence"
              value={selfLearning?.cadence || "daily"}
              onChange={(e) => onUpdateSelfLearnConfig({ cadence: e.target.value as SelfLearningCadence })}
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-xs"
            >
              {CADENCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] cursor-pointer">
              <input
                type="checkbox"
                checked={selfLearning?.autoAdoptSafeUpgrades ?? false}
                onChange={(e) => onUpdateSelfLearnConfig({ autoAdoptSafeUpgrades: e.target.checked })}
                className="accent-[#E1392B]"
              />
              <span>Auto-Adopt Safe Rules</span>
            </label>

            <button
              type="button"
              onClick={() => onRunSelfLearningCycle(customResearchFocus)}
              disabled={isRunningSelfLearn}
              className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {isRunningSelfLearn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#E1392B]" />
              )}
              <span>{isRunningSelfLearn ? "Researching Upgrades..." : "Run Learning Cycle Now"}</span>
            </button>
          </div>
        </div>

        {/* Scheduler Telemetry + Focus Bar */}
        <div className="px-5 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#0F1117] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-[#0F172A] dark:text-[#F1F5F9] font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#E1392B]" />
              Cycles Run: {selfLearning?.totalCyclesRun ?? 0}
            </span>
            <span>·</span>
            <span>
              Next Scheduled:{" "}
              {selfLearning?.nextRunAt ? new Date(selfLearning.nextRunAt).toLocaleString() : "Manual trigger"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FOCUS_AREAS.map((area) => {
              const active = selfLearning?.focusAreas.includes(area.id) ?? true;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleToggleFocusArea(area.id)}
                  className={`px-2 py-1 rounded-sm border text-[11px] font-medium transition-colors ${
                    active
                      ? "border-[#E1392B] bg-[#E1392B]/10 text-[#E1392B]"
                      : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500"
                  }`}
                >
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left 8 Cols: Custom Research Focus + Discovered Upgrades Feed */}
          <div className="xl:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="inline-flex items-center p-0.5 rounded-sm bg-[#F6F7F9] dark:bg-[#111318] border border-[#D9DEE7] dark:border-[#252A36] text-xs">
                {(
                  [
                    { id: "all", label: "All Upgrades" },
                    { id: "platform", label: "Platforms" },
                    { id: "source", label: "Sources" },
                    { id: "method", label: "Methods" },
                    { id: "monetization", label: "Monetization" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDiscoveryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-xs font-medium whitespace-nowrap ${
                      discoveryFilter === tab.id
                        ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customResearchFocus}
                onChange={(e) => setCustomResearchFocus(e.target.value)}
                placeholder="Optional focus (e.g., LinkedIn Shorts, Kick clips, German RPM)..."
                className="flex-1 max-w-sm h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs focus:outline-none focus:border-[#E1392B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDiscoveries.map((item) => (
                <article
                  key={item.id}
                  className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                      <span className="uppercase font-semibold text-[#E1392B] inline-flex items-center gap-1">
                        {item.type === "platform" ? (
                          <Layers className="w-3 h-3" />
                        ) : item.type === "source" ? (
                          <Radar className="w-3 h-3" />
                        ) : item.type === "method" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <DollarSign className="w-3 h-3" />
                        )}
                        {item.categoryLabel}
                      </span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        SCORE {item.opportunityScore}
                      </span>
                    </div>

                    <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                      {item.title}
                    </h3>

                    <div className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Expected Edge: {item.estRpmOrLift}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="p-2 rounded-sm bg-white dark:bg-[#141720] border border-[#D9DEE7] dark:border-[#222631] text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-mono text-[10px] text-slate-500 uppercase block mb-0.5">
                        App Integration Blueprint
                      </span>
                      {item.implementationBlueprint}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-2">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-[10px] text-slate-400">Live Research</span>
                    )}

                    {item.adopted ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Adopted into App</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAdoptDiscovery(item.id)}
                        disabled={adoptingDiscoveryId === item.id}
                        className="h-7 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center gap-1.5"
                      >
                        {adoptingDiscoveryId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        <span>Adopt Upgrade</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right 4 Cols: App Self-Improvement Memory & Cycle History */}
          <div className="xl:col-span-4 space-y-4">
            <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] space-y-2.5">
              <div className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                PERSISTENT LEARNED RULES ({selfLearning?.learnedRules.length || 0})
              </div>
              <p className="text-[11px] text-slate-500">
                Rules distilled from scheduled research, Viral Sentiment &amp; Performance ROI that guide your AI Director.
              </p>
              <div className="space-y-2">
                {(selfLearning?.learnedRules || []).map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                  >
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] space-y-2.5">
              <div className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                RESEARCH CYCLE HISTORY
              </div>
              <div className="space-y-2">
                {(selfLearning?.cycleLogs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span className="uppercase text-[#E1392B] font-semibold">{log.trigger}</span>
                      <span>{new Date(log.ranAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-snug">{log.keyInsight}</p>
                    <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                      +{log.discoveriesFound} upgrades found · {log.autoAdoptedCount} auto-adopted
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
