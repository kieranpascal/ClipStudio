import { useEffect, useState } from "react";
import {
  Cpu,
  Cloud,
  Laptop,
  Sliders,
  Coins,
  Download,
  Copy,
  Check,
  Database,
  Globe,
  RefreshCw,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type {
  AiComputeRoutingConfig,
  AiComputeTierId,
  HostingStageId,
} from "../types";

interface ComputeHostingHubProps {
  computeRouting?: AiComputeRoutingConfig;
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
}

interface BlueprintFiles {
  supabaseConfigured: boolean;
  supabaseSchemaSql: string;
  wranglerToml: string;
  githubWorkflowYml: string;
  windowsLocalPs1: string;
}

const COMPUTE_TIERS: Array<{
  id: AiComputeTierId;
  title: string;
  costBadge: string;
  models: string;
  bestFor: string;
  creditsPerTask: string;
}> = [
  {
    id: "manual-free",
    title: "Tier 0 · Manual & Browser Native",
    costBadge: "$0 / mo",
    models: "Browser Canvas Animator · WebAudio Synth · Manual Studio",
    bestFor: "100% free learning, offline thumbnail/video animation & procedural beats",
    creditsPerTask: "0 credits",
  },
  {
    id: "windows-pc-local",
    title: "Tier 1 · Windows PC Local LLM",
    costBadge: "$0 API (Your GPU)",
    models: "Ollama / LM Studio (gemma3:4b, gemma-4-2b-it, qwen2.5)",
    bestFor: "Unlimited private scripts, SEO packs, captions & chat on your Windows PC",
    creditsPerTask: "0 credits",
  },
  {
    id: "cloud-budget",
    title: "Tier 2 · Budget Cloud API",
    costBadge: "~$0.05 / 100 clips",
    models: "gemini-3.1-flash-lite · gemini-3.5-transcribe · flash-lite-tts",
    bestFor: "High-volume transcription, voiceovers & batch QA at pennies per week",
    creditsPerTask: "1–2 credits",
  },
  {
    id: "cloud-standard",
    title: "Tier 3 · Standard Cloud + Search",
    costBadge: "~$0.35 / 100 clips",
    models: "gemini-4-hydrogen · Google Search Grounding · gemini-3.8-live",
    bestFor: "Live trend research, real-time voice producer, A/B funnel & ROI alerts",
    creditsPerTask: "3–5 credits",
  },
  {
    id: "cloud-flagship",
    title: "Tier 4 · Flagship & Generative Media",
    costBadge: "$1.50+ / 100 clips",
    models: "gemini-4-neon · nano-banana-2.1 · omni-1.2-flash · lyria-3-pro",
    bestFor: "Studio-grade image editing, text/image-to-video, full Lyria music tracks",
    creditsPerTask: "8–25 credits",
  },
];

const HOSTING_STAGES: Array<{
  id: HostingStageId;
  stage: string;
  name: string;
  monthlyCost: string;
  stack: string;
  unlockGoal: string;
}> = [
  {
    id: "stage-1-free",
    stage: "Stage 1 · Learn",
    name: "GitHub + Cloudflare Pages Free + Supabase Free + Windows PC",
    monthlyCost: "$0 / mo",
    stack: "Cloudflare Pages (Unlimited bandwidth) · GitHub Actions (2,000 free min) · Supabase Free (500MB Postgres + 50K Auth) · Local Ollama",
    unlockGoal: "First 100 clips published & first $100 affiliate/ad revenue",
  },
  {
    id: "stage-2-starter",
    stage: "Stage 2 · Earn",
    name: "Cloudflare Workers Paid + R2 Storage + Budget Gemini API",
    monthlyCost: "$5–$20 / mo",
    stack: "Cloudflare Workers ($5/mo) · R2 Zero-Egress Storage (10GB free) · Supabase Free · Gemini Flash-Lite + Transcribe",
    unlockGoal: "$500–$2,000/mo consistent ad-share + CPA sponsor flow",
  },
  {
    id: "stage-3-growth",
    stage: "Stage 3 · Grow",
    name: "Supabase Pro + Cloudflare Queues + Gemini Hydrogen + Search",
    monthlyCost: "$45–$120 / mo",
    stack: "Supabase Pro ($25/mo, 8GB Postgres) · Cloudflare Queues · Multi-language fleet auto-dub · Google Search Grounding",
    unlockGoal: "$3,000–$8,000/mo multi-channel sponsorship retainers",
  },
  {
    id: "stage-4-scale",
    stage: "Stage 4 · Scale",
    name: "Dedicated GPU Workers + Cloud Run + Flagship Omni Video & Lyria",
    monthlyCost: "$250+ / mo",
    stack: "Cloudflare Enterprise/Workers + Dedicated GPU Render Farm + Gemini Neon + Omni Video + Lyria Pro Music",
    unlockGoal: "$15,000+/mo autonomous faceless media network",
  },
];

export function ComputeHostingHub({
  computeRouting,
  onUpdateComputeRouting,
}: ComputeHostingHubProps) {
  const [saving, setSaving] = useState(false);
  const [endpointInput, setEndpointInput] = useState(
    computeRouting?.windowsPcEndpoint || "http://localhost:1234/v1"
  );
  const [modelInput, setModelInput] = useState(computeRouting?.windowsPcModel || "gemma-4-2b-it");
  const [budgetCapInput, setBudgetCapInput] = useState(computeRouting?.monthlyBudgetCapUsd ?? 25);
  const [pcTestStatus, setPcTestStatus] = useState<{
    testing: boolean;
    ok?: boolean;
    message?: string;
    models?: string[];
  }>({ testing: false });
  const [blueprints, setBlueprints] = useState<BlueprintFiles | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<
    "supabase" | "wrangler" | "github" | "windows"
  >("supabase");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hosting/blueprints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBlueprints(data);
      })
      .catch(() => {});
  }, []);

  const activeTier = computeRouting?.activeTier || "cloud-standard";
  const hostingStage = computeRouting?.hostingStage || "stage-1-free";
  const creditsBalance = computeRouting?.creditsBalance ?? 480;
  const creditsAllowance = computeRouting?.creditsMonthlyAllowance ?? 500;
  const estSpend = computeRouting?.estMonthSpendUsd ?? 0.42;
  const ledger = computeRouting?.ledger || [];

  async function selectTier(tier: AiComputeTierId) {
    setSaving(true);
    try {
      await onUpdateComputeRouting({ activeTier: tier });
    } finally {
      setSaving(false);
    }
  }

  async function selectStage(stage: HostingStageId) {
    setSaving(true);
    try {
      await onUpdateComputeRouting({ hostingStage: stage });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveControls() {
    setSaving(true);
    try {
      await onUpdateComputeRouting({
        windowsPcEndpoint: endpointInput.trim(),
        windowsPcModel: modelInput.trim(),
        monthlyBudgetCapUsd: Number(budgetCapInput) || 25,
      });
    } finally {
      setSaving(false);
    }
  }

  // Browser-direct Windows PC Ollama / LM Studio connection check (works even when hosted on Cloudflare!)
  async function handleTestWindowsPcDirect() {
    setPcTestStatus({ testing: true });
    try {
      const cleanBase = endpointInput.trim().replace(/\/+$/, "");
      const parsed = new URL(cleanBase);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only http:// or https:// endpoints are allowed.");
      }
      const res = await fetch(`${cleanBase}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const models = (data.data || []).map((m) => String(m.id || "")).filter(Boolean);
      setPcTestStatus({
        testing: false,
        ok: true,
        models,
        message: `Connected directly from browser to Windows PC (${models.length} local model${models.length === 1 ? "" : "s"} found).`,
      });
      if (models[0]) setModelInput(models[0]);
    } catch (err) {
      setPcTestStatus({
        testing: false,
        ok: false,
        message: `Could not reach ${endpointInput}. Start LM Studio (Enable CORS) or run setup-windows-ai.ps1 for Ollama. (${err instanceof Error ? err.message : "Network error"})`,
      });
    }
  }

  const currentBlueprintMeta =
    activeBlueprint === "supabase"
      ? {
          filename: "001_clipforge_schema.sql",
          content: blueprints?.supabaseSchemaSql || "",
        }
      : activeBlueprint === "wrangler"
        ? {
            filename: "wrangler.toml",
            content: blueprints?.wranglerToml || "",
          }
        : activeBlueprint === "github"
          ? {
              filename: "deploy-cloudflare.yml",
              content: blueprints?.githubWorkflowYml || "",
            }
          : {
              filename: "setup-windows-ai.ps1",
              content: blueprints?.windowsLocalPs1 || "",
            };

  function copyBlueprint() {
    if (!currentBlueprintMeta.content) return;
    navigator.clipboard.writeText(currentBlueprintMeta.content);
    setCopiedKey(activeBlueprint);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function downloadBlueprint() {
    if (!currentBlueprintMeta.content) return;
    const blob = new Blob([currentBlueprintMeta.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentBlueprintMeta.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: 5-TIER AI COST & CREDIT ROUTER */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                AI Compute Tiers, Local Windows PC &amp; Credit Guardrails
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scale smoothly from $0 Manual &amp; Windows PC Local LLMs to Budget, Standard, and Flagship Gemini APIs with live credit accounting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-500">Credits: </span>
              <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                {creditsBalance} / {creditsAllowance}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Est. Spend: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${estSpend.toFixed(3)} / ${computeRouting?.monthlyBudgetCapUsd ?? 25}
              </span>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => onUpdateComputeRouting({ topUpCredits: 500 })}
              className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] hover:border-[#E1392B] font-sans font-semibold text-xs"
            >
              +500 Credits
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 5 Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {COMPUTE_TIERS.map((tier) => {
              const selected = activeTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={saving}
                  onClick={() => selectTier(tier.id)}
                  className={`text-left p-3.5 rounded-sm border transition-colors flex flex-col justify-between gap-2.5 ${
                    selected
                      ? "border-[#E1392B] bg-[#E1392B]/[0.06] dark:bg-[#E1392B]/[0.10]"
                      : "border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-[#E1392B]">
                        {tier.costBadge}
                      </span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />}
                    </div>
                    <div className="font-display text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {tier.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-snug">
                      {tier.models}
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-[#D9DEE7]/70 dark:border-[#222631]">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {tier.bestFor}
                    </p>
                    <div className="font-mono text-[10px] text-slate-400">
                      Usage: {tier.creditsPerTask}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Windows PC Local LLM & Spend Cap Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A]">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                <Laptop className="w-4 h-4 text-[#E1392B]" />
                <span>Windows PC Local LLM Bridge (Ollama / LM Studio · Browser Direct)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">OpenAI-Compatible Local URL</span>
                  <input
                    type="text"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono text-xs"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">Local Model Name</span>
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    placeholder="gemma3:4b or gemma-4-2b-it"
                    className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono text-xs"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={pcTestStatus.testing}
                  onClick={handleTestWindowsPcDirect}
                  className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] hover:border-[#E1392B] text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {pcTestStatus.testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Ping Windows PC (Direct)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEndpointInput("http://localhost:11434/v1");
                    setModelInput("gemma3:4b");
                  }}
                  className="h-8 px-2.5 rounded-sm text-[11px] font-mono text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                >
                  Ollama Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEndpointInput("http://localhost:1234/v1");
                    setModelInput("gemma-4-2b-it");
                  }}
                  className="h-8 px-2.5 rounded-sm text-[11px] font-mono text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                >
                  LM Studio Preset
                </button>
              </div>
              {pcTestStatus.message && (
                <div
                  className={`text-xs p-2 rounded-sm border ${
                    pcTestStatus.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {pcTestStatus.message}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-3 border-t lg:border-t-0 lg:border-l border-[#D9DEE7] dark:border-[#252A36] pt-3 lg:pt-0 lg:pl-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                <Sliders className="w-4 h-4 text-[#E1392B]" />
                <span>Spend Cap &amp; Auto-Downgrade Protection</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex-1 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Spend Cap ($)</span>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={budgetCapInput}
                    onChange={(e) => setBudgetCapInput(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                  />
                </label>
                <div className="pt-5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveControls}
                    className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Routing</span>
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={computeRouting?.autoDowngradeOnBudgetCap ?? true}
                  onChange={(e) =>
                    onUpdateComputeRouting({ autoDowngradeOnBudgetCap: e.target.checked })
                  }
                  className="accent-[#E1392B]"
                />
                <span>Auto-downgrade to Windows PC Local / Free tier if cap is reached</span>
              </label>
            </div>
          </div>

          {/* Credit Usage Ledger */}
          {ledger.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                  Recent AI Usage &amp; Credit Ledger
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateComputeRouting({ resetSpend: true })}
                  className="text-[11px] font-mono text-slate-500 hover:text-[#E1392B]"
                >
                  Reset Cycle
                </button>
              </div>
              <div className="overflow-x-auto border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F7F9] dark:bg-[#111318] border-b border-[#D9DEE7] dark:border-[#222631] text-slate-500">
                      <th className="py-2 px-3 font-medium">Feature</th>
                      <th className="py-2 px-3 font-medium">Tier</th>
                      <th className="py-2 px-3 font-medium">Model</th>
                      <th className="py-2 px-3 font-medium text-right">Credits</th>
                      <th className="py-2 px-3 font-medium text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
                    {ledger.slice(0, 8).map((row) => (
                      <tr key={row.id}>
                        <td className="py-2 px-3 font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                          {row.feature}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {row.tier}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {row.model}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-right">
                          {row.creditsUsed}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-right text-emerald-600 dark:text-emerald-400">
                          ${row.estUsdCost.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: LEARN -> EARN -> GROW -> SCALE (GITHUB + CLOUDFLARE + SUPABASE) */}
      <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Hosting Ladder · GitHub + Cloudflare + Supabase (Free → Scale)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Start at $0/mo on GitHub Actions, Cloudflare Pages, Supabase Free Tier &amp; your Windows PC—then upgrade tiers only as channel revenue pays for it.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-[#E1392B]" />
            <span className="text-slate-600 dark:text-slate-300">
              {blueprints?.supabaseConfigured
                ? "Supabase Connected (Env Active)"
                : "Supabase Ready (Export SQL Below)"}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {HOSTING_STAGES.map((s) => {
              const active = hostingStage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectStage(s.id)}
                  className={`text-left p-3.5 rounded-sm border transition-colors flex flex-col justify-between gap-2 ${
                    active
                      ? "border-[#E1392B] bg-[#E1392B]/[0.06] dark:bg-[#E1392B]/[0.10]"
                      : "border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-slate-400"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#E1392B]">
                        {s.stage}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                        {s.monthlyCost}
                      </span>
                    </div>
                    <div className="font-display text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {s.name}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {s.stack}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#D9DEE7]/70 dark:border-[#222631] text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Unlock: {s.unlockGoal}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ready-to-Deploy Artifact Viewer & Downloader */}
          <div className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F6F7F9] dark:bg-[#111318] border-b border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: "supabase" as const, label: "Supabase Schema + RLS (.sql)", icon: Database },
                  { id: "wrangler" as const, label: "Cloudflare wrangler.toml", icon: Cloud },
                  { id: "github" as const, label: "GitHub Actions CI (.yml)", icon: Zap },
                  { id: "windows" as const, label: "Windows PC Local AI (.ps1)", icon: Cpu },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeBlueprint === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveBlueprint(tab.id)}
                      className={`h-7 px-2.5 rounded-sm text-xs font-medium inline-flex items-center gap-1.5 ${
                        active
                          ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                          : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyBlueprint}
                  className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-xs inline-flex items-center gap-1.5"
                >
                  {copiedKey === activeBlueprint ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === activeBlueprint ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadBlueprint}
                  className="h-7 px-2.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {currentBlueprintMeta.filename}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-[#0D0F14] text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72">
              {currentBlueprintMeta.content || "Loading deployment blueprint..."}
            </pre>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Set <code className="font-mono">SUPABASE_URL</code>, <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>, and <code className="font-mono">CLOUDFLARE_API_TOKEN</code> in your Cloudflare Pages / GitHub Actions Secrets when deploying—never commit keys to git.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
