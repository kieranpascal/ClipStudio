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
  const [customQuery, setCustomQuery] = useState(discovery?.customQuery || "");
  const [velocityFilter, setVelocityFilter] = useState<"all" | "exploding" | "rising">("all");
  const [hideCovered, setHideCovered] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Live audit of current clip library footprint for the selected niche
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

  // Evaluate each discovered topic against the LIVE clip library so gaps flip to "Covered" immediately when built
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
        liveCoveredClip: matchedClip,
        liveNoveltyPct,
      };
    });
  }, [discovery?.topics, clips]);

  const filteredTopics = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return auditedTopics.filter((item) => {
      if (selectedNiche !== "all" && item.niche !== selectedNiche) return false;
      if (velocityFilter !== "all" && item.demandVelocity !== velocityFilter) return false;
      if (hideCovered && item.liveCoveredClip) return false;
      if (!q) return true;
      return (
        item.topic.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        item.searchTrendSignal.toLowerCase().includes(q) ||
        item.suggestedHook.toLowerCase().includes(q)
      );
    });
  }, [auditedTopics, selectedNiche, velocityFilter, hideCovered, filterText]);

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

  async function handleSubmitScan(e: React.FormEvent) {
    e.preventDefault();
    if (isDiscovering) return;
    await onRunDiscovery({
      niche: selectedNiche,
      freshness,
      customQuery: customQuery.trim() || undefined,
    });
  }

  return (
    <div className="flex-1 bg-[#F6F7F9] dark:bg-[#0A0B0E] p-4 sm:p-6 space-y-5 overflow-y-auto">
      {/* Command & Google Search Query Panel */}
      <section className="p-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Ingest</span>
              <span aria-hidden="true">/</span>
              <span>Opportunity Discovery</span>
              <span aria-hidden="true">·</span>
              <span>Google Search Grounding</span>
              {discovery?.lastScannedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Updated {new Date(discovery.lastScannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              )}
            </div>
            <h2 className="font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
              Uncovered Niche Opportunity Discovery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Audits your existing clip library ({libraryAudit.totalLibraryClips} clips) and queries live Google Search to surface high-performing topics in your niche that you have not covered yet.
            </p>
          </div>

          <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs shrink-0 self-start">
            {(
              [
                { id: "24h", label: "Last 24h" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
              ] as const
            ).map((windowOpt) => (
              <button
                key={windowOpt.id}
                type="button"
                onClick={() => setFreshness(windowOpt.id)}
                className={`px-2.5 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
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

        {/* Niche Selector Strip */}
        <div className="flex flex-wrap items-center gap-1.5">
          {NICHE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedNiche(opt.id)}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors whitespace-nowrap ${
                selectedNiche === opt.id
                  ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                  : "bg-[#F6F7F9] dark:bg-[#161922] text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white border border-[#D9DEE7] dark:border-[#262B37]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmitScan} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Optional angle or sub-niche focus (e.g., open-source AI agents, indie game launches, Q4 CPM shifts)..."
              className="w-full h-10 pl-9 pr-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
            />
          </div>
          <button
            type="submit"
            disabled={isDiscovering}
            className="h-10 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
          >
            {isDiscovering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>{isDiscovering ? "Searching Live Web..." : "Scan Uncovered Topics"}</span>
          </button>
        </form>

        {/* 4-Column Library Gap Audit Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#D9DEE7] dark:border-[#222631] pt-4 gap-4">
          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-500">Clips Audited in Scope</div>
            <div className="font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
              {libraryAudit.scopedClipCount}
              <span className="text-xs font-normal text-slate-500"> / {libraryAudit.totalLibraryClips} total</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-500">Uncovered Gaps Found</div>
            <div className="font-mono text-lg font-bold tabular-nums text-[#E1392B]">
              {uncoveredCount}
              <span className="text-xs font-normal text-slate-500"> / {auditedTopics.length} topics</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-500">Avg. Library Novelty</div>
            <div className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {avgNovelty}%
              <span className="text-xs font-normal text-slate-500"> whitespace</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] text-slate-500">Avg. Est. Niche RPM</div>
            <div className="font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
              ${avgEstRpm.toFixed(2)}
              <span className="text-xs font-normal text-slate-500"> / 1K views</span>
            </div>
          </div>
        </div>

        {/* Covered Library Footprint Exclusion Reference */}
        {libraryAudit.coveredKeywords.length > 0 && (
          <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium text-[#0F172A] dark:text-slate-200">
              Excluded from search (already in library):
            </span>
            <span>{libraryAudit.coveredKeywords.slice(0, 10).join(" · ")}</span>
          </div>
        )}
      </section>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-white dark:bg-[#111318] border border-[#D9DEE7] dark:border-[#222631] text-xs">
            {(
              [
                { id: "all", label: `All Gaps (${auditedTopics.length})` },
                {
                  id: "exploding",
                  label: `Exploding (${auditedTopics.filter((t) => t.demandVelocity === "exploding").length})`,
                },
                {
                  id: "rising",
                  label: `Rising (${auditedTopics.filter((t) => t.demandVelocity === "rising").length})`,
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVelocityFilter(opt.id)}
                className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                  velocityFilter === opt.id
                    ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideCovered}
              onChange={(e) => setHideCovered(e.target.checked)}
              className="accent-[#E1392B]"
            />
            <span>Hide already-covered</span>
          </label>
        </div>

        <div className="relative w-full sm:w-64">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter discovered topics..."
            className="w-full h-8 pl-8 pr-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
          />
        </div>
      </div>

      {/* Loading Skeleton or Results Grid */}
      {isDiscovering ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-3"
            >
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-xs" />
              <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-xs" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/70 rounded-xs" />
              <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800/70 rounded-xs" />
              <div className="pt-2 flex gap-2">
                <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-xs" />
                <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800/70 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="p-10 rounded-sm border border-dashed border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] text-center space-y-3">
          <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
            No uncovered topics match the current filter
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Switch niche filters or run a fresh Google Search scan to discover new high-performing topics outside your current clip library.
          </p>
          <button
            type="button"
            onClick={() =>
              onRunDiscovery({
                niche: selectedNiche,
                freshness,
                customQuery: customQuery.trim() || undefined,
              })
            }
            className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Scan Uncovered Topics Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTopics.map((item) => {
            const isCovered = Boolean(item.liveCoveredClip);
            return (
              <article
                key={item.id}
                className="p-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Quiet Unboxed Metadata Kicker */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-[#0F172A] dark:text-slate-200">
                        {NICHE_LABELS[item.niche]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.subCategory}</span>
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
                      <span className="text-[#0F172A] dark:text-slate-200 font-semibold">
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
                        {isCovered ? "Covered in Library" : `${item.liveNoveltyPct}% Uncovered`}
                      </span>
                    </div>
                  </div>

                  {/* Topic Headline */}
                  <h3 className="font-display text-sm font-bold leading-snug text-[#0F172A] dark:text-[#F1F5F9]">
                    {item.topic}
                  </h3>

                  {/* Search Signal & Library Gap Reason */}
                  <div className="space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-medium text-[#0F172A] dark:text-slate-100">
                        Search signal:{" "}
                      </span>
                      {item.searchTrendSignal}
                    </p>
                    <p>
                      <span className="font-medium text-[#0F172A] dark:text-slate-100">
                        Library gap:{" "}
                      </span>
                      {item.whyUncovered}
                    </p>
                  </div>

                  {/* Opening Hook & Format Detail */}
                  <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>Suggested 3-second hook</span>
                      <span className="font-mono">{FORMAT_LABELS[item.recommendedFormat]}</span>
                    </div>
                    <p className="font-medium text-[#0F172A] dark:text-slate-100">
                      &ldquo;{item.suggestedHook}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.angleBrief}
                    </p>
                  </div>

                  {/* Closest Clip Audit & Source Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    {isCovered && item.liveCoveredClip ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Covered by: {item.liveCoveredClip.title}</span>
                      </span>
                    ) : item.closestLibraryClipTitle ? (
                      <span className="truncate max-w-full">
                        Checked against: {item.closestLibraryClipTitle}
                      </span>
                    ) : (
                      <span>Verified unique vs. library</span>
                    )}

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#2563EB] dark:text-sky-400 hover:underline shrink-0"
                      >
                        <span className="truncate max-w-[180px]">{item.sourceTitle || "Google Source"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Working Production Actions */}
                <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center gap-2">
                  {isCovered && item.liveCoveredClip ? (
                    <button
                      type="button"
                      onClick={() => onOpenClipInStudio(item.liveCoveredClip!.id)}
                      className="h-9 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Open Covered Clip in Studio</span>
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
                      className="h-9 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      {creatingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Clapperboard className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {creatingId === item.id ? "Creating Draft..." : "Create Clip Draft"}
                      </span>
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
                    className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#161922] hover:border-[#0F172A] dark:hover:border-slate-500 disabled:opacity-60 text-xs font-medium text-[#0F172A] dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    {savingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : item.savedToResearch ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{item.savedToResearch ? "Saved to Research" : "Save to Research Queue"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Grounded Google Search Queries & Citations */}
      {discovery && (discovery.sources.length > 0 || discovery.searchQueries.length > 0) && (
        <section className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Google Search Grounding Citations ({discovery.sources.length})
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Model: {discovery.modelUsed}
            </span>
          </div>

          {discovery.searchQueries.length > 0 && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium text-[#0F172A] dark:text-slate-200">Queries executed: </span>
              {discovery.searchQueries.join(" · ")}
            </div>
          )}

          {discovery.sources.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {discovery.sources.map((src) => (
                <a
                  key={src.uri}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] dark:text-sky-400 hover:underline"
                >
                  <span className="truncate max-w-[260px]">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
