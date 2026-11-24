import { useMemo, useState } from "react";
import { Sparkles, Check, Loader2, ArrowRight } from "lucide-react";
import type { ClipItem, PipelineConfig, StrategyRecommendation } from "../types";
import { computeRevenueTargets, formatCompactNumber } from "../utils/ffmpeg";

interface RevenueFeedbackViewProps {
  clips: ClipItem[];
  config: PipelineConfig;
  recommendation: StrategyRecommendation | null;
  isOptimizing: boolean;
  onRunOptimizer: () => Promise<void>;
  onApplyPatch: (patch: StrategyRecommendation["configPatch"]) => Promise<void>;
}

export function RevenueFeedbackView({
  clips,
  config,
  recommendation,
  isOptimizing,
  onRunOptimizer,
  onApplyPatch,
}: RevenueFeedbackViewProps) {
  const [targetDailyUsd, setTargetDailyUsd] = useState(config.publishing.targetDailyRevenueUsd || 100);
  const [rpmUsd, setRpmUsd] = useState(config.publishing.assumedRpmUsd || 1.12);
  const [avgViewsPerShort, setAvgViewsPerShort] = useState(14500);
  const [appliedPatch, setAppliedPatch] = useState(false);

  const targets = useMemo(
    () => computeRevenueTargets(targetDailyUsd, rpmUsd, avgViewsPerShort),
    [targetDailyUsd, rpmUsd, avgViewsPerShort]
  );

  const publishedClips = useMemo(() => clips.filter((c) => c.publishedMetrics), [clips]);

  const totals = useMemo(() => {
    return publishedClips.reduce(
      (acc, c) => {
        const m = c.publishedMetrics!;
        const totalViews = m.tiktokViews + m.reelsViews + m.shortsViews;
        acc.views += totalViews;
        acc.shares += m.shares;
        acc.comments += m.comments;
        acc.revenue += m.estimatedRevenueUsd;
        acc.watchSum += m.avgWatchPercent;
        return acc;
      },
      { views: 0, shares: 0, comments: 0, revenue: 0, watchSum: 0 }
    );
  }, [publishedClips]);

  const avgWatch = publishedClips.length > 0 ? Math.round(totals.watchSum / publishedClips.length) : 0;

  async function handleApply() {
    if (!recommendation) return;
    await onApplyPatch(recommendation.configPatch);
    setAppliedPatch(true);
    setTimeout(() => setAppliedPatch(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Grounded $100/Day Creator Rewards Math */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Unit Economics &amp; Daily Scale Calculator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Gaming clip reward programs average $1.10–$1.13 RPM per 1,000 qualified views. Adjust target revenue, RPM,
              and median views per short to compute exact daily output requirements.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Formula: Daily Views = (Target USD / RPM) × 1,000
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Daily Revenue Target</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                ${targetDailyUsd}/day
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={500}
              step={25}
              value={targetDailyUsd}
              onChange={(e) => setTargetDailyUsd(Number(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Qualified RPM ($ / 1k views)</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                ${rpmUsd.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={3.0}
              step={0.02}
              value={rpmUsd}
              onChange={(e) => setRpmUsd(Number(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Median Views per Short</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCompactNumber(avgViewsPerShort)}
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={60000}
              step={500}
              value={avgViewsPerShort}
              onChange={(e) => setAvgViewsPerShort(Number(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>
        </div>

        {/* Computed Output Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Required Daily Views</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {targets.requiredDailyViews.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Required Shorts / Day</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400">
              {targets.shortsPerDayNeeded} shorts
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">30-Day View Volume</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatCompactNumber(targets.requiredMonthlyViews)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">30-Day Revenue Run-Rate</div>
            <div className="mt-1 text-xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ${targets.projectedMonthlyUsd.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Feedback-Loop Strategy Optimizer */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Closed-Loop Feedback Optimizer (Gemini 4 Hydrogen)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analyzes published views, completion rates, and shares to propose diffable updates to{" "}
              <code className="font-mono text-slate-700 dark:text-slate-300">pipeline.config.json</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={onRunOptimizer}
            disabled={isOptimizing}
            className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isOptimizing ? "Analyzing Telemetry..." : "Analyze & Suggest Rules"}</span>
          </button>
        </div>

        {recommendation ? (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {recommendation.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0F131B] border border-slate-200/80 dark:border-slate-800">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  Top Winning Pattern
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {recommendation.topWinningPattern}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0F131B] border border-slate-200/80 dark:border-slate-800">
                <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  Primary Scale Bottleneck
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {recommendation.bottleneckDiagnosis}
                </p>
              </div>
            </div>

            {/* Suggested Config Diff Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F131B] text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3.5">Config Field</th>
                    <th className="py-2.5 px-3.5">Current → Proposed</th>
                    <th className="py-2.5 px-3.5">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/70">
                  {recommendation.suggestedChanges.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3.5 font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.field}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap">
                        <span className="text-slate-500">{item.currentValue}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-400" />
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                          {item.recommendedValue}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{item.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApply}
                className="h-9 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                {appliedPatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                <span>
                  {appliedPatch ? "Applied to pipeline.config.json" : "Apply Patch to pipeline.config.json"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            Click &ldquo;Analyze &amp; Suggest Rules&rdquo; to evaluate your {publishedClips.length} published shorts and
            generate concrete GitOps config recommendations.
          </div>
        )}
      </div>

      {/* Published Short Performance Ledger */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Published Performance Ledger
          </h3>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <span>{formatCompactNumber(totals.views)} views</span>
            <span aria-hidden="true">·</span>
            <span>{avgWatch}% avg watch</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ${totals.revenue.toFixed(2)} est.
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#0F131B]">
                <th className="py-2.5 px-4">Short</th>
                <th className="py-2.5 px-4 text-right">TikTok</th>
                <th className="py-2.5 px-4 text-right">Reels</th>
                <th className="py-2.5 px-4 text-right">Shorts</th>
                <th className="py-2.5 px-4 text-right">Shares</th>
                <th className="py-2.5 px-4 text-right">Avg Watch</th>
                <th className="py-2.5 px-4 text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/70">
              {publishedClips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No published shorts logged yet. Mark a clip as published in Publish Queue to populate feedback metrics.
                  </td>
                </tr>
              ) : (
                publishedClips.map((clip) => {
                  const m = clip.publishedMetrics!;
                  return (
                    <tr key={clip.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 max-w-xs">
                          {clip.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {clip.streamerHandle} · Hook {clip.layout.prependPeakHook ? `${clip.layout.hookDurationSec}s` : "Off"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                        {formatCompactNumber(m.tiktokViews)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                        {formatCompactNumber(m.reelsViews)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                        {formatCompactNumber(m.shortsViews)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                        {m.shares.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                        {m.avgWatchPercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ${m.estimatedRevenueUsd.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
