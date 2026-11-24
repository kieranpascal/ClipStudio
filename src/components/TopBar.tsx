import { Moon, Sun, Play, Loader2, Menu } from "lucide-react";
import type { WorkspaceTab } from "../types";

interface TopBarProps {
  activeTab: WorkspaceTab;
  isDark: boolean;
  onToggleTheme: () => void;
  onRunPipeline: () => void;
  isRunningPipeline: boolean;
  activeClipTitle?: string;
  onOpenMobileNav?: () => void;
}

const TAB_TITLES: Record<WorkspaceTab, string> = {
  radar: "Clip Radar",
  studio: "Vertical Studio",
  gitops: "GitOps & Cloudflare Pages",
  revenue: "Revenue & Feedback Loop",
  queue: "Publish Queue",
};

export function TopBar({
  activeTab,
  isDark,
  onToggleTheme,
  onRunPipeline,
  isRunningPipeline,
  activeClipTitle,
  onOpenMobileNav,
}: TopBarProps) {
  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F131B] flex items-center justify-between gap-4 sm:gap-8 shrink-0">
      {/* Left: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
            className="md:hidden h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 hidden sm:inline">Workspace</span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
          /
        </span>
        <span className="font-display font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          {TAB_TITLES[activeTab]}
        </span>
        {activeTab === "studio" && activeClipTitle && (
          <>
            <span className="text-slate-300 dark:text-slate-700 hidden lg:inline" aria-hidden="true">
              /
            </span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[320px] hidden lg:inline">
              {activeClipTitle}
            </span>
          </>
        )}
      </div>

      {/* Right: Theme Toggle + 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141A25] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center transition-colors shrink-0"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={isRunningPipeline}
          className="h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          {isRunningPipeline ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{isRunningPipeline ? "Running Pipeline..." : "Run Pipeline"}</span>
        </button>
      </div>
    </header>
  );
}
