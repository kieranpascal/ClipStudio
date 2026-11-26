import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  FlaskConical,
  Sparkles,
  Loader2,
  Trophy,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import type { ContentNiche, CtaPlacementType, FunnelTestSnapshot } from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface AbFunnelTestPanelProps {
  funnelTest?: FunnelTestSnapshot;
  isAnalyzingFunnel: boolean;
  isApplyingFunnelWinner: boolean;
  onAddFunnelVariant: (payload: {
    label: string;
    placement: CtaPlacementType;
    triggerSecond: number;
    ctaCopy: string;
    sponsorBrand: string;
    niche: ContentNiche;
    impressions: number;
    ctrPct: number;
    conversionRatePct: number;
    retentionImpactPct: number;
    avgDealValueUsd: number;
  }) => Promise<void>;
  onAnalyzeFunnel: (focusSponsor?: string) => Promise<void>;
  onApplyFunnelWinner: () => Promise<void>;
}

const PLACEMENT_LABELS: Record<CtaPlacementType, string> = {
  "pre-roll-hook-banner": "Pre-Roll Hook (0–3s)",
  "mid-roll-verbal-lower-third": "Mid-Roll Verbal + Lower-3rd",
  "pinned-comment-bio": "Pinned Comment + Bio",
  "end-card-offer-slate": "End-Card Offer Slate",
  "split-screen-callout": "Split-Screen Proof Callout",
};

const NICHE_OPTIONS: Array<{ id: ContentNiche; label: string }> = [
  { id: "tech-ai", label: "AI & Tech" },
  { id: "finance", label: "Finance" },
  { id: "faceless-doc", label: "Faceless Doc" },
  { id: "podcasts", label: "Podcasts" },
  { id: "gaming", label: "Gaming" },
  { id: "sports-irl", label: "Sports & IRL" },
];

export function AbFunnelTestPanel({
  funnelTest,
  isAnalyzingFunnel,
  isApplyingFunnelWinner,
  onAddFunnelVariant,
  onAnalyzeFunnel,
  onApplyFunnelWinner,
}: AbFunnelTestPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [focusSponsor, setFocusSponsor] = useState("");
  const [label, setLabel] = useState("");
  const [placement, setPlacement] = useState<CtaPlacementType>("mid-roll-verbal-lower-third");
  const [triggerSecond, setTriggerSecond] = useState(14);
  const [ctaCopy, setCtaCopy] = useState("Use code FORGE20 — free trial pinned in top comment");
  const [sponsorBrand, setSponsorBrand] = useState("Cloud SaaS Sponsor");
  const [niche, setNiche] = useState<ContentNiche>("tech-ai");
  const [impressions, setImpressions] = useState(180000);
  const [ctrPct, setCtrPct] = useState(3.4);
  const [conversionRatePct, setConversionRatePct] = useState(4.2);
  const [retentionImpactPct, setRetentionImpactPct] = useState(-1.2);
  const [avgDealValueUsd, setAvgDealValueUsd] = useState(48);
  const [submitting, setSubmitting] = useState(false);

  const variants = funnelTest?.variants || [];
  const winner = useMemo(
    () => variants.find((v) => v.isWinner || v.id === funnelTest?.winnerVariantId) || variants[0],
    [variants, funnelTest?.winnerVariantId]
  );

  const chartData = useMemo(
    () =>
      variants.map((v) => ({
        id: v.id,
        shortName: PLACEMENT_LABELS[v.placement] || v.label,
        conversionRatePct: v.conversionRatePct,
        ctrPct: v.ctrPct,
        revenuePer1kUsd: v.revenuePer1kUsd,
        retentionImpactPct: v.retentionImpactPct,
        isWinner: Boolean(v.isWinner),
      })),
    [variants]
  );

  async function handleSubmitVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    try {
      await onAddFunnelVariant({
        label: label.trim(),
        placement,
        triggerSecond,
        ctaCopy: ctaCopy.trim(),
        sponsorBrand: sponsorBrand.trim(),
        niche,
        impressions,
        ctrPct,
        conversionRatePct,
        retentionImpactPct,
        avgDealValueUsd,
      });
      setLabel("");
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#E1392B]" />
            <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              A/B Funnel Test · CTA Placement vs. Sponsorship Conversion
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare in-clip Call-to-Action timing &amp; placement against sponsorship conversion rate, CTR, retention impact, and revenue per 1K views.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={focusSponsor}
            onChange={(e) => setFocusSponsor(e.target.value)}
            placeholder="Optional sponsor / offer focus..."
            className="h-8 w-48 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-xs"
          />
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] hover:border-[#E1392B] font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log CTA Variant</span>
          </button>
          <button
            type="button"
            disabled={isAnalyzingFunnel}
            onClick={() => onAnalyzeFunnel(focusSponsor.trim() || undefined)}
            className="h-8 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isAnalyzingFunnel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isAnalyzingFunnel ? "Analyzing Funnel..." : "Analyze with Gemini"}</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Optional Add CTA Placement Variant Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmitVariant}
            className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E1392B]" />
                Log New CTA Placement Variant
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Variant Label</span>
                <input
                  required
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Variant F · 11s Lower-Third Offer"
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">CTA Placement Slot</span>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as CtaPlacementType)}
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  {(Object.keys(PLACEMENT_LABELS) as CtaPlacementType[]).map((key) => (
                    <option key={key} value={key}>
                      {PLACEMENT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Niche</span>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value as ContentNiche)}
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-slate-500 dark:text-slate-400">CTA Copy / Hook Line</span>
                <input
                  type="text"
                  value={ctaCopy}
                  onChange={(e) => setCtaCopy(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Sponsor Brand</span>
                <input
                  type="text"
                  value={sponsorBrand}
                  onChange={(e) => setSponsorBrand(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Trigger (s)</span>
                <input
                  type="number"
                  min={0}
                  max={58}
                  value={triggerSecond}
                  onChange={(e) => setTriggerSecond(Number(e.target.value) || 0)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Views</span>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={impressions}
                  onChange={(e) => setImpressions(Number(e.target.value) || 10000)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">CTR %</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.2}
                  max={15}
                  value={ctrPct}
                  onChange={(e) => setCtrPct(Number(e.target.value) || 1)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Sponsor Conv %</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.2}
                  max={25}
                  value={conversionRatePct}
                  onChange={(e) => setConversionRatePct(Number(e.target.value) || 1)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Hold Delta %</span>
                <input
                  type="number"
                  step={0.1}
                  min={-20}
                  max={10}
                  value={retentionImpactPct}
                  onChange={(e) => setRetentionImpactPct(Number(e.target.value) || 0)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400">CPA / Deal ($)</span>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={avgDealValueUsd}
                  onChange={(e) => setAvgDealValueUsd(Number(e.target.value) || 40)}
                  className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save CTA Variant to Test</span>
              </button>
            </div>
          </form>
        )}

        {/* Winner Callout Strip */}
        {funnelTest && winner && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A]">
            <div className="lg:col-span-8 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Trophy className="w-4 h-4 text-[#E1392B]" />
                <span className="font-display font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Winning Placement: {funnelTest.winnerLabel}
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{funnelTest.conversionLiftPct}% Conversion Lift
                </span>
                {funnelTest.appliedToPipelineAt && (
                  <span className="font-mono text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Baked into Brand Kit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {funnelTest.executiveSummary}
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Winning CTA Copy: <span className="text-[#0F172A] dark:text-[#F1F5F9] font-semibold">&ldquo;{funnelTest.recommendedCtaCopy}&rdquo;</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-2 border-t lg:border-t-0 lg:border-l border-[#D9DEE7] dark:border-[#252A36] pt-3 lg:pt-0 lg:pl-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Sponsor Conv. Rate</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                    {winner.conversionRatePct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Sponsor Rev / 1K</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${winner.revenuePer1kUsd.toFixed(2)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isApplyingFunnelWinner}
                onClick={onApplyFunnelWinner}
                className="h-8 w-full px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] hover:opacity-90 disabled:opacity-50 text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {isApplyingFunnelWinner ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                <span>Apply Winning CTA to Brand Kit &amp; Clips</span>
              </button>
            </div>
          </div>
        )}

        {/* Recharts Visualization: Sponsor Conversion Rate & Revenue/1K across CTA Placements */}
        {chartData.length > 0 && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252A36" strokeOpacity={0.25} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  interval={0}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickFormatter={(v) => `${v}%`}
                  width={44}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141720",
                    borderColor: "#252A36",
                    borderRadius: "2px",
                    fontSize: "12px",
                    color: "#F1F5F9",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar yAxisId="left" dataKey="conversionRatePct" name="Sponsor Conv. Rate %" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.isWinner ? "#E1392B" : "#475569"}
                    />
                  ))}
                </Bar>
                <Bar yAxisId="left" dataKey="ctrPct" name="CTA CTR %" fill="#2563EB" radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenuePer1kUsd"
                  name="Sponsor Rev / 1K ($)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-[#D9DEE7] dark:border-[#222631] rounded-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F7F9] dark:bg-[#111318] border-b border-[#D9DEE7] dark:border-[#222631] text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-medium">CTA Placement Variant</th>
                <th className="py-2.5 px-3 font-medium">Timing</th>
                <th className="py-2.5 px-3 font-medium text-right">Impressions</th>
                <th className="py-2.5 px-3 font-medium text-right">CTR</th>
                <th className="py-2.5 px-3 font-medium text-right">Sponsor Conv.</th>
                <th className="py-2.5 px-3 font-medium text-right">Watch Impact</th>
                <th className="py-2.5 px-3 font-medium text-right">Rev / 1K</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
              {variants.map((v) => (
                <tr
                  key={v.id}
                  className={
                    v.isWinner
                      ? "bg-[#E1392B]/[0.05] dark:bg-[#E1392B]/[0.08]"
                      : "hover:bg-slate-50 dark:hover:bg-[#171A21]"
                  }
                >
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                      {v.isWinner && <Trophy className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />}
                      <span>{v.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {v.sponsorBrand} · &ldquo;{v.ctaCopy}&rdquo;
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {v.triggerSecond}s
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-600 dark:text-slate-300">
                    {formatCompactNumber(v.impressions)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700 dark:text-slate-200">
                    {v.ctrPct.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    {v.conversionRatePct.toFixed(2)}%
                    <span className="block text-[10px] font-normal text-slate-500">
                      {v.sponsorConversions} deals
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 font-mono tabular-nums text-right font-medium ${
                      v.retentionImpactPct >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : v.retentionImpactPct > -3
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-[#E1392B]"
                    }`}
                  >
                    {v.retentionImpactPct > 0 ? `+${v.retentionImpactPct}%` : `${v.retentionImpactPct}%`}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${v.revenuePer1kUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tactical Insights */}
        {funnelTest && funnelTest.keyInsights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {funnelTest.keyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#F8F9FB] dark:bg-[#10131A] text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                <span className="font-mono text-[10px] text-[#E1392B] font-bold mr-1.5">
                  0{idx + 1}
                </span>
                {insight}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
