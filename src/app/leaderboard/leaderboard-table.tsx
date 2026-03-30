import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";
import { isRecent, formatDate } from "./utils";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
  startRank: number;
}

export function LeaderboardTable({ entries, sortBy, startRank }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500 w-12">#</th>
            <th className="px-1 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500 w-12"></th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500">Lifter</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500 text-right">BW</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-widest text-right ${sortBy === "best_squat" ? "text-accent-yellow" : "text-zinc-500"}`}>Squat</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-widest text-right ${sortBy === "best_bench" ? "text-accent-yellow" : "text-zinc-500"}`}>Bench</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-widest text-right ${sortBy === "best_deadlift" ? "text-accent-yellow" : "text-zinc-500"}`}>Deadlift</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-widest text-right ${sortBy === "total" ? "text-accent-yellow" : "text-zinc-500"}`}>Total</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-widest text-right ${sortBy === "dots" || sortBy === "wilks" ? "text-accent-yellow" : "text-zinc-500"}`}>DOTS</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500">Fed</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500">Date</th>
            <th className="hidden lg:table-cell px-3 py-3 font-heading text-xs uppercase tracking-widest text-zinc-500">Meet</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const rank = startRank + i + 1;
            const inTopTen = rank <= 10;
            const recent = isRecent(entry.meet_date);

            return (
              <tr
                key={entry.id}
                className={`transition-colors hover:bg-bg-dark-subtle border-b border-white/5 ${
                  inTopTen ? "bg-bg-dark-elevated" : ""
                }`}
              >
                {/* Rank */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} font-mono font-bold ${
                  inTopTen ? "text-text-on-dark" : "text-text-on-dark-muted"
                }`}>
                  {rank}
                </td>

                {/* Freshness */}
                <td className={`px-1 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  {recent && (
                    <span className="inline-flex items-center font-heading text-[10px] uppercase tracking-wider text-accent-green">
                      ▲
                    </span>
                  )}
                </td>

                {/* Lifter + chips */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">
                      {entry.lifter_name}
                    </span>
                    {entry.country && (
                      <span className="text-xs text-zinc-500">{entry.country}</span>
                    )}
                    <div className="flex gap-1">
                      <TagChip variant="equipment" dark>{entry.equipment}</TagChip>
                      {entry.tested && <TagChip variant="tested" dark>Tested</TagChip>}
                    </div>
                  </div>
                </td>

                {/* BW */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-on-dark-muted`}>
                  {entry.bodyweight_kg?.toFixed(1) || "---"}
                </td>

                {/* Squat */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-accent-red`}>
                  {entry.best_squat?.toFixed(1) || "---"}
                </td>

                {/* Bench */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-accent-blue`}>
                  {entry.best_bench?.toFixed(1) || "---"}
                </td>

                {/* Deadlift */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-accent-yellow`}>
                  {entry.best_deadlift?.toFixed(1) || "---"}
                </td>

                {/* Total */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono font-bold text-white`}>
                  {entry.total?.toFixed(1) || "---"}
                </td>

                {/* DOTS */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono ${sortBy === "dots" || sortBy === "wilks" ? "text-accent-yellow" : "text-text-on-dark-muted"}`}>
                  {entry.dots?.toFixed(2) || "---"}
                </td>

                {/* Federation */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-on-dark-muted`}>
                  {entry.federation}
                </td>

                {/* Date */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-on-dark-muted`}>
                  {formatDate(entry.meet_date)}
                </td>

                {/* Meet name */}
                <td className={`hidden lg:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-on-dark-muted`}>
                  {entry.meet_name}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
