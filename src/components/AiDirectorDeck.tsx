import { useState } from "react";
import {
  Bot,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Save,
  Crosshair,
  Sparkles,
} from "lucide-react";
import type {
  AiDirectorPolicy,
  CompetitorBreakdown,
  DirectorRunResult,
  PipelineConfig,
} from "../types";

interface AiDirectorDeckProps {
  config: PipelineConfig;
  directorHistory: DirectorRunResult[];
  isDirecting: boolean;
  onExecuteDirector: (instruction: string) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onAnalyzeCompetitor: (rivalTitle: string, rivalTranscript: string) => Promise<CompetitorBreakdown | null>;
}

const AUTOPILOT_PLAYBOOKS: Array<{ title: string; detail: string; command: string }> = [
  {
    title: "Full Autonomous Studio Sweep",
    detail: "Audit all pending clips, generate hooks on top clip, queue approved cuts & auto-schedule fleet.",
    command:
      "Audit all pending clips via Gemini QA, generate A/B/C viral hooks for the strongest approved clip, move approved clips to the ready queue, and auto-schedule the fleet.",
  },
  {
    title: "Global LATAM + Brazil Expansion",
    detail: "Localize flagship clip into Spanish & Portuguese and align multi-channel schedule.",
    command:
      "Translate clip_vice_01 into Spanish (es), suggest timed B-Roll motion cues for it, and auto-schedule ready clips across the fleet.",
  },
  {
    title: "Broadcast -11 LUFS Mastering Pass",
    detail: "Standardize loudness to -11 LUFS across all clips and dispatch pipeline validation.",
    command: "Set workspace audio loudness to -11 LUFS globally, queue all approved clips, and dispatch a worker run.",
  },
  {
    title: "Reaction-First Visual Refresh",
    detail: "Switch flagship clip to reaction-focus framing, generate new hooks, and place B-Roll beats.",
    command:
      "Switch clip_vice_01 template to reaction-focus, generate 3 fresh viral hooks, and suggest timed B-Roll cutaway cues.",
  },
];

export function AiDirectorDeck({
  config,
  directorHistory,
  isDirecting,
  onExecuteDirector,
  onSaveConfig,
  onAnalyzeCompetitor,
}: AiDirectorDeckProps) {
  const defaultPolicy: AiDirectorPolicy = config.aiDirector || {
    mode: "supervised",
    brandVoice: "hype-arcade",
    customVoicePrompt:
      "Write sharp, fast-paced gaming hooks under 34 characters anchored in exact physics stunts.",
    autoAuditOnIngest: true,
    autoGenerateHooks: true,
    autoLocalizeLocales: ["es", "pt"],
    maxAutoActionsPerRun: 4,
  };

  const [instruction, setInstruction] = useState("");
  const [policyDraft, setPolicyDraft] = useState<AiDirectorPolicy>(defaultPolicy);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Competitor Formula Reverse-Engineer
  const [rivalTitle, setRivalTitle] = useState("");
  const [rivalTranscript, setRivalTranscript] = useState("");
  const [analyzingRival, setAnalyzingRival] = useState(false);
  const [rivalBreakdown, setRivalBreakdown] = useState<CompetitorBreakdown | null>(null);

  async function handleRunCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || isDirecting) return;
    await onExecuteDirector(instruction.trim());
    setInstruction("");
  }

  async function handleSavePolicy() {
    setSavingPolicy(true);
    try {
      await onSaveConfig({ ...config, aiDirector: policyDraft });
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleRivalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rivalTitle.trim() || !rivalTranscript.trim()) return;
    setAnalyzingRival(true);
    try {
      const res = await onAnalyzeCompetitor(rivalTitle.trim(), rivalTranscript.trim());
      if (res) setRivalBreakdown(res);
    } finally {
      setAnalyzingRival(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Top Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <Bot className="w-4 h-4 text-[#E1392B]" />
          <span className="font-display font-bold text-sm text-[#0F1115] dark:text-[#EEF0F4]">
            Autonomous AI Director
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono text-slate-500">
            Mode: {policyDraft.mode === "autonomous" ? "Full Autonomous" : "Supervised Copilot"} · Voice: {policyDraft.brandVoice}
          </span>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
          {(["supervised", "autonomous"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={async () => {
                const next = { ...policyDraft, mode };
                setPolicyDraft(next);
                await onSaveConfig({ ...config, aiDirector: next });
              }}
              className={`px-3 py-1 rounded-xs font-medium capitalize transition-colors ${
                policyDraft.mode === mode
                  ? "bg-[#E1392B] text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0F1115] dark:hover:text-white"
              }`}
            >
              {mode === "autonomous" ? "Full Auto" : "Supervised"}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Pane Split: Left Commander & Execution Log (7 cols) + Right Governance & Competitor Lab (5 cols) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
        {/* Left: AI Command Center + Playbooks + Execution Trace */}
        <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] flex flex-col divide-y divide-[#D9DEE7] dark:divide-[#222631]">
          {/* Natural-Language Command Console */}
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Direct the Entire Studio in Plain English
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gemini 4 Hydrogen inspects your live bin, config, and channel fleet, then executes real multi-step edits, audits, localizations, and dispatches automatically.
              </p>
            </div>

            <form onSubmit={handleRunCommand} className="space-y-2.5">
              <textarea
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Example: Audit pending clips, generate hooks for clip_vice_01, translate it to Spanish, set loudnorm to -11 LUFS, and auto-schedule the fleet..."
                className="w-full p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#111318] text-xs leading-relaxed text-[#0F1115] dark:text-[#EEF0F4] focus:outline-none focus:border-[#E1392B]"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-slate-500">
                  Tip: Press Ctrl+K / ⌘K anywhere in ClipForge to issue AI commands.
                </span>
                <button
                  type="submit"
                  disabled={isDirecting || !instruction.trim()}
                  className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isDirecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isDirecting ? "Executing Plan..." : "Execute AI Plan"}</span>
                </button>
              </div>
            </form>

            {/* 1-Click Autonomous Playbooks */}
            <div className="pt-2 space-y-2">
              <div className="text-xs font-medium text-slate-500">One-Click Autonomous Playbooks</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AUTOPILOT_PLAYBOOKS.map((pb) => (
                  <button
                    key={pb.title}
                    type="button"
                    disabled={isDirecting}
                    onClick={() => onExecuteDirector(pb.command)}
                    className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9]/70 dark:bg-[#111318] hover:border-[#E1392B] text-left transition-colors space-y-1 disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{pb.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{pb.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Execution Trace Log */}
          <div className="p-5 space-y-3 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-sm text-[#0F1115] dark:text-[#EEF0F4]">
                Autonomous Execution Audit Log
              </span>
              <span className="font-mono tabular-nums text-slate-500">{directorHistory.length} run(s)</span>
            </div>

            {directorHistory.length === 0 ? (
              <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#262B37] text-center text-xs text-slate-500">
                Run a playbook or enter an instruction above to inspect live AI Director tool calls and mutations.
              </div>
            ) : (
              <div className="space-y-3">
                {directorHistory.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9]/60 dark:bg-[#111318] space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{run.instruction}</span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-500">{run.latencyMs}ms</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{run.planSummary}</p>
                    <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14]">
                      {run.steps.map((st, idx) => (
                        <div key={`${run.id}_${idx}`} className="px-3 py-2 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            {st.status === "executed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : st.status === "failed" ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            ) : (
                              <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] text-[#0F1115] dark:text-slate-200">
                                {st.action} <span className="text-slate-500">({st.target})</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{st.detail}</div>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] uppercase text-slate-400 shrink-0">{st.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Brand Voice & Governance Policy + Competitor Reverse-Engineer */}
        <div className="xl:col-span-5 bg-[#F6F7F9] dark:bg-[#0F1117] divide-y divide-[#D9DEE7] dark:divide-[#222631] text-xs">
          {/* AI Brand Voice & Guardrails */}
          <section className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Brand Voice &amp; Autopilot Guardrails
              </h3>
              <button
                type="button"
                disabled={savingPolicy}
                onClick={handleSavePolicy}
                className="h-7 px-3 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>{savingPolicy ? "Saving..." : "Save Policy"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Editorial Persona</label>
                <select
                  value={policyDraft.brandVoice}
                  onChange={(e) =>
                    setPolicyDraft((p) => ({
                      ...p,
                      brandVoice: e.target.value as AiDirectorPolicy["brandVoice"],
                    }))
                  }
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
                >
                  <option value="hype-arcade">High-Energy Hype</option>
                  <option value="esports-analyst">Deadpan Esports Analyst</option>
                  <option value="storyteller-suspense">Storyteller Suspense</option>
                  <option value="chaos-comedy">Chaos Comedy</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Max Auto Actions / Run</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={policyDraft.maxAutoActionsPerRun}
                  onChange={(e) =>
                    setPolicyDraft((p) => ({ ...p, maxAutoActionsPerRun: Math.max(1, Number(e.target.value)) }))
                  }
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Global System Voice Directive (injected into all Gemini prompts)</label>
              <textarea
                rows={3}
                value={policyDraft.customVoicePrompt}
                onChange={(e) => setPolicyDraft((p) => ({ ...p, customVoicePrompt: e.target.value }))}
                className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] leading-relaxed"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Auto-run Gemini QA + DMCA screen on every ingest</span>
                <input
                  type="checkbox"
                  checked={policyDraft.autoAuditOnIngest}
                  onChange={(e) => setPolicyDraft((p) => ({ ...p, autoAuditOnIngest: e.target.checked }))}
                  className="w-4 h-4 accent-[#E1392B]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Auto-generate A/B/C hook variants for approved clips</span>
                <input
                  type="checkbox"
                  checked={policyDraft.autoGenerateHooks}
                  onChange={(e) => setPolicyDraft((p) => ({ ...p, autoGenerateHooks: e.target.checked }))}
                  className="w-4 h-4 accent-[#E1392B]"
                />
              </label>
            </div>
          </section>

          {/* Competitor Viral Formula Reverse-Engineer */}
          <section className="p-5 space-y-3.5">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Competitor Viral Formula Reverse-Engineer
              </h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Paste a rival viral short&rsquo;s title and opening lines—Gemini dissects its retention hook and proposes a counter-strategy.
            </p>

            <form onSubmit={handleRivalSubmit} className="space-y-2.5">
              <input
                type="text"
                required
                value={rivalTitle}
                onChange={(e) => setRivalTitle(e.target.value)}
                placeholder="Rival Short Title (e.g., 1 HP Clutch That Broke Twitch)"
                className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
              />
              <textarea
                rows={3}
                required
                value={rivalTranscript}
                onChange={(e) => setRivalTranscript(e.target.value)}
                placeholder="Paste rival short's opening 15 seconds transcript..."
                className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
              />
              <button
                type="submit"
                disabled={analyzingRival}
                className="w-full h-8 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {analyzingRival ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{analyzingRival ? "Dissecting Hook..." : "Reverse-Engineer Competitor"}</span>
              </button>
            </form>

            {rivalBreakdown && (
              <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] space-y-2.5">
                <div>
                  <div className="font-mono text-[10px] text-[#E1392B] font-semibold">COUNTER HOOK BANNER</div>
                  <div className="font-display font-bold text-sm text-[#0F1115] dark:text-[#EEF0F4]">
                    {rivalBreakdown.counterHookBanner}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rivalBreakdown.hookMechanic}</p>
                <div className="text-[11px] text-slate-500">
                  <strong>Weakness to Exploit:</strong> {rivalBreakdown.weaknessToExploit}
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  {rivalBreakdown.retentionTriggers.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={async () => {
                    const nextPolicy = { ...policyDraft, customVoicePrompt: rivalBreakdown.suggestedVoicePrompt };
                    setPolicyDraft(nextPolicy);
                    await onSaveConfig({
                      ...config,
                      aiDirector: nextPolicy,
                      layoutDefaults: { ...config.layoutDefaults, template: rivalBreakdown.recommendedTemplate },
                    });
                  }}
                  className="w-full h-8 rounded-sm bg-[#E1392B] text-white font-semibold"
                >
                  Adopt Counter-Voice &amp; {rivalBreakdown.recommendedTemplate} Template
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
