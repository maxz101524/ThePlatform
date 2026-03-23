import { Card } from "@/components/ui/card";

interface AggregatedContentCardProps {
  title: string;
  creatorName: string;
  platform: string;
  sourceUrl: string;
  thumbnailUrl?: string | null;
  publishedAt: string;
}

export function AggregatedContentCard({ title, creatorName, platform, sourceUrl, thumbnailUrl }: AggregatedContentCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      {thumbnailUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          <img src={thumbnailUrl} alt={title} className="aspect-video w-full object-cover" />
        </a>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="uppercase font-heading tracking-wider text-accent-primary">
            {platform}
          </span>
          <span>·</span>
          <span>{creatorName}</span>
        </div>
        <a
          href={sourceUrl}
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
