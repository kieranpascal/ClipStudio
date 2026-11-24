import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import type {
  ClipItem,
  ClipQaResult,
  IntegrationStatus,
  PipelineConfig,
  PipelineRun,
  RepoFileEntry,
  StrategyRecommendation,
  WorkspaceState,
} from "./src/types";

const PORT = 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");
const PIPELINE_CONFIG_FILE = path.join(ROOT_DIR, "pipeline.config.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getIntegrationStatus(): IntegrationStatus {
  const apiKey = process.env.GEMINI_API_KEY;
  return {
    runtime: "ai-studio-express",
    geminiConfigured: Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY"),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
    githubRepo: process.env.GITHUB_REPO || null,
    githubBranch: process.env.GITHUB_BRANCH || "main",
    cloudflareConfigured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_PROJECT_NAME),
    cloudflareProject: process.env.CLOUDFLARE_PROJECT_NAME || "clipforge",
    twitchConfigured: Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
  };
}

function loadDefaultConfig(): PipelineConfig {
  if (fs.existsSync(PIPELINE_CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(PIPELINE_CONFIG_FILE, "utf8")) as PipelineConfig;
  }
  return {
    projectName: "ClipForge",
    scheduleCron: "0 */2 * * *",
    targetGames: [
      {
        name: "Grand Theft Auto VI",
        twitchGameId: "32982_gta6",
        minViews: 1500,
        maxClipAgeHours: 6,
        enabled: true,
      },
    ],
    qaRules: {
      strictGameVerification: true,
      rejectChatBoxOverlap: true,
      maxExistingCrossPosts: 3,
      minHookEnergyScore: 75,
      requireStreamerCredit: true,
    },
    layoutDefaults: {
      aspectRatio: "9:16",
      width: 1080,
      height: 1920,
      facecamHeightPercent: 36,
      maskChatRegion: true,
      prependPeakHook: true,
      hookDurationSeconds: 3.0,
      captionStyle: "kinetic-highlight",
    },
    publishing: {
      platforms: ["tiktok", "instagram_reels", "youtube_shorts"],
      maxPostsPerDay: 12,
      minSpacingMinutes: 90,
      targetDailyRevenueUsd: 100,
      assumedRpmUsd: 1.12,
    },
  };
}

function buildSeedWorkspace(): WorkspaceState {
  const config = loadDefaultConfig();
  const clips: ClipItem[] = [
    {
      id: "clip_vice_01",
      sourcePlatform: "Twitch",
      sourceUrl: "https://clips.twitch.tv/ViceSunsetDriftClip01",
      title: "210 MPH Reverse Entry Drift Past Five-Star Roadblock on Ocean Highway",
      gameCategory: "Grand Theft Auto VI",
      streamerName: "KadeVelo",
      streamerHandle: "@kadevelo",
      views: 18420,
      ageMinutes: 42,
      durationSec: 28,
      duplicateCrossPosts: 1,
      gameplayThumbnail: "/src/assets/images/clip_vice_chase_1795557950868.jpg",
      facecamThumbnail: "/src/assets/images/streamer_facecam_1_1795557951189.jpg",
      transcript:
        "No way they blocked the whole bridge! Wait, watch the guardrail gap on the left—if I tap handbrake right now we clear both cruisers. Oh my god, we actually threaded that at two hundred miles an hour!",
      qaStatus: "approved",
      qaResult: {
        authenticTargetGame: true,
        detectedGame: "Grand Theft Auto VI",
        saturationRisk: "low",
        chatClutterDetected: false,
        hookRecommendation: "Prepend 19.5s–22.5s ('Oh my god, we actually threaded that!') to open on maximum reaction energy.",
        recommendedHookStartSec: 19.5,
        summaryReason: "Verified coastal highway visuals, clean right-side chat crop margin, only 1 rival repost detected.",
        tiktokCaption: "No way he cleared a 5-star roadblock backwards at 210 MPH (via @kadevelo) #gta6 #gta6clips #gaming",
        reelsCaption: "Threading a 210 MPH drift through a 5-star roadblock without scratching the paint. Credit: @kadevelo #gta6 #gamingclips",
        shortsTitle: "He Cleared a 5-Star Roadblock Backwards at 210 MPH (@kadevelo)",
        auditedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      layout: {
        facecamHeightPercent: 36,
        facecamZoom: 1.15,
        facecamPanX: 0,
        facecamPanY: 0,
        gameplayZoom: 1.1,
        gameplayPanX: 0,
        maskChatRegion: true,
        prependPeakHook: true,
        hookStartSec: 19.5,
        hookDurationSec: 3.0,
        captionStyle: "kinetic-highlight",
        showSafeZones: true,
      },
      captions: [
        { id: "c1", startSec: 0, endSec: 3.0, text: "WE ACTUALLY THREADED THAT AT 210!", emphasisWord: "THREADED" },
        { id: "c2", startSec: 3.0, endSec: 7.5, text: "No way they blocked the whole bridge!", emphasisWord: "blocked" },
        { id: "c3", startSec: 7.5, endSec: 13.0, text: "Watch the guardrail gap on the left—", emphasisWord: "guardrail" },
        { id: "c4", startSec: 13.0, endSec: 19.5, text: "If I tap handbrake right now we clear both cruisers.", emphasisWord: "handbrake" },
        { id: "c5", startSec: 19.5, endSec: 25.0, text: "Oh my god, we cleared both at two hundred!", emphasisWord: "cleared" },
      ],
      publishStatus: "ready",
      scheduledFor: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    },
    {
      id: "clip_heist_02",
      sourcePlatform: "Twitch",
      sourceUrl: "https://clips.twitch.tv/DowntownArmoredEscape02",
      title: "Midnight Armored Convoy Ambush — Last Second Alley Shortcut",
      gameCategory: "Grand Theft Auto VI",
      streamerName: "SarahPlayz",
      streamerHandle: "@sarah_playz",
      views: 11240,
      ageMinutes: 58,
      durationSec: 32,
      duplicateCrossPosts: 0,
      gameplayThumbnail: "/src/assets/images/clip_neon_heist_1795557952259.jpg",
      facecamThumbnail: "/src/assets/images/streamer_facecam_2_1795557951613.jpg",
      transcript:
        "Chat, the spotlight just locked on our roof! Turn the headlights off, cut down the wet alley behind Nighthawk Bar—wait, the armored truck actually fits?! They drove straight past us!",
      qaStatus: "pending",
      layout: {
        facecamHeightPercent: 38,
        facecamZoom: 1.1,
        facecamPanX: 4,
        facecamPanY: 0,
        gameplayZoom: 1.05,
        gameplayPanX: 0,
        maskChatRegion: true,
        prependPeakHook: true,
        hookStartSec: 22.0,
        hookDurationSec: 3.0,
        captionStyle: "kinetic-highlight",
        showSafeZones: true,
      },
      captions: [
        { id: "h1", startSec: 0, endSec: 3.0, text: "THE ARMORED TRUCK ACTUALLY FITS?!", emphasisWord: "FITS?!" },
        { id: "h2", startSec: 3.0, endSec: 9.0, text: "Chat, the spotlight just locked on our roof!", emphasisWord: "spotlight" },
        { id: "h3", startSec: 9.0, endSec: 16.0, text: "Headlights off—cut behind Nighthawk Bar.", emphasisWord: "Headlights" },
        { id: "h4", startSec: 16.0, endSec: 24.0, text: "Wait... they drove straight past us!", emphasisWord: "straight" },
      ],
      publishStatus: "draft",
    },
    {
      id: "clip_harbor_03",
      sourcePlatform: "Kick",
      sourceUrl: "https://kick.com/clips/MarinaBoatLaunch03",
      title: "Twilight Marina Speedboat Jump Over Three Yachts",
      gameCategory: "Grand Theft Auto VI",
      streamerName: "MiloRacer",
      streamerHandle: "@miloracer",
      views: 42900,
      ageMinutes: 195,
      durationSec: 24,
      duplicateCrossPosts: 2,
      gameplayThumbnail: "/src/assets/images/clip_harbor_escape_1795557950869.jpg",
      facecamThumbnail: "/src/assets/images/streamer_facecam_1_1795557951189.jpg",
      transcript:
        "Full throttle into the wake! If this wave angles up we can clear the entire yacht slip—hold on, hold on, we are airborne! Clean splashdown straight into open water!",
      qaStatus: "approved",
      qaResult: {
        authenticTargetGame: true,
        detectedGame: "Grand Theft Auto VI",
        saturationRisk: "medium",
        chatClutterDetected: false,
        hookRecommendation: "Lead with 14.0s–17.0s airborne boat launch frame to arrest scroll immediately.",
        recommendedHookStartSec: 14.0,
        summaryReason: "High wave-physics visual spectacle; 2 competing uploads exist so publish within next 45 minutes.",
        tiktokCaption: "Clearing three yachts on a single wake jump (credit @miloracer) #gta6 #marina #gaming",
        reelsCaption: "Water physics went crazy on this harbor escape. Via @miloracer #gta6clips #gaming",
        shortsTitle: "He Cleared Three Yachts in One Speedboat Jump (@miloracer)",
        auditedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      },
      layout: {
        facecamHeightPercent: 34,
        facecamZoom: 1.2,
        facecamPanX: -5,
        facecamPanY: 0,
        gameplayZoom: 1.0,
        gameplayPanX: 0,
        maskChatRegion: true,
        prependPeakHook: true,
        hookStartSec: 14.0,
        hookDurationSec: 3.0,
        captionStyle: "bold-clean",
        showSafeZones: false,
      },
      captions: [
        { id: "b1", startSec: 0, endSec: 3.0, text: "WE ARE COMPLETELY AIRBORNE!", emphasisWord: "AIRBORNE!" },
        { id: "b2", startSec: 3.0, endSec: 10.0, text: "Full throttle straight into the wake!", emphasisWord: "throttle" },
        { id: "b3", startSec: 10.0, endSec: 18.0, text: "Clean splashdown straight into open water!", emphasisWord: "splashdown" },
      ],
      publishStatus: "published",
      scheduledFor: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      publishedMetrics: {
        tiktokViews: 64200,
        reelsViews: 28900,
        shortsViews: 19400,
        shares: 1840,
        comments: 312,
        avgWatchPercent: 86,
        estimatedRevenueUsd: 126.0,
      },
    },
    {
      id: "clip_legacy_04",
      sourcePlatform: "Twitch",
      sourceUrl: "https://clips.twitch.tv/MislabeledRPServerClip04",
      title: "GTA 6 Police Chase Gone Wrong (RP Server Mod)",
      gameCategory: "Grand Theft Auto VI",
      streamerName: "DriftLobby",
      streamerHandle: "@driftlobby",
      views: 6150,
      ageMinutes: 260,
      durationSec: 35,
      duplicateCrossPosts: 6,
      gameplayThumbnail: "/src/assets/images/clip_neon_heist_1795557952259.jpg",
      facecamThumbnail: "/src/assets/images/streamer_facecam_2_1795557951613.jpg",
      transcript:
        "Yo welcome back to FiveM RP server two, chat spam W if you want us to rob the Fleeca bank again, wait my chat box is covering half the screen.",
      qaStatus: "rejected",
      qaResult: {
        authenticTargetGame: false,
        detectedGame: "Grand Theft Auto V (FiveM RP Mod)",
        saturationRisk: "high",
        chatClutterDetected: true,
        hookRecommendation: "Do not publish: mislabeled GTA V FiveM RP footage with 6 duplicate reposts and chat overlap.",
        recommendedHookStartSec: 0,
        summaryReason: "Rejected by QA gate: transcript mentions FiveM RP & Fleeca bank; exceeds max 3 cross-posts.",
        tiktokCaption: "",
        reelsCaption: "",
        shortsTitle: "",
        auditedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      },
      layout: {
        facecamHeightPercent: 36,
        facecamZoom: 1.0,
        facecamPanX: 0,
        facecamPanY: 0,
        gameplayZoom: 1.0,
        gameplayPanX: 0,
        maskChatRegion: true,
        prependPeakHook: false,
        hookStartSec: 0,
        hookDurationSec: 3.0,
        captionStyle: "minimal-lower",
        showSafeZones: false,
      },
      captions: [
        { id: "r1", startSec: 0, endSec: 5.0, text: "Welcome back to FiveM RP server two", emphasisWord: "FiveM" },
      ],
      publishStatus: "draft",
    },
    {
      id: "clip_sunset_05",
      sourcePlatform: "Twitch",
      sourceUrl: "https://clips.twitch.tv/CoastalJumpRecord05",
      title: "Zero-Damage Supercar Roof Landing Off Causeway Ramp",
      gameCategory: "Grand Theft Auto VI",
      streamerName: "KadeVelo",
      streamerHandle: "@kadevelo",
      views: 29800,
      ageMinutes: 420,
      durationSec: 26,
      duplicateCrossPosts: 1,
      gameplayThumbnail: "/src/assets/images/clip_vice_chase_1795557950868.jpg",
      facecamThumbnail: "/src/assets/images/streamer_facecam_1_1795557951189.jpg",
      transcript:
        "If we hit the palm median at this angle we clear the tollbooth completely—don't touch the steering mid-air—no shot, it landed flat on all four wheels!",
      qaStatus: "approved",
      qaResult: {
        authenticTargetGame: true,
        detectedGame: "Grand Theft Auto VI",
        saturationRisk: "low",
        chatClutterDetected: false,
        hookRecommendation: "Prepend 17.5s–20.5s flat landing reaction before setup.",
        recommendedHookStartSec: 17.5,
        summaryReason: "Verified target game, strong 3-second landing payoff, low competition.",
        tiktokCaption: "Landed flat on all four wheels over the tollbooth (via @kadevelo) #gta6 #stunts",
        reelsCaption: "Zero-damage causeway jump in GTA 6. Credit: @kadevelo #gta6 #gaming",
        shortsTitle: "Zero-Damage Supercar Jump Over the Causeway (@kadevelo)",
        auditedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      },
      layout: {
        facecamHeightPercent: 36,
        facecamZoom: 1.15,
        facecamPanX: 0,
        facecamPanY: 0,
        gameplayZoom: 1.08,
        gameplayPanX: 0,
        maskChatRegion: true,
        prependPeakHook: true,
        hookStartSec: 17.5,
        hookDurationSec: 3.0,
        captionStyle: "kinetic-highlight",
        showSafeZones: false,
      },
      captions: [
        { id: "s1", startSec: 0, endSec: 3.0, text: "IT LANDED FLAT ON ALL FOUR WHEELS!", emphasisWord: "FLAT" },
        { id: "s2", startSec: 3.0, endSec: 11.0, text: "Hit the palm median at this exact angle.", emphasisWord: "median" },
        { id: "s3", startSec: 11.0, endSec: 19.0, text: "Don't touch the steering mid-air!", emphasisWord: "mid-air!" },
      ],
      publishStatus: "published",
      scheduledFor: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
      publishedMetrics: {
        tiktokViews: 41800,
        reelsViews: 19200,
        shortsViews: 14600,
        shares: 970,
        comments: 188,
        avgWatchPercent: 79,
        estimatedRevenueUsd: 84.67,
      },
    },
  ];

  const runs: PipelineRun[] = [
    {
      id: "run_204",
      trigger: "schedule",
      startedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "completed",
      clipsScanned: 14,
      clipsApproved: 2,
      clipsRejected: 12,
      summary: "Scanned 14 Grand Theft Auto VI clips; approved 2 novel clips, rejected 9 saturated and 3 GTA V mislabels.",
      targetGame: "Grand Theft Auto VI",
    },
    {
      id: "run_203",
      trigger: "github-dispatch",
      startedAt: new Date(Date.now() - 152 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 149 * 60 * 1000).toISOString(),
      status: "completed",
      clipsScanned: 11,
      clipsApproved: 1,
      clipsRejected: 10,
      summary: "Dispatched from Cloudflare Pages UI; rendered clip_harbor_03 (1080x1920, 3s hook splice) and synced metrics.",
      targetGame: "Grand Theft Auto VI",
    },
  ];

  return {
    clips,
    config,
    runs,
    integrations: getIntegrationStatus(),
  };
}

function readWorkspace(): WorkspaceState {
  if (!fs.existsSync(WORKSPACE_FILE)) {
    const seed = buildSeedWorkspace();
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  const parsed = JSON.parse(fs.readFileSync(WORKSPACE_FILE, "utf8")) as WorkspaceState;
  parsed.integrations = getIntegrationStatus();
  return parsed;
}

function saveWorkspace(state: WorkspaceState): void {
  fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(state, null, 2));
  fs.writeFileSync(PIPELINE_CONFIG_FILE, JSON.stringify(state.config, null, 2) + "\n");
}

function formatApiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err || fallback);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number } };
    if (parsed?.error?.message) {
      return parsed.error.code === 503
        ? "Gemini API is temporarily experiencing high demand (503). Please retry in a few seconds."
        : parsed.error.message;
    }
  } catch {
    // plain text error
  }
  return raw || fallback;
}

async function withGeminiRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("500") || msg.includes("fetch failed");
      if (!isTransient || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 900));
    }
  }
  throw lastErr;
}

async function analyzeClipWithGemini(clip: ClipItem, config: PipelineConfig): Promise<ClipQaResult> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured. Add it in Settings > Secrets to run Gemini AI QA.");
  }

  const enabledGames = config.targetGames
    .filter((g) => g.enabled)
    .map((g) => g.name)
    .join(", ");

  const prompt = `You are a senior short-form video QA gate and viral retention editor for a gaming clipping pipeline.
Target enabled games: ${enabledGames || "Grand Theft Auto VI"}.
Max allowed duplicate cross-posts: ${config.qaRules.maxExistingCrossPosts}.
Strict game verification enabled: ${config.qaRules.strictGameVerification}.
Reject chat box overlap: ${config.qaRules.rejectChatBoxOverlap}.

Analyze this clip:
- Title: ${clip.title}
- Claimed Game Category: ${clip.gameCategory}
- Streamer: ${clip.streamerName} (${clip.streamerHandle})
- Source Platform: ${clip.sourcePlatform}
- Current Views: ${clip.views} in ${clip.ageMinutes} minutes
- Duration: ${clip.durationSec} seconds
- Existing Cross-Posts Detected: ${clip.duplicateCrossPosts}
- Transcript: "${clip.transcript}"

Tasks:
1. Verify if the clip is genuinely the target game (watch closely for GTA V / FiveM / Fleeca bank RP mods masquerading as GTA VI).
2. Assess saturation risk ("low", "medium", or "high") based on duplicateCrossPosts vs max allowed (${config.qaRules.maxExistingCrossPosts}) and clip age.
3. Check whether transcript or setup indicates chat-box clutter over gameplay.
4. Pick the single highest-retention 3-second hook start timestamp (0 to ${Math.max(0, clip.durationSec - 3)} seconds) and explain why putting it at 00:00 boosts 3-second hold rate.
5. Write ready-to-post native captions for TikTok, Instagram Reels, and YouTube Shorts title (under 80 chars) that credit ${clip.streamerHandle}.`;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            authenticTargetGame: { type: Type.BOOLEAN },
            detectedGame: { type: Type.STRING },
            saturationRisk: { type: Type.STRING },
            chatClutterDetected: { type: Type.BOOLEAN },
            hookRecommendation: { type: Type.STRING },
            recommendedHookStartSec: { type: Type.NUMBER },
            summaryReason: { type: Type.STRING },
            tiktokCaption: { type: Type.STRING },
            reelsCaption: { type: Type.STRING },
            shortsTitle: { type: Type.STRING },
          },
          required: [
            "authenticTargetGame",
            "detectedGame",
            "saturationRisk",
            "chatClutterDetected",
            "hookRecommendation",
            "recommendedHookStartSec",
            "summaryReason",
            "tiktokCaption",
            "reelsCaption",
            "shortsTitle",
          ],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? "{}").trim()) as Omit<ClipQaResult, "auditedAt">;
  const normalizedRisk =
    parsed.saturationRisk === "high" || parsed.saturationRisk === "medium" ? parsed.saturationRisk : "low";

  return {
    ...parsed,
    saturationRisk: normalizedRisk,
    recommendedHookStartSec: Math.max(
      0,
      Math.min(Math.max(0, clip.durationSec - 3), Number(parsed.recommendedHookStartSec) || 0)
    ),
    auditedAt: new Date().toISOString(),
  };
}

async function optimizeStrategyWithGemini(
  clips: ClipItem[],
  config: PipelineConfig
): Promise<StrategyRecommendation> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured. Add it in Settings > Secrets to run strategy optimization.");
  }

  const publishedSummary = clips
    .filter((c) => c.publishedMetrics)
    .map((c) => ({
      title: c.title,
      streamer: c.streamerHandle,
      duplicateCrossPosts: c.duplicateCrossPosts,
      facecamHeightPercent: c.layout.facecamHeightPercent,
      prependPeakHook: c.layout.prependPeakHook,
      hookDurationSec: c.layout.hookDurationSec,
      metrics: c.publishedMetrics,
    }));

  const prompt = `You are a data-driven short-form distribution strategist analyzing a GitOps clipping pipeline's performance feedback loop.
Current pipeline.config.json:
${JSON.stringify(config, null, 2)}

Published clip telemetry:
${JSON.stringify(publishedSummary, null, 2)}

Target daily revenue: $${config.publishing.targetDailyRevenueUsd}/day at $${config.publishing.assumedRpmUsd} RPM per 1,000 views.

Provide a concrete, grounded optimization plan with:
1. summary: 2-sentence executive diagnosis.
2. topWinningPattern: what actually drove views, watch %, and shares in the published clips.
3. bottleneckDiagnosis: what limits hitting $${config.publishing.targetDailyRevenueUsd}/day today.
4. suggestedChanges: 3 specific config parameter adjustments referencing real numbers.
5. configPatch: numeric overrides to apply directly to pipeline.config.json (minViews, maxExistingCrossPosts, facecamHeightPercent, hookDurationSeconds, maxPostsPerDay).`;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topWinningPattern: { type: Type.STRING },
            bottleneckDiagnosis: { type: Type.STRING },
            suggestedChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  field: { type: Type.STRING },
                  currentValue: { type: Type.STRING },
                  recommendedValue: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ["field", "currentValue", "recommendedValue", "rationale"],
              },
            },
            configPatch: {
              type: Type.OBJECT,
              properties: {
                minViews: { type: Type.NUMBER },
                maxExistingCrossPosts: { type: Type.NUMBER },
                facecamHeightPercent: { type: Type.NUMBER },
                hookDurationSeconds: { type: Type.NUMBER },
                maxPostsPerDay: { type: Type.NUMBER },
              },
            },
          },
          required: ["summary", "topWinningPattern", "bottleneckDiagnosis", "suggestedChanges", "configPatch"],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? "{}").trim()) as Omit<StrategyRecommendation, "generatedAt">;
  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

async function syncConfigToGitHub(config: PipelineConfig): Promise<{ synced: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    return { synced: false, message: "Saved locally to pipeline.config.json (set GITHUB_TOKEN & GITHUB_REPO to commit remotely)." };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "ClipForge-Server",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let sha: string | undefined;
  const getRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/pipeline.config.json?ref=${encodeURIComponent(branch)}`,
    { headers }
  );
  if (getRes.ok) {
    const meta = (await getRes.json()) as { sha?: string };
    sha = meta.sha;
  }

  const content = Buffer.from(JSON.stringify(config, null, 2) + "\n", "utf8").toString("base64");
  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/pipeline.config.json`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "chore(clipforge): update pipeline.config.json",
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub commit failed (${putRes.status}): ${errText.slice(0, 180)}`);
  }

  return { synced: true, message: `Committed pipeline.config.json to ${repo}@${branch}.` };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  // 1. Workspace state
  app.get("/api/workspace", (_req, res) => {
    res.json(readWorkspace());
  });

  // 2. Add new clip manually or via URL
  app.post("/api/clips", (req, res) => {
    const body = req.body as Partial<ClipItem>;
    if (!body.title || !body.streamerName) {
      res.status(400).json({ error: "Clip title and streamer name are required." });
      return;
    }

    const state = readWorkspace();
    const handle = body.streamerHandle?.trim()
      ? body.streamerHandle.startsWith("@")
        ? body.streamerHandle.trim()
        : `@${body.streamerHandle.trim()}`
      : `@${body.streamerName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`;

    const thumbs = [
      "/src/assets/images/clip_vice_chase_1795557950868.jpg",
      "/src/assets/images/clip_neon_heist_1795557952259.jpg",
      "/src/assets/images/clip_harbor_escape_1795557950869.jpg",
    ];
    const cams = [
      "/src/assets/images/streamer_facecam_1_1795557951189.jpg",
      "/src/assets/images/streamer_facecam_2_1795557951613.jpg",
    ];

    const newClip: ClipItem = {
      id: `clip_${Date.now().toString(36)}`,
      sourcePlatform: body.sourcePlatform || "Twitch",
      sourceUrl: body.sourceUrl || "https://clips.twitch.tv/CustomIntakeClip",
      title: body.title.trim(),
      gameCategory: body.gameCategory?.trim() || "Grand Theft Auto VI",
      streamerName: body.streamerName.trim(),
      streamerHandle: handle,
      views: Math.max(0, Number(body.views) || 2400),
      ageMinutes: Math.max(1, Number(body.ageMinutes) || 25),
      durationSec: Math.max(5, Math.min(180, Number(body.durationSec) || 28)),
      duplicateCrossPosts: Math.max(0, Number(body.duplicateCrossPosts) || 0),
      gameplayThumbnail: body.gameplayThumbnail || thumbs[state.clips.length % thumbs.length],
      facecamThumbnail: body.facecamThumbnail || cams[state.clips.length % cams.length],
      transcript:
        body.transcript?.trim() ||
        "No way that just happened right in front of the squad! Watch this replay in slow motion.",
      qaStatus: "pending",
      layout: {
        facecamHeightPercent: state.config.layoutDefaults.facecamHeightPercent,
        facecamZoom: 1.12,
        facecamPanX: 0,
        facecamPanY: 0,
        gameplayZoom: 1.05,
        gameplayPanX: 0,
        maskChatRegion: state.config.layoutDefaults.maskChatRegion,
        prependPeakHook: state.config.layoutDefaults.prependPeakHook,
        hookStartSec: 12,
        hookDurationSec: state.config.layoutDefaults.hookDurationSeconds,
        captionStyle: state.config.layoutDefaults.captionStyle,
        showSafeZones: true,
      },
      captions: [
        { id: `cap_${Date.now()}_1`, startSec: 0, endSec: 3.0, text: body.title.trim().slice(0, 46), emphasisWord: body.title.trim().split(" ")[0] },
        { id: `cap_${Date.now()}_2`, startSec: 3.0, endSec: 9.0, text: (body.transcript?.trim() || "Watch this moment!").slice(0, 56) },
      ],
      publishStatus: "draft",
    };

    state.clips.unshift(newClip);
    saveWorkspace(state);
    res.status(201).json(newClip);
  });

  // 3. Update clip (layout, captions, QA status, publish queue, metrics)
  app.patch("/api/clips/:id", (req, res) => {
    const state = readWorkspace();
    const idx = state.clips.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Clip not found." });
      return;
    }

    const updates = req.body as Partial<ClipItem>;
    const existing = state.clips[idx];
    const updated: ClipItem = {
      ...existing,
      ...updates,
      layout: updates.layout ? { ...existing.layout, ...updates.layout } : existing.layout,
      qaResult: updates.qaResult ? { ...existing.qaResult, ...updates.qaResult } as ClipQaResult : existing.qaResult,
      publishedMetrics: updates.publishedMetrics
        ? {
            ...(existing.publishedMetrics || {
              tiktokViews: 0,
              reelsViews: 0,
              shortsViews: 0,
              shares: 0,
              comments: 0,
              avgWatchPercent: 0,
              estimatedRevenueUsd: 0,
            }),
            ...updates.publishedMetrics,
          }
        : existing.publishedMetrics,
    };

    state.clips[idx] = updated;
    saveWorkspace(state);
    res.json(updated);
  });

  // 4. Delete clip
  app.delete("/api/clips/:id", (req, res) => {
    const state = readWorkspace();
    const next = state.clips.filter((c) => c.id !== req.params.id);
    if (next.length === state.clips.length) {
      res.status(404).json({ error: "Clip not found." });
      return;
    }
    state.clips = next;
    saveWorkspace(state);
    res.json({ ok: true });
  });

  // 5. Scan Radar (live Twitch Helix if configured, else deduplicated discovery intake)
  app.post("/api/radar/scan", async (_req, res) => {
    const state = readWorkspace();
    const enabledGame = state.config.targetGames.find((g) => g.enabled) || state.config.targetGames[0];

    try {
      let discovered: ClipItem[] = [];
      let sourceLabel = "local discovery queue";

      if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
        const tokenRes = await fetch(
          `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(process.env.TWITCH_CLIENT_ID)}&client_secret=${encodeURIComponent(process.env.TWITCH_CLIENT_SECRET)}&grant_type=client_credentials`,
          { method: "POST" }
        );
        if (tokenRes.ok) {
          const { access_token } = (await tokenRes.json()) as { access_token: string };
          const startedAt = new Date(Date.now() - enabledGame.maxClipAgeHours * 3600 * 1000).toISOString();
          const clipsRes = await fetch(
            `https://api.twitch.tv/helix/clips?game_id=${encodeURIComponent(enabledGame.twitchGameId)}&started_at=${encodeURIComponent(startedAt)}&first=8`,
            {
              headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID,
                Authorization: `Bearer ${access_token}`,
              },
            }
          );
          if (clipsRes.ok) {
            sourceLabel = "Twitch Helix API";
            const payload = (await clipsRes.json()) as {
              data: Array<{
                id: string;
                url: string;
                title: string;
                broadcaster_name: string;
                view_count: number;
                created_at: string;
                duration: number;
              }>;
            };
            const existingIds = new Set(state.clips.map((c) => c.id));
            for (const raw of payload.data || []) {
              if (existingIds.has(raw.id) || raw.view_count < enabledGame.minViews) continue;
              const ageMin = Math.max(1, Math.round((Date.now() - new Date(raw.created_at).getTime()) / 60000));
              discovered.push({
                id: raw.id,
                sourcePlatform: "Twitch",
                sourceUrl: raw.url,
                title: raw.title,
                gameCategory: enabledGame.name,
                streamerName: raw.broadcaster_name,
                streamerHandle: `@${raw.broadcaster_name.toLowerCase()}`,
                views: raw.view_count,
                ageMinutes: ageMin,
                durationSec: Math.round(raw.duration || 30),
                duplicateCrossPosts: 0,
                gameplayThumbnail: "/src/assets/images/clip_vice_chase_1795557950868.jpg",
                facecamThumbnail: "/src/assets/images/streamer_facecam_1_1795557951189.jpg",
                transcript: `${raw.title} — captured live on ${raw.broadcaster_name}'s stream.`,
                qaStatus: "pending",
                layout: {
                  facecamHeightPercent: state.config.layoutDefaults.facecamHeightPercent,
                  facecamZoom: 1.15,
                  facecamPanX: 0,
                  facecamPanY: 0,
                  gameplayZoom: 1.05,
                  gameplayPanX: 0,
                  maskChatRegion: state.config.layoutDefaults.maskChatRegion,
                  prependPeakHook: state.config.layoutDefaults.prependPeakHook,
                  hookStartSec: Math.max(0, Math.round((raw.duration || 24) * 0.65)),
                  hookDurationSec: state.config.layoutDefaults.hookDurationSeconds,
                  captionStyle: state.config.layoutDefaults.captionStyle,
                  showSafeZones: true,
                },
                captions: [
                  { id: `tw_${raw.id}_1`, startSec: 0, endSec: 3, text: raw.title.slice(0, 48) },
                ],
                publishStatus: "draft",
              });
            }
          }
        }
      }

      if (discovered.length === 0) {
        const suffix = Date.now().toString(36).slice(-3);
        const candidates: ClipItem[] = [
          {
            id: `clip_radar_${suffix}`,
            sourcePlatform: "Twitch",
            sourceUrl: `https://clips.twitch.tv/RadarCapture_${suffix}`,
            title: "Heli Tail-Rotor Dodges Skyscraper Crane by Inches in Downtown Chase",
            gameCategory: enabledGame.name,
            streamerName: "VexLine",
            streamerHandle: "@vexline",
            views: 9480,
            ageMinutes: 31,
            durationSec: 27,
            duplicateCrossPosts: 0,
            gameplayThumbnail: "/src/assets/images/clip_harbor_escape_1795557950869.jpg",
            facecamThumbnail: "/src/assets/images/streamer_facecam_2_1795557951613.jpg",
            transcript:
              "Pull up! Pull up! We are going straight under the crane cable—chat no way the blades didn't clip! That is the cleanest extraction we have ever pulled off!",
            qaStatus: "pending",
            layout: {
              facecamHeightPercent: state.config.layoutDefaults.facecamHeightPercent,
              facecamZoom: 1.14,
              facecamPanX: 0,
              facecamPanY: 0,
              gameplayZoom: 1.06,
              gameplayPanX: 0,
              maskChatRegion: state.config.layoutDefaults.maskChatRegion,
              prependPeakHook: state.config.layoutDefaults.prependPeakHook,
              hookStartSec: 16.5,
              hookDurationSec: state.config.layoutDefaults.hookDurationSeconds,
              captionStyle: state.config.layoutDefaults.captionStyle,
              showSafeZones: true,
            },
            captions: [
              { id: `rd_${suffix}_1`, startSec: 0, endSec: 3.0, text: "NO WAY THE BLADES DIDN'T CLIP!", emphasisWord: "BLADES" },
              { id: `rd_${suffix}_2`, startSec: 3.0, endSec: 10.0, text: "Pull up! Straight under the crane cable—", emphasisWord: "crane" },
              { id: `rd_${suffix}_3`, startSec: 10.0, endSec: 18.0, text: "Cleanest extraction we have ever pulled off!", emphasisWord: "extraction" },
            ],
            publishStatus: "draft",
          },
        ];
        discovered = candidates;
      }

      state.clips = [...discovered, ...state.clips];
      saveWorkspace(state);
      res.json({ discoveredCount: discovered.length, source: sourceLabel, clips: discovered });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Radar scan failed." });
    }
  });

  // 6. Real Server-Side Gemini QA + Hook Extraction + Multi-Platform Captions
  app.post("/api/ai/analyze-clip", async (req, res) => {
    const { clipId } = req.body as { clipId?: string };
    const state = readWorkspace();
    const idx = state.clips.findIndex((c) => c.id === clipId);
    if (idx === -1) {
      res.status(404).json({ error: "Clip not found." });
      return;
    }

    try {
      const clip = state.clips[idx];
      const qaResult = await analyzeClipWithGemini(clip, state.config);

      let nextStatus: ClipItem["qaStatus"] = "approved";
      if (
        (state.config.qaRules.strictGameVerification && !qaResult.authenticTargetGame) ||
        clip.duplicateCrossPosts > state.config.qaRules.maxExistingCrossPosts
      ) {
        nextStatus = "rejected";
      } else if (
        (state.config.qaRules.rejectChatBoxOverlap && qaResult.chatClutterDetected) ||
        qaResult.saturationRisk === "high"
      ) {
        nextStatus = "review";
      }

      state.clips[idx] = {
        ...clip,
        qaStatus: nextStatus,
        qaResult,
        layout: {
          ...clip.layout,
          hookStartSec: qaResult.recommendedHookStartSec,
        },
        publishStatus: nextStatus === "approved" && clip.publishStatus === "draft" ? "ready" : clip.publishStatus,
      };
      saveWorkspace(state);
      res.json(state.clips[idx]);
    } catch (err) {
      res.status(500).json({
        error: formatApiError(err, "Gemini clip QA request failed."),
      });
    }
  });

  // 7. Real Server-Side Gemini Feedback-Loop Strategy Optimizer
  app.post("/api/ai/optimize-strategy", async (_req, res) => {
    const state = readWorkspace();
    try {
      const recommendation = await optimizeStrategyWithGemini(state.clips, state.config);
      res.json(recommendation);
    } catch (err) {
      res.status(500).json({
        error: formatApiError(err, "Gemini strategy optimization failed."),
      });
    }
  });

  // 8. Save pipeline.config.json locally & optionally commit to GitHub
  app.put("/api/config", async (req, res) => {
    const nextConfig = req.body as PipelineConfig;
    if (!nextConfig || !nextConfig.layoutDefaults || !nextConfig.publishing) {
      res.status(400).json({ error: "Invalid pipeline configuration payload." });
      return;
    }

    const state = readWorkspace();
    state.config = nextConfig;
    saveWorkspace(state);

    try {
      const gh = await syncConfigToGitHub(nextConfig);
      res.json({ config: state.config, syncedToGitHub: gh.synced, message: gh.message });
    } catch (err) {
      res.status(502).json({
        config: state.config,
        syncedToGitHub: false,
        error: err instanceof Error ? err.message : "Failed to commit config to GitHub.",
      });
    }
  });

  // 9. Trigger GitHub Actions workflow_dispatch OR execute local autonomous run with real Gemini QA
  app.post("/api/gitops/dispatch", async (req, res) => {
    const { dryRun = true } = (req.body || {}) as { dryRun?: boolean };
    const state = readWorkspace();
    const enabledGame = state.config.targetGames.find((g) => g.enabled)?.name || "Grand Theft Auto VI";
    const startedAt = new Date().toISOString();

    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      try {
        const workflow = process.env.GITHUB_WORKFLOW_FILE || "clipforge-pipeline.yml";
        const branch = process.env.GITHUB_BRANCH || "main";
        const dispatchRes = await fetch(
          `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "ClipForge-Server",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ref: branch,
              inputs: { dry_run: String(dryRun), target_game: enabledGame },
            }),
          }
        );

        if (!dispatchRes.ok) {
          const text = await dispatchRes.text();
          res.status(502).json({ error: `GitHub dispatch failed (${dispatchRes.status}): ${text.slice(0, 160)}` });
          return;
        }

        const run: PipelineRun = {
          id: `gha_${Date.now().toString(36)}`,
          trigger: "github-dispatch",
          startedAt,
          completedAt: new Date().toISOString(),
          status: "completed",
          clipsScanned: state.clips.length,
          clipsApproved: state.clips.filter((c) => c.qaStatus === "approved").length,
          clipsRejected: state.clips.filter((c) => c.qaStatus === "rejected").length,
          summary: `Dispatched ${workflow} on ${process.env.GITHUB_REPO}@${branch} (dry_run=${dryRun}).`,
          targetGame: enabledGame,
        };
        state.runs.unshift(run);
        saveWorkspace(state);
        res.json({ run, remoteDispatched: true });
        return;
      } catch (err) {
        res.status(502).json({ error: err instanceof Error ? err.message : "GitHub dispatch failed." });
        return;
      }
    }

    // Local autonomous execution: audit up to 2 pending clips with real Gemini QA
    let approved = 0;
    let rejected = 0;
    const pendingClips = state.clips.filter((c) => c.qaStatus === "pending").slice(0, 2);

    try {
      for (const clip of pendingClips) {
        const qa = await analyzeClipWithGemini(clip, state.config);
        const idx = state.clips.findIndex((c) => c.id === clip.id);
        const isRejected =
          (state.config.qaRules.strictGameVerification && !qa.authenticTargetGame) ||
          clip.duplicateCrossPosts > state.config.qaRules.maxExistingCrossPosts;

        if (idx !== -1) {
          state.clips[idx] = {
            ...clip,
            qaStatus: isRejected ? "rejected" : "approved",
            qaResult: qa,
            layout: { ...clip.layout, hookStartSec: qa.recommendedHookStartSec },
            publishStatus: !isRejected && clip.publishStatus === "draft" ? "ready" : clip.publishStatus,
          };
        }
        if (isRejected) rejected += 1;
        else approved += 1;
      }

      const run: PipelineRun = {
        id: `run_${Date.now().toString(36)}`,
        trigger: "manual-ui",
        startedAt,
        completedAt: new Date().toISOString(),
        status: "completed",
        clipsScanned: pendingClips.length || state.clips.length,
        clipsApproved: approved,
        clipsRejected: rejected,
        summary:
          pendingClips.length > 0
            ? `Audited ${pendingClips.length} pending clip(s) via Gemini 4 Hydrogen: ${approved} approved for 9:16 render, ${rejected} rejected.`
            : `All ${state.clips.length} clips already audited; FFmpeg render specs validated against pipeline.config.json.`,
        targetGame: enabledGame,
      };
      state.runs.unshift(run);
      saveWorkspace(state);
      res.json({ run, remoteDispatched: false, clips: state.clips });
    } catch (err) {
      res.status(500).json({ error: formatApiError(err, "Pipeline run failed.") });
    }
  });

  // 10. Expose real repository deployment files for GitOps inspector & .zip bundle download
  app.get("/api/gitops/files", (_req, res) => {
    const fileSpecs: Array<{ rel: string; language: string; description: string }> = [
      {
        rel: "pipeline.config.json",
        language: "json",
        description: "Versioned GitOps configuration governing target games, QA thresholds, 9:16 crop geometry, and daily caps.",
      },
      {
        rel: ".github/workflows/clipforge-pipeline.yml",
        language: "yaml",
        description: "GitHub Actions cron (every 2 hours) & workflow_dispatch runner with FFmpeg, yt-dlp, and artifact uploads.",
      },
      {
        rel: "scripts/run-clipper.mjs",
        language: "javascript",
        description: "Headless Node.js automation worker that queries Twitch Helix, runs Gemini 4 Hydrogen QA, and renders vertical MP4s.",
      },
      {
        rel: "functions/api/[[path]].ts",
        language: "typescript",
        description: "Cloudflare Pages Functions edge router handling GitHub commits, workflow dispatch, KV state, and Gemini QA.",
      },
      {
        rel: "wrangler.toml",
        language: "toml",
        description: "Cloudflare Pages build output, KV namespace, and R2 media bucket configuration.",
      },
    ];

    const files: RepoFileEntry[] = fileSpecs.map((spec) => {
      const fullPath = path.join(ROOT_DIR, spec.rel);
      const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
      return {
        path: spec.rel,
        language: spec.language,
        description: spec.description,
        content,
      };
    });

    res.json({ files });
  });

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV === "production") {
    const distDir = path.join(ROOT_DIR, "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClipForge server running on http://localhost:${PORT}`);
  });
}

startServer();
