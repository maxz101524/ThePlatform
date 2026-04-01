/**
 * Build a canonical permalink for Instagram embeds.
 * Share links often use /reels/ or /username/reel/; the embed iframe expects /reel/ (singular).
 */
export function normalizeInstagramPermalink(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./i, "");
    if (host !== "instagram.com" && host !== "instagr.am") return null;

    const segments = u.pathname.split("/").filter(Boolean);
    let kind: string;
    let shortcode: string;

    if (segments.length >= 2 && ["p", "reel", "reels", "tv"].includes(segments[0])) {
      kind = segments[0];
      shortcode = segments[1];
    } else if (
      segments.length >= 3 &&
      ["p", "reel", "reels", "tv"].includes(segments[1])
    ) {
      kind = segments[1];
      shortcode = segments[2];
    } else {
      return null;
    }

    if (!shortcode) return null;

    const embedKind = kind === "reels" ? "reel" : kind;
    return `https://www.instagram.com/${embedKind}/${shortcode}/`;
  } catch {
    return null;
  }
}

/** Direct embed URL used by Instagram’s widget (same as “Embed” in the app). */
export function instagramEmbedIframeSrc(permalink: string): string {
  const base = permalink.replace(/\/?$/, "");
  return `${base}/embed/captioned/`;
}
