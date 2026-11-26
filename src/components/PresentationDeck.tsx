import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
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
    title: "System Overview: Easy vs. Pro & End-to-End Pipeline",
    subtitle: "Why one unified GitOps + Hybrid AI control room replaces 7 separate monthly subscriptions",
    targetTab: "studio",
    targetLabel: "Open Cut Studio",
    heroImage: IMG_ARCHITECTURE,
    imageCaption: "ClipForge End-to-End Architecture: Research → Ingest → Studio → Syndication → Closed-Loop Learning",
    competitorBeat: {
      rival: "Fragmented Stack (OpusClip + Submagic + Repurpose.io + VidIQ = $160+/mo)",
      complaint: "Creators waste 40% of production time downloading MP4s from one SaaS, uploading to another for captions, then debugging broken webhooks in a third.",
      clipforgeUpgrade: "Single keyboard-driven workspace with Easy Mode (5 core tabs) and Pro Mode (full NLE timeline, FFmpeg filtergraph, GitOps CI/CD, and local LM Studio worker).",
    },
    whatAndWhy: [
      "ClipForge treats short-form content like a measurable broadcast pipeline instead of random editing. Every decision—from topic selection to hook wording to posting hour—feeds back into pipeline.config.json.",
      "Easy Mode strips the interface down to 5 distraction-free tabs (Studio, Research & Ingest, Performance, Autopilot, Publish) for fast daily shipping. Pro Mode unlocks VOD Slicing, Batch Templates, FFmpeg render graphs, and GitHub Actions deployment.",
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
    targetTab: "ingest",
    targetLabel: "Open Research & Ingest",
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
];

const CATEGORIES: Array<{ id: ChapterCategory; label: string }> = [
  { id: "all", label: "All 12 Chapters" },
  { id: "research", label: "Research & Ingest" },
  { id: "studio", label: "Studio & Craft" },
  { id: "distribution", label: "Distribution & Growth" },
  { id: "infra", label: "AI & Infrastructure" },
];

export function PresentationDeck({
  clips,
  config,
  telemetry,
  onJumpToTab,
  onOpenSettings,
}: PresentationDeckProps) {
  const [selectedCategory, setSelectedCategory] = useState<ChapterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(DECK_CHAPTERS[0].id);
  const [presenterMode, setPresenterMode] = useState(false);

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
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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
  }, [activeIndex, filteredChapters, presenterMode]);

  const liveMetrics = useMemo(() => {
    const totalSuccess = telemetry.filter((t) => t.success).length;
    const rate = telemetry.length > 0 ? Math.round((totalSuccess / telemetry.length) * 100) : 100;
    const totalYtLinks = DECK_CHAPTERS.reduce((sum, c) => sum + c.youtubeSources.length, 0);
    return {
      clipCount: clips.length,
      fleetCount: config.channelFleet.length,
      successRate: rate,
      totalYtLinks,
    };
  }, [clips.length, config.channelFleet.length, telemetry]);

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
    const md = `# ClipForge Complete Mastery Playbook & Architecture Guide\n\n${sections.join("\n")}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clipforge-mastery-playbook.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLaunchFeature() {
    if (chapter.targetTab === "settings") {
      onOpenSettings?.();
    } else {
      onJumpToTab(chapter.targetTab);
    }
  }

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
              ClipForge Complete Mastery &amp; Architecture Deck
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500">
            <span>{DECK_CHAPTERS.length} Chapters</span>
            <span aria-hidden="true">·</span>
            <span>{liveMetrics.totalYtLinks} YouTube Courses</span>
            <span aria-hidden="true">·</span>
            <span>{liveMetrics.clipCount} Live Clips</span>
            <span aria-hidden="true">·</span>
            <span>{liveMetrics.fleetCount} Fleet Channels</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">{liveMetrics.successRate}% AI Health</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feature or rival..."
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

          <button
            type="button"
            onClick={() => setPresenterMode((p) => !p)}
            className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {presenterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{presenterMode ? "Exit Presenter" : "Presenter Mode"}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
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
        <div className="text-[11px] font-mono text-slate-500">
          Use ← / → arrow keys to step slides · {activeIndex + 1} / {Math.max(1, filteredChapters.length)}
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
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold leading-snug ${
                          isCurrent
                            ? "text-[#0F172A] dark:text-[#F1F5F9]"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {ch.title}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLaunchFeature}
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
    </div>
  );
}
