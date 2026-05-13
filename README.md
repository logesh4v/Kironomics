# 🏆 Kironomics

**Gamified Kiro IDE usage tracking with leaderboards, badges, streaks, and titles.**

Track your prompts, tool calls, and sessions — compete with other developers on a live leaderboard.

Inspired by Meta's "Claudinomics" internal competition and tools like [Tokscale](https://tokscale.ai).

---

## How It Works

```
You use Kiro normally
        ↓
Silent hooks count your activity (prompts, tool calls, session time)
        ↓
When agent stops → one batch request sends your session data
        ↓
Visit the dashboard → see your rank, badges, streaks, and title
```

**Score formula:** `(prompts × 5) + (tool_calls × 3) + (elapsed_minutes)`

---

## Quick Start

### 1. Install the Power

Open Kiro → Powers panel → **Add Custom Power** → **Import from GitHub** → paste:

```
https://github.com/logesh4v/Kironomics
```

### 2. Get Your API Key

Visit the Kironomics dashboard → Sign up → Go to **Settings** → Copy your **API Key**.

### 3. Set Up Tracking

In any Kiro chat, say:

```
Set up Kironomics with key YOUR_API_KEY_HERE
```

The AI will automatically create the tracking hooks in your workspace. Done.

### 4. Use Kiro Normally

Your activity is tracked silently. Check the leaderboard anytime to see your rank.

---

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

---

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

---

## How Tracking Works

Kironomics uses 3 silent Kiro hooks:

1. **Prompt Counter** (`promptSubmit`) — counts every message you send
2. **Tool Counter** (`postToolUse`) — counts every tool the AI uses
3. **Session Reporter** (`agentStop`) — sends one batch request when agent finishes

No disruption during work. No network calls until the session ends.

---

## Anti-Cheat

- Server-side statistical analysis (timing patterns, ratio checks, rate limits)
- Fraud detection (too many machines, IPs, or rapid submissions)
- Flagged users hidden from leaderboard
- AWS Cost Explorer verification for enterprise users

---

## MCP Tools

This power exposes two tools:

| Tool | Description |
|---|---|
| `setup_kironomics` | Creates hook files in your workspace with your API key |
| `kironomics_status` | Shows current session counters (tools, prompts, elapsed time) |

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Kiro IDE (Local)   │     │  Backend Server  │     │   Dashboard     │
│                     │     │  (Express.js)    │     │   (React)       │
│  • Prompt hook      │────▶│                  │◀────│                 │
│  • Tool hook        │     │  • /api/session  │     │  • Leaderboard  │
│  • Session reporter │     │  • /api/register │     │  • My Metrics   │
│                     │     │  • /api/leaderboard    │  • Heatmap     │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## For Developers

### Running the backend locally

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:8080
```

### Running the dashboard locally

```bash
cd frontend
npm install
npm run dev
# Dashboard runs on http://localhost:3000
```

---

## License

MIT

---

Built with ❤️ for the Kiro community.
