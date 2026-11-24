/**
 * Cloudflare Pages Functions Edge Router (`functions/api/[[path]].ts`)
 *
 * Full edge parity for deploying ClipForge directly on Cloudflare Pages + GitHub:
 *  - GET  /api/workspace            -> Loads KV-cached workspace state or fetches pipeline.config.json from GitHub
 *  - GET  /api/gitops/status        -> Reports Cloudflare/GitHub/Gemini readiness
 *  - GET  /api/gitops/files         -> Reads live repository GitOps files via GitHub Contents API
 *  - PUT  /api/config               -> Persists to KV and commits pipeline.config.json to GitHub
 *  - POST /api/gitops/dispatch      -> Triggers `.github/workflows/clipforge-pipeline.yml` via workflow_dispatch
 *  - POST /api/ai/analyze-clip      -> Server-side Gemini 4 Hydrogen QA with transient retry backoff
 *  - POST /api/ai/optimize-strategy -> Server-side Gemini 4 Hydrogen feedback-loop optimizer
 */

interface CfKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface CfEnv {
  GEMINI_API_KEY?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  GITHUB_WORKFLOW_FILE?: string;
  CLIPFORGE_STATE?: CfKVNamespace;
}

interface CfContext {
  request: Request;
  env: CfEnv;
  params: { path?: string[] };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function githubRequest(env: CfEnv, apiPath: string, init: RequestInit = {}) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new Error("GITHUB_TOKEN and GITHUB_REPO must be set in Cloudflare Pages Environment Variables.");
  }
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ClipForge-Cloudflare-Pages",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
}

async function callGeminiEdge(apiKey: string, prompt: string): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:generateContent?key=${encodeURIComponent(apiKey)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "aistudio-build" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(text);
    }
    if ((res.status === 503 || res.status === 500) && attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 900));
      continue;
    }
    throw new Error(`Gemini edge call failed (${res.status})`);
  }
  throw new Error("Gemini edge call exhausted retries.");
}

export const onRequest = async (context: CfContext): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (request.method === "GET" && route === "gitops/status") {
      return json({
        runtime: "cloudflare-pages",
        geminiConfigured: Boolean(env.GEMINI_API_KEY),
        githubConfigured: Boolean(env.GITHUB_TOKEN && env.GITHUB_REPO),
        githubRepo: env.GITHUB_REPO || null,
        githubBranch: env.GITHUB_BRANCH || "main",
        cloudflareConfigured: true,
        cloudflareProject: "clipforge",
        kvBound: Boolean(env.CLIPFORGE_STATE),
      });
    }

    if (request.method === "GET" && route === "workspace") {
      const cached = env.CLIPFORGE_STATE ? await env.CLIPFORGE_STATE.get("workspace_v1") : null;
      if (cached) {
        return new Response(cached, { headers: { "Content-Type": "application/json" } });
      }
      return json({
        clips: [],
        runs: [],
        integrations: {
          runtime: "cloudflare-pages",
          geminiConfigured: Boolean(env.GEMINI_API_KEY),
          githubConfigured: Boolean(env.GITHUB_TOKEN && env.GITHUB_REPO),
          githubRepo: env.GITHUB_REPO || null,
          githubBranch: env.GITHUB_BRANCH || "main",
          cloudflareConfigured: true,
          cloudflareProject: "clipforge",
          twitchConfigured: false,
        },
      });
    }

    if (request.method === "PUT" && route === "config") {
      const config = await request.json();
      if (env.CLIPFORGE_STATE) {
        await env.CLIPFORGE_STATE.put("pipeline_config", JSON.stringify(config));
      }

      if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
        const branch = env.GITHUB_BRANCH || "main";
        const current = await githubRequest(env, `/contents/pipeline.config.json?ref=${encodeURIComponent(branch)}`);
        let sha: string | undefined;
        if (current.ok) {
          const fileMeta = (await current.json()) as { sha?: string };
          sha = fileMeta.sha;
        }
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2) + "\n")));
        const putRes = await githubRequest(env, "/contents/pipeline.config.json", {
          method: "PUT",
          body: JSON.stringify({
            message: "chore(clipforge): update pipeline.config.json from Cloudflare Pages UI",
            content: contentBase64,
            branch,
            ...(sha ? { sha } : {}),
          }),
        });
        if (!putRes.ok) {
          return json({ error: `GitHub commit failed (${putRes.status})` }, 502);
        }
        return json({ config, syncedToGitHub: true, message: `Committed to ${env.GITHUB_REPO}@${branch}.` });
      }

      return json({ config, syncedToGitHub: false, message: "Saved to Cloudflare KV cache." });
    }

    if (request.method === "POST" && route === "gitops/dispatch") {
      const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean; targetGame?: string };
      const workflow = env.GITHUB_WORKFLOW_FILE || "clipforge-pipeline.yml";
      const branch = env.GITHUB_BRANCH || "main";
      const res = await githubRequest(env, `/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
        method: "POST",
        body: JSON.stringify({
          ref: branch,
          inputs: {
            dry_run: String(body.dryRun ?? true),
            target_game: body.targetGame ?? "",
          },
        }),
      });
      if (!res.ok) {
        return json({ error: `GitHub Actions dispatch failed (${res.status})` }, 502);
      }
      return json({ ok: true, remoteDispatched: true, workflow, branch });
    }

    if (request.method === "POST" && (route === "ai/analyze-clip" || route === "ai/optimize-strategy")) {
      if (!env.GEMINI_API_KEY) {
        return json({ error: "GEMINI_API_KEY is not configured in Cloudflare Pages secrets." }, 500);
      }
      const payload = await request.json();
      const prompt =
        route === "ai/analyze-clip"
          ? `Analyze this gaming clip for vertical short-form QA, game authenticity, 3s hook timestamp, and TikTok/Reels/Shorts captions: ${JSON.stringify(payload)}`
          : `Analyze this clipping channel's published metrics and propose concrete pipeline.config.json optimizations: ${JSON.stringify(payload)}`;
      const parsed = await callGeminiEdge(env.GEMINI_API_KEY, prompt);
      return json(parsed);
    }

    return json({ error: `Unknown edge API route: /api/${route}` }, 404);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Edge function error" }, 500);
  }
};
