# Leaderboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the leaderboard page with podium cards for top 3, tiered table rows, inline tested/equipment chips, meet date column, and freshness indicators.

**Architecture:** Data layer first (add `tested` column), then bottom-up UI (chips, podium, table, filters, page assembly). Each task is independently testable.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL), Tailwind CSS 4, TypeScript

**Design doc:** `docs/plans/2026-03-23-leaderboard-redesign.md`

---

### Task 1: Add `tested` column to database

**Files:**
- Create: `supabase/migrations/00011_add_tested_column.sql`

**Step 1: Write the migration**

```sql
-- Add tested column to leaderboard_entries
ALTER TABLE leaderboard_entries ADD COLUMN tested BOOLEAN;

-- Index for filtering by tested status
CREATE INDEX idx_leaderboard_tested
  ON leaderboard_entries (sex, tested, equipment, weight_class_kg, total DESC NULLS LAST);
```

**Step 2: Apply the migration**

Run: `npx supabase db push` (or apply via Supabase dashboard if using hosted)

**Step 3: Commit**

```bash
git add supabase/migrations/00011_add_tested_column.sql
git commit -m "feat(db): add tested boolean column to leaderboard_entries"
```

---

### Task 2: Import `Tested` field in seed script

**Files:**
- Modify: `scripts/seed-leaderboard.ts`

**Step 1: Add `Tested` to `OplRow` interface** (line ~27)

In the `OplRow` interface, add after `MeetName`:
```typescript
Tested: string;
```

**Step 2: Add `tested` to `LeaderboardCandidate` interface** (line ~79)

Add after `federation`:
```typescript
tested: boolean;
```

**Step 3: Set `tested` in candidate construction** (line ~195, inside the candidate object literal)

Add after the `federation` line:
```typescript
tested: row.Tested === "Yes",
```

**Step 4: Verify the seed script compiles**

Run: `npx tsc --noEmit scripts/seed-leaderboard.ts` or `npx tsx scripts/seed-leaderboard.ts --help`

Note: A full re-seed is needed to populate the `tested` column. This can be done after all tasks are complete:
Run: `npx tsx scripts/seed-leaderboard.ts`

**Step 5: Commit**

```bash
git add scripts/seed-leaderboard.ts
git commit -m "feat(seed): import Tested column from OPL CSV"
```

---

### Task 3: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts:1-30`

**Step 1: Add `tested` to `LeaderboardEntry`** (after line 19, `federation`)

```typescript
tested: boolean | null;
```

**Step 2: Add `tested` to `LeaderboardFilters`** (after line 26, `federation`)

```typescript
tested?: boolean;
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors (downstream components will need updates but types are structurally compatible since `tested` is optional/nullable)

**Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add tested field to LeaderboardEntry and LeaderboardFilters"
```

---

### Task 4: Update leaderboard query with `tested` filter

**Files:**
- Modify: `src/lib/queries/leaderboard.ts:1-57`

**Step 1: Add tested filter to `getLeaderboard`**

After the federation filter block (line 22), add:
```typescript
if (filters.tested !== undefined) {
  query = query.eq("tested", filters.tested);
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/lib/queries/leaderboard.ts
git commit -m "feat(query): add tested filter to leaderboard query"
```

---

### Task 5: Add CSS variables for new design tokens

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add missing color tokens**

Add inside the `@theme` block, after the existing colors:
```css
--color-accent-tertiary: #019AD8;
--color-accent-bronze: #CD7F32;
--color-accent-silver: #C0C0C0;
--color-rank-gold: #FFB800;
--color-rank-silver: #B3B3B3;
--color-rank-bronze: #E8491A;
--color-bg-surface-elevated: #222222;
```

**Step 2: Verify the app still builds**

Run: `npm run build` (or `npx next build`)

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(css): add design tokens for podium, freshness, and tier styling"
```

---

### Task 6: Create inline tag chip component

**Files:**
- Modify: `src/components/ui/chip.tsx`

**Step 1: Add a `TagChip` variant for inline leaderboard tags**

Add below the existing `Chip` component:

```typescript
interface TagChipProps {
  children: React.ReactNode;
  variant?: "default" | "tested" | "equipment" | "fresh";
}

export function TagChip({ children, variant = "default" }: TagChipProps) {
  const variantStyles = {
    default: "border-border text-text-muted",
    tested: "border-semantic-success/30 text-semantic-success",
    equipment: "border-border text-text-muted",
    fresh: "border-accent-tertiary/30 text-accent-tertiary",
  };

  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-heading uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
```

Key design decisions:
- `span` not `button` (display only, not interactive)
- 0px radius (no `rounded-*` class — per DESIGN.md)
- Tiny size (`text-[10px]`, `px-1.5 py-0.5`) to sit inline next to lifter names

**Step 2: Verify it renders**

This will be visually verified when integrated into the table. For now, verify compilation:
Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/ui/chip.tsx
git commit -m "feat(ui): add TagChip component for inline leaderboard labels"
```

---

### Task 7: Build the Podium component

**Files:**
- Create: `src/app/leaderboard/podium.tsx`

**Step 1: Create the podium component**

```tsx
import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

function isRecent(meetDate: string): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return new Date(meetDate) >= sixMonthsAgo;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const RANK_COLORS = {
  1: { accent: "bg-rank-gold", text: "text-rank-gold", border: "border-t-rank-gold" },
  2: { accent: "bg-rank-silver", text: "text-rank-silver", border: "border-t-rank-silver" },
  3: { accent: "bg-rank-bronze", text: "text-rank-bronze", border: "border-t-rank-bronze" },
} as const;

function PodiumCard({
  entry,
  rank,
  isCenter,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  isCenter: boolean;
}) {
  const colors = RANK_COLORS[rank];
  const recent = isRecent(entry.meet_date);

  return (
    <div
      className={`flex flex-col bg-bg-surface border-t-2 ${colors.border} p-5 ${
        isCenter ? "md:py-8" : ""
      }`}
    >
      {/* Rank number */}
      <span className={`font-heading text-6xl font-bold ${colors.text} leading-none`}>
        {rank}
      </span>

      {/* Name + country */}
      <h3 className="mt-3 font-heading text-xl font-bold uppercase text-text-primary">
        {entry.lifter_name}
      </h3>
      {entry.country && (
        <span className="text-xs text-text-muted">{entry.country}</span>
      )}

      {/* Chips */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TagChip variant="equipment">{entry.equipment}</TagChip>
        {entry.tested && <TagChip variant="tested">Tested</TagChip>}
        {recent && <TagChip variant="fresh">New</TagChip>}
      </div>

      {/* Total — hero number */}
      <div className="mt-4">
        <span className="font-mono text-3xl font-bold text-accent-secondary">
          {entry.total.toFixed(1)}
        </span>
        <span className="ml-1 text-xs text-text-muted">kg</span>
      </div>

      {/* S/B/D breakdown */}
      <p className="mt-1 font-mono text-xs text-text-muted">
        S: {entry.best_squat?.toFixed(1) ?? "—"} · B:{" "}
        {entry.best_bench?.toFixed(1) ?? "—"} · D:{" "}
        {entry.best_deadlift?.toFixed(1) ?? "—"}
      </p>

      {/* DOTS */}
      {entry.dots && (
        <p className="mt-1 font-mono text-xs text-text-secondary">
          {entry.dots.toFixed(2)} DOTS
        </p>
      )}

      {/* Federation + date */}
      <p className="mt-auto pt-3 text-xs text-text-muted">
        {entry.federation} · {formatDate(entry.meet_date)}
      </p>
    </div>
  );
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length < 3) return null;

  // Podium order: 2nd - 1st - 3rd
  const [first, second, third] = entries;

  return (
    <div className="grid grid-cols-1 gap-px md:grid-cols-3">
      {/* Mobile: 1st on top, then 2nd, then 3rd */}
      <div className="order-2 md:order-1">
        <PodiumCard entry={second} rank={2} isCenter={false} />
      </div>
      <div className="order-1 md:order-2">
        <PodiumCard entry={first} rank={1} isCenter={true} />
      </div>
      <div className="order-3">
        <PodiumCard entry={third} rank={3} isCenter={false} />
      </div>
    </div>
  );
}
```

Key design decisions:
- `gap-px` between cards creates a 1px visual separation via the dark background bleeding through (no borders needed, per DESIGN.md)
- Center card gets extra vertical padding (`md:py-8`) to be visually taller
- Mobile stacks vertically: #1 first, then #2, then #3
- `mt-auto` on federation/date pushes it to the bottom of the card, keeping cards aligned even if content varies
- `isRecent` helper used for the `NEW` chip — reused in the table too
- 0px radius everywhere (no `rounded-*`)

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/leaderboard/podium.tsx
git commit -m "feat(leaderboard): add Podium component for top 3 lifters"
```

---

### Task 8: Rewrite the leaderboard table with new columns and tiers

**Files:**
- Modify: `src/app/leaderboard/leaderboard-table.tsx` (full rewrite)

**Step 1: Rewrite the table component**

Replace the entire file with:

```tsx
import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
  startRank: number;
}

function isRecent(meetDate: string): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return new Date(meetDate) >= sixMonthsAgo;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function LeaderboardTable({ entries, sortBy, startRank }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted w-12">#</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted w-12"></th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "total" ? "text-accent-secondary" : "text-text-muted"}`}>Total</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "dots" || sortBy === "wilks" ? "text-accent-secondary" : "text-text-muted"}`}>DOTS</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Fed</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
            <th className="hidden lg:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const rank = startRank + i + 1;
            const inTopTen = rank <= 10;
            const recent = isRecent(entry.meet_date);

            return (
              <tr
                key={entry.id}
                className={`transition-colors hover:bg-bg-surface-elevated ${
                  inTopTen ? "bg-bg-surface" : ""
                }`}
              >
                {/* Rank */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} font-mono font-bold ${
                  inTopTen ? "text-text-primary" : "text-text-muted"
                }`}>
                  {rank}
                </td>

                {/* Freshness */}
                <td className={`px-1 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  {recent && (
                    <span className="inline-flex items-center font-heading text-[10px] uppercase tracking-wider text-semantic-success">
                      ▲
                    </span>
                  )}
                </td>

                {/* Lifter + chips */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary">
                      {entry.lifter_name}
                    </span>
                    {entry.country && (
                      <span className="text-xs text-text-muted">{entry.country}</span>
                    )}
                    <div className="flex gap-1">
                      <TagChip variant="equipment">{entry.equipment}</TagChip>
                      {entry.tested && <TagChip variant="tested">Tested</TagChip>}
                    </div>
                  </div>
                </td>

                {/* BW */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-muted`}>
                  {entry.bodyweight_kg?.toFixed(1) || "—"}
                </td>

                {/* Squat */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_squat?.toFixed(1) || "—"}
                </td>

                {/* Bench */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_bench?.toFixed(1) || "—"}
                </td>

                {/* Deadlift */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_deadlift?.toFixed(1) || "—"}
                </td>

                {/* Total */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono font-bold text-accent-secondary`}>
                  {entry.total?.toFixed(1) || "—"}
                </td>

                {/* DOTS */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-secondary`}>
                  {entry.dots?.toFixed(2) || "—"}
                </td>

                {/* Federation */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
                  {entry.federation}
                </td>

                {/* Date */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
                  {formatDate(entry.meet_date)}
                </td>

                {/* Meet name */}
                <td className={`hidden lg:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
                  {entry.meet_name}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

Key changes from current implementation:
- New columns: Freshness indicator, Date, inline chips in Lifter column
- No border lines between rows (removed `border-b border-border/50`)
- Top 10 rows get `bg-bg-surface` and `py-3.5` (taller)
- Rows 11+ get standard `py-3`
- Hover uses new `bg-bg-surface-elevated` token
- Date column shows "Mar 2024" format, visible at ≥md
- Meet column pushed to ≥lg

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/leaderboard/leaderboard-table.tsx
git commit -m "feat(leaderboard): rewrite table with tiers, chips, freshness, date column"
```

---

### Task 9: Update filters with Tested toggle and Weight Class dropdown

**Files:**
- Modify: `src/app/leaderboard/leaderboard-filters.tsx` (full rewrite)

**Step 1: Rewrite filters component**

Replace the entire file with:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

const FEDERATIONS = ["All", "IPF", "USAPL", "USPA", "SPF", "WRPF", "RPS", "APF", "WPC"];
const EQUIPMENT = ["All", "Raw", "Wraps", "Single-ply", "Multi-ply"];
const TESTED_OPTIONS = [
  { label: "All", value: "" },
  { label: "Tested", value: "true" },
  { label: "Untested", value: "false" },
];
const SORT_OPTIONS = [
  { label: "Total", value: "total" },
  { label: "DOTS", value: "dots" },
  { label: "Wilks", value: "wilks" },
  { label: "Squat", value: "best_squat" },
  { label: "Bench", value: "best_bench" },
  { label: "Deadlift", value: "best_deadlift" },
];

interface LeaderboardFiltersProps {
  weightClasses?: string[];
}

export function LeaderboardFilters({ weightClasses = [] }: LeaderboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFed = searchParams.get("fed") || "All";
  const currentSex = searchParams.get("sex") || "M";
  const currentEquip = searchParams.get("equip") || "All";
  const currentSort = searchParams.get("sort") || "total";
  const currentTested = searchParams.get("tested") || "";
  const currentClass = searchParams.get("class") || "All";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("offset");
      router.push(`/leaderboard?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Build dynamic subtitle from active filters
  const subtitle = [
    currentSex === "F" ? "Women" : "Men",
    currentEquip !== "All" ? currentEquip : null,
    currentTested === "true" ? "Tested" : currentTested === "false" ? "Untested" : null,
    currentClass !== "All" ? `${currentClass} kg` : null,
    currentFed !== "All" ? currentFed : "All Federations",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {/* Dynamic subtitle */}
      <p className="mb-4 text-sm text-text-muted">{subtitle}</p>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-bg-surface p-4">
        <FilterSelect label="Federation" value={currentFed} options={FEDERATIONS} onChange={(v) => updateFilter("fed", v)} />
        <FilterSelect label="Sex" value={currentSex} options={["M", "F"]} onChange={(v) => updateFilter("sex", v)} />
        <FilterSelect label="Equipment" value={currentEquip} options={EQUIPMENT} onChange={(v) => updateFilter("equip", v)} />
        <FilterSelect
          label="Tested"
          value={currentTested}
          options={TESTED_OPTIONS.map((t) => t.value)}
          labels={TESTED_OPTIONS.map((t) => t.label)}
          onChange={(v) => updateFilter("tested", v)}
        />
        {weightClasses.length > 0 && (
          <FilterSelect
            label="Weight Class"
            value={currentClass}
            options={["All", ...weightClasses]}
            labels={["All", ...weightClasses.map((wc) => `${wc} kg`)]}
            onChange={(v) => updateFilter("class", v)}
          />
        )}
        <FilterSelect
          label="Sort By"
          value={currentSort}
          options={SORT_OPTIONS.map((s) => s.value)}
          labels={SORT_OPTIONS.map((s) => s.label)}
          onChange={(v) => updateFilter("sort", v)}
        />
        <Button variant="primary" size="sm" onClick={() => router.push("/leaderboard")}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-heading uppercase tracking-wider text-text-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 border border-border bg-bg-primary px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>
            {labels ? labels[i] : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Key changes:
- Added Tested filter (All / Tested / Untested)
- Added Weight Class dropdown (populated from props, passed by page)
- Dynamic subtitle reflecting active filters
- Removed `rounded-lg` and `rounded-md` (0px radius per DESIGN.md)
- Filter container has no border (tonal shift only: `bg-bg-surface`)

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/leaderboard/leaderboard-filters.tsx
git commit -m "feat(leaderboard): add Tested, Weight Class filters and dynamic subtitle"
```

---

### Task 10: Assemble the redesigned leaderboard page

**Files:**
- Modify: `src/app/leaderboard/page.tsx` (full rewrite)

**Step 1: Rewrite the page component**

Replace the entire file with:

```tsx
import { Suspense } from "react";
import { getLeaderboard, getWeightClasses } from "@/lib/queries/leaderboard";
import { LeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardTable } from "./leaderboard-table";
import { Podium } from "./podium";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const sex = (params.sex as "M" | "F") || "M";
  const sortBy = params.sort || "total";
  const offset = parseInt(params.offset || "0", 10);
  const testedParam = params.tested;

  const [entries, weightClasses] = await Promise.all([
    getLeaderboard({
      sex,
      federation: params.fed !== "All" ? params.fed : undefined,
      equipment: params.equip !== "All" ? params.equip : undefined,
      weightClass: params.class !== "All" ? params.class : undefined,
      tested: testedParam === "true" ? true : testedParam === "false" ? false : undefined,
      sortBy: sortBy as "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift",
      limit: 50,
      offset,
    }),
    getWeightClasses(sex, params.equip !== "All" ? params.equip : undefined),
  ]);

  // Split entries: top 3 go to podium (only on first page), rest go to table
  const showPodium = offset === 0 && entries.length >= 3;
  const podiumEntries = showPodium ? entries.slice(0, 3) : [];
  const tableEntries = showPodium ? entries.slice(3) : entries;
  const tableStartRank = showPodium ? 3 : offset;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-5xl font-bold uppercase text-text-primary md:text-6xl">
          Global Rankings
        </h1>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <LeaderboardFilters weightClasses={weightClasses} />
      </Suspense>

      {/* Podium — top 3 on first page */}
      {showPodium && <Podium entries={podiumEntries} />}

      {/* Table — ranks 4+ (or all ranks on subsequent pages) */}
      <Suspense fallback={<TableSkeleton rows={20} />}>
        <LeaderboardTable entries={tableEntries} sortBy={sortBy} startRank={tableStartRank} />
      </Suspense>

      {/* Load More */}
      {entries.length === 50 && (
        <div className="flex justify-center">
          <a
            href={`/leaderboard?${new URLSearchParams({ ...params as Record<string, string>, offset: String(offset + 50) }).toString()}`}
            className="border border-border px-6 py-2 font-heading text-sm uppercase tracking-wider text-text-muted hover:border-text-muted hover:text-text-primary transition-colors"
          >
            Load More
          </a>
        </div>
      )}
    </div>
  );
}
```

Key changes:
- Parallel fetch: `getLeaderboard` + `getWeightClasses` via `Promise.all`
- Passes `weightClasses` to filters component
- Parses `tested` param from URL
- Splits entries: first 3 → Podium, rest → Table (only on page 1)
- `tableStartRank` adjusts so table starts at rank 4
- Larger heading (`text-5xl md:text-6xl`)
- Subtitle moved into the filters component
- `space-y-8` for more breathing room between sections
- Removed `rounded-md` from Load More button (0px radius)

**Step 2: Verify the full page builds**

Run: `npm run build`
Expected: Build succeeds. If there are type errors related to the `tested` field not existing in the database yet, that's expected — the migration + re-seed needs to happen first.

**Step 3: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat(leaderboard): assemble redesigned page with podium, tiers, and new filters"
```

---

### Task 11: Re-seed the database

**Step 1: Run the seed script**

Run: `npx tsx scripts/seed-leaderboard.ts`
Expected: Output showing rows read, entries inserted, no errors.

**Step 2: Verify data in Supabase**

Run: Check that `tested` column is populated by querying:
```sql
SELECT tested, COUNT(*) FROM leaderboard_entries GROUP BY tested;
```

Expected: Mix of `true`, `false`, and possibly `null` values.

**Step 3: Visual verification**

Run: `npm run dev`

Open `http://localhost:3000/leaderboard` and verify:
- Podium shows top 3 with cards
- Inline chips show equipment + tested status
- Date column shows "Mon YYYY" format
- Freshness indicator (▲) appears for recent results
- Rows 4-10 have elevated background
- Filters work: Tested, Weight Class, etc.

---

### Task 12: Final polish and commit

**Step 1: Review the full page for visual consistency**

Check:
- 0px radius on all elements (no `rounded-*` classes anywhere)
- No 1px border dividers between table rows
- Tonal layering works (surface levels create depth without borders)
- Mobile responsive: podium stacks correctly, table scrolls horizontally
- Filter sheet works on mobile (or wraps gracefully)

**Step 2: Fix any issues found**

Address visual bugs, alignment issues, or responsive breakpoint problems.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix(leaderboard): polish visual consistency and responsive behavior"
```
