"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeInstagramPermalink } from "@/lib/instagram-url";

/** Detect platform from URL */
function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
    if (hostname.includes("instagram.com") || hostname.includes("instagr.am")) return "instagram";
    if (hostname.includes("tiktok.com")) return "tiktok";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    return null;
  } catch {
    return null;
  }
}

export async function addProfileMedia(
  _prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Must be logged in" };

  const url = (formData.get("url") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;

  if (!url) return { error: "URL is required" };

  const platform = detectPlatform(url);
  if (!platform) {
    return { error: "Supported platforms: YouTube, Instagram, TikTok, X/Twitter" };
  }

  let storedUrl = url;
  if (platform === "instagram") {
    const normalized = normalizeInstagramPermalink(url);
    if (!normalized) {
      return {
        error:
          "Could not read that Instagram link. Open the post → ⋯ → Copy link, or use a URL like instagram.com/reel/… or instagram.com/p/…",
      };
    }
    storedUrl = normalized;
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("profile_media")
    .select("sort_order")
    .eq("profile_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // Limit to 12 items
  const { count } = await supabase
    .from("profile_media")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  if (count && count >= 12) {
    return { error: "Maximum 12 media items. Remove one to add another." };
  }

  const { error } = await supabase.from("profile_media").insert({
    profile_id: user.id,
    url: storedUrl,
    platform,
    title,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile) revalidatePath(`/u/${profile.username}`);

  return { error: null };
}

export async function removeProfileMedia(mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profile_media")
    .delete()
    .eq("id", mediaId)
    .eq("profile_id", user.id);

  if (error) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile) revalidatePath(`/u/${profile.username}`);
}
