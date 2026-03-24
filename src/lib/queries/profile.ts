import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserResult, Post } from "@/lib/types";

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
    .select("*, profiles(username, avatar_url, display_name)")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return (data as Post[]) || [];
}
