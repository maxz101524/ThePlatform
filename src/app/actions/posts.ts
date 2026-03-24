"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(_prevState: { error: string | null }, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Must be logged in" };

  const bodyText = formData.get("body_text") as string;
  const linkUrl = formData.get("link_url") as string | null;
  const tag = formData.get("tag") as string | null;

  let linkPreview = null;
  if (linkUrl) {
    linkPreview = await fetchLinkPreview(linkUrl);
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body_text: bodyText,
    link_url: linkUrl || null,
    link_preview: linkPreview,
    tag: tag || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}

async function fetchLinkPreview(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const title = html.match(/<meta property="og:title" content="([^"]*)"/)?.[ 1]
      || html.match(/<title>([^<]*)<\/title>/)?.[1]
      || url;
    const description = html.match(/<meta property="og:description" content="([^"]*)"/)?.[ 1] || null;
    const thumbnail = html.match(/<meta property="og:image" content="([^"]*)"/)?.[ 1] || null;
    const domain = new URL(url).hostname;
    return { title, description, thumbnail, domain };
  } catch {
    return { title: url, domain: new URL(url).hostname };
  }
}
