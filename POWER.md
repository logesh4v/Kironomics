---
name: "kironomics"
displayName: "Kironomics"
description: "Gamified Kiro IDE usage tracking with leaderboards, badges, streaks, and titles. Track your prompts, tool calls, and sessions — compete with other developers."
keywords: ["kironomics", "leaderboard", "metrics", "usage", "tracking", "gamification"]
author: "Logesh"
---

# Kironomics

## Overview

Kironomics is a gamified usage-tracking system for Kiro IDE, inspired by Meta's "Claudinomics" internal leaderboard. It tracks your prompts, tool calls, and session time — then ranks you on a leaderboard with titles like "Kiro Novice", "Tool Wielder", and "Session Immortal".

The system uses three Kiro hooks that silently count your activity during each session, then batch-report everything when the agent stops. No disruption during work — data sends once at the end.

**Score formula:** `(prompts × 5) + (tool_calls × 3) + (elapsed_minutes)`

## Onboarding

### Prerequisites
- Kiro IDE installed
- Node.js 16+ (for the backend server)
- Access to the Kironomics backend server URL

### Step 1: Start the Backend Server

If running locally:
```bash
cd kironomics-backend
npm install
npm start
```
Server runs at `http://localhost:8080`

### Step 2: Register Your Account

```bash
curl -s -X POST http://localhost:8080/api/register \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"YOUR_USERNAME","display_name":"Your Name"}'
```

Save the `token` from the response — you need it for the hooks.

### Step 3: Add Kiro Hooks

Create three hook files in your project's `.kiro/hooks/` directory:

**File 1: `.kiro/hooks/kironomics-tool-counter.kiro.hook`**
```json
{
  "enabled": true,
  "name": "Kironomics Tool Counter",
  "version": "1.0.0",
  "when": { "type": "postToolUse", "toolTypes": ["*"] },
  "then": {
    "type": "runCommand",
    "command": "echo $(($(cat /tmp/kironomics_tools 2>/dev/null || echo 0) + 1)) > /tmp/kironomics_tools",
    "timeout": 2
  }
}
```

**File 2: `.kiro/hooks/kironomics-prompt-counter.kiro.hook`**
```json
{
  "enabled": true,
  "name": "Kironomics Prompt Counter",
  "version": "1.0.0",
  "when": { "type": "promptSubmit" },
  "then": {
    "type": "runCommand",
    "command": "test -f /tmp/kironomics_start || date +%s > /tmp/kironomics_start; echo $(($(cat /tmp/kironomics_prompts 2>/dev/null || echo 0) + 1)) > /tmp/kironomics_prompts",
    "timeout": 2
  }
}
```

**File 3: `.kiro/hooks/kironomics-session-reporter.kiro.hook`**
Replace `YOUR_TOKEN` with the token from Step 2, and `YOUR_SERVER_URL` with the backend URL.
```json
{
  "enabled": true,
  "name": "Kironomics Session Reporter",
  "version": "1.0.0",
  "when": { "type": "agentStop" },
  "then": {
    "type": "runCommand",
    "command": "TOOLS=$(cat /tmp/kironomics_tools 2>/dev/null || echo 0); PROMPTS=$(cat /tmp/kironomics_prompts 2>/dev/null || echo 0); START=$(cat /tmp/kironomics_start 2>/dev/null || date +%s); ELAPSED=$(($(date +%s) - START)); curl -s YOUR_SERVER_URL/api/session -H 'Content-Type: application/json' -d \"{\\\"token\\\":\\\"YOUR_TOKEN\\\",\\\"tool_calls\\\":$TOOLS,\\\"prompts\\\":$PROMPTS,\\\"elapsed_seconds\\\":$ELAPSED}\"; rm -f /tmp/kironomics_tools /tmp/kironomics_prompts /tmp/kironomics_start",
    "timeout": 10
  }
}
```

### Step 4: Verify

Use Kiro normally. After the agent finishes a task, check the leaderboard:
- Web dashboard: `http://localhost:8080`
- API: `http://localhost:8080/api/leaderboard`

## How It Works

### Tracking Flow
1. **promptSubmit hook** — silently increments `/tmp/kironomics_prompts` and records session start time
2. **postToolUse hook** — silently increments `/tmp/kironomics_tools` (every read, write, shell, etc.)
3. **agentStop hook** — reads both counters + computes elapsed seconds, sends ONE batch request to the server, then cleans up temp files

No network calls during work — everything batches at the end.

### Scoring
```
score = (prompts × 5) + (tool_calls × 3) + (elapsed_seconds / 60)
```

### Title Tiers
| Title | Score Range | Icon |
|---|---|---|
| Kiro Novice | 0 – 99 | 🌱 |
| Prompt Apprentice | 100 – 499 | 📝 |
| Hook Wrangler | 500 – 1,999 | 🪝 |
| Tool Wielder | 2,000 – 4,999 | 🔧 |
| Session Warrior | 5,000 – 14,999 | ⚔️ |
| Token Legend | 15,000 – 49,999 | 👑 |
| Session Immortal | 50,000+ | 🏆 |

### Badges
| Badge | Criteria | Icon |
|---|---|---|
| First Session | 1 session completed | 🎯 |
| Century Club | 100 tool calls | 💯 |
| Hook Hero | 50 prompts | 🦸 |
| Token Titan | 500 tool calls | 💎 |
| Marathon Runner | 10+ hours total | 🏃 |
| Week Warrior | 7-day streak | 🔥 |
| Monthly Master | 30-day streak | 🌟 |

### Fraud Detection
The server automatically flags suspicious activity:
- More than 5 different machines per user
- More than 8 different IPs per user
- More than 20 sessions in 60 seconds
- Flagged users are hidden from the leaderboard

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/register` | Register user, get token |
| POST | `/api/prompt` | Track a prompt (used by hooks) |
| POST | `/api/tool` | Track a tool call (used by hooks) |
| POST | `/api/session` | Batch report session end |
| GET | `/api/leaderboard` | Get ranked leaderboard |
| GET | `/api/users/:id/metrics` | Get user metrics |
| GET | `/api/users/:id/heatmap` | Get 365-day activity heatmap |
| GET | `/api/users/:id/sessions` | Get recent sessions |
| GET | `/api/users/:id/badges` | Get earned badges |
| GET | `/api/health` | Health check |

## MCP Config Placeholders

Before using this power, replace the following placeholders in `mcp.json`:

- **`PLACEHOLDER_COLLECTOR_PATH`**: Path to the built kironomics collector.
  - **How to get it:** Build the collector with `cd collector && npm install && npm run build`, then use the path to `collector/dist/index.js`

- **`PLACEHOLDER_API_URL`**: Your Kironomics backend server URL.
  - **How to set it:** Use `http://localhost:8080` for local development, or your deployed server URL

- **`PLACEHOLDER_USER_ID`**: Your registered user ID.
  - **How to get it:** Register via `POST /api/register` and use the `user_id` you provided

## Troubleshooting

### Hooks not firing
**Cause:** Hook files not in `.kiro/hooks/` directory
**Solution:** Ensure hook files are in your project's `.kiro/hooks/` folder with `.kiro.hook` extension

### Session data not appearing
**Cause:** Backend server not running
**Solution:** Start the server with `npm start` in the backend directory. Hooks need the server to be reachable.

### Score not updating
**Cause:** agentStop hook hasn't fired yet
**Solution:** The session reporter only sends data when the agent finishes. Keep using Kiro — data sends at the end of each agent session.

### Flagged as suspicious
**Cause:** Too many machines, IPs, or rapid session submissions
**Solution:** Contact the admin to review and unflag your account via `POST /api/admin/unflag`

---

**Backend:** Express.js with data.json persistence
**Frontend:** React dashboard with leaderboard, metrics, heatmap, badges
**Hooks:** 3 Kiro hooks (prompt counter, tool counter, session reporter)
