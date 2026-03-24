# The Platform — Powerlifting Hub

## Project Overview

A powerlifting community platform with global rankings, athlete profiles, meet results, and social feed. Data sourced from OpenPowerlifting (OPL).

## Tech Stack

- **Framework:** Next.js 15 (App Router, server + client components)
- **Language:** TypeScript 5.9
- **Database:** Supabase (hosted PostgreSQL + Auth)
- **Styling:** Tailwind CSS 4 with custom theme tokens in `src/app/globals.css`
- **Fonts:** Barlow Condensed (headings), Inter (body), JetBrains Mono (numeric data)
- **Data:** OpenPowerlifting CSV (seeded via `scripts/seed-leaderboard.ts`)

## Design System: "Soft Brutalist"

See `DESIGN.md` for the full design document ("The Iron Ledger" theme).

Key rules:
- **0px border radius everywhere** — no `rounded-*` classes on any element
- **No 1px border dividers** — define boundaries through background tonal shifts (`bg-bg-surface` on `bg-bg-primary`)
- **Typography:** Epilogue/Barlow Condensed for headlines (uppercase, tight tracking), Space Grotesk/JetBrains Mono for numeric data
- **Colors:** Monochromatic charcoal base, rusted orange (`#E8491A`) accent, gold (`#FFB800`) for totals/rankings, tertiary blue (`#019AD8`) for freshness/records

## Project Structure

```
src/
├── app/
│   ├── leaderboard/       # Rankings page (podium + tiered table)
│   │   ├── page.tsx       # Server component, parallel data fetch
│   │   ├── podium.tsx     # Top 3 cards (2-1-3 layout)
│   │   ├── leaderboard-table.tsx  # Tiered table (top 10 elevated)
│   │   ├── leaderboard-filters.tsx  # Client filters + dynamic subtitle
│   │   └── utils.ts       # Shared helpers (isRecent, formatDate)
│   ├── layout.tsx         # Root layout with fonts
│   ├── globals.css        # Tailwind theme tokens
│   └── page.tsx           # Feed/home page
├── components/
│   ├── nav/               # TopNav + MobileNav
│   └── ui/                # Button, Card, Chip, Loading
├── lib/
│   ├── queries/           # Supabase query functions
│   ├── types.ts           # TypeScript interfaces
│   └── supabase/          # Supabase client setup
scripts/
├── seed-leaderboard.ts    # OPL CSV → Supabase seeder
supabase/
└── migrations/            # 00001-00011 SQL migrations
```

## Key Conventions

- **Server components by default** — only add `"use client"` when interactivity is needed
- **URL-driven state** — leaderboard filters use `searchParams` (no client state for filter values)
- **Parallel data fetching** — use `Promise.all` when multiple queries are independent
- **Deduplication** — leaderboard shows each lifter once (best result), overfetches 3x then deduplicates client-side
- **Tonal layering for depth** — `bg-bg-primary` → `bg-bg-surface` → `bg-bg-surface-elevated` (no shadows)

## Database

Hosted on Supabase. Key tables:
- `leaderboard_entries` — ~50k rows from OPL, per (sex, equipment, weight_class) top 200 by total + DOTS
- `profiles` — user accounts with PL stats
- `user_results` — user-submitted meet results
- `posts` / `comments` — social feed
- `follows` — follower graph

The `tested` column on `leaderboard_entries` was backfilled from federation (IPF-family = tested). A full re-seed from the OPL CSV will populate it accurately from the `Tested` column.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (use as test gate — no test suite yet)
npm run lint         # ESLint
npx tsx scripts/seed-leaderboard.ts  # Re-seed leaderboard (needs opl-data/openpowerlifting.csv)
```

## GitHub

Repository: https://github.com/maxz101524/ThePlatform.git
