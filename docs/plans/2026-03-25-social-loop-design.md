# Phase 1: Complete the Social Loop — Design

**Date:** 2026-03-25
**Goal:** Make the feed interactive, followable, and worth revisiting daily. Wire up the social features that are 80% built but not yet connected.

---

## 1. Feed Tab Toggle

- Two tabs at the top of the center feed column: **For You** | **Following**
- State driven by URL search param (`?feed=following`) — shareable, bookmarkable, server-rendered
- **For You:** `getPosts()` — all posts interleaved with aggregated content (current behavior)
- **Following:** `getFollowedPosts()` — only posts from followed users, no aggregated content
- Signed-out users see For You only, no tab toggle
- Empty state on Following when user follows nobody: "Follow lifters to shape your feed" with link to suggestions module

**Component:** `FeedTabs` client component. Feed column in `page.tsx` conditionally fetches server-side based on param.

## 2. Vote Integration

- Replace static vote count display in `PostCard` with the existing `VoteButtons` component
- `VoteButtons` already handles upvote/downvote toggle, optimistic UI, and calls `voteOnPost()` server action
- Pass current user's vote state to `VoteButtons` (requires fetching user's votes for visible posts)
- Add a `getUserVotes(userId, postIds)` query to batch-fetch vote state for the current page

## 3. Post Detail Page + Comments

### Route: `/post/[id]`

- Server component that fetches post by ID with author details
- Renders full post content (same as PostCard but expanded)
- Below post: comment thread

### Comment System

- **Server actions:** `addComment(postId, bodyText, parentCommentId?)`, `deleteComment(commentId)`
- **Query:** `getComments(postId)` — flat fetch, client-side tree assembly from `parent_comment_id`
- **UI components:**
  - `CommentThread` — recursive tree renderer, max 3 levels deep visually (deeper replies flatten)
  - `CommentForm` — text input + submit, appears at top of thread and inline on reply
  - `CommentItem` — single comment with author, timestamp, reply button, delete (own comments)
- **Vote on comments:** Deferred. Schema exists (`comment_votes`) but not wiring it this phase — display only.
- **Count sync:** `addComment` increments `comment_count` on the parent post via DB trigger or RPC (match the pattern used by `increment_post_votes`)

### Navigation

- Post card in feed becomes clickable — clicking the comment count or card body navigates to `/post/[id]`
- Vote buttons remain interactive in-feed (don't require navigation)

## 4. Who to Follow — Suggestions Module

### Placement

- Right sidebar on the feed page (below or replacing current trending content)
- Also shown as the empty state CTA on the Following tab

### Logic (tiered)

1. **Default (no profile stats):** Top 5 most-followed users on the platform, excluding already-followed
2. **Personalized (profile has weight class + equipment):** Users matching same weight class or equipment category, sorted by follower count, excluding already-followed
3. Fallback to default if personalized returns < 3 results

### Query

- `getSuggestedUsers(userId, weightClass?, equipment?, limit)` in `queries/follow.ts`
- Returns: username, display_name, avatar, follower_count, weight_class, best_total

### UI

- Compact card per suggestion: avatar, name, weight class badge, follow button
- "See more" link (deferred — no full discovery page this phase)

## 5. Empty States & Polish

- **Following tab, no follows:** "Follow lifters to shape your feed" + inline suggestions
- **Following tab, follows but no posts:** "Your lifters haven't posted yet. Check out For You in the meantime."
- **Post detail, no comments:** "Be the first to comment"
- **Suggestions module, new user:** Shows top platform users with copy like "Popular lifters"

---

## What's NOT in this phase

- Comment voting (schema exists, wiring deferred)
- Infinite scroll / pagination (current limit-based fetch is fine for MVP)
- Post editing or deletion
- Notifications
- OPL claim/import (Phase 2)
- Leaderboard → profile linking (Phase 2)
- Onboarding flow (Phase 2)

## Existing code to leverage

| Feature | What exists | What's needed |
|---------|------------|---------------|
| Following feed | `getFollowedPosts()` in `queries/feed.ts` | Wire to UI, add tab toggle |
| Vote actions | `voteOnPost()` in `actions/votes.ts` | Integrate `VoteButtons` into `PostCard` |
| Vote UI | `VoteButtons` in `components/content/vote-buttons.tsx` | Pass user vote state |
| Follow actions | `followUser()`/`unfollowUser()` in `actions/follow.ts` | Already works, used by suggestions |
| Comment schema | `comments` + `comment_votes` tables | Server actions, queries, UI components |
| Post creation | `CreatePostForm` | No changes needed |
