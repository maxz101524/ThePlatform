# The Platform — Data Architecture Revamp

**Date:** 2026-03-23
**Status:** Approved
**Supersedes:** 2026-03-22-the-platform-design.md (schema, pipeline, and pages sections)

---

## 1. Vision

The Platform is **Instagram for powerlifters** — a social community where lifters build profiles, follow each other, discuss the sport, and discover the best in the world.

It is NOT an OpenPowerlifting clone. OPL is the database of record. The Platform is the social layer.

### Core Pillars

1. **Profile** — Your powerlifting identity. Best SBD, total, weight class, comp history, socials. Whether you're a world-record holder or just did your first local meet.
2. **Feed** — Posts from people you follow, aggregated content (YouTube, podcasts), training updates, meet recaps.
3. **Leaderboard** — All-time elite rankings by weight class, equipment, sex. A discovery tool for finding the best lifters in the world.
4. **Follow system** — Follow other users. Your feed is shaped by who you follow.
5. **Content hub** — Aggregated YouTube, podcasts, and media from the PL ecosystem.

### What The Platform Is NOT

- Not an OPL clone (OPL is the database)
- Not a meet results archive
- Not a coaching platform or programming tool

---

## 2. Use Cases

| As a...          | I want to...                                      | So I can...                                             |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Lifter           | Build a profile with my best SBD and comp history | Show off my achievements and connect with the community |
| Fan              | Follow top lifters and users                      | Stay up to date on the sport                            |
| Community member | Post, discuss, share content                      | Engage with other powerlifters                          |
| Competitor       | Browse leaderboards                               | See who's the best, discover lifters                    |
| Content consumer | See aggregated PL content in one feed             | Stop checking 10 different YouTube channels             |

---

## 3. Architecture (unchanged)

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js App (App Router)             │  │
│  │     Pages (RSC) + Server Actions + API         │  │
│  └───────────────────┬───────────────────────────┘  │
└──────────────────────┼───────────────────────────────┘
                       │
              ┌────────▼────────┐
              │    Supabase     │
              │  PostgreSQL     │
              │  + Auth + RLS   │
              └─────────────────┘
                       ▲
              ┌────────┴────────┐
              │  GitHub Actions │
              │  OPL Sync (wk)  │
              │  Content (daily) │
              └─────────────────┘
```

---

## 4. Database Schema

### Overview

```
┌─────────────────────────────────────────────────┐
│  OPL-DERIVED (weekly sync)                      │
│  leaderboard_entries    ~25K rows, ~5 MB        │
│  sync_metadata                                  │
├─────────────────────────────────────────────────┤
│  USER-GENERATED (grows with signups)            │
│  profiles               extended with PL stats  │
│  user_results            comp history per user  │
│  follows                 user-to-user           │
│  posts + post_votes                             │
│  comments + comment_votes                       │
│  reports                                        │
├─────────────────────────────────────────────────┤
│  CONTENT (daily sync)                           │
│  content_sources                                │
│  aggregated_content                             │
├─────────────────────────────────────────────────┤
│  DROPPED (from v1 schema)                       │
│  lifters                 927K rows -> gone      │
│  results                 3.5M rows -> gone      │
│  meets                   57K rows -> gone        │
│  content_lifter_tags     replaced by text match  │
│  content_meet_tags       dropped                │
└─────────────────────────────────────────────────┘
```

### 4A. `leaderboard_entries`

Pre-computed elite rankings. Each row = one lifter's best total in a (sex, equipment, weight_class) category.

| Column          | Type              | Notes                                 |
| --------------- | ----------------- | ------------------------------------- |
| id              | uuid, PK          |                                       |
| lifter_opl_name | text              | OPL identifier (e.g. "John Haack #1") |
| lifter_name     | text              | Display name (e.g. "John Haack")      |
| sex             | sex_enum          | M / F / Mx                            |
| country         | text, nullable    |                                       |
| equipment       | equipment_enum    | Raw / Wraps / Single-ply / Multi-ply  |
| weight_class_kg | text              |                                       |
| bodyweight_kg   | numeric, nullable |                                       |
| best_squat      | numeric, nullable |                                       |
| best_bench      | numeric, nullable |                                       |
| best_deadlift   | numeric, nullable |                                       |
| total           | numeric, NOT NULL |                                       |
| dots            | numeric, nullable |                                       |
| wilks           | numeric, nullable |                                       |
| meet_name       | text              | Meet where this total was set         |
| meet_date       | date              |                                       |
| federation      | text              |                                       |

**Unique constraint:** `(lifter_opl_name, equipment, weight_class_kg)`

**Indexes:**

- `(sex, equipment, weight_class_kg, total DESC)` — leaderboard queries
- `(lifter_opl_name)` — lifter lookup
- `(sex, equipment, weight_class_kg, dots DESC)` — dots sorting

**Population:** Weekly sync computes top 200 per (sex, equipment, weight_class) from full OPL 2CSV. ~2 sexes x 4 equipment x ~12 weight classes x 200 = ~19,200 rows, with overlap ~25K.

### 4B. `profiles`

Extended user profiles with powerlifting identity.

| Column          | Type                       | Notes                    |
| --------------- | -------------------------- | ------------------------ |
| id              | uuid, PK, FK -> auth.users |                          |
| username        | text, UNIQUE               |                          |
| display_name    | text, nullable             |                          |
| avatar_url      | text, nullable             |                          |
| bio             | text, nullable             | Max 500 chars            |
| instagram       | text, nullable             |                          |
| opl_name        | text, nullable             | Claimed OPL identity     |
| sex             | sex_enum, nullable         |                          |
| country         | text, nullable             |                          |
| weight_class_kg | text, nullable             | Primary weight class     |
| equipment       | equipment_enum, nullable   | Primary equipment        |
| best_squat      | numeric, nullable          | Cached from user_results |
| best_bench      | numeric, nullable          | Cached from user_results |
| best_deadlift   | numeric, nullable          | Cached from user_results |
| best_total      | numeric, nullable          | Cached from user_results |
| dots            | numeric, nullable          | Cached from user_results |
| follower_count  | int, default 0             | Denormalized             |
| following_count | int, default 0             | Denormalized             |
| created_at      | timestamptz                |                          |

**Indexes:**

- `(username)` — profile lookup
- Full-text on `display_name` or `username` for search

### 4C. `user_results`

Self-contained competition history for registered users.

| Column          | Type                                    | Notes |
| --------------- | --------------------------------------- | ----- |
| id              | uuid, PK                                |       |
| profile_id      | uuid, FK -> profiles, ON DELETE CASCADE |       |
| meet_name       | text                                    |       |
| meet_date       | date                                    |       |
| federation      | text, nullable                          |       |
| weight_class_kg | text, nullable                          |       |
| bodyweight_kg   | numeric, nullable                       |       |
| equipment       | equipment_enum, nullable                |       |
| best_squat      | numeric, nullable                       |       |
| best_bench      | numeric, nullable                       |       |
| best_deadlift   | numeric, nullable                       |       |
| total           | numeric, nullable                       |       |
| dots            | numeric, nullable                       |       |
| wilks           | numeric, nullable                       |       |
| place           | text, nullable                          |       |
| created_at      | timestamptz                             |       |

**Indexes:**

- `(profile_id, meet_date DESC)` — user's comp history

**Population:** Two methods:

1. **OPL claim:** User enters their OPL name -> sync script finds matching rows in CSV -> imports
2. **Manual entry:** User adds results through a form (future enhancement)

### 4D. `follows`

User-to-user follow relationships.

| Column       | Type                                    | Notes |
| ------------ | --------------------------------------- | ----- |
| follower_id  | uuid, FK -> profiles, ON DELETE CASCADE |       |
| following_id | uuid, FK -> profiles, ON DELETE CASCADE |       |
| created_at   | timestamptz                             |       |

**Primary key:** `(follower_id, following_id)`

**Triggers:** Increment/decrement `follower_count` and `following_count` on profiles.

### 4E. `posts`

| Column        | Type                                    | Notes                                               |
| ------------- | --------------------------------------- | --------------------------------------------------- |
| id            | uuid, PK                                |                                                     |
| user_id       | uuid, FK -> profiles, ON DELETE CASCADE |                                                     |
| body_text     | text, max 2000 chars                    |                                                     |
| link_url      | text, nullable                          |                                                     |
| link_preview  | jsonb, nullable                         | {title, description, thumbnail, domain}             |
| tag           | text, nullable                          | e.g. 'training', 'meet-recap', 'gear', 'discussion' |
| vote_count    | int, default 0                          | Denormalized                                        |
| comment_count | int, default 0                          | Denormalized                                        |
| created_at    | timestamptz                             |                                                     |

**Changes from v1:** Dropped `lifter_id` and `meet_id` FKs (those tables no longer exist). Added `tag` for lightweight categorization.

**Indexes:**

- `(created_at DESC)` — feed ordering
- `(user_id, created_at DESC)` — user's posts on their profile

### 4F. `comments`

Simplified — comments on posts only.

| Column            | Type                                    | Notes        |
| ----------------- | --------------------------------------- | ------------ |
| id                | uuid, PK                                |              |
| post_id           | uuid, FK -> posts, ON DELETE CASCADE    |              |
| user_id           | uuid, FK -> profiles, ON DELETE CASCADE |              |
| parent_comment_id | uuid, FK -> comments, nullable          | Threading    |
| body_text         | text, max 1000 chars                    |              |
| vote_count        | int, default 0                          | Denormalized |
| created_at        | timestamptz                             |              |

**Changes from v1:** Dropped `lifter_id` and `meet_id` (and the exactly-one-parent constraint). Comments only live on posts.

### 4G. `post_votes`, `comment_votes`

Unchanged from v1.

### 4H. `reports`

Simplified — reports on posts and comments only.

| Column     | Type                           | Notes                                      |
| ---------- | ------------------------------ | ------------------------------------------ |
| id         | uuid, PK                       |                                            |
| user_id    | uuid, FK -> profiles           |                                            |
| post_id    | uuid, FK -> posts, nullable    |                                            |
| comment_id | uuid, FK -> comments, nullable |                                            |
| reason     | report_reason_enum             | spam / harassment / misinformation / other |
| details    | text, nullable                 |                                            |
| status     | report_status_enum             | pending / reviewed / dismissed             |
| created_at | timestamptz                    |                                            |

### 4I. `content_sources` and `aggregated_content`

Unchanged from v1.

Content auto-tagging is now text-based: during aggregation, match content titles/descriptions against `leaderboard_entries.lifter_name`. No separate tags table needed — store matched lifter names in a `tags` JSONB column on `aggregated_content`, or match at query time.

### 4J. `sync_metadata`

Unchanged from v1.

---

## 5. Pages & Routes

| Route             | Purpose                                                         | Data Source                        |
| ----------------- | --------------------------------------------------------------- | ---------------------------------- |
| `/`             | Feed — posts from followed users, trending, aggregated content | posts, follows, aggregated_content |
| `/leaderboard`  | Elite rankings, filterable by sex/equipment/weight class        | leaderboard_entries                |
| `/u/[username]` | User profile — stats, comp history, posts, socials             | profiles, user_results, posts      |
| `/search`       | Search user profiles                                            | profiles                           |
| `/login`        | Auth                                                            | Supabase Auth                      |
| `/signup`       | Auth + optional OPL claim                                       | Supabase Auth, profiles            |
| `/post/[id]`    | Individual post thread                                          | posts, comments                    |

### Dropped Routes

| Route              | Reason                                                  |
| ------------------ | ------------------------------------------------------- |
| `/lifter/[slug]` | No lifters table. Elite lifters visible on leaderboard. |
| `/meets`         | No meets table. Not core to the social platform vision. |
| `/meet/[slug]`   | Same. OPL handles full meet results.                    |

### Page Details

**Feed (`/`)**

- Desktop: three-column layout
  - Left: recent notable results from leaderboard data (auto-generated dispatches)
  - Center: posts from followed users + trending + aggregated content
  - Right: sidebar (who to follow suggestions, trending tags)
- Mobile: single column, dispatches as horizontal scroll strip

**Leaderboard (`/leaderboard`)**

- Filter bar: sex, equipment, weight class, federation, sort by (total/dots/wilks/squat/bench/deadlift)
- Results table: rank, lifter name, bodyweight, SBD, total, dots, meet context
- Clicking a lifter name: if they have a Platform account, link to `/u/[username]`. Otherwise, display a popover with their leaderboard entries.
- Filters persist in URL for shareable links

**User Profile (`/u/[username]`)**

- Hero: avatar, display name, username, bio, socials, follow button
- Stats bar: best squat, bench, deadlift, total (highlighted), dots, weight class chip, equipment chip
- Competition history table (from user_results): date, meet, SBD, total, dots, place
- Posts tab: user's posts
- Could evolve to include progression charts, media, training logs (v2+)

**Search (`/search`)**

- Search user profiles by username/display name
- Full-text search on profiles table

---

## 6. Data Pipeline

### Weekly OPL Sync (GitHub Action, Sunday 4 AM UTC)

```
1. Download OPL CSV (~746 MB)
2. Parse CSV, compute:
   For each (sex, equipment, weight_class):
     -> Find top 200 lifters by total
     -> Record their best result (lifter name, SBD, total, dots, wilks, meet info)
3. TRUNCATE leaderboard_entries
4. INSERT ~25K leaderboard rows
5. For each registered profile with opl_name set:
     -> Find all matching CSV rows
     -> Upsert into user_results
     -> Recompute cached bests on profiles
6. Update sync_metadata
```

This processes the full CSV but only writes ~25K rows + user-specific results. Fast, simple, fits in free tier.

### Daily Content Aggregation (GitHub Action, 6 AM UTC)

Unchanged from v1:

1. Read active sources from `content_sources`
2. Fetch new videos/episodes from YouTube Data API / RSS
3. Insert into `aggregated_content`
4. Auto-tag: match lifter names from `leaderboard_entries` against title/description

### Profile Claiming Flow

1. User signs up (email/password or Google OAuth)
2. During onboarding or from profile settings: "Claim your OPL identity"
3. User types their name -> we search the OPL CSV (or a cached index) for matches
4. User confirms the right identity
5. System imports all their competition results into `user_results`
6. Cached bests on `profiles` are computed
7. Weekly sync keeps their data up to date

**Implementation note:** For MVP, the OPL name claim can be a simple text field that gets matched during the next weekly sync. Instant import can come later.

---

## 7. Storage Estimate

| Table                     | Rows               | Estimated Size   |
| ------------------------- | ------------------ | ---------------- |
| leaderboard_entries       | ~25K               | ~5 MB            |
| profiles                  | grows with signups | < 1 MB           |
| user_results              | grows with claims  | < 1 MB           |
| follows                   | grows with usage   | < 1 MB           |
| posts + votes + comments  | grows with usage   | < 1 MB           |
| content tables            | grows daily        | < 1 MB           |
| sync_metadata             | ~5 rows            | < 1 KB           |
| **Total at launch** |                    | **~10 MB** |
| **Free tier limit** |                    | **500 MB** |

~50x headroom for growth.

---

## 8. Migration from Current State

### Tables to Drop

- `lifters` (927K rows)
- `results` (0 rows, but table + indexes exist)
- `meets` (57K rows)
- `content_lifter_tags`
- `content_meet_tags`

### Tables to Create

- `leaderboard_entries`
- `user_results`
- `follows`

### Tables to Modify

- `profiles` — add PL-specific columns (opl_name, sex, weight_class_kg, equipment, best_squat, best_bench, best_deadlift, best_total, dots, follower_count, following_count, display_name, bio, instagram)
- `posts` — drop lifter_id and meet_id FKs, add tag column
- `comments` — drop lifter_id and meet_id columns, drop exactly_one_parent constraint
- `reports` — no structural change (lifter/meet FK columns didn't exist)
- `aggregated_content` — optionally add `tags` jsonb column for auto-tagging

### Queries to Rewrite

- `src/lib/queries/leaderboard.ts` — query leaderboard_entries instead of RPC
- `src/lib/queries/lifter.ts` — remove entirely (no lifter pages)
- `src/lib/queries/meets.ts` — remove entirely (no meet pages)
- `src/lib/queries/search.ts` — search profiles instead of lifters/meets
- `src/lib/queries/feed.ts` — update to use follows for feed filtering, remove meet references

### New Queries

- `src/lib/queries/profile.ts` — profile lookup, user_results, user's posts
- `src/lib/queries/follow.ts` — follow/unfollow, follower/following lists

### Pages to Update

- `/` — feed now uses follows-based filtering
- `/leaderboard` — queries leaderboard_entries (simpler)
- `/search` — searches profiles

### Pages to Create

- `/u/[username]` — user profile page

### Pages to Remove

- `/lifter/[slug]`
- `/meets`
- `/meet/[slug]`

### Sync Scripts to Rewrite

- `scripts/seed-opl.ts` — rewrite to only compute leaderboard_entries
- `scripts/seed-results.ts` — remove (no longer needed)
- `.github/workflows/opl-sync.yml` — update to use new seed script

### RPC Functions to Drop

- `get_leaderboard` (replaced by direct query on leaderboard_entries)
- `insert_results_batch` (no longer needed)

---

## 9. Design Language

Unchanged from v1 design doc. Dark theme, orange accents, Barlow Condensed headings, Inter body.

### Updated Mobile Navigation

Bottom nav: **Feed** / **Leaderboard** / **Search** / **Profile**

(Removed "Meets" tab)

---

## 10. v1 vs v2 Scope (Revised)

| Feature       | v1 (This Revamp)                     | v2 (Later)                                          |
| ------------- | ------------------------------------ | --------------------------------------------------- |
| Leaderboard   | Full filtering, top 200 per category | Saved presets, historical rankings                  |
| User profiles | Stats + comp history + posts         | Progression charts, media gallery, training logs    |
| Feed          | Posts + aggregated content           | Personalized feed from follows, algorithmic ranking |
| Follow system | User-to-user                         | Notifications, activity feed                        |
| OPL claiming  | Text field, matched on next sync     | Instant import, verification                        |
| Search        | Profile search                       | Full-text on posts, content                         |
| Content       | YouTube aggregation                  | Podcasts, Instagram, auto-generated dispatches      |
| Auth          | Email + Google OAuth                 | Apple sign-in                                       |
| Moderation    | Report + manual review               | Trusted mods, auto-filters                          |
