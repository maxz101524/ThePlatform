import { createClient } from "@/lib/supabase/server";

export async function getUpcomingMeets(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, city, state, country")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
    location: [m.city, m.state, m.country].filter(Boolean).join(", "),
  }));
}

export async function getRecentMeets(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date")
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
  }));
}

export async function getAggregatedContent(limit = 20) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("aggregated_content")
    .select(`
      id, platform, source_url, embed_url, title, thumbnail_url, description, published_at,
      content_sources!inner(creator_name)
    `)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data || []).map((c: Record<string, unknown>) => {
    const source = c.content_sources as Record<string, string>;
    return {
      id: c.id as string,
      platform: c.platform as string,
      sourceUrl: c.source_url as string,
      embedUrl: c.embed_url as string,
      title: c.title as string,
      thumbnailUrl: c.thumbnail_url as string | null,
      description: c.description as string | null,
      publishedAt: c.published_at as string,
      creatorName: source.creator_name,
    };
  });
}

export async function getPosts(limit = 20, offset = 0) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select(`
      id, body_text, link_url, link_preview, vote_count, comment_count, created_at,
      lifter_id, meet_id,
      profiles!inner(username, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data || []).map((p: Record<string, unknown>) => {
    const profile = p.profiles as Record<string, string>;
    return {
      id: p.id as string,
      bodyText: p.body_text as string,
      linkUrl: p.link_url as string | null,
      linkPreview: p.link_preview as { title?: string; description?: string; thumbnail?: string; domain?: string } | null,
      voteCount: p.vote_count as number,
      commentCount: p.comment_count as number,
      createdAt: p.created_at as string,
      lifterId: p.lifter_id as string | null,
      meetId: p.meet_id as string | null,
      username: profile.username,
      avatarUrl: profile.avatar_url,
    };
  });
}
