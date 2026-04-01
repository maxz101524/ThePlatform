# Auth Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up end-to-end Supabase auth so users can sign up, log in, persist sessions across pages, and see their auth state in the nav — unblocking all social features.

**Architecture:** Add Next.js middleware that refreshes Supabase auth tokens on every request (standard `@supabase/ssr` pattern). Update the nav components to read auth state server-side and render login/logout accordingly. Add a logout server action. Guard login/signup pages from already-authenticated users.

**Tech Stack:** Next.js 15 (App Router), Supabase Auth via `@supabase/ssr` ^0.9.0, server components + server actions.

---

### Task 1: Supabase Middleware Client Helper

**Files:**
- Modify: `src/lib/supabase/server.ts`

The existing `createClient()` works for server components and server actions but NOT for middleware — middleware needs to read/write cookies on the `NextRequest`/`NextResponse` objects rather than the Next.js `cookies()` API.

**Step 1: Add `createMiddlewareClient` to server.ts**

Add this function after the existing `createClient`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `server.ts`

**Step 3: Commit**

```bash
git add src/lib/supabase/server.ts
git commit -m "feat(auth): add middleware Supabase client helper"
```

---

### Task 2: Auth Middleware

**Files:**
- Create: `src/middleware.ts`

This is the critical missing piece. Without it, Supabase auth tokens expire silently and server components never see a logged-in user.

**Step 1: Create the middleware**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Refresh the auth token — this is the whole point of the middleware.
  // Must be called on every request so server components get a valid session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): add Next.js middleware for Supabase session refresh"
```

---

### Task 3: Logout Server Action

**Files:**
- Create: `src/app/actions/auth.ts`

**Step 1: Create the logout action**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

**Step 2: Commit**

```bash
git add src/app/actions/auth.ts
git commit -m "feat(auth): add logout server action"
```

---

### Task 4: Update TopNav with Auth State

**Files:**
- Modify: `src/components/nav/top-nav.tsx`

The TopNav is currently a client component with no auth awareness. We need it to show the user's identity when logged in. Strategy: create a server component wrapper that fetches auth state, passing it down to the client nav.

**Step 1: Create a server wrapper and update the client nav**

Replace the entire `top-nav.tsx` with a server component that fetches auth, then renders a client `TopNavInner`:

The server component (`TopNav`):
- Calls `getUser()` from `@/lib/auth`
- Extracts `username` and `display_name` if logged in
- Passes `user: { username, displayName } | null` to `TopNavInner`

The client component (`TopNavInner`):
- Receives `user` prop
- Renders nav links as before
- Right side: if `user` is null → show "Log In" link; if user exists → show display name/username + logout form button
- Logout uses a `<form action={logout}>` pattern to call the server action

Key UI details:
- "Log In" link: `ghost` variant style, same font-heading uppercase as nav links
- Logged-in state: username as a link to `/u/{username}`, plus a ghost "Log Out" button
- Logout uses a `<form>` with the logout server action (works without JS)
- SearchBar stays on the right, user state goes after it

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/nav/top-nav.tsx
git commit -m "feat(auth): show login/user state in TopNav"
```

---

### Task 5: Update MobileNav with Auth State

**Files:**
- Modify: `src/components/nav/mobile-nav.tsx`

Same pattern as TopNav — needs to know if user is logged in so the "Profile" tab links to `/u/{username}` instead of `/login`.

**Step 1: Create server wrapper for MobileNav**

Same approach: server component fetches auth, passes user prop to client `MobileNavInner`. Profile tab href changes based on auth state.

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/nav/mobile-nav.tsx
git commit -m "feat(auth): show user profile link in MobileNav when logged in"
```

---

### Task 6: Guard Login/Signup Pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`

If a user is already logged in and navigates to `/login` or `/signup`, redirect them to `/`.

**Step 1: Add redirect check to login page**

At the top of `LoginPage`, before the form renders, check if user is already authenticated. Since login is a client component, add a `useEffect` that checks auth state on mount and redirects via `router.push("/")`.

**Step 2: Same for signup page**

Same pattern in `SignupPage`.

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/login/page.tsx src/app/signup/page.tsx
git commit -m "feat(auth): redirect authenticated users away from login/signup"
```

---

### Task 7: Final Verification

**Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Lint check**

Run: `npm run lint`
Expected: No lint errors

**Step 3: Manual smoke test checklist**

After `npm run dev`:
1. Visit `/` — TopNav shows "Log In" link
2. Click "Log In" → taken to `/login` form
3. Click "Sign up" link → taken to `/signup`
4. Create account → redirected to `/`, TopNav now shows username + "Log Out"
5. Visit `/login` while logged in → redirected to `/`
6. Click "Log Out" → back to `/login`, TopNav shows "Log In" again
7. Mobile: bottom nav "Profile" tab links to `/login` when logged out, `/u/{username}` when logged in

**Step 4: Commit any final fixes, then done**
