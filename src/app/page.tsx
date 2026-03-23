import Link from "next/link";
import { getUpcomingMeets, getRecentMeets, getAggregatedContent, getPosts } from "@/lib/queries/feed";
import { PostCard } from "@/components/content/post-card";
import { AggregatedContentCard } from "@/components/content/aggregated-content-card";
import { Card } from "@/components/ui/card";

export default async function FeedPage() {
  const [upcomingMeets, recentMeets, content, posts] = await Promise.all([
    getUpcomingMeets(5),
    getRecentMeets(5),
    getAggregatedContent(10),
    getPosts(10),
  ]);

  // Interleave posts and content for the feed
  const feedItems: Array<{ type: "post" | "content"; data: (typeof posts)[0] | (typeof content)[0]; date: string }> = [
    ...posts.map((p) => ({ type: "post" as const, data: p, date: p.createdAt })),
    ...content.map((c) => ({ type: "content" as const, data: c, date: c.publishedAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_280px]">
      {/* Left column — Dispatches */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-accent-primary">
          Dispatches
        </h2>
        {recentMeets.map((meet) => (
          <div key={meet.id} className="border-b border-border pb-3">
            <p className="text-xs text-text-muted">{meet.federation} · {meet.date}</p>
            <Link
              href={`/meet/${meet.slug}`}
              className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              Results: {meet.name}
            </Link>
          </div>
        ))}
      </aside>

      {/* Center column — Feed */}
      <div className="space-y-4">
        {feedItems.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted">No content yet. Check back soon!</p>
          </Card>
        ) : (
          feedItems.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={`post-${(item.data as (typeof posts)[0]).id}`}
                {...(item.data as (typeof posts)[0])}
              />
            ) : (
              <AggregatedContentCard
                key={`content-${(item.data as (typeof content)[0]).id}`}
                {...(item.data as (typeof content)[0])}
              />
            )
          )
        )}
      </div>

      {/* Right column — Upcoming Meets */}
      <aside className="hidden lg:block space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-text-primary">
          Upcoming Meets
        </h2>
        {upcomingMeets.map((meet) => (
          <Card key={meet.id} className="p-3 space-y-1">
            <Link
              href={`/meet/${meet.slug}`}
              className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              {meet.name}
            </Link>
            <p className="text-xs text-text-muted">{meet.federation}</p>
            <p className="text-xs text-text-muted">{meet.location}</p>
            <p className="text-xs text-accent-primary">{meet.date}</p>
          </Card>
        ))}
        {upcomingMeets.length > 0 && (
          <Link href="/meets" className="text-xs text-accent-primary hover:underline">
            View Full Calendar
          </Link>
        )}
      </aside>
    </div>
  );
}
