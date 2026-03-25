import { getPosts, getFollowedPosts, getAggregatedContent, getRecentNotableResults } from "@/lib/queries/feed";
import { getFollowingCount } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { CreatePostForm } from "@/components/content/create-post-form";
import { FeedTabs } from "@/components/content/feed-tabs";
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_280px]">
      {/* Left column — Notable Results */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-accent-primary">
          Notable Results
        </h2>
        {notableResults.map((entry) => (
          <div key={entry.id} className="border-b border-border pb-3">
            <p className="text-xs text-text-muted">{entry.federation} · {entry.meet_date}</p>
            <p className="text-sm font-bold text-text-primary">
              {entry.lifter_name}
            </p>
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
        {isFollowingTab && posts.length === 0 ? (
          followingCount === 0 ? (
            <Card className="text-center py-12 space-y-6">
              <div className="space-y-2">
                <p className="text-text-primary font-heading text-lg uppercase tracking-wider">
                  Follow lifters to shape your feed
                </p>
                <p className="text-sm text-text-muted">
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
            <Card className="text-center py-12">
              <p className="text-text-muted">
                Your lifters haven&apos;t posted yet. Check out{" "}
                <Link href="/" className="text-accent-primary hover:underline">
                  For You
                </Link>{" "}
                in the meantime.
              </p>
            </Card>
          )
        ) : feedItems.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted">No content yet. Check back soon!</p>
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
          <h2 className="font-heading text-sm uppercase tracking-wider text-text-primary">
            Trending Content
          </h2>
          {content.slice(0, 3).map((c) => (
            <Card key={c.id} className="p-3 space-y-1">
              <a
                href={c.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors line-clamp-2"
              >
                {c.title}
              </a>
              <p className="text-xs text-text-muted">{c.content_sources.creator_name}</p>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}
