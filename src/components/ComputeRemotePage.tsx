import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Cpu,
  Download,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Server,
  Terminal,
} from "lucide-react";
import type {
  AiComputeRoutingConfig,
  AiComputeTierId,
  HostingStageId,
  LocalLlmConfig,
  PipelineConfig,
  RemoteBridgeConfig,
  RemoteMessagingPlatform,
  WorkspaceTab,
} from "../types";
import { ComputeHostingHub } from "./ComputeHostingHub";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

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

interface ComputeRemotePageProps {
  config: PipelineConfig;
  computeRouting?: AiComputeRoutingConfig;
  remoteBridge?: RemoteBridgeConfig;
  onUpdateComputeRouting: (patch: {
    activeTier?: AiComputeTierId;
    hostingStage?: HostingStageId;
    monthlyBudgetCapUsd?: number;
    autoDowngradeOnBudgetCap?: boolean;
    windowsPcEndpoint?: string;
    windowsPcModel?: string;
    topUpCredits?: number;
    resetSpend?: boolean;
  }) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onTestLocalLlm: (baseUrl: string) => Promise<LocalLlmTestResult | null>;
  onFetchWorkerPack: () => Promise<WorkerPackData | null>;
  onUpdateRemoteBridge: (patch: Partial<RemoteBridgeConfig>) => Promise<void>;
  onRunRemoteCommand: (platform: RemoteMessagingPlatform, command: string) => Promise<void>;
  onSelectTab: (tab: WorkspaceTab) => void;
}

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

const SLASH_COMMANDS = ["/status", "/revenue", "/alerts", "/approve", "/top10"];

export function ComputeRemotePage({
  config,
  computeRouting,
  remoteBridge,
  onUpdateComputeRouting,
  onSaveConfig,
  onTestLocalLlm,
  onFetchWorkerPack,
  onUpdateRemoteBridge,
  onRunRemoteCommand,
  onSelectTab,
}: ComputeRemotePageProps) {
  const [subView, setSubView] = useState<"tiers" | "windows-vps" | "remote-bridge">("tiers");

  const [localDraft, setLocalDraft] = useState<LocalLlmConfig>(
    config.localLlm || {
      enabled: true,
      routingMode: "hybrid-local-first",
      baseUrl: "http://localhost:1234/v1",
      model: "gemma-4-2b-it",
      computeHost: "windows-pc",
      offloadTasks: ["seo-hashtags", "script-draft", "caption-cleanup"],
    }
  );
  const [savingLocal, setSavingLocal] = useState(false);
  const [testingLocal, setTestingLocal] = useState(false);
  const [pingResult, setPingResult] = useState<LocalLlmTestResult | null>(null);
  const [workerPack, setWorkerPack] = useState<WorkerPackData | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Remote messaging command console
  const [cmdPlatform, setCmdPlatform] = useState<RemoteMessagingPlatform>("discord");
  const [cmdText, setCmdText] = useState("/status");
  const [runningCmd, setRunningCmd] = useState(false);

  async function handleSaveLocal() {
    setSavingLocal(true);
    try {
      await onSaveConfig({ ...config, localLlm: localDraft });
    } finally {
      setSavingLocal(false);
    }
  }

  async function handlePing() {
    setTestingLocal(true);
    try {
      const res = await onTestLocalLlm(localDraft.baseUrl);
      if (res) {
        setPingResult(res);
        if (res.reachable && res.models.length > 0 && !res.models.includes(localDraft.model)) {
          setLocalDraft((prev) => ({ ...prev, model: res.models[0] }));
        }
      }
    } finally {
      setTestingLocal(false);
    }
  }

  async function handleLoadPack() {
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

  function copyValue(key: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const enabledBridges = [
    remoteBridge?.discordEnabled ? "Discord" : null,
    remoteBridge?.telegramEnabled ? "Telegram" : null,
    remoteBridge?.whatsappEnabled ? "WhatsApp" : null,
  ].filter(Boolean);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Infrastructure & System"
        title="AI Compute Tiers, Windows PC Local LLM & Remote Control Bridge"
        subtitle="Scale smoothly from $0 free learning and local Windows PC LM Studio inference up to cloud VPS workers and flagship Gemini APIs—while controlling your entire studio remotely from Discord, Telegram, or WhatsApp."
        metaItems={[
          { label: `Tier: ${computeRouting?.activeTier || "cloud-standard"}`, emphasis: "crimson" },
          { label: `${computeRouting?.creditsBalance ?? 500} Credits`, emphasis: "emerald" },
          { label: `Local Model: ${localDraft.model}` },
          { label: `${enabledBridges.length} Remote Bridges Active` },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("gitops")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Open GitOps &amp; Deploy</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E1392B]" />
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "tier",
            label: "Active AI Compute Tier",
            value: computeRouting?.activeTier || "cloud-standard",
            subtext: `Spend $${(computeRouting?.estMonthSpendUsd ?? 0).toFixed(2)} / $${computeRouting?.monthlyBudgetCapUsd ?? 25} cap`,
            tone: "crimson",
            onClick: () => setSubView("tiers"),
          },
          {
            id: "credits",
            label: "Workspace Credit Balance",
            value: String(computeRouting?.creditsBalance ?? 500),
            subtext: `${computeRouting?.hostingStage || "stage-1-free"} hosting blueprint`,
            tone: "emerald",
            onClick: () => setSubView("tiers"),
          },
          {
            id: "local-llm",
            label: "Windows PC / VPS Local LLM",
            value: localDraft.enabled ? localDraft.routingMode : "Disabled",
            subtext: `${localDraft.model} @ ${localDraft.baseUrl}`,
            onClick: () => setSubView("windows-vps"),
          },
          {
            id: "remote",
            label: "Remote Messaging Control",
            value: enabledBridges.length > 0 ? enabledBridges.join(" · ") : "Paused",
            subtext: `${remoteBridge?.commandHistory?.length || 0} logged remote actions`,
            onClick: () => setSubView("remote-bridge"),
          },
        ]}
      />

      {/* Focused Sub-View Tabs */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex items-center gap-6 overflow-x-auto">
        {(
          [
            { id: "tiers", label: "AI Tiers, Credits & Hosting Roadmap", icon: Cpu },
            { id: "windows-vps", label: "Windows PC LM Studio & VPS Worker Pack", icon: Server },
            { id: "remote-bridge", label: "Discord, Telegram & WhatsApp Remote Control", icon: MessageSquare },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

      {/* SUBVIEW 1: AI COMPUTE TIERS & HOSTING ROADMAP */}
      {subView === "tiers" && (
        <div className="p-5">
          <ComputeHostingHub
            computeRouting={computeRouting}
            onUpdateComputeRouting={onUpdateComputeRouting}
          />
        </div>
      )}

      {/* SUBVIEW 2: WINDOWS PC LM STUDIO & VPS WORKER PACK */}
      {subView === "windows-vps" && (
        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-7 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4 text-xs">
            <StudioSectionHeader
              zone="action"
              title="Local LLM Offload Router (LM Studio / Ollama)"
              detail="Route high-frequency drafts & SEO to your own GPU at $0 API cost"
              rightSlot={
                <button
                  type="button"
                  disabled={savingLocal}
                  onClick={handleSaveLocal}
                  className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {savingLocal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#E1392B]" />}
                  <span>Save Routing</span>
                </button>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Routing Policy</label>
                <select
                  value={localDraft.routingMode}
                  onChange={(e) =>
                    setLocalDraft((prev) => ({
                      ...prev,
                      routingMode: e.target.value as LocalLlmConfig["routingMode"],
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                >
                  <option value="hybrid-local-first">Hybrid: Local First, Cloud Fallback</option>
                  <option value="local-only">Local Only ($0 Cloud Spend)</option>
                  <option value="cloud-only">Cloud Gemini Only</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Compute Host</label>
                <select
                  value={localDraft.computeHost}
                  onChange={(e) =>
                    setLocalDraft((prev) => ({
                      ...prev,
                      computeHost: e.target.value as LocalLlmConfig["computeHost"],
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                >
                  <option value="windows-pc">Windows PC (LM Studio / Ollama)</option>
                  <option value="linux-vps">Linux VPS (Docker Worker)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">OpenAI-Compatible Endpoint URL</label>
                <input
                  type="text"
                  value={localDraft.baseUrl}
                  onChange={(e) => setLocalDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Loaded Local Model ID</label>
                <input
                  type="text"
                  value={localDraft.model}
                  onChange={(e) => setLocalDraft((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-slate-600 dark:text-slate-300">
                Tasks Offloaded to Local LLM
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OFFLOAD_OPTIONS.map((opt) => {
                  const checked = localDraft.offloadTasks.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] flex items-start gap-2.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setLocalDraft((prev) => ({
                            ...prev,
                            offloadTasks: e.target.checked
                              ? [...prev.offloadTasks, opt.id]
                              : prev.offloadTasks.filter((t) => t !== opt.id),
                          }));
                        }}
                        className="mt-0.5 accent-[#E1392B]"
                      />
                      <div>
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{opt.label}</div>
                        <div className="text-[11px] text-slate-500">{opt.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D] flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[11px] text-slate-500">
                {pingResult
                  ? pingResult.reachable
                    ? `Connected (${pingResult.latencyMs}ms · ${pingResult.models.join(", ") || localDraft.model})`
                    : pingResult.message
                  : "Test live reachability against your local LM Studio or VPS server"}
              </div>
              <button
                type="button"
                disabled={testingLocal}
                onClick={handlePing}
                className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {testingLocal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#E1392B]" />}
                <span>Ping Local Server</span>
              </button>
            </div>
          </section>

          <section className="xl:col-span-5 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4 text-xs">
            <StudioSectionHeader
              zone="telemetry"
              title="Windows PC & Linux VPS Worker Pack"
              detail="1-click scripts for 24/7 autonomous clipping & rendering"
            />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate pre-configured PowerShell (Windows PC with LM Studio + FFmpeg) and Docker Compose (Linux VPS) worker files synced to your active model settings.
            </p>
            <button
              type="button"
              disabled={loadingPack}
              onClick={handleLoadPack}
              className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {loadingPack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{workerPack ? "Refresh Worker Pack" : "Generate Windows & VPS Scripts"}</span>
            </button>

            {workerPack && (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      clipforge-windows-worker.ps1
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyValue("ps1", workerPack.windowsPs1)}
                        className="text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
                      >
                        {copiedKey === "ps1" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile("clipforge-windows-worker.ps1", workerPack.windowsPs1)}
                        className="text-[#E1392B] hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-36 overflow-auto font-mono text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {workerPack.windowsPs1.slice(0, 600)}
                  </pre>
                </div>

                <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      docker-compose.vps.yml
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyValue("vps", workerPack.vpsDockerCompose)}
                        className="text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
                      >
                        {copiedKey === "vps" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile("docker-compose.vps.yml", workerPack.vpsDockerCompose)}
                        className="text-[#E1392B] hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-36 overflow-auto font-mono text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {workerPack.vpsDockerCompose.slice(0, 600)}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBVIEW 3: REMOTE CONTROL BRIDGE */}
      {subView === "remote-bridge" && remoteBridge && (
        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4 text-xs">
            <StudioSectionHeader
              zone="action"
              title="Two-Way Remote Channels & Alert Triggers"
              detail="Webhook secrets stay server-side in environment variables"
              rightSlot={
                <button
                  type="button"
                  onClick={() => onSelectTab("monetization")}
                  className="text-xs font-semibold text-[#E1392B] hover:underline whitespace-nowrap"
                >
                  Discord AI Alerts Panel
                </button>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  { id: "discordEnabled", label: "Discord Bridge", env: remoteBridge.envConfigured.discord },
                  { id: "telegramEnabled", label: "Telegram Bot", env: remoteBridge.envConfigured.telegram },
                  { id: "whatsappEnabled", label: "WhatsApp Cloud", env: remoteBridge.envConfigured.whatsapp },
                ] as const
              ).map((ch) => {
                const enabled = Boolean(remoteBridge[ch.id]);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onUpdateRemoteBridge({ [ch.id]: !enabled })}
                    className={`p-3 rounded-xs border text-left space-y-1 transition-colors ${
                      enabled
                        ? "border-emerald-500/40 bg-emerald-500/[0.05]"
                        : "border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14]"
                    }`}
                  >
                    <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{ch.label}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {enabled ? "Enabled" : "Paused"} · {ch.env ? "Webhook Env Set" : "Local Log Mode"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  { key: "alertOnMissionSuccess", label: "Mission Success Alerts" },
                  { key: "alertOnRevenueSurge", label: "ROI Surge Alerts" },
                  { key: "alertOnCompetitorRelease", label: "Competitor Release Triggers" },
                  { key: "alertOnSponsorBurnRate", label: "Sponsor Health Burn Rate" },
                  { key: "alertOnApprovalGates", label: "Mission Approval Gates" },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="p-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(remoteBridge[item.key])}
                    onChange={(e) => onUpdateRemoteBridge({ [item.key]: e.target.checked })}
                    className="accent-[#E1392B]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4 text-xs">
            <StudioSectionHeader
              zone="action"
              title="Live Slash-Command Terminal & Dispatch Audit Log"
              detail="Test Discord, Telegram, or WhatsApp commands directly"
            />

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!cmdText.trim() || runningCmd) return;
                setRunningCmd(true);
                try {
                  await onRunRemoteCommand(cmdPlatform, cmdText.trim());
                } finally {
                  setRunningCmd(false);
                }
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <select
                aria-label="Remote platform"
                value={cmdPlatform}
                onChange={(e) => setCmdPlatform(e.target.value as RemoteMessagingPlatform)}
                className="h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
              >
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <input
                type="text"
                value={cmdText}
                onChange={(e) => setCmdText(e.target.value)}
                placeholder="/status, /revenue, /alerts, /approve, /top10"
                className="flex-1 min-w-[160px] h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono"
              />
              <button
                type="submit"
                disabled={runningCmd}
                className="h-9 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {runningCmd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Command</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5">
              {SLASH_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => setCmdText(cmd)}
                  className="px-2 py-1 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] font-mono text-[11px] text-slate-600 dark:text-slate-300 hover:border-[#E1392B]"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29] max-h-64 overflow-y-auto">
              {(remoteBridge.commandHistory || []).map((entry) => (
                <div key={entry.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      <Terminal className="w-3 h-3 text-[#E1392B]" />
                      <span>
                        {entry.platform} · {entry.commandOrEvent}
                      </span>
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {entry.status} · {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{entry.responseSummary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
