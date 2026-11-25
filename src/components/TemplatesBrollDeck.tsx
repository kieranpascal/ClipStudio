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
} from "lucide-react";
import type {
  BrandKitPreset,
  CaptionStylePreset,
  ClipItem,
  LayoutTemplate,
  PipelineConfig,
  SfxKind,
} from "../types";
import { previewSfxSound } from "../utils/ffmpeg";

interface TemplatesBrollDeckProps {
  clips: ClipItem[];
  selectedClipId: string;
  config: PipelineConfig;
  onSelectClip: (clipId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
  onSuggestBroll: (clipId: string) => Promise<void>;
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
  { id: "blurred-backdrop", name: "Intact 16:9 + Blur", bestFor: "HUD-critical tactical FPS & flight sims", spec: "Zero horizontal crop over blurred fill" },
  { id: "reaction-focus", name: "Reaction Focus 55/45", bestFor: "Jump scares, rage moments & clutch comms", spec: "Expanded creator reaction frame" },
  { id: "dual-cam", name: "Dual-Cam Co-Stream", bestFor: "Duo heists & squad Discord banter", spec: "Side-by-side dual cameras above gameplay" },
  { id: "hud-zoom", name: "Killfeed / HUD Zoom", bestFor: "Speedometer, wanted stars & sniper feeds", spec: "Split stack + magnified top-right HUD callout" },
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

const SFX_PACK: Array<{ kind: SfxKind; label: string; useCase: string }> = [
  { kind: "riser", label: "Tension Riser", useCase: "Build anticipation 0.6s before stunt payoff" },
  { kind: "bass-drop", label: "Sub Bass Drop", useCase: "Anchor impact frame or 5-star escape" },
  { kind: "whoosh", label: "Whip-Pan Whoosh", useCase: "Mask jump cuts and 00:00 hook transition" },
  { kind: "camera-click", label: "Shutter Flash", useCase: "Freeze-frame highlight / HUD callout" },
  { kind: "glitch-cut", label: "Digital Glitch Cut", useCase: "Reset attention at 12s retention dip" },
];

export function TemplatesBrollDeck({
  clips,
  selectedClipId,
  config,
  onSelectClip,
  onUpdateClip,
  onSaveConfig,
  onSuggestBroll,
  isSuggestingBroll,
  onOpenInStudio,
}: TemplatesBrollDeckProps) {
  const clip = useMemo(() => clips.find((c) => c.id === selectedClipId) || clips[0], [clips, selectedClipId]);
  const presets = config.brandPresets || [];
  const [newPresetName, setNewPresetName] = useState("");
  const [newWatermark, setNewWatermark] = useState(config.brandKit.watermarkHandle);
  const [newCta, setNewCta] = useState(config.brandKit.endCardCta);
  const [coverTestTitle, setCoverTestTitle] = useState(clip?.layout.hookBannerText || "WAIT FOR THE 210 MPH GAP");

  if (!clip) {
    return <div className="p-12 text-center text-xs text-slate-500">Ingest a clip first to configure templates and B-Roll.</div>;
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
            Templates, Brand Kits &amp; AI B-Roll Director
          </span>
          <select
            aria-label="Target clip for templates"
            value={clip.id}
            onChange={(e) => {
              onSelectClip(e.target.value);
              const next = clips.find((c) => c.id === e.target.value);
              if (next) setCoverTestTitle(next.layout.hookBannerText);
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

      {/* Main 2-Column Architectural Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
        {/* Left 7 cols: 6 Layout Blueprints + Caption Themes + SFX Audition Rack */}
        <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] divide-y divide-[#D9DEE7] dark:divide-[#222631]">
          {/* 6 Layout Blueprints */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                6 Gaming Vertical Layout Blueprints
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
              <span className="font-mono text-xs text-slate-500">Active: {clip.layout.captionStyle}</span>
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

        {/* Right 5 cols: Gemini B-Roll Cue Sheet + Cover Title Lab + Brand Kit Presets */}
        <div className="xl:col-span-5 bg-[#F6F7F9] dark:bg-[#0F1117] divide-y divide-[#D9DEE7] dark:divide-[#222631] text-xs">
          {/* AI B-Roll & Cutaway Cue Sheet */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                <Layers className="w-4 h-4 text-[#E1392B]" />
                <span>Gemini B-Roll &amp; Cutaway Cues ({clip.brollCues?.length || 0})</span>
              </div>
            </div>

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
                    <div className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">{cue.label}</div>
                    <p className="text-slate-500 dark:text-slate-400">{cue.promptNote}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">
                Click <strong>AI Suggest B-Roll Cues</strong> above to let Gemini place timed zoom punch-ins, slow-mo beats, and HUD callouts on this clip.
              </p>
            )}
          </section>

          {/* 9:16 Cover & Hook Title Lab */}
          <section className="p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
              9:16 Cover &amp; Hook Banner Tester
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={38}
                value={coverTestTitle}
                onChange={(e) => setCoverTestTitle(e.target.value)}
                className="flex-1 h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#14171F] font-mono uppercase"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateClip(clip.id, {
                    layout: { ...clip.layout, hookBannerText: coverTestTitle.toUpperCase(), showHookBanner: true },
                  })
                }
                className="h-8 px-3 rounded-sm bg-[#E1392B] text-white font-semibold"
              >
                Sync Banner
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-500 flex justify-between">
              <span>Length: {coverTestTitle.length}/34 chars optimal</span>
              <span className={coverTestTitle.length <= 34 ? "text-emerald-500" : "text-amber-500"}>
                {coverTestTitle.length <= 34 ? "Single-line safe" : "May wrap on mobile"}
              </span>
            </div>
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
