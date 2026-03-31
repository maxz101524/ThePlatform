import { getPosts, getFollowedPosts, getAggregatedContent, getRecentNotableResults } from "@/lib/queries/feed";
import { getFollowingCount } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { CreatePostForm } from "@/components/content/create-post-form";
import { FeedTabs } from "@/components/content/feed-tabs";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { SuggestionsModule } from "@/components/content/suggestions-module";
import Link from "next/link";
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
  let followingCount = 0;

  const [user] = await Promise.all([
    getUser(),
    (async () => {
      try {
        [notableResults, content] = await Promise.all([
          getRecentNotableResults(5),
          getAggregatedContent(10),
        ]);
      } catch {
        // Supabase not configured yet — render empty feed
      }
    })(),
  ]);

  // Fetch posts based on feed mode
  try {
    if (feedMode === "following" && user) {
      [posts, followingCount] = await Promise.all([
        getFollowedPosts(user.id, 10),
        getFollowingCount(user.id),
      ]);
    } else {
      posts = await getPosts(10);
    }
  } catch {
    // Supabase not configured yet — render empty feed
  }

  const isFollowingTab = feedMode === "following";

  // Interleave posts and content for the feed (skip aggregated content on "following" tab)
  const feedItems: Array<{ type: "post" | "content"; data: Post | AggregatedContent; date: string }> = [
    ...posts.map((p) => ({ type: "post" as const, data: p, date: p.created_at })),
    ...(feedMode === "following"
      ? []
      : content.map((c) => ({ type: "content" as const, data: c, date: c.published_at }))),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-bg-light min-h-screen -mx-4 -mt-4 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_280px]">
        {/* Left column — Notable Results */}
        <aside className="hidden lg:block bg-bg-dark text-text-on-dark p-6 rounded-xl sticky top-24 h-[calc(100vh-120px)] overflow-y-auto space-y-4">
          <h2 className="font-heading text-xl font-bold text-white tracking-tight uppercase">
            NOTABLE RESULTS
          </h2>
          {notableResults.map((entry) => (
            <div key={entry.id} className="bg-bg-dark-elevated p-4 border-l-2 border-accent-yellow hover:bg-bg-dark-subtle transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="font-heading text-xs tracking-widest text-zinc-500 uppercase">{entry.federation}</span>
                <span className="font-mono text-[10px] text-zinc-600">{entry.meet_date}</span>
              </div>
              <p className="font-display text-sm font-semibold text-white uppercase">{entry.lifter_name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-bold text-accent-yellow tracking-tighter">{entry.total}</span>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">KG TOTAL</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                <div className="bg-zinc-900/80 py-1">
                  <span className="block font-mono text-xs text-white">{entry.best_squat?.toFixed(1) ?? "—"}</span>
                  <span className="text-[8px] font-heading text-zinc-500 uppercase">SQ</span>
                </div>
                <div className="bg-zinc-900/80 py-1">
                  <span className="block font-mono text-xs text-white">{entry.best_bench?.toFixed(1) ?? "—"}</span>
                  <span className="text-[8px] font-heading text-zinc-500 uppercase">BP</span>
                </div>
                <div className="bg-zinc-900/80 py-1">
                  <span className="block font-mono text-xs text-white">{entry.best_deadlift?.toFixed(1) ?? "—"}</span>
                  <span className="text-[8px] font-heading text-zinc-500 uppercase">DL</span>
                </div>
              </div>
            </div>
          ))}
        </aside>

        {/* Center column — Feed */}
        <div className="space-y-4">
          <Suspense fallback={null}>
            <FeedTabs isLoggedIn={!!user} />
          </Suspense>
          {user && <CreatePostForm />}
          {isFollowingTab && posts.length === 0 ? (
            followingCount === 0 ? (
              <Card variant="light" className="text-center py-12 space-y-6">
                <div className="space-y-2">
                  <p className="text-zinc-900 font-heading text-lg uppercase tracking-wider">
                    Follow lifters to shape your feed
                  </p>
                  <p className="text-sm text-zinc-500">
                    Discover athletes, follow their journey, and see their posts here.
                  </p>
                </div>
                {user && (
                  <SuggestionsModule
                    userId={user.id}
                    weightClass={user.profile?.weight_class_kg}
                    equipment={user.profile?.equipment}
                  />
                )}
              </Card>
            ) : (
              <Card variant="light" className="text-center py-12">
                <p className="text-zinc-500">
                  Your lifters haven&apos;t posted yet. Check out{" "}
                  <Link href="/" className="text-accent-red hover:underline">
                    For You
                  </Link>{" "}
                  in the meantime.
                </p>
              </Card>
            )
          ) : feedItems.length === 0 ? (
            <Card variant="light" className="text-center py-12">
              <p className="text-zinc-500">No content yet. Check back soon!</p>
            </Card>
          ) : (
            feedItems.map((item) =>
              item.type === "post" ? (
                <PostCard
                  key={`post-${(item.data as Post).id}`}
                  postId={(item.data as Post).id}
                  username={(item.data as Post).profiles.username}
                  bodyText={(item.data as Post).body_text}
                  linkUrl={(item.data as Post).link_url}
                  linkPreview={(item.data as Post).link_preview}
                  voteCount={(item.data as Post).vote_count}
                  commentCount={(item.data as Post).comment_count}
                  createdAt={(item.data as Post).created_at}
                />
              ) : (
                <AggregatedContentCard
                  key={`content-${(item.data as AggregatedContent).id}`}
                  {...(item.data as AggregatedContent)}
                />
              )
            )
          )}
        </div>

        {/* Right column — Suggestions + Trending */}
        <aside className="hidden lg:block space-y-6">
          {user && (
            <SuggestionsModule
              userId={user.id}
              weightClass={user.profile?.weight_class_kg}
              equipment={user.profile?.equipment}
            />
          )}
          <div className="space-y-4">
            <h2 className="font-heading text-xs tracking-[0.2em] font-bold text-zinc-400 uppercase">
              Trending Content
            </h2>
            {content.slice(0, 3).map((c) => (
              <div key={c.id} className="group cursor-pointer">
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-heading text-sm font-bold text-zinc-900 group-hover:text-accent-red transition-colors leading-tight line-clamp-2 block"
                >
                  {c.title}
                </a>
                <p className="font-mono text-[10px] text-zinc-500 uppercase mt-1">{c.content_sources.creator_name}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
