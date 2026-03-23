# The Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a powerlifting editorial hub with rankings, athlete profiles, meet results, content aggregation, and community features — powered by OpenPowerlifting data.

**Architecture:** Next.js 15 App Router with React Server Components for pages, Supabase for Postgres + Auth, Tailwind CSS for styling. Data pipeline runs as standalone scripts via GitHub Actions (OPL sync weekly, content aggregation daily). Deployed to Vercel.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase (Postgres + Auth + RLS), Tailwind CSS v4, Recharts (charts), Vercel (hosting)

**Design Reference:** See `stitch_the_platform_editorial_powerlifting_hub_prd/` for visual prototypes. See `docs/plans/2026-03-22-the-platform-design.md` for full design spec.

---

## Phase 1: Project Scaffolding & Database

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.env.local.example`

**Step 1: Scaffold Next.js with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full project scaffold.

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts
npm install -D supabase
```

**Step 3: Create `.env.local.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 4: Set up Tailwind theme with design tokens**

In `tailwind.config.ts`, extend the theme:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0D0D0D",
          surface: "#1A1A1A",
          "surface-alt": "#151515",
        },
        border: "#2A2A2A",
        accent: {
          primary: "#E8491A",
          secondary: "#FFB800",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          muted: "#666666",
        },
        semantic: {
          success: "#4CAF50",
          error: "#F44336",
          record: "#FFB800",
        },
      },
      fontFamily: {
        heading: ["Barlow Condensed", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 5: Set up root layout with fonts and dark background**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Platform — Powerlifting Hub",
  description: "Rankings, athlete profiles, meet results, and community for powerlifting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} ${jetbrains.variable}`}>
      <body className="bg-bg-primary text-text-secondary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 6: Update `globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 7: Create placeholder home page**

Update `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="font-heading text-5xl font-bold text-text-primary">
        THE PLATFORM
      </h1>
    </main>
  );
}
```

**Step 8: Verify it runs**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see "THE PLATFORM" in white on near-black background.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind design tokens"
```

---

### Task 2: Set up Supabase and database schema

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `supabase/migrations/00001_core_schema.sql`

**Step 1: Initialize Supabase locally**

```bash
npx supabase init
```

**Step 2: Create the core schema migration**

Create `supabase/migrations/00001_core_schema.sql`:

```sql
-- Enums
CREATE TYPE sex_enum AS ENUM ('M', 'F', 'Mx');
CREATE TYPE equipment_enum AS ENUM ('Raw', 'Wraps', 'Single-ply', 'Multi-ply');
CREATE TYPE report_reason_enum AS ENUM ('spam', 'harassment', 'misinformation', 'other');
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE platform_enum AS ENUM ('youtube', 'instagram', 'podcast');

-- Core lifting data
CREATE TABLE lifters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opl_name TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex sex_enum NOT NULL,
  country TEXT,
  birth_year INT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opl_meet_path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  federation TEXT NOT NULL,
  date DATE NOT NULL,
  country TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifter_id UUID NOT NULL REFERENCES lifters(id),
  meet_id UUID NOT NULL REFERENCES meets(id),
  weight_class_kg TEXT,
  bodyweight_kg NUMERIC,
  equipment equipment_enum,
  age NUMERIC,
  age_class TEXT,
  squat_1 NUMERIC, squat_2 NUMERIC, squat_3 NUMERIC,
  bench_1 NUMERIC, bench_2 NUMERIC, bench_3 NUMERIC,
  deadlift_1 NUMERIC, deadlift_2 NUMERIC, deadlift_3 NUMERIC,
  best_squat NUMERIC,
  best_bench NUMERIC,
  best_deadlift NUMERIC,
  total NUMERIC,
  dots NUMERIC,
  wilks NUMERIC,
  glossbrenner NUMERIC,
  place TEXT,
  UNIQUE(lifter_id, meet_id)
);

-- Indexes for leaderboard queries
CREATE INDEX idx_results_leaderboard
  ON results (equipment, weight_class_kg, total DESC NULLS LAST);
CREATE INDEX idx_results_lifter
  ON results (lifter_id);
CREATE INDEX idx_results_meet
  ON results (meet_id);

-- Full-text search on lifter names
ALTER TABLE lifters ADD COLUMN name_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
CREATE INDEX idx_lifters_search ON lifters USING GIN(name_search);

-- Full-text search on meet names
ALTER TABLE meets ADD COLUMN name_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
CREATE INDEX idx_meets_search ON meets USING GIN(name_search);

-- Community layer
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body_text TEXT NOT NULL CHECK (char_length(body_text) <= 2000),
  link_url TEXT,
  link_preview JSONB,
  lifter_id UUID REFERENCES lifters(id),
  meet_id UUID REFERENCES meets(id),
  vote_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_created ON posts (created_at DESC);
CREATE INDEX idx_posts_lifter ON posts (lifter_id) WHERE lifter_id IS NOT NULL;
CREATE INDEX idx_posts_meet ON posts (meet_id) WHERE meet_id IS NOT NULL;

CREATE TABLE post_votes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  lifter_id UUID REFERENCES lifters(id),
  meet_id UUID REFERENCES meets(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body_text TEXT NOT NULL CHECK (char_length(body_text) <= 1000),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT exactly_one_parent CHECK (
    (post_id IS NOT NULL)::int +
    (lifter_id IS NOT NULL)::int +
    (meet_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_comments_post ON comments (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_comments_lifter ON comments (lifter_id) WHERE lifter_id IS NOT NULL;
CREATE INDEX idx_comments_meet ON comments (meet_id) WHERE meet_id IS NOT NULL;

CREATE TABLE comment_votes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason report_reason_enum NOT NULL,
  details TEXT,
  status report_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content aggregation
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_enum NOT NULL,
  platform_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aggregated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES content_sources(id),
  platform platform_enum NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  embed_url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_lifter_tags (
  content_id UUID NOT NULL REFERENCES aggregated_content(id) ON DELETE CASCADE,
  lifter_id UUID NOT NULL REFERENCES lifters(id) ON DELETE CASCADE,
  auto_tagged BOOLEAN DEFAULT true,
  PRIMARY KEY (content_id, lifter_id)
);

CREATE TABLE content_meet_tags (
  content_id UUID NOT NULL REFERENCES aggregated_content(id) ON DELETE CASCADE,
  meet_id UUID NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
  auto_tagged BOOLEAN DEFAULT true,
  PRIMARY KEY (content_id, meet_id)
);

-- Sync metadata
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (read-only public access for lifting data, authenticated for community)
ALTER TABLE lifters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meets ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_lifter_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_meet_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for lifting data and content
CREATE POLICY "Public read lifters" ON lifters FOR SELECT USING (true);
CREATE POLICY "Public read meets" ON meets FOR SELECT USING (true);
CREATE POLICY "Public read results" ON results FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read aggregated_content" ON aggregated_content FOR SELECT USING (true);
CREATE POLICY "Public read content_sources" ON content_sources FOR SELECT USING (true);
CREATE POLICY "Public read content_lifter_tags" ON content_lifter_tags FOR SELECT USING (true);
CREATE POLICY "Public read content_meet_tags" ON content_meet_tags FOR SELECT USING (true);

-- Authenticated write access for community features
CREATE POLICY "Auth insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert post_votes" ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete own post_votes" ON post_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert comment_votes" ON comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete own comment_votes" ON comment_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Auth insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Auth update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

**Step 3: Create Supabase client utilities**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

**Step 4: Connect to Supabase project**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Step 5: Run the migration**

```bash
npx supabase db push
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema with lifting data, community, and content tables"
```

---

### Task 3: Build the OPL data seed script

**Files:**
- Create: `scripts/seed-opl.ts`
- Create: `scripts/tsconfig.json`

**Step 1: Create script tsconfig**

Create `scripts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*.ts"]
}
```

**Step 2: Install script dependencies**

```bash
npm install -D tsx csv-parse dotenv
```

**Step 3: Create the seed script**

Create `scripts/seed-opl.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPL_CSV_PATH = process.env.OPL_CSV_PATH || "./opl-data/openpowerlifting.csv";
const BATCH_SIZE = 1000;

interface OplRow {
  Name: string;
  Sex: string;
  Equipment: string;
  Age: string;
  AgeClass: string;
  BirthYearClass: string;
  Division: string;
  BodyweightKg: string;
  WeightClassKg: string;
  Squat1Kg: string;
  Squat2Kg: string;
  Squat3Kg: string;
  Best3SquatKg: string;
  Bench1Kg: string;
  Bench2Kg: string;
  Bench3Kg: string;
  Best3BenchKg: string;
  Deadlift1Kg: string;
  Deadlift2Kg: string;
  Deadlift3Kg: string;
  Best3DeadliftKg: string;
  TotalKg: string;
  Place: string;
  Dots: string;
  Wilks: string;
  Glossbrenner: string;
  Federation: string;
  Date: string;
  MeetCountry: string;
  MeetState: string;
  MeetTown: string;
  MeetName: string;
  MeetPath: string;
  Country: string;
  Instagram: string;
  BirthYear: string;
}

function parseNumeric(val: string): number | null {
  if (!val || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseEquipment(val: string): string | null {
  const map: Record<string, string> = {
    Raw: "Raw",
    Wraps: "Wraps",
    "Single-ply": "Single-ply",
    "Multi-ply": "Multi-ply",
  };
  return map[val] || null;
}

function parseSex(val: string): string | null {
  if (val === "M" || val === "F" || val === "Mx") return val;
  return null;
}

async function seed() {
  console.log("Starting OPL seed...");
  console.log(`Reading from: ${OPL_CSV_PATH}`);

  // Track unique lifters and meets by their OPL identifiers
  const lifterMap = new Map<string, string>(); // opl_name -> uuid
  const meetMap = new Map<string, string>(); // meet_path -> uuid

  let lifterBatch: Array<{ opl_name: string; name: string; sex: string; country: string | null; birth_year: number | null; instagram: string | null }> = [];
  let meetBatch: Array<{ opl_meet_path: string; name: string; federation: string; date: string; country: string | null; city: string | null; state: string | null }> = [];
  let resultBatch: Array<Record<string, unknown>> = [];
  let rowCount = 0;
  let insertedResults = 0;

  const parser = createReadStream(OPL_CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );

  for await (const row of parser as AsyncIterable<OplRow>) {
    rowCount++;

    const sex = parseSex(row.Sex);
    const equipment = parseEquipment(row.Equipment);
    if (!sex || !equipment) continue; // skip rows we can't categorize

    // Collect unique lifter
    if (!lifterMap.has(row.Name)) {
      const id = crypto.randomUUID();
      lifterMap.set(row.Name, id);
      lifterBatch.push({
        opl_name: row.Name,
        name: row.Name.replace(/ #\d+$/, ""), // Strip OPL disambiguation suffix
        sex,
        country: row.Country || null,
        birth_year: row.BirthYear ? parseInt(row.BirthYear) : null,
        instagram: row.Instagram || null,
      });
    }

    // Collect unique meet
    if (!meetMap.has(row.MeetPath)) {
      const id = crypto.randomUUID();
      meetMap.set(row.MeetPath, id);
      meetBatch.push({
        opl_meet_path: row.MeetPath,
        name: row.MeetName,
        federation: row.Federation,
        date: row.Date,
        country: row.MeetCountry || null,
        city: row.MeetTown || null,
        state: row.MeetState || null,
      });
    }

    // Collect result
    resultBatch.push({
      lifter_id: lifterMap.get(row.Name),
      meet_id: meetMap.get(row.MeetPath),
      weight_class_kg: row.WeightClassKg || null,
      bodyweight_kg: parseNumeric(row.BodyweightKg),
      equipment,
      age: parseNumeric(row.Age),
      age_class: row.AgeClass || null,
      squat_1: parseNumeric(row.Squat1Kg),
      squat_2: parseNumeric(row.Squat2Kg),
      squat_3: parseNumeric(row.Squat3Kg),
      bench_1: parseNumeric(row.Bench1Kg),
      bench_2: parseNumeric(row.Bench2Kg),
      bench_3: parseNumeric(row.Bench3Kg),
      deadlift_1: parseNumeric(row.Deadlift1Kg),
      deadlift_2: parseNumeric(row.Deadlift2Kg),
      deadlift_3: parseNumeric(row.Deadlift3Kg),
      best_squat: parseNumeric(row.Best3SquatKg),
      best_bench: parseNumeric(row.Best3BenchKg),
      best_deadlift: parseNumeric(row.Best3DeadliftKg),
      total: parseNumeric(row.TotalKg),
      dots: parseNumeric(row.Dots),
      wilks: parseNumeric(row.Wilks),
      glossbrenner: parseNumeric(row.Glossbrenner),
      place: row.Place || null,
    });

    // Flush batches periodically
    if (lifterBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("lifters").upsert(lifterBatch, { onConflict: "opl_name" });
      if (error) console.error("Lifter insert error:", error.message);
      lifterBatch = [];
    }

    if (meetBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("meets").upsert(meetBatch, { onConflict: "opl_meet_path" });
      if (error) console.error("Meet insert error:", error.message);
      meetBatch = [];
    }

    if (resultBatch.length >= BATCH_SIZE) {
      const { error } = await supabase.from("results").upsert(resultBatch, { onConflict: "lifter_id,meet_id" });
      if (error) console.error("Result insert error:", error.message);
      insertedResults += resultBatch.length;
      resultBatch = [];
    }

    if (rowCount % 100000 === 0) {
      console.log(`Processed ${rowCount} rows, ${lifterMap.size} lifters, ${meetMap.size} meets`);
    }
  }

  // Flush remaining
  if (lifterBatch.length > 0) {
    await supabase.from("lifters").upsert(lifterBatch, { onConflict: "opl_name" });
  }
  if (meetBatch.length > 0) {
    await supabase.from("meets").upsert(meetBatch, { onConflict: "opl_meet_path" });
  }
  if (resultBatch.length > 0) {
    await supabase.from("results").upsert(resultBatch, { onConflict: "lifter_id,meet_id" });
    insertedResults += resultBatch.length;
  }

  // Store sync metadata
  await supabase.from("sync_metadata").upsert({
    key: "opl_last_seed",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  console.log(`\nDone! ${rowCount} rows, ${lifterMap.size} lifters, ${meetMap.size} meets, ${insertedResults} results inserted.`);
}

seed().catch(console.error);
```

**Step 4: Add seed script to package.json**

Add to `scripts` in `package.json`:

```json
"seed:opl": "tsx scripts/seed-opl.ts"
```

**Step 5: Test with a small CSV subset (optional)**

Before running against the full dataset, test with the first 1000 lines:

```bash
head -1001 ./opl-data/openpowerlifting.csv > ./opl-data/test-sample.csv
OPL_CSV_PATH=./opl-data/test-sample.csv npm run seed:opl
```

**Step 6: Run full seed**

```bash
npm run seed:opl
```

This will take several minutes for the full ~3M row dataset.

**Step 7: Commit**

```bash
git add scripts/ package.json package-lock.json
git commit -m "feat: add OpenPowerlifting CSV seed script"
```

---

## Phase 2: Shared UI Components & Layout

### Task 4: Build the shell layout (nav + mobile bottom bar)

**Files:**
- Create: `src/components/nav/top-nav.tsx`
- Create: `src/components/nav/mobile-nav.tsx`
- Create: `src/components/nav/search-bar.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Build TopNav component**

Create `src/components/nav/top-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";

const navItems = [
  { label: "The Feed", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Meet Hub", href: "/meets" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-accent-primary text-lg">⏣</span>
            <span className="font-heading text-lg font-bold uppercase text-text-primary">
              The Platform
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-heading text-sm uppercase tracking-wider transition-colors ${
                  pathname === item.href
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Build SearchBar component**

Create `src/components/nav/search-bar.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        placeholder="Find lifter..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 w-48 rounded-md border border-border bg-bg-surface px-3 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary lg:w-64"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">
        ⌕
      </span>
    </form>
  );
}
```

**Step 3: Build MobileNav component**

Create `src/components/nav/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Feed", href: "/", icon: "◉" },
  { label: "Rankings", href: "/leaderboard", icon: "◈" },
  { label: "Meets", href: "/meets", icon: "◎" },
  { label: "Search", href: "/search", icon: "⌕" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-primary/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-xs ${
              pathname === item.href
                ? "text-accent-primary"
                : "text-text-muted"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-heading uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**Step 4: Wire layout**

Update `src/app/layout.tsx` body:

```tsx
import { TopNav } from "@/components/nav/top-nav";
import { MobileNav } from "@/components/nav/mobile-nav";

// ... (keep existing metadata and fonts)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} ${jetbrains.variable}`}>
      <body className="bg-bg-primary text-text-secondary font-body antialiased">
        <TopNav />
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
```

**Step 5: Verify nav renders**

```bash
npm run dev
```

Check desktop nav shows links + search. Resize to mobile to see bottom nav.

**Step 6: Commit**

```bash
git add src/components/nav/ src/app/layout.tsx
git commit -m "feat: add top nav, mobile bottom nav, and search bar"
```

---

### Task 5: Build shared UI primitives

**Files:**
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/chip.tsx`
- Create: `src/components/ui/stat-block.tsx`
- Create: `src/components/ui/data-table.tsx`
- Create: `src/components/ui/filter-bar.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/loading.tsx`

These are the reusable primitives that every page will use. Build them minimal — only what the design spec requires.

**Step 1: Create Button**

Create `src/components/ui/button.tsx`:

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-heading uppercase tracking-wider transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50";
    const variants = {
      primary: "bg-accent-primary text-white hover:bg-accent-primary/90",
      secondary: "border border-border text-text-primary hover:border-text-muted",
      ghost: "text-text-muted hover:text-text-primary",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

**Step 2: Create Card**

Create `src/components/ui/card.tsx`:

```tsx
import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-bg-surface p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

**Step 3: Create Chip**

Create `src/components/ui/chip.tsx`:

```tsx
interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ children, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-heading uppercase tracking-wider transition-colors ${
        active
          ? "border-accent-primary text-accent-primary"
          : "border-border text-text-muted hover:border-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
```

**Step 4: Create StatBlock**

Create `src/components/ui/stat-block.tsx`:

```tsx
interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export function StatBlock({ label, value, unit = "kg", highlight }: StatBlockProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-heading uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={`font-mono text-3xl font-bold ${
          highlight ? "text-accent-secondary" : "text-text-primary"
        }`}
      >
        {value}
        <span className="text-base text-text-muted">{unit}</span>
      </span>
    </div>
  );
}
```

**Step 5: Create Loading skeleton**

Create `src/components/ui/loading.tsx`:

```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-bg-surface ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI primitives (button, card, chip, stat block, loading)"
```

---

## Phase 3: Leaderboard (MVP screen #1)

### Task 6: Build leaderboard data layer

**Files:**
- Create: `src/lib/queries/leaderboard.ts`
- Create: `src/lib/types.ts`

**Step 1: Define shared types**

Create `src/lib/types.ts`:

```ts
export interface LeaderboardEntry {
  rank: number;
  lifter_id: string;
  lifter_name: string;
  lifter_slug: string;
  bodyweight_kg: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  equipment: string;
  meet_date: string;
  meet_name: string;
}

export interface LeaderboardFilters {
  federation?: string;
  sex: string;
  weightClass?: string;
  equipment?: string;
  yearFrom?: number;
  yearTo?: number;
  sortBy: "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift";
  limit: number;
  offset: number;
}

export interface LifterProfile {
  id: string;
  name: string;
  slug: string;
  sex: string;
  country: string | null;
  birth_year: number | null;
  instagram: string | null;
}

export interface MeetSummary {
  id: string;
  name: string;
  slug: string;
  federation: string;
  date: string;
  country: string | null;
  city: string | null;
  state: string | null;
}

export interface CompetitionResult {
  id: string;
  lifter_id: string;
  lifter_name: string;
  lifter_slug: string;
  meet_id: string;
  meet_name: string;
  meet_slug: string;
  meet_date: string;
  weight_class_kg: string;
  bodyweight_kg: number | null;
  equipment: string;
  squat_1: number | null;
  squat_2: number | null;
  squat_3: number | null;
  bench_1: number | null;
  bench_2: number | null;
  bench_3: number | null;
  deadlift_1: number | null;
  deadlift_2: number | null;
  deadlift_3: number | null;
  best_squat: number | null;
  best_bench: number | null;
  best_deadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
  place: string;
}
```

**Step 2: Build leaderboard query**

Create `src/lib/queries/leaderboard.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { LeaderboardFilters, LeaderboardEntry } from "@/lib/types";

export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Use a database function for complex ranking query
  // For now, use a raw RPC call that we'll create as a Supabase function
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_sex: filters.sex,
    p_equipment: filters.equipment || null,
    p_federation: filters.federation || null,
    p_weight_class: filters.weightClass || null,
    p_year_from: filters.yearFrom || null,
    p_year_to: filters.yearTo || null,
    p_sort_by: filters.sortBy,
    p_limit: filters.limit,
    p_offset: filters.offset,
  });

  if (error) throw new Error(`Leaderboard query failed: ${error.message}`);

  return (data || []).map((row: Record<string, unknown>, i: number) => ({
    rank: filters.offset + i + 1,
    lifter_id: row.lifter_id as string,
    lifter_name: row.lifter_name as string,
    lifter_slug: encodeURIComponent((row.lifter_opl_name as string).toLowerCase().replace(/ /g, "-")),
    bodyweight_kg: row.bodyweight_kg as number | null,
    best_squat: row.best_squat as number | null,
    best_bench: row.best_bench as number | null,
    best_deadlift: row.best_deadlift as number | null,
    total: row.total as number | null,
    dots: row.dots as number | null,
    equipment: row.equipment as string,
    meet_date: row.meet_date as string,
    meet_name: row.meet_name as string,
  }));
}
```

**Step 3: Create the database function**

Create `supabase/migrations/00002_leaderboard_function.sql`:

```sql
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_sex sex_enum,
  p_equipment equipment_enum DEFAULT NULL,
  p_federation TEXT DEFAULT NULL,
  p_weight_class TEXT DEFAULT NULL,
  p_year_from INT DEFAULT NULL,
  p_year_to INT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'total',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  lifter_id UUID,
  lifter_name TEXT,
  lifter_opl_name TEXT,
  bodyweight_kg NUMERIC,
  best_squat NUMERIC,
  best_bench NUMERIC,
  best_deadlift NUMERIC,
  total NUMERIC,
  dots NUMERIC,
  equipment equipment_enum,
  meet_date DATE,
  meet_name TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT DISTINCT ON (r.lifter_id)
    r.lifter_id,
    l.name AS lifter_name,
    l.opl_name AS lifter_opl_name,
    r.bodyweight_kg,
    r.best_squat,
    r.best_bench,
    r.best_deadlift,
    r.total,
    r.dots,
    r.equipment,
    m.date AS meet_date,
    m.name AS meet_name
  FROM results r
  JOIN lifters l ON l.id = r.lifter_id
  JOIN meets m ON m.id = r.meet_id
  WHERE l.sex = p_sex
    AND r.total IS NOT NULL
    AND r.total > 0
    AND (p_equipment IS NULL OR r.equipment = p_equipment)
    AND (p_federation IS NULL OR m.federation = p_federation)
    AND (p_weight_class IS NULL OR r.weight_class_kg = p_weight_class)
    AND (p_year_from IS NULL OR EXTRACT(YEAR FROM m.date) >= p_year_from)
    AND (p_year_to IS NULL OR EXTRACT(YEAR FROM m.date) <= p_year_to)
  ORDER BY r.lifter_id,
    CASE p_sort_by
      WHEN 'total' THEN r.total
      WHEN 'dots' THEN r.dots
      WHEN 'wilks' THEN r.wilks
      WHEN 'best_squat' THEN r.best_squat
      WHEN 'best_bench' THEN r.best_bench
      WHEN 'best_deadlift' THEN r.best_deadlift
      ELSE r.total
    END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;
```

Note: The `DISTINCT ON` picks each lifter's best result. The outer sort is handled by the `ORDER BY` in the function. When consumed, results should be re-sorted by the sort column since `DISTINCT ON` requires its own ordering.

**Step 4: Push the migration**

```bash
npx supabase db push
```

**Step 5: Commit**

```bash
git add src/lib/ supabase/migrations/00002_leaderboard_function.sql
git commit -m "feat: add leaderboard data layer with types and Supabase RPC"
```

---

### Task 7: Build leaderboard page UI

**Files:**
- Create: `src/app/leaderboard/page.tsx`
- Create: `src/app/leaderboard/leaderboard-filters.tsx`
- Create: `src/app/leaderboard/leaderboard-table.tsx`

**Step 1: Build the filter bar component**

Create `src/app/leaderboard/leaderboard-filters.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

const FEDERATIONS = ["All", "IPF", "USAPL", "USPA", "SPF", "WRPF", "RPS", "APF", "WPC"];
const EQUIPMENT = ["All", "Raw", "Wraps", "Single-ply", "Multi-ply"];
const YEAR_RANGES = [
  { label: "All Time", from: null, to: null },
  { label: "Last 2 Years", from: new Date().getFullYear() - 2, to: null },
  { label: "Last 5 Years", from: new Date().getFullYear() - 5, to: null },
];
const SORT_OPTIONS = [
  { label: "Total", value: "total" },
  { label: "DOTS", value: "dots" },
  { label: "Wilks", value: "wilks" },
  { label: "Squat", value: "best_squat" },
  { label: "Bench", value: "best_bench" },
  { label: "Deadlift", value: "best_deadlift" },
];

export function LeaderboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFed = searchParams.get("fed") || "All";
  const currentSex = searchParams.get("sex") || "M";
  const currentEquip = searchParams.get("equip") || "All";
  const currentSort = searchParams.get("sort") || "total";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("offset"); // reset pagination on filter change
      router.push(`/leaderboard?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-surface p-4">
      <FilterSelect label="Federation" value={currentFed} options={FEDERATIONS} onChange={(v) => updateFilter("fed", v)} />
      <FilterSelect label="Sex" value={currentSex} options={["M", "F"]} onChange={(v) => updateFilter("sex", v)} />
      <FilterSelect label="Equipment" value={currentEquip} options={EQUIPMENT} onChange={(v) => updateFilter("equip", v)} />
      <FilterSelect label="Sort By" value={currentSort} options={SORT_OPTIONS.map((s) => s.value)} labels={SORT_OPTIONS.map((s) => s.label)} onChange={(v) => updateFilter("sort", v)} />
      <Button variant="primary" size="sm" onClick={() => router.push("/leaderboard")}>
        Reset
      </Button>
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
        className="h-9 rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
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

**Step 2: Build the results table component**

Create `src/app/leaderboard/leaderboard-table.tsx`:

```tsx
import Link from "next/link";
import { LeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
}

export function LeaderboardTable({ entries, sortBy }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Rank</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "total" ? "text-accent-secondary" : "text-text-muted"}`}>Total</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "dots" ? "text-accent-secondary" : "text-text-muted"}`}>DOTS</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.lifter_id}-${entry.rank}`}
              className={`border-b border-border/50 transition-colors hover:bg-bg-surface ${
                entry.rank <= 3 ? "bg-bg-surface" : ""
              }`}
            >
              <td className={`px-3 py-3 font-mono font-bold ${
                entry.rank === 1 ? "text-accent-secondary" :
                entry.rank === 2 ? "text-text-secondary" :
                entry.rank === 3 ? "text-accent-primary" :
                "text-text-muted"
              }`}>
                {entry.rank}
              </td>
              <td className="px-3 py-3">
                <Link
                  href={`/lifter/${entry.lifter_slug}`}
                  className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                >
                  {entry.lifter_name}
                </Link>
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">
                {entry.bodyweight_kg?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {entry.best_squat?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {entry.best_bench?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {entry.best_deadlift?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-accent-secondary">
                {entry.total?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-secondary">
                {entry.dots?.toFixed(2) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Build the leaderboard page (Server Component)**

Create `src/app/leaderboard/page.tsx`:

```tsx
import { Suspense } from "react";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { LeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardTable } from "./leaderboard-table";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const sex = (params.sex as "M" | "F") || "M";
  const sortBy = params.sort || "total";
  const offset = parseInt(params.offset || "0", 10);

  const entries = await getLeaderboard({
    sex,
    federation: params.fed !== "All" ? params.fed : undefined,
    equipment: params.equip !== "All" ? params.equip : undefined,
    weightClass: params.class,
    sortBy: sortBy as "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift",
    limit: 50,
    offset,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
          Global Rankings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Top totals & DOTS scores
        </p>
      </div>

      <Suspense fallback={null}>
        <LeaderboardFilters />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={20} />}>
        <LeaderboardTable entries={entries} sortBy={sortBy} />
      </Suspense>

      {entries.length === 50 && (
        <div className="flex justify-center">
          <a
            href={`/leaderboard?${new URLSearchParams({ ...params, offset: String(offset + 50) }).toString()}`}
            className="rounded-md border border-border px-6 py-2 font-heading text-sm uppercase tracking-wider text-text-muted hover:border-text-muted hover:text-text-primary transition-colors"
          >
            Load More →
          </a>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Verify page renders with data**

```bash
npm run dev
```

Visit `http://localhost:3000/leaderboard` — should display the filter bar and results table with data from the seeded database.

**Step 5: Commit**

```bash
git add src/app/leaderboard/ src/lib/queries/leaderboard.ts src/lib/types.ts
git commit -m "feat: add leaderboard page with filters and ranked results table"
```

---

## Phase 4: Lifter Dossier (MVP screen #2)

### Task 8: Build lifter data layer

**Files:**
- Create: `src/lib/queries/lifter.ts`

**Step 1: Create lifter queries**

Create `src/lib/queries/lifter.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { LifterProfile, CompetitionResult } from "@/lib/types";

export async function getLifterBySlug(slug: string): Promise<LifterProfile | null> {
  const supabase = await createClient();
  const oplName = decodeURIComponent(slug).replace(/-/g, " ");

  const { data } = await supabase
    .from("lifters")
    .select("id, opl_name, name, sex, country, birth_year, instagram")
    .ilike("opl_name", oplName)
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: encodeURIComponent(data.opl_name.toLowerCase().replace(/ /g, "-")),
    sex: data.sex,
    country: data.country,
    birth_year: data.birth_year,
    instagram: data.instagram,
  };
}

export async function getLifterResults(lifterId: string): Promise<CompetitionResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("results")
    .select(`
      id, lifter_id, meet_id, weight_class_kg, bodyweight_kg, equipment,
      squat_1, squat_2, squat_3, bench_1, bench_2, bench_3,
      deadlift_1, deadlift_2, deadlift_3,
      best_squat, best_bench, best_deadlift, total, dots, wilks, place,
      lifters!inner(name, opl_name),
      meets!inner(name, opl_meet_path, date)
    `)
    .eq("lifter_id", lifterId)
    .order("meets(date)", { ascending: false });

  if (error) throw new Error(`Lifter results query failed: ${error.message}`);

  return (data || []).map((row: Record<string, unknown>) => {
    const lifter = row.lifters as Record<string, string>;
    const meet = row.meets as Record<string, string>;
    return {
      id: row.id as string,
      lifter_id: row.lifter_id as string,
      lifter_name: lifter.name,
      lifter_slug: encodeURIComponent(lifter.opl_name.toLowerCase().replace(/ /g, "-")),
      meet_id: row.meet_id as string,
      meet_name: meet.name,
      meet_slug: encodeURIComponent(meet.opl_meet_path.toLowerCase().replace(/\//g, "-")),
      meet_date: meet.date,
      weight_class_kg: row.weight_class_kg as string,
      bodyweight_kg: row.bodyweight_kg as number | null,
      equipment: row.equipment as string,
      squat_1: row.squat_1 as number | null,
      squat_2: row.squat_2 as number | null,
      squat_3: row.squat_3 as number | null,
      bench_1: row.bench_1 as number | null,
      bench_2: row.bench_2 as number | null,
      bench_3: row.bench_3 as number | null,
      deadlift_1: row.deadlift_1 as number | null,
      deadlift_2: row.deadlift_2 as number | null,
      deadlift_3: row.deadlift_3 as number | null,
      best_squat: row.best_squat as number | null,
      best_bench: row.best_bench as number | null,
      best_deadlift: row.best_deadlift as number | null,
      total: row.total as number | null,
      dots: row.dots as number | null,
      wilks: row.wilks as number | null,
      place: row.place as string,
    };
  });
}

export async function getLifterBests(lifterId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("results")
    .select("best_squat, best_bench, best_deadlift, total, equipment, weight_class_kg")
    .eq("lifter_id", lifterId)
    .not("total", "is", null)
    .order("total", { ascending: false })
    .limit(1)
    .single();

  return data;
}
```

**Step 2: Commit**

```bash
git add src/lib/queries/lifter.ts
git commit -m "feat: add lifter data queries (profile, results, bests)"
```

---

### Task 9: Build lifter dossier page UI

**Files:**
- Create: `src/app/lifter/[slug]/page.tsx`
- Create: `src/app/lifter/[slug]/progression-chart.tsx`
- Create: `src/app/lifter/[slug]/competition-history.tsx`

**Step 1: Build the progression chart (client component)**

Create `src/app/lifter/[slug]/progression-chart.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

export function ProgressionChart({ results }: Props) {
  const [range, setRange] = useState<"all" | "last8">("all");

  const sorted = [...results]
    .filter((r) => r.total && r.total > 0)
    .sort((a, b) => a.meet_date.localeCompare(b.meet_date));

  const data = (range === "last8" ? sorted.slice(-8) : sorted).map((r) => ({
    date: r.meet_date,
    total: r.total,
    squat: r.best_squat,
    bench: r.best_bench,
    deadlift: r.best_deadlift,
    meet: r.meet_name,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-text-primary">
          Progression & History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setRange("all")}
            className={`rounded px-3 py-1 text-xs font-heading uppercase ${
              range === "all" ? "bg-bg-surface text-text-primary" : "text-text-muted"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setRange("last8")}
            className={`rounded px-3 py-1 text-xs font-heading uppercase ${
              range === "last8" ? "bg-bg-surface text-text-primary" : "text-text-muted"
            }`}
          >
            Last 8 Meets
          </button>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis
              dataKey="date"
              stroke="#666666"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#666666" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: 8,
                color: "#FFFFFF",
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#E8491A"
              strokeWidth={2}
              dot={{ fill: "#FFFFFF", r: 4 }}
              activeDot={{ fill: "#E8491A", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Step 2: Build the competition history table**

Create `src/app/lifter/[slug]/competition-history.tsx`:

```tsx
import Link from "next/link";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

export function CompetitionHistory({ results }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-accent-secondary text-right">Total</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">DOTS</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Place</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
              <td className="px-3 py-3 text-text-muted whitespace-nowrap">{r.meet_date}</td>
              <td className="px-3 py-3">
                <Link
                  href={`/meet/${r.meet_slug}`}
                  className="text-text-primary hover:text-accent-primary transition-colors"
                >
                  {r.meet_name}
                </Link>
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">
                {r.bodyweight_kg?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_squat?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_bench?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_deadlift?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-accent-secondary">
                {r.total?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-secondary">
                {r.dots?.toFixed(2) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">{r.place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Build the dossier page**

Create `src/app/lifter/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLifterBySlug, getLifterResults, getLifterBests } from "@/lib/queries/lifter";
import { StatBlock } from "@/components/ui/stat-block";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ProgressionChart } from "./progression-chart";
import { CompetitionHistory } from "./competition-history";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LifterDossierPage({ params }: Props) {
  const { slug } = await params;
  const lifter = await getLifterBySlug(slug);
  if (!lifter) notFound();

  const [results, bests] = await Promise.all([
    getLifterResults(lifter.id),
    getLifterBests(lifter.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {bests?.weight_class_kg && <Chip>{bests.weight_class_kg}kg</Chip>}
          {bests?.equipment && <Chip>{bests.equipment}</Chip>}
          {lifter.instagram && (
            <a
              href={`https://instagram.com/${lifter.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              @{lifter.instagram} ↗
            </a>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-6xl">
            {lifter.name}
          </h1>
          <Button variant="primary" size="md">
            Follow Lifter
          </Button>
        </div>
      </div>

      {/* Stats */}
      {bests && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBlock label="Squat" value={bests.best_squat?.toFixed(1) || "—"} />
          <StatBlock label="Bench" value={bests.best_bench?.toFixed(1) || "—"} />
          <StatBlock label="Deadlift" value={bests.best_deadlift?.toFixed(1) || "—"} />
          <StatBlock label="Total" value={bests.total?.toFixed(1) || "—"} highlight />
        </div>
      )}

      {/* Progression Chart */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-bg-surface" />}>
        <ProgressionChart results={results} />
      </Suspense>

      {/* Competition History */}
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <CompetitionHistory results={results} />
      </Suspense>
    </div>
  );
}
```

**Step 4: Verify**

```bash
npm run dev
```

Navigate to a lifter page like `/lifter/jesus-olivares` — should show stats, chart, and history.

**Step 5: Commit**

```bash
git add src/app/lifter/ src/lib/queries/lifter.ts
git commit -m "feat: add lifter dossier page with stats, progression chart, and history"
```

---

## Phase 5: Meet Hub

### Task 10: Build meet data layer and pages

**Files:**
- Create: `src/lib/queries/meets.ts`
- Create: `src/app/meets/page.tsx`
- Create: `src/app/meet/[slug]/page.tsx`
- Create: `src/app/meet/[slug]/meet-results-table.tsx`

**Step 1: Create meet queries**

Create `src/lib/queries/meets.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { MeetSummary, CompetitionResult } from "@/lib/types";

export async function getMeets(filters: {
  search?: string;
  federation?: string;
  year?: number;
  limit?: number;
  offset?: number;
}): Promise<MeetSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, country, city, state")
    .order("date", { ascending: false })
    .limit(filters.limit || 50)
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

  if (filters.search) {
    query = query.textSearch("name_search", filters.search);
  }
  if (filters.federation) {
    query = query.eq("federation", filters.federation);
  }
  if (filters.year) {
    query = query.gte("date", `${filters.year}-01-01`).lte("date", `${filters.year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Meets query failed: ${error.message}`);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
    country: m.country,
    city: m.city,
    state: m.state,
  }));
}

export async function getMeetBySlug(slug: string) {
  const supabase = await createClient();
  const meetPath = decodeURIComponent(slug).replace(/-/g, "/");

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, country, city, state")
    .ilike("opl_meet_path", meetPath)
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: encodeURIComponent(data.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: data.federation,
    date: data.date,
    country: data.country,
    city: data.city,
    state: data.state,
  };
}

export async function getMeetResults(meetId: string): Promise<CompetitionResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("results")
    .select(`
      id, lifter_id, meet_id, weight_class_kg, bodyweight_kg, equipment,
      squat_1, squat_2, squat_3, bench_1, bench_2, bench_3,
      deadlift_1, deadlift_2, deadlift_3,
      best_squat, best_bench, best_deadlift, total, dots, wilks, place,
      lifters!inner(name, opl_name),
      meets!inner(name, opl_meet_path, date)
    `)
    .eq("meet_id", meetId)
    .order("weight_class_kg")
    .order("place");

  if (error) throw new Error(`Meet results query failed: ${error.message}`);

  return (data || []).map((row: Record<string, unknown>) => {
    const lifter = row.lifters as Record<string, string>;
    const meet = row.meets as Record<string, string>;
    return {
      id: row.id as string,
      lifter_id: row.lifter_id as string,
      lifter_name: lifter.name,
      lifter_slug: encodeURIComponent(lifter.opl_name.toLowerCase().replace(/ /g, "-")),
      meet_id: row.meet_id as string,
      meet_name: meet.name,
      meet_slug: encodeURIComponent(meet.opl_meet_path.toLowerCase().replace(/\//g, "-")),
      meet_date: meet.date,
      weight_class_kg: row.weight_class_kg as string,
      bodyweight_kg: row.bodyweight_kg as number | null,
      equipment: row.equipment as string,
      squat_1: row.squat_1 as number | null,
      squat_2: row.squat_2 as number | null,
      squat_3: row.squat_3 as number | null,
      bench_1: row.bench_1 as number | null,
      bench_2: row.bench_2 as number | null,
      bench_3: row.bench_3 as number | null,
      deadlift_1: row.deadlift_1 as number | null,
      deadlift_2: row.deadlift_2 as number | null,
      deadlift_3: row.deadlift_3 as number | null,
      best_squat: row.best_squat as number | null,
      best_bench: row.best_bench as number | null,
      best_deadlift: row.best_deadlift as number | null,
      total: row.total as number | null,
      dots: row.dots as number | null,
      wilks: row.wilks as number | null,
      place: row.place as string,
    };
  });
}
```

**Step 2: Build meet index page**

Create `src/app/meets/page.tsx`:

```tsx
import Link from "next/link";
import { getMeets } from "@/lib/queries/meets";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function MeetsIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const meets = await getMeets({
    search: params.q,
    federation: params.fed,
    year: params.year ? parseInt(params.year) : undefined,
    limit: 50,
    offset: parseInt(params.offset || "0"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
        Meet Hub
      </h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Federation</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Location</th>
            </tr>
          </thead>
          <tbody>
            {meets.map((meet) => (
              <tr key={meet.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
                <td className="px-3 py-3">
                  <Link
                    href={`/meet/${meet.slug}`}
                    className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                  >
                    {meet.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-text-muted">{meet.federation}</td>
                <td className="px-3 py-3 text-text-muted whitespace-nowrap">{meet.date}</td>
                <td className="px-3 py-3 text-text-muted">
                  {[meet.city, meet.state, meet.country].filter(Boolean).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Build meet results table with attempt coloring**

Create `src/app/meet/[slug]/meet-results-table.tsx`:

```tsx
import Link from "next/link";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

function AttemptCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted">—</span>;
  const failed = value < 0;
  return (
    <span className={failed ? "text-semantic-error" : "text-text-primary"}>
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export function MeetResultsTable({ results }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Pl</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Class</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-accent-secondary text-right">Total</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">DOTS</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
              <td className="px-2 py-3 font-mono text-text-muted">{r.place}</td>
              <td className="px-2 py-3 whitespace-nowrap">
                <Link
                  href={`/lifter/${r.lifter_slug}`}
                  className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                >
                  {r.lifter_name}
                </Link>
              </td>
              <td className="px-2 py-3 text-right font-mono text-text-muted">{r.bodyweight_kg?.toFixed(1) || "—"}</td>
              <td className="px-2 py-3 text-right font-mono text-text-muted">{r.weight_class_kg || "—"}</td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_3} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_3} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_3} /></td>
              <td className="px-2 py-3 text-right font-mono font-bold text-accent-secondary">
                {r.total?.toFixed(1) || "—"}
              </td>
              <td className="px-2 py-3 text-right font-mono text-text-secondary">
                {r.dots?.toFixed(2) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 4: Build individual meet page**

Create `src/app/meet/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getMeetBySlug, getMeetResults } from "@/lib/queries/meets";
import { Chip } from "@/components/ui/chip";
import { MeetResultsTable } from "./meet-results-table";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MeetPage({ params }: Props) {
  const { slug } = await params;
  const meet = await getMeetBySlug(slug);
  if (!meet) notFound();

  const results = await getMeetResults(meet.id);

  const location = [meet.city, meet.state, meet.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Chip>{meet.federation}</Chip>
        <h1 className="mt-2 font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
          {meet.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {meet.date} · {location} · {results.length} lifters
        </p>
      </div>

      <MeetResultsTable results={results} />
    </div>
  );
}
```

**Step 5: Verify**

```bash
npm run dev
```

Check `/meets` for the index and click a meet to see full attempt-level results with red/white coloring.

**Step 6: Commit**

```bash
git add src/app/meets/ src/app/meet/ src/lib/queries/meets.ts
git commit -m "feat: add meet hub with index page and individual meet results"
```

---

## Phase 6: Search

### Task 11: Build search page

**Files:**
- Create: `src/lib/queries/search.ts`
- Create: `src/app/search/page.tsx`

**Step 1: Create search query**

Create `src/lib/queries/search.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export async function searchLifters(query: string, limit = 20) {
  const supabase = await createClient();
  const tsquery = query.split(/\s+/).join(" & ");

  const { data } = await supabase
    .from("lifters")
    .select("id, opl_name, name, sex, country")
    .textSearch("name_search", tsquery)
    .limit(limit);

  return (data || []).map((l) => ({
    id: l.id,
    name: l.name,
    slug: encodeURIComponent(l.opl_name.toLowerCase().replace(/ /g, "-")),
    sex: l.sex,
    country: l.country,
  }));
}

export async function searchMeets(query: string, limit = 10) {
  const supabase = await createClient();
  const tsquery = query.split(/\s+/).join(" & ");

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date")
    .textSearch("name_search", tsquery)
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
  }));
}
```

**Step 2: Build search page**

Create `src/app/search/page.tsx`:

```tsx
import Link from "next/link";
import { searchLifters, searchMeets } from "@/lib/queries/search";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-muted">Search for lifters and meets</p>
      </div>
    );
  }

  const [lifters, meets] = await Promise.all([
    searchLifters(q),
    searchMeets(q),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary">
        Results for "{q}"
      </h1>

      {lifters.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg uppercase tracking-wider text-accent-primary">
            Lifters
          </h2>
          <div className="space-y-1">
            {lifters.map((l) => (
              <Link
                key={l.id}
                href={`/lifter/${l.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-accent-primary"
              >
                <span className="font-bold text-text-primary">{l.name}</span>
                <span className="text-xs text-text-muted">{l.country}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {meets.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg uppercase tracking-wider text-accent-primary">
            Meets
          </h2>
          <div className="space-y-1">
            {meets.map((m) => (
              <Link
                key={m.id}
                href={`/meet/${m.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-accent-primary"
              >
                <span className="font-bold text-text-primary">{m.name}</span>
                <span className="text-xs text-text-muted">{m.federation} · {m.date}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lifters.length === 0 && meets.length === 0 && (
        <p className="text-text-muted">No results found for "{q}"</p>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/queries/search.ts src/app/search/
git commit -m "feat: add search page with lifter and meet full-text search"
```

---

## Phase 7: The Feed

### Task 12: Build The Feed home page

**Files:**
- Create: `src/lib/queries/feed.ts`
- Modify: `src/app/page.tsx`
- Create: `src/app/(feed)/feed-column.tsx`
- Create: `src/app/(feed)/dispatches-sidebar.tsx`
- Create: `src/app/(feed)/upcoming-meets-sidebar.tsx`
- Create: `src/components/content/post-card.tsx`
- Create: `src/components/content/aggregated-content-card.tsx`

This is the most complex page. Build it in layers:

1. The three-column layout shell
2. Upcoming meets sidebar (simplest — just a query)
3. Dispatches sidebar (auto-generated from recent syncs)
4. The feed itself (user posts + aggregated content, sorted by hot ranking)

The feed will initially show aggregated content only (no user posts yet — auth comes in Phase 8). User posting UI is added after auth is wired up.

**Step 1: Create feed queries**

Create `src/lib/queries/feed.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export async function getUpcomingMeets(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, city, state, country")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
    location: [m.city, m.state, m.country].filter(Boolean).join(", "),
  }));
}

export async function getRecentMeets(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date")
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
  }));
}

export async function getAggregatedContent(limit = 20) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("aggregated_content")
    .select(`
      id, platform, source_url, embed_url, title, thumbnail_url, description, published_at,
      content_sources!inner(creator_name)
    `)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data || []).map((c: Record<string, unknown>) => {
    const source = c.content_sources as Record<string, string>;
    return {
      id: c.id as string,
      platform: c.platform as string,
      sourceUrl: c.source_url as string,
      embedUrl: c.embed_url as string,
      title: c.title as string,
      thumbnailUrl: c.thumbnail_url as string | null,
      description: c.description as string | null,
      publishedAt: c.published_at as string,
      creatorName: source.creator_name,
    };
  });
}

export async function getPosts(limit = 20, offset = 0) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select(`
      id, body_text, link_url, link_preview, vote_count, comment_count, created_at,
      lifter_id, meet_id,
      profiles!inner(username, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data || []).map((p: Record<string, unknown>) => {
    const profile = p.profiles as Record<string, string>;
    return {
      id: p.id as string,
      bodyText: p.body_text as string,
      linkUrl: p.link_url as string | null,
      linkPreview: p.link_preview as { title?: string; description?: string; thumbnail?: string; domain?: string } | null,
      voteCount: p.vote_count as number,
      commentCount: p.comment_count as number,
      createdAt: p.created_at as string,
      lifterId: p.lifter_id as string | null,
      meetId: p.meet_id as string | null,
      username: profile.username,
      avatarUrl: profile.avatar_url,
    };
  });
}
```

**Step 2: Build post card component**

Create `src/components/content/post-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";

interface PostCardProps {
  username: string;
  bodyText: string;
  linkUrl?: string | null;
  linkPreview?: { title?: string; description?: string; thumbnail?: string; domain?: string } | null;
  voteCount: number;
  commentCount: number;
  createdAt: string;
}

export function PostCard({ username, bodyText, linkUrl, linkPreview, voteCount, commentCount, createdAt }: PostCardProps) {
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="font-bold text-text-secondary">{username}</span>
        <span>·</span>
        <span>{timeAgo}</span>
      </div>
      <p className="text-sm text-text-primary">{bodyText}</p>
      {linkPreview && (
        <a
          href={linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 rounded-md border border-border p-3 transition-colors hover:border-accent-primary"
        >
          {linkPreview.thumbnail && (
            <img src={linkPreview.thumbnail} alt="" className="h-16 w-24 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{linkPreview.title}</p>
            <p className="text-xs text-text-muted truncate">{linkPreview.description}</p>
            <p className="text-xs text-text-muted mt-1">{linkPreview.domain}</p>
          </div>
        </a>
      )}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>▲ {voteCount}</span>
        <span>💬 {commentCount}</span>
      </div>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

**Step 3: Build aggregated content card**

Create `src/components/content/aggregated-content-card.tsx`:

```tsx
import { Card } from "@/components/ui/card";

interface AggregatedContentCardProps {
  title: string;
  creatorName: string;
  platform: string;
  sourceUrl: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
}

export function AggregatedContentCard({ title, creatorName, platform, sourceUrl, thumbnailUrl, publishedAt }: AggregatedContentCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      {thumbnailUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          <img src={thumbnailUrl} alt={title} className="aspect-video w-full object-cover" />
        </a>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="uppercase font-heading tracking-wider text-accent-primary">
            {platform}
          </span>
          <span>·</span>
          <span>{creatorName}</span>
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-bold text-text-primary hover:text-accent-primary transition-colors"
        >
          {title}
        </a>
      </div>
    </Card>
  );
}
```

**Step 4: Build the home page with three-column layout**

Update `src/app/page.tsx`:

```tsx
import Link from "next/link";
import { getUpcomingMeets, getRecentMeets, getAggregatedContent, getPosts } from "@/lib/queries/feed";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { Card } from "@/components/ui/card";

export default async function FeedPage() {
  const [upcomingMeets, recentMeets, content, posts] = await Promise.all([
    getUpcomingMeets(5),
    getRecentMeets(5),
    getAggregatedContent(10),
    getPosts(10),
  ]);

  // Interleave posts and content for the feed
  const feedItems: Array<{ type: "post" | "content"; data: (typeof posts)[0] | (typeof content)[0]; date: string }> = [
    ...posts.map((p) => ({ type: "post" as const, data: p, date: p.createdAt })),
    ...content.map((c) => ({ type: "content" as const, data: c, date: c.publishedAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_280px]">
      {/* Left column — Dispatches */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-accent-primary">
          ⚡ Dispatches
        </h2>
        {recentMeets.map((meet) => (
          <div key={meet.id} className="border-b border-border pb-3">
            <p className="text-xs text-text-muted">{meet.federation} · {meet.date}</p>
            <Link
              href={`/meet/${meet.slug}`}
              className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              Results: {meet.name}
            </Link>
          </div>
        ))}
      </aside>

      {/* Center column — Feed */}
      <div className="space-y-4">
        {feedItems.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted">No content yet. Check back soon!</p>
          </Card>
        ) : (
          feedItems.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={`post-${(item.data as (typeof posts)[0]).id}`}
                {...(item.data as (typeof posts)[0])}
              />
            ) : (
              <AggregatedContentCard
                key={`content-${(item.data as (typeof content)[0]).id}`}
                {...(item.data as (typeof content)[0])}
              />
            )
          )
        )}
      </div>

      {/* Right column — Upcoming Meets */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-text-primary">
          Upcoming Meets
        </h2>
        {upcomingMeets.map((meet) => (
          <Card key={meet.id} className="p-3 space-y-1">
            <Link
              href={`/meet/${meet.slug}`}
              className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              {meet.name}
            </Link>
            <p className="text-xs text-text-muted">{meet.federation}</p>
            <p className="text-xs text-text-muted">{meet.location}</p>
            <p className="text-xs text-accent-primary">{meet.date}</p>
          </Card>
        ))}
        {upcomingMeets.length > 0 && (
          <Link href="/meets" className="text-xs text-accent-primary hover:underline">
            View Full Calendar →
          </Link>
        )}
      </aside>
    </div>
  );
}
```

**Step 5: Verify**

```bash
npm run dev
```

Home page should show three-column layout on desktop, single column on mobile.

**Step 6: Commit**

```bash
git add src/app/page.tsx src/lib/queries/feed.ts src/components/content/
git commit -m "feat: add feed home page with dispatches, content cards, and upcoming meets"
```

---

## Phase 8: Auth & Community Features

### Task 13: Set up Supabase Auth

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/lib/auth.ts`
- Modify: `src/components/nav/top-nav.tsx` (add user menu)

**Step 1: Create auth helper**

Create `src/lib/auth.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return { ...user, profile };
}
```

**Step 2: Create auth callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
```

**Step 3: Build login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-20">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary text-center">
        Log In
      </h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        {error && <p className="text-sm text-semantic-error">{error}</p>}
        <Button type="submit" className="w-full">Log In</Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-bg-primary px-2 text-text-muted">or</span></div>
      </div>
      <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-text-muted">
        No account? <a href="/signup" className="text-accent-primary hover:underline">Sign up</a>
      </p>
    </div>
  );
}
```

**Step 4: Build signup page**

Create `src/app/signup/page.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); return; }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, username });
      if (profileError) { setError(profileError.message); return; }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-20">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary text-center">
        Sign Up
      </h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          required
          minLength={6}
        />
        {error && <p className="text-sm text-semantic-error">{error}</p>}
        <Button type="submit" className="w-full">Create Account</Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        Already have an account? <a href="/login" className="text-accent-primary hover:underline">Log in</a>
      </p>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/login/ src/app/signup/ src/app/auth/ src/lib/auth.ts
git commit -m "feat: add auth with login, signup, Google OAuth, and profile creation"
```

---

### Task 14: Build posting and voting

**Files:**
- Create: `src/app/actions/posts.ts`
- Create: `src/app/actions/votes.ts`
- Create: `src/components/content/create-post-form.tsx`
- Create: `src/components/content/vote-buttons.tsx`

**Step 1: Create post server action**

Create `src/app/actions/posts.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const bodyText = formData.get("body_text") as string;
  const linkUrl = formData.get("link_url") as string | null;
  const lifterId = formData.get("lifter_id") as string | null;
  const meetId = formData.get("meet_id") as string | null;

  let linkPreview = null;
  if (linkUrl) {
    linkPreview = await fetchLinkPreview(linkUrl);
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body_text: bodyText,
    link_url: linkUrl || null,
    link_preview: linkPreview,
    lifter_id: lifterId || null,
    meet_id: meetId || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

async function fetchLinkPreview(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const title = html.match(/<meta property="og:title" content="([^"]*)"/)? [1]
      || html.match(/<title>([^<]*)<\/title>/)?.[1]
      || url;
    const description = html.match(/<meta property="og:description" content="([^"]*)"/)? [1] || null;
    const thumbnail = html.match(/<meta property="og:image" content="([^"]*)"/)? [1] || null;
    const domain = new URL(url).hostname;
    return { title, description, thumbnail, domain };
  } catch {
    return { title: url, domain: new URL(url).hostname };
  }
}
```

**Step 2: Create vote server action**

Create `src/app/actions/votes.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function voteOnPost(postId: string, value: 1 | -1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  // Check existing vote
  const { data: existing } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.value === value) {
      // Remove vote (toggle off)
      await supabase.from("post_votes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: -value });
    } else {
      // Change vote
      await supabase.from("post_votes").update({ value }).eq("post_id", postId).eq("user_id", user.id);
      await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: value * 2 });
    }
  } else {
    // New vote
    await supabase.from("post_votes").insert({ post_id: postId, user_id: user.id, value });
    await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: value });
  }

  revalidatePath("/");
}
```

**Step 3: Create the vote increment function migration**

Create `supabase/migrations/00003_vote_increment.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_post_votes(p_post_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE posts SET vote_count = vote_count + p_delta WHERE id = p_post_id;
$$;
```

**Step 4: Push migration**

```bash
npx supabase db push
```

**Step 5: Build create post form**

Create `src/components/content/create-post-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  lifterId?: string;
  meetId?: string;
}

export function CreatePostForm({ lifterId, meetId }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Card
        className="cursor-pointer text-text-muted hover:border-accent-primary transition-colors"
        onClick={() => setExpanded(true)}
      >
        What's on your mind?
      </Card>
    );
  }

  return (
    <Card>
      <form action={createPost} className="space-y-3">
        <textarea
          name="body_text"
          placeholder="Share a take, link a video, start a discussion..."
          className="w-full resize-none rounded-md border border-border bg-bg-primary p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          rows={3}
          maxLength={2000}
          required
        />
        <input
          name="link_url"
          type="url"
          placeholder="Paste a link (optional)"
          className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
        />
        {lifterId && <input type="hidden" name="lifter_id" value={lifterId} />}
        {meetId && <input type="hidden" name="meet_id" value={meetId} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={() => setExpanded(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

**Step 6: Commit**

```bash
git add src/app/actions/ src/components/content/create-post-form.tsx supabase/migrations/00003_vote_increment.sql
git commit -m "feat: add posting with link previews and voting with toggle support"
```

---

## Phase 9: Content Aggregation Pipeline

### Task 15: Build the content aggregation script

**Files:**
- Create: `scripts/aggregate-content.ts`

**Step 1: Create the aggregation script**

Create `scripts/aggregate-content.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchYouTubeVideos(channelId: string, sourceId: string) {
  if (!YOUTUBE_API_KEY) { console.log("No YouTube API key, skipping"); return []; }

  // Get uploads playlist ID
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Get recent videos
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
  );
  const videosData = await videosRes.json();

  return (videosData.items || []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const thumbnails = snippet.thumbnails as Record<string, Record<string, unknown>>;
    const resourceId = snippet.resourceId as Record<string, string>;
    return {
      source_id: sourceId,
      platform: "youtube",
      source_url: `https://www.youtube.com/watch?v=${resourceId.videoId}`,
      embed_url: `https://www.youtube.com/embed/${resourceId.videoId}`,
      title: snippet.title as string,
      thumbnail_url: (thumbnails.high as Record<string, string>)?.url || null,
      description: (snippet.description as string)?.slice(0, 500) || null,
      published_at: snippet.publishedAt as string,
    };
  });
}

async function autoTagContent(contentId: string, title: string, description: string | null) {
  const searchText = `${title} ${description || ""}`.toLowerCase();

  // Get lifters whose names appear in the content
  const { data: lifters } = await supabase
    .from("lifters")
    .select("id, name")
    .limit(1000); // Only check well-known lifters; improve later

  if (!lifters) return;

  for (const lifter of lifters) {
    if (searchText.includes(lifter.name.toLowerCase())) {
      await supabase.from("content_lifter_tags").upsert({
        content_id: contentId,
        lifter_id: lifter.id,
        auto_tagged: true,
      }, { onConflict: "content_id,lifter_id" });
    }
  }
}

async function main() {
  console.log("Starting content aggregation...");

  const { data: sources } = await supabase
    .from("content_sources")
    .select("*")
    .eq("active", true);

  if (!sources || sources.length === 0) {
    console.log("No active content sources configured.");
    return;
  }

  for (const source of sources) {
    console.log(`Processing: ${source.creator_name} (${source.platform})`);

    let items: Record<string, unknown>[] = [];

    if (source.platform === "youtube") {
      items = await fetchYouTubeVideos(source.platform_id, source.id);
    }
    // Add podcast RSS and Instagram handlers here later

    for (const item of items) {
      const { data, error } = await supabase
        .from("aggregated_content")
        .upsert(item, { onConflict: "source_url" })
        .select("id")
        .single();

      if (error) {
        console.error(`Insert error for ${(item as Record<string, string>).source_url}: ${error.message}`);
        continue;
      }

      if (data) {
        await autoTagContent(
          data.id,
          (item as Record<string, string>).title,
          (item as Record<string, string | null>).description
        );
      }
    }

    console.log(`  → ${items.length} items processed`);
  }

  console.log("Content aggregation complete.");
}

main().catch(console.error);
```

**Step 2: Add script to package.json**

```json
"aggregate:content": "tsx scripts/aggregate-content.ts"
```

**Step 3: Commit**

```bash
git add scripts/aggregate-content.ts package.json
git commit -m "feat: add content aggregation script with YouTube support and auto-tagging"
```

---

## Phase 10: GitHub Actions & Deployment

### Task 16: Set up CI/CD and data pipelines

**Files:**
- Create: `.github/workflows/opl-sync.yml`
- Create: `.github/workflows/content-aggregate.yml`

**Step 1: Create OPL sync workflow**

Create `.github/workflows/opl-sync.yml`:

```yaml
name: OpenPowerlifting Sync

on:
  schedule:
    - cron: '0 4 * * 0' # Sunday at 4 AM UTC
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Clone OPL data
        run: |
          git clone --depth 1 https://gitlab.com/openpowerlifting/opl-data.git opl-data
      - name: Run sync
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPL_CSV_PATH: ./opl-data/build/openpowerlifting.csv
        run: npm run seed:opl
```

**Step 2: Create content aggregation workflow**

Create `.github/workflows/content-aggregate.yml`:

```yaml
name: Content Aggregation

on:
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  aggregate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Aggregate content
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
        run: npm run aggregate:content
```

**Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions for weekly OPL sync and daily content aggregation"
```

---

### Task 17: Deploy to Vercel

**Step 1: Deploy**

```bash
npx vercel --prod
```

Or connect the GitHub repo via the Vercel dashboard.

**Step 2: Set environment variables in Vercel**

Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project settings.

**Step 3: Verify deployment**

Visit the deployed URL and check all pages render correctly.

**Step 4: Commit any Vercel config**

```bash
git add -A
git commit -m "chore: add Vercel deployment configuration"
```

---

## Summary of Phases

| Phase | Tasks | What's Built |
|-------|-------|-------------|
| 1 | Tasks 1-3 | Project scaffold, database, OPL seed |
| 2 | Tasks 4-5 | Nav, mobile nav, UI primitives |
| 3 | Tasks 6-7 | Leaderboard with filters |
| 4 | Tasks 8-9 | Lifter dossier with chart and history |
| 5 | Task 10 | Meet hub with index and results |
| 6 | Task 11 | Search |
| 7 | Task 12 | The Feed home page |
| 8 | Tasks 13-14 | Auth, posting, voting |
| 9 | Task 15 | Content aggregation pipeline |
| 10 | Tasks 16-17 | CI/CD and deployment |
