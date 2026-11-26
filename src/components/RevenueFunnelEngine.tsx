import { useMemo, useState } from "react";
import {
  Link2,
  Mail,
  Film,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Send,
  Loader2,
  ArrowUpRight,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import type {
  AffiliateOfferLink,
  ClipItem,
  ContentNiche,
  EmailCaptureLandingPage,
  LongFormGraduationItem,
  RemoteBridgeConfig,
  RemoteMessagingPlatform,
} from "../types";
import { formatCompactNumber } from "../utils/ffmpeg";

interface RevenueFunnelEngineProps {
  clips: ClipItem[];
  affiliateOffers: AffiliateOfferLink[];
  emailLandingPages: EmailCaptureLandingPage[];
  longFormPipeline: LongFormGraduationItem[];
  remoteBridge?: RemoteBridgeConfig;
  onAddAffiliateOffer: (payload: {
    partnerName: string;
    niche: ContentNiche;
    offerHook: string;
    destinationUrl: string;
    commissionPct: number;
    estEpcUsd: number;
  }) => Promise<void>;
  onDeleteAffiliateOffer: (id: string) => Promise<void>;
  onAddLandingPage: (payload: {
    headline: string;
    leadMagnetTitle: string;
    subheadline: string;
    ctaButtonText: string;
    linkedAffiliateId?: string;
    niche: ContentNiche;
  }) => Promise<void>;
  onGraduateToLongForm: (clipId: string) => Promise<void>;
  onUpdateRemoteBridge: (patch: Partial<RemoteBridgeConfig>) => Promise<void>;
  onRunRemoteCommand: (platform: RemoteMessagingPlatform, command: string) => Promise<void>;
}

const SLASH_COMMANDS = ["/status", "/revenue", "/alerts", "/approve", "/top10"];

export function RevenueFunnelEngine({
  clips,
  affiliateOffers,
  emailLandingPages,
  longFormPipeline,
  remoteBridge,
  onAddAffiliateOffer,
  onDeleteAffiliateOffer,
  onAddLandingPage,
  onGraduateToLongForm,
  onUpdateRemoteBridge,
  onRunRemoteCommand,
}: RevenueFunnelEngineProps) {
  const [activeTab, setActiveTab] = useState<"affiliates" | "long-form" | "remote">("affiliates");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Affiliate Offer Form
  const [partnerName, setPartnerName] = useState("");
  const [affNiche, setAffNiche] = useState<ContentNiche>("tech-ai");
  const [offerHook, setOfferHook] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [commissionPct, setCommissionPct] = useState(25);
  const [estEpcUsd, setEstEpcUsd] = useState(1.8);
  const [savingAff, setSavingAff] = useState(false);

  // Email Capture Landing Page Form
  const [lpHeadline, setLpHeadline] = useState("");
  const [lpLeadMagnet, setLpLeadMagnet] = useState("");
  const [lpSubheadline, setLpSubheadline] = useState(
    "Enter your email to unlock the free toolkit + exclusive partner credits mentioned in the video."
  );
  const [lpCta, setLpCta] = useState("Send Me the Free Kit");
  const [lpAffiliateId, setLpAffiliateId] = useState(affiliateOffers[0]?.id || "");
  const [lpNiche, setLpNiche] = useState<ContentNiche>("tech-ai");
  const [savingLp, setSavingLp] = useState(false);

  // Long-form Graduation
  const [selectedClipId, setSelectedClipId] = useState(clips[0]?.id || "");
  const [graduating, setGraduating] = useState(false);

  // Remote Messaging Console
  const [cmdPlatform, setCmdPlatform] = useState<RemoteMessagingPlatform>("discord");
  const [cmdInput, setCmdInput] = useState("/revenue");
  const [sendingCmd, setSendingCmd] = useState(false);

  const funnelTotals = useMemo(() => {
    const totalVisitors = emailLandingPages.reduce((s, p) => s + p.visitors30d, 0);
    const totalSubs = emailLandingPages.reduce((s, p) => s + p.subscribers30d, 0);
    const optInRate = totalVisitors > 0 ? Math.round((totalSubs / totalVisitors) * 1000) / 10 : 0;
    const totalAffRev = emailLandingPages.reduce((s, p) => s + p.revenueAttributedUsd, 0);
    return { totalVisitors, totalSubs, optInRate, totalAffRev };
  }, [emailLandingPages]);

  function copyLink(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleSaveAffiliate(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerName.trim() || !destinationUrl.trim()) return;
    setSavingAff(true);
    try {
      await onAddAffiliateOffer({
        partnerName: partnerName.trim(),
        niche: affNiche,
        offerHook: offerHook.trim() || "Exclusive partner discount for viewers",
        destinationUrl: destinationUrl.trim(),
        commissionPct,
        estEpcUsd,
      });
      setPartnerName("");
      setOfferHook("");
      setDestinationUrl("");
    } finally {
      setSavingAff(false);
    }
  }

  async function handleSaveLandingPage(e: React.FormEvent) {
    e.preventDefault();
    if (!lpHeadline.trim() || !lpLeadMagnet.trim()) return;
    setSavingLp(true);
    try {
      await onAddLandingPage({
        headline: lpHeadline.trim(),
        leadMagnetTitle: lpLeadMagnet.trim(),
        subheadline: lpSubheadline.trim(),
        ctaButtonText: lpCta.trim() || "Get Free Access",
        linkedAffiliateId: lpAffiliateId || undefined,
        niche: lpNiche,
      });
      setLpHeadline("");
      setLpLeadMagnet("");
    } finally {
      setSavingLp(false);
    }
  }

  async function handleGraduate() {
    const id = selectedClipId || clips[0]?.id;
    if (!id) return;
    setGraduating(true);
    try {
      await onGraduateToLongForm(id);
    } finally {
      setGraduating(false);
    }
  }

  async function handleSendCommand(cmdOverride?: string) {
    const cmd = (cmdOverride || cmdInput).trim();
    if (!cmd) return;
    setSendingCmd(true);
    try {
      await onRunRemoteCommand(cmdPlatform, cmd);
      if (!cmdOverride) setCmdInput("");
    } finally {
      setSendingCmd(false);
    }
  }

  return (
    <section className="rounded-sm border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#141720] overflow-hidden">
      {/* Header + 3-Tab Switcher */}
      <div className="px-5 py-4 border-b border-[#D4DAE4] dark:border-[#1E222D] bg-[#ECEFF4]/70 dark:bg-[#111318] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Short-to-Revenue Funnel Engine &amp; Remote Command Bridge
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Turn views into owned email lists, affiliate payouts, long-form YouTube hits, and control alerts from Discord, Telegram, or WhatsApp.
          </p>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-xs bg-white dark:bg-[#161922] border border-[#D4DAE4] dark:border-[#232836] text-xs">
          {(
            [
              { id: "affiliates", label: "Affiliates & Email Pages", icon: Mail },
              { id: "long-form", label: `Short → Long-Form (${longFormPipeline.length})`, icon: Film },
              { id: "remote", label: "Discord / Telegram / WhatsApp", icon: MessageSquare },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? "bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AFFILIATE LINKS & EMAIL CAPTURE LANDING PAGES */}
      {activeTab === "affiliates" && (
        <div className="p-5 space-y-5 text-xs">
          {/* Funnel Conversion KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14]">
              <div className="text-slate-500">Landing Page Visitors (30d)</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                {formatCompactNumber(funnelTotals.totalVisitors)}
              </div>
            </div>
            <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14]">
              <div className="text-slate-500">Captured Email Subscribers</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#2563EB] dark:text-sky-400">
                {formatCompactNumber(funnelTotals.totalSubs)}{" "}
                <span className="text-[11px] font-normal text-slate-500">({funnelTotals.optInRate}% opt-in)</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14]">
              <div className="text-slate-500">Active Affiliate Partners</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                {affiliateOffers.length}
              </div>
            </div>
            <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14]">
              <div className="text-slate-500">Email → Affiliate Revenue</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                ${funnelTotals.totalAffRev.toLocaleString()}/mo
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left 6 cols: Affiliate Offer Manager */}
            <div className="xl:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-[#E1392B]" />
                  <span>Affiliate Link Stack (Pinned Comment &amp; Bio)</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">HTTPS validated</span>
              </div>

              <div className="space-y-2">
                {affiliateOffers.map((aff) => {
                  const fullTrackedUrl = `${aff.destinationUrl}${aff.destinationUrl.includes("?") ? "&" : "?"}${aff.utmCode}`;
                  return (
                    <div
                      key={aff.id}
                      className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            {aff.partnerName}
                          </div>
                          <div className="text-[11px] text-slate-500">{aff.offerHook}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {aff.commissionPct}% · ${aff.estEpcUsd.toFixed(2)} EPC
                          </span>
                          <button
                            type="button"
                            aria-label={`Copy affiliate link for ${aff.partnerName}`}
                            onClick={() => copyLink(aff.id, fullTrackedUrl)}
                            className="text-slate-400 hover:text-[#E1392B]"
                          >
                            {copiedId === aff.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete affiliate offer ${aff.partnerName}`}
                            onClick={() => onDeleteAffiliateOffer(aff.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-slate-500 pt-1 border-t border-[#D4DAE4] dark:border-[#1E222D]">
                        <span className="tabular-nums">
                          {formatCompactNumber(aff.clicks30d)} clicks · {aff.conversions30d} sales (30d)
                        </span>
                        <a
                          href={aff.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Verify URL</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSaveAffiliate}
                className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-2.5"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Add Affiliate Offer</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    required
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Partner name (e.g., ElevenLabs, NordVPN)"
                    className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                  />
                  <select
                    aria-label="Affiliate niche"
                    value={affNiche}
                    onChange={(e) => setAffNiche(e.target.value as ContentNiche)}
                    className="h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                  >
                    <option value="tech-ai">AI &amp; Tech</option>
                    <option value="finance">Finance</option>
                    <option value="gaming">Gaming</option>
                    <option value="podcasts">Podcasts</option>
                    <option value="faceless-doc">Faceless Doc</option>
                  </select>
                </div>
                <input
                  required
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://partner.example.com/?ref=yourcode"
                  className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] font-mono"
                />
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={offerHook}
                    onChange={(e) => setOfferHook(e.target.value)}
                    placeholder="Short-form CTA hook line..."
                    className="col-span-6 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                  />
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value) || 20)}
                    title="Commission %"
                    className="col-span-2 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] font-mono text-right"
                  />
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={25}
                    value={estEpcUsd}
                    onChange={(e) => setEstEpcUsd(Number(e.target.value) || 1.5)}
                    title="Est. EPC ($)"
                    className="col-span-2 h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] font-mono text-right"
                  />
                  <button
                    type="submit"
                    disabled={savingAff}
                    className="col-span-2 h-8 rounded-xs bg-[#E1392B] hover:bg-[#c83024] text-white font-semibold inline-flex items-center justify-center"
                  >
                    {savingAff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>

            {/* Right 6 cols: Email Capture Landing Pages Bridging Shorts -> Affiliate Offers */}
            <div className="xl:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#E1392B]" />
                  <span>Email Capture Bridge Pages (Shorts → Email → Affiliate)</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {emailLandingPages.map((page) => {
                  const linkedAff = affiliateOffers.find((a) => a.id === page.linkedAffiliateId);
                  const optIn =
                    page.visitors30d > 0
                      ? ((page.subscribers30d / page.visitors30d) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <div
                      key={page.id}
                      className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-[10px] text-[#E1392B] font-semibold">
                            clipforge.page{page.slug} · {page.niche}
                          </div>
                          <div className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            {page.headline}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Lead Magnet: {page.leadMagnetTitle}
                          </div>
                        </div>
                        <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                          ${page.revenueAttributedUsd.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D4DAE4] dark:border-[#1E222D] font-mono text-[10px] text-slate-500 tabular-nums">
                        <span>
                          {formatCompactNumber(page.visitors30d)} visits → {formatCompactNumber(page.subscribers30d)} emails ({optIn}%) → {page.affiliateClicksFromEmail} aff clicks
                        </span>
                        {linkedAff && (
                          <span className="text-[#2563EB] dark:text-sky-400">
                            Bridge: {linkedAff.partnerName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSaveLandingPage}
                className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-2.5"
              >
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Create Email Capture Landing Page
                </div>
                <input
                  required
                  type="text"
                  value={lpHeadline}
                  onChange={(e) => setLpHeadline(e.target.value)}
                  placeholder="Headline (e.g., Grab the Free 2026 AI Editing Preset Pack)"
                  className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                />
                <input
                  required
                  type="text"
                  value={lpLeadMagnet}
                  onChange={(e) => setLpLeadMagnet(e.target.value)}
                  placeholder="Lead magnet delivered after email signup..."
                  className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    aria-label="Linked affiliate offer"
                    value={lpAffiliateId}
                    onChange={(e) => setLpAffiliateId(e.target.value)}
                    className="h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                  >
                    <option value="">No Linked Affiliate</option>
                    {affiliateOffers.map((a) => (
                      <option key={a.id} value={a.id}>
                        Bridge → {a.partnerName}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Landing page niche"
                    value={lpNiche}
                    onChange={(e) => setLpNiche(e.target.value as ContentNiche)}
                    className="h-8 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720]"
                  >
                    <option value="tech-ai">AI &amp; Tech</option>
                    <option value="finance">Finance</option>
                    <option value="gaming">Gaming</option>
                    <option value="podcasts">Podcasts</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingLp}
                    className="h-8 px-3 rounded-xs bg-[#0F172A] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    {savingLp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Publish Bridge Page</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHORT-TO-LONG-FORM GRADUATION PIPELINE */}
      {activeTab === "long-form" && (
        <div className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                Graduate Winning Shorts into High-RPM Long-Form Videos ($12–$18 RPM)
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Shorts validate topic demand fast; graduate any breakout clip into a 10–15 minute YouTube deep-dive with chapters &amp; a dedicated mid-roll sponsor slot.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                aria-label="Select winning short clip to graduate to long-form"
                value={selectedClipId || clips[0]?.id || ""}
                onChange={(e) => setSelectedClipId(e.target.value)}
                className="h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-white dark:bg-[#141720] max-w-[260px] truncate"
              >
                {clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={graduating || clips.length === 0}
                onClick={handleGraduate}
                className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {graduating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                <span>Graduate to Long-Form</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {longFormPipeline.map((item) => (
              <article
                key={item.id}
                className="p-4 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-mono text-[10px] text-slate-500">
                      From Short: {item.sourceShortTitle} ({formatCompactNumber(item.shortViews)} views · {item.shortWatchPct}% hold)
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {item.longFormTitle}
                    </h3>
                  </div>
                  <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                    ${item.estLongFormRpmUsd.toFixed(2)} RPM · {item.targetDurationMin}m
                  </span>
                </div>

                <ol className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {item.chapters.map((ch, idx) => (
                    <li key={idx}>{ch}</li>
                  ))}
                </ol>

                <div className="pt-2 border-t border-[#D4DAE4] dark:border-[#1E222D] flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">{item.sponsorSlotNote}</span>
                  <span className="font-mono uppercase font-semibold text-[#E1392B] shrink-0">
                    {item.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DISCORD / TELEGRAM / WHATSAPP REMOTE CONTROL & ALERTS BRIDGE */}
      {activeTab === "remote" && remoteBridge && (
        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 text-xs">
          {/* Left 6 cols: Channel & Alert Routing Config */}
          <div className="xl:col-span-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                  Connected Messaging Channels
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secrets in server .env only</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      key: "discordEnabled" as const,
                      label: "Discord",
                      envReady: remoteBridge.envConfigured.discord,
                      envHint: "DISCORD_WEBHOOK_URL",
                    },
                    {
                      key: "telegramEnabled" as const,
                      label: "Telegram",
                      envReady: remoteBridge.envConfigured.telegram,
                      envHint: "TELEGRAM_BOT_TOKEN",
                    },
                    {
                      key: "whatsappEnabled" as const,
                      label: "WhatsApp",
                      envReady: remoteBridge.envConfigured.whatsapp,
                      envHint: "WHATSAPP_CLOUD_TOKEN",
                    },
                  ] as const
                ).map((ch) => (
                  <label
                    key={ch.key}
                    className="p-3 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] flex flex-col gap-1.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{ch.label}</span>
                      <input
                        type="checkbox"
                        checked={remoteBridge[ch.key]}
                        onChange={(e) => onUpdateRemoteBridge({ [ch.key]: e.target.checked })}
                        className="accent-[#E1392B]"
                      />
                    </div>
                    <span
                      className={`font-mono text-[10px] ${
                        ch.envReady ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {ch.envReady ? "Live Webhook Ready" : `Set ${ch.envHint}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Automatic Push Triggers
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { key: "alertOnRevenueSurge" as const, label: "+15% ROI Surge Alerts" },
                    { key: "alertOnCompetitorRelease" as const, label: "Competitor Niche Releases" },
                    { key: "alertOnSponsorBurnRate" as const, label: "Sponsor Burn-Rate (-10% ROI)" },
                    { key: "alertOnApprovalGates" as const, label: "Mission Approval Gates" },
                  ] as const
                ).map((trg) => (
                  <label
                    key={trg.key}
                    className="px-3 py-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="text-slate-700 dark:text-slate-200">{trg.label}</span>
                    <input
                      type="checkbox"
                      checked={remoteBridge[trg.key]}
                      onChange={(e) => onUpdateRemoteBridge({ [trg.key]: e.target.checked })}
                      className="accent-[#E1392B]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right 6 cols: Live Slash-Command Bridge Console */}
          <div className="xl:col-span-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#E1392B]" />
                <span>Remote Slash-Command Console</span>
              </span>
              <select
                aria-label="Target remote messaging platform"
                value={cmdPlatform}
                onChange={(e) => setCmdPlatform(e.target.value as RemoteMessagingPlatform)}
                className="h-7 px-2 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] font-mono text-[11px]"
              >
                <option value="discord">Discord Bot</option>
                <option value="telegram">Telegram Bot</option>
                <option value="whatsapp">WhatsApp Cloud</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SLASH_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  disabled={sendingCmd}
                  onClick={() => handleSendCommand(cmd)}
                  className="px-2.5 py-1 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] hover:border-[#E1392B] font-mono text-[11px] text-[#0F172A] dark:text-slate-200"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                placeholder="Send /status, /revenue, /alerts, /approve, or /top10..."
                className="flex-1 h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#232836] bg-[#F8F9FB] dark:bg-[#0D0F14] font-mono"
              />
              <button
                type="submit"
                disabled={sendingCmd || !cmdInput.trim()}
                className="h-8 px-3.5 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
              >
                {sendingCmd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch</span>
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto divide-y divide-[#D4DAE4] dark:divide-[#1E222D] border border-[#D4DAE4] dark:border-[#232836] rounded-xs bg-[#F8F9FB] dark:bg-[#0D0F14]">
              {remoteBridge.commandHistory.map((entry) => (
                <div key={entry.id} className="p-2.5 space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                    <span>
                      <strong className="uppercase text-[#E1392B]">{entry.platform}</strong> · {entry.commandOrEvent}
                    </span>
                    <span className="tabular-nums">
                      {entry.status === "delivered" ? "LIVE SENT" : "LOCAL LOG"} ·{" "}
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-200">{entry.responseSummary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
