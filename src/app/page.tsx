import { getPosts, getAggregatedContent, getRecentNotableResults } from "@/lib/queries/feed";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { CreatePostForm } from "@/components/content/create-post-form";
import { Card } from "@/components/ui/card";
import type { Post, AggregatedContent, LeaderboardEntry } from "@/lib/types";

export default async function FeedPage() {
  let notableResults: LeaderboardEntry[] = [];
  let content: AggregatedContent[] = [];
  let posts: Post[] = [];

  const [user] = await Promise.all([
    getUser(),
    (async () => {
      try {
        [notableResults, content, posts] = await Promise.all([
          getRecentNotableResults(5),
          getAggregatedContent(10),
          getPosts(10),
        ]);
      } catch {
        // Supabase not configured yet — render empty feed
      }
    })(),
  ]);

  // Interleave posts and content for the feed
  const feedItems: Array<{ type: "post" | "content"; data: Post | AggregatedContent; date: string }> = [
    ...posts.map((p) => ({ type: "post" as const, data: p, date: p.created_at })),
    ...content.map((c) => ({ type: "content" as const, data: c, date: c.published_at })),
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
        {user && <CreatePostForm />}
        {feedItems.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted">No content yet. Check back soon!</p>
          </Card>
        ) : (
          feedItems.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={`post-${(item.data as Post).id}`}
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

      {/* Right column — Trending / Suggestions */}
      <aside className="hidden lg:block space-y-4">
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
      </aside>
    </div>
  );
}
