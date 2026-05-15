<div align="center">

# 🏆 Kironomics

### *Turn your Kiro grind into glory.*

**A gamified leaderboard for Kiro IDE users — track your prompts, tool calls, credits, and session time. Climb the ranks. Earn badges. Roast your friends.**

[![Made for Kiro](https://img.shields.io/badge/Made%20for-Kiro-8b5cf6?style=for-the-badge)](https://kiro.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Inspired by Claudinomics](https://img.shields.io/badge/Inspired%20by-Meta's%20Claudinomics-blue?style=for-the-badge)](#)

</div>

---

## 🎯 What is this?

You and your team write code with Kiro. You ship features. You crush bugs. But nobody knows who's actually pulling their weight in the AI revolution.

**Kironomics fixes that.**

It's a private leaderboard that quietly tracks how much you actually use Kiro — the prompts you fire off, the tools the AI calls, the credits you burn through, the sessions that go past midnight. Then it ranks everyone, hands out badges, and shows who's the real **Session Immortal** of the team.

Think Strava for AI coding. Or GitHub contributions, but spicier.

---

## 🎮 Why you'll love it

| | |
|---|---|
| 🥇 **Compete with friends** | Daily, weekly, all-time leaderboards |
| 🏅 **Earn 7 badges** | First Session, Century Club, Marathon Runner, and more |
| 👑 **Unlock 7 titles** | Climb from "Kiro Novice" 🌱 to "Session Immortal" 🏆 |
| 🔥 **Streak tracking** | GitHub-style heatmap of your last 365 days |
| 💳 **Real credit tracking** | See your Kiro plan usage live (Free/Pro/Pro+/Power) |
| 📊 **Burn rate analytics** | "You'll run out of credits in 9 days at this pace" |
| 🛡️ **Anti-cheat verified** | Reads your actual AWS-synced credit data — no faking |
| 🤫 **Zero overhead** | Everything batches at session end — never slows you down |

---

## ⚡ Quick Start (2 minutes)

### Step 1 — Install the Power

In Kiro, open the **Powers panel** (left sidebar) and click **+ Add Power**.
Choose **Import from GitHub** and paste:

```
https://github.com/logesh4v/Kironomics
```

Done. The Power is installed.

### Step 2 — Get your API key

Open the Kironomics dashboard, sign in, then go to **Settings**. Click **Save Changes** and your API key appears (e.g. `f57b33cf2c...`). Copy it.

### Step 3 — Set up tracking

Open Kiro chat and just type:

```
Set up Kironomics with key f57b33cf2c...
```

(Replace with your actual key.)

The Power's MCP tool will automatically:
- Create 3 silent hooks in `.kiro/hooks/`
- Drop a small Python reporter at `.kiro/kironomics_report.py`
- Wire everything to your backend

You'll see: ✅ **Kironomics setup complete!**

### Step 4 — Use Kiro normally

That's it. Type prompts, run tools, build cool stuff. Your activity is tracked silently. When the agent stops working, one batched request goes to the leaderboard.

### Step 5 — Check your rank

Open the dashboard whenever you want. Watch yourself climb.

---

## 🏗️ How it actually works

```
┌────────────────────────────────────────────────────────────────────────┐
│                          YOUR LAPTOP                                    │
│                                                                         │
│   ┌──────────────┐    auto-writes    ┌──────────────────────────────┐  │
│   │   Kiro IDE   │ ─────────────────►│  state.vscdb                 │  │
│   │              │                   │  └─ kiro.kiroAgent           │  │
│   │              │                   │       └─ usageState          │  │
│   │              │                   │            ├─ currentUsage   │  │
│   │              │                   │            ├─ usageLimit     │  │
│   │              │                   │            └─ resetDate      │  │
│   └──────────────┘                   └──────────────────────────────┘  │
│         │                                          ▲                    │
│         │                                          │ (read at end)     │
│         ▼                                          │                    │
│   ┌────────────────────────────────────────────────┴──────────────┐    │
│   │   3 Silent Hooks (created by setup_kironomics)                 │    │
│   │                                                                 │    │
│   │   1️⃣ Tool Counter   (postToolUse)  → /tmp/kironomics_tools     │    │
│   │   2️⃣ Prompt Counter (promptSubmit) → /tmp/kironomics_prompts   │    │
│   │   3️⃣ Session Reporter (agentStop):                             │    │
│   │       ↳ runs Python script                                      │    │
│   │       ↳ reads /tmp counters                                     │    │
│   │       ↳ reads state.vscdb credit data                           │    │
│   │       ↳ POSTs everything to backend                             │    │
│   └────────────────────────────────────────────────────────────────┘    │
└────────────────────────┬───────────────────────────────────────────────┘
                         │ HTTPS POST (1 request per session)
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│   📊 KIRONOMICS BACKEND                                                  │
│   • Validates token                                                      │
│   • Detects plan (Free / Pro / Pro+ / Power)                             │
│   • Calculates score                                                     │
│   • Updates leaderboard                                                  │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│   🏆 LEADERBOARD DASHBOARD (React)                                       │
│   Daily • Weekly • All-Time | Plan badges | Heatmap | Burn rate         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎖️ Title Tiers

Climb the ladder. Earn bragging rights.

| Title | Score Range | Icon |
|---|---|---|
| Kiro Novice | 0 – 99 | 🌱 |
| Prompt Apprentice | 100 – 499 | 📝 |
| Hook Wrangler | 500 – 1,999 | 🪝 |
| Tool Wielder | 2,000 – 4,999 | 🔧 |
| Session Warrior | 5,000 – 14,999 | ⚔️ |
| Token Legend | 15,000 – 49,999 | 👑 |
| **Session Immortal** | **50,000+** | **🏆** |

**Score formula** (credit-based, the cheat-proof one):
```
score = (credits_consumed × 100) + (tool_calls × 1) + (prompts × 2)
```

For users without credit data yet, fallback formula:
```
score = (tool_calls × 3) + (prompts × 5) + (elapsed_minutes)
```

---

## 🏅 Badges

Earn them by living the agent life.

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

## 💳 Real Credit Tracking

This is where it gets cool. Kironomics reads your **actual Kiro usage** straight from Kiro's local database (`state.vscdb`) — the same data Kiro shows in its own UI.

That means:
- 📊 **Live credit balance** — see how many credits you've burned this month
- 📈 **Burn rate** — "73 credits/day at current pace"
- ⏰ **Days remaining** — "9 days until your monthly reset"
- 🎯 **Plan auto-detected** — Free, Pro, Pro+, Power, Auto-Auto
- 🛡️ **Tamper-proof** — you can't fake AWS billing data

Your Personal Metrics page shows it all:

```
┌────────────────────────────────────────────────────┐
│ 📊 Plan & Credits          Kiro Pro+    $40/mo     │
│ Live data from Kiro IDE                            │
│                                                     │
│ 1,246.79 / 2,000 credits             62.3%         │
│ ████████████░░░░░░░░                                │
│                                                     │
│ ┌────────┬──────────┬──────────┬──────────────┐    │
│ │ 753    │ 17 days  │ 73/day   │ 9 days       │    │
│ │ Remain │ Resets in│ Burn rate│ Will run out │    │
│ └────────┴──────────┴──────────┴──────────────┘    │
└────────────────────────────────────────────────────┘
```

---

## 🛡️ Anti-Cheat (it's smarter than you think)

Tried to fake your numbers? Here's what catches you:

1. **Credit verification** — Backend cross-references your hooks with Kiro's `state.vscdb` (server-synced from AWS)
2. **Sanity checks** — If hooks claim 1000 events but credits show 0 used, you're flagged
3. **Bound checks** — Even on the most expensive Opus model, claiming 50× credits-per-event = caught
4. **AWS Cost Explorer verification** (optional) — Cross-reference with actual AWS billing for ✅ Verified badge

Cheaters get hidden from the leaderboard. The honest crew rules.

---

## 🤔 FAQ

<details>
<summary><b>Q: Will this slow down Kiro?</b></summary><br>

No. The 3 hooks fire in <2ms each (just incrementing a number in a temp file). The actual data send happens **once** when the agent stops — not during your work.
</details>

<details>
<summary><b>Q: What does it actually track?</b></summary><br>

- Number of prompts you submit
- Number of tools the AI calls (read_file, str_replace, execute_bash, etc.)
- Session duration
- Credits consumed (real, from Kiro's own data)
- Your plan (Free / Pro / Pro+ / Power)

Nothing about *what* you typed or what the code looked like. Just counts.
</details>

<details>
<summary><b>Q: Where does the credit data come from?</b></summary><br>

From `state.vscdb` — Kiro's own SQLite database that lives at:
```
~/Library/Application Support/Kiro/User/globalStorage/state.vscdb
```
We open it in **read-only** mode, so Kiro IDE is never affected.
</details>

<details>
<summary><b>Q: I'm on the Free plan. Will I see plan info?</b></summary><br>

Yes — Kironomics auto-detects all plans (50 credits = Free, 1000 = Pro, 2000 = Pro+, 10000 = Power). Auto-Auto users skip credit tracking.
</details>

<details>
<summary><b>Q: Do I need to share AWS credentials?</b></summary><br>

No. The credit data is read locally from your machine. AWS Cost Explorer verification is **optional** and only used for the ✅ AWS Verified badge.
</details>

<details>
<summary><b>Q: Can I uninstall it?</b></summary><br>

Yes. Just delete `.kiro/hooks/kironomics-*` and `.kiro/kironomics_report.py`. Or remove the Power.
</details>

<details>
<summary><b>Q: Where do I host the backend?</b></summary><br>

For testing, run it locally: `cd backend && npm start`. For production, deploy it anywhere (AWS ECS, EC2, Render, Railway, Fly.io). Update `KIRONOMICS_BACKEND_URL` in `mcp.json` to point at your deployed URL.
</details>

---

## 🛠️ For developers

### Backend (Express.js)

```bash
cd backend
npm install
npm start
# → http://localhost:8080
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Environment

```bash
# Frontend
VITE_API_BASE_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=us-west-2_XXX
VITE_COGNITO_CLIENT_ID=XXX

# MCP Server (in mcp.json)
KIRONOMICS_BACKEND_URL=http://localhost:8080
```

---

## 📁 What's in this repo

```
.
├── POWER.md             ← Power manifest (Kiro reads this)
├── mcp.json             ← MCP server config
├── README.md            ← This file
└── mcp-server/
    ├── package.json     ← MCP server dependencies
    └── src/
        └── index.js     ← MCP tool: setup_kironomics + kironomics_status
```

When users run `setup_kironomics`, the MCP tool generates these in their workspace:

```
.kiro/
├── kironomics_report.py                       (Python session reporter)
└── hooks/
    ├── kironomics-tool-counter.kiro.hook
    ├── kironomics-prompt-counter.kiro.hook
    └── kironomics-session-reporter.kiro.hook
```

---

## 🤝 Contributing

PRs welcome! This is a fun side project — bring ideas, badges, jokes, anything.

Stuff that'd be cool to add:
- New badges (mention you tried it)
- Team challenges ("Beat the team to 10K credits")
- Slack/Discord integration
- More charts on the dashboard
- A roast feature for users at the bottom 😈

---

## 📜 License

MIT — go wild.

---

<div align="center">

**Built with ❤️ and probably too many late-night Kiro sessions.**

*Inspired by Meta's "Claudinomics" internal leaderboard. If your team uses Kiro, you need this.*

⭐ **Star this repo if you'd actually use it.**

</div>
