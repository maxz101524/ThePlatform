# Competition Broadcast Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the UI from flat white/gray template aesthetic to a "Competition Broadcast" hybrid dark/light design where data surfaces are dark (making plate colors glow) and social/prose surfaces stay light.

**Architecture:** Update the Tailwind theme tokens in globals.css, then systematically update components from primitives (Card, Button, Chip) outward to pages (Leaderboard, Feed, Profile). The nav goes dark everywhere, the leaderboard is full dark, the feed is hybrid (dark sidebar, light center), and the profile has a dark hero with light content below.

**Tech Stack:** Next.js 15, Tailwind CSS 4, existing component library in src/components/

**Reference designs:** Stitch HTML exports live in the conversation history. The design direction doc is at `docs/plans/2026-03-30-competition-broadcast-redesign.md`.

**Verification:** `npm run build` is the test gate (no test suite). After each task, run build to catch type/class errors. Visual verification via `npm run dev` at localhost:3000.

---

## Task 1: Color System & Theme Tokens

**Files:**
- Modify: `src/app/globals.css`

**What to do:**

Add new dark surface tokens alongside existing light ones. Keep all existing accent colors. Add text-on-dark tokens.

New tokens to add inside `@theme {}`:
```css
/* Dark surfaces */
--color-bg-dark: #111113;
--color-bg-dark-elevated: #1A1A1F;
--color-bg-dark-subtle: #232328;

/* Light surfaces (rename concept — existing bg-primary stays) */
--color-bg-light: #F5F5F3;
--color-bg-light-surface: #FFFFFF;

/* Text on dark */
--color-text-on-dark: #F0F0F0;
--color-text-on-dark-muted: #8A8A95;

/* Shadows */
--shadow-glow-gold: 0 0 60px rgba(255, 184, 0, 0.15);
--shadow-glow-silver: 0 0 40px rgba(148, 163, 184, 0.1);
--shadow-glow-bronze: 0 0 40px rgba(205, 127, 50, 0.1);
```

Keep ALL existing tokens (`bg-primary`, `bg-surface`, accent colors, etc.) — they're still used on light surfaces.

**Step 1:** Add the new tokens to globals.css inside the `@theme {}` block.
**Step 2:** Run `npm run build` to verify no issues.
**Step 3:** Commit: `style: add dark surface and glow tokens to theme`

---

## Task 2: Navigation — Floating Dark Pill

**Files:**
- Modify: `src/components/nav/top-nav-inner.tsx`
- Modify: `src/components/nav/mobile-nav-inner.tsx`
- Modify: `src/components/nav/search-bar.tsx`
- Modify: `src/app/layout.tsx`

### Top Nav (`top-nav-inner.tsx`)

Replace the current sticky white bar with a floating dark pill:

**Current header wrapper:**
```
sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md
```

**New header wrapper:**
```
sticky top-4 z-50 w-[95%] mx-auto rounded-full bg-white/5 backdrop-blur-[24px] border border-white/15 shadow-2xl shadow-black/50
```

**Inner container:** Keep `flex h-14 items-center justify-between` but change `max-w-7xl mx-auto px-4` to just `px-8` (pill handles its own width).

**Logo:** Change icon from `⏣` emoji to a dot approach. Use `after:content-['.'] after:text-accent-red` on the text. Make text white: `text-white`.

**Nav links:**
- All links: `text-zinc-500 hover:text-zinc-300` (light on dark)
- Active link: `text-white border-b-2 border-accent-red pb-1`
- Remove the current `text-text-muted` / `text-text-primary` light-mode classes

**User area:**
- Username: `text-accent-red` (was `text-text-primary`)
- Log Out: `text-zinc-500 hover:text-white` (was `text-text-muted`)

### Search Bar (`search-bar.tsx`)

**Current input:**
```
h-9 w-48 border border-border bg-bg-surface-elevated rounded-md
```

**New input:**
```
bg-white/10 border-none text-white rounded-full pl-10 pr-4 py-2 w-48 focus:ring-1 focus:ring-accent-red placeholder:text-zinc-500
```

Add a search icon (Material Symbols or a simple `🔍`/SVG) positioned absolutely inside the input.

### Mobile Nav (`mobile-nav-inner.tsx`)

**Current wrapper:**
```
fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/80 backdrop-blur-md
```

**New wrapper:**
```
fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/30 bg-[#131315]/90 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]
```

**Tab items:**
- Active: `text-accent-red` (keep)
- Inactive: `text-zinc-500 hover:text-zinc-200` (was `text-text-muted`)
- Active tab gets background pill: `bg-zinc-800/40 rounded-xl px-4 py-1`

### Layout (`layout.tsx`)

Update the body/main background. The body should NOT have a single bg color anymore — each page controls its own background. Remove `bg-bg-primary` from the body or main wrapper. The nav now floats, so the main content wrapper may need `pt-2` or similar small offset rather than the current `pt-6` (the nav has `top-4` margin built in).

**Step 1:** Update `globals.css` tokens (Task 1).
**Step 2:** Update `top-nav-inner.tsx` with floating pill styles, dark colors.
**Step 3:** Update `search-bar.tsx` with dark input styling.
**Step 4:** Update `mobile-nav-inner.tsx` with dark treatment.
**Step 5:** Update `layout.tsx` — remove light body bg, adjust spacing for floating nav.
**Step 6:** Run `npm run build`.
**Step 7:** Commit: `style: convert nav to floating dark pill with glassmorphism`

---

## Task 3: UI Primitives — Dark Variants

**Files:**
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/chip.tsx`
- Modify: `src/components/ui/stat-block.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/loading.tsx`

### Card (`card.tsx`)

Add a `variant` prop: `"light"` (default) | `"dark"`.

```tsx
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark";
}
```

- Light (default): `bg-white border border-zinc-200 rounded-xl shadow-sm` (slight update from current: white bg instead of bg-surface, rounded-xl, shadow-sm)
- Dark: `bg-bg-dark-elevated border border-white/5 rounded-xl`

### Chip (`chip.tsx`)

Add dark-aware styling. The `Chip` (interactive filter chip) needs a dark variant for leaderboard filters:
- Current active: `border-accent-red text-accent-red`
- Current inactive: `border-border text-text-muted`
- Dark inactive: `border-white/10 text-zinc-400`

The `TagChip` needs to work on both dark and light surfaces:
- On dark: `border-white/10 text-zinc-400` for default/equipment
- Keep tested (`text-accent-green`) and fresh (`text-accent-blue`) — these work on both surfaces

Consider adding a `dark` boolean prop or relying on parent context.

### StatBlock (`stat-block.tsx`)

Major upgrade — each stat gets a plate-colored tinted background with a left border. New design from Stitch:

```tsx
interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: "red" | "blue" | "yellow" | "default";  // plate color
  subtitle?: string;  // e.g. "RANK #12 GLOBAL"
}
```

Each accent maps to:
- `red` (squat): `bg-accent-red/10 border-l-4 border-accent-red`, label/unit in `text-accent-red`
- `blue` (bench): `bg-accent-blue/10 border-l-4 border-accent-blue`, label/unit in `text-accent-blue`
- `yellow` (deadlift): `bg-accent-yellow/10 border-l-4 border-accent-yellow`, label/unit in `text-accent-yellow`
- `default` (total): `bg-accent-red/10 border-l-4 border-accent-red`, label/unit in `text-accent-red` (total uses primary red from Stitch)

Container: `p-6 rounded-r-xl` with the tinted bg + left border.
Value: `font-mono text-4xl md:text-5xl font-extrabold text-white`.
Subtitle: `mt-2 text-zinc-500 font-mono text-xs` (for rank info).

### Button (`button.tsx`)

Minor updates:
- Keep existing 3 variants but update secondary for dark contexts:
  - Secondary: `bg-white/10 backdrop-blur border border-white/10 text-white hover:bg-white/20` (for dark surfaces like profile header)
- Primary stays: `bg-accent-red text-white`
- Ghost: `text-zinc-500 hover:text-white` on dark, keep existing on light
- Update rounded from `rounded-md` to `rounded-lg`

### Loading/Skeleton (`loading.tsx`)

Update `bg-bg-surface` to work on dark: add variant or use `bg-current-surface` pattern. Simplest: `bg-zinc-800 animate-pulse rounded-md` for dark, keep existing for light.

**Step 1:** Update `card.tsx` with variant prop.
**Step 2:** Update `chip.tsx` with dark-aware styling.
**Step 3:** Update `stat-block.tsx` with plate-colored tinted design.
**Step 4:** Update `button.tsx` with rounded-lg and secondary dark variant.
**Step 5:** Update `loading.tsx` for dark surfaces.
**Step 6:** Run `npm run build`.
**Step 7:** Commit: `style: add dark variants to UI primitives (Card, Chip, StatBlock, Button)`

---

## Task 4: Leaderboard Page — Full Dark Scoreboard

**Files:**
- Modify: `src/app/leaderboard/page.tsx`
- Modify: `src/app/leaderboard/podium.tsx`
- Modify: `src/app/leaderboard/leaderboard-table.tsx`
- Modify: `src/app/leaderboard/leaderboard-filters.tsx`

### Page (`page.tsx`)

Wrap the entire leaderboard in a dark container:
```tsx
<div className="bg-bg-dark min-h-screen -mx-4 -mt-6 px-4 pt-12 md:px-8 pb-32">
  <div className="max-w-7xl mx-auto">
    {/* existing content */}
  </div>
</div>
```

The negative margins (`-mx-4 -mt-6`) break out of the layout container so the dark bg goes edge-to-edge. Adjust as needed based on layout.tsx changes.

Remove or restyle the page title — the Stitch design doesn't have a big "LEADERBOARD" title, it relies on the nav active state. If keeping a title, style it for dark: `text-white`.

### Filters (`leaderboard-filters.tsx`)

**Current wrapper:**
```
flex flex-wrap items-end gap-3 bg-bg-surface rounded-lg p-4 shadow-soft border border-border
```

**New design:** No wrapper card — filters sit directly on the dark background in a grid layout.

```
grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-16
```

Each filter group:
- Label: `font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500`
- Select: `w-full bg-bg-dark-elevated border-none text-text-on-dark font-heading font-semibold text-xs rounded-lg focus:ring-1 focus:ring-accent-red py-3`

Tested toggle: A toggle switch in a dark card `bg-bg-dark-elevated rounded-lg` with `peer-checked:bg-accent-red` styling.

The dynamic subtitle below filters: style for dark — `text-text-on-dark-muted`.

### Podium (`podium.tsx`)

Major redesign. Key changes:

**Layout:** Change from equal-width grid to a flex layout with different widths:
```
flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4
```
- #1 card: `w-full md:w-[40%]` — taller (h-[480px] or min-h)
- #2 and #3: `w-full md:w-[30%]` — shorter (h-[360px] or min-h)

**Card styling:**
- All cards: `bg-bg-dark-elevated rounded-t-xl relative overflow-hidden flex flex-col justify-end`
- Bottom border colored by rank: `border-b-4 border-rank-gold` / `border-rank-silver` / `border-rank-bronze`

**Rank glow effect:**
- #1: `shadow-glow-gold` + an absolutely positioned radial glow div:
  ```html
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-rank-gold/15 rounded-full blur-[100px]" />
  ```
- #2: Similar with silver color, smaller
- #3: Similar with bronze color, smaller

**Rank numbers:** Giant, faded in background:
- #1: `font-mono text-[10rem] font-black text-rank-gold/10 italic` (absolute positioned)
- #2/#3: `font-mono text-8xl font-black text-rank-{color}/10 italic`

**Lifter name:** `font-headline text-2xl font-bold` for #2/#3, `font-headline text-5xl font-extrabold` for #1.

**Chips:** `text-[10px] font-heading border border-white/10 px-2 py-0.5 rounded-sm text-zinc-400` — for #1, use `border-rank-gold/30 text-rank-gold`.

**Total (hero number):**
- #1: `font-mono text-7xl font-black text-rank-gold` with "KG" in `text-2xl font-heading opacity-60`
- #2/#3: `font-mono text-5xl font-bold text-rank-{color}` with "KG" in `text-sm`

**S/B/D breakdown:** Grid of 3 columns with labels:
```
<div class="grid grid-cols-3 gap-2 border-t border-white/5 pt-6">
  <div>
    <p class="text-[10px] font-heading text-zinc-500 uppercase tracking-widest mb-1">SQUAT</p>
    <p class="font-mono text-plate-red font-bold text-lg">372.5</p>
  </div>
  ...
</div>
```
For #1, the numbers are `text-3xl`. For #2/#3, `text-lg`.

**DOTS, federation, date:** `text-zinc-500 font-mono text-xs`

### Table (`leaderboard-table.tsx`)

**Wrapper:**
```
overflow-x-auto rounded-xl
```
Remove the border and shadow-soft — on dark bg, the table blends in.

**Header row:**
```
font-heading text-xs uppercase tracking-widest text-zinc-500
```
Active sort column: `text-accent-yellow`

**Body rows:**
- Default: transparent bg, `border-b border-white/5` between rows
- Top 10: `bg-bg-dark-elevated` for emphasis
- Hover: `hover:bg-bg-dark-subtle transition-colors`
- All text defaults to `text-text-on-dark`

**Column colors (unchanged concept, updated for dark):**
- Rank: `font-mono font-bold text-text-on-dark` (top 10) / `text-text-on-dark-muted` (rest)
- Squat: `font-mono text-accent-red`
- Bench: `font-mono text-accent-blue`
- Deadlift: `font-mono text-accent-yellow`
- Total: `font-mono font-bold text-white`
- DOTS: `font-mono text-text-on-dark-muted` (or `text-accent-yellow` when sorted)
- Fed/Date/Meet: `text-xs text-text-on-dark-muted`

**Step 1:** Update `page.tsx` with dark wrapper.
**Step 2:** Update `leaderboard-filters.tsx` for dark surface.
**Step 3:** Rewrite `podium.tsx` with new layout, glow effects, dark cards.
**Step 4:** Update `leaderboard-table.tsx` for dark surface.
**Step 5:** Run `npm run build`.
**Step 6:** Visual check at `/leaderboard`.
**Step 7:** Commit: `style: redesign leaderboard as full-dark Competition Broadcast scoreboard`

---

## Task 5: Feed Page — Hybrid Dark/Light

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/content/feed-tabs.tsx`
- Modify: `src/components/content/post-card.tsx`
- Modify: `src/components/content/vote-buttons.tsx`
- Modify: `src/components/content/create-post-form.tsx`
- Modify: `src/components/content/suggestions-module.tsx`
- Modify: `src/components/content/aggregated-content-card.tsx`

### Page Layout (`page.tsx`)

Set the page background to light: wrap in `bg-bg-light min-h-screen`.

**Left sidebar (Notable Results):** Convert to dark treatment.
- Sidebar wrapper: `bg-bg-dark text-text-on-dark p-6 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto rounded-xl`
- Section heading: `font-heading text-xl font-bold text-white tracking-tight` with a yellow bolt icon
- Each result card: `bg-bg-dark-elevated p-4 border-l-2 border-accent-yellow hover:bg-bg-dark-subtle transition-all`
- Total: `font-mono text-2xl font-bold text-accent-yellow`
- S/B/D mini grid: 3 columns with `bg-zinc-900/80 py-1` cells, plate-colored or white numbers

**Center column:** Stays light. No changes to the container.

**Right sidebar:** Stays light.
- "Trending Content" heading: `font-heading text-xs tracking-[0.2em] font-bold text-zinc-400 uppercase`
- Article titles: `font-heading text-sm font-bold text-zinc-900 hover:text-accent-red`
- Source name: `font-mono text-[10px] text-zinc-500 uppercase`
- "Who to Follow" in a white card: `bg-white p-5 rounded-xl border border-zinc-200 shadow-sm`

### Feed Tabs (`feed-tabs.tsx`)

**Current:** Pill-style bg-bg-surface wrapper.
**New:** Simple underline tabs on light bg.

```
<div className="flex gap-8 mb-6 border-b border-zinc-200">
  <button className={active ? "font-heading text-lg font-bold text-zinc-900 border-b-4 border-accent-red pb-2 uppercase" : "font-heading text-lg font-bold text-zinc-400 pb-2 uppercase hover:text-zinc-600"}>
    {label}
  </button>
</div>
```

### Post Card (`post-card.tsx`)

Update to use light Card variant (which is now `bg-white rounded-xl shadow-sm border border-zinc-200`).

**Username:** `font-heading text-base font-bold text-zinc-900 uppercase`
**Timestamp:** `font-mono text-[10px] text-zinc-500 uppercase`
**Body text:** `font-body text-zinc-700 text-sm leading-relaxed`
**Link preview:** `border border-zinc-100 rounded-xl overflow-hidden flex bg-zinc-50 hover:bg-zinc-100` — thumbnail on left, text on right.

### Vote Buttons (`vote-buttons.tsx`)

Replace the current `▲`/`▼` text glyphs with a contained pill:
```
<div className="flex items-center gap-1 bg-zinc-50 rounded-lg px-2 py-1">
  <button>↑</button>  (or arrow SVG/icon)
  <span className="font-mono text-xs font-bold text-zinc-700">{count}</span>
  <button>↓</button>
</div>
```

Comment icon: `💬` → use a chat bubble icon or keep emoji, with `font-mono text-xs text-zinc-500`.

### Create Post Form (`create-post-form.tsx`)

White card wrapper. Textarea with `placeholder:text-zinc-400 border-none focus:ring-0`. Red "POST" button: `bg-accent-red text-white font-heading px-8 py-2 rounded-lg uppercase`.

### Suggestions Module (`suggestions-module.tsx`)

Keep the existing structure but update colors for light surface:
- Heading: `font-heading text-xs tracking-[0.2em] font-bold text-zinc-400 uppercase`
- Follow button: `font-heading text-[10px] font-bold text-accent-red tracking-widest hover:underline uppercase`

**Step 1:** Update `page.tsx` — dark sidebar, light center/right, bg-bg-light wrapper.
**Step 2:** Update `feed-tabs.tsx` with underline style.
**Step 3:** Update `post-card.tsx` styling.
**Step 4:** Update `vote-buttons.tsx` with pill design.
**Step 5:** Update `create-post-form.tsx` styling.
**Step 6:** Update `suggestions-module.tsx` and `aggregated-content-card.tsx`.
**Step 7:** Run `npm run build`.
**Step 8:** Commit: `style: redesign feed as hybrid dark sidebar / light content`

---

## Task 6: Profile Page — Dark Hero, Light Content

**Files:**
- Modify: `src/components/profile/profile-header.tsx`
- Modify: `src/components/profile/stats-bar.tsx`
- Modify: `src/components/profile/media-showcase.tsx`
- Modify: `src/components/profile/competition-history.tsx`
- Modify: `src/components/profile/follow-button.tsx`
- Modify: `src/components/profile/edit-profile-form.tsx`
- Modify: `src/app/u/[username]/page.tsx` (the profile page itself)

### Profile Page Layout

The profile page needs a structural change: the top section (header + stats) wraps in a full-width dark panel, and everything below sits on light bg.

In the profile page file, restructure:
```tsx
<>
  {/* Dark Hero */}
  <div className="bg-bg-dark pt-20 pb-16 px-6 md:px-12 -mx-4 -mt-6">
    <div className="max-w-7xl mx-auto">
      <ProfileHeader ... />
      <StatsBar ... />
    </div>
  </div>

  {/* Light Content */}
  <div className="bg-bg-light min-h-[500px]">
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
      <MediaShowcase ... />
      <CompetitionHistory ... />
      <Posts ... />
    </div>
  </div>
</>
```

### Profile Header (`profile-header.tsx`)

Major visual upgrade for dark surface:

- Avatar: `w-[140px] h-[140px] rounded-xl object-cover border-4 border-accent-red shadow-xl` (bigger, rounded-xl, red border)
- Display name: `font-heading text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter text-white` (MASSIVE)
- Username: `font-mono text-accent-red text-sm tracking-widest uppercase`
- Bio: `font-body text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed`
- Follower stats: `text-zinc-400` numbers, `text-zinc-500` labels
- Layout: `flex flex-col md:flex-row items-center md:items-end gap-8 mb-12`

Follow button: `bg-white/10 backdrop-blur px-8 py-3 rounded-lg font-heading font-bold uppercase text-white border border-white/10`
Edit Profile button: `bg-accent-red px-8 py-3 rounded-lg font-heading font-bold uppercase text-white`

### Stats Bar (`stats-bar.tsx`)

Use the new plate-colored `StatBlock` components (updated in Task 3):

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
  <StatBlock label="Squat" value={profile.best_squat} accent="red" subtitle={`RANK #${squat_rank} GLOBAL`} />
  <StatBlock label="Bench" value={profile.best_bench} accent="blue" subtitle={`RANK #${bench_rank} GLOBAL`} />
  <StatBlock label="Deadlift" value={profile.best_deadlift} accent="yellow" subtitle={`RANK #${dl_rank} GLOBAL`} />
  <StatBlock label="Total" value={profile.best_total} accent="default" subtitle={`${profile.dots} DOTS SCORE`} />
</div>
```

Note: The rank values (`RANK #12 GLOBAL`) are aspirational — we may not have this data yet. If not available, pass the DOTS score or weight class as subtitle instead. Don't block on this.

Remove the weight class / equipment chips from inside StatsBar — they can move into the header area or be dropped (the Stitch design doesn't prominently feature them in the stat block area).

### Media Showcase (`media-showcase.tsx`)

Light section. Update styling:
- Section heading: `font-heading text-3xl font-black uppercase tracking-tighter text-zinc-900 flex items-center gap-3`
- Media cards: `bg-white rounded-xl overflow-hidden shadow-sm border border-zinc-200 hover:shadow-xl transition-all`
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-6`

### Competition History (`competition-history.tsx`)

Light section. Update:
- Section heading: same as Media
- Table wrapper: `bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden`
- Table header: `bg-zinc-50 border-b border-zinc-200`, cells in `font-heading uppercase text-zinc-500 text-xs tracking-widest`
- Rows: `hover:bg-zinc-50 transition-colors`, dividers `divide-y divide-zinc-100`
- Total column: `text-accent-red font-extrabold font-mono`
- Place column: gold (#1) / silver (#2) / bronze (#3) colored

### Follow Button (`follow-button.tsx`)

Update for dark hero surface:
- Following: `bg-white/10 text-white border border-white/10`
- Not following: `bg-white/10 text-white border border-white/10 hover:bg-white/20`

**Step 1:** Restructure profile page layout (dark hero / light content split).
**Step 2:** Update `profile-header.tsx` for dark surface with massive name.
**Step 3:** Update `stats-bar.tsx` to use new plate-colored StatBlocks.
**Step 4:** Update `media-showcase.tsx` for light section styling.
**Step 5:** Update `competition-history.tsx` for light section styling.
**Step 6:** Update `follow-button.tsx` and `edit-profile-form.tsx` for dark surface.
**Step 7:** Run `npm run build`.
**Step 8:** Commit: `style: redesign profile with dark hero section and plate-colored stats`

---

## Task 7: Auth Pages & Post Detail

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/post/[id]/page.tsx`
- Modify: `src/components/content/comment-item.tsx`
- Modify: `src/components/content/comment-form.tsx`
- Modify: `src/app/search/page.tsx`

### Login & Signup

These are simple form pages. Give them the light treatment:
- Page bg: `bg-bg-light min-h-screen`
- Form card: `bg-white rounded-xl shadow-sm border border-zinc-200 p-8`
- Heading: `font-heading text-3xl font-bold uppercase text-zinc-900`
- Inputs: `w-full border border-zinc-200 bg-white rounded-lg px-4 py-3 text-sm focus:border-accent-red focus:outline-none`
- Submit button: `bg-accent-red text-white font-heading uppercase rounded-lg w-full py-3`

### Post Detail (`post/[id]/page.tsx`)

Light page. Use same light bg. The post card and comment thread use light styling. Update:
- Page wrapper: `bg-bg-light min-h-screen`
- Back link: `text-zinc-500 hover:text-zinc-900`
- Comments heading: `font-heading text-sm uppercase tracking-wider text-zinc-500`

### Comment Components

Light surface styling:
- Comment wrapper: `py-3` with `border-l border-zinc-200 pl-4 ml-6` for nested
- Username: `font-heading text-sm font-bold text-zinc-900 uppercase`
- Body: `text-sm text-zinc-700`
- Actions: `text-xs text-zinc-400 hover:text-accent-red`
- Comment form textarea: `border border-zinc-200 bg-white rounded-lg`

### Search Page

Light treatment similar to auth pages.

**Step 1:** Update login and signup pages.
**Step 2:** Update post detail page and comment components.
**Step 3:** Update search page.
**Step 4:** Run `npm run build`.
**Step 5:** Commit: `style: update auth, post detail, search pages for new design system`

---

## Task 8: Final Polish & Build Verification

**Files:**
- Possibly: any file with remaining old-style classes

**Steps:**
1. Run `npm run build` — fix any errors.
2. Run `npm run dev` and visually check all pages:
   - `/leaderboard` — full dark, podium glows, table plate colors
   - `/` (feed) — dark sidebar, light center, vote pills
   - `/u/[username]` (profile) — dark hero, plate-colored stats, light content
   - `/login` and `/signup` — light form pages
   - `/post/[id]` — light post detail with comments
   - `/search` — light search page
   - Mobile nav — dark bottom bar
3. Check responsive behavior (mobile nav, podium stacking, sidebar hiding).
4. Fix any visual inconsistencies.
5. Run `npm run lint` and fix issues.
6. Final commit: `style: complete Competition Broadcast redesign polish`

---

## Implementation Notes

- **Don't add Material Symbols font** — Stitch used it but we don't need an icon library. Use simple text/emoji or SVG for the few icons needed (search, arrows, etc.).
- **Don't add Space Grotesk font** — Stitch added it but it's not in our design system. Stick with our 4 fonts.
- **Stitch images are placeholders** — don't import any of the Google-hosted placeholder images.
- **Keep all existing functionality** — this is purely a CSS/styling change. Don't change data fetching, server actions, or component logic.
- **The Stitch HTML uses Tailwind CDN with custom config** — we use Tailwind 4 with `@theme`. All color references should use our CSS variable tokens (e.g. `bg-bg-dark` not `bg-[#111113]`), except for one-off values.
