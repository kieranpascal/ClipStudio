import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Newspaper,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type {
  ContentNiche,
  DeepResearchDossier,
  DeepResearchFinding,
  IndustryNewsCategory,
  IndustryNewsSnapshot,
  ViralSentimentSnapshot,
  WorkspaceTab,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

interface AudienceSocialIntelPageProps {
  deepResearch?: DeepResearchDossier;
  viralSentiment?: ViralSentimentSnapshot;
  industryNews?: IndustryNewsSnapshot;
  isRunningDeepResearch: boolean;
  isScanningSentiment: boolean;
  isApplyingSentiment: boolean;
  isScanningNews: boolean;
  onRunDeepResearch: (payload: {
    query: string;
    niche: ContentNiche | "all";
    autoDraftCards: boolean;
  }) => Promise<void>;
  onScanViralSentiment: (niche: ContentNiche, topicQuery?: string) => Promise<void>;
  onApplySentimentToDirector: () => Promise<void>;
  onScanIndustryNews: (focus: string) => Promise<void>;
  onFeedNewsToAgent: (itemId?: string) => Promise<void>;
  onCreateClipFromFinding: (finding: DeepResearchFinding) => Promise<void>;
  onSelectTab: (tab: WorkspaceTab) => void;
}

function isSafeHttpUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function AudienceSocialIntelPage({
  deepResearch,
  viralSentiment,
  industryNews,
  isRunningDeepResearch,
  isScanningSentiment,
  isApplyingSentiment,
  isScanningNews,
  onRunDeepResearch,
  onScanViralSentiment,
  onApplySentimentToDirector,
  onScanIndustryNews,
  onFeedNewsToAgent,
  onCreateClipFromFinding,
  onSelectTab,
}: AudienceSocialIntelPageProps) {
  const [section, setSection] = useState<"pain-points" | "comment-sentiment" | "industry-news">(
    "pain-points"
  );

  // Deep Pain-Point Dossier state
  const [dossierQuery, setDossierQuery] = useState(
    deepResearch?.query ||
      "Top viewer complaints, monetization gaps, and affiliate product questions in AI, Finance & Gaming Shorts"
  );
  const [dossierNiche, setDossierNiche] = useState<ContentNiche | "all">("all");
  const [autoDraftCards, setAutoDraftCards] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [draftingId, setDraftingId] = useState<string | null>(null);

  // Comment Sentiment state
  const [sentimentNiche, setSentimentNiche] = useState<ContentNiche>(
    viralSentiment?.niche || "tech-ai"
  );
  const [sentimentQuery, setSentimentQuery] = useState(
    viralSentiment?.topicQuery || "kinetic captions, split-screen hooks, and AI narration pacing"
  );

  // Industry News state
  const [newsFocus, setNewsFocus] = useState(
    industryNews?.focus || "YouTube Shorts RPM changes, TikTok Creator Rewards, AI video tools & viral stream formats"
  );
  const [newsCategory, setNewsCategory] = useState<"all" | IndustryNewsCategory>("all");

  const findings = deepResearch?.findings || [];
  const filteredFindings = useMemo(() => {
    if (channelFilter === "all") return findings;
    return findings.filter((f) => f.sourceChannel === channelFilter);
  }, [findings, channelFilter]);

  const newsItems = industryNews?.items || [];
  const filteredNews = useMemo(() => {
    if (newsCategory === "all") return newsItems;
    return newsItems.filter((item) => item.category === newsCategory);
  }, [newsItems, newsCategory]);

  const sourceChannels = Array.from(new Set(findings.map((f) => f.sourceChannel)));

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Research & Intelligence"
        title="Social, Comments & Audience Sentiment Lab"
        subtitle="Listen directly to real audiences across YouTube comments, Reddit threads, X, TikTok comments, and creator economy news—then turn recurring pain points and editing-style feedback into higher-converting hooks and affiliate offers."
        metaItems={[
          { label: `${findings.length} Pain-Point Findings`, emphasis: "crimson" },
          { label: `${viralSentiment?.overallPositivePct ?? 72}% Positive Edit Sentiment`, emphasis: "emerald" },
          { label: `${newsItems.length} Live Intel Briefs` },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("competitor-intel")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap"
          >
            Next: Competitor &amp; Trend Intel
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "pain-points",
            label: "Multi-Source Pain Points",
            value: String(findings.length),
            subtext: `YouTube · Reddit · X · TikTok · Newsletters`,
            tone: "crimson",
            onClick: () => setSection("pain-points"),
          },
          {
            id: "sentiment-positive",
            label: "Editing Style Positive Sentiment",
            value: `${viralSentiment?.overallPositivePct ?? 72}%`,
            subtext: `${viralSentiment?.overallPolarizingPct ?? 19}% polarizing · ${viralSentiment?.overallNegativePct ?? 9}% fatigued`,
            tone: "emerald",
            onClick: () => setSection("comment-sentiment"),
          },
          {
            id: "styles-graded",
            label: "Editing Formats Audited",
            value: String(viralSentiment?.styleScores?.length || 0),
            subtext: viralSentiment?.appliedToDirectorAt
              ? "Synced to AI Director rules"
              : "Ready to apply to AI Director",
            onClick: () => setSection("comment-sentiment"),
          },
          {
            id: "news-intel",
            label: "Live Industry & AI Tool Intel",
            value: String(newsItems.length),
            subtext: `${newsItems.filter((i) => i.fedToAgent).length} synced to Agent memory`,
            onClick: () => setSection("industry-news"),
          },
        ]}
      />

      {/* Sub-Navigation Bar */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex items-center gap-6 overflow-x-auto">
        {(
          [
            {
              id: "pain-points",
              label: `Multi-Source Comment & Pain-Point Dossier (${findings.length})`,
              icon: Search,
            },
            {
              id: "comment-sentiment",
              label: `Editing Style Sentiment Lab (${viralSentiment?.comments?.length || 0} Comments)`,
              icon: MessageSquareText,
            },
            {
              id: "industry-news",
              label: `Creator Economy & AI Tools Radar (${newsItems.length})`,
              icon: Newspaper,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? "text-[#0F172A] dark:text-[#F8FAFC]"
                  : "text-slate-500 hover:text-[#0F172A] dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-[#E1392B]" : ""}`} />
              <span>{tab.label}</span>
              {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E1392B]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: MULTI-SOURCE PAIN-POINT DOSSIER */}
      {section === "pain-points" && (
        <div className="p-5 space-y-5">
          <section className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Deep Social & Comment Monetization Researcher"
              detail={
                deepResearch?.generatedAt
                  ? `Last dossier: ${new Date(deepResearch.generatedAt).toLocaleString()} · Engine: ${deepResearch.engine}`
                  : "Google Search + Gemini synthesis"
              }
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isRunningDeepResearch && dossierQuery.trim()) {
                  onRunDeepResearch({
                    query: dossierQuery.trim(),
                    niche: dossierNiche,
                    autoDraftCards,
                  });
                }
              }}
              className="space-y-3"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  aria-label="Dossier niche"
                  value={dossierNiche}
                  onChange={(e) => setDossierNiche(e.target.value as ContentNiche | "all")}
                  className="h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs md:w-40"
                >
                  <option value="all">All Niches</option>
                  <option value="tech-ai">AI &amp; Tech</option>
                  <option value="finance">Finance</option>
                  <option value="gaming">Gaming</option>
                  <option value="podcasts">Podcasts</option>
                  <option value="faceless-doc">Faceless Doc</option>
                  <option value="sports-irl">Sports &amp; IRL</option>
                </select>
                <input
                  type="text"
                  value={dossierQuery}
                  onChange={(e) => setDossierQuery(e.target.value)}
                  placeholder="What viewer pain points, comments, affiliate products, or lead magnets should we mine?"
                  className="flex-1 h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
                />
                <button
                  type="submit"
                  disabled={isRunningDeepResearch || !dossierQuery.trim()}
                  className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  {isRunningDeepResearch ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>{isRunningDeepResearch ? "Mining Social Sources..." : "Run Deep Research Dossier"}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDraftCards}
                    onChange={(e) => setAutoDraftCards(e.target.checked)}
                    className="accent-[#E1392B]"
                  />
                  <span>Automatically draft top findings into Opportunity Radar cards</span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChannelFilter("all")}
                    className={`px-2 py-0.5 rounded-xs text-[11px] font-medium ${
                      channelFilter === "all"
                        ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                        : "text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    All Sources ({findings.length})
                  </button>
                  {sourceChannels.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannelFilter(ch)}
                      className={`px-2 py-0.5 rounded-xs text-[11px] font-medium ${
                        channelFilter === ch
                          ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                          : "text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {deepResearch?.executiveBrief && (
              <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="font-mono text-[11px] font-semibold text-[#E1392B] mr-2">
                  Executive Synthesis:
                </span>
                {deepResearch.executiveBrief}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFindings.map((finding) => (
              <article
                key={finding.id}
                className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[#E1392B]">{finding.sourceChannel}</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      Est. ${finding.estRpmUsd.toFixed(2)} RPM · Confidence {finding.confidenceScore}%
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-slate-500">Observed Viewer Pain Point</div>
                    <h4 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                      {finding.painPoint}
                    </h4>
                  </div>

                  <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1">
                    <div className="text-[11px] font-mono text-slate-500">Viral Short Hook Angle</div>
                    <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {finding.viralHookAngle}
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <dt className="font-mono text-[10px] text-slate-500">Monetization Path</dt>
                      <dd className="text-slate-700 dark:text-slate-300 mt-0.5">{finding.monetizationPath}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] text-slate-500">Paired Affiliate Offer</dt>
                      <dd className="text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                        {finding.recommendedAffiliate}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] text-slate-500">Email Lead Magnet</dt>
                      <dd className="text-slate-700 dark:text-slate-300 mt-0.5">{finding.emailLeadMagnet}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] text-slate-500">10m+ Long-Form Graduation</dt>
                      <dd className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {finding.longFormExpansionTitle}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTab("affiliates-funnels")}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#E1392B]"
                  >
                    Build Affiliate Bridge Page
                  </button>
                  <button
                    type="button"
                    disabled={draftingId === finding.id}
                    onClick={async () => {
                      setDraftingId(finding.id);
                      try {
                        await onCreateClipFromFinding(finding);
                      } finally {
                        setDraftingId(null);
                      }
                    }}
                    className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    {draftingId === finding.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#E1392B]" />
                    )}
                    <span>Create Clip &amp; Open Studio</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {deepResearch?.sources && deepResearch.sources.length > 0 && (
            <div className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-wrap items-center gap-3 text-xs">
              <span className="font-mono text-[11px] text-slate-500">Verified Grounding Sources:</span>
              {deepResearch.sources.filter((s) => isSafeHttpUrl(s.uri)).map((src, i) => (
                <a
                  key={`${src.uri}-${i}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#E1392B] hover:underline inline-flex items-center gap-1"
                >
                  <span>{src.title || src.uri}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EDITING STYLE COMMENT SENTIMENT LAB */}
      {section === "comment-sentiment" && (
        <div className="p-5 space-y-5">
          <section className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Viral Editing Style &amp; Comment Sentiment Analyzer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scrapes real viewer reactions across TikTok, Shorts, Reels, Reddit, and X to flag fatigued editing styles before your retention drops.
                </p>
              </div>
              {viralSentiment && (
                <button
                  type="button"
                  disabled={isApplyingSentiment}
                  onClick={onApplySentimentToDirector}
                  className="h-8 px-3.5 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {isApplyingSentiment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-[#E1392B]" />
                  )}
                  <span>
                    {viralSentiment.appliedToDirectorAt
                      ? "Re-Sync Directive to AI Director"
                      : "Apply Directive to AI Director"}
                  </span>
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isScanningSentiment) onScanViralSentiment(sentimentNiche, sentimentQuery.trim());
              }}
              className="flex flex-col md:flex-row gap-2"
            >
              <select
                aria-label="Sentiment niche"
                value={sentimentNiche}
                onChange={(e) => setSentimentNiche(e.target.value as ContentNiche)}
                className="h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs md:w-40"
              >
                <option value="tech-ai">AI &amp; Tech</option>
                <option value="gaming">Gaming</option>
                <option value="finance">Finance</option>
                <option value="podcasts">Podcasts</option>
                <option value="faceless-doc">Faceless Doc</option>
                <option value="sports-irl">Sports &amp; IRL</option>
              </select>
              <input
                type="text"
                value={sentimentQuery}
                onChange={(e) => setSentimentQuery(e.target.value)}
                placeholder="Editing style or hook format to audit (e.g., fast jump cuts, split-screen, AI voiceover)..."
                className="flex-1 h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
              />
              <button
                type="submit"
                disabled={isScanningSentiment}
                className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {isScanningSentiment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageSquareText className="w-3.5 h-3.5" />
                )}
                <span>{isScanningSentiment ? "Analyzing Comments..." : "Scan Social Comments"}</span>
              </button>
            </form>

            {viralSentiment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1">
                  <div className="font-mono text-[11px] text-slate-500">Executive Audience Summary</div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    {viralSentiment.executiveSummary}
                  </p>
                </div>
                <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-1">
                  <div className="font-mono text-[11px] text-[#E1392B] font-semibold">
                    AI Director Pacing Directive
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    {viralSentiment.directorDirective}
                  </p>
                </div>
              </div>
            )}
          </section>

          {viralSentiment && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Style Scoreboard */}
              <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
                <StudioSectionHeader
                  zone="telemetry"
                  title="Editing Style Reception Scores"
                  detail={`${viralSentiment.styleScores.length} styles benchmarked`}
                />
                <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                  {viralSentiment.styleScores.map((style) => (
                    <div key={style.styleName} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {style.styleName}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums flex items-center gap-2">
                          <span
                            className={
                              style.verdict === "loved"
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : style.verdict === "fatigued"
                                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-amber-600 dark:text-amber-400 font-semibold"
                            }
                          >
                            {style.verdict}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="font-bold">{style.sentimentScore}/100</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E5EAF2] dark:bg-[#1A1E29] overflow-hidden">
                        <div
                          className={`h-full ${
                            style.verdict === "loved"
                              ? "bg-emerald-500"
                              : style.verdict === "fatigued"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.max(8, Math.min(100, style.sentimentScore))}%` }}
                        />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{style.audienceTakeaway}</p>
                      <div className="text-[11px] font-mono text-slate-500">
                        Adjustment: {style.directorAdjustment} ({style.sampleMentionCount} mentions)
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Scraped Social Comments Feed */}
              <section className="xl:col-span-6 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
                <StudioSectionHeader
                  zone="telemetry"
                  title="Representative Viewer Comments Sampled"
                  detail={`${viralSentiment.comments.length} comments indexed`}
                />
                <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                  {viralSentiment.comments.map((comment) => (
                    <div key={comment.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          {comment.sentiment === "positive" ? (
                            <ThumbsUp className="w-3 h-3 text-emerald-500" />
                          ) : comment.sentiment === "negative" ? (
                            <ThumbsDown className="w-3 h-3 text-rose-500" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <span className="font-semibold text-[#0F172A] dark:text-slate-200">
                            {comment.authorHandle}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{comment.platform}</span>
                        </span>
                        <span className="tabular-nums">
                          {formatCompactNumber(comment.likesEstimate)} likes · {comment.editingStyleReferenced}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        &ldquo;{comment.commentText}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: CREATOR ECONOMY & AI TOOLS NEWS RADAR */}
      {section === "industry-news" && (
        <div className="p-5 space-y-5">
          <section className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Live News, Streams, Social Shifts &amp; AI Tool Releases
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Feed real-time platform algorithm changes and breaking creator stories straight into your AI Autopilot planning memory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onFeedNewsToAgent()}
                className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 text-[#E1392B]" />
                <span>Sync All to AI Agent Memory</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isScanningNews && newsFocus.trim()) onScanIndustryNews(newsFocus.trim());
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={newsFocus}
                onChange={(e) => setNewsFocus(e.target.value)}
                placeholder="Focus news radar (e.g., TikTok RPM updates, new video models, Twitch meta)..."
                className="flex-1 h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F4F6F9] dark:bg-[#0D0F14] text-xs"
              />
              <button
                type="submit"
                disabled={isScanningNews}
                className="h-9 px-4 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {isScanningNews ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Newspaper className="w-3.5 h-3.5" />}
                <span>{isScanningNews ? "Scanning News..." : "Scan Live Intel"}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(["all", "news", "streams", "videos", "social", "ai-tools"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewsCategory(cat)}
                  className={`px-2.5 py-1 rounded-xs font-medium capitalize ${
                    newsCategory === cat
                      ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                      : "text-slate-500 hover:text-[#0F172A] dark:hover:text-white"
                  }`}
                >
                  {cat === "ai-tools" ? "AI Tools" : cat}
                </button>
              ))}
            </div>
          </section>

          {filteredNews.length === 0 ? (
            <div className="p-8 rounded-xs border border-dashed border-[#D4DAE4] dark:border-[#252A36] text-center text-xs text-slate-500">
              No intel items in this category yet. Click &ldquo;Scan Live Intel&rdquo; to pull fresh updates via Google Search.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-500">
                      <span className="font-semibold text-[#E1392B]">
                        {item.category} · {item.source}
                      </span>
                      <span>{item.publishedHint}</span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>
                    <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-xs space-y-1">
                      <div className="text-[11px] font-mono text-slate-500">Actionable Takeaway</div>
                      <div className="text-slate-700 dark:text-slate-200">{item.actionableTakeaway}</div>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-[#EEF1F6] dark:border-[#1E222D] flex items-center justify-between gap-2 text-xs">
                    {isSafeHttpUrl(item.url) ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-[#E1392B] inline-flex items-center gap-1"
                      >
                        <span>Read Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">{item.source}</span>
                    )}
                    <button
                      type="button"
                      disabled={item.fedToAgent}
                      onClick={() => onFeedNewsToAgent(item.id)}
                      className={`h-7 px-2.5 rounded-xs text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap ${
                        item.fedToAgent
                          ? "border border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                      }`}
                    >
                      {item.fedToAgent ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Synced to Agent</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 text-[#E1392B]" />
                          <span>Feed to AI Agent</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
