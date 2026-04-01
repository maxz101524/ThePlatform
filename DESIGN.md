# Design System Document

## 1. Overview & Creative North Star: "The Competition Gallery"

This design system transforms powerlifting data into a clean, exhibition-quality experience. Our Creative North Star is **"The Competition Gallery"**—a philosophy that treats every lifter's entry, every kilogram, and every competition as a curated exhibit in a well-lit gallery space.

We embrace **light surfaces**, **soft shadows**, **generous radius**, and **plate-coded accents** to create a premium, approachable interface. The competition plate colors (Red, Blue, Yellow) serve as the semantic backbone for lift data, while the overall aesthetic stays calm, spacious, and editorial.

---

## 2. Colors

The palette is rooted in a high-contrast light base, allowing semantic "Plate Colors" to act as sophisticated beacons of information.

### Tonal Foundations
*   **Background (`#FFFFFF`):** The primary white canvas.
*   **Surface (`#F8F9FA`):** Cards, sections, and containers.
*   **Surface Elevated (`#F1F3F5`):** Hover states, secondary containers, and active rows.
*   **Text Primary (`#1A1A1A`):** Headlines, key data, strong emphasis.
*   **Text Secondary (`#4A4A4A`):** Body text, descriptions.
*   **Text Muted (`#717171`):** Labels, captions, tertiary information.

### Semantic Plate Accents
These colors map directly to competition plates and are used surgically for data visualization:
*   **Squat (Red, `#E8491A`):** Primary actions, squat data, active navigation.
*   **Bench (Blue, `#019AD8`):** Info states, bench data, freshness indicators.
*   **Deadlift (Yellow, `#FFB800`):** Highlights, deadlift data, totals emphasis.
*   **Tested (Green, `#4CAF50`):** Tested lifter status, success states.

### Plate-Coded Stats Rule
When displaying lift data, always use the following mapping:
*   **Squat:** `text-accent-red` + `font-mono`
*   **Bench:** `text-accent-blue` + `font-mono`
*   **Deadlift:** `text-accent-yellow` + `font-mono`
*   **Total:** `text-text-primary` + `font-mono` + `font-bold`

### Borders & Shadows
*   **Border (`#E5E7EB`):** Subtle, light gray for card and input boundaries.
*   **Soft Shadow:** `0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)` — for cards and floating elements.

---

## 3. Typography

Our typography strategy balances the geometric modernity of **Lexend** with the condensed authority of **Barlow Condensed**, the clarity of **Inter**, and the precision of **JetBrains Mono**.

*   **Display (Lexend):** Bold, wide, and authoritative. Use `font-display` for hero numbers, athlete names at large scale, or major rank indicators.
*   **Headlines (Barlow Condensed):** Uppercase, tight tracking. Use `font-heading` for section titles, navigation labels, and card headers.
*   **Body (Inter):** High-readability sans-serif for descriptions, meet locations, and general content.
*   **Numeric Data (JetBrains Mono):** All weights, kilograms, DOTS scores, and dates *must* use `font-mono`. Tabular figures ensure perfect column alignment.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by stacking surface tiers and soft shadows:
1.  **Level 0 (Base):** `bg-bg-primary` (white)
2.  **Level 1 (Sections/Cards):** `bg-bg-surface` + `border border-border` + `shadow-soft` + `rounded-lg`
3.  **Level 2 (Elevated/Hover):** `bg-bg-surface-elevated`

### Radius
All interactive and container elements use rounded corners:
*   **Large (12px):** Cards, modals, popovers — `rounded-lg`
*   **Medium (8px):** Buttons, inputs, selects — `rounded-md`
*   **Small (4px):** Chips, tags, badges — `rounded-sm`

### Shadows
Use `shadow-soft` on cards and floating elements. Avoid heavy drop shadows.

---

## 5. Components

### Cards & Surfaces
*   **Base Card:** `bg-bg-surface border border-border rounded-lg p-4 shadow-soft`
*   **Hover State:** `hover:bg-bg-surface-elevated transition-colors duration-200`

### Navigation
*   **TopNav:** `h-14 sticky top-0 bg-white/80 backdrop-blur-md border-b border-border z-50`
*   **Active Links:** `border-b-2 border-accent-red text-text-primary font-bold`
*   **Mobile Nav:** Fixed bottom, same glassmorphism treatment.

### Buttons
*   **Primary:** `bg-accent-red text-white rounded-md` with Barlow Condensed uppercase text.
*   **Secondary:** `border border-border text-text-primary rounded-md` — ghost outline style.
*   **Tertiary/Ghost:** `text-text-muted hover:text-text-primary` — no background.

### Chips & Tags
*   **Interactive Chip:** `border rounded-sm px-3 py-1 text-xs font-heading uppercase`
*   **Tag Chip:** `border rounded-sm px-1.5 py-0.5 text-[10px] font-heading uppercase`
*   Tested variant: `border-accent-green/30 text-accent-green`
*   Fresh variant: `border-accent-blue/30 text-accent-blue`

### Inputs & Forms
*   **Base Input:** `border border-border bg-bg-surface-elevated rounded-md px-3 py-2 text-text-primary focus:border-accent-red focus:outline-none`

### Competition Plates (Lift Data Chips)
Used for Squat, Bench, and Deadlift values:
*   Style: `font-mono text-sm` with the respective plate accent color.
*   Optional: `2px` left border or `10%` opacity background tint.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use `rounded-lg` (12px) on cards and `rounded-md` (8px) on buttons/inputs.
*   **DO** use `shadow-soft` on cards to create gentle elevation.
*   **DO** use JetBrains Mono for every single number.
*   **DO** use plate colors consistently: Red=Squat, Blue=Bench, Yellow=Deadlift.
*   **DO** use `border border-border` on cards and containers for subtle definition.

### Don't:
*   **DON'T** use heavy drop shadows or `shadow-lg`/`shadow-xl`.
*   **DON'T** use plate colors as large background fills — they're accent strikes only.
*   **DON'T** center-align everything. Use left-aligned blocks for text and right-aligned blocks for data.
*   **DON'T** use dark backgrounds. The system is light-first.
