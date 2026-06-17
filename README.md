# FHN Hackathon Scoring

A simple scoring web app for a 3-round, ~40-team company hackathon. Built with **Nuxt 4**, **Nuxt UI**, and **Supabase** (Auth + Postgres + RLS).

## What it does

- **Auth**: email + password (Supabase). Every user sets their own display name.
- **Round 1** — Business Unit Leaders: admin assigns ~6–7 teams to each BUL; the single BUL's score is **final** for those teams.
- **Round 2 & 3**: every judge scores every team in the round (no assignment); a team's score is the **average across judges**, with **ranking**.
- **Scoring**: 5 criteria, each 0–100 and weighted 20%, so the total is the average of the 5. Plus an optional **bonus up to +10** (max 110).
- **Team advancement** (≈40 → ≈20 → 6): the admin manually selects which teams are in Round 2 and Round 3.

## Criteria

1. Tính thực tiễn và Impact
2. AI Depth & Innovation
3. Chất lượng demo / AI agent thực tế
4. Khả năng nhân rộng / áp dụng cho FHN
5. Thuyết trình & trả lời Q&A
- (Optional) Bonus: 0–10.

## 🔑 Admin access (important)

There is **no admin button** anywhere. To make yourself an admin:

1. Sign up / log in normally.
2. Go to the hidden page: **`/admin-setup`**
3. Enter the **admin setup secret**.

You'll be promoted to admin and redirected to **`/admin`**. Repeat for any other organizers who need admin.

> ⚠️ The secret is **not** stored in this repo (this is a public repository). It lives only in the database, table `private.app_secrets`. The deployer holds it out-of-band. To rotate it:
> `update private.app_secrets set value = '<new-secret>' where key = 'admin_setup_secret';`

## Supabase project

- Project: `hackathon-scoring` (org `phamhuutruong7`)
- URL: `https://nkuaausbckhylawqbkyv.supabase.co`
- Schema, RLS policies, views and functions are already applied (migrations `init_scoring_schema`, `harden_function_privileges`).

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

`.env` is already configured with the Supabase URL + anon key. (`.env` is gitignored.)

### Email confirmation (recommended setting)

A fresh Supabase project has **"Confirm email" ON** by default, so new sign-ups must click an email link before they can log in (using Supabase's rate-limited default mailer).

For an internal tool, you'll likely want sign-up to be instant. In the Supabase dashboard:
**Authentication → Sign In / Providers → Email → turn OFF "Confirm email"**.
(Or configure your own SMTP if you want to keep confirmation on.)

## Admin workflow (`/admin`)

Tabs:
- **Đội (Teams)** — add teams (one-by-one or bulk paste). New teams auto-join Round 1.
- **Giám khảo (Judges)** — toggle which users judge each round. Round 1 judges = BULs.
- **Vòng 1: Phân đội** — assign teams to each BUL.
- **Vòng 2–3: Chọn đội** — pick which teams advance into Round 2 / Round 3.
- **Trạng thái vòng** — set each round to `draft` / `open` / `closed`. Judges can only score when a round is **open**.
- **Kết quả** — live rankings per round (average + rank), with CSV export.

## Judge workflow

- Dashboard lists the rounds you judge with progress.
- Pick a round → list of teams → score each (5 sliders 0–100 + bonus + comment) → **Save draft** or **Nộp điểm (Submit)**.

## Security model (RLS)

- `is_admin` can never be set from the client — only via the `claim_admin` (secret) / `set_admin` (admin-only) database functions. A guard trigger blocks any direct change.
- Judges can only insert/update their own scores, only while a round is `open`, and only for teams they're allowed to score (Round 1: assigned; Rounds 2/3: in the round). Judges cannot read other judges' scores.
- Verified end-to-end: scoring, multi-judge averaging + ranking, admin promotion, and all the above RLS guards.

## Deploy (optional)

Deploy to Vercel (or any Node host). Set the same env vars (`SUPABASE_URL`, `SUPABASE_KEY`) in the host's project settings. If you keep email confirmation on, add your deployed URL to Supabase **Authentication → URL Configuration → Redirect URLs**.
