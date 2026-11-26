import { Moon, Sun, Play, Loader2, Command, Settings, User } from "lucide-react";
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
  authUser: AuthUser | null;
  onRunPipeline: () => void;
  isRunningPipeline: boolean;
  pendingCount: number;
  readyCount: number;
  activeAlertCount: number;
}

const EASY_TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "ingest", label: "Research" },
  { id: "ai-lab", label: "AI Lab" },
  { id: "performance", label: "Performance" },
  { id: "autopilot", label: "AI Agent" },
  { id: "distribution", label: "Publish" },
];

const ADVANCED_TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "studio", label: "Studio" },
  { id: "ingest", label: "Research" },
  { id: "vod", label: "VOD" },
  { id: "templates", label: "Templates" },
  { id: "assets", label: "Assets" },
  { id: "ai-lab", label: "AI Lab" },
  { id: "distribution", label: "Publish" },
  { id: "autopilot", label: "AI Agent" },
  { id: "performance", label: "Performance" },
  { id: "gitops", label: "GitOps" },
  { id: "guide", label: "Deck" },
];

export function TopBar({
  activeTab,
  onSelectTab,
  uiMode,
  onToggleUiMode,
  isDark,
  onToggleTheme,
  onOpenCommandBar,
  onOpenSettings,
  onOpenAccount,
  authUser,
  onRunPipeline,
  isRunningPipeline,
  pendingCount,
  readyCount,
  activeAlertCount,
}: TopBarProps) {
  const tabs = uiMode === "easy" ? EASY_TABS : ADVANCED_TABS;

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] flex items-center justify-between gap-3 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <button
        type="button"
        onClick={() => onSelectTab("studio")}
        className="font-display text-lg font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-[1px] bg-[#E1392B]" aria-hidden="true" />
        <span>ClipForge</span>
      </button>

      {/* Zone 2: Single-Line Navigation */}
      <nav
        className="flex items-center gap-3.5 lg:gap-4 h-full overflow-x-auto no-scrollbar"
        aria-label="Workspace sections"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const isAlertTab = tab.id === "performance" && activeAlertCount > 0;
          const count =
            tab.id === "ingest" && pendingCount > 0
              ? pendingCount
              : tab.id === "distribution" && readyCount > 0
                ? readyCount
                : isAlertTab
                  ? activeAlertCount
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
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isAlertTab
                      ? "text-[#E1392B] font-bold"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {isAlertTab ? `!${count}` : count}
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

      {/* Zone 3: Easy/Pro Switch + AI Command Palette + Account + Settings + Theme + Dispatch */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          role="group"
          aria-label="Interface complexity mode"
          className="h-9 p-0.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] inline-flex items-center text-[11px] font-medium shrink-0"
        >
          <button
            type="button"
            onClick={() => onToggleUiMode("easy")}
            className={`h-full px-2 rounded-xs transition-colors whitespace-nowrap ${
              uiMode === "easy"
                ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            Easy
          </button>
          <button
            type="button"
            onClick={() => onToggleUiMode("advanced")}
            className={`h-full px-2 rounded-xs transition-colors whitespace-nowrap ${
              uiMode === "advanced"
                ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            Pro
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenCommandBar}
          title="Open AI Command Bar (Cmd+K / Ctrl+K)"
          className="h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:border-[#E1392B] text-xs font-mono inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Command className="w-3.5 h-3.5 text-[#E1392B]" />
          <span className="hidden xl:inline">AI</span>
          <kbd className="text-[10px] text-slate-400">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          title={authUser ? `Signed in as ${authUser.displayName}` : "Account & Database Sync"}
          aria-label="Account and Database Sync"
          className="h-9 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:border-[#E1392B] text-xs font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
        >
          <User className={`w-3.5 h-3.5 ${authUser ? "text-emerald-500" : ""}`} />
          <span className="hidden xl:inline max-w-[76px] truncate">
            {authUser ? authUser.displayName : "Account"}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Global Hotkeys & Studio Settings"
          aria-label="Open Global Hotkeys and Studio Settings"
          className="h-9 w-9 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:border-[#E1392B] flex items-center justify-center transition-colors shrink-0"
        >
          <Settings className="w-4 h-4" />
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
          className="h-9 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-60 text-white text-xs font-semibold tracking-tight inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          {isRunningPipeline ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span className="hidden sm:inline">{isRunningPipeline ? "Running..." : "Dispatch"}</span>
        </button>
      </div>
    </header>
  );
}
