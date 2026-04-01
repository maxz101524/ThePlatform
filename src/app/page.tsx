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
    <div className="bg-bg-dark min-h-screen -mx-4 -mt-4 pb-20 md:pb-6">
      <div className="max-w-[960px] mx-auto px-4 pt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,600px)_300px]">
        {/* Center column — Feed */}
        <div>
          <Suspense fallback={null}>
            <FeedTabs isLoggedIn={!!user} />
          </Suspense>
          {user && <CreatePostForm username={user.profile?.username ?? user.email?.split("@")[0] ?? "U"} />}

          <div className="divide-y divide-white/10">
            {isFollowingTab && posts.length === 0 ? (
              followingCount === 0 ? (
                <Card variant="dark" className="text-center py-12 space-y-6">
                  <div className="space-y-2">
                    <p className="text-white font-heading text-lg uppercase tracking-wider">
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
                <Card variant="dark" className="text-center py-12">
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
              <Card variant="dark" className="text-center py-12">
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
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block space-y-5 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Notable Results — compact */}
          {notableResults.length > 0 && (
            <div className="bg-bg-dark-elevated rounded-xl border border-white/10 p-4 space-y-3">
              <h3 className="font-heading text-xs tracking-[0.2em] font-bold text-zinc-500 uppercase">
                Notable Results
              </h3>
              {notableResults.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="font-heading text-xs font-bold text-white uppercase truncate">{entry.lifter_name}</p>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase">{entry.federation}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-accent-yellow shrink-0">{entry.total}kg</span>
                </div>
              ))}
              <Link href="/leaderboard" className="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-1">
                See full leaderboard &rarr;
              </Link>
            </div>
          )}

          {/* Who to Follow */}
          {user && (
            <SuggestionsModule
              userId={user.id}
              weightClass={user.profile?.weight_class_kg}
              equipment={user.profile?.equipment}
            />
          )}

          {/* Trending Content — numbered list */}
          {content.length > 0 && (
            <div className="bg-bg-dark-elevated rounded-xl border border-white/10 p-4 space-y-3">
              <h3 className="font-heading text-xs tracking-[0.2em] font-bold text-zinc-500 uppercase">
                Trending
              </h3>
              {content.slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex gap-3 group">
                  <span className="font-mono text-sm font-bold text-zinc-600 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-xs font-bold text-white group-hover:text-accent-red transition-colors leading-snug line-clamp-2 block"
                    >
                      {c.title}
                    </a>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase mt-0.5">{c.content_sources.creator_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer links */}
          <div className="text-[10px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-1 px-1">
            <span>About</span>
            <span>Terms</span>
            <span>Privacy</span>
            <span>&copy; {new Date().getFullYear()} The Platform</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
