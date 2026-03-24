import { Suspense } from "react";
import { getLeaderboard, getWeightClasses } from "@/lib/queries/leaderboard";
import { LeaderboardFilters } from "./leaderboard-filters";
import { LeaderboardTable } from "./leaderboard-table";
import { Podium } from "./podium";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const sex = (params.sex as "M" | "F") || "M";
  const sortBy = params.sort || "total";
  const offset = parseInt(params.offset || "0", 10);
  const testedParam = params.tested;

  const [entries, weightClasses] = await Promise.all([
    getLeaderboard({
      sex,
      federation: params.fed !== "All" ? params.fed : undefined,
      equipment: params.equip !== "All" ? params.equip : undefined,
      weightClass: params.class !== "All" ? params.class : undefined,
      tested: testedParam === "true" ? true : testedParam === "false" ? false : undefined,
      sortBy: sortBy as "total" | "dots" | "wilks" | "best_squat" | "best_bench" | "best_deadlift",
      limit: 50,
      offset,
    }),
    getWeightClasses(sex, params.equip !== "All" ? params.equip : undefined),
  ]);

  // Split entries: top 3 go to podium (only on first page), rest go to table
  const showPodium = offset === 0 && entries.length >= 3;
  const podiumEntries = showPodium ? entries.slice(0, 3) : [];
  const tableEntries = showPodium ? entries.slice(3) : entries;
  const tableStartRank = showPodium ? 3 : offset;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-5xl font-bold uppercase text-text-primary md:text-6xl">
          Global Rankings
        </h1>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <LeaderboardFilters weightClasses={weightClasses} />
      </Suspense>

      {/* Podium — top 3 on first page */}
      {showPodium && <Podium entries={podiumEntries} />}

      {/* Table — ranks 4+ (or all ranks on subsequent pages) */}
      <Suspense fallback={<TableSkeleton rows={20} />}>
        <LeaderboardTable entries={tableEntries} sortBy={sortBy} startRank={tableStartRank} />
      </Suspense>

      {/* Load More */}
      {entries.length === 50 && (
        <div className="flex justify-center">
          <a
            href={`/leaderboard?${new URLSearchParams({ ...params as Record<string, string>, offset: String(offset + 50) }).toString()}`}
            className="border border-border px-6 py-2 font-heading text-sm uppercase tracking-wider text-text-muted hover:border-text-muted hover:text-text-primary transition-colors"
          >
            Load More
          </a>
        </div>
      )}
    </div>
  );
}
