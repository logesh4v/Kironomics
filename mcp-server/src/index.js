#!/usr/bin/env node
/**
 * Kironomics MCP Server
 * 
 * Exposes a single tool: setup_kironomics
 * When called with an API key, it creates the 3 hook files
 * in the workspace's .kiro/hooks/ directory.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Production backend URL — change this after deploying to EC2
const BACKEND_URL = process.env.KIRONOMICS_BACKEND_URL || "http://localhost:8080";

const server = new McpServer({
  name: "kironomics",
  version: "1.0.0",
});

// --- Tool: setup_kironomics ---
server.tool(
  "setup_kironomics",
  "Set up Kironomics tracking in this workspace. Creates hook files that silently track your Kiro usage (prompts, tool calls, sessions) and send metrics to the Kironomics leaderboard.",
  {
    api_key: z.string().describe("Your Kironomics API key from the dashboard"),
    workspace_path: z.string().optional().describe("Path to the workspace root (defaults to current directory)"),
  },
  async ({ api_key, workspace_path }) => {
    const root = workspace_path || process.cwd();
    const hooksDir = join(root, ".kiro", "hooks");

    // Create hooks directory if it doesn't exist
    if (!existsSync(hooksDir)) {
      mkdirSync(hooksDir, { recursive: true });
    }

    // Hook 1: Tool counter (postToolUse — silent, writes to /tmp/)
    const toolHook = {
      enabled: true,
      name: "Kironomics Tool Counter",
      version: "1.0.0",
      description: "Silently counts tool calls for Kironomics leaderboard",
      when: { type: "postToolUse", toolTypes: ["*"] },
      then: {
        type: "runCommand",
        command: `bash -c 'FILE=/tmp/kironomics_tools; COUNT=$(cat "$FILE" 2>/dev/null || echo 0); echo $((COUNT + 1)) > "$FILE"; echo ok'`,
        timeout: 2,
      },
    };

    // Hook 2: Prompt counter (promptSubmit — silent, writes to /tmp/)
    const promptHook = {
      enabled: true,
      name: "Kironomics Prompt Counter",
      version: "1.0.0",
      description: "Silently counts prompts for Kironomics leaderboard",
      when: { type: "promptSubmit" },
      then: {
        type: "runCommand",
        command: `bash -c 'START=/tmp/kironomics_start; PFILE=/tmp/kironomics_prompts; test -f "$START" || date +%s > "$START"; COUNT=$(cat "$PFILE" 2>/dev/null || echo 0); echo $((COUNT + 1)) > "$PFILE"; echo ok'`,
        timeout: 2,
      },
    };

    // Hook 3: Session reporter (agentStop — sends batch to server)
    const sessionHook = {
      enabled: true,
      name: "Kironomics Session Reporter",
      version: "1.0.0",
      description: "Sends session metrics to Kironomics when agent stops",
      when: { type: "agentStop" },
      then: {
        type: "runCommand",
        command: `bash -c 'TOOLS=$(cat /tmp/kironomics_tools 2>/dev/null || echo 0); PROMPTS=$(cat /tmp/kironomics_prompts 2>/dev/null || echo 0); START=$(cat /tmp/kironomics_start 2>/dev/null || date +%s); ELAPSED=$(($(date +%s) - START)); curl -s ${BACKEND_URL}/api/session -H "Content-Type: application/json" -d "{\\"token\\":\\"${api_key}\\",\\"tool_calls\\":$TOOLS,\\"prompts\\":$PROMPTS,\\"elapsed_seconds\\":$ELAPSED}" > /dev/null 2>&1; rm -f /tmp/kironomics_tools /tmp/kironomics_prompts /tmp/kironomics_start; echo ok'`,
        timeout: 10,
      },
    };

    // Write hook files
    try {
      writeFileSync(
        join(hooksDir, "kironomics-tool-counter.kiro.hook"),
        JSON.stringify(toolHook, null, 2) + "\n"
      );
      writeFileSync(
        join(hooksDir, "kironomics-prompt-counter.kiro.hook"),
        JSON.stringify(promptHook, null, 2) + "\n"
      );
      writeFileSync(
        join(hooksDir, "kironomics-session-reporter.kiro.hook"),
        JSON.stringify(sessionHook, null, 2) + "\n"
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Kironomics setup complete!\n\nCreated 3 hooks in ${hooksDir}:\n- kironomics-tool-counter.kiro.hook (counts tool calls silently)\n- kironomics-prompt-counter.kiro.hook (counts prompts silently)\n- kironomics-session-reporter.kiro.hook (sends batch at session end)\n\nYour metrics will now be tracked automatically. View your stats at the Kironomics dashboard.\n\nBackend: ${BACKEND_URL}\nAPI Key: ${api_key.slice(0, 8)}...`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Setup failed: ${err.message}\n\nMake sure the workspace path is correct and you have write permissions to .kiro/hooks/`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Tool: kironomics_status ---
server.tool(
  "kironomics_status",
  "Check if Kironomics is set up in this workspace and show current session counters.",
  {},
  async () => {
    const { readFileSync } = await import("node:fs");
    
    let tools = "0", prompts = "0", start = "not started";
    try { tools = readFileSync("/tmp/kironomics_tools", "utf-8").trim(); } catch {}
    try { prompts = readFileSync("/tmp/kironomics_prompts", "utf-8").trim(); } catch {}
    try { start = readFileSync("/tmp/kironomics_start", "utf-8").trim(); } catch {}

    const elapsed = start !== "not started" 
      ? Math.floor(Date.now() / 1000) - parseInt(start) 
      : 0;

    return {
      content: [
        {
          type: "text",
          text: `📊 Kironomics Status\n\nCurrent session:\n- Tool calls: ${tools}\n- Prompts: ${prompts}\n- Session duration: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s\n\nBackend: ${BACKEND_URL}`,
        },
      ],
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
