import { useMemo, useState } from "react";
import {
  Clock,
  Compass,
  ExternalLink,
  Loader2,
  Mic,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type {
  ClipItem,
  ContentNiche,
  KnowledgeAcquisitionState,
  KnowledgeCrawlCadence,
  KnowledgeSourceFeed,
  OpportunityDiscoverySnapshot,
  OpportunityGapFreshness,
  OpportunityGapTopic,
  ResearchOpportunity,
  WorkspaceTab,
} from "../types";
import { OpportunityDiscoveryPanel } from "./OpportunityDiscoveryPanel";
import { StudioKpiStrip, StudioPageHeader } from "./StudioChrome";

interface OpportunityRadarPageProps {
  clips: ClipItem[];
  opportunityDiscovery?: OpportunityDiscoverySnapshot;
  researchOpportunities: ResearchOpportunity[];
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  isDiscoveringOpportunities: boolean;
  isResearching: boolean;
  isCrawlingKnowledge: boolean;
  onRunOpportunityDiscovery: (payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    customQuery?: string;
  }) => Promise<void>;
  onRunCompetitorGapScan: (payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    competitorChannels: string[];
    customQuery?: string;
  }) => Promise<void>;
  onCreateClipFromDiscoveredTopic: (topic: OpportunityGapTopic) => Promise<void>;
  onSaveDiscoveredTopicToResearch: (topicId: string) => Promise<void>;
  onRunResearch: (focus: string) => Promise<void>;
  onCreateClipFromOpportunity: (opp: ResearchOpportunity) => Promise<void>;
  onUpdateKnowledgeConfig: (patch: {
    enabled?: boolean;
    cadence?: KnowledgeCrawlCadence;
    autoDraftOpportunities?: boolean;
    feeds?: KnowledgeSourceFeed[];
  }) => Promise<void>;
  onRunKnowledgeCrawl: (customTopic?: string) => Promise<void>;
  onOpenClipInStudio: (clipId: string) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
}

function isSafeHttpUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function OpportunityRadarPage({
  clips,
  opportunityDiscovery,
  researchOpportunities,
  knowledgeAcquisition,
  isDiscoveringOpportunities,
  isResearching,
  isCrawlingKnowledge,
  onRunOpportunityDiscovery,
  onRunCompetitorGapScan,
  onCreateClipFromDiscoveredTopic,
  onSaveDiscoveredTopicToResearch,
  onRunResearch,
  onCreateClipFromOpportunity,
  onUpdateKnowledgeConfig,
  onRunKnowledgeCrawl,
  onOpenClipInStudio,
  onSelectTab,
}: OpportunityRadarPageProps) {
  const [subView, setSubView] = useState<"gap-discovery" | "opportunities" | "crawler">("gap-discovery");
  const [researchFocus, setResearchFocus] = useState(
    "High-RPM viral short-form opportunities across Gaming, AI/Tech, Podcasts & Finance"
  );
  const [nicheFilter, setNicheFilter] = useState<"all" | ContentNiche>("all");
  const [originFilter, setOriginFilter] = useState<"all" | "knowledge-acquisition" | "manual">("all");
  const [buildingOppId, setBuildingOppId] = useState<string | null>(null);
  const [showAddFeedForm, setShowAddFeedForm] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] =
    useState<KnowledgeSourceFeed["category"]>("creator-newsletter");

  const filteredOpps = useMemo(() => {
    return researchOpportunities
      .filter((o) => nicheFilter === "all" || o.niche === nicheFilter)
      .filter((o) =>
        originFilter === "all"
          ? true
          : originFilter === "knowledge-acquisition"
            ? o.origin === "knowledge-acquisition"
            : o.origin !== "knowledge-acquisition"
      );
  }, [researchOpportunities, nicheFilter, originFilter]);

  const gapCount = opportunityDiscovery?.topics?.length || 0;
  const competitorGapCount = (opportunityDiscovery?.topics || []).filter(
    (t) => t.gapType === "competitor-gap"
  ).length;
  const avgRpm = useMemo(() => {
    if (researchOpportunities.length === 0) return 0;
    return (
      researchOpportunities.reduce((sum, o) => sum + o.estimatedRpmUsd, 0) /
      researchOpportunities.length
    );
  }, [researchOpportunities]);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Research & Intelligence"
        title="Opportunity & Gap Radar"
        subtitle="Audit what your library and top competitors have missed using live Google Search, score 1of10 outlier topics by RPM, and run recurring newsletter & AI-tool crawlers that auto-draft ready-to-shoot briefs."
        metaItems={[
          { label: `${gapCount} Uncovered Topics`, emphasis: "crimson" },
          { label: `${competitorGapCount} Competitor Gaps` },
          { label: `${researchOpportunities.length} Briefs` },
          { label: `Avg $${avgRpm.toFixed(2)} Est. RPM`, emphasis: "emerald" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("audience-social-intel")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap"
          >
            Next: Social &amp; Comment Intel
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "uncovered",
            label: "Verified Library Gaps",
            value: String(gapCount),
            subtext: `${opportunityDiscovery?.excludedCoveredTopics?.length || 0} covered topics excluded`,
            tone: "crimson",
            onClick: () => setSubView("gap-discovery"),
          },
          {
            id: "briefs",
            label: "Active Opportunity Briefs",
            value: String(researchOpportunities.length),
            subtext: `Avg $${avgRpm.toFixed(2)} RPM across tracked niches`,
            tone: "emerald",
            onClick: () => setSubView("opportunities"),
          },
          {
            id: "crawler",
            label: "Background Knowledge Crawler",
            value: knowledgeAcquisition?.enabled ? `Active (${knowledgeAcquisition.cadence})` : "Paused",
            subtext: `${knowledgeAcquisition?.feeds.filter((f) => f.enabled).length || 0} active feeds · ${knowledgeAcquisition?.totalDrafted || 0} drafted`,
            onClick: () => setSubView("crawler"),
          },
          {
            id: "library-checked",
            label: "Clip Library Cross-Checked",
            value: `${clips.length} Clips`,
            subtext: "Prevents duplicate topic filming automatically",
            onClick: () => onSelectTab("ingest"),
          },
        ]}
      />

      {/* Focused Sub-View Tabs */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex items-center gap-6 overflow-x-auto">
        {(
          [
            { id: "gap-discovery", label: `Google Search Gap & Rival Scanner (${gapCount})`, icon: Search },
            { id: "opportunities", label: `Outlier Opportunity Queue (${researchOpportunities.length})`, icon: Compass },
            {
              id: "crawler",
              label: `Newsletter & AI-Tool Crawler (${knowledgeAcquisition?.feeds.length || 0} Feeds)`,
              icon: Newspaper,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
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

      {subView === "gap-discovery" && (
        <OpportunityDiscoveryPanel
          clips={clips}
          discovery={opportunityDiscovery}
          isDiscovering={isDiscoveringOpportunities}
          onRunDiscovery={onRunOpportunityDiscovery}
          onRunCompetitorGapScan={onRunCompetitorGapScan}
          onCreateClipFromTopic={onCreateClipFromDiscoveredTopic}
          onSaveTopicToResearch={onSaveDiscoveredTopicToResearch}
          onOpenClipInStudio={onOpenClipInStudio}
        />
      )}

      {subView === "opportunities" && (
        <div className="p-5 space-y-5">
          {/* Live Multi-Niche Opportunity Finder Bar */}
          <div className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Multi-Niche Outlier Opportunity Finder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Combines live Google Search velocity with fleet RPM winners and generates ready-to-record hook blueprints &amp; scripts.
                </p>
              </div>
              <div className="inline-flex flex-wrap items-center gap-1 text-[11px]">
                {(
                  [
                    { id: "all", label: "All Niches" },
                    { id: "gaming", label: "Gaming" },
                    { id: "tech-ai", label: "AI & Tech" },
                    { id: "podcasts", label: "Podcasts" },
                    { id: "finance", label: "Finance" },
                    { id: "faceless-doc", label: "Faceless Doc" },
                    { id: "sports-irl", label: "Sports & IRL" },
                  ] as const
                ).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNicheFilter(n.id)}
                    className={`px-2.5 py-1 rounded-xs font-medium whitespace-nowrap ${
                      nicheFilter === n.id
                        ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                        : "text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isResearching) onRunResearch(researchFocus);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={researchFocus}
                onChange={(e) => setResearchFocus(e.target.value)}
                placeholder="Focus research (e.g., local AI tools, high-RPM finance shifts, breakout gaming exploits)..."
                className="flex-1 h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
              />
              <button
                type="submit"
                disabled={isResearching}
                className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isResearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                <span>{isResearching ? "Scanning Web..." : "Run Live Research Scan"}</span>
              </button>
            </form>
          </div>

          {/* Origin Filter */}
          <div className="inline-flex items-center p-0.5 rounded-xs bg-[#E7ECF3] dark:bg-[#151821] border border-[#D4DAE4] dark:border-[#232836] text-xs">
            {(
              [
                { id: "all", label: `All Briefs (${researchOpportunities.length})` },
                {
                  id: "knowledge-acquisition",
                  label: `Auto-Drafted by Crawler (${
                    researchOpportunities.filter((o) => o.origin === "knowledge-acquisition").length
                  })`,
                },
                {
                  id: "manual",
                  label: `Live Scan & Seed (${
                    researchOpportunities.filter((o) => o.origin !== "knowledge-acquisition").length
                  })`,
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOriginFilter(opt.id)}
                className={`px-3 py-1 rounded-xs font-medium whitespace-nowrap ${
                  originFilter === opt.id
                    ? "bg-white dark:bg-[#0D0F14] text-[#0F172A] dark:text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Opportunity Brief Cards */}
          {filteredOpps.length === 0 ? (
            <div className="p-8 rounded-xs border border-dashed border-[#D4DAE4] dark:border-[#252A36] text-center text-xs text-slate-500">
              No opportunity briefs match the selected filters. Run a live research scan or widen the niche filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOpps.map((opp) => (
                <article
                  key={opp.id}
                  className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                        {opp.origin === "knowledge-acquisition" && (
                          <>
                            <span className="font-semibold text-[#E1392B] shrink-0">Auto-Drafted</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-semibold text-[#0F172A] dark:text-slate-200 truncate">
                          {opp.niche} · {opp.newsletterOrFeed || opp.source}
                        </span>
                      </div>
                      <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        {opp.outlierMultiplier ? `${opp.outlierMultiplier.toFixed(1)}x` : `${(opp.viralScore / 10).toFixed(1)}x`} Outlier · ${opp.estimatedRpmUsd.toFixed(2)} RPM · {opp.viralScore}/99
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
                      {opp.topic}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{opp.whyNow}</p>

                    <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                        <span>Hook Blueprint</span>
                        <span>
                          Competition: {opp.competitionLevel} · Voice: {opp.recommendedVoice}
                        </span>
                      </div>
                      <div className="font-display font-bold text-[#E1392B]">{opp.hookBlueprint}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                        &ldquo;{opp.suggestedScript}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D]">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>Template: {opp.recommendedTemplate}</span>
                      {isSafeHttpUrl(opp.sourceUrl) && (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E1392B] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={buildingOppId === opp.id}
                      onClick={async () => {
                        setBuildingOppId(opp.id);
                        try {
                          await onCreateClipFromOpportunity(opp);
                        } finally {
                          setBuildingOppId(null);
                        }
                      }}
                      className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      {buildingOppId === opp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5 text-[#E1392B]" />}
                      <span>Turn into Clip &amp; Voiceover</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {subView === "crawler" && knowledgeAcquisition && (
        <div className="p-5 space-y-5">
          <section className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {knowledgeAcquisition.enabled ? `Recurring (${knowledgeAcquisition.cadence})` : "Paused"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{knowledgeAcquisition.totalRuns} runs</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{knowledgeAcquisition.totalDrafted} cards auto-drafted</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Creator Economy Newsletters, AI Tool Trackers &amp; Platform Changelogs
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={knowledgeAcquisition.enabled}
                    onChange={(e) => onUpdateKnowledgeConfig({ enabled: e.target.checked })}
                    className="accent-[#E1392B]"
                  />
                  <span>Recurring Schedule</span>
                </label>

                <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={knowledgeAcquisition.autoDraftOpportunities}
                    onChange={(e) =>
                      onUpdateKnowledgeConfig({ autoDraftOpportunities: e.target.checked })
                    }
                    className="accent-[#E1392B]"
                  />
                  <span>Auto-Draft Briefs</span>
                </label>

                <select
                  aria-label="Knowledge crawl cadence"
                  value={knowledgeAcquisition.cadence}
                  onChange={(e) =>
                    onUpdateKnowledgeConfig({ cadence: e.target.value as KnowledgeCrawlCadence })
                  }
                  className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
                >
                  <option value="manual">Manual Only</option>
                  <option value="every-1h">Every 1 Hour</option>
                  <option value="every-6h">Every 6 Hours</option>
                  <option value="daily">Daily</option>
                </select>

                <button
                  type="button"
                  disabled={isCrawlingKnowledge}
                  onClick={() => onRunKnowledgeCrawl(researchFocus)}
                  className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {isCrawlingKnowledge ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isCrawlingKnowledge ? "Crawling Feeds..." : "Crawl Now & Draft Cards"}</span>
                </button>
              </div>
            </div>

            {/* Source Feeds Directory Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Monitored Feeds ({knowledgeAcquisition.feeds.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddFeedForm((v) => !v)}
                  className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>{showAddFeedForm ? "Cancel" : "Add Newsletter / Tracker"}</span>
                </button>
              </div>

              {showAddFeedForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newFeedName.trim() || !newFeedUrl.trim()) return;
                    const normalizedUrl = /^https?:\/\//i.test(newFeedUrl.trim())
                      ? newFeedUrl.trim()
                      : `https://${newFeedUrl.trim()}`;
                    if (!isSafeHttpUrl(normalizedUrl)) return;
                    const added: KnowledgeSourceFeed = {
                      id: `feed_custom_${Date.now().toString(36)}`,
                      name: newFeedName.trim(),
                      url: normalizedUrl,
                      category: newFeedCategory,
                      enabled: true,
                    };
                    await onUpdateKnowledgeConfig({
                      feeds: [...knowledgeAcquisition.feeds, added],
                    });
                    setNewFeedName("");
                    setNewFeedUrl("");
                    setShowAddFeedForm(false);
                  }}
                  className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] flex flex-wrap items-center gap-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    value={newFeedName}
                    onChange={(e) => setNewFeedName(e.target.value)}
                    placeholder="Source name (e.g., Superhuman AI, Publish Press)"
                    className="flex-1 min-w-[200px] h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                  />
                  <input
                    type="url"
                    required
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-[200px] h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] font-mono"
                  />
                  <select
                    aria-label="Feed category"
                    value={newFeedCategory}
                    onChange={(e) => setNewFeedCategory(e.target.value as KnowledgeSourceFeed["category"])}
                    className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                  >
                    <option value="creator-newsletter">Creator Newsletter</option>
                    <option value="ai-tools">AI Tools Tracker</option>
                    <option value="platform-changelog">Platform Changelog</option>
                  </select>
                  <button
                    type="submit"
                    className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold whitespace-nowrap"
                  >
                    Save Source
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E7F0] dark:border-[#1E222D] text-[11px] text-slate-500">
                      <th className="py-2 pr-3 font-medium">Source Name</th>
                      <th className="py-2 px-3 font-medium">Category</th>
                      <th className="py-2 px-3 font-medium">URL</th>
                      <th className="py-2 pl-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                    {knowledgeAcquisition.feeds.map((feed) => (
                      <tr key={feed.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#151821]">
                        <td className="py-2.5 pr-3 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {feed.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {feed.category}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                          {isSafeHttpUrl(feed.url) ? (
                            <a
                              href={feed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#E1392B] inline-flex items-center gap-1"
                            >
                              <span className="truncate">{feed.url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span>{feed.url}</span>
                          )}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const nextFeeds = knowledgeAcquisition.feeds.map((f) =>
                                f.id === feed.id ? { ...f, enabled: !f.enabled } : f
                              );
                              onUpdateKnowledgeConfig({ feeds: nextFeeds });
                            }}
                            className={`h-7 px-2.5 rounded-xs border text-[11px] font-semibold ${
                              feed.enabled
                                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                                : "border-[#D4DAE4] dark:border-[#252A36] text-slate-500"
                            }`}
                          >
                            {feed.enabled ? "Active" : "Paused"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Crawl Execution History */}
          <section className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Recent Background Crawl Runs
              </h3>
              <span className="font-mono text-[11px] text-slate-500 inline-flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#E1392B]" />
                <span>
                  Next scheduled:{" "}
                  {knowledgeAcquisition.nextRunAt
                    ? new Date(knowledgeAcquisition.nextRunAt).toLocaleTimeString()
                    : "Manual"}
                </span>
              </span>
            </div>

            {knowledgeAcquisition.recentRuns.length === 0 ? (
              <div className="py-5 text-xs text-slate-500">
                No crawl runs recorded yet. Click &ldquo;Crawl Now &amp; Draft Cards&rdquo; to ingest fresh creator economy updates.
              </div>
            ) : (
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                {knowledgeAcquisition.recentRuns.map((run) => (
                  <div key={run.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                        {run.headlineSummary}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        Trigger: {run.trigger} · Sources: {run.sourcesCrawled.join(", ")}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-right shrink-0">
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{run.opportunitiesDrafted} cards drafted
                      </div>
                      <div className="text-slate-500">
                        {new Date(run.ranAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
