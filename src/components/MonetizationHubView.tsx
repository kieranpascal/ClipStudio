import { useMemo, useState } from "react";
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
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Search,
  BarChart3,
  Link2,
  Mail,
  FlaskConical,
  Film,
  TrendingUp,
  ArrowUpRight,
  Power,
  Bell,
} from "lucide-react";
import type {
  AffiliateOfferLink,
  ClipItem,
  ContentNiche,
  CtaPlacementType,
  DeepResearchDossier,
  EmailCaptureLandingPage,
  LongFormGraduationItem,
  MonetizationPlan,
  RemoteBridgeConfig,
  RemoteMessagingPlatform,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";
import { AbFunnelTestPanel } from "./AbFunnelTestPanel";
import { SponsorHealthMonitor } from "./SponsorHealthMonitor";
import { RevenueFunnelEngine } from "./RevenueFunnelEngine";
import { DiscordAlertsConfigPanel } from "./DiscordAlertsConfigPanel";

interface MonetizationHubViewProps {
  clips: ClipItem[];
  monetizationPlan?: MonetizationPlan;
  affiliateOffers: AffiliateOfferLink[];
  emailLandingPages: EmailCaptureLandingPage[];
  longFormPipeline: LongFormGraduationItem[];
  remoteBridge?: RemoteBridgeConfig;
  deepResearch?: DeepResearchDossier;
  isOptimizingMonetization: boolean;
  isProjectingRevenue: boolean;
  isAnalyzingFunnel: boolean;
  isApplyingFunnelWinner: boolean;
  isRunningDeepResearch: boolean;
  onUpdateMonetizationPlan: (patch: Partial<MonetizationPlan>) => Promise<void>;
  onOptimizeMonetization: () => Promise<void>;
  onProjectRevenue: (payload?: { horizonMonths?: number; dailyPostsTarget?: number }) => Promise<void>;
  onAddFunnelVariant: (payload: {
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
  onAnalyzeFunnel: (focusSponsor?: string) => Promise<void>;
  onApplyFunnelWinner: () => Promise<void>;
  onAddAffiliateOffer: (payload: {
    partnerName: string;
    niche: ContentNiche;
    offerHook: string;
    destinationUrl: string;
    commissionPct: number;
    estEpcUsd: number;
  }) => Promise<void>;
  onDeleteAffiliateOffer: (id: string) => Promise<void>;
  onTrackAffiliateEvent: (id: string, clicks: number, conversions: number) => Promise<void>;
  onAddLandingPage: (payload: {
    headline: string;
    leadMagnetTitle: string;
    subheadline: string;
    ctaButtonText: string;
    linkedAffiliateId?: string;
    niche: ContentNiche;
  }) => Promise<void>;
  onUpdateLandingPage: (
    id: string,
    patch: { active?: boolean; addVisitors?: number; addSubscribers?: number; addAffiliateClicks?: number }
  ) => Promise<void>;
  onGraduateToLongForm: (clipId: string) => Promise<void>;
  onUpdateRemoteBridge: (patch: Partial<RemoteBridgeConfig>) => Promise<void>;
  onRunRemoteCommand: (platform: RemoteMessagingPlatform, command: string) => Promise<void>;
  onDispatchDiscordAlert: (payload: {
    alertType: "mission-success" | "roi-surge";
    customNote?: string;
  }) => Promise<void>;
  isDispatchingDiscordAlert?: boolean;
  onRunDeepResearch: (payload: {
    query: string;
    niche: ContentNiche | "all";
    autoDraftCards: boolean;
  }) => Promise<void>;
  onAskAgent: (prompt: string) => Promise<void>;
}

type HubSection = "overview" | "affiliates" | "funnel" | "discord-alerts" | "deep-research";

export function MonetizationHubView({
  clips,
  monetizationPlan,
  affiliateOffers,
  emailLandingPages,
  longFormPipeline,
  remoteBridge,
  deepResearch,
  isOptimizingMonetization,
  isProjectingRevenue,
  isAnalyzingFunnel,
  isApplyingFunnelWinner,
  isRunningDeepResearch,
  isDispatchingDiscordAlert = false,
  onUpdateMonetizationPlan,
  onOptimizeMonetization,
  onProjectRevenue,
  onAddFunnelVariant,
  onAnalyzeFunnel,
  onApplyFunnelWinner,
  onAddAffiliateOffer,
  onDeleteAffiliateOffer,
  onTrackAffiliateEvent,
  onAddLandingPage,
  onUpdateLandingPage,
  onGraduateToLongForm,
  onUpdateRemoteBridge,
  onRunRemoteCommand,
  onDispatchDiscordAlert,
  onRunDeepResearch,
  onAskAgent,
}: MonetizationHubViewProps) {
  const [section, setSection] = useState<HubSection>("overview");
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [dailyPostsTarget, setDailyPostsTarget] = useState(4);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Affiliate Add Form
  const [showAffiliateForm, setShowAffiliateForm] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [affNiche, setAffNiche] = useState<ContentNiche>("tech-ai");
  const [offerHook, setOfferHook] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [commissionPct, setCommissionPct] = useState(25);
  const [estEpcUsd, setEstEpcUsd] = useState(1.9);

  // Landing Page Add Form
  const [showLpForm, setShowLpForm] = useState(false);
  const [lpHeadline, setLpHeadline] = useState("");
  const [lpMagnet, setLpMagnet] = useState("");
  const [lpSubheadline, setLpSubheadline] = useState(
    "Enter your email to get the free template and instant partner discount."
  );
  const [lpCta, setLpCta] = useState("Send Me The Free Guide");
  const [lpLinkedAff, setLpLinkedAff] = useState(affiliateOffers[0]?.id || "");
  const [lpNiche, setLpNiche] = useState<ContentNiche>("tech-ai");

  // Deep Multi-Source Research Form
  const [researchQuery, setResearchQuery] = useState(
    deepResearch?.query ||
      "Highest-converting affiliate tools, email lead magnets, and viewer complaints in AI & Finance Shorts"
  );
  const [researchNiche, setResearchNiche] = useState<ContentNiche | "all">("all");
  const [autoDraftCards, setAutoDraftCards] = useState(true);

  const summary = useMemo(() => {
    const streams = monetizationPlan?.streams || [];
    const enabledStreams = streams.filter((s) => s.enabled);
    const monthlyCurrent = enabledStreams.reduce((sum, s) => sum + s.monthlyCurrentUsd, 0);
    const monthlyGoal = monetizationPlan?.monthlyGoalUsd || 6000;
    const affiliateClicks = affiliateOffers.reduce((s, a) => s + a.clicks30d, 0);
    const affiliateConvs = affiliateOffers.reduce((s, a) => s + a.conversions30d, 0);
    const affiliateRev30d = Math.round(
      affiliateOffers.reduce((s, a) => s + a.clicks30d * a.estEpcUsd, 0)
    );
    const avgEpc = affiliateClicks > 0 ? affiliateRev30d / affiliateClicks : 0;
    const lpVisitors = emailLandingPages.reduce((s, p) => s + p.visitors30d, 0);
    const lpSubs = emailLandingPages.reduce((s, p) => s + p.subscribers30d, 0);
    const lpAttributedRev = emailLandingPages.reduce((s, p) => s + p.revenueAttributedUsd, 0);
    const lpOptInPct = lpVisitors > 0 ? (lpSubs / lpVisitors) * 100 : 0;
    const avgLongFormRpm =
      longFormPipeline.length > 0
        ? longFormPipeline.reduce((s, l) => s + l.estLongFormRpmUsd, 0) / longFormPipeline.length
        : 16.5;

    return {
      monthlyCurrent,
      monthlyGoal,
      affiliateClicks,
      affiliateConvs,
      affiliateRev30d,
      avgEpc,
      lpVisitors,
      lpSubs,
      lpAttributedRev,
      lpOptInPct,
      avgLongFormRpm,
    };
  }, [monetizationPlan, affiliateOffers, emailLandingPages, longFormPipeline]);

  const projectionData = useMemo(() => {
    const existing = monetizationPlan?.revenueProjection?.monthlySeries;
    if (existing && existing.length > 0) {
      return existing.map((pt) => {
        const sponsorPart = Math.round(pt.sponsorAffiliateUsd * 0.58);
        const affiliatePart = Math.max(0, pt.sponsorAffiliateUsd - sponsorPart);
        return {
          monthLabel: pt.monthLabel,
          adShare: pt.adShareUsd,
          sponsorships: sponsorPart,
          affiliatesAndEmail: affiliatePart,
          total: pt.baseUsd || pt.adShareUsd + pt.sponsorAffiliateUsd,
          target: summary.monthlyGoal,
        };
      });
    }
    const baseAd = Math.max(420, Math.round(summary.monthlyCurrent * 0.28));
    const baseSponsor = Math.max(900, Math.round(summary.monthlyCurrent * 0.44));
    const baseAffEmail = Math.max(680, Math.round(summary.affiliateRev30d * 0.55 + summary.lpAttributedRev * 0.35));
    return Array.from({ length: horizonMonths }, (_, idx) => {
      const growth = Math.pow(1.11 + dailyPostsTarget * 0.008, idx);
      const adShare = Math.round(baseAd * growth);
      const sponsorships = Math.round(baseSponsor * Math.pow(1.09, idx));
      const affiliatesAndEmail = Math.round(baseAffEmail * Math.pow(1.13, idx));
      return {
        monthLabel: `M${idx + 1}`,
        adShare,
        sponsorships,
        affiliatesAndEmail,
        total: adShare + sponsorships + affiliatesAndEmail,
        target: summary.monthlyGoal,
      };
    });
  }, [monetizationPlan?.revenueProjection, summary, horizonMonths, dailyPostsTarget]);

  function copyLink(id: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  }

  async function handleSubmitAffiliate(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerName.trim() || !destinationUrl.trim()) return;
    await onAddAffiliateOffer({
      partnerName: partnerName.trim(),
      niche: affNiche,
      offerHook: offerHook.trim() || "Exclusive viewer partner discount",
      destinationUrl: destinationUrl.trim(),
      commissionPct,
      estEpcUsd,
    });
    setPartnerName("");
    setOfferHook("");
    setDestinationUrl("");
    setShowAffiliateForm(false);
  }

  async function handleSubmitLandingPage(e: React.FormEvent) {
    e.preventDefault();
    if (!lpHeadline.trim() || !lpMagnet.trim()) return;
    await onAddLandingPage({
      headline: lpHeadline.trim(),
      leadMagnetTitle: lpMagnet.trim(),
      subheadline: lpSubheadline.trim(),
      ctaButtonText: lpCta.trim() || "Get Free Access",
      linkedAffiliateId: lpLinkedAff || undefined,
      niche: lpNiche,
    });
    setLpHeadline("");
    setLpMagnet("");
    setShowLpForm(false);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Monetization Hub"
        title="AI Director Revenue, Affiliate & Lead Capture Workspace"
        subtitle="Consolidates affiliate link tracking, email capture bridge landing pages, multi-stream revenue projections, grouped CTA A/B funnel testing, sponsor burn rate monitoring, and Short → Long-Form graduation."
        metaItems={[
          { label: `${affiliateOffers.length} Affiliate Offers` },
          { label: `${emailLandingPages.length} Lead Capture Pages` },
          { label: `${longFormPipeline.length} Long-Form Graduations` },
          { label: `$${summary.monthlyCurrent.toLocaleString()}/mo Run-Rate`, emphasis: "emerald" },
        ]}
        actions={
          <>
            <button
              type="button"
              disabled={isProjectingRevenue}
              onClick={() => onProjectRevenue({ horizonMonths, dailyPostsTarget })}
              className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {isProjectingRevenue ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5 text-[#E1392B]" />
              )}
              <span>Run Gemini Revenue Forecast</span>
            </button>
            <button
              type="button"
              disabled={isOptimizingMonetization}
              onClick={onOptimizeMonetization}
              className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {isOptimizingMonetization ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Optimize Revenue Plan</span>
            </button>
          </>
        }
      />

      {/* Consolidated Financial Telemetry Strip */}
      <StudioKpiStrip
        items={[
          {
            id: "runrate",
            label: "Monthly Run-Rate vs. Goal",
            value: `$${summary.monthlyCurrent.toLocaleString()}`,
            subtext: `Goal $${summary.monthlyGoal.toLocaleString()}/mo · ${Math.round((summary.monthlyCurrent / Math.max(1, summary.monthlyGoal)) * 100)}% attained`,
            tone: "emerald",
          },
          {
            id: "aff",
            label: "Affiliate Attributed (30d)",
            value: `$${summary.affiliateRev30d.toLocaleString()}`,
            subtext: `${formatCompactNumber(summary.affiliateClicks)} clicks · ${summary.affiliateConvs} conv · $${summary.avgEpc.toFixed(2)} EPC`,
          },
          {
            id: "email",
            label: "Email Lead Capture (30d)",
            value: `${formatCompactNumber(summary.lpSubs)} leads`,
            subtext: `${summary.lpOptInPct.toFixed(1)}% opt-in rate · $${summary.lpAttributedRev.toLocaleString()} bridge rev`,
          },
          {
            id: "longform",
            label: "Long-Form RPM Potential",
            value: `$${summary.avgLongFormRpm.toFixed(2)} RPM`,
            subtext: `${longFormPipeline.length} validated shorts graduated to 10m+`,
          },
        ]}
      />

      {/* Clean Single-Row Workspace Sub-Navigation */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-[#ECEFF4]/70 dark:bg-[#0D0F14] flex items-center gap-6 overflow-x-auto">
        {(
          [
            { id: "overview", label: "Projected Revenue & Streams", icon: TrendingUp },
            { id: "affiliates", label: "Affiliates & Lead Capture Pages", icon: Link2 },
            { id: "funnel", label: "CTA A/B Funnel & Sponsor Burn Rate", icon: FlaskConical },
            { id: "discord-alerts", label: "Discord AI Alerts", icon: Bell },
            { id: "deep-research", label: "Deep Research, Long-Form & Remote Ops", icon: Film },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                active
                  ? "text-[#0F172A] dark:text-[#F8FAFC]"
                  : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-[#E1392B]" : ""}`} />
              <span>{tab.label}</span>
              {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PROJECTED REVENUE VISUALIZATIONS & STREAM MIX */}
      {section === "overview" && (
        <div className="p-5 space-y-5 max-w-[1440px] w-full mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Telemetry Chart (8 cols) */}
            <section className="xl:col-span-8 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
              <StudioSectionHeader
                zone="telemetry"
                title="Multi-Stream Projected Revenue Trajectory"
                detail={`Ad-Share + Sponsors + Affiliate & Email Bridge across ${horizonMonths} months`}
                rightSlot={
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={horizonMonths}
                      onChange={(e) => setHorizonMonths(Number(e.target.value))}
                      aria-label="Forecast horizon"
                      className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono text-[11px]"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                    </select>
                    <select
                      value={dailyPostsTarget}
                      onChange={(e) => setDailyPostsTarget(Number(e.target.value))}
                      aria-label="Daily posting cadence"
                      className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono text-[11px]"
                    >
                      <option value={2}>2 Posts/Day</option>
                      <option value={4}>4 Posts/Day</option>
                      <option value={6}>6 Posts/Day</option>
                    </select>
                  </div>
                }
              />

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projectionData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252A36" strokeOpacity={0.22} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(1)}k`}
                      width={52}
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
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="adShare" stackId="rev" name="Ad-Share ($)" fill="#475569" />
                    <Bar dataKey="sponsorships" stackId="rev" name="Sponsorships ($)" fill="#2563EB" />
                    <Bar dataKey="affiliatesAndEmail" stackId="rev" name="Affiliates & Email ($)" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Projected Total ($)"
                      stroke="#E1392B"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Actionable Revenue Stream Controls (4 cols) */}
            <section className="xl:col-span-4 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
              <StudioSectionHeader
                zone="action"
                title="Active Revenue Streams"
                detail="Toggle streams included in AI Director projections"
              />

              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                {(monetizationPlan?.streams || []).map((stream) => (
                  <div key={stream.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <label className="flex items-start gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={stream.enabled}
                        onChange={() => {
                          if (!monetizationPlan) return;
                          const nextStreams = monetizationPlan.streams.map((s) =>
                            s.id === stream.id ? { ...s, enabled: !s.enabled } : s
                          );
                          onUpdateMonetizationPlan({ streams: nextStreams });
                        }}
                        className="mt-0.5 accent-[#E1392B]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                          {stream.name}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-500">
                          {stream.enabled ? "Active" : "Paused"} · {stream.effortLevel} effort · Target ${stream.monthlyTargetUsd.toLocaleString()}/mo
                        </span>
                      </span>
                    </label>
                    <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                      ${stream.monthlyCurrentUsd.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Quick Snapshots linking Affiliates + Lead Capture directly on Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-3">
              <StudioSectionHeader
                zone="telemetry"
                title="Top Performing Affiliate Links"
                detail={`$${summary.affiliateRev30d.toLocaleString()} est. 30d revenue`}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setSection("affiliates")}
                    className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29] text-xs">
                {affiliateOffers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                        {offer.partnerName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {offer.commissionPct}% comm · {formatCompactNumber(offer.clicks30d)} clicks · {offer.conversions30d} conv
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        ${Math.round(offer.clicks30d * offer.estEpcUsd).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">${offer.estEpcUsd.toFixed(2)} EPC</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-3">
              <StudioSectionHeader
                zone="telemetry"
                title="Email Capture Bridge Landing Pages"
                detail={`${formatCompactNumber(summary.lpSubs)} subscribers · ${summary.lpOptInPct.toFixed(1)}% avg opt-in`}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setSection("affiliates")}
                    className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage Pages</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29] text-xs">
                {emailLandingPages.slice(0, 3).map((page) => {
                  const rate = page.visitors30d > 0 ? (page.subscribers30d / page.visitors30d) * 100 : 0;
                  return (
                    <div key={page.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                          {page.headline}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {page.slug} · {formatCompactNumber(page.subscribers30d)} leads · {rate.toFixed(1)}% opt-in
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${page.revenueAttributedUsd.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">{page.active ? "Active" : "Paused"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Discord AI Director Alert Routing Bar */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <Bell className="w-4 h-4 text-[#E1392B] shrink-0" />
              <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                AI Director Discord Alerts
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                {remoteBridge?.discordChannelName || "#ai-director-alerts"}
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-slate-500">
                Mission Success: {remoteBridge?.alertOnMissionSuccess !== false ? "On" : "Off"} · ROI Surge (&ge;+{remoteBridge?.roiSurgeThresholdPct ?? 15}%): {remoteBridge?.alertOnRevenueSurge !== false ? "On" : "Off"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSection("discord-alerts")}
              className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Configure Discord Alerts</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#E1392B]" />
            </button>
          </section>
        </div>
      )}

      {/* SECTION 2: CONSOLIDATED AFFILIATE TRACKING & EMAIL CAPTURE LANDING PAGE MANAGEMENT */}
      {section === "affiliates" && (
        <div className="p-5 space-y-5 max-w-[1440px] w-full mx-auto">
          {/* Affiliate Tracking Ledger */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Affiliate Link Tracking & Attribution Ledger"
              detail={`${affiliateOffers.length} offers · HTTPS validated · Log clicks & conversions live`}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowAffiliateForm((v) => !v)}
                  className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAffiliateForm ? "Close Form" : "Add Affiliate Offer"}</span>
                </button>
              }
            />

            {showAffiliateForm && (
              <form
                onSubmit={handleSubmitAffiliate}
                className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] grid grid-cols-1 md:grid-cols-6 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Partner Name (e.g., RunPod GPU)"
                  className="md:col-span-2 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://partner.com/?ref=you"
                  className="md:col-span-2 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <select
                  value={affNiche}
                  onChange={(e) => setAffNiche(e.target.value as ContentNiche)}
                  className="h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                >
                  <option value="tech-ai">AI &amp; Tech</option>
                  <option value="finance">Finance</option>
                  <option value="gaming">Gaming</option>
                  <option value="podcasts">Podcasts</option>
                  <option value="faceless-doc">Faceless Doc</option>
                  <option value="sports-irl">Sports &amp; IRL</option>
                </select>
                <button
                  type="submit"
                  className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                >
                  Save Offer
                </button>
                <input
                  type="text"
                  value={offerHook}
                  onChange={(e) => setOfferHook(e.target.value)}
                  placeholder="Pinned CTA hook copy (e.g., Free $25 credit with code FORGE)"
                  className="md:col-span-4 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <label className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <span>Comm%</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    className="w-16 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white"
                  />
                </label>
                <label className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <span>EPC $</span>
                  <input
                    type="number"
                    step="0.05"
                    min={0.1}
                    max={50}
                    value={estEpcUsd}
                    onChange={(e) => setEstEpcUsd(Number(e.target.value))}
                    className="w-20 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white"
                  />
                </label>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E7F0] dark:border-[#1E222D] text-[11px] text-slate-500">
                    <th className="py-2 pr-3 font-medium">Partner &amp; Offer Hook</th>
                    <th className="py-2 px-2 font-medium text-right">Comm.</th>
                    <th className="py-2 px-2 font-medium text-right">Clicks (30d)</th>
                    <th className="py-2 px-2 font-medium text-right">Conv.</th>
                    <th className="py-2 px-2 font-medium text-right">EPC</th>
                    <th className="py-2 px-2 font-medium text-right">Est. 30d Rev</th>
                    <th className="py-2 pl-3 font-medium text-right">Track &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                  {affiliateOffers.map((offer) => {
                    const convPct = offer.clicks30d > 0 ? (offer.conversions30d / offer.clicks30d) * 100 : 0;
                    const estRev = Math.round(offer.clicks30d * offer.estEpcUsd);
                    const trackedUrl = `${offer.destinationUrl}${offer.destinationUrl.includes("?") ? "&" : "?"}${offer.utmCode}`;
                    return (
                      <tr key={offer.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#151821]">
                        <td className="py-3 pr-3 max-w-[300px]">
                          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
                            <span className="truncate">{offer.partnerName}</span>
                            <a
                              href={offer.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-[#E1392B]"
                              aria-label={`Open ${offer.partnerName}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {offer.niche} · {offer.offerHook}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{offer.commissionPct}%</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">
                          {formatCompactNumber(offer.clicks30d)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">
                          {offer.conversions30d} ({convPct.toFixed(1)}%)
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">${offer.estEpcUsd.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ${estRev.toLocaleString()}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={trackingId === offer.id}
                              onClick={async () => {
                                setTrackingId(offer.id);
                                try {
                                  await onTrackAffiliateEvent(offer.id, 15, 1);
                                } finally {
                                  setTrackingId(null);
                                }
                              }}
                              className="h-7 px-2 rounded-xs border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-mono text-[10px] font-semibold"
                              title="Log +15 clicks and +1 verified conversion"
                            >
                              +15c / +1s
                            </button>
                            <button
                              type="button"
                              onClick={() => copyLink(offer.id, trackedUrl)}
                              className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-[11px] inline-flex items-center gap-1"
                            >
                              {copiedId === offer.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>UTM</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAffiliateOffer(offer.id)}
                              aria-label={`Remove ${offer.partnerName}`}
                              className="h-7 w-7 rounded-xs text-slate-400 hover:text-rose-500 inline-flex items-center justify-center"
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
          </section>

          {/* Lead Capture Landing Page Manager */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Email Lead Capture Bridge Pages"
              detail="Capture audience emails with a free lead magnet before redirecting to your affiliate offer"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowLpForm((v) => !v)}
                  className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>{showLpForm ? "Close Builder" : "New Lead Capture Page"}</span>
                </button>
              }
            />

            {showLpForm && (
              <form
                onSubmit={handleSubmitLandingPage}
                className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] grid grid-cols-1 md:grid-cols-6 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={lpHeadline}
                  onChange={(e) => setLpHeadline(e.target.value)}
                  placeholder="Landing Page Headline (e.g., Free 2026 Local AI Shorts Kit)"
                  className="md:col-span-3 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <input
                  type="text"
                  required
                  value={lpMagnet}
                  onChange={(e) => setLpMagnet(e.target.value)}
                  placeholder="Lead Magnet Title (PDF, Notion Sheet, Preset Pack)"
                  className="md:col-span-3 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <input
                  type="text"
                  value={lpSubheadline}
                  onChange={(e) => setLpSubheadline(e.target.value)}
                  placeholder="Value proposition subheadline"
                  className="md:col-span-2 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <select
                  value={lpLinkedAff}
                  onChange={(e) => setLpLinkedAff(e.target.value)}
                  className="md:col-span-2 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                >
                  <option value="">Redirect to Affiliate Offer...</option>
                  {affiliateOffers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.partnerName} (${a.estEpcUsd.toFixed(2)} EPC)
                    </option>
                  ))}
                </select>
                <select
                  value={lpNiche}
                  onChange={(e) => setLpNiche(e.target.value as ContentNiche)}
                  className="h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                >
                  <option value="tech-ai">AI &amp; Tech</option>
                  <option value="finance">Finance</option>
                  <option value="gaming">Gaming</option>
                  <option value="podcasts">Podcasts</option>
                </select>
                <button
                  type="submit"
                  className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold"
                >
                  Publish Page
                </button>
              </form>
            )}

            <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
              {emailLandingPages.map((page) => {
                const optInPct =
                  page.visitors30d > 0 ? (page.subscribers30d / page.visitors30d) * 100 : 0;
                const linkedOffer = affiliateOffers.find((a) => a.id === page.linkedAffiliateId);
                return (
                  <div
                    key={page.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
                        <span className={page.active ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                          {page.active ? "Live" : "Paused"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{page.slug}</span>
                        <span aria-hidden="true">·</span>
                        <span>Bridge → {linkedOffer ? linkedOffer.partnerName : "Direct Newsletter"}</span>
                      </div>
                      <div className="font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                        {page.headline}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Lead Magnet: {page.leadMagnetTitle}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      <div className="grid grid-cols-3 gap-4 font-mono tabular-nums text-right">
                        <div>
                          <div className="text-[10px] text-slate-500">Visitors</div>
                          <div className="font-semibold">{formatCompactNumber(page.visitors30d)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Opt-Ins</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCompactNumber(page.subscribers30d)} ({optInPct.toFixed(1)}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Attributed</div>
                          <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            ${page.revenueAttributedUsd.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateLandingPage(page.id, {
                              addVisitors: 30,
                              addSubscribers: 11,
                              addAffiliateClicks: 5,
                            })
                          }
                          className="h-7 px-2.5 rounded-xs border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-mono text-[10px] font-semibold"
                          title="Record +30 visits, +11 email opt-ins, +5 affiliate clicks"
                        >
                          +11 Leads
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateLandingPage(page.id, { active: !page.active })}
                          className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Power className="w-3 h-3" />
                          <span>{page.active ? "Pause" : "Activate"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SECTION 3: CTA PLACEMENT A/B FUNNEL & SPONSOR HEALTH BURN RATE */}
      {section === "funnel" && (
        <div className="p-5 space-y-5 max-w-[1440px] w-full mx-auto">
          <AbFunnelTestPanel
            funnelTest={monetizationPlan?.funnelTest}
            isAnalyzingFunnel={isAnalyzingFunnel}
            isApplyingFunnelWinner={isApplyingFunnelWinner}
            onAddFunnelVariant={onAddFunnelVariant}
            onAnalyzeFunnel={onAnalyzeFunnel}
            onApplyFunnelWinner={onApplyFunnelWinner}
          />
          <div className="-mx-5">
            <SponsorHealthMonitor
              monetizationPlan={monetizationPlan}
              onOpenFunnelTest={() => setSection("funnel")}
              onAskAgent={onAskAgent}
            />
          </div>
        </div>
      )}

      {/* SECTION 4: DISCORD AI DIRECTOR ALERTS CONFIGURATION (REMOTE BRIDGE) */}
      {section === "discord-alerts" && (
        <div className="p-5 space-y-5 max-w-[1440px] w-full mx-auto">
          <DiscordAlertsConfigPanel
            remoteBridge={remoteBridge}
            isDispatchingAlert={isDispatchingDiscordAlert}
            onUpdateRemoteBridge={onUpdateRemoteBridge}
            onDispatchDiscordAlert={onDispatchDiscordAlert}
          />
        </div>
      )}

      {/* SECTION 5: DEEP MULTI-SOURCE RESEARCH, SHORT->LONG-FORM & REMOTE OPS */}
      {section === "deep-research" && (
        <div className="p-5 space-y-5 max-w-[1440px] w-full mx-auto">
          {/* Deep Multi-Source Research Dossier (YouTube/Reddit/X/TikTok Comments + Newsletters) */}
          <section className="rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Deep Multi-Source Comment & Monetization Research"
              detail="Scans YouTube/TikTok comments, Reddit threads, X discussions & newsletters via Google Search"
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!researchQuery.trim() || isRunningDeepResearch) return;
                onRunDeepResearch({
                  query: researchQuery.trim(),
                  niche: researchNiche,
                  autoDraftCards,
                });
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="Research viewer complaints, affiliate gaps, or monetization angles..."
                  className="w-full h-8 pl-8 pr-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs focus:outline-none focus:border-[#E1392B]"
                />
              </div>
              <select
                value={researchNiche}
                onChange={(e) => setResearchNiche(e.target.value as ContentNiche | "all")}
                className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
              >
                <option value="all">All Niches</option>
                <option value="tech-ai">AI &amp; Tech</option>
                <option value="finance">Finance</option>
                <option value="gaming">Gaming</option>
                <option value="podcasts">Podcasts</option>
                <option value="faceless-doc">Faceless Doc</option>
              </select>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 px-1.5">
                <input
                  type="checkbox"
                  checked={autoDraftCards}
                  onChange={(e) => setAutoDraftCards(e.target.checked)}
                  className="accent-[#E1392B]"
                />
                <span>Auto-draft Opportunity cards</span>
              </label>
              <button
                type="submit"
                disabled={isRunningDeepResearch}
                className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {isRunningDeepResearch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Run Deep Research</span>
              </button>
            </form>

            {deepResearch && (
              <div className="space-y-3 pt-2 border-t border-[#EEF1F6] dark:border-[#1E222D]">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Executive Synthesis: </span>
                  {deepResearch.executiveBrief}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {deepResearch.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span className="text-[#E1392B] font-semibold">{finding.sourceChannel}</span>
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                          Est. ${finding.estRpmUsd.toFixed(2)} RPM · {finding.confidenceScore}% conf
                        </span>
                      </div>
                      <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        &ldquo;{finding.viralHookAngle}&rdquo;
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {finding.painPoint}
                      </p>
                      <div className="pt-2 border-t border-[#E2E7F0] dark:border-[#1E222D] space-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-500">Affiliate:</span>{" "}
                          <span className="text-[#0F172A] dark:text-slate-200">{finding.recommendedAffiliate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Email Magnet:</span>{" "}
                          <span className="text-[#0F172A] dark:text-slate-200">{finding.emailLeadMagnet}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Long-Form:</span>{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {finding.longFormExpansionTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Short -> Long-Form Graduation & Discord/Telegram/WhatsApp Remote Ops */}
          <RevenueFunnelEngine
            clips={clips}
            affiliateOffers={affiliateOffers}
            emailLandingPages={emailLandingPages}
            longFormPipeline={longFormPipeline}
            remoteBridge={remoteBridge}
            onAddAffiliateOffer={onAddAffiliateOffer}
            onDeleteAffiliateOffer={onDeleteAffiliateOffer}
            onAddLandingPage={onAddLandingPage}
            onGraduateToLongForm={onGraduateToLongForm}
            onUpdateRemoteBridge={onUpdateRemoteBridge}
            onRunRemoteCommand={onRunRemoteCommand}
          />
        </div>
      )}
    </div>
  );
}
