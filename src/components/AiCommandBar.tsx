import { useEffect, useRef, useState } from "react";
import { Bot, ArrowRight, X, Loader2 } from "lucide-react";
import type { ClipItem, WorkspaceTab } from "../types";

interface AiCommandBarProps {
  open: boolean;
  onClose: () => void;
  clips: ClipItem[];
  isDirecting: boolean;
  onSelectTab: (tab: WorkspaceTab) => void;
  onSelectClip: (clipId: string) => void;
  onExecuteDirector: (instruction: string) => Promise<void>;
}

const QUICK_NAV: Array<{ label: string; tab: WorkspaceTab }> = [
  { label: "Jump to Vertical Studio & Voiceover Engine", tab: "studio" },
  { label: "Jump to Research & Media Bin", tab: "ingest" },
  { label: "Jump to VOD & Highlights", tab: "vod" },
  { label: "Jump to Templates & B-Roll", tab: "templates" },
  { label: "Jump to Publish & Channel Fleet", tab: "distribution" },
  { label: "Jump to AI Ops Agent & LM Studio", tab: "autopilot" },
  { label: "Jump to Performance Monitor (Hourly Velocity)", tab: "performance" },
  { label: "Jump to GitOps & Live Telemetry", tab: "gitops" },
  { label: "Jump to Presentation Guide", tab: "guide" },
];

export function AiCommandBar({
  open,
  onClose,
  clips,
  isDirecting,
  onSelectTab,
  onSelectClip,
  onExecuteDirector,
}: AiCommandBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const matchingNav = QUICK_NAV.filter((n) => !q || n.label.toLowerCase().includes(q));
  const matchingClips = clips
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.streamerHandle.toLowerCase().includes(q))
    .slice(0, 4);

  async function handleRunAi(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || isDirecting) return;
    await onExecuteDirector(query.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 flex items-start justify-center pt-20 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-md border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#111318] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleRunAi} className="px-4 py-3 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center gap-3">
          <Bot className="w-4 h-4 text-[#E1392B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type an AI Director command or search decks & clips..."
            className="flex-1 bg-transparent text-sm text-[#0F1115] dark:text-[#EEF0F4] placeholder:text-slate-400 focus:outline-none"
          />
          {isDirecting ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#E1392B]" />
          ) : (
            <button type="button" onClick={onClose} aria-label="Close command bar" className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#ECEFF3] dark:divide-[#1E222C] text-xs">
          {query.trim().length > 3 && (
            <button
              type="button"
              disabled={isDirecting}
              onClick={handleRunAi}
              className="w-full px-4 py-3 text-left bg-[#E1392B]/10 hover:bg-[#E1392B]/15 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-[#0F1115] dark:text-[#EEF0F4]">
                  Run Autonomous AI Director: &ldquo;{query.trim()}&rdquo;
                </div>
                <div className="text-[11px] text-slate-500">
                  Gemini 4 Hydrogen will plan &amp; execute live actions across the workspace.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#E1392B] shrink-0" />
            </button>
          )}

          {matchingNav.length > 0 && (
            <div className="py-1.5">
              <div className="px-4 py-1 text-[10px] font-mono text-slate-500">Workspaces</div>
              {matchingNav.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-[#F6F7F9] dark:hover:bg-[#171A21] flex items-center justify-between text-[#0F1115] dark:text-slate-200"
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-[10px] text-slate-400">{item.tab}</span>
                </button>
              ))}
            </div>
          )}

          {matchingClips.length > 0 && (
            <div className="py-1.5">
              <div className="px-4 py-1 text-[10px] font-mono text-slate-500">Open Clip in Studio</div>
              {matchingClips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectClip(c.id);
                    onSelectTab("studio");
                    onClose();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-[#F6F7F9] dark:hover:bg-[#171A21] flex items-center justify-between gap-2"
                >
                  <span className="truncate text-[#0F1115] dark:text-slate-200">{c.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{c.streamerHandle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
