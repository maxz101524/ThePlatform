import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchYouTubeVideos(channelId: string, sourceId: string) {
  if (!YOUTUBE_API_KEY) { console.log("No YouTube API key, skipping"); return []; }

  // Get uploads playlist ID
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Get recent videos
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
  );
  const videosData = await videosRes.json();

  return (videosData.items || []).map((item: Record<string, unknown>) => {
    const snippet = item.snippet as Record<string, unknown>;
    const thumbnails = snippet.thumbnails as Record<string, Record<string, unknown>>;
    const resourceId = snippet.resourceId as Record<string, string>;
    return {
      source_id: sourceId,
      platform: "youtube",
      source_url: `https://www.youtube.com/watch?v=${resourceId.videoId}`,
      embed_url: `https://www.youtube.com/embed/${resourceId.videoId}`,
      title: snippet.title as string,
      thumbnail_url: (thumbnails.high as Record<string, string>)?.url || null,
      description: (snippet.description as string)?.slice(0, 500) || null,
      published_at: snippet.publishedAt as string,
    };
  });
}

async function autoTagContent(contentId: string, title: string, description: string | null) {
  const searchText = `${title} ${description || ""}`.toLowerCase();

  // Get lifters whose names appear in the content
  const { data: lifters } = await supabase
    .from("lifters")
    .select("id, name")
    .limit(1000);

  if (!lifters) return;

  for (const lifter of lifters) {
    if (searchText.includes(lifter.name.toLowerCase())) {
      await supabase.from("content_lifter_tags").upsert({
        content_id: contentId,
        lifter_id: lifter.id,
        auto_tagged: true,
      }, { onConflict: "content_id,lifter_id" });
    }
  }
}

async function main() {
  console.log("Starting content aggregation...");

  const { data: sources } = await supabase
    .from("content_sources")
    .select("*")
    .eq("active", true);

  if (!sources || sources.length === 0) {
    console.log("No active content sources configured.");
    return;
  }

  for (const source of sources) {
    console.log(`Processing: ${source.creator_name} (${source.platform})`);

    let items: Record<string, unknown>[] = [];

    if (source.platform === "youtube") {
      items = await fetchYouTubeVideos(source.platform_id, source.id);
    }
    // Add podcast RSS and Instagram handlers here later

    for (const item of items) {
      const { data, error } = await supabase
        .from("aggregated_content")
        .upsert(item, { onConflict: "source_url" })
        .select("id")
        .single();

      if (error) {
        console.error(`Insert error for ${(item as Record<string, string>).source_url}: ${error.message}`);
        continue;
      }

      if (data) {
        await autoTagContent(
          data.id,
          (item as Record<string, string>).title,
          (item as Record<string, string | null>).description
        );
      }
    }

    console.log(`  → ${items.length} items processed`);
  }

  console.log("Content aggregation complete.");
}

main().catch(console.error);
