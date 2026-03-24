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
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="uppercase font-heading tracking-wider text-accent-primary">
            {platform}
          </span>
          <span>·</span>
          <span>{content_sources.creator_name}</span>
        </div>
        <a
          href={source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-bold text-text-primary hover:text-accent-primary transition-colors"
        >
          {title}
        </a>
      </div>
    </Card>
  );
}
