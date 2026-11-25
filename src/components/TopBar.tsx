import { Moon, Sun, Play, Loader2, Command } from "lucide-react";
import type { WorkspaceTab } from "../types";

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommandBar: () => void;
  onRunPipeline: () => void;
  isRunningPipeline: boolean;
  pendingCount: number;
  readyCount: number;
}

const DECK_TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "ingest", label: "Ingest" },
  { id: "vod", label: "VOD" },
  { id: "templates", label: "Templates" },
  { id: "distribution", label: "Distribution" },
  { id: "autopilot", label: "AI Director" },
  { id: "gitops", label: "GitOps" },
  { id: "guide", label: "Deck" },
];

export function TopBar({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  onOpenCommandBar,
  onRunPipeline,
  isRunningPipeline,
  pendingCount,
  readyCount,
}: TopBarProps) {
  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] flex items-center justify-between gap-4 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <button
        type="button"
        onClick={() => onSelectTab("studio")}
        className="font-display text-lg font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-[1px] bg-[#E1392B]" aria-hidden="true" />
        <span>ClipForge</span>
      </button>

      {/* Zone 2: Single-Line 8-Section Studio Navigation */}
      <nav
        className="flex items-center gap-4 lg:gap-6 h-full overflow-x-auto no-scrollbar"
        aria-label="Workspace sections"
      >
        {DECK_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count =
            tab.id === "ingest" && pendingCount > 0
              ? pendingCount
              : tab.id === "distribution" && readyCount > 0
                ? readyCount
                : null;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative h-full inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? "text-[#0F172A] dark:text-[#F1F5F9]"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              {count !== null && (
                <span className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {count}
                </span>
              )}
              {active && (
                <span
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: AI Command Palette + Theme Toggle + Dispatch CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCommandBar}
          title="Open AI Command Bar (Cmd+K / Ctrl+K)"
          className="h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:border-[#E1392B] text-xs font-mono inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Command className="w-3.5 h-3.5 text-[#E1392B]" />
          <span className="hidden md:inline">AI</span>
          <kbd className="text-[10px] text-slate-400">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to daylight studio" : "Switch to dark studio"}
          className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={isRunningPipeline}
          className="h-9 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold tracking-tight inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          {isRunningPipeline ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunningPipeline ? "Running..." : "Dispatch"}</span>
        </button>
      </div>
    </header>
  );
}
