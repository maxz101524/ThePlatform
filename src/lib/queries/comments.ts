import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/lib/types";

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(username, avatar_url, display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getComments]", error.message);
    return [];
  }
  return (data as Comment[]) || [];
}
