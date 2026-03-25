import { createClient } from "@/lib/supabase/server";
import type { Post, AggregatedContent, LeaderboardEntry } from "@/lib/types";

export async function getPosts(
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url, display_name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[getPosts]", error.message, error.details);
    return [];
  }
  return (data as Post[]) || [];
}

export async function getFollowedPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createClient();

  // Get followed user IDs
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (!followData || followData.length === 0) return [];

  const followedIds = followData.map((f) => f.following_id);

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url, display_name)")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}

export async function getAggregatedContent(
  limit = 10
): Promise<AggregatedContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aggregated_content")
    .select("*, content_sources(creator_name)")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getAggregatedContent]", error.message, error.details);
    return [];
  }
  return (data as AggregatedContent[]) || [];
}

export async function getRecentNotableResults(
  limit = 5
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .order("meet_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentNotableResults]", error.message, error.details);
    return [];
  }
  return (data as LeaderboardEntry[]) || [];
}

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
