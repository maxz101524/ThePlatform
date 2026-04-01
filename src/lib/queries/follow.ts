import { createClient } from "@/lib/supabase/server";

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  return !!data;
}

export async function getFollowers(
  profileId: string,
  limit = 50
): Promise<{ id: string; username: string; avatar_url: string | null; display_name: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, display_name)")
    .eq("following_id", profileId)
    .limit(limit);

  if (!data) return [];
  return data.map((d: any) => d.profiles);
}

export async function getFollowing(
  profileId: string,
  limit = 50
): Promise<{ id: string; username: string; avatar_url: string | null; display_name: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(id, username, avatar_url, display_name)")
    .eq("follower_id", profileId)
    .limit(limit);

  if (!data) return [];
  return data.map((d: any) => d.profiles);
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count || 0;
}

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
