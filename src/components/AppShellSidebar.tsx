import { useMemo, useState } from "react";
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
  Search,
  MessageSquareText,
  Film,
  Wand2,
  Link2,
  Globe,
  Cpu,
  ChevronDown,
  ChevronRight,
  Radio,
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
  researchSignalCount?: number;
  pendingCount: number;
  readyCount: number;
  activeAlertCount: number;
  channelCount: number;
}

type NavGroupId = "overview" | "research" | "create" | "grow" | "system";

interface NavItemDef {
  id: WorkspaceTab;
  label: string;
  hint: string;
  icon: typeof Clapperboard;
  group: NavGroupId;
  easyMode: boolean;
  count?: number;
  alertCount?: number;
}

const GROUPS: Array<{
  id: NavGroupId;
  label: string;
  shortLabel: string;
  icon: typeof Clapperboard;
  defaultTab: WorkspaceTab;
}> = [
  { id: "overview", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, defaultTab: "dashboard" },
  { id: "research", label: "Research & Intel", shortLabel: "Research", icon: Compass, defaultTab: "research-hub" },
  { id: "create", label: "Production", shortLabel: "Studio", icon: Clapperboard, defaultTab: "studio" },
  { id: "grow", label: "Monetization & Growth", shortLabel: "Growth", icon: DollarSign, defaultTab: "monetization" },
  { id: "system", label: "Infrastructure", shortLabel: "Infra", icon: Cpu, defaultTab: "compute-remote" },
];

export function AppShellSidebar({
  activeTab,
  onSelectTab,
  uiMode,
  onToggleUiMode,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  researchSignalCount = 0,
  pendingCount,
  readyCount,
  activeAlertCount,
  channelCount,
}: AppShellSidebarProps) {
  const [navSearch, setNavSearch] = useState("");
  const [scopeMode, setScopeMode] = useState<"all" | "group">("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Partial<Record<NavGroupId, boolean>>>({});

  const navItems: NavItemDef[] = useMemo(
    () => [
      // 1. OVERVIEW
      {
        id: "dashboard",
        label: "Studio Dashboard",
        hint: "Action deck, clips & telemetry",
        icon: LayoutDashboard,
        group: "overview",
        easyMode: true,
      },

      // 2. RESEARCH & INTELLIGENCE (Before Production)
      {
        id: "research-hub",
        label: "Research Commander",
        hint: "Multi-source deck, TrendPulse & Sentiment",
        icon: Compass,
        group: "research",
        easyMode: true,
        count: researchSignalCount > 0 ? researchSignalCount : undefined,
      },
      {
        id: "opportunity-radar",
        label: "Opportunity & Gap Radar",
        hint: "Keyword gaps, outliers & crawler",
        icon: Search,
        group: "research",
        easyMode: true,
      },
      {
        id: "audience-social-intel",
        label: "Community Sentiment",
        hint: "Comments, edit styles & news",
        icon: MessageSquareText,
        group: "research",
        easyMode: true,
      },
      {
        id: "competitor-intel",
        label: "TrendPulse & Rivals",
        hint: "Live trends & formula audits",
        icon: Radio,
        group: "research",
        easyMode: true,
      },

      // 3. PRODUCTION
      {
        id: "ingest",
        label: "Media Bin & QA",
        hint: "Intake queue, velocity & rights",
        icon: Film,
        group: "create",
        easyMode: true,
        count: pendingCount > 0 ? pendingCount : undefined,
      },
      {
        id: "studio",
        label: "Cut Studio",
        hint: "9:16 NLE, hooks, TTS & captions",
        icon: Clapperboard,
        group: "create",
        easyMode: true,
      },
      {
        id: "faceless-studio",
        label: "Faceless & Long-Form",
        hint: "Story builder & 10m+ blueprints",
        icon: Wand2,
        group: "create",
        easyMode: true,
      },
      {
        id: "vod",
        label: "VOD Slicer",
        hint: "Prompt search & arc guard",
        icon: Scissors,
        group: "create",
        easyMode: false,
      },
      {
        id: "templates",
        label: "Templates & B-Roll",
        hint: "Batch layouts & alignment",
        icon: Layers,
        group: "create",
        easyMode: false,
      },
      {
        id: "assets",
        label: "Asset Discovery",
        hint: "License-safe B-roll vault",
        icon: ImageIcon,
        group: "create",
        easyMode: false,
      },
      {
        id: "ai-lab",
        label: "Multimodal AI Lab",
        hint: "Voice, video, image & music",
        icon: Sparkles,
        group: "create",
        easyMode: true,
      },

      // 4. MONETIZATION & GROWTH
      {
        id: "monetization",
        label: "Monetization Hub",
        hint: "Revenue forecasts & sponsors",
        icon: DollarSign,
        group: "grow",
        easyMode: true,
      },
      {
        id: "affiliates-funnels",
        label: "Affiliates & Funnels",
        hint: "UTM links, opt-in pages & A/B",
        icon: Link2,
        group: "grow",
        easyMode: true,
      },
      {
        id: "performance",
        label: "Performance & ROI",
        hint: "Sankey, velocity & alerts",
        icon: Activity,
        group: "grow",
        easyMode: true,
        alertCount: activeAlertCount > 0 ? activeAlertCount : undefined,
      },
      {
        id: "distribution",
        label: "Channels & Publish",
        hint: "Multi-channel fleet scheduler",
        icon: Send,
        group: "grow",
        easyMode: true,
        count: readyCount > 0 ? readyCount : undefined,
      },
      {
        id: "platform-expansion",
        label: "Platform Expansion",
        hint: "12-network distribution matrix",
        icon: Globe,
        group: "grow",
        easyMode: false,
      },
      {
        id: "autopilot",
        label: "AI Autopilot",
        hint: "12-stage missions & learning",
        icon: Bot,
        group: "grow",
        easyMode: true,
      },

      // 5. INFRASTRUCTURE & TRAINING
      {
        id: "compute-remote",
        label: "Compute & Remote",
        hint: "LM Studio, VPS & Discord bot",
        icon: Cpu,
        group: "system",
        easyMode: true,
      },
      {
        id: "gitops",
        label: "GitOps & Deploy",
        hint: "Config repo & CI pipelines",
        icon: GitBranch,
        group: "system",
        easyMode: false,
      },
      {
        id: "guide",
        label: "Pitch Deck & Academy",
        hint: "20 chapters & feature atlas",
        icon: BookOpen,
        group: "system",
        easyMode: true,
      },
    ],
    [researchSignalCount, pendingCount, readyCount, activeAlertCount]
  );

  const activeGroup: NavGroupId =
    navItems.find((i) => i.id === activeTab)?.group || "overview";

  const visibleItems = useMemo(() => {
    const modeFiltered =
      uiMode === "easy" ? navItems.filter((item) => item.easyMode) : navItems;
    const q = navSearch.trim().toLowerCase();
    if (!q) return modeFiltered;
    return modeFiltered.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q)
    );
  }, [navItems, uiMode, navSearch]);

  const groupCounters: Record<NavGroupId, number> = {
    overview: 0,
    research: researchSignalCount,
    create: pendingCount,
    grow: activeAlertCount > 0 ? activeAlertCount : readyCount,
    system: 0,
  };

  function toggleGroupFold(groupId: NavGroupId) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function handleSelectGroupFromActivityBar(groupId: NavGroupId, defaultTab: WorkspaceTab) {
    if (collapsed) {
      onSelectTab(defaultTab);
      return;
    }
    if (activeGroup !== groupId) {
      onSelectTab(defaultTab);
    }
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: false }));
  }

  const renderDesktopRail = (isMobileDrawer: boolean) => {
    const showDrawer = isMobileDrawer || !collapsed;
    const groupsToRender =
      scopeMode === "group" && !navSearch.trim()
        ? GROUPS.filter((g) => g.id === activeGroup)
        : GROUPS;

    return (
      <div className="flex h-full select-none">
        {/* RAIL 1: Dedicated Desktop App Icon Activity Bar (52px) */}
        <div className="w-[52px] shrink-0 flex flex-col items-center bg-[#DCE2EC] dark:bg-[#07090D] border-r border-[#C5CEDC] dark:border-[#1B202C] py-2 justify-between">
          <div className="flex flex-col items-center gap-1.5 w-full">
            {/* Brand Emblem */}
            <button
              type="button"
              onClick={() => {
                onSelectTab("dashboard");
                onCloseMobile();
              }}
              title="ClipForge Studio Home"
              className="w-8 h-8 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-display font-extrabold text-xs inline-flex items-center justify-center mb-2 transition-colors"
            >
              CF
            </button>

            {/* 5 Category Activity Icons */}
            {GROUPS.map((grp) => {
              const Icon = grp.icon;
              const isActive = activeGroup === grp.id;
              const badge = groupCounters[grp.id];
              const isAlert = grp.id === "grow" && activeAlertCount > 0;
              return (
                <button
                  key={grp.id}
                  type="button"
                  title={`${grp.label}`}
                  onClick={() => handleSelectGroupFromActivityBar(grp.id, grp.defaultTab)}
                  className={`relative w-full h-11 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive
                      ? "text-[#0B1120] dark:text-[#F8FAFC] bg-white/75 dark:bg-[#12161F]"
                      : "text-slate-600 dark:text-slate-500 hover:text-[#0B1120] dark:hover:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-[#E1392B]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#E1392B]" : ""
                    }`}
                  />
                  <span className="text-[9px] font-semibold tracking-tight leading-none">
                    {grp.shortLabel}
                  </span>
                  {badge > 0 && (
                    <span
                      className={`absolute top-1 right-1 font-mono text-[9px] font-bold tabular-nums leading-none ${
                        isAlert ? "text-[#E1392B]" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {badge > 99 ? "99" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Activity Bar Controls */}
          <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-[#C5CEDC] dark:border-[#1B202C]">
            {!isMobileDrawer && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                title={collapsed ? "Expand workspace navigator" : "Collapse workspace navigator"}
                aria-label={collapsed ? "Expand workspace navigator" : "Collapse workspace navigator"}
                className="w-8 h-8 rounded-xs text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center transition-colors"
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* RAIL 2: Structured Desktop Workspace Navigator (228px) */}
        {showDrawer && (
          <div className="w-[228px] shrink-0 flex flex-col bg-[#ECEFF4] dark:bg-[#0D1017] border-r border-[#CDD5E0] dark:border-[#1F2533]">
            {/* Workspace Header */}
            <div className="h-11 px-3 border-b border-[#CDD5E0] dark:border-[#1F2533] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display font-bold text-sm tracking-tight text-[#0B1120] dark:text-[#F8FAFC] truncate">
                  ClipForge Studio
                </div>
              </div>
              {isMobileDrawer ? (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation menu"
                  className="w-7 h-7 rounded-xs text-slate-500 hover:text-[#0B1120] dark:hover:text-white inline-flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="font-mono text-[10px] tabular-nums text-slate-500">
                  {visibleItems.length}/{navItems.length}
                </span>
              )}
            </div>

            {/* Mode + Quick Page Filter */}
            <div className="p-2.5 space-y-2 border-b border-[#D6DDE8] dark:border-[#1B202C]">
              <div className="grid grid-cols-2 p-0.5 rounded-xs bg-[#DDE3EC] dark:bg-[#141822] border border-[#C8D0DF] dark:border-[#242B3B] text-[11px]">
                <button
                  type="button"
                  onClick={() => onToggleUiMode("easy")}
                  className={`py-1 rounded-[2px] font-semibold transition-colors whitespace-nowrap ${
                    uiMode === "easy"
                      ? "bg-white dark:bg-[#0A0D13] text-[#0B1120] dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white"
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => onToggleUiMode("advanced")}
                  className={`py-1 rounded-[2px] font-semibold transition-colors whitespace-nowrap ${
                    uiMode === "advanced"
                      ? "bg-[#0B1120] dark:bg-[#F1F5F9] text-white dark:text-[#0B1120]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-white"
                  }`}
                >
                  Pro Studio
                </button>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Filter workspaces..."
                  aria-label="Filter workspaces"
                  className="w-full h-7 pl-7 pr-6 rounded-xs border border-[#CDD5E0] dark:border-[#232A3A] bg-white dark:bg-[#131721] text-[11px] text-[#0B1120] dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#E1392B]"
                />
                {navSearch && (
                  <button
                    type="button"
                    onClick={() => setNavSearch("")}
                    aria-label="Clear filter"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Scope toggle: Full Map vs Active Category Focus */}
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <span className="text-slate-500 font-medium">Navigator view</span>
                <div className="inline-flex items-center gap-2 font-semibold">
                  <button
                    type="button"
                    onClick={() => setScopeMode("all")}
                    className={
                      scopeMode === "all"
                        ? "text-[#E1392B]"
                        : "text-slate-500 hover:text-[#0B1120] dark:hover:text-slate-200"
                    }
                  >
                    All Map
                  </button>
                  <span className="text-slate-400" aria-hidden="true">/</span>
                  <button
                    type="button"
                    onClick={() => setScopeMode("group")}
                    className={
                      scopeMode === "group"
                        ? "text-[#E1392B]"
                        : "text-slate-500 hover:text-[#0B1120] dark:hover:text-slate-200"
                    }
                  >
                    Focus
                  </button>
                </div>
              </div>
            </div>

            {/* Mapped Category Tree */}
            <nav
              className="flex-1 overflow-y-auto px-2 py-2 space-y-3"
              aria-label="Workspace navigation"
            >
              {groupsToRender.map((grp) => {
                const grpItems = visibleItems.filter((item) => item.group === grp.id);
                if (grpItems.length === 0) return null;
                const isFolded = Boolean(collapsedGroups[grp.id]) && !navSearch.trim();
                return (
                  <div key={grp.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroupFold(grp.id)}
                      className="w-full px-1.5 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1 truncate">
                        {isFolded ? (
                          <ChevronRight className="w-3 h-3 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 shrink-0" />
                        )}
                        <span className="truncate">{grp.label}</span>
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-slate-400">
                        {grpItems.length}
                      </span>
                    </button>

                    {!isFolded && (
                      <div className="space-y-0.5">
                        {grpItems.map((item) => {
                          const Icon = item.icon;
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onSelectTab(item.id);
                                onCloseMobile();
                              }}
                              className={`w-full px-2 py-1.5 rounded-xs flex items-center justify-between gap-2 text-left transition-colors ${
                                active
                                  ? "bg-[#0B1120] dark:bg-[#1C2333] text-white dark:text-[#F8FAFC]"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-black/[0.045] dark:hover:bg-white/[0.04] hover:text-[#0B1120] dark:hover:text-white"
                              }`}
                            >
                              <span className="flex items-start gap-2 min-w-0">
                                <Icon
                                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                    active
                                      ? "text-[#E1392B]"
                                      : "text-slate-500 dark:text-slate-400"
                                  }`}
                                />
                                <span className="min-w-0">
                                  <span className="block text-xs font-semibold leading-tight truncate">
                                    {item.label}
                                  </span>
                                  {scopeMode === "group" && (
                                    <span
                                      className={`block text-[10px] leading-tight mt-0.5 truncate ${
                                        active
                                          ? "text-slate-300"
                                          : "text-slate-500 dark:text-slate-500"
                                      }`}
                                    >
                                      {item.hint}
                                    </span>
                                  )}
                                </span>
                              </span>

                              {item.alertCount !== undefined && (
                                <span className="font-mono text-[10px] font-bold tabular-nums text-[#E1392B] shrink-0">
                                  {item.alertCount}
                                </span>
                              )}
                              {item.alertCount === undefined && item.count !== undefined && (
                                <span
                                  className={`font-mono text-[10px] tabular-nums shrink-0 ${
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
                    )}
                  </div>
                );
              })}

              {visibleItems.length === 0 && (
                <div className="px-2 py-6 text-center text-[11px] text-slate-500">
                  No workspaces match "{navSearch}".
                </div>
              )}
            </nav>

            {/* Footer Fleet Summary */}
            <div className="px-3 py-2 border-t border-[#CDD5E0] dark:border-[#1F2533] bg-[#E3E8F0] dark:bg-[#090B10] flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400">
              <span>{channelCount} channels</span>
              <span aria-hidden="true">·</span>
              <span>{uiMode === "easy" ? "Simple" : "Pro"}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Dual-Rail Navigation */}
      <aside className="hidden lg:flex shrink-0">{renderDesktopRail(false)}</aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="h-full max-w-[90vw]">{renderDesktopRail(true)}</div>
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={onCloseMobile}
            className="flex-1 bg-black/55"
          />
        </div>
      )}
    </>
  );
}
