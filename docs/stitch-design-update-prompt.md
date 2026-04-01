# Prompt for Stitch: Update DESIGN.md for The Platform

## Context

You are updating the design system document (`DESIGN.md`) for **The Platform**, a powerlifting community hub. The existing document ("The Iron Ledger") was written before any code existed. The product has since been built and evolved significantly. Your job is to update the design system to reflect what actually exists, fix inconsistencies, and extend it to cover new component categories that didn't exist when the original was written.

---

## What The Product Actually Is Now

The Platform is a Next.js 15 app with these surfaces:

1. **Home Feed** — 3-column layout (Notable Results | Feed + Tabs | Suggestions + Trending). Two feed modes: "For You" (global) and "Following" (posts from followed users). Posts can have link previews, votes, and comments.
2. **Leaderboard** — Full-width rankings page with a podium (top 3 in 2-1-3 layout) and a tiered table (top 10 elevated). Filters for sex, equipment, weight class, federation, tested status.
3. **Athlete Profiles** — `/u/[username]` with avatar, stats bar, media showcase (YouTube/Instagram/TikTok embeds), competition history table, and user posts.
4. **Post Detail** — `/post/[id]` with full post, threaded comments (3-level nesting), and comment form.
5. **Auth** — Login and signup pages with email/password + Google OAuth.
6. **Search** — User search with avatar + stats results.

---

## Current Tech Stack

- **Framework:** Next.js 15 App Router (server components by default, `"use client"` only for interactivity)
- **Styling:** Tailwind CSS 4 with `@theme` tokens in `globals.css`
- **Fonts loaded via `next/font/google`:**
  - `--font-heading`: Barlow Condensed (400, 600, 700) — all UI labels, headings, buttons, nav
  - `--font-body`: Inter — body text, post content, descriptions
  - `--font-mono`: JetBrains Mono — all numeric data (lifts, weights, DOTS, vote counts)
- **Colors (from `@theme`):**
  - Backgrounds: `bg-primary` (#0D0D0D), `bg-surface` (#1A1A1A), `bg-surface-elevated` (#222222)
  - Text: `text-primary` (#FFF), `text-secondary` (#B3B3B3), `text-muted` (#666)
  - Accents: `accent-primary` (#E8491A rusted orange), `accent-secondary` (#FFB800 gold), `accent-tertiary` (#019AD8 blue)
  - Semantic: `success` (#4CAF50), `error` (#F44336)
  - Medals: `rank-gold`, `rank-silver`, `rank-bronze`
  - Border: `border` (#2A2A2A)
  - Unused: `bg-surface-alt` (#151515) — defined but never referenced

---

## Design Principles Already In Practice

These rules are followed consistently across the codebase:

1. **0px border radius everywhere** — Sharp corners on all elements. Currently violated in ~15 places (see violations section).
2. **No shadows** — Zero `shadow-*` classes anywhere. All depth via tonal layering: `bg-primary` → `bg-surface` → `bg-surface-elevated`.
3. **Typography hierarchy:**
   - `font-heading uppercase tracking-wider` for all UI chrome (labels, headings, buttons, nav items, section titles)
   - `font-body` for all content text (post bodies, bios, descriptions)
   - `font-mono` for all numeric data (lifts, totals, DOTS, vote counts, weights)
4. **Interaction model:** Only `transition-colors` for hover effects. No animation, transforms, or opacity transitions (except `disabled:opacity-50`).
5. **Sticky nav:** Uses `bg-bg-primary/95 backdrop-blur` for glassmorphism effect on scroll.

---

## Component Inventory (New Since Original Doc)

The original DESIGN.md only covered buttons, leaderboard rows, input fields, and the "Record Chip." The product now has these additional component categories that need design system documentation:

### Feed Components
- **FeedTabs** — Two-button tab toggle (For You / Following). Active: `text-accent-primary` with `border-b-2` underline. Inactive: `text-text-muted`. Container has `bg-bg-surface` tonal background.
- **PostCard** — Card with author metadata (username · timestamp), body text, optional link preview (border container with thumbnail + title/description), and action row (VoteButtons + comment count link).
- **VoteButtons** — ▲/▼ symbols flanking a monospace vote count. `text-text-muted hover:text-accent-primary`.
- **CreatePostForm** — Collapsed: clickable Card placeholder. Expanded: textarea + URL input + Cancel/Post buttons.
- **AggregatedContentCard** — Card with optional thumbnail (aspect-video, full-width) + platform label + title + creator name.

### Comment Components
- **CommentForm** — Textarea + Post button. Supports reply mode (with Cancel).
- **CommentItem** — Author + timestamp + body + Reply/Delete actions. Nested comments indent with `ml-6 border-l border-border pl-4`.
- **CommentThread** — Recursive tree renderer, depth-limited to 3 levels for replies.

### Profile Components
- **ProfileHeader** — Avatar (square, 80x80) + name (3xl bold uppercase) + @username + bio + follower/following counts + action buttons (Edit or Follow).
- **StatsBar** — Horizontal flex of `StatBlock` components (label + monospace value) + weight class/equipment badges.
- **FollowButton** — Two-state toggle: "Follow" (filled `bg-accent-primary`) ↔ "Following" (outlined, hover reveals red for unfollow).
- **MediaShowcase** — 2-column grid of embedded media (YouTube iframes, Instagram embeds, TikTok embeds) with add/remove for own profile.
- **CompetitionHistory** — Responsive table with meet results. Total column always `text-accent-secondary`. Rows have subtle `border-b border-border/50` separator.
- **EditProfileForm** — Stacked form fields with labels (font-heading uppercase) above inputs.

### Social Components
- **SuggestionsModule** — "Who to Follow" sidebar section with user cards (avatar + name + stats + FollowButton).

### Navigation Components
- **TopNav** — Sticky header with logo, nav links, search bar, user info. `h-14`.
- **MobileNav** — Fixed bottom bar with icon tabs (◉ ◈ ⌕ ◎). `h-16`, `md:hidden`.
- **SearchBar** — Input with search icon, routes to `/search?q=`.

### Utility Components
- **Card** — Base container primitive: `border border-border bg-bg-surface p-4`.
- **Button** — Primary/secondary/ghost variants with sm/md/lg sizes. Always `font-heading uppercase tracking-wider`.
- **Chip** — Interactive toggle chip for filters. Active: `border-accent-primary text-accent-primary`.
- **TagChip** — Display-only micro badge (10px). Variants: default, tested (green tint), equipment, fresh (blue tint).
- **StatBlock** — Label (xs, muted) + Value (3xl, mono, bold). Highlight mode uses `text-accent-secondary`.
- **Skeleton/TableSkeleton** — Loading placeholders with `animate-pulse bg-bg-surface`.

---

## Current Design System Violations (Fix These)

These elements currently violate the stated design rules:

### Rounded Corners (should be 0px)
- Login/signup form inputs: `rounded-md`
- Search bar input: `rounded-md`
- Search results cards: `rounded-lg`
- Search results avatars: `rounded-full`
- Search results badge pills: `rounded-full`
- StatsBar container: `rounded-lg`
- StatsBar weight class/equipment badges: `rounded-full`
- FollowButton: `rounded-md`

### Border Dividers (should use tonal shifts)
- Notable Results sidebar: `border-b border-border` between items
- Competition History rows: `border-b border-border/50`
- Comment thread nesting: `border-l border-border` (arguable — this is structural, not decorative)
- Nav header: `border-b border-border`
- Mobile nav: `border-t border-border`

---

## Layout Patterns to Document

- **3-column feed:** `grid-cols-[240px_1fr_280px]` (desktop), single column (mobile). Sidebars hidden on mobile.
- **Post detail:** `max-w-2xl mx-auto` centered single column.
- **Profile:** Full-width sections stacking vertically.
- **Leaderboard:** Podium (2-1-3 grid reorder on desktop, 2-col on mobile) → table.
- **Main container:** `max-w-7xl mx-auto px-4 pb-20 pt-6 md:pb-6`.
- **Responsive breakpoints:** sm (640), md (768), lg (1024). No xl.

---

## What The Updated DESIGN.md Should Cover

1. **Creative North Star** — Update "The Iron Ledger" metaphor to include the social/community dimension (not just leaderboard). The platform is now also a social feed, not just a rankings publication.
2. **Color System** — Document all tokens, note `bg-surface-alt` is unused (keep or remove), document opacity patterns (e.g., `accent-primary/80` for hover states, `border-border/50` for subtle separators).
3. **Typography** — Document the three-font system with specific rules for when each is used. Note: the original doc referenced Epilogue and Space Grotesk, but the actual implementation uses Barlow Condensed and JetBrains Mono. Update accordingly.
4. **Elevation & Depth** — Keep the "tonal layering" principle. Document the 3-tier system. Clarify the backdrop-blur exception for sticky navigation.
5. **Component Library** — Expand from the original 4 component types to cover all ~20 components listed above. For each: visual description, states (default/hover/active/disabled/focus), color usage, typography choices.
6. **Layout System** — Document the grid patterns, spacing scale, and responsive behavior.
7. **Interaction Model** — Document hover, focus, disabled, loading, and transition patterns.
8. **Do's and Don'ts** — Update with learnings from the build. Add rules about form inputs inheriting font-body, the comment threading indent pattern, the two-state follow button pattern, and the tab navigation pattern.
9. **Violations to Fix** — List the remaining rounded corner violations as a cleanup backlog.

---

## Tone

The document should feel like a premium design system reference — authoritative but practical. It's used by engineers (not designers), so every rule should have a concrete implementation note (Tailwind class or CSS variable). Keep the editorial energy of the original but ground it in what's actually built.
