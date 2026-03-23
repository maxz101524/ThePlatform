# The Platform — Design Document

**Date:** 2026-03-22
**Status:** Approved

---

## 1. Overview

The Platform is an editorial powerlifting hub — a centralized destination for rankings, athlete profiles, meet results, and community discussion. It combines structured competition data (sourced from OpenPowerlifting) with aggregated creator content (YouTube, Instagram, podcasts) and user-generated posts to create the definitive home for powerlifting on the internet.

### Core Decisions

- **Data source:** OpenPowerlifting open dataset, incrementally synced
- **Content model:** Aggregation (curated creator embeds) + community-generated posts (text + links)
- **No authored articles** — dispatches are auto-generated from data events
- **Auth deferred for v2** — localStorage follows for v1, Supabase Auth when ready
- **Moderation:** Report button + basic filters, manual review (no moderation system until needed)
- **Tech stack:** Next.js 15 (App Router) + Supabase (Postgres, Auth, RLS) + Tailwind CSS + Vercel
- **Architecture:** Separated data pipeline — Next.js app for frontend/API, GitHub Actions for OPL sync and content aggregation

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js App (App Router)             │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │  │
│  │  │  Pages   │ │ API Routes│ │ Server       │  │  │
│  │  │ (RSC)    │ │ /api/*    │ │ Actions      │  │  │
│  │  └──────────┘ └───────────┘ └──────────────┘  │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │
              ┌────────▼────────┐
              │    Supabase     │
              │  ┌───────────┐  │
              │  │ PostgreSQL│  │
              │  │   + Auth  │  │
              │  │   + RLS   │  │
              │  └───────────┘  │
              └─────────────────┘
                       ▲
              ┌────────┴────────┐
              │  GitHub Actions │
              │  ┌────────────┐ │
              │  │ OPL Sync   │ │
              │  │ (weekly)   │ │
              │  ├────────────┤ │
              │  │ Content    │ │
              │  │ Aggregator │ │
              │  │ (daily)    │ │
              │  └────────────┘ │
              └─────────────────┘
```

---

## 3. Database Schema

### Core Lifting Data (from OpenPowerlifting)

**`lifters`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| opl_name | text, unique | OPL's identifier |
| name | text | Display name |
| sex | enum (M/F/Mx) | |
| country | text | |
| birth_year | int, nullable | |
| instagram | text, nullable | |

**`meets`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| opl_meet_path | text, unique | e.g. "usapl/2024-raw-nationals" |
| name | text | |
| federation | text | |
| date | date | |
| country | text | |
| city | text | |
| state | text, nullable | |

**`results`** (millions of rows)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| lifter_id | FK → lifters | |
| meet_id | FK → meets | |
| weight_class_kg | text | |
| bodyweight_kg | numeric | |
| equipment | enum (Raw/Wraps/Single-ply/Multi-ply) | |
| age | numeric, nullable | |
| age_class | text, nullable | |
| squat_1 through squat_3 | numeric, nullable | Negative = failed |
| bench_1 through bench_3 | numeric, nullable | Negative = failed |
| deadlift_1 through deadlift_3 | numeric, nullable | Negative = failed |
| best_squat | numeric, nullable | |
| best_bench | numeric, nullable | |
| best_deadlift | numeric, nullable | |
| total | numeric, nullable | |
| dots | numeric, nullable | Pre-calculated by OPL |
| wilks | numeric, nullable | Pre-calculated by OPL |
| glossbrenner | numeric, nullable | Pre-calculated by OPL |
| place | text | "1", "2", "DQ", "DD", etc. |

**Indexes:**
- `results(equipment, sex, weight_class_kg, total DESC)` — leaderboard queries
- `results(lifter_id, date)` — dossier progression charts (join through meets for date)
- `lifters(name)` — full-text search (tsvector)

### Community Layer

**`profiles`** (extends Supabase Auth)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK, FK → auth.users | |
| username | text, unique | |
| avatar_url | text, nullable | |
| created_at | timestamptz | |

**`posts`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → profiles | |
| body_text | text | Max 2000 chars |
| link_url | text, nullable | |
| link_preview | jsonb, nullable | {title, description, thumbnail, domain} |
| lifter_id | FK → lifters, nullable | Tag a lifter |
| meet_id | FK → meets, nullable | Tag a meet |
| vote_count | int, default 0 | Denormalized |
| comment_count | int, default 0 | Denormalized |
| created_at | timestamptz | |

**`post_votes`**
| Column | Type | Notes |
|--------|------|-------|
| post_id | FK → posts | |
| user_id | FK → profiles | |
| value | smallint | +1 or -1 |
| | | Unique constraint on (post_id, user_id) |

**`comments`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| post_id | FK → posts, nullable | |
| lifter_id | FK → lifters, nullable | For dossier discussion |
| meet_id | FK → meets, nullable | For meet discussion |
| user_id | FK → profiles | |
| parent_comment_id | FK → comments, nullable | Threading |
| body_text | text | Max 1000 chars |
| vote_count | int, default 0 | |
| created_at | timestamptz | |

Check constraint: exactly one of (post_id, lifter_id, meet_id) is non-null.

**`comment_votes`** — same pattern as post_votes

**`reports`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → profiles | |
| post_id | FK, nullable | |
| comment_id | FK, nullable | |
| reason | enum (spam/harassment/misinformation/other) | |
| details | text, nullable | |
| status | enum (pending/reviewed/dismissed) | |
| created_at | timestamptz | |

### Content Aggregation

**`content_sources`** — curated creator list
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| platform | enum (youtube/instagram/podcast) | |
| platform_id | text | Channel ID, IG handle, RSS URL |
| creator_name | text | |
| active | bool | |

**`aggregated_content`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| source_id | FK → content_sources | |
| platform | enum | |
| source_url | text, unique | |
| embed_url | text | |
| title | text | |
| thumbnail_url | text, nullable | |
| description | text, nullable | |
| published_at | timestamptz | |
| fetched_at | timestamptz | |

**`content_lifter_tags`** — many-to-many
| Column | Type | Notes |
|--------|------|-------|
| content_id | FK | |
| lifter_id | FK | |
| auto_tagged | bool | true if matched by name |

**`content_meet_tags`** — same pattern for meets

### Sync Metadata

**`sync_metadata`**
| Column | Type | Notes |
|--------|------|-------|
| key | text, PK | e.g. "opl_last_commit" |
| value | text | Commit hash or timestamp |
| updated_at | timestamptz | |

---

## 4. Data Pipeline

### OpenPowerlifting Sync

**Initial Seed:**
1. Clone `gitlab.com/openpowerlifting/opl-data`
2. Parse the pre-built `openpowerlifting.csv`
3. Extract unique lifters → insert into `lifters`
4. Extract unique meets → insert into `meets`
5. Insert all rows into `results` with FKs
6. Store current git commit hash in `sync_metadata`

**Weekly Sync (GitHub Action, Sunday night):**
1. `git pull` on the OPL repo
2. `git diff --name-only <last-commit>..<current-commit>` to find changed meet directories
3. Re-parse only affected meets
4. Upsert into `meets` and `results`, insert new lifters
5. Update stored commit hash
6. Generate dispatches for new records detected

### Content Aggregation (GitHub Action, daily)

1. Read active sources from `content_sources`
2. YouTube: hit YouTube Data API for uploads playlist, fetch new videos since last `fetched_at`
3. Podcasts: parse RSS feed, extract new episodes
4. Instagram: oEmbed endpoint for embed data
5. Insert into `aggregated_content`
6. Auto-tag: match lifter names against title/description → insert into `content_lifter_tags` with `auto_tagged = true`

---

## 5. Pages & Features

### 5A. The Feed (`/`)

**Desktop: three-column layout. Mobile: single column.**

**Left column — Dispatches:**
Auto-generated from data events (not authored):
- New meet results added (triggered by OPL sync)
- New all-time records detected
- Federation news from aggregated content tagged as "news"

**Center column — The Feed:**
Mixed content feed:
- User posts (text + link embeds) ranked by hot algorithm (recency + votes)
- Aggregated content cards (YouTube thumbnails, podcast episodes)
- Each card: author/source, timestamp, votes, comment count, lifter/meet tag chips

**Right column — Upcoming Meets:**
Next 5-10 meets by date from `meets` where `date > now()`.

**Mobile adaptations:**
- Dispatches collapse to horizontal scroll strip at top
- Feed goes full-width
- Upcoming meets becomes a collapsible section below

### 5B. The Leaderboard (`/leaderboard`)

**Filter bar:**
- Federation: All / IPF / USAPL / USPA / SPF / etc. (multi-select)
- Sex: M / F / Mx
- Weight class: dynamic based on federation
- Equipment: All / Raw / Wraps / Single-ply / Multi-ply
- Year range: All-time / Last 2 years / Last 5 years / Custom
- Ranking metric: Total / DOTS / Wilks / By Lift (S/B/D)

**Results table:**
- Columns: Rank, Lifter (linked), BW, Squat, Bench, Deadlift, Total, DOTS
- Top 3 visually emphasized
- Infinite scroll / "Load More" (50 per batch)
- Filters persist in URL query params for shareable links

**Mobile:** Filter bar collapses to a "Filters" bottom sheet button. Table scrolls horizontally with sticky lifter name column.

### 5C. Lifter Dossier (`/lifter/[slug]`)

**Hero:** Name, weight class chip, federation chip, Instagram link, Follow button, Share button.

**Stats bar:** Best Squat, Best Bench, Best Deadlift, Total (highlighted orange). Record badges if applicable.

**Progression chart:** Line chart of total over time. Toggle: All Time / Last 8 Meets. Optional per-lift lines.

**Competition history table:** Date, Meet (linked), BW, SBD, Total, DOTS, Place.

**Content tab:** Aggregated YouTube/IG/podcast tagged to this lifter. Auto-tagged content noted.

**Discussion tab:** Community comments tagged to this lifter. Post form auto-tags `lifter_id`.

### 5D. Meet Hub

**Meet Index (`/meets`):**
Filterable list: search by name, filter by federation/year/country. Sorted by date (newest first). Each row: name, federation, date, location, lifter count.

**Meet Page (`/meet/[slug]`):**
- Header: name, federation, date, location, external link
- Results table: all lifters, filterable by weight class/equipment
  - Columns: Place, Lifter (linked), BW, Class, SBD attempts (red = missed, green = made), Total, DOTS
- Content section: aggregated videos/podcasts about this meet
- Discussion section: community comments about this meet

### 5E. Search (`/search` + global nav bar)

- Global search bar in top nav
- Searches: lifter names (primary), meet names, post content
- Results grouped by type
- Implementation: Supabase full-text search (tsvector) for v1

---

## 6. Community Features

### Auth (v1)
- Supabase Auth: Google OAuth + email/password
- On first login, prompt for username
- No auth required to browse — only to post, vote, comment, follow, report

### Posting
- Text body (required, 2000 char max) + optional link URL
- Auto-fetch link preview via server action (Open Graph extraction)
- Optional lifter/meet tag (autocomplete)
- Posts from lifter/meet pages auto-tag that entity

### Voting
- Upvote/downvote on posts and comments
- One vote per user per item (toggle to remove)
- Net count displayed

### Reporting
- Report button on posts and comments
- Reason: spam / harassment / misinformation / other
- Manual review — no automated action

### Following (v1)
- localStorage-based
- Followed lifters surface tagged content higher in feed
- Migrate to server-side `follows` table in v2

---

## 7. Design Language

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| bg-primary | #0D0D0D | Page background |
| bg-surface | #1A1A1A | Cards, panels |
| bg-surface-alt | #151515 | Alternating table rows |
| border | #2A2A2A | Dividers, borders |
| accent-primary | #E8491A | CTAs, active nav, highlights |
| accent-secondary | #FFB800 | Totals, records, DOTS |
| text-primary | #FFFFFF | Headings |
| text-secondary | #B3B3B3 | Body text |
| text-muted | #666666 | Meta text, timestamps |
| semantic-success | #4CAF50 | Good lift / made attempt |
| semantic-error | #F44336 | Missed lift / failed attempt |
| semantic-record | #FFB800 | PR / record badge |

### Typography
- **Headings:** Bold condensed sans-serif (Barlow Condensed or Oswald)
- **Body:** Clean sans-serif (Inter)
- **Numbers/stats:** Tabular-lining (JetBrains Mono or Barlow with tabular figures)

### Components
- **Cards:** `bg-surface`, subtle border, 8px radius, hover elevation
- **Chips/tags:** Rounded pills, outline style, orange border when active
- **Tables:** Alternating rows, sticky header, orange accent on top-3
- **Buttons:** Orange fill (primary), outline (secondary)
- **Charts:** Orange/white lines on dark bg, minimal gridlines

### Mobile
- Bottom navigation bar: Feed / Leaderboard / Meets / Search
- Cards stack full-width
- Tables scroll horizontally with sticky first column
- Filter bars collapse to bottom sheet

---

## 8. Route Structure

```
/                           → The Feed (home)
/leaderboard                → Global Rankings
/lifter/[slug]              → Lifter Dossier
/meets                      → Meet Index
/meet/[slug]                → Individual Meet Page
/search?q=                  → Search Results
/login                      → Auth
/signup                     → Auth
/profile/[username]         → User Profile
/post/[id]                  → Individual Post Thread
```

---

## 9. v1 vs v2 Scope

| Feature | v1 (Launch) | v2 (Later) |
|---------|-------------|------------|
| Leaderboard | Full filtering, all federations | Saved filter presets |
| Lifter Dossier | Stats + history + content + discussion | Training log, head-to-head compare |
| Feed | User posts + aggregated content + dispatches | Personalized ranking from follows |
| Meet Hub | Historical results + content + discussion | Liftingcast live integration |
| Auth | Supabase email + Google OAuth | Apple sign-in, federation ID linking |
| Following | localStorage | Server-side, notifications |
| Moderation | Report + manual review | Trusted mods, auto-filters |
| Search | Supabase full-text | Meilisearch with typo tolerance |
| Mobile | Responsive web | PWA with offline meet results |
