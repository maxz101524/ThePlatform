"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addComment(postId: string, bodyText: string, parentCommentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  if (!bodyText.trim()) throw new Error("Comment cannot be empty");
  if (bodyText.length > 1000) throw new Error("Comment too long (max 1000 characters)");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_comment_id: parentCommentId || null,
    body_text: bodyText.trim(),
  });

  if (error) throw new Error(error.message);

  // Increment comment count on the post
  await supabase.rpc("increment_post_comments", { p_post_id: postId, p_delta: 1 });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Decrement comment count
  await supabase.rpc("increment_post_comments", { p_post_id: postId, p_delta: -1 });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}
