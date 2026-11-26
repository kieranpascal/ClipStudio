import { useMemo, useState } from "react";
import {
  Sparkles,
  Loader2,
  Volume2,
  Plus,
  Check,
  Clapperboard,
  Layers,
  Trash2,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Smartphone,
  Wand2,
  ExternalLink,
  Search,
} from "lucide-react";
import type {
  BrandKitPreset,
  CaptionFontFamily,
  CaptionStylePreset,
  ClipItem,
  DiscoveredAsset,
  HookBannerPosition,
  LayoutTemplate,
  PipelineConfig,
  SfxKind,
} from "../types";
import { previewSfxSound } from "../utils/ffmpeg";

interface TemplatesBrollDeckProps {
  clips: ClipItem[];
  selectedClipId: string;
  config: PipelineConfig;
  discoveredAssets?: DiscoveredAsset[];
  savedAssets?: DiscoveredAsset[];
  isInjectingAsset?: boolean;
  onSelectClip: (clipId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onBatchApplyTemplate: (payload: {
    clipIds: string[];
    template: LayoutTemplate;
    captionStyle: CaptionStylePreset;
    captionFont: CaptionFontFamily;
    captionHighlightColor: string;
    captionAutoEmoji: boolean;
    hookBannerPosition: HookBannerPosition;
    watermarkHandle?: string;
  }) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onSuggestBroll: (clipId: string) => Promise<void>;
  onAutoInjectAsset?: (
    clipId: string,
    payload: { asset?: DiscoveredAsset; assetId?: string; mode?: "single" | "auto-blend-pack" }
  ) => Promise<void>;
  onOpenAssetDiscovery?: () => void;
  isSuggestingBroll: boolean;
  onOpenInStudio: (clipId: string) => void;
}

const TEMPLATE_BLUEPRINTS: Array<{
  id: LayoutTemplate;
  name: string;
  bestFor: string;
  spec: string;
}> = [
  { id: "split-stack", name: "Split Stack 36/64", bestFor: "Solo streamers with clear cam box", spec: "Top cam + bottom 16:9 center crop" },
  { id: "fullscreen-pip", name: "Fullscreen + PiP", bestFor: "High-speed racing & cinematic stunts", spec: "Full 9:16 gameplay + floating top-right cam" },
  { id: "blurred-backdrop", name: "Intact 16:9 + Blur", bestFor: "HUD-critical FPS, Tech & Explainers", spec: "Zero horizontal crop over blurred fill" },
  { id: "reaction-focus", name: "Reaction Focus 55/45", bestFor: "Jump scares, rage moments & clutch comms", spec: "Expanded creator reaction frame" },
  { id: "dual-cam", name: "Dual-Cam Co-Stream", bestFor: "Duo heists & podcast debates", spec: "Side-by-side dual cameras above visuals" },
  { id: "hud-zoom", name: "Killfeed / HUD Zoom", bestFor: "Speedometer, wanted stars & charts", spec: "Split stack + magnified top-right callout" },
];

const CAPTION_THEMES: Array<{
  id: CaptionStylePreset;
  name: string;
  sampleBg: string;
  sampleText: string;
  accent: string;
}> = [
  { id: "kinetic-highlight", name: "Kinetic Highlight", sampleBg: "bg-zinc-950", sampleText: "text-white font-extrabold", accent: "text-[#E1392B]" },
  { id: "bold-clean", name: "Bold Clean", sampleBg: "bg-zinc-950", sampleText: "text-white font-bold tracking-tight", accent: "text-white" },
  { id: "minimal-lower", name: "Minimal Lower", sampleBg: "bg-zinc-900", sampleText: "text-slate-100 font-medium", accent: "text-slate-200" },
  { id: "broadcast-lower", name: "Broadcast Lower-Third", sampleBg: "bg-[#0F172A]", sampleText: "text-white font-mono font-semibold", accent: "text-sky-400" },
  { id: "arcade-pop", name: "Arcade Pop", sampleBg: "bg-black", sampleText: "text-amber-300 font-extrabold uppercase", accent: "text-[#E1392B]" },
  { id: "comic-impact", name: "Comic Impact", sampleBg: "bg-zinc-950", sampleText: "text-white font-extrabold uppercase italic", accent: "text-emerald-400" },
];

const FONT_OPTIONS: Array<{ id: CaptionFontFamily; label: string; sampleClass: string }> = [
  { id: "jakarta", label: "Plus Jakarta Sans", sampleClass: "font-display" },
  { id: "oswald", label: "Oswald Condensed", sampleClass: "uppercase tracking-tight font-extrabold" },
  { id: "playfair", label: "Playfair Editorial", sampleClass: "font-serif italic" },
  { id: "mono", label: "JetBrains Mono", sampleClass: "font-mono" },
];

const BANNER_POSITIONS: Array<{ id: HookBannerPosition; label: string; previewTopClass: string }> = [
  { id: "top", label: "Top Safe (10%)", previewTopClass: "top-3" },
  { id: "upper-third", label: "Upper Third (26%)", previewTopClass: "top-1/4" },
  { id: "center", label: "Center Split (48%)", previewTopClass: "top-1/2 -translate-y-1/2" },
  { id: "lower", label: "Lower Above HUD (72%)", previewTopClass: "bottom-12" },
];

const ACCENT_COLORS = ["#E1392B", "#FACC15", "#22C55E", "#38BDF8", "#F97316", "#FFFFFF"];

const SFX_PACK: Array<{ kind: SfxKind; label: string; useCase: string }> = [
  { kind: "riser", label: "Tension Riser", useCase: "Build anticipation 0.6s before stunt payoff" },
  { kind: "bass-drop", label: "Sub Bass Drop", useCase: "Anchor impact frame or 5-star escape" },
  { kind: "whoosh", label: "Whip-Pan Whoosh", useCase: "Mask jump cuts and 00:00 hook transition" },
  { kind: "camera-click", label: "Shutter Flash", useCase: "Freeze-frame highlight / HUD callout" },
  { kind: "glitch-cut", label: "Digital Glitch Cut", useCase: "Reset attention at 12s retention dip" },
];

function estimateCtrScore(headline: string, position: HookBannerPosition): { score: number; note: string } {
  let score = 62;
  const trimmed = headline.trim();
  if (trimmed.length >= 14 && trimmed.length <= 34) score += 16;
  else if (trimmed.length > 34) score -= 8;
  if (/\d/.test(trimmed)) score += 9;
  if (/[?!]/.test(trimmed) || /\b(WAIT|STOP|WHY|NO WAY|ZERO|FREE|SECRET)\b/i.test(trimmed)) score += 8;
  if (position === "upper-third" || position === "center") score += 4;
  const clamped = Math.min(98, Math.max(40, score));
  const note =
    trimmed.length > 34
      ? "Headline wraps onto 2+ lines on small phones — tighten below 34 chars."
      : /\d/.test(trimmed)
        ? "Strong concrete number + crisp single-line legibility in mobile feeds."
        : "Add a specific number or curiosity gap verb to push CTR higher.";
  return { score: clamped, note };
}

export function TemplatesBrollDeck({
  clips,
  selectedClipId,
  config,
  discoveredAssets = [],
  savedAssets = [],
  isInjectingAsset = false,
  onSelectClip,
  onUpdateClip,
  onBatchApplyTemplate,
  onSaveConfig,
  onSuggestBroll,
  onAutoInjectAsset,
  onOpenAssetDiscovery,
  isSuggestingBroll,
  onOpenInStudio,
}: TemplatesBrollDeckProps) {
  const clip = useMemo(() => clips.find((c) => c.id === selectedClipId) || clips[0], [clips, selectedClipId]);
  const presets = config.brandPresets || [];
  const injectablePool = useMemo(() => {
    const seen = new Set<string>();
    const combined: DiscoveredAsset[] = [];
    for (const item of [...savedAssets, ...discoveredAssets]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      combined.push(item);
    }
    return combined;
  }, [savedAssets, discoveredAssets]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [newPresetName, setNewPresetName] = useState("");
  const [newWatermark, setNewWatermark] = useState(config.brandKit.watermarkHandle);
  const [newCta, setNewCta] = useState(config.brandKit.endCardCta);

  // Batch Template Applier state
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>(() =>
    clips.slice(0, Math.min(3, clips.length)).map((c) => c.id)
  );
  const [rangeStartIdx, setRangeStartIdx] = useState<number>(0);
  const [rangeEndIdx, setRangeEndIdx] = useState<number>(Math.max(0, Math.min(2, clips.length - 1)));
  const [batchTemplate, setBatchTemplate] = useState<LayoutTemplate>(clip?.layout.template || "split-stack");
  const [batchCaptionStyle, setBatchCaptionStyle] = useState<CaptionStylePreset>(
    clip?.layout.captionStyle || "kinetic-highlight"
  );
  const [batchCaptionFont, setBatchCaptionFont] = useState<CaptionFontFamily>(
    clip?.layout.captionFont || "jakarta"
  );
  const [batchHighlightColor, setBatchHighlightColor] = useState<string>(
    clip?.layout.captionHighlightColor || "#E1392B"
  );
  const [batchBannerPosition, setBatchBannerPosition] = useState<HookBannerPosition>(
    clip?.layout.hookBannerPosition || "top"
  );
  const [batchAutoEmoji, setBatchAutoEmoji] = useState<boolean>(Boolean(clip?.layout.captionAutoEmoji));
  const [batchWatermark, setBatchWatermark] = useState<string>(config.brandKit.watermarkHandle);
  const [applyingBatch, setApplyingBatch] = useState(false);

  // 1of10 / Viewstats Side-by-Side Cover & Title A/B CTR Simulator
  const [coverVariantA, setCoverVariantA] = useState(clip?.layout.hookBannerText || "WAIT FOR THE 210 MPH GAP");
  const [coverVariantB, setCoverVariantB] = useState(
    clip?.hookVariants?.[1]?.bannerText || "0.2 INCHES FROM A 5-STAR BUST"
  );
  const [coverPosA, setCoverPosA] = useState<HookBannerPosition>(clip?.layout.hookBannerPosition || "top");
  const [coverPosB, setCoverPosB] = useState<HookBannerPosition>("upper-third");

  if (!clip) {
    return <div className="p-12 text-center text-xs text-slate-500">Ingest a clip first to configure templates and B-Roll.</div>;
  }

  const ctrA = estimateCtrScore(coverVariantA, coverPosA);
  const ctrB = estimateCtrScore(coverVariantB, coverPosB);

  function toggleBatchClip(id: string) {
    setBatchSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function applyRangeSelection() {
    const start = Math.max(0, Math.min(rangeStartIdx, rangeEndIdx));
    const end = Math.min(clips.length - 1, Math.max(rangeStartIdx, rangeEndIdx));
    setBatchSelectedIds(clips.slice(start, end + 1).map((c) => c.id));
  }

  async function handleRunBatchTemplate() {
    if (batchSelectedIds.length === 0) return;
    setApplyingBatch(true);
    try {
      await onBatchApplyTemplate({
        clipIds: batchSelectedIds,
        template: batchTemplate,
        captionStyle: batchCaptionStyle,
        captionFont: batchCaptionFont,
        captionHighlightColor: batchHighlightColor,
        captionAutoEmoji: batchAutoEmoji,
        hookBannerPosition: batchBannerPosition,
        watermarkHandle: batchWatermark,
      });
    } finally {
      setApplyingBatch(false);
    }
  }

  async function applyTemplateToClip(tpl: LayoutTemplate) {
    await onUpdateClip(clip.id, { layout: { ...clip.layout, template: tpl } });
  }

  async function setDefaultTemplate(tpl: LayoutTemplate) {
    await onSaveConfig({ ...config, layoutDefaults: { ...config.layoutDefaults, template: tpl } });
  }

  async function applyPresetToClip(preset: BrandKitPreset) {
    await onUpdateClip(clip.id, {
      layout: {
        ...clip.layout,
        template: preset.template,
        captionStyle: preset.captionStyle,
        captionFont: preset.captionFont || clip.layout.captionFont || "jakarta",
        hookBannerPosition: preset.hookBannerPosition || clip.layout.hookBannerPosition || "top",
        watermarkHandle: preset.watermarkHandle,
        watermarkOpacity: preset.watermarkOpacity,
        endCardCta: preset.endCardCta,
        targetLufs: preset.targetLufs,
      },
    });
  }

  async function handleAddPreset(e: React.FormEvent) {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const entry: BrandKitPreset = {
      id: `preset_${Date.now().toString(36)}`,
      name: newPresetName.trim(),
      watermarkHandle: newWatermark.trim() || "@clipforge.gg",
      watermarkOpacity: 0.65,
      endCardCta: newCta.trim() || "Follow for daily clips",
      captionStyle: clip.layout.captionStyle,
      captionFont: clip.layout.captionFont || "jakarta",
      hookBannerPosition: clip.layout.hookBannerPosition || "top",
      template: clip.layout.template,
      targetLufs: clip.layout.targetLufs,
    };
    await onSaveConfig({ ...config, brandPresets: [...presets, entry] });
    setNewPresetName("");
  }

  async function handleDropSfxToClip(kind: SfxKind) {
    previewSfxSound(kind);
    await onUpdateClip(clip.id, {
      sfxCues: [
        ...(clip.sfxCues || []),
        { id: `sfx_${Date.now().toString(36)}`, timeSec: Number(clip.layout.hookStartSec.toFixed(1)), kind, gainDb: -3 },
      ],
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
            Batch Templates, Cover CTR A/B Lab &amp; AI B-Roll
          </span>
          <select
            aria-label="Target clip for templates"
            value={clip.id}
            onChange={(e) => {
              onSelectClip(e.target.value);
              const next = clips.find((c) => c.id === e.target.value);
              if (next) {
                setCoverVariantA(next.layout.hookBannerText);
                setCoverVariantB(next.hookVariants?.[1]?.bannerText || "NOBODY EXPECTED THIS ENDING");
              }
            }}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs max-w-[240px] truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.streamerHandle} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSuggestingBroll}
            onClick={() => onSuggestBroll(clip.id)}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {isSuggestingBroll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isSuggestingBroll ? "Directing B-Roll..." : "AI Suggest B-Roll Cues"}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenInStudio(clip.id)}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Preview in Studio</span>
          </button>
        </div>
      </div>

      {/* NEW: ONE-CLICK BATCH TEMPLATE APPLIER ACROSS CLIP RANGE */}
      <section className="p-5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9]/90 dark:bg-[#10131A] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E1392B]" />
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Batch Template Applier — Stamp Layout, Font Style &amp; Hook Banner Position in One Click
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Break free from repetitive default templates: select any range of clips and standardize framing, typography, accent color, and hook banner placement across your entire batch.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                setBatchSelectedIds(
                  batchSelectedIds.length === clips.length ? [] : clips.map((c) => c.id)
                )
              }
              className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] font-medium"
            >
              {batchSelectedIds.length === clips.length ? "Clear Selection" : `Select All (${clips.length})`}
            </button>
            <button
              type="button"
              disabled={applyingBatch || batchSelectedIds.length === 0}
              onClick={handleRunBatchTemplate}
              className="h-8 px-3.5 rounded-sm bg-[#E1392B] hover:bg-[#c83124] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
            >
              {applyingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Apply to {batchSelectedIds.length} Selected Clip(s)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 text-xs">
          {/* Left 7 cols: Batch Style Configuration */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14]">
            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Layout Blueprint</label>
              <select
                value={batchTemplate}
                onChange={(e) => setBatchTemplate(e.target.value as LayoutTemplate)}
                className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
              >
                {TEMPLATE_BLUEPRINTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Caption Theme</label>
              <select
                value={batchCaptionStyle}
                onChange={(e) => setBatchCaptionStyle(e.target.value as CaptionStylePreset)}
                className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
              >
                {CAPTION_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Caption Font Style</label>
              <select
                value={batchCaptionFont}
                onChange={(e) => setBatchCaptionFont(e.target.value as CaptionFontFamily)}
                className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Hook Banner Position</label>
              <select
                value={batchBannerPosition}
                onChange={(e) => setBatchBannerPosition(e.target.value as HookBannerPosition)}
                className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
              >
                {BANNER_POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Brand Watermark</label>
              <input
                type="text"
                value={batchWatermark}
                onChange={(e) => setBatchWatermark(e.target.value)}
                placeholder="@clipforge.gg"
                className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">Keyword Accent &amp; Emoji</label>
              <div className="flex items-center justify-between gap-2 h-8">
                <div className="flex items-center gap-1.5">
                  {ACCENT_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setBatchHighlightColor(hex)}
                      aria-label={`Select accent color ${hex}`}
                      className={`w-5 h-5 rounded-xs border ${
                        batchHighlightColor === hex
                          ? "border-[#0F172A] dark:border-white scale-110"
                          : "border-slate-500/40"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <label className="inline-flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={batchAutoEmoji}
                    onChange={(e) => setBatchAutoEmoji(e.target.checked)}
                    className="accent-[#E1392B]"
                  />
                  <span>Emoji</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Range Picker & Clip Multi-Select */}
          <div className="xl:col-span-5 p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-500">
                SELECT CLIP RANGE ({batchSelectedIds.length}/{clips.length})
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">Range</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, clips.length)}
                  value={rangeStartIdx + 1}
                  onChange={(e) => setRangeStartIdx(Math.max(0, Number(e.target.value) - 1))}
                  className="w-11 h-6 px-1.5 text-center font-mono tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, clips.length)}
                  value={rangeEndIdx + 1}
                  onChange={(e) => setRangeEndIdx(Math.max(0, Number(e.target.value) - 1))}
                  className="w-11 h-6 px-1.5 text-center font-mono tabular-nums rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21]"
                />
                <button
                  type="button"
                  onClick={applyRangeSelection}
                  className="h-6 px-2 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                >
                  Pick
                </button>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto divide-y divide-[#ECEFF3] dark:divide-[#1C2029] border border-[#D9DEE7] dark:border-[#222631]">
              {clips.map((c, index) => {
                const checked = batchSelectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleBatchClip(c.id)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[#F6F7F9] dark:hover:bg-[#141720]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">#{index + 1}</span>
                      <span className="truncate font-medium text-[#0F172A] dark:text-slate-200">{c.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {c.layout.template} · {c.layout.hookBannerPosition || "top"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Architectural Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
        {/* Left 7 cols: 6 Layout Blueprints + Caption Themes + SFX Audition Rack */}
        <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] divide-y divide-[#D9DEE7] dark:divide-[#222631]">
          {/* 6 Layout Blueprints */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                6 Vertical Layout Blueprints (Single Clip)
              </h2>
              <span className="font-mono text-xs text-slate-500">Active: {clip.layout.template}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATE_BLUEPRINTS.map((tpl) => {
                const isActive = clip.layout.template === tpl.id;
                const isDefault = config.layoutDefaults.template === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`p-3 rounded-sm border flex flex-col justify-between gap-3 ${
                      isActive
                        ? "border-[#E1392B] bg-[#E1392B]/5"
                        : "border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9]/60 dark:bg-[#111318]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0F1115] dark:text-[#EEF0F4]">{tpl.name}</span>
                        {isDefault && <span className="text-[10px] font-mono text-emerald-500">Default</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{tpl.bestFor}</p>
                      <p className="text-[10px] font-mono text-slate-400">{tpl.spec}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplateToClip(tpl.id)}
                        className="flex-1 h-7 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-[11px] font-semibold"
                      >
                        {isActive ? "Active on Clip" : "Apply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultTemplate(tpl.id)}
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        Default
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6 Caption Typography Themes */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Caption Typography Engine
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Active: {clip.layout.captionStyle} · {clip.layout.captionFont || "jakarta"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CAPTION_THEMES.map((theme) => {
                const active = clip.layout.captionStyle === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateClip(clip.id, { layout: { ...clip.layout, captionStyle: theme.id } })}
                    className={`p-3 rounded-sm border text-left transition-colors space-y-2 ${
                      active
                        ? "border-[#E1392B]"
                        : "border-[#D9DEE7] dark:border-[#262B37] hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className={`${theme.sampleBg} p-2.5 rounded-xs text-center text-xs ${theme.sampleText}`}>
                      WE <span className={theme.accent}>THREADED</span> THAT!
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">{theme.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#E1392B]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Web Audio API Sound FX Audition & Drop Rack */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                Live Web Audio SFX Pack &amp; Timeline Dropper
              </h2>
              <span className="font-mono text-xs text-slate-500">Click Audition to synthesize sound</span>
            </div>
            <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border border-[#D9DEE7] dark:border-[#222631]">
              {SFX_PACK.map((fx) => (
                <div key={fx.kind} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{fx.label}</div>
                    <div className="text-[11px] text-slate-500">{fx.useCase}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => previewSfxSound(fx.kind)}
                      className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21] text-[11px] font-medium inline-flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3 text-[#E1392B]" />
                      <span>Audition</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDropSfxToClip(fx.kind)}
                      className="h-7 px-2.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-[11px] font-semibold"
                    >
                      + Drop on Clip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 5 cols: 1of10 Cover & Title CTR A/B Simulator + Gemini B-Roll + Brand Kits */}
        <div className="xl:col-span-5 bg-[#F6F7F9] dark:bg-[#0F1117] divide-y divide-[#D9DEE7] dark:divide-[#222631] text-xs">
          {/* 1of10 / Viewstats Side-by-Side Cover & Title CTR A/B Simulator */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                <Smartphone className="w-4 h-4 text-[#E1392B]" />
                <span>Cover &amp; Hook Banner CTR A/B Simulator</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">9:16 Feed Preview</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: "A",
                  text: coverVariantA,
                  setText: setCoverVariantA,
                  pos: coverPosA,
                  setPos: setCoverPosA,
                  score: ctrA,
                },
                {
                  key: "B",
                  text: coverVariantB,
                  setText: setCoverVariantB,
                  pos: coverPosB,
                  setPos: setCoverPosB,
                  score: ctrB,
                },
              ].map((variant) => {
                const posClass =
                  BANNER_POSITIONS.find((p) => p.id === variant.pos)?.previewTopClass || "top-3";
                const isWinner =
                  (variant.key === "A" && ctrA.score >= ctrB.score) ||
                  (variant.key === "B" && ctrB.score > ctrA.score);
                return (
                  <div
                    key={variant.key}
                    className={`p-2.5 rounded-sm border space-y-2 bg-white dark:bg-[#14171F] ${
                      isWinner ? "border-[#E1392B]" : "border-[#D9DEE7] dark:border-[#262B37]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                        Variant {variant.key}
                      </span>
                      <span className={isWinner ? "text-[#E1392B] font-bold" : "text-slate-500"}>
                        CTR {variant.score.score}/100 {isWinner ? "· Winner" : ""}
                      </span>
                    </div>

                    {/* Mini 9:16 Feed Card Preview */}
                    <div className="relative aspect-[9/14] rounded-xs overflow-hidden bg-zinc-950 border border-zinc-800">
                      <img
                        src={clip.gameplayThumbnail}
                        alt={`Variant ${variant.key} cover`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                      <div className={`absolute inset-x-2 ${posClass} flex justify-center`}>
                        <div className="px-2 py-1 bg-[#E1392B] text-white font-display font-extrabold text-[10px] leading-tight text-center uppercase tracking-tight">
                          {variant.text || "HOOK BANNER"}
                        </div>
                      </div>
                      <div className="absolute bottom-2 inset-x-2 text-[9px] font-mono text-white/90 truncate">
                        {clip.streamerHandle} · {clip.layout.template}
                      </div>
                    </div>

                    <input
                      type="text"
                      maxLength={38}
                      value={variant.text}
                      onChange={(e) => variant.setText(e.target.value)}
                      className="w-full h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0D0F14] font-mono text-[11px] uppercase"
                    />

                    <div className="flex items-center gap-1.5">
                      <select
                        value={variant.pos}
                        onChange={(e) => variant.setPos(e.target.value as HookBannerPosition)}
                        className="flex-1 h-7 px-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#0D0F14] text-[10px]"
                      >
                        {BANNER_POSITIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateClip(clip.id, {
                            layout: {
                              ...clip.layout,
                              hookBannerText: variant.text.toUpperCase(),
                              hookBannerPosition: variant.pos,
                              showHookBanner: true,
                            },
                          })
                        }
                        className="h-7 px-2 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-[10px] font-semibold"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {ctrA.score >= ctrB.score ? `Variant A tip: ${ctrA.note}` : `Variant B tip: ${ctrB.note}`}
            </p>
          </section>

          {/* AI B-Roll & Cutaway Cue Sheet + Auto-Inject Discovered Assets */}
          <section className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                <Layers className="w-4 h-4 text-[#E1392B]" />
                <span>Gemini B-Roll &amp; Cutaway Cues ({clip.brollCues?.length || 0})</span>
              </div>

              {onAutoInjectAsset && (
                <button
                  type="button"
                  disabled={isInjectingAsset || injectablePool.length === 0}
                  onClick={() => onAutoInjectAsset(clip.id, { mode: "auto-blend-pack" })}
                  className="h-7 px-2.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center gap-1.5"
                >
                  {isInjectingAsset ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  <span>Auto-Inject</span>
                </button>
              )}
            </div>

            {/* Discovered Public Domain Stock & Meme Template Auto-Inject Bar */}
            {onAutoInjectAsset && (
              <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>PUBLIC DOMAIN &amp; MEME AUTO-INJECTOR ({injectablePool.length} READY)</span>
                  {onOpenAssetDiscovery && (
                    <button
                      type="button"
                      onClick={onOpenAssetDiscovery}
                      className="text-[#E1392B] hover:underline inline-flex items-center gap-1"
                    >
                      <Search className="w-2.5 h-2.5" />
                      <span>Discover More</span>
                    </button>
                  )}
                </div>
                {injectablePool.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      aria-label="Choose discovered stock footage or meme template to auto-inject"
                      value={selectedAssetId || injectablePool[0]?.id || ""}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="flex-1 min-w-0 h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#111318] text-[11px] truncate"
                    >
                      {injectablePool.map((item) => (
                        <option key={item.id} value={item.id}>
                          [{item.assetType === "stock-footage" ? "Stock CC0" : "Meme"}] {item.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isInjectingAsset}
                      onClick={() => {
                        const chosen =
                          injectablePool.find((a) => a.id === (selectedAssetId || injectablePool[0]?.id)) ||
                          injectablePool[0];
                        if (chosen) {
                          onAutoInjectAsset(clip.id, { asset: chosen, mode: "single" });
                        }
                      }}
                      className="h-8 px-2.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-[11px] font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      Blend Selected
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Open Asset Discovery to pull public domain stock footage &amp; trending meme templates.
                  </p>
                )}
              </div>
            )}

            {clip.brollCues && clip.brollCues.length > 0 ? (
              <div className="space-y-2">
                {clip.brollCues.map((cue) => (
                  <div
                    key={cue.id}
                    className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#E1392B] font-semibold">
                        @{cue.timeSec.toFixed(1)}s ({cue.durationSec.toFixed(1)}s) · {cue.effect}
                      </span>
                      <div className="flex items-center gap-2">
                        {cue.assetUrl && (
                          <a
                            href={cue.assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-[#E1392B]"
                            aria-label="Open source asset link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateClip(clip.id, {
                              brollCues: (clip.brollCues || []).filter((b) => b.id !== cue.id),
                            })
                          }
                          className="text-slate-400 hover:text-rose-500"
                          aria-label="Remove B-Roll cue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{cue.label}</div>
                    <p className="text-slate-500 dark:text-slate-400">{cue.promptNote}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">
                Click <strong>Auto-Inject</strong> or <strong>AI Suggest B-Roll Cues</strong> to place timed public domain cutaways, meme beats, and HUD callouts on this clip.
              </p>
            )}
          </section>

          {/* Reusable Brand Kit Presets */}
          <section className="p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
              Reusable Channel Brand Kits ({presets.length})
            </h3>
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{preset.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {preset.watermarkHandle} · {preset.template} · {preset.targetLufs} LUFS
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyPresetToClip(preset)}
                    className="h-7 px-2.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115] text-[11px] font-semibold shrink-0"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPreset} className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset Name"
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
                />
                <input
                  type="text"
                  value={newWatermark}
                  onChange={(e) => setNewWatermark(e.target.value)}
                  placeholder="@watermark"
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCta}
                  onChange={(e) => setNewCta(e.target.value)}
                  placeholder="End-Card CTA"
                  className="flex-1 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F]"
                />
                <button
                  type="submit"
                  className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save Kit</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
