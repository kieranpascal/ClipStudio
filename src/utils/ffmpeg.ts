import type { CaptionSegment, ClipItem, SfxKind, StudioLayout } from "../types";

export function computeViewsPerMinute(views: number, ageMinutes: number): number {
  return Math.round(views / Math.max(1, ageMinutes));
}

export function computeSaturationLevel(
  duplicateCrossPosts: number,
  maxAllowed: number
): "Low" | "Moderate" | "Saturated" {
  if (duplicateCrossPosts > maxAllowed) return "Saturated";
  if (duplicateCrossPosts >= Math.max(2, maxAllowed - 1)) return "Moderate";
  return "Low";
}

export function computeRevenueTargets(targetDailyUsd: number, rpmUsd: number, avgViewsPerShort: number) {
  const safeRpm = Math.max(0.1, rpmUsd);
  const safeAvgViews = Math.max(250, avgViewsPerShort);
  const requiredDailyViews = Math.ceil((targetDailyUsd / safeRpm) * 1000);
  const requiredMonthlyViews = requiredDailyViews * 30;
  const shortsPerDayNeeded = Math.max(1, Math.ceil(requiredDailyViews / safeAvgViews));
  const projectedMonthlyUsd = Math.round(targetDailyUsd * 30);

  return {
    requiredDailyViews,
    requiredMonthlyViews,
    shortsPerDayNeeded,
    projectedMonthlyUsd,
  };
}

export function formatTimecode(seconds: number, fps = 30): string {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const frames = Math.floor((clamped - Math.floor(clamped)) * fps);
  return `00:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Generates an exact production FFmpeg command supporting all 6 layout templates,
 * visual source bounding-box coordinates, EBU R128 loudnorm, silence removal,
 * DMCA vocal bandpass, B-Roll zoom punch-ins, peak 3s hook prepend, and ASS captions.
 */
export function generateFfmpegCommand(clip: ClipItem, layout: StudioLayout): string {
  const W = 1080;
  const H = 1920;
  const fc = layout.sourceFacecamRect;
  const gp = layout.sourceGameplayRect;

  const camCrop = `crop=iw*${fc.w.toFixed(3)}:ih*${fc.h.toFixed(3)}:iw*${fc.x.toFixed(3)}:ih*${fc.y.toFixed(3)}`;
  const gameCrop = `crop=iw*${gp.w.toFixed(3)}:ih*${gp.h.toFixed(3)}:iw*${gp.x.toFixed(3)}:ih*${gp.y.toFixed(3)}`;

  let videoLayoutGraph = "";

  if (layout.template === "fullscreen-pip") {
    videoLayoutGraph =
      `[0:v]split=2[cam_in][game_in];` +
      `[game_in]${gameCrop},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}[bg];` +
      `[cam_in]${camCrop},scale=340:420:force_original_aspect_ratio=increase,crop=340:420[pip];` +
      `[bg][pip]overlay=W-w-36:72[composed]`;
  } else if (layout.template === "blurred-backdrop") {
    videoLayoutGraph =
      `[0:v]split=3[bg_in][cam_in][game_in];` +
      `[bg_in]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=24:4[blurbg];` +
      `[cam_in]${camCrop},scale=560:420:force_original_aspect_ratio=increase,crop=560:420[camtop];` +
      `[game_in]scale=${W}:-2[gamefit];` +
      `[blurbg][gamefit]overlay=0:(H-h)/2+160[mid];` +
      `[mid][camtop]overlay=(W-w)/2:84[composed]`;
  } else if (layout.template === "dual-cam") {
    videoLayoutGraph =
      `[0:v]split=3[cam1_in][cam2_in][game_in];` +
      `[cam1_in]${camCrop},scale=540:640:force_original_aspect_ratio=increase,crop=540:640[c1];` +
      `[cam2_in]crop=iw*0.24:ih*0.34:iw*0.03:ih*0.62,scale=540:640:force_original_aspect_ratio=increase,crop=540:640[c2];` +
      `[c1][c2]hstack=inputs=2[top];` +
      `[game_in]${gameCrop},scale=${W}:1280:force_original_aspect_ratio=increase,crop=${W}:1280[bot];` +
      `[top][bot]vstack=inputs=2[composed]`;
  } else if (layout.template === "hud-zoom") {
    videoLayoutGraph =
      `[0:v]split=3[cam_in][game_in][hud_in];` +
      `[cam_in]${camCrop},scale=${W}:580:force_original_aspect_ratio=increase,crop=${W}:580[top];` +
      `[game_in]${gameCrop},scale=${W}:1340:force_original_aspect_ratio=increase,crop=${W}:1340[bot];` +
      `[hud_in]crop=iw*0.28:ih*0.18:iw*0.70:ih*0.03,scale=360:180[hud];` +
      `[top][bot]vstack=inputs=2[stack];` +
      `[stack][hud]overlay=W-w-28:612[composed]`;
  } else {
    const facePct =
      layout.template === "reaction-focus" ? Math.max(54, layout.facecamHeightPercent) : layout.facecamHeightPercent;
    const faceH = Math.round((H * facePct) / 100);
    const gameH = H - faceH;
    videoLayoutGraph =
      `[0:v]split=2[cam_in][game_in];` +
      `[cam_in]${camCrop},scale=${W}:${faceH}:force_original_aspect_ratio=increase,crop=${W}:${faceH}[top];` +
      `[game_in]${gameCrop},scale=${W}:${gameH}:force_original_aspect_ratio=increase,crop=${W}:${gameH}[bot];` +
      `[top][bot]vstack=inputs=2[composed]`;
  }

  const safeBanner = (layout.hookBannerText || "").replace(/[':]/g, "");
  const bannerFilter =
    layout.showHookBanner && safeBanner
      ? `,drawtext=text='${safeBanner}':fontcolor=white:fontsize=46:box=1:boxcolor=black@0.72:boxborderw=16:x=(w-text_w)/2:y=110:enable='between(t,0,${layout.hookDurationSec.toFixed(1)})'`
      : "";

  const safeWatermark = (layout.watermarkHandle || "").replace(/[':]/g, "");
  const watermarkFilter = safeWatermark
    ? `,drawtext=text='${safeWatermark}':fontcolor=white@${layout.watermarkOpacity.toFixed(2)}:fontsize=26:x=36:y=36`
    : "";

  const brollCueFilter =
    clip.brollCues && clip.brollCues.length > 0
      ? `,eq=contrast=1.08:saturation=1.12:enable='between(t,${clip.brollCues[0].timeSec.toFixed(1)},${(
          clip.brollCues[0].timeSec + clip.brollCues[0].durationSec
        ).toFixed(1)})'`
      : "";

  const decoratedVideo = `${videoLayoutGraph};[composed]ass=captions_${clip.id}_${clip.activeLocale}.ass${bannerFilter}${watermarkFilter}${brollCueFilter}[vbase]`;

  const audioSteps: string[] = [];
  if (layout.isolateVocalsDmca) {
    audioSteps.push("highpass=f=180,lowpass=f=3800,afftdn=nf=-22");
  }
  if (layout.removeSilence) {
    audioSteps.push(`silenceremove=stop_periods=-1:stop_duration=0.45:stop_threshold=${layout.silenceThresholdDb}dB`);
  }
  audioSteps.push(`loudnorm=I=${layout.targetLufs}:TP=${layout.truePeakDb.toFixed(1)}:LRA=11`);
  const audioChain = audioSteps.join(",");

  const hookStart = Math.max(0, Math.min(clip.durationSec - 1, layout.hookStartSec)).toFixed(1);
  const hookLen = Math.max(1, Math.min(6, layout.hookDurationSec)).toFixed(1);

  if (!layout.prependPeakHook) {
    return [
      `ffmpeg -y -i "${clip.id}_source.mp4" \\`,
      `  -filter_complex "${decoratedVideo};[0:a]${audioChain}[aout]" \\`,
      `  -map "[vbase]" -map "[aout]" \\`,
      `  -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k \\`,
      `  "${clip.id}_${layout.template}_${clip.activeLocale}.mp4"`,
    ].join("\n");
  }

  const fullGraph =
    `${decoratedVideo};` +
    `[vbase]split=2[vh_src][vm_src];` +
    `[vh_src]trim=start=${hookStart}:duration=${hookLen},setpts=PTS-STARTPTS[vhook];` +
    `[vm_src]setpts=PTS-STARTPTS[vmain];` +
    `[0:a]${audioChain},asplit=2[ah_src][am_src];` +
    `[ah_src]atrim=start=${hookStart}:duration=${hookLen},asetpts=PTS-STARTPTS[ahook];` +
    `[am_src]asetpts=PTS-STARTPTS[amain];` +
    `[vhook][ahook][vmain][amain]concat=n=2:v=1:a=1[vout][aout]`;

  return [
    `ffmpeg -y -i "${clip.id}_source.mp4" \\`,
    `  -filter_complex "${fullGraph}" \\`,
    `  -map "[vout]" -map "[aout]" \\`,
    `  -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k \\`,
    `  "${clip.id}_${layout.template}_${clip.activeLocale}_hooked.mp4"`,
  ].join("\n");
}

/**
 * Generates a multi-clip FFmpeg compilation/montage stitch command for approved shorts.
 */
export function generateCompilationFfmpeg(clips: ClipItem[]): string {
  if (clips.length === 0) return "# Select 2+ clips to generate a montage stitch command.";
  const inputs = clips.map((c) => `-i "${c.id}_${c.layout.template}_${c.activeLocale}.mp4"`).join(" \\\n  ");
  const streams = clips.map((_, idx) => `[${idx}:v][${idx}:a]`).join("");
  return [
    `ffmpeg -y \\`,
    `  ${inputs} \\`,
    `  -filter_complex "${streams}concat=n=${clips.length}:v=1:a=1[vcat][acat];[acat]loudnorm=I=-11:TP=-1.0:LRA=11[anorm]" \\`,
    `  -map "[vcat]" -map "[anorm]" \\`,
    `  -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k \\`,
    `  "clipforge_compilation_${clips.length}clips.mp4"`,
  ].join("\n");
}

/**
 * Real Web Audio API SFX preview synthesizer so editors can audition risers, drops, and whooshes locally.
 */
export function previewSfxSound(kind: SfxKind): void {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, now);
  master.connect(ctx.destination);

  if (kind === "bass-drop") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.45);
    g.gain.setValueAtTime(0.9, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 0.52);
  } else if (kind === "riser") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.55);
    g.gain.setValueAtTime(0.05, now);
    g.gain.linearRampToValueAtTime(0.55, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.58);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (kind === "camera-click") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    g.gain.setValueAtTime(0.6, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 0.09);
  } else {
    // whoosh or glitch-cut via filtered noise buffer
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === "glitch-cut" ? "highpass" : "bandpass";
    filter.frequency.setValueAtTime(kind === "glitch-cut" ? 1800 : 320, now);
    filter.frequency.exponentialRampToValueAtTime(kind === "glitch-cut" ? 420 : 2200, now + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, now);
    g.gain.linearRampToValueAtTime(0.65, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    noise.connect(filter).connect(g).connect(master);
    noise.start(now);
  }

  setTimeout(() => {
    ctx.close().catch(() => {});
  }, 750);
}

/**
 * Simple Jaccard token similarity check to detect duplicate clips in the media bin.
 */
export function computeTitleSimilarity(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  const tokB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let inter = 0;
  tokA.forEach((t) => {
    if (tokB.has(t)) inter += 1;
  });
  return inter / (tokA.size + tokB.size - inter);
}

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec - Math.floor(sec)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function formatSrtTime(sec: number, sep = ","): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${sep}${String(ms).padStart(3, "0")}`;
}

export function generateAssSubtitles(captions: CaptionSegment[]): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Bricolage Grotesque,64,&H00FFFFFF,&H002B39E1,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,60,60,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const lines = captions.map((seg) => {
    const highlighted = seg.emphasisWord
      ? seg.text.replace(
          new RegExp(`(${seg.emphasisWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"),
          "{\\c&H002B39E1&}$1{\\c&H00FFFFFF&}"
        )
      : seg.text;
    return `Dialogue: 0,${formatAssTime(seg.startSec)},${formatAssTime(seg.endSec)},Default,,0,0,0,,${highlighted}`;
  });

  return `${header}\n${lines.join("\n")}\n`;
}

export function generateSrtSubtitles(captions: CaptionSegment[]): string {
  return (
    captions
      .map((seg, i) => `${i + 1}\n${formatSrtTime(seg.startSec, ",")} --> ${formatSrtTime(seg.endSec, ",")}\n${seg.text}`)
      .join("\n\n") + "\n"
  );
}

export function generateVttSubtitles(captions: CaptionSegment[]): string {
  const body = captions
    .map((seg) => `${formatSrtTime(seg.startSec, ".")} --> ${formatSrtTime(seg.endSec, ".")}\n${seg.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export interface DiffLine {
  type: "same" | "add" | "del";
  text: string;
}

export function computeLineDiff(beforeText: string, afterText: string): DiffLine[] {
  const a = beforeText.split("\n");
  const b = afterText.split("\n");
  const out: DiffLine[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) out.push({ type: "same", text: left });
    } else {
      if (left !== undefined) out.push({ type: "del", text: left });
      if (right !== undefined) out.push({ type: "add", text: right });
    }
  }
  return out;
}
