import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  Clapperboard,
  Trash2,
  Loader2,
  X,
  Film,
  ShieldCheck,
  CheckSquare,
  Square,
  Send,
  Wand2,
  FileJson,
  AlertTriangle,
  Compass,
  Mic,
  Newspaper,
  Clock,
  ExternalLink,
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
  PipelineConfig,
  QaStatus,
  ResearchOpportunity,
  SourcePlatform,
  StreamerPolicyEntry,
  UiMode,
} from "../types";
import {
  computeSaturationLevel,
  computeTitleSimilarity,
  computeViewsPerMinute,
  formatCompactNumber,
} from "../utils/ffmpeg";
import { computeOutlierMultiplier } from "../utils/hotkeys";
import { OpportunityDiscoveryPanel } from "./OpportunityDiscoveryPanel";

interface IngestDeckProps {
  clips: ClipItem[];
  config: PipelineConfig;
  uiMode: UiMode;
  researchOpportunities: ResearchOpportunity[];
  opportunityDiscovery?: OpportunityDiscoverySnapshot;
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  isResearching: boolean;
  isDiscoveringOpportunities?: boolean;
  isCrawlingKnowledge?: boolean;
  isBuildingFaceless: boolean;
  selectedClipId: string;
  auditingClipId: string | null;
  generatingHooksClipId: string | null;
  isScanning: boolean;
  isBatchRunning: boolean;
  onSelectClip: (clipId: string) => void;
  onScanRadar: () => void;
  onRunResearch: (focus: string) => Promise<void>;
  onRunOpportunityDiscovery?: (payload: {
    niche: ContentNiche | "all";
    freshness: OpportunityGapFreshness;
    customQuery?: string;
  }) => Promise<void>;
  onCreateClipFromDiscoveredTopic?: (topic: OpportunityGapTopic) => Promise<void>;
  onSaveDiscoveredTopicToResearch?: (topicId: string) => Promise<void>;
  onUpdateKnowledgeConfig?: (patch: {
    enabled?: boolean;
    cadence?: KnowledgeCrawlCadence;
    autoDraftOpportunities?: boolean;
    feeds?: KnowledgeSourceFeed[];
  }) => Promise<void>;
  onRunKnowledgeCrawl?: (customTopic?: string) => Promise<void>;
  onCreateClipFromOpportunity: (opp: ResearchOpportunity) => Promise<void>;
  onBuildFacelessShort: (payload: {
    topic: string;
    niche: ContentNiche;
    facelessStyle: "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop";
    sourceText: string;
  }) => Promise<void>;
  onAuditClip: (clipId: string) => void;
  onGenerateHooks: (clipId: string) => void;
  onOpenInStudio: (clipId: string) => void;
  onBatchAction: (clipIds: string[], action: "approve" | "queue" | "delete" | "audit") => Promise<void>;
  onAddClip: (payload: {
    title: string;
    streamerName: string;
    sourcePlatform: SourcePlatform;
    sourceUrl: string;
    gameCategory: string;
    niche: ContentNiche;
    views: number;
    ageMinutes: number;
    durationSec: number;
    duplicateCrossPosts: number;
    transcript: string;
  }) => Promise<void>;
  onDeleteClip: (clipId: string) => void;
  onUpdateStreamerPolicies: (policies: StreamerPolicyEntry[]) => Promise<void>;
  onNotify?: (type: "success" | "error", message: string) => void;
}

function MediaThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="w-20 h-12 rounded-sm bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
        <Film className="w-4 h-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-20 h-12 rounded-sm object-cover bg-slate-200 dark:bg-slate-900 shrink-0 border border-[#D9DEE7] dark:border-[#262B37]"
    />
  );
}

export function IngestDeck({
  clips,
  config,
  uiMode,
  researchOpportunities,
  opportunityDiscovery,
  knowledgeAcquisition,
  isResearching,
  isDiscoveringOpportunities = false,
  isCrawlingKnowledge = false,
  isBuildingFaceless,
  selectedClipId,
  auditingClipId,
  generatingHooksClipId,
  isScanning,
  isBatchRunning,
  onSelectClip,
  onScanRadar,
  onRunResearch,
  onRunOpportunityDiscovery,
  onCreateClipFromDiscoveredTopic,
  onSaveDiscoveredTopicToResearch,
  onUpdateKnowledgeConfig,
  onRunKnowledgeCrawl,
  onCreateClipFromOpportunity,
  onBuildFacelessShort,
  onAuditClip,
  onGenerateHooks,
  onOpenInStudio,
  onBatchAction,
  onAddClip,
  onDeleteClip,
  onUpdateStreamerPolicies,
  onNotify,
}: IngestDeckProps) {
  const [deckMode, setDeckMode] = useState<"discovery" | "research" | "faceless" | "bin">(
    uiMode === "easy" ? "discovery" : "bin"
  );
  const [researchFocus, setResearchFocus] = useState(
    "High-RPM viral short-form opportunities across Gaming, AI/Tech, Podcasts & Faceless Docs"
  );
  const [nicheFilter, setNicheFilter] = useState<"all" | ContentNiche>("all");
  const [originFilter, setOriginFilter] = useState<"all" | "knowledge-acquisition" | "manual">("all");
  const [showAddFeedForm, setShowAddFeedForm] = useState(false);
  const [showCrawlHistory, setShowCrawlHistory] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState<KnowledgeSourceFeed["category"]>("creator-newsletter");
  const [statusFilter, setStatusFilter] = useState<"all" | QaStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buildingOppId, setBuildingOppId] = useState<string | null>(null);

  // Faceless Story & Split-Loop Studio form
  const [facelessTopic, setFacelessTopic] = useState("");
  const [facelessNiche, setFacelessNiche] = useState<ContentNiche>("tech-ai");
  const [facelessStyle, setFacelessStyle] = useState<
    "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop"
  >("authority-tech");
  const [facelessSourceText, setFacelessSourceText] = useState("");

  const [newPolicyHandle, setNewPolicyHandle] = useState("");
  const [newPolicyStatus, setNewPolicyStatus] = useState<"allow" | "opt-out">("allow");
  const [newPolicyNote, setNewPolicyNote] = useState("");

  const [formState, setFormState] = useState({
    title: "",
    streamerName: "",
    sourcePlatform: "Twitch" as SourcePlatform,
    sourceUrl: "",
    gameCategory: config.targetGames.find((g) => g.enabled)?.name || "Grand Theft Auto VI",
    niche: "gaming" as ContentNiche,
    views: 4200,
    ageMinutes: 35,
    durationSec: 28,
    duplicateCrossPosts: 0,
    transcript: "",
  });

  const filteredClips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clips.filter((clip) => {
      if (statusFilter !== "all" && clip.qaStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        clip.title.toLowerCase().includes(q) ||
        clip.streamerName.toLowerCase().includes(q) ||
        clip.gameCategory.toLowerCase().includes(q)
      );
    });
  }, [clips, statusFilter, searchQuery]);

  // Content deduplication fingerprint scan across media bin
  const duplicateAlerts = useMemo(() => {
    const flagged = new Set<string>();
    for (let i = 0; i < clips.length; i++) {
      for (let j = i + 1; j < clips.length; j++) {
        if (computeTitleSimilarity(clips[i].title, clips[j].title) >= 0.48) {
          flagged.add(clips[i].id);
          flagged.add(clips[j].id);
        }
      }
    }
    return flagged;
  }, [clips]);

  const inspectedClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || filteredClips[0] || clips[0],
    [clips, filteredClips, selectedClipId]
  );

  const stats = useMemo(() => {
    const approved = clips.filter((c) => c.qaStatus === "approved").length;
    const pending = clips.filter((c) => c.qaStatus === "pending").length;
    const dmcaFlagged = clips.filter((c) => c.qaResult && c.qaResult.dmcaMusicRisk !== "none").length;
    return { approved, pending, dmcaFlagged };
  }, [clips]);

  function toggleChecked(id: string) {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    const visibleIds = filteredClips.map((c) => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));
    setCheckedIds(allSelected ? [] : visibleIds);
  }

  async function runBatch(action: "approve" | "queue" | "delete" | "audit") {
    if (checkedIds.length === 0) return;
    await onBatchAction(checkedIds, action);
    setCheckedIds([]);
  }

  /**
   * Bulk Metadata Export: downloads selected clips' transcripts, hook variants,
   * captions, QA verdicts, and DMCA flags as a clean JSON file.
   */
  function handleBulkMetadataExport(targetIds?: string[]) {
    const ids = targetIds && targetIds.length > 0 ? targetIds : checkedIds.length > 0 ? checkedIds : filteredClips.map((c) => c.id);
    const exportClips = clips.filter((c) => ids.includes(c.id));
    if (exportClips.length === 0) {
      onNotify?.("error", "Select at least one clip to export metadata.");
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      projectName: config.projectName,
      clipCount: exportClips.length,
      clips: exportClips.map((clip) => ({
        id: clip.id,
        title: clip.title,
        gameCategory: clip.gameCategory,
        streamerName: clip.streamerName,
        streamerHandle: clip.streamerHandle,
        sourcePlatform: clip.sourcePlatform,
        sourceUrl: clip.sourceUrl,
        durationSec: clip.durationSec,
        views: clip.views,
        qaStatus: clip.qaStatus,
        activeLocale: clip.activeLocale,
        transcript: clip.transcript,
        hookVariants: clip.hookVariants,
        activeHookVariantId: clip.activeHookVariantId || null,
        activeHookBanner: clip.layout.hookBannerText,
        captions: clip.captions,
        localizations: clip.localizations,
        qaSummary: clip.qaResult
          ? {
              detectedGame: clip.qaResult.detectedGame,
              dmcaMusicRisk: clip.qaResult.dmcaMusicRisk,
              recommendedHookStartSec: clip.qaResult.recommendedHookStartSec,
              tiktokCaption: clip.qaResult.tiktokCaption,
              reelsCaption: clip.qaResult.reelsCaption,
              shortsTitle: clip.qaResult.shortsTitle,
            }
          : null,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipforge-metadata-${exportClips.length}clips-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("success", `Exported transcripts & hook variants for ${exportClips.length} clip(s) to JSON.`);
  }

  async function handleSubmitNewClip(e: React.FormEvent) {
    e.preventDefault();
    if (!formState.title.trim() || !formState.streamerName.trim()) return;
    setSubmitting(true);
    try {
      await onAddClip(formState);
      setShowAddModal(false);
      setFormState({
        title: "",
        streamerName: "",
        sourcePlatform: "Twitch",
        sourceUrl: "",
        gameCategory: config.targetGames.find((g) => g.enabled)?.name || "Grand Theft Auto VI",
        niche: "gaming",
        views: 4200,
        ageMinutes: 35,
        durationSec: 28,
        duplicateCrossPosts: 0,
        transcript: "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!newPolicyHandle.trim()) return;
    const formatted = newPolicyHandle.startsWith("@") ? newPolicyHandle.trim() : `@${newPolicyHandle.trim()}`;
    const next: StreamerPolicyEntry[] = [
      { handle: formatted, status: newPolicyStatus, note: newPolicyNote.trim() || "Configured in Ingest Deck" },
      ...config.streamerPolicies.filter((p) => p.handle.toLowerCase() !== formatted.toLowerCase()),
    ];
    await onUpdateStreamerPolicies(next);
    setNewPolicyHandle("");
    setNewPolicyNote("");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Research vs. Media Bin Switcher */}
      <div className="px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDeckMode("discovery")}
            className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              deckMode === "discovery"
                ? "text-[#0F172A] dark:text-[#F1F5F9]"
                : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>
              Opportunity Discovery ({opportunityDiscovery?.topics?.length || 0})
            </span>
            {deckMode === "discovery" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDeckMode("research")}
            className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              deckMode === "research"
                ? "text-[#0F172A] dark:text-[#F1F5F9]"
                : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Research: What to Make ({researchOpportunities.length})</span>
            {deckMode === "research" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDeckMode("faceless")}
            className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              deckMode === "faceless"
                ? "text-[#0F172A] dark:text-[#F1F5F9]"
                : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Faceless Story Builder</span>
            {deckMode === "faceless" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDeckMode("bin")}
            className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              deckMode === "bin"
                ? "text-[#0F172A] dark:text-[#F1F5F9]"
                : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Media Bin &amp; QA ({clips.length})</span>
            {deckMode === "bin" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
            )}
          </button>
        </div>

        <span className="hidden xl:inline text-[11px] font-mono text-slate-500">
          Google Search Gap Discovery · Multi-Niche Intake · Faceless Studio
        </span>
      </div>

      {deckMode === "discovery" ? (
        <OpportunityDiscoveryPanel
          clips={clips}
          discovery={opportunityDiscovery}
          isDiscovering={isDiscoveringOpportunities}
          onRunDiscovery={async (payload) => {
            if (onRunOpportunityDiscovery) {
              await onRunOpportunityDiscovery(payload);
            }
          }}
          onCreateClipFromTopic={async (topic) => {
            if (onCreateClipFromDiscoveredTopic) {
              await onCreateClipFromDiscoveredTopic(topic);
            }
          }}
          onSaveTopicToResearch={async (topicId) => {
            if (onSaveDiscoveredTopicToResearch) {
              await onSaveDiscoveredTopicToResearch(topicId);
            }
          }}
          onOpenClipInStudio={onOpenInStudio}
        />
      ) : deckMode === "faceless" ? (
        <div className="flex-1 bg-[#F6F7F9] dark:bg-[#0A0B0E] p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-5 text-xs">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Editorial Faceless Story &amp; Split-Loop Short Builder
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Built to outperform generic &ldquo;brainrot&rdquo; generators: pick an authority format, paste a topic, Reddit debate, or news angle, and Gemini generates a 28s spoken script, timed kinetic captions, B-Roll cutaways, and routes it directly into the Studio Voiceover Engine with zero DMCA risk.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  { id: "authority-tech", title: "Authority Breakdown", desc: "Clean 16:9 blur + broadcast captions for AI/Finance" },
                  { id: "reddit-debate", title: "Reddit / X Debate", desc: "Split-stack storytelling with punchy tension hooks" },
                  { id: "mystery-doc", title: "60s Micro-Doc", desc: "Suspense music bed + HUD data callouts" },
                  { id: "split-loop", title: "Split-Screen Loop", desc: "Kinetic captions + retention visual bottom deck" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFacelessStyle(m.id)}
                  className={`p-3 rounded-sm border text-left space-y-1 transition-colors ${
                    facelessStyle === m.id
                      ? "border-[#E1392B] bg-[#E1392B]/5"
                      : "border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720]"
                  }`}
                >
                  <div className="font-display font-bold text-[#0F172A] dark:text-[#F1F5F9]">{m.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.desc}</div>
                </button>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!facelessTopic.trim()) return;
                await onBuildFacelessShort({
                  topic: facelessTopic,
                  niche: facelessNiche,
                  facelessStyle,
                  sourceText: facelessSourceText,
                });
                setFacelessTopic("");
                setFacelessSourceText("");
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Topic, Headline, or Story Hook</label>
                  <input
                    type="text"
                    required
                    value={facelessTopic}
                    onChange={(e) => setFacelessTopic(e.target.value)}
                    placeholder="e.g. How running Gemma 4 2B on a home PC cuts AI automation costs to $0"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0D0F14]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Target Niche</label>
                  <select
                    value={facelessNiche}
                    onChange={(e) => setFacelessNiche(e.target.value as ContentNiche)}
                    className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0D0F14]"
                  >
                    <option value="tech-ai">AI &amp; Tech ($3.40 RPM)</option>
                    <option value="finance">Finance ($3.80 RPM)</option>
                    <option value="faceless-doc">Faceless Micro-Doc ($2.80 RPM)</option>
                    <option value="podcasts">Creator / Podcast Debate ($2.25 RPM)</option>
                    <option value="gaming">Gaming Deep Dive ($0.95 RPM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Optional Source Thread, Reddit Post, or Bullet Facts
                </label>
                <textarea
                  rows={4}
                  value={facelessSourceText}
                  onChange={(e) => setFacelessSourceText(e.target.value)}
                  placeholder="Paste key stats, quotes, or a Reddit/X thread so the script stays grounded in real specifics..."
                  className="w-full p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0D0F14]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">Presets:</span>
                  {[
                    "Why 2B local AI models on Windows PCs are replacing $200/mo SaaS stacks",
                    "The $40M decimal-point glitch that broke an MMO economy in 11 minutes",
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setFacelessTopic(idea)}
                      className="px-2 py-0.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] text-slate-600 dark:text-slate-300 hover:border-[#E1392B]"
                    >
                      {idea.slice(0, 44)}...
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isBuildingFaceless || !facelessTopic.trim()}
                  className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  {isBuildingFaceless ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>{isBuildingFaceless ? "Building Faceless Short..." : "Build & Open in Studio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : deckMode === "research" ? (
        <div className="flex-1 bg-[#F6F7F9] dark:bg-[#0A0B0E] p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Live Multi-Niche Research Command Bar */}
          <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Data-Driven Opportunity Finder (Research is King)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Combines live Google Search velocity with your fleet&rsquo;s RPM &amp; watch-time winners to tell you what to clip or narrate next.
                </p>
              </div>
              <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
                {(
                  [
                    { id: "all", label: "All Niches" },
                    { id: "gaming", label: "Gaming" },
                    { id: "tech-ai", label: "AI & Tech" },
                    { id: "podcasts", label: "Podcasts" },
                    { id: "finance", label: "Finance" },
                    { id: "faceless-doc", label: "Faceless Doc" },
                  ] as const
                ).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNicheFilter(n.id)}
                    className={`px-2 py-1 rounded-xs font-medium ${
                      nicheFilter === n.id
                        ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
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
                placeholder="Focus research (e.g., GTA 6 leaks, Open-source AI launches, high-RPM podcast clips)..."
                className="flex-1 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] text-xs"
              />
              <button
                type="submit"
                disabled={isResearching}
                className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isResearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                <span>{isResearching ? "Scanning Web..." : "Run Live Research Scan"}</span>
              </button>
            </form>
          </div>

          {/* Recurring Background Knowledge Acquisition Task — Creator Economy Newsletters & AI-Tool Crawler */}
          {knowledgeAcquisition && (
            <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#E1392B]" />
                    <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      Background Knowledge Acquisition Task · Auto-Drafted Opportunities
                    </h3>
                    <span className="font-mono text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                      {knowledgeAcquisition.enabled ? `ACTIVE · ${knowledgeAcquisition.cadence}` : "PAUSED"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crawls top creator economy newsletters &amp; AI-tool trackers on schedule and automatically drafts ready-to-build Opportunity cards below.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {onUpdateKnowledgeConfig && (
                    <>
                      <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={knowledgeAcquisition.enabled}
                          onChange={(e) => onUpdateKnowledgeConfig({ enabled: e.target.checked })}
                          className="accent-[#E1392B]"
                        />
                        <span>Recurring</span>
                      </label>

                      <select
                        aria-label="Knowledge Acquisition crawl cadence"
                        value={knowledgeAcquisition.cadence}
                        onChange={(e) =>
                          onUpdateKnowledgeConfig({ cadence: e.target.value as KnowledgeCrawlCadence })
                        }
                        className="h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-xs"
                      >
                        <option value="manual">Manual</option>
                        <option value="every-1h">Every 1h</option>
                        <option value="every-6h">Every 6h</option>
                        <option value="daily">Daily</option>
                      </select>
                    </>
                  )}

                  {onRunKnowledgeCrawl && (
                    <button
                      type="button"
                      disabled={isCrawlingKnowledge}
                      onClick={() => onRunKnowledgeCrawl(researchFocus)}
                      className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      {isCrawlingKnowledge ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-[#E1392B]" />
                      )}
                      <span>{isCrawlingKnowledge ? "Crawling Feeds..." : "Crawl Newsletters & Draft Cards"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tracked Newsletter & AI-Tool Feed Toggles + Custom Feed Adder */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {knowledgeAcquisition.feeds.map((feed) => (
                    <button
                      key={feed.id}
                      type="button"
                      onClick={() => {
                        if (!onUpdateKnowledgeConfig) return;
                        const nextFeeds = knowledgeAcquisition.feeds.map((f) =>
                          f.id === feed.id ? { ...f, enabled: !f.enabled } : f
                        );
                        onUpdateKnowledgeConfig({ feeds: nextFeeds });
                      }}
                      className={`px-2 py-1 rounded-sm border text-[11px] font-mono transition-colors ${
                        feed.enabled
                          ? "border-[#E1392B]/50 bg-[#E1392B]/10 text-[#0F172A] dark:text-[#F1F5F9]"
                          : "border-[#D9DEE7] dark:border-[#252A36] text-slate-400 line-through"
                      }`}
                    >
                      {feed.name}
                    </button>
                  ))}

                  {onUpdateKnowledgeConfig && (
                    <button
                      type="button"
                      onClick={() => setShowAddFeedForm((v) => !v)}
                      className="px-2 py-1 rounded-sm border border-dashed border-[#D9DEE7] dark:border-[#2A303E] text-[11px] font-mono text-slate-500 hover:text-[#E1392B] hover:border-[#E1392B]/50 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Feed</span>
                    </button>
                  )}
                </div>

                {showAddFeedForm && onUpdateKnowledgeConfig && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newFeedName.trim() || !newFeedUrl.trim()) return;
                      const normalizedUrl = /^https?:\/\//i.test(newFeedUrl.trim())
                        ? newFeedUrl.trim()
                        : `https://${newFeedUrl.trim()}`;
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
                    className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-wrap items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="Newsletter / AI Tracker name (e.g., Superhuman AI)"
                      className="flex-1 min-w-[180px] h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-white dark:bg-[#111318] text-xs"
                    />
                    <input
                      type="text"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 min-w-[180px] h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-white dark:bg-[#111318] text-xs font-mono"
                    />
                    <select
                      aria-label="Custom feed category"
                      value={newFeedCategory}
                      onChange={(e) => setNewFeedCategory(e.target.value as KnowledgeSourceFeed["category"])}
                      className="h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-white dark:bg-[#111318] text-xs"
                    >
                      <option value="creator-newsletter">Creator Newsletter</option>
                      <option value="ai-tools">AI Tools Tracker</option>
                      <option value="platform-changelog">Platform Changelog</option>
                    </select>
                    <button
                      type="submit"
                      className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold whitespace-nowrap"
                    >
                      Save Source
                    </button>
                  </form>
                )}
              </div>

              {/* Latest Background Run Summary + Expandable Crawl Log */}
              <div className="pt-2 border-t border-[#ECEFF3] dark:border-[#1E222C] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3 h-3 text-[#E1392B]" />
                    <span>
                      Runs: {knowledgeAcquisition.totalRuns} · Auto-Drafted: {knowledgeAcquisition.totalDrafted} · Next:{" "}
                      {knowledgeAcquisition.nextRunAt
                        ? new Date(knowledgeAcquisition.nextRunAt).toLocaleTimeString()
                        : "Manual"}
                    </span>
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    {knowledgeAcquisition.recentRuns[0] && (
                      <span className="truncate max-w-md text-slate-600 dark:text-slate-300">
                        Latest: {knowledgeAcquisition.recentRuns[0].headlineSummary}
                      </span>
                    )}
                    {knowledgeAcquisition.recentRuns.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCrawlHistory((v) => !v)}
                        className="text-[#E1392B] hover:underline whitespace-nowrap shrink-0"
                      >
                        {showCrawlHistory ? "Hide Log" : `History (${knowledgeAcquisition.recentRuns.length})`}
                      </button>
                    )}
                  </div>
                </div>

                {showCrawlHistory && knowledgeAcquisition.recentRuns.length > 0 && (
                  <div className="border-t border-[#ECEFF3] dark:border-[#1E222C] pt-2 space-y-1.5 text-[11px] font-mono">
                    {knowledgeAcquisition.recentRuns.slice(0, 5).map((run) => (
                      <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-2xl">
                          [{run.trigger}] {run.headlineSummary} ({run.opportunitiesDrafted} cards)
                        </span>
                        <span className="tabular-nums shrink-0">
                          {new Date(run.ranAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Origin Filter Row for Opportunity Cards */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
              {(
                [
                  { id: "all", label: `All Opportunities (${researchOpportunities.length})` },
                  {
                    id: "knowledge-acquisition",
                    label: `Auto-Drafted by Crawler (${
                      researchOpportunities.filter((o) => o.origin === "knowledge-acquisition").length
                    })`,
                  },
                  {
                    id: "manual",
                    label: `Manual & Seed (${
                      researchOpportunities.filter((o) => o.origin !== "knowledge-acquisition").length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOriginFilter(tab.id)}
                  className={`px-3 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                    originFilter === tab.id
                      ? "bg-white dark:bg-[#111318] text-[#0F172A] dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunity Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {researchOpportunities
              .filter((o) => nicheFilter === "all" || o.niche === nicheFilter)
              .filter((o) =>
                originFilter === "all"
                  ? true
                  : originFilter === "knowledge-acquisition"
                    ? o.origin === "knowledge-acquisition"
                    : o.origin !== "knowledge-acquisition"
              )
              .map((opp) => (
                <article
                  key={opp.id}
                  className="p-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] flex flex-col justify-between gap-4"
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
                        {opp.outlierMultiplier ? `${opp.outlierMultiplier.toFixed(1)}× Outlier · ` : `${(opp.viralScore / 10).toFixed(1)}× Outlier · `}
                        Est. ${opp.estimatedRpmUsd.toFixed(2)} RPM · Score {opp.viralScore}/99
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                      {opp.topic}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{opp.whyNow}</p>

                    <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#0A0B0E] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <span>HOOK BLUEPRINT</span>
                        <span>
                          Competition: <strong className="uppercase">{opp.competitionLevel}</strong> · Voice:{" "}
                          <strong>{opp.recommendedVoice}</strong>
                        </span>
                      </div>
                      <div className="font-display font-bold text-[#E1392B]">{opp.hookBlueprint}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                        &ldquo;{opp.suggestedScript}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ECEFF3] dark:border-[#1E222C]">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>Template: {opp.recommendedTemplate}</span>
                      {opp.sourceUrl && (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#E1392B] hover:underline"
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
                      className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      {buildingOppId === opp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-[#E1392B]" />
                      )}
                      <span>Build Clip &amp; Voiceover Brief</span>
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      ) : (
      <>
      {/* Broadcast Media Bin Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37]">
            {(["all", "pending", "approved", "review", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors whitespace-nowrap capitalize ${
                  statusFilter === tab
                    ? "bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F1115] dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bin..."
              className="h-8 pl-8 pr-3 w-44 sm:w-52 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] text-xs text-[#0F1115] dark:text-[#EEF0F4] placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
            />
          </div>

          <div className="hidden xl:flex items-center gap-3 pl-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>{clips.length} in bin</span>
            <span aria-hidden="true">/</span>
            <span className="text-emerald-600 dark:text-emerald-400">{stats.approved} cleared</span>
            <span aria-hidden="true">/</span>
            <span>{stats.pending} pending</span>
            <span aria-hidden="true">/</span>
            <span className={stats.dmcaFlagged > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
              {stats.dmcaFlagged} DMCA flags
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleBulkMetadataExport()}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileJson className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>
              {checkedIds.length > 0 ? `Export JSON (${checkedIds.length})` : "Export Bin JSON"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Policy ({config.streamerPolicies.length})</span>
          </button>

          <button
            type="button"
            onClick={onScanRadar}
            disabled={isScanning}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Pull Radar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Clip</span>
          </button>
        </div>
      </div>

      {/* Batch Selection Action Strip (includes Bulk Metadata JSON Export) */}
      {checkedIds.length > 0 && (
        <div className="px-6 py-2 border-b border-[#E1392B]/30 bg-[#E1392B]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-mono font-medium text-[#0F1115] dark:text-[#EEF0F4]">
            {checkedIds.length} clip(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkMetadataExport(checkedIds)}
              className="h-7 px-2.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] font-semibold inline-flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>Export Transcripts &amp; Hooks JSON</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("audit")}
              className="h-7 px-2.5 rounded-sm bg-[#E1392B] text-white font-medium inline-flex items-center gap-1 disabled:opacity-50"
            >
              {isBatchRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Batch Gemini QA</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("queue")}
              className="h-7 px-2.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-slate-800 dark:text-slate-100 font-medium inline-flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Queue Ready</span>
            </button>
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => runBatch("delete")}
              className="h-7 px-2.5 rounded-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCheckedIds([])}
              className="h-7 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 2-Pane Split: Left Media Bin (65%) + Right Live Clip Inspector (35%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-112px)]">
        <div className="lg:col-span-8 border-r border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0A0B0E] overflow-x-auto">
          {filteredClips.length === 0 ? (
            <div className="p-14 text-center space-y-2">
              <p className="text-sm font-medium text-[#0F1115] dark:text-[#EEF0F4]">Media bin is empty for this filter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pull fresh clips from Twitch Radar or ingest a custom clip URL.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9DEE7] dark:border-[#222631] text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-[#F6F7F9] dark:bg-[#111318]">
                  <th className="py-2.5 pl-4 pr-2 w-8">
                    <button
                      type="button"
                      onClick={toggleAllVisible}
                      aria-label="Select all visible clips"
                      className="text-slate-500 hover:text-[#0F1115] dark:hover:text-white"
                    >
                      {filteredClips.length > 0 && filteredClips.every((c) => checkedIds.includes(c.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#E1392B]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Clip / Creator</th>
                  <th className="py-2.5 px-3 text-right">Velocity</th>
                  <th className="py-2.5 px-3 text-right">Hooks</th>
                  <th className="py-2.5 px-3">DMCA</th>
                  <th className="py-2.5 px-3">QA Gate</th>
                  <th className="py-2.5 pr-4 pl-2 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1A1D26] text-sm">
                {filteredClips.map((clip) => {
                  const isSelected = inspectedClip?.id === clip.id;
                  const isChecked = checkedIds.includes(clip.id);
                  const vel = computeViewsPerMinute(clip.views, clip.ageMinutes);
                  const outlier = computeOutlierMultiplier(clip.views, clip.channelBaselineViews);
                  const sat = computeSaturationLevel(clip.duplicateCrossPosts, config.qaRules.maxExistingCrossPosts);
                  const dmca = clip.qaResult?.dmcaMusicRisk || "none";
                  const hasDupAlert = duplicateAlerts.has(clip.id);

                  return (
                    <tr
                      key={clip.id}
                      onClick={() => onSelectClip(clip.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#ECEFF3]/80 dark:bg-[#161922]"
                          : "hover:bg-[#F6F7F9] dark:hover:bg-[#11131A]"
                      }`}
                    >
                      <td
                        className="py-3 pl-4 pr-2 align-middle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChecked(clip.id);
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#E1392B]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <MediaThumb src={clip.gameplayThumbnail} alt={clip.title} />
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm text-[#0F1115] dark:text-[#EEF0F4] line-clamp-1">
                              {clip.title}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{clip.streamerHandle}</span>
                              <span aria-hidden="true">·</span>
                              <span>{clip.sourcePlatform}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{formatCompactNumber(clip.views)}</span>
                              <span aria-hidden="true">·</span>
                              <span className={`font-mono tabular-nums font-medium ${outlier >= 3 ? "text-emerald-600 dark:text-emerald-400" : outlier >= 1.8 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {outlier.toFixed(1)}× outlier
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{clip.durationSec}s</span>
                              {sat === "Saturated" && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-rose-500 font-medium">{clip.duplicateCrossPosts}x rival copies</span>
                                </>
                              )}
                              {hasDupAlert && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-500 inline-flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    Similar in bin
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-[#0F1115] dark:text-slate-200 whitespace-nowrap">
                        {vel}/m
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {clip.hookVariants.length}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <span
                          className={
                            dmca === "high"
                              ? "text-rose-600 dark:text-rose-400 font-medium"
                              : dmca === "possible"
                                ? "text-amber-600 dark:text-amber-400 font-medium"
                                : "text-slate-500 dark:text-slate-400"
                          }
                        >
                          {dmca === "high" ? "Music Risk" : dmca === "possible" ? "Check Audio" : "Clear"}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs font-medium capitalize">
                        <span
                          className={
                            clip.qaStatus === "approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : clip.qaStatus === "rejected"
                                ? "text-rose-600 dark:text-rose-400"
                                : clip.qaStatus === "review"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-500 dark:text-slate-400"
                          }
                        >
                          {clip.qaStatus}
                        </span>
                      </td>

                      <td className="py-3 pr-4 pl-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenInStudio(clip.id)}
                          className="h-7 px-2.5 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Clapperboard className="w-3 h-3" />
                          <span>Cut</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Live Clip Inspector Pane */}
        <aside className="lg:col-span-4 bg-[#F6F7F9] dark:bg-[#0F1117] p-5 space-y-5 overflow-y-auto">
          {inspectedClip ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{inspectedClip.id}</span>
                  <span>{inspectedClip.layout.template}</span>
                </div>
                <h2 className="font-display text-base font-bold text-[#0F1115] dark:text-[#EEF0F4] leading-snug">
                  {inspectedClip.title}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span>{inspectedClip.streamerHandle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedClip.gameCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{inspectedClip.layout.targetLufs} LUFS</span>
                </div>
              </div>

              <div className="relative aspect-video rounded-sm overflow-hidden border border-[#D9DEE7] dark:border-[#262B37] bg-black">
                <img
                  src={inspectedClip.gameplayThumbnail}
                  alt={inspectedClip.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between text-[11px] font-mono text-white">
                  <span>{inspectedClip.durationSec}s · {formatCompactNumber(inspectedClip.views)} views</span>
                  <span>Hook @ {inspectedClip.layout.hookStartSec.toFixed(1)}s</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAuditClip(inspectedClip.id)}
                  disabled={auditingClipId === inspectedClip.id}
                  className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] inline-flex items-center justify-center gap-1.5"
                >
                  {auditingClipId === inspectedClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>{inspectedClip.qaResult ? "Re-Run QA" : "Gemini QA + DMCA"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onGenerateHooks(inspectedClip.id)}
                  disabled={generatingHooksClipId === inspectedClip.id}
                  className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] inline-flex items-center justify-center gap-1.5"
                >
                  {generatingHooksClipId === inspectedClip.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>A/B/C Hooks</span>
                </button>
              </div>

              {/* QA & DMCA Readout */}
              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500 dark:text-slate-400">QA &amp; DMCA Audit</span>
                  <span
                    className={`font-semibold capitalize ${
                      inspectedClip.qaStatus === "approved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : inspectedClip.qaStatus === "rejected"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {inspectedClip.qaStatus}
                  </span>
                </div>

                {inspectedClip.qaResult ? (
                  <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>{inspectedClip.qaResult.summaryReason}</p>
                    <div className="pt-2 border-t border-[#D9DEE7]/70 dark:border-[#222631] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Detected Title</span>
                        <span className="font-medium text-[#0F1115] dark:text-slate-100">{inspectedClip.qaResult.detectedGame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DMCA Audio Risk</span>
                        <span className="font-medium capitalize">{inspectedClip.qaResult.dmcaMusicRisk}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Not audited yet. Run Gemini QA to verify authentic footage, copyrighted music risk, and optimal hook timestamp.
                  </p>
                )}
              </div>

              {/* Hook Variants Summary */}
              {inspectedClip.hookVariants.length > 0 && (
                <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2 text-xs">
                  <div className="font-medium text-slate-500 dark:text-slate-400">
                    Hook Variants ({inspectedClip.hookVariants.length})
                  </div>
                  <div className="space-y-1.5">
                    {inspectedClip.hookVariants.map((hv) => (
                      <div key={hv.id} className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]">
                        <div className="font-mono text-[11px] font-semibold text-[#0F1115] dark:text-[#EEF0F4]">
                          {hv.bannerText}
                        </div>
                        <div className="text-[11px] text-slate-500">{hv.label} · {hv.predictedHoldLift}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Snippet */}
              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5 text-xs">
                <div className="font-medium text-slate-500 dark:text-slate-400">Source Transcript</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{inspectedClip.transcript}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInStudio(inspectedClip.id)}
                  className="flex-1 h-9 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Open in Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMetadataExport([inspectedClip.id])}
                  title="Download this clip's transcript & hook variants JSON"
                  aria-label="Export clip JSON"
                  className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-600 dark:text-slate-300 hover:text-[#E1392B] flex items-center justify-center"
                >
                  <FileJson className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteClip(inspectedClip.id)}
                  aria-label="Delete selected clip"
                  className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-500 hover:text-rose-500 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">Select a clip from the media bin to inspect.</div>
          )}
        </aside>
      </div>
      </>
      )}

      {/* Add Clip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">Ingest Source Clip</h2>
              <button type="button" onClick={() => setShowAddModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitNewClip} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Clip Title</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g., Last-Second Helicopter Stunt Through Pier"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Streamer Name</label>
                  <input
                    type="text"
                    required
                    value={formState.streamerName}
                    onChange={(e) => setFormState((s) => ({ ...s, streamerName: e.target.value }))}
                    placeholder="KadeVelo"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Source Platform</label>
                  <select
                    value={formState.sourcePlatform}
                    onChange={(e) => setFormState((s) => ({ ...s, sourcePlatform: e.target.value as SourcePlatform }))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  >
                    <option value="Twitch">Twitch</option>
                    <option value="Kick">Kick</option>
                    <option value="YouTube Live">YouTube Live</option>
                    <option value="YouTube Podcast">YouTube Podcast</option>
                    <option value="Reddit">Reddit</option>
                    <option value="X / News">X / News</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Content Niche</label>
                  <select
                    value={formState.niche}
                    onChange={(e) => setFormState((s) => ({ ...s, niche: e.target.value as ContentNiche }))}
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="tech-ai">AI &amp; Tech</option>
                    <option value="podcasts">Podcasts</option>
                    <option value="finance">Finance</option>
                    <option value="sports-irl">Sports &amp; IRL</option>
                    <option value="faceless-doc">Faceless Doc</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Topic / Game Category</label>
                  <input
                    type="text"
                    value={formState.gameCategory}
                    onChange={(e) => setFormState((s) => ({ ...s, gameCategory: e.target.value }))}
                    placeholder="e.g., Grand Theft Auto VI or AI News"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Views</label>
                  <input type="number" min={0} value={formState.views} onChange={(e) => setFormState((s) => ({ ...s, views: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (s)</label>
                  <input type="number" min={5} max={180} value={formState.durationSec} onChange={(e) => setFormState((s) => ({ ...s, durationSec: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Rival Copies</label>
                  <input type="number" min={0} value={formState.duplicateCrossPosts} onChange={(e) => setFormState((s) => ({ ...s, duplicateCrossPosts: Number(e.target.value) }))} className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono tabular-nums" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Spoken Transcript</label>
                <textarea rows={3} value={formState.transcript} onChange={(e) => setFormState((s) => ({ ...s, transcript: e.target.value }))} placeholder="Paste dialogue for Gemini QA, DMCA screening, and hook extraction..." className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="h-9 px-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37]">Cancel</button>
                <button type="submit" disabled={submitting} className="h-9 px-4 rounded-sm bg-[#E1392B] text-white font-semibold">{submitting ? "Adding..." : "Add to Bin"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creator Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Creator Allowlist &amp; Opt-Out Ledger
              </h2>
              <button type="button" onClick={() => setShowPolicyModal(false)} aria-label="Close policy modal" className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Opted-out creators are automatically skipped by both Twitch Radar scans and GitHub Actions workers.
              </p>

              <form onSubmit={handleAddPolicy} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  required
                  value={newPolicyHandle}
                  onChange={(e) => setNewPolicyHandle(e.target.value)}
                  placeholder="@handle"
                  className="col-span-4 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E] font-mono"
                />
                <select
                  value={newPolicyStatus}
                  onChange={(e) => setNewPolicyStatus(e.target.value as "allow" | "opt-out")}
                  className="col-span-3 h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                >
                  <option value="allow">Whitelist</option>
                  <option value="opt-out">Opt-Out</option>
                </select>
                <input
                  type="text"
                  value={newPolicyNote}
                  onChange={(e) => setNewPolicyNote(e.target.value)}
                  placeholder="Permission note"
                  className="col-span-3 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0A0B0E]"
                />
                <button type="submit" className="col-span-2 h-8 rounded-sm bg-[#E1392B] text-white font-semibold">
                  Add
                </button>
              </form>

              <div className="divide-y divide-[#ECEFF3] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] rounded-sm max-h-60 overflow-y-auto">
                {config.streamerPolicies.map((p) => (
                  <div key={p.handle} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{p.handle}</span>
                        <span className={p.status === "opt-out" ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}>
                          {p.status === "opt-out" ? "Opted Out" : "Whitelisted"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{p.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStreamerPolicies(config.streamerPolicies.filter((x) => x.handle !== p.handle))
                      }
                      className="text-slate-400 hover:text-rose-500"
                      aria-label={`Remove ${p.handle}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
