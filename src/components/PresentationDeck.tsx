import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import type { ClipItem, PipelineConfig, TelemetryEvent, WorkspaceTab } from "../types";

interface PresentationDeckProps {
  clips: ClipItem[];
  config: PipelineConfig;
  telemetry: TelemetryEvent[];
  onJumpToTab: (tab: WorkspaceTab) => void;
}

interface SlideSpec {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  bullets: Array<{ heading: string; detail: string }>;
  liveAction?: { label: string; tab: WorkspaceTab };
  speakerNotes: string;
}

export function PresentationDeck({ clips, config, telemetry, onJumpToTab }: PresentationDeckProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [presenterMode, setPresenterMode] = useState(false);

  const geminiCalls = telemetry.filter((t) => t.category === "gemini");
  const successRate = geminiCalls.length
    ? ((geminiCalls.filter((t) => t.success).length / geminiCalls.length) * 100).toFixed(1)
    : "100.0";

  const slides: SlideSpec[] = [
    {
      id: "overview",
      number: "01",
      title: "ClipForge — Autonomous Broadcast NLE & GitOps Clipping Studio",
      subtitle:
        "Zero-VPS short-form gaming production running on Cloudflare Pages, GitHub Actions, FFmpeg, and Gemini 4 Hydrogen.",
      bullets: [
        {
          heading: "Problem Solved",
          detail:
            "Generic clipping bots flood feeds with mislabeled footage, DMCA-muted audio, and static crops that collapse below 40% retention.",
        },
        {
          heading: "The ClipForge Architecture",
          detail:
            "Versioned GitOps config (pipeline.config.json) + Cloudflare Pages Control Plane + GitHub Actions FFmpeg workers + MCP Agent Bridge.",
        },
        {
          heading: "Live Workspace Snapshot",
          detail: `${clips.length} active clips in bin · ${config.channelFleet.length} regional fleet channels · ${successRate}% live Gemini inference reliability.`,
        },
      ],
      liveAction: { label: "Launch Live Dual-Monitor Studio", tab: "studio" },
      speakerNotes:
        "Open by contrasting generic VPS scraping scripts with ClipForge's GitOps-native architecture: zero monthly VPS hosting bill, full human-or-AI control, and broadcast-grade 9:16 output.",
    },
    {
      id: "ingest",
      number: "02",
      title: "Ingest Deck — Velocity Radar, Compliance & Bulk Metadata Export",
      subtitle:
        "Filter saturated reposts, catch GTA V/RP mislabels, screen DMCA audio risks, and export transcripts & hook variants in one click.",
      bullets: [
        {
          heading: "Multi-Source Intake & Velocity Scoring",
          detail:
            "Tracks Twitch Helix & Kick clips by views-per-minute velocity, rival cross-post saturation, and content similarity fingerprints.",
        },
        {
          heading: "Creator Allowlist & Opt-Out Enforcement",
          detail:
            "Permanent opt-out ledger respected by both browser scans and headless GitHub Actions runners so creators' wishes are honored automatically.",
        },
        {
          heading: "Bulk Metadata JSON Export",
          detail:
            "Select any batch of clips and export full transcripts, A/B/C hook variants, localized captions, and QA verdicts as portable JSON.",
        },
      ],
      liveAction: { label: "Open Ingest Media Bin", tab: "ingest" },
      speakerNotes:
        "Demonstrate selecting two clips in Ingest, clicking 'Export Transcripts & Hooks JSON', and running Batch Gemini QA + DMCA screening live.",
    },
    {
      id: "vod",
      number: "03",
      title: "VOD & Highlights — Chat-Hype Heatmaps & Text-Based Cutting",
      subtitle:
        "Turn 2-hour streams into ranked 30-second viral slices without scrubbing timelines manually.",
      bullets: [
        {
          heading: "Audio & Chat Velocity Spike Radar",
          detail:
            "Recharts spike heatmap pinpoints exact stream moments where chat velocity and streamer audio dB peak simultaneously.",
        },
        {
          heading: "Descript-Style Transcript Editor & Filler Scrubber",
          detail:
            "Edit spoken dialogue like text, strip verbal fillers ('uh', 'um', 'like') in one click, and slice passages directly into the Ingest Bin.",
        },
        {
          heading: "Auto-Montage Compilation Stitcher",
          detail:
            "Select approved clips to compile a 'Best Of' vertical montage with an exact FFmpeg concat & -11 LUFS mastering graph.",
        },
      ],
      liveAction: { label: "Explore VOD & Highlights", tab: "vod" },
      speakerNotes:
        "Show the Recharts hype curve and click 'Slice to Ingest Bin' on the top drawbridge stunt moment to prove real end-to-end state flow.",
    },
    {
      id: "studio",
      number: "04",
      title: "Dual-Monitor Broadcast Studio — Precision NLE in the Browser",
      subtitle:
        "Inspired by DaVinci Resolve and OpenCut: interactive 16:9 crop boxes paired with a live 9:16 60fps program canvas.",
      bullets: [
        {
          heading: "Visual 16:9 Crop-to-FFmpeg Coordinate Sync",
          detail:
            "Click directly on the 16:9 Source Monitor to reposition Facecam and Gameplay bounding boxes—coordinates compile straight into FFmpeg filter_complex.",
        },
        {
          heading: "Multi-Track Timeline, Blade Split & Shuttle Keys",
          detail:
            "V1/V2/A1/T1/B1 tracks with Space/J/K/L shuttle controls, B blade caption split, Ctrl+Z/Ctrl+Shift+Z undo history, and safe-zone overlays.",
        },
        {
          heading: "Pro Broadcast Mastering & Instant Exports",
          detail:
            "-11/-14 LUFS loudnorm, dead-air silence removal, DMCA vocal isolation, 6-language localization, WebM video, 9:16 PNG cover, and ASS/SRT/VTT subtitles.",
        },
      ],
      liveAction: { label: "Open Dual-Monitor Studio", tab: "studio" },
      speakerNotes:
        "Click the 16:9 source monitor to move the red Facecam box and show the 9:16 program monitor and FFmpeg filter graph updating simultaneously.",
    },
    {
      id: "templates",
      number: "05",
      title: "Templates, Brand Kits & AI B-Roll Cutaway Director",
      subtitle:
        "Eliminate cookie-cutter shorts with 6 gaming blueprints, synthesized SFX drops, and Gemini-timed motion beats.",
      bullets: [
        {
          heading: "6 Vertical Layout Blueprints & 6 Caption Engines",
          detail:
            "Switch between Split-Stack, Fullscreen+PiP, Intact 16:9 Blur, Reaction 55/45, Dual-Cam Co-Stream, and HUD Zoom with matching kinetic caption styles.",
        },
        {
          heading: "Gemini B-Roll & Visual Beat Director",
          detail:
            "Automatically places zoom punch-ins, slow-mo ramps, shutter flashes, and HUD callouts keyed to exact dialogue timestamps.",
        },
        {
          heading: "Live Web Audio SFX Auditioner & Brand Kits",
          detail:
            "Audition synthesized risers, sub-bass drops, whooshes, and glitch cuts right in the browser and drop them onto the clip timeline.",
        },
      ],
      liveAction: { label: "Open Templates & B-Roll", tab: "templates" },
      speakerNotes:
        "Hit 'Audition' on Bass Drop or Riser to engage the audience with live synthesized audio, then trigger 'AI Suggest B-Roll Cues'.",
    },
    {
      id: "autopilot",
      number: "06",
      title: "AI Director — Full-Site Autonomous Control & Competitor Spy",
      subtitle:
        "Run ClipForge manually as a precision NLE, or hand the steering wheel to Gemini 4 Hydrogen across every deck.",
      bullets: [
        {
          heading: "Natural-Language Multi-Step Orchestration",
          detail:
            "Command ClipForge from AI Director or press ⌘K / Ctrl+K anywhere to audit clips, generate hooks, translate to ES/PT, master audio, and schedule the fleet.",
        },
        {
          heading: "Brand Voice Governance & Full-Auto Toggle",
          detail:
            "Switch between Supervised Copilot and Full-Auto modes and customize the global editorial persona injected into every Gemini call.",
        },
        {
          heading: "Competitor Viral Formula Reverse-Engineer",
          detail:
            "Paste any rival short's transcript to dissect its 0–3s hook mechanics and adopt a 1-click counter-hook and layout strategy.",
        },
      ],
      liveAction: { label: "Open Autonomous AI Director", tab: "autopilot" },
      speakerNotes:
        "Run the 'Full Autonomous Studio Sweep' playbook live so the audience watches the step-by-step execution trace mutate real clips across the workspace.",
    },
    {
      id: "distribution",
      number: "07",
      title: "Multi-Channel Fleet, Stagger Scheduler & Closed-Loop Economics",
      subtitle:
        "Scale from 1 channel to a multilingual EN/ES/PT fleet without triggering platform spam throttles.",
      bullets: [
        {
          heading: "Channel Fleet & Anti-Bot Jitter Scheduling",
          detail:
            "Per-channel warmup caps, regional locales, and randomized stagger jitter windows prevent shadowbans while maximizing daily throughput.",
        },
        {
          heading: "Grounded Unit Economics Simulator",
          detail:
            "Interactive RPM calculator maps your exact daily revenue target to required daily views and shorts/day across your fleet.",
        },
        {
          heading: "Gemini Closed-Loop Rule Optimizer",
          detail:
            "Feeds real published views and watch % back into Gemini to propose 1-click numeric patches to pipeline.config.json.",
        },
      ],
      liveAction: { label: "Open Distribution & Fleet", tab: "distribution" },
      speakerNotes:
        "Show the Smart-Schedule Fleet button and run the Gemini Closed-Loop Optimizer to illustrate how telemetry directly tunes the next GitHub Action run.",
    },
    {
      id: "gitops",
      number: "08",
      title: "GitOps Control Plane, Real-Time Telemetry & MCP Agent Bridge",
      subtitle:
        "Inspect live latency and Gemini reliability charts, review Git diffs before commit, and export your turnkey Cloudflare + GitHub repo.",
      bullets: [
        {
          heading: "Real-Time Recharts TelemetryPanel",
          detail:
            "Monitors GitOps pipeline latency (ms), Gemini inference success rates (%), P95 response times, and per-route reliability live.",
        },
        {
          heading: "Interactive Line-by-Line Git Diff & Deploy Bundle",
          detail:
            "Review exact +/- JSON diffs before committing pipeline.config.json to GitHub, or export the complete .zip repo bundle.",
        },
        {
          heading: "MCP JSON-RPC Agent Bridge",
          detail:
            "Includes scripts/mcp-server.mjs so Claude Desktop, Cursor, or external agents can inspect clips, audit QA, and dispatch renders programmatically.",
        },
      ],
      liveAction: { label: "Inspect Live GitOps Telemetry", tab: "gitops" },
      speakerNotes:
        "Close the presentation in GitOps showing the live Recharts TelemetryPanel, the Git Diff viewer, and the downloadable Cloudflare Pages + GitHub Actions deployment zip.",
    },
  ];

  const current = slides[slideIndex];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") setSlideIndex((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === "ArrowLeft") setSlideIndex((i) => Math.max(0, i - 1));
      if (e.key === "Escape" && presenterMode) setPresenterMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, presenterMode]);

  function handleExportMarkdownGuide() {
    const md = [
      "# ClipForge — Interactive Presentation & Operations Guide",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...slides.flatMap((s) => [
        `## Slide ${s.number}: ${s.title}`,
        `> ${s.subtitle}`,
        "",
        ...s.bullets.map((b) => `- **${b.heading}:** ${b.detail}`),
        "",
        `**Presenter Notes:** ${s.speakerNotes}`,
        "",
        "---",
        "",
      ]),
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clipforge-presentation-guide.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={
        presenterMode
          ? "fixed inset-0 z-50 flex flex-col bg-[#0A0B0E] text-[#EEF0F4]"
          : "flex-1 flex flex-col min-h-[calc(100vh-56px)] bg-white dark:bg-[#0A0B0E]"
      }
    >
      {/* Deck Control Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/80 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <BookOpen className="w-4 h-4 text-[#E1392B]" />
          <span className="font-display font-bold text-sm text-[#0F1115] dark:text-[#EEF0F4]">
            Presentation Deck &amp; Live Demo Guide
          </span>
          <span className="font-mono tabular-nums text-slate-500">
            Slide {slideIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes((n) => !n)}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {showNotes ? "Hide Speaker Notes" : "Show Speaker Notes"}
          </button>

          <button
            type="button"
            onClick={handleExportMarkdownGuide}
            className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Guide (.md)</span>
          </button>

          <button
            type="button"
            onClick={() => setPresenterMode((p) => !p)}
            className="h-8 px-3 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {presenterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{presenterMode ? "Exit Fullscreen" : "Present Mode"}</span>
          </button>
        </div>
      </div>

      {/* Main Slide Canvas + Slide Index Rail */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left Slide Outline Rail */}
        <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#0D0F14] overflow-y-auto">
          <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631]">
            {slides.map((s, idx) => {
              const active = idx === slideIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-2.5 ${
                    active
                      ? "bg-white dark:bg-[#161922] text-[#0F1115] dark:text-[#EEF0F4]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-[#12151C]"
                  }`}
                >
                  <span className={`font-mono text-xs font-bold ${active ? "text-[#E1392B]" : "text-slate-400"}`}>
                    {s.number}
                  </span>
                  <span className="text-xs font-medium leading-snug line-clamp-2">{s.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Active Presentation Slide Stage */}
        <div className="lg:col-span-9 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-3">
              <div className="font-mono text-xs text-[#E1392B] font-semibold">
                {current.number}. ClipForge Walkthrough
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F1115] dark:text-[#EEF0F4] leading-tight text-balance">
                {current.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {current.subtitle}
              </p>
            </div>

            <div className="divide-y divide-[#D9DEE7] dark:divide-[#222631] border-t border-b border-[#D9DEE7] dark:border-[#222631]">
              {current.bullets.map((b, i) => (
                <div key={i} className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6">
                  <div className="sm:col-span-4 font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
                    {b.heading}
                  </div>
                  <div className="sm:col-span-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {b.detail}
                  </div>
                </div>
              ))}
            </div>

            {current.liveAction && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setPresenterMode(false);
                    onJumpToTab(current.liveAction!.tab);
                  }}
                  className="h-10 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83124] text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <span>{current.liveAction.label}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {showNotes && (
              <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#111318] space-y-1">
                <div className="text-[11px] font-mono text-slate-500">Presenter Speaker Notes</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{current.speakerNotes}</p>
              </div>
            )}
          </div>

          {/* Slide Navigation Footer */}
          <div className="pt-8 mt-8 border-t border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-4">
            <span className="text-xs font-mono text-slate-500">
              Use ← / → arrow keys to advance slides
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={slideIndex === 0}
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                className="h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] disabled:opacity-35 text-xs font-medium inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={slideIndex === slides.length - 1}
                onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                className="h-9 px-3.5 rounded-sm bg-[#0F1115] dark:bg-[#EEF0F4] disabled:opacity-35 text-white dark:text-[#0F1115] text-xs font-semibold inline-flex items-center gap-1"
              >
                <span>Next Slide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
