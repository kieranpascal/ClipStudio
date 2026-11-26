import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type {
  ContentNiche,
  PipelineConfig,
  PlatformExpansionPattern,
  PlatformExpansionState,
  SocialPlatform,
} from "../types";

interface PlatformExpansionHubProps {
  config: PipelineConfig;
  platformExpansion?: PlatformExpansionState;
  isResearchingExpansion: boolean;
  applyingPatternId: string | null;
  removingPlatform: SocialPlatform | null;
  onUpdateExpansionConfig: (patch: {
    autoSyncToDistribution?: boolean;
    autoTargetMinScore?: number;
    focusNiche?: ContentNiche | "all";
  }) => Promise<void>;
  onResearchExpansion: (payload: {
    focusNiche?: ContentNiche | "all";
    customQuery?: string;
    autoApplyNow?: boolean;
  }) => Promise<void>;
  onApplyExpansionPattern: (payload: {
    patternId?: string;
    applyAllHighScore?: boolean;
  }) => Promise<void>;
  onRemoveExpansionPlatform: (platform: SocialPlatform) => Promise<void>;
  onOpenDistributionTab: () => void;
}

const SECONDARY_PLATFORMS: SocialPlatform[] = [
  "LinkedIn Video",
  "Reddit Native Video",
  "Pinterest Idea Pins",
  "Threads Video",
  "Bluesky Video",
  "Substack Video",
];

const NICHE_OPTIONS: Array<{ value: ContentNiche | "all"; label: string }> = [
  { value: "all", label: "All Niches" },
  { value: "tech-ai", label: "AI & Tech" },
  { value: "gaming", label: "Gaming" },
  { value: "podcasts", label: "Podcasts & Interviews" },
  { value: "finance", label: "Finance & Markets" },
  { value: "faceless-doc", label: "Faceless Documentary" },
  { value: "sports-irl", label: "Sports & IRL" },
];

const QUICK_ANGLES = [
  "LinkedIn vertical long-form (60-150s) & Reddit native v.redd.it clips",
  "Reddit gaming & AI subreddit zero-watermark viral formats",
  "LinkedIn B2B founder teardown clips & Substack video notes",
  "Pinterest evergreen vertical Idea Pins & Threads debate cuts",
];

export function PlatformExpansionHub({
  config,
  platformExpansion,
  isResearchingExpansion,
  applyingPatternId,
  removingPlatform,
  onUpdateExpansionConfig,
  onResearchExpansion,
  onApplyExpansionPattern,
  onRemoveExpansionPlatform,
  onOpenDistributionTab,
}: PlatformExpansionHubProps) {
  const [customQuery, setCustomQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "targeted" | "untargeted">("all");
  const [searchFilter, setSearchFilter] = useState("");

  const state: PlatformExpansionState = platformExpansion || {
    autoSyncToDistribution: true,
    autoTargetMinScore: 84,
    focusNiche: "all",
    totalResearchRuns: 0,
    executiveBrief:
      "Research secondary video platforms like LinkedIn vertical long-form and Reddit native video to uncover low-competition organic growth patterns.",
    patterns: [],
    sources: [],
    appliedHistory: [],
  };

  const activePlatforms = config.publishing.platforms || [];
  const activeSecondaryPlatforms = useMemo(
    () => activePlatforms.filter((p) => SECONDARY_PLATFORMS.includes(p)),
    [activePlatforms]
  );

  const expansionSyndicationRules = useMemo(
    () =>
      (config.syndicationRules || []).filter((r) =>
        r.targets.some((t) => SECONDARY_PLATFORMS.includes(t))
      ),
    [config.syndicationRules]
  );

  const filteredPatterns = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return state.patterns.filter((p) => {
      const isTargeted = activePlatforms.includes(p.platform);
      if (statusFilter === "targeted" && !isTargeted) return false;
      if (statusFilter === "untargeted" && isTargeted) return false;
      if (!q) return true;
      return (
        p.platform.toLowerCase().includes(q) ||
        p.formatName.toLowerCase().includes(q) ||
        p.viralPatternTitle.toLowerCase().includes(q) ||
        p.targetCommunitiesOrTags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.patterns, activePlatforms, statusFilter, searchFilter]);

  const highScoreUntargetedCount = useMemo(
    () =>
      state.patterns.filter(
        (p) =>
          p.viralPotentialScore >= state.autoTargetMinScore &&
          !activePlatforms.includes(p.platform)
      ).length,
    [state.patterns, state.autoTargetMinScore, activePlatforms]
  );

  async function handleResearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isResearchingExpansion) return;
    await onResearchExpansion({
      focusNiche: state.focusNiche,
      customQuery: customQuery.trim(),
      autoApplyNow: state.autoSyncToDistribution,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header & Research Controls */}
      <section className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Autopilot</span>
              <span aria-hidden="true">/</span>
              <span>Secondary Channel Growth</span>
              {state.lastResearchedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Updated {new Date(state.lastResearchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              )}
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
              Platform Expansion Engine
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Research viral format playbooks on secondary video platforms — LinkedIn vertical long-form, Reddit native video, Pinterest Idea Pins, Threads, Bluesky, and Substack — and automatically update your Distribution Config to target winning channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDistributionTab}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#171A21] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Open Distribution Config</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={isResearchingExpansion}
              onClick={() =>
                onResearchExpansion({
                  focusNiche: state.focusNiche,
                  customQuery: customQuery.trim(),
                  autoApplyNow: state.autoSyncToDistribution,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm bg-[#E1392B] text-white hover:bg-[#C72F22] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isResearchingExpansion ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span>
                {isResearchingExpansion ? "Researching Secondary Platforms..." : "Research Secondary Platforms"}
              </span>
            </button>
          </div>
        </div>

        {/* Research Query & Auto-Distribution Config Bar */}
        <form
          onSubmit={handleResearchSubmit}
          className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] grid grid-cols-1 lg:grid-cols-12 gap-3 items-end"
        >
          <div className="lg:col-span-3 space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Target Niche
            </label>
            <select
              value={state.focusNiche}
              onChange={(e) =>
                onUpdateExpansionConfig({ focusNiche: e.target.value as ContentNiche | "all" })
              }
              className="w-full px-3 py-2 text-xs rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-[#F8F9FB] dark:bg-[#171A21] text-[#0F172A] dark:text-slate-100 focus:outline-none focus:border-[#E1392B]"
            >
              {NICHE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-5 space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Research Focus Angle
            </label>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g., LinkedIn 90s vertical breakdowns & Reddit gaming video formats..."
              className="w-full px-3 py-2 text-xs rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-[#F8F9FB] dark:bg-[#171A21] text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
            />
          </div>

          <div className="lg:col-span-4 flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-[#F8F9FB] dark:bg-[#171A21]">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0F172A] dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={state.autoSyncToDistribution}
                onChange={(e) =>
                  onUpdateExpansionConfig({ autoSyncToDistribution: e.target.checked })
                }
                className="accent-[#E1392B] w-3.5 h-3.5"
              />
              <span>Auto-update Distribution Config</span>
            </label>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Min score</span>
              <select
                value={state.autoTargetMinScore}
                onChange={(e) =>
                  onUpdateExpansionConfig({ autoTargetMinScore: Number(e.target.value) })
                }
                className="px-2 py-1 font-mono text-xs tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-white dark:bg-[#111318] text-[#0F172A] dark:text-slate-100"
              >
                {[75, 80, 84, 88, 92].map((score) => (
                  <option key={score} value={score}>
                    {score}+
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Quick Angle Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Presets:</span>
          {QUICK_ANGLES.map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setCustomQuery(angle)}
              className="px-2.5 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            >
              {angle}
            </button>
          ))}
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4">
          <div className="text-xs text-slate-500">Active Distribution Channels</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
            {activePlatforms.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {activePlatforms.length - activeSecondaryPlatforms.length} core · {activeSecondaryPlatforms.length} secondary
          </div>
        </div>

        <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4">
          <div className="text-xs text-slate-500">Secondary Formats Mapped</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
            {state.patterns.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {state.totalResearchRuns} research runs logged
          </div>
        </div>

        <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4">
          <div className="text-xs text-slate-500">Expansion Syndication Rules</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
            {expansionSyndicationRules.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Watermark-clean auto routing
          </div>
        </div>

        <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4">
          <div className="text-xs text-slate-500">Auto-Sync Policy</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
            {state.autoSyncToDistribution ? `>= ${state.autoTargetMinScore}` : "Manual"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {state.autoSyncToDistribution
              ? "Auto-targets winning channels"
              : "Review before pushing to config"}
          </div>
        </div>
      </section>

      {/* Executive Research Brief & Live Distribution Config State */}
      <section className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm divide-y divide-[#D9DEE7] dark:divide-[#222631]">
        <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="text-xs font-semibold text-slate-500">
              Latest Secondary-Platform Intelligence Brief
            </div>
            <p className="text-sm text-[#0F172A] dark:text-slate-200 leading-relaxed">
              {state.executiveBrief}
            </p>
          </div>

          {highScoreUntargetedCount > 0 && (
            <button
              type="button"
              disabled={applyingPatternId !== null}
              onClick={() => onApplyExpansionPattern({ applyAllHighScore: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap shrink-0"
            >
              {applyingPatternId === "__bulk__" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                Sync {highScoreUntargetedCount} High-Score Channel{highScoreUntargetedCount === 1 ? "" : "s"} to Distribution
              </span>
            </button>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3.5 bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-medium text-[#0F172A] dark:text-slate-200">
              Live Distribution Targets:
            </span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              {activePlatforms.join(" · ")}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            Fleet Accounts: {config.channelFleet.length} · Max/Day: {config.publishing.maxPostsPerDay}
          </span>
        </div>
      </section>

      {/* Filter Bar & Pattern Directory */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
            {(
              [
                { id: "all", label: `All Patterns (${state.patterns.length})` },
                {
                  id: "targeted",
                  label: `Targeted in Config (${
                    state.patterns.filter((p) => activePlatforms.includes(p.platform)).length
                  })`,
                },
                {
                  id: "untargeted",
                  label: `Ready to Expand (${
                    state.patterns.filter((p) => !activePlatforms.includes(p.platform)).length
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by platform, format, or subreddit/tag..."
            className="w-full sm:w-72 px-3 py-1.5 text-xs rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-white dark:bg-[#111318] text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
          />
        </div>

        {filteredPatterns.length === 0 ? (
          <div className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#0F172A] dark:text-slate-200">
              No secondary platform patterns match the current filter.
            </p>
            <p className="text-xs text-slate-500">
              Clear your filter or run a live Gemini research sweep to discover viral formats on LinkedIn, Reddit, Pinterest, and Threads.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearchFilter("");
              }}
              className="px-3.5 py-1.5 text-xs font-medium rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#171A21]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredPatterns.map((pattern: PlatformExpansionPattern) => {
              const isTargeted = activePlatforms.includes(pattern.platform);
              const isApplying = applyingPatternId === pattern.id;
              const isRemoving = removingPlatform === pattern.platform;

              return (
                <article
                  key={pattern.id}
                  className="border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top Metadata Line (Zero-Pill) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-semibold text-[#0F172A] dark:text-slate-100">
                            {pattern.platform}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{pattern.aspectRatio}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{pattern.idealDurationRange}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{pattern.competitionLevel} competition</span>
                          {isTargeted && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Targeted in Distribution
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                          {pattern.viralPatternTitle}
                        </h3>
                        <p className="text-xs text-slate-500">{pattern.formatName}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xl font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                          {pattern.viralPotentialScore}
                          <span className="text-xs font-normal text-slate-400">/100</span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {pattern.estRpmOrValueLift}
                        </div>
                      </div>
                    </div>

                    {/* Structured Format Blueprint */}
                    <dl className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2.5 text-xs">
                      <div>
                        <dt className="font-semibold text-slate-500">Algorithm Ranking Signal</dt>
                        <dd className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {pattern.algorithmSignal}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Opening Hook Structure</dt>
                        <dd className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {pattern.hookStructure}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Caption & Packaging Rule</dt>
                        <dd className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {pattern.captionPackaging}
                        </dd>
                      </div>
                    </dl>

                    {/* Communities / Tags & Technical Constraints */}
                    <div className="pt-2.5 border-t border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[70%]">
                        {pattern.targetCommunitiesOrTags.join(" · ")}
                      </div>
                      <div className="font-mono text-[11px] tabular-nums">
                        {pattern.stripWatermarkRequired ? "Strip Watermark" : "Brand Watermark OK"} · Cap {pattern.recommendedDailyCap}/day
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Niche: {pattern.recommendedNiche}</span>
                      {pattern.sourceUrl && (
                        <a
                          href={pattern.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B] transition-colors"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {isTargeted ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onOpenDistributionTab}
                          className="px-3 py-1.5 text-xs font-medium rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#171A21] transition-colors whitespace-nowrap"
                        >
                          View in Distribution
                        </button>
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => onRemoveExpansionPlatform(pattern.platform)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-red-300 dark:border-red-900/60 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Remove Target</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => onApplyExpansionPattern({ patternId: pattern.id })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-[#E1392B] text-white hover:bg-[#C72F22] disabled:opacity-60 transition-colors whitespace-nowrap"
                      >
                        {isApplying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Target Channel in Distribution</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Distribution Sync History & Grounding Sources */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Distribution Config Sync Log
            </h3>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              {state.appliedHistory.length} updates
            </span>
          </div>

          {state.appliedHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              No secondary platforms have been pushed into Distribution Config yet. Click &ldquo;Target Channel in Distribution&rdquo; on any card above or run a research sweep with Auto-Sync enabled.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D9DEE7] dark:border-[#222631] text-slate-500">
                    <th className="py-2 pr-3 font-medium">Channel</th>
                    <th className="py-2 pr-3 font-medium">Mode</th>
                    <th className="py-2 pr-3 font-medium">Config Changes Applied</th>
                    <th className="py-2 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE7]/70 dark:divide-[#222631]">
                  {state.appliedHistory.slice(0, 8).map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2.5 pr-3 font-medium text-[#0F172A] dark:text-slate-100 whitespace-nowrap">
                        {entry.platform}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {entry.mode === "auto-sync" ? "Auto-Sync" : "Manual"}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                        {entry.summary}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                        {new Date(entry.appliedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] rounded-sm p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
            Research Grounding Sources
          </h3>
          {state.sources.length === 0 ? (
            <p className="text-xs text-slate-500">
              Run a live research pass to attach Google Search citations for secondary platform formats.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {state.sources.slice(0, 6).map((src, i) => (
                <li key={`${src.uri}_${i}`} className="flex items-start justify-between gap-2">
                  <a
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 dark:text-slate-300 hover:text-[#E1392B] transition-colors line-clamp-1"
                  >
                    {src.title || src.uri}
                  </a>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
