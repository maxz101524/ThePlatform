# Leaderboard Redesign — Design Document

## Goal

Redesign the leaderboard from a flat spreadsheet into an aspirational, data-rich ranking page that motivates lifters to see their name on it. Add missing context (tested status, equipment, meet date, freshness) while improving visual hierarchy through a podium + tiered table layout.

## Decisions

- **Audience:** Powerlifting enthusiasts who want data density, but with aspirational visual treatment
- **Layout:** Approach A — Podium cards for top 3 + enhanced table below
- **Tested/Equipment:** Inline chips next to lifter name (compact, self-documenting per row)
- **Freshness:** Use `meet_date` as proxy — "NEW" indicator if result is < 6 months old
- **Visual tiers:** Top 3 (podium cards), Top 4-10 (elevated table rows), 11+ (standard rows)

## Section 1: Page Header & Filter Bar

**Header:**
- "GLOBAL RANKINGS" in `font-heading` at `text-5xl`/`text-6xl`
- Dynamic subtitle reflecting active filters: e.g., "Men · Raw · Tested · All Federations"
- Replaces the generic "Top totals & DOTS scores"

**Filter bar:**
- Horizontal row of filled selects (0px radius, `bg-bg-surface` fill)
- New filters: "Tested" toggle (All / Yes / No), "Weight Class" dropdown (query already exists)
- On mobile: filters collapse into a "Filters" button opening a slide-up sheet

**Data changes:**
- Import `Tested` column from OPL CSV into new `tested` boolean column on `leaderboard_entries`
- Add `tested` to `LeaderboardEntry` type, `LeaderboardFilters`, and query logic

## Section 2: Podium — Top 3 Cards

Three cards, horizontal row. Classic podium arrangement: **2 - 1 - 3** (center is #1, taller).

**Each card contains:**
- Large rank number (`text-6xl font-heading`, tinted: gold #1, silver #2, orange #3)
- Lifter name (`font-heading text-xl uppercase`)
- Country (small muted text)
- Inline chips: `RAW`, `TESTED` (0px radius)
- Total as hero number (`font-mono text-3xl font-bold`, gold accent)
- Compact S/B/D row: `S: 577.5 · B: 460.0 · D: 370.0`
- DOTS (smaller, muted)
- Federation + date (e.g., "WPC · Mar 2024") in `text-xs text-text-muted`
- Freshness: `NEW` chip in tertiary blue (#019AD8) if meet_date < 6 months

**Styling:**
- `bg-bg-surface` cards on `bg-bg-primary` page (tonal layering, no borders)
- 0px radius everywhere
- 2px accent line at top of each card in rank color (gold, silver, orange)
- No drop shadows

**Responsive:**
- Desktop: 3 cards in a row, center ~10% taller
- Tablet: 3 cards, equal height
- Mobile: #1 full width on top, #2/#3 side by side below

## Section 3: Table — Ranks 4+

**Columns (left to right):**

| Column | Breakpoint | Notes |
|--------|-----------|-------|
| Rank | Always | Mono bold. 4-10: `text-text-primary`, 11+: `text-text-muted` |
| Freshness | Always | Green `▲ NEW` chip if meet_date < 6 months, empty otherwise |
| Lifter | Always | Name (bold) + country (muted) + chips (RAW, TESTED) |
| BW | Always | Right-aligned mono, muted |
| Squat | Always | Right-aligned mono |
| Bench | Always | Right-aligned mono |
| Deadlift | Always | Right-aligned mono |
| Total | Always | Bold, gold accent |
| DOTS | Always | Secondary accent |
| Federation | ≥md | Small muted |
| Date | ≥md | "Mar 2024" format, replaces old Meet column position |
| Meet | ≥lg | Meet name at widest breakpoint |

**Row treatment by tier:**
- **Rows 4-10:** `bg-bg-surface` background, `py-3.5` padding — visible "top 10 block"
- **Rows 11+:** `bg-bg-primary`, `py-3` — standard density
- **Hover:** All rows → `bg-bg-surface-alt`
- **No border lines** — spacing + tonal shift only (per DESIGN.md)

**Freshness logic:**
- `< 6 months`: green `▲ NEW` chip (`semantic-success` color)
- `≥ 6 months`: no indicator

## Files to Modify

### Database / Data Layer
- `supabase/migrations/` — new migration adding `tested` boolean column
- `scripts/seed-leaderboard.ts` — parse `Tested` column from OPL CSV
- `src/lib/types.ts` — add `tested` to `LeaderboardEntry` and `LeaderboardFilters`
- `src/lib/queries/leaderboard.ts` — add `tested` filter, `weight_class` filter support

### Components
- `src/app/leaderboard/page.tsx` — restructure layout: header → filters → podium → table
- `src/app/leaderboard/leaderboard-table.tsx` — rewrite with new columns, tier styling, freshness
- `src/app/leaderboard/leaderboard-filters.tsx` — add Tested, Weight Class filters; mobile sheet
- **New:** `src/app/leaderboard/podium.tsx` — top 3 card component
- `src/components/ui/chip.tsx` — may need updates for inline tag variants

### Styling
- `src/app/globals.css` — add any missing CSS variables (tertiary blue, etc.)
