import { useMemo, useState } from "react";
import {
  Search,
  Globe,
  Loader2,
  Clapperboard,
  BookmarkPlus,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpRight,
  Crosshair,
  Plus,
  X,
} from "lucide-react";
import type {
  ClipItem,
  ContentNiche,
  OpportunityDiscoverySnapshot,
  OpportunityGapFreshness,
  OpportunityGapTopic,
} from "../types";
import { computeTitleSimilarity } from "../utils/ffmpeg";

interface OpportunityDiscoveryPanelProps {
  clips: ClipItem[];
  discovery?: OpportunityDiscoverySnapshot;
  isDiscovering: boolean;
  onRunDiscovery: (payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    customQuery?: string;
  }) => Promise<void>;
  onRunCompetitorGapScan?: (payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    competitorChannels: string[];
    customQuery?: string;
  }) => Promise<void>;
  onCreateClipFromTopic: (topic: OpportunityGapTopic) => Promise<void>;
  onSaveTopicToResearch: (topicId: string) => Promise<void>;
  onOpenClipInStudio: (clipId: string) => void;
}

const NICHE_OPTIONS: Array<{ id: ContentNiche | "all"; label: string }> = [
  { id: "all", label: "All Niches" },
  { id: "tech-ai", label: "AI & Tech" },
  { id: "finance", label: "Finance" },
  { id: "gaming", label: "Gaming" },
  { id: "podcasts", label: "Podcasts" },
  { id: "faceless-doc", label: "Faceless Doc" },
  { id: "sports-irl", label: "Sports & IRL" },
];

const NICHE_LABELS: Record<ContentNiche, string> = {
  "tech-ai": "AI & Tech",
  finance: "Finance",
  gaming: "Gaming",
  podcasts: "Podcasts",
  "faceless-doc": "Faceless Doc",
  "sports-irl": "Sports & IRL",
};

const FORMAT_LABELS: Record<OpportunityGapTopic["recommendedFormat"], string> = {
  "authority-breakdown": "Authority Breakdown",
  "faceless-narration": "Faceless Narration",
  "podcast-split": "Podcast Split",
  "split-screen": "Split-Screen",
};

const VELOCITY_LABELS: Record<OpportunityGapTopic["demandVelocity"], string> = {
  exploding: "Exploding Demand",
  rising: "Rising Velocity",
  steady: "Steady Evergreen",
};

export function OpportunityDiscoveryPanel({
  clips,
  discovery,
  isDiscovering,
  onRunDiscovery,
  onRunCompetitorGapScan,
  onCreateClipFromTopic,
  onSaveTopicToResearch,
  onOpenClipInStudio,
}: OpportunityDiscoveryPanelProps) {
  const [selectedNiche, setSelectedNiche] = useState<ContentNiche | "all">(
    discovery?.focusNiche || "all"
  );
  const [freshness, setFreshness] = useState<OpportunityGapFreshness>(
    discovery?.freshness || "7d"
  );
  const [gapFilter, setGapFilter] = useState<"all" | "library-gap" | "competitor-gap">("all");
  const [customQuery, setCustomQuery] = useState(discovery?.customQuery || "");
  const [competitorChannels, setCompetitorChannels] = useState<string[]>(
    discovery?.competitorChannelsAudited && discovery.competitorChannelsAudited.length > 0
      ? discovery.competitorChannelsAudited
      : ["@Fireship", "@MKBHD", "@TheAIAdvantage", "@GrahamStephan", "@AliAbdaal"]
  );
  const [newChannelInput, setNewChannelInput] = useState("");
  const [velocityFilter, setVelocityFilter] = useState<"all" | "exploding" | "rising">("all");
  const [hideCovered, setHideCovered] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const libraryAudit = useMemo(() => {
    const scopedClips =
      selectedNiche === "all"
        ? clips
        : clips.filter((c) => c.niche === selectedNiche);

    const coveredKeywords = Array.from(
      new Set(
        scopedClips
          .map((c) => c.gameCategory || (c.niche ? NICHE_LABELS[c.niche] : undefined) || "General")
          .filter(Boolean)
      )
    );

    return {
      totalLibraryClips: clips.length,
      scopedClipCount: scopedClips.length,
      coveredKeywords,
    };
  }, [clips, selectedNiche]);

  const auditedTopics = useMemo(() => {
    const raw = discovery?.topics || [];
    return raw.map((topic) => {
      let matchedClip: ClipItem | undefined;
      let highestSim = 0;

      if (topic.promotedToClipId) {
        matchedClip = clips.find((c) => c.id === topic.promotedToClipId);
      }

      if (!matchedClip) {
        for (const clip of clips) {
          const sim = computeTitleSimilarity(topic.topic, clip.title);
          if (sim > highestSim) {
            highestSim = sim;
            if (sim >= 0.45) {
              matchedClip = clip;
            }
          }
        }
      }

      const liveNoveltyPct = matchedClip
        ? Math.min(topic.noveltyPct, Math.max(12, Math.round((1 - Math.max(highestSim, 0.72)) * 100)))
        : topic.noveltyPct;

      return {
        ...topic,
        resolvedGapType: topic.gapType || "library-gap",
        liveCoveredClip: matchedClip,
        liveNoveltyPct,
      };
    });
  }, [discovery?.topics, clips]);

  const filteredTopics = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return auditedTopics.filter((item) => {
      if (gapFilter !== "all" && item.resolvedGapType !== gapFilter) return false;
      if (selectedNiche !== "all" && item.niche !== selectedNiche) return false;
      if (velocityFilter !== "all" && item.demandVelocity !== velocityFilter) return false;
      if (hideCovered && item.liveCoveredClip) return false;
      if (!q) return true;
      return (
        item.topic.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        (item.competitorChannel || "").toLowerCase().includes(q) ||
        item.searchTrendSignal.toLowerCase().includes(q) ||
        item.suggestedHook.toLowerCase().includes(q)
      );
    });
  }, [auditedTopics, gapFilter, selectedNiche, velocityFilter, hideCovered, filterText]);

  const competitorGapCount = useMemo(
    () => auditedTopics.filter((t) => t.resolvedGapType === "competitor-gap").length,
    [auditedTopics]
  );

  const uncoveredCount = useMemo(
    () => auditedTopics.filter((t) => !t.liveCoveredClip).length,
    [auditedTopics]
  );

  const avgNovelty = useMemo(() => {
    const uncovered = auditedTopics.filter((t) => !t.liveCoveredClip);
    if (uncovered.length === 0) return 0;
    return Math.round(uncovered.reduce((sum, t) => sum + t.liveNoveltyPct, 0) / uncovered.length);
  }, [auditedTopics]);

  const avgEstRpm = useMemo(() => {
    if (auditedTopics.length === 0) return 0;
    return (
      Math.round(
        (auditedTopics.reduce((sum, t) => sum + t.estimatedRpmUsd, 0) / auditedTopics.length) * 100
      ) / 100
    );
  }, [auditedTopics]);

  function handleAddCompetitorChannel() {
    const raw = newChannelInput.trim();
    if (!raw) return;
    const handle = raw.startsWith("@") ? raw : `@${raw.replace(/\s+/g, "")}`;
    if (!competitorChannels.some((c) => c.toLowerCase() === handle.toLowerCase())) {
      setCompetitorChannels((prev) => [...prev, handle].slice(0, 8));
    }
    setNewChannelInput("");
  }

  async function handleSubmitScan(e: React.FormEvent) {
    e.preventDefault();
    if (isDiscovering) return;
    if (gapFilter === "competitor-gap" && onRunCompetitorGapScan) {
      await onRunCompetitorGapScan({
        niche: selectedNiche,
        freshness,
        competitorChannels,
        customQuery: customQuery.trim() || undefined,
      });
      return;
    }
    await onRunDiscovery({
      niche: selectedNiche,
      freshness,
      customQuery: customQuery.trim() || undefined,
    });
  }

  return (
    <div className="flex-1 bg-[#F4F6F9] dark:bg-[#0A0B0E] p-4 sm:p-5 space-y-4 overflow-y-auto">
      {/* Top Studio Control Deck */}
      <section className="p-4 sm:p-5 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Google Search Grounding</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {libraryAudit.totalLibraryClips} clips audited
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {competitorChannels.length} rival channels tracked
              </span>
            </div>
            <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Opportunity Discovery &amp; Competitor Gap Scanner
            </h2>
          </div>

          {/* Primary Mode / Gap Filter Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-0.5 rounded-xs bg-[#ECEFF4] dark:bg-[#161922] border border-[#D4DAE4] dark:border-[#232836] text-xs">
              {(
                [
                  { id: "all", label: `All Gaps (${auditedTopics.length})` },
                  {
                    id: "library-gap",
                    label: `Library Gaps (${auditedTopics.length - competitorGapCount})`,
                  },
                  {
                    id: "competitor-gap",
                    label: `Competitor Gap (${competitorGapCount})`,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGapFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                    gapFilter === opt.id
                      ? opt.id === "competitor-gap"
                        ? "bg-[#E1392B] text-white"
                        : "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-0.5 rounded-xs bg-[#ECEFF4] dark:bg-[#161922] border border-[#D4DAE4] dark:border-[#232836] text-xs">
              {(
                [
                  { id: "24h", label: "24h" },
                  { id: "7d", label: "7d" },
                  { id: "30d", label: "30d" },
                ] as const
              ).map((windowOpt) => (
                <button
                  key={windowOpt.id}
                  type="button"
                  onClick={() => setFreshness(windowOpt.id)}
                  className={`px-2 py-1 rounded-xs font-mono font-medium transition-colors whitespace-nowrap ${
                    freshness === windowOpt.id
                      ? "bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {windowOpt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Niche Selector Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          {NICHE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedNiche(opt.id)}
              className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-colors whitespace-nowrap ${
                selectedNiche === opt.id
                  ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                  : "bg-[#F4F6F9] dark:bg-[#161922] text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white border border-[#D4DAE4] dark:border-[#232836]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Competitor Channel Watchlist Bar (Visible whenever Competitor Gap is active or user wants to manage rivals) */}
        <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#0F172A] dark:text-slate-200 whitespace-nowrap">
              <Crosshair className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Competitor Channels:</span>
            </span>
            {competitorChannels.map((ch) => (
              <span
                key={ch}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300"
              >
                <span>{ch}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ch}`}
                  onClick={() => setCompetitorChannels((prev) => prev.filter((x) => x !== ch))}
                  className="text-slate-400 hover:text-[#E1392B]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={newChannelInput}
              onChange={(e) => setNewChannelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCompetitorChannel();
                }
              }}
              placeholder="@AddRivalChannel"
              className="h-7 w-36 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#111318] font-mono text-[11px]"
            />
            <button
              type="button"
              onClick={handleAddCompetitorChannel}
              className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#111318] hover:border-[#0F172A] dark:hover:border-slate-500 inline-flex items-center gap-1 text-[11px] font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Query Bar & Dual Scan Triggers */}
        <form onSubmit={handleSubmitScan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Optional sub-niche focus (e.g., affiliate bridge funnels, local AI agents, Steam indie demos)..."
              className="w-full h-9 pl-9 pr-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F4F6F9] dark:bg-[#0A0B0E] text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            disabled={isDiscovering}
            onClick={() =>
              onRunDiscovery({
                niche: selectedNiche,
                freshness,
                customQuery: customQuery.trim() || undefined,
              })
            }
            className="h-9 px-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#161922] hover:border-[#0F172A] dark:hover:border-slate-500 disabled:opacity-60 text-xs font-semibold text-[#0F172A] dark:text-slate-100 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {isDiscovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span>Scan Library Gaps</span>
          </button>

          {onRunCompetitorGapScan && (
            <button
              type="button"
              disabled={isDiscovering}
              onClick={async () => {
                setGapFilter("competitor-gap");
                await onRunCompetitorGapScan({
                  niche: selectedNiche,
                  freshness,
                  competitorChannels,
                  customQuery: customQuery.trim() || undefined,
                });
              }}
              className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              {isDiscovering ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>Scan Competitor Gaps &amp; Draft Cards</span>
            </button>
          )}
        </form>

        {/* Compact 4-Metric Audit Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#D4DAE4] dark:border-[#1E222D] pt-3 gap-4">
          <div>
            <div className="text-[11px] text-slate-500">Library Audited</div>
            <div className="font-mono text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
              {libraryAudit.scopedClipCount} / {libraryAudit.totalLibraryClips} clips
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Uncovered Whitespace</div>
            <div className="font-mono text-base font-bold tabular-nums text-[#E1392B]">
              {uncoveredCount} topics ({competitorGapCount} rival blindspots)
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Avg. Novelty Score</div>
            <div className="font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {avgNovelty}% uncovered
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Avg. Est. RPM</div>
            <div className="font-mono text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
              ${avgEstRpm.toFixed(2)} / 1K
            </div>
          </div>
        </div>
      </section>

      {/* Compact Secondary Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-xs bg-white dark:bg-[#111318] border border-[#D4DAE4] dark:border-[#1E222D] text-xs">
            {(
              [
                { id: "all", label: "All Velocity" },
                { id: "exploding", label: "Exploding" },
                { id: "rising", label: "Rising" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVelocityFilter(opt.id)}
                className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                  velocityFilter === opt.id
                    ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideCovered}
              onChange={(e) => setHideCovered(e.target.checked)}
              className="accent-[#E1392B]"
            />
            <span>Hide covered</span>
          </label>
        </div>

        <div className="relative w-full sm:w-64">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter topics or rival channel..."
            className="w-full h-8 pl-8 pr-3 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] text-xs"
          />
        </div>
      </div>

      {/* Results Grid */}
      {isDiscovering ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-3"
            >
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-xs" />
              <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-xs" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xs" />
              <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xs" />
            </div>
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="p-8 rounded-sm border border-dashed border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#111318] text-center space-y-3">
          <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            No gap topics match this filter
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Run a Library Gap or Competitor Gap scan to discover uncovered high-RPM angles via live Google Search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredTopics.map((item) => {
            const isCovered = Boolean(item.liveCoveredClip);
            const isCompGap = item.resolvedGapType === "competitor-gap";
            return (
              <article
                key={item.id}
                className="p-4 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2.5">
                  {/* Unboxed Metadata Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                        {NICHE_LABELS[item.niche]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{isCompGap ? `Competitor Gap (${item.competitorChannel || "Rivals"})` : item.subCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.demandVelocity === "exploding"
                            ? "font-semibold text-[#E1392B]"
                            : "font-medium text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {VELOCITY_LABELS[item.demandVelocity]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold text-[#0F172A] dark:text-slate-100">
                        ${item.estimatedRpmUsd.toFixed(2)} RPM
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span
                        className={
                          isCovered
                            ? "text-slate-500"
                            : "text-emerald-600 dark:text-emerald-400 font-semibold"
                        }
                      >
                        {isCovered ? "Covered" : `${item.liveNoveltyPct}% Gap`}
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h3 className="font-display text-sm font-bold leading-snug text-[#0F172A] dark:text-[#F8FAFC]">
                    {item.topic}
                  </h3>

                  {/* Competitor Blindspot / Signal */}
                  <div className="space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {isCompGap && item.competitorBlindspot && (
                      <p>
                        <span className="font-semibold text-[#E1392B]">Competitor blindspot: </span>
                        {item.competitorBlindspot}
                      </p>
                    )}
                    <p>
                      <span className="font-medium text-[#0F172A] dark:text-slate-100">Signal: </span>
                      {item.searchTrendSignal}
                    </p>
                  </div>

                  {/* Hook & Format */}
                  <div className="pt-2.5 border-t border-[#D4DAE4] dark:border-[#1E222D] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>3-second opening hook</span>
                      <span className="font-mono">{FORMAT_LABELS[item.recommendedFormat]}</span>
                    </div>
                    <p className="font-medium text-[#0F172A] dark:text-slate-100">
                      &ldquo;{item.suggestedHook}&rdquo;
                    </p>
                  </div>

                  {/* Audit & Source Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    {item.autoDraftedToOpportunities ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Auto-drafted to Opportunity cards</span>
                      </span>
                    ) : isCovered && item.liveCoveredClip ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Covered by {item.liveCoveredClip.title}</span>
                      </span>
                    ) : (
                      <span className="truncate max-w-[260px]">
                        Verified unique vs. {item.closestLibraryClipTitle || "library"}
                      </span>
                    )}

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#2563EB] dark:text-sky-400 hover:underline shrink-0"
                      >
                        <span className="truncate max-w-[160px]">{item.sourceTitle || "Source"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Action Row */}
                <div className="pt-2.5 border-t border-[#D4DAE4] dark:border-[#1E222D] flex flex-wrap items-center gap-2">
                  {isCovered && item.liveCoveredClip ? (
                    <button
                      type="button"
                      onClick={() => onOpenClipInStudio(item.liveCoveredClip!.id)}
                      className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Open in Studio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={creatingId === item.id}
                      onClick={async () => {
                        setCreatingId(item.id);
                        try {
                          await onCreateClipFromTopic(item);
                        } finally {
                          setCreatingId(null);
                        }
                      }}
                      className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {creatingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Clapperboard className="w-3.5 h-3.5" />
                      )}
                      <span>{creatingId === item.id ? "Creating..." : "Create Clip Draft"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={savingId === item.id || Boolean(item.savedToResearch)}
                    onClick={async () => {
                      setSavingId(item.id);
                      try {
                        await onSaveTopicToResearch(item.id);
                      } finally {
                        setSavingId(null);
                      }
                    }}
                    className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F4F6F9] dark:bg-[#161922] disabled:opacity-60 text-xs font-medium text-[#0F172A] dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {savingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : item.savedToResearch ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{item.savedToResearch ? "In Opportunity Queue" : "Draft Opportunity Card"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Grounding Sources */}
      {discovery && discovery.sources.length > 0 && (
        <section className="p-3.5 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
          <span className="font-semibold text-[#0F172A] dark:text-slate-200">
            Google Search Sources ({discovery.sources.length}):
          </span>
          {discovery.sources.map((src) => (
            <a
              key={src.uri}
              href={src.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#2563EB] dark:text-sky-400 hover:underline"
            >
              <span className="truncate max-w-[220px]">{src.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
