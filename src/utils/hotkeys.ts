import type { HotkeyActionId, MusicBedId, SlangCorrection } from "../types";

export interface HotkeyActionMeta {
  id: HotkeyActionId;
  label: string;
  category: "Edit" | "AI" | "Playback" | "Publish";
  description: string;
}

export const HOTKEY_ACTIONS: HotkeyActionMeta[] = [
  {
    id: "trim-to-selection",
    label: "Trim to Selection",
    category: "Edit",
    description: "Trim the active clip window to the selected Hook In → Playhead Out span.",
  },
  {
    id: "generate-hook",
    label: "Generate Hook",
    category: "AI",
    description: "Run Gemini A/B/C viral 0–3s hook variant generation on the active clip.",
  },
  {
    id: "send-to-queue",
    label: "Send to Queue",
    category: "Publish",
    description: "Mark the current Studio cut Ready and send it straight to the Publish Desk.",
  },
  {
    id: "play-pause",
    label: "Play / Pause Monitor",
    category: "Playback",
    description: "Toggle live 9:16 canvas playback in the Studio monitor.",
  },
  {
    id: "blade-split",
    label: "Blade Split Caption",
    category: "Edit",
    description: "Split the active caption block precisely at the current playhead timestamp.",
  },
  {
    id: "toggle-safe-zones",
    label: "Toggle Safe Zones",
    category: "Edit",
    description: "Show or hide TikTok / Reels / Shorts HUD safe-zone guides on the canvas.",
  },
  {
    id: "generate-voiceover",
    label: "Open Voiceover Engine",
    category: "AI",
    description: "Jump to the Voiceover TTS panel to draft or synthesize a narration track.",
  },
  {
    id: "add-review-note",
    label: "Pin Review Note",
    category: "Edit",
    description: "Pin a timestamped editor/client review comment at the current playhead second.",
  },
  {
    id: "prev-clip",
    label: "Previous Clip",
    category: "Playback",
    description: "Switch Studio to the previous clip in the Media Bin.",
  },
  {
    id: "next-clip",
    label: "Next Clip",
    category: "Playback",
    description: "Switch Studio to the next clip in the Media Bin.",
  },
];

export const DEFAULT_HOTKEYS: Record<HotkeyActionId, string> = {
  "trim-to-selection": "Shift+T",
  "generate-hook": "Shift+H",
  "send-to-queue": "Shift+Q",
  "play-pause": "Space",
  "blade-split": "B",
  "toggle-safe-zones": "G",
  "generate-voiceover": "Shift+V",
  "add-review-note": "M",
  "prev-clip": "[",
  "next-clip": "]",
};

export const HOTKEY_PRESETS: Record<
  "clipforge" | "capcut-premiere" | "davinci",
  { label: string; map: Record<HotkeyActionId, string> }
> = {
  clipforge: {
    label: "ClipForge Default",
    map: { ...DEFAULT_HOTKEYS },
  },
  "capcut-premiere": {
    label: "CapCut / Premiere",
    map: {
      "trim-to-selection": "Ctrl+Shift+X",
      "generate-hook": "Alt+H",
      "send-to-queue": "Ctrl+Shift+E",
      "play-pause": "Space",
      "blade-split": "C",
      "toggle-safe-zones": "Shift+G",
      "generate-voiceover": "Alt+V",
      "add-review-note": "M",
      "prev-clip": "ArrowUp",
      "next-clip": "ArrowDown",
    },
  },
  davinci: {
    label: "DaVinci Resolve",
    map: {
      "trim-to-selection": "Alt+X",
      "generate-hook": "Alt+G",
      "send-to-queue": "Shift+8",
      "play-pause": "Space",
      "blade-split": "Ctrl+B",
      "toggle-safe-zones": "Shift+S",
      "generate-voiceover": "Alt+R",
      "add-review-note": "M",
      "prev-clip": "Shift+[",
      "next-clip": "Shift+]",
    },
  },
};

export const DEFAULT_SLANG_DICTIONARY: SlangCorrection[] = [
  { wrong: "gta six", right: "GTA VI" },
  { wrong: "gta 6", right: "GTA VI" },
  { wrong: "lmstudio", right: "LM Studio" },
  { wrong: "kade velo", right: "KadeVelo" },
  { wrong: "lufs", right: "LUFS" },
  { wrong: "rpm", right: "RPM" },
];

export function resolveHotkeys(
  custom?: Partial<Record<HotkeyActionId, string>>
): Record<HotkeyActionId, string> {
  return {
    ...DEFAULT_HOTKEYS,
    ...(custom || {}),
  };
}

export function normalizeKeyName(key: string): string {
  if (key === " ") return "Space";
  if (key === "Escape") return "Esc";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function formatKeyboardEventToCombo(e: KeyboardEvent): string | null {
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    return null;
  }
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  parts.push(normalizeKeyName(e.key));
  return parts.join("+");
}

export function matchesHotkeyCombo(e: KeyboardEvent, combo: string | undefined): boolean {
  if (!combo) return false;
  const pressed = formatKeyboardEventToCombo(e);
  if (!pressed) return false;
  return pressed.toLowerCase() === combo.trim().toLowerCase();
}

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function computeOutlierMultiplier(views: number, baselineViews?: number): number {
  const baseline = baselineViews && baselineViews > 0 ? baselineViews : 4500;
  return Number(Math.max(0.2, views / baseline).toFixed(1));
}

export function previewMusicBed(bedId: MusicBedId): void {
  if (bedId === "none") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.08, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    master.connect(ctx.destination);

    const chordMap: Record<Exclude<MusicBedId, "none">, number[]> = {
      "cinematic-pulse": [110, 164.81, 220, 329.63],
      "lofi-focus": [174.61, 220, 261.63, 329.63],
      "phonk-drift": [73.42, 110, 146.83, 220],
      "tech-minimal": [130.81, 196, 261.63, 392],
      "suspense-riser": [98, 103.83, 196, 207.65],
    };
    const freqs = chordMap[bedId];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = bedId === "phonk-drift" ? "sawtooth" : bedId === "tech-minimal" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      if (bedId === "suspense-riser") {
        osc.frequency.linearRampToValueAtTime(f * 1.18, now + 1.3);
      }
      osc.connect(master);
      osc.start(now + idx * 0.08);
      osc.stop(now + 1.45);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

const EMOJI_RULES: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /\b(mph|drift|speed|car|roadblock|boost|fast)\b/i, emoji: "🏎️" },
  { pattern: /\b(money|dollar|\$|rpm|revenue|free|bill|cash)\b/i, emoji: "💰" },
  { pattern: /\b(fire|insane|crazy|wild|unreal|shocked|god)\b/i, emoji: "🔥" },
  { pattern: /\b(ai|model|pc|gpu|code|local|gemma|agent)\b/i, emoji: "⚡" },
  { pattern: /\b(secret|hidden|glitch|nobody|warning|stop)\b/i, emoji: "🚨" },
  { pattern: /\b(win|clutch|cleared|record|crown|top)\b/i, emoji: "🏆" },
  { pattern: /\b(wait|watch|look|second)\b/i, emoji: "👀" },
];

export function injectContextualEmoji(text: string): string {
  const alreadyHasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text);
  if (alreadyHasEmoji) return text;
  for (const rule of EMOJI_RULES) {
    if (rule.pattern.test(text)) {
      return `${text} ${rule.emoji}`;
    }
  }
  return text;
}
