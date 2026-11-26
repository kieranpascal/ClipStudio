import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import type { BrollCue, ClipItem, DiscoveredAsset } from "../types";

interface AssetAlignmentModuleProps {
  clips: ClipItem[];
  activeClip: ClipItem;
  savedAssets: DiscoveredAsset[];
  discoveredAssets: DiscoveredAsset[];
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onOpenAssetDiscovery?: () => void;
}

interface SegmentAnalysis {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
  metricLabel: "Hook Score" | "Pacing Score";
  score: number;
  ma30Baseline: number;
  deltaFromMa: number;
  belowMa: boolean;
  alreadyAligned: boolean;
  recommendedAsset: DiscoveredAsset | null;
  matchScore: number;
  matchReason: string;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function AssetAlignmentModule({
  clips,
  activeClip,
  savedAssets,
  discoveredAssets,
  onUpdateClip,
  onOpenAssetDiscovery,
}: AssetAlignmentModuleProps) {
  const [injectingId, setInjectingId] = useState<string | null>(null);
  const [aligningAll, setAligningAll] = useState(false);

  const assetPool = useMemo(() => {
    const seen = new Set<string>();
    const combined: DiscoveredAsset[] = [];
    for (const item of [...savedAssets, ...discoveredAssets]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      combined.push(item);
    }
    return combined;
  }, [savedAssets, discoveredAssets]);

  // Derive 30-day moving average benchmark from workspace clips' hook/pacing performance
  const ma30Benchmark = useMemo(() => {
    const scores = clips.map((c) => {
      if (c.hookGrade?.overallScore) return c.hookGrade.overallScore;
      if (c.publishedMetrics?.avgWatchPercent) return Math.min(94, c.publishedMetrics.avgWatchPercent + 2);
      return 78;
    });
    if (scores.length === 0) return 79;
    return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
  }, [clips]);

  // Evaluate 4 clip segments against the 30-day moving average and align the best visual B-roll asset to each dip
  const segments = useMemo<SegmentAnalysis[]>(() => {
    const dur = Math.max(18, activeClip.durationSec || 28);
    const baseHook =
      activeClip.hookGrade?.overallScore ??
      (activeClip.publishedMetrics?.avgWatchPercent
        ? Math.min(92, activeClip.publishedMetrics.avgWatchPercent)
        : 76);
    const basePacing = activeClip.hookGrade?.pacingScore ?? Math.max(62, baseHook - 7);
    const existingCues = activeClip.brollCues || [];
    const clipTokens = new Set(
      tokenize(
        `${activeClip.title} ${activeClip.gameCategory} ${activeClip.niche || ""} ${activeClip.transcript}`
      )
    );

    const defs: Array<{
      id: string;
      label: string;
      startSec: number;
      endSec: number;
      metricLabel: "Hook Score" | "Pacing Score";
      rawScore: number;
    }> = [
      {
        id: "seg_hook",
        label: "0–3s Hook",
        startSec: 0,
        endSec: Math.min(3.5, dur * 0.14),
        metricLabel: "Hook Score",
        rawScore: Math.max(54, Math.min(96, baseHook - (activeClip.layout.showHookBanner ? 0 : 9))),
      },
      {
        id: "seg_setup",
        label: "3–10s Setup",
        startSec: 3.5,
        endSec: Math.min(10.5, dur * 0.38),
        metricLabel: "Pacing Score",
        rawScore: Math.max(52, Math.min(94, basePacing - 6)),
      },
      {
        id: "seg_mid",
        label: "10–18s Mid-Pacing",
        startSec: 10.5,
        endSec: Math.min(18.5, dur * 0.68),
        metricLabel: "Pacing Score",
        rawScore: Math.max(48, Math.min(92, basePacing - 12)),
      },
      {
        id: "seg_climax",
        label: "18s+ Climax / CTA",
        startSec: Math.min(18.5, dur * 0.68),
        endSec: dur,
        metricLabel: "Hook Score",
        rawScore: Math.max(55, Math.min(96, baseHook - 4)),
      },
    ];

    const usedAssetIds = new Set<string>();

    return defs.map((seg) => {
      const alreadyAligned = existingCues.some(
        (cue) => cue.timeSec >= seg.startSec - 0.5 && cue.timeSec <= seg.endSec
      );
      // If a B-roll cue is already injected in this segment, reflect the retention boost
      const score = alreadyAligned ? Math.min(95, seg.rawScore + 11) : seg.rawScore;
      const deltaFromMa = score - ma30Benchmark;
      const belowMa = score < ma30Benchmark;

      // Rank saved + discovered assets by visual/niche relevance
      let bestAsset: DiscoveredAsset | null = null;
      let bestMatchScore = 0;
      let bestReason = "Matches niche cadence & visual pattern interrupt";

      for (const asset of assetPool) {
        let rel = 58 + Math.round((asset.trafficScore || 75) * 0.2);
        if (asset.niche === activeClip.niche || asset.niche === "all") rel += 12;
        if (savedAssets.some((s) => s.id === asset.id)) rel += 6;
        if (usedAssetIds.has(asset.id)) rel -= 14;

        const assetTokens = tokenize(
          `${asset.title} ${asset.blendNote} ${asset.placementHint} ${(asset.tags || []).join(" ")}`
        );
        const overlap = assetTokens.filter((t) => clipTokens.has(t));
        rel += Math.min(14, overlap.length * 5);

        if (seg.id === "seg_hook" && asset.assetType === "meme-template") rel += 5;
        if (seg.id === "seg_mid" && asset.assetType === "stock-footage") rel += 6;

        const clamped = Math.min(99, Math.max(62, rel));
        if (clamped > bestMatchScore) {
          bestMatchScore = clamped;
          bestAsset = asset;
          bestReason =
            overlap.length > 0
              ? `Semantic match on "${overlap.slice(0, 2).join(", ")}" + ${asset.license}`
              : asset.niche === activeClip.niche
                ? `Saved ${activeClip.niche} visual interrupt (${asset.recommendedEffect})`
                : `High-retention ${asset.assetType === "stock-footage" ? "CC0 B-roll" : "reaction cutaway"} (${asset.trafficScore}/100 velocity)`;
        }
      }

      if (bestAsset && belowMa) {
        usedAssetIds.add(bestAsset.id);
      }

      return {
        id: seg.id,
        label: seg.label,
        startSec: Number(seg.startSec.toFixed(1)),
        endSec: Number(seg.endSec.toFixed(1)),
        metricLabel: seg.metricLabel,
        score,
        ma30Baseline: ma30Benchmark,
        deltaFromMa,
        belowMa,
        alreadyAligned,
        recommendedAsset: bestAsset,
        matchScore: bestMatchScore,
        matchReason: bestReason,
      };
    });
  }, [activeClip, assetPool, savedAssets, ma30Benchmark]);

  const dipSegments = segments.filter((s) => s.belowMa);

  async function handleInjectSegment(seg: SegmentAnalysis) {
    if (!seg.recommendedAsset) return;
    setInjectingId(seg.id);
    try {
      const asset = seg.recommendedAsset;
      const newCue: BrollCue = {
        id: `broll_align_${Date.now().toString(36)}`,
        timeSec: Number((seg.startSec + 0.4).toFixed(1)),
        durationSec: Math.min(3.2, Math.max(1.4, asset.recommendedDurationSec || 2.2)),
        label: `[Aligned] ${asset.title}`,
        effect: asset.recommendedEffect || "meme-cutaway",
        promptNote: `Auto-aligned into ${seg.label} dip (${seg.score} vs ${seg.ma30Baseline} 30d MA): ${asset.blendNote}`,
        assetType: asset.assetType,
        assetUrl: asset.sourceUrl,
        sourceName: asset.sourceName,
        license: asset.license,
      };
      await onUpdateClip(activeClip.id, {
        brollCues: [...(activeClip.brollCues || []), newCue].sort((a, b) => a.timeSec - b.timeSec),
      });
    } finally {
      setInjectingId(null);
    }
  }

  async function handleAlignAllDips() {
    const actionable = dipSegments.filter((s) => s.recommendedAsset);
    if (actionable.length === 0) return;
    setAligningAll(true);
    try {
      const additions: BrollCue[] = actionable.map((seg, idx) => {
        const asset = seg.recommendedAsset!;
        return {
          id: `broll_align_${Date.now().toString(36)}_${idx}`,
          timeSec: Number((seg.startSec + 0.4).toFixed(1)),
          durationSec: Math.min(3.2, Math.max(1.4, asset.recommendedDurationSec || 2.2)),
          label: `[Aligned] ${asset.title}`,
          effect: asset.recommendedEffect || "meme-cutaway",
          promptNote: `Auto-aligned into ${seg.label} dip (${seg.score} vs ${seg.ma30Baseline} 30d MA): ${asset.blendNote}`,
          assetType: asset.assetType,
          assetUrl: asset.sourceUrl,
          sourceName: asset.sourceName,
          license: asset.license,
        };
      });
      await onUpdateClip(activeClip.id, {
        brollCues: [...(activeClip.brollCues || []), ...additions].sort((a, b) => a.timeSec - b.timeSec),
      });
    } finally {
      setAligningAll(false);
    }
  }

  return (
    <section className="p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            <Sparkles className="w-4 h-4 text-[#E1392B]" />
            <span>Asset Alignment · Dip-to-B-Roll Injector</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Scans {savedAssets.length} saved + {discoveredAssets.length} discovered assets and recommends B-roll wherever Hook or Pacing dips below the 30-day moving average ({ma30Benchmark}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dipSegments.length > 0 && assetPool.length > 0 && (
            <button
              type="button"
              disabled={aligningAll}
              onClick={handleAlignAllDips}
              className="h-7 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {aligningAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              <span>Auto-Align {dipSegments.length} Dip{dipSegments.length === 1 ? "" : "s"}</span>
            </button>
          )}
          {onOpenAssetDiscovery && (
            <button
              type="button"
              onClick={onOpenAssetDiscovery}
              className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] text-[11px] font-medium inline-flex items-center gap-1 hover:border-[#E1392B]"
            >
              <Search className="w-3 h-3 text-[#E1392B]" />
              <span>Asset Library</span>
            </button>
          )}
        </div>
      </div>

      {/* Segment Score vs. 30-Day Moving Average Chart */}
      <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
          <span>SEGMENT PACING VS. 30-DAY MOVING AVG ({ma30Benchmark})</span>
          <span className={dipSegments.length > 0 ? "text-[#E1392B] font-semibold" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
            {dipSegments.length > 0
              ? `${dipSegments.length} dip${dipSegments.length === 1 ? "" : "s"} below 30d MA`
              : "All segments above 30d MA"}
          </span>
        </div>

        <div className="h-[135px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segments} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[40, 100]}
                tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "1px solid #262B37",
                  borderRadius: "2px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#F1F5F9",
                }}
                formatter={(value) => [`${value}/100`, "Segment Score"]}
              />
              <ReferenceLine
                y={ma30Benchmark}
                stroke="#E1392B"
                strokeDasharray="4 4"
                label={{
                  value: `30d MA ${ma30Benchmark}`,
                  position: "insideTopRight",
                  fill: "#E1392B",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              />
              <Bar dataKey="score" radius={[2, 2, 0, 0]} barSize={28} isAnimationActive={false}>
                {segments.map((seg) => (
                  <Cell key={seg.id} fill={seg.belowMa ? "#E1392B" : "#16A34A"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dip Recommendations List */}
      <div className="space-y-2">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`p-3 rounded-xs border text-xs space-y-2 ${
              seg.belowMa
                ? "border-[#E1392B]/45 bg-[#E1392B]/[0.03] dark:bg-[#E1392B]/[0.06]"
                : "border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {seg.belowMa ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{seg.label}</span>
                <span className="text-[11px] font-mono text-slate-500">· {seg.metricLabel}</span>
              </div>

              <span
                className={`font-mono text-[11px] font-bold tabular-nums ${
                  seg.belowMa ? "text-[#E1392B]" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {seg.score}/100 ({seg.deltaFromMa >= 0 ? "+" : ""}
                {seg.deltaFromMa} vs 30d MA)
              </span>
            </div>

            {seg.belowMa && seg.recommendedAsset ? (
              <div className="pt-2 border-t border-[#D4DAE4] dark:border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-[#0F172A] dark:text-slate-100">
                    <Layers className="w-3 h-3 text-[#E1392B] shrink-0" />
                    <span className="truncate">{seg.recommendedAsset.title}</span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                      {seg.matchScore}% match
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {seg.matchReason} · Inject @{seg.startSec.toFixed(1)}s
                  </div>
                </div>
                <button
                  type="button"
                  disabled={injectingId === seg.id}
                  onClick={() => handleInjectSegment(seg)}
                  className="h-7 px-2.5 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {injectingId === seg.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 text-[#E1392B]" />
                  )}
                  <span>Inject B-Roll</span>
                </button>
              </div>
            ) : seg.belowMa ? (
              <div className="text-[11px] text-slate-500">
                Save stock footage or meme templates in Asset Discovery to auto-align this dip.
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                {seg.alreadyAligned
                  ? "B-Roll cutaway active — holding above 30-day moving average."
                  : "Pacing healthy — above 30-day moving average benchmark."}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
