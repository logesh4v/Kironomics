---
name: "kironomics"
displayName: "Kironomics"
description: "Gamified Kiro IDE usage tracking with leaderboards, badges, streaks, plan tracking, and credit-based scoring. Track prompts, tool calls, and credit usage — compete with other developers."
keywords: ["kironomics", "leaderboard", "metrics", "usage", "tracking", "gamification", "credits", "plan"]
author: "Logesh"
---

# Kironomics

## Overview

Kironomics is a gamified usage-tracking system for Kiro IDE — inspired by Meta's "Claudinomics" internal leaderboard. It tracks your prompts, tool calls, session time, and **real Kiro credit consumption** (read directly from Kiro's local `state.vscdb`). Then it ranks you on a leaderboard with titles like "Kiro Novice", "Tool Wielder", and "Session Immortal".

The system uses three Kiro hooks + one Python reporter script. Hooks silently count activity during each session; at the end, the Python script reads Kiro's own credit data from `state.vscdb` and sends one batched request to the backend. No disruption during work.

## Score Formulas

**Primary (credit-based, tamper-proof):**
```
score = (credits_consumed × 100) + (tool_calls × 1) + (prompts × 2)
```

**Fallback** (for users without credit data yet):
```
score = (tool_calls × 3) + (prompts × 5) + (elapsed_minutes)
```

## Onboarding (Automated)

### Prerequisites
- Kiro IDE installed
- Python 3 (built-in on macOS/Linux)
- A Kironomics backend URL (local for testing, deployed for prod)

### One-Step Setup

After installing this Power, just open Kiro chat and say:

```
Set up Kironomics with key YOUR_API_KEY
```

The Power's `setup_kironomics` MCP tool will automatically:

1. Create `.kiro/hooks/kironomics-tool-counter.kiro.hook` (counts tool calls)
2. Create `.kiro/hooks/kironomics-prompt-counter.kiro.hook` (counts prompts)
3. Create `.kiro/hooks/kironomics-session-reporter.kiro.hook` (sends data on agentStop)
4. Create `.kiro/kironomics_report.py` (Python reporter — reads `state.vscdb` and POSTs to backend)

That's it. No manual file creation. No script editing. The Python script runs automatically when the agent stops.

### Get Your API Key

Sign in at the Kironomics dashboard → **Settings** → click **Save Changes** → your API key appears.

## How Tracking Works

### During work
- **promptSubmit hook** — silently increments `/tmp/kironomics_prompts`, records start time
- **postToolUse hook** — silently increments `/tmp/kironomics_tools`

### When agent stops (`agentStop`)
1. `kironomics_report.py` runs:
   - Reads `/tmp/kironomics_*` counters
   - Opens `~/Library/Application Support/Kiro/User/globalStorage/state.vscdb` in read-only mode
   - Extracts: `currentUsage`, `usageLimit`, `percentageUsed`, `resetDate`
   - POSTs everything to backend `/api/session`
   - Cleans up `/tmp` files

### On backend
1. Validates token
2. Detects plan from `usageLimit` (50 → Free, 1000 → Pro, 2000 → Pro+, 10000 → Power)
3. Computes `creditsConsumed = newUsage − previousUsage`
4. Runs simplified fraud check (sanity bounds only)
5. Updates user totals + recalculates score
6. Saves to `data.json`

## Title Tiers

| Title | Score Range | Icon |
|---|---|---|
| Kiro Novice | 0 – 99 | 🌱 |
| Prompt Apprentice | 100 – 499 | 📝 |
| Hook Wrangler | 500 – 1,999 | 🪝 |
| Tool Wielder | 2,000 – 4,999 | 🔧 |
| Session Warrior | 5,000 – 14,999 | ⚔️ |
| Token Legend | 15,000 – 49,999 | 👑 |
| Session Immortal | 50,000+ | 🏆 |

## Badges

| Badge | Criteria | Icon |
|---|---|---|
| First Session | 1 session completed | 🎯 |
| Century Club | 100 tool calls | 💯 |
| Hook Hero | 50 prompts | 🦸 |
| Token Titan | 500 tool calls | 💎 |
| Marathon Runner | 10+ hours total | 🏃 |
| Week Warrior | 7-day streak | 🔥 |
| Monthly Master | 30-day streak | 🌟 |

## Plan Detection

Auto-detected from Kiro's `usageLimit`:

| Plan | Limit | Price |
|---|---|---|
| Kiro Free | 50 credits/mo | $0 |
| Kiro Pro | 1,000 credits/mo | $20/mo |
| Kiro Pro+ | 2,000 credits/mo | $40/mo |
| Kiro Power | 10,000 credits/mo | $200/mo |
| Auto-Auto | (no usageState) | — |

Users on Auto-Auto skip credit tracking but still earn hook-based scores.

## Anti-Cheat

The credit data comes from Kiro's own SQLite database, which is server-synced from AWS billing. You can't fake it without modifying Kiro's internals (which would corrupt your IDE).

Backend sanity checks:
1. **Repeated zero-credit sessions with high hook activity** → flagged after 3+ in a row
2. **Credits-to-events ratio over 50×** → flagged (impossible even on heavy Opus)
3. **AWS Cost Explorer verification** (optional) — cross-references hook data with actual AWS billing for ✅ Verified badge

Flagged users are hidden from the leaderboard.

## MCP Tools

This power exposes two tools:

| Tool | Description |
|---|---|
| `setup_kironomics` | Auto-creates 3 hooks + Python reporter in your workspace |
| `kironomics_status` | Shows current session counters (tools, prompts, elapsed time) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/session` | Batch report session end (used by Python reporter) |
| GET | `/api/leaderboard?window=daily\|weekly\|all-time` | Get ranked leaderboard |
| GET | `/api/users/:id/metrics` | Personal metrics (plan, credits, burn rate, etc.) |
| GET | `/api/users/:id/heatmap` | 365-day activity heatmap |
| GET | `/api/users/:id/sessions` | Recent sessions |
| GET | `/api/users/:id/badges` | Earned badges |
| POST | `/api/users/profile` | Update display name + auto-create user |
| POST | `/api/admin/recalc-all-scores` | (admin) Recompute all scores |
| POST | `/api/admin/unflag/:userId` | (admin) Unflag a user |
| GET | `/api/health` | Health check |

## Configuration

The MCP server reads `KIRONOMICS_BACKEND_URL` from the environment (configured in `mcp.json`). Default: `http://localhost:8080`.

For production, change this to your deployed backend URL:

```json
{
  "mcpServers": {
    "kironomics": {
      "command": "node",
      "args": ["mcp-server/src/index.js"],
      "env": {
        "KIRONOMICS_BACKEND_URL": "https://your-backend.example.com"
      }
    }
  }
}
```

## Troubleshooting

### Hooks not firing
**Cause:** Hook files not in `.kiro/hooks/` or Kiro not restarted
**Solution:** Run `setup_kironomics` again, then restart Kiro

### "Auto-Auto" plan shows for me but I'm on Pro
**Cause:** Kiro's `state.vscdb` doesn't have `usageState` yet (rare on first install)
**Solution:** Use Kiro for a session, then check again — Kiro syncs usage from AWS periodically

### Credits not updating in dashboard
**Cause:** Kiro's `state.vscdb` updates periodically, not on every API call
**Solution:** This is normal — credit data syncs every few minutes. The Python reporter reads the latest at session end

### Score = 0 on All-Time tab
**Cause:** You haven't run a session yet with the new credit-based formula
**Solution:** Run any task in Kiro and let `agentStop` fire — the script will populate credit data

### Flagged as suspicious
**Cause:** Sanity check tripped (3+ zero-credit sessions or impossible ratio)
**Solution:** Contact admin: `POST /api/admin/unflag/YOUR_USER_ID -H "x-admin-key: KEY"`

## Files Created in Workspace

After running `setup_kironomics`:

```
.kiro/
├── kironomics_report.py                       (Python session reporter)
└── hooks/
    ├── kironomics-tool-counter.kiro.hook      (postToolUse)
    ├── kironomics-prompt-counter.kiro.hook    (promptSubmit)
    └── kironomics-session-reporter.kiro.hook  (agentStop)
```

To uninstall, delete those files.

---

**Stack**
- Backend: Express.js with `data.json` persistence
- Frontend: React + Vite + Tailwind dashboard
- MCP Server: Node.js (`@modelcontextprotocol/sdk`)
- Reporter: Python 3 (built-in on macOS/Linux)
- Auth: AWS Cognito (in dashboard)
