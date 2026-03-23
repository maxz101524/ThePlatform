import { Suspense } from "react";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { LeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardTable } from "./leaderboard-table";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const sex = (params.sex as "M" | "F") || "M";
  const sortBy = params.sort || "total";
  const offset = parseInt(params.offset || "0", 10);

  const entries = await getLeaderboard({
    sex,
    federation: params.fed !== "All" ? params.fed : undefined,
    equipment: params.equip !== "All" ? params.equip : undefined,
    weightClass: params.class,
    sortBy: sortBy as "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift",
    limit: 50,
    offset,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
          Global Rankings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Top totals & DOTS scores
        </p>
      </div>

      <Suspense fallback={null}>
        <LeaderboardFilters />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={20} />}>
        <LeaderboardTable entries={entries} sortBy={sortBy} />
      </Suspense>

      {entries.length === 50 && (
        <div className="flex justify-center">
          <a
            href={`/leaderboard?${new URLSearchParams({ ...params as Record<string, string>, offset: String(offset + 50) }).toString()}`}
            className="rounded-md border border-border px-6 py-2 font-heading text-sm uppercase tracking-wider text-text-muted hover:border-text-muted hover:text-text-primary transition-colors"
          >
            Load More
          </a>
        </div>
      )}
    </div>
  );
}
