import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Sparkles,
  Scissors,
  Loader2,
  Copy,
  Check,
  Eraser,
  Layers,
  Film,
  Plus,
} from "lucide-react";
import type { ClipItem, VodMoment, VodSession } from "../types";
import { formatTimecode, generateCompilationFfmpeg } from "../utils/ffmpeg";

interface VodHighlightsDeckProps {
  vodSessions: VodSession[];
  clips: ClipItem[];
  onAnalyzeVod: (payload: {
    title: string;
    streamerName: string;
    sourceUrl: string;
    gameCategory: string;
    durationSec: number;
    transcript: string;
  }) => Promise<void>;
  onPromptSearchVod: (payload: {
    vodId: string;
    query: string;
    padContextArc: boolean;
  }) => Promise<VodMoment[]>;
  onExtractMoment: (payload: {
    title: string;
    streamerName: string;
    streamerHandle: string;
    sourceUrl: string;
    gameCategory: string;
    durationSec: number;
    hookBanner: string;
    transcript: string;
  }) => Promise<void>;
  isAnalyzingVod: boolean;
}

const FILLER_REGEX = /\b(uh+|um+|like,|literally|you know,?|bro,?)\b/gi;

export function VodHighlightsDeck({
  vodSessions,
  clips,
  onAnalyzeVod,
  onPromptSearchVod,
  onExtractMoment,
  isAnalyzingVod,
}: VodHighlightsDeckProps) {
  const [activeVodId, setActiveVodId] = useState<string>(vodSessions[0]?.id || "");
  const [subTab, setSubTab] = useState<"radar" | "transcript" | "montage">("radar");
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [editedTranscript, setEditedTranscript] = useState<string>("");
  const [scrubbedCount, setScrubbedCount] = useState<number>(0);

  // ClipAnything natural-language VOD prompt search
  const [clipPromptQuery, setClipPromptQuery] = useState("");
  const [padContextArc, setPadContextArc] = useState(true);
  const [searchingPrompt, setSearchingPrompt] = useState(false);
  const [promptMoments, setPromptMoments] = useState<VodMoment[]>([]);

  // New VOD Ingest form
  const [showNewForm, setShowNewForm] = useState(false);
  const [vodForm, setVodForm] = useState({
    title: "",
    streamerName: "KadeVelo",
    sourceUrl: "https://www.twitch.tv/videos/2199011220",
    gameCategory: "Grand Theft Auto VI",
    durationSec: 3600,
    transcript: "",
  });

  // Auto-Montage Compilation builder
  const [selectedMontageIds, setSelectedMontageIds] = useState<string[]>(
    clips.filter((c) => c.qaStatus === "approved").slice(0, 3).map((c) => c.id)
  );
  const [copiedMontage, setCopiedMontage] = useState(false);

  const activeVod = useMemo(
    () => vodSessions.find((v) => v.id === activeVodId) || vodSessions[0],
    [vodSessions, activeVodId]
  );

  const displayTranscript = editedTranscript || activeVod?.transcript || "";

  const fillerMatches = useMemo(() => {
    const m = displayTranscript.match(FILLER_REGEX);
    return m ? m.length : 0;
  }, [displayTranscript]);

  const montageClips = useMemo(
    () => clips.filter((c) => selectedMontageIds.includes(c.id)),
    [clips, selectedMontageIds]
  );
  const compilationCmd = useMemo(() => generateCompilationFfmpeg(montageClips), [montageClips]);

  async function handleRunClipAnything(e?: React.FormEvent, overrideQuery?: string) {
    if (e) e.preventDefault();
    const q = (overrideQuery ?? clipPromptQuery).trim();
    if (!activeVod || !q) return;
    if (overrideQuery) setClipPromptQuery(overrideQuery);
    setSearchingPrompt(true);
    try {
      const results = await onPromptSearchVod({
        vodId: activeVod.id,
        query: q,
        padContextArc,
      });
      setPromptMoments(results);
    } finally {
      setSearchingPrompt(false);
    }
  }

  async function handleExtract(moment: VodMoment) {
    if (!activeVod) return;
    setExtractingId(moment.id);
    try {
      await onExtractMoment({
        title: moment.title,
        streamerName: activeVod.streamerName,
        streamerHandle: activeVod.streamerHandle,
        sourceUrl: activeVod.sourceUrl,
        gameCategory: activeVod.gameCategory,
        durationSec: Math.max(15, moment.endSec - moment.startSec),
        hookBanner: moment.hookBanner,
        transcript: moment.transcriptExcerpt,
      });
    } finally {
      setExtractingId(null);
    }
  }

  function handleScrubFillers() {
    const matches = displayTranscript.match(FILLER_REGEX);
    const cleaned = displayTranscript.replace(FILLER_REGEX, "").replace(/\s{2,}/g, " ").trim();
    setEditedTranscript(cleaned);
    setScrubbedCount(matches ? matches.length : 0);
  }

  async function handleExtractTranscriptClip() {
    if (!activeVod || !displayTranscript.trim()) return;
    setExtractingId("transcript_custom");
    try {
      await onExtractMoment({
        title: `${activeVod.streamerName} — Transcript Cut`,
        streamerName: activeVod.streamerName,
        streamerHandle: activeVod.streamerHandle,
        sourceUrl: activeVod.sourceUrl,
        gameCategory: activeVod.gameCategory,
        durationSec: 28,
        hookBanner: "CLEAN TRANSCRIPT CUT",
        transcript: displayTranscript.slice(0, 320),
      });
    } finally {
      setExtractingId(null);
    }
  }

  async function handleAnalyzeNewVod(e: React.FormEvent) {
    e.preventDefault();
    if (!vodForm.title.trim() || !vodForm.transcript.trim()) return;
    await onAnalyzeVod(vodForm);
    setShowNewForm(false);
    setVodForm((f) => ({ ...f, title: "", transcript: "" }));
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Sub-Navigation Bar */}
      <div className="px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          {(
            [
              { id: "radar", label: "VOD Hype & ClipAnything" },
              { id: "transcript", label: "Text-Based Editor" },
              { id: "montage", label: `Auto-Montage (${montageClips.length})` },
            ] as const
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`relative py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "text-[#0F1115] dark:text-[#EEF0F4]"
                    : "text-slate-500 hover:text-[#0F1115] dark:hover:text-slate-200"
                }`}
              >
                {t.label}
                {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 py-2">
          {vodSessions.length > 0 && (
            <select
              aria-label="Select VOD session"
              value={activeVod?.id || ""}
              onChange={(e) => {
                setActiveVodId(e.target.value);
                setEditedTranscript("");
                setScrubbedCount(0);
                setPromptMoments([]);
              }}
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs max-w-[240px] truncate"
            >
              {vodSessions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.streamerHandle} — {v.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowNewForm((s) => !s)}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Analyze Full VOD</span>
          </button>
        </div>
      </div>

      {/* Collapsible New VOD Gemini Ingestion Form */}
      {showNewForm && (
        <form
          onSubmit={handleAnalyzeNewVod}
          className="p-5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#111318] space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm text-[#0F1115] dark:text-[#EEF0F4]">
              Ingest Long-Form Twitch / YouTube VOD for Gemini Highlight Slicing
            </span>
            <button type="button" onClick={() => setShowNewForm(false)} className="text-slate-500 hover:text-slate-200">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={vodForm.title}
              onChange={(e) => setVodForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="VOD Stream Title"
              className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0A0B0E]"
            />
            <input
              type="text"
              required
              value={vodForm.streamerName}
              onChange={(e) => setVodForm((f) => ({ ...f, streamerName: e.target.value }))}
              placeholder="Streamer Name"
              className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0A0B0E]"
            />
            <input
              type="text"
              value={vodForm.sourceUrl}
              onChange={(e) => setVodForm((f) => ({ ...f, sourceUrl: e.target.value }))}
              placeholder="Twitch / YouTube VOD URL"
              className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0A0B0E] font-mono"
            />
          </div>
          <textarea
            rows={4}
            required
            value={vodForm.transcript}
            onChange={(e) => setVodForm((f) => ({ ...f, transcript: e.target.value }))}
            placeholder="Paste timestamped stream transcript or chat log highlights — Gemini 4 Hydrogen will detect the top 3 viral short-form slices and energy spikes..."
            className="w-full p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0A0B0E]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAnalyzingVod}
              className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5"
            >
              {isAnalyzingVod ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isAnalyzingVod ? "Scanning VOD..." : "Run Gemini VOD Highlight Extractor"}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 1: VOD HYPE HEATMAP, CLIPANYTHING PROMPT SEARCH & AUTO-CHAPTERS */}
      {subTab === "radar" && activeVod && (
        <div className="flex-1 flex flex-col">
          {/* ClipAnything Natural-Language VOD Search Bar */}
          <form
            onSubmit={(e) => handleRunClipAnything(e)}
            className="p-4 sm:px-5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#10131A] space-y-2.5 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                <span className="font-display font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                  ClipAnything Prompt Search
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  — Ask for any moment in plain English instead of scrubbing hours of VOD
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={padContextArc}
                  onChange={(e) => setPadContextArc(e.target.checked)}
                  className="accent-[#E1392B]"
                />
                <span>Context Arc Guard (+2s setup / +2s punchline)</span>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={clipPromptQuery}
                onChange={(e) => setClipPromptQuery(e.target.value)}
                placeholder='e.g. "Find every high-stakes bounty escape, money mention, or stunt jump"'
                className="flex-1 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0D0F14]"
              />
              <button
                type="submit"
                disabled={searchingPrompt || !clipPromptQuery.trim()}
                className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-50 text-white font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {searchingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{searchingPrompt ? "Searching VOD..." : "Find Matching Clips"}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500">Quick prompts:</span>
              {[
                "Find every stunt jump or near-miss crash",
                "Find moments mentioning money, bounty, or numbers",
                "Find highest heart-rate shock reactions",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleRunClipAnything(undefined, q)}
                  className="px-2 py-0.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-600 dark:text-slate-300 hover:border-[#E1392B]"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>

          {promptMoments.length > 0 && (
            <div className="border-b border-[#E1392B]/30 bg-[#E1392B]/5 divide-y divide-[#D9DEE7] dark:divide-[#222631]">
              <div className="px-5 py-2.5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#E1392B] font-semibold">
                  CLIPANYTHING MATCHES ({promptMoments.length}) FOR &ldquo;{clipPromptQuery}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setPromptMoments([])}
                  className="text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                >
                  Clear Results
                </button>
              </div>
              {promptMoments.map((moment) => (
                <div key={moment.id} className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                      <span className="text-[#E1392B] font-semibold">
                        {formatTimecode(moment.startSec)} → {formatTimecode(moment.endSec)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Energy {moment.peakEnergy}/100</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#0F1115] dark:text-slate-200 font-semibold">{moment.hookBanner}</span>
                    </div>
                    <div className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                      {moment.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      &ldquo;{moment.transcriptExcerpt}&rdquo;
                    </p>
                    <p className="text-xs text-slate-500">{moment.reason}</p>
                  </div>
                  <button
                    type="button"
                    disabled={extractingId === moment.id}
                    onClick={() => handleExtract(moment)}
                    className="h-9 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                  >
                    {extractingId === moment.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Scissors className="w-3.5 h-3.5" />
                    )}
                    <span>Slice Match to Bin</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat-Hype & Audio Energy Spike Heatmap */}
          <div className="p-5 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                  {activeVod.title}
                </h2>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono">{activeVod.streamerHandle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeVod.gameCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{Math.round(activeVod.durationSec / 60)} min VOD</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#E1392B] font-medium">{activeVod.moments.length} viral spikes detected</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Chat Velocity (msg/min) spike radar
              </div>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeVod.energySeries} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vodHypeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E1392B" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#E1392B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="minuteLabel" tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111318",
                      borderColor: "#262B37",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#EEF0F4",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="chatPerMin"
                    name="Chat msg/min"
                    stroke="#E1392B"
                    strokeWidth={2}
                    fill="url(#vodHypeGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extracted Moment Slice Queue */}
          <div className="flex-1 divide-y divide-[#D9DEE7] dark:divide-[#222631]">
            {activeVod.moments.map((moment) => (
              <div
                key={moment.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F6F7F9] dark:hover:bg-[#11131A] transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                    <span className="text-[#E1392B] font-semibold">
                      {formatTimecode(moment.startSec)} → {formatTimecode(moment.endSec)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Peak Energy {moment.peakEnergy}/100</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#0F1115] dark:text-slate-200 font-semibold">{moment.hookBanner}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                    {moment.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    &ldquo;{moment.transcriptExcerpt}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{moment.reason}</p>
                </div>

                <button
                  type="button"
                  disabled={extractingId === moment.id}
                  onClick={() => handleExtract(moment)}
                  className="h-9 px-3.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  {extractingId === moment.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Scissors className="w-3.5 h-3.5" />
                  )}
                  <span>Slice to Ingest Bin</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DESCRIPT-STYLE TRANSCRIPT EDITOR & FILLER-WORD SCRUBBER */}
      {subTab === "transcript" && activeVod && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 p-5 border-b lg:border-b-0 lg:border-r border-[#D9DEE7] dark:border-[#222631] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                  Transcript-Based Cut Editor
                </h2>
                <p className="text-xs text-slate-500">
                  Edit dialogue directly like a document, strip verbal fillers automatically, and extract clean cuts into the Ingest Bin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScrubFillers}
                  className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21] text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] inline-flex items-center gap-1.5"
                >
                  <Eraser className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Strip Fillers ({fillerMatches})</span>
                </button>
                <button
                  type="button"
                  disabled={extractingId === "transcript_custom"}
                  onClick={handleExtractTranscriptClip}
                  className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Extract Cut to Bin</span>
                </button>
              </div>
            </div>

            <textarea
              rows={12}
              value={displayTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="w-full p-4 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#111318] text-sm leading-relaxed text-[#0F1115] dark:text-[#EEF0F4] focus:outline-none focus:border-[#E1392B]"
            />

            {scrubbedCount > 0 && (
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Removed {scrubbedCount} filler token(s) (&ldquo;uh&rdquo;, &ldquo;um&rdquo;, &ldquo;like&rdquo;, &ldquo;literally&rdquo;).
              </div>
            )}
          </div>

          <div className="lg:col-span-4 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-4 text-xs">
            <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
              Auto-Detected Filler Words
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Cutting dead air and verbal fillers tightens short-form pacing by 12–18% before FFmpeg renders captions.
            </p>
            <div className="border border-[#D9DEE7] dark:border-[#222631] divide-y divide-[#D9DEE7] dark:divide-[#222631] bg-white dark:bg-[#14171F]">
              <div className="px-3 py-2 flex justify-between font-mono">
                <span className="text-slate-500">Detected fillers</span>
                <span className="font-bold text-[#E1392B] tabular-nums">{fillerMatches}</span>
              </div>
              <div className="px-3 py-2 flex justify-between font-mono">
                <span className="text-slate-500">Word count</span>
                <span className="tabular-nums">{displayTranscript.split(/\s+/).filter(Boolean).length}</span>
              </div>
              <div className="px-3 py-2 flex justify-between font-mono">
                <span className="text-slate-500">Est. spoken length</span>
                <span className="tabular-nums">
                  {Math.round(displayTranscript.split(/\s+/).filter(Boolean).length / 2.6)}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUTO-MONTAGE / COMPILATION STITCHER */}
      {subTab === "montage" && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
          <div className="xl:col-span-6 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E1392B]" />
                <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                  Select Clips for &ldquo;Best Of&rdquo; Compilation
                </h2>
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                Total: {montageClips.reduce((s, c) => s + c.durationSec, 0)}s
              </span>
            </div>

            <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631]">
              {clips.map((c) => {
                const checked = selectedMontageIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F6F7F9] dark:hover:bg-[#12151C]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedMontageIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                        className="w-4 h-4 accent-[#E1392B] shrink-0"
                      />
                      <Film className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#0F1115] dark:text-[#EEF0F4] truncate">{c.title}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {c.streamerHandle} · {c.durationSec}s · {c.layout.template}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] capitalize text-slate-500">{c.qaStatus}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-6 p-5 bg-[#0A0B0E] text-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-300">
                FFmpeg Multi-Clip Concat &amp; -11 LUFS Master Graph
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(compilationCmd);
                  setCopiedMontage(true);
                  setTimeout(() => setCopiedMontage(false), 1500);
                }}
                className="h-7 px-2.5 rounded-sm border border-[#262B37] text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1"
              >
                {copiedMontage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMontage ? "Copied" : "Copy FFmpeg"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-sm border border-[#222631] bg-[#111318] text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{compilationCmd}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
