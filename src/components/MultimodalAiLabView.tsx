import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Mic,
  MicOff,
  Image as ImageIcon,
  Film,
  FileAudio,
  Music,
  Search,
  Send,
  Loader2,
  Upload,
  Download,
  ExternalLink,
  Volume2,
  Square,
  Sparkles,
  Wand2,
  CheckCircle2,
  Coins,
  Laptop,
} from "lucide-react";
import type {
  AiComputeRoutingConfig,
  AiComputeTierId,
  ClipItem,
  TrendPulseSource,
  VoiceProfileId,
} from "../types";

interface MultimodalAiLabViewProps {
  clips: ClipItem[];
  selectedClipId: string;
  computeRouting?: AiComputeRoutingConfig;
  onSyncComputeRouting: (routing: AiComputeRoutingConfig) => void;
  onApplyTranscriptToClip: (clipId: string, transcript: string) => Promise<void>;
  onJumpToComputeHub: () => void;
  onNotify: (type: "success" | "error", message: string) => void;
}

type LabToolId = "chat" | "voice" | "image" | "video" | "transcribe" | "music";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  model?: string;
  usedSearch?: boolean;
  sources?: TrendPulseSource[];
  searchQueries?: string[];
}

// =========================================================================
// Audio PCM Helpers for Gemini Live API (16kHz input -> 24kHz gapless output)
// =========================================================================
function float32ToBase64Pcm16(float32: Float32Array): string {
  const buf = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(Math.floor(len / 2));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}

// =========================================================================
// $0 Free WebAudio Procedural Beat Synthesizer (Real Playable & Downloadable WAV)
// =========================================================================
function encodeWavFromFloat32(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function synthesizeFreeLoopWav(
  style: "phonk" | "lofi" | "tech-pulse" | "suspense",
  bpm: number,
  durationSec = 10
): string {
  const sampleRate = 24000;
  const totalSamples = sampleRate * durationSec;
  const out = new Float32Array(totalSamples);
  const beatDur = 60 / bpm;

  const scales: Record<typeof style, number[]> = {
    phonk: [55, 65.41, 73.42, 82.41, 98],
    lofi: [130.81, 164.81, 196.0, 246.94, 293.66],
    "tech-pulse": [110, 130.81, 164.81, 220, 261.63],
    suspense: [65.41, 69.3, 98, 103.83, 130.81],
  };
  const notes = scales[style];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t / beatDur);
    const beatPos = (t % beatDur) / beatDur;
    const subStep = Math.floor(t / (beatDur / 2));

    // Kick drum envelope
    const kickPitch = 140 * Math.exp(-beatPos * 22) + 42;
    const kickEnv = Math.exp(-beatPos * 10);
    const kick = (beatIndex % 2 === 0 || style === "tech-pulse" ? 0.45 : 0.25) * Math.sin(2 * Math.PI * kickPitch * beatPos) * kickEnv;

    // Bass / Lead synth
    const freq = notes[subStep % notes.length];
    const synthEnv = Math.exp(-((t % (beatDur / 2)) / (beatDur / 2)) * 3.5);
    const rawWave =
      style === "phonk"
        ? Math.tanh(Math.sin(2 * Math.PI * freq * t) * 2.5)
        : style === "lofi"
          ? Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25
          : Math.sin(2 * Math.PI * freq * t) * 0.5 + ((t * freq) % 1 - 0.5) * 0.35;

    // Crisp hi-hat
    const hatPos = (t % (beatDur / 4)) / (beatDur / 4);
    const hat = (Math.random() * 2 - 1) * Math.exp(-hatPos * 28) * (style === "suspense" ? 0.04 : 0.11);

    const fadeOut = t > durationSec - 0.5 ? (durationSec - t) / 0.5 : 1;
    out[i] = Math.max(-0.95, Math.min(0.95, (kick + rawWave * synthEnv * 0.32 + hat) * fadeOut));
  }

  return URL.createObjectURL(encodeWavFromFloat32(out, sampleRate));
}

export function MultimodalAiLabView({
  clips,
  selectedClipId,
  computeRouting,
  onSyncComputeRouting,
  onApplyTranscriptToClip,
  onJumpToComputeHub,
  onNotify,
}: MultimodalAiLabViewProps) {
  const [activeTool, setActiveTool] = useState<LabToolId>("chat");

  // 1. Chatbot + Google Search Grounding state
  const [chatTier, setChatTier] = useState<AiComputeTierId>(
    computeRouting?.activeTier || "cloud-standard"
  );
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask anything about trending video hooks, sponsorship rates, platform algorithm updates, or script rewrites. Toggle Google Search ON for live cited web data, or switch to Windows PC Local LLM for $0 private inference.",
      model: "gemini-4-hydrogen",
    },
  ]);

  // 2. Real-Time Live Voice Conversations (Gemini 3.8 Live) state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfileId>("Zephyr");
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceTextCue, setVoiceTextCue] = useState("");
  const [voiceTranscripts, setVoiceTranscripts] = useState<
    Array<{ id: string; speaker: "you" | "gemini"; text: string }>
  >([]);
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const mutedRef = useRef<boolean>(false);

  useEffect(() => {
    mutedRef.current = voiceMuted;
  }, [voiceMuted]);

  useEffect(() => {
    return () => {
      stopLiveVoiceSession();
    };
  }, []);

  // 3. Create & Edit Images state
  const [imagePrompt, setImagePrompt] = useState(
    "Bold editorial 9:16 vertical cover frame for an AI & Finance creator short, dramatic graphite studio lighting, subtle crimson accent tally light, ultra-clean composition"
  );
  const [imageAspect, setImageAspect] = useState<"9:16" | "16:9" | "1:1" | "4:5">("9:16");
  const [imageQuality, setImageQuality] = useState<"fast" | "pro">("fast");
  const [editSourceImage, setEditSourceImage] = useState<{ dataUrl: string; mime: string } | null>(
    null
  );
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageCaptionText, setImageCaptionText] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [canvasHookTitle, setCanvasHookTitle] = useState("WHY 94% OF CREATORS MISS THIS");
  const [canvasSubTitle, setCanvasSubTitle] = useState("PROVEN SPONSOR FUNNEL BREAKDOWN");

  // 4. Generate Video & Animate Images state
  const [videoPrompt, setVideoPrompt] = useState(
    "Smooth cinematic slow push-in across a modern creator desk with dual glowing studio monitors, subtle lens dust and crisp depth of field"
  );
  const [videoAspect, setVideoAspect] = useState<"9:16" | "16:9">("9:16");
  const [videoDuration, setVideoDuration] = useState<"5s" | "8s" | "10s">("5s");
  const [videoSourceImage, setVideoSourceImage] = useState<{ dataUrl: string; mime: string } | null>(
    null
  );
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [freeMotionStyle, setFreeMotionStyle] = useState<"ken-burns-in" | "pan-right" | "pulse-zoom">(
    "ken-burns-in"
  );
  const [freeMotionCaption, setFreeMotionCaption] = useState("STOP SCROLLING · WATCH THIS");

  // 5. Audio Transcription state
  const [transcribeAudio, setTranscribeAudio] = useState<{
    dataUrl: string;
    mime: string;
    name: string;
  } | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState("");
  const [transcriptWordCount, setTranscriptWordCount] = useState(0);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [targetClipId, setTargetClipId] = useState(selectedClipId || clips[0]?.id || "");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 6. Generate Music state
  const [musicPrompt, setMusicPrompt] = useState(
    "Energetic 30-second high-retention tech documentary background beat, crisp percussion, warm bass pulse, clean headroom for voiceover"
  );
  const [musicFullTrack, setMusicFullTrack] = useState(false);
  const [musicRefImage, setMusicRefImage] = useState<{ dataUrl: string; mime: string } | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [musicLoading, setMusicLoading] = useState(false);
  const [freeBeatStyle, setFreeBeatStyle] = useState<"phonk" | "lofi" | "tech-pulse" | "suspense">(
    "tech-pulse"
  );
  const [freeBeatBpm, setFreeBeatBpm] = useState(122);

  // =========================================================================
  // HANDLER 1: CHATBOT + GOOGLE SEARCH + WINDOWS PC LOCAL LLM
  // =========================================================================
  async function handleSendChat(e?: React.FormEvent, preset?: string) {
    if (e) e.preventDefault();
    const message = (preset ?? chatInput).trim();
    if (!message || chatLoading) return;

    const userTurn: ChatTurn = { id: `u_${Date.now()}`, role: "user", text: message };
    setChatTurns((prev) => [...prev, userTurn]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Tier 1: Direct browser-to-Windows-PC Local LLM (Ollama / LM Studio)
      if (chatTier === "windows-pc-local") {
        const base = (computeRouting?.windowsPcEndpoint || "http://localhost:1234/v1").replace(
          /\/+$/,
          ""
        );
        const localModel = computeRouting?.windowsPcModel || "gemma-4-2b-it";
        const res = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: localModel,
            messages: [
              {
                role: "system",
                content:
                  "You are ClipForge Local AI Producer running on the creator's Windows PC at $0 API cost. Give sharp, concise short-form video growth and editing advice.",
              },
              ...chatTurns.slice(-6).map((t) => ({
                role: t.role === "user" ? "user" : "assistant",
                content: t.text,
              })),
              { role: "user", content: message },
            ],
          }),
        });
        if (!res.ok) throw new Error(`Local PC endpoint returned HTTP ${res.status}`);
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content?.trim() || "No response from local model.";
        setChatTurns((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: "assistant",
            text: reply,
            model: `${localModel} (Windows PC · $0)`,
            usedSearch: false,
          },
        ]);
        return;
      }

      // Cloud Gemini Chatbot with optional Google Search Grounding
      const res = await fetch("/api/ai/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          useSearch: useGoogleSearch,
          tier: chatTier === "manual-free" ? "cloud-budget" : chatTier,
          history: chatTurns.slice(-8).map((t) => ({ role: t.role, text: t.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed.");
      if (data.computeRouting) onSyncComputeRouting(data.computeRouting);
      setChatTurns((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          text: data.reply,
          model: data.model,
          usedSearch: data.usedSearch,
          sources: data.sources || [],
          searchQueries: data.searchQueries || [],
        },
      ]);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setChatLoading(false);
    }
  }

  // =========================================================================
  // HANDLER 2: REAL-TIME VOICE CONVERSATIONS (GEMINI 3.8 LIVE)
  // =========================================================================
  function clearQueuedPlayback() {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    }
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    }
  }

  function schedulePcmPlayback(base64Pcm: string) {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const samples = base64Pcm16ToFloat32(base64Pcm);
    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
    };
  }

  async function startLiveVoiceSession() {
    if (voiceConnected || voiceConnecting) return;
    setVoiceConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${proto}//${window.location.host}/api/live-voice?voice=${encodeURIComponent(voiceProfile)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (event) => {
          if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const pcmBase64 = float32ToBase64Pcm16(event.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: pcmBase64 }));
        };

        setVoiceConnecting(false);
        setVoiceConnected(true);
        onNotify("success", `Live Voice connected (${voiceProfile} · gemini-3.8-live). Start speaking!`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type?: string;
            data?: string;
            text?: string;
            error?: string;
          };
          if (msg.type === "audio" && msg.data) {
            schedulePcmPlayback(msg.data);
          } else if (msg.type === "interrupted") {
            clearQueuedPlayback();
          } else if (msg.type === "inputTranscript" && msg.text) {
            setVoiceTranscripts((prev) => [
              ...prev.slice(-24),
              { id: `in_${Date.now()}_${Math.random()}`, speaker: "you", text: msg.text! },
            ]);
          } else if (msg.type === "outputTranscript" && msg.text) {
            setVoiceTranscripts((prev) => [
              ...prev.slice(-24),
              { id: `out_${Date.now()}_${Math.random()}`, speaker: "gemini", text: msg.text! },
            ]);
          } else if (msg.type === "error" && msg.error) {
            onNotify("error", msg.error);
          }
        } catch {
          // Ignore malformed message
        }
      };

      ws.onerror = () => {
        onNotify("error", "Live voice WebSocket encountered a connection error.");
        stopLiveVoiceSession();
      };

      ws.onclose = () => {
        setVoiceConnected(false);
        setVoiceConnecting(false);
      };
    } catch (err) {
      setVoiceConnecting(false);
      onNotify(
        "error",
        err instanceof Error
          ? err.message
          : "Microphone access or Live Voice connection was blocked."
      );
      stopLiveVoiceSession();
    }
  }

  function stopLiveVoiceSession() {
    clearQueuedPlayback();
    try {
      processorRef.current?.disconnect();
      inputCtxRef.current?.close();
      outputCtxRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wsRef.current?.close();
    } catch {
      // Ignore cleanup errors
    }
    processorRef.current = null;
    inputCtxRef.current = null;
    outputCtxRef.current = null;
    streamRef.current = null;
    wsRef.current = null;
    setVoiceConnected(false);
    setVoiceConnecting(false);
  }

  function sendLiveVoiceTextCue(e: React.FormEvent) {
    e.preventDefault();
    if (!voiceTextCue.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: voiceTextCue.trim() }));
    setVoiceTranscripts((prev) => [
      ...prev.slice(-24),
      { id: `txt_${Date.now()}`, speaker: "you", text: voiceTextCue.trim() },
    ]);
    setVoiceTextCue("");
  }

  // =========================================================================
  // HANDLER 3: CREATE & EDIT IMAGES (GEMINI + $0 CANVAS DESIGNER)
  // =========================================================================
  function handleUploadFileAsDataUrl(
    file: File | undefined,
    cb: (dataUrl: string, mime: string, name: string) => void
  ) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        cb(reader.result, file.type || "application/octet-stream", file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateOrEditImage() {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);
    try {
      const res = await fetch("/api/ai/studio/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspect,
          quality: imageQuality,
          ...(editSourceImage
            ? {
                sourceImageBase64: editSourceImage.dataUrl,
                sourceImageMime: editSourceImage.mime,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed.");
      setGeneratedImageUrl(data.imageUrl);
      setImageCaptionText(data.captionText || "");
      if (data.computeRouting) onSyncComputeRouting(data.computeRouting);
      onNotify("success", `Image ${data.mode === "edit" ? "edited" : "generated"} via ${data.model}.`);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Image request failed.");
    } finally {
      setImageLoading(false);
    }
  }

  function handleRenderFreeCanvasCover() {
    const dims: Record<typeof imageAspect, [number, number]> = {
      "9:16": [720, 1280],
      "16:9": [1280, 720],
      "1:1": [1080, 1080],
      "4:5": [864, 1080],
    };
    const [w, h] = dims[imageAspect];
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finishDraw = () => {
      // Architectural graphite scrim + crimson broadcast bar
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(13, 15, 20, 0.45)");
      grad.addColorStop(0.55, "rgba(13, 15, 20, 0.25)");
      grad.addColorStop(1, "rgba(13, 15, 20, 0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#E1392B";
      ctx.fillRect(48, h - 290, 96, 8);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "800 54px system-ui, sans-serif";
      const words = canvasHookTitle.toUpperCase().split(" ");
      let line = "";
      let y = h - 220;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 96) {
          ctx.fillText(line, 48, y);
          line = word;
          y += 64;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, 48, y);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "600 24px monospace";
      ctx.fillText(canvasSubTitle.toUpperCase(), 48, y + 54);

      setGeneratedImageUrl(canvas.toDataURL("image/png"));
      setImageCaptionText("Rendered locally at $0 cost via Browser Canvas Cover Designer.");
      onNotify("success", "Rendered $0 PNG cover frame locally.");
    };

    if (editSourceImage?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        finishDraw();
      };
      img.src = editSourceImage.dataUrl;
    } else {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#111318");
      bg.addColorStop(0.5, "#1E2433");
      bg.addColorStop(1, "#0D0F14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      // Subtle architectural grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      finishDraw();
    }
  }

  // =========================================================================
  // HANDLER 4: TEXT-TO-VIDEO & ANIMATE IMAGES (GEMINI OMNI + $0 MOTION ENGINE)
  // =========================================================================
  async function handleGenerateCloudVideo() {
    if (!videoPrompt.trim() || videoLoading) return;
    setVideoLoading(true);
    try {
      const res = await fetch("/api/ai/studio/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspect,
          duration: videoDuration,
          resolution: "720p",
          ...(videoSourceImage
            ? {
                sourceImageBase64: videoSourceImage.dataUrl,
                sourceImageMime: videoSourceImage.mime,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video generation failed.");
      setGeneratedVideoUrl(data.videoUrl);
      if (data.computeRouting) onSyncComputeRouting(data.computeRouting);
      onNotify("success", `Video rendered via ${data.model}.`);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Video generation failed.");
    } finally {
      setVideoLoading(false);
    }
  }

  async function handleAnimateImageFreeBrowser() {
    if (videoLoading) return;
    setVideoLoading(true);
    try {
      const w = videoAspect === "9:16" ? 540 : 960;
      const h = videoAspect === "9:16" ? 960 : 540;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      let loadedImg: HTMLImageElement | null = null;
      if (videoSourceImage?.dataUrl) {
        loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = videoSourceImage.dataUrl;
        });
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const donePromise = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve(URL.createObjectURL(blob));
        };
      });

      recorder.start();
      const totalFrames = 120; // 4 seconds at 30fps
      for (let f = 0; f < totalFrames; f++) {
        const progress = f / totalFrames;
        ctx.fillStyle = "#0D0F14";
        ctx.fillRect(0, 0, w, h);

        if (loadedImg) {
          const baseScale = Math.max(w / loadedImg.width, h / loadedImg.height);
          const zoom =
            freeMotionStyle === "ken-burns-in"
              ? 1 + progress * 0.18
              : freeMotionStyle === "pulse-zoom"
                ? 1.05 + Math.sin(progress * Math.PI * 2) * 0.06
                : 1.12;
          const panX = freeMotionStyle === "pan-right" ? (progress - 0.5) * 80 : 0;
          const dw = loadedImg.width * baseScale * zoom;
          const dh = loadedImg.height * baseScale * zoom;
          ctx.drawImage(loadedImg, (w - dw) / 2 + panX, (h - dh) / 2, dw, dh);
        } else {
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, "#111318");
          grad.addColorStop(1, "#1F2937");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "rgba(225, 57, 43, 0.25)";
          ctx.beginPath();
          ctx.arc(w * (0.25 + progress * 0.5), h * 0.42, 120 + progress * 40, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bottom caption banner
        ctx.fillStyle = "rgba(13, 15, 20, 0.72)";
        ctx.fillRect(0, h - 140, w, 140);
        ctx.fillStyle = "#E1392B";
        ctx.fillRect(32, h - 118, 64, 5);
        ctx.fillStyle = "#F8FAFC";
        ctx.font = "800 30px system-ui, sans-serif";
        ctx.fillText(freeMotionCaption.toUpperCase().slice(0, 38), 32, h - 68);

        await new Promise((r) => setTimeout(r, 25));
      }

      recorder.stop();
      const url = await donePromise;
      setGeneratedVideoUrl(url);
      onNotify("success", "Animated real 4s WebM video locally at $0 cost!");
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Local motion render failed.");
    } finally {
      setVideoLoading(false);
    }
  }

  // =========================================================================
  // HANDLER 5: AUDIO TRANSCRIPTION (GEMINI 3.5 TRANSCRIBE + MIC RECORDER)
  // =========================================================================
  async function handleStartMicRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setTranscribeAudio({
              dataUrl: reader.result,
              mime: (blob.type || "audio/webm").split(";")[0],
              name: `mic-recording-${new Date().toLocaleTimeString()}.webm`,
            });
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Could not access microphone.");
    }
  }

  function handleStopMicRecord() {
    mediaRecorderRef.current?.stop();
    setIsRecordingAudio(false);
  }

  async function handleTranscribeAudio() {
    if (!transcribeAudio || transcribeLoading) return;
    setTranscribeLoading(true);
    try {
      const res = await fetch("/api/ai/studio/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: transcribeAudio.dataUrl,
          mimeType: transcribeAudio.mime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed.");
      setTranscriptResult(data.transcript || "");
      setTranscriptWordCount(data.wordCount || 0);
      if (data.computeRouting) onSyncComputeRouting(data.computeRouting);
      onNotify("success", `Transcribed ${data.wordCount || 0} words via ${data.model}.`);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Transcription failed.");
    } finally {
      setTranscribeLoading(false);
    }
  }

  // =========================================================================
  // HANDLER 6: MUSIC GENERATION (LYRIA + $0 WEBAUDIO BEAT SYNTH)
  // =========================================================================
  async function handleGenerateLyriaMusic() {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    try {
      const res = await fetch("/api/ai/studio/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          fullTrack: musicFullTrack,
          ...(musicRefImage
            ? { sourceImageBase64: musicRefImage.dataUrl, sourceImageMime: musicRefImage.mime }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Music generation failed.");
      setGeneratedMusicUrl(data.audioUrl);
      setGeneratedLyrics(data.lyrics || "");
      if (data.computeRouting) onSyncComputeRouting(data.computeRouting);
      onNotify("success", `Generated audio track via ${data.model}.`);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Music generation failed.");
    } finally {
      setMusicLoading(false);
    }
  }

  function handleSynthesizeFreeBeat() {
    const wavUrl = synthesizeFreeLoopWav(freeBeatStyle, freeBeatBpm, 10);
    setGeneratedMusicUrl(wavUrl);
    setGeneratedLyrics(
      `[Instrumental $0 WebAudio Beat · ${freeBeatStyle.toUpperCase()} · ${freeBeatBpm} BPM · Royalty-Free 24kHz WAV]`
    );
    onNotify("success", `Synthesized $0 royalty-free ${freeBeatStyle} WAV loop (${freeBeatBpm} BPM).`);
  }

  const tools: Array<{ id: LabToolId; label: string; icon: typeof MessageSquare; modelHint: string }> = [
    { id: "chat", label: "Chatbot + Search", icon: MessageSquare, modelHint: "gemini-4-hydrogen + Search" },
    { id: "voice", label: "Live Voice", icon: Mic, modelHint: "gemini-3.8-live" },
    { id: "image", label: "Create & Edit Images", icon: ImageIcon, modelHint: "nano-banana / $0 Canvas" },
    { id: "video", label: "Video & Animate", icon: Film, modelHint: "omni-1.2-flash / $0 Motion" },
    { id: "transcribe", label: "Transcribe Audio", icon: FileAudio, modelHint: "gemini-3.5-transcribe" },
    { id: "music", label: "Generate Music", icon: Music, modelHint: "lyria-3 / $0 Beat Synth" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Lab Header */}
        <div className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E1392B]" />
              <h1 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Multimodal AI Creative Lab
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Google Search-grounded Gemini chatbot, live voice conversations, image creation &amp; editing, video &amp; image animation, audio transcription, and music synthesis—with $0 local &amp; browser fallbacks.
            </p>
          </div>

          <button
            type="button"
            onClick={onJumpToComputeHub}
            className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] text-xs font-mono inline-flex items-center gap-2"
          >
            <Coins className="w-3.5 h-3.5 text-[#E1392B]" />
            <span>
              Tier: {computeRouting?.activeTier || "cloud-standard"} · {computeRouting?.creditsBalance ?? 480} cr
            </span>
          </button>
        </div>

        {/* 6-Tool Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTool(t.id)}
                className={`p-3 rounded-sm border text-left transition-colors ${
                  active
                    ? "border-[#E1392B] bg-[#E1392B]/[0.06] dark:bg-[#E1392B]/[0.12]"
                    : "border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] hover:border-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${active ? "text-[#E1392B]" : "text-slate-500"}`} />
                  <span className="font-display text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    {t.label}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {t.modelHint}
                </div>
              </button>
            );
          })}
        </div>

        {/* TOOL 1: GEMINI CHATBOT + GOOGLE SEARCH GROUNDING + WINDOWS PC LOCAL */}
        {activeTool === "chat" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                <Search className="w-4 h-4 text-[#E1392B]" />
                <span>Gemini Producer Chatbot · Live Google Search &amp; Tier Router</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="Select chat AI tier"
                  value={chatTier}
                  onChange={(e) => setChatTier(e.target.value as AiComputeTierId)}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="windows-pc-local">Windows PC Local ($0 API)</option>
                  <option value="cloud-budget">Budget Cloud (gemini-3.1-flash-lite)</option>
                  <option value="cloud-standard">Standard Cloud (gemini-4-hydrogen)</option>
                  <option value="cloud-flagship">Flagship Cloud (gemini-4-neon)</option>
                </select>

                <label className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGoogleSearch}
                    disabled={chatTier === "windows-pc-local"}
                    onChange={(e) => setUseGoogleSearch(e.target.checked)}
                    className="accent-[#E1392B]"
                  />
                  <span>Google Search Data</span>
                </label>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "What are the highest-RPM YouTube Shorts & TikTok niches right now based on live search data?",
                  "Give me 5 mid-roll sponsorship CTA scripts that convert above 4% without hurting watch hold.",
                  "Compare Cloudflare Pages + Supabase Free vs paid hosting at 500K monthly clip views.",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendChat(undefined, prompt)}
                    className="px-2.5 py-1.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] text-left text-[11px] text-slate-600 dark:text-slate-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {chatTurns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`p-3.5 rounded-sm border text-xs leading-relaxed space-y-2 ${
                      turn.role === "user"
                        ? "border-[#E1392B]/35 bg-[#E1392B]/[0.05] ml-8"
                        : "border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                        {turn.role === "user" ? "You" : "ClipForge AI"}
                      </span>
                      {turn.model && (
                        <span>
                          {turn.model}
                          {turn.usedSearch ? " · Google Search Grounded" : ""}
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-[#0F172A] dark:text-slate-200">
                      {turn.text}
                    </div>
                    {turn.sources && turn.sources.length > 0 && (
                      <div className="pt-2 border-t border-[#D9DEE7]/70 dark:border-[#222631] flex flex-wrap gap-2">
                        {turn.sources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{src.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    chatTier === "windows-pc-local"
                      ? `Ask your Windows PC (${computeRouting?.windowsPcModel || "gemma-4-2b-it"})...`
                      : "Ask Gemini anything (with live Google Search citations)..."
                  }
                  className="flex-1 h-10 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-xs"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="h-10 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {chatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </button>
              </form>
            </div>
          </section>
        )}

        {/* TOOL 2: REAL-TIME VOICE CONVERSATIONS (GEMINI 3.8 LIVE) */}
        {activeTool === "voice" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Real-Time Voice Conversation · Gemini 3.8 Live
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bidirectional 16kHz mic → 24kHz gapless voice streaming over WebSocket with live transcription &amp; instant barge-in interruption.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  aria-label="Live voice persona"
                  disabled={voiceConnected}
                  value={voiceProfile}
                  onChange={(e) => setVoiceProfile(e.target.value as VoiceProfileId)}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="Zephyr">Zephyr (Producer)</option>
                  <option value="Puck">Puck (Energetic)</option>
                  <option value="Kore">Kore (Clear Anchor)</option>
                  <option value="Charon">Charon (Deep Narrator)</option>
                  <option value="Fenrir">Fenrir (Hype Host)</option>
                </select>

                {!voiceConnected ? (
                  <button
                    type="button"
                    disabled={voiceConnecting}
                    onClick={startLiveVoiceSession}
                    className="h-8 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    {voiceConnecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                    <span>{voiceConnecting ? "Connecting..." : "Start Voice Session"}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setVoiceMuted((m) => !m)}
                      className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-medium inline-flex items-center gap-1.5"
                    >
                      {voiceMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-[#E1392B]" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{voiceMuted ? "Muted" : "Mic Live"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopLiveVoiceSession}
                      className="h-8 px-3 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>End Call</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      voiceConnected ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="font-mono">
                    {voiceConnected
                      ? `LIVE AUDIO ACTIVE · ${voiceProfile} · Speak naturally or interrupt anytime`
                      : "Session idle · Click Start Voice Session to talk live with Gemini 3.8 Live"}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">16kHz IN / 24kHz OUT</span>
              </div>

              <div className="min-h-48 max-h-72 overflow-y-auto space-y-2 p-3 rounded-sm border border-[#D9DEE7] dark:border-[#222631]">
                {voiceTranscripts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">
                    Live spoken transcripts from both you and Gemini will stream here in real time.
                  </p>
                ) : (
                  voiceTranscripts.map((t) => (
                    <div
                      key={t.id}
                      className={`text-xs p-2.5 rounded-sm ${
                        t.speaker === "you"
                          ? "bg-[#E1392B]/10 text-[#0F172A] dark:text-slate-100"
                          : "bg-slate-100 dark:bg-[#171A21] text-[#0F172A] dark:text-slate-200"
                      }`}
                    >
                      <span className="font-mono text-[10px] font-bold uppercase mr-2 text-[#E1392B]">
                        {t.speaker === "you" ? "You" : voiceProfile}
                      </span>
                      <span>{t.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendLiveVoiceTextCue} className="flex gap-2">
                <input
                  type="text"
                  disabled={!voiceConnected}
                  value={voiceTextCue}
                  onChange={(e) => setVoiceTextCue(e.target.value)}
                  placeholder="Optional: send a text cue into the active live voice conversation..."
                  className="flex-1 h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] text-xs disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!voiceConnected || !voiceTextCue.trim()}
                  className="h-9 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] disabled:opacity-40 text-white dark:text-[#0F172A] text-xs font-semibold"
                >
                  Send Cue
                </button>
              </form>
            </div>
          </section>
        )}

        {/* TOOL 3: CREATE & EDIT IMAGES */}
        {activeTool === "image" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Create &amp; Edit Images · Gemini Image + $0 Local Canvas Cover Studio
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate fresh covers or upload an image to edit with natural language, or render instant $0 PNG thumbnails locally.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <select
                  aria-label="Aspect ratio"
                  value={imageAspect}
                  onChange={(e) => setImageAspect(e.target.value as typeof imageAspect)}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="9:16">9:16 Shorts</option>
                  <option value="16:9">16:9 YouTube</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:5">4:5 Feed</option>
                </select>
                <select
                  aria-label="Image model tier"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(e.target.value as "fast" | "pro")}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="fast">Fast (gemini-3.1-flash-lite-image)</option>
                  <option value="pro">Pro 2K (gemini-nano-banana-2.1)</option>
                </select>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-4 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {editSourceImage ? "Edit Instruction (Image-to-Image)" : "Image Creation Prompt"}
                  </span>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] cursor-pointer inline-flex items-center gap-1.5 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{editSourceImage ? "Change Reference Image" : "Upload Image to Edit"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFileAsDataUrl(e.target.files?.[0], (dataUrl, mime) =>
                          setEditSourceImage({ dataUrl, mime })
                        )
                      }
                    />
                  </label>
                  {editSourceImage && (
                    <button
                      type="button"
                      onClick={() => setEditSourceImage(null)}
                      className="h-8 px-2.5 text-slate-500 hover:text-[#E1392B]"
                    >
                      Clear Upload
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={imageLoading}
                    onClick={handleGenerateOrEditImage}
                    className="h-8 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    {imageLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>{editSourceImage ? "Edit with Gemini" : "Generate with Gemini"}</span>
                  </button>
                </div>

                {/* Free $0 Local Canvas Cover Studio */}
                <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                      <span>$0 Browser Canvas Cover Designer (Works Offline / Free Tier)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={canvasHookTitle}
                      onChange={(e) => setCanvasHookTitle(e.target.value)}
                      placeholder="Headline text..."
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                    />
                    <input
                      type="text"
                      value={canvasSubTitle}
                      onChange={(e) => setCanvasSubTitle(e.target.value)}
                      placeholder="Subtitle..."
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRenderFreeCanvasCover}
                    className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                  >
                    Render $0 PNG Cover Instantly
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#0D0F14] min-h-72 gap-3">
                {generatedImageUrl ? (
                  <>
                    <img
                      src={generatedImageUrl}
                      alt="Generated Studio Output"
                      className="max-h-96 rounded-sm border border-[#252A36] object-contain"
                    />
                    {imageCaptionText && (
                      <p className="text-[11px] font-mono text-slate-400 text-center">
                        {imageCaptionText}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <a
                        href={generatedImageUrl}
                        download={`clipforge-image-${Date.now()}.png`}
                        className="h-8 px-3 rounded-sm bg-[#E1392B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSourceImage({ dataUrl: generatedImageUrl, mime: "image/png" });
                          setActiveTool("video");
                          onNotify("success", "Sent image to Video & Animate tab!");
                        }}
                        className="h-8 px-3 rounded-sm border border-[#252A36] text-slate-200 hover:border-[#E1392B] text-xs font-medium"
                      >
                        Animate into Video →
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-mono text-slate-500">
                    Generated or edited PNG output will preview here.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TOOL 4: TEXT-TO-VIDEO & ANIMATE IMAGES INTO VIDEO */}
        {activeTool === "video" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Generate Video from Text &amp; Animate Images · Omni Flash + $0 Motion Engine
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Render AI text-to-video or animate any still image with gemini-omni-1.2-flash, or export real WebM Ken Burns motion locally for $0.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <select
                  aria-label="Video aspect ratio"
                  value={videoAspect}
                  onChange={(e) => setVideoAspect(e.target.value as "9:16" | "16:9")}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="9:16">9:16 Vertical</option>
                  <option value="16:9">16:9 Landscape</option>
                </select>
                <select
                  aria-label="Video duration"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value as "5s" | "8s" | "10s")}
                  className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                >
                  <option value="5s">5 seconds</option>
                  <option value="8s">8 seconds</option>
                  <option value="10s">10 seconds</option>
                </select>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-4 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {videoSourceImage ? "Motion Prompt (Animate Uploaded Image)" : "Text-to-Video Prompt"}
                  </span>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] cursor-pointer inline-flex items-center gap-1.5 font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{videoSourceImage ? "Replace Starting Frame" : "Upload Image to Animate"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFileAsDataUrl(e.target.files?.[0], (dataUrl, mime) =>
                          setVideoSourceImage({ dataUrl, mime })
                        )
                      }
                    />
                  </label>
                  {videoSourceImage && (
                    <button
                      type="button"
                      onClick={() => setVideoSourceImage(null)}
                      className="h-8 px-2 text-slate-500 hover:text-[#E1392B]"
                    >
                      Clear Frame
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={videoLoading}
                    onClick={handleGenerateCloudVideo}
                    className="h-8 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    {videoLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Film className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {videoSourceImage ? "Animate with Omni Flash" : "Generate Video (Omni Flash)"}
                    </span>
                  </button>
                </div>

                {/* Free $0 Local Browser Motion Animator */}
                <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] space-y-2.5">
                  <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                    <span>$0 Browser Motion Animator (Real WebM Export)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      aria-label="Free motion preset"
                      value={freeMotionStyle}
                      onChange={(e) => setFreeMotionStyle(e.target.value as typeof freeMotionStyle)}
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                    >
                      <option value="ken-burns-in">Ken Burns Push-In</option>
                      <option value="pan-right">Cinematic Pan Right</option>
                      <option value="pulse-zoom">Hook Pulse Zoom</option>
                    </select>
                    <input
                      type="text"
                      value={freeMotionCaption}
                      onChange={(e) => setFreeMotionCaption(e.target.value)}
                      placeholder="Lower banner text..."
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={videoLoading}
                    onClick={handleAnimateImageFreeBrowser}
                    className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] disabled:opacity-50 text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5"
                  >
                    {videoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Animate Locally ($0 WebM)</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#0D0F14] min-h-72 gap-3">
                {generatedVideoUrl ? (
                  <>
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-96 rounded-sm border border-[#252A36]"
                    />
                    <a
                      href={generatedVideoUrl}
                      download={`clipforge-video-${Date.now()}.webm`}
                      className="h-8 px-3.5 rounded-sm bg-[#E1392B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </a>
                  </>
                ) : (
                  <p className="text-xs font-mono text-slate-500">
                    Generated MP4 / WebM video will preview here.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TOOL 5: TRANSCRIBE AUDIO (GEMINI 3.5 TRANSCRIBE) */}
        {activeTool === "transcribe" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Audio Transcription · Gemini 3.5 Transcribe
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload any MP3/WAV/WebM clip or record straight from your microphone, transcribe accurately, and push directly into a Studio clip.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="h-9 px-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] cursor-pointer inline-flex items-center gap-1.5 font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Audio File</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadFileAsDataUrl(e.target.files?.[0], (dataUrl, mime, name) =>
                        setTranscribeAudio({ dataUrl, mime: mime.split(";")[0], name })
                      )
                    }
                  />
                </label>

                {!isRecordingAudio ? (
                  <button
                    type="button"
                    onClick={handleStartMicRecord}
                    className="h-9 px-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] hover:border-[#E1392B] font-medium inline-flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#E1392B]" />
                    <span>Record Mic Clip</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopMicRecord}
                    className="h-9 px-3.5 rounded-sm bg-[#E1392B] text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!transcribeAudio || transcribeLoading}
                  onClick={handleTranscribeAudio}
                  className="h-9 px-4 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] disabled:opacity-40 text-white dark:text-[#0F172A] font-semibold inline-flex items-center gap-1.5"
                >
                  {transcribeLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{transcribeLoading ? "Transcribing..." : "Transcribe with Gemini"}</span>
                </button>
              </div>

              {transcribeAudio && (
                <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    Loaded: {transcribeAudio.name} ({transcribeAudio.mime})
                  </span>
                  <audio controls src={transcribeAudio.dataUrl} className="h-8" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    Transcript Output {transcriptWordCount > 0 ? `(${transcriptWordCount} words)` : ""}
                  </span>
                  {transcriptResult && clips.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Target studio clip"
                        value={targetClipId}
                        onChange={(e) => setTargetClipId(e.target.value)}
                        className="h-8 px-2 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                      >
                        {clips.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onApplyTranscriptToClip(targetClipId, transcriptResult)}
                        className="h-8 px-3 rounded-sm bg-[#E1392B] text-white font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Apply to Studio Clip</span>
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={transcriptResult}
                  onChange={(e) => setTranscriptResult(e.target.value)}
                  placeholder="Transcribed speech will appear here..."
                  className="w-full p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] font-mono text-xs"
                />
              </div>
            </div>
          </section>
        )}

        {/* TOOL 6: GENERATE MUSIC (LYRIA + $0 WEBAUDIO SYNTH) */}
        {activeTool === "music" && (
          <section className="rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/65 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#E1392B]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Music Studio · Lyria 3 Cloud + $0 WebAudio Beat Synthesizer
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compose original short-form soundtracks via Lyria 3 (text or image-inspired), or synthesize downloadable royalty-free WAV loops locally at $0.
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={musicFullTrack}
                  onChange={(e) => setMusicFullTrack(e.target.checked)}
                  className="accent-[#E1392B]"
                />
                <span>Full-Length Track (lyria-3-pro-preview)</span>
              </label>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              <div className="lg:col-span-6 space-y-4">
                <label className="block space-y-1">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    Lyria Music Prompt
                  </span>
                  <textarea
                    rows={3}
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="h-8 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] hover:border-[#E1392B] cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{musicRefImage ? "Mood Image Attached" : "Optional Mood Image"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFileAsDataUrl(e.target.files?.[0], (dataUrl, mime) =>
                          setMusicRefImage({ dataUrl, mime })
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={musicLoading}
                    onClick={handleGenerateLyriaMusic}
                    className="h-8 px-4 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
                  >
                    {musicLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Music className="w-3.5 h-3.5" />
                    )}
                    <span>Generate with Lyria</span>
                  </button>
                </div>

                {/* Free $0 WebAudio Beat Synthesizer */}
                <div className="p-3.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] space-y-2.5">
                  <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                    <span>$0 WebAudio Beat Loop Generator (Instant Royalty-Free WAV)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="Free beat style"
                      value={freeBeatStyle}
                      onChange={(e) => setFreeBeatStyle(e.target.value as typeof freeBeatStyle)}
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                    >
                      <option value="tech-pulse">Tech Documentary Pulse</option>
                      <option value="phonk">Phonk Drift Bass</option>
                      <option value="lofi">Lo-Fi Study Groove</option>
                      <option value="suspense">Suspense Crime Riser</option>
                    </select>
                    <input
                      type="number"
                      min={70}
                      max={165}
                      value={freeBeatBpm}
                      onChange={(e) => setFreeBeatBpm(Number(e.target.value) || 120)}
                      className="h-8 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21] font-mono tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSynthesizeFreeBeat}
                    className="h-8 px-3.5 rounded-sm bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] font-semibold"
                  >
                    Synthesize $0 WAV Track Now
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 p-5 rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-[#0D0F14] flex flex-col justify-center items-center gap-4 min-h-64">
                {generatedMusicUrl ? (
                  <>
                    <audio controls src={generatedMusicUrl} className="w-full" />
                    {generatedLyrics && (
                      <pre className="w-full p-3 rounded-sm bg-[#141720] border border-[#252A36] text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {generatedLyrics}
                      </pre>
                    )}
                    <a
                      href={generatedMusicUrl}
                      download={`clipforge-music-${Date.now()}.wav`}
                      className="h-8 px-3.5 rounded-sm bg-[#E1392B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download WAV Track</span>
                    </a>
                  </>
                ) : (
                  <p className="text-xs font-mono text-slate-500">
                    Generated Lyria or $0 WebAudio WAV soundtrack will load here.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
