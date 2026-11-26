import { useState } from "react";
import {
  Rocket,
  Play,
  FastForward,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Loader2,
  SlidersHorizontal,
  ExternalLink,
  RefreshCw,
  Radio,
  Tv,
  Film,
  Share2,
  Cpu,
  Newspaper,
  FlaskConical,
  Brain,
  Clapperboard,
  CalendarClock,
  Check,
  ChevronRight,
} from "lucide-react";
import type {
  AutonomousMission,
  IndustryNewsCategory,
  IndustryNewsSnapshot,
  MissionAutonomyMode,
  MissionScheduleCadence,
  MissionStageId,
} from "../types";

interface AutonomousMissionHubProps {
  activeMission?: AutonomousMission;
  industryNews?: IndustryNewsSnapshot;
  isStartingMission: boolean;
  isAdvancingMission: boolean;
  isScanningNews: boolean;
  onStartMission: (payload: {
    prompt: string;
    nicheFocus: string;
    autonomyMode: MissionAutonomyMode;
    scheduleCadence: MissionScheduleCadence;
  }) => Promise<void>;
  onAdvanceMission: (payload: {
    mode: "step" | "until-gate" | "full-auto";
    selectedIdeaId?: string;
  }) => Promise<void>;
  onUpdateMissionConfig: (payload: {
    autonomyMode?: MissionAutonomyMode;
    scheduleCadence?: MissionScheduleCadence;
    selectedIdeaId?: string;
    toggleGateStageId?: MissionStageId;
  }) => Promise<void>;
  onScanIndustryNews: (focus: string) => Promise<void>;
  onFeedNewsToAgent: (itemId?: string) => Promise<void>;
  onOpenClipInStudio: (clipId: string) => void;
}

const MISSION_PRESETS = [
  {
    label: "Top 10 Viral Ideas (All Niches)",
    prompt:
      "Give me the top 10 highest-ROI viral short-form video ideas today — then make, edit, master audio (-14 LUFS), caption, add effects, translate, review, split-test, post, monitor & learn.",
    nicheFocus: "Multi-Niche (AI & Tech, Gaming, Faceless Doc, Finance, Podcasts)",
  },
  {
    label: "Top 10 AI & Tech High-RPM",
    prompt:
      "Research the top 10 breaking AI & Tech short-form video ideas with highest sponsorship & RPM upside right now.",
    nicheFocus: "AI & Tech",
  },
  {
    label: "Top 10 GTA VI & Gaming Clips",
    prompt:
      "Find the top 10 breakout GTA VI, Twitch, and gaming viral clip angles today for rapid global velocity.",
    nicheFocus: "Gaming & GTA VI",
  },
  {
    label: "Top 10 Faceless Micro-Docs",
    prompt:
      "Research the top 10 faceless mystery, business, and finance 45-second micro-documentary ideas with zero DMCA risk.",
    nicheFocus: "Faceless Doc & Finance",
  },
];

const NEWS_CATEGORIES: Array<{ id: "all" | IndustryNewsCategory; label: string }> = [
  { id: "all", label: "All Intel" },
  { id: "news", label: "News" },
  { id: "streams", label: "Streams" },
  { id: "videos", label: "Videos" },
  { id: "social", label: "Social" },
  { id: "ai-tools", label: "AI Tools" },
];

export function AutonomousMissionHub({
  activeMission,
  industryNews,
  isStartingMission,
  isAdvancingMission,
  isScanningNews,
  onStartMission,
  onAdvanceMission,
  onUpdateMissionConfig,
  onScanIndustryNews,
  onFeedNewsToAgent,
  onOpenClipInStudio,
}: AutonomousMissionHubProps) {
  const [prompt, setPrompt] = useState(MISSION_PRESETS[0].prompt);
  const [nicheFocus, setNicheFocus] = useState(MISSION_PRESETS[0].nicheFocus);
  const [autonomyMode, setAutonomyMode] = useState<MissionAutonomyMode>(
    activeMission?.autonomyMode || "approval-gates"
  );
  const [scheduleCadence, setScheduleCadence] = useState<MissionScheduleCadence>(
    activeMission?.scheduleCadence || "daily-0900"
  );
  const [inspectedStageId, setInspectedStageId] = useState<MissionStageId>("research");

  // Industry News Radar local state
  const [newsCategory, setNewsCategory] = useState<"all" | IndustryNewsCategory>("all");
  const [newsFocusInput, setNewsFocusInput] = useState(
    "Short-form AI video clipping, YouTube Shorts, TikTok, Twitch streams, creator economy & rival AI tools"
  );
  const [feedingId, setFeedingId] = useState<string | null>(null);

  const completedStagesCount = activeMission
    ? activeMission.stages.filter((s) => s.status === "completed").length
    : 0;
  const nextPendingStage = activeMission?.stages.find(
    (s) => s.status !== "completed" && s.status !== "skipped"
  );
  const inspectedStage =
    activeMission?.stages.find((s) => s.id === inspectedStageId) ||
    nextPendingStage ||
    activeMission?.stages[0];

  const selectedIdea = activeMission?.ideas.find((i) => i.id === activeMission.selectedIdeaId) || activeMission?.ideas[0];

  const filteredNews = (industryNews?.items || []).filter(
    (item) => newsCategory === "all" || item.category === newsCategory
  );

  function renderCategoryIcon(cat: IndustryNewsCategory) {
    switch (cat) {
      case "streams":
        return <Tv className="w-3.5 h-3.5 text-[#E1392B]" />;
      case "videos":
        return <Film className="w-3.5 h-3.5 text-blue-500" />;
      case "social":
        return <Share2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "ai-tools":
        return <Cpu className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Newspaper className="w-3.5 h-3.5 text-slate-500" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. END-TO-END AUTONOMOUS MISSION LAUNCHER & SCHEDULE CONTROL          */}
      {/* ===================================================================== */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#161922] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                End-to-End Autonomous Production Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Ask for the Top 10 video ideas — the AI Agent researches live trends, creates the clip, edits 9:16 + 3s hook, masters -14 LUFS voiceover audio, finishes captions, adds B-roll/SFX, translates ES/PT, reviews QA &amp; Clip Health, sets up A/B split-tests, posts, monitors velocity &amp; ROI, and updates your plan automatically.
            </p>
          </div>

          {/* Autonomy Mode & Schedule Cadence Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex rounded-sm border border-[#D9DEE7] dark:border-[#252A36] overflow-hidden">
              {(
                [
                  { id: "walkthrough", label: "Walk-Through" },
                  { id: "approval-gates", label: "Approval Gates" },
                  { id: "full-auto", label: "Full Auto" },
                ] as const
              ).map((mode) => {
                const active = (activeMission?.autonomyMode || autonomyMode) === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setAutonomyMode(mode.id);
                      if (activeMission) {
                        onUpdateMissionConfig({ autonomyMode: mode.id });
                      }
                    }}
                    className={`px-2.5 py-1.5 font-mono text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-[#E1392B] text-white"
                        : "bg-[#F6F7F9] dark:bg-[#111318] text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318]">
              <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={activeMission?.scheduleCadence || scheduleCadence}
                onChange={(e) => {
                  const val = e.target.value as MissionScheduleCadence;
                  setScheduleCadence(val);
                  if (activeMission) {
                    onUpdateMissionConfig({ scheduleCadence: val });
                  }
                }}
                className="bg-transparent font-mono text-[11px] text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="manual" className="bg-white dark:bg-[#161922]">Schedule: Manual</option>
                <option value="every-6h" className="bg-white dark:bg-[#161922]">Auto Every 6h</option>
                <option value="twice-daily" className="bg-white dark:bg-[#161922]">Auto Twice Daily</option>
                <option value="daily-0900" className="bg-white dark:bg-[#161922]">Auto Daily 09:00</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mission Prompt Input & Quick Launch Presets */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {MISSION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPrompt(preset.prompt);
                  setNicheFocus(preset.nicheFocus);
                }}
                className="px-2.5 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/70 dark:bg-[#111318] hover:border-[#E1392B] text-[11px] font-mono text-slate-600 dark:text-slate-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Hey give me the top 10 video ideas and build the winner start to finish"'
              className="lg:col-span-7 h-10 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs text-[#0F172A] dark:text-[#F1F5F9]"
            />
            <input
              type="text"
              value={nicheFocus}
              onChange={(e) => setNicheFocus(e.target.value)}
              placeholder="Niche focus (e.g., AI & Tech, Gaming, Finance)"
              className="lg:col-span-3 h-10 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs text-[#0F172A] dark:text-[#F1F5F9]"
            />
            <button
              type="button"
              disabled={isStartingMission || !prompt.trim()}
              onClick={() =>
                onStartMission({
                  prompt,
                  nicheFocus,
                  autonomyMode,
                  scheduleCadence,
                })
              }
              className="lg:col-span-2 h-10 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              {isStartingMission ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isStartingMission ? "Researching..." : "Launch Mission"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. 12-STAGE START-TO-END VISUAL PIPELINE MAP & APPROVAL GATES         */}
      {/* ===================================================================== */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#161922] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                12-Stage End-to-End Autonomous Map
              </h3>
              {activeMission && (
                <span className="font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
                  {completedStagesCount}/12 DONE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any stage to inspect outputs or toggle <span className="font-mono">Ask Approval</span> vs <span className="font-mono">Auto</span> so the AI pauses only where you want human sign-off.
            </p>
          </div>

          {activeMission && (
            <div className="flex flex-wrap items-center gap-2">
              {activeMission.activeClipId && (
                <button
                  type="button"
                  onClick={() => onOpenClipInStudio(activeMission.activeClipId!)}
                  className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] hover:border-[#E1392B] text-xs font-medium inline-flex items-center gap-1.5 text-[#0F172A] dark:text-[#F1F5F9]"
                >
                  <Clapperboard className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Open Clip in Studio</span>
                </button>
              )}

              {activeMission.status !== "completed" && (
                <>
                  <button
                    type="button"
                    disabled={isAdvancingMission}
                    onClick={() => onAdvanceMission({ mode: "step", selectedIdeaId: activeMission.selectedIdeaId })}
                    className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {isAdvancingMission ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {nextPendingStage?.requiresApproval
                        ? `Approve & Run: ${nextPendingStage.shortLabel}`
                        : `Run Next: ${nextPendingStage?.shortLabel || "Step"}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isAdvancingMission}
                    onClick={() => onAdvanceMission({ mode: "until-gate", selectedIdeaId: activeMission.selectedIdeaId })}
                    className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] hover:border-[#E1392B] disabled:opacity-50 text-xs font-medium inline-flex items-center gap-1.5 text-[#0F172A] dark:text-[#F1F5F9]"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#E1392B]" />
                    <span>Run Until Gate</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAdvancingMission}
                    onClick={() => onAdvanceMission({ mode: "full-auto", selectedIdeaId: activeMission.selectedIdeaId })}
                    className="h-8 px-3 rounded-sm border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Complete Full Auto</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 12-Stage Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(activeMission?.stages || [
            { id: "research", order: 1, shortLabel: "Research", label: "1. Research Top 10", description: "", status: "pending", requiresApproval: false },
            { id: "select", order: 2, shortLabel: "Make Clip", label: "2. Make Clip", description: "", status: "pending", requiresApproval: true },
            { id: "edit", order: 3, shortLabel: "Edit 9:16", label: "3. Edit 9:16", description: "", status: "pending", requiresApproval: false },
            { id: "audio", order: 4, shortLabel: "Audio", label: "4. Audio -14 LUFS", description: "", status: "pending", requiresApproval: false },
            { id: "captions", order: 5, shortLabel: "Captions", label: "5. Captions", description: "", status: "pending", requiresApproval: false },
            { id: "effects", order: 6, shortLabel: "Effects", label: "6. Effects & B-Roll", description: "", status: "pending", requiresApproval: false },
            { id: "translate", order: 7, shortLabel: "Translate", label: "7. Translate ES/PT", description: "", status: "pending", requiresApproval: false },
            { id: "review", order: 8, shortLabel: "Review", label: "8. QA & Health", description: "", status: "pending", requiresApproval: true },
            { id: "optimize", order: 9, shortLabel: "Optimize", label: "9. SEO & Split-Test", description: "", status: "pending", requiresApproval: false },
            { id: "publish", order: 10, shortLabel: "Post", label: "10. Auto-Post", description: "", status: "pending", requiresApproval: true },
            { id: "monitor", order: 11, shortLabel: "Monitor", label: "11. Velocity & ROI", description: "", status: "pending", requiresApproval: false },
            { id: "learn", order: 12, shortLabel: "Learn", label: "12. Learn & Plan", description: "", status: "pending", requiresApproval: false },
          ]).map((stage) => {
            const isSelected = inspectedStage?.id === stage.id;
            const isDone = stage.status === "completed";
            const isWaiting = stage.status === "awaiting-approval";
            return (
              <div
                key={stage.id}
                onClick={() => setInspectedStageId(stage.id as MissionStageId)}
                className={`p-2.5 rounded-sm border cursor-pointer transition-colors space-y-1.5 ${
                  isSelected
                    ? "border-[#E1392B] bg-[#E1392B]/5"
                    : isDone
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : isWaiting
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-500 tabular-nums">STEP {String(stage.order).padStart(2, "0")}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isWaiting ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="font-semibold text-xs text-[#0F172A] dark:text-[#F1F5F9] truncate">
                  {stage.shortLabel}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#D9DEE7]/70 dark:border-[#222631]">
                  <span
                    className={`font-mono text-[9px] uppercase ${
                      isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isWaiting
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400"
                    }`}
                  >
                    {isDone ? "DONE" : isWaiting ? "GATE PAUSED" : "QUEUED"}
                  </span>
                  {activeMission && stage.id !== "research" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateMissionConfig({ toggleGateStageId: stage.id as MissionStageId });
                      }}
                      title="Toggle whether AI asks for approval before running this stage"
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border ${
                        stage.requiresApproval
                          ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                          : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500"
                      }`}
                    >
                      {stage.requiresApproval ? "ASK" : "AUTO"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Details + Split-Test + Closed-Loop Learnings */}
        {activeMission && inspectedStage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-[#D9DEE7] dark:border-[#222631]">
            <div className="lg:col-span-7 p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  {inspectedStage.label}
                </span>
                <span className="font-mono text-[10px] uppercase text-slate-500">
                  {inspectedStage.requiresApproval ? "APPROVAL GATE ENABLED" : "AUTONOMOUS STEP"}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {inspectedStage.summary || inspectedStage.description}
              </p>
              {inspectedStage.metrics && inspectedStage.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px] text-[#E1392B]">
                  {inspectedStage.metrics.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/75 dark:bg-[#111318] space-y-2 text-xs">
              {activeMission.splitTest ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#E1392B]">
                      <FlaskConical className="w-3 h-3" />
                      A/B SPLIT-TEST ({activeMission.splitTest.status.toUpperCase()})
                    </span>
                    <span className="text-slate-500">{activeMission.splitTest.decisionWindowHours}h window</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922]">
                      <div className="font-mono text-[9px] text-slate-500">VARIANT A · {activeMission.splitTest.variantA.expectedHoldPct}% HOLD</div>
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] mt-0.5">
                        {activeMission.splitTest.variantA.hook}
                      </div>
                    </div>
                    <div className="p-2 rounded-sm border border-emerald-500/40 bg-emerald-500/5">
                      <div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">VARIANT B · {activeMission.splitTest.variantB.expectedHoldPct}% HOLD</div>
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] mt-0.5">
                        {activeMission.splitTest.variantB.hook}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-[#E1392B]" />
                    ACTIVE TARGET &amp; SCHEDULE
                  </div>
                  <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {selectedIdea ? `#${selectedIdea.rank} ${selectedIdea.title}` : "Select an idea below"}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Cadence: {activeMission.scheduleCadence}
                    {activeMission.nextScheduledRunAt
                      ? ` · Next Auto Run: ${new Date(activeMission.nextScheduledRunAt).toLocaleString()}`
                      : ""}
                  </div>
                </div>
              )}

              {activeMission.learnedUpdates.length > 0 && (
                <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1">
                  <div className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    CLOSED-LOOP PLAN UPDATES APPLIED
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {activeMission.learnedUpdates.map((u, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top 10 Ranked Video Ideas Slate */}
        {activeMission && activeMission.ideas.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-[#D9DEE7] dark:border-[#222631]">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                TOP {activeMission.ideas.length} RESEARCHED VIDEO IDEAS — PICK ANY WINNER TO PRODUCE
              </div>
              {activeMission.sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500">
                  <span>Sources:</span>
                  {activeMission.sources.slice(0, 3).map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E1392B] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{src.title.slice(0, 24)}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {activeMission.ideas.map((idea) => {
                const isPicked = idea.id === activeMission.selectedIdeaId;
                return (
                  <div
                    key={idea.id}
                    onClick={() => onUpdateMissionConfig({ selectedIdeaId: idea.id })}
                    className={`p-3 rounded-sm border cursor-pointer transition-colors space-y-1.5 text-xs ${
                      isPicked
                        ? "border-[#E1392B] bg-[#E1392B]/5"
                        : "border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] leading-snug">
                        <span className="font-mono text-[#E1392B] mr-1.5">#{idea.rank}</span>
                        {idea.title}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {idea.outlierScore}/100 · ${idea.estRpmUsd.toFixed(2)} RPM
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{idea.angle}</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
                      <div className="px-2 py-1 rounded-sm bg-white dark:bg-[#161922] border border-[#D9DEE7] dark:border-[#252A36] truncate">
                        <span className="text-slate-400">A: </span>
                        {idea.hookVariantA}
                      </div>
                      <div className="px-2 py-1 rounded-sm bg-white dark:bg-[#161922] border border-[#D9DEE7] dark:border-[#252A36] truncate">
                        <span className="text-slate-400">B: </span>
                        {idea.hookVariantB}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                      <span>{idea.niche} · {idea.recommendedTemplate}</span>
                      <span>{isPicked ? "SELECTED FOR PRODUCTION" : "Click to select"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 3. LIVE INDUSTRY NEWS, STREAMS, VIDEOS & SOCIAL INTELLIGENCE RADAR    */}
      {/* ===================================================================== */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#161922] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Live Industry News, Streams, Videos &amp; Social Radar
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keeps both you and your AI Agent updated on the latest creator platform changes, live streams, viral videos, social algorithm shifts, and rival AI clipping tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newsFocusInput}
              onChange={(e) => setNewsFocusInput(e.target.value)}
              placeholder="Radar focus..."
              className="h-8 w-64 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] text-xs text-[#0F172A] dark:text-[#F1F5F9]"
            />
            <button
              type="button"
              disabled={isScanningNews}
              onClick={() => onScanIndustryNews(newsFocusInput)}
              className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {isScanningNews ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isScanningNews ? "Scanning Live Web..." : "Scan Latest Intel"}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setFeedingId("all");
                try {
                  await onFeedNewsToAgent();
                } finally {
                  setFeedingId(null);
                }
              }}
              className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] hover:border-[#E1392B] text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9] inline-flex items-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>{feedingId === "all" ? "Syncing..." : "Feed All to AI Agent"}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9DEE7] dark:border-[#222631] pb-2">
          <div className="flex flex-wrap gap-1.5">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setNewsCategory(cat.id)}
                className={`px-2.5 py-1 rounded-sm font-mono text-[11px] border transition-colors ${
                  newsCategory === cat.id
                    ? "border-[#E1392B] bg-[#E1392B]/10 text-[#E1392B] font-semibold"
                    : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {industryNews?.fetchedAt && (
            <span className="font-mono text-[10px] text-slate-500">
              Updated {new Date(industryNews.fetchedAt).toLocaleTimeString()} · {filteredNews.length} signals
            </span>
          )}
        </div>

        {/* News / Streams / Videos / Social / AI Tools Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/60 dark:bg-[#111318] flex flex-col justify-between gap-3 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1 uppercase font-semibold">
                    {renderCategoryIcon(item.category)}
                    {item.category}
                  </span>
                  <span>{item.publishedHint}</span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] hover:text-[#E1392B] leading-snug"
                >
                  {item.title}
                  <ExternalLink className="w-3 h-3 inline ml-1 opacity-70" />
                </a>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.summary}
                </p>

                <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] space-y-1 text-[11px]">
                  <div className="font-mono text-[9px] text-slate-500">ACTIONABLE TAKEAWAY</div>
                  <div className="text-slate-700 dark:text-slate-200">{item.actionableTakeaway}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D9DEE7] dark:border-[#222631] font-mono text-[10px]">
                <span className="text-slate-500 truncate">{item.source}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={item.fedToAgent || feedingId === item.id}
                    onClick={async () => {
                      setFeedingId(item.id);
                      try {
                        await onFeedNewsToAgent(item.id);
                      } finally {
                        setFeedingId(null);
                      }
                    }}
                    className={`${
                      item.fedToAgent
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-[#E1392B]"
                    }`}
                  >
                    {item.fedToAgent ? "Synced ✓" : "Feed Agent"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPrompt = `Build top 10 viral short-form video ideas inspired by this live signal: "${item.title}" — ${item.actionableTakeaway}`;
                      setPrompt(nextPrompt);
                      setNicheFocus(item.category === "ai-tools" ? "AI & Tech" : "Multi-Niche");
                      onStartMission({
                        prompt: nextPrompt,
                        nicheFocus: item.category === "ai-tools" ? "AI & Tech" : "Multi-Niche",
                        autonomyMode,
                        scheduleCadence,
                      });
                    }}
                    className="text-[#E1392B] hover:underline font-semibold"
                  >
                    Mission →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
