import {
  Moon,
  Sun,
  Play,
  Loader2,
  Command,
  Settings,
  User,
  Menu,
  Bell,
} from "lucide-react";
import type { AuthUser, UiMode, WorkspaceTab } from "../types";

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  uiMode: UiMode;
  onToggleUiMode: (mode: UiMode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommandBar: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onOpenMobileMenu?: () => void;
  authUser: AuthUser | null;
  onRunPipeline: () => void;
  isRunningPipeline: boolean;
  pendingCount: number;
  readyCount: number;
  activeAlertCount: number;
}

const TAB_TITLES: Record<WorkspaceTab, { section: string; label: string }> = {
  dashboard: { section: "Overview", label: "Studio Dashboard" },
  "research-hub": { section: "Research & Intel", label: "Research Commander" },
  "opportunity-radar": { section: "Research & Intel", label: "Opportunity & Gap Radar" },
  "audience-social-intel": { section: "Research & Intel", label: "Community Sentiment" },
  "competitor-intel": { section: "Research & Intel", label: "TrendPulse & Rivals" },
  ingest: { section: "Production", label: "Media Bin & QA" },
  studio: { section: "Production", label: "Cut Studio" },
  "faceless-studio": { section: "Production", label: "Faceless & Long-Form" },
  vod: { section: "Production", label: "VOD Slicer" },
  templates: { section: "Production", label: "Templates & B-Roll" },
  assets: { section: "Production", label: "Asset Discovery" },
  "ai-lab": { section: "Production", label: "Multimodal AI Lab" },
  monetization: { section: "Monetization & Growth", label: "Monetization Hub" },
  "affiliates-funnels": { section: "Monetization & Growth", label: "Affiliates & Funnels" },
  performance: { section: "Monetization & Growth", label: "Performance & ROI" },
  distribution: { section: "Monetization & Growth", label: "Channels & Publish" },
  "platform-expansion": { section: "Monetization & Growth", label: "Platform Expansion" },
  autopilot: { section: "Monetization & Growth", label: "AI Autopilot" },
  "compute-remote": { section: "Infrastructure", label: "Compute & Remote" },
  gitops: { section: "Infrastructure", label: "GitOps & Deploy" },
  guide: { section: "Infrastructure", label: "Pitch Deck & Academy" },
};

export function TopBar({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  onOpenCommandBar,
  onOpenSettings,
  onOpenAccount,
  onOpenMobileMenu,
  authUser,
  onRunPipeline,
  isRunningPipeline,
  activeAlertCount,
}: TopBarProps) {
  const current = TAB_TITLES[activeTab] || { section: "Studio", label: "Workspace" };

  return (
    <header className="h-11 shrink-0 px-3 sm:px-5 border-b border-[#CDD5E0] dark:border-[#1F2533] bg-[#F7F9FC] dark:bg-[#0B0E14] flex items-center justify-between gap-4">
      {/* Zone 1: Mobile Menu Trigger + Desktop Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open workspace navigation"
            className="lg:hidden w-8 h-8 rounded-xs text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {current.section}
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-600" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-bold text-sm tracking-tight text-[#0B1120] dark:text-[#F8FAFC] truncate whitespace-nowrap">
            {current.label}
          </h1>
        </div>
      </div>

      {/* Zone 2: Desktop Spotlight Command Palette */}
      <button
        type="button"
        onClick={onOpenCommandBar}
        className="hidden md:flex items-center justify-between gap-4 w-72 lg:w-96 h-7 px-3 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#131721] text-xs text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 transition-colors shrink-0"
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Command className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Jump to workspace, clip, or AI Director...</span>
        </span>
        <kbd className="font-mono text-[10px] text-slate-400 whitespace-nowrap">⌘K</kbd>
      </button>

      {/* Zone 3: Compact Desktop Controls + Primary Action */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeAlertCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectTab("performance")}
            title="View active ROI and competitor alerts"
            className="h-7 px-2 rounded-xs border border-[#E1392B]/40 bg-[#E1392B]/10 text-[#E1392B] text-xs font-mono font-semibold tabular-nums inline-flex items-center gap-1.5 hover:bg-[#E1392B]/15 transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{activeAlertCount}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="w-7 h-7 rounded-xs text-slate-500 hover:text-[#0B1120] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open hotkeys and workspace settings"
          className="w-7 h-7 rounded-xs text-slate-500 hover:text-[#0B1120] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          className="h-7 px-2.5 rounded-xs border border-[#CDD5E0] dark:border-[#242B3B] bg-white dark:bg-[#131721] text-xs font-medium text-[#0B1120] dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline max-w-[96px] truncate">
            {authUser ? authUser.displayName : "Account"}
          </span>
        </button>

        <button
          type="button"
          disabled={isRunningPipeline}
          onClick={onRunPipeline}
          className="h-7 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          {isRunningPipeline ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunningPipeline ? "Running..." : "Run Pipeline"}</span>
        </button>
      </div>
    </header>
  );
}
