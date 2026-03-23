"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function voteOnPost(postId: string, value: 1 | -1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  // Check existing vote
  const { data: existing } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.value === value) {
      // Remove vote (toggle off)
      await supabase.from("post_votes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: -value });
    } else {
      // Change vote
      await supabase.from("post_votes").update({ value }).eq("post_id", postId).eq("user_id", user.id);
      await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: value * 2 });
    }
  } else {
    // New vote
    await supabase.from("post_votes").insert({ post_id: postId, user_id: user.id, value });
    await supabase.rpc("increment_post_votes", { p_post_id: postId, p_delta: value });
  }

  revalidatePath("/");
}
