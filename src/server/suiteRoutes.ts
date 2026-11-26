import crypto from "node:crypto";
import fs from "node:fs";
import type { Server as HttpServer } from "node:http";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { GoogleGenAI, Modality, Type, type LiveServerMessage } from "@google/genai";
import { WebSocketServer, type WebSocket } from "ws";
import type {
  AiComputeRoutingConfig,
  AiComputeTierId,
  AiCreditLedgerEntry,
  AuthUser,
  ContentNiche,
  CtaPlacementType,
  FunnelTestSnapshot,
  FunnelTestVariant,
  HostingStageId,
  MonetizationPlan,
  OpportunityDiscoverySnapshot,
  OpportunityGapFreshness,
  OpportunityGapTopic,
  ResearchOpportunity,
  RevenueGrowthAlert,
  TrendPulseSource,
  VoiceProfileId,
  WorkspaceState,
} from "../types";

export interface SuiteRouteDeps {
  dataDir: string;
  pipelineConfigFile: string;
  getAiClient: (apiVersion?: string) => GoogleGenAI | null;
  readWorkspace: () => WorkspaceState;
  saveWorkspace: (state: WorkspaceState) => void;
  pushTelemetry: (
    state: WorkspaceState,
    entry: {
      category: "gitops" | "gemini" | "local-llm";
      endpoint: string;
      latencyMs: number;
      success: boolean;
      model?: string;
    }
  ) => void;
  formatApiError: (err: unknown, fallback: string) => string;
}

interface StoredUserRecord {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "creator";
  planTier: "free-starter" | "pro-growth" | "agency-scale";
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ALLOWED_IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const ALLOWED_AUDIO_MIMES = new Set([
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
]);

const VALID_PLACEMENTS = new Set<CtaPlacementType>([
  "pre-roll-hook-banner",
  "mid-roll-verbal-lower-third",
  "pinned-comment-bio",
  "end-card-offer-slate",
  "split-screen-callout",
]);

const VALID_NICHES = new Set<ContentNiche>([
  "gaming",
  "podcasts",
  "tech-ai",
  "finance",
  "sports-irl",
  "faceless-doc",
]);

const VALID_TIERS = new Set<AiComputeTierId>([
  "manual-free",
  "windows-pc-local",
  "cloud-budget",
  "cloud-standard",
  "cloud-flagship",
]);

const VALID_HOSTING_STAGES = new Set<HostingStageId>([
  "stage-1-free",
  "stage-2-starter",
  "stage-3-growth",
  "stage-4-scale",
]);

const NICHE_LABELS: Record<ContentNiche, string> = {
  gaming: "Gaming",
  podcasts: "Podcasts",
  "tech-ai": "AI & Tech",
  finance: "Finance",
  "sports-irl": "Sports & IRL",
  "faceless-doc": "Faceless Doc",
};

function signAuthToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS }),
    "utf8"
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAuthToken(token: string): { uid: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
    };
    if (!decoded.uid || !decoded.exp || Date.now() > decoded.exp) return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return { salt: actualSalt, hash: derived };
}

function toPublicUser(rec: StoredUserRecord): AuthUser {
  return {
    id: rec.id,
    email: rec.email,
    displayName: rec.displayName,
    role: rec.role,
    planTier: rec.planTier,
    createdAt: rec.createdAt,
  };
}

function isSupabaseConfigured(): boolean {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return Boolean(url.startsWith("https://") && key.length > 12);
}

export function buildSeedFunnelTest(): FunnelTestSnapshot {
  const variants: FunnelTestVariant[] = [
    {
      id: "fun_midroll_lower",
      label: "Variant A · Mid-Roll Verbal + Lower-Third (14s)",
      placement: "mid-roll-verbal-lower-third",
      triggerSecond: 14,
      ctaCopy: "Use code FORGE20 in bio — live demo link pinned",
      sponsorBrand: "Raycast Pro / NordVPN",
      niche: "tech-ai",
      sampleClips: 18,
      impressions: 342000,
      ctaClicks: 11970,
      ctrPct: 3.5,
      sponsorConversions: 547,
      conversionRatePct: 4.57,
      retentionImpactPct: -1.4,
      revenuePer1kUsd: 16.4,
      estMonthlyLiftUsd: 1480,
      isWinner: true,
    },
    {
      id: "fun_pinned_bio",
      label: "Variant B · Pinned Comment + Bio Trigger",
      placement: "pinned-comment-bio",
      triggerSecond: 24,
      ctaCopy: "Comment 'WORKFLOW' and check the pinned sponsor kit",
      sponsorBrand: "Linear / Vercel",
      niche: "tech-ai",
      sampleClips: 22,
      impressions: 418000,
      ctaClicks: 10868,
      ctrPct: 2.6,
      sponsorConversions: 381,
      conversionRatePct: 3.51,
      retentionImpactPct: 1.8,
      revenuePer1kUsd: 11.2,
      estMonthlyLiftUsd: 890,
      isWinner: false,
    },
    {
      id: "fun_split_callout",
      label: "Variant C · Split-Screen Product Proof Callout (9s)",
      placement: "split-screen-callout",
      triggerSecond: 9,
      ctaCopy: "Watch the 4-second benchmark — claim 30% off below",
      sponsorBrand: "TradingView / Koyfin",
      niche: "finance",
      sampleClips: 14,
      impressions: 215000,
      ctaClicks: 7955,
      ctrPct: 3.7,
      sponsorConversions: 318,
      conversionRatePct: 4.0,
      retentionImpactPct: -2.8,
      revenuePer1kUsd: 14.9,
      estMonthlyLiftUsd: 1210,
      isWinner: false,
    },
    {
      id: "fun_endcard_slate",
      label: "Variant D · End-Card QR / Offer Slate (Final 3s)",
      placement: "end-card-offer-slate",
      triggerSecond: 42,
      ctaCopy: "Scan or tap link in description before Friday",
      sponsorBrand: "Opera GX / SteelSeries",
      niche: "gaming",
      sampleClips: 26,
      impressions: 510000,
      ctaClicks: 6630,
      ctrPct: 1.3,
      sponsorConversions: 166,
      conversionRatePct: 2.5,
      retentionImpactPct: -6.2,
      revenuePer1kUsd: 4.85,
      estMonthlyLiftUsd: 310,
      isWinner: false,
    },
    {
      id: "fun_preroll_banner",
      label: "Variant E · Pre-Roll Hook Banner (0–3s)",
      placement: "pre-roll-hook-banner",
      triggerSecond: 1,
      ctaCopy: "Sponsored by ClipStack — link in bio",
      sponsorBrand: "Cloud GPU Partner",
      niche: "faceless-doc",
      sampleClips: 12,
      impressions: 194000,
      ctaClicks: 4656,
      ctrPct: 2.4,
      sponsorConversions: 102,
      conversionRatePct: 2.19,
      retentionImpactPct: -9.4,
      revenuePer1kUsd: 6.1,
      estMonthlyLiftUsd: 240,
      isWinner: false,
    },
  ];

  return {
    id: "funnel_seed_v1",
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    analyzedByModel: "gemini-4-hydrogen",
    winnerVariantId: "fun_midroll_lower",
    winnerLabel: "Mid-Roll Verbal + Lower-Third (14s)",
    conversionLiftPct: 30.2,
    executiveSummary:
      "Triggering a natural 3-second verbal bridge + subtle lower-third sponsor badge at second 14 (right after the hook payoff) achieved 4.57% sponsor conversion rate (+30.2% vs. pinned-comment baseline) while losing only 1.4% watch-hold.",
    keyInsights: [
      "Pre-roll sponsor banners (0–3s) caused a -9.4% early swipe-away penalty and lowest conversion efficiency.",
      "Mid-roll placement at 12–16s captures viewers already committed past the 3-second curiosity gate.",
      "Pairing mid-roll verbal CTAs with a pinned comment mirror lifts total affiliate + sponsor RPM above $16/1K views.",
    ],
    recommendedCtaCopy: "Use code FORGE20 in bio — live demo link pinned",
    recommendedPlacement: "mid-roll-verbal-lower-third",
    variants,
  };
}

export function buildSeedRevenueAlerts(): RevenueGrowthAlert[] {
  const now = new Date();
  return [
    {
      id: "rga_finance_surge",
      detectedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      targetType: "niche",
      niche: "finance",
      label: "Finance & Quant Clips",
      editingStyle: "hud-zoom + broadcast-lower captions",
      baselineRoiPer1kUsd: 11.4,
      projectedRoiPer1kUsd: 14.23,
      roiIncreasePct: 24.8,
      projectedMonthlyDeltaUsd: 1640,
      driverSummary:
        "Brokerage & fintech Q4 CPA rates jumped while Finance watch-hold held at 81%+, lifting combined ad + sponsor ROI per 1K views by +24.8% above 30-day baseline.",
      directorSuggestion:
        "Shift AI Director priority to Finance & Quant clips (2 daily slots), enforce hud-zoom template with mid-roll sponsor CTA at 14s, and lock -14 LUFS loudness.",
      status: "active",
    },
    {
      id: "rga_tech_ai_surge",
      detectedAt: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
      targetType: "niche",
      niche: "tech-ai",
      label: "AI & Tech Tool Demos",
      editingStyle: "split-stack + kinetic-highlight captions",
      baselineRoiPer1kUsd: 9.8,
      projectedRoiPer1kUsd: 11.62,
      roiIncreasePct: 18.6,
      projectedMonthlyDeltaUsd: 1190,
      driverSummary:
        "SaaS developer tool sponsorships + 84% average watch retention pushed AI & Tech ROI +18.6% past the 15% surge threshold.",
      directorSuggestion:
        "Boost AI & Tech Breaking Clips ingest weight, generate 3 hook variants per tool launch, and cross-syndicate to LinkedIn Video & X Video.",
      status: "active",
    },
  ];
}

export function buildSeedComputeRouting(): AiComputeRoutingConfig {
  const now = Date.now();
  return {
    activeTier: "cloud-standard",
    hostingStage: "stage-1-free",
    creditsBalance: 480,
    creditsMonthlyAllowance: 500,
    monthlyBudgetCapUsd: 25,
    estMonthSpendUsd: 0.42,
    autoDowngradeOnBudgetCap: true,
    windowsPcEndpoint: "http://localhost:1234/v1",
    windowsPcModel: "gemma-4-2b-it",
    supabaseConfigured: isSupabaseConfigured(),
    ledger: [
      {
        id: "led_seed_1",
        timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
        tier: "cloud-standard",
        feature: "A/B Test Analysis",
        model: "gemini-4-hydrogen",
        creditsUsed: 4,
        estUsdCost: 0.004,
        status: "success",
      },
      {
        id: "led_seed_2",
        timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
        tier: "cloud-budget",
        feature: "SEO & Hashtag Batch",
        model: "gemini-3.1-flash-lite",
        creditsUsed: 1,
        estUsdCost: 0.0008,
        status: "success",
      },
      {
        id: "led_seed_3",
        timestamp: new Date(now - 3 * 3600 * 1000).toISOString(),
        tier: "windows-pc-local",
        feature: "Caption Cleanup (Local PC)",
        model: "gemma-4-2b-it",
        creditsUsed: 0,
        estUsdCost: 0,
        status: "success",
      },
    ],
  };
}

export function recordCreditUsage(
  state: WorkspaceState,
  entry: Omit<AiCreditLedgerEntry, "id" | "timestamp">
): void {
  if (!state.computeRouting) {
    state.computeRouting = buildSeedComputeRouting();
  }
  const cr = state.computeRouting;
  cr.creditsBalance = Math.max(0, Number((cr.creditsBalance - entry.creditsUsed).toFixed(2)));
  cr.estMonthSpendUsd = Number((cr.estMonthSpendUsd + entry.estUsdCost).toFixed(4));
  cr.ledger = [
    {
      id: `led_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...(cr.ledger || []),
  ].slice(0, 60);

  if (cr.autoDowngradeOnBudgetCap && cr.estMonthSpendUsd >= cr.monthlyBudgetCapUsd) {
    cr.activeTier = "windows-pc-local";
  }
}

function getPreferredTextModel(state: WorkspaceState, overrideTier?: AiComputeTierId): {
  tier: AiComputeTierId;
  model: string;
  credits: number;
  estUsd: number;
} {
  const tier = overrideTier || state.computeRouting?.activeTier || "cloud-standard";
  if (tier === "cloud-budget") {
    return { tier, model: "gemini-3.1-flash-lite", credits: 1, estUsd: 0.0008 };
  }
  if (tier === "cloud-flagship") {
    return { tier, model: "gemini-4-neon", credits: 8, estUsd: 0.014 };
  }
  return { tier: "cloud-standard", model: "gemini-4-hydrogen", credits: 3, estUsd: 0.0035 };
}

function extractGroundingSources(response: unknown): {
  sources: TrendPulseSource[];
  searchQueries: string[];
} {
  const r = response as {
    candidates?: Array<{
      groundingMetadata?: {
        webSearchQueries?: string[];
        groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
      };
    }>;
  };
  const meta = r?.candidates?.[0]?.groundingMetadata;
  const seen = new Set<string>();
  const sources: TrendPulseSource[] = [];
  for (const chunk of meta?.groundingChunks || []) {
    const uri = chunk?.web?.uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({
        title: chunk?.web?.title || new URL(uri).hostname,
        uri,
      });
    }
  }
  const searchQueries = Array.isArray(meta?.webSearchQueries)
    ? meta.webSearchQueries.filter((q): q is string => typeof q === "string")
    : [];
  return { sources: sources.slice(0, 8), searchQueries };
}

function buildHostingBlueprints() {
  const supabaseSchemaSql = `-- ClipForge Supabase PostgreSQL Schema & Row-Level Security (Free Tier Ready)
-- Run in Supabase SQL Editor or via: supabase db push

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  plan_tier text not null default 'free-starter',
  credits_balance numeric(10,2) not null default 500,
  monthly_budget_cap_usd numeric(10,2) not null default 25,
  active_ai_tier text not null default 'cloud-standard',
  created_at timestamptz not null default now()
);

create table if not exists public.clips (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  niche text not null default 'tech-ai',
  source_platform text not null,
  qa_status text not null default 'pending',
  publish_status text not null default 'draft',
  clip_health_score integer default 82,
  layout_json jsonb not null default '{}'::jsonb,
  metrics_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funnel_cta_tests (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  placement text not null,
  trigger_second integer not null default 14,
  cta_copy text not null,
  sponsor_brand text not null,
  impressions integer not null default 0,
  cta_clicks integer not null default 0,
  sponsor_conversions integer not null default 0,
  revenue_per_1k_usd numeric(10,2) not null default 0,
  is_winner boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_growth_alerts (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  niche text,
  label text not null,
  baseline_roi_per_1k numeric(10,2) not null,
  projected_roi_per_1k numeric(10,2) not null,
  roi_increase_pct numeric(6,2) not null,
  status text not null default 'active',
  detected_at timestamptz not null default now()
);

create table if not exists public.ai_credit_ledger (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null,
  feature text not null,
  model text not null,
  credits_used numeric(10,2) not null default 0,
  est_usd_cost numeric(10,5) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.clips enable row level security;
alter table public.funnel_cta_tests enable row level security;
alter table public.revenue_growth_alerts enable row level security;
alter table public.ai_credit_ledger enable row level security;

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage own clips" on public.clips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own funnel tests" on public.funnel_cta_tests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own revenue alerts" on public.revenue_growth_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users view own credit ledger" on public.ai_credit_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;

  const wranglerToml = `# Cloudflare Pages + Workers + R2 Zero-Egress Config (Free -> Scale)
name = "clipforge-studio"
compatibility_date = "2026-01-15"
pages_build_output_dir = "dist"

[vars]
NODE_VERSION = "22"
CLIPFORGE_HOSTING_STAGE = "stage-1-free"

# Stage 2+: Uncomment after creating an R2 bucket (10GB free, $0 egress)
# [[r2_buckets]]
# binding = "CLIP_MEDIA_BUCKET"
# bucket_name = "clipforge-renders"

# Stage 3+: Uncomment for Cloudflare Queues background clip dispatch
# [[queues.producers]]
# binding = "CLIP_DISPATCH_QUEUE"
# queue = "clipforge-dispatch"
`;

  const githubWorkflowYml = `# GitHub Actions -> Cloudflare Pages CI/CD + Free Cron Research
name: ClipForge Deploy & Free Automation

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 */6 * * *" # Free 2,000 min/mo GitHub Actions tier
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages (Free Tier)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=clipforge-studio
`;

  const windowsLocalPs1 = `# ClipForge Windows PC Local AI Setup (Zero API Cost)
# Installs Ollama + pulls fast local models + enables CORS for browser-direct ClipForge access

Write-Host "=== ClipForge Windows PC Local AI Bootstrap ===" -ForegroundColor Cyan

# 1. Allow browser-direct connections from ClipForge (localhost & Cloudflare Pages)
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "127.0.0.1:11434", "User")

# 2. Check Ollama or install via winget
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Ollama via winget..." -ForegroundColor Yellow
  winget install -e --id Ollama.Ollama
}

# 3. Pull compact high-speed models for scripts, hooks, SEO & captions
Write-Host "Pulling Gemma 3 / Qwen 2.5 compact models..." -ForegroundColor Green
ollama pull gemma3:4b
ollama pull qwen2.5:3b

Write-Host ""
Write-Host "Ready! In ClipForge -> AI Agent -> Compute & Hosting:" -ForegroundColor Green
Write-Host "  Tier:     Windows PC Local LLM ($0 API)"
Write-Host "  Endpoint: http://localhost:11434/v1  (or http://localhost:1234/v1 for LM Studio)"
Write-Host "  Model:    gemma3:4b"
`;

  return {
    supabaseSchemaSql,
    wranglerToml,
    githubWorkflowYml,
    windowsLocalPs1,
  };
}

export function registerSuiteRoutes(app: Express, deps: SuiteRouteDeps): void {
  const usersFile = path.join(deps.dataDir, "users.json");

  function readUsers(): StoredUserRecord[] {
    if (!fs.existsSync(usersFile)) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(usersFile, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users: StoredUserRecord[]): void {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }

  function getAuthUserFromRequest(req: Request): StoredUserRecord | null {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;
    const token = header.slice(7).trim();
    const verified = verifyAuthToken(token);
    if (!verified) return null;
    return readUsers().find((u) => u.id === verified.uid) || null;
  }

  // =========================================================================
  // 1. ACCOUNT & WORKSPACE AUTH (scrypt + in-memory Bearer token + Supabase ready)
  // =========================================================================
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = getAuthUserFromRequest(req);
    res.json({
      user: user ? toPublicUser(user) : null,
      supabaseConfigured: isSupabaseConfigured(),
      persistenceMode: isSupabaseConfigured() ? "supabase-postgres" : "server-local-store",
    });
  });

  app.post("/api/auth/register", (req: Request, res: Response) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || "").trim() || email.split("@")[0] || "Creator";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      res.status(409).json({ error: "An account with that email already exists. Please sign in." });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const newUser: StoredUserRecord = {
      id: `usr_${crypto.randomUUID()}`,
      email,
      displayName: displayName.slice(0, 60),
      role: users.length === 0 ? "owner" : "creator",
      planTier: "free-starter",
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = signAuthToken(newUser.id);
    res.status(201).json({
      token,
      user: toPublicUser(newUser),
      supabaseConfigured: isSupabaseConfigured(),
    });
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    const users = readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const { hash } = hashPassword(password, user.salt);
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(user.passwordHash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = signAuthToken(user.id);
    res.json({
      token,
      user: toPublicUser(user),
      supabaseConfigured: isSupabaseConfigured(),
    });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // =========================================================================
  // 2. A/B FUNNEL TEST (CTA PLACEMENTS VS SPONSORSHIP CONVERSION RATES)
  // =========================================================================
  app.post("/api/monetization/funnel-tests/variant", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const plan = state.monetizationPlan as MonetizationPlan;
    const current: FunnelTestSnapshot = plan.funnelTest || buildSeedFunnelTest();

    const label = String(req.body?.label || "").trim();
    const placement = VALID_PLACEMENTS.has(req.body?.placement)
      ? (req.body.placement as CtaPlacementType)
      : "mid-roll-verbal-lower-third";
    const niche = VALID_NICHES.has(req.body?.niche) ? (req.body.niche as ContentNiche) : "tech-ai";
    const ctaCopy = String(req.body?.ctaCopy || "Use code FORGE20 in bio").trim().slice(0, 140);
    const sponsorBrand = String(req.body?.sponsorBrand || "Direct Sponsor").trim().slice(0, 80);
    const triggerSecond = Math.max(0, Math.min(58, Math.round(Number(req.body?.triggerSecond) || 14)));
    const sampleClips = Math.max(1, Math.min(500, Math.round(Number(req.body?.sampleClips) || 10)));
    const impressions = Math.max(1000, Math.round(Number(req.body?.impressions) || 120000));
    const ctrPct = Math.max(0.2, Math.min(18, Number((Number(req.body?.ctrPct) || 2.8).toFixed(2))));
    const conversionRatePct = Math.max(
      0.2,
      Math.min(25, Number((Number(req.body?.conversionRatePct) || 3.4).toFixed(2)))
    );
    const retentionImpactPct = Math.max(
      -20,
      Math.min(10, Number((Number(req.body?.retentionImpactPct) || -1.5).toFixed(1)))
    );
    const avgDealValueUsd = Math.max(5, Math.min(500, Number(req.body?.avgDealValueUsd) || 45));

    if (!label) {
      res.status(400).json({ error: "Variant label is required." });
      return;
    }

    const ctaClicks = Math.max(1, Math.round((impressions * ctrPct) / 100));
    const sponsorConversions = Math.max(1, Math.round((ctaClicks * conversionRatePct) / 100));
    const totalRev = sponsorConversions * avgDealValueUsd;
    const revenuePer1kUsd = Number(((totalRev / impressions) * 1000).toFixed(2));
    const estMonthlyLiftUsd = Math.round(totalRev * 0.45);

    const nextVariant: FunnelTestVariant = {
      id: `fun_${Date.now().toString(36)}`,
      label: label.slice(0, 90),
      placement,
      triggerSecond,
      ctaCopy,
      sponsorBrand,
      niche,
      sampleClips,
      impressions,
      ctaClicks,
      ctrPct,
      sponsorConversions,
      conversionRatePct,
      retentionImpactPct,
      revenuePer1kUsd,
      estMonthlyLiftUsd,
      isWinner: false,
    };

    const nextVariants = [nextVariant, ...current.variants];
    const sorted = [...nextVariants].sort((a, b) => b.revenuePer1kUsd - a.revenuePer1kUsd);
    const winner = sorted[0];
    nextVariants.forEach((v) => {
      v.isWinner = v.id === winner.id;
    });

    plan.funnelTest = {
      ...current,
      updatedAt: new Date().toISOString(),
      winnerVariantId: winner.id,
      winnerLabel: winner.label,
      recommendedCtaCopy: winner.ctaCopy,
      recommendedPlacement: winner.placement,
      variants: nextVariants,
    };

    deps.saveWorkspace(state);
    res.json({ monetizationPlan: plan, funnelTest: plan.funnelTest });
  });

  app.post("/api/ai/monetization/funnel-analyze", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const plan = state.monetizationPlan as MonetizationPlan;
    const current: FunnelTestSnapshot = plan.funnelTest || buildSeedFunnelTest();
    const focusSponsor = String(req.body?.focusSponsor || "").trim();
    const ai = deps.getAiClient();

    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Add it in Settings > Secrets to run Gemini Funnel Analysis.",
      });
      return;
    }

    const { tier, model, credits, estUsd } = getPreferredTextModel(state);

    try {
      const prompt = `You are a Creator Sponsorship Conversion & Short-Form Funnel Optimizer.
Analyze these Call-to-Action (CTA) placement experiments inside short-form clips and evaluate their direct impact on sponsorship conversion rates, click-through rate (CTR), viewer retention impact, and revenue per 1,000 views.

Current CTA Placement Variants:
${JSON.stringify(current.variants, null, 2)}

${focusSponsor ? `Sponsor / Offer Context: ${focusSponsor}` : ""}

Select the strongest winner balancing sponsorship conversion rate AND low retention penalty. Provide concrete, tactical insights and the exact winning CTA copy to bake into clips. Return strict JSON.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              winnerVariantId: { type: Type.STRING },
              winnerLabel: { type: Type.STRING },
              conversionLiftPct: { type: Type.NUMBER },
              executiveSummary: { type: Type.STRING },
              recommendedCtaCopy: { type: Type.STRING },
              recommendedPlacement: { type: Type.STRING },
              keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              "winnerVariantId",
              "winnerLabel",
              "conversionLiftPct",
              "executiveSummary",
              "recommendedCtaCopy",
              "keyInsights",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || "{}").trim()) as Partial<FunnelTestSnapshot>;
      const winner =
        current.variants.find((v) => v.id === parsed.winnerVariantId) ||
        [...current.variants].sort(
          (a, b) =>
            b.conversionRatePct * b.revenuePer1kUsd - a.conversionRatePct * a.revenuePer1kUsd
        )[0];

      const updatedVariants = current.variants.map((v) => ({
        ...v,
        isWinner: v.id === winner.id,
      }));

      const nextFunnel: FunnelTestSnapshot = {
        ...current,
        id: `funnel_${Date.now().toString(36)}`,
        updatedAt: new Date().toISOString(),
        analyzedByModel: model,
        winnerVariantId: winner.id,
        winnerLabel: String(parsed.winnerLabel || winner.label).trim(),
        conversionLiftPct: Number(
          Math.max(1, Math.min(250, Number(parsed.conversionLiftPct) || 28.5)).toFixed(1)
        ),
        executiveSummary: String(
          parsed.executiveSummary ||
            `${winner.label} produced the highest sponsorship conversion efficiency (${winner.conversionRatePct}%) at $${winner.revenuePer1kUsd}/1K.`
        ).trim(),
        keyInsights:
          Array.isArray(parsed.keyInsights) && parsed.keyInsights.length > 0
            ? parsed.keyInsights.map((s) => String(s).trim()).filter(Boolean).slice(0, 4)
            : current.keyInsights,
        recommendedCtaCopy: String(parsed.recommendedCtaCopy || winner.ctaCopy).trim(),
        recommendedPlacement: VALID_PLACEMENTS.has(parsed.recommendedPlacement as CtaPlacementType)
          ? (parsed.recommendedPlacement as CtaPlacementType)
          : winner.placement,
        variants: updatedVariants,
      };

      plan.funnelTest = nextFunnel;
      recordCreditUsage(state, {
        tier,
        feature: "A/B Funnel CTA Analysis",
        model,
        creditsUsed: credits,
        estUsdCost: estUsd,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/monetization/funnel-analyze",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);
      res.json({ monetizationPlan: plan, funnelTest: nextFunnel, computeRouting: state.computeRouting });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/monetization/funnel-analyze",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: deps.formatApiError(err, "Gemini A/B Funnel analysis failed.") });
    }
  });

  app.post("/api/monetization/funnel-tests/apply-winner", (_req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const plan = state.monetizationPlan as MonetizationPlan;
    const funnel = plan.funnelTest || buildSeedFunnelTest();

    const winningCta = funnel.recommendedCtaCopy || "Use code FORGE20 in bio";
    state.config.brandKit.endCardCta = winningCta;
    state.clips = state.clips.map((c) => ({
      ...c,
      layout: {
        ...c.layout,
        endCardCta: winningCta,
      },
    }));

    funnel.appliedToPipelineAt = new Date().toISOString();
    plan.funnelTest = funnel;
    deps.saveWorkspace(state);
    try {
      fs.writeFileSync(deps.pipelineConfigFile, JSON.stringify(state.config, null, 2));
    } catch {
      // Ignore if pipeline.config.json is read-only
    }

    res.json({
      config: state.config,
      clips: state.clips,
      monetizationPlan: plan,
      summary: `Applied winning CTA placement (${funnel.winnerLabel}) to Brand Kit and ${state.clips.length} studio clips.`,
    });
  });

  // =========================================================================
  // 3. REVENUE GROWTH ALERTS (>= +15% PROJECTED ROI SURGE NOTIFICATIONS)
  // =========================================================================
  app.post("/api/performance/revenue-alerts/scan", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const sponsorConvRatePct = Math.max(0.2, Math.min(15, Number(req.body?.sponsorConvRatePct) || 1.8));
    const sponsorAvgOrderUsd = Math.max(5, Math.min(500, Number(req.body?.sponsorAvgOrderUsd) || 48));

    const baselineByNiche: Record<ContentNiche, { baseRoi1k: number; style: string; rpm: number; affinity: number }> = {
      finance: { baseRoi1k: 11.4, style: "hud-zoom + broadcast-lower", rpm: 4.4, affinity: 2.65 },
      "tech-ai": { baseRoi1k: 9.8, style: "split-stack + kinetic-highlight", rpm: 3.6, affinity: 2.35 },
      "faceless-doc": { baseRoi1k: 7.4, style: "blurred-backdrop + bold-clean", rpm: 2.85, affinity: 1.55 },
      podcasts: { baseRoi1k: 7.9, style: "dual-cam + kinetic-highlight", rpm: 2.45, affinity: 1.85 },
      "sports-irl": { baseRoi1k: 4.9, style: "fullscreen-pip + arcade-pop", rpm: 1.45, affinity: 1.05 },
      gaming: { baseRoi1k: 3.6, style: "split-stack + comic-impact", rpm: 0.95, affinity: 0.72 },
    };

    const detected: RevenueGrowthAlert[] = [];
    const nowIso = new Date().toISOString();

    for (const niche of Object.keys(baselineByNiche) as ContentNiche[]) {
      const cfg = baselineByNiche[niche];
      const nicheClips = state.clips.filter((c) => c.niche === niche);
      const avgWatch =
        nicheClips.length > 0
          ? nicheClips.reduce((acc, c) => acc + (c.publishedMetrics?.avgWatchPercent || 80), 0) /
            nicheClips.length
          : 81;
      const engRate = niche === "tech-ai" ? 11.6 : niche === "finance" ? 10.4 : 9.8;
      const engagedPer1k = 1000 * (engRate / 100) * (avgWatch / 100);
      const convPer1k = (engagedPer1k * (sponsorConvRatePct / 100) * cfg.affinity) / 12;
      const sponsorRevPer1k = convPer1k * sponsorAvgOrderUsd;
      const projectedRoiPer1k = Number((cfg.rpm + sponsorRevPer1k).toFixed(2));
      const increasePct = Number(
        (((projectedRoiPer1k - cfg.baseRoi1k) / Math.max(0.5, cfg.baseRoi1k)) * 100).toFixed(1)
      );

      if (increasePct >= 15) {
        detected.push({
          id: `rga_${niche}_${Date.now().toString(36)}`,
          detectedAt: nowIso,
          targetType: "niche",
          niche,
          label: `${NICHE_LABELS[niche]} Niche Surge`,
          editingStyle: cfg.style,
          baselineRoiPer1kUsd: cfg.baseRoi1k,
          projectedRoiPer1kUsd: projectedRoiPer1k,
          roiIncreasePct: increasePct,
          projectedMonthlyDeltaUsd: Math.round((projectedRoiPer1k - cfg.baseRoi1k) * 320),
          driverSummary: `${NICHE_LABELS[niche]} projected ROI climbed from $${cfg.baseRoi1k.toFixed(2)} to $${projectedRoiPer1k.toFixed(2)} per 1K views (+${increasePct}%) at ${sponsorConvRatePct}% sponsor conversion.`,
          directorSuggestion: `Shift AI Director focus toward ${NICHE_LABELS[niche]} using ${cfg.style} layout and mid-roll sponsor CTA.`,
          status: "active",
        });
      }
    }

    // Optional live Gemini enrichment if API key is active
    const ai = deps.getAiClient();
    if (ai && detected.length > 0) {
      try {
        const { tier, model, credits, estUsd } = getPreferredTextModel(state);
        const topAlert = detected[0];
        const response = await ai.models.generateContent({
          model,
          contents: `Short-form creator analytics alert: ${topAlert.label} just surged +${topAlert.roiIncreasePct}% in projected ROI ($${topAlert.baselineRoiPer1kUsd} -> $${topAlert.projectedRoiPer1kUsd} per 1K views). Write one crisp 22-word executive director directive explaining how to capitalize immediately.`,
          config: { tools: [{ googleSearch: {} }] },
        });
        if (response.text?.trim()) {
          topAlert.directorSuggestion = response.text.trim().slice(0, 240);
        }
        recordCreditUsage(state, {
          tier,
          feature: "Revenue Growth Alert Scan",
          model,
          creditsUsed: credits,
          estUsdCost: estUsd,
          status: "success",
        });
        deps.pushTelemetry(state, {
          category: "gemini",
          endpoint: "/api/performance/revenue-alerts/scan",
          latencyMs: Date.now() - t0,
          success: true,
          model,
        });
      } catch {
        // Keep deterministic >=15% ROI calculation even if external search call fails
      }
    }

    const finalAlerts = detected.length > 0 ? detected : buildSeedRevenueAlerts();
    state.revenueAlerts = finalAlerts;
    deps.saveWorkspace(state);
    res.json({ revenueAlerts: finalAlerts, computeRouting: state.computeRouting });
  });

  app.post("/api/performance/revenue-alerts/:id/shift-focus", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const alerts = state.revenueAlerts || buildSeedRevenueAlerts();
    const target = alerts.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Revenue growth alert not found." });
      return;
    }

    if (target.niche) {
      state.config.targetGames = state.config.targetGames.map((g) =>
        g.niche === target.niche ? { ...g, enabled: true } : g
      );
      if (!state.config.targetGames.some((g) => g.niche === target.niche)) {
        state.config.targetGames.unshift({
          name: `${NICHE_LABELS[target.niche]} High-ROI Clips`,
          twitchGameId: `niche-${target.niche}`,
          minViews: 1500,
          maxClipAgeHours: 24,
          enabled: true,
          niche: target.niche,
        });
      }
    }

    if (state.config.aiDirector) {
      state.config.aiDirector = {
        ...state.config.aiDirector,
        customVoicePrompt: `PRIORITY FOCUS (${target.label}, +${target.roiIncreasePct}% ROI): ${target.directorSuggestion}`,
      };
    }

    state.config.publishing.maxPostsPerDay = Math.min(
      12,
      Math.max(state.config.publishing.maxPostsPerDay, 5)
    );

    target.status = "actioned";
    target.actionedAt = new Date().toISOString();
    state.revenueAlerts = alerts;

    state.directorHistory = [
      {
        id: `dir_rga_${Date.now().toString(36)}`,
        instruction: `Revenue Growth Alert Focus Shift: ${target.label} (+${target.roiIncreasePct}% ROI)`,
        planSummary: target.directorSuggestion,
        executedAt: new Date().toISOString(),
        latencyMs: 42,
        steps: [
          {
            action: "prioritize_niche",
            target: target.label,
            status: "executed" as const,
            detail: `Enabled high-ROI tracking and updated AI Director focus prompt (+$${target.projectedMonthlyDeltaUsd}/mo est. lift).`,
          },
        ],
      },
      ...(state.directorHistory || []),
    ].slice(0, 20);

    deps.saveWorkspace(state);
    try {
      fs.writeFileSync(deps.pipelineConfigFile, JSON.stringify(state.config, null, 2));
    } catch {
      // Ignore if read-only
    }

    res.json({
      config: state.config,
      revenueAlerts: state.revenueAlerts,
      directorHistory: state.directorHistory,
      summary: `AI Director shifted focus to ${target.label} (+${target.roiIncreasePct}% projected ROI).`,
    });
  });

  app.patch("/api/performance/revenue-alerts/:id", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const alerts = state.revenueAlerts || buildSeedRevenueAlerts();
    const target = alerts.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Revenue growth alert not found." });
      return;
    }
    const nextStatus = req.body?.status;
    if (nextStatus === "dismissed" || nextStatus === "active" || nextStatus === "actioned") {
      target.status = nextStatus;
    }
    state.revenueAlerts = alerts;
    deps.saveWorkspace(state);
    res.json({ revenueAlerts: alerts });
  });

  // =========================================================================
  // 4. MULTIMODAL AI LAB (CHAT + SEARCH, TRANSCRIBE, IMAGE, VIDEO, MUSIC)
  // =========================================================================

  // 4A. Gemini Chatbot with Toggleable Google Search Grounding
  app.post("/api/ai/studio/chat", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    const message = String(req.body?.message || "").trim();
    const useSearch = req.body?.useSearch !== false;
    const requestedTier = VALID_TIERS.has(req.body?.tier) ? (req.body.tier as AiComputeTierId) : undefined;
    const history = Array.isArray(req.body?.history)
      ? (req.body.history as Array<{ role: string; text: string }>).slice(-10)
      : [];

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Configure it in Settings > Secrets, or switch to Windows PC Local LLM tier.",
      });
      return;
    }

    const { tier, model, credits, estUsd } = getPreferredTextModel(state, requestedTier);

    try {
      const conversationContext = history
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${String(m.text || "").slice(0, 800)}`)
        .join("\n");

      const fullPrompt = conversationContext
        ? `Previous conversation:\n${conversationContext}\n\nLatest user message:\n${message}`
        : message;

      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction:
            "You are the ClipForge AI Creative Producer & Growth Strategist. Give direct, actionable, creator-focused answers for viral hooks, monetization, editing, sponsorship pricing, and platform trends. Keep responses concise and well-structured.",
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const reply = (response.text || "").trim() || "No text response returned.";
      const { sources, searchQueries } = useSearch
        ? extractGroundingSources(response)
        : { sources: [], searchQueries: [] };

      recordCreditUsage(state, {
        tier,
        feature: useSearch ? "Gemini Chat + Google Search" : "Gemini Chatbot",
        model,
        creditsUsed: useSearch ? credits + 1 : credits,
        estUsdCost: estUsd,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/chat",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        reply,
        model,
        tier,
        usedSearch: useSearch,
        sources,
        searchQueries,
        latencyMs: Date.now() - t0,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/chat",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: deps.formatApiError(err, "Gemini chat request failed.") });
    }
  });

  // 4B. Audio Transcription (gemini-3.5-transcribe)
  app.post("/api/ai/studio/transcribe", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    const audioBase64 = String(req.body?.audioBase64 || "").replace(/^data:[^;]+;base64,/, "").trim();
    const mimeType = String(req.body?.mimeType || "audio/webm").toLowerCase().trim();
    const instruction =
      String(req.body?.instruction || "").trim() ||
      "Transcribe this audio accurately verbatim, with clear punctuation and paragraph breaks.";

    if (!audioBase64) {
      res.status(400).json({ error: "Audio payload is required." });
      return;
    }
    if (!ALLOWED_AUDIO_MIMES.has(mimeType)) {
      res.status(400).json({ error: `Unsupported audio MIME type: ${mimeType}` });
      return;
    }
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured in Settings > Secrets.",
      });
      return;
    }

    const model = "gemini-3.5-transcribe";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            { text: instruction },
          ],
        },
      });

      const transcript = (response.text || "").trim();
      const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;

      recordCreditUsage(state, {
        tier: "cloud-budget",
        feature: "Audio Transcription",
        model,
        creditsUsed: 2,
        estUsdCost: 0.0015,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/transcribe",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        transcript,
        wordCount,
        model,
        latencyMs: Date.now() - t0,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/transcribe",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: deps.formatApiError(err, "Audio transcription failed.") });
    }
  });

  // 4C. Image Creation & Image Editing (gemini-3.1-flash-lite-image / gemini-nano-banana-2.1 via Interactions API)
  app.post("/api/ai/studio/image", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    const prompt = String(req.body?.prompt || "").trim();
    const quality = req.body?.quality === "pro" ? "pro" : "fast";
    const aspectRatio = ["1:1", "9:16", "16:9", "4:5", "3:4"].includes(String(req.body?.aspectRatio))
      ? String(req.body.aspectRatio)
      : "9:16";
    const sourceImageBase64 = String(req.body?.sourceImageBase64 || "")
      .replace(/^data:[^;]+;base64,/, "")
      .trim();
    const sourceImageMime = String(req.body?.sourceImageMime || "image/png").toLowerCase().trim();

    if (!prompt) {
      res.status(400).json({ error: "Image prompt is required." });
      return;
    }
    if (sourceImageBase64 && !ALLOWED_IMAGE_MIMES.has(sourceImageMime)) {
      res.status(400).json({ error: `Unsupported image MIME type: ${sourceImageMime}` });
      return;
    }
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Select a billing-enabled key in Settings > Secrets, or use the Free Canvas Designer mode.",
      });
      return;
    }

    const model = quality === "pro" ? "gemini-nano-banana-2.1" : "gemini-3.1-flash-lite-image";
    try {
      const inputPayload = sourceImageBase64
        ? [
            {
              type: "image" as const,
              data: sourceImageBase64,
              mime_type: sourceImageMime,
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ]
        : prompt;

      const interaction = await ai.interactions.create({
        model,
        input: inputPayload,
        response_modalities: ["image", "text"],
        generation_config: {
          image_config: {
            aspect_ratio: aspectRatio,
            image_size: quality === "pro" ? "2K" : "1K",
          },
        },
      });

      let imageBase64 = "";
      let mimeType = "image/png";
      let captionText = "";

      if (interaction.output_image?.data) {
        imageBase64 = interaction.output_image.data;
        mimeType = interaction.output_image.mime_type || "image/png";
      } else if (Array.isArray(interaction.steps)) {
        for (const step of interaction.steps) {
          if (step.type === "model_output" && Array.isArray(step.content)) {
            for (const c of step.content) {
              if (c.type === "image" && "data" in c && c.data) {
                imageBase64 = String(c.data);
                mimeType = ("mime_type" in c && c.mime_type ? String(c.mime_type) : "image/png");
              }
              if (c.type === "text" && "text" in c && c.text) {
                captionText += String(c.text);
              }
            }
          }
        }
      }

      if (!imageBase64) {
        throw new Error("Model completed without returning an image payload. Try refining the prompt.");
      }

      recordCreditUsage(state, {
        tier: "cloud-flagship",
        feature: sourceImageBase64 ? "Gemini Image Edit" : "Gemini Image Create",
        model,
        creditsUsed: quality === "pro" ? 12 : 6,
        estUsdCost: quality === "pro" ? 0.045 : 0.02,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/image",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        imageUrl: `data:${mimeType};base64,${imageBase64}`,
        mimeType,
        captionText: captionText.trim(),
        model,
        mode: sourceImageBase64 ? "edit" : "create",
        latencyMs: Date.now() - t0,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/image",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      const msg = deps.formatApiError(err, "Image generation failed.");
      const needsPaidHint = /403|429|quota|billing|permission|paid/i.test(msg)
        ? " Image generation models require a billing-enabled API key in Settings > Secrets, or you can switch to the built-in Free Canvas Designer mode."
        : "";
      res.status(500).json({ error: `${msg}${needsPaidHint}` });
    }
  });

  // 4D. Video Generation (Text-to-Video & Animate Image-to-Video via gemini-omni-1.2-flash)
  app.post("/api/ai/studio/video", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    const prompt = String(req.body?.prompt || "").trim();
    const aspectRatio = req.body?.aspectRatio === "9:16" ? "9:16" : "16:9";
    const duration = ["5s", "8s", "10s"].includes(String(req.body?.duration))
      ? String(req.body.duration)
      : "5s";
    const resolution = ["360p", "720p", "1080p"].includes(String(req.body?.resolution))
      ? String(req.body.resolution)
      : "720p";
    const sourceImageBase64 = String(req.body?.sourceImageBase64 || "")
      .replace(/^data:[^;]+;base64,/, "")
      .trim();
    const sourceImageMime = String(req.body?.sourceImageMime || "image/png").toLowerCase().trim();

    if (!prompt) {
      res.status(400).json({ error: "Video prompt is required." });
      return;
    }
    if (sourceImageBase64 && !ALLOWED_IMAGE_MIMES.has(sourceImageMime)) {
      res.status(400).json({ error: `Unsupported image MIME type: ${sourceImageMime}` });
      return;
    }
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Select a billing-enabled key in Settings > Secrets, or use the Free Browser Motion Animator.",
      });
      return;
    }

    const model = "gemini-omni-1.2-flash";
    try {
      const inputPayload = sourceImageBase64
        ? [
            {
              type: "image" as const,
              mime_type: sourceImageMime,
              data: sourceImageBase64,
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ]
        : prompt;

      const interaction = await ai.interactions.create(
        {
          model,
          input: inputPayload,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: "video",
            aspect_ratio: aspectRatio,
            duration,
            resolution,
          },
        } as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 }
      );

      const videoPart =
        interaction && "output_video" in interaction ? interaction.output_video : undefined;
      if (!videoPart || (!videoPart.data && !videoPart.uri)) {
        throw new Error("Video model completed without returning video data.");
      }

      const mimeType = videoPart.mime_type || "video/mp4";
      const videoUrl = videoPart.data
        ? `data:${mimeType};base64,${videoPart.data}`
        : String(videoPart.uri || "");

      recordCreditUsage(state, {
        tier: "cloud-flagship",
        feature: sourceImageBase64 ? "Animate Image to Video" : "Text to Video",
        model,
        creditsUsed: 25,
        estUsdCost: 0.18,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/video",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        videoUrl,
        mimeType,
        model,
        mode: sourceImageBase64 ? "image-to-video" : "text-to-video",
        latencyMs: Date.now() - t0,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/video",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      const msg = deps.formatApiError(err, "Video generation failed.");
      const needsPaidHint = /403|429|quota|billing|permission|paid/i.test(msg)
        ? " Cloud video generation (gemini-omni-1.2-flash) requires a billing-enabled API key in Settings > Secrets. You can also animate any image right now for $0 using the built-in Free Browser Motion Animator."
        : "";
      res.status(500).json({ error: `${msg}${needsPaidHint}` });
    }
  });

  // 4E. Music Generation (lyria-3-clip-preview / lyria-3-pro-preview via generateContentStream)
  app.post("/api/ai/studio/music", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    const prompt = String(req.body?.prompt || "").trim();
    const fullTrack = Boolean(req.body?.fullTrack);
    const sourceImageBase64 = String(req.body?.sourceImageBase64 || "")
      .replace(/^data:[^;]+;base64,/, "")
      .trim();
    const sourceImageMime = String(req.body?.sourceImageMime || "image/jpeg").toLowerCase().trim();

    if (!prompt) {
      res.status(400).json({ error: "Music prompt is required." });
      return;
    }
    if (sourceImageBase64 && !ALLOWED_IMAGE_MIMES.has(sourceImageMime)) {
      res.status(400).json({ error: `Unsupported reference image MIME type: ${sourceImageMime}` });
      return;
    }
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Select a billing-enabled key in Settings > Secrets, or use the Free WebAudio Beat Synthesizer.",
      });
      return;
    }

    const model = fullTrack ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
    try {
      const contents = sourceImageBase64
        ? {
            parts: [
              { text: prompt },
              { inlineData: { data: sourceImageBase64, mimeType: sourceImageMime } },
            ],
          }
        : prompt;

      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          responseModalities: [Modality.AUDIO],
        },
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        throw new Error("Lyria stream finished without returning audio bytes.");
      }

      recordCreditUsage(state, {
        tier: "cloud-flagship",
        feature: fullTrack ? "Lyria Pro Music Track" : "Lyria 30s Music Clip",
        model,
        creditsUsed: fullTrack ? 20 : 10,
        estUsdCost: fullTrack ? 0.12 : 0.05,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/music",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        audioUrl: `data:${mimeType};base64,${audioBase64}`,
        mimeType,
        lyrics: lyrics.trim(),
        model,
        latencyMs: Date.now() - t0,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/studio/music",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      const msg = deps.formatApiError(err, "Lyria music generation failed.");
      const needsPaidHint = /403|429|quota|billing|permission|paid/i.test(msg)
        ? " Lyria music models require a billing-enabled API key in Settings > Secrets. You can also generate royalty-free WAV beats right now for $0 using the Free WebAudio Beat Synthesizer."
        : "";
      res.status(500).json({ error: `${msg}${needsPaidHint}` });
    }
  });

  // =========================================================================
  // 5. COMPUTE TIERS, CREDITS & GITHUB / CLOUDFLARE / SUPABASE HOSTING BLUEPRINTS
  // =========================================================================
  app.patch("/api/compute/routing", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const current = state.computeRouting || buildSeedComputeRouting();

    if (VALID_TIERS.has(req.body?.activeTier)) {
      current.activeTier = req.body.activeTier;
    }
    if (VALID_HOSTING_STAGES.has(req.body?.hostingStage)) {
      current.hostingStage = req.body.hostingStage;
    }
    if (typeof req.body?.monthlyBudgetCapUsd === "number") {
      current.monthlyBudgetCapUsd = Math.max(0, Math.min(5000, Number(req.body.monthlyBudgetCapUsd)));
    }
    if (typeof req.body?.autoDowngradeOnBudgetCap === "boolean") {
      current.autoDowngradeOnBudgetCap = req.body.autoDowngradeOnBudgetCap;
    }
    if (typeof req.body?.windowsPcEndpoint === "string") {
      const trimmed = req.body.windowsPcEndpoint.trim();
      if (/^https?:\/\/[a-zA-Z0-9._:-]+(\/.*)?$/.test(trimmed)) {
        current.windowsPcEndpoint = trimmed.slice(0, 160);
        if (state.config.localLlm) {
          state.config.localLlm.baseUrl = current.windowsPcEndpoint;
        }
      }
    }
    if (typeof req.body?.windowsPcModel === "string" && req.body.windowsPcModel.trim()) {
      current.windowsPcModel = req.body.windowsPcModel.trim().slice(0, 80);
      if (state.config.localLlm) {
        state.config.localLlm.model = current.windowsPcModel;
      }
    }
    if (typeof req.body?.topUpCredits === "number" && req.body.topUpCredits > 0) {
      const add = Math.min(5000, Math.round(req.body.topUpCredits));
      current.creditsBalance = Number((current.creditsBalance + add).toFixed(2));
      current.creditsMonthlyAllowance = Math.max(current.creditsMonthlyAllowance, current.creditsBalance);
    }
    if (req.body?.resetSpend === true) {
      current.estMonthSpendUsd = 0;
      current.creditsBalance = current.creditsMonthlyAllowance;
    }

    current.supabaseConfigured = isSupabaseConfigured();
    state.computeRouting = current;
    deps.saveWorkspace(state);
    res.json({ computeRouting: current, config: state.config });
  });

  app.get("/api/hosting/blueprints", (_req: Request, res: Response) => {
    res.json({
      supabaseConfigured: isSupabaseConfigured(),
      ...buildHostingBlueprints(),
    });
  });

  // =========================================================================
  // 5B. OPPORTUNITY DISCOVERY (GOOGLE SEARCH GAP SCANNER VS. CLIP LIBRARY)
  // =========================================================================
  app.post("/api/ingest/opportunity-discovery", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add your key in Settings > Secrets to run Google Search discovery.",
      });
      return;
    }

    const rawNiche = String(req.body?.niche || "all");
    const validNiches = new Set<string>([
      "all",
      "gaming",
      "podcasts",
      "tech-ai",
      "finance",
      "sports-irl",
      "faceless-doc",
    ]);
    const focusNiche = (validNiches.has(rawNiche) ? rawNiche : "all") as ContentNiche | "all";

    const rawFreshness = String(req.body?.freshness || "7d");
    const freshness: OpportunityGapFreshness =
      rawFreshness === "24h" || rawFreshness === "30d" ? rawFreshness : "7d";
    const customQuery = String(req.body?.customQuery || "").trim().slice(0, 180);

    // Build real library coverage footprint from current clips
    const relevantClips =
      focusNiche === "all"
        ? state.clips
        : state.clips.filter((c) => c.niche === focusNiche);

    const existingTitles = state.clips.map((c) => c.title);
    const coveredCategories: string[] = Array.from(
      new Set(
        relevantClips
          .map((c) => c.gameCategory || c.niche || "")
          .filter((val): val is string => Boolean(val))
      )
    ).slice(0, 14);

    const coveredSummaryList = state.clips
      .slice(0, 30)
      .map((c) => `- [${c.niche}] "${c.title}" (${c.gameCategory})`)
      .join("\n");

    const freshnessLabel =
      freshness === "24h"
        ? "the last 24 hours"
        : freshness === "30d"
          ? "the last 30 days"
          : "the last 7 days";

    const nichePromptLabel =
      focusNiche === "all"
        ? "high-RPM short-form video niches (AI & Tech, Finance, Gaming, Podcasts, Faceless Doc, Sports & IRL)"
        : `the "${focusNiche}" short-form creator niche`;

    const prompt = [
      `You are ClipForge Opportunity Discovery, a real-time content whitespace analyst.`,
      `Use Google Search to find 5 HIGH-PERFORMING, trending topics from ${freshnessLabel} in ${nichePromptLabel}`,
      customQuery ? `with special focus on: "${customQuery}".` : `that are driving breakout short-form views and high advertiser demand right now.`,
      ``,
      `CRITICAL EXCLUSION RULE — DO NOT REPEAT OUR EXISTING CLIP LIBRARY:`,
      `Our clip library already covers these clips & topics:`,
      coveredSummaryList || "- (No clips yet)",
      ``,
      `Every single topic you return MUST represent a genuinely UNCOVERED gap — a distinct angle, breakout story, tool launch, debate, or trend NOT already covered by any clip listed above.`,
      ``,
      `Return ONLY valid JSON (no markdown fences) with this exact structure:`,
      `{`,
      `  "topics": [`,
      `    {`,
      `      "topic": "Specific, crisp high-performing video topic title (max 78 chars)",`,
      `      "niche": "tech-ai" | "finance" | "gaming" | "podcasts" | "sports-irl" | "faceless-doc",`,
      `      "subCategory": "Short 2-3 word category label",`,
      `      "demandVelocity": "exploding" | "rising" | "steady",`,
      `      "searchTrendSignal": "Concrete evidence from Google Search explaining why this topic is surging right now",`,
      `      "whyUncovered": "One sentence explaining what gap this fills relative to our existing clip library",`,
      `      "suggestedHook": "Punchy 3-second spoken opening hook (max 95 chars)",`,
      `      "angleBrief": "2-sentence production angle & visual pacing plan for a 30-45s vertical clip",`,
      `      "recommendedFormat": "split-screen" | "faceless-narration" | "podcast-split" | "authority-breakdown",`,
      `      "estimatedRpmUsd": 4.2`,
      `    }`,
      `  ]`,
      `}`,
    ].join("\n");

    const model = "gemini-4-hydrogen";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = (response.text ?? "").trim();
      const parsed = parseLooseJsonObject(rawText) as {
        topics?: Array<Partial<OpportunityGapTopic>>;
      };

      const groundingMeta = response.candidates?.[0]?.groundingMetadata;
      const groundingChunks = groundingMeta?.groundingChunks || [];
      const sources: TrendPulseSource[] = [];
      const seenUris = new Set<string>();
      for (const chunk of groundingChunks) {
        const uri = chunk.web?.uri;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({
            title: chunk.web?.title || uri,
            uri,
          });
        }
      }
      const searchQueries: string[] = Array.isArray(groundingMeta?.webSearchQueries)
        ? groundingMeta.webSearchQueries.filter((q): q is string => typeof q === "string")
        : [];

      const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
      if (rawTopics.length === 0) {
        throw new Error("Google Search discovery returned no structured topics. Please refine the query and try again.");
      }

      const validItemNiches = new Set<ContentNiche>([
        "gaming",
        "podcasts",
        "tech-ai",
        "finance",
        "sports-irl",
        "faceless-doc",
      ]);
      const validFormats = new Set<OpportunityGapTopic["recommendedFormat"]>([
        "split-screen",
        "faceless-narration",
        "podcast-split",
        "authority-breakdown",
      ]);

      const nowIso = new Date().toISOString();
      const auditedTopics: OpportunityGapTopic[] = rawTopics.slice(0, 6).map((item, idx) => {
        const topicTitle = String(item.topic || `Uncovered Niche Angle #${idx + 1}`).trim().slice(0, 110);
        const itemNiche: ContentNiche =
          validItemNiches.has(item.niche as ContentNiche)
            ? (item.niche as ContentNiche)
            : focusNiche === "all"
              ? "tech-ai"
              : focusNiche;

        // Audit novelty against every clip currently in the library
        const { noveltyPct, closestTitle } = computeLibraryNovelty(topicTitle, existingTitles);
        const velocity =
          item.demandVelocity === "exploding" || item.demandVelocity === "steady"
            ? item.demandVelocity
            : "rising";
        const format = validFormats.has(item.recommendedFormat as OpportunityGapTopic["recommendedFormat"])
          ? (item.recommendedFormat as OpportunityGapTopic["recommendedFormat"])
          : "authority-breakdown";
        const citation = sources[idx % Math.max(1, sources.length)];

        return {
          id: `oppgap_${Date.now().toString(36)}_${idx}`,
          topic: topicTitle,
          niche: itemNiche,
          subCategory: String(item.subCategory || "Breakout Search Topic").trim().slice(0, 48),
          demandVelocity: velocity,
          searchTrendSignal: String(
            item.searchTrendSignal || "Breakout search interest detected across live Google Search results."
          ).trim(),
          whyUncovered: String(
            item.whyUncovered ||
              "Zero matching titles or angles found across your existing clip library."
          ).trim(),
          suggestedHook: String(
            item.suggestedHook || `Everyone missed this shift in ${topicTitle} — here is why it matters.`
          ).trim(),
          angleBrief: String(
            item.angleBrief ||
              "Open with the sharpest stat in the first 3 seconds, cut to annotated web proof, and close with a debate CTA."
          ).trim(),
          recommendedFormat: format,
          estimatedRpmUsd: Math.max(0.8, Math.min(18, Number(Number(item.estimatedRpmUsd || 3.4).toFixed(2)))),
          noveltyPct,
          closestLibraryClipTitle: closestTitle,
          sourceTitle: citation?.title,
          sourceUrl: citation?.uri,
          discoveredAt: nowIso,
        };
      });

      const snapshot: OpportunityDiscoverySnapshot = {
        lastScannedAt: nowIso,
        focusNiche,
        freshness,
        customQuery: customQuery || undefined,
        modelUsed: model,
        libraryClipCountAudited: state.clips.length,
        excludedCoveredTopics: coveredCategories.length > 0 ? coveredCategories : existingTitles.slice(0, 8),
        topics: auditedTopics,
        sources: sources.slice(0, 10),
        searchQueries: searchQueries.slice(0, 8),
      };

      state.opportunityDiscovery = snapshot;
      recordCreditUsage(state, {
        tier: "cloud-standard",
        feature: "Opportunity Discovery (Google Search)",
        model,
        creditsUsed: 4,
        estUsdCost: 0.004,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ingest/opportunity-discovery",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        opportunityDiscovery: snapshot,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      const msg = deps.formatApiError(err, "Opportunity Discovery Google Search scan failed.");
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ingest/opportunity-discovery",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/ingest/opportunity-discovery/:id/promote", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const discovery = state.opportunityDiscovery || buildSeedOpportunityDiscovery();
    const target = discovery.topics.find((t) => t.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Discovered opportunity topic not found." });
      return;
    }

    const mode = req.body?.mode === "clip" ? "clip" : "research";
    if (mode === "clip" && typeof req.body?.clipId === "string" && req.body.clipId.trim()) {
      target.promotedToClipId = req.body.clipId.trim();
      state.opportunityDiscovery = discovery;
      deps.saveWorkspace(state);
      res.json({ opportunityDiscovery: discovery });
      return;
    }

    // Save into researchOpportunities queue without duplicates
    const existing = state.researchOpportunities || [];
    const alreadyExists = existing.some(
      (r) => r.topic.toLowerCase() === target.topic.toLowerCase()
    );
    if (!alreadyExists) {
      const templateMap: Record<
        OpportunityGapTopic["recommendedFormat"],
        "split-stack" | "blurred-backdrop" | "dual-cam"
      > = {
        "split-screen": "split-stack",
        "faceless-narration": "blurred-backdrop",
        "podcast-split": "dual-cam",
        "authority-breakdown": "blurred-backdrop",
      };
      const newOpp: ResearchOpportunity = {
        id: `opp_disc_${Date.now().toString(36)}`,
        niche: target.niche,
        topic: target.topic,
        source: target.sourceTitle || "Google Search Discovery",
        estimatedRpmUsd: target.estimatedRpmUsd,
        competitionLevel: target.noveltyPct >= 88 ? "low" : "medium",
        viralScore: target.demandVelocity === "exploding" ? 94 : target.demandVelocity === "rising" ? 88 : 81,
        outlierMultiplier: target.demandVelocity === "exploding" ? 4.8 : 3.2,
        whyNow: `${target.searchTrendSignal} (${target.noveltyPct}% uncovered in library)`,
        hookBlueprint: target.suggestedHook,
        recommendedVoice: target.niche === "finance" || target.niche === "tech-ai" ? "Charon" : "Zephyr",
        recommendedTemplate: templateMap[target.recommendedFormat],
        suggestedScript: `${target.suggestedHook} ${target.angleBrief}`,
        origin: "manual-research",
        newsletterOrFeed: target.subCategory,
        sourceUrl: target.sourceUrl,
        crawledAt: target.discoveredAt,
      };
      state.researchOpportunities = [newOpp, ...existing].slice(0, 30);
    }

    target.savedToResearch = true;
    state.opportunityDiscovery = discovery;
    deps.saveWorkspace(state);
    res.json({
      opportunityDiscovery: discovery,
      researchOpportunities: state.researchOpportunities || [],
    });
  });
}

function tokenizeTopic(text: string): Set<string> {
  const stop = new Set([
    "the", "and", "for", "with", "that", "this", "from", "your", "into",
    "over", "about", "what", "when", "where", "how", "why", "will", "just",
    "clip", "video", "short", "viral", "new", "best", "top", "are", "was",
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stop.has(w))
  );
}

function computeLibraryNovelty(
  candidateTitle: string,
  existingTitles: string[]
): { noveltyPct: number; closestTitle?: string } {
  const candTokens = tokenizeTopic(candidateTitle);
  if (candTokens.size === 0 || existingTitles.length === 0) {
    return { noveltyPct: 98, closestTitle: existingTitles[0] };
  }
  let maxOverlap = 0;
  let closestTitle: string | undefined;
  for (const title of existingTitles) {
    const tTokens = tokenizeTopic(title);
    if (tTokens.size === 0) continue;
    let shared = 0;
    for (const tok of candTokens) {
      if (tTokens.has(tok)) shared += 1;
    }
    const union = new Set([...candTokens, ...tTokens]).size;
    const jaccard = union > 0 ? shared / union : 0;
    if (jaccard > maxOverlap) {
      maxOverlap = jaccard;
      closestTitle = title;
    }
  }
  const noveltyPct = Math.max(40, Math.min(99, Math.round((1 - maxOverlap) * 100)));
  return { noveltyPct, closestTitle };
}

function parseLooseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function buildSeedOpportunityDiscovery(): OpportunityDiscoverySnapshot {
  const nowIso = new Date().toISOString();
  return {
    lastScannedAt: nowIso,
    focusNiche: "all",
    freshness: "7d",
    scanMode: "library-gap",
    competitorChannelsAudited: ["@Fireship", "@MKBHD", "@TheAIAdvantage", "@GrahamStephan", "@AliAbdaal"],
    modelUsed: "baseline-library-audit",
    libraryClipCountAudited: 6,
    excludedCoveredTopics: [
      "Grand Theft Auto VI",
      "Valorant",
      "Counter-Strike 2",
      "AI Coding Benchmarks",
      "Creator Economy Podcasts",
    ],
    topics: [
      {
        id: "oppgap_comp_seed_1",
        topic: "Split-Screen Cost Audit: Local Ollama vs. Cloud API Subscriptions for Creators",
        niche: "tech-ai",
        subCategory: "Live Cost Teardown Format",
        gapType: "competitor-gap",
        competitorChannel: "@Fireship",
        competitorBlindspot:
          "@Fireship covers model launches in 100s news format, but never publishes vertical side-by-side billing teardowns paired with an email-gated local setup kit.",
        autoDraftedToOpportunities: true,
        savedToResearch: true,
        demandVelocity: "exploding",
        searchTrendSignal:
          "Comments under top tech channels repeatedly ask 'what is the real monthly cost on a home Windows GPU?'",
        whyUncovered:
          "Neither @Fireship nor your current clip library covers creator-specific GPU cost math with affiliate cloud fallback.",
        suggestedHook: "Fireship skipped the billing tab — here is the exact $0/mo Windows setup.",
        angleBrief:
          "Run a 34s split-screen invoice teardown + live local inference timer, ending with a pinned email opt-in landing page for the script.",
        recommendedFormat: "authority-breakdown",
        estimatedRpmUsd: 5.8,
        noveltyPct: 97,
        closestLibraryClipTitle: "Why 90% of Devs Are Switching to Agentic IDEs",
        discoveredAt: nowIso,
      },
      {
        id: "oppgap_comp_seed_2",
        topic: "How 1 Viral Short Builds a 5,000-Subscriber Affiliate Email List in 14 Days",
        niche: "finance",
        subCategory: "Funnel Teardown Format",
        gapType: "competitor-gap",
        competitorChannel: "@AliAbdaal",
        competitorBlindspot:
          "@AliAbdaal teaches broad productivity & long-form YouTube, leaving short-form-to-email-capture affiliate bridge workflows uncovered.",
        autoDraftedToOpportunities: true,
        savedToResearch: true,
        demandVelocity: "exploding",
        searchTrendSignal:
          "Creator economy Reddit & X threads show sharp spikes searching for affiliate bridge pages that survive Shorts algorithm swings.",
        whyUncovered:
          "Top creator-finance channels rarely share vertical funnel conversion numbers from pinned comment to affiliate EPC.",
        suggestedHook: "Views don't pay rent — this 2-step pinned link turns 10K Shorts views into $420.",
        angleBrief:
          "Show the 3-box funnel diagram (Short -> Free Kit Opt-In -> Affiliate Partner Bridge) with live CTR & EPC overlay.",
        recommendedFormat: "faceless-narration",
        estimatedRpmUsd: 7.1,
        noveltyPct: 98,
        closestLibraryClipTitle: "Creator Economy RPM Breakdown",
        discoveredAt: nowIso,
      },
      {
        id: "oppgap_seed_1",
        topic: "Local Desktop AI Agents Replacing $200/mo SaaS Subscriptions",
        niche: "tech-ai",
        subCategory: "Local AI Workflows",
        gapType: "library-gap",
        demandVelocity: "exploding",
        searchTrendSignal:
          "Surging developer & solopreneur search volume around running zero-API-cost local models on consumer GPUs.",
        whyUncovered:
          "Your clip library covers cloud coding benchmarks, but has zero clips showing side-by-side local desktop cost savings.",
        suggestedHook: "Stop paying $200/month for AI tools when a 4GB local model runs free on your PC.",
        angleBrief:
          "Open with a split-screen billing receipt vs. local terminal speed test, then show 3 workflows running offline in 32 seconds.",
        recommendedFormat: "authority-breakdown",
        estimatedRpmUsd: 4.9,
        noveltyPct: 96,
        closestLibraryClipTitle: "Why 90% of Devs Are Switching to Agentic IDEs",
        discoveredAt: nowIso,
      },
      {
        id: "oppgap_seed_2",
        topic: "How 2026 Platform CPM Floors Reward 45-Second Retention Loops",
        niche: "finance",
        subCategory: "Creator Monetization",
        gapType: "library-gap",
        demandVelocity: "exploding",
        searchTrendSignal:
          "High search velocity for YouTube Shorts & TikTok Creativity Program RPM thresholds above the 35s watch mark.",
        whyUncovered:
          "No clip in your Finance or Creator library breaks down concrete CPM tier jumps with a visual payout chart.",
        suggestedHook: "Adding 12 seconds to your short just doubled the ad payout — here is the exact math.",
        angleBrief:
          "Plot a 15-second vs. 45-second RPM comparison bar chart at 0:04, narrate the mid-roll retention loop, and end with a sponsor CTA.",
        recommendedFormat: "faceless-narration",
        estimatedRpmUsd: 6.2,
        noveltyPct: 98,
        closestLibraryClipTitle: "Creator Economy RPM Breakdown",
        discoveredAt: nowIso,
      },
      {
        id: "oppgap_seed_3",
        topic: "Steam Next Fest Indie Breakout Demos Pulling 50K Concurrent Players",
        niche: "gaming",
        subCategory: "Indie Breakout Radar",
        gapType: "library-gap",
        demandVelocity: "rising",
        searchTrendSignal:
          "Fast-rising search spikes for surprise co-op survival & extraction demos with under-saturated short-form clip coverage.",
        whyUncovered:
          "Your Gaming library is concentrated in GTA VI and tactical shooters, leaving viral Steam indie breakout demos completely uncovered.",
        suggestedHook: "A 2-person indie studio just beat AAA releases on Steam — watch this 20-second clip.",
        angleBrief:
          "Lead with the wildest co-op chaos clip in the first 2 seconds, overlay live SteamDB concurrent player count, and prompt comments for squad tags.",
        recommendedFormat: "split-screen",
        estimatedRpmUsd: 2.35,
        noveltyPct: 94,
        closestLibraryClipTitle: "Grand Theft Auto VI Map Leak Reaction",
        discoveredAt: nowIso,
      },
      {
        id: "oppgap_seed_4",
        topic: "The Unbuilt Mega-Projects Quietly Reshaping Global Fiber & Data Centers",
        niche: "faceless-doc",
        subCategory: "Infrastructure Micro-Doc",
        gapType: "library-gap",
        demandVelocity: "rising",
        searchTrendSignal:
          "Strong evergreen + news search demand around subsea AI cables, nuclear micro-grids, and desert server campuses.",
        whyUncovered:
          "Your library has zero high-retention 60-second infrastructure micro-docs, a high-RPM sponsor magnet for B2B tech brands.",
        suggestedHook: "There is a 10,000-mile cable under the ocean powering every AI prompt you send.",
        angleBrief:
          "Pair animated map zooms with dark studio narration (-14 LUFS) and concise HUD stat overlays every 5 seconds to hold >82% completion.",
        recommendedFormat: "faceless-narration",
        estimatedRpmUsd: 4.4,
        noveltyPct: 99,
        closestLibraryClipTitle: "How One Algorithm Built a $1B Media Empire",
        discoveredAt: nowIso,
      },
    ],
    sources: [],
    searchQueries: [],
  };
}

// =========================================================================
// 6. REAL-TIME VOICE CONVERSATIONS (GEMINI LIVE API WEBSOCKET BRIDGE)
// =========================================================================
export function attachLiveVoiceWebSocket(
  httpServer: HttpServer,
  deps: Pick<SuiteRouteDeps, "getAiClient" | "readWorkspace" | "saveWorkspace" | "formatApiError">
): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname !== "/api/live-voice") return;
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs: WebSocket, req) => {
    const ai = deps.getAiClient();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "GEMINI_API_KEY is not configured in Settings > Secrets.",
        })
      );
      clientWs.close();
      return;
    }

    const url = new URL(req.url || "/", "http://localhost");
    const requestedVoice = url.searchParams.get("voice") || "Zephyr";
    const allowedVoices = new Set<VoiceProfileId>(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);
    const voiceName: VoiceProfileId = allowedVoices.has(requestedVoice as VoiceProfileId)
      ? (requestedVoice as VoiceProfileId)
      : "Zephyr";

    let session: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    let closed = false;

    const sendSafe = (payload: Record<string, unknown>) => {
      if (!closed && clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    try {
      session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            "You are ClipForge Live Producer, a fast, sharp real-time voice collaborator for viral short-form video creators. Help brainstorm hooks, refine sponsorship CTAs, and diagnose retention drop-offs concisely in natural spoken English.",
        },
        callbacks: {
          onopen: () => {
            sendSafe({ type: "ready", model: "gemini-3.8-live", voiceName });
          },
          onmessage: (message: LiveServerMessage) => {
            const sc = message.serverContent;
            if (sc?.inputTranscription?.text) {
              sendSafe({ type: "inputTranscript", text: sc.inputTranscription.text });
            }
            if (sc?.outputTranscription?.text) {
              sendSafe({ type: "outputTranscript", text: sc.outputTranscription.text });
            }
            for (const part of sc?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendSafe({ type: "audio", data: part.inlineData.data });
              }
            }
            if (sc?.interrupted) {
              sendSafe({ type: "interrupted" });
            }
            if (sc?.turnComplete) {
              sendSafe({ type: "turnComplete" });
            }
          },
          onerror: (err: unknown) => {
            sendSafe({
              type: "error",
              error: deps.formatApiError(err, "Gemini Live session error."),
            });
          },
          onclose: () => {
            sendSafe({ type: "closed" });
          },
        },
      });

      const state = deps.readWorkspace();
      recordCreditUsage(state, {
        tier: "cloud-standard",
        feature: "Gemini Live Voice Session",
        model: "gemini-3.8-live",
        creditsUsed: 5,
        estUsdCost: 0.008,
        status: "success",
      });
      deps.saveWorkspace(state);
    } catch (err) {
      sendSafe({
        type: "error",
        error: deps.formatApiError(err, "Failed to start Gemini Live voice session."),
      });
      clientWs.close();
      return;
    }

    clientWs.on("message", (raw) => {
      if (!session || closed) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          audio?: string;
          text?: string;
        };
        if (typeof msg.audio === "string" && msg.audio.length > 0) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (typeof msg.text === "string" && msg.text.trim().length > 0) {
          session.sendRealtimeInput({
            text: msg.text.trim().slice(0, 1000),
          });
        }
      } catch {
        // Ignore malformed frame
      }
    });

    const cleanup = () => {
      if (closed) return;
      closed = true;
      try {
        session?.close();
      } catch {
        // Ignore close errors
      }
    };

    clientWs.on("close", cleanup);
    clientWs.on("error", cleanup);
  });
}
