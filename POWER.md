---
name: "kironomics"
displayName: "Kironomics"
description: "Gamified Kiro IDE usage tracking with leaderboards, badges, streaks, plan tracking, and credit-based scoring. Track prompts, tool calls, and credit usage and compete with other developers."
keywords: ["kironomics", "leaderboard", "kiro-credits", "kiro-tracking", "kironomics-power"]
author: "Logesh"
---

# Kironomics

## Overview

Kironomics is a gamified usage-tracking system for Kiro IDE inspired by Meta's "Claudinomics" internal leaderboard. It tracks your prompts, tool calls, session time, and real Kiro credit consumption (read directly from Kiro's local `state.vscdb`). Then it ranks you on a leaderboard with titles like "Kiro Novice", "Tool Wielder", and "Session Immortal".

The system uses three lightweight Kiro hooks plus one Python reporter script. Hooks silently count activity during each session; at the end, the Python script reads Kiro's own credit data from `state.vscdb` and sends one batched request to the Kironomics backend. Zero overhead during work.

## Onboarding

When the user first activates this power, run through these onboarding steps to set up tracking in their workspace.

### Step 1: Validate Prerequisites

Before setting up Kironomics, verify these are available:

- **Python 3** is installed (built-in on macOS/Linux). Verify with: `python3 --version`
- The user has an API key from the Kironomics dashboard. If they don't have one yet, point them to: sign in at the dashboard, go to **Settings**, click **Save Changes**, and copy the API key shown.
- The user knows the Kironomics backend URL. For local testing this is `http://localhost:8080`. For deployed setups they will provide their own URL.

### Step 2: Get the User's API Key

Ask the user for their API key in conversation:

> "What's your Kironomics API key? (Get one from your dashboard's Settings page.)"

If they paste a key like `f57b33cf2ccf35f23fb5035f6888eebcfee2c648e9ed7d84a6a2cc67761c527a`, save it as `API_KEY` for the next step.

### Step 3: Get the Backend URL

Ask the user for the backend URL:

> "What backend URL should I send your stats to? (Press Enter to use the default `http://localhost:8080` for local testing.)"

If they don't provide one, default to `http://localhost:8080`. Save as `BACKEND_URL`.

### Step 4: Create the Reporter Script

Create the file `.kiro/kironomics_report.py` in the workspace with this exact content. Replace `__API_KEY__` with the user's API key and `__BACKEND_URL__` with their backend URL.

```python
#!/usr/bin/env python3
"""Kironomics session reporter — reads Kiro's state.vscdb and sends to backend."""
import os, json, sqlite3, urllib.request, time
from pathlib import Path

API_KEY = "__API_KEY__"
BACKEND_URL = "__BACKEND_URL__"

def read_int(path, default=0):
    try:
        return int(Path(path).read_text().strip())
    except Exception:
        return default

tools = read_int("/tmp/kironomics_tools")
prompts = read_int("/tmp/kironomics_prompts")
start = read_int("/tmp/kironomics_start", int(time.time()))
elapsed = max(0, int(time.time()) - start)

# Read Kiro's state.vscdb (silent fail if missing or no usageState)
plan_data = {}
try:
    db = Path.home() / "Library/Application Support/Kiro/User/globalStorage/state.vscdb"
    if db.exists():
        conn = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        row = conn.execute(
            "SELECT value FROM ItemTable WHERE key=?",
            ("kiro.kiroAgent",),
        ).fetchone()
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
except Exception:
    pass

payload = {
    "token": API_KEY,
    "tool_calls": tools,
    "prompts": prompts,
    "elapsed_seconds": elapsed,
    **plan_data,
}

# POST to backend (silent fail)
try:
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/session",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req, timeout=5).read()
except Exception:
    pass

# Cleanup temp counters
for f in ("/tmp/kironomics_tools", "/tmp/kironomics_prompts", "/tmp/kironomics_start"):
    try:
        os.remove(f)
    except Exception:
        pass
```

After creating the file, verify it compiles:

```bash
python3 -m py_compile .kiro/kironomics_report.py && echo "Reporter script OK"
```

### Step 5: Create the Tool Counter Hook

Create the file `.kiro/hooks/kironomics-tool-counter.kiro.hook` with this content:

```json
{
  "enabled": true,
  "name": "Kironomics Tool Counter",
  "version": "1.0.0",
  "description": "Silently counts tool calls for Kironomics leaderboard",
  "when": {
    "type": "postToolUse",
    "toolTypes": ["*"]
  },
  "then": {
    "type": "runCommand",
    "command": "bash -c 'FILE=/tmp/kironomics_tools; COUNT=$(cat \"$FILE\" 2>/dev/null || echo 0); echo $((COUNT + 1)) > \"$FILE\"; echo ok'",
    "timeout": 2
  }
}
```

### Step 6: Create the Prompt Counter Hook

Create the file `.kiro/hooks/kironomics-prompt-counter.kiro.hook` with this content:

```json
{
  "enabled": true,
  "name": "Kironomics Prompt Counter",
  "version": "1.0.0",
  "description": "Silently counts prompts and records session start time",
  "when": {
    "type": "promptSubmit"
  },
  "then": {
    "type": "runCommand",
    "command": "bash -c 'START=/tmp/kironomics_start; PFILE=/tmp/kironomics_prompts; test -f \"$START\" || date +%s > \"$START\"; COUNT=$(cat \"$PFILE\" 2>/dev/null || echo 0); echo $((COUNT + 1)) > \"$PFILE\"; echo ok'",
    "timeout": 2
  }
}
```

### Step 7: Create the Session Reporter Hook

Create the file `.kiro/hooks/kironomics-session-reporter.kiro.hook` with this content. Replace `__WORKSPACE_ROOT__` with the absolute path to the user's current workspace directory (the directory containing `.kiro/`).

```json
{
  "enabled": true,
  "name": "Kironomics Session Reporter",
  "version": "1.0.0",
  "description": "Reads Kiro's credit usage and sends session data to backend on agentStop",
  "when": {
    "type": "agentStop"
  },
  "then": {
    "type": "runCommand",
    "command": "python3 \"__WORKSPACE_ROOT__/.kiro/kironomics_report.py\" 2>/dev/null; echo ok",
    "timeout": 10
  }
}
```

You can find the workspace root with `pwd` from the agent's working directory. Use the absolute path so the hook works regardless of which subfolder the agent is in.

### Step 8: Confirm Setup

Tell the user:

> "Kironomics setup complete. Created:
> - `.kiro/kironomics_report.py`
> - `.kiro/hooks/kironomics-tool-counter.kiro.hook`
> - `.kiro/hooks/kironomics-prompt-counter.kiro.hook`
> - `.kiro/hooks/kironomics-session-reporter.kiro.hook`
>
> Tracking starts on your next prompt. View your stats on the Kironomics dashboard whenever you want."

## How Tracking Works

Once setup is complete, tracking is fully passive and silent.

**During a session:**
- The `promptSubmit` hook fires on every prompt the user submits. It increments `/tmp/kironomics_prompts` and records the session start time on the first prompt.
- The `postToolUse` hook fires after every tool the AI calls (read_file, str_replace, execute_bash, etc.). It increments `/tmp/kironomics_tools`.
- Both hooks run in under 2ms and produce no chat output.

**When the agent finishes (agentStop):**
- The session reporter hook runs `python3 .kiro/kironomics_report.py`.
- The script reads the temp counters, opens Kiro's `state.vscdb` in read-only mode, extracts `currentUsage`, `usageLimit`, `percentageUsed`, and `resetDate`, then POSTs everything to the backend.
- After sending, the script deletes the temp counters so the next session starts fresh.

**On the backend:**
- The token is validated.
- The plan is auto-detected from `usageLimit` (50 = Free, 1000 = Pro, 2000 = Pro+, 10000 = Power).
- `creditsConsumed = newUsage − previousUsage` is computed.
- A simple sanity check runs (no over-claiming, hooks match credit growth over time).
- User totals + score are updated and persisted.

## Score Formula

Primary (credit-based, tamper-proof):

```
score = (credits_consumed × 100) + (tool_calls × 1) + (prompts × 2)
```

Fallback (for users without credit data yet, e.g., on Auto-Auto plan):

```
score = (tool_calls × 3) + (prompts × 5) + (elapsed_minutes)
```

## Title Tiers

| Title | Score Range | Icon |
|---|---|---|
| Kiro Novice | 0 to 99 | 🌱 |
| Prompt Apprentice | 100 to 499 | 📝 |
| Hook Wrangler | 500 to 1,999 | 🪝 |
| Tool Wielder | 2,000 to 4,999 | 🔧 |
| Session Warrior | 5,000 to 14,999 | ⚔️ |
| Token Legend | 15,000 to 49,999 | 👑 |
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

Kiro plans are auto-detected from `usageLimit` in `state.vscdb`:

| Plan | Limit | Price |
|---|---|---|
| Kiro Free | 50 credits/mo | $0 |
| Kiro Pro | 1,000 credits/mo | $20/mo |
| Kiro Pro+ | 2,000 credits/mo | $40/mo |
| Kiro Power | 10,000 credits/mo | $200/mo |
| Auto-Auto | (no usageState) | not detected |

Auto-Auto users skip credit tracking but still earn hook-based scores.

## Anti-Cheat

The credit data comes from Kiro's own SQLite database (`state.vscdb`), which is server-synced from AWS billing. You can't fake it without modifying Kiro's internals (which would corrupt your IDE).

Backend sanity checks:

1. **Repeated zero-credit sessions with high hook activity** are flagged after three or more consecutive sessions.
2. **Credits-to-events ratio over 50x** is flagged (impossible even on heavy Opus usage).
3. **Optional AWS Cost Explorer verification** cross-references hook data with actual AWS billing for an `AWS Verified` badge.

Flagged users are hidden from the leaderboard until reviewed.

## Common Workflows

### Workflow: Setting Up in a New Workspace

The user activates the power, provides their API key and backend URL, and the agent runs through Steps 4 to 8 of Onboarding to create all four files.

### Workflow: Verifying Tracking Is Active

After setup, the user can verify hooks are firing during work:

```bash
# After sending a few prompts and letting Kiro use tools
cat /tmp/kironomics_prompts
cat /tmp/kironomics_tools
cat /tmp/kironomics_start
```

These should show increasing counts and a Unix timestamp.

### Workflow: Manually Triggering a Session Report

To test the full flow without waiting for `agentStop`:

```bash
python3 .kiro/kironomics_report.py
```

This reads the current counters, reads `state.vscdb`, POSTs to the backend, and clears the temp files. Useful for confirming the backend received the data.

### Workflow: Updating the Backend URL

If the user later deploys their backend or switches environments, edit `.kiro/kironomics_report.py` and change the `BACKEND_URL` constant near the top. No other changes needed.

### Workflow: Updating the API Key

If the user regenerates their API key, edit `.kiro/kironomics_report.py` and change the `API_KEY` constant. Or re-run the onboarding to recreate all files with the new key.

## Troubleshooting

### Setup ran but hooks aren't firing

**Cause:** Kiro hasn't picked up the new hook files yet.

**Solution:** Restart Kiro (or reload the workspace). On next launch, Kiro scans `.kiro/hooks/` and registers the new hooks automatically.

### Reporter script fails with "ModuleNotFoundError"

**Cause:** Python 3 not on PATH.

**Solution:** Verify with `python3 --version`. On macOS, install via `brew install python3` if missing. The script uses only stdlib modules (sqlite3, urllib, json, pathlib), so no `pip install` is needed.

### Backend returns 400 Bad Request

**Cause:** The reporter is sending an invalid payload (usually a missing or stale `API_KEY`).

**Solution:** Open `.kiro/kironomics_report.py` and verify `API_KEY` matches your dashboard's Settings page. Re-run onboarding to regenerate the file if needed.

### Backend returns 401 Unauthorized

**Cause:** API key is wrong or expired.

**Solution:** Get a fresh key from the dashboard's Settings page and update `API_KEY` in the reporter script.

### Plan shows "Auto-Auto" but I'm on Kiro Pro

**Cause:** Kiro's `state.vscdb` doesn't have `usageState` populated yet (this happens occasionally on first install or after a Kiro update).

**Solution:** Use Kiro for one full session, then check again. Kiro syncs usage from AWS periodically, and the next session report will pick it up.

### Daily/Weekly tab is empty on the leaderboard

**Cause:** No sessions have been recorded in that time window.

**Solution:** This is correct behavior. Use Kiro for a session, let `agentStop` fire, and refresh the leaderboard. The Daily tab shows last 24h, Weekly shows last 7 days.

### "credits_did_not_grow" flag appeared

**Cause:** Multiple sessions in a row had hook activity but `currentUsage` didn't change in `state.vscdb`. This usually means `state.vscdb` hasn't synced fresh data from AWS.

**Solution:** Wait a few minutes for Kiro to sync, then run a normal session. The flag clears automatically once a session has real credit consumption. If it persists, contact the admin: `POST /api/admin/unflag/YOUR_USER_ID -H "x-admin-key: KEY"`.

### I want to remove Kironomics from a workspace

**Solution:** Delete these files:

```bash
rm -rf .kiro/kironomics_report.py
rm -rf .kiro/hooks/kironomics-tool-counter.kiro.hook
rm -rf .kiro/hooks/kironomics-prompt-counter.kiro.hook
rm -rf .kiro/hooks/kironomics-session-reporter.kiro.hook
```

Restart Kiro. Tracking stops immediately.

## Best Practices

- **One workspace, one setup.** Run onboarding once per workspace. Kironomics tracks per-workspace activity.
- **Keep the reporter script absolute-pathed in the hook.** This avoids issues when Kiro runs the hook from a different working directory.
- **Don't edit `state.vscdb` manually.** It's Kiro's internal database. Editing it can corrupt your IDE and trigger anti-cheat flags.
- **Use the same API key across machines.** This consolidates your stats under one user. Multiple keys per person create separate leaderboard entries.
- **Check the dashboard weekly.** Burn-rate predictions get more accurate after a few days of data.

## API Endpoints Reference

The reporter script uses these backend endpoints. Listed here for transparency.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/session` | Sends batched session data (called by reporter) |
| GET | `/api/leaderboard?window=daily\|weekly\|all-time` | Ranked leaderboard |
| GET | `/api/users/:id/metrics` | Personal metrics (plan, credits, burn rate) |
| GET | `/api/users/:id/heatmap` | 365-day activity heatmap |
| GET | `/api/users/:id/sessions` | Recent sessions |
| GET | `/api/users/:id/badges` | Earned badges |
| POST | `/api/users/profile` | Update display name + auto-create user |
| GET | `/api/health` | Health check |

## Files Created in Workspace

After running the onboarding, the workspace contains:

```
.kiro/
├── kironomics_report.py                      (Python session reporter)
└── hooks/
    ├── kironomics-tool-counter.kiro.hook     (postToolUse)
    ├── kironomics-prompt-counter.kiro.hook   (promptSubmit)
    └── kironomics-session-reporter.kiro.hook (agentStop)
```

To uninstall, delete those files and restart Kiro.

---

**Stack**

- Backend: Express.js with `data.json` persistence
- Frontend: React + Vite + Tailwind dashboard
- Reporter: Python 3 (built-in on macOS/Linux)
- Auth: AWS Cognito (in dashboard)
