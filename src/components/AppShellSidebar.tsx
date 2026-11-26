import {
  LayoutDashboard,
  Clapperboard,
  Compass,
  Scissors,
  Layers,
  Image as ImageIcon,
  Sparkles,
  DollarSign,
  Send,
  Bot,
  Activity,
  GitBranch,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import type { UiMode, WorkspaceTab } from "../types";

interface AppShellSidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  uiMode: UiMode;
  onToggleUiMode: (mode: UiMode) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount: number;
  readyCount: number;
  activeAlertCount: number;
  channelCount: number;
}

interface NavItemDef {
  id: WorkspaceTab;
  label: string;
  shortLabel: string;
  icon: typeof Clapperboard;
  group: "overview" | "create" | "grow" | "system";
  easyMode: boolean;
  count?: number;
  alertCount?: number;
}

export function AppShellSidebar({
  activeTab,
  onSelectTab,
  uiMode,
  onToggleUiMode,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  pendingCount,
  readyCount,
  activeAlertCount,
  channelCount,
}: AppShellSidebarProps) {
  const navItems: NavItemDef[] = [
    {
      id: "dashboard",
      label: "Studio Dashboard",
      shortLabel: "Home",
      icon: LayoutDashboard,
      group: "overview",
      easyMode: true,
    },
    {
      id: "studio",
      label: "Cut Studio",
      shortLabel: "Studio",
      icon: Clapperboard,
      group: "create",
      easyMode: true,
    },
    {
      id: "ingest",
      label: "Research & Gaps",
      shortLabel: "Research",
      icon: Compass,
      group: "create",
      easyMode: true,
      count: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: "vod",
      label: "VOD Slicer",
      shortLabel: "VOD",
      icon: Scissors,
      group: "create",
      easyMode: false,
    },
    {
      id: "templates",
      label: "Templates & B-Roll",
      shortLabel: "B-Roll",
      icon: Layers,
      group: "create",
      easyMode: false,
    },
    {
      id: "assets",
      label: "Asset Discovery",
      shortLabel: "Assets",
      icon: ImageIcon,
      group: "create",
      easyMode: false,
    },
    {
      id: "ai-lab",
      label: "Multimodal AI Lab",
      shortLabel: "AI Lab",
      icon: Sparkles,
      group: "create",
      easyMode: true,
    },
    {
      id: "monetization",
      label: "Monetization Hub",
      shortLabel: "Money",
      icon: DollarSign,
      group: "grow",
      easyMode: true,
    },
    {
      id: "performance",
      label: "Performance & ROI",
      shortLabel: "ROI",
      icon: Activity,
      group: "grow",
      easyMode: true,
      alertCount: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    {
      id: "distribution",
      label: "Channels & Publish",
      shortLabel: "Publish",
      icon: Send,
      group: "grow",
      easyMode: true,
      count: readyCount > 0 ? readyCount : undefined,
    },
    {
      id: "autopilot",
      label: "AI Autopilot & Local LLM",
      shortLabel: "Autopilot",
      icon: Bot,
      group: "grow",
      easyMode: true,
    },
    {
      id: "gitops",
      label: "GitOps & Windows/VPS",
      shortLabel: "GitOps",
      icon: GitBranch,
      group: "system",
      easyMode: false,
    },
    {
      id: "guide",
      label: "Pitch Deck & Training",
      shortLabel: "Training",
      icon: BookOpen,
      group: "system",
      easyMode: true,
    },
  ];

  const visibleItems =
    uiMode === "easy" ? navItems.filter((item) => item.easyMode) : navItems;

  const groups: Array<{ id: NavItemDef["group"]; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "create", label: "Production" },
    { id: "grow", label: "Monetization & Growth" },
    { id: "system", label: "System & Training" },
  ];

  const renderRailContent = (isMobileDrawer: boolean) => {
    const compact = !isMobileDrawer && collapsed;
    return (
      <div className="flex flex-col h-full bg-[#ECEFF4] dark:bg-[#0D0F14] border-r border-[#D4DAE4] dark:border-[#1E222D] select-none">
        {/* Brand Header Row */}
        <div
          className={`h-12 px-3 border-b border-[#D4DAE4] dark:border-[#1E222D] flex items-center ${
            compact ? "justify-center" : "justify-between"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onSelectTab("dashboard");
              onCloseMobile();
            }}
            className="flex items-center gap-2 min-w-0 text-left focus-visible:outline-none"
          >
            <span
              className="w-6 h-6 rounded-xs bg-[#E1392B] text-white font-display font-extrabold text-xs inline-flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              CF
            </span>
            {!compact && (
              <span className="font-display font-bold text-sm tracking-tight text-[#0F172A] dark:text-[#F1F5F9] whitespace-nowrap truncate">
                ClipForge
              </span>
            )}
          </button>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="w-7 h-7 rounded-xs text-slate-500 hover:text-[#0F172A] dark:hover:text-white inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            !compact && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="w-7 h-7 rounded-xs text-slate-500 hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Easy / Pro Workspace Mode Switcher */}
        {!compact && (
          <div className="px-3 pt-3 pb-2">
            <div className="grid grid-cols-2 p-0.5 rounded-sm bg-[#DFE4EC] dark:bg-[#151821] border border-[#CFD6E2] dark:border-[#232836] text-[11px]">
              <button
                type="button"
                onClick={() => onToggleUiMode("easy")}
                className={`py-1 rounded-xs font-semibold transition-colors whitespace-nowrap ${
                  uiMode === "easy"
                    ? "bg-white dark:bg-[#0D0F14] text-[#0F172A] dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => onToggleUiMode("advanced")}
                className={`py-1 rounded-xs font-semibold transition-colors whitespace-nowrap ${
                  uiMode === "advanced"
                    ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                Pro Studio
              </button>
            </div>
          </div>
        )}

        {/* Grouped Navigation Rail */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4" aria-label="Workspace navigation">
          {groups.map((grp) => {
            const grpItems = visibleItems.filter((item) => item.group === grp.id);
            if (grpItems.length === 0) return null;
            return (
              <div key={grp.id} className="space-y-0.5">
                {!compact && (
                  <div className="px-2 pb-1 text-[10px] font-medium text-slate-500 dark:text-slate-500 tracking-wide">
                    {grp.label}
                  </div>
                )}
                {grpItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={compact ? item.label : undefined}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full h-8 px-2 rounded-xs flex items-center ${
                        compact ? "justify-center" : "justify-between"
                      } text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#0F172A] dark:bg-[#1A1E29] text-white dark:text-[#F8FAFC]"
                          : "text-slate-700 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-[#0F172A] dark:hover:text-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? "text-[#E1392B]" : "text-slate-500 dark:text-slate-400"
                          }`}
                        />
                        {!compact && <span className="truncate whitespace-nowrap">{item.label}</span>}
                      </span>

                      {!compact && item.alertCount !== undefined && (
                        <span className="font-mono text-[10px] font-bold tabular-nums text-[#E1392B]">
                          {item.alertCount}
                        </span>
                      )}
                      {!compact && item.alertCount === undefined && item.count !== undefined && (
                        <span
                          className={`font-mono text-[10px] tabular-nums ${
                            active ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Workspace Summary & Expand Button */}
        <div className="p-2.5 border-t border-[#D4DAE4] dark:border-[#1E222D]">
          {compact ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="w-full h-8 rounded-xs text-slate-500 hover:text-[#0F172A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="px-1.5 py-1 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
              <span>{channelCount} channels</span>
              <span>{uiMode === "easy" ? "Simple" : "Pro"}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Pro Rail */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-[width] duration-150 ${
          collapsed ? "w-14" : "w-56"
        }`}
      >
        {renderRailContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 max-w-[82vw] h-full">{renderRailContent(true)}</div>
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={onCloseMobile}
            className="flex-1 bg-black/50"
          />
        </div>
      )}
    </>
  );
}
