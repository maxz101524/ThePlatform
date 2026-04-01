import type { AggregatedContent } from "@/lib/types";

export function AggregatedContentCard({ title, content_sources, platform, source_url, thumbnail_url }: AggregatedContent) {
  return (
    <article className="px-4 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Platform icon placeholder */}
        <div className="w-10 h-10 rounded-full shrink-0 bg-bg-dark-subtle border border-white/10 flex items-center justify-center">
          <span className="font-heading text-[10px] font-bold text-accent-red uppercase">{platform.slice(0, 2)}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="uppercase font-heading text-xs tracking-wider text-accent-red font-bold">
              {platform}
            </span>
            <span className="text-zinc-600">&middot;</span>
            <span className="font-mono text-xs text-zinc-500">{content_sources.creator_name}</span>
          </div>

          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block space-y-2"
          >
            <p className="font-heading text-[15px] font-bold text-white hover:text-accent-red transition-colors leading-snug">
              {title}
            </p>
            {thumbnail_url && (
              <img src={thumbnail_url} alt={title} className="w-full rounded-xl object-cover max-h-64" />
            )}
          </a>
        </div>
      </div>
    </article>
  );
}
