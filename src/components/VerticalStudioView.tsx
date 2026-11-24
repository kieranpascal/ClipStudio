import { useEffect, useMemo, useRef, useState } from "react";
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
  Terminal,
} from "lucide-react";
import type { CaptionSegment, CaptionStylePreset, ClipItem, StudioLayout } from "../types";
import { generateAssSubtitles, generateFfmpegCommand } from "../utils/ffmpeg";

interface VerticalStudioViewProps {
  clips: ClipItem[];
  selectedClipId: string;
  onSelectClip: (clipId: string) => void;
  onUpdateClip: (clipId: string, updates: Partial<ClipItem>) => Promise<void>;
  onAuditClip: (clipId: string) => Promise<void>;
  auditingClipId: string | null;
  onSendToQueue: (clipId: string) => Promise<void>;
}

const CANVAS_W = 540;
const CANVAS_H = 960;

export function VerticalStudioView({
  clips,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onAuditClip,
  auditingClipId,
  onSendToQueue,
}: VerticalStudioViewProps) {
  const clip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) || clips[0],
    [clips, selectedClipId]
  );

  const [layout, setLayout] = useState<StudioLayout>(
    clip?.layout || {
      facecamHeightPercent: 36,
      facecamZoom: 1.15,
      facecamPanX: 0,
      facecamPanY: 0,
      gameplayZoom: 1.08,
      gameplayPanX: 0,
      maskChatRegion: true,
      prependPeakHook: true,
      hookStartSec: 16,
      hookDurationSec: 3,
      captionStyle: "kinetic-highlight",
      showSafeZones: true,
    }
  );
  const [captions, setCaptions] = useState<CaptionSegment[]>(clip?.captions || []);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"layout" | "captions" | "ffmpeg">("layout");
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const gameplayImgRef = useRef<HTMLImageElement | null>(null);
  const facecamImgRef = useRef<HTMLImageElement | null>(null);
  const [assetsTick, setAssetsTick] = useState(0);

  // Sync local editor state when switching clips
  useEffect(() => {
    if (!clip) return;
    setLayout(clip.layout);
    setCaptions(clip.captions);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [clip?.id]);

  // Preload gameplay & facecam images for Canvas rendering
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

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !clip) return;
    const totalDur = clip.durationSec + (layout.prependPeakHook ? layout.hookDurationSec : 0);
    let last = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        return next >= totalDur ? 0 : next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, clip?.durationSec, layout.prependPeakHook, layout.hookDurationSec]);

  // Sync HTML5 video element if local video uploaded
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !localVideoUrl) return;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, localVideoUrl]);

  // Render live 9:16 composite frame onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clip) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const faceH = Math.round((CANVAS_H * layout.facecamHeightPercent) / 100);
    const gameH = CANVAS_H - faceH;
    const isHookPhase = layout.prependPeakHook && currentTime < layout.hookDurationSec;

    // Background fill
    ctx.fillStyle = "#090C12";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle motion factor during playback so still thumbnails animate smoothly
    const motionDrift = Math.sin(currentTime * 0.9) * 10;

    // Helper: cover draw with zoom + pan
    const drawCover = (
      source: HTMLImageElement | HTMLVideoElement | null,
      destX: number,
      destY: number,
      destW: number,
      destH: number,
      zoom: number,
      panX: number,
      panY: number,
      extraShiftX = 0
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(destX, destY, destW, destH);
      ctx.clip();

      if (!source) {
        const grad = ctx.createLinearGradient(destX, destY, destX + destW, destY + destH);
        grad.addColorStop(0, "#1E293B");
        grad.addColorStop(1, "#0F172A");
        ctx.fillStyle = grad;
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

    // 1. Top Facecam Region
    drawCover(
      topSource,
      0,
      0,
      CANVAS_W,
      faceH,
      layout.facecamZoom + (isHookPhase ? 0.08 : 0),
      layout.facecamPanX,
      layout.facecamPanY,
      motionDrift * 0.3
    );

    // 2. Bottom Gameplay Region
    drawCover(
      botSource,
      0,
      faceH,
      CANVAS_W,
      gameH,
      layout.gameplayZoom + (isHookPhase ? 0.05 : 0),
      layout.gameplayPanX - (layout.maskChatRegion ? 12 : 0),
      0,
      motionDrift * 0.65
    );

    // Clean split seam hairline
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fillRect(0, faceH - 2, CANVAS_W, 4);

    // Bottom contrast scrim for legible captions
    const scrim = ctx.createLinearGradient(0, CANVAS_H - 280, 0, CANVAS_H);
    scrim.addColorStop(0, "rgba(0,0,0,0)");
    scrim.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, CANVAS_H - 280, CANVAS_W, 280);

    // Active Caption Rendering
    const activeCaption = captions.find((seg) => currentTime >= seg.startSec && currentTime <= seg.endSec) || captions[0];
    if (activeCaption) {
      const capY = layout.captionStyle === "minimal-lower" ? CANVAS_H - 175 : faceH + 46;
      const fontSize = layout.captionStyle === "bold-clean" ? 32 : layout.captionStyle === "minimal-lower" ? 26 : 30;
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const words = activeCaption.text.split(" ");
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

      lines.forEach((lineText, idx) => {
        const y = capY + idx * (fontSize + 10);
        const tokens = lineText.split(" ");
        const totalWidth = ctx.measureText(lineText).width;
        let cursorX = CANVAS_W / 2 - totalWidth / 2;

        tokens.forEach((tok, tokIdx) => {
          const piece = tokIdx < tokens.length - 1 ? `${tok} ` : tok;
          const pieceW = ctx.measureText(piece).width;
          const isEmph =
            layout.captionStyle === "kinetic-highlight" &&
            activeCaption.emphasisWord &&
            tok.toLowerCase().includes(activeCaption.emphasisWord.toLowerCase().replace(/[^a-z0-9]/gi, ""));

          ctx.textAlign = "left";
          ctx.lineWidth = 6;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
          ctx.strokeText(piece, cursorX, y);
          ctx.fillStyle = isEmph ? "#FB923C" : "#FFFFFF";
          ctx.fillText(piece, cursorX, y);
          cursorX += pieceW;
        });
      });
    }

    // Streamer Credit Overlay (always respects requireStreamerCredit)
    ctx.textAlign = "left";
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(20, 20, 176, 30);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillText(`via ${clip.streamerHandle}`, 30, 36);

    // Hook Phase Indicator on Preview Canvas
    if (isHookPhase) {
      ctx.fillStyle = "rgba(234, 88, 12, 0.9)";
      ctx.fillRect(CANVAS_W - 156, 20, 136, 30);
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("HOOK SPLICE 0-3s", CANVAS_W - 146, 36);
    }

    // Optional TikTok / Reels Safe-Zone Overlay Guide
    if (layout.showSafeZones) {
      ctx.strokeStyle = "rgba(249, 115, 22, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      // Right-hand TikTok/Reels action rail exclusion zone
      ctx.strokeRect(CANVAS_W - 88, CANVAS_H - 420, 76, 280);
      // Bottom caption/audio bar exclusion zone
      ctx.strokeRect(16, CANVAS_H - 135, CANVAS_W - 32, 115);
      ctx.setLineDash([]);

      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = "rgba(251, 146, 60, 0.9)";
      ctx.fillText("UI ACTION RAIL", CANVAS_W - 94, CANVAS_H - 428);
      ctx.fillText("PLATFORM CAPTION SAFE ZONE", 24, CANVAS_H - 142);
    }
  }, [clip, layout, captions, currentTime, assetsTick, localVideoUrl]);

  const ffmpegCommand = useMemo(
    () => (clip ? generateFfmpegCommand(clip, layout) : ""),
    [clip, layout]
  );

  if (!clip) {
    return (
      <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add a clip in Clip Radar to open the 9:16 Vertical Studio.
        </p>
      </div>
    );
  }

  const totalDuration = clip.durationSec + (layout.prependPeakHook ? layout.hookDurationSec : 0);

  async function handleSaveStudio() {
    setSaving(true);
    try {
      await onUpdateClip(clip.id, { layout, captions });
    } finally {
      setSaving(false);
    }
  }

  function handleUploadLocalVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    const url = URL.createObjectURL(file);
    setLocalVideoUrl(url);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  async function handleExportWebm() {
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
      a.download = `${clip.id}_9x16_preview.webm`;
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

  function handleDownloadAss() {
    const ass = generateAssSubtitles({ ...clip, captions });
    const blob = new Blob([ass], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `captions_${clip.id}.ass`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyFfmpeg() {
    navigator.clipboard.writeText(ffmpegCommand);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 1800);
  }

  function updateCaption(id: string, patch: Partial<CaptionSegment>) {
    setCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCaptionSegment() {
    const lastEnd = captions.length > 0 ? captions[captions.length - 1].endSec : 0;
    setCaptions((prev) => [
      ...prev,
      {
        id: `cap_${Date.now().toString(36)}`,
        startSec: Number(lastEnd.toFixed(1)),
        endSec: Number(Math.min(totalDuration, lastEnd + 4).toFixed(1)),
        text: "New caption line...",
        emphasisWord: "",
      },
    ]);
  }

  return (
    <div className="space-y-5">
      {/* Clip Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <label htmlFor="studio-clip-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Active Clip
          </label>
          <select
            id="studio-clip-select"
            value={clip.id}
            onChange={(e) => onSelectClip(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] text-sm font-medium text-slate-900 dark:text-slate-100 max-w-md truncate focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.streamerHandle} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121721] hover:bg-slate-50 dark:hover:bg-[#1A2230] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Load Local MP4</span>
            <input type="file" accept="video/mp4,video/webm" onChange={handleUploadLocalVideo} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleSaveStudio}
            disabled={saving}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18202E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save Layout"}
          </button>

          <button
            type="button"
            onClick={async () => {
              await handleSaveStudio();
              await onSendToQueue(clip.id);
            }}
            className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Queue for Publish</span>
          </button>
        </div>
      </div>

      {/* Hidden video element if user uploads a local video file */}
      {localVideoUrl && (
        <video ref={videoRef} src={localVideoUrl} loop muted playsInline className="hidden" />
      )}

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Live 9:16 Canvas Viewport + Timeline Scrubber */}
        <div className="xl:col-span-5 flex flex-col items-center p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721]">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono tabular-nums">1080 × 1920 · 9:16 Vertical</span>
            <button
              type="button"
              onClick={() => setLayout((l) => ({ ...l, showSafeZones: !l.showSafeZones }))}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                layout.showSafeZones ? "text-orange-600 dark:text-orange-400" : "hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{layout.showSafeZones ? "Safe Zones On" : "Safe Zones Off"}</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-black shadow-lg">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-[290px] sm:w-[320px] aspect-[9/16] block"
            />
          </div>

          {/* Playback & Hook Timeline Scrubber */}
          <div className="w-full mt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              <span>{currentTime.toFixed(1)}s</span>
              <span>
                {layout.prependPeakHook
                  ? `Hook 0–${layout.hookDurationSec.toFixed(1)}s + Main`
                  : "Linear Playback"}
              </span>
              <span>{totalDuration.toFixed(1)}s</span>
            </div>

            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              aria-label="Timeline scrubber"
              className="w-full accent-orange-600 cursor-pointer"
            />

            {/* Visual Hook Window & Energy Track (click to reposition 3s hook slice) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Source Hook Window (click track to relocate)</span>
                <span className="font-mono tabular-nums text-orange-600 dark:text-orange-400">
                  {layout.hookStartSec.toFixed(1)}s – {(layout.hookStartSec + layout.hookDurationSec).toFixed(1)}s
                </span>
              </div>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Click to move source hook window"
                aria-valuemin={0}
                aria-valuemax={Math.max(1, clip.durationSec - layout.hookDurationSec)}
                aria-valuenow={layout.hookStartSec}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const nextStart = Math.round(ratio * Math.max(1, clip.durationSec - layout.hookDurationSec) * 2) / 2;
                  setLayout((l) => ({ ...l, hookStartSec: nextStart }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    setLayout((l) => ({ ...l, hookStartSec: Math.min(clip.durationSec - l.hookDurationSec, l.hookStartSec + 0.5) }));
                  } else if (e.key === "ArrowLeft") {
                    setLayout((l) => ({ ...l, hookStartSec: Math.max(0, l.hookStartSec - 0.5) }));
                  }
                }}
                className="relative h-8 rounded-md bg-slate-100 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer flex items-end gap-[2px] px-1 py-1"
              >
                {Array.from({ length: 36 }).map((_, idx) => {
                  const sec = (idx / 36) * clip.durationSec;
                  const inHook =
                    layout.prependPeakHook &&
                    sec >= layout.hookStartSec &&
                    sec <= layout.hookStartSec + layout.hookDurationSec;
                  const energy = 24 + Math.abs(Math.sin(idx * 0.72 + clip.views * 0.001)) * 68;
                  return (
                    <div
                      key={idx}
                      style={{ height: `${Math.round(energy)}%` }}
                      className={`flex-1 rounded-[1px] transition-colors ${
                        inHook ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="h-9 px-3.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause" : "Preview"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  aria-label="Reset playhead"
                  className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportWebm}
                disabled={isRecording}
                className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18202E] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {isRecording ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isRecording ? "Recording 5.5s..." : "Export WebM"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Split Calibration, Hook Re-Order, Captions, FFmpeg & Gemini QA */}
        <div className="xl:col-span-7 space-y-5">
          {/* Segmented Inspector Tabs */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#141A25] border border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setRightPanelTab("layout")}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rightPanelTab === "layout"
                    ? "bg-white dark:bg-[#1E2636] text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Framing &amp; Hook Splice
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("captions")}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rightPanelTab === "captions"
                    ? "bg-white dark:bg-[#1E2636] text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Kinetic Captions ({captions.length})
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("ffmpeg")}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rightPanelTab === "ffmpeg"
                    ? "bg-white dark:bg-[#1E2636] text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                FFmpeg &amp; ASS Export
              </button>
            </div>

            <button
              type="button"
              onClick={() => onAuditClip(clip.id)}
              disabled={auditingClipId === clip.id}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121721] hover:bg-slate-50 dark:hover:bg-[#1A2230] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {auditingClipId === clip.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              )}
              <span>Gemini QA &amp; Hook Finder</span>
            </button>
          </div>

          {rightPanelTab === "layout" && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-6">
              {/* Dual-Zone Split Geometry */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Dual-Zone 9:16 Split Calibration
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    Facecam {layout.facecamHeightPercent}% / Gameplay {100 - layout.facecamHeightPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Facecam Split Height</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {layout.facecamHeightPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={22}
                      max={50}
                      value={layout.facecamHeightPercent}
                      onChange={(e) => setLayout((l) => ({ ...l, facecamHeightPercent: Number(e.target.value) }))}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Facecam Zoom</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {layout.facecamZoom.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={layout.facecamZoom}
                      onChange={(e) => setLayout((l) => ({ ...l, facecamZoom: Number(e.target.value) }))}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Facecam Horizontal Pan</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {layout.facecamPanX > 0 ? `+${layout.facecamPanX}` : layout.facecamPanX}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={layout.facecamPanX}
                      onChange={(e) => setLayout((l) => ({ ...l, facecamPanX: Number(e.target.value) }))}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Gameplay Zoom</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {layout.gameplayZoom.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={1.8}
                      step={0.05}
                      value={layout.gameplayZoom}
                      onChange={(e) => setLayout((l) => ({ ...l, gameplayZoom: Number(e.target.value) }))}
                      className="w-full accent-orange-600"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Exclude Stream Chat Box Rail
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Shifts gameplay crop leftward to strip right-rail Twitch chat overlays cleanly.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={layout.maskChatRegion}
                    onChange={(e) => setLayout((l) => ({ ...l, maskChatRegion: e.target.checked }))}
                    className="w-4 h-4 accent-orange-600"
                  />
                </label>
              </div>

              {/* 3-Second Hook Splice Section */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-orange-500" />
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Peak Moment Hook Prepend (00:00–00:03)
                    </h3>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layout.prependPeakHook}
                      onChange={(e) => setLayout((l) => ({ ...l, prependPeakHook: e.target.checked }))}
                      className="w-4 h-4 accent-orange-600"
                    />
                    <span>Prepend Hook</span>
                  </label>
                </div>

                {layout.prependPeakHook && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400">Source Hook Start</span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {layout.hookStartSec.toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(1, clip.durationSec - 3)}
                        step={0.5}
                        value={layout.hookStartSec}
                        onChange={(e) => setLayout((l) => ({ ...l, hookStartSec: Number(e.target.value) }))}
                        className="w-full accent-orange-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400">Hook Slice Length</span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {layout.hookDurationSec.toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1.5}
                        max={5}
                        step={0.5}
                        value={layout.hookDurationSec}
                        onChange={(e) => setLayout((l) => ({ ...l, hookDurationSec: Number(e.target.value) }))}
                        className="w-full accent-orange-600"
                      />
                    </div>
                  </div>
                )}

                {clip.qaResult && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Gemini QA Note · {clip.qaResult.detectedGame}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {clip.qaResult.hookRecommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {rightPanelTab === "captions" && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Caption Style &amp; Timing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any line to scrub the canvas preview to that timestamp.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={layout.captionStyle}
                    onChange={(e) =>
                      setLayout((l) => ({ ...l, captionStyle: e.target.value as CaptionStylePreset }))
                    }
                    className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0E14] text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="kinetic-highlight">Kinetic Highlight</option>
                    <option value="bold-clean">Bold Clean White</option>
                    <option value="minimal-lower">Minimal Lower Third</option>
                  </select>

                  <button
                    type="button"
                    onClick={addCaptionSegment}
                    className="h-8 px-2.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {captions.map((seg) => (
                  <div
                    key={seg.id}
                    onClick={() => setCurrentTime(seg.startSec + 0.1)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0F131B] space-y-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          value={seg.startSec}
                          onChange={(e) => updateCaption(seg.id, { startSec: Number(e.target.value) })}
                          className="w-16 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121721] text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="number"
                          step={0.5}
                          min={0}
                          value={seg.endSec}
                          onChange={(e) => updateCaption(seg.id, { endSec: Number(e.target.value) })}
                          className="w-16 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121721] text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-slate-400">sec</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={seg.emphasisWord || ""}
                          onChange={(e) => updateCaption(seg.id, { emphasisWord: e.target.value })}
                          placeholder="Accent word"
                          className="w-28 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121721] text-xs text-orange-600 dark:text-orange-400 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCaptions((prev) => prev.filter((c) => c.id !== seg.id));
                          }}
                          aria-label="Remove caption line"
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={seg.text}
                      onChange={(e) => updateCaption(seg.id, { text: e.target.value })}
                      className="w-full h-8 px-2.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121721] text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightPanelTab === "ffmpeg" && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121721] space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Production FFmpeg Render Graph
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadAss}
                    className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ASS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFfmpeg}
                    className="h-8 px-3 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    {copiedFfmpeg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFfmpeg ? "Copied" : "Copy Command"}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mirrors your exact facecam split ({layout.facecamHeightPercent}%), chat-rail exclusion,
                {layout.prependPeakHook
                  ? ` ${layout.hookDurationSec.toFixed(1)}s hook prepend from ${layout.hookStartSec.toFixed(1)}s,`
                  : ""}{" "}
                and ASS subtitle burn-in. Executed automatically inside GitHub Actions on Ubuntu runners.
              </p>

              <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                <code>{ffmpegCommand}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
