# Data Architecture Revamp — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 927K-lifter/3.5M-result architecture with a lean leaderboard + user profiles model that fits in Supabase free tier (~10 MB vs 500 MB limit).

**Architecture:** Pre-computed `leaderboard_entries` table (~25K rows) from OPL CSV for elite rankings. User profiles with self-service competition history via OPL name claiming. Follows system for social feed. Drop lifters, results, meets tables entirely.

**Tech Stack:** Next.js 15 (App Router), Supabase (Postgres + Auth + RLS), Tailwind CSS 4, TypeScript, tsx for scripts

**Note:** This project has no test framework configured. Verification is via `npm run build` and manual testing. Consider adding vitest in a future task.

---

## Phase 1: Database Migration

### Task 1: Create the migration SQL

**Files:**
- Create: `supabase/migrations/00008_data_architecture_revamp.sql`

Write a single migration that:

1. Creates `leaderboard_entries` table
2. Creates `follows` table
3. Creates `user_results` table
4. Alters `profiles` — adds PL-specific columns
5. Alters `posts` — drops `lifter_id`/`meet_id` FKs, adds `tag` column
6. Alters `comments` — drops `lifter_id`/`meet_id`, drops constraint, makes `post_id` NOT NULL
7. Drops `content_lifter_tags`, `content_meet_tags` tables
8. Drops `results`, `lifters`, `meets` tables (in FK order)
9. Drops unused functions (`get_leaderboard`, `insert_results_batch`)
10. Creates RLS policies for new tables
11. Creates trigger for follow count maintenance

```sql
-- ============================================================
-- 00008: Data Architecture Revamp
-- Replaces lifters/results/meets with lean leaderboard + user profiles
-- ============================================================

-- 1. Create leaderboard_entries
CREATE TABLE leaderboard_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifter_opl_name TEXT NOT NULL,
  lifter_name     TEXT NOT NULL,
  sex             sex_enum NOT NULL,
  country         TEXT,
  equipment       equipment_enum NOT NULL,
  weight_class_kg TEXT NOT NULL,
  bodyweight_kg   NUMERIC,
  best_squat      NUMERIC,
  best_bench      NUMERIC,
  best_deadlift   NUMERIC,
  total           NUMERIC NOT NULL,
  dots            NUMERIC,
  wilks           NUMERIC,
  meet_name       TEXT NOT NULL,
  meet_date       DATE NOT NULL,
  federation      TEXT NOT NULL,
  UNIQUE(lifter_opl_name, equipment, weight_class_kg)
);

CREATE INDEX idx_leaderboard_ranking
  ON leaderboard_entries (sex, equipment, weight_class_kg, total DESC NULLS LAST);
CREATE INDEX idx_leaderboard_dots
  ON leaderboard_entries (sex, equipment, weight_class_kg, dots DESC NULLS LAST);
CREATE INDEX idx_leaderboard_lifter
  ON leaderboard_entries (lifter_opl_name);

-- 2. Create follows
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON follows (following_id);

-- 3. Create user_results
CREATE TABLE user_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meet_name       TEXT NOT NULL,
  meet_date       DATE NOT NULL,
  federation      TEXT,
  weight_class_kg TEXT,
  bodyweight_kg   NUMERIC,
  equipment       equipment_enum,
  best_squat      NUMERIC,
  best_bench      NUMERIC,
  best_deadlift   NUMERIC,
  total           NUMERIC,
  dots            NUMERIC,
  wilks           NUMERIC,
  place           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_results_profile ON user_results (profile_id, meet_date DESC);

-- 4. Alter profiles — add PL-specific columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS opl_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex sex_enum;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_class_kg TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment equipment_enum;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_squat NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_bench NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_deadlift NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_total NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dots NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- 5. Alter posts — drop lifter/meet FKs, add tag
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_lifter_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_meet_id_fkey;
ALTER TABLE posts DROP COLUMN IF EXISTS lifter_id;
ALTER TABLE posts DROP COLUMN IF EXISTS meet_id;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tag TEXT;

-- 6. Alter comments — simplify to posts-only
ALTER TABLE comments DROP CONSTRAINT IF EXISTS exactly_one_parent;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_lifter_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_meet_id_fkey;
ALTER TABLE comments DROP COLUMN IF EXISTS lifter_id;
ALTER TABLE comments DROP COLUMN IF EXISTS meet_id;
-- Make post_id required (comments only on posts now)
-- Can't ALTER to NOT NULL if existing rows have NULL, but table is empty so safe:
ALTER TABLE comments ALTER COLUMN post_id SET NOT NULL;

-- 7. Drop content tag tables (depend on lifters/meets)
DROP TABLE IF EXISTS content_lifter_tags CASCADE;
DROP TABLE IF EXISTS content_meet_tags CASCADE;

-- 8. Drop old tables (order matters for FKs)
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS lifters CASCADE;
DROP TABLE IF EXISTS meets CASCADE;

-- 9. Drop unused functions
DROP FUNCTION IF EXISTS get_leaderboard;
DROP FUNCTION IF EXISTS insert_results_batch;

-- 10. RLS policies
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Public read user_results" ON user_results FOR SELECT USING (true);
CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);

CREATE POLICY "Auth insert follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Auth insert user_results" ON user_results FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Auth update own user_results" ON user_results FOR UPDATE
  USING (auth.uid() = profile_id);
CREATE POLICY "Auth delete own user_results" ON user_results FOR DELETE
  USING (auth.uid() = profile_id);

-- 11. Follow count trigger
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
```

**Step:** Push migration

```bash
SUPABASE_ACCESS_TOKEN=sbp_42f8bc398784b92467d569e5c78a11011ecfbb77 npx supabase db push
```

**Step:** Commit

```bash
git add supabase/migrations/00008_data_architecture_revamp.sql
git commit -m "feat: migrate to lean leaderboard + user profiles schema"
```

---

## Phase 2: Seed Script

### Task 2: Rewrite seed script for leaderboard_entries

**Files:**
- Create: `scripts/seed-leaderboard.ts`
- Delete: `scripts/seed-results.ts` (no longer needed)

The script reads the full OPL CSV, computes top 200 per (sex, equipment, weight_class), and upserts into `leaderboard_entries`.

```typescript
/**
 * Seed leaderboard_entries from OpenPowerlifting CSV.
 * For each (sex, equipment, weight_class), keeps the top 200 lifters by total.
 */
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPL_CSV_PATH =
  process.env.OPL_CSV_PATH || "./opl-data/openpowerlifting.csv";
const TOP_N = 200;
const BATCH_SIZE = 500;

interface OplRow {
  Name: string;
  Sex: string;
  Equipment: string;
  BodyweightKg: string;
  WeightClassKg: string;
  Best3SquatKg: string;
  Best3BenchKg: string;
  Best3DeadliftKg: string;
  TotalKg: string;
  Dots: string;
  Wilks: string;
  Place: string;
  Country: string;
  Federation: string;
  Date: string;
  MeetName: string;
}

const VALID_SEX = new Set(["M", "F", "Mx"]);
const VALID_EQUIPMENT = new Set(["Raw", "Wraps", "Single-ply", "Multi-ply"]);

function num(val: string): number | null {
  if (!val || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// Standard IPF-style weight classes
const WEIGHT_CLASSES: Record<string, string[]> = {
  M: ["59", "66", "74", "83", "93", "105", "120", "120+"],
  F: ["47", "52", "57", "63", "69", "76", "84", "84+"],
};

function normalizeWeightClass(raw: string, sex: string): string | null {
  if (!raw) return null;
  // Keep the raw value — the leaderboard filters on exact text match
  return raw;
}

interface LeaderboardCandidate {
  lifter_opl_name: string;
  lifter_name: string;
  sex: string;
  country: string | null;
  equipment: string;
  weight_class_kg: string;
  bodyweight_kg: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number;
  dots: number | null;
  wilks: number | null;
  meet_name: string;
  meet_date: string;
  federation: string;
}

async function seed() {
  console.log("=== Seeding leaderboard_entries from OPL CSV ===");
  console.log(`Reading from: ${OPL_CSV_PATH}`);
  console.log(`Keeping top ${TOP_N} per (sex, equipment, weight_class)\n`);

  // Map: "M|Raw|83" -> sorted array of top candidates
  const buckets = new Map<string, LeaderboardCandidate[]>();
  // Track best total per lifter per bucket to avoid duplicates
  const lifterBest = new Map<string, number>(); // "oplName|bucket" -> best total

  const parser = createReadStream(OPL_CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  let rowCount = 0;
  let skipped = 0;

  for await (const row of parser as AsyncIterable<OplRow>) {
    rowCount++;
    if (rowCount % 500000 === 0) console.log(`  Read ${rowCount} rows...`);

    if (!VALID_SEX.has(row.Sex) || !VALID_EQUIPMENT.has(row.Equipment)) {
      skipped++;
      continue;
    }

    const total = num(row.TotalKg);
    if (!total || total <= 0) {
      skipped++;
      continue;
    }

    const wc = normalizeWeightClass(row.WeightClassKg, row.Sex);
    if (!wc) {
      skipped++;
      continue;
    }

    const bucketKey = `${row.Sex}|${row.Equipment}|${wc}`;
    const lifterKey = `${row.Name}|${bucketKey}`;

    // Only keep a lifter's best total per bucket
    const prevBest = lifterBest.get(lifterKey) || 0;
    if (total <= prevBest) continue;
    lifterBest.set(lifterKey, total);

    const candidate: LeaderboardCandidate = {
      lifter_opl_name: row.Name,
      lifter_name: row.Name.replace(/ #\d+$/, ""),
      sex: row.Sex,
      country: row.Country || null,
      equipment: row.Equipment,
      weight_class_kg: wc,
      bodyweight_kg: num(row.BodyweightKg),
      best_squat: num(row.Best3SquatKg),
      best_bench: num(row.Best3BenchKg),
      best_deadlift: num(row.Best3DeadliftKg),
      total,
      dots: num(row.Dots),
      wilks: num(row.Wilks),
      meet_name: row.MeetName,
      meet_date: row.Date,
      federation: row.Federation,
    };

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }

    const bucket = buckets.get(bucketKey)!;

    // Remove previous entry for this lifter if exists
    const existingIdx = bucket.findIndex(
      (c) => c.lifter_opl_name === row.Name
    );
    if (existingIdx >= 0) {
      bucket.splice(existingIdx, 1);
    }

    // Insert in sorted position
    const insertIdx = bucket.findIndex((c) => c.total < total);
    if (insertIdx >= 0) {
      bucket.splice(insertIdx, 0, candidate);
    } else {
      bucket.push(candidate);
    }

    // Trim to TOP_N
    if (bucket.length > TOP_N) {
      bucket.pop();
    }
  }

  console.log(`\nCSV read: ${rowCount} rows, ${skipped} skipped`);
  console.log(`Buckets: ${buckets.size} categories\n`);

  // Collect all entries
  const allEntries: LeaderboardCandidate[] = [];
  for (const [key, bucket] of buckets) {
    allEntries.push(...bucket);
  }
  console.log(`Total leaderboard entries: ${allEntries.length}`);

  // Truncate and insert
  console.log("\nTruncating leaderboard_entries...");
  await supabase.from("leaderboard_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Inserting leaderboard entries...");
  let inserted = 0;
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("leaderboard_entries").insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE)} error: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  // Update sync metadata
  await supabase.from("sync_metadata").upsert(
    {
      key: "opl_leaderboard_seed",
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  console.log(`\n=== Done: ${inserted} leaderboard entries inserted ===`);
}

seed().catch(console.error);
```

**Step:** Update package.json scripts

Add `"seed:leaderboard": "tsx scripts/seed-leaderboard.ts"` to scripts.

**Step:** Run the seed

```bash
OPL_CSV_PATH=/tmp/openpowerlifting-2026-03-21/openpowerlifting-2026-03-21-c25d79ce.csv npm run seed:leaderboard
```

**Step:** Verify row count

```bash
# Should show ~20-30K rows
source .env.local && curl -s \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/leaderboard_entries?select=id" \
  -D - -o /dev/null 2>/dev/null | grep content-range
```

**Step:** Commit

```bash
git add scripts/seed-leaderboard.ts package.json
git rm scripts/seed-results.ts
git commit -m "feat: add leaderboard seed script, remove results seed"
```

---

## Phase 3: Types & Query Layer

### Task 3: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

Replace all types to match new schema:

```typescript
// Leaderboard
export interface LeaderboardEntry {
  id: string;
  lifter_opl_name: string;
  lifter_name: string;
  sex: "M" | "F" | "Mx";
  country: string | null;
  equipment: "Raw" | "Wraps" | "Single-ply" | "Multi-ply";
  weight_class_kg: string;
  bodyweight_kg: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number;
  dots: number | null;
  wilks: number | null;
  meet_name: string;
  meet_date: string;
  federation: string;
}

export interface LeaderboardFilters {
  sex: "M" | "F" | "Mx";
  equipment?: string;
  weightClass?: string;
  federation?: string;
  sortBy: "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift";
  limit: number;
  offset: number;
}

// User profiles
export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram: string | null;
  opl_name: string | null;
  sex: "M" | "F" | "Mx" | null;
  country: string | null;
  weight_class_kg: string | null;
  equipment: string | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  best_total: number | null;
  dots: number | null;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface UserResult {
  id: string;
  profile_id: string;
  meet_name: string;
  meet_date: string;
  federation: string | null;
  weight_class_kg: string | null;
  bodyweight_kg: number | null;
  equipment: string | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
  place: string | null;
}

// Feed
export interface Post {
  id: string;
  user_id: string;
  body_text: string;
  link_url: string | null;
  link_preview: {
    title?: string;
    description?: string;
    thumbnail?: string;
    domain?: string;
  } | null;
  tag: string | null;
  vote_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}

export interface AggregatedContent {
  id: string;
  platform: "youtube" | "instagram" | "podcast";
  source_url: string;
  embed_url: string;
  title: string;
  thumbnail_url: string | null;
  description: string | null;
  published_at: string;
  content_sources: {
    creator_name: string;
  };
}
```

**Step:** Commit

```bash
git add src/lib/types.ts
git commit -m "refactor: update types for new schema"
```

### Task 4: Rewrite query files

**Files:**
- Rewrite: `src/lib/queries/leaderboard.ts`
- Rewrite: `src/lib/queries/feed.ts`
- Rewrite: `src/lib/queries/search.ts`
- Create: `src/lib/queries/profile.ts`
- Create: `src/lib/queries/follow.ts`
- Delete: `src/lib/queries/lifter.ts`
- Delete: `src/lib/queries/meets.ts`

#### `src/lib/queries/leaderboard.ts`

```typescript
import { createServerClient } from "@/lib/supabase/server";
import type { LeaderboardEntry, LeaderboardFilters } from "@/lib/types";

export async function getLeaderboard(
  filters: LeaderboardFilters
): Promise<LeaderboardEntry[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("sex", filters.sex);

  if (filters.equipment) {
    query = query.eq("equipment", filters.equipment);
  }
  if (filters.weightClass) {
    query = query.eq("weight_class_kg", filters.weightClass);
  }
  if (filters.federation) {
    query = query.eq("federation", filters.federation);
  }

  query = query
    .order(filters.sortBy, { ascending: false, nullsFirst: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  const { data, error } = await query;
  if (error) {
    console.error("Leaderboard query error:", error.message);
    return [];
  }
  return (data as LeaderboardEntry[]) || [];
}

export async function getWeightClasses(
  sex: string,
  equipment?: string
): Promise<string[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("leaderboard_entries")
    .select("weight_class_kg")
    .eq("sex", sex);

  if (equipment) query = query.eq("equipment", equipment);

  const { data } = await query;
  if (!data) return [];

  const unique = [...new Set(data.map((d) => d.weight_class_kg))];
  return unique.sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (isNaN(na) || isNaN(nb)) return a.localeCompare(b);
    return na - nb;
  });
}

export async function getFederations(): Promise<string[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("leaderboard_entries")
    .select("federation");

  if (!data) return [];
  return [...new Set(data.map((d) => d.federation))].sort();
}
```

#### `src/lib/queries/profile.ts`

```typescript
import { createServerClient } from "@/lib/supabase/server";
import type { UserProfile, UserResult, Post } from "@/lib/types";

export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getUserResults(
  profileId: string
): Promise<UserResult[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("user_results")
    .select("*")
    .eq("profile_id", profileId)
    .order("meet_date", { ascending: false });

  if (error) return [];
  return (data as UserResult[]) || [];
}

export async function getUserPosts(
  profileId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_url, display_name)")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}
```

#### `src/lib/queries/follow.ts`

```typescript
import { createServerClient } from "@/lib/supabase/server";

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  return !!data;
}

export async function getFollowers(
  profileId: string,
  limit = 50
): Promise<{ id: string; username: string; avatar_url: string | null; display_name: string | null }[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, display_name)")
    .eq("following_id", profileId)
    .limit(limit);

  if (!data) return [];
  return data.map((d: any) => d.profiles);
}

export async function getFollowing(
  profileId: string,
  limit = 50
): Promise<{ id: string; username: string; avatar_url: string | null; display_name: string | null }[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(id, username, avatar_url, display_name)")
    .eq("follower_id", profileId)
    .limit(limit);

  if (!data) return [];
  return data.map((d: any) => d.profiles);
}
```

#### `src/lib/queries/feed.ts` (rewritten)

```typescript
import { createServerClient } from "@/lib/supabase/server";
import type { Post, AggregatedContent, LeaderboardEntry } from "@/lib/types";

export async function getPosts(
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_url, display_name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}

export async function getFollowedPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createServerClient();

  // Get followed user IDs
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (!followData || followData.length === 0) return [];

  const followedIds = followData.map((f) => f.following_id);

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_url, display_name)")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}

export async function getAggregatedContent(
  limit = 10
): Promise<AggregatedContent[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("aggregated_content")
    .select("*, content_sources(creator_name)")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as AggregatedContent[]) || [];
}

export async function getRecentNotableResults(
  limit = 5
): Promise<LeaderboardEntry[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .order("meet_date", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as LeaderboardEntry[]) || [];
}
```

#### `src/lib/queries/search.ts` (rewritten)

```typescript
import { createServerClient } from "@/lib/supabase/server";

export async function searchProfiles(query: string, limit = 20) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, best_total, weight_class_kg, equipment")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit);

  if (error) return [];
  return data || [];
}
```

**Step:** Commit

```bash
git add src/lib/queries/ src/lib/types.ts
git rm src/lib/queries/lifter.ts src/lib/queries/meets.ts
git commit -m "refactor: rewrite query layer for new schema"
```

---

## Phase 4: Server Actions

### Task 5: Update server actions

**Files:**
- Modify: `src/app/actions.ts` (or wherever post/vote actions live)
- Create: `src/app/actions/follow.ts`

Check the existing actions file first — update any references to lifter_id/meet_id in post creation.

#### `src/app/actions/follow.ts`

```typescript
"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export async function followUser(followingId: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createServerClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error && !error.message.includes("duplicate"))
    throw new Error(error.message);
}

export async function unfollowUser(followingId: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) throw new Error(error.message);
}
```

**Step:** Commit

```bash
git add src/app/actions/
git commit -m "feat: add follow/unfollow server actions"
```

---

## Phase 5: Pages

### Task 6: Update leaderboard page

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

Update to query `leaderboard_entries` directly (no RPC). The component structure stays similar — filter bar + results table — but the data source is simpler.

Key changes:
- Import from new `@/lib/queries/leaderboard`
- Remove `lifter_slug` references (use `lifter_opl_name` as display key)
- Add `federation` and `meet_name`/`meet_date` to table columns
- Remove year range filter (entries are all-time bests, not time-filtered)

**Step:** Commit

```bash
git add src/app/leaderboard/
git commit -m "refactor: leaderboard page queries leaderboard_entries table"
```

### Task 7: Create user profile page

**Files:**
- Create: `src/app/u/[username]/page.tsx`
- Create: `src/components/profile/profile-hero.tsx`
- Create: `src/components/profile/stats-bar.tsx`
- Create: `src/components/profile/competition-history.tsx`
- Create: `src/components/profile/follow-button.tsx`

**`src/app/u/[username]/page.tsx`** — Server component that:
1. Fetches profile via `getProfileByUsername(username)`
2. Fetches user_results via `getUserResults(profile.id)`
3. Fetches user's posts via `getUserPosts(profile.id)`
4. Renders hero (avatar, name, bio, socials, follow button) + stats bar (best SBD, total, dots) + competition history table + posts tab

**`src/components/profile/stats-bar.tsx`** — Displays best_squat, best_bench, best_deadlift, best_total as large orange numbers with labels. Also weight_class and equipment chips.

**`src/components/profile/competition-history.tsx`** — Table of user_results: date, meet name, federation, weight class, SBD, total, dots, place.

**`src/components/profile/follow-button.tsx`** — Client component. Shows "Follow"/"Following" toggle. Calls follow/unfollow server actions.

**Step:** Commit

```bash
git add src/app/u/ src/components/profile/
git commit -m "feat: add user profile page with stats and comp history"
```

### Task 8: Update feed page

**Files:**
- Modify: `src/app/page.tsx`

Key changes:
- Remove "Upcoming Meets" sidebar (no meets table)
- Replace "Recent Meets" dispatches with "Recent Notable Results" from `getRecentNotableResults()`
- Remove meet-related imports
- Keep posts + aggregated content in center column
- Right sidebar becomes "Who to follow" suggestions or trending content

**Step:** Commit

```bash
git add src/app/page.tsx
git commit -m "refactor: feed page uses leaderboard dispatches, drops meet references"
```

### Task 9: Update search page

**Files:**
- Modify: `src/app/search/page.tsx`

Change from searching lifters + meets to searching user profiles.
- Import `searchProfiles` from new search queries
- Display results as profile cards (username, avatar, best total, weight class)
- Link results to `/u/[username]`

**Step:** Commit

```bash
git add src/app/search/
git commit -m "refactor: search page queries user profiles"
```

### Task 10: Remove old pages

**Files:**
- Delete: `src/app/lifter/[slug]/page.tsx` (and the directory)
- Delete: `src/app/meets/page.tsx` (and the directory)
- Delete: `src/app/meet/[slug]/page.tsx` (and the directory)

**Step:** Commit

```bash
git rm -r src/app/lifter/ src/app/meets/ src/app/meet/
git commit -m "refactor: remove lifter and meet pages"
```

### Task 11: Update navigation

**Files:**
- Modify: `src/components/nav/top-nav.tsx` — Update links: remove Meets, add Profile link (if logged in)
- Modify: `src/components/nav/mobile-nav.tsx` — Update tabs: Feed / Leaderboard / Search / Profile
- Modify: `src/components/nav/search-bar.tsx` — Update to search profiles instead of lifters

**Step:** Commit

```bash
git add src/components/nav/
git commit -m "refactor: update navigation for new routes"
```

---

## Phase 6: Auth & Profile Claiming

### Task 12: Extend signup/profile flow

**Files:**
- Modify: `src/app/signup/page.tsx` — Add optional "OPL Name" field to signup form
- Modify: `src/lib/auth.ts` — Update `getUser()` to return extended profile fields

The OPL claiming flow for MVP:
1. User enters their OPL name in profile settings (or during signup)
2. The name is stored in `profiles.opl_name`
3. During the next weekly sync, the script matches their OPL name against the CSV and populates `user_results`
4. Instant import is a v2 enhancement

**Step:** Commit

```bash
git add src/app/signup/ src/lib/auth.ts
git commit -m "feat: add OPL name claim to signup flow"
```

---

## Phase 7: Sync Pipeline

### Task 13: Update GitHub Actions

**Files:**
- Modify: `.github/workflows/opl-sync.yml` — Use `seed:leaderboard` instead of `seed:opl`. Add step to sync user_results for claimed profiles.

```yaml
name: Weekly OPL Sync

on:
  schedule:
    - cron: '0 4 * * 0'  # Sunday 4 AM UTC
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Download OPL data
        run: |
          curl -L -o /tmp/opl.zip "https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip"
          unzip /tmp/opl.zip -d /tmp/opl-data
          OPL_FILE=$(find /tmp/opl-data -name "*.csv" | head -1)
          echo "OPL_CSV_PATH=$OPL_FILE" >> $GITHUB_ENV

      - name: Seed leaderboard
        run: npm run seed:leaderboard
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPL_CSV_PATH: ${{ env.OPL_CSV_PATH }}
```

**Step:** Commit

```bash
git add .github/workflows/opl-sync.yml
git commit -m "refactor: update OPL sync to seed leaderboard only"
```

---

## Phase 8: Cleanup & Verify

### Task 14: Remove old seed scripts and migrations artifacts

**Files:**
- Delete: `scripts/seed-opl.ts` (replaced by seed-leaderboard.ts)
- Clean up any leftover references to lifters/meets/results in the codebase

**Step:** Run a full grep to find any remaining references

```bash
grep -r "lifter_id\|meet_id\|getMeets\|getLifter\|searchLifters\|searchMeets" src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining references found.

**Step:** Commit

```bash
git rm scripts/seed-opl.ts
git add -A
git commit -m "chore: remove old seed scripts and stale references"
```

### Task 15: Build verification

```bash
npm run build
```

Expected: Build succeeds with no errors.

Fix any TypeScript errors or missing imports. Common issues:
- Components referencing deleted types (CompetitionResult, MeetSummary, LifterProfile)
- Import paths for deleted query files
- Page components referencing lifter_id/meet_id

**Step:** Commit fixes if any

```bash
git add -A
git commit -m "fix: resolve build errors from schema migration"
```

### Task 16: Verify Supabase data

```bash
# Check leaderboard_entries count
source .env.local && curl -s \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/leaderboard_entries?select=id" \
  -D - -o /dev/null 2>/dev/null | grep content-range

# Check old tables are gone
source .env.local && curl -s \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lifters?select=id&limit=1"
# Expected: 404 or relation does not exist error

# Test leaderboard query
source .env.local && curl -s \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/leaderboard_entries?sex=eq.M&equipment=eq.Raw&order=total.desc&limit=5" | python3 -m json.tool
```

### Task 17: Manual smoke test

Run `npm run dev` and verify:
1. `/` — Feed loads (posts + content, no errors)
2. `/leaderboard` — Shows rankings, filters work
3. `/search` — Searches user profiles
4. `/signup` — Signup flow works, OPL name field present
5. `/u/[username]` — Profile page loads (create a test account first)
6. Old routes (`/lifter/*`, `/meets`, `/meet/*`) return 404

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | Task 1 | Database migration (create new tables, drop old) |
| 2 | Task 2 | Seed script for leaderboard_entries |
| 3 | Tasks 3-4 | Types and query layer rewrite |
| 4 | Task 5 | Follow server actions |
| 5 | Tasks 6-11 | Page updates (leaderboard, profile, feed, search, nav) |
| 6 | Task 12 | Auth + OPL claiming |
| 7 | Task 13 | GitHub Actions update |
| 8 | Tasks 14-17 | Cleanup, build, verify |

**Estimated rows in DB after migration:** ~25K (down from ~1M+)
**Estimated DB size:** ~10 MB (down from 500 MB+)
