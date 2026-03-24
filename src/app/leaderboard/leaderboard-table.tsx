import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
  startRank: number;
}

function isRecent(meetDate: string): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return new Date(meetDate) >= sixMonthsAgo;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function LeaderboardTable({ entries, sortBy, startRank }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted w-12">#</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted w-12"></th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "total" ? "text-accent-secondary" : "text-text-muted"}`}>Total</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "dots" || sortBy === "wilks" ? "text-accent-secondary" : "text-text-muted"}`}>DOTS</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Fed</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
            <th className="hidden lg:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
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
                className={`transition-colors hover:bg-bg-surface-elevated ${
                  inTopTen ? "bg-bg-surface" : ""
                }`}
              >
                {/* Rank */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} font-mono font-bold ${
                  inTopTen ? "text-text-primary" : "text-text-muted"
                }`}>
                  {rank}
                </td>

                {/* Freshness */}
                <td className={`px-1 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  {recent && (
                    <span className="inline-flex items-center font-heading text-[10px] uppercase tracking-wider text-semantic-success">
                      ▲
                    </span>
                  )}
                </td>

                {/* Lifter + chips */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary">
                      {entry.lifter_name}
                    </span>
                    {entry.country && (
                      <span className="text-xs text-text-muted">{entry.country}</span>
                    )}
                    <div className="flex gap-1">
                      <TagChip variant="equipment">{entry.equipment}</TagChip>
                      {entry.tested && <TagChip variant="tested">Tested</TagChip>}
                    </div>
                  </div>
                </td>

                {/* BW */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-muted`}>
                  {entry.bodyweight_kg?.toFixed(1) || "—"}
                </td>

                {/* Squat */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_squat?.toFixed(1) || "—"}
                </td>

                {/* Bench */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_bench?.toFixed(1) || "—"}
                </td>

                {/* Deadlift */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono text-text-primary`}>
                  {entry.best_deadlift?.toFixed(1) || "—"}
                </td>

                {/* Total */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono font-bold text-accent-secondary`}>
                  {entry.total?.toFixed(1) || "—"}
                </td>

                {/* DOTS */}
                <td className={`px-3 ${inTopTen ? "py-3.5" : "py-3"} text-right font-mono ${sortBy === "dots" || sortBy === "wilks" ? "text-accent-secondary" : "text-text-secondary"}`}>
                  {entry.dots?.toFixed(2) || "—"}
                </td>

                {/* Federation */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
                  {entry.federation}
                </td>

                {/* Date */}
                <td className={`hidden md:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
                  {formatDate(entry.meet_date)}
                </td>

                {/* Meet name */}
                <td className={`hidden lg:table-cell px-3 ${inTopTen ? "py-3.5" : "py-3"} text-xs text-text-muted`}>
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
