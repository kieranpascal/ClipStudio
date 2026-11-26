import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowUpRight, Flame, Bot } from "lucide-react";
import type { MonetizationPlan } from "../types";

interface SponsorHealthMonitorProps {
  monetizationPlan?: MonetizationPlan;
  onOpenFunnelTest: () => void;
  onAskAgent: (prompt: string) => Promise<void>;
}

interface CampaignHealthItem {
  id: string;
  brand: string;
  niche: string;
  spendUsd: number;
  ctrPct: number;
  conversions: number;
  revenueUsd: number;
  burnRateCtrPer100Usd: number;
  projectedRoiPct: number;
  avg30dRoiPct: number;
  roiDeltaVs30dPct: number;
  flagged: boolean;
}

export function SponsorHealthMonitor({
  monetizationPlan,
  onOpenFunnelTest,
  onAskAgent,
}: SponsorHealthMonitorProps) {
  // Interactive overrides so users can stress-test campaign burn rate and watch the -10% alert trigger live
  const [spendOverrides, setSpendOverrides] = useState<Record<string, number>>({});
  const [ctrOverrides, setCtrOverrides] = useState<Record<string, number>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const campaigns = useMemo<CampaignHealthItem[]>(() => {
    const rawDeals = (monetizationPlan?.sponsorPipeline || []).slice(0, 3);
    const seedFallback = [
      {
        id: "camp_1",
        brand: "NordVPN Creator Shield",
        niche: "AI & Tech",
        baseSpend: 620,
        baseCtr: 3.9,
        baseRevenue: 2140,
        avg30dRoi: 218,
      },
      {
        id: "camp_2",
        brand: "RunPod Cloud GPUs",
        niche: "Local AI",
        baseSpend: 840,
        baseCtr: 2.1,
        baseRevenue: 1860,
        avg30dRoi: 174,
      },
      {
        id: "camp_3",
        brand: "Mercury Fintech Vault",
        niche: "Finance",
        baseSpend: 510,
        baseCtr: 4.4,
        baseRevenue: 2290,
        avg30dRoi: 295,
      },
    ];

    const list =
      rawDeals.length >= 3
        ? rawDeals.map((d, idx) => ({
            id: d.id,
            brand: d.brand,
            niche: d.niche,
            baseSpend: Math.max(250, Math.round((d.estMonthlyUsd || 1200) * 0.34)),
            baseCtr: idx === 1 ? 1.9 : idx === 0 ? 3.8 : 4.2,
            baseRevenue: Math.max(400, d.estMonthlyUsd || 1400),
            avg30dRoi: idx === 1 ? 235 : idx === 0 ? 210 : 250,
          }))
        : seedFallback;

    return list.map((item) => {
      const spendUsd = spendOverrides[item.id] ?? item.baseSpend;
      const ctrPct = ctrOverrides[item.id] ?? item.baseCtr;
      // Scale projected revenue by CTR efficiency relative to baseline
      const ctrFactor = ctrPct / Math.max(0.5, item.baseCtr);
      const revenueUsd = Math.round(item.baseRevenue * ctrFactor);
      const conversions = Math.max(4, Math.round(revenueUsd / 46));
      // Burn Rate metric: CTR percentage points generated per $100 spent
      const burnRateCtrPer100Usd = Math.round((ctrPct / Math.max(1, spendUsd / 100)) * 100) / 100;
      const projectedRoiPct = Math.round(((revenueUsd - spendUsd) / Math.max(1, spendUsd)) * 100);
      // Compare projected ROI relative to 30-day average ROI
      const roiDeltaVs30dPct =
        item.avg30dRoi > 0
          ? Math.round(((projectedRoiPct - item.avg30dRoi) / item.avg30dRoi) * 1000) / 10
          : 0;

      return {
        id: item.id,
        brand: item.brand,
        niche: item.niche,
        spendUsd,
        ctrPct,
        conversions,
        revenueUsd,
        burnRateCtrPer100Usd,
        projectedRoiPct,
        avg30dRoiPct: item.avg30dRoi,
        roiDeltaVs30dPct,
        flagged: roiDeltaVs30dPct <= -10,
      };
    });
  }, [monetizationPlan?.sponsorPipeline, spendOverrides, ctrOverrides]);

  const flaggedCampaigns = campaigns.filter((c) => c.flagged);

  return (
    <section className="mx-5 mb-5 rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Sponsor Health Monitor</span>
            <span aria-hidden="true">·</span>
            <span>Top 3 Active Campaigns</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                flaggedCampaigns.length > 0
                  ? "font-semibold text-[#E1392B]"
                  : "font-medium text-emerald-600 dark:text-emerald-400"
              }
            >
              {flaggedCampaigns.length > 0
                ? `${flaggedCampaigns.length} Flagged (ROI < -10% vs 30d Avg)`
                : "All Campaigns Healthy"}
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Sponsor Health &amp; Burn Rate (CTR per Dollar Spent)
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenFunnelTest}
          className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F4F6F9] dark:bg-[#161922] hover:border-[#E1392B] text-xs font-medium text-[#0F172A] dark:text-slate-100 inline-flex items-center gap-1.5 self-start md:self-auto whitespace-nowrap"
        >
          <span>Open CTA Funnel Test</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Banner when any top-3 campaign drops > 10% below 30d average ROI */}
      {flaggedCampaigns.length > 0 && (
        <div className="p-3.5 rounded-xs border border-[#E1392B]/40 bg-[#E1392B]/[0.06] dark:bg-[#E1392B]/[0.11] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#E1392B] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Sponsor Burn-Rate Alert: {flaggedCampaigns.map((c) => c.brand).join(", ")} dropped below -10% vs. 30-day average ROI
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Move CTA placement to Mid-Roll Verbal + Lower-Third or swap to an email-capture bridge landing page to recover CTR per dollar spent.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={dispatchingId === "__all__"}
            onClick={async () => {
              setDispatchingId("__all__");
              try {
                const summary = flaggedCampaigns
                  .map(
                    (c) =>
                      `${c.brand} (Burn Rate ${c.burnRateCtrPer100Usd} CTR/$100, Projected ROI ${c.projectedRoiPct}% vs 30d avg ${c.avg30dRoiPct}%)`
                  )
                  .join("; ");
                await onAskAgent(
                  `Sponsor Health Alert triggered: ${summary}. Suggest immediate CTA re-hook and placement changes to restore >30d average ROI.`
                );
              } finally {
                setDispatchingId(null);
              }
            }}
            className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Fix with AI Director</span>
          </button>
        </div>
      )}

      {/* Top 3 Campaigns Table / Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className={`p-4 rounded-xs border space-y-3 ${
              camp.flagged
                ? "border-[#E1392B]/50 bg-[#E1392B]/[0.02] dark:bg-[#E1392B]/[0.05]"
                : "border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {camp.brand}
                </div>
                <div className="text-[11px] text-slate-500">
                  {camp.niche} · {camp.conversions} conv.
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold shrink-0 ${
                  camp.flagged
                    ? "text-[#E1392B]"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {camp.flagged ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ROI ALERT</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>NOMINAL</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D4DAE4] dark:border-[#1E222D] text-xs">
              <div>
                <div className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#E1392B]" />
                  <span>Burn Rate</span>
                </div>
                <div className="font-mono font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                  {camp.burnRateCtrPer100Usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">CTR / $100</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500">Proj. ROI</div>
                <div
                  className={`font-mono font-bold tabular-nums ${
                    camp.flagged ? "text-[#E1392B]" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {camp.projectedRoiPct}%
                </div>
                <div className="text-[10px] font-mono tabular-nums text-slate-500">
                  30d: {camp.avg30dRoiPct}%
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500">vs. 30d Avg</div>
                <div
                  className={`font-mono font-bold tabular-nums ${
                    camp.roiDeltaVs30dPct <= -10
                      ? "text-[#E1392B]"
                      : camp.roiDeltaVs30dPct >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {camp.roiDeltaVs30dPct >= 0 ? "+" : ""}
                  {camp.roiDeltaVs30dPct}%
                </div>
                <div className="text-[10px] font-mono tabular-nums text-slate-500">
                  ${camp.revenueUsd.toLocaleString()} rev
                </div>
              </div>
            </div>

            {/* Live Spend & CTR Stress-Test Sliders */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D4DAE4] dark:border-[#1E222D] text-[11px]">
              <label className="space-y-1">
                <div className="flex justify-between font-mono tabular-nums text-slate-500">
                  <span>Spend</span>
                  <span className="text-[#0F172A] dark:text-slate-200">${camp.spendUsd}</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={1800}
                  step={20}
                  value={camp.spendUsd}
                  onChange={(e) =>
                    setSpendOverrides((prev) => ({
                      ...prev,
                      [camp.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full nle-slider"
                />
              </label>

              <label className="space-y-1">
                <div className="flex justify-between font-mono tabular-nums text-slate-500">
                  <span>CTR</span>
                  <span className="text-[#0F172A] dark:text-slate-200">{camp.ctrPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={7.5}
                  step={0.1}
                  value={camp.ctrPct}
                  onChange={(e) =>
                    setCtrOverrides((prev) => ({
                      ...prev,
                      [camp.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full nle-slider"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
