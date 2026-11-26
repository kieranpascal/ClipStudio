import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Link2,
  Mail,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import type {
  AffiliateOfferLink,
  ContentNiche,
  CtaPlacementType,
  EmailCaptureLandingPage,
  MonetizationPlan,
  WorkspaceTab,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";
import { AbFunnelTestPanel } from "./AbFunnelTestPanel";
import { StudioKpiStrip, StudioPageHeader, StudioSectionHeader } from "./StudioChrome";

interface AffiliatesFunnelsPageProps {
  monetizationPlan?: MonetizationPlan;
  affiliateOffers: AffiliateOfferLink[];
  emailLandingPages: EmailCaptureLandingPage[];
  isAnalyzingFunnel: boolean;
  isApplyingFunnelWinner: boolean;
  onAddAffiliateOffer: (payload: {
    partnerName: string;
    niche: ContentNiche;
    offerHook: string;
    destinationUrl: string;
    commissionPct: number;
    estEpcUsd: number;
  }) => Promise<void>;
  onDeleteAffiliateOffer: (id: string) => Promise<void>;
  onTrackAffiliateEvent: (id: string, clicks: number, conversions: number) => Promise<void>;
  onAddLandingPage: (payload: {
    headline: string;
    leadMagnetTitle: string;
    subheadline: string;
    ctaButtonText: string;
    linkedAffiliateId?: string;
    niche: ContentNiche;
  }) => Promise<void>;
  onUpdateLandingPage: (
    id: string,
    patch: {
      active?: boolean;
      addVisitors?: number;
      addSubscribers?: number;
      addAffiliateClicks?: number;
    }
  ) => Promise<void>;
  onAddFunnelVariant: (payload: {
    label: string;
    placement: CtaPlacementType;
    triggerSecond: number;
    ctaCopy: string;
    sponsorBrand: string;
    niche: ContentNiche;
    impressions: number;
    ctrPct: number;
    conversionRatePct: number;
    retentionImpactPct: number;
    avgDealValueUsd: number;
  }) => Promise<void>;
  onAnalyzeFunnel: (focusSponsor?: string) => Promise<void>;
  onApplyFunnelWinner: () => Promise<void>;
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

export function AffiliatesFunnelsPage({
  monetizationPlan,
  affiliateOffers,
  emailLandingPages,
  isAnalyzingFunnel,
  isApplyingFunnelWinner,
  onAddAffiliateOffer,
  onDeleteAffiliateOffer,
  onTrackAffiliateEvent,
  onAddLandingPage,
  onUpdateLandingPage,
  onAddFunnelVariant,
  onAnalyzeFunnel,
  onApplyFunnelWinner,
  onSelectTab,
}: AffiliatesFunnelsPageProps) {
  const [subView, setSubView] = useState<"affiliates" | "email-bridges" | "ab-funnel">("affiliates");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string>(emailLandingPages[0]?.id || "");

  // New affiliate offer state
  const [showAffForm, setShowAffForm] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [affNiche, setAffNiche] = useState<ContentNiche>("tech-ai");
  const [offerHook, setOfferHook] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [commissionPct, setCommissionPct] = useState(25);
  const [estEpcUsd, setEstEpcUsd] = useState(1.9);

  // New landing page state
  const [showLpForm, setShowLpForm] = useState(false);
  const [lpHeadline, setLpHeadline] = useState("");
  const [lpMagnet, setLpMagnet] = useState("");
  const [lpSubheadline, setLpSubheadline] = useState(
    "Enter your email to get the free template + instant partner bonus link."
  );
  const [lpCta, setLpCta] = useState("Send Me The Free Kit");
  const [lpLinkedAff, setLpLinkedAff] = useState(affiliateOffers[0]?.id || "");
  const [lpNiche, setLpNiche] = useState<ContentNiche>("tech-ai");

  const stats = useMemo(() => {
    const totalClicks = affiliateOffers.reduce((s, a) => s + a.clicks30d, 0);
    const totalConvs = affiliateOffers.reduce((s, a) => s + a.conversions30d, 0);
    const affiliateRev = Math.round(
      affiliateOffers.reduce((s, a) => s + a.clicks30d * a.estEpcUsd, 0)
    );
    const avgEpc = totalClicks > 0 ? affiliateRev / totalClicks : 0;
    const visitors = emailLandingPages.reduce((s, p) => s + p.visitors30d, 0);
    const subs = emailLandingPages.reduce((s, p) => s + p.subscribers30d, 0);
    const optInPct = visitors > 0 ? (subs / visitors) * 100 : 0;
    const lpRev = emailLandingPages.reduce((s, p) => s + p.revenueAttributedUsd, 0);
    return { totalClicks, totalConvs, affiliateRev, avgEpc, visitors, subs, optInPct, lpRev };
  }, [affiliateOffers, emailLandingPages]);

  const affiliateChartData = useMemo(
    () =>
      affiliateOffers.map((a) => ({
        name: a.partnerName.slice(0, 16),
        revenueUsd: Math.round(a.clicks30d * a.estEpcUsd),
        clicks: a.clicks30d,
      })),
    [affiliateOffers]
  );

  const activePreviewPage =
    emailLandingPages.find((p) => p.id === previewPageId) || emailLandingPages[0] || null;
  const linkedAffiliateForPreview = affiliateOffers.find(
    (a) => a.id === activePreviewPage?.linkedAffiliateId
  );

  function copyText(id: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] dark:bg-[#0A0B0E]">
      <StudioPageHeader
        section="Monetization & Growth"
        title="Affiliates, Email Capture Bridges & A/B CTA Funnels"
        subtitle="Turn short-form views into durable revenue: track UTM affiliate links, capture emails on high-converting lead-magnet bridge pages that redirect to partner offers, and A/B test CTA placements inside your clips."
        metaItems={[
          { label: `${affiliateOffers.length} Affiliate Offers`, emphasis: "crimson" },
          { label: `${emailLandingPages.length} Email Bridge Pages` },
          { label: `$${(stats.affiliateRev + stats.lpRev).toLocaleString()} 30d Funnel Revenue`, emphasis: "emerald" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => onSelectTab("monetization")}
            className="h-8 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#141720] hover:border-[#E1392B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap"
          >
            Back to Monetization Hub
          </button>
        }
      />

      <StudioKpiStrip
        items={[
          {
            id: "aff-rev",
            label: "Affiliate Revenue (30d)",
            value: `$${stats.affiliateRev.toLocaleString()}`,
            subtext: `${formatCompactNumber(stats.totalClicks)} clicks · $${stats.avgEpc.toFixed(2)} avg EPC`,
            tone: "emerald",
            onClick: () => setSubView("affiliates"),
          },
          {
            id: "email-subs",
            label: "Email Leads Captured (30d)",
            value: formatCompactNumber(stats.subs),
            subtext: `${stats.optInPct.toFixed(1)}% opt-in across ${formatCompactNumber(stats.visitors)} visits`,
            onClick: () => setSubView("email-bridges"),
          },
          {
            id: "lp-rev",
            label: "Email-to-Affiliate Attributed Rev",
            value: `$${stats.lpRev.toLocaleString()}`,
            subtext: `${emailLandingPages.filter((p) => p.active).length} active bridge pages`,
            tone: "emerald",
            onClick: () => setSubView("email-bridges"),
          },
          {
            id: "cta-winner",
            label: "Winning CTA Placement",
            value: monetizationPlan?.funnelTest?.winnerLabel?.split(" ")[0] || "Mid-Roll",
            subtext: `+${monetizationPlan?.funnelTest?.conversionLiftPct || 34}% conversion lift vs. baseline`,
            tone: "crimson",
            onClick: () => setSubView("ab-funnel"),
          },
        ]}
      />

      {/* Focused Sub-View Tabs */}
      <div className="px-5 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] flex items-center gap-6 overflow-x-auto">
        {(
          [
            { id: "affiliates", label: `Affiliate Link Ledger (${affiliateOffers.length})`, icon: Link2 },
            { id: "email-bridges", label: `Email Capture Bridge Pages (${emailLandingPages.length})`, icon: Mail },
            { id: "ab-funnel", label: "CTA Placement A/B Funnel Test", icon: FlaskConical },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`relative py-3 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

      {/* SUBVIEW 1: AFFILIATE OFFER TRACKING LEDGER */}
      {subView === "affiliates" && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <section className="xl:col-span-8 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
              <StudioSectionHeader
                zone="action"
                title="Tracked Affiliate Offers & UTM Routing"
                detail="Copy UTM links straight into pinned comments & bio link hubs"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowAffForm((v) => !v)}
                    className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAffForm ? "Cancel" : "Add Affiliate Offer"}</span>
                  </button>
                }
              />

              {showAffForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!partnerName.trim() || !destinationUrl.trim()) return;
                    const safeUrl = /^https?:\/\//i.test(destinationUrl.trim())
                      ? destinationUrl.trim()
                      : `https://${destinationUrl.trim()}`;
                    if (!isSafeHttpUrl(safeUrl)) return;
                    await onAddAffiliateOffer({
                      partnerName: partnerName.trim(),
                      niche: affNiche,
                      offerHook: offerHook.trim() || `Get 20% off ${partnerName.trim()}`,
                      destinationUrl: safeUrl,
                      commissionPct,
                      estEpcUsd,
                    });
                    setPartnerName("");
                    setOfferHook("");
                    setDestinationUrl("");
                    setShowAffForm(false);
                  }}
                  className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs"
                >
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Partner Name (e.g., ElevenLabs, NordVPN)"
                    className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                  />
                  <select
                    aria-label="Affiliate niche"
                    value={affNiche}
                    onChange={(e) => setAffNiche(e.target.value as ContentNiche)}
                    className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                  >
                    <option value="tech-ai">AI &amp; Tech</option>
                    <option value="finance">Finance</option>
                    <option value="gaming">Gaming</option>
                    <option value="podcasts">Podcasts</option>
                    <option value="faceless-doc">Faceless Doc</option>
                  </select>
                  <input
                    type="url"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://partner.com/?ref=clipforge"
                    className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] font-mono"
                  />
                  <input
                    type="text"
                    value={offerHook}
                    onChange={(e) => setOfferHook(e.target.value)}
                    placeholder="On-screen CTA hook (e.g., Free 30-day Pro trial in pinned comment)"
                    className="sm:col-span-2 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(Number(e.target.value) || 20)}
                      title="Commission %"
                      className="w-1/2 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] font-mono tabular-nums"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min={0.1}
                      max={50}
                      value={estEpcUsd}
                      onChange={(e) => setEstEpcUsd(Number(e.target.value) || 1.5)}
                      title="Est. EPC ($)"
                      className="w-1/2 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] font-mono tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="h-8 px-4 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] font-semibold"
                    >
                      Save Affiliate Partner
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E7F0] dark:border-[#1E222D] text-[11px] text-slate-500">
                      <th className="py-2 pr-3 font-medium">Partner &amp; CTA Hook</th>
                      <th className="py-2 px-2 font-medium text-right">Comm.</th>
                      <th className="py-2 px-2 font-medium text-right">Clicks / Conv.</th>
                      <th className="py-2 px-2 font-medium text-right">30d Est.</th>
                      <th className="py-2 pl-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
                    {affiliateOffers.map((offer) => {
                      const rev30d = Math.round(offer.clicks30d * offer.estEpcUsd);
                      const trackedUrl = `${offer.destinationUrl}${offer.destinationUrl.includes("?") ? "&" : "?"}utm_source=clipforge&utm_campaign=${offer.utmCode}`;
                      return (
                        <tr key={offer.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#151821]">
                          <td className="py-3 pr-3 max-w-[280px]">
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                              <span>{offer.partnerName}</span>
                              <span className="font-mono text-[10px] text-slate-500">{offer.niche}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{offer.offerHook}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            {offer.commissionPct}% · ${offer.estEpcUsd.toFixed(2)} EPC
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums">
                            {formatCompactNumber(offer.clicks30d)} / {offer.conversions30d}
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            ${rev30d.toLocaleString()}
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onTrackAffiliateEvent(offer.id, 25, 2)}
                                className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-emerald-500 text-[11px] font-mono"
                                title="Log +25 clicks / +2 conversions"
                              >
                                +25 Clicks
                              </button>
                              <button
                                type="button"
                                onClick={() => copyText(offer.id, trackedUrl)}
                                className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-[#E1392B] text-[11px] inline-flex items-center gap-1"
                              >
                                {copiedId === offer.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>UTM</span>
                              </button>
                              <button
                                type="button"
                                aria-label="Delete affiliate offer"
                                onClick={() => onDeleteAffiliateOffer(offer.id)}
                                className="h-7 w-7 rounded-xs text-slate-400 hover:text-rose-500 inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="xl:col-span-4 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
              <StudioSectionHeader
                zone="telemetry"
                title="30-Day Revenue by Affiliate Partner"
                detail="Estimated USD from tracked EPC"
              />
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={affiliateChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252A36" strokeOpacity={0.22} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141720",
                        borderColor: "#252A36",
                        borderRadius: "2px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                    />
                    <Bar dataKey="revenueUsd" name="Est. 30d Revenue ($)" fill="#E1392B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: EMAIL CAPTURE BRIDGE LANDING PAGES + LIVE MOBILE PREVIEW */}
      {subView === "email-bridges" && (
        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-7 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <StudioSectionHeader
              zone="action"
              title="Email Capture Landing Pages (Short → Email → Affiliate)"
              detail="Own your audience before redirecting to partner affiliate links"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowLpForm((v) => !v)}
                  className="h-8 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showLpForm ? "Cancel" : "New Bridge Page"}</span>
                </button>
              }
            />

            {showLpForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!lpHeadline.trim() || !lpMagnet.trim()) return;
                  await onAddLandingPage({
                    headline: lpHeadline.trim(),
                    leadMagnetTitle: lpMagnet.trim(),
                    subheadline: lpSubheadline.trim(),
                    ctaButtonText: lpCta.trim() || "Send Me The Free Guide",
                    linkedAffiliateId: lpLinkedAff || undefined,
                    niche: lpNiche,
                  });
                  setLpHeadline("");
                  setLpMagnet("");
                  setShowLpForm(false);
                }}
                className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
              >
                <input
                  type="text"
                  required
                  value={lpHeadline}
                  onChange={(e) => setLpHeadline(e.target.value)}
                  placeholder="Headline (e.g., Free Local AI Video Stack Kit)"
                  className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <input
                  type="text"
                  required
                  value={lpMagnet}
                  onChange={(e) => setLpMagnet(e.target.value)}
                  placeholder="Lead Magnet (e.g., 12-Prompt Notion Pack + Script)"
                  className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <input
                  type="text"
                  value={lpSubheadline}
                  onChange={(e) => setLpSubheadline(e.target.value)}
                  placeholder="Subheadline promise"
                  className="sm:col-span-2 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                />
                <select
                  aria-label="Linked affiliate offer"
                  value={lpLinkedAff}
                  onChange={(e) => setLpLinkedAff(e.target.value)}
                  className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                >
                  <option value="">No redirect affiliate</option>
                  {affiliateOffers.map((a) => (
                    <option key={a.id} value={a.id}>
                      Redirect to: {a.partnerName}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Landing page niche"
                  value={lpNiche}
                  onChange={(e) => setLpNiche(e.target.value as ContentNiche)}
                  className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318]"
                >
                  <option value="tech-ai">AI &amp; Tech</option>
                  <option value="finance">Finance</option>
                  <option value="gaming">Gaming</option>
                  <option value="podcasts">Podcasts</option>
                  <option value="faceless-doc">Faceless Doc</option>
                </select>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] font-semibold"
                  >
                    Publish Bridge Page
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29]">
              {emailLandingPages.map((page) => {
                const optIn =
                  page.visitors30d > 0
                    ? ((page.subscribers30d / page.visitors30d) * 100).toFixed(1)
                    : "0.0";
                const linkedAff = affiliateOffers.find((a) => a.id === page.linkedAffiliateId);
                const selected = activePreviewPage?.id === page.id;
                return (
                  <div
                    key={page.id}
                    onClick={() => setPreviewPageId(page.id)}
                    className={`py-3.5 px-2.5 rounded-xs cursor-pointer transition-colors space-y-2 ${
                      selected ? "bg-[#E1392B]/[0.05]" : "hover:bg-[#F8FAFC] dark:hover:bg-[#151821]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-mono text-[11px] text-slate-500">
                          /{page.slug} · {page.niche} ·{" "}
                          <span
                            className={
                              page.active
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-slate-400"
                            }
                          >
                            {page.active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {page.headline}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateLandingPage(page.id, {
                              addVisitors: 50,
                              addSubscribers: 16,
                              addAffiliateClicks: 7,
                            })
                          }
                          className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] hover:border-emerald-500 text-[11px] font-mono"
                        >
                          +50 Visits
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateLandingPage(page.id, { active: !page.active })}
                          className="h-7 w-7 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] inline-flex items-center justify-center text-slate-500 hover:text-[#E1392B]"
                          title={page.active ? "Pause page" : "Activate page"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-slate-500">
                      <span>
                        {formatCompactNumber(page.visitors30d)} visits · {formatCompactNumber(page.subscribers30d)} emails ({optIn}%) · ${page.revenueAttributedUsd.toLocaleString()} rev
                      </span>
                      {linkedAff && (
                        <span className="text-[#E1392B] inline-flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          <span>{linkedAff.partnerName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Live Bridge Page Mobile Preview */}
          <aside className="xl:col-span-5 p-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] space-y-4">
            <StudioSectionHeader
              zone="telemetry"
              title="Live Bridge Funnel Mobile Preview"
              detail="Exact viewer journey from Short pinned link"
            />
            {activePreviewPage ? (
              <div className="max-w-xs mx-auto rounded-md border border-[#D4DAE4] dark:border-[#2A303E] bg-[#F8FAFC] dark:bg-[#0D0F14] p-5 space-y-4 text-center">
                <div className="font-mono text-[10px] text-[#E1392B] font-semibold">
                  clipforge.bio/{activePreviewPage.slug}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {activePreviewPage.headline}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activePreviewPage.subheadline}
                  </p>
                </div>
                <div className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Included: {activePreviewPage.leadMagnetTitle}
                </div>
                <div className="space-y-2">
                  <div className="h-9 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-white dark:bg-[#111318] flex items-center text-xs text-slate-400">
                    you@example.com
                  </div>
                  <div className="h-9 rounded-xs bg-[#E1392B] text-white text-xs font-semibold flex items-center justify-center">
                    {activePreviewPage.ctaButtonText}
                  </div>
                </div>
                {linkedAffiliateForPreview && (
                  <div className="pt-3 border-t border-[#E2E7F0] dark:border-[#1E222D] text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
                    <span>Redirects to {linkedAffiliateForPreview.partnerName}</span>
                    {isSafeHttpUrl(linkedAffiliateForPreview.destinationUrl) && (
                      <a
                        href={linkedAffiliateForPreview.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E1392B]"
                        aria-label="Open affiliate partner link"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">
                Create a bridge page to preview the viewer opt-in flow.
              </div>
            )}
          </aside>
        </div>
      )}

      {/* SUBVIEW 3: A/B FUNNEL TEST */}
      {subView === "ab-funnel" && (
        <div className="p-5">
          <AbFunnelTestPanel
            funnelTest={monetizationPlan?.funnelTest}
            isAnalyzingFunnel={isAnalyzingFunnel}
            isApplyingFunnelWinner={isApplyingFunnelWinner}
            onAddFunnelVariant={onAddFunnelVariant}
            onAnalyzeFunnel={onAnalyzeFunnel}
            onApplyFunnelWinner={onApplyFunnelWinner}
          />
        </div>
      )}
    </div>
  );
}
