import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserResult, Post, ProfileMedia } from "@/lib/types";

export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getUserResults(
  profileId: string
): Promise<UserResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_results")
    .select("*")
    .eq("profile_id", profileId)
    .order("meet_date", { ascending: false });

  if (error) return [];
  return (data as UserResult[]) || [];
}

export async function getUserPosts(
  profileId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(username, avatar_url, display_name)")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}

export async function getProfileMedia(
  profileId: string
): Promise<ProfileMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_media")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getProfileMedia]", error.message);
    return [];
  }
  return (data as ProfileMedia[]) || [];
}
