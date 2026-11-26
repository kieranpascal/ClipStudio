import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Scissors,
  Undo2,
  Redo2,
  Volume2,
  Globe,
  Wand2,
  Camera,
  ShieldAlert,
  LayoutTemplate as LayoutIcon,
  Layers,
  Mic,
  Sliders,
  Keyboard,
  MessageSquare,
  Music,
  TrendingUp,
  CheckCircle2,
  Smile,
  BookOpen,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CaptionFontFamily,
  CaptionSegment,
  CaptionStylePreset,
  ClipItem,
  HookBannerPosition,
  HotkeyActionId,
  LayoutTemplate,
  MusicBedId,
  ReviewNote,
  SfxCue,
  SfxKind,
  SlangCorrection,
  StudioLayout,
  SupportedLocale,
  UiMode,
  VoiceProfileId,
} from "../types";
import {
  formatTimecode,
  generateAssSubtitles,
  generateFfmpegCommand,
  generateSrtSubtitles,
  generateVttSubtitles,
  previewSfxSound,
} from "../utils/ffmpeg";
import {
  injectContextualEmoji,
  isEditableElement,
  matchesHotkeyCombo,
  previewMusicBed,
} from "../utils/hotkeys";

interface VerticalStudioViewProps {
  clips: ClipItem[];
  selectedClipId: string;
  uiMode: UiMode;
  hotkeys: Record<HotkeyActionId, string>;
  slangDictionary: SlangCorrection[];
  onSelectClip: (clipId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onAuditClip: (clipId: string) => Promise<void>;
  onGenerateHooks: (clipId: string) => Promise<void>;
  onGradeHookRetention: (clipId: string) => Promise<void>;
  onCalculateClipHealth: (clipId: string) => Promise<void>;
  onSuggestBroll: (clipId: string) => Promise<void>;
  onTranslateClip: (clipId: string, locale: SupportedLocale) => Promise<void>;
  onGenerateVoiceover: (
    clipId: string,
    payload: {
      voiceName: VoiceProfileId;
      style: string;
      script: string;
      duckOriginalDb: number;
      loudnessCompliance: boolean;
      targetLufs: number;
      highPassHz: number;
      voicePresenceEq: boolean;
      deEsserEnabled: boolean;
      breathTrimEnabled: boolean;
      paceMultiplier: number;
    }
  ) => Promise<void>;
  onDraftVoiceoverScript: (clipId: string, tone: string) => Promise<string | null>;
  auditingClipId: string | null;
  generatingHooksClipId: string | null;
  isGradingHook: boolean;
  isCalculatingHealth: boolean;
  isSuggestingBroll: boolean;
  isGeneratingVoiceover: boolean;
  isDraftingScript: boolean;
  translatingLocale: SupportedLocale | null;
  onSendToQueue: (clipId: string) => Promise<void>;
  onOpenSettings: () => void;
  onSwitchToAdvanced?: () => void;
  onNotify?: (type: "success" | "error", message: string) => void;
}

interface StudioSnapshot {
  layout: StudioLayout;
  captions: CaptionSegment[];
  sfxCues: SfxCue[];
}

const CANVAS_W = 540;
const CANVAS_H = 960;

const TEMPLATES: Array<{ id: LayoutTemplate; label: string; desc: string }> = [
  { id: "split-stack", label: "Split Stack", desc: "Facecam top / Gameplay bottom" },
  { id: "fullscreen-pip", label: "Full + PiP", desc: "Full 9:16 gameplay + floating cam" },
  { id: "blurred-backdrop", label: "Blur Backdrop", desc: "16:9 intact over blurred fill" },
  { id: "reaction-focus", label: "Reaction 55/45", desc: "High-emotion reaction priority" },
  { id: "dual-cam", label: "Dual-Cam Duo", desc: "Two side-by-side co-stream cams" },
  { id: "hud-zoom", label: "HUD Zoom Callout", desc: "Split stack + zoomed killfeed/HUD" },
];

const QUICK_LOCALES: Array<{ code: SupportedLocale; label: string }> = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
  { code: "fr", label: "FR" },
];

const EXTRA_LOCALES: Array<{ code: SupportedLocale; label: string }> = [
  { code: "de", label: "DE · German" },
  { code: "ja", label: "JA · Japanese" },
  { code: "ko", label: "KO · Korean" },
  { code: "hi", label: "HI · Hindi" },
  { code: "ar", label: "AR · Arabic" },
  { code: "id", label: "ID · Indonesian" },
  { code: "tr", label: "TR · Turkish" },
  { code: "it", label: "IT · Italian" },
];

const VOICE_PROFILES: Array<{ id: VoiceProfileId; name: string; role: string; defaultStyle: string }> = [
  { id: "Puck", name: "Puck", role: "High-energy hype gaming narrator", defaultStyle: "Fast, excited, punchy hype commentator" },
  { id: "Kore", name: "Kore", role: "Crisp AI / Tech news anchor", defaultStyle: "Sharp, confident modern tech anchor" },
  { id: "Charon", name: "Charon", role: "Deep podcast & documentary voice", defaultStyle: "Deep, authoritative storytelling documentary voice" },
  { id: "Fenrir", name: "Fenrir", role: "Dramatic suspense / finance hook", defaultStyle: "Intense, suspenseful rapid-fire storyteller" },
  { id: "Zephyr", name: "Zephyr", role: "Smooth conversational explainer", defaultStyle: "Warm, clear, engaging short-form explainer" },
];

const MUSIC_BEDS: Array<{ id: MusicBedId; label: string; bpm: string; mood: string }> = [
  { id: "none", label: "No Music Bed", bpm: "—", mood: "Pure voice & gameplay" },
  { id: "cinematic-pulse", label: "Cinematic Pulse", bpm: "110 BPM", mood: "Documentary tension" },
  { id: "lofi-focus", label: "Lo-Fi Focus", bpm: "86 BPM", mood: "Podcast & explainer" },
  { id: "phonk-drift", label: "Phonk Drift", bpm: "132 BPM", mood: "High-energy gaming clutch" },
  { id: "tech-minimal", label: "Tech Minimal", bpm: "120 BPM", mood: "AI & founder breakdown" },
  { id: "suspense-riser", label: "Suspense Riser", bpm: "98 BPM", mood: "Mystery & hook payoff" },
];

const CAPTION_FONT_OPTIONS: Array<{ id: CaptionFontFamily; label: string }> = [
  { id: "jakarta", label: "Bricolage / Jakarta (Modern)" },
  { id: "oswald", label: "Condensed Impact (Viral)" },
  { id: "playfair", label: "Editorial Serif (Docu)" },
  { id: "mono", label: "Broadcast Mono (Tech)" },
];

const ACCENT_SWATCHES = ["#E1392B", "#FACC15", "#22C55E", "#38BDF8", "#F97316", "#FFFFFF"];

export function VerticalStudioView({
  clips,
  selectedClipId,
  uiMode,
  hotkeys,
  slangDictionary,
  onSelectClip,
  onUpdateClip,
  onAuditClip,
  onGenerateHooks,
  onGradeHookRetention,
  onCalculateClipHealth,
  onSuggestBroll,
  onTranslateClip,
  onGenerateVoiceover,
  onDraftVoiceoverScript,
  auditingClipId,
  generatingHooksClipId,
  isGradingHook,
  isCalculatingHealth,
  isSuggestingBroll,
  isGeneratingVoiceover,
  isDraftingScript,
  translatingLocale,
  onSendToQueue,
  onOpenSettings,
  onSwitchToAdvanced,
  onNotify,
}: VerticalStudioViewProps) {
  const clip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || clips[0],
    [clips, selectedClipId]
  );

  const [layout, setLayout] = useState<StudioLayout>(clip?.layout);
  const [captions, setCaptions] = useState<CaptionSegment[]>(clip?.captions || []);
  const [sfxCues, setSfxCues] = useState<SfxCue[]>(clip?.sfxCues || []);
  const [reviewNotes, setReviewNotes] = useState<ReviewNote[]>(clip?.reviewNotes || []);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteAuthor, setNewNoteAuthor] = useState("Producer");
  const [lastHotkeyBadge, setLastHotkeyBadge] = useState<string | null>(null);
  const [past, setPast] = useState<StudioSnapshot[]>([]);
  const [future, setFuture] = useState<StudioSnapshot[]>([]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<
    "frame" | "voiceover" | "hooks" | "audio" | "captions" | "notes" | "export"
  >("voiceover");
  const [activeCropTarget, setActiveCropTarget] = useState<"facecam" | "gameplay">("facecam");
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [assetsTick, setAssetsTick] = useState(0);

  // Voiceover Engine state
  const [voVoice, setVoVoice] = useState<VoiceProfileId>(clip?.voiceover?.voiceName || "Kore");
  const [voStyle, setVoStyle] = useState<string>(
    clip?.voiceover?.style || "Sharp, confident modern short-form narrator"
  );
  const [voScript, setVoScript] = useState<string>(
    clip?.voiceover?.script || clip?.transcript || ""
  );
  const [voDuckDb, setVoDuckDb] = useState<number>(clip?.voiceover?.duckOriginalDb ?? -12);
  const [voLoudnessCompliance, setVoLoudnessCompliance] = useState<boolean>(
    clip?.voiceover?.loudnessCompliance ?? true
  );
  const [voTargetLufs, setVoTargetLufs] = useState<number>(clip?.voiceover?.targetLufs ?? -14);
  const [voHighPassHz, setVoHighPassHz] = useState<number>(clip?.voiceover?.highPassHz ?? 80);
  const [voPresenceEq, setVoPresenceEq] = useState<boolean>(clip?.voiceover?.voicePresenceEq ?? true);
  const [voDeEsser, setVoDeEsser] = useState<boolean>(clip?.voiceover?.deEsserEnabled ?? false);
  const [voBreathTrim, setVoBreathTrim] = useState<boolean>(clip?.voiceover?.breathTrimEnabled ?? true);
  const [voPace, setVoPace] = useState<number>(clip?.voiceover?.paceMultiplier ?? 1.0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const gameplayImgRef = useRef<HTMLImageElement | null>(null);
  const facecamImgRef = useRef<HTMLImageElement | null>(null);

  // Sync editor when clip changes or AI updates arrive
  useEffect(() => {
    if (!clip) return;
    setLayout(clip.layout);
    const activeLoc = clip.activeLocale !== "en" ? clip.localizations[clip.activeLocale] : undefined;
    setCaptions(activeLoc ? activeLoc.captions : clip.captions);
    setSfxCues(clip.sfxCues || []);
    setReviewNotes(clip.reviewNotes || []);
    setVoVoice(clip.voiceover?.voiceName || (clip.niche === "tech-ai" ? "Kore" : clip.niche === "podcasts" ? "Charon" : "Puck"));
    setVoStyle(clip.voiceover?.style || "Energetic, crisp short-form narrator");
    setVoScript(clip.voiceover?.script || clip.transcript || "");
    setVoDuckDb(clip.voiceover?.duckOriginalDb ?? -12);
    setVoLoudnessCompliance(clip.voiceover?.loudnessCompliance ?? true);
    setVoTargetLufs(clip.voiceover?.targetLufs ?? -14);
    setVoHighPassHz(clip.voiceover?.highPassHz ?? 80);
    setVoPresenceEq(clip.voiceover?.voicePresenceEq ?? true);
    setVoDeEsser(clip.voiceover?.deEsserEnabled ?? false);
    setVoBreathTrim(clip.voiceover?.breathTrimEnabled ?? true);
    setVoPace(clip.voiceover?.paceMultiplier ?? 1.0);
    setPast([]);
    setFuture([]);
  }, [
    clip?.id,
    clip?.activeLocale,
    clip?.hookVariants?.length,
    clip?.brollCues?.length,
    clip?.voiceover?.id,
    clip?.qaResult?.auditedAt,
    clip?.hookGrade?.gradedAt,
    clip?.reviewNotes?.length,
    clip?.layout.template,
    clip?.layout.captionStyle,
    clip?.layout.captionFont,
    clip?.layout.hookBannerPosition,
  ]);

  // Undoable mutation helper
  const commitEdit = useCallback(
    (updater: (curr: StudioSnapshot) => StudioSnapshot) => {
      setPast((p) => [...p.slice(-24), { layout, captions, sfxCues }]);
      setFuture([]);
      const next = updater({ layout, captions, sfxCues });
      setLayout(next.layout);
      setCaptions(next.captions);
      setSfxCues(next.sfxCues);
    },
    [layout, captions, sfxCues]
  );

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setFuture((f) => [{ layout, captions, sfxCues }, ...f]);
    setPast((p) => p.slice(0, -1));
    setLayout(prev.layout);
    setCaptions(prev.captions);
    setSfxCues(prev.sfxCues);
  }, [past, layout, captions, sfxCues]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, { layout, captions, sfxCues }]);
    setFuture((f) => f.slice(1));
    setLayout(next.layout);
    setCaptions(next.captions);
    setSfxCues(next.sfxCues);
  }, [future, layout, captions, sfxCues]);

  // Blade split caption at playhead
  const handleBladeSplit = useCallback(() => {
    const idx = captions.findIndex((c) => currentTime > c.startSec + 0.3 && currentTime < c.endSec - 0.3);
    if (idx === -1) return;
    const target = captions[idx];
    const words = target.text.split(" ");
    const mid = Math.max(1, Math.floor(words.length / 2));
    const leftText = words.slice(0, mid).join(" ");
    const rightText = words.slice(mid).join(" ") || target.text;
    const splitAt = Number(currentTime.toFixed(1));

    commitEdit((curr) => ({
      ...curr,
      captions: [
        ...curr.captions.slice(0, idx),
        { ...target, endSec: splitAt, text: leftText },
        {
          id: `cap_split_${Date.now().toString(36)}`,
          startSec: splitAt,
          endSec: target.endSec,
          text: rightText,
        },
        ...curr.captions.slice(idx + 1),
      ],
    }));
  }, [captions, currentTime, commitEdit]);

  const flashHotkey = useCallback((label: string) => {
    setLastHotkeyBadge(label);
    window.setTimeout(() => {
      setLastHotkeyBadge((curr) => (curr === label ? null : curr));
    }, 1800);
  }, []);

  // Trim to Selection action (binds to Global Hotkey 'trim-to-selection')
  const handleTrimToSelection = useCallback(async () => {
    if (!clip || !layout) return;
    const anchor = Number(Math.max(0, Math.min(clip.durationSec - 8, currentTime)).toFixed(1));
    const trimmedDuration = Math.max(12, Math.min(45, Math.round(clip.durationSec - anchor)));
    const nextLayout: StudioLayout = {
      ...layout,
      hookStartSec: anchor,
      prependPeakHook: true,
    };
    const nextCaptions = captions
      .filter((seg) => seg.endSec >= anchor)
      .map((seg) => ({
        ...seg,
        startSec: Number(Math.max(0, seg.startSec - anchor).toFixed(1)),
        endSec: Number(Math.max(0.8, Math.min(trimmedDuration, seg.endSec - anchor)).toFixed(1)),
      }));
    commitEdit((curr) => ({
      ...curr,
      layout: nextLayout,
      captions: nextCaptions.length > 0 ? nextCaptions : curr.captions,
    }));
    await onUpdateClip(clip.id, {
      durationSec: trimmedDuration,
      layout: nextLayout,
      ...(clip.activeLocale === "en" && nextCaptions.length > 0 ? { captions: nextCaptions } : {}),
    });
    setCurrentTime(0);
    flashHotkey(`Trimmed to ${trimmedDuration}s (${hotkeys["trim-to-selection"]})`);
    onNotify?.("success", `Trimmed clip to ${trimmedDuration}s selection starting at ${anchor}s.`);
  }, [clip, layout, currentTime, captions, commitEdit, onUpdateClip, flashHotkey, hotkeys, onNotify]);

  // Real Global Configurable Hotkeys + Core NLE Shortcuts (Cmd/Ctrl+Z, J/K/L)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;
      if (!clip || !layout) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (matchesHotkeyCombo(e, hotkeys["play-pause"])) {
        e.preventDefault();
        setIsPlaying((p) => !p);
        flashHotkey(`Play/Pause (${hotkeys["play-pause"]})`);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["trim-to-selection"])) {
        e.preventDefault();
        void handleTrimToSelection();
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["generate-hook"])) {
        e.preventDefault();
        setInspectorTab("hooks");
        flashHotkey(`Generate Hooks (${hotkeys["generate-hook"]})`);
        void onGenerateHooks(clip.id);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["send-to-queue"])) {
        e.preventDefault();
        flashHotkey(`Send to Queue (${hotkeys["send-to-queue"]})`);
        void onSendToQueue(clip.id);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["blade-split"])) {
        e.preventDefault();
        handleBladeSplit();
        flashHotkey(`Blade Split (${hotkeys["blade-split"]})`);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["toggle-safe-zones"])) {
        e.preventDefault();
        commitEdit((c) => ({ ...c, layout: { ...c.layout, showSafeZones: !c.layout.showSafeZones } }));
        flashHotkey(`Safe Zones (${hotkeys["toggle-safe-zones"]})`);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["generate-voiceover"])) {
        e.preventDefault();
        setInspectorTab("voiceover");
        flashHotkey(`Voiceover Engine (${hotkeys["generate-voiceover"]})`);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["add-review-note"])) {
        e.preventDefault();
        setInspectorTab("notes");
        const quickNote: ReviewNote = {
          id: `note_${Date.now().toString(36)}`,
          timeSec: Number(currentTime.toFixed(1)),
          author: newNoteAuthor || "Producer",
          text: `Review marker pinned at ${formatTimecode(currentTime)}`,
          resolved: false,
          createdAt: new Date().toISOString(),
        };
        const updated = [quickNote, ...reviewNotes];
        setReviewNotes(updated);
        void onUpdateClip(clip.id, { reviewNotes: updated });
        flashHotkey(`Pinned Note @ ${currentTime.toFixed(1)}s (${hotkeys["add-review-note"]})`);
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["prev-clip"])) {
        e.preventDefault();
        const idx = clips.findIndex((c) => c.id === clip.id);
        if (idx > 0) {
          onSelectClip(clips[idx - 1].id);
          flashHotkey(`Prev Clip (${hotkeys["prev-clip"]})`);
        }
        return;
      }
      if (matchesHotkeyCombo(e, hotkeys["next-clip"])) {
        e.preventDefault();
        const idx = clips.findIndex((c) => c.id === clip.id);
        if (idx >= 0 && idx < clips.length - 1) {
          onSelectClip(clips[idx + 1].id);
          flashHotkey(`Next Clip (${hotkeys["next-clip"]})`);
        }
        return;
      }

      // Secondary NLE shuttle controls (J/K/L) when not overridden by custom bindings
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === "k") {
          setIsPlaying(false);
          setPlaybackRate(1);
        } else if (k === "l") {
          setPlaybackRate((r) => (r === 1 ? 1.75 : 1));
          setIsPlaying(true);
        } else if (k === "j") {
          setCurrentTime((t) => Math.max(0, t - 2));
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clip,
    clips,
    layout,
    hotkeys,
    currentTime,
    reviewNotes,
    newNoteAuthor,
    handleUndo,
    handleRedo,
    handleBladeSplit,
    handleTrimToSelection,
    commitEdit,
    onGenerateHooks,
    onSendToQueue,
    onUpdateClip,
    onSelectClip,
    flashHotkey,
  ]);

  // Preload gameplay & facecam assets
  useEffect(() => {
    if (!clip) return;
    let active = true;
    const gImg = new Image();
    gImg.crossOrigin = "anonymous";
    gImg.onload = () => {
      if (!active) return;
      gameplayImgRef.current = gImg;
      setAssetsTick((t) => t + 1);
    };
    gImg.src = clip.gameplayThumbnail;

    const fImg = new Image();
    fImg.crossOrigin = "anonymous";
    fImg.onload = () => {
      if (!active) return;
      facecamImgRef.current = fImg;
      setAssetsTick((t) => t + 1);
    };
    fImg.src = clip.facecamThumbnail;

    return () => {
      active = false;
    };
  }, [clip?.gameplayThumbnail, clip?.facecamThumbnail]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !clip || !layout) return;
    const totalDur = clip.durationSec + (layout.prependPeakHook ? layout.hookDurationSec : 0);
    let last = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const dt = ((now - last) / 1000) * playbackRate;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        return next >= totalDur ? 0 : next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackRate, clip?.durationSec, layout?.prependPeakHook, layout?.hookDurationSec]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !localVideoUrl) return;
    if (isPlaying) vid.play().catch(() => {});
    else vid.pause();
  }, [isPlaying, localVideoUrl]);

  // Live 9:16 Program Canvas Compositor (supports ALL 6 templates + Hook Banner + B-Roll Beat Badge + 6 Caption Engines + Safe Zones)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clip || !layout) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isHookPhase = layout.prependPeakHook && currentTime < layout.hookDurationSec;
    const totalDur = clip.durationSec + (layout.prependPeakHook ? layout.hookDurationSec : 0);
    const isEndCardPhase = currentTime > totalDur - 1.8 && Boolean(layout.endCardCta);
    const motionDrift = Math.sin(currentTime * 0.9) * 10;

    const activeBroll = (clip.brollCues || []).find(
      (b) => currentTime >= b.timeSec && currentTime <= b.timeSec + b.durationSec
    );
    const brollZoomBoost = activeBroll?.effect === "zoom-punch" ? 0.14 : 0;

    ctx.fillStyle = "#08090C";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const drawCover = (
      source: HTMLImageElement | HTMLVideoElement | null,
      destX: number,
      destY: number,
      destW: number,
      destH: number,
      zoom: number,
      panX: number,
      panY: number,
      extraShiftX = 0,
      blurPx = 0
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(destX, destY, destW, destH);
      ctx.clip();
      if (blurPx > 0) ctx.filter = `blur(${blurPx}px) brightness(0.55)`;

      if (!source) {
        ctx.fillStyle = "#141720";
        ctx.fillRect(destX, destY, destW, destH);
        ctx.restore();
        return;
      }

      const srcW = source instanceof HTMLVideoElement ? source.videoWidth || 1280 : source.naturalWidth || 1280;
      const srcH = source instanceof HTMLVideoElement ? source.videoHeight || 720 : source.naturalHeight || 720;
      const scale = Math.max(destW / srcW, destH / srcH) * zoom;
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const offsetX = destX + (destW - drawW) / 2 + panX * 2.2 + extraShiftX;
      const offsetY = destY + (destH - drawH) / 2 + panY * 2.2;
      ctx.drawImage(source, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    };

    const videoReady = Boolean(localVideoUrl && videoRef.current && videoRef.current.readyState >= 2);
    const topSource = videoReady ? videoRef.current : facecamImgRef.current;
    const botSource = videoReady ? videoRef.current : gameplayImgRef.current;

    let captionAnchorY = 390;

    if (layout.template === "fullscreen-pip") {
      drawCover(
        botSource,
        0,
        0,
        CANVAS_W,
        CANVAS_H,
        layout.gameplayZoom + (isHookPhase ? 0.05 : 0) + brollZoomBoost,
        layout.gameplayPanX,
        0,
        motionDrift * 0.65
      );
      const pipW = 164;
      const pipH = 200;
      const pipX = CANVAS_W - pipW - 22;
      const pipY = 74;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pipX, pipY, pipW, pipH, 8);
      ctx.clip();
      drawCover(topSource, pipX, pipY, pipW, pipH, layout.facecamZoom, layout.facecamPanX, layout.facecamPanY, motionDrift * 0.25);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pipX, pipY, pipW, pipH, 8);
      ctx.stroke();
      captionAnchorY = CANVAS_H - 250;
    } else if (layout.template === "blurred-backdrop") {
      drawCover(botSource, 0, 0, CANVAS_W, CANVAS_H, 1.4, 0, 0, 0, 14);
      const camW = 280;
      const camH = 205;
      const camX = (CANVAS_W - camW) / 2;
      const camY = 72;
      drawCover(topSource, camX, camY, camW, camH, layout.facecamZoom, layout.facecamPanX, layout.facecamPanY);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(camX, camY, camW, camH);
      const gameW = CANVAS_W;
      const gameH = Math.round((CANVAS_W * 9) / 16);
      const gameY = 340;
      drawCover(botSource, 0, gameY, gameW, gameH, 1.0 + brollZoomBoost, 0, 0);
      captionAnchorY = gameY + gameH + 54;
    } else if (layout.template === "dual-cam") {
      // Side-by-side co-stream dual facecams on top 34% + gameplay bottom 66%
      const camH = Math.round(CANVAS_H * 0.34);
      const halfW = CANVAS_W / 2;
      drawCover(topSource, 0, 0, halfW, camH, layout.facecamZoom, layout.facecamPanX - 6, layout.facecamPanY, motionDrift * 0.2);
      drawCover(topSource, halfW, 0, halfW, camH, layout.facecamZoom * 1.08, layout.facecamPanX + 12, layout.facecamPanY, -motionDrift * 0.2);
      ctx.fillStyle = "#0A0B0E";
      ctx.fillRect(halfW - 2, 0, 4, camH);
      drawCover(
        botSource,
        0,
        camH,
        CANVAS_W,
        CANVAS_H - camH,
        layout.gameplayZoom + brollZoomBoost,
        layout.gameplayPanX,
        0,
        motionDrift * 0.6
      );
      ctx.fillStyle = "#0A0B0E";
      ctx.fillRect(0, camH - 2, CANVAS_W, 4);
      captionAnchorY = camH + 48;
    } else if (layout.template === "hud-zoom") {
      // Split-stack + magnified top-right tactical HUD/Killfeed callout box
      const faceH = Math.round((CANVAS_H * layout.facecamHeightPercent) / 100);
      const gameH = CANVAS_H - faceH;
      drawCover(topSource, 0, 0, CANVAS_W, faceH, layout.facecamZoom, layout.facecamPanX, layout.facecamPanY, motionDrift * 0.25);
      drawCover(botSource, 0, faceH, CANVAS_W, gameH, layout.gameplayZoom + brollZoomBoost, layout.gameplayPanX, 0, motionDrift * 0.6);
      ctx.fillStyle = "#0A0B0E";
      ctx.fillRect(0, faceH - 2, CANVAS_W, 4);
      // Magnified HUD callout inset
      const hudW = 196;
      const hudH = 88;
      const hudX = CANVAS_W - hudW - 18;
      const hudY = faceH + 18;
      drawCover(botSource, hudX, hudY, hudW, hudH, 2.3, -24, 18);
      ctx.strokeStyle = "#E1392B";
      ctx.lineWidth = 2;
      ctx.strokeRect(hudX, hudY, hudW, hudH);
      ctx.fillStyle = "#E1392B";
      ctx.fillRect(hudX, hudY, 72, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("HUD 2.3X", hudX + 6, hudY + 8);
      captionAnchorY = faceH + 145;
    } else {
      // split-stack or reaction-focus
      const pct = layout.template === "reaction-focus" ? Math.max(52, layout.facecamHeightPercent) : layout.facecamHeightPercent;
      const faceH = Math.round((CANVAS_H * pct) / 100);
      const gameH = CANVAS_H - faceH;
      drawCover(topSource, 0, 0, CANVAS_W, faceH, layout.facecamZoom + (isHookPhase ? 0.08 : 0), layout.facecamPanX, layout.facecamPanY, motionDrift * 0.3);
      drawCover(
        botSource,
        0,
        faceH,
        CANVAS_W,
        gameH,
        layout.gameplayZoom + (isHookPhase ? 0.05 : 0) + brollZoomBoost,
        layout.gameplayPanX - (layout.maskChatRegion ? 12 : 0),
        0,
        motionDrift * 0.65
      );
      ctx.fillStyle = "#0A0B0E";
      ctx.fillRect(0, faceH - 2, CANVAS_W, 4);
      captionAnchorY = layout.captionStyle === "minimal-lower" || layout.captionStyle === "broadcast-lower" ? CANVAS_H - 185 : faceH + 46;
    }

    // Active B-Roll Cue Graphic Overlay
    if (activeBroll) {
      ctx.fillStyle = "rgba(10, 11, 14, 0.84)";
      ctx.fillRect(22, CANVAS_H - 295, CANVAS_W - 44, 34);
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(22, CANVAS_H - 295, CANVAS_W - 44, 34);
      ctx.fillStyle = "#93C5FD";
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `B-ROLL [${activeBroll.effect.toUpperCase()}] · ${activeBroll.label} — ${activeBroll.promptNote.slice(0, 32)}`,
        32,
        CANVAS_H - 278
      );
    }

    // Bottom contrast scrim
    const scrim = ctx.createLinearGradient(0, CANVAS_H - 260, 0, CANVAS_H);
    scrim.addColorStop(0, "rgba(0,0,0,0)");
    scrim.addColorStop(1, "rgba(0,0,0,0.82)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, CANVAS_H - 260, CANVAS_W, 260);

    // Viral 0-3s Hook Banner Overlay (respects hookBannerPosition)
    if (isHookPhase && layout.showHookBanner && layout.hookBannerText.trim()) {
      const text = layout.hookBannerText.trim().toUpperCase();
      ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
      const tw = ctx.measureText(text).width;
      const boxW = Math.min(CANVAS_W - 44, tw + 34);
      const boxX = (CANVAS_W - boxW) / 2;
      const pos: HookBannerPosition = layout.hookBannerPosition || "top";
      const boxY = pos === "upper-third" ? 210 : pos === "center" ? 440 : pos === "lower" ? 685 : 58;
      ctx.fillStyle = layout.captionHighlightColor || "#E1392B";
      ctx.fillRect(boxX, boxY, boxW, 42);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, CANVAS_W / 2, boxY + 22, CANVAS_W - 60);
    }

    // Kinetic Captions (supports all 6 engines + custom Font Family + Accent Swatch + Auto-Emoji)
    const activeCaption = captions.find((seg) => currentTime >= seg.startSec && currentTime <= seg.endSec) || captions[0];
    if (activeCaption) {
      const style = layout.captionStyle;
      const fontSize =
        style === "bold-clean"
          ? 31
          : style === "minimal-lower" || style === "broadcast-lower"
            ? 23
            : style === "arcade-pop" || style === "comic-impact"
              ? 30
              : 28;
      const chosenFont = layout.captionFont || (style === "broadcast-lower" ? "mono" : "jakarta");
      const fontFamily =
        chosenFont === "mono"
          ? '"JetBrains Mono", monospace'
          : chosenFont === "playfair"
            ? 'Georgia, "Times New Roman", serif'
            : chosenFont === "oswald"
              ? 'Impact, "Arial Narrow", "Bricolage Grotesque", sans-serif'
              : '"Bricolage Grotesque", sans-serif';
      const italic = style === "comic-impact" ? "italic " : "";
      ctx.font = `${italic}800 ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "middle";

      const rawText = layout.captionAutoEmoji
        ? injectContextualEmoji(activeCaption.text)
        : activeCaption.text;
      const displayText =
        style === "arcade-pop" || style === "comic-impact" ? rawText.toUpperCase() : rawText;
      const accentHex = layout.captionHighlightColor || "#E1392B";

      const words = displayText.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > CANVAS_W - 76 && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      if (style === "broadcast-lower") {
        const boxH = lines.length * (fontSize + 10) + 18;
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.fillRect(28, captionAnchorY - fontSize / 2 - 10, CANVAS_W - 56, boxH);
        ctx.fillStyle = accentHex;
        ctx.fillRect(28, captionAnchorY - fontSize / 2 - 10, 4, boxH);
      }

      lines.forEach((lineText, idx) => {
        const y = captionAnchorY + idx * (fontSize + 9);
        const tokens = lineText.split(" ");
        const totalWidth = ctx.measureText(lineText).width;
        let cursorX = CANVAS_W / 2 - totalWidth / 2;

        tokens.forEach((tok, tokIdx) => {
          const piece = tokIdx < tokens.length - 1 ? `${tok} ` : tok;
          const pieceW = ctx.measureText(piece).width;
          const isEmph =
            activeCaption.emphasisWord &&
            tok.toLowerCase().includes(activeCaption.emphasisWord.toLowerCase().replace(/[^a-z0-9]/gi, ""));

          ctx.textAlign = "left";
          ctx.lineWidth = style === "broadcast-lower" ? 2 : 6;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
          ctx.strokeText(piece, cursorX, y);

          if (isEmph && (style === "kinetic-highlight" || style === "arcade-pop" || style === "bold-clean")) {
            ctx.fillStyle = accentHex;
          } else if (isEmph && style === "comic-impact") {
            ctx.fillStyle = accentHex === "#E1392B" ? "#22C55E" : accentHex;
          } else if (style === "arcade-pop") {
            ctx.fillStyle = "#FCD34D";
          } else {
            ctx.fillStyle = "#FFFFFF";
          }
          ctx.fillText(piece, cursorX, y);
          cursorX += pieceW;
        });
      });
    }

    // End-Card Loop CTA Overlay
    if (isEndCardPhase) {
      ctx.fillStyle = "rgba(10, 11, 14, 0.86)";
      ctx.fillRect(36, CANVAS_H - 210, CANVAS_W - 72, 48);
      ctx.strokeStyle = "#E1392B";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(36, CANVAS_H - 210, CANVAS_W - 72, 48);
      ctx.textAlign = "center";
      ctx.font = '700 18px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(layout.endCardCta, CANVAS_W / 2, CANVAS_H - 186);
    }

    // Brand Watermark + Mandatory Streamer Credit
    ctx.textAlign = "left";
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(18, 18, 215, 26);
    ctx.fillStyle = `rgba(255, 255, 255, ${layout.watermarkOpacity})`;
    ctx.fillText(`${layout.watermarkHandle || "@clipforge"} · via ${clip.streamerHandle}`, 26, 32);

    // Safe Zone Guides
    if (layout.showSafeZones) {
      ctx.strokeStyle = "rgba(225, 57, 43, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(CANVAS_W - 88, CANVAS_H - 420, 74, 275);
      ctx.strokeRect(18, CANVAS_H - 135, CANVAS_W - 36, 114);
      ctx.setLineDash([]);
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(248, 113, 113, 0.9)";
      ctx.fillText("ACTION RAIL", CANVAS_W - 88, CANVAS_H - 428);
      ctx.fillText("PLATFORM SAFE ZONE", 22, CANVAS_H - 142);
    }
  }, [clip, layout, captions, currentTime, assetsTick, localVideoUrl]);

  const ffmpegCommand = useMemo(
    () => (clip && layout ? generateFfmpegCommand(clip, layout) : ""),
    [clip, layout]
  );

  if (!clip || !layout) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Ingest a clip in the Ingest deck to open the Cut &amp; Composite Studio.
      </div>
    );
  }

  const totalDuration = clip.durationSec + (layout.prependPeakHook ? layout.hookDurationSec : 0);

  const liveLufs = isPlaying
    ? (layout.targetLufs + Math.sin(currentTime * 4.2) * 1.4).toFixed(1)
    : layout.targetLufs.toFixed(1);

  async function handleSaveStudio() {
    setSaving(true);
    try {
      const updates: Partial<ClipItem> = { layout, sfxCues, reviewNotes };
      if (clip.activeLocale === "en") {
        updates.captions = captions;
      } else {
        const existingLoc = clip.localizations[clip.activeLocale];
        if (existingLoc) {
          updates.localizations = {
            ...clip.localizations,
            [clip.activeLocale]: { ...existingLoc, captions },
          };
        }
      }
      await onUpdateClip(clip.id, updates);
    } finally {
      setSaving(false);
    }
  }

  function handleApplySlangDictionary() {
    if (!slangDictionary.length) return;
    let replacements = 0;
    const nextCaptions = captions.map((seg) => {
      let text = seg.text;
      for (const entry of slangDictionary) {
        if (!entry.wrong.trim() || !entry.right.trim()) continue;
        const escaped = entry.wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\b${escaped}\\b`, "gi");
        if (re.test(text)) {
          text = text.replace(re, entry.right);
          replacements += 1;
        }
      }
      return { ...seg, text };
    });
    commitEdit((c) => ({ ...c, captions: nextCaptions }));
    onNotify?.(
      "success",
      replacements > 0
        ? `Fixed ${replacements} slang / proper-noun caption error(s) via Dictionary.`
        : "Captions already match your Slang Dictionary."
    );
  }

  function handleInjectAllEmojis() {
    commitEdit((c) => ({
      ...c,
      layout: { ...c.layout, captionAutoEmoji: true },
      captions: c.captions.map((seg) => ({ ...seg, text: injectContextualEmoji(seg.text) })),
    }));
    onNotify?.("success", "Injected contextual micro-emojis across caption lines.");
  }

  async function handleAddManualReviewNote() {
    if (!newNoteText.trim()) return;
    const entry: ReviewNote = {
      id: `note_${Date.now().toString(36)}`,
      timeSec: Number(currentTime.toFixed(1)),
      author: newNoteAuthor.trim() || "Producer",
      text: newNoteText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [entry, ...reviewNotes];
    setReviewNotes(nextNotes);
    setNewNoteText("");
    await onUpdateClip(clip.id, { reviewNotes: nextNotes });
  }

  async function handleToggleNoteResolved(noteId: string) {
    const nextNotes = reviewNotes.map((n) => (n.id === noteId ? { ...n, resolved: !n.resolved } : n));
    setReviewNotes(nextNotes);
    await onUpdateClip(clip.id, { reviewNotes: nextNotes });
  }

  async function handleDeleteNote(noteId: string) {
    const nextNotes = reviewNotes.filter((n) => n.id !== noteId);
    setReviewNotes(nextNotes);
    await onUpdateClip(clip.id, { reviewNotes: nextNotes });
  }

  function handleExportReviewBrief() {
    const lines = [
      `# ClipForge Client / Editor Review Brief`,
      `- **Clip:** ${clip.title}`,
      `- **Creator:** ${clip.streamerHandle} (${clip.sourcePlatform})`,
      `- **Template:** ${layout.template} · Caption: ${layout.captionStyle}`,
      `- **Hook Score:** ${clip.hookGrade ? `${clip.hookGrade.overallScore}/100` : "Not graded yet"}`,
      "",
      `## Timestamped Frame Notes (${reviewNotes.length})`,
      ...reviewNotes
        .slice()
        .sort((a, b) => a.timeSec - b.timeSec)
        .map(
          (n) =>
            `- [${n.resolved ? "x" : " "}] **@${formatTimecode(n.timeSec)}** (${n.author}): ${n.text}`
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clip.id}_review_brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify?.("success", "Downloaded Markdown Review Brief.");
  }

  function handleSourceMonitorClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const cy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    commitEdit((curr) => {
      const box = activeCropTarget === "facecam" ? curr.layout.sourceFacecamRect : curr.layout.sourceGameplayRect;
      const nx = Math.max(0, Math.min(1 - box.w, cx - box.w / 2));
      const ny = Math.max(0, Math.min(1 - box.h, cy - box.h / 2));
      return {
        ...curr,
        layout: {
          ...curr.layout,
          ...(activeCropTarget === "facecam"
            ? {
                sourceFacecamRect: { ...box, x: Number(nx.toFixed(3)), y: Number(ny.toFixed(3)) },
                facecamPanX: Math.round((nx - 0.5) * 40),
                facecamPanY: Math.round((ny - 0.5) * 30),
              }
            : {
                sourceGameplayRect: { ...box, x: Number(nx.toFixed(3)), y: Number(ny.toFixed(3)) },
                gameplayPanX: Math.round((nx - 0.2) * 50),
              }),
        },
      };
    });
  }

  function handleExportWebm() {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") return;
    setIsRecording(true);
    setCurrentTime(0);
    setIsPlaying(true);

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.id}_${layout.template}_${clip.activeLocale}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setIsPlaying(false);
    };
    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 5500);
  }

  function handleExportPngCover() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clip.id}_cover_9x16.png`;
    a.click();
  }

  function downloadSubtitle(format: "ass" | "srt" | "vtt") {
    const text =
      format === "ass"
        ? generateAssSubtitles(captions)
        : format === "srt"
          ? generateSrtSubtitles(captions)
          : generateVttSubtitles(captions);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `captions_${clip.id}_${clip.activeLocale}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAddSfx(kind: SfxKind) {
    previewSfxSound(kind);
    commitEdit((curr) => ({
      ...curr,
      sfxCues: [
        ...curr.sfxCues,
        { id: `sfx_${Date.now().toString(36)}`, timeSec: Number(currentTime.toFixed(1)), kind, gainDb: -3 },
      ],
    }));
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
      {localVideoUrl && <video ref={videoRef} src={localVideoUrl} loop muted playsInline className="hidden" />}

      {/* NLE Precision Sub-Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select clip in studio"
            value={clip.id}
            onChange={(e) => onSelectClip(e.target.value)}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9] max-w-[260px] truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.streamerHandle} — {c.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={isCalculatingHealth}
            onClick={() => void onCalculateClipHealth(clip.id)}
            title="Recalculate Clip Health via AI Director (Engagement Parity, A/V Sync, Metadata)"
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-mono tabular-nums inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            {isCalculatingHealth ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
            ) : (
              <Activity
                className={`w-3.5 h-3.5 ${
                  !clip.clipHealth
                    ? "text-slate-400"
                    : clip.clipHealth.overall >= 80
                      ? "text-emerald-500"
                      : clip.clipHealth.overall >= 60
                        ? "text-amber-500"
                        : "text-rose-500"
                }`}
              />
            )}
            <span className="text-slate-500">HEALTH</span>
            <span
              className={`font-semibold ${
                !clip.clipHealth
                  ? "text-slate-400"
                  : clip.clipHealth.overall >= 80
                    ? "text-emerald-600 dark:text-emerald-400"
                    : clip.clipHealth.overall >= 60
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {clip.clipHealth ? `${clip.clipHealth.overall}/100` : "—"}
            </span>
          </button>

          <div className="flex items-center gap-1 border-l border-[#D9DEE7] dark:border-[#252A36] pl-2.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo edit"
              className="h-8 w-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] disabled:opacity-35 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo edit"
              className="h-8 w-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] disabled:opacity-35 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Multi-Language Localization Bar (12 Languages) */}
          <div className="flex items-center gap-1 border-l border-[#D9DEE7] dark:border-[#252A36] pl-2.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
            {QUICK_LOCALES.map((loc) => {
              const isCurrent = clip.activeLocale === loc.code;
              const isCached = loc.code === "en" || Boolean(clip.localizations[loc.code]);
              const isTranslating = translatingLocale === loc.code;
              return (
                <button
                  key={loc.code}
                  type="button"
                  disabled={Boolean(translatingLocale)}
                  onClick={() => {
                    if (isCached) {
                      onUpdateClip(clip.id, { activeLocale: loc.code });
                    } else {
                      onTranslateClip(clip.id, loc.code);
                    }
                  }}
                  title={isCached ? `Switch to ${loc.label}` : `Translate clip to ${loc.label} via Gemini`}
                  className={`h-7 px-2 rounded-sm font-mono text-[11px] transition-colors ${
                    isCurrent
                      ? "bg-[#E1392B] text-white font-semibold"
                      : isCached
                        ? "bg-white dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#252A36] text-[#0F172A] dark:text-slate-200"
                        : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
                  }`}
                >
                  {isTranslating ? "…" : loc.label}
                </button>
              );
            })}
            <select
              aria-label="Translate to additional language"
              disabled={Boolean(translatingLocale)}
              value={EXTRA_LOCALES.some((l) => l.code === clip.activeLocale) ? clip.activeLocale : ""}
              onChange={(e) => {
                const code = e.target.value as SupportedLocale;
                if (!code) return;
                if (clip.localizations[code]) {
                  onUpdateClip(clip.id, { activeLocale: code });
                } else {
                  onTranslateClip(clip.id, code);
                }
              }}
              className="h-7 px-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] font-mono text-[11px] text-slate-600 dark:text-slate-300"
            >
              <option value="">+8 Langs</option>
              {EXTRA_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.label} {clip.localizations[loc.code] ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastHotkeyBadge && (
            <span className="font-mono text-[11px] text-[#E1392B] font-semibold px-2">
              {lastHotkeyBadge}
            </span>
          )}

          <button
            type="button"
            onClick={() => void handleTrimToSelection()}
            title={`Trim to Selection (${hotkeys["trim-to-selection"]})`}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Scissors className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Trim</span>
            <kbd className="font-mono text-[10px] text-slate-400">{hotkeys["trim-to-selection"]}</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Configure Global Hotkeys & Slang Dictionary"
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Hotkeys</span>
          </button>

          <button
            type="button"
            onClick={() => onSuggestBroll(clip.id)}
            disabled={isSuggestingBroll}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isSuggestingBroll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-[#E1392B]" />
            )}
            <span>AI B-Roll ({clip.brollCues?.length || 0})</span>
          </button>

          <label className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:bg-slate-50 dark:hover:bg-[#1B1F2A] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Load MP4</span>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
                setLocalVideoUrl(URL.createObjectURL(file));
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleExportPngCover}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>PNG Cover</span>
          </button>

          <button
            type="button"
            onClick={handleExportWebm}
            disabled={isRecording}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {isRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E1392B]" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isRecording ? "Recording..." : "Export WebM"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveStudio}
            disabled={saving}
            className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save Cut"}
          </button>

          <button
            type="button"
            onClick={async () => {
              await handleSaveStudio();
              await onSendToQueue(clip.id);
            }}
            title={`Send to Queue (${hotkeys["send-to-queue"]})`}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
        </div>
      </div>

      {/* Easy Mode Guided Workflow Banner */}
      {uiMode === "easy" && (
        <div className="px-4 sm:px-6 py-2.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
            <span className="font-mono text-[11px] font-semibold text-[#E1392B]">EASY STUDIO</span>
            <span>1. Pick Template &amp; Hook</span>
            <span aria-hidden="true">→</span>
            <span>2. Generate AI Voiceover (.WAV)</span>
            <span aria-hidden="true">→</span>
            <span>3. Click Queue to Publish</span>
          </div>
          {onSwitchToAdvanced && (
            <button
              type="button"
              onClick={onSwitchToAdvanced}
              className="text-[11px] font-mono text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>Unlock Full NLE Timeline &amp; FFmpeg</span>
            </button>
          )}
        </div>
      )}

      {/* Upper Broadcast Deck: Monitors (Left) + Inspector Rack (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#0A0B0E]">
        {/* Dual-Monitor Bay (Single Program + Quick Templates in Easy Mode) */}
        <div
          className={`${
            uiMode === "easy" ? "xl:col-span-6" : "xl:col-span-7"
          } p-4 sm:p-5 border-b xl:border-b-0 xl:border-r border-[#D9DEE7] dark:border-[#222631] grid grid-cols-1 md:grid-cols-12 gap-5 items-start`}
        >
          {/* Monitor 1: 16:9 Source Frame (Pro) or Clean Quick Template Picker (Easy) */}
          <div className="md:col-span-6 space-y-3">
            {uiMode === "advanced" && (
              <>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>SOURCE MONITOR · 16:9</span>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCropTarget("facecam")}
                      className={activeCropTarget === "facecam" ? "text-[#E1392B] font-semibold" : "hover:text-slate-200"}
                    >
                      Cam Box
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setActiveCropTarget("gameplay")}
                      className={activeCropTarget === "gameplay" ? "text-emerald-500 font-semibold" : "hover:text-slate-200"}
                    >
                      Game Box
                    </button>
                  </div>
                </div>

                <div
                  onClick={handleSourceMonitorClick}
                  title="Click to reposition the selected crop region on the 16:9 source frame"
                  className="relative aspect-video rounded-sm overflow-hidden border border-[#D9DEE7] dark:border-[#252A36] bg-black cursor-crosshair select-none"
                >
                  <img
                    src={clip.gameplayThumbnail}
                    alt="16:9 Source Frame"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-90"
                  />

                  <div
                    style={{
                      left: `${layout.sourceGameplayRect.x * 100}%`,
                      top: `${layout.sourceGameplayRect.y * 100}%`,
                      width: `${layout.sourceGameplayRect.w * 100}%`,
                      height: `${layout.sourceGameplayRect.h * 100}%`,
                    }}
                    className={`absolute border-2 transition-all pointer-events-none ${
                      activeCropTarget === "gameplay" ? "border-emerald-400 bg-emerald-500/10" : "border-emerald-500/50"
                    }`}
                  >
                    <span className="absolute top-1 left-1 bg-black/75 text-emerald-400 font-mono text-[9px] px-1">
                      GAMEPLAY
                    </span>
                  </div>

                  <div
                    style={{
                      left: `${layout.sourceFacecamRect.x * 100}%`,
                      top: `${layout.sourceFacecamRect.y * 100}%`,
                      width: `${layout.sourceFacecamRect.w * 100}%`,
                      height: `${layout.sourceFacecamRect.h * 100}%`,
                    }}
                    className={`absolute border-2 transition-all pointer-events-none ${
                      activeCropTarget === "facecam" ? "border-[#E1392B] bg-[#E1392B]/15" : "border-[#E1392B]/60"
                    }`}
                  >
                    <span className="absolute top-1 left-1 bg-black/75 text-rose-400 font-mono text-[9px] px-1">
                      FACECAM
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click anywhere on the 16:9 source monitor to reposition the active{" "}
                  <strong className="text-[#0F172A] dark:text-slate-200">
                    {activeCropTarget === "facecam" ? "Facecam" : "Gameplay"}
                  </strong>{" "}
                  crop box. Coordinates export directly to FFmpeg.
                </p>
              </>
            )}

            {/* 6 Vertical Layout Template Selector */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <LayoutIcon className="w-3.5 h-3.5" />
                <span>VERTICAL FORMAT TEMPLATE</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map((tpl) => {
                  const active = layout.template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() =>
                        commitEdit((curr) => ({
                          ...curr,
                          layout: { ...curr.layout, template: tpl.id },
                        }))
                      }
                      className={`p-2 rounded-sm border text-left transition-colors ${
                        active
                          ? "border-[#E1392B] bg-[#E1392B]/10 text-[#0F172A] dark:text-[#F1F5F9]"
                          : "border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="text-xs font-semibold">{tpl.label}</div>
                      <div className="text-[10px] opacity-75 truncate">{tpl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {uiMode === "advanced" && (
              /* Hardware-Style LUFS Broadcast Audio Meter */
              <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>LOUDNORM METER</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {liveLufs} LUFS · {layout.truePeakDb.toFixed(1)} dBTP
                  </span>
                </div>
                <div className="h-2.5 rounded-xs bg-slate-200 dark:bg-[#141720] border border-[#D9DEE7] dark:border-[#252A36] p-[1px] flex gap-[2px]">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const threshold = isPlaying ? 17 + Math.round(Math.sin(currentTime * 7 + i * 0.2) * 3) : 16;
                    const lit = i < threshold;
                    const color = i >= 21 ? "bg-rose-500" : i >= 17 ? "bg-amber-500" : "bg-emerald-500";
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-full ${lit ? color : "bg-slate-300/60 dark:bg-slate-800/80"}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Director Clip Health Readout (Engagement Parity · A/V Sync · Metadata Completeness) */}
            <div className="pt-2.5 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>CLIP HEALTH · AI DIRECTOR</span>
                </div>
                <button
                  type="button"
                  disabled={isCalculatingHealth}
                  onClick={() => void onCalculateClipHealth(clip.id)}
                  className="text-[11px] font-mono text-[#E1392B] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {isCalculatingHealth ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>{isCalculatingHealth ? "Scoring..." : "Recalculate"}</span>
                </button>
              </div>

              {clip.clipHealth ? (
                <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-mono text-2xl font-bold tabular-nums leading-none ${
                          clip.clipHealth.overall >= 85
                            ? "text-emerald-600 dark:text-emerald-400"
                            : clip.clipHealth.overall >= 70
                              ? "text-sky-600 dark:text-sky-400"
                              : clip.clipHealth.overall >= 50
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {clip.clipHealth.overall}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">/100</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#0F172A] dark:text-[#F1F5F9]">
                      {clip.clipHealth.grade}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(
                      [
                        { label: "Engagement Parity", value: clip.clipHealth.engagementParity },
                        { label: "A/V Sync Quality", value: clip.clipHealth.audioVideoSync },
                        { label: "Metadata Completeness", value: clip.clipHealth.metadataCompleteness },
                      ] as const
                    ).map((metric) => {
                      const barColor =
                        metric.value >= 80
                          ? "bg-emerald-500"
                          : metric.value >= 60
                            ? "bg-amber-500"
                            : "bg-rose-500";
                      return (
                        <div key={metric.label} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-600 dark:text-slate-300">{metric.label}</span>
                            <span className="font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                              {metric.value}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-xs bg-slate-200 dark:bg-[#0A0B0E] overflow-hidden">
                            <div
                              style={{ width: `${Math.max(4, Math.min(100, metric.value))}%` }}
                              className={`h-full ${barColor} transition-all`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#ECEFF3] dark:border-[#222631] space-y-1 text-[11px]">
                    <p className="text-slate-600 dark:text-slate-300 leading-snug">
                      {clip.clipHealth.summary}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-[10px] text-[#E1392B] uppercase mr-1">Next:</span>
                      {clip.clipHealth.recommendedAction}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-sm border border-dashed border-[#D9DEE7] dark:border-[#252A36] text-[11px] text-slate-500">
                  Run AI Director to score engagement parity, audio-video sync quality, and metadata completeness.
                </div>
              )}
            </div>
          </div>

          {/* Monitor 2: 9:16 Live Program Output Canvas */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>PROGRAM · 1080×1920</span>
              <button
                type="button"
                onClick={() =>
                  commitEdit((curr) => ({
                    ...curr,
                    layout: { ...curr.layout, showSafeZones: !curr.layout.showSafeZones },
                  }))
                }
                className={`inline-flex items-center gap-1 ${layout.showSafeZones ? "text-[#E1392B]" : ""}`}
              >
                <Eye className="w-3 h-3" />
                <span>{layout.showSafeZones ? "Safe Zones On" : "Safe Zones Off"}</span>
              </button>
            </div>

            <div className="rounded-sm overflow-hidden border border-[#D9DEE7] dark:border-[#252A36] bg-black shadow-xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-[248px] sm:w-[270px] aspect-[9/16] block"
              />
            </div>

            {/* Hardware Transport Strip */}
            <div className="w-full max-w-[270px] mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Stop" : "Play"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  aria-label="Rewind to zero"
                  className="h-8 w-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] text-slate-600 dark:text-slate-300 flex items-center justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-mono text-xs tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                {formatTimecode(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Precision NLE Inspector Rack */}
        <div
          className={`${
            uiMode === "easy" ? "xl:col-span-6" : "xl:col-span-5"
          } bg-white dark:bg-[#0D0F14] flex flex-col`}
        >
          <div className="px-4 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center gap-4 overflow-x-auto">
            {(
              [
                { id: "voiceover", label: clip.voiceover ? "Voiceover ✓" : "Voiceover Engine" },
                { id: "hooks", label: `Hooks & Retention (${clip.hookVariants?.length || 0})` },
                { id: "captions", label: `Captions (${captions.length})` },
                { id: "frame", label: "Frame & Brand" },
                { id: "notes", label: `Review (${reviewNotes.length})` },
                ...(uiMode === "advanced"
                  ? ([
                      { id: "audio", label: "Audio & Music" },
                      { id: "export", label: "FFmpeg / Subs" },
                    ] as const)
                  : []),
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id)}
                className={`relative py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  inspectorTab === tab.id
                    ? "text-[#0F172A] dark:text-[#F1F5F9]"
                    : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                {inspectorTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5 flex-1 overflow-y-auto max-h-[540px]">
            {inspectorTab === "voiceover" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#E1392B]" />
                      <span>AI Voiceover Engine (Gemini TTS)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose a voice profile, draft a punchy script, and synthesize a broadcast-ready 24kHz .WAV narration track.
                    </p>
                  </div>
                </div>

                {/* AI Voice Profile Selector */}
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] text-slate-500">SELECT AI VOICE PROFILE</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {VOICE_PROFILES.map((vp) => {
                      const active = voVoice === vp.id;
                      return (
                        <button
                          key={vp.id}
                          type="button"
                          onClick={() => {
                            setVoVoice(vp.id);
                            setVoStyle(vp.defaultStyle);
                          }}
                          className={`p-2.5 rounded-sm border text-left transition-colors ${
                            active
                              ? "border-[#E1392B] bg-[#E1392B]/10 text-[#0F172A] dark:text-[#F1F5F9]"
                              : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720] text-slate-600 dark:text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span>{vp.name}</span>
                            {active && <span className="font-mono text-[10px] text-[#E1392B]">ACTIVE</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{vp.role}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Style & Ducking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Delivery Style / Pace</label>
                    <input
                      type="text"
                      value={voStyle}
                      onChange={(e) => setVoStyle(e.target.value)}
                      placeholder="Fast, hype short-form narrator"
                      className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">Duck Original Audio</span>
                      <span className="font-mono tabular-nums">{voDuckDb} dB</span>
                    </div>
                    <input
                      type="range"
                      min={-24}
                      max={0}
                      step={1}
                      value={voDuckDb}
                      onChange={(e) => setVoDuckDb(Number(e.target.value))}
                      className="w-full nle-slider"
                    />
                  </div>
                </div>

                {/* Broadcast Loudness Compliance (-14 LUFS) & Pro Audio Mastering */}
                <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/80 dark:bg-[#111318] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#E1392B]" />
                        <span>Loudness Compliance ({voTargetLufs} LUFS)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Auto-normalizes the synthesized .WAV to {voTargetLufs} LUFS with a -1.0 dBTP true-peak limiter for YT Shorts, TikTok &amp; IG Reels broadcast specs.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={voLoudnessCompliance}
                      onClick={() => setVoLoudnessCompliance((prev) => !prev)}
                      className={`shrink-0 h-6 px-2.5 rounded-sm font-mono text-[10px] font-semibold border transition-colors ${
                        voLoudnessCompliance
                          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] text-slate-500"
                      }`}
                    >
                      {voLoudnessCompliance ? `ON · ${voTargetLufs} LUFS` : "OFF (RAW)"}
                    </button>
                  </div>

                  {/* Target LUFS Platform Standard Selector */}
                  {voLoudnessCompliance && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { lufs: -14, label: "-14 LUFS", sub: "YT / TikTok / Reels" },
                        { lufs: -11, label: "-11 LUFS", sub: "High-Impact Feed" },
                        { lufs: -16, label: "-16 LUFS", sub: "Podcast / Stereo" },
                      ].map((preset) => (
                        <button
                          key={preset.lufs}
                          type="button"
                          onClick={() => setVoTargetLufs(preset.lufs)}
                          className={`px-2 py-1.5 rounded-sm border text-left transition-colors ${
                            voTargetLufs === preset.lufs
                              ? "border-[#E1392B] bg-[#E1392B]/10 text-[#0F172A] dark:text-[#F1F5F9]"
                              : "border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] text-slate-500"
                          }`}
                        >
                          <div className="font-mono text-[11px] font-bold tabular-nums">{preset.label}</div>
                          <div className="text-[9px] truncate">{preset.sub}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Companion Broadcast Audio Mastering Toggles */}
                  <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">BROADCAST DSP CHAIN</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-slate-500">PACE</span>
                        {[0.95, 1.0, 1.1, 1.2].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setVoPace(spd)}
                            className={`px-1.5 py-0.5 rounded-sm font-mono text-[10px] border tabular-nums ${
                              voPace === spd
                                ? "border-[#E1392B] bg-[#E1392B]/10 text-[#E1392B] font-semibold"
                                : "border-[#D9DEE7] dark:border-[#252A36] text-slate-500"
                            }`}
                          >
                            {spd.toFixed(spd === 1 ? 1 : 2)}×
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] cursor-pointer">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">80Hz De-Rumble</span>
                        <input
                          type="checkbox"
                          checked={voHighPassHz > 0}
                          onChange={(e) => setVoHighPassHz(e.target.checked ? 80 : 0)}
                          className="accent-[#E1392B]"
                        />
                      </label>
                      <label className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] cursor-pointer">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">Vocal Presence EQ</span>
                        <input
                          type="checkbox"
                          checked={voPresenceEq}
                          onChange={(e) => setVoPresenceEq(e.target.checked)}
                          className="accent-[#E1392B]"
                        />
                      </label>
                      <label className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] cursor-pointer">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">Sibilance De-Esser</span>
                        <input
                          type="checkbox"
                          checked={voDeEsser}
                          onChange={(e) => setVoDeEsser(e.target.checked)}
                          className="accent-[#E1392B]"
                        />
                      </label>
                      <label className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#161922] cursor-pointer">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">Trim Dead-Air</span>
                        <input
                          type="checkbox"
                          checked={voBreathTrim}
                          onChange={(e) => setVoBreathTrim(e.target.checked)}
                          className="accent-[#E1392B]"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Narration Script Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-mono text-[10px] text-slate-500">NARRATION SCRIPT</label>
                    <button
                      type="button"
                      disabled={isDraftingScript}
                      onClick={async () => {
                        const drafted = await onDraftVoiceoverScript(clip.id, voStyle || "punchy storyteller");
                        if (drafted) setVoScript(drafted);
                      }}
                      className="text-[11px] font-medium text-[#E1392B] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {isDraftingScript ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{isDraftingScript ? "Drafting..." : "AI Draft Script"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={voScript}
                    onChange={(e) => setVoScript(e.target.value)}
                    placeholder="Write or AI-draft a 40–60 word voiceover track for this clip..."
                    className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  disabled={isGeneratingVoiceover || !voScript.trim()}
                  onClick={() =>
                    onGenerateVoiceover(clip.id, {
                      voiceName: voVoice,
                      style: voStyle,
                      script: voScript,
                      duckOriginalDb: voDuckDb,
                      loudnessCompliance: voLoudnessCompliance,
                      targetLufs: voTargetLufs,
                      highPassHz: voHighPassHz,
                      voicePresenceEq: voPresenceEq,
                      deEsserEnabled: voDeEsser,
                      breathTrimEnabled: voBreathTrim,
                      paceMultiplier: voPace,
                    })
                  }
                  className="w-full h-9 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  {isGeneratingVoiceover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isGeneratingVoiceover
                      ? `Mastering 24kHz .WAV (${voLoudnessCompliance ? `${voTargetLufs} LUFS` : "Raw"})...`
                      : `Generate ${voLoudnessCompliance ? `${voTargetLufs} LUFS ` : ""}Voiceover with ${voVoice}`}
                  </span>
                </button>

                {/* Generated Voiceover Audio Player + Verified Broadcast Compliance Telemetry */}
                {clip.voiceover && (
                  <div className="p-3 rounded-sm border border-emerald-500/35 bg-emerald-500/5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ACTIVE TRACK · {clip.voiceover.voiceName} ({clip.voiceover.durationEstSec}s)
                      </span>
                      <a
                        href={clip.voiceover.audioUrl}
                        download={`${clip.id}_${clip.voiceover.voiceName}.wav`}
                        className="font-mono text-[#E1392B] hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>.WAV</span>
                      </a>
                    </div>
                    <audio controls src={clip.voiceover.audioUrl} className="w-full h-8" />

                    {/* Broadcast Loudness Compliance Meter Readout */}
                    {typeof clip.voiceover.measuredLufs === "number" && (
                      <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white/80 dark:bg-[#111318] space-y-1.5 font-mono text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {clip.voiceover.compliancePassed
                                ? "BROADCAST COMPLIANT"
                                : clip.voiceover.loudnessCompliance
                                  ? "NORMALIZED"
                                  : "RAW UNNORMALIZED"}
                            </span>
                          </span>
                          <span className="tabular-nums text-slate-600 dark:text-slate-300">
                            {clip.voiceover.measuredLufs.toFixed(1)} LUFS · {clip.voiceover.truePeakDbTp?.toFixed(1) ?? "-1.0"} dBTP
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-500">
                          <span>{clip.voiceover.platformSpec || "YT Shorts / TikTok / IG Reels (-14 LUFS)"}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            YT Shorts ✓ · TikTok ✓ · IG Reels ✓
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-slate-500">
                      Original audio ducked {clip.voiceover.duckOriginalDb} dB · Pace {(clip.voiceover.paceMultiplier ?? 1).toFixed(2)}× · {clip.voiceover.style}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inspectorTab === "frame" && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500">Facecam Split %</span>
                      <span className="font-mono tabular-nums">{layout.facecamHeightPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={22}
                      max={60}
                      value={layout.facecamHeightPercent}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, facecamHeightPercent: Number(e.target.value) } }))
                      }
                      className="w-full nle-slider"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500">Facecam Zoom</span>
                      <span className="font-mono tabular-nums">{layout.facecamZoom.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={layout.facecamZoom}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, facecamZoom: Number(e.target.value) } }))
                      }
                      className="w-full nle-slider"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500">Gameplay Zoom</span>
                      <span className="font-mono tabular-nums">{layout.gameplayZoom.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={1.8}
                      step={0.05}
                      value={layout.gameplayZoom}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, gameplayZoom: Number(e.target.value) } }))
                      }
                      className="w-full nle-slider"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-500">Hook Slice (sec)</span>
                      <span className="font-mono tabular-nums">{layout.hookDurationSec.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={1.5}
                      max={5}
                      step={0.5}
                      value={layout.hookDurationSec}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, hookDurationSec: Number(e.target.value) } }))
                      }
                      className="w-full nle-slider"
                    />
                  </div>
                </div>

                {/* Brand Kit & End-Card CTA */}
                <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3">
                  <div className="font-mono text-[11px] text-slate-500">BRAND WATERMARK &amp; LOOP END-CARD</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Channel Watermark</label>
                      <input
                        type="text"
                        value={layout.watermarkHandle}
                        onChange={(e) =>
                          commitEdit((c) => ({ ...c, layout: { ...c.layout, watermarkHandle: e.target.value } }))
                        }
                        className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">End-Card CTA (Last 1.8s)</label>
                      <input
                        type="text"
                        value={layout.endCardCta}
                        onChange={(e) =>
                          commitEdit((c) => ({ ...c, layout: { ...c.layout, endCardCta: e.target.value } }))
                        }
                        className="w-full h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center justify-between pt-1 cursor-pointer">
                    <span className="text-slate-600 dark:text-slate-300">Mask right-rail Twitch chat box</span>
                    <input
                      type="checkbox"
                      checked={layout.maskChatRegion}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, maskChatRegion: e.target.checked } }))
                      }
                      className="accent-[#E1392B]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-600 dark:text-slate-300">Prepend peak 3-second hook at 00:00</span>
                    <input
                      type="checkbox"
                      checked={layout.prependPeakHook}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, prependPeakHook: e.target.checked } }))
                      }
                      className="accent-[#E1392B]"
                    />
                  </label>
                </div>
              </div>
            )}

            {inspectorTab === "hooks" && (
              <div className="space-y-4 text-xs">
                {/* 3-Second Hook Grader & Predicted Retention Curve (Beats OpusClip mid-sentence chop) */}
                <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/70 dark:bg-[#141720] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#E1392B]" />
                        <span>3-Second Hook Grader &amp; Predicted Retention Curve</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Grades 0–3s scroll-stop power + Story Arc Completeness to prevent mid-sentence chops.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isGradingHook}
                      onClick={() => onGradeHookRetention(clip.id)}
                      className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      {isGradingHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />}
                      <span>{isGradingHook ? "Grading..." : clip.hookGrade ? "Re-Grade" : "Grade Hook"}</span>
                    </button>
                  </div>

                  {clip.hookGrade ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center font-mono">
                        <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]">
                          <div className="text-[10px] text-slate-500">OVERALL</div>
                          <div className={`text-base font-bold tabular-nums ${clip.hookGrade.overallScore >= 80 ? "text-emerald-500" : "text-amber-500"}`}>
                            {clip.hookGrade.overallScore}
                          </div>
                        </div>
                        <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]">
                          <div className="text-[10px] text-slate-500">STORY ARC</div>
                          <div className="text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                            {clip.hookGrade.storyArcScore}
                          </div>
                        </div>
                        <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]">
                          <div className="text-[10px] text-slate-500">PACING</div>
                          <div className="text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                            {clip.hookGrade.pacingScore}
                          </div>
                        </div>
                        <div className="p-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]">
                          <div className="text-[10px] text-slate-500">CAPTIONS</div>
                          <div className="text-base font-bold tabular-nums text-[#0F172A] dark:text-[#F1F5F9]">
                            {clip.hookGrade.captionScore}
                          </div>
                        </div>
                      </div>

                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={clip.hookGrade.retentionCurve} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#252A36" opacity={0.35} />
                            <XAxis
                              dataKey="sec"
                              tickFormatter={(v) => `${v}s`}
                              tick={{ fontSize: 10, fill: "#94A3B8" }}
                            />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0D0F14",
                                borderColor: "#252A36",
                                fontSize: "11px",
                              }}
                              formatter={(val: unknown) => [`${val}% held`, "Predicted Retention"]}
                              labelFormatter={(sec) => `At ${sec}s`}
                            />
                            <Area
                              type="monotone"
                              dataKey="retentionPct"
                              stroke="#E1392B"
                              strokeWidth={2}
                              fill="#E1392B"
                              fillOpacity={0.18}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{clip.hookGrade.verdict}:</span>{" "}
                        {clip.hookGrade.fixSummary}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D9DEE7] dark:border-[#222631]">
                        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[260px]">
                          Fix: &ldquo;{clip.hookGrade.suggestedHookBanner}&rdquo; @{clip.hookGrade.suggestedHookStartSec}s
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTime(0.4);
                            commitEdit((c) => ({
                              ...c,
                              layout: {
                                ...c.layout,
                                hookBannerText: clip.hookGrade!.suggestedHookBanner,
                                hookStartSec: clip.hookGrade!.suggestedHookStartSec,
                                showHookBanner: true,
                                prependPeakHook: true,
                              },
                            }));
                            onNotify?.("success", "Applied AI Hook Grader fix to canvas.");
                          }}
                          className="h-7 px-2.5 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold"
                        >
                          1-Click Apply Fix
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      Run the Gemini Hook Grader to forecast 0s–30s audience drop-off and get an automatic banner + start-time repair.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">A/B/C Viral Hook Lab</div>
                    <p className="text-[11px] text-slate-500">Test 3 opening hook banners + timestamps live on canvas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGenerateHooks(clip.id)}
                    disabled={generatingHooksClipId === clip.id}
                    className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {generatingHooksClipId === clip.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>Generate 3 Variants ({hotkeys["generate-hook"]})</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500">Active 0–3s Banner Text</label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layout.showHookBanner}
                        onChange={(e) =>
                          commitEdit((c) => ({ ...c, layout: { ...c.layout, showHookBanner: e.target.checked } }))
                        }
                        className="accent-[#E1392B]"
                      />
                      <span>Show Banner</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={layout.hookBannerText}
                    onChange={(e) =>
                      commitEdit((c) => ({ ...c, layout: { ...c.layout, hookBannerText: e.target.value } }))
                    }
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] font-display font-bold uppercase tracking-wide"
                  />
                </div>

                <div className="space-y-2">
                  {(clip.hookVariants || []).length === 0 ? (
                    <div className="p-4 border border-dashed border-[#D9DEE7] dark:border-[#252A36] rounded-sm text-center text-slate-500">
                      Click &ldquo;Generate 3 Variants&rdquo; to have Gemini craft 3 competing retention hooks.
                    </div>
                  ) : (
                    clip.hookVariants.map((hv) => {
                      const active = layout.hookBannerText === hv.bannerText;
                      return (
                        <button
                          key={hv.id}
                          type="button"
                          onClick={() => {
                            setCurrentTime(0.5);
                            commitEdit((c) => ({
                              ...c,
                              layout: {
                                ...c.layout,
                                hookBannerText: hv.bannerText,
                                hookStartSec: hv.hookStartSec,
                                showHookBanner: true,
                                prependPeakHook: true,
                              },
                            }));
                          }}
                          className={`w-full p-3 rounded-sm border text-left space-y-1 transition-colors ${
                            active
                              ? "border-[#E1392B] bg-[#E1392B]/10"
                              : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720] hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{hv.label}</span>
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                              {hv.predictedHoldLift} · @{hv.hookStartSec.toFixed(1)}s
                            </span>
                          </div>
                          <div className="font-display font-bold text-[#E1392B]">{hv.bannerText}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{hv.angle}</div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Live Web Audio SFX Triggers */}
                <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">
                      AUDITION &amp; DROP SFX AT PLAYHEAD ({currentTime.toFixed(1)}s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["riser", "bass-drop", "whoosh", "camera-click", "glitch-cut"] as SfxKind[]).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => handleAddSfx(kind)}
                        className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] hover:border-[#E1392B] font-mono text-[11px] inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3 text-[#E1392B]" />
                        <span>+ {kind}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inspectorTab === "audio" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-slate-500">BROADCAST LOUDNESS (FFMPEG LOUDNORM)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => commitEdit((c) => ({ ...c, layout: { ...c.layout, targetLufs: -11 } }))}
                      className={`p-2.5 rounded-sm border text-left ${
                        layout.targetLufs === -11
                          ? "border-[#E1392B] bg-[#E1392B]/10"
                          : "border-[#D9DEE7] dark:border-[#252A36]"
                      }`}
                    >
                      <div className="font-mono font-semibold">-11 LUFS</div>
                      <div className="text-[11px] text-slate-500">TikTok / Reels punchy master</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => commitEdit((c) => ({ ...c, layout: { ...c.layout, targetLufs: -14 } }))}
                      className={`p-2.5 rounded-sm border text-left ${
                        layout.targetLufs === -14
                          ? "border-[#E1392B] bg-[#E1392B]/10"
                          : "border-[#D9DEE7] dark:border-[#252A36]"
                      }`}
                    >
                      <div className="font-mono font-semibold">-14 LUFS</div>
                      <div className="text-[11px] text-slate-500">YouTube Shorts broadcast spec</div>
                    </button>
                  </div>
                </div>

                {/* Silence Removal */}
                <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Auto Dead-Air Silence Removal</div>
                      <div className="text-[11px] text-slate-500">Trims pauses &gt;0.45s below {layout.silenceThresholdDb} dB</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.removeSilence}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, removeSilence: e.target.checked } }))
                      }
                      className="accent-[#E1392B]"
                    />
                  </label>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">Silence Threshold</span>
                      <span className="font-mono tabular-nums">{layout.silenceThresholdDb} dB</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={-24}
                      value={layout.silenceThresholdDb}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, silenceThresholdDb: Number(e.target.value) } }))
                      }
                      className="w-full nle-slider"
                    />
                  </div>
                </div>

                {/* 3-Channel Audio & Music Bed Mixer */}
                <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-[#E1392B]" />
                      <span>3-CHANNEL AUDIO &amp; MUSIC BED MIXER</span>
                    </span>
                    <button
                      type="button"
                      disabled={(layout.musicBedId || "none") === "none"}
                      onClick={() => previewMusicBed(layout.musicBedId || "cinematic-pulse")}
                      className="text-[11px] font-mono text-[#E1392B] hover:underline disabled:opacity-40"
                    >
                      Audition Bed
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {MUSIC_BEDS.map((bed) => {
                      const active = (layout.musicBedId || "none") === bed.id;
                      return (
                        <button
                          key={bed.id}
                          type="button"
                          onClick={() => {
                            commitEdit((c) => ({ ...c, layout: { ...c.layout, musicBedId: bed.id } }));
                            if (bed.id !== "none") previewMusicBed(bed.id);
                          }}
                          className={`p-2 rounded-sm border text-left transition-colors ${
                            active
                              ? "border-[#E1392B] bg-[#E1392B]/10"
                              : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720]"
                          }`}
                        >
                          <div className="font-semibold text-[11px] flex items-center justify-between">
                            <span>{bed.label}</span>
                            <span className="font-mono text-[9px] text-slate-500">{bed.bpm}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{bed.mood}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Original</span>
                        <span className="font-mono tabular-nums">{layout.originalAudioGainDb ?? -4} dB</span>
                      </div>
                      <input
                        type="range"
                        min={-24}
                        max={6}
                        value={layout.originalAudioGainDb ?? -4}
                        onChange={(e) =>
                          commitEdit((c) => ({
                            ...c,
                            layout: { ...c.layout, originalAudioGainDb: Number(e.target.value) },
                          }))
                        }
                        className="w-full nle-slider"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Voiceover</span>
                        <span className="font-mono tabular-nums">{layout.voiceoverGainDb ?? 0} dB</span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={6}
                        value={layout.voiceoverGainDb ?? 0}
                        onChange={(e) =>
                          commitEdit((c) => ({
                            ...c,
                            layout: { ...c.layout, voiceoverGainDb: Number(e.target.value) },
                          }))
                        }
                        className="w-full nle-slider"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Music Bed</span>
                        <span className="font-mono tabular-nums">{layout.musicBedGainDb ?? -18} dB</span>
                      </div>
                      <input
                        type="range"
                        min={-36}
                        max={-4}
                        value={layout.musicBedGainDb ?? -18}
                        onChange={(e) =>
                          commitEdit((c) => ({
                            ...c,
                            layout: { ...c.layout, musicBedGainDb: Number(e.target.value) },
                          }))
                        }
                        className="w-full nle-slider"
                      />
                    </div>
                  </div>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Studio Voice EQ &amp; Presence Boost</div>
                      <div className="text-[11px] text-slate-500">Applies 80Hz high-pass + 3.5kHz clarity shelf for phone speakers</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(layout.studioVoiceEq)}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, studioVoiceEq: e.target.checked } }))
                      }
                      className="accent-[#E1392B]"
                    />
                  </label>
                </div>

                {/* DMCA Music Guardrail */}
                <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>DMCA AUDIO PROTECTION</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAuditClip(clip.id)}
                      disabled={auditingClipId === clip.id}
                      className="text-[11px] text-[#E1392B] font-medium inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{auditingClipId === clip.id ? "Scanning..." : "Scan DMCA"}</span>
                    </button>
                  </div>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">Vocal Stem Isolation (Strip Music)</div>
                      <div className="text-[11px] text-slate-500">Applies FFmpeg vocal bandpass &amp; FFT denoise to strip car radio/Spotify</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.isolateVocalsDmca}
                      onChange={(e) =>
                        commitEdit((c) => ({ ...c, layout: { ...c.layout, isolateVocalsDmca: e.target.checked } }))
                      }
                      className="accent-[#E1392B]"
                    />
                  </label>

                  {clip.qaResult?.dmcaNote && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Audit note: {clip.qaResult.dmcaNote}
                    </p>
                  )}
                </div>
              </div>
            )}

            {inspectorTab === "captions" && (
              <div className="space-y-3 text-xs">
                {/* Submagic-Better Caption Finisher Controls */}
                <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/70 dark:bg-[#141720] space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1">CAPTION ENGINE</label>
                      <select
                        value={layout.captionStyle}
                        onChange={(e) =>
                          commitEdit((c) => ({ ...c, layout: { ...c.layout, captionStyle: e.target.value as CaptionStylePreset } }))
                        }
                        className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]"
                      >
                        <option value="kinetic-highlight">Kinetic Highlight</option>
                        <option value="bold-clean">Bold Clean</option>
                        <option value="minimal-lower">Minimal Lower Third</option>
                        <option value="broadcast-lower">Broadcast Lower-Third</option>
                        <option value="arcade-pop">Arcade Pop</option>
                        <option value="comic-impact">Comic Impact</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1">FONT STYLE</label>
                      <select
                        value={layout.captionFont || "jakarta"}
                        onChange={(e) =>
                          commitEdit((c) => ({ ...c, layout: { ...c.layout, captionFont: e.target.value as CaptionFontFamily } }))
                        }
                        className="w-full h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]"
                      >
                        {CAPTION_FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-500">ACCENT:</span>
                      {ACCENT_SWATCHES.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            commitEdit((c) => ({ ...c, layout: { ...c.layout, captionHighlightColor: hex } }))
                          }
                          aria-label={`Set caption highlight color ${hex}`}
                          style={{ backgroundColor: hex }}
                          className={`w-4 h-4 rounded-xs border ${
                            (layout.captionHighlightColor || "#E1392B") === hex
                              ? "border-white ring-1 ring-[#E1392B]"
                              : "border-slate-500/40"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] text-slate-500">BANNER:</span>
                      {(["top", "upper-third", "center", "lower"] as HookBannerPosition[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() =>
                            commitEdit((c) => ({ ...c, layout: { ...c.layout, hookBannerPosition: pos } }))
                          }
                          className={`h-6 px-1.5 rounded-xs font-mono text-[10px] capitalize ${
                            (layout.hookBannerPosition || "top") === pos
                              ? "bg-[#E1392B] text-white"
                              : "border border-[#D9DEE7] dark:border-[#252A36] text-slate-500"
                          }`}
                        >
                          {pos === "upper-third" ? "Upper" : pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#D9DEE7] dark:border-[#222631]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleInjectAllEmojis}
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14] hover:border-[#E1392B] inline-flex items-center gap-1 text-[11px]"
                      >
                        <Smile className="w-3 h-3 text-amber-500" />
                        <span>Auto-Emoji</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleApplySlangDictionary}
                        title="Fixes misheard gaming/tech proper nouns using your Settings Slang Dictionary"
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14] hover:border-[#E1392B] inline-flex items-center gap-1 text-[11px]"
                      >
                        <BookOpen className="w-3 h-3 text-[#E1392B]" />
                        <span>Apply Slang Fix ({slangDictionary.length})</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleBladeSplit}
                        title={`Split active caption at playhead (${hotkeys["blade-split"]})`}
                        className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] inline-flex items-center gap-1 text-[11px]"
                      >
                        <Scissors className="w-3 h-3 text-[#E1392B]" />
                        <span>Blade ({hotkeys["blade-split"]})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const lastEnd = captions.length > 0 ? captions[captions.length - 1].endSec : 0;
                          commitEdit((c) => ({
                            ...c,
                            captions: [
                              ...c.captions,
                              {
                                id: `cap_${Date.now().toString(36)}`,
                                startSec: Number(lastEnd.toFixed(1)),
                                endSec: Number(Math.min(totalDuration, lastEnd + 3.5).toFixed(1)),
                                text: "New caption line...",
                              },
                            ],
                          }));
                        }}
                        className="h-7 px-2 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Line</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {captions.map((seg) => (
                    <div
                      key={seg.id}
                      onClick={() => setCurrentTime(seg.startSec + 0.1)}
                      className="p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720] space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step={0.5}
                            value={seg.startSec}
                            onChange={(e) =>
                              commitEdit((c) => ({
                                ...c,
                                captions: c.captions.map((x) =>
                                  x.id === seg.id ? { ...x, startSec: Number(e.target.value) } : x
                                ),
                              }))
                            }
                            className="w-14 h-6 px-1.5 rounded-xs border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0A0B0E]"
                          />
                          <span>–</span>
                          <input
                            type="number"
                            step={0.5}
                            value={seg.endSec}
                            onChange={(e) =>
                              commitEdit((c) => ({
                                ...c,
                                captions: c.captions.map((x) =>
                                  x.id === seg.id ? { ...x, endSec: Number(e.target.value) } : x
                                ),
                              }))
                            }
                            className="w-14 h-6 px-1.5 rounded-xs border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0A0B0E]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={seg.emphasisWord || ""}
                            placeholder="Accent word"
                            onChange={(e) =>
                              commitEdit((c) => ({
                                ...c,
                                captions: c.captions.map((x) =>
                                  x.id === seg.id ? { ...x, emphasisWord: e.target.value } : x
                                ),
                              }))
                            }
                            className="w-24 h-6 px-1.5 rounded-xs border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0A0B0E] text-[#E1392B]"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              commitEdit((c) => ({
                                ...c,
                                captions: c.captions.filter((x) => x.id !== seg.id),
                              }));
                            }}
                            aria-label="Remove caption"
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={seg.text}
                        onChange={(e) =>
                          commitEdit((c) => ({
                            ...c,
                            captions: c.captions.map((x) => (x.id === seg.id ? { ...x, text: e.target.value } : x)),
                          }))
                        }
                        className="w-full h-7 px-2 rounded-xs border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0A0B0E] text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectorTab === "notes" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#E1392B]" />
                      <span>Timestamped Frame Review Notes</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pin frame-accurate notes at playhead ({formatTimecode(currentTime)}) or press {hotkeys["add-review-note"]}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportReviewBrief}
                    className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#141720] hover:border-[#E1392B] font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-[#E1392B]" />
                    <span>Export Brief (.md)</span>
                  </button>
                </div>

                <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/70 dark:bg-[#141720] space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newNoteAuthor}
                      onChange={(e) => setNewNoteAuthor(e.target.value)}
                      placeholder="Reviewer"
                      className="h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]"
                    />
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleAddManualReviewNote();
                      }}
                      placeholder={`Note at ${formatTimecode(currentTime)} (e.g. tighten cut by 0.5s)...`}
                      className="col-span-2 h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#0D0F14]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!newNoteText.trim()}
                    onClick={() => void handleAddManualReviewNote()}
                    className="w-full h-8 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-40 text-white font-semibold"
                  >
                    Pin Note at {formatTimecode(currentTime)}
                  </button>
                </div>

                {reviewNotes.length === 0 ? (
                  <div className="p-5 text-center border border-dashed border-[#D9DEE7] dark:border-[#252A36] rounded-sm text-slate-500">
                    No frame notes pinned yet. Scrub the timeline and drop a timestamped review marker.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviewNotes
                      .slice()
                      .sort((a, b) => a.timeSec - b.timeSec)
                      .map((note) => (
                        <div
                          key={note.id}
                          className={`p-2.5 rounded-sm border flex items-start justify-between gap-2 ${
                            note.resolved
                              ? "border-emerald-500/30 bg-emerald-500/5 opacity-75"
                              : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#141720]"
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => setCurrentTime(note.timeSec)}
                                className="text-[#E1392B] font-semibold hover:underline"
                              >
                                @{formatTimecode(note.timeSec)}
                              </button>
                              <span className="text-slate-500">· {note.author}</span>
                              {note.resolved && <span className="text-emerald-500">RESOLVED</span>}
                            </div>
                            <div className={note.resolved ? "line-through text-slate-500" : "text-[#0F172A] dark:text-[#F1F5F9]"}>
                              {note.text}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handleToggleNoteResolved(note.id)}
                              title="Toggle resolved"
                              className="h-7 w-7 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteNote(note.id)}
                              title="Delete note"
                              className="h-7 w-7 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] flex items-center justify-center text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {inspectorTab === "export" && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-500">MULTI-FORMAT SUBTITLES</span>
                  <div className="flex items-center gap-1.5">
                    {(["ass", "srt", "vtt"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => downloadSubtitle(fmt)}
                        className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] font-mono uppercase hover:border-[#E1392B]"
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">EXACT FFMPEG RENDER GRAPH</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ffmpegCommand);
                        setCopiedFfmpeg(true);
                        setTimeout(() => setCopiedFfmpeg(false), 1600);
                      }}
                      className="h-7 px-2.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-medium inline-flex items-center gap-1"
                    >
                      {copiedFfmpeg ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFfmpeg ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-sm bg-[#0A0B0E] text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#222631]">
                    <code>{ffmpegCommand}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom NLE Multi-Track Swimlane Timeline (Shown in Pro/Advanced Mode) */}
      {uiMode === "advanced" && (
        <div className="flex-1 bg-white dark:bg-[#0D0F14] p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">TIMELINE</span>
              <span>{hotkeys["play-pause"]} Play</span>
              <span>{hotkeys["trim-to-selection"]} Trim</span>
              <span>{hotkeys["generate-hook"]} Hook</span>
              <span>{hotkeys["blade-split"]} Blade</span>
              <span>{hotkeys["send-to-queue"]} Queue</span>
              <span>{hotkeys["add-review-note"]} Note</span>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <span>HOOK: {layout.hookStartSec.toFixed(1)}s–{(layout.hookStartSec + layout.hookDurationSec).toFixed(1)}s</span>
              <span>TOTAL: {totalDuration.toFixed(1)}s</span>
            </div>
          </div>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const trackLeft = rect.left + 84;
              const trackW = Math.max(100, rect.width - 84);
              const ratio = Math.max(0, Math.min(1, (e.clientX - trackLeft) / trackW));
              setCurrentTime(Number((ratio * totalDuration).toFixed(1)));
            }}
            className="relative border border-[#D9DEE7] dark:border-[#222631] rounded-sm bg-[#F6F7F9] dark:bg-[#0A0B0E] overflow-hidden cursor-pointer select-none"
          >
            {/* Playhead Needle */}
            <div
              style={{ left: `calc(84px + (100% - 84px) * ${Math.min(1, currentTime / Math.max(1, totalDuration))})` }}
              className="absolute top-0 bottom-0 w-[2px] bg-[#E1392B] z-20 pointer-events-none"
            />

            {/* Track V1: Hook Splice + Gameplay */}
            <div className="flex items-stretch h-8 border-b border-[#D9DEE7] dark:border-[#1C2029]">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-slate-500 border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                V1 · GAME
              </div>
              <div className="flex-1 relative flex items-center px-1 gap-1">
                {layout.prependPeakHook && (
                  <div
                    style={{ width: `${(layout.hookDurationSec / totalDuration) * 100}%` }}
                    className="h-6 rounded-xs bg-[#E1392B]/90 text-white font-mono text-[10px] px-1.5 flex items-center truncate"
                  >
                    HOOK 0–{layout.hookDurationSec}s
                  </div>
                )}
                <div className="flex-1 h-6 rounded-xs bg-emerald-600/20 border border-emerald-600/40 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] px-2 flex items-center truncate">
                  {clip.title} ({layout.template})
                </div>
              </div>
            </div>

            {/* Track V2: Facecam / Watermark */}
            <div className="flex items-stretch h-7 border-b border-[#D9DEE7] dark:border-[#1C2029]">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-slate-500 border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                V2 · CAM
              </div>
              <div className="flex-1 relative flex items-center px-1">
                <div className="w-full h-5 rounded-xs bg-slate-200/80 dark:bg-[#171A21] border border-slate-300 dark:border-[#2A303E] font-mono text-[10px] text-slate-700 dark:text-slate-300 px-2 flex items-center justify-between">
                  <span>{clip.streamerHandle} facecam ({layout.facecamZoom.toFixed(1)}×)</span>
                  <span>{layout.watermarkHandle}</span>
                </div>
              </div>
            </div>

            {/* Track B1: AI B-Roll & Motion Beats */}
            <div className="flex items-stretch h-7 border-b border-[#D9DEE7] dark:border-[#1C2029]">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-blue-600 dark:text-blue-400 border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                B1 · BROLL
              </div>
              <div className="flex-1 relative">
                {(clip.brollCues || []).length === 0 ? (
                  <div className="h-full px-2 flex items-center font-mono text-[10px] text-slate-400">
                    No B-Roll beats yet — click &ldquo;AI B-Roll&rdquo; above to auto-direct cutaways
                  </div>
                ) : (
                  (clip.brollCues || []).map((cue) => {
                    const leftPct = Math.min(96, (cue.timeSec / totalDuration) * 100);
                    const widthPct = Math.max(5, (cue.durationSec / totalDuration) * 100);
                    return (
                      <div
                        key={cue.id}
                        style={{ left: `${leftPct}%`, width: `${Math.min(100 - leftPct, widthPct)}%` }}
                        title={`${cue.effect}: ${cue.label} — ${cue.promptNote}`}
                        className="absolute top-1 bottom-1 rounded-xs bg-blue-600/20 border border-blue-500/50 text-blue-800 dark:text-blue-300 px-1.5 flex items-center font-mono text-[9px] truncate"
                      >
                        {cue.label}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Track VO: Synthetic Gemini TTS Voiceover */}
            <div className="flex items-stretch h-7 border-b border-[#D9DEE7] dark:border-[#1C2029]">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-[#E1392B] border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                VO · TTS
              </div>
              <div className="flex-1 relative flex items-center px-1">
                {clip.voiceover ? (
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(22, (clip.voiceover.durationEstSec / totalDuration) * 100))}%`,
                    }}
                    className="h-5 rounded-xs bg-[#E1392B]/20 border border-[#E1392B]/50 text-[#E1392B] dark:text-rose-300 font-mono text-[10px] px-2 flex items-center justify-between truncate"
                  >
                    <span>
                      {clip.voiceover.voiceName} TTS · {clip.voiceover.durationEstSec}s (.WAV)
                    </span>
                    <span className="opacity-75">duck {clip.voiceover.duckOriginalDb}dB</span>
                  </div>
                ) : (
                  <div className="px-1 font-mono text-[10px] text-slate-400">
                    No synthetic voiceover yet — open Voiceover Engine tab above to generate a .WAV track
                  </div>
                )}
              </div>
            </div>

            {/* Track A1: Audio Waveform + Dead-Air Silence Markers + Auditionable SFX Cues */}
            <div className="flex items-stretch h-9 border-b border-[#D9DEE7] dark:border-[#1C2029]">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-slate-500 border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                A1 · {layout.targetLufs}
              </div>
              <div className="flex-1 relative flex items-end gap-[2px] px-1.5 py-1">
                {Array.from({ length: 64 }).map((_, idx) => {
                  const sec = (idx / 64) * totalDuration;
                  const isSilent = layout.removeSilence && (idx % 19 === 6 || idx % 19 === 7);
                  const inSourceHook = sec >= layout.hookStartSec && sec <= layout.hookStartSec + layout.hookDurationSec;
                  const amp = isSilent ? 14 : 26 + Math.abs(Math.sin(idx * 0.65 + clip.views * 0.001)) * 68;
                  return (
                    <div
                      key={idx}
                      style={{ height: `${Math.round(amp)}%` }}
                      className={`flex-1 rounded-[1px] ${
                        isSilent
                          ? "bg-amber-500/45"
                          : inSourceHook
                            ? "bg-[#E1392B]"
                            : "bg-slate-400/70 dark:bg-slate-600"
                      }`}
                    />
                  );
                })}

                {sfxCues.map((cue) => (
                  <button
                    key={cue.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      previewSfxSound(cue.kind);
                    }}
                    style={{ left: `${Math.min(95, (cue.timeSec / totalDuration) * 100)}%` }}
                    title={`Click to audition SFX: ${cue.kind} @ ${cue.timeSec}s`}
                    className="absolute top-0.5 px-1 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[9px] font-bold rounded-[1px]"
                  >
                    {cue.kind}
                  </button>
                ))}
              </div>
            </div>

            {/* Track T1: Synchronized Kinetic Captions */}
            <div className="flex items-stretch h-8">
              <div className="w-[84px] shrink-0 px-2.5 flex items-center font-mono text-[10px] font-semibold text-slate-500 border-r border-[#D9DEE7] dark:border-[#1C2029] bg-white dark:bg-[#111318]">
                T1 · {clip.activeLocale.toUpperCase()}
              </div>
              <div className="flex-1 relative">
                {captions.map((seg) => {
                  const leftPct = Math.min(98, (seg.startSec / totalDuration) * 100);
                  const widthPct = Math.max(4, ((seg.endSec - seg.startSec) / totalDuration) * 100);
                  return (
                    <div
                      key={seg.id}
                      style={{ left: `${leftPct}%`, width: `${Math.min(100 - leftPct, widthPct)}%` }}
                      className="absolute top-1 bottom-1 rounded-xs bg-slate-900/10 dark:bg-slate-100/10 border border-slate-400/60 dark:border-slate-600 px-1.5 flex items-center text-[10px] text-[#0F172A] dark:text-slate-200 truncate"
                    >
                      {seg.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
