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
