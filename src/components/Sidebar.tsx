import {
  Radar,
  Clapperboard,
  GitBranch,
  TrendingUp,
  Send,
  Layers,
  X,
} from "lucide-react";
import type { IntegrationStatus, WorkspaceTab } from "../types";

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  counts: {
    pendingQa: number;
    readyToPublish: number;
    publishedCount: number;
  };
  integrations: IntegrationStatus;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof Radar;
}> = [
  { id: "radar", label: "Clip Radar", icon: Radar },
  { id: "studio", label: "Vertical Studio", icon: Clapperboard },
  { id: "gitops", label: "GitOps & Pages", icon: GitBranch },
  { id: "revenue", label: "Revenue & Feedback", icon: TrendingUp },
  { id: "queue", label: "Publish Queue", icon: Send },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  counts,
  integrations,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const sidebarBody = (
    <aside className="w-[248px] h-full shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F131B] flex flex-col justify-between">
      <div>
        {/* Brand Wordmark */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-orange-600 text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
              ClipForge
            </span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Navigation */}
        <nav className="p-3 space-y-1" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const badgeNumber =
              item.id === "radar" && counts.pendingQa > 0
                ? counts.pendingQa
                : item.id === "queue" && counts.readyToPublish > 0
                  ? counts.readyToPublish
                  : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {badgeNumber !== null && (
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {badgeNumber}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quiet Deployment & Runtime Summary */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs">
        <div className="font-medium text-slate-700 dark:text-slate-300">Deployment Targets</div>
        <div className="space-y-1.5 text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span>Gemini QA</span>
            <span
              className={`font-medium ${
                integrations.geminiConfigured
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {integrations.geminiConfigured ? "Connected" : "Needs Key"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>GitHub Actions</span>
            <span
              className={`font-medium ${
                integrations.githubConfigured
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {integrations.githubConfigured ? "Synced" : "Export Ready"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Cloudflare Pages</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[115px]">
              {integrations.cloudflareProject || "clipforge"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block shrink-0">{sidebarBody}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="relative z-10">{sidebarBody}</div>
          <button
            type="button"
            aria-label="Dismiss navigation overlay"
            onClick={onCloseMobile}
            className="flex-1 bg-slate-950/60 backdrop-blur-xs"
          />
        </div>
      )}
    </>
  );
}
