import { useState } from "react";
import {
  Radio,
  RefreshCw,
  Loader2,
  Pin,
  ExternalLink,
  Bot,
  Plus,
  Check,
  Search,
  Flame,
  TrendingUp,
} from "lucide-react";
import type { PipelineConfig, TrendPulseSnapshot, TrendPulseTopic } from "../types";

interface TrendPulseWidgetProps {
  snapshot?: TrendPulseSnapshot;
  config: PipelineConfig;
  isFetching: boolean;
  isDirecting: boolean;
  onFetchTrends: (focus: string) => Promise<void>;
  onTogglePin: (topicId: string) => Promise<void>;
  onTrackGame: (gameName: string) => Promise<void>;
  onDirectTopic: (command: string) => Promise<void>;
}

const FOCUS_PRESETS = [
  "Daily Twitch Gaming",
  "FPS & Esports",
  "GTA & Open World",
  "Indie & Variety Co-op",
];

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function TrendPulseWidget({
  snapshot,
  config,
  isFetching,
  isDirecting,
  onFetchTrends,
  onTogglePin,
  onTrackGame,
  onDirectTopic,
}: TrendPulseWidgetProps) {
  const [focusInput, setFocusInput] = useState(snapshot?.focus || "Daily Twitch Gaming");
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const topics = snapshot?.topics || [];
  const pinnedCount = topics.filter((t) => t.pinnedPriority).length;
  const safeSources = (snapshot?.sources || []).filter((s) => isSafeHttpUrl(s.uri));

  const trackedGameNames = new Set(
    config.targetGames.map((g) => g.name.trim().toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isFetching) return;
    await onFetchTrends(focusInput.trim() || "Daily Twitch Gaming");
  }

  async function handlePin(topic: TrendPulseTopic) {
    setPinningId(topic.id);
    try {
      await onTogglePin(topic.id);
    } finally {
      setPinningId(null);
    }
  }

  async function handleTrack(topic: TrendPulseTopic) {
    setTrackingId(topic.id);
    try {
      await onTrackGame(topic.gameOrTopic);
    } finally {
      setTrackingId(null);
    }
  }

  return (
    <section className="border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0A0B0E]">
      {/* Widget Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/90 dark:bg-[#111318] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <Radio className="w-4 h-4 text-[#E1392B] shrink-0" />
          <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
            TrendPulse · Daily Twitch Radar
          </h2>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Google Search Grounded
          </span>
          {pinnedCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="font-mono text-[11px] tabular-nums font-semibold text-[#E1392B]">
                {pinnedCount} priority topic{pinnedCount === 1 ? "" : "s"} feeding AI Director
              </span>
            </>
          )}
          {snapshot?.fetchedAt && (
            <>
              <span aria-hidden="true" className="hidden sm:inline text-slate-400">·</span>
              <span className="hidden sm:inline font-mono text-[11px] tabular-nums text-slate-400">
                Updated {new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          )}
        </div>

        {/* Live Search Focus Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              placeholder="Topic focus (e.g., Daily Twitch Gaming)"
              className="h-8 w-full sm:w-56 pl-8 pr-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] text-xs text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#E1392B]"
            />
          </div>

          <button
            type="submit"
            disabled={isFetching}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isFetching ? "Searching Twitch..." : "Fetch Live Trends"}</span>
          </button>
        </form>
      </div>

      {/* Quick Focus Preset Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-slate-400 mr-1">PRESET:</span>
          {FOCUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isFetching}
              onClick={() => {
                setFocusInput(preset);
                onFetchTrends(preset);
              }}
              className={`px-2 py-0.5 rounded-xs border font-mono transition-colors ${
                focusInput.toLowerCase() === preset.toLowerCase()
                  ? "border-[#E1392B] text-[#E1392B] bg-[#E1392B]/5"
                  : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <span className="font-mono text-slate-400">
          Pin any trend to automatically steer AI Director clipping &amp; hook priorities
        </span>
      </div>

      {/* Topics Grid or Empty Call-to-Action */}
      {topics.length === 0 ? (
        <div className="px-6 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F6F7F9]/40 dark:bg-[#0B0D12]">
          <div className="space-y-1 max-w-xl">
            <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
              No daily Twitch trend snapshot loaded yet
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Run a live Google Search-grounded scan to pull today&rsquo;s breakout Twitch games, tournaments, and streamer meta spikes, then pin priorities straight into the AI Director.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFetchTrends(focusInput.trim() || "Daily Twitch Gaming")}
            disabled={isFetching}
            className="h-9 px-4 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-2 shrink-0"
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-[#E1392B]" />}
            <span>{isFetching ? "Scanning Google Search..." : "Scan Today's Twitch Trends"}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D9DEE7] dark:divide-[#222631]">
            {topics.map((topic) => {
              const isTracked = trackedGameNames.has(topic.gameOrTopic.trim().toLowerCase());
              const isPinned = Boolean(topic.pinnedPriority);
              return (
                <article
                  key={topic.id}
                  className={`p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isPinned
                      ? "bg-[#E1392B]/[0.04] dark:bg-[#E1392B]/[0.07]"
                      : "bg-white dark:bg-[#0A0B0E] hover:bg-[#F6F7F9]/60 dark:hover:bg-[#111318]/70"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Meta Line */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold uppercase ${
                          topic.heatLevel === "breakout"
                            ? "text-[#E1392B]"
                            : topic.heatLevel === "rising"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {topic.heatLevel === "breakout" ? (
                          <Flame className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        <span>{topic.heatLevel}</span>
                      </span>
                      <span className="text-slate-400 truncate">{topic.category}</span>
                    </div>

                    {/* Title & Grounded Summary */}
                    <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                      {topic.gameOrTopic}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {topic.summary}
                    </p>

                    {/* Clipping Angle Callout */}
                    <div className="pt-2 border-t border-[#ECEFF3] dark:border-[#1E222D] space-y-1 text-[11px]">
                      <div className="font-mono text-[10px] text-slate-400">
                        CLIP ANGLE · {topic.recommendedTemplate}
                      </div>
                      <p className="text-[#0F172A] dark:text-slate-200 leading-snug">
                        {topic.clipAngle}
                      </p>
                    </div>
                  </div>

                  {/* Action Strip */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      disabled={pinningId === topic.id}
                      onClick={() => handlePin(topic)}
                      className={`h-7 px-2 rounded-sm border font-medium inline-flex items-center gap-1 transition-colors ${
                        isPinned
                          ? "border-[#E1392B] bg-[#E1392B] text-white"
                          : "border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] text-slate-700 dark:text-slate-200 hover:border-[#E1392B]"
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{isPinned ? "Pinned" : "Pin Priority"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isTracked || trackingId === topic.id}
                      onClick={() => handleTrack(topic)}
                      title="Add game to pipeline.config.json targetGames"
                      className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] hover:border-emerald-500 disabled:opacity-60 text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                    >
                      {isTracked ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      <span>{isTracked ? "Tracked" : "Track"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDirecting}
                      onClick={() => onDirectTopic(topic.suggestedDirectorCommand)}
                      title="Execute this trend strategy via AI Director"
                      className="h-7 px-2 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1 ml-auto disabled:opacity-50"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Direct</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Grounded Web Sources & Executed Queries Footer */}
          {(safeSources.length > 0 || (snapshot?.searchQueries?.length || 0) > 0) && (
            <div className="px-4 sm:px-6 py-2.5 border-t border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[10px] text-slate-400">GROUNDED SOURCES:</span>
                {safeSources.slice(0, 6).map((src, idx) => (
                  <a
                    key={`${src.uri}_${idx}`}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B] underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
                  >
                    <span className="max-w-[180px] truncate">{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ))}
              </div>
              {snapshot?.searchQueries && snapshot.searchQueries.length > 0 && (
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-md">
                  Queries: {snapshot.searchQueries.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
