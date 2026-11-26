import { useState } from "react";
import { X, ShieldCheck, LogOut, UserCheck, Database, Loader2 } from "lucide-react";
import type { AuthUser } from "../types";

interface AuthAccountModalProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
  supabaseConfigured: boolean;
  onAuthSuccess: (token: string, user: AuthUser) => void;
  onLogout: () => void;
}

export function AuthAccountModal({
  open,
  onClose,
  user,
  supabaseConfigured,
  onAuthSuccess,
  onLogout,
}: AuthAccountModalProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(mode === "register" ? { displayName: displayName.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");
      onAuthSuccess(data.token, data.user);
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-sm border border-[#D9DEE7] dark:border-[#222631] bg-white dark:bg-[#141720] shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#D9DEE7] dark:border-[#222631] bg-[#ECEFF3]/70 dark:bg-[#111318] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#E1392B]" />
            <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Creator Account &amp; Database Sync
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F8F9FB] dark:bg-[#10131A] text-xs flex items-start gap-2.5">
            <Database className="w-4 h-4 text-[#E1392B] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {supabaseConfigured
                  ? "Supabase PostgreSQL & Auth Connected"
                  : "Server Persistence Active · Supabase Schema Ready"}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sessions use salted scrypt password hashing and in-memory signed Bearer tokens. Export the Supabase SQL schema anytime from AI Agent → Compute &amp; Hosting.
              </p>
            </div>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{user.displayName}</span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {user.email} · {user.role} · {user.planTier}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full h-9 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] hover:border-[#E1392B] text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-[#F6F7F9] dark:bg-[#10131A]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className={`h-8 rounded-xs font-semibold ${
                    mode === "register"
                      ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                      : "text-slate-500"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`h-8 rounded-xs font-semibold ${
                    mode === "login"
                      ? "bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A]"
                      : "text-slate-500"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {mode === "register" && (
                <label className="block space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">Display Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Creator Studio Name"
                    className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                  />
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Password (8+ characters)</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 rounded-sm border border-[#D9DEE7] dark:border-[#252A36] bg-white dark:bg-[#171A21]"
                />
              </label>

              {error && (
                <div className="p-2.5 rounded-sm bg-[#E1392B]/10 border border-[#E1392B]/30 text-[#E1392B] text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9 rounded-sm bg-[#E1392B] hover:bg-[#c83024] disabled:opacity-50 text-white font-semibold inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{mode === "register" ? "Create Creator Account" : "Sign In"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
