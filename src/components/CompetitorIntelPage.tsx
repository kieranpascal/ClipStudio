import { useState } from "react";
import {
  Crosshair,
  Flame,
  Loader2,
  Radar,
} from "lucide-react";
import type {
  CompetitiveNicheAlert,
  CompetitorBreakdown,
  ContentNiche,
  OpportunityDiscoverySnapshot,
  PipelineConfig,
  TrendPulseSnapshot,
  WorkspaceTab,
} from "../types";
import { TrendPulseWidget } from "./TrendPulseWidget";
import { CompetitiveNicheAlertsPanel } from "./CompetitiveNicheAlertsPanel";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

interface CompetitorIntelPageProps {
  config: PipelineConfig;
  trendPulse?: TrendPulseSnapshot;
  competitiveAlerts: CompetitiveNicheAlert[];
  opportunityDiscovery?: OpportunityDiscoverySnapshot;
  isFetchingTrends: boolean;
  isDirecting: boolean;
  isScanningCompetitiveAlerts: boolean;
  launchingCompetitiveAlertId: string | null;
  onFetchTrends: (focus: string) => Promise<void>;
  onToggleTrendPin: (topicId: string) => Promise<void>;
  onTrackTrendGame: (gameName: string) => Promise<void>;
  onExecuteDirector: (instruction: string) => Promise<void>;
  onScanCompetitiveAlerts: (niche: ContentNiche | "all") => Promise<void>;
  onLaunchRapidMission: (alertId: string) => Promise<void>;
  onDismissCompetitiveAlert: (alertId: string) => Promise<void>;
  onAnalyzeCompetitor: (
    rivalTitle: string,
    rivalTranscript: string
  ) => Promise<CompetitorBreakdown | null>;
  onCreateCounterClip: (rivalTitle: string, breakdown: CompetitorBreakdown) => Promise<void>;
  onSelectTab: (tab: WorkspaceTab) => void;
}

export function CompetitorIntelPage({
  config,
  trendPulse,
  competitiveAlerts,
  opportunityDiscovery,
  isFetchingTrends,
  isDirecting,
  isScanningCompetitiveAlerts,
  launchingCompetitiveAlertId,
  onFetchTrends,
  onToggleTrendPin,
  onTrackTrendGame,
  onExecuteDirector,
  onScanCompetitiveAlerts,
  onLaunchRapidMission,
  onDismissCompetitiveAlert,
  onAnalyzeCompetitor,
  onCreateCounterClip,
  onSelectTab,
}: CompetitorIntelPageProps) {
  const [rivalTitle, setRivalTitle] = useState("");
  const [rivalTranscript, setRivalTranscript] = useState("");
  const [analyzingRival, setAnalyzingRival] = useState(false);
  const [breakdown, setBreakdown] = useState<CompetitorBreakdown | null>(null);
  const [creatingCounter, setCreatingCounter] = useState(false);

  const activeAlerts = competitiveAlerts.filter((a) => a.status === "active");
  const trendTopics = trendPulse?.topics || [];
  const pinnedTrends = trendTopics.filter((t) => t.pinnedPriority);
  const competitorGaps = (opportunityDiscovery?.topics || []).filter(
    (t) => t.gapType === "competitor-gap"
  );

  async function handleReverseEngineer(e: React.FormEvent) {
    e.preventDefault();
    if (!rivalTitle.trim() || !rivalTranscript.trim()) return;
    setAnalyzingRival(true);
    try {
      const res = await onAnalyzeCompetitor(rivalTitle.trim(), rivalTranscript.trim());
      if (res) setBreakdown(res);
    } finally {
      setAnalyzingRival(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Research & Intelligence"
        title="Competitor & Live Trend Intelligence"
        subtitle="Track breakout real-time topics via TrendPulse, intercept under-monetized competitor releases with rapid-response clipping missions, and reverse-engineer any viral rival clip into a stronger counter-hook."
        metaItems={[
          { label: `${activeAlerts.length} Rival Triggers`, emphasis: "crimson" },
          { label: `${trendTopics.length} Live Trends` },
          { label: `${pinnedTrends.length} Pinned Priorities`, emphasis: "emerald" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("ingest")}
            className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold whitespace-nowrap"
          >
            Proceed to Production Bin
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "rival-alerts",
            label: "Active Competitor Alerts",
            value: String(activeAlerts.length),
            subtext: "Under-monetized rival drops ready for rapid-response",
            tone: activeAlerts.length > 0 ? "crimson" : "default",
          },
          {
            id: "trend-topics",
            label: "TrendPulse Breakout Topics",
            value: String(trendTopics.length),
            subtext: `${pinnedTrends.length} pinned directly to AI Director`,
            tone: "emerald",
          },
          {
            id: "rival-blindspots",
            label: "Audited Competitor Blindspots",
            value: String(competitorGaps.length),
            subtext: `${opportunityDiscovery?.competitorChannelsAudited?.length || 0} rival channels scanned`,
            onClick: () => onSelectTab("opportunity-radar"),
          },
          {
            id: "tracked-targets",
            label: "Tracked Radar Categories",
            value: String(config.targetGames.filter((g) => g.enabled).length),
            subtext: "Configured in pipeline.config.json",
            onClick: () => onSelectTab("gitops"),
          },
        ]}
      />

      {/* 1. Live TrendPulse Widget */}
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

      {/* 2. Competitive Niche Alerts Panel */}
      <div className="pt-5">
        <CompetitiveNicheAlertsPanel
          alerts={competitiveAlerts}
          isScanning={isScanningCompetitiveAlerts}
          launchingAlertId={launchingCompetitiveAlertId}
          onScanCompetitiveAlerts={onScanCompetitiveAlerts}
          onLaunchRapidMission={onLaunchRapidMission}
          onDismissAlert={onDismissCompetitiveAlert}
        />
      </div>

      {/* 3. Competitor Viral Formula Reverse-Engineer */}
      <div className="px-5 pb-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
          <StudioSectionHeader
            zone="action"
            title="Competitor Viral Formula Reverse-Engineer"
            detail="Dissect rival hooks, pacing & exploitable weaknesses"
          />

          <form onSubmit={handleReverseEngineer} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                Rival Video Title or Viral Hook Headline
              </label>
              <input
                type="text"
                required
                value={rivalTitle}
                onChange={(e) => setRivalTitle(e.target.value)}
                placeholder="e.g., I Replaced My Entire Video Editing Team With 1 Local AI Script"
                className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                Rival Transcript, Opening 10s Hook, or Comment Thread Summary
              </label>
              <textarea
                rows={5}
                required
                value={rivalTranscript}
                onChange={(e) => setRivalTranscript(e.target.value)}
                placeholder="Paste the rival's opening hook, pacing notes, or full transcript so Gemini can identify what retained viewers and where we can beat them with a sharper angle..."
                className="w-full p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setRivalTitle("Why 99% of Creators Are Losing Money on YouTube Shorts in 2026");
                  setRivalTranscript(
                    "Everyone chases 10 million views on Shorts and makes $180. Meanwhile this tiny 14k channel pulls $6,400/mo by pinning a 1-page free toolkit that redirects into a 30% recurring affiliate partner..."
                  );
                }}
                className="text-[11px] font-mono text-slate-500 hover:text-[#E1392B]"
              >
                Load sample rival breakdown
              </button>
              <button
                type="submit"
                disabled={analyzingRival || !rivalTitle.trim() || !rivalTranscript.trim()}
                className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {analyzingRival ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                <span>{analyzingRival ? "Dissecting Formula..." : "Reverse-Engineer Rival"}</span>
              </button>
            </div>
          </form>
        </section>

        <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
          <StudioSectionHeader
            zone="telemetry"
            title="Counter-Strategy & Exploitable Weakness Blueprint"
            detail={breakdown ? `Generated ${new Date(breakdown.generatedAt).toLocaleTimeString()}` : "Awaiting rival input"}
          />

          {!breakdown ? (
            <div className="py-10 text-center space-y-2 text-xs text-slate-500">
              <Radar className="w-6 h-6 mx-auto text-slate-400" />
              <p>
                Paste any rival video title and transcript on the left to extract its retention triggers, pacing flaw, and a ready-to-shoot counter-hook.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xs border border-[#E1392B]/30 bg-[#E1392B]/[0.05] space-y-1">
                <div className="font-mono text-[11px] text-[#E1392B] font-semibold">
                  Recommended Counter-Hook Banner
                </div>
                <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {breakdown.counterHookBanner}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1">
                  <div className="font-mono text-[10px] text-slate-500">Rival Hook Mechanic</div>
                  <p className="text-slate-700 dark:text-slate-200">{breakdown.hookMechanic}</p>
                </div>
                <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1">
                  <div className="font-mono text-[10px] text-rose-500 font-semibold">Weakness To Exploit</div>
                  <p className="text-slate-700 dark:text-slate-200">{breakdown.weaknessToExploit}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-[10px] text-slate-500">Pacing &amp; Retention Triggers</div>
                <p className="text-slate-600 dark:text-slate-300">{breakdown.pacingNotes}</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 pt-1">
                  {breakdown.retentionTriggers.map((trigger, i) => (
                    <li key={i}>{trigger}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D] flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-500">
                  Template: {breakdown.recommendedTemplate}
                </span>
                <button
                  type="button"
                  disabled={creatingCounter}
                  onClick={async () => {
                    setCreatingCounter(true);
                    try {
                      await onCreateCounterClip(rivalTitle.trim(), breakdown);
                    } finally {
                      setCreatingCounter(false);
                    }
                  }}
                  className="h-8 px-3.5 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {creatingCounter ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>Build Counter-Clip in Studio</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
