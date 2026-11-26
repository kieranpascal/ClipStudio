import { ArrowUpRight, CheckCircle2, Globe } from "lucide-react";
import type {
  ContentNiche,
  PipelineConfig,
  PlatformExpansionState,
  SocialPlatform,
  WorkspaceTab,
} from "../types";
import { PlatformExpansionHub } from "./PlatformExpansionHub";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

interface PlatformExpansionPageProps {
  config: PipelineConfig;
  platformExpansion?: PlatformExpansionState;
  isResearchingExpansion: boolean;
  applyingPatternId: string | null;
  removingPlatform: SocialPlatform | null;
  onUpdateExpansionConfig: (patch: {
    autoSyncToDistribution?: boolean;
    autoTargetMinScore?: number;
    focusNiche?: ContentNiche | "all";
  }) => Promise<void>;
  onResearchExpansion: (payload: {
    focusNiche?: ContentNiche | "all";
    customQuery?: string;
    autoApplyNow?: boolean;
  }) => Promise<void>;
  onApplyExpansionPattern: (payload: {
    patternId?: string;
    applyAllHighScore?: boolean;
  }) => Promise<void>;
  onRemoveExpansionPlatform: (platform: SocialPlatform) => Promise<void>;
  onSelectTab: (tab: WorkspaceTab) => void;
}

const ALL_12_PLATFORMS: Array<{ name: SocialPlatform; tier: "Primary" | "Secondary Arbitrage"; ratio: string }> = [
  { name: "TikTok", tier: "Primary", ratio: "9:16" },
  { name: "YouTube Shorts", tier: "Primary", ratio: "9:16" },
  { name: "Instagram Reels", tier: "Primary", ratio: "9:16" },
  { name: "X Video", tier: "Primary", ratio: "16:9 / 9:16" },
  { name: "Snapchat Spotlight", tier: "Primary", ratio: "9:16" },
  { name: "Facebook Reels", tier: "Primary", ratio: "9:16" },
  { name: "LinkedIn Video", tier: "Secondary Arbitrage", ratio: "9:16 / 4:5" },
  { name: "Reddit Native Video", tier: "Secondary Arbitrage", ratio: "9:16 / 1:1" },
  { name: "Pinterest Idea Pins", tier: "Secondary Arbitrage", ratio: "9:16" },
  { name: "Threads Video", tier: "Secondary Arbitrage", ratio: "9:16" },
  { name: "Bluesky Video", tier: "Secondary Arbitrage", ratio: "16:9 / 9:16" },
  { name: "Substack Video", tier: "Secondary Arbitrage", ratio: "9:16 / 16:9" },
];

export function PlatformExpansionPage({
  config,
  platformExpansion,
  isResearchingExpansion,
  applyingPatternId,
  removingPlatform,
  onUpdateExpansionConfig,
  onResearchExpansion,
  onApplyExpansionPattern,
  onRemoveExpansionPlatform,
  onSelectTab,
}: PlatformExpansionPageProps) {
  const activePlatforms = new Set(config.publishing.platforms);
  const patterns = platformExpansion?.patterns || [];
  const topScore = patterns.length > 0 ? Math.max(...patterns.map((p) => p.viralPotentialScore)) : 0;
  const secondaryActive = ALL_12_PLATFORMS.filter(
    (p) => p.tier === "Secondary Arbitrage" && activePlatforms.has(p.name)
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Monetization & Growth"
        title="Platform Expansion & Secondary Distribution Engine"
        subtitle="Research emerging low-competition short-form platforms (LinkedIn Video, Reddit Native, Pinterest Idea Pins, Threads, Bluesky, Substack) via Google Search and sync winning aspect ratios straight into your publishing fleet."
        metaItems={[
          { label: `${activePlatforms.size} / 12 Platforms Active`, emphasis: "emerald" },
          { label: `${secondaryActive} Secondary Unlocked`, emphasis: "crimson" },
          { label: `${patterns.length} Researched Formats` },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("distribution")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Open Channels &amp; Publish</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E1392B]" />
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "active-platforms",
            label: "Active Distribution Surfaces",
            value: `${activePlatforms.size} / 12`,
            subtext: `${config.channelFleet.length} fleet channel accounts linked`,
            tone: "emerald",
            onClick: () => onSelectTab("distribution"),
          },
          {
            id: "secondary-unlocked",
            label: "Secondary Arbitrage Channels",
            value: `${secondaryActive} / 6`,
            subtext: "Low-competition organic reach multipliers",
            tone: "crimson",
          },
          {
            id: "top-pattern",
            label: "Highest Viral Pattern Score",
            value: topScore > 0 ? `${topScore}/100` : "Ready",
            subtext: `Auto-sync threshold: ${platformExpansion?.autoTargetMinScore ?? 84}+`,
          },
          {
            id: "research-runs",
            label: "Expansion Research Cycles",
            value: String(platformExpansion?.totalResearchRuns ?? 0),
            subtext: platformExpansion?.autoSyncToDistribution
              ? "Auto-sync to Distribution enabled"
              : "Manual approval required",
          },
        ]}
      />

      {/* 12-Platform Footprint Matrix */}
      <div className="px-5 pt-5">
        <section className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-3">
          <StudioSectionHeader
            zone="telemetry"
            title="12-Platform Distribution Footprint Matrix"
            detail="Primary short-form surfaces vs. emerging secondary arbitrage networks"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {ALL_12_PLATFORMS.map((p) => {
              const isOn = activePlatforms.has(p.name);
              return (
                <div
                  key={p.name}
                  className={`p-2.5 rounded-xs border space-y-1 ${
                    isOn
                      ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                      : "border-[#D4DAE4] dark:border-[#232836] bg-[#F8FAFC] dark:bg-[#0D0F14]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                      {p.name}
                    </span>
                    {isOn ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{p.ratio}</span>
                    <span>{isOn ? "Active" : "Available"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Full Interactive Platform Expansion Researcher */}
      <div className="flex-1">
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
          onOpenDistributionTab={() => onSelectTab("distribution")}
        />
      </div>
    </div>
  );
}
