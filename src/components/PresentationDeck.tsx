import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  Grid,
  Layers,
  Maximize2,
  Minimize2,
  PlayCircle,
  Search,
  Sparkles,
  Youtube,
} from "lucide-react";
import type { ClipItem, PipelineConfig, TelemetryEvent, WorkspaceTab } from "../types";

interface PresentationDeckProps {
  clips: ClipItem[];
  config: PipelineConfig;
  telemetry: TelemetryEvent[];
  affiliateCount?: number;
  landingPageCount?: number;
  longFormCount?: number;
  activeAlertCount?: number;
  onJumpToTab: (tab: WorkspaceTab) => void;
  onOpenSettings?: () => void;
}

type ChapterCategory = "all" | "research" | "studio" | "distribution" | "infra";

interface YoutubeSource {
  channel: string;
  topic: string;
  whyWatch: string;
  url: string;
}

interface WorkflowStep {
  step: string;
  action: string;
  outcome: string;
}

interface DeckChapter {
  id: string;
  number: string;
  category: Exclude<ChapterCategory, "all">;
  title: string;
  subtitle: string;
  targetTab: WorkspaceTab | "settings";
  targetLabel: string;
  heroImage: string;
  imageCaption: string;
  competitorBeat: {
    rival: string;
    complaint: string;
    clipforgeUpgrade: string;
  };
  whatAndWhy: string[];
  workflow: WorkflowStep[];
  workedExample: {
    scenario: string;
    input: string;
    output: string;
    result: string;
  };
  featureBreakdown: Array<{ name: string; detail: string }>;
  youtubeSources: YoutubeSource[];
}

const IMG_ARCHITECTURE = "/src/assets/images/deck_workflow_architecture_1795646087828.jpg";
const IMG_RETENTION = "/src/assets/images/deck_retention_hook_anatomy_1795646087388.jpg";
const IMG_RESEARCH = "/src/assets/images/deck_outlier_research_radar_1795646089464.jpg";
const IMG_AUDIO = "/src/assets/images/deck_voiceover_audio_studio_1795646090417.jpg";
const IMG_SCALE = "/src/assets/images/deck_hybrid_local_vps_scale_1795646090011.jpg";

const DECK_CHAPTERS: DeckChapter[] = [
  {
    id: "ch01-architecture",
    number: "01",
    category: "infra",
    title: "Studio Dashboard: Simple vs. Pro & End-to-End Pipeline",
    subtitle: "Why one unified Studio Dashboard + Hybrid AI control room replaces 7 separate monthly subscriptions",
    targetTab: "dashboard",
    targetLabel: "Open Studio Dashboard",
    heroImage: IMG_ARCHITECTURE,
    imageCaption: "ClipForge End-to-End Architecture: Studio Dashboard → Research → Studio → Monetization Hub → Closed-Loop Learning",
    competitorBeat: {
      rival: "Fragmented Stack (OpusClip + Submagic + Repurpose.io + VidIQ + ClickFunnels = $260+/mo)",
      complaint: "Creators waste 40% of production time downloading MP4s from one SaaS, uploading to another for captions, then debugging broken affiliate spreadsheets in a third.",
      clipforgeUpgrade: "Single modular Studio Dashboard separating Action Queue from Telemetry across 5 top-level categories (Overview, Research & Intelligence before Production, Production, Monetization & Growth, Infrastructure & Training) with Simple Mode and Pro Studio Mode (all 21 dedicated workspaces).",
    },
    whatAndWhy: [
      "ClipForge treats short-form content like a measurable broadcast business instead of random editing. The Studio Dashboard surfaces exactly what requires your decision right now (clips pending QA, +15% ROI surges, competitor releases, autonomous self-learning proposals) while keeping 6-month revenue trajectory and Windows PC LM Studio health visible beside it.",
      "Research & Intelligence sits directly BEFORE Production as its own 4-page category (Research Command Center, Opportunity & Gap Radar, Social/Comments & Sentiment Lab, Competitor & Trend Intelligence) so every clip enters Cut Studio or the Faceless & Long-Form Builder backed by real search gaps and buyer-intent comments.",
    ],
    workflow: [
      { step: "01 · Discover", action: "TrendPulse & Outlier Radar scan live signals", outcome: "Only 3x+ outlier ideas enter the bin" },
      { step: "02 · Craft", action: "9:16 Studio + Gemini Hook Grader + TTS Voiceover", outcome: "Sub-3-second hook retention verified before render" },
      { step: "03 · Scale", action: "Batch Template Applier + 12-Language Localization", outcome: "1 source clip multiplies into 6+ regional shorts" },
      { step: "04 · Learn", action: "Hourly Velocity Telemetry + Closed-Loop Optimizer", outcome: "System auto-tunes views threshold & hook duration" },
    ],
    workedExample: {
      scenario: "Solo creator scaling from 1 gaming channel to 4 multi-niche Shorts channels",
      input: "1 trending clip + 15 minutes daily in Easy Mode",
      output: "Graded 9:16 short with 24kHz Kore TTS narration, EN/ES/PT captions, and 6-platform SEO pack",
      result: "3.4x higher output velocity with $0 per-minute SaaS credit burn.",
    },
    featureBreakdown: [
      { name: "Easy / Pro Dual Workspace", detail: "Instant mode switcher in TopBar persists in localStorage without losing active clip state." },
      { name: "Cmd+K AI Command Palette", detail: "Jump to any clip, run Gemini QA, or dispatch natural-language Director commands from anywhere." },
      { name: "GitOps Single Source of Truth", detail: "All thresholds, hotkeys, slang rules, and syndication rules live in version-controlled pipeline.config.json." },
      { name: "Bulk Metadata JSON Export", detail: "Download transcripts, hook variants, and QA notes for selected clips to train downstream workflows." },
    ],
    youtubeSources: [
      {
        channel: "Colin and Samir",
        topic: "How Top Short-Form Media Companies Systemize Production",
        whyWatch: "Breaks down the producer mindset behind repeatable creator systems and why packaging beats editing.",
        url: "https://www.youtube.com/results?search_query=Colin+and+Samir+short+form+content+system",
      },
      {
        channel: "Primal Video",
        topic: "Complete YouTube Shorts & Vertical Video Workflow Guide",
        whyWatch: "Clear walkthrough of batching, scripting, and publishing vertical video efficiently.",
        url: "https://www.youtube.com/results?search_query=Primal+Video+YouTube+Shorts+workflow",
      },
    ],
  },
  {
    id: "ch02-outlier-research",
    number: "02",
    category: "research",
    title: "Data-Driven Research, Outlier Radar & Faceless Story Builder",
    subtitle: "Research is where shorts win or die — stop guessing topics and measure channel outlier multipliers",
    targetTab: "research-hub",
    targetLabel: "Open Research Command Center",
    heroImage: IMG_RESEARCH,
    imageCaption: "1of10 Outlier Multiplier + Velocity-per-Minute (VPM) + Saturation Guard",
    competitorBeat: {
      rival: "1of10 ($49/mo) & Crayo ($39/mo)",
      complaint: "1of10 only shows ideas without building the video; Crayo generates generic 'brainrot' Minecraft/Subway Surfers spam that triggers TikTok/YouTube unoriginality suppression.",
      clipforgeUpgrade: "Combines live Google Search Opportunity Discovery + 1of10 Outlier Multipliers (Views ÷ Channel Baseline) + an Anti-Brainrot Editorial Faceless Builder with 4 real narrative formats.",
    },
    whatAndWhy: [
      "A video with 25,000 views on a 500k-sub channel is a flop (0.1x). A video with 25,000 views on a 4,000-sub channel is a 6.2x Outlier—proving the topic itself has magnetic pull regardless of creator fame.",
      "Every clip in the Media Bin and every live Research Opportunity surfaces its Outlier Multiplier, Views/Minute velocity, DMCA music status, and Competitor Cross-Post saturation so you skip overcrowded clips immediately.",
      "Need original shorts without filming? Switch Ingest to Faceless Story Builder to synthesize structured 4-beat editorial scripts (Authority Tech, Reddit Debate, Mystery Documentary, or Split-Loop Explainer) with timed captions and B-Roll cues.",
    ],
    workflow: [
      { step: "01 · Scan", action: "Run Live Multi-Niche Opportunity Scanner (Google Search)", outcome: "Fresh breakout topics across Gaming, AI, Finance, Podcasts" },
      { step: "02 · Filter", action: "Check Outlier ≥ 3.0x and Rival Cross-Posts ≤ 2", outcome: "Eliminates saturated, stale clips before editing" },
      { step: "03 · Synthesize", action: "1-click Turn into Clip or Faceless Story Builder", outcome: "Pre-populated script, hook banner, captions & B-roll in Studio" },
    ],
    workedExample: {
      scenario: "Spotting a breakout local-AI benchmark story before big channels cover it",
      input: "Research Query: 'Local AI Gemma 4 2B benchmarks' -> Outlier score 5.4x, Competition: Low",
      output: "Faceless 'Authority Tech' 30s script with curiosity hook + 6 timed caption beats + 3 zoom/B-roll cues",
      result: "Published 4 hours ahead of competing tech Shorts channels with zero filming.",
    },
    featureBreakdown: [
      { name: "1of10 Outlier Multiplier", detail: "Calculates clip views divided by creator baseline across Media Bin rows and Research cards." },
      { name: "Live Google Search Grounding", detail: "Pulls real-time breaking topics via Gemini Search grounding across 6 customizable niches." },
      { name: "Anti-Brainrot Faceless Builder", detail: "Generates editorial scripts, timed captions, and B-roll beats across 4 high-retention styles." },
      { name: "Streamer Rights & DMCA Policy Gate", detail: "Whitelist/blocklist creators and flag copyrighted background music before a single render runs." },
    ],
    youtubeSources: [
      {
        channel: "Channel Makers",
        topic: "How to Find Outlier Video Topics That Explode Small Channels",
        whyWatch: "Data-backed breakdown of outlier ratios and why topic validation is 80% of view count.",
        url: "https://www.youtube.com/results?search_query=Channel+Makers+outlier+videos+research",
      },
      {
        channel: "Film Booth",
        topic: "How to Research Viral Ideas Using Curiosity Gaps",
        whyWatch: "Masterclass on pairing high-demand topics with irresistible curiosity framing.",
        url: "https://www.youtube.com/results?search_query=Film+Booth+viral+video+ideas+curiosity+gap",
      },
    ],
  },
  {
    id: "ch03-vod-prompt-search",
    number: "03",
    category: "research",
    title: "ClipAnything Prompt VOD Search & Context Arc Guard",
    subtitle: "Search 4-hour streams and podcasts by natural language without losing setup or punchlines",
    targetTab: "vod",
    targetLabel: "Open VOD Highlights",
    heroImage: IMG_RESEARCH,
    imageCaption: "Prompt-driven VOD indexing with automatic +2s Setup / +2s Punchline Context Arc Guard",
    competitorBeat: {
      rival: "OpusClip ClipAnything & Eklipse.gg",
      complaint: "Reddit's #1 complaint about AI clippers: 'It cuts the clip 1 second before the punchline or starts mid-sentence so viewers have zero context and swipe away.'",
      clipforgeUpgrade: "Every prompt-matched VOD moment automatically enforces a Context Arc Guard (+2s setup before the hook, +2s reaction tail after the punchline) and grades arc completeness before slicing.",
    },
    whatAndWhy: [
      "Long-form podcasts, Twitch VODs, and conference keynotes hide 10–15 viral moments buried inside 3 hours of dialogue. Scrubbing manually burns hours.",
      "With ClipAnything Prompt Search, type exactly what you want—e.g. 'find every heated debate about AI pricing' or 'find every clutch 1v3 reaction'—and Gemini returns exact start/end timestamps, hook banners, and Context-Guarded bounds.",
    ],
    workflow: [
      { step: "01 · Load VOD", action: "Paste VOD URL/transcript or select indexed broadcast", outcome: "Full timestamped transcript ready for search" },
      { step: "02 · Prompt", action: "Enter natural-language query + keep Context Arc Guard ON", outcome: "Top matching moments with setup + payoff padded" },
      { step: "03 · Slice", action: "Click 'Slice to Studio' on winning moments", outcome: "Clip lands directly in 9:16 Studio with captions & banner" },
    ],
    workedExample: {
      scenario: "Mining a 2-hour GTA 6 / Twitch livestream for shareable moments",
      input: "Prompt: 'every time chat reacts to a secret map detail or unexpected crash' + Context Guard ON",
      output: "4 exact highlight windows (e.g., 14:22–14:51, padded from 14:24–14:49) with pre-written hook banners",
      result: "Zero mid-sentence cuts; complete setup → tension → reaction arc preserved.",
    },
    featureBreakdown: [
      { name: "Natural-Language Moment Search", detail: "Query any VOD for emotions, debates, fails, hot takes, or specific technical revelations." },
      { name: "+2s/+2s Context Arc Guard", detail: "Automatically expands boundaries so intros never clip words and endings keep the emotional payoff." },
      { name: "One-Click Quick Prompts", detail: "Preset search chips for Rage/Hype, Hot Takes, Contrarian Advice, and Plot Twists." },
      { name: "Direct-to-Studio Slicing", detail: "Converts any discovered moment into an editable Studio clip with captions in one click." },
    ],
    youtubeSources: [
      {
        channel: "Dylan Reynolds",
        topic: "How to Edit Long-Form Podcasts & Streams Into Viral Shorts",
        whyWatch: "Shows exact storytelling structure (Setup → Escalation → Payoff) needed for clips to retain past 3 seconds.",
        url: "https://www.youtube.com/results?search_query=short+form+clipping+storytelling+hook+retention",
      },
    ],
  },
  {
    id: "ch04-hook-grader",
    number: "04",
    category: "studio",
    title: "3-Second Hook Grader & Predicted Retention Curve",
    subtitle: "Diagnose swipe-away drop-offs BEFORE publishing with quantitative hook scoring & 1-click fixes",
    targetTab: "studio",
    targetLabel: "Open Studio Hook Lab",
    heroImage: IMG_RETENTION,
    imageCaption: "0–3s Visual Hook Anatomy, Story Arc Completeness Score & Predicted Retention Curve",
    competitorBeat: {
      rival: "OpusClip 'Virality Score' (Black-Box Number)",
      complaint: "Creators on Reddit complain OpusClip's virality score is an opaque 0–99 number that never tells you WHY a clip will flop or HOW to fix the opening 3 seconds.",
      clipforgeUpgrade: "Breaks every clip into 4 transparent sub-scores (Overall, Story Arc Completeness, Pacing, Caption Legibility), plots a second-by-second Retention Curve chart, and provides a 1-Click Auto-Apply Fix.",
    },
    whatAndWhy: [
      "On TikTok, Reels, and YouTube Shorts, 65%+ of viewers decide whether to stay or swipe within the first 2.5 seconds. If your opening line starts with 'So guys today...', the algorithm kills distribution immediately.",
      "The Hook Grader evaluates your transcript, opening banner, and hook timestamp, simulates viewer drop-off at 0s, 3s, 6s, 10s, 15s, 20s, and 30s, and suggests a sharper hook banner + earlier start timestamp you can apply in one click.",
    ],
    workflow: [
      { step: "01 · Audit", action: "Open Studio → Hooks & Retention → Click 'Grade Hook'", outcome: "4 sub-scores + Recharts retention drop-off curve" },
      { step: "02 · Repair", action: "Click '1-Click Apply Fix' or generate 3 A/B/C variants", outcome: "Prepends peak 3s hook & updates on-canvas banner" },
      { step: "03 · Verify", action: "Press Space to preview 0–3s hook splice live on 9:16 canvas", outcome: "Confirm zero visual dead-air before queuing" },
    ],
    workedExample: {
      scenario: "Fixing a sluggish gaming clip that starts with 4 seconds of walking",
      input: "Original start: 0.0s ('Alright wait let me check this...') → Hook Score: 58/100, 3s hold: 44%",
      output: "AI suggests starting at 11.5s + banner 'WAIT FOR THE 0.1s RECOVERY' → 1-Click Apply Fix",
      result: "Predicted 3s hold jumps from 44% to 78% and Story Arc score hits 91/100.",
    },
    featureBreakdown: [
      { name: "4-Metric Transparent Grading", detail: "Scores Overall Hook, Story Arc Completeness, Pacing Speed, and Caption Legibility independently." },
      { name: "Recharts Predicted Retention Curve", detail: "Visualizes expected drop-off from 0s through clip end so you see exact weak seconds." },
      { name: "1-Click Apply AI Fix", detail: "Automatically updates hookStartSec, prependPeakHook, and hookBannerText on the live canvas." },
      { name: "A/B/C Viral Hook Lab", detail: "Generates 3 competing emotional angles (Curiosity, Contrarian, Stakes) to audition live." },
    ],
    youtubeSources: [
      {
        channel: "Film Booth",
        topic: "The Science of the First 3 Seconds (Retention Curves Explained)",
        whyWatch: "The gold-standard breakdown of visual hooks, expectation gaps, and reading retention graphs.",
        url: "https://www.youtube.com/results?search_query=Film+Booth+retention+curve+first+30+seconds",
      },
      {
        channel: "Channel Makers",
        topic: "How to Get 80%+ Viewed vs. Swiped Away on YouTube Shorts",
        whyWatch: "Explains the exact 3-second hold metrics YouTube Shorts requires to enter the viral shelf.",
        url: "https://www.youtube.com/results?search_query=Channel+Makers+YouTube+Shorts+viewed+vs+swiped+away",
      },
    ],
  },
  {
    id: "ch05-captions-slang",
    number: "05",
    category: "studio",
    title: "Submagic-Better Caption Finisher & Slang Dictionary",
    subtitle: "Zero manual caption fixing — custom fonts, accent colors, banner zones, auto-emojis, and 1-click slang repair",
    targetTab: "studio",
    targetLabel: "Open Caption Finisher",
    heroImage: IMG_RETENTION,
    imageCaption: "6 Kinetic Caption Engines + Custom Font Families + Highlight Swatches + Slang Auto-Fix",
    competitorBeat: {
      rival: "Submagic ($20–$50/mo) & Captions App",
      complaint: "Creators hate fixing the exact same misheard gaming/tech proper nouns ('GTA Six', 'LM Studio', 'K/D', 'nerfed', streamer handles) manually on every single video.",
      clipforgeUpgrade: "Pairs a global, persistent Caption Slang Dictionary (Settings → Slang Dictionary) with 6 live-rendered caption engines, 4 font families, accent color swatches, 4 hook banner positions, and 1-click Auto-Emoji.",
    },
    whatAndWhy: [
      "Over 55% of mobile Shorts viewers scroll with sound off or low volume in public. Dynamic, high-contrast captions anchored inside the safe zone act as a second visual hook.",
      "With ClipForge's Caption Finisher, change typography (Modern, Condensed Impact, Editorial Serif, Broadcast Mono), highlight accent colors, and hook banner placement (Top, Upper-Third, Center, Lower) with instant HTML5 canvas preview and exact .ASS/.SRT/.VTT exports.",
    ],
    workflow: [
      { step: "01 · Dictionary", action: "Save recurring names & slang in Settings → Slang Dictionary", outcome: "Permanent auto-correction memory for your niche" },
      { step: "02 · Style", action: "Pick Caption Engine, Font, Accent Color & Banner Position", outcome: "Instant live 9:16 preview inside TikTok/Reels safe zones" },
      { step: "03 · Polish", action: "Click 'Apply Slang Fix' + 'Auto-Emoji' + Blade Split (B)", outcome: "Broadcast-crisp captions exported to .ASS/.SRT/.VTT" },
    ],
    workedExample: {
      scenario: "Fixing recurring gaming & AI jargon across a 12-line transcript",
      input: "Raw captions say 'gema four', 'twitch clips', 'no scope clutch' in default white font",
      output: "1-Click Slang Fix → 'Gemma 4', 'Twitch Clips', 'No-Scope Clutch 🎯' in Condensed Impact + #FACC15 accent",
      result: "Saves 4 minutes per short while keeping visual identity consistent across the channel.",
    },
    featureBreakdown: [
      { name: "6 Kinetic Caption Engines", detail: "Kinetic Highlight, Bold Clean, Minimal Lower, Broadcast Lower-Third, Arcade Pop, and Comic Impact." },
      { name: "Font & Accent Color Controls", detail: "Switch between 4 font families and 6 high-contrast accent swatches live on the 9:16 canvas." },
      { name: "Hook Banner Position Control", detail: "Place your 0–3s banner at Top, Upper-Third, Center, or Lower to avoid platform UI chrome." },
      { name: "Persistent Slang Dictionary", detail: "1-click regex replacement fixes proper nouns, acronyms, and niche slang across every line." },
    ],
    youtubeSources: [
      {
        channel: "Primal Video",
        topic: "Best Subtitle Styles & Safe Zones for TikTok, Reels & Shorts",
        whyWatch: "Practical framing rules so your captions never collide with TikTok's right-rail icons or description.",
        url: "https://www.youtube.com/results?search_query=Primal+Video+best+captions+for+shorts+reels",
      },
    ],
  },
  {
    id: "ch06-voiceover-mixer",
    number: "06",
    category: "studio",
    title: "AI Voiceover Engine (Gemini TTS) & 3-Channel Audio Mixer",
    subtitle: "Broadcast 24kHz .WAV narration, auto-ducking, selectable mood music beds, EQ, and DMCA protection",
    targetTab: "studio",
    targetLabel: "Open Voiceover & Mixer",
    heroImage: IMG_AUDIO,
    imageCaption: "Gemini TTS 5-Voice Narration Engine + 3-Channel Mixer (Original / VO / Music Bed) + LUFS Loudnorm",
    competitorBeat: {
      rival: "ElevenLabs ($22+/mo) + CapCut Pro Audio",
      complaint: "ElevenLabs credits vanish fast on re-takes, and creators struggle to balance narration against loud gameplay/music without triggering DMCA copyright strikes.",
      clipforgeUpgrade: "Built-in Gemini TTS generates real downloadable 24kHz .WAV tracks across 5 voice personas, mixed cleanly inside a 3-channel rack with real-time Web Audio music bed auditioning, Studio Voice EQ, and DMCA Vocal Stem Isolation.",
    },
    whatAndWhy: [
      "Audio quality determines perceived authority more than 4K video. Muddy game audio or flat monotone narration causes instant swipes.",
      "ClipForge lets you AI-draft a punchy 45-word script (via local LM Studio or Gemini), synthesize a 24kHz .WAV voiceover (Puck, Kore, Charon, Fenrir, or Zephyr), duck original audio (-12 dB), layer a mood-matched music bed, enable 80Hz/3.5kHz Studio Voice EQ, and target -11 LUFS (TikTok) or -14 LUFS (YouTube Shorts).",
    ],
    workflow: [
      { step: "01 · Script", action: "Select Voice Profile (e.g. Kore or Charon) → 'AI Draft Script'", outcome: "Tight 45–60 word narration optimized for 25s pacing" },
      { step: "02 · Synthesize", action: "Click 'Generate Voiceover' → Preview & download .WAV", outcome: "Real 24kHz WAV track attached to timeline VO lane" },
      { step: "03 · Mix", action: "Balance Original / VO / Music Bed sliders + Studio Voice EQ", outcome: "Broadcast-ready loudness with DMCA stem isolation" },
    ],
    workedExample: {
      scenario: "Turning a raw gameplay clip with copyrighted Spotify radio into a clean viral short",
      input: "DMCA audit flags 'Music Risk' + raw gameplay has 3.2s of dead air",
      output: "Enable Vocal Stem Isolation + Dead-Air Silence Removal + 'Puck' TTS commentary + 'Phonk Drift' bed at 22%",
      result: "Zero copyright claim risk, punchy -11 LUFS master, ready for TikTok monetization.",
    },
    featureBreakdown: [
      { name: "5 Gemini TTS Voice Personas", detail: "Puck (Gaming Hype), Kore (Tech Anchor), Charon (Documentary), Fenrir (Suspense), Zephyr (Explainer)." },
      { name: "3-Channel Mix Rack", detail: "Independent sliders for Original Source Audio, Voiceover TTS, and Background Music Bed." },
      { name: "Web Audio Bed & SFX Auditioning", detail: "Instantly audition 5 mood music beds (86–132 BPM) and 5 transition SFX cues directly in browser." },
      { name: "LUFS Loudnorm & Silence Removal", detail: "Compiles exact FFmpeg loudnorm (-11/-14 LUFS) and silenceremove filters for automated renders." },
    ],
    youtubeSources: [
      {
        channel: "Primal Video",
        topic: "Audio Mixing & LUFS Loudness Levels for YouTube & Shorts",
        whyWatch: "Clear explanation of why -14 LUFS and proper vocal EQ make phone-speaker shorts sound professional.",
        url: "https://www.youtube.com/results?search_query=audio+mixing+LUFS+loudness+youtube+shorts",
      },
    ],
  },
  {
    id: "ch07-hotkeys-review",
    number: "07",
    category: "studio",
    title: "Global Hotkey Engine & Frame-Accurate Review Notes",
    subtitle: "Edit 3x faster with customizable NLE keybindings and timestamped team/client review briefs",
    targetTab: "settings",
    targetLabel: "Configure Global Hotkeys",
    heroImage: IMG_ARCHITECTURE,
    imageCaption: "Custom Key Recorder + CapCut/Premiere/DaVinci Presets + Frame-Accurate Review Pins",
    competitorBeat: {
      rival: "CapCut Web / Descript / Frame.io ($15–$25/mo)",
      complaint: "Web editors lock you into awkward hard-coded shortcuts that clash with Premiere/DaVinci muscle memory, and force you to pay extra for Frame.io just to leave timestamped notes.",
      clipforgeUpgrade: "Full Global Hotkey Configuration Modal in Settings with live key capture, duplicate conflict warnings, 1-click NLE presets (ClipForge, CapCut/Premiere, DaVinci Resolve), AND built-in Timestamped Review Notes with Markdown brief export.",
    },
    whatAndWhy: [
      "Muscle memory is the difference between editing 2 clips an hour and 12 clips an hour. Bind 'Trim to Selection', 'Generate Hook', 'Send to Queue', 'Blade Split', 'Toggle Safe Zones', and 'Pin Review Note' to whichever keys feel natural.",
      "Working with an editor or reviewing a batch before publishing? Press your Review Note hotkey (default N) to drop a frame-accurate comment at the exact playhead timecode, click any note to seek back to that frame, check items off as resolved, and export a clean .md Review Brief.",
    ],
    workflow: [
      { step: "01 · Bind", action: "Open Settings (TopBar gear or Studio 'Hotkeys') → Pick Preset or Click to Record", outcome: "Custom combos saved to pipeline.config.json" },
      { step: "02 · Cut Fast", action: "Use Trim, Generate Hook, Blade, and Queue keys without touching mouse", outcome: "Live ephemeral hotkey confirmation in Studio bar" },
      { step: "03 · Review", action: "Drop timestamped notes in Studio Review tab → Export Brief (.md)", outcome: "Shareable frame-accurate checklist for editors/clients" },
    ],
    workedExample: {
      scenario: "Premiere Pro editor switching into ClipForge for daily Shorts batching",
      input: "Select 'CapCut / Premiere' preset in Settings → Bind 'Trim to Selection' to Alt+T, 'Send to Queue' to Ctrl+Enter",
      output: "Scrub playhead → press Alt+T to tight-trim → press G to generate hooks → press N to pin a caption check → Ctrl+Enter to queue",
      result: "Complete clip polish cycle drops under 90 seconds.",
    },
    featureBreakdown: [
      { name: "10 Rebindable Studio Actions", detail: "Trim to Selection, Generate Hook, Send to Queue, Play/Pause, Blade Split, Safe Zones, Voiceover, Review Note, Prev/Next Clip." },
      { name: "Live Key Recorder & Conflict Guard", detail: "Press any key/modifier combo to bind; automatically warns if two actions share a shortcut." },
      { name: "3 One-Click NLE Presets", detail: "Switch instantly between ClipForge Default, CapCut/Premiere Pro, and DaVinci Resolve mappings." },
      { name: "Timestamped Review Brief Export", detail: "Click timestamps to seek playhead, mark resolved, and download formatted Markdown review checklists." },
    ],
    youtubeSources: [
      {
        channel: "Primal Video",
        topic: "How Keyboard Shortcuts & NLE Workflows Double Editing Speed",
        whyWatch: "Shows the exact J/K/L shuttle, ripple trim, and blade habits used by pro high-volume editors.",
        url: "https://www.youtube.com/results?search_query=video+editing+keyboard+shortcuts+faster+workflow",
      },
    ],
  },
  {
    id: "ch08-batch-templates-ctr",
    number: "08",
    category: "studio",
    title: "Batch Template Applier & Cover/Banner CTR A/B Simulator",
    subtitle: "Restyle 20 clips in one click and test mobile feed click-through appeal before publishing",
    targetTab: "templates",
    targetLabel: "Open Templates & B-Roll",
    heroImage: IMG_RETENTION,
    imageCaption: "Range-Based Batch Template Applier + Side-by-Side 9:16 Mobile Feed Cover CTR A/B Simulator",
    competitorBeat: {
      rival: "CapCut Pro ($19.99/mo) & Manual Brand Kits",
      complaint: "Creators switching branding or launching a new sub-channel have to open every single project one-by-one to change layout, fonts, colors, and hook banner placement.",
      clipforgeUpgrade: "The Batch Template Applier lets you select a range (e.g. Clip #1 → Clip #8) or checkboxes and apply Layout Template, Caption Style, Font Family, Accent Color, Banner Position, Auto-Emoji, and Watermark to all selected clips in 1 atomic API call—plus a Side-by-Side 9:16 Cover CTR Simulator.",
    },
    whatAndWhy: [
      "Brand consistency trains viewers to recognize your channel in 0.3 seconds before they even read your handle. When testing a new visual identity (e.g. shifting from Split Stack to Reaction 55/45 with Upper-Third crimson banners), batch updates save hours.",
      "Before locking a cover frame, open the Side-by-Side 9:16 Cover & Hook Banner CTR A/B Simulator to compare Variant A vs. Variant B inside realistic YouTube Shorts / TikTok mobile chrome, see instant legibility & curiosity heuristics, and apply the winning banner straight to the clip.",
    ],
    workflow: [
      { step: "01 · Select Range", action: "Open Templates & B-Roll → Set Clip Range (From #1 → To #6) or check clips", outcome: "Exact batch target locked and previewed" },
      { step: "02 · Configure Style", action: "Pick Layout, Font, Caption Theme, Accent Color & Banner Position", outcome: "Atomic POST /api/clips/batch-template updates all clips" },
      { step: "03 · Test CTR", action: "Compare Variant A vs Variant B in 9:16 Mobile Cover Simulator", outcome: "Apply higher-converting hook banner & cover frame" },
    ],
    workedExample: {
      scenario: "Rebranding 6 queued gaming clips for a new 'Midnight Tech' aesthetic",
      input: "Range #1–#6 → Template: HUD Zoom, Font: Condensed Impact, Banner Position: Upper-Third, Accent: #FACC15",
      output: "All 6 clips updated atomically in 120ms and saved to workspace.json",
      result: "Unified visual identity across the entire week's publishing queue in 1 click.",
    },
    featureBreakdown: [
      { name: "Clip Range & Multi-Select Batcher", detail: "Select contiguous clip ranges (Start # → End #) or individual checkboxes across your bin." },
      { name: "7-Property Atomic Styling", detail: "Applies Layout Template, Caption Style, Font Family, Accent Swatch, Banner Position, Auto-Emoji, and Watermark." },
      { name: "Side-by-Side 9:16 Cover Simulator", detail: "Tests two competing cover/banner hooks side-by-side inside realistic mobile Shorts/TikTok UI overlays." },
      { name: "AI B-Roll & Motion Cue Planner", detail: "Generates timed zoom-punches, reaction insets, and graphic cutaway cues for any clip." },
    ],
    youtubeSources: [
      {
        channel: "Film Booth",
        topic: "Thumbnail & Cover Psychology: How to Win the Click in 0.5 Seconds",
        whyWatch: "Explains contrast, 3-word banner limits, and mobile-screen readability rules that directly lift CTR.",
        url: "https://www.youtube.com/results?search_query=Film+Booth+thumbnail+design+psychology",
      },
    ],
  },
  {
    id: "ch09-syndication-heatmap",
    number: "09",
    category: "distribution",
    title: "Auto-Syndication Rules Engine, Pre-Flight Guard & Velocity Heatmap",
    subtitle: "Multi-platform cross-posting without silent API failures — plus 7x24 best-time-to-post intelligence",
    targetTab: "distribution",
    targetLabel: "Open Publish & Syndication",
    heroImage: IMG_ARCHITECTURE,
    imageCaption: "Rule-Based Multi-Platform Syndication + Pre-Flight Health Guard + 7×24 Posting Velocity Heatmap",
    competitorBeat: {
      rival: "Repurpose.io ($35–$79/mo) & Buffer",
      complaint: "Creators on Reddit repeatedly complain Repurpose.io workflows break silently when a token expires or a watermark slips through, wasting days before anyone notices.",
      clipforgeUpgrade: "Adds a 1-Click Pre-Flight Health Guard (Dry-Run Audit) that inspects every active syndication rule for watermark stripping, aspect ratio, DMCA flags, and destination token readiness BEFORE scheduling—paired with a clickable 7×24 Best-Time-to-Post Heatmap.",
    },
    whatAndWhy: [
      "One great 30-second vertical video should never live on only one platform. A clip that gets 3,000 views on TikTok regularly hits 250,000 views on YouTube Shorts or Instagram Reels due to different audience graphs.",
      "Build explicit IF → THEN syndication rules (e.g. 'YouTube Shorts → TikTok + Reels + X with Watermark Strip ON and +15m stagger'), run the Pre-Flight Health Guard to verify zero broken links or DMCA risks, and click peak cells on the Mon–Sun 7×24 Heatmap to lock optimal posting slots.",
    ],
    workflow: [
      { step: "01 · Rules", action: "Define Source → Destination syndication routes + watermark strip + stagger delay", outcome: "Repeatable multi-platform distribution graph" },
      { step: "02 · Pre-Flight", action: "Click 'Run Pre-Flight Health Guard' (POST /api/syndication/dry-run)", outcome: "Instant pass/warn/fail audit for tokens, DMCA, and aspect ratios" },
      { step: "03 · Heatmap", action: "Click peak crimson cells on 7×24 Velocity Heatmap → Auto-Schedule Fleet", outcome: "Clips spaced automatically into peak audience windows" },
    ],
    workedExample: {
      scenario: "Cross-posting 4 approved clips across YouTube Shorts, TikTok, Reels, and X",
      input: "Rule: YT Shorts -> TikTok & IG Reels (Strip Watermark: ON, Delay: 15m) + Peak Slot: Thu 19:00 UTC",
      output: "Pre-Flight passes 4/4 aspect checks, warns 1 clip has 'possible' DMCA music → fixed before dispatch",
      result: "Zero silent failures, zero watermark penalties, 3.2x wider multi-platform reach.",
    },
    featureBreakdown: [
      { name: "Visual Auto-Syndication Rules", detail: "Toggle source-to-target cross-posting routes with watermark removal and staggered publish delays." },
      { name: "Pre-Flight Health Guard", detail: "Audits OAuth tokens, DMCA status, aspect ratios, and caption readiness before anything publishes." },
      { name: "7×24 Best-Time Velocity Heatmap", detail: "Interactive Mon–Sun × 24-hour grid revealing highest average views/hour slots across your fleet." },
      { name: "Regional Fleet & 12-Language Routing", detail: "Assign EN, ES, PT, FR, DE, JA, KO, HI, AR, ID, TR, IT channels for global reach multiplication." },
    ],
    youtubeSources: [
      {
        channel: "Colin and Samir",
        topic: "Multi-Platform Short-Form Distribution Strategy (TikTok vs Reels vs Shorts)",
        whyWatch: "Explains how top media brands tailor packaging across all 3 short-form feeds without diluting reach.",
        url: "https://www.youtube.com/results?search_query=multi+platform+distribution+shorts+reels+tiktok+strategy",
      },
    ],
  },
  {
    id: "ch10-performance-seo",
    number: "10",
    category: "distribution",
    title: "Performance Monitor, Viral Velocity & 6-Platform SEO Pack",
    subtitle: "Track hourly views/time acceleration and engineer algorithm-native titles, tags & descriptions",
    targetTab: "performance",
    targetLabel: "Open Performance Monitor",
    heroImage: IMG_RESEARCH,
    imageCaption: "Hourly Viral Velocity Curves + Winner Pattern Extractor + 6-Platform SEO Generator",
    competitorBeat: {
      rival: "VidIQ ($49/mo) & TubeBuddy",
      complaint: "Traditional SEO tools focus on long-form YouTube search and ignore TikTok search intent, Reels keyword captions, X hook copy, and cross-platform velocity comparison.",
      clipforgeUpgrade: "Combines live Recharts Hourly Viral Velocity charts (views/hour across your fleet) with a 1-click 6-Platform SEO Pack Generator (YouTube Shorts, TikTok, Instagram Reels, X, Facebook Reels, LinkedIn) plus a Winner Learning Loop.",
    },
    whatAndWhy: [
      "What gets measured gets multiplied. Raw total views hide momentum—a clip earning 1,400 views/hour in its first 2 hours is breaking out, while an older clip sitting at 15 views/hour has stalled.",
      "The Performance Monitor charts hourly viral velocity across published clips, highlights winning hook formulas and niches, and generates native SEO titles, hashtags, search keywords, and pinned-comment CTAs tailored for all 6 platforms.",
    ],
    workflow: [
      { step: "01 · Track", action: "Monitor Hourly Viral Velocity chart across active fleet clips", outcome: "Spot breakout winners within the first 2–4 hours" },
      { step: "02 · Optimize SEO", action: "Click 'Generate 6-Platform SEO' on any clip", outcome: "Platform-native titles, descriptions, tags & pinned CTAs" },
      { step: "03 · Double Down", action: "Click 'Ask Ops Agent to Clone Winner Pattern'", outcome: "Feeds winning hook & niche directly back into Research" },
    ],
    workedExample: {
      scenario: "Turning a breakout 12k/hr Short into a repeatable 5-part series",
      input: "Velocity chart flags 'Gemma 4 Local Setup' accelerating at 4.8x fleet average",
      output: "6-Platform SEO Pack generated + Ops Agent drafts 3 follow-up episode concepts using identical hook structure",
      result: "Compounds algorithmic authority in one winning topic cluster.",
    },
    featureBreakdown: [
      { name: "Hourly Viral Velocity Chart", detail: "Recharts multi-series tracking of views/hour acceleration across your fleet." },
      { name: "6-Platform SEO Pack Engine", detail: "Generates tailored metadata for YT Shorts, TikTok, IG Reels, X, FB Reels, and LinkedIn via Local LLM or Gemini." },
      { name: "Winner Pattern Extractor", detail: "Identifies your top-performing hook styles, durations, and niches to guide tomorrow's slate." },
      { name: "1-Click Ops Agent Handoff", detail: "Send any performance insight straight to the Ops Agent to trigger follow-up research." },
    ],
    youtubeSources: [
      {
        channel: "Channel Makers",
        topic: "YouTube Shorts Analytics: Which Metrics Actually Trigger Viral Reach",
        whyWatch: "Deep dive into retention %, swipe-away rate, and how to iterate based on real dashboard data.",
        url: "https://www.youtube.com/results?search_query=Channel+Makers+YouTube+Shorts+analytics+metrics",
      },
    ],
  },
  {
    id: "ch11-autopilot-hybrid-llm",
    number: "11",
    category: "infra",
    title: "AI Director, Ops Agent & Hybrid Local LM Studio + VPS Scaling",
    subtitle: "Run Gemma 4 2B free on your Windows PC today, then scale seamlessly to a $6/mo VPS + Cloudflare",
    targetTab: "autopilot",
    targetLabel: "Open AI Autopilot & Scale",
    heroImage: IMG_SCALE,
    imageCaption: "Hybrid AI Routing: Local LM Studio (Gemma 4 2B @ $0) + Gemini Cloud (Search/TTS) + Windows PC → VPS Blueprint",
    competitorBeat: {
      rival: "Cloud-Only AI SaaS Tools ($99–$299/mo Credit Caps)",
      complaint: "Cloud SaaS platforms meter every caption, rewrite, and render minute, penalizing you the moment you try to scale from 1 channel to 10 channels.",
      clipforgeUpgrade: "True Hybrid Routing: route high-frequency text tasks (SEO packs, script drafts, Ops Agent chat) to your local LM Studio server (Gemma 4 2B on Windows PC) at $0 cost, while reserving Gemini Cloud strictly for Google Search grounding, complex vision/retention audits, and 24kHz TTS audio.",
    },
    whatAndWhy: [
      "You already own a capable Windows PC running LM Studio. By pointing ClipForge's Hybrid Router to http://127.0.0.1:1234/v1, routine text work runs locally for free with instant failover to Gemini Cloud whenever your PC is asleep.",
      "Inside AI Autopilot, you also command two autonomous engines: the AI Director (executes multi-step pipeline actions like TrendPulse scanning, batch QA, and queueing) and the Ops Agent (conversational strategist that inspects your live workspace metrics). When ready to run 24/7, copy the pre-built Windows PowerShell or Linux VPS Docker + systemd worker pack in one click.",
    ],
    workflow: [
      { step: "01 · Local LLM", action: "Enable LM Studio in Autopilot → Ping http://127.0.0.1:1234/v1", outcome: "Gemma 4 2B handles SEO, scripts & chat at $0 cost" },
      { step: "02 · TrendPulse", action: "Pin trending topics from Google Search TrendPulse widget", outcome: "AI Director prioritizes pinned topics automatically" },
      { step: "03 · Scale 24/7", action: "Download Windows Scheduled Task or Linux VPS Docker Compose pack", outcome: "Always-on rendering & publishing farm on $6/mo VPS" },
    ],
    workedExample: {
      scenario: "Zero-cost daily workflow on Windows PC migrating to Hetzner/DigitalOcean VPS at 50 shorts/week",
      input: "LM Studio serving Gemma 4 2B locally + Cloudflare Tunnel + GitOps worker script",
      output: "Local LLM writes 30 SEO packs & scripts for $0; Gemini handles TrendPulse Search + TTS WAV audio",
      result: "92% lower operating cost than SaaS clippers with complete data & model ownership.",
    },
    featureBreakdown: [
      { name: "Hybrid Local LM Studio Router", detail: "OpenAI-compatible connector with live ping test, model auto-detection, and automatic Gemini failover." },
      { name: "TrendPulse Live Radar Widget", detail: "Fetches daily breaking topics via Google Search and lets you pin priorities for the AI Director." },
      { name: "Autonomous AI Director & Ops Agent", detail: "Natural-language commands execute real workspace mutations (audit, hook, queue, config updates)." },
      { name: "Windows PC → Linux VPS Worker Pack", detail: "Auto-generated PowerShell, Docker Compose, systemd, and Cloudflare Tunnel configs ready to deploy." },
    ],
    youtubeSources: [
      {
        channel: "NetworkChuck",
        topic: "Self-Hosting Local LLMs, Docker & Cloudflare Tunnels on Windows / VPS",
        whyWatch: "Hands-on tutorials for exposing local workers safely and migrating side projects to cheap Linux VPS boxes.",
        url: "https://www.youtube.com/results?search_query=NetworkChuck+local+LLM+Docker+Cloudflare+Tunnel",
      },
      {
        channel: "David Ondrej",
        topic: "Building Autonomous AI Agents & Local Model Automation Pipelines",
        whyWatch: "Practical agent design patterns using local Gemma/Llama models alongside frontier cloud APIs.",
        url: "https://www.youtube.com/results?search_query=David+Ondrej+AI+agents+local+LLM+automation",
      },
      {
        channel: "Matt Wolfe",
        topic: "Latest AI Video, Voice & Local Model Tools Explained",
        whyWatch: "Best weekly pulse on emerging open-weight models (like Gemma) and creator AI workflows.",
        url: "https://www.youtube.com/results?search_query=Matt+Wolfe+local+AI+models+video+tools",
      },
    ],
  },
  {
    id: "ch12-gitops-telemetry",
    number: "12",
    category: "infra",
    title: "GitOps Control Plane, Cloudflare Pages & Real-Time Telemetry",
    subtitle: "Version-controlled pipeline configuration, GitHub Actions CI/CD, and live latency/success observability",
    targetTab: "gitops",
    targetLabel: "Open GitOps & Telemetry",
    heroImage: IMG_SCALE,
    imageCaption: "GitHub Actions Render Workflow + Cloudflare Pages Frontend + Recharts Real-Time Telemetry Panel",
    competitorBeat: {
      rival: "Opaque No-Code Zapier/Make Chains",
      complaint: "Complex Zapier/Make zaps fail silently with cryptic errors, cannot be diffed in Git, and cost $100+/mo in task overages.",
      clipforgeUpgrade: "Every setting lives in clean JSON (pipeline.config.json), builds deploy cleanly through GitHub + Cloudflare Pages, and the TelemetryPanel visualizes real-time GitOps latency and Gemini inference success rates using Recharts.",
    },
    whatAndWhy: [
      "Running a multi-channel media engine requires engineering-grade visibility. The GitOps view lets you inspect and edit pipeline.config.json directly, trigger dry-run or live GitHub Actions pipeline dispatches, and monitor exact inference success rates and pipeline latency in real time.",
      "Whenever the Closed-Loop Strategy Optimizer recommends a sharper views threshold, tighter hook length, or higher daily posting cadence, you can apply the patch atomically and trace every run in the execution audit log.",
    ],
    workflow: [
      { step: "01 · Configure", action: "Tune QA gates, target games, and schedules in GitOps config editor", outcome: "Validated JSON persisted and ready to commit" },
      { step: "02 · Dispatch", action: "Run Dry-Run or Live Pipeline Dispatch via GitOps controls", outcome: "Step-by-step execution trace recorded in workspace" },
      { step: "03 · Observe", action: "Inspect TelemetryPanel latency & Gemini success rate charts", outcome: "Immediate detection of API slowdowns or config bottlenecks" },
    ],
    workedExample: {
      scenario: "Deploying your ClipForge control plane to Cloudflare Pages + GitHub Actions worker",
      input: "Push repo to GitHub → Connect Cloudflare Pages (`npm run build`) → Set worker secrets",
      output: "Global edge UI at custom domain + scheduled cron rendering pipeline + live telemetry monitoring",
      result: "Production-grade infrastructure at $0 frontend hosting cost.",
    },
    featureBreakdown: [
      { name: "Recharts TelemetryPanel", detail: "Real-time visualizations of GitOps pipeline latency (ms) and Gemini AI inference success rates (%)." },
      { name: "Live pipeline.config.json Editor", detail: "Inspect, edit, and validate every workspace threshold, hotkey, and rule in one place." },
      { name: "GitHub Actions & Cloudflare Blueprint", detail: "Ready-to-run workflow YAML and dry-run pipeline dispatcher with execution logs." },
      { name: "Closed-Loop Config Patching", detail: "Apply AI-recommended strategy patches safely with full audit history." },
    ],
    youtubeSources: [
      {
        channel: "NetworkChuck",
        topic: "GitHub Actions CI/CD & Cloudflare Pages Deployment Crash Course",
        whyWatch: "Clear step-by-step guide to automating deployments and cron workflows with GitHub Actions + Cloudflare.",
        url: "https://www.youtube.com/results?search_query=GitHub+Actions+Cloudflare+Pages+deployment+tutorial",
      },
    ],
  },
  {
    id: "ch13-competitor-gap-alignment",
    number: "13",
    category: "research",
    title: "Competitor Gap Scanner, Asset Alignment & Rapid-Response Niche Alerts",
    subtitle: "Spot formats rival channels missed, auto-patch pacing dips with B-roll, and counter under-monetized releases",
    targetTab: "ingest",
    targetLabel: "Open Competitor Gap Scanner",
    heroImage: IMG_RESEARCH,
    imageCaption: "Competitor Gap Filter + 30d MA Asset Alignment B-Roll Injector + Rapid-Response Clipping Missions",
    competitorBeat: {
      rival: "VidIQ Boost + Storyblocks + Manual Competitor Tracking ($110+/mo)",
      complaint: "Creators discover a competitor's breakout topic days too late, and waste hours scrubbing stock libraries to rescue weak pacing segments.",
      clipforgeUpgrade: "Unifies Google Search Competitor Gap scanning in Ingest, live Competitive Niche Alerts with 1-click Rapid-Response Missions in Performance, and automatic Asset Alignment B-roll injection in Templates.",
    },
    whatAndWhy: [
      "The Competitor Gap Filter in Opportunity Discovery scans top channels (@Fireship, @MKBHD, @MrBeastGaming, @AllInPodcast, or your own custom handles) to expose video formats and sub-niche topics those channels have NOT covered yet—drafting them straight into your Opportunity cards.",
      "Whenever a major competitor drops a video in an under-monetized sub-niche, Competitive Niche Alerts push a live alert card to Performance Monitor so you can launch a 12-stage Rapid-Response Clipping Mission in one click.",
      "Inside Templates & B-Roll, the Asset Alignment Module measures every clip segment (0–3s Hook, 3–10s Setup, 10–18s Mid-Pacing, 18s+ Climax) against your 30-day moving average and automatically recommends visually aligned B-roll from your saved/discovered library wherever pacing dips.",
    ],
    workflow: [
      { step: "01 · Gap Scan", action: "Open Research & Ingest → Select 'Competitor Gap' filter → Add @RivalHandles", outcome: "Uncovered rival formats auto-drafted into Opportunity cards" },
      { step: "02 · Rapid Counter", action: "Trigger Competitive Niche Alert in Performance → Click 'Launch Rapid-Response Mission'", outcome: "12-stage mission boots pre-loaded with counter-angle & affiliate CTA" },
      { step: "03 · Align B-Roll", action: "Open Templates & B-Roll → Inspect 30d MA segment dips → Click 'Auto-Align Dips'", outcome: "Best visual B-roll injected at exact dip timestamps" },
    ],
    workedExample: {
      scenario: "Counter-programming an under-monetized local AI benchmark release within 90 minutes",
      input: "Competitor alert flags @MattWolfe upload (185K views/hr, $24.50 est. CPM, 0 affiliate links)",
      output: "Rapid-Response Mission launches → Competitor Gap angle drafted → Asset Alignment patches 10–18s pacing dip (64 vs 76 30d MA)",
      result: "Shipped a higher-retention short with a live GPU affiliate offer before rival channels react.",
    },
    featureBreakdown: [
      { name: "Competitor Gap Filter", detail: "Scans editable rival channel handles via Google Search grounding and drafts uncovered formats as Opportunity cards." },
      { name: "Competitive Niche Alerts", detail: "Flags high-velocity rival uploads in under-monetized sub-niches with 1-click Rapid-Response Mission launch." },
      { name: "Asset Alignment Module", detail: "Plots 4 clip segments against your 30-day moving average and injects matching B-roll into every dip." },
      { name: "Auto-Align All Dips", detail: "Batch-patches every sub-30d-MA segment on a clip in one click without manual timeline scrubbing." },
    ],
    youtubeSources: [
      {
        channel: "Channel Makers",
        topic: "Competitor Content Gap Analysis for Exponential Growth",
        whyWatch: "Shows how spotting unaddressed angles in top channels' comments & uploads creates effortless breakout videos.",
        url: "https://www.youtube.com/results?search_query=competitor+content+gap+analysis+youtube+strategy",
      },
    ],
  },
  {
    id: "ch14-velocity-sponsor-funnel",
    number: "14",
    category: "distribution",
    title: "30-Day Moving Average Velocity, Sponsor Burn Rate & Grouped CTA Funnels",
    subtitle: "Separate seasonality from real strategy gains, protect sponsor ROI, and prove which CTA slot converts best",
    targetTab: "performance",
    targetLabel: "Open Performance Monitor",
    heroImage: IMG_RETENTION,
    imageCaption: "Growth Velocity 30d MA Trendlines + Top-3 Sponsor Burn Rate Alert + Grouped CTA Placement Boost Chart",
    competitorBeat: {
      rival: "Spreadsheets + Separate Attribution Trackers ($79+/mo)",
      complaint: "Creators misread seasonal dips as broken content strategy, keep running bleeding sponsor reads, and guess whether Intro, Mid-Roll, or Outro CTAs actually drive conversions.",
      clipforgeUpgrade: "Growth Velocity plots 30-day moving average trendlines for both Organic Traffic and Sponsorship Revenue, Sponsor Health monitors top 3 campaigns for Burn Rate (CTR/$100) and -10% ROI drops, and A/B Funnel Test groups variants by placement location.",
    },
    whatAndWhy: [
      "Seasonality hides strategy wins. By overlaying 30-day moving average (30d MA) trendlines for both Organic Traffic and Sponsorship Revenue, the AI Director diagnoses whether a change is seasonal noise or genuine content efficacy.",
      "Sponsor Health continuously watches your top 3 active sponsorship campaigns, calculates a live Burn Rate (CTR per $100 spent), and flags any campaign whose projected ROI drops 10% or more below its 30-day average—complete with interactive spend/CTR stress-testing sliders.",
      "In Monetization, the enhanced A/B Funnel Test groups every CTA variant by placement location (Intro, Mid-Roll, Split-Screen, Pinned/Bio, Outro) and plots a comparison bar chart revealing the average conversion boost (%) per placement slot.",
    ],
    workflow: [
      { step: "01 · Diagnose", action: "Open Performance Monitor → Review Growth Velocity 30d MA (Organic vs. Sponsors)", outcome: "Instant seasonality vs. strategy diagnosis for AI Director" },
      { step: "02 · Protect ROI", action: "Inspect Sponsor Health Burn Rate cards → Flag any <= -10% ROI drop", outcome: "One-click Ops Agent script rewrite or CTA placement swap" },
      { step: "03 · Optimize CTA", action: "Open Monetization → A/B Funnel Test → View Grouped Placement Boost (%)", outcome: "Apply winning CTA location across Brand Kit & active clips" },
    ],
    workedExample: {
      scenario: "Rescuing a $840 cloud-GPU sponsor campaign whose ROI slipped -14% below 30d average",
      input: "Sponsor Health flags Burn Rate 0.25 CTR/$100 & -14.2% ROI delta; Grouped Funnel Chart shows Mid-Roll Verbal delivers +31.4% boost over Outro",
      output: "Apply Mid-Roll Verbal winner to active clips + dispatch Ops Agent to shorten hook-to-CTA bridge",
      result: "Sponsor conversion rate rebounds from 2.1% to 3.8% while keeping 30-day retention above baseline.",
    },
    featureBreakdown: [
      { name: "30d MA Organic vs. Sponsor Trendlines", detail: "Dual-axis Recharts comparison distinguishing seasonal swings from real strategy outperformance." },
      { name: "Sponsor Health & Burn Rate Monitor", detail: "Tracks top 3 campaigns for CTR per $100 spent and auto-flags >= 10% projected ROI drops." },
      { name: "Grouped CTA Placement Boost BarChart", detail: "Compares Intro, Mid-Roll, Split-Screen, Pinned/Bio, and Outro conversion lift against baseline." },
      { name: "Revenue Surge +15% Alerts", detail: "Pushes live alerts whenever a niche surges +15% ROI so the Director shifts production focus immediately." },
    ],
    youtubeSources: [
      {
        channel: "Creator Wizard (Justin Moore)",
        topic: "How to Measure Sponsorship ROI, Conversions & Renewals",
        whyWatch: "Industry benchmark guide on tracking sponsor CTR, conversion links, and negotiating multi-month retainers.",
        url: "https://www.youtube.com/results?search_query=Creator+Wizard+sponsorship+ROI+conversions+tracking",
      },
    ],
  },
  {
    id: "ch15-money-flywheel-longform",
    number: "15",
    category: "distribution",
    title: "Short-to-Revenue Flywheel: Affiliates, Email Capture Pages & Long-Form Graduation",
    subtitle: "Every short exists to build cash flow—from views to affiliate clicks, owned email lists, and high-RPM long-form",
    targetTab: "autopilot",
    targetLabel: "Open Revenue Funnel Engine",
    heroImage: IMG_SCALE,
    imageCaption: "Short Views → Pinned Bio Bridge → Email Capture Landing Page → Affiliate Offer → Long-Form 10m+ Deep Dive",
    competitorBeat: {
      rival: "Linktree + ConvertKit + Kajabi + Manual Tracking ($120+/mo)",
      complaint: "Shorts RPM alone ($0.04–$0.12) barely pays bills unless every viral clip funnels viewers into high-commission affiliates, an owned email list, and 10+ minute high-RPM long-form videos.",
      clipforgeUpgrade: "Built-in Revenue Funnel Engine inside Autopilot → Monetization manages HTTPS-validated Affiliate Links, Email Capture Bridge Landing Pages, and a 1-click Short → Long-Form Graduation Pipeline.",
    },
    whatAndWhy: [
      "Views are only step one. ClipForge's monetization engine turns high-velocity shorts into durable recurring revenue using three stacked layers: (1) Affiliate Link routing with EPC & commission tracking, (2) Email Capture Bridge Landing Pages that collect leads with a free checklist/template before redirecting to your affiliate offer, and (3) Short-to-Long-Form Graduation.",
      "Whenever a short proves outlier demand (high views, strong comment debate, high retention), click 'Graduate to 10m+ Long-Form' to automatically generate a structured YouTube long-form blueprint (chapter outline, sponsor integration slot, pinned email lead magnet, and estimated $14–$28 RPM upside).",
    ],
    workflow: [
      { step: "01 · Attach Offer", action: "Add HTTPS affiliate partner link (commission %, est. EPC) in Revenue Funnel Engine", outcome: "Reusable offer ready for pinned comments & bio bridges" },
      { step: "02 · Capture Email", action: "Create Email Capture Bridge Page linked to your top affiliate offer", outcome: "Own the audience email BEFORE sending the affiliate click" },
      { step: "03 · Graduate Winners", action: "Select winning short → Click 'Graduate to 10m+ Long-Form'", outcome: "Full 8–14m YouTube script outline & sponsor slot blueprint ready" },
    ],
    workedExample: {
      scenario: "Turning a 240K-view AI workflow short ($19 ad revenue) into a $1,400+ revenue asset",
      input: "Short drives 2.8% pinned-comment CTR → 6,720 visits to Email Capture Bridge ('Free Local AI Stack Checklist')",
      output: "38% email opt-in (2,553 subscribers) → affiliate redirect (30% recurring SaaS commission) + graduated 12-min YouTube deep-dive",
      result: "$1,400+ combined affiliate + long-form AdSense revenue from a single validated 28-second short.",
    },
    featureBreakdown: [
      { name: "Affiliate Offer Manager", detail: "Tracks partner commission %, EPC, clicks, and revenue with strict HTTPS URL validation." },
      { name: "Email Capture Bridge Pages", detail: "Pairs lead magnets with affiliate redirects so every viral view builds your owned newsletter asset." },
      { name: "Short → Long-Form Graduation", detail: "Promotes proven viral shorts into 10m+ high-RPM YouTube deep-dive outlines in one click." },
      { name: "Multi-Channel Fleet Attribution", detail: "Connects every channel in your fleet to unified ROI tracking across ad-share, sponsors, and affiliates." },
    ],
    youtubeSources: [
      {
        channel: "Think Media",
        topic: "How to Make Money With Shorts Using Affiliate Links & Email Lists",
        whyWatch: "Practical breakdown of turning low-RPM short views into high-converting affiliate and newsletter funnels.",
        url: "https://www.youtube.com/results?search_query=how+to+make+money+youtube+shorts+affiliate+marketing+email+list",
      },
    ],
  },
  {
    id: "ch16-always-learning-remote-ops",
    number: "16",
    category: "infra",
    title: "Always-Learning Engine, Multimodal AI Lab & Discord/Telegram/WhatsApp Control",
    subtitle: "A living system that crawls creator intel continuously, scales from local PC to Cloud, and obeys chat commands",
    targetTab: "autopilot",
    targetLabel: "Open Remote Ops & Self-Learning",
    heroImage: IMG_ARCHITECTURE,
    imageCaption: "Continuous Self-Learning Loop + Compute Tier Router (Local PC → Cheap → Pro) + Discord / Telegram / WhatsApp Bridge",
    competitorBeat: {
      rival: "Static SaaS Tools That Never Adapt or Notify You on Mobile",
      complaint: "Standard editing tools sit idle until you log in, lock you into expensive cloud credits, and force you back to a desktop just to approve a video or check daily revenue.",
      clipforgeUpgrade: "Combines recurring Background Knowledge Acquisition + Self-Learning Upgrades + Multimodal AI Lab (Voice, Video, Image, Audio, Music) + a Discord/Telegram/WhatsApp Remote Bridge with slash commands.",
    },
    whatAndWhy: [
      "ClipForge is engineered to learn continuously: Background Knowledge Acquisition crawls creator newsletters, social comments, and AI tool releases; Self-Learning Cycles surface safe pipeline upgrades; and Closed-Loop Telemetry adjusts thresholds from real view & revenue outcomes.",
      "Scale compute on your own terms: start free on GitHub + Cloudflare with Manual or Windows PC LM Studio (Gemma 4 2B), then unlock budget Flash or high-precision Pro Gemini models as your channel revenue grows.",
      "Control the entire studio from your phone using the Remote Ops Bridge (Discord, Telegram, WhatsApp): receive push alerts for viral velocity spikes, +15% ROI surges, and Sponsor Burn Rate warnings, and run slash commands like `/status`, `/revenue`, `/alerts`, `/approve`, and `/top10` remotely.",
    ],
    workflow: [
      { step: "01 · Always Learn", action: "Enable recurring Knowledge Acquisition & Self-Learning cadence in Autopilot", outcome: "Fresh Opportunity cards & workflow upgrades arrive automatically" },
      { step: "02 · Scale Compute", action: "Pick Local Windows PC → Budget Flash → Pro Gemini in Compute & Hosting Hub", outcome: "Zero wasted AI spend while growing from $0 to scale" },
      { step: "03 · Control Anywhere", action: "Enable Discord / Telegram / WhatsApp triggers in Revenue Funnel → Remote Ops", outcome: "Run /status, /revenue, /alerts, /approve, or /top10 from chat" },
    ],
    workedExample: {
      scenario: "Managing a 6-channel Shorts empire from Telegram while away from your desk",
      input: "Telegram alert fires: 'AI & Tech ROI +22% · Competitor Gap detected' → You reply `/approve` then `/revenue`",
      output: "ClipForge approves pending QA cuts for syndication and replies with live MTD revenue, affiliate EPC, and active sponsor health",
      result: "Hands-free daily operations with full human-in-the-loop approval from any messaging app.",
    },
    featureBreakdown: [
      { name: "Discord / Telegram / WhatsApp Bridge", detail: "Server-secured webhook/bot dispatch for revenue surges, burn rate flags, and remote slash-command control." },
      { name: "Continuous Always-Learning Loop", detail: "Crawls creator economy news, social comments, and performance telemetry to auto-draft opportunities and upgrades." },
      { name: "Multimodal AI Lab", detail: "Built-in Gemini Chat, Live Voice, Text-to-Video, Image-to-Video, Image Studio, Audio Transcription, and Music Synth." },
      { name: "Pro Desktop App + Simple Mode", detail: "Switch seamlessly between distraction-free Simple Mode and full Pro Studio without losing any capability." },
    ],
    youtubeSources: [
      {
        channel: "NetworkChuck",
        topic: "Automating Alerts & Remote Bot Commands with Discord & Telegram Webhooks",
        whyWatch: "Shows secure server-side webhook and bot architecture for controlling automated pipelines from your phone.",
        url: "https://www.youtube.com/results?search_query=discord+telegram+bot+webhook+automation+tutorial",
      },
    ],
  },
  {
    id: "ch17-monetization-hub",
    number: "17",
    category: "distribution",
    title: "Monetization Hub: Affiliates, Lead Pages, Funnels & Deep Research",
    subtitle: "Consolidated revenue command center turning short-form views into tracked affiliate commissions, email subscribers, and sponsorships",
    targetTab: "monetization",
    targetLabel: "Open Monetization Hub",
    heroImage: IMG_RETENTION,
    imageCaption: "Monetization Hub: Multi-Stream Revenue Projection + Live Affiliate Ledger + Email Bridge Pages + Grouped CTA Funnels",
    competitorBeat: {
      rival: "Bitly + ConvertKit + Linktree + Spreadsheets ($120+/mo)",
      complaint: "Creators post hundreds of Shorts with zero attribution—unable to see which hook, pinned comment CTA, or landing page actually drove affiliate sales or sponsorship ROI.",
      clipforgeUpgrade: "One executive Monetization Hub uniting live affiliate click/conversion logging, toggleable email lead-capture bridge pages, grouped Intro/Mid-roll/Outro CTA A/B testing, Sponsor Burn Rate monitoring, and deep multi-source comment research.",
    },
    whatAndWhy: [
      "AdSense RPM on Shorts alone is too thin to build a media business. Every Short should funnel viewers toward either an Affiliate UTM offer, an Email Lead-Capture Bridge Page (free lead magnet → thank-you affiliate redirect), a Brand Sponsor integration, or a 10-minute high-RPM YouTube Long-Form video.",
      "The Monetization Hub lets the AI Director log live affiliate clicks and conversions, pause or activate email landing pages, spot sponsor campaigns whose ROI drops >10% below the 30-day average, and run Deep Multi-Source Research across YouTube/TikTok/Reddit/X comment threads to find what buyers are actively asking to purchase.",
    ],
    workflow: [
      { step: "01 · Deep Research", action: "Scan YouTube, TikTok, Reddit & X comments via Google Search", outcome: "Uncover buyer pain points & exact affiliate offers" },
      { step: "02 · Bridge & UTM", action: "Launch Email Lead Capture Page linked to tracked affiliate offer", outcome: "Capture owned email subscribers before redirecting to partner" },
      { step: "03 · CTA Funnel Test", action: "Compare Intro vs. Mid-roll vs. Outro CTA variants", outcome: "Grouped bar chart reveals highest-converting placement" },
      { step: "04 · Protect & Scale", action: "Monitor Sponsor Burn Rate & graduate winning Shorts to Long-Form", outcome: "Cut underperforming deals & compound 8x–15x Long-Form RPM" },
    ],
    workedExample: {
      scenario: "Converting 120,000 Tech & AI Shorts views into recurring SaaS affiliate revenue",
      input: "AI Workflow Short + Mid-roll CTA pointing to Free Prompt Vault Email Bridge Page + Cloud GPU Affiliate UTM",
      output: "310 opt-in emails captured (34% conversion rate) + 19 affiliate conversions at $42 avg commission",
      result: "$798 affiliate revenue + 310 owned email leads from one Short (vs. $8.40 in raw Shorts ad share).",
    },
    featureBreakdown: [
      { name: "Multi-Stream Revenue Projection", detail: "Recharts stacked Bar+Line chart projecting Ad Share, Sponsorships, Affiliates/Digital, and cumulative revenue." },
      { name: "Live Affiliate UTM Ledger", detail: "Add HTTPS-validated partner offers, copy UTM links, and log live clicks/conversions to compute real EPC." },
      { name: "Email Lead Capture Bridge Manager", detail: "Create lead-magnet opt-in pages linked to affiliate partners, toggle Active/Paused, and track subscriber lift." },
      { name: "Grouped CTA A/B Funnel + Sponsor Burn Rate", detail: "Compare Intro/Mid-roll/Outro placement lift and auto-flag top 3 sponsors if ROI drops >10% below 30-day avg." },
      { name: "Deep Multi-Source Comment Research", detail: "Live Google Search scan across YouTube/TikTok/Reddit/X comments & newsletters with 1-click Opportunity drafting." },
      { name: "Short→Long-Form & Discord/Telegram/WhatsApp", detail: "Graduate breakout Shorts into 10m+ YouTube blueprints and control approvals from Discord, Telegram, or WhatsApp." },
    ],
    youtubeSources: [
      {
        channel: "Ali Abdaal",
        topic: "How to Build an Email List & Affiliate Funnel From Short-Form Video",
        whyWatch: "Explains why capturing emails via a free lead magnet multiplies the lifetime value of every viral view.",
        url: "https://www.youtube.com/results?search_query=ali+abdaal+email+list+funnel+youtube+monetization",
      },
      {
        channel: "Alex Hormozi",
        topic: "Lead Magnets & High-Converting Offer Bridges for Content Creators",
        whyWatch: "Shows how to craft irresistible opt-in hooks that convert cold Shorts viewers into buyers.",
        url: "https://www.youtube.com/results?search_query=alex+hormozi+lead+magnet+content+funnel",
      },
    ],
  },
  {
    id: "ch18-multimodal-ai-lab",
    number: "18",
    category: "studio",
    title: "Multimodal AI Lab: Voice, Video, Image Studio & Lyria Music",
    subtitle: "Create original B-roll videos, animate thumbnails, transcribe raw audio, talk live to the AI Director, and score royalty-free music",
    targetTab: "ai-lab",
    targetLabel: "Open Multimodal AI Lab",
    heroImage: IMG_AUDIO,
    imageCaption: "Multimodal AI Lab: Gemini Live Voice + Text/Image-to-Video + Image Creation/Editing + Audio Transcription + Lyria Music",
    competitorBeat: {
      rival: "Runway + Midjourney + Suno + Whisper SaaS + ChatGPT Plus ($140+/mo)",
      complaint: "Faceless and hybrid creators juggle five disconnected AI generation tabs, hit watermarks, and lose track of API spend across subscriptions.",
      clipforgeUpgrade: "Six native Gemini multimodal engines inside one credit-tracked lab with direct 1-click apply to active clips in your workspace.",
    },
    whatAndWhy: [
      "Original visual hooks and copyright-safe background beds are what keep automated channels safe from reused-content demonetization. The Multimodal AI Lab lets you generate custom B-roll clips from text, animate still frames into motion shots, create or edit thumbnails/overlays, and synthesize custom royalty-free Lyria music beds.",
      "Every generation respects your Compute Routing credit ledger, and the Audio Transcription module pushes clean timestamps directly into your selected clip's caption timeline in one click.",
    ],
    workflow: [
      { step: "01 · Brainstorm Live", action: "Open Live Voice Conversation or Gemini Chatbot", outcome: "Refine angles & scripts hands-free in seconds" },
      { step: "02 · Visual Assets", action: "Generate or edit 9:16 images, then animate into motion video", outcome: "Original copyright-free visual hooks" },
      { step: "03 · Transcribe", action: "Upload raw podcast/voice audio into Audio Transcriber", outcome: "Apply clean transcript straight to Cut Studio captions" },
      { step: "04 · Score Audio", action: "Generate custom Lyria background music bed", outcome: "Zero DMCA risk across YouTube, TikTok & Reels" },
    ],
    workedExample: {
      scenario: "Producing a 100% original faceless AI news Short with zero stock-footage fees",
      input: "Voice memo audio + 1 hero thumbnail prompt + tense synth music prompt",
      output: "Transcribed captions applied to clip + animated 9:16 video hook + custom Lyria track",
      result: "Full original media pack produced in under 4 minutes with zero third-party copyright claims.",
    },
    featureBreakdown: [
      { name: "Live Voice Conversations", detail: "Real-time bidirectional voice sessions with your AI Creative Director for rapid script ideation." },
      { name: "Text-to-Video & Image-to-Video", detail: "Generate fresh vertical B-roll or animate static artwork into kinetic motion shots." },
      { name: "Create & Edit Images", detail: "Generate thumbnails, hook frames, and product mockups or edit existing images via natural language." },
      { name: "Audio Transcription → Studio", detail: "Transcribe uploaded audio files and apply the resulting transcript directly onto any workspace clip." },
      { name: "Lyria Music Generator", detail: "Compose mood-matched, royalty-free background music beds tuned for high-retention Shorts." },
      { name: "Gemini Creative Chatbot", detail: "Context-aware studio assistant grounded in your live clips, hooks, and active compute tier." },
    ],
    youtubeSources: [
      {
        channel: "Matt Wolfe",
        topic: "End-to-End Multimodal AI Video & Music Production Workflows",
        whyWatch: "Covers practical pipelines for combining image generation, video animation, and AI audio for YouTube channels.",
        url: "https://www.youtube.com/results?search_query=matt+wolfe+ai+video+generation+music+workflow",
      },
    ],
  },
  {
    id: "ch19-assets-expansion",
    number: "19",
    category: "research",
    title: "Asset Discovery Vault, B-Roll Alignment & Platform Expansion",
    subtitle: "Find safe public-domain/meme visuals, auto-inject B-roll where pacing dips, and expand winning channels to new platforms",
    targetTab: "assets",
    targetLabel: "Open Asset Discovery",
    heroImage: IMG_RESEARCH,
    imageCaption: "Asset Discovery Vault + Retention-Dip Asset Alignment + Cross-Platform Expansion Engine",
    competitorBeat: {
      rival: "Storyblocks + Giphy Manual Search + Guesswork Cross-Posting ($65+/mo)",
      complaint: "Editors spend 20 minutes per clip hunting for reaction memes or safe B-roll, and blindly repost identical formats onto platforms with totally different norms.",
      clipforgeUpgrade: "AI-scored Asset Discovery Vault paired with an Asset Alignment module that automatically scans your saved library whenever hook/pacing scores dip below the 30-day average.",
    },
    whatAndWhy: [
      "Viewer retention collapses when a talking-head or gameplay clip stays static for more than 4 seconds. ClipForge's Asset Discovery Vault hunts cleared public-domain footage, safe meme cuts, and editorial visuals via Google Search and stores them in your reusable Saved Asset Library.",
      "Inside Templates & B-Roll, the Asset Alignment engine detects clips whose hook or pacing dips below the 30-day moving average and recommends exact second-by-second B-roll injections from your saved vault. Meanwhile, the Platform Expansion Engine researches emerging platforms (LinkedIn, Threads, Bluesky, X Video, Snapchat) and adapts proven templates to each platform's algorithm.",
    ],
    workflow: [
      { step: "01 · Discover Assets", action: "Search by clip context in Asset Discovery Vault", outcome: "License-checked visuals & meme cuts saved to vault" },
      { step: "02 · Detect Pacing Dip", action: "Asset Alignment compares clip pacing vs. 30-day avg", outcome: "Flags weak segments needing visual pattern interrupts" },
      { step: "03 · Auto-Inject", action: "One-click inject saved B-roll onto exact timestamp", outcome: "Updates clip B-roll cues & FFmpeg overlay graph" },
      { step: "04 · Expand Platforms", action: "Run Platform Expansion scan in AI Autopilot", outcome: "Adds new high-reach channels with native formatting rules" },
    ],
    workedExample: {
      scenario: "Rescuing a 28-second podcast clip with a weak 0:08–0:14 retention valley",
      input: "Clip pacing score 62 (below 30-day avg 76) + 6 saved assets in vault",
      output: "Asset Alignment suggests a 3.2s animated chart overlay at 0:08 and injects it in 1 click",
      result: "Average view duration rises from 18.4s to 24.9s (+35% completion lift).",
    },
    featureBreakdown: [
      { name: "Asset Discovery Vault", detail: "Google Search-backed discovery of public-domain clips, memes, SFX, and reaction visuals with license notes." },
      { name: "Saved Asset Library", detail: "Persistent studio vault shared across Cut Studio, Templates & B-Roll, and AI Autopilot." },
      { name: "Asset Alignment Auto-Injector", detail: "Flags clips dipping below 30-day hook/pacing average and recommends visually matched B-roll timestamps." },
      { name: "Platform Expansion Engine", detail: "Researches under-saturated short-form platforms and applies winning cross-platform formatting blueprints." },
    ],
    youtubeSources: [
      {
        channel: "HillierSmith",
        topic: "Visual Pattern Interrupts & B-Roll Pacing That Double Retention",
        whyWatch: "Masterclass on placing visual cuts right before attention decays in short and long-form video.",
        url: "https://www.youtube.com/results?search_query=hilliersmith+retention+editing+pattern+interrupts+b-roll",
      },
    ],
  },
  {
    id: "ch20-local-llm-vps-autonomy",
    number: "20",
    category: "infra",
    title: "Windows PC Local LLM, Cloud VPS Workers, Self-Learning & Auth",
    subtitle: "Scale cleanly from $0 Free GitHub/Cloudflare + Windows PC LM Studio to 24/7 Cloud VPS Docker fleets with autonomous self-learning",
    targetTab: "gitops",
    targetLabel: "Open GitOps & Workers",
    heroImage: IMG_SCALE,
    imageCaption: "Hybrid Scaling Ladder: Manual Free → Windows PC LM Studio ($0 API) → Cloud VPS Docker Workers → Autonomous Learning Loop",
    competitorBeat: {
      rival: "Cloud-Only SaaS Credit Traps ($99–$499/mo + lock-in)",
      complaint: "Most AI video platforms charge steep per-minute credits and stop running the moment you pause your subscription, giving you zero ownership of your automation.",
      clipforgeUpgrade: "5-tier compute routing (Manual Free → Windows PC LM Studio → Cloud Budget → Standard → Flagship), downloadable Docker/PowerShell worker packs, Supabase-ready Auth, and a self-auditing Autonomous Learning Loop.",
    },
    whatAndWhy: [
      "ClipForge is engineered to grow alongside your revenue: start at $0/mo on GitHub + Cloudflare Pages paired with your own Windows PC running LM Studio (`http://localhost:1234/v1` with Qwen, Llama, or Mistral small models) for free local script drafting, SEO packs, and Ops chat. As channel revenue grows, graduate smoothly to a $6–$24/mo Cloud VPS running 24/7 Docker FFmpeg + polling workers.",
      "Every cycle, the Autonomous Self-Learning Loop evaluates your clip retention, active ROI surges, A/B funnel winners, affiliate EPC, and compute budget—recording concrete lessons in the persistent Autonomous Ledger and optionally auto-applying safe cadence improvements.",
    ],
    workflow: [
      { step: "01 · Local Windows PC", action: "Enable LM Studio local server & click Ping LM Studio on Dashboard", outcome: "$0/token local LLM inference for scripts, SEO & chat" },
      { step: "02 · Credit Guardrails", action: "Set monthly budget cap & auto-downgrade in Compute Hub", outcome: "Zero surprise cloud API bills as volume scales" },
      { step: "03 · Autonomous Loop", action: "Run Self-Learning Cycle (with optional Safe Auto-Apply)", outcome: "System audits metrics, logs insights & tunes pipeline.config.json" },
      { step: "04 · Cloud VPS Scale", action: "Export Worker Pack (Dockerfile + PowerShell + GitHub Actions)", outcome: "24/7 unattended multi-channel rendering & publishing" },
    ],
    workedExample: {
      scenario: "Bootstrapping 3 faceless channels on a home Windows gaming PC before upgrading to a VPS",
      input: "LM Studio running Qwen2.5-7B on RTX GPU + GitHub Actions free tier + Supabase Auth",
      output: "Daily script drafting & 6-platform SEO runs locally at $0; Gemini Cloud reserved for Google Search research & live alerts",
      result: "92% reduction in monthly AI API costs while running full autonomous optimization loops.",
    },
    featureBreakdown: [
      { name: "5-Tier AI Compute & Credit Routing", detail: "Switch seamlessly between Manual Free, Windows PC LM Studio, Cloud Budget, Standard, and Flagship Pro." },
      { name: "Live LM Studio Health Ping", detail: "Test http://localhost:1234/v1 connectivity, measure latency, and enumerate loaded local models from the Dashboard." },
      { name: "Autonomous Self-Learning Loop & Ledger", detail: "Evaluates clips, funnel winners, ROI alerts, and affiliates to persist hypotheses and safe config auto-patches." },
      { name: "Windows PowerShell & Cloud VPS Docker Pack", detail: "One-click downloadable deployment scripts to host headless FFmpeg & posting workers on your PC or VPS." },
      { name: "Supabase & Workspace Authentication", detail: "Real account sign-up/sign-in modal ready for Supabase Auth or secure server-backed local workspace sessions." },
      { name: "GitOps CI/CD & Pipeline Dispatcher", detail: "Version-controlled pipeline.config.json, dry-run/live dispatch history, and live AI telemetry inspection." },
    ],
    youtubeSources: [
      {
        channel: "NetworkChuck",
        topic: "Running Local LLMs on Your Windows PC with LM Studio + Docker VPS Hosting",
        whyWatch: "Step-by-step guide to hosting local AI models on your PC GPU and scaling automation to an inexpensive Linux VPS.",
        url: "https://www.youtube.com/results?search_query=networkchuck+lm+studio+local+llm+docker+vps",
      },
    ],
  },
];

interface FeatureAtlasItem {
  id: string;
  name: string;
  workspace: WorkspaceTab | "settings";
  workspaceLabel: string;
  category: "Overview & Control" | "Research & Discovery" | "Studio & AI Creation" | "Monetization & Revenue" | "Analytics & Testing" | "Distribution & Ops" | "Infrastructure & Training";
  engine: string;
  summary: string;
}

const COMPLETE_FEATURE_ATLAS: FeatureAtlasItem[] = [
  // Overview & Control
  { id: "f01", name: "Studio Dashboard Command Center", workspace: "dashboard", workspaceLabel: "Studio Dashboard", category: "Overview & Control", engine: "Hybrid Workspace", summary: "Executive home separating Action Queue (approvals, alerts, self-learning) from Telemetry & Infra." },
  { id: "f02", name: "Simple vs. Pro Studio Mode", workspace: "dashboard", workspaceLabel: "Studio Dashboard", category: "Overview & Control", engine: "Client State", summary: "Toggle between streamlined daily mode and full 21-workspace NLE, Research & GitOps pro layout." },
  { id: "f03", name: "Cmd+K AI Command Palette", workspace: "dashboard", workspaceLabel: "Studio Dashboard", category: "Overview & Control", engine: "Gemini + Quick Nav", summary: "Instant keyboard search across all 21 workspaces, clips, and natural-language AI Director commands." },
  { id: "f04", name: "Autonomous Self-Learning Loop & Ledger", workspace: "dashboard", workspaceLabel: "Studio Dashboard", category: "Overview & Control", engine: "Gemini / LM Studio", summary: "Audits retention, funnels, alerts & affiliates; persists learnings and optional safe auto-patches." },
  { id: "f05", name: "Custom Keyboard Shortcuts & Slang Rules", workspace: "settings", workspaceLabel: "Settings Modal", category: "Overview & Control", engine: "GitOps Config", summary: "Rebind NLE hotkeys and configure custom slang/caption autocorrection rules." },
  { id: "f06", name: "Account & Supabase Auth Manager", workspace: "dashboard", workspaceLabel: "TopBar Account", category: "Overview & Control", engine: "Supabase / Server Auth", summary: "Sign up, sign in, and manage authenticated workspace sessions." },

  // Research & Discovery
  { id: "f07", name: "Opportunity Discovery (Google Search)", workspace: "opportunity-radar", workspaceLabel: "Opportunity & Gap Radar", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Finds high-performing uncovered niche topics not yet in your clip library." },
  { id: "f08", name: "Competitor Gap Scanner", workspace: "opportunity-radar", workspaceLabel: "Opportunity & Gap Radar", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Scans rival channels for uncovered video formats and drafts them as Opportunity cards." },
  { id: "f09", name: "Recurring Knowledge Acquisition Crawler", workspace: "opportunity-radar", workspaceLabel: "Opportunity & Gap Radar", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Scheduled crawler scanning creator economy newsletters & AI updates into Opportunity cards." },
  { id: "f10", name: "Deep Multi-Source Comment Research", workspace: "audience-social-intel", workspaceLabel: "Social & Sentiment Lab", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Analyzes YouTube, TikTok, Reddit & X comment buyer intent and monetization angles." },
  { id: "f11", name: "TrendPulse Live Gaming & Viral Radar", workspace: "competitor-intel", workspaceLabel: "Competitor & Trend Intel", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Tracks breaking Twitch/YouTube trends, pin priorities, and auto-adds target games." },
  { id: "f12", name: "Outlier Media Bin & Batch Queue", workspace: "ingest", workspaceLabel: "Media Bin & QA", category: "Research & Discovery", engine: "Server Engine", summary: "Ingest clips, score viral velocity, enforce streamer policies, and run batch QA/approve." },
  { id: "f13", name: "Faceless Short Auto-Builder", workspace: "faceless-studio", workspaceLabel: "Faceless & Long-Form", category: "Research & Discovery", engine: "Gemini Cloud", summary: "Generates complete faceless script, hook, template, and voiceover-ready clip from a topic." },
  { id: "f14", name: "Industry News & Tool Radar", workspace: "audience-social-intel", workspaceLabel: "Social & Sentiment Lab", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Monitors creator economy shifts and feeds summaries directly into AI Agent memory." },
  { id: "f15", name: "Asset Discovery Vault", workspace: "assets", workspaceLabel: "Asset Discovery", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Discovers license-safe public-domain footage, meme cuts, and reaction overlays for your vault." },

  // Studio & AI Creation
  { id: "f16", name: "9:16 Vertical Cut Studio & Timeline", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Canvas + FFmpeg", summary: "Precision framing, split-stack/dual-cam/blurred templates, caption presets, and hook banners." },
  { id: "f17", name: "Gemini QA & DMCA Compliance Audit", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Gemini Cloud", summary: "Checks music copyright, policy risks, pacing quality, and brand safety before publish." },
  { id: "f18", name: "0-3s Hook Variant Generator & Retention Grader", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Gemini Cloud", summary: "Generates 3 viral hooks and grades opening retention curves before rendering." },
  { id: "f19", name: "Clip Health & Pre-Publish Readiness Score", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Gemini Cloud", summary: "Audits caption legibility, audio loudness, hook punch, and CTA clarity." },
  { id: "f20", name: "Broadcast TTS Voiceover & LUFS Mastering", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Gemini TTS + DSP", summary: "Generates 24kHz .WAV narration with auto-ducking, -14 LUFS loudness, EQ, and de-esser." },
  { id: "f21", name: "12-Language Caption & Metadata Localization", workspace: "studio", workspaceLabel: "Cut Studio", category: "Studio & AI Creation", engine: "Gemini Cloud", summary: "Translates captions, titles, and hooks into ES, PT, FR, DE, JA, KO, HI and more." },
  { id: "f22", name: "VOD Long-Form Slicer & Prompt Search", workspace: "vod", workspaceLabel: "VOD Slicer", category: "Studio & AI Creation", engine: "Gemini Cloud", summary: "Extracts peak viral moments from multi-hour streams/podcasts via transcript or natural prompt." },
  { id: "f23", name: "Batch Template & Timed B-Roll Director", workspace: "templates", workspaceLabel: "Templates & B-Roll", category: "Studio & AI Creation", engine: "Gemini + FFmpeg", summary: "Applies unified layout presets across multiple clips and generates timed B-roll cues." },
  { id: "f24", name: "Asset Alignment Auto-Injector", workspace: "templates", workspaceLabel: "Templates & B-Roll", category: "Studio & AI Creation", engine: "Hybrid Engine", summary: "Detects clips dipping below 30-day hook/pacing average and injects matched vault B-roll." },
  { id: "f25", name: "Live Voice Conversations (AI Director)", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Gemini Live API", summary: "Real-time spoken brainstorming and studio direction via browser microphone." },
  { id: "f26", name: "Text-to-Video & Image-to-Video Generator", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Gemini Video", summary: "Generates original B-roll clips from text prompts or animates static images into motion." },
  { id: "f27", name: "AI Image Studio (Create & Edit)", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Gemini Image", summary: "Creates high-CTR thumbnails/overlays and edits uploaded frames with natural instructions." },
  { id: "f28", name: "Audio Transcription → Clip Captions", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Gemini Audio", summary: "Transcribes uploaded voice/podcast audio and applies it straight into any Studio clip." },
  { id: "f29", name: "Lyria Royalty-Free Music Generator", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Lyria Music", summary: "Synthesizes custom copyright-safe background music beds for high-retention Shorts." },
  { id: "f30", name: "Studio Gemini Chatbot", workspace: "ai-lab", workspaceLabel: "Multimodal AI Lab", category: "Studio & AI Creation", engine: "Gemini / LM Studio", summary: "Interactive AI creative assistant aware of your workspace clips and monetization goals." },

  // Monetization & Revenue
  { id: "f31", name: "Dedicated Monetization Hub Workspace", workspace: "monetization", workspaceLabel: "Monetization Hub", category: "Monetization & Revenue", engine: "Hybrid Engine", summary: "Executive hub uniting revenue forecasts, affiliates, lead pages, CTA funnels, and sponsors." },
  { id: "f32", name: "Affiliate Offer & Live Click/Conversion Tracker", workspace: "affiliates-funnels", workspaceLabel: "Affiliates & Funnels", category: "Monetization & Revenue", engine: "Server Ledger", summary: "HTTPS-validated affiliate links, UTM copy, live click/conversion logging, and EPC tracking." },
  { id: "f33", name: "Email Lead Capture Bridge Page Manager", workspace: "affiliates-funnels", workspaceLabel: "Affiliates & Funnels", category: "Monetization & Revenue", engine: "Server Ledger", summary: "Build opt-in pages linked to affiliate offers, preview mobile bridge funnel, and track subscriber ROI." },
  { id: "f34", name: "Grouped CTA A/B Funnel Test (Intro/Mid/Outro)", workspace: "affiliates-funnels", workspaceLabel: "Affiliates & Funnels", category: "Monetization & Revenue", engine: "Gemini + Recharts", summary: "Compares CTA placements by location and applies the winning sponsorship funnel automatically." },
  { id: "f35", name: "Sponsor Health & Burn Rate Monitor", workspace: "monetization", workspaceLabel: "Monetization Hub", category: "Monetization & Revenue", engine: "Server Telemetry", summary: "Tracks CTR per dollar spent for top 3 sponsors and flags >10% ROI drops vs. 30-day avg." },
  { id: "f36", name: "Multi-Stream 6-Month Revenue Projector", workspace: "monetization", workspaceLabel: "Monetization Hub", category: "Monetization & Revenue", engine: "Gemini + Recharts", summary: "Models Ad Share, Sponsorships, and Affiliate/Digital revenue across scaling cadences." },
  { id: "f37", name: "Short → Long-Form Graduation Pipeline", workspace: "faceless-studio", workspaceLabel: "Faceless & Long-Form", category: "Monetization & Revenue", engine: "Gemini Cloud", summary: "Converts breakout Shorts into 10m+ high-RPM YouTube long-form scripts, chapters & sponsor slots." },

  // Analytics & Testing
  { id: "f38", name: "90-Day Revenue Projection (Expected vs Actual)", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "Recharts", summary: "Plots expected vs. actual ad revenue over the next 90 days from monetization plan data." },
  { id: "f39", name: "Growth Velocity + 30-Day Moving Averages", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "Recharts", summary: "Compares historical vs. MTD revenue with 30-day moving averages for organic & sponsor streams." },
  { id: "f40", name: "D3 Viral Growth Heatmap & Cadence Optimizer", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "D3.js", summary: "Visualizes peak hour/day engagement across all channels with 1-click cadence apply." },
  { id: "f41", name: "Revenue Attribution Matrix by Niche", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "Recharts", summary: "Plots ad revenue + sponsor conversions against engagement to rank highest-ROI niches." },
  { id: "f42", name: "A/B Hook & Editing Style Winner Monitor", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "Gemini Cloud", summary: "Compares hook variants & editing styles on views/retention and bakes winner into config." },
  { id: "f43", name: "+15% Revenue Growth & Competitive Niche Alerts", workspace: "competitor-intel", workspaceLabel: "Competitor & Trend Intel", category: "Analytics & Testing", engine: "Gemini + Search", summary: "Pushes ROI surge alerts and triggers rapid-response clipping missions on rival uploads." },

  // Distribution & Ops
  { id: "f44", name: "Multi-Channel Fleet & Auto-Scheduler", workspace: "distribution", workspaceLabel: "Channels & Publish", category: "Distribution & Ops", engine: "Server Fleet", summary: "Manages YouTube, TikTok, Reels, X & Facebook accounts with timezone-aware scheduling." },
  { id: "f45", name: "6-Platform SEO Metadata Pack Generator", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Distribution & Ops", engine: "LM Studio / Gemini", summary: "Generates platform-native titles, descriptions, tags, and pinned comments per clip." },
  { id: "f46", name: "12-Stage Autonomous Mission Runner", workspace: "autopilot", workspaceLabel: "AI Autopilot", category: "Distribution & Ops", engine: "Gemini / Hybrid", summary: "Executes end-to-end idea→script→clip→SEO→publish missions with optional approval gates." },
  { id: "f47", name: "Discord, Telegram & WhatsApp Remote Control", workspace: "compute-remote", workspaceLabel: "Compute & Remote Control", category: "Distribution & Ops", engine: "Webhook Bridge", summary: "Receive digest alerts and run /approve, /status, or /mission commands from chat apps." },
  { id: "f48", name: "Platform Expansion Research Engine", workspace: "platform-expansion", workspaceLabel: "Platform Expansion", category: "Distribution & Ops", engine: "Gemini + Search", summary: "Discovers emerging social platforms, maps 12-platform footprint, and applies syndication templates." },

  // Infrastructure & Training
  { id: "f49", name: "5-Tier AI Compute & Windows PC LM Studio Hub", workspace: "compute-remote", workspaceLabel: "Compute & Remote Control", category: "Infrastructure & Training", engine: "LM Studio + Gemini", summary: "Routes tasks across Manual Free, local Windows PC LM Studio, and Gemini Cloud credit tiers." },
  { id: "f50", name: "GitOps Config, CI/CD & Cloud VPS Worker Pack", workspace: "gitops", workspaceLabel: "GitOps & Deploy", category: "Infrastructure & Training", engine: "Docker + GitHub", summary: "Versioned pipeline.config.json, dispatch history, and downloadable Windows/Linux VPS workers." },
  { id: "f51", name: "20-Chapter Interactive Pitch Deck & Training", workspace: "guide", workspaceLabel: "Pitch Deck & Training", category: "Infrastructure & Training", engine: "Interactive Guide", summary: "Mastery checklist, presenter mode, Complete Feature Atlas, YouTube sources, and Markdown export." },
  { id: "f52", name: "Discord Mission Success & ROI Surge Alert Config", workspace: "monetization", workspaceLabel: "Monetization Hub", category: "Distribution & Ops", engine: "Remote Bridge", summary: "Routes AI Director Mission Success and configurable ROI Surge alerts to a dedicated Discord channel." },
  { id: "f53", name: "Clip-to-CTA-to-Conversion Sankey Attribution Panel", workspace: "performance", workspaceLabel: "Performance & ROI", category: "Analytics & Testing", engine: "Interactive SVG Sankey", summary: "Breaks down per-clip revenue sources and traces CTA variants to Sponsorship, Affiliate, Email & Ad-Share conversions." },

  // Dedicated Research Category & Expanded Section Workspaces
  { id: "f54", name: "Research Command Center (Pre-Production Hub)", workspace: "research-hub", workspaceLabel: "Research Command Center", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Unified pre-production intelligence desk ranking niche RPM arbitrage, live gaps, social pain points, and rapid rival responses." },
  { id: "f55", name: "Editing Style Comment Sentiment Lab", workspace: "audience-social-intel", workspaceLabel: "Social & Sentiment Lab", category: "Research & Discovery", engine: "Gemini + Google Search", summary: "Scores real viewer comment sentiment on editing styles and applies winning directives straight to the AI Director." },
  { id: "f56", name: "Competitor Viral Formula Reverse-Engineer", workspace: "competitor-intel", workspaceLabel: "Competitor & Trend Intel", category: "Research & Discovery", engine: "Gemini Cloud", summary: "Deconstructs any rival short's hook formula and drafts a superior counter-clip straight into Cut Studio." },
  { id: "f57", name: "Editable Long-Form Chapter & Sponsor Blueprint Studio", workspace: "faceless-studio", workspaceLabel: "Faceless & Long-Form", category: "Studio & AI Creation", engine: "Server Persistence", summary: "Edit 10m+ YouTube video titles, durations, RPM estimates, mid-roll sponsor notes, chapters, and production stages." },
  { id: "f58", name: "Live Mobile Email Bridge Funnel Preview", workspace: "affiliates-funnels", workspaceLabel: "Affiliates & Funnels", category: "Monetization & Revenue", engine: "Interactive Preview", summary: "Visualizes the exact Short → Email Opt-In → Affiliate Offer redirect flow with 30-day revenue comparison charts." },
  { id: "f59", name: "12-Platform Distribution Footprint Matrix", workspace: "platform-expansion", workspaceLabel: "Platform Expansion", category: "Distribution & Ops", engine: "Server Fleet", summary: "Maps active vs. untapped primary and secondary arbitrage networks (LinkedIn, Reddit, Pinterest, Threads, Bluesky, Substack)." },
  { id: "f60", name: "Windows PC LM Studio & Linux VPS Offload Router", workspace: "compute-remote", workspaceLabel: "Compute & Remote Control", category: "Infrastructure & Training", engine: "LM Studio / Docker", summary: "Granular task-offload routing, live local model ping, and 1-click PowerShell (.ps1) & Docker Compose worker exports." },
  { id: "f61", name: "Interactive Remote Slash-Command Console", workspace: "compute-remote", workspaceLabel: "Compute & Remote Control", category: "Infrastructure & Training", engine: "Webhook Bridge", summary: "Test and dispatch /status, /approve, /mission, and /digest commands across Discord, Telegram, and WhatsApp." },
];

const CATEGORIES: Array<{ id: ChapterCategory; label: string }> = [
  { id: "all", label: "All 20 Chapters" },
  { id: "research", label: "Research & Ingest" },
  { id: "studio", label: "Studio & AI Lab" },
  { id: "distribution", label: "Monetization & Growth" },
  { id: "infra", label: "Infra, Local LLM & Ops" },
];

const ATLAS_CATEGORIES = [
  "All",
  "Overview & Control",
  "Research & Discovery",
  "Studio & AI Creation",
  "Monetization & Revenue",
  "Analytics & Testing",
  "Distribution & Ops",
  "Infrastructure & Training",
] as const;

export function PresentationDeck({
  clips,
  config,
  telemetry,
  affiliateCount = 0,
  landingPageCount = 0,
  longFormCount = 0,
  activeAlertCount = 0,
  onJumpToTab,
  onOpenSettings,
}: PresentationDeckProps) {
  const [viewMode, setViewMode] = useState<"chapters" | "atlas">("chapters");
  const [selectedCategory, setSelectedCategory] = useState<ChapterCategory>("all");
  const [atlasCategory, setAtlasCategory] = useState<(typeof ATLAS_CATEGORIES)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(DECK_CHAPTERS[0].id);
  const [presenterMode, setPresenterMode] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("clipforge_training_done");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  function toggleCompleted(chapterId: string) {
    setCompletedIds((prev) => {
      const next = prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId];
      try {
        localStorage.setItem("clipforge_training_done", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DECK_CHAPTERS.filter((ch) => {
      if (selectedCategory !== "all" && ch.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        ch.title.toLowerCase().includes(q) ||
        ch.subtitle.toLowerCase().includes(q) ||
        ch.competitorBeat.rival.toLowerCase().includes(q) ||
        ch.featureBreakdown.some(
          (f) => f.name.toLowerCase().includes(q) || f.detail.toLowerCase().includes(q)
        )
      );
    });
  }, [selectedCategory, searchQuery]);

  const filteredAtlas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COMPLETE_FEATURE_ATLAS.filter((item) => {
      if (atlasCategory !== "All" && item.category !== atlasCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.workspaceLabel.toLowerCase().includes(q) ||
        item.engine.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [atlasCategory, searchQuery]);

  const activeIndex = useMemo(() => {
    const idx = filteredChapters.findIndex((c) => c.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [filteredChapters, activeId]);

  const chapter = filteredChapters[activeIndex] || DECK_CHAPTERS[0];

  useEffect(() => {
    if (filteredChapters.length > 0 && !filteredChapters.some((c) => c.id === activeId)) {
      setActiveId(filteredChapters[0].id);
    }
  }, [filteredChapters, activeId]);

  // Arrow-key slide navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || viewMode !== "chapters") return;
      if (e.key === "ArrowRight" && activeIndex < filteredChapters.length - 1) {
        setActiveId(filteredChapters[activeIndex + 1].id);
      } else if (e.key === "ArrowLeft" && activeIndex > 0) {
        setActiveId(filteredChapters[activeIndex - 1].id);
      } else if (e.key === "Escape" && presenterMode) {
        setPresenterMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, filteredChapters, presenterMode, viewMode]);

  const liveMetrics = useMemo(() => {
    const totalSuccess = telemetry.filter((t) => t.success).length;
    const rate = telemetry.length > 0 ? Math.round((totalSuccess / telemetry.length) * 100) : 100;
    const totalYtLinks = DECK_CHAPTERS.reduce((sum, c) => sum + c.youtubeSources.length, 0);
    const masteryPct = Math.round((completedIds.length / DECK_CHAPTERS.length) * 100);
    return {
      clipCount: clips.length,
      fleetCount: config.channelFleet.length,
      successRate: rate,
      totalYtLinks,
      masteryPct,
    };
  }, [clips.length, config.channelFleet.length, telemetry, completedIds.length]);

  function handleExportFullPlaybook() {
    const sections = DECK_CHAPTERS.map((ch) =>
      [
        `## ${ch.number}. ${ch.title}`,
        `*${ch.subtitle}*`,
        "",
        `### Why It Beats ${ch.competitorBeat.rival}`,
        `- **Creator Pain Point:** ${ch.competitorBeat.complaint}`,
        `- **ClipForge Advantage:** ${ch.competitorBeat.clipforgeUpgrade}`,
        "",
        `### Deep Breakdown`,
        ...ch.whatAndWhy.map((p) => `${p}`),
        "",
        `### Worked Example (${ch.workedExample.scenario})`,
        `- **Input:** ${ch.workedExample.input}`,
        `- **Output:** ${ch.workedExample.output}`,
        `- **Result:** ${ch.workedExample.result}`,
        "",
        `### Features Included`,
        ...ch.featureBreakdown.map((f) => `- **${f.name}:** ${f.detail}`),
        "",
        `### YouTube Further Learning`,
        ...ch.youtubeSources.map((yt) => `- [${yt.channel} — ${yt.topic}](${yt.url}): ${yt.whyWatch}`),
        "",
        "---",
        "",
      ].join("\n")
    );

    const atlasTable = [
      `## Complete Feature Atlas (${COMPLETE_FEATURE_ATLAS.length} Features Across All 21 Workspaces)`,
      "",
      `| # | Feature | Workspace | Category | Engine | What It Does |`,
      `|---|---|---|---|---|---|`,
      ...COMPLETE_FEATURE_ATLAS.map(
        (f, i) => `| ${i + 1} | ${f.name} | ${f.workspaceLabel} | ${f.category} | ${f.engine} | ${f.summary} |`
      ),
      "",
    ].join("\n");

    const md = `# ClipForge Complete Pitch Deck, Training Playbook & Feature Atlas\n\n${sections.join("\n")}\n${atlasTable}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clipforge-complete-playbook-and-feature-atlas.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLaunchTarget(target: WorkspaceTab | "settings") {
    if (target === "settings") {
      onOpenSettings?.();
    } else {
      onJumpToTab(target);
    }
  }

  const isCurrentCompleted = completedIds.includes(chapter.id);

  return (
    <div
      className={`flex-1 flex flex-col bg-[#F6F7F9] dark:bg-[#0A0B0E] ${
        presenterMode ? "fixed inset-0 z-50 overflow-y-auto" : "min-h-[calc(100vh-56px)]"
      }`}
    >
      {/* Top Deck Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#E1392B]" />
            <h1 className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">
              ClipForge Pitch Deck, Training Academy &amp; Feature Atlas
            </h1>
          </div>
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500">
            <span>{DECK_CHAPTERS.length} Chapters</span>
            <span aria-hidden="true">·</span>
            <span>{COMPLETE_FEATURE_ATLAS.length} Features</span>
            <span aria-hidden="true">·</span>
            <span>{liveMetrics.clipCount} Clips</span>
            <span aria-hidden="true">·</span>
            <span>{liveMetrics.fleetCount} Channels</span>
            <span aria-hidden="true">·</span>
            <span>{affiliateCount} Affiliates</span>
            <span aria-hidden="true">·</span>
            <span>{landingPageCount} Opt-In Pages</span>
            <span aria-hidden="true">·</span>
            <span>{longFormCount} Long-Form</span>
            {activeAlertCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#E1392B] font-semibold">{activeAlertCount} Alerts</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {completedIds.length}/{DECK_CHAPTERS.length} Mastered ({liveMetrics.masteryPct}%)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 2-Mode Switcher: Chapters vs Complete Feature Atlas */}
          <div className="inline-flex p-0.5 rounded-sm bg-[#ECEFF4] dark:bg-[#151821] border border-[#D4DAE4] dark:border-[#232836] text-xs">
            <button
              type="button"
              onClick={() => setViewMode("chapters")}
              className={`h-7 px-2.5 rounded-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewMode === "chapters"
                  ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chapters ({DECK_CHAPTERS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("atlas")}
              className={`h-7 px-2.5 rounded-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewMode === "atlas"
                  ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                  : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All {COMPLETE_FEATURE_ATLAS.length} Features</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewMode === "atlas" ? `Filter all ${COMPLETE_FEATURE_ATLAS.length} features...` : "Search chapter or rival..."}
              className="h-8 pl-8 pr-3 w-44 sm:w-52 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#14171F] text-xs focus:outline-none focus:border-[#E1392B]"
            />
          </div>

          <button
            type="button"
            onClick={handleExportFullPlaybook}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:border-[#E1392B] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>Export Playbook (.md)</span>
          </button>

          {viewMode === "chapters" && (
            <button
              type="button"
              onClick={() => setPresenterMode((p) => !p)}
              className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {presenterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{presenterMode ? "Exit Presenter" : "Presenter Mode"}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "atlas" ? (
        /* COMPLETE FEATURE ATLAS MODE */
        <div className="flex-1 flex flex-col">
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/60 dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {ATLAS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAtlasCategory(cat)}
                  className={`h-7 px-2.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                    atlasCategory === cat
                      ? "bg-[#E1392B] text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#171A21]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              Showing {filteredAtlas.length} of {COMPLETE_FEATURE_ATLAS.length} live modules across 21 workspaces
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <div className="rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#0D0F14] text-[11px] font-mono text-slate-500">
                      <th className="py-2.5 px-3 font-medium w-10">#</th>
                      <th className="py-2.5 px-3 font-medium">Feature / Module</th>
                      <th className="py-2.5 px-3 font-medium">Workspace</th>
                      <th className="py-2.5 px-3 font-medium">Compute / Engine</th>
                      <th className="py-2.5 px-3 font-medium">Purpose &amp; Business Impact</th>
                      <th className="py-2.5 px-3 font-medium text-right w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEFF3] dark:divide-[#1A1D26] text-xs">
                    {filteredAtlas.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F6F7F9]/80 dark:hover:bg-[#151822] transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-[11px] tabular-nums text-slate-400">
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          <div>{item.name}</div>
                          <div className="text-[10px] font-normal text-slate-500">{item.category}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {item.workspaceLabel}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {item.engine}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                          {item.summary}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleLaunchTarget(item.workspace)}
                            className="h-7 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#2A303E] hover:border-[#E1392B] hover:text-[#E1392B] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE 20-CHAPTER PITCH DECK & TRAINING MODE */
        <>
          {/* Category Filter + Training Mastery Strip */}
          <div className="px-4 sm:px-6 py-2 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/60 dark:bg-[#0D0F14] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`h-7 px-2.5 rounded-sm text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-[#E1392B] text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#171A21]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500">
              <div className="flex items-center gap-2">
                <span>Training Progress</span>
                <div className="w-24 h-1.5 rounded-xs bg-[#D4DAE4] dark:bg-[#232836] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-[width] duration-200"
                    style={{ width: `${liveMetrics.masteryPct}%` }}
                  />
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {completedIds.length}/{DECK_CHAPTERS.length}
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <span>
                ← / → slides · {activeIndex + 1} / {Math.max(1, filteredChapters.length)}
              </span>
            </div>
          </div>

          {/* Main 2-Column Split: Chapter Rail (Left) + Rich Illustrated Deep-Dive Canvas (Right) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left Chapter Index Rail */}
            {!presenterMode && (
              <aside className="lg:col-span-3 border-r border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14] overflow-y-auto max-h-[calc(100vh-156px)]">
                <div className="divide-y divide-[#ECEFF3] dark:divide-[#1A1D26]">
                  {filteredChapters.map((ch) => {
                    const isCurrent = ch.id === chapter.id;
                    const done = completedIds.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setActiveId(ch.id)}
                        className={`w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 ${
                          isCurrent
                            ? "bg-[#ECEFF3]/90 dark:bg-[#161922]"
                            : "hover:bg-[#F6F7F9] dark:hover:bg-[#11131A]"
                        }`}
                      >
                        <span
                          className={`font-mono text-xs font-bold tabular-nums mt-0.5 ${
                            isCurrent ? "text-[#E1392B]" : "text-slate-400"
                          }`}
                        >
                          {ch.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`text-xs font-semibold leading-snug ${
                                isCurrent
                                  ? "text-[#0F172A] dark:text-[#F1F5F9]"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {ch.title}
                            </div>
                            {done && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
                            {ch.featureBreakdown.length} features · {ch.youtubeSources.length} YT links
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* Right Illustrated Mastery Content */}
            <section
              className={`${
                presenterMode ? "lg:col-span-12 max-w-5xl mx-auto w-full" : "lg:col-span-9"
              } p-5 sm:p-8 space-y-6 overflow-y-auto`}
            >
              {/* Chapter Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D9DEE7] dark:border-[#222631] pb-5">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="font-mono text-xs text-[#E1392B] font-semibold tracking-wider uppercase">
                    CHAPTER {chapter.number} · {chapter.category}
                  </div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                    {chapter.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {chapter.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCompleted(chapter.id)}
                    className={`h-9 px-3.5 rounded-sm border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      isCurrentCompleted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-slate-700 dark:text-slate-200 hover:border-emerald-500"
                    }`}
                  >
                    {isCurrentCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{isCurrentCompleted ? "Chapter Mastered" : "Mark Complete"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchTarget(chapter.targetTab)}
                    className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{chapter.targetLabel}</span>
                  </button>
                </div>
              </div>

              {/* Visual Illustration + Competitor Upgrade Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
                {/* Visual Illustration Frame */}
                <figure className="xl:col-span-7 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] overflow-hidden flex flex-col">
                  <div className="relative aspect-video bg-[#0A0B0E] overflow-hidden">
                    <img
                      src={chapter.heroImage}
                      alt={chapter.imageCaption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="px-4 py-2.5 border-t border-[#D9DEE7] dark:border-[#222631] text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span>{chapter.imageCaption}</span>
                    <span className="text-[#E1392B] shrink-0">FIG {chapter.number}</span>
                  </figcaption>
                </figure>

                {/* Why It Matters & Competitor Pain-Point Solved */}
                <div className="xl:col-span-5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="font-mono text-[11px] font-semibold text-[#E1392B] uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why It Beats Paid Competitors</span>
                    </div>
                    <div className="text-xs space-y-2.5">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500 uppercase">Benchmark Replaced</div>
                        <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] mt-0.5">
                          {chapter.competitorBeat.rival}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-rose-500 uppercase">Real Creator Complaint</div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {chapter.competitorBeat.complaint}
                        </p>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-emerald-500 uppercase">How ClipForge Solves It</div>
                        <p className="text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed font-medium">
                          {chapter.competitorBeat.clipforgeUpgrade}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#D9DEE7] dark:border-[#222631] space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {chapter.whatAndWhy.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Mechanism -> Outcome Visual Workflow Diagram */}
              <div className="rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] p-5 space-y-3">
                <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#E1392B]" />
                  <span>Mechanism → Outcome Workflow Diagram</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {chapter.workflow.map((w, idx) => (
                    <div
                      key={w.step}
                      className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/70 dark:bg-[#0D0F14] flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#E1392B]">
                          <span>{w.step}</span>
                          {idx < chapter.workflow.length - 1 && (
                            <span className="text-slate-400" aria-hidden="true">→</span>
                          )}
                        </div>
                        <div className="mt-1.5 text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          {w.action}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#D9DEE7] dark:border-[#222631] text-[11px] text-emerald-700 dark:text-emerald-400">
                        Outcome: {w.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concrete Worked Example + Full Feature Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Worked Example */}
                <div className="lg:col-span-5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] p-5 space-y-3">
                  <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase">
                    Concrete Worked Example
                  </div>
                  <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {chapter.workedExample.scenario}
                  </div>
                  <dl className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-sm bg-[#F6F7F9] dark:bg-[#0D0F14] border border-[#D9DEE7] dark:border-[#222631]">
                      <dt className="font-mono text-[10px] text-slate-500 uppercase">Input</dt>
                      <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{chapter.workedExample.input}</dd>
                    </div>
                    <div className="p-2.5 rounded-sm bg-[#F6F7F9] dark:bg-[#0D0F14] border border-[#D9DEE7] dark:border-[#222631]">
                      <dt className="font-mono text-[10px] text-slate-500 uppercase">ClipForge Output</dt>
                      <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{chapter.workedExample.output}</dd>
                    </div>
                    <div className="p-2.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30">
                      <dt className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Measured Impact</dt>
                      <dd className="mt-0.5 font-medium text-emerald-800 dark:text-emerald-300">
                        {chapter.workedExample.result}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Full Feature Breakdown */}
                <div className="lg:col-span-7 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] p-5 space-y-3">
                  <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase">
                    Complete Feature Checklist in This Module
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chapter.featureBreakdown.map((feat) => (
                      <div
                        key={feat.name}
                        className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#0D0F14] space-y-1"
                      >
                        <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E1392B] shrink-0" />
                          <span>{feat.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {feat.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Curated YouTube Further-Learning Sources */}
              <div className="rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#111318] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-[#E1392B]" />
                    <span>Curated YouTube Sources for Further Learning</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Opens on YouTube</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {chapter.youtubeSources.map((yt) => (
                    <a
                      key={yt.url}
                      href={yt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9]/60 dark:bg-[#0D0F14] hover:border-[#E1392B] transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#E1392B] font-semibold">
                          <span>{yt.channel}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        </div>
                        <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#E1392B] transition-colors">
                          {yt.topic}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {yt.whyWatch}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Bottom Slide Navigation */}
              <div className="pt-4 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveId(filteredChapters[activeIndex - 1].id)}
                  className="h-9 px-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#141720] disabled:opacity-35 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Chapter</span>
                </button>

                <span className="font-mono text-xs tabular-nums text-slate-500">
                  Chapter {chapter.number} of {DECK_CHAPTERS.length}
                </span>

                <button
                  type="button"
                  disabled={activeIndex >= filteredChapters.length - 1}
                  onClick={() => setActiveId(filteredChapters[activeIndex + 1].id)}
                  className="h-9 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] disabled:opacity-35 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Next Chapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
