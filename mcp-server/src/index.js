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

    // Hook 3: Session reporter (agentStop — runs Python helper that reads state.vscdb)
    const reporterScript = join(root, ".kiro", "kironomics_report.py");
    const sessionHook = {
      enabled: true,
      name: "Kironomics Session Reporter",
      version: "1.0.0",
      description: "Reads Kiro's credit usage and sends session data to backend",
      when: { type: "agentStop" },
      then: {
        type: "runCommand",
        command: `python3 "${reporterScript}" "${api_key}" "${BACKEND_URL}" 2>/dev/null; echo ok`,
        timeout: 10,
      },
    };

    // Write hook files
    try {
      // Write the Python helper script (reads state.vscdb, sends to backend)
      const reporterScriptPath = join(root, ".kiro", "kironomics_report.py");
      const reporterScriptContent = `#!/usr/bin/env python3
"""Kironomics session reporter - reads Kiro's state.vscdb and sends to backend."""
import sys, os, json, sqlite3, urllib.request, urllib.error
from pathlib import Path

api_key = sys.argv[1] if len(sys.argv) > 1 else ""
backend_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8080"

# Read counters
def read_int(path, default=0):
    try: return int(Path(path).read_text().strip())
    except: return default

tools = read_int("/tmp/kironomics_tools")
prompts = read_int("/tmp/kironomics_prompts")
start = read_int("/tmp/kironomics_start", int(__import__("time").time()))
elapsed = max(0, int(__import__("time").time()) - start)

# Read Kiro's state.vscdb (silent fail if missing)
plan_data = {}
try:
    db = Path.home() / "Library/Application Support/Kiro/User/globalStorage/state.vscdb"
    if db.exists():
        conn = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        row = conn.execute("SELECT value FROM ItemTable WHERE key=?", ("kiro.kiroAgent",)).fetchone()
        conn.close()
        if row:
            state = json.loads(row[0])
            usage = state.get("kiro.resourceNotifications.usageState", {})
            breakdowns = usage.get("usageBreakdowns", [])
            if breakdowns:
                bd = breakdowns[0]
                plan_data = {
                    "currentUsage": bd.get("currentUsage"),
                    "usageLimit": bd.get("usageLimit"),
                    "percentageUsed": bd.get("percentageUsed"),
                    "resetDate": bd.get("resetDate"),
                }
except Exception: pass

# Build payload
payload = {
    "token": api_key,
    "tool_calls": tools,
    "prompts": prompts,
    "elapsed_seconds": elapsed,
    **plan_data,
}

# POST to backend (silent fail)
try:
    req = urllib.request.Request(
        f"{backend_url}/api/session",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req, timeout=5).read()
except Exception: pass

# Cleanup
for f in ["/tmp/kironomics_tools", "/tmp/kironomics_prompts", "/tmp/kironomics_start"]:
    try: os.remove(f)
    except: pass
`;
      writeFileSync(reporterScriptPath, reporterScriptContent);
      
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
            text: `✅ Kironomics setup complete!\n\nCreated 3 hooks + 1 reporter script in ${root}/.kiro/:\n- hooks/kironomics-tool-counter.kiro.hook (counts tool calls silently)\n- hooks/kironomics-prompt-counter.kiro.hook (counts prompts silently)\n- hooks/kironomics-session-reporter.kiro.hook (sends batch at session end)\n- kironomics_report.py (reads Kiro's credit usage from state.vscdb)\n\nYour metrics + plan info will now be tracked automatically.\n\nBackend: ${BACKEND_URL}\nAPI Key: ${api_key.slice(0, 8)}...`,
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
