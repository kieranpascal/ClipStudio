import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { CheckCircle2, FlaskConical, Loader2, Sparkles, Trophy } from "lucide-react";
import type { AbTestAnalysisSnapshot, ContentNiche, PipelineConfig } from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface AbTestMonitorPanelProps {
  config: PipelineConfig;
  abTestAnalysis?: AbTestAnalysisSnapshot;
  isAnalyzingAbTest: boolean;
  isBakingWinner: boolean;
  onRunAbTestAnalysis: (payload: {
    focusNiche?: ContentNiche | "all";
    experimentGoal?: string;
  }) => Promise<void>;
  onBakeAbWinnerToConfig: () => Promise<void>;
}

const NICHE_OPTIONS: Array<{ value: ContentNiche | "all"; label: string }> = [
  { value: "all", label: "All Niches" },
  { value: "gaming", label: "Gaming" },
  { value: "tech-ai", label: "AI & Tech" },
  { value: "podcasts", label: "Podcasts" },
  { value: "finance", label: "Finance" },
  { value: "faceless-doc", label: "Faceless Doc" },
  { value: "sports-irl", label: "Sports & IRL" },
];

export function AbTestMonitorPanel({
  config,
  abTestAnalysis,
  isAnalyzingAbTest,
  isBakingWinner,
  onRunAbTestAnalysis,
  onBakeAbWinnerToConfig,
}: AbTestMonitorPanelProps) {
  const [focusNiche, setFocusNiche] = useState<ContentNiche | "all">(
    abTestAnalysis?.focusNiche || "all"
  );
  const [experimentGoal, setExperimentGoal] = useState("");

  const variants = abTestAnalysis?.variants || [];
  const rec = abTestAnalysis?.recommendedDefaults;

  const isAlreadyBaked = Boolean(
    rec &&
      config.layoutDefaults.template === rec.template &&
      config.layoutDefaults.captionStyle === rec.captionStyle &&
      config.layoutDefaults.prependPeakHook === rec.prependPeakHook &&
      Number(config.layoutDefaults.hookDurationSeconds) === Number(rec.hookDurationSeconds)
  );

  return (
    <section className="mx-5 mb-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] p-5 space-y-5">
      {/* Header & Experiment Controls */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <FlaskConical className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Gemini A/B Experiment Monitor</span>
            {abTestAnalysis?.analyzedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Evaluated {new Date(abTestAnalysis.analyzedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            )}
            {abTestAnalysis?.modelUsed && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{abTestAnalysis.modelUsed}</span>
              </>
            )}
          </div>
          <h3 className="font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
            A/B Test Monitor — Hook Variants &amp; Editing Styles Winner Engine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Uses Gemini to compare views, watch retention %, share velocity, and RPM across hook banners and editing styles, then recommends a statistically verified Winner to bake directly into your default Pipeline configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label="Filter A/B Test Monitor by niche"
            value={focusNiche}
            onChange={(e) => setFocusNiche(e.target.value as ContentNiche | "all")}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-[#F8F9FB] dark:bg-[#171A21] text-xs text-[#0F172A] dark:text-slate-100"
          >
            {NICHE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={experimentGoal}
            onChange={(e) => setExperimentGoal(e.target.value)}
            placeholder="Optional focus (e.g., 3s hook vs cold open)..."
            className="h-8 w-52 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#2A303E] bg-[#F8F9FB] dark:bg-[#171A21] text-xs text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
          />

          <button
            type="button"
            disabled={isAnalyzingAbTest}
            onClick={() =>
              onRunAbTestAnalysis({
                focusNiche,
                experimentGoal: experimentGoal.trim(),
              })
            }
            className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            {isAnalyzingAbTest ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
            )}
            <span>{isAnalyzingAbTest ? "Comparing Variants..." : "Run Gemini A/B Analysis"}</span>
          </button>
        </div>
      </div>

      {abTestAnalysis ? (
        <div className="space-y-5">
          {/* Winner Verdict + Bake into Default Pipeline Config Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E1392B]">
                  <Trophy className="w-4 h-4" />
                  <span>Gemini Suggested Winner</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-slate-500">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {abTestAnalysis.confidencePct}% confidence
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>+{abTestAnalysis.projectedViewsLiftPct}% views lift</span>
                  <span aria-hidden="true">·</span>
                  <span>+{abTestAnalysis.projectedRetentionLiftPct}% retention</span>
                </div>
              </div>

              <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                {abTestAnalysis.winnerLabel}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {abTestAnalysis.executiveVerdict}
              </p>

              <ul className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {abTestAnalysis.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] text-slate-400 mt-0.5 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Default Pipeline Config Diff & Bake CTA */}
            <div className="lg:col-span-5 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#151821] flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Default Pipeline Config Bake-In Preview
                  </h4>
                  {isAlreadyBaked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Default
                    </span>
                  )}
                </div>

                {rec && (
                  <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631] rounded-sm text-xs font-mono">
                    {[
                      {
                        field: "Layout Template",
                        current: config.layoutDefaults.template,
                        next: rec.template,
                      },
                      {
                        field: "Caption Style",
                        current: config.layoutDefaults.captionStyle,
                        next: rec.captionStyle,
                      },
                      {
                        field: "Peak Hook Prepend",
                        current: `${config.layoutDefaults.prependPeakHook ? "On" : "Off"} (${config.layoutDefaults.hookDurationSeconds}s)`,
                        next: `${rec.prependPeakHook ? "On" : "Off"} (${rec.hookDurationSeconds}s)`,
                      },
                      {
                        field: "Facecam Split",
                        current: `${config.layoutDefaults.facecamHeightPercent}%`,
                        next: `${rec.facecamHeightPercent}%`,
                      },
                    ].map((row) => {
                      const changed = row.current !== row.next;
                      return (
                        <div key={row.field} className="px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-500">{row.field}</span>
                          <span className="tabular-nums text-right">
                            {changed ? (
                              <>
                                <span className="text-slate-400 line-through mr-1.5">{row.current}</span>
                                <span className="text-[#E1392B] font-semibold">{row.next}</span>
                              </>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">{row.next}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {abTestAnalysis.bakedSummary && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    {abTestAnalysis.bakedSummary}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isBakingWinner || isAlreadyBaked}
                onClick={onBakeAbWinnerToConfig}
                className={`w-full h-9 px-4 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                  isAlreadyBaked
                    ? "border border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-[#E1392B] hover:bg-[#C72F22] text-white disabled:opacity-50"
                }`}
              >
                {isBakingWinner ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isAlreadyBaked ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Trophy className="w-3.5 h-3.5" />
                )}
                <span>
                  {isAlreadyBaked
                    ? "Winner Baked into Default Pipeline Config"
                    : isBakingWinner
                      ? "Baking Winner into Pipeline Config..."
                      : "Bake Winner into Default Pipeline Config"}
                </span>
              </button>
            </div>
          </div>

          {/* Recharts Views vs Retention Comparison Chart */}
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={variants} margin={{ top: 10, right: 20, left: 4, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: string) => (val.length > 26 ? `${val.slice(0, 26)}…` : val)}
                />
                <YAxis
                  yAxisId="views"
                  tickFormatter={(v: number) => formatCompactNumber(v)}
                  tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="ret"
                  orientation="right"
                  domain={[50, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    border: "1px solid #262B37",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#F1F5F9",
                  }}
                  formatter={(value, name) => {
                    const num = Number(value ?? 0);
                    const label = String(name ?? "");
                    if (label.includes("Retention")) return [`${num}%`, label];
                    return [formatCompactNumber(num), label];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }} />
                <Bar
                  yAxisId="views"
                  dataKey="avgViews"
                  name="Avg Views / Clip"
                  barSize={34}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                >
                  {variants.map((v) => (
                    <Cell key={v.variantId} fill={v.isWinner ? "#E1392B" : "#334155"} />
                  ))}
                </Bar>
                <Line
                  yAxisId="ret"
                  type="monotone"
                  dataKey="avgRetentionPct"
                  name="Avg Retention %"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#16A34A" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Variant Comparison Table */}
          <div className="overflow-x-auto border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8F9FB] dark:bg-[#0D0F14] border-b border-[#D9DEE7] dark:border-[#222631] font-mono text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Variant &amp; Hook Banner Sample</th>
                  <th className="px-3 py-2 font-medium">Editing &amp; Caption Style</th>
                  <th className="px-3 py-2 text-right font-medium">Hook Len</th>
                  <th className="px-3 py-2 text-right font-medium">Avg Views</th>
                  <th className="px-3 py-2 text-right font-medium">Retention</th>
                  <th className="px-3 py-2 text-right font-medium">Share Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Est. RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
                {variants.map((v) => (
                  <tr
                    key={v.variantId}
                    className={
                      v.isWinner
                        ? "bg-[#E1392B]/[0.05] dark:bg-[#E1392B]/[0.08]"
                        : "hover:bg-[#F8F9FB] dark:hover:bg-[#161922]"
                    }
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        <span>{v.label}</span>
                        {v.isWinner && (
                          <span className="font-mono text-[10px] text-[#E1392B]">WINNER</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {v.hookStyle} · &ldquo;{v.hookBannerSample}&rdquo;
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {v.editingTemplate} · {v.captionStyle}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {v.hookDurationSeconds}s
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                      {formatCompactNumber(v.avgViews)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {v.avgRetentionPct}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {v.avgShareRatePct}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      ${v.estRpmUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-[#D9DEE7] dark:border-[#262B37] rounded-sm text-center text-xs text-slate-500">
          Run Gemini A/B Analysis to compare views and watch retention across your hook variants and editing styles.
        </div>
      )}
    </section>
  );
}
