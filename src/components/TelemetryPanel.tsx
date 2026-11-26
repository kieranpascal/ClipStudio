import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { RefreshCw, Activity } from "lucide-react";
import type { TelemetryEvent } from "../types";

interface TelemetryPanelProps {
  events: TelemetryEvent[];
  onRefresh?: () => Promise<void> | void;
}

export function TelemetryPanel({ events, onRefresh }: TelemetryPanelProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | "gitops" | "gemini" | "local-llm">("all");

  const stats = useMemo(() => {
    const gitops = events.filter((e) => e.category === "gitops");
    const gemini = events.filter((e) => e.category === "gemini");

    const avgGitopsMs = gitops.length
      ? Math.round(gitops.reduce((sum, e) => sum + e.latencyMs, 0) / gitops.length)
      : 0;
    const avgGeminiMs = gemini.length
      ? Math.round(gemini.reduce((sum, e) => sum + e.latencyMs, 0) / gemini.length)
      : 0;

    const sortedLatencies = [...events].map((e) => e.latencyMs).sort((a, b) => a - b);
    const p95Ms =
      sortedLatencies.length > 0
        ? sortedLatencies[Math.min(sortedLatencies.length - 1, Math.floor(sortedLatencies.length * 0.95))]
        : 0;

    const geminiOk = gemini.filter((e) => e.success).length;
    const geminiSuccessRate = gemini.length ? Number(((geminiOk / gemini.length) * 100).toFixed(1)) : 100;

    const gitopsOk = gitops.filter((e) => e.success).length;
    const gitopsSuccessRate = gitops.length ? Number(((gitopsOk / gitops.length) * 100).toFixed(1)) : 100;

    return {
      avgGitopsMs,
      avgGeminiMs,
      p95Ms,
      geminiSuccessRate,
      gitopsSuccessRate,
      geminiCount: gemini.length,
      gitopsCount: gitops.length,
    };
  }, [events]);

  // Build time-series chart rows with rolling Gemini inference success rate (%)
  const chartSeries = useMemo(() => {
    const filtered = filterCategory === "all" ? events : events.filter((e) => e.category === filterCategory);
    let geminiSeen = 0;
    let geminiPassed = 0;

    return filtered.slice(-18).map((ev, idx) => {
      if (ev.category === "gemini") {
        geminiSeen += 1;
        if (ev.success) geminiPassed += 1;
      }
      const rollingSuccess = geminiSeen > 0 ? Number(((geminiPassed / geminiSeen) * 100).toFixed(1)) : 100;
      return {
        idx: idx + 1,
        time: ev.label,
        endpoint: ev.endpoint.replace("/api/ai/", ""),
        gitopsLatencyMs: ev.category === "gitops" ? ev.latencyMs : null,
        geminiLatencyMs: ev.category === "gemini" ? ev.latencyMs : null,
        latencyMs: ev.latencyMs,
        successRate: rollingSuccess,
        status: ev.success ? "OK" : "Error",
      };
    });
  }, [events, filterCategory]);

  // Endpoint-level reliability breakdown for BarChart
  const endpointBreakdown = useMemo(() => {
    const map = new Map<string, { endpoint: string; total: number; passed: number; avgMs: number }>();
    for (const ev of events) {
      const key = ev.endpoint.replace("/api/ai/", "ai/").replace("workflow_dispatch", "gha/dispatch");
      const curr = map.get(key) || { endpoint: key, total: 0, passed: 0, avgMs: 0 };
      curr.total += 1;
      if (ev.success) curr.passed += 1;
      curr.avgMs += ev.latencyMs;
      map.set(key, curr);
    }
    return Array.from(map.values())
      .map((item) => ({
        endpoint: item.endpoint,
        successPct: Number(((item.passed / item.total) * 100).toFixed(1)),
        avgMs: Math.round(item.avgMs / item.total),
        calls: item.total,
      }))
      .slice(0, 6);
  }, [events]);

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section
      aria-label="Pipeline and AI inference telemetry"
      className="border-b border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#0D0F14]"
    >
      {/* Header Row */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D9DEE7] dark:border-[#222631] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#E1392B]" />
          <h3 className="font-display text-sm font-bold text-[#0F1115] dark:text-[#EEF0F4]">
            Live GitOps Latency &amp; Gemini Inference Telemetry
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            · {events.length} recorded events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-[#ECEFF3] dark:bg-[#171A21] border border-[#D9DEE7] dark:border-[#262B37]">
            {(["all", "gitops", "gemini", "local-llm"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-xs capitalize transition-colors ${
                  filterCategory === cat
                    ? "bg-[#0F1115] dark:bg-[#EEF0F4] text-white dark:text-[#0F1115]"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F1115] dark:hover:text-white"
                }`}
              >
                {cat === "all"
                  ? "All Signals"
                  : cat === "gitops"
                    ? "GitOps"
                    : cat === "gemini"
                      ? "Gemini AI"
                      : "Local LLM"}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 px-2.5 rounded-sm border border-[#D9DEE7] dark:border-[#262B37] bg-[#F6F7F9] dark:bg-[#171A21] text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Hairline Metric Strip (flat architectural grid, zero rounded KPI boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#D9DEE7] dark:border-[#222631] divide-y lg:divide-y-0 lg:divide-x divide-[#D9DEE7] dark:divide-[#222631] bg-[#F6F7F9]/70 dark:bg-[#111318]">
        <div className="px-5 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Avg GitOps Pipeline Latency</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-[#0F1115] dark:text-[#EEF0F4]">
              {stats.avgGitopsMs} ms
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {stats.gitopsCount} runs
            </span>
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Gemini Inference Success Rate</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.geminiSuccessRate}%
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {stats.geminiCount} calls
            </span>
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Avg Gemini Response Time</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-[#2563EB] dark:text-sky-400">
              {stats.avgGeminiMs} ms
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">gemini-4-hydrogen</span>
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">P95 End-to-End Latency</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-[#E1392B]">
              {stats.p95Ms} ms
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              GitOps {stats.gitopsSuccessRate}% OK
            </span>
          </div>
        </div>
      </div>

      {/* Recharts 2-Pane Telemetry Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-[#D9DEE7] dark:divide-[#222631]">
        {/* Left Chart: Real-Time Latency (ms) & Rolling Gemini Success Rate (%) */}
        <div className="xl:col-span-8 p-4 sm:p-5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">
              Pipeline &amp; Inference Latency (ms) vs. Rolling Success Rate (%)
            </span>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
              <span className="text-[#E1392B]">■ Latency (ms)</span>
              <span className="text-emerald-500">— Gemini Success %</span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="clipforgeLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E1392B" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#E1392B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  unit="ms"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[50, 100]}
                  tick={{ fontSize: 10, fill: "#16A34A", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    borderColor: "#262B37",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#EEF0F4",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="latencyMs"
                  name="Latency (ms)"
                  stroke="#E1392B"
                  strokeWidth={2}
                  fill="url(#clipforgeLatencyGrad)"
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="successRate"
                  name="Gemini Success (%)"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#16A34A" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Per-Endpoint Success Rate (%) */}
        <div className="xl:col-span-4 p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#0F1115] dark:text-[#EEF0F4]">
              Success Rate by Route (%)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Live window</span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={endpointBreakdown}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 6, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="endpoint"
                  width={92}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    borderColor: "#262B37",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#EEF0F4",
                  }}
                />
                <Bar dataKey="successPct" name="Success %" radius={[0, 2, 2, 0]} barSize={14} isAnimationActive={false}>
                  {endpointBreakdown.map((entry) => (
                    <Cell
                      key={entry.endpoint}
                      fill={entry.successPct >= 90 ? "#16A34A" : entry.successPct >= 75 ? "#D97706" : "#E1392B"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
