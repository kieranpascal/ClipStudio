import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  RotateCcw,
  X,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  BookA,
} from "lucide-react";
import type { HotkeyActionId, PipelineConfig, SlangCorrection } from "../types";
import {
  DEFAULT_HOTKEYS,
  DEFAULT_SLANG_DICTIONARY,
  HOTKEY_ACTIONS,
  HOTKEY_PRESETS,
  formatKeyboardEventToCombo,
  resolveHotkeys,
} from "../utils/hotkeys";

interface SettingsHotkeysModalProps {
  open: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onSaveConfig: (nextConfig: PipelineConfig) => Promise<void>;
}

export function SettingsHotkeysModal({
  open,
  onClose,
  config,
  onSaveConfig,
}: SettingsHotkeysModalProps) {
  const [section, setSection] = useState<"hotkeys" | "dictionary">("hotkeys");
  const [draftHotkeys, setDraftHotkeys] = useState<Record<HotkeyActionId, string>>(
    resolveHotkeys(config.hotkeys)
  );
  const [capturingAction, setCapturingAction] = useState<HotkeyActionId | null>(null);
  const [draftSlang, setDraftSlang] = useState<SlangCorrection[]>(
    config.slangDictionary && config.slangDictionary.length > 0
      ? config.slangDictionary
      : DEFAULT_SLANG_DICTIONARY
  );
  const [newWrong, setNewWrong] = useState("");
  const [newRight, setNewRight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftHotkeys(resolveHotkeys(config.hotkeys));
      setDraftSlang(
        config.slangDictionary && config.slangDictionary.length > 0
          ? config.slangDictionary
          : DEFAULT_SLANG_DICTIONARY
      );
      setCapturingAction(null);
    }
  }, [open, config.hotkeys, config.slangDictionary]);

  // Live keyboard capture when rebinding an action
  useEffect(() => {
    if (!open || !capturingAction) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setCapturingAction(null);
        return;
      }
      const combo = formatKeyboardEventToCombo(e);
      if (!combo) return;
      setDraftHotkeys((prev) => ({ ...prev, [capturingAction]: combo }));
      setCapturingAction(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, capturingAction]);

  // Conflict detection across bindings
  const conflicts = useMemo(() => {
    const comboMap = new Map<string, HotkeyActionId[]>();
    (Object.entries(draftHotkeys) as Array<[HotkeyActionId, string]>).forEach(([action, combo]) => {
      const key = combo.trim().toLowerCase();
      if (!key) return;
      const list = comboMap.get(key) || [];
      list.push(action);
      comboMap.set(key, list);
    });
    const dupSet = new Set<HotkeyActionId>();
    comboMap.forEach((actions) => {
      if (actions.length > 1) {
        actions.forEach((a) => dupSet.add(a));
      }
    });
    return dupSet;
  }, [draftHotkeys]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveConfig({
        ...config,
        hotkeys: draftHotkeys,
        slangDictionary: draftSlang,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleAddSlang(e: React.FormEvent) {
    e.preventDefault();
    if (!newWrong.trim() || !newRight.trim()) return;
    setDraftSlang((prev) => [...prev, { wrong: newWrong.trim(), right: newRight.trim() }]);
    setNewWrong("");
    setNewRight("");
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Studio Settings and Global Hotkeys"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#0D0F14] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Studio Settings &amp; Global Hotkeys
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bind custom keyboard shortcuts for NLE speed and configure auto-correct terms to eliminate manual caption cleanup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="h-8 w-8 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] flex items-center justify-center text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#111318] flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setSection("hotkeys")}
              className={`relative py-3 text-xs font-semibold inline-flex items-center gap-1.5 ${
                section === "hotkeys"
                  ? "text-[#0F172A] dark:text-[#F1F5F9]"
                  : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Global Hotkeys ({HOTKEY_ACTIONS.length})</span>
              {section === "hotkeys" && (
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSection("dictionary")}
              className={`relative py-3 text-xs font-semibold inline-flex items-center gap-1.5 ${
                section === "dictionary"
                  ? "text-[#0F172A] dark:text-[#F1F5F9]"
                  : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              <BookA className="w-3.5 h-3.5 text-[#E1392B]" />
              <span>Caption Slang Dictionary ({draftSlang.length})</span>
              {section === "dictionary" && (
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />
              )}
            </button>
          </div>

          {section === "hotkeys" && (
            <div className="flex items-center gap-1.5 py-2">
              {(["clipforge", "capcut-premiere", "davinci"] as const).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => setDraftHotkeys({ ...HOTKEY_PRESETS[presetKey].map })}
                  className="h-7 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] hover:border-[#E1392B] text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  {HOTKEY_PRESETS[presetKey].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {section === "hotkeys" && (
            <>
              {conflicts.size > 0 && (
                <div className="p-3 rounded-sm border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Duplicate shortcut detected on {conflicts.size} actions. Click a binding below to reassign a unique key combo.
                  </span>
                </div>
              )}

              <div className="border border-[#D9DEE7] dark:border-[#222631] divide-y divide-[#D9DEE7] dark:divide-[#222631]">
                {HOTKEY_ACTIONS.map((item) => {
                  const isCapturing = capturingAction === item.id;
                  const hasConflict = conflicts.has(item.id);
                  const combo = draftHotkeys[item.id] || "";
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F7F9]/70 dark:hover:bg-[#12151C]"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCapturingAction(isCapturing ? null : item.id)}
                          className={`h-8 min-w-[132px] px-3 rounded-sm border font-mono text-xs font-semibold transition-colors ${
                            isCapturing
                              ? "border-[#E1392B] bg-[#E1392B] text-white"
                              : hasConflict
                                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                : "border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21] text-[#0F172A] dark:text-[#F1F5F9] hover:border-[#E1392B]"
                          }`}
                        >
                          {isCapturing ? "Press keys... (Esc)" : combo || "Unbound"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Hotkeys automatically pause while typing inside text inputs or caption editors.</span>
                <button
                  type="button"
                  onClick={() => setDraftHotkeys({ ...DEFAULT_HOTKEYS })}
                  className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#E1392B]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </>
          )}

          {section === "dictionary" && (
            <div className="space-y-4">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Solves manual caption-editing fatigue: define creator handles, game titles, and technical slang once, then click <strong>Apply Slang Fix</strong> inside Studio Captions to normalize every subtitle line in one click.
              </p>

              <form onSubmit={handleAddSlang} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={newWrong}
                  onChange={(e) => setNewWrong(e.target.value)}
                  placeholder="Misheard phrase (e.g. gta six)"
                  className="sm:col-span-5 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720]"
                />
                <input
                  type="text"
                  value={newRight}
                  onChange={(e) => setNewRight(e.target.value)}
                  placeholder="Correct term (e.g. GTA VI)"
                  className="sm:col-span-5 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#141720] font-semibold"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 h-9 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              <div className="border border-[#D9DEE7] dark:border-[#222631] divide-y divide-[#D9DEE7] dark:divide-[#222631]">
                {draftSlang.map((entry, idx) => (
                  <div key={`${entry.wrong}_${idx}`} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-slate-500 line-through">{entry.wrong}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{entry.right}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraftSlang((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove ${entry.wrong}`}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#D9DEE7] dark:border-[#222631] bg-[#F6F7F9] dark:bg-[#111318] flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-slate-500">
            Persists to pipeline.config.json &amp; activates live in Studio
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-white dark:bg-[#171A21] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || conflicts.size > 0}
              onClick={handleSave}
              className="h-9 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Hotkeys & Settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
