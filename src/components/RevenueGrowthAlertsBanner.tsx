import { BellRing, ArrowUpRight, CheckCircle2, X, RefreshCw, Loader2, Sparkles } from "lucide-react";
import type { RevenueGrowthAlert } from "../types";

interface RevenueGrowthAlertsBannerProps {
  alerts: RevenueGrowthAlert[];
  isScanningAlerts: boolean;
  shiftingAlertId: string | null;
  onScanAlerts: () => Promise<void>;
  onShiftDirectorFocus: (alertId: string) => Promise<void>;
  onDismissAlert: (alertId: string) => Promise<void>;
  onLaunchMissionForNiche?: (nicheLabel: string) => Promise<void>;
}

export function RevenueGrowthAlertsBanner({
  alerts,
  isScanningAlerts,
  shiftingAlertId,
  onScanAlerts,
  onShiftDirectorFocus,
  onDismissAlert,
  onLaunchMissionForNiche,
}: RevenueGrowthAlertsBannerProps) {
  const visibleAlerts = alerts.filter((a) => a.status !== "dismissed");
  const activeCount = visibleAlerts.filter((a) => a.status === "active").length;

  return (
    <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BellRing className="w-4 h-4 text-[#E1392B]" />
          <div>
            <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Revenue Growth Alerts · ≥ +15% Projected ROI Threshold
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatic dashboard notifications whenever a niche or editing style surges 15%+ above 30-day baseline ROI, ready to pivot the AI Director.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
            {activeCount} active surge{activeCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            disabled={isScanningAlerts}
            onClick={onScanAlerts}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] hover:border-[#E1392B] font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isScanningAlerts ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isScanningAlerts ? "Scanning ROI..." : "Scan ROI Signals"}</span>
          </button>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>No active ≥ +15% ROI surges right now. Click &ldquo;Scan ROI Signals&rdquo; after adjusting sponsorship rates or publishing new clips.</span>
        </div>
      ) : (
        <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
          {visibleAlerts.map((alert) => {
            const isActioned = alert.status === "actioned";
            const isShifting = shiftingAlertId === alert.id;
            return (
              <div
                key={alert.id}
                className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-[#171A21]/60 transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold tabular-nums text-[#E1392B]">
                      +{alert.roiIncreasePct.toFixed(1)}% ROI SURGE
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-display font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {alert.label}
                    </span>
                    {alert.editingStyle && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {alert.editingStyle}
                        </span>
                      </>
                    )}
                    {isActioned && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          AI Director Shifted
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.driverSummary}
                  </p>
                  <p className="text-xs text-[#0F172A] dark:text-slate-200 font-medium">
                    Director Suggestion: {alert.directorSuggestion}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Baseline: ${alert.baselineRoiPer1kUsd.toFixed(2)}/1K</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Projected: ${alert.projectedRoiPer1kUsd.toFixed(2)}/1K
                    </span>
                    <span>Est. Monthly Upside: +${alert.projectedMonthlyDeltaUsd.toLocaleString()}/mo</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isShifting}
                    onClick={() => onShiftDirectorFocus(alert.id)}
                    className={`h-8 px-3.5 rounded-sm text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                      isActioned
                        ? "border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                        : "bg-[#E1392B] hover:bg-[#c83024] text-white"
                    }`}
                  >
                    {isShifting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                    <span>{isActioned ? "Re-Apply Focus Shift" : "Shift AI Director Focus"}</span>
                  </button>

                  {onLaunchMissionForNiche && (
                    <button
                      type="button"
                      onClick={() => onLaunchMissionForNiche(alert.label)}
                      className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] hover:border-[#E1392B] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                      <span>10 Ideas</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDismissAlert(alert.id)}
                    aria-label={`Dismiss ${alert.label} alert`}
                    className="h-8 w-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
