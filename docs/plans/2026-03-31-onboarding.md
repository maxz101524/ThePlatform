# Onboarding Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After signup, redirect users to `/onboarding` to collect display name, sex, weight class, equipment, and OPL name before hitting the feed.

**Architecture:** Four files touched — add a `completeOnboarding` server action, create the server-component page (auth guard + already-onboarded guard), create the client-form component, and update signup to redirect to `/onboarding`. No new DB migrations needed; all fields already exist on the `profiles` table.

**Tech Stack:** Next.js 15 App Router, Supabase Auth, `@supabase/ssr`, Tailwind CSS 4, TypeScript. Build check: `npx tsc --noEmit` + `npm run build`. No test suite — use the build as the gate.

---

### Task 1: Add `completeOnboarding` server action

**Files:**
- Modify: `src/app/actions/profile.ts`

The existing `updateProfile` action doesn't redirect on success — it returns `{ error }` and the client handles navigation. `completeOnboarding` follows the same pattern so the client form can call `router.push("/")` on success. It only writes the four onboarding-specific fields.

**Step 1: Append the action to the file**

Open `src/app/actions/profile.ts` and add this after the existing `parseNum` function at the bottom:

```ts
export async function completeOnboarding(
  _prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Must be logged in" };

  const display_name = (formData.get("display_name") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const weight_class_kg = (formData.get("weight_class_kg") as string) || null;
  const equipment = (formData.get("equipment") as string) || null;
  const opl_name = (formData.get("opl_name") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, sex, weight_class_kg, equipment, opl_name })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/actions/profile.ts
git commit -m "feat(onboarding): add completeOnboarding server action"
```

---

### Task 2: Create the onboarding page (server component)

**Files:**
- Create: `src/app/onboarding/page.tsx`

This is a server component that guards the route and passes the user's existing OPL name (if any) down to the form.

**Step 1: Create the file**

```tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Already onboarded — skip back to feed
  if (user.profile?.weight_class_kg && user.profile?.equipment) {
    redirect("/");
  }

  return (
    <OnboardingForm oplName={user.profile?.opl_name ?? null} />
  );
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Error about missing `OnboardingForm` module (that's fine — Task 3 creates it)

**Step 3: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add onboarding page with auth + idempotency guards"
```

---

### Task 3: Create the onboarding form (client component)

**Files:**
- Create: `src/app/onboarding/onboarding-form.tsx`

This is the interactive form. Sex selection filters the weight class dropdown client-side. On success, redirects to `/`.

Weight class options by sex:
- **M:** `["53", "59", "66", "74", "83", "93", "105", "120", "120+"]`
- **F:** `["43", "47", "52", "57", "63", "69", "76", "84", "84+"]`
- **Mx / none:** combined unique list sorted numerically: `["43", "47", "52", "53", "57", "59", "63", "66", "69", "74", "76", "83", "84", "84+", "93", "105", "120", "120+"]`

Equipment options (matching `equipment_enum`): `Raw`, `Wraps`, `Single-ply`, `Multi-ply`
Sex options (matching `sex_enum`): `M`, `F`, `Mx`

**Step 1: Create the file**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeOnboarding } from "@/app/actions/profile";

const WEIGHT_CLASSES: Record<string, string[]> = {
  M: ["53", "59", "66", "74", "83", "93", "105", "120", "120+"],
  F: ["43", "47", "52", "57", "63", "69", "76", "84", "84+"],
  Mx: ["43", "47", "52", "53", "57", "59", "63", "66", "69", "74", "76", "83", "84", "84+", "93", "105", "120", "120+"],
};
const ALL_WEIGHT_CLASSES = WEIGHT_CLASSES.Mx;

const EQUIPMENT = ["Raw", "Wraps", "Single-ply", "Multi-ply"];
const SEXES = ["M", "F", "Mx"];

interface OnboardingFormProps {
  oplName: string | null;
}

export function OnboardingForm({ oplName }: OnboardingFormProps) {
  const [sex, setSex] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const weightOptions = sex ? WEIGHT_CLASSES[sex] : ALL_WEIGHT_CLASSES;

  function handleSubmit(formData: FormData) {
    // Inject chip selections into formData (they're not real inputs)
    formData.set("sex", sex);
    formData.set("equipment", equipment);
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-bg-dark min-h-screen -mx-4 -mt-4 flex items-start justify-center pb-20">
      <div className="w-full max-w-md pt-16 px-4">
        {/* Wordmark */}
        <p className="text-center font-heading font-black text-white text-xl mb-10 after:content-['.'] after:text-accent-red">
          THE PLATFORM
        </p>

        <div className="bg-bg-dark-elevated border border-white/10 rounded-xl p-8 space-y-7">
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-3xl font-bold uppercase text-white tracking-tight">
              Set Up Your Profile
            </h1>
            <p className="text-sm text-zinc-500">
              Help us personalize your feed and suggestions.
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {/* Display name */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Display Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                name="display_name"
                type="text"
                placeholder="Your real name or nickname"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <span className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Sex
              </span>
              <div className="flex gap-2">
                {SEXES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(sex === s ? "" : s)}
                    className={`px-5 py-2 rounded-md font-heading text-xs font-bold uppercase tracking-wider border transition-colors ${
                      sex === s
                        ? "bg-accent-red border-accent-red text-white"
                        : "border-white/20 text-zinc-400 hover:border-white/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight class */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Weight Class (kg)
              </label>
              <select
                name="weight_class_kg"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Select weight class</option>
                {weightOptions.map((wc) => (
                  <option key={wc} value={wc}>{wc} kg</option>
                ))}
              </select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <span className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Equipment
              </span>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setEquipment(equipment === eq ? "" : eq)}
                    className={`px-4 py-2 rounded-md font-heading text-xs font-bold uppercase tracking-wider border transition-colors ${
                      equipment === eq
                        ? "bg-accent-red border-accent-red text-white"
                        : "border-white/20 text-zinc-400 hover:border-white/40"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* OPL name */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                OpenPowerlifting Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                name="opl_name"
                type="text"
                placeholder="e.g. John Haack"
                defaultValue={oplName ?? ""}
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
              />
              <p className="text-[11px] text-zinc-600">
                Links your account to competition history from OpenPowerlifting.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-accent-red text-white font-heading font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-accent-red/90 disabled:opacity-50 transition-colors text-sm"
              >
                {isPending ? "Saving..." : "Let's Go"}
              </button>
              <div className="text-center">
                <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Skip for now →
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/onboarding/onboarding-form.tsx
git commit -m "feat(onboarding): add onboarding form with sex/equipment chips and weight class dropdown"
```

---

### Task 4: Update signup to redirect to `/onboarding`

**Files:**
- Modify: `src/app/signup/page.tsx:38`

One line change — `router.push("/")` becomes `router.push("/onboarding")`.

**Step 1: Make the change**

In `handleSignup`, replace:
```ts
router.push("/");
```
with:
```ts
router.push("/onboarding");
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/signup/page.tsx
git commit -m "feat(onboarding): redirect new users to /onboarding after signup"
```

---

### Task 5: Manual smoke test

Start the dev server: `npm run dev`

1. Go to `/signup` — create a new account (use a throwaway email)
2. Confirm you land on `/onboarding` (not `/`)
3. Verify the form renders: display name input, sex chips (M/F/Mx), weight class dropdown, equipment chips, OPL name input, "Let's Go" button, "Skip for now →" link
4. Select sex "M" → weight class dropdown should show men's classes (53, 59, 66…)
5. Select sex "F" → weight class dropdown should update to women's classes (43, 47, 52…)
6. Fill in all fields and submit → should redirect to `/`
7. Navigate back to `/onboarding` — should immediately redirect to `/` (already onboarded guard)
8. Sign out, go to `/onboarding` without auth → should redirect to `/login`
9. "Skip for now →" link should navigate to `/` without saving anything

**Step 4: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix(onboarding): <description of any fix>"
```
