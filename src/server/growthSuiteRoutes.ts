import type { Express, Request, Response } from "express";
import type {
  AffiliateOfferLink,
  AutonomousLearningEntry,
  AutonomousMission,
  CompetitiveNicheAlert,
  ContentNiche,
  DeepResearchDossier,
  DeepResearchFinding,
  EmailCaptureLandingPage,
  LongFormGraduationItem,
  OpportunityDiscoverySnapshot,
  OpportunityGapFreshness,
  OpportunityGapTopic,
  RemoteBridgeConfig,
  RemoteMessagingPlatform,
  ResearchOpportunity,
  TrendPulseSource,
  WorkspaceState,
} from "../types";
import { recordCreditUsage, type SuiteRouteDeps } from "./suiteRoutes";

const ALLOWED_REMOTE_HOSTS = new Set([
  "discord.com",
  "discordapp.com",
  "api.telegram.org",
  "graph.facebook.com",
]);

function isSafeHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isAllowedRemoteEndpoint(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_REMOTE_HOSTS.has(host);
  } catch {
    return false;
  }
}

function getRemoteEnvStatus() {
  return {
    discord: Boolean(process.env.DISCORD_WEBHOOK_URL?.trim()),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim()),
    whatsapp: Boolean(
      process.env.WHATSAPP_CLOUD_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
    ),
  };
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

export function buildSeedCompetitiveAlerts(): CompetitiveNicheAlert[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: "calert_seed_1",
      competitorChannel: "@Fireship",
      videoTitle: "Open-Source Browser Agents Just Broke SaaS Automation in 100 Seconds",
      videoUrl: "https://www.youtube.com/results?search_query=open+source+browser+agents+automation",
      niche: "tech-ai",
      subNiche: "Local Browser Automation & Zero-Seat AI",
      publishedAgoLabel: "4h ago",
      observedViews: 284000,
      monetizationGapReason:
        "Rival posted a pure news recap with zero affiliate tool stack, zero email template lead magnet, and no B2B SaaS sponsor integration — leaving $7.40+ RPM commercial intent completely unmonetized.",
      estimatedUpsideRpmUsd: 7.4,
      rapidResponseAngle:
        "Release a 38-second 'Build This Free Local Agent in 3 Clicks' counter-clip linking to an email-gated workflow JSON + cloud GPU affiliate comparison.",
      suggestedHook: "Everyone watched that browser-agent demo, but nobody showed the $0 setup script.",
      status: "active",
      detectedAt: nowIso,
    },
    {
      id: "calert_seed_2",
      competitorChannel: "@GrahamStephan",
      videoTitle: "Why Creator AdSense RPM Quietly Shifted for 45-Second Vertical Videos",
      videoUrl: "https://www.youtube.com/results?search_query=creator+rpm+45+second+vertical+videos",
      niche: "finance",
      subNiche: "Creator Tax & Multi-Stream Payout Engineering",
      publishedAgoLabel: "9h ago",
      observedViews: 146000,
      monetizationGapReason:
        "Covered surface-level AdSense CPM only without breaking down fintech accounting sponsors or high-ticket newsletter email capture funnels.",
      estimatedUpsideRpmUsd: 8.8,
      rapidResponseAngle:
        "Publish a crisp HUD-chart breakdown comparing AdSense-only ($1.90/1K) vs. Email+Affiliate Bridge ($11.40/1K) with a pinned calculator link.",
      suggestedHook: "AdSense is only 18% of what top Shorts channels actually earn — look at column three.",
      status: "active",
      detectedAt: nowIso,
    },
    {
      id: "calert_seed_3",
      competitorChannel: "@TwitchHighlightsDaily",
      videoTitle: "Unannounced Extraction Shooter Playtest Breaks 62K Concurrents Overnight",
      videoUrl: "https://www.youtube.com/results?search_query=extraction+shooter+playtest+steam",
      niche: "gaming",
      subNiche: "Pre-Launch FPS Hardware & Peripheral Benchmarks",
      publishedAgoLabel: "11h ago",
      observedViews: 192000,
      monetizationGapReason:
        "Pure raw highlight compilation with zero peripheral/VPN affiliate overlay and no Discord community capture CTA.",
      estimatedUpsideRpmUsd: 3.6,
      rapidResponseAngle:
        "Cut a 29-second 'Pro FPS Settings + Frame-Time Fix' vertical clip with an affiliate gaming-gear loadout card in the pinned comment.",
      suggestedHook: "This surprise Steam shooter is tanking GPUs unless you flip these 2 hidden settings.",
      status: "active",
      detectedAt: nowIso,
    },
  ];
}

export function buildSeedAffiliateOffers(): AffiliateOfferLink[] {
  return [
    {
      id: "aff_cloud_gpu",
      partnerName: "RunPod / Cloud GPU Credits",
      niche: "tech-ai",
      offerHook: "Free $25 GPU credit for running local AI video models",
      destinationUrl: "https://www.runpod.io/?ref=clipforge",
      utmCode: "utm_source=shorts&utm_campaign=local-ai-stack",
      commissionPct: 25,
      estEpcUsd: 1.85,
      clicks30d: 1420,
      conversions30d: 64,
      status: "active",
    },
    {
      id: "aff_creator_bank",
      partnerName: "Mercury Creator Treasury",
      niche: "finance",
      offerHook: "Zero-fee LLC business banking + creator tax vault",
      destinationUrl: "https://mercury.com/?ref=clipforge",
      utmCode: "utm_source=shorts&utm_campaign=creator-finance",
      commissionPct: 30,
      estEpcUsd: 3.1,
      clicks30d: 780,
      conversions30d: 29,
      status: "active",
    },
    {
      id: "aff_gear_kit",
      partnerName: "Elgato / Shure Broadcast Audio Kit",
      niche: "gaming",
      offerHook: "Studio -14 LUFS mic chain used in every short",
      destinationUrl: "https://www.elgato.com/?ref=clipforge",
      utmCode: "utm_source=shorts&utm_campaign=audio-chain",
      commissionPct: 12,
      estEpcUsd: 0.92,
      clicks30d: 2150,
      conversions30d: 91,
      status: "active",
    },
  ];
}

export function buildSeedEmailLandingPages(): EmailCaptureLandingPage[] {
  return [
    {
      id: "lp_ai_stack",
      slug: "/free-local-ai-blueprint",
      headline: "Steal the $0 Local AI Shorts Automation Blueprint",
      leadMagnetTitle: "2026 Local GPU + Ollama + FFmpeg Preset Pack (Free PDF + Config)",
      subheadline:
        "Enter your email to get the exact prompt templates, caption presets, and affiliate tool discounts mentioned in the short.",
      ctaButtonText: "Send Me the Free Kit",
      linkedAffiliateId: "aff_cloud_gpu",
      niche: "tech-ai",
      visitors30d: 3420,
      subscribers30d: 1128,
      affiliateClicksFromEmail: 486,
      revenueAttributedUsd: 1840,
      active: true,
    },
    {
      id: "lp_rpm_calc",
      slug: "/shorts-rpm-calculator",
      headline: "The Multi-Platform Shorts RPM & Sponsor Pricing Sheet",
      leadMagnetTitle: "2026 Sponsorship Rate Card + 45s Retention Script Checklist",
      subheadline:
        "Unlock our live CPM benchmarks across YouTube Shorts, TikTok, Reels, LinkedIn & Reddit plus partner perks.",
      ctaButtonText: "Unlock Calculator",
      linkedAffiliateId: "aff_creator_bank",
      niche: "finance",
      visitors30d: 1890,
      subscribers30d: 684,
      affiliateClicksFromEmail: 265,
      revenueAttributedUsd: 1490,
      active: true,
    },
  ];
}

export function buildSeedLongFormPipeline(): LongFormGraduationItem[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: "lf_seed_1",
      sourceShortTitle: "Why 90% of Devs Are Switching to Agentic IDEs",
      niche: "tech-ai",
      shortViews: 194000,
      shortWatchPct: 86,
      longFormTitle: "I Built an Autonomous AI Media Studio on a $0 Stack (Full 14-Min Architecture)",
      targetDurationMin: 14,
      estLongFormRpmUsd: 14.8,
      chapters: [
        "00:00 Hook & Live Revenue Proof from 30 Days of Shorts",
        "02:15 Local Windows PC LLM vs. Cloud Gemini Cost Breakdown",
        "06:30 Automating Research, Hooks & B-Roll Alignment",
        "10:15 Sponsor Mid-Roll Integration + Email Funnel Walkthrough",
        "12:40 GitHub + Cloudflare Free Deployment Blueprint",
      ],
      sponsorSlotNote: "90-second mid-roll at 06:15 ($2,400 flat + $45 CPA affiliate code)",
      status: "scripting",
      createdAt: nowIso,
    },
    {
      id: "lf_seed_2",
      sourceShortTitle: "Creator Economy RPM Breakdown",
      niche: "finance",
      shortViews: 128000,
      shortWatchPct: 82,
      longFormTitle: "Shorts vs. Long-Form Math: How 1 Viral Clip Feeds a $10K/mo Email Funnel",
      targetDurationMin: 11,
      estLongFormRpmUsd: 18.2,
      chapters: [
        "00:00 Why Pure Shorts AdSense Caps Out Early",
        "02:40 Pinned Comment -> Email Landing Page Conversion Data",
        "05:50 A/B Testing Mid-Roll vs. Outro CTAs Across 50 Clips",
        "08:45 Graduating Winning Shorts into Evergreen YouTube Deep-Dives",
      ],
      sponsorSlotNote: "Dedicated fintech integration + pinned calculator landing page",
      status: "queued",
      createdAt: nowIso,
    },
  ];
}

export function buildSeedRemoteBridge(): RemoteBridgeConfig {
  const nowIso = new Date().toISOString();
  return {
    discordEnabled: true,
    telegramEnabled: true,
    whatsappEnabled: false,
    discordChannelName: "#ai-director-alerts",
    alertOnMissionSuccess: true,
    alertOnRevenueSurge: true,
    roiSurgeThresholdPct: 15,
    alertOnCompetitorRelease: true,
    alertOnSponsorBurnRate: true,
    alertOnApprovalGates: true,
    discordMentionMode: "none",
    discordMentionRole: "@RevenueOps",
    discordRichEmbeds: true,
    dailyDigestTime: "09:00",
    envConfigured: getRemoteEnvStatus(),
    commandHistory: [
      {
        id: "rb_seed_1",
        platform: "discord",
        direction: "outbound-alert",
        commandOrEvent: "ROI_SURGE_ALERT (#ai-director-alerts · +22% Finance ROI)",
        responseSummary: "Queued alert for #ai-director-alerts with 1-click /shift-focus command.",
        status: "simulated-local",
        timestamp: nowIso,
      },
      {
        id: "rb_seed_2",
        platform: "telegram",
        direction: "inbound-command",
        commandOrEvent: "/status",
        responseSummary: "Active fleet: 6 clips · 2 active +15% ROI alerts · AI Tier: Cloud Standard.",
        status: "simulated-local",
        timestamp: nowIso,
      },
    ],
  };
}

export function registerGrowthSuiteRoutes(app: Express, deps: SuiteRouteDeps): void {
  // =========================================================================
  // A. COMPETITOR GAP SCANNER (OPPORTUNITY DISCOVERY + AUTO-DRAFT CARDS)
  // =========================================================================
  app.post("/api/ingest/opportunity-discovery/competitor-gap", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add your key in Settings > Secrets to run Competitor Gap Google Search.",
      });
      return;
    }

    const rawNiche = String(req.body?.niche || "all");
    const validNiches = new Set(["all", "gaming", "podcasts", "tech-ai", "finance", "sports-irl", "faceless-doc"]);
    const focusNiche = (validNiches.has(rawNiche) ? rawNiche : "all") as ContentNiche | "all";
    const rawFreshness = String(req.body?.freshness || "7d");
    const freshness: OpportunityGapFreshness =
      rawFreshness === "24h" || rawFreshness === "30d" ? rawFreshness : "7d";
    const customQuery = String(req.body?.customQuery || "").trim().slice(0, 180);

    const rawChannels: string[] = Array.isArray(req.body?.competitorChannels)
      ? req.body.competitorChannels
          .map((c: unknown) => String(c || "").trim())
          .filter(Boolean)
          .slice(0, 8)
      : ["@Fireship", "@MKBHD", "@TheAIAdvantage", "@GrahamStephan", "@AliAbdaal"];

    const competitorChannels =
      rawChannels.length > 0
        ? rawChannels
        : ["@Fireship", "@MKBHD", "@TheAIAdvantage", "@GrahamStephan"];

    const existingTitles = state.clips.map((c) => c.title).slice(0, 20).join("; ");

    const prompt = [
      `You are ClipForge Competitor Gap Intelligence.`,
      `Use live Google Search to audit these top-performing competitor channels: ${competitorChannels.join(", ")}.`,
      `Focus niche: ${focusNiche === "all" ? "AI/Tech, Finance, Gaming, Podcasts, Faceless Docs" : focusNiche}.`,
      `Freshness window: last ${freshness}.`,
      customQuery ? `Custom angle: "${customQuery}".` : "",
      `Our own clip library already covers: ${existingTitles || "standard viral highlights"}.`,
      ``,
      `TASK: Identify 4 SPECIFIC video formats or high-RPM sub-niche topics that these top competitor channels HAVE NOT YET COVERED despite surging audience demand in comments, X/Twitter, Reddit, and search.`,
      `Return ONLY valid JSON (no markdown fences):`,
      `{`,
      `  "topics": [`,
      `    {`,
      `      "topic": "Specific uncovered competitor-gap video title (max 78 chars)",`,
      `      "niche": "tech-ai" | "finance" | "gaming" | "podcasts" | "sports-irl" | "faceless-doc",`,
      `      "subCategory": "Missing format or sub-niche label",`,
      `      "competitorChannel": "@ChannelName audited",`,
      `      "competitorBlindspot": "Specific format or monetizable sub-topic this competitor missed",`,
      `      "demandVelocity": "exploding" | "rising" | "steady",`,
      `      "searchTrendSignal": "Concrete evidence from Google Search / social discussions",`,
      `      "whyUncovered": "Why neither competitors nor our current library cover this angle",`,
      `      "suggestedHook": "Sharp 3-second opening hook",`,
      `      "angleBrief": "2-sentence vertical format & monetization CTA blueprint (affiliate / email capture)",`,
      `      "recommendedFormat": "split-screen" | "faceless-narration" | "podcast-split" | "authority-breakdown",`,
      `      "estimatedRpmUsd": 5.4`,
      `    }`,
      `  ]`,
      `}`,
    ]
      .filter(Boolean)
      .join("\n");

    const model = "gemini-4-hydrogen";
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const parsed = parseLooseJsonObject(response.text ?? "") as {
        topics?: Array<Partial<OpportunityGapTopic>>;
      };

      const groundingMeta = response.candidates?.[0]?.groundingMetadata;
      const sources: TrendPulseSource[] = [];
      const seenUris = new Set<string>();
      for (const chunk of groundingMeta?.groundingChunks || []) {
        const uri = chunk.web?.uri;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({ title: chunk.web?.title || uri, uri });
        }
      }
      const searchQueries: string[] = Array.isArray(groundingMeta?.webSearchQueries)
        ? groundingMeta.webSearchQueries.filter((q): q is string => typeof q === "string")
        : [];

      const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
      if (rawTopics.length === 0) {
        throw new Error("Competitor Gap scan returned no structured gaps. Try adding specific competitor handles.");
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
      const compTopics: OpportunityGapTopic[] = rawTopics.slice(0, 5).map((item, idx) => {
        const itemNiche: ContentNiche = validItemNiches.has(item.niche as ContentNiche)
          ? (item.niche as ContentNiche)
          : focusNiche === "all"
            ? "tech-ai"
            : focusNiche;
        const format = validFormats.has(item.recommendedFormat as OpportunityGapTopic["recommendedFormat"])
          ? (item.recommendedFormat as OpportunityGapTopic["recommendedFormat"])
          : "authority-breakdown";
        const citation = sources[idx % Math.max(1, sources.length)];
        const topicTitle = String(item.topic || `Competitor Blindspot #${idx + 1}`).trim().slice(0, 110);
        const compName = String(
          item.competitorChannel || competitorChannels[idx % competitorChannels.length]
        ).trim();

        return {
          id: `compgap_${Date.now().toString(36)}_${idx}`,
          topic: topicTitle,
          niche: itemNiche,
          subCategory: String(item.subCategory || "Competitor Format Gap").trim().slice(0, 48),
          gapType: "competitor-gap",
          competitorChannel: compName,
          competitorBlindspot: String(
            item.competitorBlindspot ||
              `${compName} covered high-level news but omitted actionable vertical tutorials & monetization breakdowns.`
          ).trim(),
          autoDraftedToOpportunities: true,
          savedToResearch: true,
          demandVelocity:
            item.demandVelocity === "exploding" || item.demandVelocity === "steady"
              ? item.demandVelocity
              : "exploding",
          searchTrendSignal: String(
            item.searchTrendSignal || "Strong viewer demand detected across search and creator comments."
          ).trim(),
          whyUncovered: String(
            item.whyUncovered || `Neither ${compName} nor our library has produced this format.`
          ).trim(),
          suggestedHook: String(
            item.suggestedHook || `${compName} missed the most profitable part of ${topicTitle}.`
          ).trim(),
          angleBrief: String(
            item.angleBrief ||
              "Open with the blindspot reveal, walk through the step-by-step fix, and bridge viewers to an affiliate/email lead magnet."
          ).trim(),
          recommendedFormat: format,
          estimatedRpmUsd: Math.max(1.2, Math.min(20, Number(Number(item.estimatedRpmUsd || 5.2).toFixed(2)))),
          noveltyPct: 95,
          sourceTitle: citation?.title || `${compName} Gap Audit`,
          sourceUrl: citation?.uri,
          discoveredAt: nowIso,
        };
      });

      // Automatically draft every discovered Competitor Gap as a new 'Opportunity' card in researchOpportunities
      const templateMap: Record<
        OpportunityGapTopic["recommendedFormat"],
        "split-stack" | "blurred-backdrop" | "dual-cam"
      > = {
        "split-screen": "split-stack",
        "faceless-narration": "blurred-backdrop",
        "podcast-split": "dual-cam",
        "authority-breakdown": "blurred-backdrop",
      };

      const existingOpps = state.researchOpportunities || [];
      const newDraftedOpps: ResearchOpportunity[] = [];
      for (const t of compTopics) {
        if (!existingOpps.some((e) => e.topic.toLowerCase() === t.topic.toLowerCase())) {
          newDraftedOpps.push({
            id: `opp_comp_${Date.now().toString(36)}_${newDraftedOpps.length}`,
            niche: t.niche,
            topic: t.topic,
            source: `Competitor Gap · ${t.competitorChannel || "Top Rivals"}`,
            estimatedRpmUsd: t.estimatedRpmUsd,
            competitionLevel: "low",
            viralScore: t.demandVelocity === "exploding" ? 95 : 89,
            outlierMultiplier: 4.9,
            whyNow: `${t.competitorBlindspot} — ${t.searchTrendSignal}`,
            hookBlueprint: t.suggestedHook,
            recommendedVoice: t.niche === "finance" || t.niche === "tech-ai" ? "Charon" : "Zephyr",
            recommendedTemplate: templateMap[t.recommendedFormat],
            suggestedScript: `${t.suggestedHook} ${t.angleBrief}`,
            origin: "manual-research",
            newsletterOrFeed: `Competitor Gap (${t.competitorChannel})`,
            sourceUrl: t.sourceUrl,
            crawledAt: nowIso,
          });
        }
      }

      state.researchOpportunities = [...newDraftedOpps, ...existingOpps].slice(0, 36);

      const prevTopics = (state.opportunityDiscovery?.topics || []).filter(
        (t) => t.gapType !== "competitor-gap"
      );

      const snapshot: OpportunityDiscoverySnapshot = {
        lastScannedAt: nowIso,
        focusNiche,
        freshness,
        scanMode: "competitor-gap",
        competitorChannelsAudited: competitorChannels,
        customQuery: customQuery || undefined,
        modelUsed: model,
        libraryClipCountAudited: state.clips.length,
        excludedCoveredTopics: state.opportunityDiscovery?.excludedCoveredTopics || [],
        topics: [...compTopics, ...prevTopics].slice(0, 12),
        sources: sources.slice(0, 10),
        searchQueries: searchQueries.slice(0, 8),
      };

      state.opportunityDiscovery = snapshot;
      recordCreditUsage(state, {
        tier: "cloud-standard",
        feature: "Competitor Gap Scan (Google Search)",
        model,
        creditsUsed: 5,
        estUsdCost: 0.005,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ingest/opportunity-discovery/competitor-gap",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({
        opportunityDiscovery: snapshot,
        researchOpportunities: state.researchOpportunities,
        autoDraftedCount: newDraftedOpps.length,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      const msg = deps.formatApiError(err, "Competitor Gap Google Search scan failed.");
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ingest/opportunity-discovery/competitor-gap",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: msg });
    }
  });

  // =========================================================================
  // B. COMPETITIVE NICHE ALERTS & RAPID-RESPONSE CLIPPING MISSION
  // =========================================================================
  app.post("/api/performance/competitive-alerts/scan", async (req: Request, res: Response) => {
    const t0 = Date.now();
    const state = deps.readWorkspace();
    const ai = deps.getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add your key in Settings > Secrets to scan competitor releases.",
      });
      return;
    }

    const focusNiche = String(req.body?.niche || "all");
    const model = "gemini-4-hydrogen";
    const prompt = [
      `Use Google Search to identify 3 recent breakout videos (last 72 hours) released by major YouTube/TikTok/X creators in under-monetized sub-niches (${focusNiche === "all" ? "AI/Tech, Finance, Gaming, Podcasts" : focusNiche}).`,
      `Focus on videos getting strong views where the creator left affiliate links, email capture, or high-RPM sponsorship angles unmonetized.`,
      `Return ONLY valid JSON:`,
      `{`,
      `  "alerts": [`,
      `    {`,
      `      "competitorChannel": "@Channel",`,
      `      "videoTitle": "Recent competitor video title",`,
      `      "niche": "tech-ai" | "finance" | "gaming" | "podcasts" | "sports-irl" | "faceless-doc",`,
      `      "subNiche": "Under-monetized sub-niche",`,
      `      "publishedAgoLabel": "6h ago",`,
      `      "observedViews": 185000,`,
      `      "monetizationGapReason": "Why this sub-niche release is under-monetized",`,
      `      "estimatedUpsideRpmUsd": 6.8,`,
      `      "rapidResponseAngle": "How our rapid-response clipping mission captures this demand & monetizes it",`,
      `      "suggestedHook": "Opening 3s hook for our rapid-response short"`,
      `    }`,
      `  ]`,
      `}`,
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const parsed = parseLooseJsonObject(response.text ?? "") as {
        alerts?: Array<Partial<CompetitiveNicheAlert>>;
      };
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const rawAlerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
      if (rawAlerts.length === 0) {
        throw new Error("Competitor release scan returned no structured alerts.");
      }

      const validNiches = new Set<ContentNiche>([
        "gaming",
        "podcasts",
        "tech-ai",
        "finance",
        "sports-irl",
        "faceless-doc",
      ]);
      const nowIso = new Date().toISOString();
      const fresh: CompetitiveNicheAlert[] = rawAlerts.slice(0, 4).map((a, idx) => ({
        id: `calert_${Date.now().toString(36)}_${idx}`,
        competitorChannel: String(a.competitorChannel || "@TopRival").trim(),
        videoTitle: String(a.videoTitle || "Breakout Sub-Niche Release").trim(),
        videoUrl: groundingChunks[idx]?.web?.uri,
        niche: validNiches.has(a.niche as ContentNiche) ? (a.niche as ContentNiche) : "tech-ai",
        subNiche: String(a.subNiche || "Under-Monetized Sub-Niche").trim(),
        publishedAgoLabel: String(a.publishedAgoLabel || "Today").trim(),
        observedViews: Math.max(12000, Math.round(Number(a.observedViews || 120000))),
        monetizationGapReason: String(
          a.monetizationGapReason || "High search intent with minimal sponsor/affiliate monetization."
        ).trim(),
        estimatedUpsideRpmUsd: Math.max(1.5, Math.min(20, Number(Number(a.estimatedUpsideRpmUsd || 6.2).toFixed(2)))),
        rapidResponseAngle: String(
          a.rapidResponseAngle || "Publish a rapid-response breakdown short with pinned affiliate + email lead magnet."
        ).trim(),
        suggestedHook: String(a.suggestedHook || "Everyone saw this video — here is the part they missed.").trim(),
        status: "active",
        detectedAt: nowIso,
      }));

      const prev = (state.competitiveAlerts || []).filter((x) => x.status !== "active");
      state.competitiveAlerts = [...fresh, ...prev].slice(0, 12);
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/performance/competitive-alerts/scan",
        latencyMs: Date.now() - t0,
        success: true,
        model,
      });
      deps.saveWorkspace(state);

      res.json({ competitiveAlerts: state.competitiveAlerts });
    } catch (err) {
      const msg = deps.formatApiError(err, "Competitor release alert scan failed.");
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/performance/competitive-alerts/scan",
        latencyMs: Date.now() - t0,
        success: false,
        model,
      });
      deps.saveWorkspace(state);
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/performance/competitive-alerts/:id/launch-mission", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const alerts = state.competitiveAlerts || buildSeedCompetitiveAlerts();
    const target = alerts.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Competitive niche alert not found." });
      return;
    }

    const nowIso = new Date().toISOString();
    const missionId = `msn_rapid_${Date.now().toString(36)}`;
    const rapidMission: AutonomousMission = {
      id: missionId,
      prompt: `Rapid-Response Clipping Mission: Counter "${target.videoTitle}" by ${target.competitorChannel} in under-monetized sub-niche "${target.subNiche}" (${target.rapidResponseAngle})`,
      nicheFocus: target.subNiche,
      autonomyMode: "approval-gates",
      scheduleCadence: "manual",
      createdAt: nowIso,
      updatedAt: nowIso,
      status: "awaiting-approval",
      currentStageIndex: 1,
      selectedIdeaId: "idea_rapid_1",
      ideas: [
        {
          id: "idea_rapid_1",
          rank: 1,
          title: `Counter-Angle: ${target.subNiche} Breakdown`,
          niche: target.niche,
          gameOrTopic: target.subNiche,
          outlierScore: 95,
          estRpmUsd: target.estimatedUpsideRpmUsd,
          hookVariantA: target.suggestedHook,
          hookVariantB: `${target.competitorChannel} missed the highest-RPM angle in ${target.subNiche}.`,
          angle: target.rapidResponseAngle,
          recommendedTemplate: "blurred-backdrop",
          sourceSignal: `${target.competitorChannel} (${target.publishedAgoLabel}, ${target.observedViews.toLocaleString()} views)`,
        },
        {
          id: "idea_rapid_2",
          rank: 2,
          title: `3-Step Monetization Fix for ${target.subNiche}`,
          niche: target.niche,
          gameOrTopic: target.subNiche,
          outlierScore: 91,
          estRpmUsd: Number((target.estimatedUpsideRpmUsd * 1.15).toFixed(2)),
          hookVariantA: `Before you copy ${target.competitorChannel}, see why this hidden angle earns 4x more.`,
          hookVariantB: `The exact affiliate + email funnel ${target.competitorChannel} left off screen.`,
          angle: "Attach pinned email capture landing page + affiliate partner bridge CTA.",
          recommendedTemplate: "hud-zoom",
          sourceSignal: "Comment & search demand gap directly under rival release",
        },
      ],
      stages: [
        {
          id: "research",
          order: 1,
          label: "Competitor Dissection",
          shortLabel: "Research",
          description: "Analyze rival video & monetization gap",
          requiresApproval: false,
          status: "completed",
          completedAt: nowIso,
          summary: `Audited ${target.competitorChannel} ("${target.videoTitle}") — verified $${target.estimatedUpsideRpmUsd}/1K RPM monetization gap.`,
        },
        {
          id: "select",
          order: 2,
          label: "Rapid Clip Selection",
          shortLabel: "Select",
          description: "Approve counter-hook script & vertical draft",
          requiresApproval: true,
          status: "awaiting-approval",
          summary: `Ready to build rapid-response short: "${target.suggestedHook}"`,
        },
        {
          id: "edit",
          order: 3,
          label: "Vertical Edit & B-Roll Align",
          shortLabel: "Edit",
          description: "Apply visual B-roll alignment & pacing cuts",
          requiresApproval: false,
          status: "pending",
        },
        {
          id: "audio",
          order: 4,
          label: "Broadcast -14 LUFS Audio",
          shortLabel: "Audio",
          description: "Generate narration & normalize loudness",
          requiresApproval: false,
          status: "pending",
        },
        {
          id: "translate",
          order: 5,
          label: "Multi-Language & Captions",
          shortLabel: "Translate",
          description: "Localize top hook for global CPM arbitrage",
          requiresApproval: false,
          status: "pending",
        },
        {
          id: "review",
          order: 6,
          label: "Retention & Funnel QA",
          shortLabel: "Review",
          description: "Verify affiliate CTA + email landing link",
          requiresApproval: true,
          status: "pending",
        },
        {
          id: "publish",
          order: 7,
          label: "Multi-Channel Publish",
          shortLabel: "Publish",
          description: "Dispatch across Shorts, Reels, TikTok, X",
          requiresApproval: true,
          status: "pending",
        },
        {
          id: "learn",
          order: 8,
          label: "Track ROI & Graduate to Long-Form",
          shortLabel: "Learn",
          description: "Monitor 24h velocity & feed long-form queue",
          requiresApproval: false,
          status: "pending",
        },
      ],
      learnedUpdates: [target.monetizationGapReason],
      sources: target.videoUrl ? [{ title: target.videoTitle, uri: target.videoUrl }] : [],
    };

    target.status = "mission-launched";
    target.launchedMissionId = missionId;
    state.competitiveAlerts = alerts;
    state.activeMission = rapidMission;
    state.missionHistory = [rapidMission, ...(state.missionHistory || [])].slice(0, 10);

    // Log outbound alert on Remote Bridge if enabled
    const bridge = state.remoteBridge || buildSeedRemoteBridge();
    if (bridge.alertOnCompetitorRelease) {
      const alertPlatform: RemoteMessagingPlatform = bridge.discordEnabled
        ? "discord"
        : bridge.telegramEnabled
          ? "telegram"
          : "whatsapp";
      bridge.commandHistory = [
        {
          id: `rb_${Date.now().toString(36)}`,
          platform: alertPlatform,
          direction: "outbound-alert" as const,
          commandOrEvent: `RAPID_MISSION_LAUNCHED (${target.competitorChannel})`,
          responseSummary: `Initiated rapid-response mission for "${target.subNiche}" (Est. $${target.estimatedUpsideRpmUsd} RPM).`,
          status: "simulated-local" as const,
          timestamp: nowIso,
        },
        ...bridge.commandHistory,
      ].slice(0, 25);
      state.remoteBridge = bridge;
    }

    deps.saveWorkspace(state);
    res.json({
      competitiveAlerts: state.competitiveAlerts,
      activeMission: state.activeMission,
      remoteBridge: state.remoteBridge,
      summary: `Rapid-Response Clipping Mission launched against ${target.competitorChannel} (${target.subNiche}).`,
    });
  });

  app.patch("/api/performance/competitive-alerts/:id", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const alerts = state.competitiveAlerts || buildSeedCompetitiveAlerts();
    const target = alerts.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Competitive niche alert not found." });
      return;
    }
    if (req.body?.status === "dismissed" || req.body?.status === "active") {
      target.status = req.body.status;
    }
    state.competitiveAlerts = alerts;
    deps.saveWorkspace(state);
    res.json({ competitiveAlerts: alerts });
  });

  // =========================================================================
  // C. AFFILIATE LINKS, EMAIL LANDING PAGES & SHORT -> LONG-FORM GRADUATION
  // =========================================================================
  app.post("/api/monetization/affiliates", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const partnerName = String(req.body?.partnerName || "").trim().slice(0, 80);
    const destinationUrl = String(req.body?.destinationUrl || "").trim().slice(0, 260);
    if (!partnerName || !isSafeHttpsUrl(destinationUrl)) {
      res.status(400).json({ error: "Provide a partner name and a valid https:// destination URL." });
      return;
    }
    const validNiches = new Set<ContentNiche>([
      "gaming", "podcasts", "tech-ai", "finance", "sports-irl", "faceless-doc",
    ]);
    const niche: ContentNiche = validNiches.has(req.body?.niche) ? req.body.niche : "tech-ai";
    const offer: AffiliateOfferLink = {
      id: `aff_${Date.now().toString(36)}`,
      partnerName,
      niche,
      offerHook: String(req.body?.offerHook || "Exclusive creator partner discount").trim().slice(0, 140),
      destinationUrl,
      utmCode: String(req.body?.utmCode || `utm_source=shorts&utm_campaign=${partnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`).slice(0, 100),
      commissionPct: Math.max(1, Math.min(80, Number(req.body?.commissionPct || 20))),
      estEpcUsd: Math.max(0.1, Math.min(25, Number(req.body?.estEpcUsd || 1.4))),
      clicks30d: Math.max(0, Math.round(Number(req.body?.clicks30d || 0))),
      conversions30d: Math.max(0, Math.round(Number(req.body?.conversions30d || 0))),
      status: "active",
    };
    const list = state.affiliateOffers || buildSeedAffiliateOffers();
    state.affiliateOffers = [offer, ...list];
    deps.saveWorkspace(state);
    res.status(201).json({ affiliateOffers: state.affiliateOffers });
  });

  app.delete("/api/monetization/affiliates/:id", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const list = state.affiliateOffers || buildSeedAffiliateOffers();
    state.affiliateOffers = list.filter((o) => o.id !== req.params.id);
    deps.saveWorkspace(state);
    res.json({ affiliateOffers: state.affiliateOffers });
  });

  app.post("/api/monetization/landing-pages", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const headline = String(req.body?.headline || "").trim().slice(0, 120);
    const leadMagnetTitle = String(req.body?.leadMagnetTitle || "").trim().slice(0, 140);
    if (!headline || !leadMagnetTitle) {
      res.status(400).json({ error: "Headline and Lead Magnet Title are required." });
      return;
    }
    const rawSlug = String(req.body?.slug || headline)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

    const validNiches = new Set<ContentNiche>([
      "gaming", "podcasts", "tech-ai", "finance", "sports-irl", "faceless-doc",
    ]);
    const page: EmailCaptureLandingPage = {
      id: `lp_${Date.now().toString(36)}`,
      slug: `/${rawSlug || "offer"}`,
      headline,
      leadMagnetTitle,
      subheadline: String(
        req.body?.subheadline ||
          "Enter your email to receive the free download + curated affiliate partner links."
      ).trim().slice(0, 220),
      ctaButtonText: String(req.body?.ctaButtonText || "Get Free Access").trim().slice(0, 40),
      linkedAffiliateId: req.body?.linkedAffiliateId ? String(req.body.linkedAffiliateId) : undefined,
      niche: validNiches.has(req.body?.niche) ? req.body.niche : "tech-ai",
      visitors30d: 0,
      subscribers30d: 0,
      affiliateClicksFromEmail: 0,
      revenueAttributedUsd: 0,
      active: true,
    };
    const pages = state.emailLandingPages || buildSeedEmailLandingPages();
    state.emailLandingPages = [page, ...pages];
    deps.saveWorkspace(state);
    res.status(201).json({ emailLandingPages: state.emailLandingPages });
  });

  app.post("/api/monetization/long-form/graduate", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const clipId = String(req.body?.clipId || "").trim();
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip) {
      res.status(404).json({ error: "Source short clip not found." });
      return;
    }
    const existing = state.longFormPipeline || buildSeedLongFormPipeline();
    const shortViews =
      (clip.publishedMetrics?.tiktokViews || 0) +
        (clip.publishedMetrics?.reelsViews || 0) +
        (clip.publishedMetrics?.shortsViews || 0) || clip.views;
    const item: LongFormGraduationItem = {
      id: `lf_${Date.now().toString(36)}`,
      sourceClipId: clip.id,
      sourceShortTitle: clip.title,
      niche: clip.niche || "tech-ai",
      shortViews,
      shortWatchPct: clip.publishedMetrics?.avgWatchPercent || 81,
      longFormTitle: `Deep-Dive Blueprint: ${clip.title} (Full Step-by-Step Breakdown)`,
      targetDurationMin: 12,
      estLongFormRpmUsd: clip.niche === "finance" ? 17.5 : clip.niche === "tech-ai" ? 14.2 : 8.6,
      chapters: [
        `00:00 Viral Proof & Why "${clip.title}" Took Off`,
        "02:10 Full Context & Behind-the-Scenes Walkthrough",
        "05:45 Live Demo + Mid-Roll Sponsor / Affiliate Offer",
        "09:20 Common Mistakes & Pinned Email Kit Next Steps",
      ],
      sponsorSlotNote: "60–90s mid-roll integration + pinned email capture funnel in description",
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    state.longFormPipeline = [item, ...existing].slice(0, 20);
    deps.saveWorkspace(state);
    res.status(201).json({ longFormPipeline: state.longFormPipeline });
  });

  app.patch("/api/monetization/long-form/:id", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const id = String(req.params.id || "").trim();
    const list = state.longFormPipeline || buildSeedLongFormPipeline();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Long-form blueprint not found." });
      return;
    }
    const current = { ...list[idx] };
    const validStatuses = new Set<LongFormGraduationItem["status"]>([
      "queued",
      "scripting",
      "in-production",
      "published",
    ]);
    if (req.body?.status !== undefined) {
      if (typeof req.body.status !== "string" || !validStatuses.has(req.body.status as LongFormGraduationItem["status"])) {
        res.status(400).json({ error: "Invalid long-form production status." });
        return;
      }
      current.status = req.body.status as LongFormGraduationItem["status"];
    }
    if (typeof req.body?.longFormTitle === "string" && req.body.longFormTitle.trim()) {
      current.longFormTitle = req.body.longFormTitle.trim().slice(0, 200);
    }
    if (req.body?.targetDurationMin !== undefined) {
      const mins = Number(req.body.targetDurationMin);
      if (Number.isFinite(mins)) {
        current.targetDurationMin = Math.max(4, Math.min(60, Math.round(mins)));
      }
    }
    if (req.body?.estLongFormRpmUsd !== undefined) {
      const rpm = Number(req.body.estLongFormRpmUsd);
      if (Number.isFinite(rpm)) {
        current.estLongFormRpmUsd = Number(Math.max(1, Math.min(120, rpm)).toFixed(2));
      }
    }
    if (typeof req.body?.sponsorSlotNote === "string") {
      current.sponsorSlotNote = req.body.sponsorSlotNote.trim().slice(0, 240);
    }
    if (Array.isArray(req.body?.chapters)) {
      const cleaned = req.body.chapters
        .map((c: unknown) => String(c || "").trim().slice(0, 140))
        .filter(Boolean)
        .slice(0, 16);
      if (cleaned.length > 0) {
        current.chapters = cleaned;
      }
    }
    const nextList = [...list];
    nextList[idx] = current;
    state.longFormPipeline = nextList;
    deps.saveWorkspace(state);
    res.json({ item: current, longFormPipeline: state.longFormPipeline });
  });

  app.delete("/api/monetization/long-form/:id", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const id = String(req.params.id || "").trim();
    const list = state.longFormPipeline || buildSeedLongFormPipeline();
    if (!list.some((item) => item.id === id)) {
      res.status(404).json({ error: "Long-form blueprint not found." });
      return;
    }
    state.longFormPipeline = list.filter((item) => item.id !== id);
    deps.saveWorkspace(state);
    res.json({ longFormPipeline: state.longFormPipeline });
  });

  // =========================================================================
  // D. DISCORD / TELEGRAM / WHATSAPP REMOTE CONTROL & ALERTS BRIDGE
  // =========================================================================
  app.patch("/api/remote-bridge/config", (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const current = state.remoteBridge || buildSeedRemoteBridge();
    if (typeof req.body?.discordEnabled === "boolean") current.discordEnabled = req.body.discordEnabled;
    if (typeof req.body?.telegramEnabled === "boolean") current.telegramEnabled = req.body.telegramEnabled;
    if (typeof req.body?.whatsappEnabled === "boolean") current.whatsappEnabled = req.body.whatsappEnabled;
    if (typeof req.body?.discordChannelName === "string") {
      const cleaned = req.body.discordChannelName
        .trim()
        .replace(/^#+/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 44);
      current.discordChannelName = cleaned ? `#${cleaned.toLowerCase()}` : "#ai-director-alerts";
    }
    if (typeof req.body?.alertOnMissionSuccess === "boolean") {
      current.alertOnMissionSuccess = req.body.alertOnMissionSuccess;
    }
    if (typeof req.body?.alertOnRevenueSurge === "boolean") current.alertOnRevenueSurge = req.body.alertOnRevenueSurge;
    if (req.body?.roiSurgeThresholdPct !== undefined) {
      const rawThreshold = Number(req.body.roiSurgeThresholdPct);
      if (Number.isFinite(rawThreshold)) {
        current.roiSurgeThresholdPct = Math.max(5, Math.min(100, Math.round(rawThreshold)));
      }
    }
    if (typeof req.body?.alertOnCompetitorRelease === "boolean") {
      current.alertOnCompetitorRelease = req.body.alertOnCompetitorRelease;
    }
    if (typeof req.body?.alertOnSponsorBurnRate === "boolean") {
      current.alertOnSponsorBurnRate = req.body.alertOnSponsorBurnRate;
    }
    if (typeof req.body?.alertOnApprovalGates === "boolean") {
      current.alertOnApprovalGates = req.body.alertOnApprovalGates;
    }
    if (
      req.body?.discordMentionMode === "none" ||
      req.body?.discordMentionMode === "here" ||
      req.body?.discordMentionMode === "role"
    ) {
      current.discordMentionMode = req.body.discordMentionMode;
    }
    if (typeof req.body?.discordMentionRole === "string") {
      const cleanedRole = req.body.discordMentionRole.trim().replace(/[^\w@ -]/g, "").slice(0, 36);
      current.discordMentionRole = cleanedRole || "@RevenueOps";
    }
    if (typeof req.body?.discordRichEmbeds === "boolean") {
      current.discordRichEmbeds = req.body.discordRichEmbeds;
    }
    if (typeof req.body?.dailyDigestTime === "string" && /^\d{2}:\d{2}$/.test(req.body.dailyDigestTime)) {
      current.dailyDigestTime = req.body.dailyDigestTime;
    }
    current.envConfigured = getRemoteEnvStatus();
    state.remoteBridge = current;
    deps.saveWorkspace(state);
    res.json({ remoteBridge: current });
  });

  app.post("/api/remote-bridge/dispatch-alert", async (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const bridge = state.remoteBridge || buildSeedRemoteBridge();
    const alertType = req.body?.alertType === "mission-success" ? "mission-success" : "roi-surge";
    const customNote = String(req.body?.customNote || "").trim().slice(0, 180);
    const channel = bridge.discordChannelName || "#ai-director-alerts";
    const threshold = bridge.roiSurgeThresholdPct ?? 15;

    if (!bridge.discordEnabled) {
      res.status(400).json({ error: "Discord Remote Bridge is disabled. Enable Discord alerts first." });
      return;
    }

    const mentionPrefix =
      bridge.discordMentionMode === "here"
        ? "@here "
        : bridge.discordMentionMode === "role" && bridge.discordMentionRole
          ? `${bridge.discordMentionRole} `
          : "";

    let eventTitle = "";
    let summaryText = "";
    let embedColor = 0x16a34a;

    if (alertType === "mission-success") {
      const mission = state.activeMission;
      const completedStages = mission
        ? mission.stages.filter((s) => s.status === "completed").length
        : 12;
      const totalStages = mission ? mission.stages.length : 12;
      const selectedIdea =
        mission?.ideas.find((i) => i.id === mission.selectedIdeaId)?.title ||
        state.clips[0]?.title ||
        "Autonomous High-ROI Short-Form Batch";
      eventTitle = `MISSION_SUCCESS (${channel})`;
      summaryText = `AI Director completed "${selectedIdea}" (${completedStages}/${totalStages} stages · ${state.clips.length} clips in fleet).${
        customNote ? ` Note: ${customNote}` : ""
      }`;
      embedColor = 0x16a34a;
    } else {
      const topAlert =
        (state.revenueAlerts || []).find((a) => a.status === "active") ||
        (state.revenueAlerts || [])[0];
      const liftPct = topAlert ? topAlert.roiIncreasePct : Math.max(threshold, 18);
      const label = topAlert ? topAlert.label : "AI & Tech Workflow Breakdowns";
      const monthlyDelta = topAlert ? topAlert.projectedMonthlyDeltaUsd : 1420;
      const directive =
        topAlert?.directorSuggestion ||
        "Shift daily clip cadence toward high-converting mid-roll CTA + email bridge funnels.";
      eventTitle = `ROI_SURGE_ALERT (${channel} · +${liftPct}%)`;
      summaryText = `${label} surged +${liftPct}% ROI (threshold >= +${threshold}%, +$${monthlyDelta.toLocaleString()}/mo projected). AI Director: ${directive}${
        customNote ? ` Note: ${customNote}` : ""
      }`;
      embedColor = 0xe1392b;
    }

    let deliveryStatus: "delivered" | "simulated-local" | "error" = "simulated-local";
    if (process.env.DISCORD_WEBHOOK_URL) {
      const hookUrl = process.env.DISCORD_WEBHOOK_URL.trim();
      if (isAllowedRemoteEndpoint(hookUrl)) {
        try {
          const payload =
            bridge.discordRichEmbeds !== false
              ? {
                  content: `${mentionPrefix}ClipForge AI Director Alert → ${channel}`,
                  embeds: [
                    {
                      title:
                        alertType === "mission-success"
                          ? `Mission Success — ${channel}`
                          : `ROI Surge Detected — ${channel}`,
                      description: summaryText,
                      color: embedColor,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }
              : {
                  content: `${mentionPrefix}**[${eventTitle}]** ${summaryText}`,
                };

          const resp = await fetch(hookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          deliveryStatus = resp.ok ? "delivered" : "error";
        } catch {
          deliveryStatus = "error";
        }
      }
    }

    const entry = {
      id: `rb_alert_${Date.now().toString(36)}`,
      platform: "discord" as const,
      direction: "outbound-alert" as const,
      commandOrEvent: eventTitle,
      responseSummary: summaryText,
      status: deliveryStatus,
      timestamp: new Date().toISOString(),
    };

    bridge.envConfigured = getRemoteEnvStatus();
    bridge.commandHistory = [entry, ...(bridge.commandHistory || [])].slice(0, 30);
    state.remoteBridge = bridge;
    deps.saveWorkspace(state);

    res.json({
      remoteBridge: bridge,
      entry,
      deliveryStatus,
    });
  });

  app.post("/api/remote-bridge/command", async (req: Request, res: Response) => {
    const state = deps.readWorkspace();
    const bridge = state.remoteBridge || buildSeedRemoteBridge();
    const platform: RemoteMessagingPlatform =
      req.body?.platform === "telegram" || req.body?.platform === "whatsapp"
        ? req.body.platform
        : "discord";
    const rawCmd = String(req.body?.command || "/status").trim().slice(0, 120);
    const cmdLower = rawCmd.toLowerCase();

    let responseSummary = "";
    const activeRevAlerts = (state.revenueAlerts || []).filter((a) => a.status === "active").length;
    const activeCompAlerts = (state.competitiveAlerts || []).filter((a) => a.status === "active").length;
    const enabledStreams = (state.monetizationPlan?.streams || []).filter((s) => s.enabled);
    const monthlyCurrent = enabledStreams.reduce((s, st) => s + st.monthlyCurrentUsd, 0);
    const monthlyTarget = enabledStreams.reduce((s, st) => s + st.monthlyTargetUsd, 0);

    if (cmdLower.startsWith("/revenue")) {
      responseSummary = `Current run-rate: $${monthlyCurrent.toLocaleString()}/mo vs. $${monthlyTarget.toLocaleString()}/mo goal across ${enabledStreams.length} streams (${(state.affiliateOffers || []).length} active affiliate offers, ${(state.emailLandingPages || []).length} email landing pages).`;
    } else if (cmdLower.startsWith("/alerts")) {
      responseSummary = `${activeRevAlerts} Revenue Surge (+15% ROI) alert(s) and ${activeCompAlerts} Competitive Niche release alert(s) active.`;
    } else if (cmdLower.startsWith("/approve")) {
      const pending = state.clips.filter((c) => c.qaStatus === "pending");
      if (pending.length > 0) {
        pending[0].qaStatus = "approved";
        pending[0].publishStatus = "ready";
        responseSummary = `Approved "${pending[0].title}" and moved it to Ready-to-Publish queue.`;
      } else {
        responseSummary = "No pending QA clips waiting for approval right now.";
      }
    } else if (cmdLower.startsWith("/top10")) {
      const topOpps = (state.researchOpportunities || []).slice(0, 3).map((o) => o.topic).join(" | ");
      responseSummary = `Top queued opportunities: ${topOpps || "Run Opportunity Discovery to populate."}`;
    } else {
      responseSummary = `ClipForge Fleet OK: ${state.clips.length} clips · ${state.config.channelFleet.length} channels · ${activeRevAlerts + activeCompAlerts} active alerts · AI Tier: ${state.computeRouting?.activeTier || "cloud-standard"}.`;
    }

    // If real server-side Discord webhook is configured and platform is Discord, dispatch securely
    let deliveryStatus: "delivered" | "simulated-local" | "error" = "simulated-local";
    if (platform === "discord" && process.env.DISCORD_WEBHOOK_URL) {
      const hookUrl = process.env.DISCORD_WEBHOOK_URL.trim();
      if (isAllowedRemoteEndpoint(hookUrl)) {
        try {
          const resp = await fetch(hookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `**ClipForge Remote (${rawCmd})**\n${responseSummary}`,
            }),
          });
          deliveryStatus = resp.ok ? "delivered" : "error";
        } catch {
          deliveryStatus = "error";
        }
      }
    } else if (
      platform === "telegram" &&
      process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_CHAT_ID
    ) {
      const tgUrl = `https://api.telegram.org/bot${encodeURIComponent(process.env.TELEGRAM_BOT_TOKEN.trim())}/sendMessage`;
      if (isAllowedRemoteEndpoint(tgUrl)) {
        try {
          const resp = await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID.trim(),
              text: `ClipForge Remote (${rawCmd})\n${responseSummary}`,
            }),
          });
          deliveryStatus = resp.ok ? "delivered" : "error";
        } catch {
          deliveryStatus = "error";
        }
      }
    }

    bridge.envConfigured = getRemoteEnvStatus();
    bridge.commandHistory = [
      {
        id: `rb_${Date.now().toString(36)}`,
        platform,
        direction: "inbound-command" as const,
        commandOrEvent: rawCmd,
        responseSummary,
        status: deliveryStatus,
        timestamp: new Date().toISOString(),
      },
      ...bridge.commandHistory,
    ].slice(0, 30);

    state.remoteBridge = bridge;
    deps.saveWorkspace(state);
    res.json({
      remoteBridge: bridge,
      clips: state.clips,
      responseSummary,
      deliveryStatus,
    });
  });

  // =========================================================================
  // E. LIVE AFFILIATE & LANDING PAGE CONVERSION TRACKING
  // =========================================================================
  app.post("/api/monetization/affiliates/:id/track", (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const rawClicks = Number(req.body?.clicks ?? 10);
    const rawConv = Number(req.body?.conversions ?? 1);
    const addClicks = Math.max(0, Math.min(5000, Math.round(Number.isFinite(rawClicks) ? rawClicks : 0)));
    const addConversions = Math.max(0, Math.min(500, Math.round(Number.isFinite(rawConv) ? rawConv : 0)));
    const state = deps.readWorkspace();
    const offers = state.affiliateOffers || buildSeedAffiliateOffers();
    const target = offers.find((o) => o.id === id);
    if (!target) {
      res.status(404).json({ error: "Affiliate offer not found." });
      return;
    }
    target.clicks30d += addClicks;
    target.conversions30d += addConversions;
    state.affiliateOffers = offers;
    deps.saveWorkspace(state);
    res.json({ affiliateOffers: offers, updatedOffer: target });
  });

  app.patch("/api/monetization/landing-pages/:id", (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const state = deps.readWorkspace();
    const pages = state.emailLandingPages || buildSeedEmailLandingPages();
    const target = pages.find((p) => p.id === id);
    if (!target) {
      res.status(404).json({ error: "Landing page not found." });
      return;
    }
    if (typeof req.body?.active === "boolean") {
      target.active = req.body.active;
    }
    const rawVisitors = Number(req.body?.addVisitors ?? 0);
    const rawSubs = Number(req.body?.addSubscribers ?? 0);
    const rawAffClicks = Number(req.body?.addAffiliateClicks ?? 0);
    const addVisitors = Math.max(0, Math.min(5000, Math.round(Number.isFinite(rawVisitors) ? rawVisitors : 0)));
    const addSubscribers = Math.max(0, Math.min(2000, Math.round(Number.isFinite(rawSubs) ? rawSubs : 0)));
    const addAffClicks = Math.max(0, Math.min(2000, Math.round(Number.isFinite(rawAffClicks) ? rawAffClicks : 0)));
    if (addVisitors > 0 || addSubscribers > 0 || addAffClicks > 0) {
      target.visitors30d += addVisitors;
      target.subscribers30d += addSubscribers;
      target.affiliateClicksFromEmail += addAffClicks;
      const linkedOffer = (state.affiliateOffers || []).find((o) => o.id === target.linkedAffiliateId);
      const epc = linkedOffer ? linkedOffer.estEpcUsd : 1.75;
      target.revenueAttributedUsd = Math.round(target.revenueAttributedUsd + addAffClicks * epc);
    }
    state.emailLandingPages = pages;
    deps.saveWorkspace(state);
    res.json({ emailLandingPages: pages, updatedPage: target });
  });

  // =========================================================================
  // F. DEEP MULTI-SOURCE RESEARCH & MONETIZATION BLUEPRINT (GEMINI + SEARCH)
  // =========================================================================
  app.post("/api/ai/deep-research", async (req: Request, res: Response) => {
    const query = String(req.body?.query || "").trim().slice(0, 220);
    const rawNiche = String(req.body?.niche || "all").trim();
    const validNiches = new Set(["all", "gaming", "podcasts", "tech-ai", "finance", "sports-irl", "faceless-doc"]);
    const niche = (validNiches.has(rawNiche) ? rawNiche : "all") as ContentNiche | "all";
    const autoDraftCards = Boolean(req.body?.autoDraftCards);

    if (!query) {
      res.status(400).json({ error: "Provide a research topic, niche, or competitor question to investigate." });
      return;
    }

    const ai = deps.getAiClient();
    if (!ai) {
      res.status(503).json({ error: "Gemini API key is not configured on the server." });
      return;
    }

    const state = deps.readWorkspace();
    const startMs = Date.now();
    const prompt = [
      `You are ClipForge's Deep Multi-Source Research & Monetization Strategist.`,
      `Investigate "${query}" (niche focus: ${niche}) using live Google Search across YouTube comments, Reddit threads, X/Twitter discussions, TikTok comments, and creator economy newsletters.`,
      `Return strict JSON (no markdown fences) matching:`,
      `{`,
      `  "executiveBrief": "2-sentence synthesis of what audiences are asking for and where the highest monetization margin is",`,
      `  "findings": [`,
      `    {`,
      `      "sourceChannel": "YouTube Comments" | "Reddit Threads" | "X / Twitter" | "TikTok Comments" | "Creator Newsletters",`,
      `      "painPoint": "Exact recurring viewer question or complaint",`,
      `      "viralHookAngle": "Punchy <12-word 0-3s hook for a vertical Short",`,
      `      "monetizationPath": "How views convert to revenue (affiliate + email + sponsor)",`,
      `      "recommendedAffiliate": "Specific tool/category affiliate program with commission estimate",`,
      `      "emailLeadMagnet": "Concrete free checklist/template to capture emails before affiliate redirect",`,
      `      "longFormExpansionTitle": "10+ minute high-RPM YouTube deep-dive title once the short validates",`,
      `      "estRpmUsd": number,`,
      `      "confidenceScore": number`,
      `    }`,
      `  ]`,
      `}`,
      `Provide 4 distinct, high-specificity findings across different sourceChannels.`,
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = parseLooseJsonObject(response.text || "{}");
      const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];
      const allowedSources = new Set<DeepResearchFinding["sourceChannel"]>([
        "YouTube Comments",
        "Reddit Threads",
        "X / Twitter",
        "TikTok Comments",
        "Creator Newsletters",
      ]);

      const findings: DeepResearchFinding[] = rawFindings.slice(0, 6).map((item, idx) => {
        const obj = (item || {}) as Record<string, unknown>;
        const src = String(obj.sourceChannel || "Reddit Threads") as DeepResearchFinding["sourceChannel"];
        return {
          id: `drf_${Date.now().toString(36)}_${idx}`,
          sourceChannel: allowedSources.has(src) ? src : "Reddit Threads",
          painPoint: String(obj.painPoint || "Viewers asking for reproducible setup templates").slice(0, 260),
          viralHookAngle: String(obj.viralHookAngle || "Stop paying for tools you can automate locally in 60 seconds.").slice(0, 140),
          monetizationPath: String(obj.monetizationPath || "Pinned email capture bridge -> SaaS affiliate redirect").slice(0, 220),
          recommendedAffiliate: String(obj.recommendedAffiliate || "Cloud GPU / Creator SaaS Affiliate (25% recurring)").slice(0, 140),
          emailLeadMagnet: String(obj.emailLeadMagnet || "Free 1-Page Setup Checklist & Prompt Pack").slice(0, 140),
          longFormExpansionTitle: String(obj.longFormExpansionTitle || `Full Step-by-Step Guide: ${query}`).slice(0, 140),
          estRpmUsd: Math.max(1.5, Math.min(45, Number(obj.estRpmUsd) || 8.4)),
          confidenceScore: Math.max(55, Math.min(99, Math.round(Number(obj.confidenceScore) || 87))),
        };
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: TrendPulseSource[] = groundingChunks
        .map((ch) => ({
          title: ch.web?.title || "Google Search Source",
          uri: ch.web?.uri || "",
        }))
        .filter((s) => Boolean(s.uri))
        .slice(0, 8);

      const dossier: DeepResearchDossier = {
        id: `dr_${Date.now().toString(36)}`,
        query,
        niche,
        executiveBrief:
          String(parsed.executiveBrief || "").trim() ||
          `Multi-source scan on "${query}" uncovered ${findings.length} high-intent audience pain points paired with affiliate and email lead-magnet pathways.`,
        generatedAt: new Date().toISOString(),
        engine: "gemini-google-search",
        findings,
        sources,
      };

      state.deepResearch = dossier;

      let draftedCount = 0;
      if (autoDraftCards && findings.length > 0) {
        const targetNiche: ContentNiche = niche === "all" ? "tech-ai" : niche;
        const newCards: ResearchOpportunity[] = findings.slice(0, 3).map((f, idx) => ({
          id: `opp_deep_${Date.now().toString(36)}_${idx}`,
          topic: f.longFormExpansionTitle,
          niche: targetNiche,
          source: `Deep Research · ${f.sourceChannel}`,
          estimatedRpmUsd: Number((6.4 + idx * 0.9).toFixed(2)),
          competitionLevel: "low",
          viralScore: Math.min(98, 86 + idx * 3),
          outlierMultiplier: Number((3.6 + idx * 0.4).toFixed(1)),
          hookBlueprint: f.viralHookAngle,
          whyNow: `${f.painPoint} | Monetization: ${f.monetizationPath}`,
          recommendedVoice: "Kore",
          recommendedTemplate: "blurred-backdrop",
          suggestedScript: `${f.viralHookAngle} ${f.painPoint} Grab "${f.emailLeadMagnet}" in the pinned link for the full setup.`,
          origin: "manual-research",
        }));
        state.researchOpportunities = [...newCards, ...(state.researchOpportunities || [])].slice(0, 24);
        draftedCount = newCards.length;
      }

      recordCreditUsage(state, {
        tier: state.computeRouting?.activeTier || "cloud-standard",
        feature: "Deep Multi-Source Research",
        model: "gemini-4-hydrogen",
        creditsUsed: 4,
        estUsdCost: 0.008,
        status: "success",
      });
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/deep-research",
        latencyMs: Date.now() - startMs,
        success: true,
        model: "gemini-4-hydrogen",
      });
      deps.saveWorkspace(state);

      res.json({
        deepResearch: dossier,
        researchOpportunities: state.researchOpportunities,
        draftedCount,
        computeRouting: state.computeRouting,
      });
    } catch (err) {
      deps.pushTelemetry(state, {
        category: "gemini",
        endpoint: "/api/ai/deep-research",
        latencyMs: Date.now() - startMs,
        success: false,
        model: "gemini-4-hydrogen",
      });
      deps.saveWorkspace(state);
      res.status(502).json({
        error: deps.formatApiError(err, "Deep Multi-Source Research failed."),
      });
    }
  });

  // =========================================================================
  // G. AUTONOMOUS SELF-LEARNING & EXPERIMENT LOOP (WINDOWS PC / VPS / CLOUD)
  // =========================================================================
  app.post("/api/ai/autonomous-loop/run", async (req: Request, res: Response) => {
    const autoApplySafe = Boolean(req.body?.autoApplySafe);
    const focusArea = String(req.body?.focusArea || "Full Studio Revenue & Retention").trim().slice(0, 120);
    const state = deps.readWorkspace();
    const startMs = Date.now();

    const activeTier = state.computeRouting?.activeTier || "cloud-standard";
    const existingLedger = state.autonomousLedger || buildSeedAutonomousLedger();
    const nextCycle = (existingLedger[0]?.cycleNumber || 0) + 1;

    const totalClips = state.clips.length;
    const avgRetention = Math.round(
      state.clips.reduce((s, c) => s + (c.publishedMetrics?.avgWatchPercent || 68), 0) / Math.max(1, totalClips)
    );
    const topAffiliate = [...(state.affiliateOffers || [])].sort(
      (a, b) => b.clicks30d * b.estEpcUsd - a.clicks30d * a.estEpcUsd
    )[0];
    const funnelWinner = state.monetizationPlan?.funnelTest?.winnerLabel || "Mid-Roll Verbal + Lower-Third";
    const activeAlerts =
      (state.revenueAlerts || []).filter((a) => a.status === "active").length +
      (state.competitiveAlerts || []).filter((a) => a.status === "active").length;

    let observation = `Analyzed ${totalClips} clips (avg ${avgRetention}% watch hold), ${activeAlerts} live alerts, and winning CTA "${funnelWinner}".`;
    let experimentTested = `Tested shifting CTA placement to "${funnelWinner}" + pairing top affiliate "${topAffiliate?.partnerName || "Partner Offer"}" with email bridge capture.`;
    let actionTaken = autoApplySafe
      ? "Auto-applied safe pacing & cadence tuning (+1 post/day cap within anti-bot bounds) and synced winning CTA notes."
      : "Prepared verified optimization patch awaiting operator approval.";
    let projectedLiftPct = 14.5;
    let engine: AutonomousLearningEntry["engine"] =
      activeTier === "windows-pc-local"
        ? "windows-pc-local"
        : activeTier === "manual-free"
          ? "hybrid-router"
          : "gemini-cloud";
    let computeCostUsd = activeTier === "windows-pc-local" || activeTier === "manual-free" ? 0 : 0.004;

    const ai = deps.getAiClient();
    if (ai && activeTier !== "manual-free") {
      try {
        const prompt = [
          `You are ClipForge's Autonomous Self-Learning Loop running Cycle #${nextCycle}.`,
          `Focus: ${focusArea}. Compute Tier: ${activeTier} (Windows LM Studio model: ${state.config.localLlm?.model || "gemma-4-2b-it"}).`,
          `Metrics: ${totalClips} clips, avg watch ${avgRetention}%, active alerts: ${activeAlerts}, winning CTA: "${funnelWinner}", top affiliate: "${topAffiliate?.partnerName || "None"}" ($${topAffiliate?.estEpcUsd || 0} EPC).`,
          `Return strict JSON (no markdown) with keys: observation (string, <=180 chars), experimentTested (string, <=180 chars), actionTaken (string, <=180 chars), projectedLiftPct (number 4-35).`,
        ].join("\n");

        const resp = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsed = parseLooseJsonObject(resp.text || "{}");
        if (typeof parsed.observation === "string" && parsed.observation.trim()) {
          observation = parsed.observation.trim().slice(0, 220);
        }
        if (typeof parsed.experimentTested === "string" && parsed.experimentTested.trim()) {
          experimentTested = parsed.experimentTested.trim().slice(0, 220);
        }
        if (typeof parsed.actionTaken === "string" && parsed.actionTaken.trim()) {
          actionTaken = parsed.actionTaken.trim().slice(0, 220);
        }
        if (typeof parsed.projectedLiftPct === "number" && Number.isFinite(parsed.projectedLiftPct)) {
          projectedLiftPct = Math.max(4, Math.min(35, Number(parsed.projectedLiftPct.toFixed(1))));
        }
        engine = activeTier === "windows-pc-local" ? "hybrid-router" : "gemini-cloud";
        recordCreditUsage(state, {
          tier: activeTier,
          feature: `Autonomous Learning Cycle #${nextCycle}`,
          model: "gemini-4-hydrogen",
          creditsUsed: computeCostUsd > 0 ? 2 : 0,
          estUsdCost: computeCostUsd,
          status: "success",
        });
      } catch (err) {
        deps.pushTelemetry(state, {
          category: "gemini",
          endpoint: "/api/ai/autonomous-loop/run",
          latencyMs: Date.now() - startMs,
          success: false,
          model: "gemini-4-hydrogen",
        });
        deps.saveWorkspace(state);
        res.status(502).json({
          error: deps.formatApiError(err, "Autonomous self-learning cycle failed."),
        });
        return;
      }
    }

    if (autoApplySafe) {
      const nextPosts = Math.min(12, Math.max(4, (state.config.publishing?.maxPostsPerDay || 5) + 1));
      state.config.publishing = {
        ...state.config.publishing,
        maxPostsPerDay: nextPosts,
      };
    }

    const entry: AutonomousLearningEntry = {
      id: `auto_${Date.now().toString(36)}`,
      cycleNumber: nextCycle,
      executedAt: new Date().toISOString(),
      engine,
      focusArea,
      observation,
      experimentTested,
      actionTaken,
      projectedLiftPct,
      autoApplied: autoApplySafe,
      computeCostUsd,
    };

    state.autonomousLedger = [entry, ...existingLedger].slice(0, 20);
    deps.pushTelemetry(state, {
      category: engine === "windows-pc-local" ? "local-llm" : "gemini",
      endpoint: "/api/ai/autonomous-loop/run",
      latencyMs: Date.now() - startMs,
      success: true,
      model: engine === "windows-pc-local" ? state.config.localLlm?.model || "gemma-4-2b-it" : "gemini-4-hydrogen",
    });
    deps.saveWorkspace(state);

    res.json({
      entry,
      autonomousLedger: state.autonomousLedger,
      config: state.config,
      computeRouting: state.computeRouting,
    });
  });
}

export function buildSeedDeepResearch(): DeepResearchDossier {
  return {
    id: "dr_seed_1",
    query: "High-RPM Short-Form Monetization: Affiliates, Email Bridges & Local AI Workflows",
    niche: "tech-ai",
    executiveBrief:
      "Cross-platform comments on YouTube, Reddit, and X show creators are frustrated with $0.06 Shorts RPM and $160/mo SaaS stacks—driving massive demand for local Windows GPU workflows paired with email-gated affiliate checklists.",
    generatedAt: new Date().toISOString(),
    engine: "gemini-google-search",
    findings: [
      {
        id: "drf_seed_1",
        sourceChannel: "Reddit Threads",
        painPoint: "r/LocalLLaMA & r/NewTubers creators complain cloud AI video tools burn $80+/mo in credits before a channel even monetizes.",
        viralHookAngle: "Stop paying $99/mo for AI clippers when your Windows GPU runs this free.",
        monetizationPath: "Short views -> Pinned LM Studio setup PDF (email opt-in) -> Cloud GPU burst affiliate ($1.85 EPC)",
        recommendedAffiliate: "RunPod / Vast.ai Cloud GPU Credits (25% recurring)",
        emailLeadMagnet: "Free Windows LM Studio + FFmpeg 9:16 Render Starter Pack",
        longFormExpansionTitle: "Zero-Dollar AI Shorts Factory: Local Windows PC + Free Cloudflare Setup (Full Guide)",
        estRpmUsd: 11.4,
        confidenceScore: 93,
      },
      {
        id: "drf_seed_2",
        sourceChannel: "YouTube Comments",
        painPoint: "Viewers under viral finance & tech Shorts repeatedly ask 'What tool / link did you use?' in top comments, but creators forget to pin an opt-in bridge.",
        viralHookAngle: "Why 90% of Shorts channels stay broke even at 1 million views a month.",
        monetizationPath: "Mid-roll verbal CTA -> Email Bridge Landing Page -> Creator SaaS & Fintech Affiliates",
        recommendedAffiliate: "Mercury Creator Treasury + ConvertKit/Beehiiv Partner (30% rev-share)",
        emailLeadMagnet: "2026 Shorts-to-Email Conversion Blueprint & Rate Card",
        longFormExpansionTitle: "How 1 Viral Short Built a 5,000-Subscriber Email Funnel (Real Conversion Math)",
        estRpmUsd: 14.2,
        confidenceScore: 91,
      },
      {
        id: "drf_seed_3",
        sourceChannel: "X / Twitter",
        painPoint: "Solo media operators want Discord/Telegram mobile notifications so they can approve AI-edited drafts without sitting at a desktop.",
        viralHookAngle: "I approve my entire YouTube Shorts schedule from Telegram in 12 seconds.",
        monetizationPath: "Demo clip -> VPS Hosting Affiliate (Hetzner/DigitalOcean) + Automation Template Upsell",
        recommendedAffiliate: "Cloud VPS & Automation Stack Affiliates ($50–$100 CPA)",
        emailLeadMagnet: "Discord & Telegram Remote Creator Bot Config Template",
        longFormExpansionTitle: "Running a 6-Channel Shorts Network From Your Phone Using Local AI + VPS Workers",
        estRpmUsd: 9.8,
        confidenceScore: 88,
      },
    ],
    sources: [
      { title: "YouTube Shorts Monetization & Affiliate Benchmarks", uri: "https://www.youtube.com/creators/" },
      { title: "LM Studio OpenAI-Compatible Local Server Docs", uri: "https://lmstudio.ai/docs" },
    ],
  };
}

export function buildSeedAutonomousLedger(): AutonomousLearningEntry[] {
  const now = Date.now();
  return [
    {
      id: "auto_seed_1",
      cycleNumber: 14,
      executedAt: new Date(now - 1000 * 60 * 95).toISOString(),
      engine: "hybrid-router",
      focusArea: "CTA Placement & Affiliate EPC",
      observation: "Mid-Roll Verbal + Lower-Third CTA outperformed Outro End-Cards by +31.4% sponsor conversion across AI & Tech clips.",
      experimentTested: "Compared 5 CTA placement variants grouped by slot (Intro, Mid-Roll, Split-Screen, Pinned/Bio, Outro).",
      actionTaken: "Promoted Mid-Roll Verbal + Pinned Email Bridge as default monetization template on active tech-ai drafts.",
      projectedLiftPct: 18.4,
      autoApplied: true,
      computeCostUsd: 0.002,
    },
    {
      id: "auto_seed_2",
      cycleNumber: 13,
      executedAt: new Date(now - 1000 * 60 * 360).toISOString(),
      engine: "windows-pc-local",
      focusArea: "Local Windows PC Offload & Cost Control",
      observation: "Offloaded 6-platform SEO hashtag packs and caption slang cleanup to local LM Studio (Gemma 4 2B) with 100% schema pass rate.",
      experimentTested: "Routed batch metadata & script drafting locally before escalating only Google Search discovery to Cloud Gemini.",
      actionTaken: "Reduced cloud token spend by 68% while maintaining sub-3s hook scores above the 30-day moving average.",
      projectedLiftPct: 11.2,
      autoApplied: true,
      computeCostUsd: 0,
    },
  ];
}
