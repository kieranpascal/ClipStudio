import { useEffect, useState } from "react";
import JSZip from "jszip";
import {
  Save,
  Play,
  Download,
  Copy,
  Check,
  FileCode2,
  GitCommit,
  Cloud,
  Loader2,
} from "lucide-react";
import type { IntegrationStatus, PipelineConfig, PipelineRun, RepoFileEntry } from "../types";

interface GitOpsViewProps {
  config: PipelineConfig;
  runs: PipelineRun[];
  integrations: IntegrationStatus;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onDispatchPipeline: (dryRun: boolean) => Promise<void>;
  isRunningPipeline: boolean;
}

export function GitOpsView({
  config,
  runs,
  integrations,
  onSaveConfig,
  onDispatchPipeline,
  isRunningPipeline,
}: GitOpsViewProps) {
  const [draft, setDraft] = useState<PipelineConfig>(config);
  const [saving, setSaving] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [repoFiles, setRepoFiles] = useState<RepoFileEntry[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("pipeline.config.json");
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
          setActiveFilePath(data.files[0].path);
        }
      })
      .catch(() => {});
  }, [config]);

  const primaryGame = draft.targetGames[0];
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(config);

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
        const content =
          file.path === "pipeline.config.json" ? JSON.stringify(draft, null, 2) + "\n" : file.content;
        zip.file(file.path, content);
      }

      const deployGuide = `# ClipForge — Cloudflare Pages + GitHub Actions Deployment

## 1. Push to GitHub
Create a new GitHub repository and push this bundle (plus the frontend \`src/\`, \`index.html\`, \`package.json\`, \`vite.config.ts\`).

## 2. Configure GitHub Actions Secrets
In GitHub Repository Settings -> Secrets and variables -> Actions, add:
- \`GEMINI_API_KEY\` — Gemini API key for autonomous clip QA and caption generation
- \`TWITCH_CLIENT_ID\` & \`TWITCH_CLIENT_SECRET\` — Twitch Helix API credentials
- \`PUBLISH_WEBHOOK_URL\` — Optional TikTok/Reels/Shorts posting webhook

## 3. Connect to Cloudflare Pages
1. Open Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Select your GitHub repository.
3. Build command: \`npm run build\`
4. Build output directory: \`dist\`
5. Add Environment Variables in Cloudflare Pages Settings:
   - \`GEMINI_API_KEY\`
   - \`GITHUB_TOKEN\` (Fine-grained PAT with Contents: Read/Write and Actions: Read/Write)
   - \`GITHUB_REPO\` (e.g. \`your-user/clipforge\`)
   - \`GITHUB_BRANCH\` (\`main\`)

Every edit you save in the Cloudflare Pages UI commits directly to \`pipeline.config.json\` in GitHub and can dispatch \`.github/workflows/clipforge-pipeline.yml\` on demand.
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
  const displayedContent =
    activeFile?.path === "pipeline.config.json"
      ? JSON.stringify(draft, null, 2)
      : activeFile?.content || "";

  return (
    <div className="space-y-6">
      {/* Architecture Summary Banner */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-orange-500" />
            <span>Cloudflare Pages Edge Control Plane</span>
            <span aria-hidden="true">·</span>
            <span>GitHub Actions FFmpeg Worker</span>
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Zero-VPS GitOps Clipping Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Every rule lives in <code className="font-mono text-slate-700 dark:text-slate-300">pipeline.config.json</code>.
            Cloudflare Pages Functions commit config changes to GitHub and dispatch Ubuntu FFmpeg runners on schedule or on demand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadDeployZip}
            disabled={exportingZip || repoFiles.length === 0}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18202E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingZip ? "Packaging..." : "Download Deploy Bundle (.zip)"}</span>
          </button>

          <button
            type="button"
            onClick={() => onDispatchPipeline(dryRun)}
            disabled={isRunningPipeline}
            className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {isRunningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{integrations.githubConfigured ? "Dispatch GitHub Action" : "Run Local Pipeline"}</span>
          </button>
        </div>
      </div>

      {/* 2-Column GitOps Control Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Visual pipeline.config.json Editor */}
        <div className="xl:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Pipeline Configuration
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {integrations.githubConfigured
                  ? `Commits directly to ${integrations.githubRepo}@${integrations.githubBranch}`
                  : "Writes locally to pipeline.config.json"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="h-8 px-3 rounded-md bg-slate-900 dark:bg-slate-100 disabled:opacity-40 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{integrations.githubConfigured ? "Commit Config" : "Save Config"}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Schedule & Target Game */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Cron Schedule (UTC)
                </label>
                <select
                  value={draft.scheduleCron}
                  onChange={(e) => setDraft((d) => ({ ...d, scheduleCron: e.target.value }))}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono text-slate-900 dark:text-slate-100"
                >
                  <option value="0 * * * *">0 * * * * (Every 1h)</option>
                  <option value="0 */2 * * *">0 */2 * * * (Every 2h)</option>
                  <option value="0 */4 * * *">0 */4 * * * (Every 4h)</option>
                  <option value="0 */6 * * *">0 */6 * * * (Every 6h)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Primary Target Game
                </label>
                <input
                  type="text"
                  value={primaryGame?.name || ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      targetGames: d.targetGames.map((g, i) => (i === 0 ? { ...g, name: e.target.value } : g)),
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Min Clip Views
                </label>
                <input
                  type="number"
                  min={100}
                  step={250}
                  value={primaryGame?.minViews || 1500}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      targetGames: d.targetGames.map((g, i) =>
                        i === 0 ? { ...g, minViews: Number(e.target.value) } : g
                      ),
                    }))
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Max Rival Copies
                </label>
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
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Daily Post Cap
                </label>
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
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Multi-Game Target List */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Monitored Game Categories
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      targetGames: [
                        ...d.targetGames,
                        {
                          name: "Valorant",
                          twitchGameId: "516575",
                          minViews: 2000,
                          maxClipAgeHours: 6,
                          enabled: true,
                        },
                      ],
                    }))
                  }
                  className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
                >
                  + Add Game
                </button>
              </div>
              <div className="space-y-2">
                {draft.targetGames.map((game, idx) => (
                  <div
                    key={`${game.twitchGameId}_${idx}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0E14]"
                  >
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={game.enabled}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            targetGames: d.targetGames.map((g, i) =>
                              i === idx ? { ...g, enabled: e.target.checked } : g
                            ),
                          }))
                        }
                        className="w-3.5 h-3.5 accent-orange-600 shrink-0"
                      />
                      <input
                        type="text"
                        value={game.name}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            targetGames: d.targetGames.map((g, i) =>
                              i === idx ? { ...g, name: e.target.value } : g
                            ),
                          }))
                        }
                        className="bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none w-40 truncate"
                      />
                    </label>
                    <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      ≥{game.minViews.toLocaleString()} views · {game.maxClipAgeHours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QA Guardrails */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Automated QA Guardrails
              </div>

              <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <span>Strict target game authenticity (reject GTA V / RP mislabels)</span>
                <input
                  type="checkbox"
                  checked={draft.qaRules.strictGameVerification}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      qaRules: { ...d.qaRules, strictGameVerification: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-orange-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <span>Reject clips with heavy chat-box overlap</span>
                <input
                  type="checkbox"
                  checked={draft.qaRules.rejectChatBoxOverlap}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      qaRules: { ...d.qaRules, rejectChatBoxOverlap: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-orange-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <span>Prepend peak 3-second hook at 00:00</span>
                <input
                  type="checkbox"
                  checked={draft.layoutDefaults.prependPeakHook}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      layoutDefaults: { ...d.layoutDefaults, prependPeakHook: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-orange-600"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <span>Dry-run mode (render artifacts without auto-posting)</span>
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Live Cloudflare + GitHub Repository File Inspector */}
        <div className="xl:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0F131B] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {repoFiles.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setActiveFilePath(file.path)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                    activeFile?.path === file.path
                      ? "bg-white dark:bg-[#1E2636] text-orange-600 dark:text-orange-400 shadow-xs border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {file.path.split("/").pop()}
                </button>
              ))}
            </div>

            {activeFile && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(displayedContent);
                  setCopiedPath(activeFile.path);
                  setTimeout(() => setCopiedPath(null), 1600);
                }}
                className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedPath === activeFile.path ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPath === activeFile.path ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          {activeFile && (
            <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FileCode2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-slate-700 dark:text-slate-300">{activeFile.path}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activeFile.description}</span>
            </div>
          )}

          <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-auto max-h-[390px] leading-relaxed">
            <code>{displayedContent}</code>
          </pre>
        </div>
      </div>

      {/* Autonomous Run History Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-slate-500" />
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Pipeline Execution History
            </h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {runs.length} recorded runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#0F131B]">
                <th className="py-2.5 px-4">Run ID</th>
                <th className="py-2.5 px-4">Trigger</th>
                <th className="py-2.5 px-4">Target Game</th>
                <th className="py-2.5 px-4 text-right">Scanned</th>
                <th className="py-2.5 px-4 text-right">Approved</th>
                <th className="py-2.5 px-4">Summary</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/70">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {run.id}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {run.trigger}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {run.targetGame}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300">
                    {run.clipsScanned}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {run.clipsApproved}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-md">
                    {run.summary}
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-semibold whitespace-nowrap">
                    <span
                      className={
                        run.status === "completed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {run.status === "completed" ? "Completed" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
