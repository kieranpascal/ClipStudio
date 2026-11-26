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
    <div className="px-5 py-3.5 border-b border-[#CDD5E0] dark:border-[#222938] bg-white dark:bg-[#12161F] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{section}</span>
          {metaItems.map((item, idx) => (
            <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span
                className={`font-mono tabular-nums ${
                  item.emphasis === "crimson"
                    ? "text-[#E1392B] font-semibold"
                    : item.emphasis === "emerald"
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#0B1120] dark:text-[#F8FAFC]">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-2xl">
            {subtitle}
          </p>
        </div>
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
    <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#DCE2EC] dark:border-[#232A3A]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span
            className={
              zone === "action"
                ? "text-[#E1392B] font-semibold"
                : "text-sky-600 dark:text-sky-400 font-semibold"
            }
          >
            {zone === "action" ? "Control Deck" : "Telemetry"}
          </span>
          {detail && (
            <>
              <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
                /
              </span>
              <span className="text-slate-500 dark:text-slate-400 truncate">{detail}</span>
            </>
          )}
        </div>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-[#0B1120] dark:text-[#F8FAFC] mt-0.5">
          {title}
        </h3>
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
  );
}

/** Pure SVG inline mini-sparkline for KPI telemetry wells and visual cards */
export function StudioMiniSparkline({
  data,
  tone = "default",
  width = 76,
  height = 24,
}: {
  data: number[];
  tone?: "default" | "emerald" | "crimson" | "amber";
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1e-6, max - min);
  const padY = 3;
  const usableH = height - padY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * stepX;
    const y = padY + usableH - ((val - min) / span) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const stroke =
    tone === "emerald"
      ? "#10B981"
      : tone === "crimson"
        ? "#E1392B"
        : tone === "amber"
          ? "#F59E0B"
          : "#64748B";

  const areaPath = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <path d={areaPath} fill={stroke} fillOpacity="0.14" />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

/** Pure SVG radial gauge dial for scores, retention, sentiment, and confidence */
export function StudioRadialGauge({
  value,
  max = 100,
  size = 44,
  strokeWidth = 4,
  tone = "default",
  suffix = "",
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  tone?: "default" | "emerald" | "crimson" | "amber";
  suffix?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
  const pct = max > 0 ? clamped / max : 0;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  const strokeColor =
    tone === "emerald"
      ? "#10B981"
      : tone === "crimson"
        ? "#E1392B"
        : tone === "amber"
          ? "#F59E0B"
          : "#38BDF8";

  return (
    <div className="inline-flex items-center gap-2 shrink-0">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-[#232A3A]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute font-mono text-[10px] font-bold tabular-nums text-[#0B1120] dark:text-[#F8FAFC]">
          {Math.round(clamped)}
          {suffix}
        </span>
      </div>
      {label && (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}

/** Tactile horizontal instrument meter bar with aligned tabular figure */
export function StudioMeterBar({
  label,
  value,
  max = 100,
  displayValue,
  tone = "default",
}: {
  label: string;
  value: number;
  max?: number;
  displayValue?: string;
  tone?: "default" | "emerald" | "crimson" | "amber" | "sky";
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const fillClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "crimson"
        ? "bg-[#E1392B]"
        : tone === "amber"
          ? "bg-amber-500"
          : tone === "sky"
            ? "bg-sky-500"
            : "bg-slate-600 dark:bg-slate-300";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 truncate">{label}</span>
        <span className="font-mono font-semibold tabular-nums text-[#0B1120] dark:text-[#F8FAFC] shrink-0">
          {displayValue ?? `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-[#DCE2EC] dark:bg-[#1E2432] overflow-hidden rounded-[1px]">
        <div
          className={`h-full ${fillClass} transition-[width] duration-200`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Segmented desktop view switcher (e.g., Cards | Board | Matrix | Table) */
export function StudioViewSwitcher<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ id: T; label: string; icon?: ReactNode; count?: number }>;
}) {
  return (
    <div
      className="inline-flex items-center p-0.5 rounded-xs bg-[#E2E7F0] dark:bg-[#0B0E14] border border-[#CDD5E0] dark:border-[#242B3B]"
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`h-7 px-2.5 rounded-[2px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              active
                ? "bg-white dark:bg-[#1B212E] text-[#0B1120] dark:text-[#F8FAFC] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-slate-200"
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  active ? "text-[#E1392B]" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Full-width desktop sub-page navigation ribbon */
export function StudioSubNavBar<T extends string>({
  value,
  onChange,
  tabs,
  rightSlot,
}: {
  value: T;
  onChange: (next: T) => void;
  tabs: Array<{ id: T; label: string; icon?: ReactNode; count?: number; accent?: boolean }>;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="px-5 border-b border-[#CDD5E0] dark:border-[#222938] bg-[#E8ECF3] dark:bg-[#0B0E14] flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative h-10 px-3 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? "text-[#0B1120] dark:text-[#F8FAFC] bg-white/70 dark:bg-[#141923]"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0B1120] dark:hover:text-slate-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    tab.accent || active ? "text-[#E1392B] font-bold" : "text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {active && (
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="flex items-center gap-2 py-1.5 shrink-0">{rightSlot}</div>}
    </div>
  );
}

export interface StudioKpiItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  tone?: "default" | "emerald" | "crimson" | "amber";
  sparkline?: number[];
  progressPct?: number;
  onClick?: () => void;
}

export function StudioKpiStrip({ items }: { items: StudioKpiItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-b border-[#CDD5E0] dark:border-[#222938] bg-[#EEF1F6] dark:bg-[#0B0E14] divide-y sm:divide-y-0 sm:divide-x divide-[#D6DDE8] dark:divide-[#1D2331]">
      {items.map((item) => {
        const valueClass =
          item.tone === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : item.tone === "crimson"
              ? "text-[#E1392B]"
              : item.tone === "amber"
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#0B1120] dark:text-[#F8FAFC]";

        const content = (
          <div className="px-5 py-3 text-left w-full flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                {item.label}
              </div>
              <div className={`font-mono text-xl font-bold tabular-nums leading-tight mt-1 ${valueClass}`}>
                {item.value}
              </div>
              <div className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400 mt-1 truncate">
                {item.subtext}
              </div>
            </div>
            {item.progressPct !== undefined ? (
              <StudioRadialGauge
                value={item.progressPct}
                size={42}
                strokeWidth={4}
                tone={item.tone || "emerald"}
                suffix="%"
              />
            ) : item.sparkline && item.sparkline.length >= 2 ? (
              <StudioMiniSparkline data={item.sparkline} tone={item.tone} />
            ) : null}
          </div>
        );

        if (item.onClick) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="text-left hover:bg-white/70 dark:hover:bg-[#141924] transition-colors focus-visible:outline-none"
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
