import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Film,
  Laugh,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clapperboard,
  Wand2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type {
  AssetDiscoverySnapshot,
  ClipItem,
  ContentNiche,
  DiscoveredAsset,
  DiscoveredAssetType,
} from "../types";

interface AssetDiscoveryViewProps {
  clips: ClipItem[];
  selectedClipId: string;
  assetDiscovery?: AssetDiscoverySnapshot;
  savedAssets: DiscoveredAsset[];
  isDiscoveringAssets: boolean;
  isInjectingAsset: boolean;
  onSelectClip: (clipId: string) => void;
  onDiscoverAssets: (payload: {
    query: string;
    niche: ContentNiche | "all";
    filter: "all" | DiscoveredAssetType;
  }) => Promise<void>;
  onSaveAsset: (asset: DiscoveredAsset) => Promise<void>;
  onRemoveSavedAsset: (assetId: string) => Promise<void>;
  onAutoInjectAsset: (
    clipId: string,
    payload: { asset?: DiscoveredAsset; assetId?: string; mode?: "single" | "auto-blend-pack" }
  ) => Promise<void>;
  onOpenInStudio: (clipId: string) => void;
  onJumpToTemplates: () => void;
}

const NICHE_OPTIONS: Array<{ id: ContentNiche | "all"; label: string }> = [
  { id: "all", label: "All Niches" },
  { id: "gaming", label: "Gaming" },
  { id: "tech-ai", label: "AI & Tech" },
  { id: "finance", label: "Finance" },
  { id: "podcasts", label: "Podcasts" },
  { id: "faceless-doc", label: "Faceless Doc" },
  { id: "sports-irl", label: "Sports & IRL" },
];

const QUICK_QUERIES: Array<{ label: string; query: string; niche: ContentNiche | "all" }> = [
  {
    label: "GTA / Neon City + Shock Memes",
    query: "public domain neon city car chase footage and trending shock reaction meme templates",
    niche: "gaming",
  },
  {
    label: "AI Server / Tech B-Roll + Galaxy Brain",
    query: "royalty free AI GPU server room data center stock footage and trending tech comparison meme templates",
    niche: "tech-ai",
  },
  {
    label: "Finance Charts + Parabolic ROI Memes",
    query: "public domain stock market trading floor footage and trending finance chart meme templates",
    niche: "finance",
  },
  {
    label: "NASA / Mystery Doc CC0 Footage",
    query: "NASA public domain rocket launch archival science footage and suspense reaction templates",
    niche: "faceless-doc",
  },
];

export function AssetDiscoveryView({
  clips,
  selectedClipId,
  assetDiscovery,
  savedAssets,
  isDiscoveringAssets,
  isInjectingAsset,
  onSelectClip,
  onDiscoverAssets,
  onSaveAsset,
  onRemoveSavedAsset,
  onAutoInjectAsset,
  onOpenInStudio,
  onJumpToTemplates,
}: AssetDiscoveryViewProps) {
  const activeClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || clips[0],
    [clips, selectedClipId]
  );

  const [query, setQuery] = useState(
    assetDiscovery?.query || "public domain neon city & AI server stock footage + trending reaction meme templates"
  );
  const [niche, setNiche] = useState<ContentNiche | "all">(assetDiscovery?.niche || "all");
  const [filter, setFilter] = useState<"all" | DiscoveredAssetType>(assetDiscovery?.filter || "all");
  const [injectingId, setInjectingId] = useState<string | null>(null);
  const [injectedIds, setInjectedIds] = useState<string[]>([]);

  const savedIds = useMemo(() => new Set(savedAssets.map((a) => a.id)), [savedAssets]);
  const savedTitles = useMemo(() => new Set(savedAssets.map((a) => a.title.toLowerCase())), [savedAssets]);

  const visibleAssets = useMemo(() => {
    const list = assetDiscovery?.assets || [];
    if (filter === "all") return list;
    return list.filter((a) => a.assetType === filter);
  }, [assetDiscovery?.assets, filter]);

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isDiscoveringAssets) return;
    await onDiscoverAssets({ query: query.trim(), niche, filter });
  }

  async function handleInjectSingle(asset: DiscoveredAsset) {
    if (!activeClip) return;
    setInjectingId(asset.id);
    try {
      await onAutoInjectAsset(activeClip.id, { asset, mode: "single" });
      setInjectedIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
    } finally {
      setInjectingId(null);
    }
  }

  async function handleAutoBlendPack() {
    if (!activeClip) return;
    setInjectingId("__pack__");
    try {
      await onAutoInjectAsset(activeClip.id, { mode: "auto-blend-pack" });
    } finally {
      setInjectingId(null);
    }
  }

  async function handleDiscoverForActiveClip() {
    if (!activeClip) return;
    const clipQuery = `${activeClip.gameCategory} ${activeClip.title} public domain B-roll stock footage and trending meme cutaway templates`;
    setQuery(clipQuery);
    const clipNiche: ContentNiche | "all" = activeClip.niche || "all";
    setNiche(clipNiche);
    await onDiscoverAssets({ query: clipQuery, niche: clipNiche, filter });
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Sub-Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/75 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <Film className="w-4 h-4 text-[#E1392B]" />
          <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
            Asset Discovery · Public Domain Stock &amp; Trending Meme Templates
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            Google Search Grounded · {visibleAssets.length} discovered · {savedAssets.length} saved
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="font-mono text-[10px] text-slate-500 uppercase">Target Clip</label>
          <select
            aria-label="Target clip for asset auto-injection"
            value={activeClip?.id || ""}
            onChange={(e) => onSelectClip(e.target.value)}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-xs max-w-[240px] truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.brollCues?.length || 0} cues)
              </option>
            ))}
          </select>

          {activeClip && (
            <>
              <button
                type="button"
                onClick={handleAutoBlendPack}
                disabled={isInjectingAsset}
                className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {injectingId === "__pack__" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Auto-Inject Best Pack</span>
              </button>

              <button
                type="button"
                onClick={onJumpToTemplates}
                className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-slate-700 dark:text-slate-200 font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Open B-Roll Deck</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Split: Search & Discovered Grid (8 cols) + Saved Asset Vault & Active Clip Cues (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 flex-1">
        {/* Left: Google Search Bar + Discovered Assets */}
        <section className="xl:col-span-8 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-5">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search public domain stock footage (Pexels, NASA, Pixabay) or trending meme templates..."
                  className="w-full h-10 pl-9 pr-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#E1392B]"
                />
              </div>

              <select
                aria-label="Filter discovery by niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value as ContentNiche | "all")}
                className="h-10 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs"
              >
                {NICHE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isDiscoveringAssets}
                className="h-10 px-4 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {isDiscoveringAssets ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                )}
                <span>{isDiscoveringAssets ? "Searching Web..." : "Search Assets"}</span>
              </button>
            </div>

            {/* Filter & Quick Preset Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center p-0.5 rounded-sm bg-[#F6F7F9] dark:bg-[#111318] border border-[#D9DEE7] dark:border-[#252A36] text-xs">
                {(
                  [
                    { id: "all", label: "All Assets" },
                    { id: "stock-footage", label: "Public Domain Stock" },
                    { id: "meme-template", label: "Meme Templates" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-xs font-medium transition-colors whitespace-nowrap ${
                      filter === tab.id
                        ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                        : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {activeClip && (
                  <button
                    type="button"
                    onClick={handleDiscoverForActiveClip}
                    disabled={isDiscoveringAssets}
                    className="px-2.5 py-1 rounded-sm border border-[#E1392B]/40 text-[#E1392B] hover:bg-[#E1392B]/10 text-[11px] font-medium"
                  >
                    Match Active Clip
                  </button>
                )}
                {QUICK_QUERIES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={isDiscoveringAssets}
                    onClick={async () => {
                      setQuery(preset.query);
                      setNiche(preset.niche);
                      await onDiscoverAssets({ query: preset.query, niche: preset.niche, filter });
                    }}
                    className="px-2 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] text-[11px] text-slate-600 dark:text-slate-300 hover:border-[#E1392B]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Discovered Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {visibleAssets.map((asset) => {
              const isSaved = savedIds.has(asset.id) || savedTitles.has(asset.title.toLowerCase());
              const wasInjected = injectedIds.includes(asset.id);
              const isStock = asset.assetType === "stock-footage";

              return (
                <article
                  key={asset.id}
                  className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide">
                        {isStock ? (
                          <Film className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <Laugh className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                        )}
                        <span className={isStock ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-[#E1392B] font-semibold"}>
                          {isStock ? "PUBLIC DOMAIN STOCK" : "MEME TEMPLATE"}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{asset.recommendedEffect}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                        HEAT {asset.trafficScore}
                      </span>
                    </div>

                    <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                      {asset.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        {asset.license}
                      </span>
                      <span>·</span>
                      <span>{asset.recommendedDurationSec}s</span>
                      <span>·</span>
                      <span>{asset.placementHint}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {asset.blendNote}
                    </p>

                    <div className="font-mono text-[10px] text-slate-500">
                      Source: {asset.sourceName} · Tags: {asset.tags.join(", ")}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={asset.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[#E1392B] inline-flex items-center gap-1"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onSaveAsset(asset)}
                        disabled={isSaved}
                        className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[#E1392B] disabled:opacity-60 inline-flex items-center gap-1"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-emerald-500" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>

                    {activeClip && (
                      <button
                        type="button"
                        onClick={() => handleInjectSingle(asset)}
                        disabled={isInjectingAsset}
                        className="h-7 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center gap-1.5"
                      >
                        {injectingId === asset.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : wasInjected ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        <span>{wasInjected ? "Injected" : "Auto-Inject"}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Grounded Web Sources */}
          {assetDiscovery?.sources && assetDiscovery.sources.length > 0 && (
            <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5">
              <div className="font-mono text-[10px] text-slate-500 uppercase">
                Verified Search Sources ({assetDiscovery.sources.length})
              </div>
              <div className="flex flex-wrap gap-3 text-[11px]">
                {assetDiscovery.sources.map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B] underline-offset-2 hover:underline"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: Saved Vault + Active Clip Injected Cues */}
        <aside className="xl:col-span-4 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-6">
          {/* Saved Asset Vault */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                SAVED ASSET VAULT ({savedAssets.length})
              </div>
              <span className="font-mono text-[10px] text-slate-500">Ready for Auto-Inject</span>
            </div>

            {savedAssets.length === 0 ? (
              <div className="p-4 rounded-sm border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-xs text-slate-500 text-center">
                Save high-traffic public domain clips or meme templates here for instant reuse across your Templates &amp; B-Roll deck.
              </div>
            ) : (
              <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720]">
                {savedAssets.map((item) => (
                  <div key={item.id} className="p-3 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                          {item.title}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {item.assetType === "stock-footage" ? "Stock CC0" : "Meme"} · {item.recommendedEffect} · {item.recommendedDurationSec}s
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSavedAsset(item.id)}
                        aria-label={`Remove ${item.title} from vault`}
                        className="text-slate-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {activeClip && (
                      <div className="flex items-center justify-between pt-1">
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleInjectSingle(item)}
                          disabled={isInjectingAsset}
                          className="font-mono text-[11px] font-semibold text-[#E1392B] hover:underline"
                        >
                          Auto-Inject →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Clip Timeline B-Roll Cues Preview */}
          {activeClip && (
            <div className="space-y-3 pt-4 border-t border-[#D9DEE7] dark:border-[#222631]">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  ACTIVE CLIP CUES ({activeClip.brollCues?.length || 0})
                </div>
                <button
                  type="button"
                  onClick={() => onOpenInStudio(activeClip.id)}
                  className="text-[11px] text-[#E1392B] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Clapperboard className="w-3 h-3" />
                  <span>Open Studio</span>
                </button>
              </div>

              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                {activeClip.title}
              </div>

              {activeClip.brollCues && activeClip.brollCues.length > 0 ? (
                <div className="space-y-2">
                  {activeClip.brollCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#E1392B] font-semibold">
                          {cue.timeSec.toFixed(1)}s · {cue.durationSec}s · {cue.effect}
                        </span>
                        {cue.assetType && (
                          <span className="text-emerald-600 dark:text-emerald-400 uppercase">
                            {cue.assetType === "stock-footage" ? "PD Stock" : "Meme"}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{cue.label}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {cue.promptNote}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-sm border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-xs text-slate-500">
                  No B-Roll or meme assets injected yet. Click &ldquo;Auto-Inject&rdquo; on any card to blend assets seamlessly into this clip.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
