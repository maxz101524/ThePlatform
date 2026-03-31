import { Card } from "@/components/ui/card";
import type { AggregatedContent } from "@/lib/types";

export function AggregatedContentCard({ title, content_sources, platform, source_url, thumbnail_url }: AggregatedContent) {
  return (
    <Card className="overflow-hidden p-0">
      {thumbnail_url && (
        <a href={source_url} target="_blank" rel="noopener noreferrer">
          <img src={thumbnail_url} alt={title} className="aspect-video w-full object-cover" />
        </a>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="uppercase font-heading tracking-wider text-accent-red">
            {platform}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">{content_sources.creator_name}</span>
        </div>
        <a
          href={source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-heading text-sm font-bold text-zinc-900 hover:text-accent-red transition-colors"
        >
          {title}
        </a>
      </div>
    </Card>
  );
}
