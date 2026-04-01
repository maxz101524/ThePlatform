# Social Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the social loop — feed tabs, interactive votes, post detail page with comments, and who-to-follow suggestions.

**Architecture:** Wire existing backend (getFollowedPosts, VoteButtons, voteOnPost) into the UI. Add comment server actions + queries against existing `comments` table. New `/post/[id]` route for threaded discussion. Suggestions query against `profiles` table with weight-class personalization.

**Tech Stack:** Next.js 15 App Router, Supabase, Tailwind CSS 4, TypeScript

**Note:** No test suite exists. Use `npm run build` as the verification gate after each task.

---

### Task 1: Add Comment Type + increment_post_comments RPC

**Files:**
- Modify: `src/lib/types.ts`
- Create: `supabase/migrations/00014_increment_post_comments.sql`

**Step 1: Add Comment interface to types.ts**

Add after the `Post` interface (~line 107):

```typescript
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body_text: string;
  vote_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}
```

**Step 2: Create the migration**

```sql
-- Increment/decrement comment_count on posts (mirrors increment_post_votes)
CREATE OR REPLACE FUNCTION increment_post_comments(p_post_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE posts SET comment_count = comment_count + p_delta WHERE id = p_post_id;
$$;
```

**Step 3: Run migration**

Run: `npx supabase db push` (or apply via Supabase dashboard)

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/lib/types.ts supabase/migrations/00014_increment_post_comments.sql
git commit -m "feat: add Comment type and increment_post_comments RPC"
```

---

### Task 2: Feed Tab Toggle

**Files:**
- Create: `src/components/content/feed-tabs.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create FeedTabs client component**

```typescript
// src/components/content/feed-tabs.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FeedTabs({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("feed") || "for-you";

  if (!isLoggedIn) return null;

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "for-you") {
      params.delete("feed");
    } else {
      params.set("feed", tab);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex gap-0 border-b border-border mb-4">
      <button
        onClick={() => setTab("for-you")}
        className={`px-4 py-2 text-sm font-heading uppercase tracking-wider transition-colors ${
          activeTab === "for-you"
            ? "text-accent-primary border-b-2 border-accent-primary"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        For You
      </button>
      <button
        onClick={() => setTab("following")}
        className={`px-4 py-2 text-sm font-heading uppercase tracking-wider transition-colors ${
          activeTab === "following"
            ? "text-accent-primary border-b-2 border-accent-primary"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        Following
      </button>
    </div>
  );
}
```

**Step 2: Update page.tsx to accept feed param and conditionally fetch**

Key changes to `src/app/page.tsx`:
- Accept `searchParams` prop
- Import `getFollowedPosts` and `FeedTabs`
- If `feed=following` and user is logged in, call `getFollowedPosts(user.id)` instead of `getPosts()`
- When on "following" tab, do NOT interleave aggregated content
- Render `<FeedTabs>` above the feed

```typescript
import { getPosts, getFollowedPosts, getAggregatedContent, getRecentNotableResults } from "@/lib/queries/feed";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { CreatePostForm } from "@/components/content/create-post-form";
import { FeedTabs } from "@/components/content/feed-tabs";
import { Card } from "@/components/ui/card";
import type { Post, AggregatedContent, LeaderboardEntry } from "@/lib/types";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string }>;
}) {
  const params = await searchParams;
  const feedMode = params.feed || "for-you";

  let notableResults: LeaderboardEntry[] = [];
  let content: AggregatedContent[] = [];
  let posts: Post[] = [];

  const [user] = await Promise.all([
    getUser(),
    (async () => {
      try {
        [notableResults, content] = await Promise.all([
          getRecentNotableResults(5),
          getAggregatedContent(10),
        ]);
      } catch {
        // Supabase not configured yet
      }
    })(),
  ]);

  // Fetch posts based on feed mode
  try {
    if (feedMode === "following" && user) {
      posts = await getFollowedPosts(user.id, 10);
    } else {
      posts = await getPosts(10);
    }
  } catch {
    // Supabase not configured yet
  }

  const isFollowingTab = feedMode === "following";

  // Only interleave aggregated content on "For You" tab
  const feedItems: Array<{ type: "post" | "content"; data: Post | AggregatedContent; date: string }> = [
    ...posts.map((p) => ({ type: "post" as const, data: p, date: p.created_at })),
    ...(isFollowingTab ? [] : content.map((c) => ({ type: "content" as const, data: c, date: c.published_at }))),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_280px]">
      {/* Left column — Notable Results */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-accent-primary">
          Notable Results
        </h2>
        {notableResults.map((entry) => (
          <div key={entry.id} className="border-b border-border pb-3">
            <p className="text-xs text-text-muted">{entry.federation} · {entry.meet_date}</p>
            <p className="text-sm font-bold text-text-primary">{entry.lifter_name}</p>
            <p className="text-xs text-accent-secondary font-mono">
              {entry.total}kg total · {entry.equipment} · {entry.weight_class_kg}kg
            </p>
          </div>
        ))}
      </aside>

      {/* Center column — Feed */}
      <div className="space-y-4">
        <FeedTabs isLoggedIn={!!user} />
        {user && <CreatePostForm />}
        {/* Feed items rendered here — see existing pattern */}
      </div>

      {/* Right column — Trending / Suggestions */}
      <aside className="hidden lg:block space-y-4">
        {/* ... existing trending content ... */}
      </aside>
    </div>
  );
}
```

Note: The full page.tsx should preserve existing rendering logic for feedItems, notable results sidebar, and trending sidebar. The key additions are: `searchParams` prop, `FeedTabs` component, conditional fetch, and conditional aggregated content interleaving.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/content/feed-tabs.tsx src/app/page.tsx
git commit -m "feat: add For You / Following feed tab toggle"
```

---

### Task 3: PostCard — Wire VoteButtons + Make Clickable

**Files:**
- Modify: `src/components/content/post-card.tsx`
- Modify: `src/app/page.tsx` (pass `postId` prop)

**Step 1: Update PostCard to accept postId, use VoteButtons, and link to detail**

The PostCard needs to:
- Accept `postId` prop
- Replace static `▲ {voteCount}` / `💬 {commentCount}` with `VoteButtons` (for votes) and a clickable link (for comments)
- Make the card body area clickable to navigate to `/post/[id]`
- Keep VoteButtons interactive in-feed (no navigation on vote click)
- Accept optional `userId` prop to determine if votes should be interactive

Key changes to `src/components/content/post-card.tsx`:
- Add `"use client"` directive (needed for VoteButtons and Link)
- Add `postId: string` to the interface
- Import `VoteButtons` from `./vote-buttons`
- Import `Link` from `next/link`
- Replace the static vote/comment display div with:

```tsx
<div className="flex items-center gap-4 text-xs text-text-muted">
  <VoteButtons postId={postId} voteCount={voteCount} />
  <Link href={`/post/${postId}`} className="hover:text-accent-primary transition-colors">
    💬 {commentCount}
  </Link>
</div>
```

- Wrap the username/body area with a `Link` to `/post/${postId}`:

```tsx
<Link href={`/post/${postId}`} className="block space-y-3">
  <div className="flex items-center gap-2 text-xs text-text-muted">
    <span className="font-bold text-text-secondary">{username}</span>
    <span>·</span>
    <span>{timeAgo}</span>
  </div>
  <p className="text-sm text-text-primary">{bodyText}</p>
  {/* link preview here */}
</Link>
```

**Step 2: Update page.tsx to pass postId to PostCard**

In `src/app/page.tsx`, add `postId={(item.data as Post).id}` to the PostCard usage (around line 66).

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/content/post-card.tsx src/app/page.tsx
git commit -m "feat: wire VoteButtons into PostCard, link to post detail"
```

---

### Task 4: Post Detail Page + Comment Queries

**Files:**
- Create: `src/app/post/[id]/page.tsx`
- Modify: `src/lib/queries/feed.ts` (add `getPostById`)
- Create: `src/lib/queries/comments.ts`

**Step 1: Add getPostById to feed.ts**

Add to `src/lib/queries/feed.ts`:

```typescript
export async function getPostById(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url, display_name)")
    .eq("id", postId)
    .single();

  if (error || !data) return null;
  return data as Post;
}
```

**Step 2: Create comments query file**

```typescript
// src/lib/queries/comments.ts
import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/lib/types";

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(username, avatar_url, display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getComments]", error.message);
    return [];
  }
  return (data as Comment[]) || [];
}
```

**Step 3: Create the post detail page**

```typescript
// src/app/post/[id]/page.tsx
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/queries/feed";
import { getComments } from "@/lib/queries/comments";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { CommentThread } from "@/components/content/comment-thread";
import { CommentForm } from "@/components/content/comment-form";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, comments, user] = await Promise.all([
    getPostById(id),
    getComments(id),
    getUser(),
  ]);

  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link
        href="/"
        className="text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        ← Back to feed
      </Link>

      <PostCard
        postId={post.id}
        username={post.profiles.username}
        bodyText={post.body_text}
        linkUrl={post.link_url}
        linkPreview={post.link_preview}
        voteCount={post.vote_count}
        commentCount={post.comment_count}
        createdAt={post.created_at}
      />

      <Card className="space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-text-secondary">
          Comments ({post.comment_count})
        </h2>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-text-muted">
            <Link href="/login" className="text-accent-primary hover:underline">
              Log in
            </Link>{" "}
            to comment
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-text-muted py-4">Be the first to comment</p>
        ) : (
          <CommentThread comments={comments} currentUserId={user?.id ?? null} postId={post.id} />
        )}
      </Card>
    </div>
  );
}
```

**Note:** This page imports `CommentThread` and `CommentForm` which are built in Task 6. This page will not build until Task 6 is complete. Create it now but verify build after Task 6.

**Step 4: Commit (queries only — page won't build yet)**

```bash
git add src/lib/queries/feed.ts src/lib/queries/comments.ts
git commit -m "feat: add getPostById and getComments queries"
```

---

### Task 5: Comment Server Actions

**Files:**
- Create: `src/app/actions/comments.ts`

**Step 1: Create comment actions**

```typescript
// src/app/actions/comments.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addComment(postId: string, bodyText: string, parentCommentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  if (!bodyText.trim()) throw new Error("Comment cannot be empty");
  if (bodyText.length > 1000) throw new Error("Comment too long (max 1000 characters)");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_comment_id: parentCommentId || null,
    body_text: bodyText.trim(),
  });

  if (error) throw new Error(error.message);

  // Increment comment count on the post
  await supabase.rpc("increment_post_comments", { p_post_id: postId, p_delta: 1 });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id); // RLS also enforces this

  if (error) throw new Error(error.message);

  // Decrement comment count
  await supabase.rpc("increment_post_comments", { p_post_id: postId, p_delta: -1 });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (actions are tree-shaken if not imported)

**Step 3: Commit**

```bash
git add src/app/actions/comments.ts
git commit -m "feat: add addComment and deleteComment server actions"
```

---

### Task 6: Comment UI Components

**Files:**
- Create: `src/components/content/comment-form.tsx`
- Create: `src/components/content/comment-item.tsx`
- Create: `src/components/content/comment-thread.tsx`

**Step 1: Create CommentForm**

```typescript
// src/components/content/comment-form.tsx
"use client";

import { addComment } from "@/app/actions/comments";
import { useState, useTransition } from "react";

interface CommentFormProps {
  postId: string;
  parentCommentId?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentCommentId, onCancel, autoFocus }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await addComment(postId, body, parentCommentId);
        setBody("");
        onCancel?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        maxLength={1000}
        autoFocus={autoFocus}
        className="w-full bg-bg-primary border border-border p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
        rows={3}
      />
      {error && <p className="text-xs text-semantic-error">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="px-4 py-1.5 text-xs font-heading uppercase tracking-wider bg-accent-primary text-bg-primary hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Create CommentItem**

```typescript
// src/components/content/comment-item.tsx
"use client";

import { useState } from "react";
import { deleteComment } from "@/app/actions/comments";
import { CommentForm } from "./comment-form";
import type { Comment } from "@/lib/types";

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  postId: string;
  depth: number;
}

export function CommentItem({ comment, currentUserId, postId, depth }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const timeAgo = getTimeAgo(comment.created_at);
  const canReply = currentUserId && depth < 3;
  const isOwner = currentUserId === comment.user_id;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="space-y-1 py-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-bold text-text-secondary">
            {comment.profiles.display_name || comment.profiles.username}
          </span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
        <p className="text-sm text-text-primary">{comment.body_text}</p>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {canReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="hover:text-accent-primary transition-colors"
            >
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => deleteComment(comment.id, postId)}
              className="hover:text-semantic-error transition-colors"
            >
              Delete
            </button>
          )}
        </div>
        {showReply && (
          <CommentForm
            postId={postId}
            parentCommentId={comment.id}
            onCancel={() => setShowReply(false)}
            autoFocus
          />
        )}
      </div>
    </div>
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

**Step 3: Create CommentThread**

```typescript
// src/components/content/comment-thread.tsx
"use client";

import { CommentItem } from "./comment-item";
import type { Comment } from "@/lib/types";

interface CommentThreadProps {
  comments: Comment[];
  currentUserId: string | null;
  postId: string;
}

export function CommentThread({ comments, currentUserId, postId }: CommentThreadProps) {
  // Build tree from flat list
  const rootComments = comments.filter((c) => !c.parent_comment_id);
  const childMap = new Map<string, Comment[]>();

  for (const comment of comments) {
    if (comment.parent_comment_id) {
      const children = childMap.get(comment.parent_comment_id) || [];
      children.push(comment);
      childMap.set(comment.parent_comment_id, children);
    }
  }

  function renderComment(comment: Comment, depth: number) {
    const children = childMap.get(comment.id) || [];
    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          currentUserId={currentUserId}
          postId={postId}
          depth={depth}
        />
        {children.map((child) => renderComment(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-border">
      {rootComments.map((comment) => renderComment(comment, 0))}
    </div>
  );
}
```

**Step 4: Now also create the post detail page from Task 4**

Create `src/app/post/[id]/page.tsx` with the code from Task 4 Step 3. All imports now resolve.

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds — post detail page and all comment components compile

**Step 6: Commit**

```bash
git add src/components/content/comment-form.tsx src/components/content/comment-item.tsx src/components/content/comment-thread.tsx src/app/post/[id]/page.tsx
git commit -m "feat: add post detail page with threaded comments UI"
```

---

### Task 7: Who-to-Follow Suggestions — Query

**Files:**
- Modify: `src/lib/queries/follow.ts`

**Step 1: Add getSuggestedUsers query**

Add to `src/lib/queries/follow.ts`:

```typescript
export async function getSuggestedUsers(
  userId: string,
  weightClass?: string | null,
  equipment?: string | null,
  limit = 5
): Promise<{
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  weight_class_kg: string | null;
  best_total: number | null;
}[]> {
  const supabase = await createClient();

  // Get already-followed IDs to exclude
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const excludeIds = [userId, ...(followData?.map((f) => f.following_id) || [])];

  // Try personalized first (same weight class or equipment)
  if (weightClass || equipment) {
    let query = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, follower_count, weight_class_kg, best_total")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("follower_count", { ascending: false })
      .limit(limit);

    if (weightClass) {
      query = query.eq("weight_class_kg", weightClass);
    }

    const { data } = await query;

    if (data && data.length >= 3) return data;
  }

  // Fallback: top users by follower count
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, follower_count, weight_class_kg, best_total")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("follower_count", { ascending: false })
    .limit(limit);

  return data || [];
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/queries/follow.ts
git commit -m "feat: add getSuggestedUsers query with weight-class personalization"
```

---

### Task 8: Who-to-Follow Suggestions — UI Component

**Files:**
- Create: `src/components/content/suggestions-module.tsx`
- Modify: `src/app/page.tsx` (add to right sidebar)

**Step 1: Create SuggestionsModule**

```typescript
// src/components/content/suggestions-module.tsx
import { getSuggestedUsers } from "@/lib/queries/follow";
import { FollowButton } from "@/components/profile/follow-button";
import Link from "next/link";

interface SuggestionsModuleProps {
  userId: string;
  weightClass?: string | null;
  equipment?: string | null;
}

export async function SuggestionsModule({ userId, weightClass, equipment }: SuggestionsModuleProps) {
  const suggestions = await getSuggestedUsers(userId, weightClass, equipment);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm uppercase tracking-wider text-text-secondary">
        Who to Follow
      </h3>
      {suggestions.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <Link href={`/u/${user.username}`} className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-text-muted">
              {[user.weight_class_kg && `${user.weight_class_kg}kg`, user.best_total && `${user.best_total}kg total`]
                .filter(Boolean)
                .join(" · ") || `${user.follower_count} followers`}
            </p>
          </Link>
          <FollowButton targetId={user.id} isFollowing={false} />
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Add SuggestionsModule to page.tsx right sidebar**

In `src/app/page.tsx`, import `SuggestionsModule` and render it in the right sidebar when user is logged in:

```tsx
{/* Right column — Trending / Suggestions */}
<aside className="hidden lg:block space-y-6">
  {user && (
    <SuggestionsModule
      userId={user.id}
      weightClass={user.profile?.weight_class_kg}
      equipment={user.profile?.equipment}
    />
  )}
  <div className="space-y-4">
    <h2 className="font-heading text-sm uppercase tracking-wider text-text-primary">
      Trending Content
    </h2>
    {/* ... existing trending cards ... */}
  </div>
</aside>
```

**Note:** `getUser()` in `src/lib/auth.ts` currently returns `username, avatar_url, display_name, opl_name`. It needs `weight_class_kg` and `equipment` added to the select for personalization:

Modify `src/lib/auth.ts` line 11:
```typescript
.select("username, avatar_url, display_name, opl_name, weight_class_kg, equipment")
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/content/suggestions-module.tsx src/app/page.tsx src/lib/auth.ts
git commit -m "feat: add who-to-follow suggestions module with personalization"
```

---

### Task 9: Empty States + Feed Polish

**Files:**
- Modify: `src/app/page.tsx` (empty states for Following tab)
- Modify: `src/components/content/feed-tabs.tsx` (if needed)

**Step 1: Add empty states to page.tsx**

In the center column feed rendering, add conditional empty states:

For the Following tab when user has no follows:
```tsx
{isFollowingTab && posts.length === 0 && (
  <Card className="text-center py-12 space-y-4">
    <p className="text-text-muted">Follow lifters to shape your feed.</p>
    {user && (
      <SuggestionsModule
        userId={user.id}
        weightClass={user.profile?.weight_class_kg}
        equipment={user.profile?.equipment}
      />
    )}
  </Card>
)}
```

For the Following tab when follows exist but no posts:
```tsx
{isFollowingTab && posts.length === 0 && hasFollows && (
  <Card className="text-center py-12">
    <p className="text-text-muted">
      Your lifters haven&apos;t posted yet. Check out{" "}
      <Link href="/" className="text-accent-primary hover:underline">For You</Link>{" "}
      in the meantime.
    </p>
  </Card>
)}
```

To distinguish "no follows" from "follows but no posts", check if `getFollowedPosts` returns empty by also checking if the user has any follows. Add a quick follows count check:

In `src/lib/queries/follow.ts`, add:
```typescript
export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count || 0;
}
```

Then in `page.tsx`, when `feedMode === "following"`, also fetch `getFollowingCount(user.id)` and use it to differentiate the empty states.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/page.tsx src/lib/queries/follow.ts
git commit -m "feat: add empty states for Following feed tab"
```

---

### Task 10: Final Build Verification + Manual Smoke Test

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors

**Step 3: Manual smoke test checklist**

Run: `npm run dev` and verify:
- [ ] Homepage shows "For You" / "Following" tabs when logged in
- [ ] No tabs shown when logged out
- [ ] Clicking "Following" switches feed, URL shows `?feed=following`
- [ ] Vote buttons work in-feed (up/down toggle)
- [ ] Clicking comment count or post body navigates to `/post/[id]`
- [ ] Post detail page shows full post + comment form
- [ ] Can submit a comment, count updates
- [ ] Replies nest correctly (up to 3 levels)
- [ ] "Who to Follow" appears in right sidebar
- [ ] Follow button works from suggestions module
- [ ] Following tab empty state shows when no follows
- [ ] Following tab "no posts yet" state shows when follows exist but no posts

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address smoke test issues"
```
