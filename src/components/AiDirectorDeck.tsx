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
  Send,
  Cpu,
  Server,
  Copy,
  Check,
  Download,
  RefreshCw,
} from "lucide-react";
import type {
  AgentChatMessage,
  AiComputeRoutingConfig,
  AiComputeTierId,
  AiDirectorPolicy,
  AutonomousMission,
  CompetitorBreakdown,
  ContentNiche,
  CtaPlacementType,
  DirectorRunResult,
  HostingStageId,
  IndustryNewsSnapshot,
  KnowledgeAcquisitionState,
  LearningDiscoveryType,
  LocalLlmConfig,
  MissionAutonomyMode,
  MissionScheduleCadence,
  MissionStageId,
  MonetizationPlan,
  PipelineConfig,
  PlatformExpansionState,
  SelfLearningCadence,
  SelfLearningState,
  SocialPlatform,
  TrendPulseSnapshot,
  UiMode,
} from "../types";
import { TrendPulseWidget } from "./TrendPulseWidget";
import { AutonomousMissionHub } from "./AutonomousMissionHub";
import { MonetizationGrowthHub } from "./MonetizationGrowthHub";
import { PlatformExpansionHub } from "./PlatformExpansionHub";
import { ComputeHostingHub } from "./ComputeHostingHub";

interface WorkerPackData {
  windowsPs1: string;
  vpsDockerCompose: string;
  lmUrl: string;
  lmModel: string;
}

interface LocalLlmTestResult {
  reachable: boolean;
  latencyMs: number;
  models: string[];
  message: string;
}

interface AiDirectorDeckProps {
  config: PipelineConfig;
  uiMode: UiMode;
  directorHistory: DirectorRunResult[];
  agentMessages: AgentChatMessage[];
  trendPulse?: TrendPulseSnapshot;
  activeMission?: AutonomousMission;
  industryNews?: IndustryNewsSnapshot;
  monetizationPlan?: MonetizationPlan;
  selfLearning?: SelfLearningState;
  knowledgeAcquisition?: KnowledgeAcquisitionState;
  platformExpansion?: PlatformExpansionState;
  computeRouting?: AiComputeRoutingConfig;
  initialSubTab?: "mission" | "monetization" | "expansion" | "agent" | "compute" | "voice";
  isStartingMission: boolean;
  isAdvancingMission: boolean;
  isScanningNews: boolean;
  isOptimizingMonetization?: boolean;
  isProjectingRevenue?: boolean;
  isAnalyzingFunnel?: boolean;
  isApplyingFunnelWinner?: boolean;
  isRunningSelfLearn?: boolean;
  isCrawlingKnowledge?: boolean;
  adoptingDiscoveryId?: string | null;
  isResearchingExpansion?: boolean;
  applyingPatternId?: string | null;
  removingPlatform?: SocialPlatform | null;
  isFetchingTrends: boolean;
  isDirecting: boolean;
  isChattingAgent: boolean;
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
  onUpdateMonetizationPlan?: (patch: Partial<MonetizationPlan>) => Promise<void>;
  onOptimizeMonetization?: () => Promise<void>;
  onProjectRevenue?: (payload?: { horizonMonths?: number; dailyPostsTarget?: number }) => Promise<void>;
  onAddFunnelVariant?: (payload: {
    label: string;
    placement: CtaPlacementType;
    triggerSecond: number;
    ctaCopy: string;
    sponsorBrand: string;
    niche: ContentNiche;
    impressions: number;
    ctrPct: number;
    conversionRatePct: number;
    retentionImpactPct: number;
    avgDealValueUsd: number;
  }) => Promise<void>;
  onAnalyzeFunnel?: (focusSponsor?: string) => Promise<void>;
  onApplyFunnelWinner?: () => Promise<void>;
  onUpdateComputeRouting?: (patch: {
    activeTier?: AiComputeTierId;
    hostingStage?: HostingStageId;
    monthlyBudgetCapUsd?: number;
    autoDowngradeOnBudgetCap?: boolean;
    windowsPcEndpoint?: string;
    windowsPcModel?: string;
    topUpCredits?: number;
    resetSpend?: boolean;
  }) => Promise<void>;
  onUpdateSelfLearnConfig?: (patch: {
    enabled?: boolean;
    cadence?: SelfLearningCadence;
    autoAdoptSafeUpgrades?: boolean;
    focusAreas?: LearningDiscoveryType[];
  }) => Promise<void>;
  onRunSelfLearningCycle?: (customFocus?: string) => Promise<void>;
  onAdoptDiscovery?: (discoveryId: string) => Promise<void>;
  onRunKnowledgeCrawl?: (customTopic?: string) => Promise<void>;
  onOpenIngestOpportunities?: () => void;
  onUpdateExpansionConfig?: (patch: {
    autoSyncToDistribution?: boolean;
    autoTargetMinScore?: number;
    focusNiche?: ContentNiche | "all";
  }) => Promise<void>;
  onResearchExpansion?: (payload: {
    focusNiche?: ContentNiche | "all";
    customQuery?: string;
    autoApplyNow?: boolean;
  }) => Promise<void>;
  onApplyExpansionPattern?: (payload: {
    patternId?: string;
    applyAllHighScore?: boolean;
  }) => Promise<void>;
  onRemoveExpansionPlatform?: (platform: SocialPlatform) => Promise<void>;
  onOpenDistributionTab?: () => void;
  onOpenClipInStudio: (clipId: string) => void;
  onFetchTrends: (focus: string) => Promise<void>;
  onToggleTrendPin: (topicId: string) => Promise<void>;
  onTrackTrendGame: (gameName: string) => Promise<void>;
  onExecuteDirector: (instruction: string) => Promise<void>;
  onSendAgentMessage: (message: string) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onAnalyzeCompetitor: (rivalTitle: string, rivalTranscript: string) => Promise<CompetitorBreakdown | null>;
  onTestLocalLlm: (baseUrl: string) => Promise<LocalLlmTestResult | null>;
  onFetchWorkerPack: () => Promise<WorkerPackData | null>;
}

const QUICK_AGENT_PROMPTS = [
  "Based on our Performance Monitor data, what niche and hook format should I make today?",
  "Queue all approved clips and auto-schedule the fleet with anti-bot stagger.",
  "How should I split tasks between my local LM Studio Gemma 4 2B PC and Cloud Gemini?",
  "Prioritize AI & Tech Breaking Clips and standardize audio to -11 LUFS.",
];

const AUTOPILOT_PLAYBOOKS: Array<{ title: string; detail: string; command: string }> = [
  {
    title: "Full Autonomous Studio Sweep",
    detail: "Audit pending clips, generate hooks on top clip, queue approved cuts & auto-schedule fleet.",
    command:
      "Audit all pending clips via Gemini QA, generate A/B/C viral hooks for the strongest approved clip, move approved clips to the ready queue, and auto-schedule the fleet.",
  },
  {
    title: "Global Multilingual Expansion",
    detail: "Localize flagship clip into Spanish & Portuguese and align multi-channel schedule.",
    command:
      "Translate clip_vice_01 into Spanish (es), suggest timed B-Roll motion cues for it, and auto-schedule ready clips across the fleet.",
  },
  {
    title: "Broadcast -11 LUFS Mastering Pass",
    detail: "Standardize loudness to -11 LUFS across all clips and dispatch pipeline validation.",
    command: "Set workspace audio loudness to -11 LUFS globally, queue all approved clips, and dispatch a worker run.",
  },
];

const OFFLOAD_OPTIONS: Array<{
  id: LocalLlmConfig["offloadTasks"][number];
  label: string;
  desc: string;
}> = [
  { id: "seo-hashtags", label: "SEO Keywords & Hashtags", desc: "Free local Gemma 4 2B JSON packs" },
  { id: "script-draft", label: "Voiceover Script Drafting", desc: "Fast 45-word narration rewrites" },
  { id: "caption-cleanup", label: "Caption & Transcript Cleanup", desc: "Clean filler words locally" },
  { id: "batch-prescore", label: "Batch Pre-Scoring", desc: "Filter low-velocity clips before Cloud QA" },
];

export function AiDirectorDeck({
  config,
  uiMode,
  directorHistory,
  agentMessages,
  trendPulse,
  activeMission,
  industryNews,
  monetizationPlan,
  selfLearning,
  knowledgeAcquisition,
  platformExpansion,
  computeRouting,
  initialSubTab = "mission",
  isStartingMission,
  isAdvancingMission,
  isScanningNews,
  isOptimizingMonetization = false,
  isProjectingRevenue = false,
  isAnalyzingFunnel = false,
  isApplyingFunnelWinner = false,
  isRunningSelfLearn = false,
  isCrawlingKnowledge = false,
  adoptingDiscoveryId = null,
  isResearchingExpansion = false,
  applyingPatternId = null,
  removingPlatform = null,
  isFetchingTrends,
  isDirecting,
  isChattingAgent,
  onStartMission,
  onAdvanceMission,
  onUpdateMissionConfig,
  onScanIndustryNews,
  onFeedNewsToAgent,
  onUpdateMonetizationPlan,
  onOptimizeMonetization,
  onProjectRevenue,
  onAddFunnelVariant,
  onAnalyzeFunnel,
  onApplyFunnelWinner,
  onUpdateComputeRouting,
  onUpdateSelfLearnConfig,
  onRunSelfLearningCycle,
  onAdoptDiscovery,
  onRunKnowledgeCrawl,
  onOpenIngestOpportunities,
  onUpdateExpansionConfig,
  onResearchExpansion,
  onApplyExpansionPattern,
  onRemoveExpansionPlatform,
  onOpenDistributionTab,
  onOpenClipInStudio,
  onFetchTrends,
  onToggleTrendPin,
  onTrackTrendGame,
  onExecuteDirector,
  onSendAgentMessage,
  onSaveConfig,
  onAnalyzeCompetitor,
  onTestLocalLlm,
  onFetchWorkerPack,
}: AiDirectorDeckProps) {
  const [subTab, setSubTab] = useState<"mission" | "monetization" | "expansion" | "agent" | "compute" | "voice">(initialSubTab);

  const defaultPolicy: AiDirectorPolicy = config.aiDirector || {
    mode: "supervised",
    brandVoice: "hype-arcade",
    customVoicePrompt:
      "Write sharp, fast-paced hooks under 34 characters anchored in exact moments or bold claims.",
    autoAuditOnIngest: true,
    autoGenerateHooks: true,
    autoLocalizeLocales: ["es", "pt"],
    maxAutoActionsPerRun: 4,
  };

  const defaultLocalLlm: LocalLlmConfig = config.localLlm || {
    enabled: true,
    routingMode: "hybrid-local-first",
    baseUrl: "http://localhost:1234/v1",
    model: "gemma-4-2b-it",
    computeHost: "windows-pc",
    offloadTasks: ["seo-hashtags", "script-draft", "caption-cleanup"],
  };

  const [chatInput, setChatInput] = useState("");
  const [instruction, setInstruction] = useState("");
  const [policyDraft, setPolicyDraft] = useState<AiDirectorPolicy>(defaultPolicy);
  const [localLlmDraft, setLocalLlmDraft] = useState<LocalLlmConfig>(defaultLocalLlm);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingCompute, setSavingCompute] = useState(false);
  const [testingLm, setTestingLm] = useState(false);
  const [lmTestResult, setLmTestResult] = useState<LocalLlmTestResult | null>(null);
  const [workerPack, setWorkerPack] = useState<WorkerPackData | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [copiedPack, setCopiedPack] = useState<string | null>(null);

  // Competitor Formula Reverse-Engineer
  const [rivalTitle, setRivalTitle] = useState("");
  const [rivalTranscript, setRivalTranscript] = useState("");
  const [analyzingRival, setAnalyzingRival] = useState(false);
  const [rivalBreakdown, setRivalBreakdown] = useState<CompetitorBreakdown | null>(null);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || isChattingAgent) return;
    const msg = chatInput.trim();
    setChatInput("");
    await onSendAgentMessage(msg);
  }

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

  async function handleSaveLocalLlm() {
    setSavingCompute(true);
    try {
      await onSaveConfig({ ...config, localLlm: localLlmDraft });
    } finally {
      setSavingCompute(false);
    }
  }

  async function handlePingLmStudio() {
    setTestingLm(true);
    try {
      const res = await onTestLocalLlm(localLlmDraft.baseUrl);
      if (res) {
        setLmTestResult(res);
        if (res.reachable && res.models.length > 0 && !res.models.includes(localLlmDraft.model)) {
          setLocalLlmDraft((prev) => ({ ...prev, model: res.models[0] }));
        }
      }
    } finally {
      setTestingLm(false);
    }
  }

  async function handleLoadWorkerPack() {
    setLoadingPack(true);
    try {
      const pack = await onFetchWorkerPack();
      if (pack) setWorkerPack(pack);
    } finally {
      setLoadingPack(false);
    }
  }

  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Top Sub-Navigation & Mode Bar */}
      <div className="px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          {(
            [
              { id: "mission", label: "Autonomous Mission Map & News Radar" },
              { id: "monetization", label: "Monetization & Self-Learning" },
              { id: "expansion", label: "Platform Expansion" },
              { id: "agent", label: "Studio Ops Agent & Trends" },
              { id: "compute", label: "LM Studio (Gemma 4 2B) & Windows → VPS" },
              ...(uiMode === "advanced" ? ([{ id: "voice", label: "Brand Voice & Competitor Lab" }] as const) : []),
            ] as const
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSubTab(t.id);
                  if (t.id === "compute" && !workerPack) handleLoadWorkerPack();
                }}
                className={`relative py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "text-[#0F172A] dark:text-[#F1F5F9]"
                    : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
                }`}
              >
                {t.label}
                {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center p-0.5 my-1.5 rounded-sm bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37] text-xs">
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
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              {mode === "autonomous" ? "Full Auto" : "Supervised"}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: MONETIZATION & SCHEDULED SELF-LEARNING GROWTH HUB */}
      {subTab === "monetization" && onUpdateMonetizationPlan && onOptimizeMonetization && onUpdateSelfLearnConfig && onRunSelfLearningCycle && onAdoptDiscovery && (
        <div className="p-5 sm:p-6 max-w-[1440px] w-full mx-auto">
          <MonetizationGrowthHub
            monetizationPlan={monetizationPlan}
            selfLearning={selfLearning}
            knowledgeAcquisition={knowledgeAcquisition}
            isOptimizingMonetization={isOptimizingMonetization}
            isProjectingRevenue={isProjectingRevenue}
            isAnalyzingFunnel={isAnalyzingFunnel}
            isApplyingFunnelWinner={isApplyingFunnelWinner}
            isRunningSelfLearn={isRunningSelfLearn}
            isCrawlingKnowledge={isCrawlingKnowledge}
            adoptingDiscoveryId={adoptingDiscoveryId}
            onUpdateMonetizationPlan={onUpdateMonetizationPlan}
            onOptimizeMonetization={onOptimizeMonetization}
            onProjectRevenue={onProjectRevenue}
            onAddFunnelVariant={onAddFunnelVariant}
            onAnalyzeFunnel={onAnalyzeFunnel}
            onApplyFunnelWinner={onApplyFunnelWinner}
            onUpdateSelfLearnConfig={onUpdateSelfLearnConfig}
            onRunSelfLearningCycle={onRunSelfLearningCycle}
            onAdoptDiscovery={onAdoptDiscovery}
            onRunKnowledgeCrawl={onRunKnowledgeCrawl}
            onOpenIngestOpportunities={onOpenIngestOpportunities}
          />
        </div>
      )}

      {/* SUB-TAB 2: PLATFORM EXPANSION ENGINE */}
      {subTab === "expansion" && onUpdateExpansionConfig && onResearchExpansion && onApplyExpansionPattern && onRemoveExpansionPlatform && onOpenDistributionTab && (
        <div className="p-5 sm:p-6 max-w-[1440px] w-full mx-auto">
          <PlatformExpansionHub
            config={config}
            platformExpansion={platformExpansion}
            isResearchingExpansion={isResearchingExpansion}
            applyingPatternId={applyingPatternId}
            removingPlatform={removingPlatform}
            onUpdateExpansionConfig={onUpdateExpansionConfig}
            onResearchExpansion={onResearchExpansion}
            onApplyExpansionPattern={onApplyExpansionPattern}
            onRemoveExpansionPlatform={onRemoveExpansionPlatform}
            onOpenDistributionTab={onOpenDistributionTab}
          />
        </div>
      )}

      {/* SUB-TAB 0: END-TO-END AUTONOMOUS 12-STAGE MISSION CONTROL & LIVE NEWS RADAR */}
      {subTab === "mission" && (
        <div className="p-5 sm:p-6 max-w-[1440px] w-full mx-auto">
          <AutonomousMissionHub
            activeMission={activeMission}
            industryNews={industryNews}
            isStartingMission={isStartingMission}
            isAdvancingMission={isAdvancingMission}
            isScanningNews={isScanningNews}
            onStartMission={onStartMission}
            onAdvanceMission={onAdvanceMission}
            onUpdateMissionConfig={onUpdateMissionConfig}
            onScanIndustryNews={onScanIndustryNews}
            onFeedNewsToAgent={onFeedNewsToAgent}
            onOpenClipInStudio={onOpenClipInStudio}
          />
        </div>
      )}

      {/* SUB-TAB 1: CONVERSATIONAL STUDIO OPS AGENT & TRENDPULSE */}
      {subTab === "agent" && (
        <>
          <TrendPulseWidget
            snapshot={trendPulse}
            config={config}
            isFetching={isFetchingTrends}
            isDirecting={isDirecting}
            onFetchTrends={onFetchTrends}
            onTogglePin={onToggleTrendPin}
            onTrackGame={onTrackTrendGame}
            onDirectTopic={onExecuteDirector}
          />

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
            {/* Left (7 cols): Persistent Conversational Studio Ops Agent */}
            <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] flex flex-col">
              <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Dedicated Studio Ops Agent
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  Router: {localLlmDraft.enabled ? `${localLlmDraft.routingMode} (${localLlmDraft.model})` : "Cloud Gemini"}
                </span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[430px] bg-[#F6F7F9]/50 dark:bg-[#0D0F14]">
                {agentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-sm border text-xs space-y-2 ${
                      msg.role === "user"
                        ? "ml-8 border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720]"
                        : "mr-4 border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-500">
                      <span className={msg.role === "agent" ? "text-[#E1392B] font-semibold" : "font-semibold"}>
                        {msg.role === "agent" ? "CLIPFORGE OPS AGENT" : "OPERATOR"}
                      </span>
                      <span>
                        {msg.engine === "lm-studio-local"
                          ? "LM Studio Local"
                          : msg.engine === "hybrid"
                            ? "Hybrid Router"
                            : "Gemini Cloud"}
                      </span>
                    </div>
                    <p className="text-[#0F172A] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    {msg.executedSteps && msg.executedSteps.length > 0 && (
                      <div className="pt-2 border-t border-[#ECEFF3] dark:border-[#1E222C] space-y-1">
                        {msg.executedSteps.map((st, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>
                              {st.action}: {st.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Prompts + Chat Input */}
              <div className="p-4 border-t border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0A0B0E] space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AGENT_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={isChattingAgent}
                      onClick={() => onSendAgentMessage(q)}
                      className="px-2.5 py-1 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] hover:border-[#E1392B] text-[11px] text-slate-600 dark:text-slate-300 text-left truncate max-w-full"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your Ops Agent what to make next or tell it to queue/schedule/configure..."
                    className="flex-1 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#111318] text-xs focus:outline-none focus:border-[#E1392B]"
                  />
                  <button
                    type="submit"
                    disabled={isChattingAgent || !chatInput.trim()}
                    className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {isChattingAgent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right (5 cols): One-Click Playbooks + Batch Director Log */}
            <div className="xl:col-span-5 bg-[#F6F7F9] dark:bg-[#0F1117] divide-y divide-[#D9DEE7] dark:divide-[#222631] text-xs">
              <div className="p-5 space-y-3">
                <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  One-Click Autonomous Playbooks
                </div>
                <div className="space-y-2">
                  {AUTOPILOT_PLAYBOOKS.map((pb) => (
                    <button
                      key={pb.title}
                      type="button"
                      disabled={isDirecting}
                      onClick={() => onExecuteDirector(pb.command)}
                      className="w-full p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-left transition-colors space-y-1 disabled:opacity-50"
                    >
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{pb.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{pb.detail}</div>
                    </button>
                  ))}
                </div>

                {uiMode === "advanced" && (
                  <form onSubmit={handleRunCommand} className="pt-2 space-y-2">
                    <label className="block font-mono text-[10px] text-slate-500">
                      MULTI-STEP DIRECTOR BATCH COMMAND
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g., Audit pending clips and translate top clip to ES..."
                        className="flex-1 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720]"
                      />
                      <button
                        type="submit"
                        disabled={isDirecting || !instruction.trim()}
                        className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1"
                      >
                        {isDirecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        <span>Run</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Execution Audit Log */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                    Director Execution Audit Log
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{directorHistory.length} run(s)</span>
                </div>
                {directorHistory.length === 0 ? (
                  <p className="text-slate-500">
                    Run a playbook above to inspect real multi-step workspace mutations.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                    {directorHistory.map((run) => (
                      <div
                        key={run.id}
                        className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                            {run.instruction}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">{run.latencyMs}ms</span>
                        </div>
                        <div className="space-y-1">
                          {run.steps.map((st, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              {st.status === "executed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : st.status === "failed" ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              ) : (
                                <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <span className="text-slate-600 dark:text-slate-300">
                                <strong className="font-mono">{st.action}</strong> — {st.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: COMPUTE TIERS, CREDITS, GITHUB/CLOUDFLARE/SUPABASE & LOCAL WINDOWS PC */}
      {subTab === "compute" && (
        <div className="flex-1 flex flex-col">
          {onUpdateComputeRouting && (
            <div className="p-5 sm:p-6 max-w-[1440px] w-full mx-auto border-b border-[#D9DEE7] dark:border-[#222631]">
              <ComputeHostingHub
                computeRouting={computeRouting}
                onUpdateComputeRouting={onUpdateComputeRouting}
              />
            </div>
          )}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
          {/* Left (6 cols): Local LM Studio Hybrid Router */}
          <section className="xl:col-span-6 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-[#E1392B] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>HYBRID LOCAL LLM ROUTER · LM STUDIO</span>
                </div>
                <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Run Gemma 4 2B Locally for Free Bulk Automation
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Offload repetitive SEO, voiceover script drafts, and transcript cleanup to your Windows PC&rsquo;s LM Studio OpenAI-compatible server, while reserving Cloud Gemini for Google Search research and 24kHz TTS audio.
                </p>
              </div>
              <button
                type="button"
                disabled={savingCompute}
                onClick={handleSaveLocalLlm}
                className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingCompute ? "Saving..." : "Save Router"}</span>
              </button>
            </div>

            <label className="flex items-center justify-between p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#111318] cursor-pointer">
              <div>
                <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Enable Local LM Studio Offloading</div>
                <div className="text-[11px] text-slate-500">Auto-fallback to Cloud Gemini if local PC is offline</div>
              </div>
              <input
                type="checkbox"
                checked={localLlmDraft.enabled}
                onChange={(e) => setLocalLlmDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 accent-[#E1392B]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">LM Studio Endpoint URL</label>
                <input
                  type="text"
                  value={localLlmDraft.baseUrl}
                  onChange={(e) => setLocalLlmDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="http://localhost:1234/v1"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Loaded Model ID</label>
                <input
                  type="text"
                  value={localLlmDraft.model}
                  onChange={(e) => setLocalLlmDraft((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="gemma-4-2b-it"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Routing Policy</label>
                <select
                  value={localLlmDraft.routingMode}
                  onChange={(e) =>
                    setLocalLlmDraft((prev) => ({
                      ...prev,
                      routingMode: e.target.value as LocalLlmConfig["routingMode"],
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720]"
                >
                  <option value="hybrid-local-first">Hybrid (LM Studio First → Cloud Gemini Fallback)</option>
                  <option value="cloud-only">Cloud Gemini Only</option>
                  <option value="local-only">Local LM Studio Strict</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Active Compute Host</label>
                <select
                  value={localLlmDraft.computeHost}
                  onChange={(e) =>
                    setLocalLlmDraft((prev) => ({
                      ...prev,
                      computeHost: e.target.value as LocalLlmConfig["computeHost"],
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720]"
                >
                  <option value="windows-pc">Windows PC (LM Studio + FFmpeg)</option>
                  <option value="linux-vps">24/7 Linux VPS (Docker + Ollama)</option>
                </select>
              </div>
            </div>

            {/* Offload Task Checkboxes */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-slate-500">TASKS OFFLOADED TO LOCAL GEMMA 4 2B</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OFFLOAD_OPTIONS.map((task) => {
                  const checked = localLlmDraft.offloadTasks.includes(task.id);
                  return (
                    <label
                      key={task.id}
                      className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720] flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{task.label}</div>
                        <div className="text-[10px] text-slate-500">{task.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setLocalLlmDraft((prev) => ({
                            ...prev,
                            offloadTasks: e.target.checked
                              ? [...prev.offloadTasks, task.id]
                              : prev.offloadTasks.filter((x) => x !== task.id),
                          }));
                        }}
                        className="mt-0.5 accent-[#E1392B]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Test Connection */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                disabled={testingLm}
                onClick={handlePingLmStudio}
                className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5"
              >
                {testingLm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{testingLm ? "Pinging LM Studio..." : "Test LM Studio Connection"}</span>
              </button>

              {lmTestResult && (
                <div
                  className={`p-3 rounded-sm border text-xs space-y-1 ${
                    lmTestResult.reachable
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  <div className="font-mono font-semibold">
                    {lmTestResult.reachable ? "CONNECTED" : "NOT REACHABLE FROM CLOUD HOST"} · {lmTestResult.latencyMs}ms
                  </div>
                  <p>{lmTestResult.message}</p>
                  {lmTestResult.models.length > 0 && (
                    <div className="font-mono text-[11px]">Models: {lmTestResult.models.join(", ")}</div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Right (6 cols): Windows PC -> Linux VPS Scale-Out Manager */}
          <section className="xl:col-span-6 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>SCALE MANAGER · WINDOWS PC → 24/7 LINUX VPS</span>
                </div>
                <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Start Free on Windows, Graduate to VPS in 1 Command
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Download the Windows PowerShell worker to run LM Studio + FFmpeg on your desktop now. When you scale past 10+ channels/day, drop the Docker Compose pack onto any Ubuntu VPS (Hetzner / Vultr).
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadWorkerPack}
                disabled={loadingPack}
                className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] font-medium inline-flex items-center gap-1.5 shrink-0"
              >
                {loadingPack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Refresh Pack</span>
              </button>
            </div>

            {/* 2-Stage Roadmap Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#D9DEE7] dark:border-[#222631] divide-y sm:divide-y-0 sm:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-white dark:bg-[#141720]">
              <div className="p-3.5 space-y-1">
                <div className="font-mono text-[10px] font-semibold text-[#E1392B]">STAGE 1 · WINDOWS PC (NOW)</div>
                <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">LM Studio + PowerShell Worker</div>
                <p className="text-[11px] text-slate-500">
                  Zero monthly server cost. Run Gemma 4 2B on your GPU/CPU and render vertical FFmpeg cuts locally.
                </p>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  STAGE 2 · LINUX VPS (SCALE)
                </div>
                <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Docker Compose + Ollama 24/7</div>
                <p className="text-[11px] text-slate-500">
                  Always-on multi-channel ingestion, rendering, and scheduled posting across 12 languages.
                </p>
              </div>
            </div>

            {workerPack ? (
              <div className="space-y-4">
                {/* Windows PowerShell Script */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      windows-worker.ps1 (Windows PC + LM Studio)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(workerPack.windowsPs1);
                          setCopiedPack("win");
                          setTimeout(() => setCopiedPack(null), 1500);
                        }}
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] inline-flex items-center gap-1"
                      >
                        {copiedPack === "win" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile("clipforge-windows-worker.ps1", workerPack.windowsPs1)}
                        className="h-7 px-2.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>.ps1</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-sm bg-[#0A0B0E] text-slate-200 font-mono text-[11px] overflow-x-auto max-h-40 border border-[#222631]">
                    <code>{workerPack.windowsPs1}</code>
                  </pre>
                </div>

                {/* VPS Docker Compose */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      docker-compose.vps.yml (24/7 Linux VPS Migration)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(workerPack.vpsDockerCompose);
                          setCopiedPack("vps");
                          setTimeout(() => setCopiedPack(null), 1500);
                        }}
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] inline-flex items-center gap-1"
                      >
                        {copiedPack === "vps" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile("docker-compose.vps.yml", workerPack.vpsDockerCompose)}
                        className="h-7 px-2.5 rounded-sm bg-[#E1392B] text-white font-semibold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>.yml</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-sm bg-[#0A0B0E] text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-[#222631]">
                    <code>{workerPack.vpsDockerCompose}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-center text-slate-500">
                Loading Windows PC &amp; VPS deployment manifests...
              </div>
            )}
          </section>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BRAND VOICE & COMPETITOR LAB */}
      {subTab === "voice" && (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 text-xs">
          {/* Brand Voice & Guardrails */}
          <section className="xl:col-span-6 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Brand Voice &amp; Autopilot Guardrails
              </h3>
              <button
                type="button"
                disabled={savingPolicy}
                onClick={handleSavePolicy}
                className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
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
                  className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720]"
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
                  className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Global System Voice Directive</label>
              <textarea
                rows={4}
                value={policyDraft.customVoicePrompt}
                onChange={(e) => setPolicyDraft((p) => ({ ...p, customVoicePrompt: e.target.value }))}
                className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] leading-relaxed"
              />
            </div>

            <div className="space-y-2 pt-1">
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
          <section className="xl:col-span-6 p-5 bg-[#F6F7F9] dark:bg-[#0F1117] space-y-4">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#E1392B]" />
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
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
                className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720]"
              />
              <textarea
                rows={4}
                required
                value={rivalTranscript}
                onChange={(e) => setRivalTranscript(e.target.value)}
                placeholder="Paste rival short's opening 15 seconds transcript..."
                className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720]"
              />
              <button
                type="submit"
                disabled={analyzingRival}
                className="w-full h-9 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {analyzingRival ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{analyzingRival ? "Dissecting Hook..." : "Reverse-Engineer Competitor"}</span>
              </button>
            </form>

            {rivalBreakdown && (
              <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#141720] space-y-2.5">
                <div>
                  <div className="font-mono text-[10px] text-[#E1392B] font-semibold">COUNTER HOOK BANNER</div>
                  <div className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
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
      )}
    </div>
  );
}
