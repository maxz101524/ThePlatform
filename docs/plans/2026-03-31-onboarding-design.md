# Onboarding Flow Design

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

After signup, redirect users to `/onboarding` to collect powerlifting profile data (display name, sex, weight class, equipment, OPL name) before they hit the feed. This personalizes suggestions and makes the Following tab immediately useful.

---

## Flow

```
signup → router.push("/onboarding") → /onboarding → submit → redirect("/")
                                                   → skip  → link to "/"
```

1. `signup/page.tsx` changes its success redirect from `/` to `/onboarding`
2. `/onboarding` (server component) checks auth:
   - No session → `redirect("/login")`
   - Profile already has `weight_class_kg` AND `equipment` → `redirect("/")` (idempotent, already onboarded)
   - Otherwise → render `<OnboardingForm>` with pre-filled OPL name from profile
3. On submit → `completeOnboarding` server action saves fields + calls `redirect("/")`
4. "Skip for now" is a plain `<Link href="/">` — no action required

---

## Fields

| Field | Type | Notes |
|---|---|---|
| Display name | Text input | Optional. Shown instead of username on profile |
| Sex | Radio chips | M / F / Mx (maps to `sex_enum`) |
| Weight class | Select dropdown | Filtered by sex selection client-side |
| Equipment | Radio chips | Raw / Wraps / Single-ply / Multi-ply (maps to `equipment_enum`) |
| OPL name | Text input | Optional. Pre-filled if entered during signup |

### Weight class options (by sex)

- **M:** 53, 59, 66, 74, 83, 93, 105, 120, 120+
- **F:** 43, 47, 52, 57, 63, 69, 76, 84, 84+
- **Mx / unselected:** show all combined, sorted numerically

Weight class options update client-side when sex is changed (via `useState` for selected sex).

---

## Components

### `src/app/onboarding/page.tsx` (server component)
- Calls `getUser()`. Redirects to `/login` if no session.
- Checks `profile.weight_class_kg && profile.equipment` — if both set, `redirect("/")`.
- Passes `oplName: profile?.opl_name ?? null` to `<OnboardingForm>`.

### `src/app/onboarding/onboarding-form.tsx` (client component)
- `"use client"` — handles sex state to filter weight class options, useTransition for submit pending state.
- Props: `{ oplName: string | null }`
- On successful submit (no error returned), calls `router.push("/")` + `router.refresh()`.
- "Skip for now" → `<Link href="/">`.

### `src/app/actions/profile.ts` — add `completeOnboarding`
New server action alongside `updateProfile`:
```ts
export async function completeOnboarding(_prevState: { error: string | null }, formData: FormData)
```
- Auth-guards (returns `{ error }` if not logged in)
- Reads: `display_name`, `sex`, `weight_class_kg`, `equipment`, `opl_name`
- Updates `profiles` row for `user.id`
- On success: `revalidatePath("/")` then returns `{ error: null }` (client handles redirect)

---

## UI Design

Follows the Competition Gallery design system (dark surfaces, Barlow Condensed headings).

- Full-screen centered layout: `bg-bg-dark min-h-screen`
- Platform wordmark at top (same as nav: `THE PLATFORM.`)
- Headline: `"SET UP YOUR PROFILE"` — Barlow Condensed, uppercase, large
- Subtitle: `"Help us personalize your feed and suggestions"`
- Card: `bg-bg-dark-elevated rounded-xl border border-white/10 p-8` containing the form
- Equipment + Sex rendered as clickable radio chips (like leaderboard filter chips) — styled with `border border-white/20`, active state `bg-accent-red border-accent-red text-white`
- Weight class: native `<select>` styled dark (matching existing input styles)
- Submit button: `"Let's Go"` — full-width, `bg-accent-red`, Barlow Condensed uppercase
- Below button: `"Skip for now →"` as a muted text link

---

## Files Changed

| Action | File |
|---|---|
| Create | `src/app/onboarding/page.tsx` |
| Create | `src/app/onboarding/onboarding-form.tsx` |
| Modify | `src/app/actions/profile.ts` (add `completeOnboarding`) |
| Modify | `src/app/signup/page.tsx` (redirect to `/onboarding`) |
