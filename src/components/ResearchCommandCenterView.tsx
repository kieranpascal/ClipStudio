import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  ArrowUpRight,
  Bot,
  Check,
  Flame,
  Kanban,
  LayoutGrid,
  Loader2,
  MessageSquareText,
  Newspaper,
  Pin,
  Plus,
  Radar,
  Radio,
  RefreshCw,
  Rocket,
  ScatterChart as ScatterIcon,
  Search,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import type {
  ClipItem,
  CompetitiveNicheAlert,
  ContentNiche,
  DeepResearchDossier,
  DeepResearchFinding,
  IndustryNewsSnapshot,
  KnowledgeAcquisitionState,
  OpportunityDiscoverySnapshot,
  OpportunityGapTopic,
  PipelineConfig,
  ResearchOpportunity,
  TrendPulseSnapshot,
  TrendPulseTopic,
  ViralSentimentSnapshot,
  WorkspaceTab,
} from "../types";
import {
  StudioKpiStrip,
  StudioMeterBar,
  StudioPageHeader,
  StudioRadialGauge,
  StudioSectionHeader,
  StudioSubNavBar,
  StudioViewSwitcher,
} from "./StudioChrome";

interface ResearchCommandCenterViewProps {
  clips: ClipItem[];
  config: PipelineConfig;
  opportunityDiscovery?: OpportunityDiscoverySnapshot;
  researchOpportunities: ResearchOpportunity[];
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  deepResearch?: DeepResearchDossier;
  viralSentiment?: ViralSentimentSnapshot;
  industryNews?: IndustryNewsSnapshot;
  trendPulse?: TrendPulseSnapshot;
  competitiveAlerts: CompetitiveNicheAlert[];
  isDiscovering: boolean;
  isRunningDeepResearch: boolean;
  isCrawlingKnowledge: boolean;
  isFetchingTrends: boolean;
  isDirecting: boolean;
  isScanningSentiment: boolean;
  isApplyingSentiment: boolean;
  onSelectTab: (tab: WorkspaceTab) => void;
  onQuickGapScan: (niche: ContentNiche | "all", customQuery: string) => Promise<void>;
  onQuickDeepResearch: (query: string, niche: ContentNiche | "all") => Promise<void>;
  onRunKnowledgeCrawl: () => Promise<void>;
  onCreateClipFromOpportunity: (opp: ResearchOpportunity) => Promise<void>;
  onCreateClipFromDiscoveredTopic: (topic: OpportunityGapTopic) => Promise<void>;
  onCreateClipFromFinding: (finding: DeepResearchFinding) => Promise<void>;
  onLaunchRapidMission: (alertId: string) => Promise<void>;
  onFetchTrends: (focus: string) => Promise<void>;
  onToggleTrendPin: (topicId: string) => Promise<void>;
  onTrackTrendGame: (gameName: string) => Promise<void>;
  onExecuteDirector: (instruction: string) => Promise<void>;
  onScanViralSentiment: (niche: ContentNiche, topicQuery?: string) => Promise<void>;
  onApplySentimentToDirector: () => Promise<void>;
}

type CommanderSubPage = "commander" | "trendpulse" | "sentiment";
type DeckViewMode = "cards" | "board" | "matrix";
type SignalSourceKind = "all" | "social-trend" | "keyword-gap" | "competitor-audit" | "community-sentiment";

interface UnifiedIntelSignal {
  id: string;
  sourceKind: Exclude<SignalSourceKind, "all">;
  sourceLabel: string;
  niche: string;
  title: string;
  hookAngle: string;
  whyItWins: string;
  monetizationNote: string;
  score: number;
  demandScore: number;
  monetizationScore: number;
  estRpmUsd: number;
  pinned?: boolean;
  rawType: "trend" | "gap" | "opportunity" | "competitor" | "finding";
  rawTrend?: TrendPulseTopic;
  rawGap?: OpportunityGapTopic;
  rawOpportunity?: ResearchOpportunity;
  rawAlert?: CompetitiveNicheAlert;
  rawFinding?: DeepResearchFinding;
}

const NICHE_LABELS: Record<ContentNiche, string> = {
  "tech-ai": "AI & Tech",
  finance: "Finance",
  gaming: "Gaming",
  podcasts: "Podcasts",
  "faceless-doc": "Faceless Doc",
  "sports-irl": "Sports & IRL",
};

const SOURCE_COLORS: Record<Exclude<SignalSourceKind, "all">, string> = {
  "social-trend": "#E1392B",
  "keyword-gap": "#10B981",
  "competitor-audit": "#F59E0B",
  "community-sentiment": "#38BDF8",
};

const TREND_PRESETS = [
  "Daily Twitch Gaming",
  "AI & Creator Tools",
  "Finance & Side Hustles",
  "GTA & Open World",
];

function scoreTone(score: number): "emerald" | "amber" | "crimson" | "default" {
  if (score >= 82) return "emerald";
  if (score >= 68) return "amber";
  return "crimson";
}

export function ResearchCommandCenterView({
  clips,
  config,
  opportunityDiscovery,
  researchOpportunities,
  knowledgeAcquisition,
  deepResearch,
  viralSentiment,
  industryNews,
  trendPulse,
  competitiveAlerts,
  isDiscovering,
  isRunningDeepResearch,
  isCrawlingKnowledge,
  isFetchingTrends,
  isDirecting,
  isScanningSentiment,
  isApplyingSentiment,
  onSelectTab,
  onQuickGapScan,
  onQuickDeepResearch,
  onRunKnowledgeCrawl,
  onCreateClipFromOpportunity,
  onCreateClipFromDiscoveredTopic,
  onCreateClipFromFinding,
  onLaunchRapidMission,
  onFetchTrends,
  onToggleTrendPin,
  onTrackTrendGame,
  onExecuteDirector,
  onScanViralSentiment,
  onApplySentimentToDirector,
}: ResearchCommandCenterViewProps) {
  const [subPage, setSubPage] = useState<CommanderSubPage>("commander");
  const [viewMode, setViewMode] = useState<DeckViewMode>("cards");
  const [sourceFilter, setSourceFilter] = useState<SignalSourceKind>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Quick launcher states
  const [scanQuery, setScanQuery] = useState("");
  const [scanNiche, setScanNiche] = useState<ContentNiche | "all">("all");
  const [trendFocus, setTrendFocus] = useState(trendPulse?.focus || "Daily Twitch Gaming");
  const [sentimentNiche, setSentimentNiche] = useState<ContentNiche>("tech-ai");
  const [sentimentSourceFilter, setSentimentSourceFilter] = useState<string>("all");

  const gapTopics = opportunityDiscovery?.topics || [];
  const findings = deepResearch?.findings || [];
  const activeCompAlerts = competitiveAlerts.filter((a) => a.status === "active");
  const trendTopics = trendPulse?.topics || [];
  const newsItems = industryNews?.items || [];
  const trackedGameNames = useMemo(
    () => new Set(config.targetGames.map((g) => g.name.trim().toLowerCase())),
    [config.targetGames]
  );

  // Aggregate ALL intelligence feeds into one clean, typed multi-source card deck
  const unifiedSignals = useMemo<UnifiedIntelSignal[]>(() => {
    const list: UnifiedIntelSignal[] = [];

    trendTopics.forEach((t) => {
      const score =
        t.heatLevel === "breakout" ? 93 : t.heatLevel === "rising" ? 82 : 69;
      list.push({
        id: `trend-${t.id}`,
        sourceKind: "social-trend",
        sourceLabel: `TrendPulse · ${t.category}`,
        niche: t.gameOrTopic || t.category,
        title: t.gameOrTopic,
        hookAngle: t.clipAngle || t.suggestedDirectorCommand,
        whyItWins: t.summary,
        monetizationNote: t.pinnedPriority
          ? "Pinned to AI Director priority queue"
          : `${t.heatLevel.toUpperCase()} velocity window — capture Shorts search early`,
        score,
        demandScore: score,
        monetizationScore: Math.min(95, Math.round(score * 0.88)),
        estRpmUsd: 3.2,
        pinned: t.pinnedPriority,
        rawType: "trend",
        rawTrend: t,
      });
    });

    gapTopics.forEach((g) => {
      const velocityScore =
        g.demandVelocity === "exploding" ? 94 : g.demandVelocity === "rising" ? 83 : 71;
      const score = Math.min(99, Math.max(55, Math.round((g.noveltyPct + velocityScore) / 2)));
      list.push({
        id: `gap-${g.id}`,
        sourceKind: "keyword-gap",
        sourceLabel: g.competitorChannel ? `Rival Gap · ${g.competitorChannel}` : "Keyword Gap",
        niche: NICHE_LABELS[g.niche] || g.niche,
        title: g.topic,
        hookAngle: g.suggestedHook,
        whyItWins: g.whyUncovered,
        monetizationNote: `Est. $${g.estimatedRpmUsd.toFixed(2)} RPM · ${g.noveltyPct}% uncovered in your library`,
        score,
        demandScore: velocityScore,
        monetizationScore: Math.min(99, Math.round((g.estimatedRpmUsd / 6) * 100)),
        estRpmUsd: g.estimatedRpmUsd,
        rawType: "gap",
        rawGap: g,
      });
    });

    researchOpportunities.forEach((o) => {
      const multiplier = o.outlierMultiplier ?? 3.8;
      const score = Math.min(99, Math.max(55, Math.round(o.viralScore || multiplier * 18)));
      list.push({
        id: `opp-${o.id}`,
        sourceKind: "keyword-gap",
        sourceLabel: o.origin === "knowledge-acquisition" ? "Newsletter Intel" : "Outlier Opportunity",
        niche: NICHE_LABELS[o.niche] || o.niche,
        title: o.topic,
        hookAngle: o.hookBlueprint,
        whyItWins: o.whyNow,
        monetizationNote: `${multiplier.toFixed(1)}x outlier · ${o.competitionLevel} competition · $${o.estimatedRpmUsd.toFixed(2)} RPM`,
        score,
        demandScore: Math.min(99, Math.round(o.viralScore || 82)),
        monetizationScore: Math.min(99, Math.round((o.estimatedRpmUsd / 6) * 100)),
        estRpmUsd: o.estimatedRpmUsd,
        rawType: "opportunity",
        rawOpportunity: o,
      });
    });

    activeCompAlerts.forEach((a) => {
      const score = Math.min(99, Math.max(65, Math.round(74 + a.estimatedUpsideRpmUsd * 4)));
      list.push({
        id: `comp-${a.id}`,
        sourceKind: "competitor-audit",
        sourceLabel: `Rival Audit · ${a.competitorChannel}`,
        niche: NICHE_LABELS[a.niche] || a.niche,
        title: a.videoTitle,
        hookAngle: a.suggestedHook || a.rapidResponseAngle,
        whyItWins: a.monetizationGapReason,
        monetizationNote: `Under-monetized ${a.subNiche} slot · Est. $${a.estimatedUpsideRpmUsd.toFixed(2)} RPM upside`,
        score,
        demandScore: Math.min(99, Math.round(78 + a.estimatedUpsideRpmUsd * 3)),
        monetizationScore: Math.min(99, Math.round((a.estimatedUpsideRpmUsd / 6) * 100)),
        estRpmUsd: a.estimatedUpsideRpmUsd,
        rawType: "competitor",
        rawAlert: a,
      });
    });

    findings.forEach((f) => {
      const score = Math.min(99, Math.max(58, Math.round(f.confidenceScore || 82)));
      list.push({
        id: `find-${f.id}`,
        sourceKind: "community-sentiment",
        sourceLabel: f.sourceChannel,
        niche: deepResearch?.niche && deepResearch.niche !== "all" ? NICHE_LABELS[deepResearch.niche] : "Audience",
        title: f.painPoint,
        hookAngle: f.viralHookAngle,
        whyItWins: f.monetizationPath,
        monetizationNote: `Affiliate: ${f.recommendedAffiliate} · Lead Magnet: ${f.emailLeadMagnet}`,
        score,
        demandScore: score,
        monetizationScore: Math.min(99, Math.round((f.estRpmUsd / 6) * 100)),
        estRpmUsd: f.estRpmUsd,
        rawType: "finding",
        rawFinding: f,
      });
    });

    return list.sort((a, b) => b.score * b.estRpmUsd - a.score * a.estRpmUsd);
  }, [trendTopics, gapTopics, researchOpportunities, activeCompAlerts, findings, deepResearch?.niche]);

  const filteredSignals = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return unifiedSignals.filter((sig) => {
      if (sourceFilter !== "all" && sig.sourceKind !== sourceFilter) return false;
      if (!q) return true;
      return (
        sig.title.toLowerCase().includes(q) ||
        sig.hookAngle.toLowerCase().includes(q) ||
        sig.sourceLabel.toLowerCase().includes(q) ||
        sig.niche.toLowerCase().includes(q)
      );
    });
  }, [unifiedSignals, sourceFilter, searchFilter]);

  const inspectedSignal = useMemo(() => {
    if (!selectedSignalId) return filteredSignals[0] || null;
    return unifiedSignals.find((s) => s.id === selectedSignalId) || filteredSignals[0] || null;
  }, [selectedSignalId, unifiedSignals, filteredSignals]);

  const nicheChartData = useMemo(() => {
    const niches: ContentNiche[] = ["tech-ai", "finance", "faceless-doc", "podcasts", "gaming", "sports-irl"];
    return niches.map((niche) => {
      const opps = researchOpportunities.filter((o) => o.niche === niche);
      const gaps = gapTopics.filter((g) => g.niche === niche);
      const libClips = clips.filter((c) => c.niche === niche).length;
      const rpms = [...opps.map((o) => o.estimatedRpmUsd), ...gaps.map((g) => g.estimatedRpmUsd)];
      const avgRpm =
        rpms.length > 0
          ? Number((rpms.reduce((a, b) => a + b, 0) / rpms.length).toFixed(2))
          : niche === "finance"
            ? 4.4
            : niche === "tech-ai"
              ? 3.7
              : niche === "faceless-doc"
                ? 2.9
                : 2.1;
      return {
        name: NICHE_LABELS[niche],
        avgRpm,
        signals: opps.length + gaps.length + activeCompAlerts.filter((a) => a.niche === niche).length,
        libraryClips: libClips,
      };
    });
  }, [researchOpportunities, gapTopics, clips, activeCompAlerts]);

  const scatterData = useMemo(
    () =>
      filteredSignals.slice(0, 24).map((sig) => ({
        id: sig.id,
        title: sig.title,
        sourceLabel: sig.sourceLabel,
        sourceKind: sig.sourceKind,
        x: sig.score,
        y: Number(sig.estRpmUsd.toFixed(2)),
        z: Math.max(80, sig.monetizationScore * 3),
      })),
    [filteredSignals]
  );

  const trendChartData = useMemo(
    () =>
      trendTopics.slice(0, 8).map((t) => ({
        id: t.id,
        name: t.gameOrTopic.slice(0, 22),
        score: t.heatLevel === "breakout" ? 93 : t.heatLevel === "rising" ? 82 : 69,
        pinned: Boolean(t.pinnedPriority),
      })),
    [trendTopics]
  );

  const sentimentChartData = useMemo(() => {
    const styles = viralSentiment?.styleScores || [];
    if (styles.length > 0) {
      return styles.map((s) => ({
        name: s.styleName.slice(0, 20),
        positive: Math.round(s.sentimentScore),
        negative: Math.round(100 - s.sentimentScore),
      }));
    }
    return [
      { name: "Fast Jump-Cuts", positive: 84, negative: 16 },
      { name: "Kinetic Captions", positive: 79, negative: 21 },
      { name: "Split-Screen Proof", positive: 76, negative: 24 },
      { name: "Raw Unedited", positive: 48, negative: 52 },
    ];
  }, [viralSentiment?.styleScores]);

  const filteredFindings = useMemo(() => {
    if (sentimentSourceFilter === "all") return findings;
    return findings.filter((f) => f.sourceChannel === sentimentSourceFilter);
  }, [findings, sentimentSourceFilter]);

  const peakRpm = useMemo(() => {
    const values = unifiedSignals.map((s) => s.estRpmUsd);
    return values.length > 0 ? Math.max(...values) : 4.5;
  }, [unifiedSignals]);

  async function handleQueueToDirector(sig: UnifiedIntelSignal) {
    setBusyId(sig.id);
    try {
      if (sig.rawType === "competitor" && sig.rawAlert) {
        await onLaunchRapidMission(sig.rawAlert.id);
      } else {
        await onExecuteDirector(
          `Prioritize production queue for "${sig.title}" (${sig.sourceLabel}, Est. $${sig.estRpmUsd.toFixed(
            2
          )} RPM). Hook angle: ${sig.hookAngle}. Monetization: ${sig.monetizationNote}`
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleBuildClip(sig: UnifiedIntelSignal) {
    setBusyId(`clip-${sig.id}`);
    try {
      if (sig.rawType === "gap" && sig.rawGap) {
        await onCreateClipFromDiscoveredTopic(sig.rawGap);
      } else if (sig.rawType === "opportunity" && sig.rawOpportunity) {
        await onCreateClipFromOpportunity(sig.rawOpportunity);
      } else if (sig.rawType === "finding" && sig.rawFinding) {
        await onCreateClipFromFinding(sig.rawFinding);
      } else if (sig.rawType === "competitor" && sig.rawAlert) {
        await onLaunchRapidMission(sig.rawAlert.id);
      } else {
        await onExecuteDirector(
          `Draft a high-retention short for trend "${sig.title}" with hook: ${sig.hookAngle}`
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleQuickScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = scanQuery.trim();
    if (!q) return;
    await onQuickGapScan(scanNiche, q);
  }

  const positivePct = viralSentiment?.overallPositivePct ?? 74;

  return (
    <div className="flex-1 flex flex-col bg-[#F3F5F8] dark:bg-[#0E1117]">
      <StudioPageHeader
        section="Research & Intel"
        title="Research Commander"
        subtitle="Unified multi-source intelligence aggregating TrendPulse, keyword gaps, competitor audits, and community sentiment for the AI Director."
        metaItems={[
          { label: `${unifiedSignals.length} Active Signals`, emphasis: "crimson" },
          { label: `${trendTopics.length} Live Trends` },
          { label: `${gapTopics.length + researchOpportunities.length} Keyword & Gap Briefs` },
          { label: `Peak $${peakRpm.toFixed(2)} RPM`, emphasis: "emerald" },
        ]}
        actions={
          <>
            <button
              type="button"
              disabled={isCrawlingKnowledge}
              onClick={onRunKnowledgeCrawl}
              className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#252C3B] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-xs font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {isCrawlingKnowledge ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
              ) : (
                <Newspaper className="w-3.5 h-3.5 text-[#E1392B]" />
              )}
              <span>Crawl Feeds</span>
            </button>
            <button
              type="button"
              disabled={isFetchingTrends}
              onClick={() => {
                setSubPage("trendpulse");
                onFetchTrends(trendFocus);
              }}
              className="h-7 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {isFetchingTrends ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>Refresh Live Intel</span>
            </button>
          </>
        }
      />

      {/* Recessed High-Contrast Telemetry Band with Sparklines & Radial Gauge */}
      <StudioKpiStrip
        items={[
          {
            id: "signals",
            label: "Aggregated Intelligence Signals",
            value: String(unifiedSignals.length),
            subtext: `${trendTopics.length} trends · ${gapTopics.length + researchOpportunities.length} gaps · ${activeCompAlerts.length} rival audits`,
            tone: "crimson",
            sparkline: [12, 16, 14, 21, 19, 25, Math.max(18, unifiedSignals.length)],
            onClick: () => setSubPage("commander"),
          },
          {
            id: "rpm",
            label: "Peak Niche Arbitrage RPM",
            value: `$${peakRpm.toFixed(2)}`,
            subtext: `${nicheChartData[0]?.name || "AI & Tech"} leads monetization upside`,
            tone: "emerald",
            sparkline: nicheChartData.map((d) => d.avgRpm),
            onClick: () => {
              setSubPage("commander");
              setViewMode("matrix");
            },
          },
          {
            id: "sentiment",
            label: "Community Sentiment Index",
            value: `${positivePct}%`,
            subtext: `${findings.length} buyer-intent comments · ${newsItems.length} news alerts`,
            tone: positivePct >= 70 ? "emerald" : "amber",
            progressPct: positivePct,
            onClick: () => setSubPage("sentiment"),
          },
          {
            id: "director-feed",
            label: "AI Director Priority Feed",
            value: `${trendTopics.filter((t) => t.pinnedPriority).length} Pinned`,
            subtext: `${knowledgeAcquisition?.totalDrafted || 0} auto-drafted · ${clips.length} clips in library`,
            tone: activeCompAlerts.length > 0 ? "amber" : "default",
            sparkline: [3, 5, 4, 7, 6, 9, Math.max(4, clips.length)],
            onClick: () => setSubPage("trendpulse"),
          },
        ]}
      />

      {/* Sub-Page Ribbon: Commander Deck | TrendPulse | Community Sentiment Analysis */}
      <StudioSubNavBar<CommanderSubPage>
        value={subPage}
        onChange={setSubPage}
        tabs={[
          {
            id: "commander",
            label: "Commander Deck",
            icon: <Radar className="w-3.5 h-3.5 text-[#E1392B]" />,
            count: unifiedSignals.length,
          },
          {
            id: "trendpulse",
            label: "TrendPulse",
            icon: <Radio className="w-3.5 h-3.5 text-[#E1392B]" />,
            count: trendTopics.length,
            accent: trendTopics.some((t) => t.pinnedPriority),
          },
          {
            id: "sentiment",
            label: "Community Sentiment Analysis",
            icon: <MessageSquareText className="w-3.5 h-3.5 text-sky-500" />,
            count: findings.length,
          },
        ]}
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab("opportunity-radar")}
              className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-[11px] font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Full Gap Radar</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("autopilot")}
              className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] hover:border-[#E1392B] text-[11px] font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Bot className="w-3 h-3 text-[#E1392B]" />
              <span>AI Director</span>
            </button>
          </div>
        }
      />

      {/* ===================================================================== */}
      {/* SUB-PAGE 1: COMMANDER DECK (UNIFIED MULTI-SOURCE CARD WORKBENCH)      */}
      {/* ===================================================================== */}
      {subPage === "commander" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Control Bar: Quick Live Scan + Source Filters + View Mode Switcher */}
          <div className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Instant Multi-Source Search / Gap Trigger */}
            <form onSubmit={handleQuickScanSubmit} className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <select
                value={scanNiche}
                onChange={(e) => setScanNiche(e.target.value as ContentNiche | "all")}
                aria-label="Target niche"
                className="h-8 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs font-medium text-[#0B1120] dark:text-[#F8FAFC]"
              >
                <option value="all">All Niches</option>
                <option value="tech-ai">AI &amp; Tech</option>
                <option value="finance">Finance</option>
                <option value="gaming">Gaming</option>
                <option value="podcasts">Podcasts</option>
                <option value="faceless-doc">Faceless Doc</option>
                <option value="sports-irl">Sports &amp; IRL</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={scanQuery}
                  onChange={(e) => setScanQuery(e.target.value)}
                  placeholder="Topic or keyword to audit via Google Search..."
                  className="w-full h-8 pl-8 pr-3 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs text-[#0B1120] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
                />
              </div>

              <button
                type="submit"
                disabled={isDiscovering || !scanQuery.trim()}
                className="h-8 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isDiscovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />}
                <span>Run Gap Audit</span>
              </button>
            </form>

            {/* Right: Filter + 3-View Switcher (Cards | Board | Matrix) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter deck..."
                aria-label="Filter intelligence deck"
                className="h-8 w-36 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs text-[#0B1120] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
              />

              <StudioViewSwitcher<DeckViewMode>
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { id: "cards", label: "Cards", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  { id: "board", label: "Board", icon: <Kanban className="w-3.5 h-3.5" /> },
                  { id: "matrix", label: "Matrix", icon: <ScatterIcon className="w-3.5 h-3.5" /> },
                ]}
              />
            </div>
          </div>

          {/* Source Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: "All Intelligence", count: unifiedSignals.length },
                  {
                    id: "social-trend",
                    label: "Social Trends",
                    count: unifiedSignals.filter((s) => s.sourceKind === "social-trend").length,
                  },
                  {
                    id: "keyword-gap",
                    label: "Keyword & Gap Audits",
                    count: unifiedSignals.filter((s) => s.sourceKind === "keyword-gap").length,
                  },
                  {
                    id: "competitor-audit",
                    label: "Competitor Audits",
                    count: unifiedSignals.filter((s) => s.sourceKind === "competitor-audit").length,
                  },
                  {
                    id: "community-sentiment",
                    label: "Community Sentiment",
                    count: unifiedSignals.filter((s) => s.sourceKind === "community-sentiment").length,
                  },
                ] as Array<{ id: SignalSourceKind; label: string; count: number }>
              ).map((f) => {
                const active = sourceFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSourceFilter(f.id)}
                    className={`h-7 px-2.5 rounded-xs border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      active
                        ? "border-[#E1392B] bg-[#E1392B] text-white"
                        : "border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`font-mono text-[10px] tabular-nums ${active ? "text-white/85" : "text-slate-400"}`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="font-mono text-[11px] tabular-nums text-slate-500">
              Showing {filteredSignals.length} visual intelligence cards
            </span>
          </div>

          {/* VIEW 1: VISUAL CARDS + DESKTOP INSPECTOR SPLIT */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Left 8 Cols: Crisp Visual Intelligence Cards */}
              <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSignals.length === 0 ? (
                  <div className="md:col-span-2 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-10 text-center space-y-2">
                    <div className="text-sm font-display font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                      No intelligence signals match this filter
                    </div>
                    <p className="text-xs text-slate-500">
                      Clear the filter or run a live Google Search Gap Audit above.
                    </p>
                  </div>
                ) : (
                  filteredSignals.slice(0, 12).map((sig) => {
                    const isSelected = inspectedSignal?.id === sig.id;
                    const tone = scoreTone(sig.score);
                    return (
                      <article
                        key={sig.id}
                        className={`rounded-xs border transition-colors flex flex-col justify-between overflow-hidden ${
                          isSelected
                            ? "border-[#E1392B] bg-white dark:bg-[#181D28]"
                            : "border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] hover:border-slate-400 dark:hover:border-[#374156]"
                        }`}
                      >
                        {/* Recessed Instrument Header Bar */}
                        <div className="px-3.5 py-2.5 bg-[#EEF1F6] dark:bg-[#0D1017] border-b border-[#DCE2EC] dark:border-[#1E2534] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span
                                className="w-2 h-2 rounded-[1px] shrink-0"
                                style={{ backgroundColor: SOURCE_COLORS[sig.sourceKind] }}
                                aria-hidden="true"
                              />
                              <span className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] truncate">
                                {sig.sourceLabel}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              {sig.niche} · Est. ${sig.estRpmUsd.toFixed(2)} RPM
                            </div>
                          </div>

                          <StudioRadialGauge
                            value={sig.score}
                            size={38}
                            strokeWidth={3.5}
                            tone={tone}
                          />
                        </div>

                        {/* Visual Card Body (Zero text wall: Title + 2 Meters + 1-Line Hook) */}
                        <div
                          onClick={() => setSelectedSignalId(sig.id)}
                          className="p-3.5 space-y-3 cursor-pointer flex-1"
                        >
                          <h3 className="font-display text-sm font-bold leading-snug text-[#0B1120] dark:text-[#F8FAFC] line-clamp-2">
                            {sig.title}
                          </h3>

                          <div className="grid grid-cols-2 gap-3">
                            <StudioMeterBar
                              label="Demand"
                              value={sig.demandScore}
                              tone={sig.demandScore >= 80 ? "crimson" : "sky"}
                            />
                            <StudioMeterBar
                              label="RPM Value"
                              value={sig.monetizationScore}
                              displayValue={`$${sig.estRpmUsd.toFixed(2)}`}
                              tone="emerald"
                            />
                          </div>

                          <div className="px-2.5 py-2 rounded-xs bg-[#F3F5F8] dark:bg-[#0D1017] border border-[#E2E7F0] dark:border-[#1E2534]">
                            <div className="text-[10px] font-mono text-slate-500">Recommended Hook</div>
                            <div className="text-xs font-medium text-[#0B1120] dark:text-slate-200 line-clamp-1 mt-0.5">
                              {sig.hookAngle}
                            </div>
                          </div>
                        </div>

                        {/* Crisp Action Footer */}
                        <div className="px-3.5 py-2.5 border-t border-[#E2E7F0] dark:border-[#1E2534] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSignalId(sig.id)}
                            className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-[#E1392B] whitespace-nowrap"
                          >
                            {isSelected ? "Inspecting" : "Inspect"}
                          </button>

                          <button
                            type="button"
                            disabled={busyId === sig.id || isDirecting}
                            onClick={() => handleQueueToDirector(sig)}
                            className="h-7 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] hover:bg-[#E1392B] dark:hover:bg-[#E1392B] text-white dark:text-[#0B1120] dark:hover:text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {busyId === sig.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Bot className="w-3 h-3" />
                            )}
                            <span>Queue to AI Director</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* Right 4 Cols: Desktop Telemetry & Signal Inspector */}
              <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-4">
                {inspectedSignal ? (
                  <section className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] overflow-hidden">
                    {/* Recessed Inspector Header */}
                    <div className="px-4 py-3 bg-[#EEF1F6] dark:bg-[#0B0E14] border-b border-[#CDD5E0] dark:border-[#222938] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-semibold text-[#E1392B]">
                          Signal Inspector · {inspectedSignal.sourceLabel}
                        </div>
                        <div className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC] truncate mt-0.5">
                          {inspectedSignal.niche}
                        </div>
                      </div>
                      <StudioRadialGauge
                        value={inspectedSignal.score}
                        size={48}
                        strokeWidth={4.5}
                        tone={scoreTone(inspectedSignal.score)}
                      />
                    </div>

                    <div className="p-4 space-y-4">
                      <h4 className="font-display text-base font-bold leading-snug text-[#0B1120] dark:text-[#F8FAFC]">
                        {inspectedSignal.title}
                      </h4>

                      {/* Visual Metric Cells */}
                      <div className="grid grid-cols-3 border border-[#DCE2EC] dark:border-[#232A3A] divide-x divide-[#DCE2EC] dark:divide-[#232A3A] bg-[#F8FAFC] dark:bg-[#0D1017] rounded-xs">
                        <div className="p-2.5">
                          <div className="text-[10px] text-slate-500">Est. RPM</div>
                          <div className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ${inspectedSignal.estRpmUsd.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-[10px] text-slate-500">Demand</div>
                          <div className="font-mono text-sm font-bold tabular-nums text-[#0B1120] dark:text-[#F8FAFC] mt-0.5">
                            {inspectedSignal.demandScore}/100
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-[10px] text-slate-500">ROI Fit</div>
                          <div className="font-mono text-sm font-bold tabular-nums text-[#E1392B] mt-0.5">
                            {inspectedSignal.monetizationScore}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xs bg-[#F3F5F8] dark:bg-[#0D1017] border border-[#DCE2EC] dark:border-[#1E2534] space-y-1">
                          <div className="text-[10px] font-mono text-slate-500">0–3s Hook Blueprint</div>
                          <div className="font-semibold text-[#0B1120] dark:text-[#F8FAFC] leading-relaxed">
                            {inspectedSignal.hookAngle}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-slate-500">Why It Wins Now</div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {inspectedSignal.whyItWins}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-slate-500">Monetization Pathway</div>
                          <p className="text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                            {inspectedSignal.monetizationNote}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE2EC] dark:border-[#232A3A]">
                        <button
                          type="button"
                          disabled={busyId === inspectedSignal.id || isDirecting}
                          onClick={() => handleQueueToDirector(inspectedSignal)}
                          className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {busyId === inspectedSignal.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Bot className="w-3.5 h-3.5" />
                          )}
                          <span>Queue Director</span>
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `clip-${inspectedSignal.id}`}
                          onClick={() => handleBuildClip(inspectedSignal)}
                          className="h-8 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {busyId === `clip-${inspectedSignal.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Rocket className="w-3.5 h-3.5 text-[#E1392B]" />
                          )}
                          <span>Draft in Studio</span>
                        </button>
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* Mini Niche RPM Visual Chart inside Telemetry Rail */}
                <section className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
                  <StudioSectionHeader
                    zone="telemetry"
                    title="Niche RPM vs. Signal Volume"
                    detail="Click Matrix view for full scatter"
                  />
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nicheChartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.28} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748B" }}
                          tickFormatter={(v) => `$${v}`}
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
                        <Bar dataKey="avgRpm" name="Est. RPM ($)" radius={[2, 2, 0, 0]}>
                          {nicheChartData.map((entry, idx) => (
                            <Cell
                              key={entry.name}
                              fill={idx === 0 ? "#E1392B" : idx === 1 ? "#10B981" : "#475569"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </aside>
            </div>
          )}

          {/* VIEW 2: 4-LANE VISUAL KANBAN BOARD BY SOURCE */}
          {viewMode === "board" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
              {(
                [
                  { id: "social-trend", title: "Social Trends", accent: "#E1392B" },
                  { id: "keyword-gap", title: "Keyword & Gap Audits", accent: "#10B981" },
                  { id: "competitor-audit", title: "Competitor Audits", accent: "#F59E0B" },
                  { id: "community-sentiment", title: "Community Sentiment", accent: "#38BDF8" },
                ] as Array<{ id: Exclude<SignalSourceKind, "all">; title: string; accent: string }>
              ).map((lane) => {
                const laneItems = filteredSignals.filter((s) => s.sourceKind === lane.id);
                return (
                  <div
                    key={lane.id}
                    className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#E8ECF3] dark:bg-[#0B0E14] flex flex-col"
                  >
                    <div className="px-3 py-2.5 border-b border-[#CDD5E0] dark:border-[#222938] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-display font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                        <span
                          className="w-2.5 h-2.5 rounded-[1px]"
                          style={{ backgroundColor: lane.accent }}
                          aria-hidden="true"
                        />
                        <span>{lane.title}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold tabular-nums text-slate-500">
                        {laneItems.length}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-2.5">
                      {laneItems.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-slate-500">
                          No signals in this lane yet.
                        </div>
                      ) : (
                        laneItems.slice(0, 6).map((sig) => (
                          <div
                            key={sig.id}
                            className="rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] p-3 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-slate-500 truncate">
                                {sig.niche}
                              </span>
                              <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                ${sig.estRpmUsd.toFixed(2)}
                              </span>
                            </div>

                            <div className="font-display text-xs font-bold leading-snug text-[#0B1120] dark:text-[#F8FAFC] line-clamp-2">
                              {sig.title}
                            </div>

                            <StudioMeterBar
                              label="Signal Score"
                              value={sig.score}
                              tone={scoreTone(sig.score)}
                            />

                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSignalId(sig.id);
                                  setViewMode("cards");
                                }}
                                className="h-6 px-2 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                              >
                                Inspect
                              </button>
                              <button
                                type="button"
                                disabled={busyId === sig.id}
                                onClick={() => handleQueueToDirector(sig)}
                                className="h-6 px-2 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[10px] font-semibold inline-flex items-center gap-1"
                              >
                                {busyId === sig.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Bot className="w-2.5 h-2.5 text-[#E1392B]" />
                                )}
                                <span>Queue</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: INTERACTIVE OPPORTUNITY MATRIX & ARBITRAGE CHARTS */}
          {viewMode === "matrix" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <section className="xl:col-span-7 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] p-5 space-y-4">
                <StudioSectionHeader
                  zone="telemetry"
                  title="Multi-Source Opportunity Arbitrage Matrix"
                  detail="Top-right quadrant = highest signal score + highest RPM"
                />
                <div className="h-80 w-full bg-[#F8FAFC] dark:bg-[#0B0E14] border border-[#DCE2EC] dark:border-[#1E2534] p-3 rounded-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 12, right: 16, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.28} />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Signal Score"
                        domain={[50, 100]}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        label={{ value: "Signal Velocity / Score", position: "insideBottom", offset: -4, fontSize: 11, fill: "#64748B" }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Est. RPM"
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <ZAxis type="number" dataKey="z" range={[70, 260]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          backgroundColor: "#12161F",
                          borderColor: "#252C3B",
                          borderRadius: "2px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                        formatter={(val, name) =>
                          String(name) === "Est. RPM"
                            ? [`$${String(val ?? "")}`, String(name ?? "")]
                            : [String(val ?? ""), String(name ?? "")]
                        }
                      />
                      <Scatter
                        name="Intelligence Signals"
                        data={scatterData}
                        onClick={(pt) => {
                          const clickedId = (pt as unknown as { payload?: { id?: string }; id?: string })?.payload?.id
                            || (pt as unknown as { id?: string })?.id;
                          if (clickedId) {
                            setSelectedSignalId(clickedId);
                            setViewMode("cards");
                          }
                        }}
                      >
                        {scatterData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={SOURCE_COLORS[entry.sourceKind]}
                            fillOpacity={0.85}
                            className="cursor-pointer"
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#E1392B]" /> TrendPulse
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#10B981]" /> Keyword Gaps
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#F59E0B]" /> Competitor Audits
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#38BDF8]" /> Community Sentiment
                  </span>
                </div>
              </section>

              <section className="xl:col-span-5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] p-5 space-y-4">
                <StudioSectionHeader
                  zone="telemetry"
                  title="Niche RPM vs. Library Coverage Gap"
                  detail="Bars = Avg RPM ($) · Line = Your Library Clips"
                />
                <div className="h-80 w-full bg-[#F8FAFC] dark:bg-[#0B0E14] border border-[#DCE2EC] dark:border-[#1E2534] p-3 rounded-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={nicheChartData} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.28} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `$${v}`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12161F",
                          borderColor: "#252C3B",
                          borderRadius: "2px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                      />
                      <Bar yAxisId="left" dataKey="avgRpm" name="Est. RPM ($)" fill="#10B981" radius={[2, 2, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="libraryClips"
                        name="Clips in Library"
                        stroke="#E1392B"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#E1392B" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-PAGE 2: TRENDPULSE DEDICATED SUB-PAGE                             */}
      {/* ===================================================================== */}
      {subPage === "trendpulse" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* TrendPulse Search & Preset Bar */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {TREND_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isFetchingTrends}
                  onClick={() => {
                    setTrendFocus(preset);
                    onFetchTrends(preset);
                  }}
                  className={`h-7 px-2.5 rounded-xs border text-xs font-semibold transition-colors whitespace-nowrap ${
                    trendFocus.toLowerCase() === preset.toLowerCase()
                      ? "border-[#E1392B] bg-[#E1392B]/10 text-[#E1392B]"
                      : "border-[#CDD5E0] dark:border-[#262E3F] text-slate-600 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onFetchTrends(trendFocus.trim() || "Daily Twitch Gaming");
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={trendFocus}
                onChange={(e) => setTrendFocus(e.target.value)}
                placeholder="Search any live trend focus..."
                className="h-8 w-56 px-3 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs text-[#0B1120] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
              />
              <button
                type="submit"
                disabled={isFetchingTrends}
                className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {isFetchingTrends ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Fetch Live Trends</span>
              </button>
            </form>
          </section>

          {/* Visual Velocity Bar Chart + Trend Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <section className="xl:col-span-5 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
              <StudioSectionHeader
                zone="telemetry"
                title="Live Trend Velocity Index"
                detail="Crimson = pinned to AI Director"
              />
              {trendChartData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Run Fetch Live Trends to plot velocity scores.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.25} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748B" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12161F",
                          borderColor: "#252C3B",
                          borderRadius: "2px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                      />
                      <Bar dataKey="score" name="Viral Velocity" radius={[0, 2, 2, 0]}>
                        {trendChartData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.pinned ? "#E1392B" : "#38BDF8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
              {trendTopics.length === 0 ? (
                <div className="md:col-span-2 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-10 text-center space-y-2">
                  <Flame className="w-6 h-6 text-[#E1392B] mx-auto" />
                  <div className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                    No TrendPulse snapshot loaded
                  </div>
                  <button
                    type="button"
                    onClick={() => onFetchTrends(trendFocus)}
                    className="h-8 px-4 rounded-xs bg-[#E1392B] text-white text-xs font-semibold"
                  >
                    Scan Live Trends Now
                  </button>
                </div>
              ) : (
                trendTopics.map((topic) => {
                  const isTracked = trackedGameNames.has(topic.gameOrTopic.trim().toLowerCase());
                  const score =
                    topic.heatLevel === "breakout" ? 93 : topic.heatLevel === "rising" ? 82 : 69;
                  return (
                    <article
                      key={topic.id}
                      className={`rounded-xs border bg-white dark:bg-[#151922] flex flex-col justify-between overflow-hidden ${
                        topic.pinnedPriority
                          ? "border-[#E1392B]"
                          : "border-[#CDD5E0] dark:border-[#232A3A]"
                      }`}
                    >
                      <div className="px-3.5 py-2.5 bg-[#EEF1F6] dark:bg-[#0D1017] border-b border-[#DCE2EC] dark:border-[#1E2534] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono font-semibold text-[#E1392B] truncate">
                            {topic.category}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {topic.pinnedPriority ? "Pinned to AI Director" : `${topic.heatLevel} momentum`}
                          </div>
                        </div>
                        <StudioRadialGauge value={score} size={38} strokeWidth={3.5} tone={scoreTone(score)} />
                      </div>

                      <div className="p-3.5 space-y-2.5 flex-1">
                        <h4 className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC] leading-snug line-clamp-2">
                          {topic.gameOrTopic}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {topic.summary}
                        </p>
                        <div className="px-2.5 py-1.5 rounded-xs bg-[#F3F5F8] dark:bg-[#0D1017] border border-[#E2E7F0] dark:border-[#1E2534] text-[11px] text-[#0B1120] dark:text-slate-200 line-clamp-1">
                          Angle: {topic.clipAngle}
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 border-t border-[#E2E7F0] dark:border-[#1E2534] flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleTrendPin(topic.id)}
                            className={`h-7 px-2 rounded-xs border text-[11px] font-semibold inline-flex items-center gap-1 ${
                              topic.pinnedPriority
                                ? "border-[#E1392B] bg-[#E1392B] text-white"
                                : "border-[#CDD5E0] dark:border-[#262E3F] text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                            <span>{topic.pinnedPriority ? "Pinned" : "Pin"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isTracked}
                            onClick={() => onTrackTrendGame(topic.gameOrTopic)}
                            className="h-7 px-2 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] text-[11px] font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            {isTracked ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3" />}
                            <span>{isTracked ? "Tracked" : "Track"}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isDirecting}
                          onClick={() =>
                            onExecuteDirector(
                              topic.suggestedDirectorCommand ||
                                `Build clip queue priority around trending topic "${topic.gameOrTopic}". Angle: ${topic.clipAngle}`
                            )
                          }
                          className="h-7 px-2.5 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Bot className="w-3 h-3 text-[#E1392B]" />
                          <span>Send to Director</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-PAGE 3: COMMUNITY SENTIMENT ANALYSIS SUB-PAGE                     */}
      {/* ===================================================================== */}
      {subPage === "sentiment" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Sentiment Scan Control Strip */}
          <section className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sentimentNiche}
                onChange={(e) => setSentimentNiche(e.target.value as ContentNiche)}
                aria-label="Sentiment niche"
                className="h-8 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] bg-[#F3F5F8] dark:bg-[#0D1017] text-xs font-medium text-[#0B1120] dark:text-[#F8FAFC]"
              >
                <option value="tech-ai">AI &amp; Tech</option>
                <option value="finance">Finance</option>
                <option value="gaming">Gaming</option>
                <option value="podcasts">Podcasts</option>
                <option value="faceless-doc">Faceless Doc</option>
                <option value="sports-irl">Sports &amp; IRL</option>
              </select>

              <button
                type="button"
                disabled={isScanningSentiment}
                onClick={() => onScanViralSentiment(sentimentNiche)}
                className="h-8 px-3 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isScanningSentiment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />}
                <span>Scan Comment Sentiment</span>
              </button>

              <button
                type="button"
                disabled={isRunningDeepResearch}
                onClick={() =>
                  onQuickDeepResearch(
                    `High buyer-intent comments, frustrations, and monetization hooks in ${NICHE_LABELS[sentimentNiche]}`,
                    sentimentNiche
                  )
                }
                className="h-8 px-3 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] hover:border-[#E1392B] text-xs font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRunningDeepResearch ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" /> : <Search className="w-3.5 h-3.5 text-[#E1392B]" />}
                <span>Mine Buyer Comments</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isApplyingSentiment}
              onClick={onApplySentimentToDirector}
              className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              {isApplyingSentiment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              <span>Apply Winning Styles to AI Director</span>
            </button>
          </section>

          {/* 2-Column Visual Sentiment Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <section className="xl:col-span-7 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-[#EEF1F6] dark:bg-[#0B0E14] p-4 space-y-3">
              <StudioSectionHeader
                zone="telemetry"
                title="Editing-Style Audience Sentiment Breakdown"
                detail="Positive praise % vs. viewer drop-off friction %"
              />
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252C3B" strokeOpacity={0.25} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#12161F",
                        borderColor: "#252C3B",
                        borderRadius: "2px",
                        fontSize: "12px",
                        color: "#F8FAFC",
                      }}
                    />
                    <Bar dataKey="positive" name="Positive Sentiment %" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="negative" name="Negative Friction %" fill="#E1392B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="xl:col-span-5 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] p-4 space-y-4">
              <StudioSectionHeader
                zone="action"
                title="AI Director Style Directives"
                detail={viralSentiment?.styleScores?.[0]?.styleName || "High-retention visual pacing"}
              />
              <div className="flex items-center gap-4 p-3 rounded-xs bg-[#F3F5F8] dark:bg-[#0D1017] border border-[#DCE2EC] dark:border-[#1E2534]">
                <StudioRadialGauge value={positivePct} size={56} strokeWidth={5} tone="emerald" suffix="%" />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Audience Approval Score
                  </div>
                  <div className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC]">
                    {viralSentiment?.styleScores?.[0]?.styleName || "Tight 2.5s Visual Cuts + Proof Overlays"}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {viralSentiment?.directorDirective || "Prioritize punchy captions & eliminate intro filler."}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {["YouTube Comments", "Reddit Threads", "X / Twitter", "TikTok Comments"].map((ch) => {
                  const count = findings.filter((f) => f.sourceChannel === ch).length;
                  const pct = findings.length > 0 ? Math.round((count / findings.length) * 100) : 25;
                  return (
                    <StudioMeterBar
                      key={ch}
                      label={ch}
                      value={pct}
                      displayValue={`${count} signals`}
                      tone={ch === "YouTube Comments" ? "crimson" : ch === "Reddit Threads" ? "amber" : "sky"}
                    />
                  );
                })}
              </div>
            </section>
          </div>

          {/* Buyer-Intent Comment Pain-Point Cards */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {["all", "YouTube Comments", "Reddit Threads", "X / Twitter", "TikTok Comments", "Creator Newsletters"].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setSentimentSourceFilter(ch)}
                    className={`h-7 px-2.5 rounded-xs border text-xs font-semibold transition-colors whitespace-nowrap ${
                      sentimentSourceFilter === ch
                        ? "border-[#E1392B] bg-[#E1392B] text-white"
                        : "border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#151922] text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {ch === "all" ? `All Sources (${findings.length})` : ch}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("audience-social-intel")}
                className="text-xs font-semibold text-[#E1392B] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full Sentiment &amp; News Lab</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredFindings.map((finding) => (
                <article
                  key={finding.id}
                  className="rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#151922] flex flex-col justify-between overflow-hidden"
                >
                  <div className="px-3.5 py-2.5 bg-[#EEF1F6] dark:bg-[#0D1017] border-b border-[#DCE2EC] dark:border-[#1E2534] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 truncate">
                        {finding.sourceChannel}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Est. ${finding.estRpmUsd.toFixed(2)} RPM
                      </div>
                    </div>
                    <StudioRadialGauge
                      value={finding.confidenceScore}
                      size={38}
                      strokeWidth={3.5}
                      tone={scoreTone(finding.confidenceScore)}
                    />
                  </div>

                  <div className="p-3.5 space-y-2.5 flex-1">
                    <h4 className="font-display text-sm font-bold text-[#0B1120] dark:text-[#F8FAFC] leading-snug line-clamp-2">
                      {finding.painPoint}
                    </h4>

                    <div className="px-2.5 py-2 rounded-xs bg-[#F3F5F8] dark:bg-[#0D1017] border border-[#E2E7F0] dark:border-[#1E2534] space-y-1 text-xs">
                      <div className="text-[10px] font-mono text-slate-500">Viral Hook Angle</div>
                      <div className="font-semibold text-[#0B1120] dark:text-slate-100 line-clamp-2">
                        {finding.viralHookAngle}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-xs bg-[#F8FAFC] dark:bg-[#0D1017] border border-[#E2E7F0] dark:border-[#1E2534]">
                        <div className="text-[10px] text-slate-500">Affiliate Offer</div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                          {finding.recommendedAffiliate}
                        </div>
                      </div>
                      <div className="p-2 rounded-xs bg-[#F8FAFC] dark:bg-[#0D1017] border border-[#E2E7F0] dark:border-[#1E2534]">
                        <div className="text-[10px] text-slate-500">Email Magnet</div>
                        <div className="font-semibold text-[#0B1120] dark:text-slate-200 truncate mt-0.5">
                          {finding.emailLeadMagnet}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 border-t border-[#E2E7F0] dark:border-[#1E2534] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateClipFromFinding(finding)}
                      className="h-7 px-2.5 rounded-xs bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120] text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Rocket className="w-3 h-3 text-[#E1392B]" />
                      <span>Draft Clip</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDirecting}
                      onClick={() =>
                        onExecuteDirector(
                          `Create production mission addressing ${finding.sourceChannel} pain point: "${finding.painPoint}". Hook: "${finding.viralHookAngle}". Affiliate: ${finding.recommendedAffiliate}.`
                        )
                      }
                      className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#262E3F] hover:border-[#E1392B] text-[11px] font-semibold text-[#0B1120] dark:text-[#F8FAFC] inline-flex items-center gap-1"
                    >
                      <Bot className="w-3 h-3 text-[#E1392B]" />
                      <span>Queue Director</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
