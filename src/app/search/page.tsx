import Link from "next/link";
import { searchLifters, searchMeets } from "@/lib/queries/search";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-muted">Search for lifters and meets</p>
      </div>
    );
  }

  const [lifters, meets] = await Promise.all([
    searchLifters(q),
    searchMeets(q),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold uppercase text-text-primary">
        Results for &ldquo;{q}&rdquo;
      </h1>

      {lifters.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg uppercase tracking-wider text-accent-primary">
            Lifters
          </h2>
          <div className="space-y-1">
            {lifters.map((l) => (
              <Link
                key={l.id}
                href={`/lifter/${l.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-accent-primary"
              >
                <span className="font-bold text-text-primary">{l.name}</span>
                <span className="text-xs text-text-muted">{l.country}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {meets.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg uppercase tracking-wider text-accent-primary">
            Meets
          </h2>
          <div className="space-y-1">
            {meets.map((m) => (
              <Link
                key={m.id}
                href={`/meet/${m.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-accent-primary"
              >
                <span className="font-bold text-text-primary">{m.name}</span>
                <span className="text-xs text-text-muted">{m.federation} · {m.date}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {lifters.length === 0 && meets.length === 0 && (
        <p className="text-text-muted">No results found for &ldquo;{q}&rdquo;</p>
      )}
    </div>
  );
}
