import type { ClipItem, StudioLayout } from "../types";

/**
 * Computes transparent clip discovery metrics (no opaque fake scores).
 */
export function computeViewsPerMinute(views: number, ageMinutes: number): number {
  return Math.round(views / Math.max(1, ageMinutes));
}

export function computeSaturationLevel(duplicateCrossPosts: number, maxAllowed: number): "Low" | "Moderate" | "Saturated" {
  if (duplicateCrossPosts > maxAllowed) return "Saturated";
  if (duplicateCrossPosts >= Math.max(2, maxAllowed - 1)) return "Moderate";
  return "Low";
}

/**
 * Grounded revenue calculator based on real Creator Rewards / RPM math
 * (e.g., ~$1.12 per 1,000 qualified views -> ~89,286 views/day for $100/day).
 */
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

/**
 * Builds a real, copy-pasteable production FFmpeg command matching the user's
 * visual 9:16 crop controls, chat-box mask, peak 3s hook splice, and ASS captions.
 */
export function generateFfmpegCommand(clip: ClipItem, layout: StudioLayout): string {
  const width = 1080;
  const height = 1920;
  const faceH = Math.round((height * layout.facecamHeightPercent) / 100);
  const gameH = height - faceH;

  const camCropW = (0.28 / layout.facecamZoom).toFixed(3);
  const camCropH = (0.34 / layout.facecamZoom).toFixed(3);
  const camX = Math.max(0.02, Math.min(0.7, 0.70 + layout.facecamPanX * 0.003)).toFixed(3);
  const camY = Math.max(0.02, Math.min(0.65, 0.62 + layout.facecamPanY * 0.003)).toFixed(3);

  const gameCropW = (0.64 / layout.gameplayZoom).toFixed(3);
  const gameX = Math.max(0.0, Math.min(0.35, 0.18 + layout.gameplayPanX * 0.003)).toFixed(3);
  const chatMask = layout.maskChatRegion
    ? `,drawbox=x=iw-260:y=0:w=260:h=ih:color=black@0:t=0` // gameplay crop already excludes right-rail chat
    : "";

  const hookStart = Math.max(0, Math.min(clip.durationSec - 1, layout.hookStartSec)).toFixed(1);
  const hookLen = Math.max(1, Math.min(6, layout.hookDurationSec)).toFixed(1);

  const baseStack =
    `[0:v]split=2[cam_in][game_in];` +
    `[cam_in]crop=iw*${camCropW}:ih*${camCropH}:iw*${camX}:ih*${camY},scale=${width}:${faceH}:force_original_aspect_ratio=increase,crop=${width}:${faceH}[top];` +
    `[game_in]crop=iw*${gameCropW}:ih:iw*${gameX}:0${chatMask},scale=${width}:${gameH}:force_original_aspect_ratio=increase,crop=${width}:${gameH}[bot];` +
    `[top][bot]vstack=inputs=2,ass=captions_${clip.id}.ass[stacked]`;

  if (!layout.prependPeakHook) {
    return [
      `ffmpeg -y -i "${clip.id}_source.mp4" \\`,
      `  -filter_complex "${baseStack};[stacked]format=yuv420p[vout]" \\`,
      `  -map "[vout]" -map "0:a?" \\`,
      `  -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k \\`,
      `  "${clip.id}_9x16.mp4"`,
    ].join("\n");
  }

  const hookReorder =
    `${baseStack};` +
    `[stacked]split=2[vh_src][vm_src];` +
    `[vh_src]trim=start=${hookStart}:duration=${hookLen},setpts=PTS-STARTPTS[vhook];` +
    `[vm_src]setpts=PTS-STARTPTS[vmain];` +
    `[0:a]asplit=2[ah_src][am_src];` +
    `[ah_src]atrim=start=${hookStart}:duration=${hookLen},asetpts=PTS-STARTPTS[ahook];` +
    `[am_src]asetpts=PTS-STARTPTS[amain];` +
    `[vhook][ahook][vmain][amain]concat=n=2:v=1:a=1[vout][aout]`;

  return [
    `ffmpeg -y -i "${clip.id}_source.mp4" \\`,
    `  -filter_complex "${hookReorder}" \\`,
    `  -map "[vout]" -map "[aout]" \\`,
    `  -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k \\`,
    `  "${clip.id}_9x16_hooked.mp4"`,
  ].join("\n");
}

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec - Math.floor(sec)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function generateAssSubtitles(clip: ClipItem): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Plus Jakarta Sans,64,&H00FFFFFF,&H001673F9,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,4,2,2,60,60,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const lines = clip.captions.map((seg) => {
    const highlighted = seg.emphasisWord
      ? seg.text.replace(
          new RegExp(`(${seg.emphasisWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"),
          "{\\c&H001673F9&}$1{\\c&H00FFFFFF&}"
        )
      : seg.text;
    return `Dialogue: 0,${formatAssTime(seg.startSec)},${formatAssTime(seg.endSec)},Default,,0,0,0,,${highlighted}`;
  });

  return `${header}\n${lines.join("\n")}\n`;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
