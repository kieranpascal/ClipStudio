import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Hash,
  Loader2,
  MessageSquare,
  Save,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { RemoteBridgeConfig } from "../types";
import { StudioSectionHeader } from "./StudioChrome";

interface DiscordAlertsConfigPanelProps {
  remoteBridge?: RemoteBridgeConfig;
  isDispatchingAlert?: boolean;
  onUpdateRemoteBridge: (patch: Partial<RemoteBridgeConfig>) => Promise<void>;
  onDispatchDiscordAlert: (payload: {
    alertType: "mission-success" | "roi-surge";
    customNote?: string;
  }) => Promise<void>;
}

export function DiscordAlertsConfigPanel({
  remoteBridge,
  isDispatchingAlert = false,
  onUpdateRemoteBridge,
  onDispatchDiscordAlert,
}: DiscordAlertsConfigPanelProps) {
  const [discordEnabled, setDiscordEnabled] = useState(remoteBridge?.discordEnabled ?? true);
  const [channelName, setChannelName] = useState(
    remoteBridge?.discordChannelName || "#ai-director-alerts"
  );
  const [alertOnMissionSuccess, setAlertOnMissionSuccess] = useState(
    remoteBridge?.alertOnMissionSuccess ?? true
  );
  const [alertOnRevenueSurge, setAlertOnRevenueSurge] = useState(
    remoteBridge?.alertOnRevenueSurge ?? true
  );
  const [roiSurgeThresholdPct, setRoiSurgeThresholdPct] = useState(
    remoteBridge?.roiSurgeThresholdPct ?? 15
  );
  const [alertOnCompetitorRelease, setAlertOnCompetitorRelease] = useState(
    remoteBridge?.alertOnCompetitorRelease ?? true
  );
  const [alertOnSponsorBurnRate, setAlertOnSponsorBurnRate] = useState(
    remoteBridge?.alertOnSponsorBurnRate ?? true
  );
  const [alertOnApprovalGates, setAlertOnApprovalGates] = useState(
    remoteBridge?.alertOnApprovalGates ?? true
  );
  const [mentionMode, setMentionMode] = useState<"none" | "here" | "role">(
    remoteBridge?.discordMentionMode || "none"
  );
  const [mentionRole, setMentionRole] = useState(
    remoteBridge?.discordMentionRole || "@RevenueOps"
  );
  const [richEmbeds, setRichEmbeds] = useState(remoteBridge?.discordRichEmbeds ?? true);
  const [dailyDigestTime, setDailyDigestTime] = useState(remoteBridge?.dailyDigestTime || "09:00");
  const [customNote, setCustomNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [dispatchingType, setDispatchingType] = useState<"mission-success" | "roi-surge" | null>(
    null
  );

  useEffect(() => {
    if (!remoteBridge) return;
    setDiscordEnabled(remoteBridge.discordEnabled);
    setChannelName(remoteBridge.discordChannelName || "#ai-director-alerts");
    setAlertOnMissionSuccess(remoteBridge.alertOnMissionSuccess ?? true);
    setAlertOnRevenueSurge(remoteBridge.alertOnRevenueSurge);
    setRoiSurgeThresholdPct(remoteBridge.roiSurgeThresholdPct ?? 15);
    setAlertOnCompetitorRelease(remoteBridge.alertOnCompetitorRelease);
    setAlertOnSponsorBurnRate(remoteBridge.alertOnSponsorBurnRate);
    setAlertOnApprovalGates(remoteBridge.alertOnApprovalGates);
    setMentionMode(remoteBridge.discordMentionMode || "none");
    setMentionRole(remoteBridge.discordMentionRole || "@RevenueOps");
    setRichEmbeds(remoteBridge.discordRichEmbeds ?? true);
    setDailyDigestTime(remoteBridge.dailyDigestTime || "09:00");
  }, [remoteBridge]);

  const discordLogs = useMemo(() => {
    return (remoteBridge?.commandHistory || [])
      .filter((entry) => entry.platform === "discord")
      .slice(0, 8);
  }, [remoteBridge?.commandHistory]);

  const isWebhookLive = Boolean(remoteBridge?.envConfigured?.discord);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateRemoteBridge({
        discordEnabled,
        discordChannelName: channelName,
        alertOnMissionSuccess,
        alertOnRevenueSurge,
        roiSurgeThresholdPct,
        alertOnCompetitorRelease,
        alertOnSponsorBurnRate,
        alertOnApprovalGates,
        discordMentionMode: mentionMode,
        discordMentionRole: mentionRole,
        discordRichEmbeds: richEmbeds,
        dailyDigestTime,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDispatch(alertType: "mission-success" | "roi-surge") {
    setDispatchingType(alertType);
    try {
      await onDispatchDiscordAlert({
        alertType,
        customNote: customNote.trim() || undefined,
      });
      setCustomNote("");
    } finally {
      setDispatchingType(null);
    }
  }

  const normalizedChannel = channelName.trim()
    ? channelName.trim().startsWith("#")
      ? channelName.trim()
      : `#${channelName.trim()}`
    : "#ai-director-alerts";

  return (
    <div className="space-y-5">
      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 7 cols: Routing & Alert Trigger Configuration */}
        <section className="xl:col-span-7 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 space-y-5">
          <StudioSectionHeader
            zone="action"
            title="AI Director → Discord Channel Alert Configuration"
            detail="Routes Mission Success and ROI Surge alerts through the server-side Remote Bridge integration"
            rightSlot={
              <span className="font-mono text-[11px] tabular-nums text-slate-500">
                {isWebhookLive ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Live Webhook Connected
                  </span>
                ) : (
                  <span>Server Preview Mode</span>
                )}
              </span>
            }
          />

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Bridge Master Switch + Dedicated Channel Input */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-[#EEF1F6] dark:border-[#1E222D]">
              <label className="sm:col-span-5 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] cursor-pointer">
                <div>
                  <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Discord Remote Bridge
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {discordEnabled ? "Outbound alerts active" : "Outbound alerts paused"}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={discordEnabled}
                  onChange={(e) => setDiscordEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#E1392B]"
                />
              </label>

              <label className="sm:col-span-4 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span>Target Discord Channel</span>
                </span>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="#ai-director-alerts"
                  maxLength={44}
                  className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] font-mono text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
                />
              </label>

              <label className="sm:col-span-3 space-y-1">
                <span className="text-[11px] font-mono text-slate-500">ROI Surge Threshold (%)</span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  step={1}
                  value={roiSurgeThresholdPct}
                  onChange={(e) =>
                    setRoiSurgeThresholdPct(
                      Math.max(5, Math.min(100, Number(e.target.value) || 15))
                    )
                  }
                  className="w-full h-9 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] font-mono tabular-nums text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
                />
              </label>
            </div>

            {/* Primary AI Director Alert Triggers */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500">
                AI Director Event Routing Rules
              </div>
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29] border border-[#D4DAE4] dark:border-[#222631] rounded-xs">
                {[
                  {
                    id: "mission-success",
                    title: "Mission Success Alerts",
                    desc: "Post completion summary, winning clip hook, and learned updates when an autonomous mission finishes.",
                    checked: alertOnMissionSuccess,
                    onChange: setAlertOnMissionSuccess,
                    highlight: true,
                  },
                  {
                    id: "roi-surge",
                    title: `ROI Surge Alerts (+${roiSurgeThresholdPct}% Threshold)`,
                    desc: "Alert immediately when a niche or editing format spikes above your ROI threshold with 1-click shift notes.",
                    checked: alertOnRevenueSurge,
                    onChange: setAlertOnRevenueSurge,
                    highlight: true,
                  },
                  {
                    id: "competitor",
                    title: "Competitive Niche Releases",
                    desc: "Notify when a rival channel posts in an under-monetized sub-niche ready for rapid-response clipping.",
                    checked: alertOnCompetitorRelease,
                    onChange: setAlertOnCompetitorRelease,
                    highlight: false,
                  },
                  {
                    id: "sponsor-burn",
                    title: "Sponsor Health & Burn Rate Drops",
                    desc: "Flag top sponsor campaigns when projected ROI falls more than 10% below the 30-day average.",
                    checked: alertOnSponsorBurnRate,
                    onChange: setAlertOnSponsorBurnRate,
                    highlight: false,
                  },
                  {
                    id: "approval-gates",
                    title: "Approval Gate Pauses",
                    desc: "Ping Discord when an autonomous pipeline pauses for human sign-off (/approve supported remotely).",
                    checked: alertOnApprovalGates,
                    onChange: setAlertOnApprovalGates,
                    highlight: false,
                  },
                ].map((rule) => (
                  <label
                    key={rule.id}
                    className="flex items-start justify-between gap-4 px-3.5 py-2.5 hover:bg-[#F8FAFC] dark:hover:bg-[#151822] cursor-pointer"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                        <span>{rule.title}</span>
                        {rule.highlight && (
                          <span className="font-mono text-[10px] font-medium text-[#E1392B]">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{rule.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={rule.checked}
                      onChange={(e) => rule.onChange(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#E1392B] shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Formatting & Mention Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="space-y-1">
                <span className="text-[11px] font-mono text-slate-500">Mention Target</span>
                <select
                  value={mentionMode}
                  onChange={(e) => setMentionMode(e.target.value as "none" | "here" | "role")}
                  className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-xs"
                >
                  <option value="none">No Ping (Silent)</option>
                  <option value="here">@here Active Ops</option>
                  <option value="role">Custom Role Tag</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-mono text-slate-500">
                  {mentionMode === "role" ? "Role Label" : "Daily Digest (UTC)"}
                </span>
                {mentionMode === "role" ? (
                  <input
                    type="text"
                    value={mentionRole}
                    onChange={(e) => setMentionRole(e.target.value)}
                    placeholder="@RevenueOps"
                    maxLength={36}
                    className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] font-mono text-xs"
                  />
                ) : (
                  <input
                    type="time"
                    value={dailyDigestTime}
                    onChange={(e) => setDailyDigestTime(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] font-mono tabular-nums text-xs"
                  />
                )}
              </label>

              <label className="flex items-center justify-between gap-2 px-3 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] h-8 self-end cursor-pointer">
                <span className="text-[11px] font-medium text-[#0F172A] dark:text-slate-200">
                  Discord Rich Embeds
                </span>
                <input
                  type="checkbox"
                  checked={richEmbeds}
                  onChange={(e) => setRichEmbeds(e.target.checked)}
                  className="accent-[#E1392B]"
                />
              </label>
            </div>

            {/* Server-side security note + Save button */}
            <div className="pt-3 border-t border-[#EEF1F6] dark:border-[#1E222D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Webhook credentials stay on the server via{" "}
                  <code className="font-mono text-[#0F172A] dark:text-slate-300">
                    DISCORD_WEBHOOK_URL
                  </code>{" "}
                  (restricted to verified Discord HTTPS endpoints).
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="h-8 px-4 rounded-xs bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Discord Routing</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right 5 cols: Live AI Director Dispatch & Preview */}
        <section className="xl:col-span-5 rounded-xs border border-[#D4DAE4] dark:border-[#1E222D] bg-white dark:bg-[#111318] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <StudioSectionHeader
              zone="telemetry"
              title="Instant AI Director Dispatch & Preview"
              detail={`Target channel: ${normalizedChannel}`}
            />

            {/* Payload Preview */}
            <div className="p-3.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5 text-[#0F172A] dark:text-slate-200 font-semibold">
                  <MessageSquare className="w-3 h-3 text-[#E1392B]" />
                  <span>ClipForge AI Director</span>
                </span>
                <span>
                  {normalizedChannel} · {richEmbeds ? "Rich Embed" : "Plain Text"}
                </span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {mentionMode === "here"
                    ? "@here "
                    : mentionMode === "role"
                      ? `${mentionRole || "@RevenueOps"} `
                      : ""}
                  ROI Surge / Mission Success Dispatch
                </div>
                <p>
                  Automatically attaches active mission completion stats or top ROI surge alert (&ge;
                  +{roiSurgeThresholdPct}%) along with the AI Director&apos;s recommended channel shift.
                </p>
              </div>
            </div>

            {/* Optional Operator Context Note */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-500">
                Optional Dispatch Note (appended to alert)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                maxLength={180}
                placeholder="e.g., Double mid-roll affiliate slots on Friday schedule..."
                className="w-full h-8 px-2.5 rounded-xs border border-[#D4DAE4] dark:border-[#252A36] bg-[#F8FAFC] dark:bg-[#0D0F14] text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E1392B]"
              />
            </div>

            {/* Instant Dispatch Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!discordEnabled || isDispatchingAlert || dispatchingType !== null}
                onClick={() => handleDispatch("mission-success")}
                className="h-9 px-3 rounded-xs border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 disabled:opacity-45 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {dispatchingType === "mission-success" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Post Mission Success</span>
              </button>

              <button
                type="button"
                disabled={!discordEnabled || isDispatchingAlert || dispatchingType !== null}
                onClick={() => handleDispatch("roi-surge")}
                className="h-9 px-3 rounded-xs bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {dispatchingType === "roi-surge" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>Post ROI Surge Alert</span>
              </button>
            </div>
          </div>

          {/* Delivery Log */}
          <div className="pt-4 border-t border-[#EEF1F6] dark:border-[#1E222D] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-[#E1392B]" />
                <span>Recent Discord Dispatches</span>
              </span>
              <span className="tabular-nums">{discordLogs.length} logged</span>
            </div>

            {discordLogs.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 border border-dashed border-[#D4DAE4] dark:border-[#252A36] rounded-xs">
                No Discord alerts dispatched yet. Click &ldquo;Post Mission Success&rdquo; or &ldquo;Post ROI Surge Alert&rdquo; above.
              </div>
            ) : (
              <div className="divide-y divide-[#EEF1F6] dark:divide-[#1A1E29] max-h-56 overflow-y-auto">
                {discordLogs.map((log) => (
                  <div key={log.id} className="py-2 first:pt-0 last:pb-0 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                      <span className="font-semibold text-[#0F172A] dark:text-slate-200 truncate inline-flex items-center gap-1">
                        <Send className="w-2.5 h-2.5 text-[#E1392B] shrink-0" />
                        <span className="truncate">{log.commandOrEvent}</span>
                      </span>
                      <span
                        className={`shrink-0 ${
                          log.status === "delivered"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : log.status === "error"
                              ? "text-[#E1392B]"
                              : "text-slate-500"
                        }`}
                      >
                        {log.status === "delivered"
                          ? "Delivered"
                          : log.status === "error"
                            ? "Webhook Error"
                            : "Local Preview"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {log.responseSummary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
