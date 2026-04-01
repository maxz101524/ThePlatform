"use client";

import { instagramEmbedIframeSrc } from "@/lib/instagram-url";

/**
 * Instagram’s own embed uses this /embed/captioned/ iframe URL (same as “Embed” in the app).
 * If the post is private or embedding is off, Instagram shows their error page inside the iframe.
 */
export function InstagramOfficialEmbed({ permalink }: { permalink: string }) {
  const src = instagramEmbedIframeSrc(permalink);

  return (
    <div className="space-y-2">
      <div className="flex justify-center overflow-hidden bg-bg-primary">
        <iframe
          key={src}
          src={src}
          title="Instagram embed"
          className="h-[580px] w-full max-w-[540px] border-0"
          allow="clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="text-center text-xs text-text-muted px-1">
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-red hover:underline"
        >
          Open on Instagram
        </a>
        <span className="text-text-muted"> · Public posts and reels only</span>
      </p>
    </div>
  );
}
