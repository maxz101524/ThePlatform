# Competition Broadcast Redesign

## Direction

"Competition Broadcast" — a hybrid dark/light design that makes powerlifting data feel like watching a broadcast at a big meet. Dark surfaces for data-heavy sections where numbers are the star, light warm surfaces for social/prose content.

## Design Principles

1. **Numbers are the hero** — totals, S/B/D, DOTS should feel dramatic, not spreadsheet-y
2. **Plate colors glow on dark** — red/blue/yellow accents used on dark backgrounds where they pop
3. **Hybrid surface strategy** — dark panels for data (podium, stat blocks, leaderboard top), light for social (feed, comments, forms)
4. **Editorial restraint with texture** — subtle gradient meshes or radial glows behind hero numbers, not chaotic
5. **Scoreboard energy** — the vibe of a competition display, polished but exciting

## Color System

### Dark palette (data surfaces)
- `--bg-dark`: `#111113` — podium, stat blocks, leaderboard header, nav
- `--bg-dark-elevated`: `#1A1A1F` — cards sitting on dark, table top-10 rows
- `--bg-dark-subtle`: `#232328` — hover states on dark
- `--text-on-dark`: `#F0F0F0`
- `--text-on-dark-muted`: `#8A8A95`

### Light palette (social/prose)
- `--bg-light`: `#F5F5F3` — warm off-white page base for feed/social pages
- `--bg-light-surface`: `#FFFFFF` — cards on light
- `--bg-light-elevated`: `#EDEDEB` — hover on light

### Plate accents (unchanged values, new usage)
- Red `#E8491A`, Blue `#019AD8`, Yellow `#FFB800`, Green `#4CAF50`
- New: 10% opacity tinted backgrounds for stat blocks on dark surfaces
- New: subtle glow/radial effects behind hero numbers

## Surface Strategy by Page

### Leaderboard
- **Full dark page** — the entire leaderboard is a data surface
- Podium: dark cards with rank-colored accent (gold glow for #1, etc.)
- Table: dark background, top-10 rows elevated, alternating subtle row tints
- Filters: dark surface, chips with light borders

### Feed (Home)
- **Light page, dark accent sections**
- Notable Results sidebar: dark cards
- Post cards: light/white
- Create post form: light
- Trending sidebar: light cards

### Profile
- **Hero section dark, rest light**
- Profile header + stats bar: dark panel spanning full width
- Avatar, name, S/B/D stats all on dark with plate-colored numbers
- Media, Competition History, Posts sections: light

### Nav
- **Dark always** — anchors the page, plate-red active indicator pops

## Typography (unchanged fonts, bolder usage)
- Oversized rank numbers on podium (text-7xl or 8xl)
- Bigger mono numbers for totals in stat blocks
- Barlow Condensed uppercase for all section headers and labels
- JetBrains Mono for every number, always

## Component Changes Needed
- Card: needs `variant="dark"` option
- StatBlock: tinted accent backgrounds (squat=red/10, bench=blue/10, etc.)
- Podium cards: dark bg, rank-colored glow/gradient, bigger numbers
- Nav: dark bg, adjust text colors
- Chip/TagChip: light-on-dark variants
- LeaderboardTable: dark bg, styled rows
- PostCard: stays light, minor refinements
- ProfileHeader + StatsBar: dark panel treatment
