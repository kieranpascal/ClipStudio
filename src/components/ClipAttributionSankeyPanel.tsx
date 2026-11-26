import { useMemo, useState } from "react";
import { Clapperboard, GitMerge, Filter } from "lucide-react";
import type {
  AffiliateOfferLink,
  ClipItem,
  EmailCaptureLandingPage,
  FunnelTestVariant,
  MonetizationPlan,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface ClipAttributionSankeyPanelProps {
  clips: ClipItem[];
  monetizationPlan?: MonetizationPlan;
  affiliateOffers?: AffiliateOfferLink[];
  emailLandingPages?: EmailCaptureLandingPage[];
  onOpenInStudio: (clipId: string) => void;
}

type FlowMetricMode = "revenue" | "conversions";

type ConversionEventId = "conv_sponsor" | "conv_affiliate" | "conv_email" | "conv_adshare";

interface ClipAttributionRow {
  clipId: string;
  title: string;
  shortTitle: string;
  niche: string;
  views: number;
  watchPct: number;
  ctaId: string;
  ctaLabel: string;
  ctaPlacement: string;
  ctaConvRatePct: number;
  adShareUsd: number;
  affiliateUsd: number;
  emailBridgeUsd: number;
  sponsorUsd: number;
  totalRevenueUsd: number;
  sponsorEvents: number;
  affiliateEvents: number;
  emailEvents: number;
  adShareEvents: number;
  totalEvents: number;
}

interface SankeyNodeLayout {
  id: string;
  column: 0 | 1 | 2;
  label: string;
  sublabel: string;
  value: number;
  color: string;
  x: number;
  y: number;
  height: number;
}

interface SankeyLinkLayout {
  id: string;
  sourceId: string;
  targetId: string;
  clipIds: string[];
  ctaId: string;
  eventId?: ConversionEventId;
  value: number;
  revenueUsd: number;
  conversions: number;
  color: string;
  path: string;
  strokeWidth: number;
  sourceLabel: string;
  targetLabel: string;
}

const FALLBACK_CTA_VARIANTS: Array<{
  id: string;
  label: string;
  placement: string;
  conversionRatePct: number;
  avgDealValueUsd: number;
}> = [
  {
    id: "cta_midroll",
    label: "Mid-Roll Verbal + Lower-Third",
    placement: "Mid-roll (12s)",
    conversionRatePct: 3.4,
    avgDealValueUsd: 54,
  },
  {
    id: "cta_pinned",
    label: "Pinned Comment + Bio Bridge",
    placement: "Pinned / Bio",
    conversionRatePct: 2.6,
    avgDealValueUsd: 38,
  },
  {
    id: "cta_preroll",
    label: "Pre-Roll Hook Banner",
    placement: "Intro (2s)",
    conversionRatePct: 1.9,
    avgDealValueUsd: 42,
  },
  {
    id: "cta_endcard",
    label: "End-Card Offer Slate",
    placement: "Outro (End)",
    conversionRatePct: 2.2,
    avgDealValueUsd: 46,
  },
];

const EVENT_DEFS: Array<{
  id: ConversionEventId;
  label: string;
  shortDesc: string;
  color: string;
}> = [
  {
    id: "conv_sponsor",
    label: "Sponsorship Deals",
    shortDesc: "CPA & brand integrations",
    color: "#16A34A",
  },
  {
    id: "conv_affiliate",
    label: "Affiliate Link Sales",
    shortDesc: "UTM tracked partner sales",
    color: "#2563EB",
  },
  {
    id: "conv_email",
    label: "Email Bridge Opt-Ins",
    shortDesc: "Lead magnet → partner rev",
    color: "#D97706",
  },
  {
    id: "conv_adshare",
    label: "Platform Ad-Share",
    shortDesc: "Shorts, Reels & TikTok RPM",
    color: "#64748B",
  },
];

const CTA_COLORS = ["#E1392B", "#2563EB", "#D97706", "#0891B2", "#7C3AED"];

function getClipViews(clip: ClipItem): number {
  const m = clip.publishedMetrics;
  if (m) {
    const sum =
      (m.tiktokViews || 0) +
      (m.reelsViews || 0) +
      (m.shortsViews || 0) +
      (m.xViews || 0) +
      (m.snapViews || 0) +
      (m.fbViews || 0);
    if (sum > 0) return sum;
  }
  return Math.max(clip.views || 0, 12500);
}

function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function ClipAttributionSankeyPanel({
  clips,
  monetizationPlan,
  affiliateOffers = [],
  emailLandingPages = [],
  onOpenInStudio,
}: ClipAttributionSankeyPanelProps) {
  const [selectedClipFilter, setSelectedClipFilter] = useState<string>("all");
  const [metricMode, setMetricMode] = useState<FlowMetricMode>("revenue");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  const ctaCatalog = useMemo(() => {
    const funnelVariants: FunnelTestVariant[] = monetizationPlan?.funnelTest?.variants || [];
    if (funnelVariants.length >= 2) {
      return funnelVariants.slice(0, 5).map((v) => ({
        id: v.id,
        label: v.label,
        placement: `${v.placement.replace(/-/g, " ")} (${v.triggerSecond}s)`,
        conversionRatePct: v.conversionRatePct || 2.2,
        avgDealValueUsd: Math.max(24, Math.round((v.revenuePer1kUsd || 6.5) * 8)),
      }));
    }
    return FALLBACK_CTA_VARIANTS;
  }, [monetizationPlan?.funnelTest?.variants]);

  const avgAffiliateEpc = useMemo(() => {
    if (affiliateOffers.length === 0) return 1.85;
    return (
      affiliateOffers.reduce((sum, o) => sum + o.estEpcUsd, 0) / affiliateOffers.length
    );
  }, [affiliateOffers]);

  const avgEmailOptInRate = useMemo(() => {
    const totalVis = emailLandingPages.reduce((s, p) => s + p.visitors30d, 0);
    const totalSubs = emailLandingPages.reduce((s, p) => s + p.subscribers30d, 0);
    if (totalVis <= 0) return 0.34;
    return Math.max(0.12, Math.min(0.65, totalSubs / totalVis));
  }, [emailLandingPages]);

  // Build deterministic per-clip attribution rows combining views, CTA variant, and 4 conversion events
  const allRows = useMemo<ClipAttributionRow[]>(() => {
    const sortedClips = [...clips]
      .sort((a, b) => getClipViews(b) - getClipViews(a))
      .slice(0, 6);

    return sortedClips.map((clip, idx) => {
      const views = getClipViews(clip);
      const watchPct = clip.publishedMetrics?.avgWatchPercent || 78;
      const niche = clip.niche || "gaming";
      const cta = ctaCatalog[idx % ctaCatalog.length];

      const rpmMap: Record<string, number> = {
        finance: 4.1,
        "tech-ai": 3.4,
        "faceless-doc": 2.6,
        podcasts: 2.3,
        "sports-irl": 1.4,
        gaming: 0.95,
      };
      const rpm = rpmMap[niche] ?? 1.85;
      const watchMultiplier = Math.max(0.75, Math.min(1.35, watchPct / 76));

      const adShareUsd = Math.max(18, Math.round((views / 1000) * rpm));
      const ctaClicks = Math.max(
        18,
        Math.round((views / 1000) * (cta.conversionRatePct * 3.4) * watchMultiplier)
      );
      const sponsorEvents = Math.max(2, Math.round(ctaClicks * (cta.conversionRatePct / 100) * 1.1));
      const sponsorUsd = Math.round(sponsorEvents * cta.avgDealValueUsd);

      const affiliateEvents = Math.max(3, Math.round(ctaClicks * 0.085));
      const affiliateUsd = Math.round(affiliateEvents * (avgAffiliateEpc * 14));

      const emailEvents = Math.max(6, Math.round(ctaClicks * avgEmailOptInRate * 0.45));
      const emailBridgeUsd = Math.round(emailEvents * 4.8);

      const adShareEvents = Math.max(10, Math.round(views / 1000));
      const totalRevenueUsd = adShareUsd + sponsorUsd + affiliateUsd + emailBridgeUsd;
      const totalEvents = sponsorEvents + affiliateEvents + emailEvents + adShareEvents;

      return {
        clipId: clip.id,
        title: clip.title,
        shortTitle: truncateLabel(clip.title, 26),
        niche,
        views,
        watchPct,
        ctaId: cta.id,
        ctaLabel: cta.label,
        ctaPlacement: cta.placement,
        ctaConvRatePct: cta.conversionRatePct,
        adShareUsd,
        affiliateUsd,
        emailBridgeUsd,
        sponsorUsd,
        totalRevenueUsd,
        sponsorEvents,
        affiliateEvents,
        emailEvents,
        adShareEvents,
        totalEvents,
      };
    });
  }, [clips, ctaCatalog, avgAffiliateEpc, avgEmailOptInRate]);

  const activeRows = useMemo(() => {
    if (selectedClipFilter === "all") return allRows;
    return allRows.filter((r) => r.clipId === selectedClipFilter);
  }, [allRows, selectedClipFilter]);

  const totals = useMemo(() => {
    return activeRows.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.totalRevenueUsd,
        sponsor: acc.sponsor + r.sponsorUsd,
        affiliate: acc.affiliate + r.affiliateUsd,
        email: acc.email + r.emailBridgeUsd,
        adShare: acc.adShare + r.adShareUsd,
        events: acc.events + r.totalEvents,
      }),
      { revenue: 0, sponsor: 0, affiliate: 0, email: 0, adShare: 0, events: 0 }
    );
  }, [activeRows]);

  // Compute deterministic 3-column Sankey layout (SVG 960x380 viewBox)
  const sankey = useMemo(() => {
    const svgW = 960;
    const svgH = 380;
    const topPad = 36;
    const bottomPad = 20;
    const usableH = svgH - topPad - bottomPad;
    const nodeW = 14;
    const colX: [number, number, number] = [196, 472, 748];

    const metricVal = (rev: number, conv: number) =>
      metricMode === "revenue" ? Math.max(1, rev) : Math.max(1, conv);

    // Column 0: Clips
    const clipItems = activeRows.map((row, idx) => ({
      id: `clip_${row.clipId}`,
      rawClipId: row.clipId,
      label: row.shortTitle,
      sublabel:
        metricMode === "revenue"
          ? `$${row.totalRevenueUsd.toLocaleString()}`
          : `${row.totalEvents.toLocaleString()} events`,
      value: metricVal(row.totalRevenueUsd, row.totalEvents),
      color: idx === 0 ? "#E1392B" : "#475569",
    }));

    // Column 1: CTA Variants (aggregated across active rows)
    const ctaMap = new Map<
      string,
      {
        id: string;
        label: string;
        sublabel: string;
        value: number;
        revenueUsd: number;
        conversions: number;
        clipIds: string[];
        color: string;
      }
    >();
    activeRows.forEach((row) => {
      const prev = ctaMap.get(row.ctaId);
      const val = metricVal(row.totalRevenueUsd, row.totalEvents);
      if (prev) {
        prev.value += val;
        prev.revenueUsd += row.totalRevenueUsd;
        prev.conversions += row.totalEvents;
        prev.clipIds.push(row.clipId);
      } else {
        const colorIdx = ctaCatalog.findIndex((c) => c.id === row.ctaId);
        ctaMap.set(row.ctaId, {
          id: `cta_${row.ctaId}`,
          label: truncateLabel(row.ctaLabel, 24),
          sublabel: `${row.ctaConvRatePct.toFixed(1)}% conv`,
          value: val,
          revenueUsd: row.totalRevenueUsd,
          conversions: row.totalEvents,
          clipIds: [row.clipId],
          color: CTA_COLORS[Math.max(0, colorIdx) % CTA_COLORS.length],
        });
      }
    });
    const ctaItems = Array.from(ctaMap.values());

    // Column 2: Final Conversion Events
    const eventItems = EVENT_DEFS.map((ev) => {
      const rev = activeRows.reduce((s, r) => {
        if (ev.id === "conv_sponsor") return s + r.sponsorUsd;
        if (ev.id === "conv_affiliate") return s + r.affiliateUsd;
        if (ev.id === "conv_email") return s + r.emailBridgeUsd;
        return s + r.adShareUsd;
      }, 0);
      const conv = activeRows.reduce((s, r) => {
        if (ev.id === "conv_sponsor") return s + r.sponsorEvents;
        if (ev.id === "conv_affiliate") return s + r.affiliateEvents;
        if (ev.id === "conv_email") return s + r.emailEvents;
        return s + r.adShareEvents;
      }, 0);
      return {
        id: ev.id,
        label: ev.label,
        sublabel:
          metricMode === "revenue"
            ? `$${rev.toLocaleString()}`
            : `${conv.toLocaleString()} events`,
        value: metricVal(rev, conv),
        color: ev.color,
      };
    });

    function layoutColumn<T extends { id: string; label: string; sublabel: string; value: number; color: string }>(
      items: T[],
      column: 0 | 1 | 2
    ): SankeyNodeLayout[] {
      if (items.length === 0) return [];
      const gap = items.length > 4 ? 10 : 14;
      const totalGap = gap * Math.max(0, items.length - 1);
      const availableH = Math.max(80, usableH - totalGap);
      const totalVal = items.reduce((s, it) => s + it.value, 0) || 1;

      const rawHeights = items.map((it) => Math.max(22, (it.value / totalVal) * availableH));
      const rawSum = rawHeights.reduce((s, h) => s + h, 0);
      const scale = rawSum > availableH ? availableH / rawSum : 1;

      let cursorY = topPad + Math.max(0, (availableH - rawSum * scale) / 2);
      return items.map((it, idx) => {
        const h = Math.max(18, rawHeights[idx] * scale);
        const node: SankeyNodeLayout = {
          id: it.id,
          column,
          label: it.label,
          sublabel: it.sublabel,
          value: it.value,
          color: it.color,
          x: colX[column],
          y: cursorY,
          height: h,
        };
        cursorY += h + gap;
        return node;
      });
    }

    const col0Nodes = layoutColumn(clipItems, 0);
    const col1Nodes = layoutColumn(ctaItems, 1);
    const col2Nodes = layoutColumn(eventItems, 2);
    const allNodes = [...col0Nodes, ...col1Nodes, ...col2Nodes];
    const nodeById = new Map(allNodes.map((n) => [n.id, n]));

    // Track cumulative vertical offsets on source (right edge) and target (left edge)
    const outOffset = new Map<string, number>();
    const inOffset = new Map<string, number>();
    allNodes.forEach((n) => {
      outOffset.set(n.id, n.y);
      inOffset.set(n.id, n.y);
    });

    const links: SankeyLinkLayout[] = [];

    function makeRibbonPath(x0: number, y0: number, x1: number, y1: number): string {
      const mx = (x0 + x1) / 2;
      return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }

    // Links Stage 1: Clip -> CTA Variant
    activeRows.forEach((row) => {
      const srcId = `clip_${row.clipId}`;
      const tgtId = `cta_${row.ctaId}`;
      const src = nodeById.get(srcId);
      const tgt = nodeById.get(tgtId);
      if (!src || !tgt) return;

      const val = metricVal(row.totalRevenueUsd, row.totalEvents);
      const srcH = Math.max(3, (val / Math.max(1, src.value)) * src.height);
      const tgtH = Math.max(3, (val / Math.max(1, tgt.value)) * tgt.height);
      const strokeW = Math.max(3, Math.min(srcH, tgtH) * 0.88);

      const sy = (outOffset.get(srcId) || src.y) + srcH / 2;
      const ty = (inOffset.get(tgtId) || tgt.y) + tgtH / 2;
      outOffset.set(srcId, (outOffset.get(srcId) || src.y) + srcH);
      inOffset.set(tgtId, (inOffset.get(tgtId) || tgt.y) + tgtH);

      links.push({
        id: `link_${srcId}_${tgtId}`,
        sourceId: srcId,
        targetId: tgtId,
        clipIds: [row.clipId],
        ctaId: row.ctaId,
        value: val,
        revenueUsd: row.totalRevenueUsd,
        conversions: row.totalEvents,
        color: tgt.color,
        path: makeRibbonPath(src.x + nodeW, sy, tgt.x, ty),
        strokeWidth: strokeW,
        sourceLabel: row.title,
        targetLabel: row.ctaLabel,
      });
    });

    // Links Stage 2: CTA Variant -> Final Conversion Event
    ctaItems.forEach((cta) => {
      const srcId = cta.id;
      const src = nodeById.get(srcId);
      if (!src) return;
      const rawCtaId = srcId.replace(/^cta_/, "");
      const ctaRows = activeRows.filter((r) => r.ctaId === rawCtaId);

      EVENT_DEFS.forEach((ev) => {
        const tgt = nodeById.get(ev.id);
        if (!tgt) return;

        const rev = ctaRows.reduce((s, r) => {
          if (ev.id === "conv_sponsor") return s + r.sponsorUsd;
          if (ev.id === "conv_affiliate") return s + r.affiliateUsd;
          if (ev.id === "conv_email") return s + r.emailBridgeUsd;
          return s + r.adShareUsd;
        }, 0);
        const conv = ctaRows.reduce((s, r) => {
          if (ev.id === "conv_sponsor") return s + r.sponsorEvents;
          if (ev.id === "conv_affiliate") return s + r.affiliateEvents;
          if (ev.id === "conv_email") return s + r.emailEvents;
          return s + r.adShareEvents;
        }, 0);
        const val = metricVal(rev, conv);
        if (val <= 0) return;

        const srcH = Math.max(2.5, (val / Math.max(1, src.value)) * src.height);
        const tgtH = Math.max(2.5, (val / Math.max(1, tgt.value)) * tgt.height);
        const strokeW = Math.max(2.5, Math.min(srcH, tgtH) * 0.85);

        const sy = (outOffset.get(srcId) || src.y) + srcH / 2;
        const ty = (inOffset.get(ev.id) || tgt.y) + tgtH / 2;
        outOffset.set(srcId, (outOffset.get(srcId) || src.y) + srcH);
        inOffset.set(ev.id, (inOffset.get(ev.id) || tgt.y) + tgtH);

        links.push({
          id: `link_${srcId}_${ev.id}`,
          sourceId: srcId,
          targetId: ev.id,
          clipIds: cta.clipIds,
          ctaId: rawCtaId,
          eventId: ev.id,
          value: val,
          revenueUsd: rev,
          conversions: conv,
          color: ev.color,
          path: makeRibbonPath(src.x + nodeW, sy, tgt.x, ty),
          strokeWidth: strokeW,
          sourceLabel: cta.label,
          targetLabel: ev.label,
        });
      });
    });

    return { svgW, svgH, nodeW, colX, nodes: allNodes, links };
  }, [activeRows, ctaCatalog, metricMode]);

  const focusedLink = useMemo(
    () => sankey.links.find((l) => l.id === hoveredLinkId) || null,
    [sankey.links, hoveredLinkId]
  );

  const focusedNode = useMemo(
    () => sankey.nodes.find((n) => n.id === hoveredNodeId) || null,
    [sankey.nodes, hoveredNodeId]
  );

  function isLinkHighlighted(link: SankeyLinkLayout): boolean {
    if (!hoveredNodeId && !hoveredLinkId) return true;
    if (hoveredLinkId) return link.id === hoveredLinkId;
    if (!hoveredNodeId) return true;
    return link.sourceId === hoveredNodeId || link.targetId === hoveredNodeId;
  }

  return (
    <section className="mx-5 mb-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-5">
      {/* Header + Interactive Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Performance Monitor</span>
            <span aria-hidden="true">/</span>
            <span>Sankey Conversion Flow</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {activeRows.length} clip{activeRows.length === 1 ? "" : "s"} traced
            </span>
          </div>
          <h3 className="font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-[#E1392B]" />
            <span>Clip Revenue Attribution Panel — CTA Variant to Conversion Sankey</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Breaks down exact revenue sources per clip and visualizes how each CTA placement routes viewer intent into Sponsorship Deals, Affiliate Sales, Email Bridge Opt-Ins, and Ad-Share.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClipFilter}
              onChange={(e) => setSelectedClipFilter(e.target.value)}
              aria-label="Filter Sankey by clip"
              className="bg-transparent text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none max-w-[200px]"
            >
              <option value="all">All Top Clips ({allRows.length})</option>
              {allRows.map((row) => (
                <option key={row.clipId} value={row.clipId}>
                  {row.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex p-0.5 rounded-xs bg-[#ECEFF4] dark:bg-[#151821] border border-[#D4DAE4] dark:border-[#232836]">
            {(
              [
                { id: "revenue", label: "Revenue ($)" },
                { id: "conversions", label: "Conversion Events" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMetricMode(opt.id)}
                className={`h-7 px-2.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
                  metricMode === opt.id
                    ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Column Attribution Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#222631] bg-[#F8FAFC] dark:bg-[#0D0F14]">
          <div className="text-xs text-slate-500">Total Attributed Revenue</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
            ${totals.revenue.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500">
            {totals.events.toLocaleString()} conversion events
          </div>
        </div>
        <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#222631] bg-[#F8FAFC] dark:bg-[#0D0F14]">
          <div className="text-xs text-slate-500">Sponsorship Conversions</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            ${totals.sponsor.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500">
            {totals.revenue > 0 ? Math.round((totals.sponsor / totals.revenue) * 100) : 0}% of total
          </div>
        </div>
        <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#222631] bg-[#F8FAFC] dark:bg-[#0D0F14]">
          <div className="text-xs text-slate-500">Affiliate + Email Bridge</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-sky-600 dark:text-sky-400">
            ${(totals.affiliate + totals.email).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500">
            ${totals.affiliate.toLocaleString()} aff · ${totals.email.toLocaleString()} email
          </div>
        </div>
        <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#222631] bg-[#F8FAFC] dark:bg-[#0D0F14]">
          <div className="text-xs text-slate-500">Platform Ad-Share</div>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">
            ${totals.adShare.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500">
            {totals.revenue > 0 ? Math.round((totals.adShare / totals.revenue) * 100) : 0}% baseline RPM
          </div>
        </div>
      </div>

      {/* Interactive Sankey Diagram */}
      <div className="rounded-xs border border-[#D4DAE4] dark:border-[#222631] bg-[#F8FAFC] dark:bg-[#0D0F14] p-4 space-y-3">
        {/* Live Focused Flow Inspector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E2E7F0] dark:border-[#1E222D] text-xs">
          <div className="font-mono text-[11px] text-slate-500">
            {focusedLink ? (
              <span>
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {focusedLink.sourceLabel}
                </span>
                {" → "}
                <span className="font-semibold text-[#E1392B]">{focusedLink.targetLabel}</span>
                {" · "}
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                  ${focusedLink.revenueUsd.toLocaleString()}
                </span>
                {" · "}
                <span className="tabular-nums">{focusedLink.conversions.toLocaleString()} events</span>
              </span>
            ) : focusedNode ? (
              <span>
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {focusedNode.label}
                </span>
                {" · "}
                <span className="tabular-nums text-[#E1392B] font-semibold">
                  {focusedNode.sublabel}
                </span>
              </span>
            ) : (
              <span>
                Hover any clip, CTA variant, or ribbon to isolate attribution flow · Click a clip row below to filter
              </span>
            )}
          </div>

          {selectedClipFilter !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedClipFilter("all")}
              className="font-mono text-[11px] text-[#E1392B] hover:underline"
            >
              Reset Clip Filter
            </button>
          )}
        </div>

        {activeRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No clips available to map attribution flows. Add or publish clips to visualize CTA-to-conversion paths.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${sankey.svgW} ${sankey.svgH}`}
              className="w-full min-w-[740px] h-auto select-none"
              role="img"
              aria-label="Sankey diagram linking source clips to CTA variants and final conversion events"
            >
              {/* Column Headers */}
              <text
                x={sankey.colX[0] + sankey.nodeW}
                y={18}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[11px] font-semibold"
              >
                1. Source Clips
              </text>
              <text
                x={sankey.colX[1] + sankey.nodeW / 2}
                y={18}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[11px] font-semibold"
              >
                2. CTA Variants
              </text>
              <text
                x={sankey.colX[2]}
                y={18}
                textAnchor="start"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[11px] font-semibold"
              >
                3. Conversion Events
              </text>

              {/* Connecting Bezier Ribbons */}
              <g>
                {sankey.links.map((link) => {
                  const active = isLinkHighlighted(link);
                  return (
                    <path
                      key={link.id}
                      d={link.path}
                      fill="none"
                      stroke={link.color}
                      strokeWidth={link.strokeWidth}
                      strokeOpacity={active ? (hoveredLinkId === link.id ? 0.72 : 0.36) : 0.08}
                      className="transition-opacity duration-150 cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredLinkId(link.id);
                        setHoveredNodeId(null);
                      }}
                      onMouseLeave={() => setHoveredLinkId(null)}
                    />
                  );
                })}
              </g>

              {/* Nodes & Clean Labels */}
              <g>
                {sankey.nodes.map((node) => {
                  const isDimmed =
                    hoveredNodeId !== null &&
                    hoveredNodeId !== node.id &&
                    !sankey.links.some(
                      (l) =>
                        (l.sourceId === hoveredNodeId && l.targetId === node.id) ||
                        (l.targetId === hoveredNodeId && l.sourceId === node.id)
                    );

                  const midY = node.y + node.height / 2;

                  return (
                    <g
                      key={node.id}
                      opacity={isDimmed ? 0.3 : 1}
                      className="transition-opacity duration-150 cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredNodeId(node.id);
                        setHoveredLinkId(null);
                      }}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => {
                        if (node.column === 0) {
                          const rawId = node.id.replace(/^clip_/, "");
                          setSelectedClipFilter((prev) => (prev === rawId ? "all" : rawId));
                        }
                      }}
                    >
                      <rect
                        x={node.x}
                        y={node.y}
                        width={sankey.nodeW}
                        height={node.height}
                        rx={1.5}
                        fill={node.color}
                      />

                      {node.column === 0 && (
                        <>
                          <text
                            x={node.x - 10}
                            y={midY - 3}
                            textAnchor="end"
                            className="fill-[#0F172A] dark:fill-[#F1F5F9] text-[11px] font-semibold"
                          >
                            {node.label}
                          </text>
                          <text
                            x={node.x - 10}
                            y={midY + 10}
                            textAnchor="end"
                            className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px]"
                          >
                            {node.sublabel}
                          </text>
                        </>
                      )}

                      {node.column === 1 && (
                        <>
                          <text
                            x={node.x + sankey.nodeW / 2}
                            y={node.y - 4}
                            textAnchor="middle"
                            className="fill-[#0F172A] dark:fill-[#F1F5F9] text-[10.5px] font-semibold"
                          >
                            {node.label} ({node.sublabel})
                          </text>
                        </>
                      )}

                      {node.column === 2 && (
                        <>
                          <text
                            x={node.x + sankey.nodeW + 10}
                            y={midY - 3}
                            textAnchor="start"
                            className="fill-[#0F172A] dark:fill-[#F1F5F9] text-[11px] font-semibold"
                          >
                            {node.label}
                          </text>
                          <text
                            x={node.x + sankey.nodeW + 10}
                            y={midY + 10}
                            textAnchor="start"
                            className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px]"
                          >
                            {node.sublabel}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Per-Clip Revenue Sources & CTA Breakdown Ledger */}
      <div className="overflow-x-auto border border-[#D4DAE4] dark:border-[#222631] rounded-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F8FAFC] dark:bg-[#0D0F14] border-b border-[#D4DAE4] dark:border-[#222631] font-mono text-[10px] text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Clip</th>
              <th className="px-3 py-2.5 font-medium">Assigned CTA Variant</th>
              <th className="px-3 py-2.5 text-right font-medium">Sponsorships</th>
              <th className="px-3 py-2.5 text-right font-medium">Affiliates</th>
              <th className="px-3 py-2.5 text-right font-medium">Email Bridge</th>
              <th className="px-3 py-2.5 text-right font-medium">Ad-Share</th>
              <th className="px-3 py-2.5 text-right font-medium">Total Revenue</th>
              <th className="px-3 py-2.5 text-right font-medium w-24">Studio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
            {allRows.map((row) => {
              const isSelected = selectedClipFilter === row.clipId;
              return (
                <tr
                  key={row.clipId}
                  onClick={() =>
                    setSelectedClipFilter((prev) => (prev === row.clipId ? "all" : row.clipId))
                  }
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#E1392B]/8 dark:bg-[#E1392B]/12"
                      : "hover:bg-[#F8FAFC] dark:hover:bg-[#151822]"
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[220px]">
                      {row.title}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {formatCompactNumber(row.views)} views · {row.watchPct}% hold
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-[#0F172A] dark:text-slate-200 truncate max-w-[190px]">
                      {row.ctaLabel}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {row.ctaPlacement} · {row.ctaConvRatePct.toFixed(1)}% conv
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${row.sponsorUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    ${row.affiliateUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    ${row.emailBridgeUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    ${row.adShareUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    ${row.totalRevenueUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInStudio(row.clipId);
                      }}
                      className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#2A303E] hover:border-[#E1392B] hover:text-[#E1392B] text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Clapperboard className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
