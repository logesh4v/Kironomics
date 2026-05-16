<div align="center">

# 🏆 Kironomics

### *Turn your Kiro grind into glory.*

**A gamified leaderboard for Kiro IDE users — track your prompts, tool calls, credits, and session time. Climb the ranks. Earn badges. Roast your friends.**

[![Made for Kiro](https://img.shields.io/badge/Made%20for-Kiro-8b5cf6?style=for-the-badge)](https://kiro.dev)
[![Knowledge Base Power](https://img.shields.io/badge/Type-Knowledge%20Base%20Power-green?style=for-the-badge)](https://kiro.dev/docs/powers/create/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#)

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
| 🛡️ **Anti-cheat verified** | Reads your actual AWS-synced credit data |
| 🤫 **Zero overhead** | Everything batches at session end |

---

## ⚡ Quick Start (2 minutes)

### Step 1 — Install the Power

In Kiro, open the **Powers panel** (left sidebar) and click **+ Add Custom Power**.

**Option A — From GitHub (recommended):**
```
https://github.com/logesh4v/Kironomics
```

**Option B — From local folder:**
Point to the path of this repo on your machine.

### Step 2 — Get your API key

Open the Kironomics dashboard → **Settings** → click **Save Changes** → copy the API key shown.

### Step 3 — Activate the power

In Kiro chat, just say:

> "Set up Kironomics"

Kiro will read POWER.md, ask you for your API key + backend URL, and create the 4 tracking files in your workspace automatically.

### Step 4 — Use Kiro normally

Tracking is silent and passive. When the agent stops, one batched request goes to the leaderboard.

### Step 5 — Check your rank

Open the dashboard whenever you want. Watch yourself climb.

---

## 🏗️ How it actually works

This is a **Knowledge Base Power** — pure documentation. When you activate it, Kiro reads the POWER.md instructions and creates these 4 files in your workspace:

```
.kiro/
├── kironomics_report.py                       (Python session reporter)
└── hooks/
    ├── kironomics-tool-counter.kiro.hook      (counts every AI tool call)
    ├── kironomics-prompt-counter.kiro.hook    (counts every prompt + records start time)
    └── kironomics-session-reporter.kiro.hook  (sends data on agentStop)
```

Then on every session:

```
┌────────────────────────────────────────────────────────────────────┐
│                          YOUR LAPTOP                                │
│                                                                     │
│   ┌──────────────┐    auto-writes    ┌────────────────────────┐    │
│   │  Kiro IDE    │ ─────────────────►│ state.vscdb            │    │
│   │              │                   │ └─ kiro.kiroAgent      │    │
│   │              │                   │     └─ usageState      │    │
│   └──────────────┘                   │         ├─ currentUsage│    │
│         │                            │         ├─ usageLimit  │    │
│         │                            │         └─ resetDate   │    │
│         ▼                            └────────────────────────┘    │
│   ┌────────────────────────────────────────┴────────────────┐      │
│   │   3 Silent Hooks                                         │      │
│   │   1️⃣ Tool Counter   → /tmp/kironomics_tools             │      │
│   │   2️⃣ Prompt Counter → /tmp/kironomics_prompts           │      │
│   │   3️⃣ Session Reporter (agentStop):                      │      │
│   │       runs Python script:                                │      │
│   │       • reads /tmp counters                              │      │
│   │       • reads state.vscdb credit data                    │      │
│   │       • POSTs to backend                                 │      │
│   └─────────────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS POST (1 request per session)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│   📊 KIRONOMICS BACKEND                                           │
│   • Validates token                                                │
│   • Detects plan (Free / Pro / Pro+ / Power)                       │
│   • Calculates score                                               │
│   • Updates leaderboard                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎖️ Title Tiers

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

Fallback for users without credit data yet:

```
score = (tool_calls × 3) + (prompts × 5) + (elapsed_minutes)
```

---

## 🏅 Badges

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

Kironomics reads your **actual Kiro usage** straight from Kiro's local database (`state.vscdb`) — the same data Kiro shows in its own UI.

That means:

- 📊 **Live credit balance** — see how many credits you've burned this month
- 📈 **Burn rate** — "73 credits/day at current pace"
- ⏰ **Days remaining** — "9 days until your monthly reset"
- 🎯 **Plan auto-detected** — Free, Pro, Pro+, Power, Auto-Auto
- 🛡️ **Tamper-proof** — you can't fake AWS billing data

Personal Metrics card preview:

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

The credit data comes from Kiro's own SQLite database, server-synced from AWS. Cheating attempts:

1. **Fake hook counters?** → Backend cross-references with `state.vscdb` credit deltas. Caught.
2. **Hooks claim 1000 events but credits show 0?** → Sanity check fails after 3 zero-credit sessions. Flagged.
3. **Credits-to-events ratio over 50x?** → Impossible even on heavy Opus. Flagged.
4. **Optional AWS Cost Explorer verification** → Cross-reference with actual AWS billing for ✅ Verified badge.

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

No. Credit data is read locally from your machine. AWS Cost Explorer verification is **optional** and only used for the ✅ AWS Verified badge.
</details>

<details>
<summary><b>Q: Can I uninstall it?</b></summary><br>

Yes. Just delete `.kiro/hooks/kironomics-*` and `.kiro/kironomics_report.py`. Or remove the Power from Kiro.
</details>

<details>
<summary><b>Q: Why no MCP server?</b></summary><br>

This is a Knowledge Base Power following Kiro's official pattern. POWER.md tells Kiro the agent exactly what to create, and Kiro does it. Simpler, more reliable, and works in any workspace.
</details>

---

## 📁 What's in this repo

```
.
├── POWER.md           ← Power manifest (Kiro reads this on activation)
└── README.md          ← This file (for GitHub viewers)
```

That's it. Two files. No MCP server, no node_modules, no path issues.

When you activate the Power, Kiro reads POWER.md and creates the tracking files in your workspace.

---

## 🛠️ For developers — running the backend + frontend locally

The Kironomics backend and dashboard live in a separate repo. To run them:

**Backend (Express.js):**

```bash
cd backend
npm install
npm start
# → http://localhost:8080
```

**Frontend (React + Vite):**

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

**Environment:**

```bash
# Frontend
VITE_API_BASE_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=us-west-2_XXX
VITE_COGNITO_CLIENT_ID=XXX
```

---

## 🤝 Contributing

PRs welcome. Ideas worth submitting:

- New badges
- Team challenges
- Slack/Discord integration
- More dashboard charts
- A roast feature for the bottom of the leaderboard 😈

---

## 📜 License

MIT — go wild.

---

<div align="center">

**Built with ❤️ and probably too many late-night Kiro sessions.**

⭐ **Star this repo if you'd actually use it.**

</div>
