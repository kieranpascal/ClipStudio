import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Film,
  Loader2,
  Plus,
  Save,
  Trash2,
  Wand2,
} from "lucide-react";
import type {
  ClipItem,
  ContentNiche,
  LongFormGraduationItem,
  WorkspaceTab,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

interface FacelessLongFormPageProps {
  clips: ClipItem[];
  longFormPipeline: LongFormGraduationItem[];
  isBuildingFaceless: boolean;
  onBuildFacelessShort: (payload: {
    topic: string;
    niche: ContentNiche;
    facelessStyle: "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop";
    sourceText: string;
  }) => Promise<void>;
  onGraduateToLongForm: (clipId: string) => Promise<void>;
  onUpdateLongFormItem: (
    id: string,
    patch: {
      status?: LongFormGraduationItem["status"];
      longFormTitle?: string;
      targetDurationMin?: number;
      estLongFormRpmUsd?: number;
      chapters?: string[];
      sponsorSlotNote?: string;
    }
  ) => Promise<void>;
  onDeleteLongFormItem: (id: string) => Promise<void>;
  onOpenClipInStudio: (clipId: string) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
}

const FACELESS_STYLES: Array<{
  id: "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop";
  title: string;
  desc: string;
  beatStructure: string[];
}> = [
  {
    id: "authority-tech",
    title: "Authority Breakdown",
    desc: "Clean 16:9 blur backdrop + broadcast lower-thirds for AI & Finance explainers",
    beatStructure: ["0-3s Bold Claim Hook", "3-12s Proof Metric / Demo", "12-22s Step-by-Step Takeaway", "22-28s Affiliate / Email Bridge CTA"],
  },
  {
    id: "reddit-debate",
    title: "Reddit / X Debate",
    desc: "Split-stack storytelling anchored in polarizing real threads and comments",
    beatStructure: ["0-3s Polarizing Quote", "3-14s Escalating Counter-Evidence", "14-24s Surprising Verdict", "24-28s Comment Trigger Question"],
  },
  {
    id: "mystery-doc",
    title: "60s Micro-Doc",
    desc: "Suspense bed + HUD data callouts for deep dives and historical anomalies",
    beatStructure: ["0-4s Mystery Premise", "4-18s Timeline Reversal", "18-42s Core Reveal & Data", "42-55s Long-Form Tease"],
  },
  {
    id: "split-loop",
    title: "Split-Screen Loop",
    desc: "Kinetic highlight captions paired with high-retention visual bottom deck",
    beatStructure: ["0-3s Seamless Loop Hook", "3-15s Rapid 3-Point Breakdown", "15-26s Visual Proof Cutaway", "26-30s Seamless Loop End"],
  },
];

const STATUS_STAGES: Array<{ id: LongFormGraduationItem["status"]; label: string }> = [
  { id: "queued", label: "Queued" },
  { id: "scripting", label: "Scripting" },
  { id: "in-production", label: "In Production" },
  { id: "published", label: "Published" },
];

export function FacelessLongFormPage({
  clips,
  longFormPipeline,
  isBuildingFaceless,
  onBuildFacelessShort,
  onGraduateToLongForm,
  onUpdateLongFormItem,
  onDeleteLongFormItem,
  onOpenClipInStudio,
  onSelectTab,
}: FacelessLongFormPageProps) {
  const [subView, setSubView] = useState<"long-form" | "faceless">("long-form");

  // Faceless builder state
  const [facelessTopic, setFacelessTopic] = useState("");
  const [facelessNiche, setFacelessNiche] = useState<ContentNiche>("tech-ai");
  const [facelessStyle, setFacelessStyle] = useState<
    "authority-tech" | "reddit-debate" | "mystery-doc" | "split-loop"
  >("authority-tech");
  const [facelessSourceText, setFacelessSourceText] = useState("");

  // Long-form graduation state
  const [graduateClipId, setGraduateClipId] = useState(clips[0]?.id || "");
  const [graduating, setGraduating] = useState(false);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string>(
    longFormPipeline[0]?.id || ""
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedToastId, setSavedToastId] = useState<string | null>(null);

  const selectedBlueprint = useMemo(
    () =>
      longFormPipeline.find((item) => item.id === activeBlueprintId) ||
      longFormPipeline[0] ||
      null,
    [longFormPipeline, activeBlueprintId]
  );

  // Local editable draft synced when active blueprint changes
  const [draftKey, setDraftKey] = useState<string>("");
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState(12);
  const [editRpm, setEditRpm] = useState(14.2);
  const [editSponsorNote, setEditSponsorNote] = useState("");
  const [editChapters, setEditChapters] = useState<string[]>([]);
  const [newChapterInput, setNewChapterInput] = useState("");

  if (selectedBlueprint && selectedBlueprint.id !== draftKey) {
    setDraftKey(selectedBlueprint.id);
    setEditTitle(selectedBlueprint.longFormTitle);
    setEditDuration(selectedBlueprint.targetDurationMin);
    setEditRpm(selectedBlueprint.estLongFormRpmUsd);
    setEditSponsorNote(selectedBlueprint.sponsorSlotNote);
    setEditChapters([...selectedBlueprint.chapters]);
  }

  const facelessCount = clips.filter((c) => c.isFaceless).length;
  const avgLongFormRpm = useMemo(() => {
    if (longFormPipeline.length === 0) return 15.4;
    return (
      longFormPipeline.reduce((sum, item) => sum + item.estLongFormRpmUsd, 0) /
      longFormPipeline.length
    );
  }, [longFormPipeline]);

  const activeStyleMeta =
    FACELESS_STYLES.find((s) => s.id === facelessStyle) || FACELESS_STYLES[0];

  async function handleSaveBlueprint() {
    if (!selectedBlueprint) return;
    setSavingId(selectedBlueprint.id);
    try {
      await onUpdateLongFormItem(selectedBlueprint.id, {
        longFormTitle: editTitle.trim() || selectedBlueprint.longFormTitle,
        targetDurationMin: editDuration,
        estLongFormRpmUsd: editRpm,
        sponsorSlotNote: editSponsorNote,
        chapters: editChapters.filter((c) => c.trim().length > 0),
      });
      setSavedToastId(selectedBlueprint.id);
      setTimeout(() => setSavedToastId(null), 1800);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Production"
        title="Faceless Short Builder & Long-Form Graduation Studio"
        subtitle="Produce zero-filming editorial shorts with 4 structured formats—and automatically graduate your highest-retention Shorts into 10–18 minute YouTube Long-Form blueprints with mid-roll sponsor slots and chapter outlines."
        metaItems={[
          { label: `${longFormPipeline.length} Long-Form Blueprints`, emphasis: "crimson" },
          { label: `Avg $${avgLongFormRpm.toFixed(2)} Long-Form RPM`, emphasis: "emerald" },
          { label: `${facelessCount} Faceless Clips in Bin` },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("studio")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Open Cut Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E1392B]" />
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "lf-count",
            label: "Graduated Long-Form Blueprints",
            value: String(longFormPipeline.length),
            subtext: `${longFormPipeline.filter((i) => i.status === "in-production" || i.status === "scripting").length} actively scripting or in production`,
            tone: "crimson",
            onClick: () => setSubView("long-form"),
          },
          {
            id: "lf-rpm",
            label: "Projected Long-Form Ad RPM",
            value: `$${avgLongFormRpm.toFixed(2)}`,
            subtext: "8x–14x higher RPM than Shorts feed ad-share alone",
            tone: "emerald",
          },
          {
            id: "faceless-built",
            label: "Faceless Editorial Clips",
            value: String(facelessCount),
            subtext: "Zero filming · Zero DMCA music risk",
            onClick: () => setSubView("faceless"),
          },
          {
            id: "qualifying-shorts",
            label: "Qualifying Shorts Ready to Expand",
            value: String(clips.filter((c) => (c.publishedMetrics?.avgWatchPercent || 70) >= 75 || c.views >= 8000).length),
            subtext: "High watch-hold shorts proven by live audience data",
            onClick: () => setSubView("long-form"),
          },
        ]}
      />

      {/* Mode Switcher */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex items-center gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubView("long-form")}
          className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            subView === "long-form"
              ? "text-[#0F172A] dark:text-[#F8FAFC]"
              : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
          }`}
        >
          <Film className={`w-3.5 h-3.5 ${subView === "long-form" ? "text-[#E1392B]" : ""}`} />
          <span>Shorts-to-Long-Form Graduation Studio ({longFormPipeline.length})</span>
          {subView === "long-form" && (
            <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSubView("faceless")}
          className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            subView === "faceless"
              ? "text-[#0F172A] dark:text-[#F8FAFC]"
              : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
          }`}
        >
          <Wand2 className={`w-3.5 h-3.5 ${subView === "faceless" ? "text-[#E1392B]" : ""}`} />
          <span>Editorial Faceless Short Builder</span>
          {subView === "faceless" && (
            <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* VIEW 1: SHORTS-TO-LONG-FORM GRADUATION STUDIO */}
      {subView === "long-form" && (
        <div className="p-5 space-y-5">
          {/* Top Graduation Bar */}
          <section className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[11px] font-mono text-[#E1392B] font-semibold">
                Shorts-to-Long-Form Flywheel
              </div>
              <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Graduate a Winning Short into a High-RPM 10–18 Minute YouTube Video
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Select winning short clip to graduate"
                value={graduateClipId}
                onChange={(e) => setGraduateClipId(e.target.value)}
                className="h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs max-w-xs"
              >
                {clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title.slice(0, 56)} ({formatCompactNumber(c.views)} views)
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={graduating || !graduateClipId}
                onClick={async () => {
                  setGraduating(true);
                  try {
                    await onGraduateToLongForm(graduateClipId);
                  } finally {
                    setGraduating(false);
                  }
                }}
                className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {graduating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Graduate to Long-Form Blueprint</span>
              </button>
            </div>
          </section>

          {/* Split Layout: Left Blueprint List | Right Deep Blueprint & Chapter Editor */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <section className="xl:col-span-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-4 space-y-3">
              <StudioSectionHeader
                zone="action"
                title="Long-Form Production Queue"
                detail={`${longFormPipeline.length} blueprints`}
              />

              {longFormPipeline.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No long-form blueprints yet. Select a winning short above to generate its 12-minute blueprint.
                </div>
              ) : (
                <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                  {longFormPipeline.map((item) => {
                    const active = selectedBlueprint?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveBlueprintId(item.id)}
                        className={`w-full py-3 px-2.5 text-left transition-colors rounded-xs space-y-1 ${
                          active
                            ? "bg-[#E1392B]/[0.07]"
                            : "hover:bg-[#F8FAFC] dark:hover:bg-[#151821]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="font-semibold text-[#E1392B] uppercase">{item.status}</span>
                          <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${item.estLongFormRpmUsd.toFixed(2)} RPM · {item.targetDurationMin}m
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] line-clamp-2">
                          {item.longFormTitle}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 truncate">
                          From: {item.sourceShortTitle} ({formatCompactNumber(item.shortViews)} views · {item.shortWatchPct}% hold)
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="xl:col-span-7 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-4">
              {!selectedBlueprint ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Select a long-form blueprint on the left to edit chapters, sponsor slots, and production stage.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E2E7F0] dark:border-[#1E222D]">
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] text-slate-500">
                        Source Short: {selectedBlueprint.sourceShortTitle} · {selectedBlueprint.niche}
                      </div>
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        Blueprint Workshop &amp; Chapter Editor
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBlueprint.sourceClipId && (
                        <button
                          type="button"
                          onClick={() => onOpenClipInStudio(selectedBlueprint.sourceClipId!)}
                          className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold whitespace-nowrap"
                        >
                          Open Source Short
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteLongFormItem(selectedBlueprint.id)}
                        aria-label="Delete long-form blueprint"
                        className="h-8 w-8 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-rose-500 text-slate-500 hover:text-rose-500 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Production Stage Segmented Controls */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-500">Production Stage</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {STATUS_STAGES.map((stage) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() =>
                            onUpdateLongFormItem(selectedBlueprint.id, { status: stage.id })
                          }
                          className={`h-8 rounded-xs border text-xs font-semibold transition-colors ${
                            selectedBlueprint.status === stage.id
                              ? "border-[#E1392B] bg-[#E1392B] text-white"
                              : "border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-slate-600 dark:text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {stage.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title, Duration & RPM */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-8">
                      <label className="block text-slate-500 mb-1">Long-Form Video Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 mb-1">Minutes</label>
                      <input
                        type="number"
                        min={4}
                        max={60}
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value) || 12)}
                        className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 mb-1">Est. RPM ($)</label>
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        max={120}
                        value={editRpm}
                        onChange={(e) => setEditRpm(Number(e.target.value) || 10)}
                        className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Mid-Roll Sponsor & Affiliate Funnel Integration */}
                  <div className="text-xs">
                    <label className="block text-slate-500 mb-1">
                      Mid-Roll Sponsor Integration &amp; Affiliate/Email Funnel Note
                    </label>
                    <input
                      type="text"
                      value={editSponsorNote}
                      onChange={(e) => setEditSponsorNote(e.target.value)}
                      className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                    />
                  </div>

                  {/* Interactive Chapter Outline Editor */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        Timestamped Chapter Outline ({editChapters.length})
                      </span>
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                        Est. 100k views = ${Math.round(editRpm * 100).toLocaleString()} AdSense + Sponsor
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {editChapters.map((chapter, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 w-6 tabular-nums">
                            0{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={chapter}
                            onChange={(e) => {
                              const next = [...editChapters];
                              next[idx] = e.target.value;
                              setEditChapters(next);
                            }}
                            className="flex-1 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditChapters(editChapters.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove chapter"
                            className="h-8 w-8 rounded-xs text-slate-400 hover:text-rose-500 inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newChapterInput}
                        onChange={(e) => setNewChapterInput(e.target.value)}
                        placeholder="Add chapter (e.g., 11:30 Final Cost Breakdown & Free Download Link)"
                        className="flex-1 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newChapterInput.trim()) return;
                          setEditChapters([...editChapters, newChapterInput.trim()]);
                          setNewChapterInput("");
                        }}
                        className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E1392B]" />
                        <span>Add Chapter</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={savingId === selectedBlueprint.id}
                      onClick={handleSaveBlueprint}
                      className="h-9 px-4 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      {savingId === selectedBlueprint.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : savedToastId === selectedBlueprint.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Save className="w-3.5 h-3.5 text-[#E1392B]" />
                      )}
                      <span>
                        {savedToastId === selectedBlueprint.id ? "Blueprint Saved" : "Save Long-Form Blueprint"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {/* VIEW 2: EDITORIAL FACELESS SHORT BUILDER */}
      {subView === "faceless" && (
        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-8 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-5 text-xs">
            <StudioSectionHeader
              zone="action"
              title="Anti-Brainrot Editorial Faceless Short Builder"
              detail="Synthesizes 28s spoken script, kinetic captions & B-roll cues with zero DMCA risk"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {FACELESS_STYLES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFacelessStyle(m.id)}
                  className={`p-3 rounded-xs border text-left space-y-1 transition-colors ${
                    facelessStyle === m.id
                      ? "border-[#E1392B] bg-[#E1392B]/[0.06]"
                      : "border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14]"
                  }`}
                >
                  <div className="font-display font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {m.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.desc}</div>
                </button>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!facelessTopic.trim()) return;
                await onBuildFacelessShort({
                  topic: facelessTopic,
                  niche: facelessNiche,
                  facelessStyle,
                  sourceText: facelessSourceText,
                });
                setFacelessTopic("");
                setFacelessSourceText("");
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Topic, Headline, or Story Hook
                  </label>
                  <input
                    type="text"
                    required
                    value={facelessTopic}
                    onChange={(e) => setFacelessTopic(e.target.value)}
                    placeholder="e.g., How running Gemma 4 2B on a home Windows PC cuts AI content costs to $0"
                    className="w-full h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Target Niche</label>
                  <select
                    value={facelessNiche}
                    onChange={(e) => setFacelessNiche(e.target.value as ContentNiche)}
                    className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                  >
                    <option value="tech-ai">AI &amp; Tech ($3.40 RPM)</option>
                    <option value="finance">Finance ($3.80 RPM)</option>
                    <option value="faceless-doc">Faceless Micro-Doc ($2.80 RPM)</option>
                    <option value="podcasts">Creator / Podcast Debate ($2.25 RPM)</option>
                    <option value="gaming">Gaming Deep Dive ($0.95 RPM)</option>
                    <option value="sports-irl">Sports &amp; IRL ($1.65 RPM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Source Thread, Reddit Comments, or Bullet Facts (Optional)
                </label>
                <textarea
                  rows={5}
                  value={facelessSourceText}
                  onChange={(e) => setFacelessSourceText(e.target.value)}
                  placeholder="Paste real numbers, Reddit quotes, or newsletter bullets so Gemini grounds the narration in concrete specifics..."
                  className="w-full p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">Quick Presets:</span>
                  {[
                    "Why 2B local AI models on Windows PCs are replacing $200/mo SaaS stacks",
                    "The $40M decimal-point glitch that broke an MMO economy in 11 minutes",
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setFacelessTopic(idea)}
                      className="px-2 py-0.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] text-slate-600 dark:text-slate-300 hover:border-[#E1392B]"
                    >
                      {idea.slice(0, 44)}...
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isBuildingFaceless || !facelessTopic.trim()}
                  className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isBuildingFaceless ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isBuildingFaceless ? "Synthesizing Short..." : "Build & Open in Studio"}</span>
                </button>
              </div>
            </form>
          </section>

          <aside className="xl:col-span-4 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4 text-xs">
            <StudioSectionHeader
              zone="telemetry"
              title={`Format Blueprint: ${activeStyleMeta.title}`}
              detail="4-beat pacing cadence"
            />
            <ol className="space-y-2.5">
              {activeStyleMeta.beatStructure.map((beat, idx) => (
                <li
                  key={beat}
                  className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] flex items-center gap-2.5"
                >
                  <span className="font-mono text-[11px] font-bold text-[#E1392B] tabular-nums">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{beat}</span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              After generation, the clip opens straight in Cut Studio with synchronized voiceover script, caption segments, and timed B-roll cues ready for TTS rendering.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
