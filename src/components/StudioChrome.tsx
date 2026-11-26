import type { ReactNode } from "react";

interface StudioPageHeaderProps {
  section: string;
  title: string;
  subtitle: string;
  metaItems?: Array<{ label: string; emphasis?: "crimson" | "emerald" | "default" }>;
  actions?: ReactNode;
}

export function StudioPageHeader({
  section,
  title,
  subtitle,
  metaItems = [],
  actions,
}: StudioPageHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">{section}</span>
          {metaItems.map((item, idx) => (
            <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
              <span aria-hidden="true">·</span>
              <span
                className={`font-mono tabular-nums ${
                  item.emphasis === "crimson"
                    ? "text-[#E1392B] font-semibold"
                    : item.emphasis === "emerald"
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : ""
                }`}
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

interface StudioSectionHeaderProps {
  zone: "action" | "telemetry";
  title: string;
  detail?: string;
  rightSlot?: ReactNode;
}

export function StudioSectionHeader({
  zone,
  title,
  detail,
  rightSlot,
}: StudioSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E7F0] dark:border-[#1E222D]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span
            className={
              zone === "action"
                ? "text-[#E1392B] font-semibold"
                : "text-slate-500 dark:text-slate-400 font-medium"
            }
          >
            {zone === "action" ? "Action Queue" : "Telemetry"}
          </span>
          {detail && (
            <>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-500 dark:text-slate-400 truncate">{detail}</span>
            </>
          )}
        </div>
        <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
          {title}
        </h3>
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
  );
}

export interface StudioKpiItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  tone?: "default" | "emerald" | "crimson" | "amber";
  onClick?: () => void;
}

export function StudioKpiStrip({ items }: { items: StudioKpiItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] divide-y sm:divide-y-0 sm:divide-x divide-[#E2E7F0] dark:divide-[#1E222D]">
      {items.map((item) => {
        const valueClass =
          item.tone === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : item.tone === "crimson"
              ? "text-[#E1392B]"
              : item.tone === "amber"
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#0F172A] dark:text-[#F8FAFC]";

        const content = (
          <div className="px-5 py-3.5 text-left w-full">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </div>
            <div className={`font-mono text-xl font-bold tabular-nums mt-1 ${valueClass}`}>
              {item.value}
            </div>
            <div className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400 mt-1 truncate">
              {item.subtext}
            </div>
          </div>
        );

        if (item.onClick) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="text-left hover:bg-[#F4F6F9] dark:hover:bg-[#161922] transition-colors focus-visible:outline-none"
            >
              {content}
            </button>
          );
        }
        return <div key={item.id}>{content}</div>;
      })}
    </div>
  );
}
