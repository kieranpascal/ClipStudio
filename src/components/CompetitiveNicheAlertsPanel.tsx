import { useState } from "react";
import {
  Radar,
  Rocket,
  Loader2,
  ExternalLink,
  X,
  CheckCircle2,
} from "lucide-react";
import type { CompetitiveNicheAlert, ContentNiche } from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface CompetitiveNicheAlertsPanelProps {
  alerts: CompetitiveNicheAlert[];
  isScanning: boolean;
  launchingAlertId: string | null;
  onScanCompetitiveAlerts: (niche: ContentNiche | "all") => Promise<void>;
  onLaunchRapidMission: (alertId: string) => Promise<void>;
  onDismissAlert: (alertId: string) => Promise<void>;
}

const NICHE_LABELS: Record<ContentNiche, string> = {
  "tech-ai": "AI & Tech",
  finance: "Finance",
  gaming: "Gaming",
  podcasts: "Podcasts",
  "faceless-doc": "Faceless Doc",
  "sports-irl": "Sports & IRL",
};

export function CompetitiveNicheAlertsPanel({
  alerts,
  isScanning,
  launchingAlertId,
  onScanCompetitiveAlerts,
  onLaunchRapidMission,
  onDismissAlert,
}: CompetitiveNicheAlertsPanelProps) {
  const [scanNiche, setScanNiche] = useState<ContentNiche | "all">("all");
  const visible = alerts.filter((a) => a.status !== "dismissed");
  const activeCount = visible.filter((a) => a.status === "active").length;

  return (
    <section className="mx-5 mb-5 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Competitive Niche Alerts</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#E1392B] font-semibold">
              {activeCount} active rapid-response trigger{activeCount === 1 ? "" : "s"}
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Under-Monetized Competitor Video Releases
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select niche for competitor release scan"
            value={scanNiche}
            onChange={(e) => setScanNiche(e.target.value as ContentNiche | "all")}
            className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F4F6F9] dark:bg-[#161922] text-xs"
          >
            <option value="all">All Niches</option>
            <option value="tech-ai">AI &amp; Tech</option>
            <option value="finance">Finance</option>
            <option value="gaming">Gaming</option>
            <option value="podcasts">Podcasts</option>
            <option value="faceless-doc">Faceless Doc</option>
          </select>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => onScanCompetitiveAlerts(scanNiche)}
            className="h-8 px-3.5 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] disabled:opacity-60 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radar className="w-3.5 h-3.5 text-[#E1392B]" />
            )}
            <span>{isScanning ? "Scanning Rivals..." : "Scan Competitor Releases"}</span>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-6 rounded-xs border border-dashed border-[#D4DAE4] dark:border-[#232836] text-center text-xs text-slate-500">
          No active competitor release alerts. Run a scan to catch breakout videos in under-monetized sub-niches.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {visible.map((alert) => {
            const launched = alert.status === "mission-launched";
            return (
              <article
                key={alert.id}
                className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
                      <span className="font-mono font-semibold text-[#E1392B]">
                        {alert.competitorChannel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.publishedAgoLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatCompactNumber(alert.observedViews)} views
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss competitive alert"
                      onClick={() => onDismissAlert(alert.id)}
                      className="text-slate-400 hover:text-[#0F172A] dark:hover:text-white shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
                    {alert.videoTitle}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500">
                    <span>{NICHE_LABELS[alert.niche]} / {alert.subNiche}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ${alert.estimatedUpsideRpmUsd.toFixed(2)} Upside RPM
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-medium text-[#0F172A] dark:text-slate-100">Gap: </span>
                    {alert.monetizationGapReason}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="font-medium text-[#0F172A] dark:text-slate-200">Rapid hook: </span>
                    &ldquo;{alert.suggestedHook}&rdquo;
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#D4DAE4] dark:border-[#1E222D] flex items-center justify-between gap-2">
                  {launched ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Rapid Mission Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={launchingAlertId === alert.id}
                      onClick={() => onLaunchRapidMission(alert.id)}
                      className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {launchingAlertId === alert.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Rocket className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {launchingAlertId === alert.id
                          ? "Launching..."
                          : "Launch Rapid-Response Mission"}
                      </span>
                    </button>
                  )}

                  {alert.videoUrl && (
                    <a
                      href={alert.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#2563EB] dark:text-sky-400 hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
