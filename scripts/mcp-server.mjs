#!/usr/bin/env node
/**
 * ClipForge MCP (Model Context Protocol) Agent Bridge (`scripts/mcp-server.mjs`)
 *
 * Inspired by OpenShorts MCP architecture: exposes ClipForge's Cloudflare Pages / Express
 * control plane over stdio JSON-RPC so coding agents (Claude Code, Cursor, Gemini CLI)
 * can scan Twitch radar, run Gemini QA, generate A/B hooks, or dispatch GitHub Actions renders.
 *
 * Usage:
 *   CLIPFORGE_BASE_URL=https://clipforge.pages.dev node scripts/mcp-server.mjs
 */

import readline from "node:readline";

const BASE_URL = process.env.CLIPFORGE_BASE_URL || "http://localhost:3000";

const TOOLS = [
  {
    name: "clipforge_list_clips",
    description: "List all ingested clips with velocity, saturation, DMCA risk, and QA status.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "clipforge_audit_clip",
    description: "Run Gemini 4 Hydrogen QA, game authenticity check, DMCA check, and hook extraction on a clip.",
    inputSchema: {
      type: "object",
      properties: { clipId: { type: "string" } },
      required: ["clipId"],
    },
  },
  {
    name: "clipforge_generate_hooks",
    description: "Generate 3 A/B/C viral opening hook variants for a clip via Gemini 4 Hydrogen.",
    inputSchema: {
      type: "object",
      properties: { clipId: { type: "string" } },
      required: ["clipId"],
    },
  },
  {
    name: "clipforge_dispatch_render",
    description: "Trigger the GitHub Actions FFmpeg autonomous clipping workflow.",
    inputSchema: {
      type: "object",
      properties: { dryRun: { type: "boolean", default: true } },
    },
  },
];

async function handleToolCall(name, args = {}) {
  if (name === "clipforge_list_clips") {
    const res = await fetch(`${BASE_URL}/api/workspace`);
    const ws = await res.json();
    return ws.clips;
  }
  if (name === "clipforge_audit_clip") {
    const res = await fetch(`${BASE_URL}/api/ai/analyze-clip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId: args.clipId }),
    });
    return res.json();
  }
  if (name === "clipforge_generate_hooks") {
    const res = await fetch(`${BASE_URL}/api/ai/generate-hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId: args.clipId }),
    });
    return res.json();
  }
  if (name === "clipforge_dispatch_render") {
    const res = await fetch(`${BASE_URL}/api/gitops/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: args.dryRun ?? true }),
    });
    return res.json();
  }
  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }

  try {
    if (req.method === "initialize") {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: req.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "clipforge-mcp", version: "1.0.0" },
          },
        }) + "\n"
      );
    } else if (req.method === "tools/list") {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { tools: TOOLS } }) + "\n");
    } else if (req.method === "tools/call") {
      const data = await handleToolCall(req.params.name, req.params.arguments);
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: req.id,
          result: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] },
        }) + "\n"
      );
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
      }) + "\n"
    );
  }
});
