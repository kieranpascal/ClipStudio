import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  Save,
  Play,
  Download,
  Copy,
  Check,
  FileCode2,
  GitCommit,
  GitCompare,
  Loader2,
  Terminal,
} from "lucide-react";
import type {
  IntegrationStatus,
  PipelineConfig,
  PipelineRun,
  RepoFileEntry,
  TelemetryEvent,
} from "../types";
import { computeLineDiff } from "../utils/ffmpeg";
import { TelemetryPanel } from "./TelemetryPanel";

interface GitOpsViewProps {
  config: PipelineConfig;
  runs: PipelineRun[];
  telemetry: TelemetryEvent[];
  integrations: IntegrationStatus;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onDispatchPipeline: (dryRun: boolean) => Promise<void>;
  onRefreshTelemetry: () => Promise<void>;
  isRunningPipeline: boolean;
}

export function GitOpsView({
  config,
  runs,
  telemetry,
  integrations,
  onSaveConfig,
  onDispatchPipeline,
  onRefreshTelemetry,
  isRunningPipeline,
}: GitOpsViewProps) {
  const [draft, setDraft] = useState<PipelineConfig>(config);
  const [saving, setSaving] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [repoFiles, setRepoFiles] = useState<RepoFileEntry[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("pipeline.config.json");
  const [inspectorMode, setInspectorMode] = useState<"files" | "diff">("files");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [exportingZip, setExportingZip] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  useEffect(() => {
    fetch("/api/gitops/files")
      .then((r) => r.json())
      .then((data: { files?: RepoFileEntry[] }) => {
        if (data.files && data.files.length > 0) {
          setRepoFiles(data.files);
          setActiveFilePath((curr) => (data.files!.some((f) => f.path === curr) ? curr : data.files![0].path));
        }
      })
      .catch(() => {});
  }, [config]);

  const primaryGame = draft.targetGames[0];
  const savedJson = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const draftJson = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const hasUnsavedChanges = savedJson !== draftJson;

  const diffLines = useMemo(() => computeLineDiff(savedJson, draftJson), [savedJson, draftJson]);
  const changedLineCount = useMemo(
    () => diffLines.filter((l) => l.type !== "same").length,
    [diffLines]
  );

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveConfig(draft);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadDeployZip() {
    setExportingZip(true);
    try {
      const zip = new JSZip();
      for (const file of repoFiles) {
        const content = file.path === "pipeline.config.json" ? draftJson + "\n" : file.content;
        zip.file(file.path, content);
      }

      const deployGuide = `# ClipForge — Cloudflare Pages + GitHub Actions + MCP Agent Deployment

## 1. Push to GitHub
Push this repository bundle (plus the frontend \`src/\`, \`index.html\`, \`package.json\`, \`vite.config.ts\`) to GitHub.

## 2. Configure GitHub Actions Secrets
In GitHub Repository Settings -> Secrets and variables -> Actions, add:
- \`GEMINI_API_KEY\` — Gemini API key for autonomous clip QA, DMCA screening, and localization
- \`TWITCH_CLIENT_ID\` & \`TWITCH_CLIENT_SECRET\` — Twitch Helix API credentials
- \`PUBLISH_WEBHOOK_URL\` — Optional TikTok/Reels/Shorts posting webhook

## 3. Connect to Cloudflare Pages
1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Build command: \`npm run build\` | Output directory: \`dist\`
3. Environment Variables in Cloudflare Pages Settings:
   - \`GEMINI_API_KEY\`
   - \`GITHUB_TOKEN\` (Fine-grained PAT: Contents R/W + Actions R/W)
   - \`GITHUB_REPO\` (e.g. \`your-user/clipforge\`)
   - \`GITHUB_BRANCH\` (\`main\`)

## 4. Connect the MCP Agent Bridge
\`\`\`json
{
  "mcpServers": {
    "clipforge": {
      "command": "node",
      "args": ["scripts/mcp-server.mjs"],
      "env": { "CLIPFORGE_API_BASE": "https://your-site.pages.dev" }
    }
  }
}
\`\`\`
`;
      zip.file("DEPLOY_CLOUDFLARE_GITHUB.md", deployGuide);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clipforge-cloudflare-github-bundle.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingZip(false);
    }
  }

  const activeFile = repoFiles.find((f) => f.path === activeFilePath) || repoFiles[0];
  const displayedContent = activeFile?.path === "pipeline.config.json" ? draftJson : activeFile?.content || "";

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Top GitOps Action Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-display font-bold text-[#0F1115] dark:text-[#EEF0F4]">
            Cloudflare Pages &amp; GitHub Actions Control Plane
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {integrations.githubConfigured
              ? `${integrations.githubRepo}@${integrations.githubBranch}`
              : "Local GitOps Mode (writes pipeline.config.json)"}
          </span>
          {hasUnsavedChanges && (
            <>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="font-mono text-[#E1392B] font-semibold">
                {changedLineCount} staged diff lines
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadDeployZip}
            disabled={exportingZip || repoFiles.length === 0}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:bg-slate-50 dark:hover:bg-[#1E222C] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingZip ? "Packaging..." : "Export Deploy Bundle"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="h-8 px-3 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] disabled:opacity-35 text-white dark:text-[#0F1115] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{integrations.githubConfigured ? "Commit to GitHub" : "Commit Config"}</span>
          </button>

          <button
            type="button"
            onClick={() => onDispatchPipeline(dryRun)}
            disabled={isRunningPipeline}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isRunningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{integrations.githubConfigured ? "Dispatch Action" : "Run Worker"}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Recharts TelemetryPanel */}
      <TelemetryPanel events={telemetry} onRefresh={onRefreshTelemetry} />

      {/* 2-Pane Config Editor & Repo Inspector / Live Git Diff */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border-b border-[#D9DEE7] dark:border-[#222631]">
        {/* Left: Visual pipeline.config.json Editor */}
        <div className="xl:col-span-5 p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] space-y-5 text-xs bg-[#F6F7F9]/60 dark:bg-[#0D0F14]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Cron Schedule (UTC)</label>
              <select
                value={draft.scheduleCron}
                onChange={(e) => setDraft((d) => ({ ...d, scheduleCron: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono"
              >
                <option value="0 * * * *">0 * * * * (Every 1h)</option>
                <option value="0 */2 * * *">0 */2 * * * (Every 2h)</option>
                <option value="0 */4 * * *">0 */4 * * * (Every 4h)</option>
                <option value="0 */6 * * *">0 */6 * * * (Every 6h)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Primary Target Game</label>
              <input
                type="text"
                value={primaryGame?.name || ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    targetGames: d.targetGames.map((g, i) => (i === 0 ? { ...g, name: e.target.value } : g)),
                  }))
                }
                className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Min Views</label>
              <input
                type="number"
                min={100}
                step={250}
                value={primaryGame?.minViews || 1500}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    targetGames: d.targetGames.map((g, i) => (i === 0 ? { ...g, minViews: Number(e.target.value) } : g)),
                  }))
                }
                className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Max Copies</label>
              <input
                type="number"
                min={0}
                max={20}
                value={draft.qaRules.maxExistingCrossPosts}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    qaRules: { ...d.qaRules, maxExistingCrossPosts: Number(e.target.value) },
                  }))
                }
                className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Daily Post Cap</label>
              <input
                type="number"
                min={1}
                max={48}
                value={draft.publishing.maxPostsPerDay}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    publishing: { ...d.publishing, maxPostsPerDay: Number(e.target.value) },
                  }))
                }
                className="w-full h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3">
            <div className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">Broadcast Audio &amp; Brand Defaults</div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-500 mb-1">Target LUFS</label>
                <select
                  value={draft.audioProcessing.targetLufs}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      audioProcessing: { ...d.audioProcessing, targetLufs: Number(e.target.value) as -11 | -14 },
                    }))
                  }
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono"
                >
                  <option value={-11}>-11 LUFS</option>
                  <option value={-14}>-14 LUFS</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Watermark</label>
                <input
                  type="text"
                  value={draft.brandKit.watermarkHandle}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandKit: { ...d.brandKit, watermarkHandle: e.target.value } }))
                  }
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Silence dB</label>
                <input
                  type="number"
                  min={-55}
                  max={-18}
                  value={draft.audioProcessing.silenceThresholdDb}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      audioProcessing: { ...d.audioProcessing, silenceThresholdDb: Number(e.target.value) },
                    }))
                  }
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">Monitored Game Categories</span>
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    targetGames: [
                      ...d.targetGames,
                      { name: "Valorant", twitchGameId: "516575", minViews: 2000, maxClipAgeHours: 6, enabled: true },
                    ],
                  }))
                }
                className="text-xs font-semibold text-[#E1392B] hover:underline"
              >
                + Add Category
              </button>
            </div>
            <div className="space-y-1.5">
              {draft.targetGames.map((game, idx) => (
                <div
                  key={`${game.twitchGameId}_${idx}`}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
                >
                  <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={game.enabled}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          targetGames: d.targetGames.map((g, i) => (i === idx ? { ...g, enabled: e.target.checked } : g)),
                        }))
                      }
                      className="w-3.5 h-3.5 accent-[#E1392B] shrink-0"
                    />
                    <input
                      type="text"
                      value={game.name}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          targetGames: d.targetGames.map((g, i) => (i === idx ? { ...g, name: e.target.value } : g)),
                        }))
                      }
                      className="bg-transparent font-medium text-[#0F1115] dark:text-[#EEF0F4] focus:outline-none w-40 truncate"
                    />
                  </label>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 shrink-0">
                    ≥{game.minViews.toLocaleString()} · {game.maxClipAgeHours}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2">
            <div className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">Worker Guardrails</div>
            {(
              [
                {
                  label: "Strict authentic game gate (reject GTA V / RP mislabels)",
                  checked: draft.qaRules.strictGameVerification,
                  toggle: (v: boolean) => setDraft((d) => ({ ...d, qaRules: { ...d.qaRules, strictGameVerification: v } })),
                },
                {
                  label: "Auto-isolate vocal stem when Gemini flags DMCA music",
                  checked: draft.qaRules.autoStripDmcaMusic,
                  toggle: (v: boolean) => setDraft((d) => ({ ...d, qaRules: { ...d.qaRules, autoStripDmcaMusic: v } })),
                },
                {
                  label: "Remove dead-air silences before loudnorm mastering",
                  checked: draft.audioProcessing.removeSilence,
                  toggle: (v: boolean) =>
                    setDraft((d) => ({ ...d, audioProcessing: { ...d.audioProcessing, removeSilence: v } })),
                },
                {
                  label: "Prepend 3-second viral peak hook at 00:00",
                  checked: draft.layoutDefaults.prependPeakHook,
                  toggle: (v: boolean) =>
                    setDraft((d) => ({ ...d, layoutDefaults: { ...d.layoutDefaults, prependPeakHook: v } })),
                },
                {
                  label: "Dry-run dispatch (build artifacts without publishing)",
                  checked: dryRun,
                  toggle: (v: boolean) => setDryRun(v),
                },
              ] as const
            ).map((item) => (
              <label key={item.label} className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300 cursor-pointer py-0.5">
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.toggle(e.target.checked)}
                  className="w-4 h-4 accent-[#E1392B] shrink-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Right: Repository Files Inspector + Live Git Diff */}
        <div className="xl:col-span-7 flex flex-col bg-[#0A0B0E] text-slate-100">
          <div className="px-4 py-2.5 border-b border-[#222631] bg-[#111318] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInspectorMode("files")}
                className={`text-xs font-mono inline-flex items-center gap-1.5 ${
                  inspectorMode === "files" ? "text-[#E1392B] font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Repo Files ({repoFiles.length})</span>
              </button>
              <span className="text-slate-600">/</span>
              <button
                type="button"
                onClick={() => setInspectorMode("diff")}
                className={`text-xs font-mono inline-flex items-center gap-1.5 ${
                  inspectorMode === "diff" ? "text-[#E1392B] font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Git Diff ({changedLineCount})</span>
              </button>
            </div>

            {inspectorMode === "files" && activeFile && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(displayedContent);
                  setCopiedPath(activeFile.path);
                  setTimeout(() => setCopiedPath(null), 1600);
                }}
                className="h-7 px-2.5 rounded-sm border border-[#262B37] text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1.5"
              >
                {copiedPath === activeFile.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPath === activeFile.path ? "Copied" : "Copy File"}</span>
              </button>
            )}
          </div>

          {inspectorMode === "files" ? (
            <>
              <div className="px-4 py-2 border-b border-[#222631] bg-[#0D0F14] flex items-center gap-1.5 overflow-x-auto">
                {repoFiles.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setActiveFilePath(file.path)}
                    className={`px-2.5 py-1 rounded-xs text-[11px] font-mono whitespace-nowrap transition-colors ${
                      activeFile?.path === file.path
                        ? "bg-[#E1392B] text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 bg-[#171A21]"
                    }`}
                  >
                    {file.path.split("/").pop()}
                  </button>
                ))}
              </div>
              {activeFile && (
                <div className="px-4 py-2 border-b border-[#1A1D26] flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                  <span className="text-slate-200">{activeFile.path}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{activeFile.description}</span>
                </div>
              )}
              <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-auto max-h-[460px] leading-relaxed flex-1">
                <code>{displayedContent}</code>
              </pre>
            </>
          ) : (
            <div className="flex-1 overflow-auto max-h-[500px] font-mono text-[11px] leading-relaxed">
              {!hasUnsavedChanges ? (
                <div className="p-10 text-center text-slate-500">
                  Working tree clean. Modify any rule on the left to review the exact line-by-line Git diff before committing.
                </div>
              ) : (
                <div className="py-2">
                  {diffLines.map((line, i) => (
                    <div
                      key={i}
                      className={`px-4 py-0.5 whitespace-pre ${
                        line.type === "add"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : line.type === "del"
                            ? "bg-rose-500/15 text-rose-300"
                            : "text-slate-500"
                      }`}
                    >
                      <span className="inline-block w-4 select-none opacity-70">
                        {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                      </span>
                      {line.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Execution History Ledger */}
      <div className="flex-1 overflow-x-auto">
        <div className="px-5 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/70 dark:bg-[#111318] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-[#0F1115] dark:text-[#EEF0F4]">
            <GitCommit className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Pipeline Execution History</span>
          </div>
          <span className="font-mono tabular-nums text-slate-500">{runs.length} runs</span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#D9DEE7] dark:border-[#222631] font-mono text-[11px] text-slate-500">
              <th className="py-2.5 px-5">Run ID</th>
              <th className="py-2.5 px-3">Trigger</th>
              <th className="py-2.5 px-3">Target</th>
              <th className="py-2.5 px-3 text-right">Latency</th>
              <th className="py-2.5 px-3 text-right">Scanned</th>
              <th className="py-2.5 px-3 text-right">Cleared</th>
              <th className="py-2.5 px-3">Summary</th>
              <th className="py-2.5 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1A1D26]">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-[#F6F7F9] dark:hover:bg-[#12151C]">
                <td className="py-2.5 px-5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{run.id}</td>
                <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{run.trigger}</td>
                <td className="py-2.5 px-3 text-[#0F1115] dark:text-slate-200 whitespace-nowrap">{run.targetGame}</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                  {run.latencyMs ? `${run.latencyMs}ms` : "—"}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{run.clipsScanned}</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                  {run.clipsApproved}
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-md">{run.summary}</td>
                <td className="py-2.5 px-5 text-right font-semibold whitespace-nowrap">
                  <span className={run.status === "completed" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
                    {run.status === "completed" ? "Completed" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
