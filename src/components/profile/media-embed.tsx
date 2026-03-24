import type { ProfileMedia } from "@/lib/types";

interface MediaEmbedProps {
  media: ProfileMedia;
}

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      // Handle /watch?v=, /shorts/, /embed/, /live/
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const match = u.pathname.match(/\/(shorts|embed|live)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract Instagram post/reel ID */
function getInstagramPath(url: string): string | null {
  try {
    const u = new URL(url);
    // Matches /p/CODE, /reel/CODE, /reels/CODE
    const match = u.pathname.match(/\/(p|reel|reels)\/([^/?]+)/);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

/** Extract TikTok video URL for embed */
function getTikTokUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("tiktok.com")) return url;
    return null;
  } catch {
    return null;
  }
}

export function MediaEmbed({ media }: MediaEmbedProps) {
  if (media.platform === "youtube") {
    const videoId = getYouTubeId(media.url);
    if (!videoId) return <FallbackLink media={media} />;
    return (
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={media.title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (media.platform === "instagram") {
    // Instagram blocks iframe embeds from most origins.
    // Show a styled card that links out instead.
    return <InstagramCard media={media} />;
  }

  if (media.platform === "tiktok") {
    const tiktokUrl = getTikTokUrl(media.url);
    if (!tiktokUrl) return <FallbackLink media={media} />;
    // TikTok embeds require their script; use blockquote + script approach
    return (
      <div className="w-full flex justify-center">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${extractTikTokId(media.url)}`}
          title={media.title || "TikTok video"}
          allowFullScreen
          className="w-full max-w-[325px] min-h-[580px] border-0"
        />
      </div>
    );
  }

  if (media.platform === "twitter") {
    // Twitter/X embeds are complex; link out for now
    return <FallbackLink media={media} />;
  }

  return <FallbackLink media={media} />;
}

function InstagramCard({ media }: { media: ProfileMedia }) {
  const isReel = media.url.includes("/reel");
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#833AB4] via-[#FD1D1D] to-[#F77737] p-8 min-h-[200px] text-white hover:opacity-90 transition-opacity"
    >
      <span className="text-3xl">◻</span>
      <p className="font-heading text-sm uppercase tracking-wider">
        {isReel ? "View Reel" : "View Post"} on Instagram
      </p>
      {media.title && (
        <p className="text-xs text-white/80 text-center max-w-[200px] truncate">{media.title}</p>
      )}
    </a>
  );
}

function FallbackLink({ media }: { media: ProfileMedia }) {
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-border bg-bg-surface p-4 text-sm text-text-primary hover:border-accent-primary transition-colors"
    >
      <span className="text-lg">{platformIcon(media.platform)}</span>
      <div className="min-w-0">
        <p className="font-bold truncate">{media.title || media.url}</p>
        <p className="text-xs text-text-muted">{media.platform}</p>
      </div>
    </a>
  );
}

function platformIcon(platform: string): string {
  switch (platform) {
    case "youtube": return "▶";
    case "instagram": return "◻";
    case "tiktok": return "♪";
    case "twitter": return "𝕏";
    default: return "🔗";
  }
}

function extractTikTokId(url: string): string {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : "";
}
