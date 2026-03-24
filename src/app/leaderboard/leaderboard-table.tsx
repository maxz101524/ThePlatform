import { LeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
  startRank: number;
}

export function LeaderboardTable({ entries, sortBy, startRank }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Rank</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "total" ? "text-accent-secondary" : "text-text-muted"}`}>Total</th>
            <th className={`px-3 py-3 font-heading text-xs uppercase tracking-wider text-right ${sortBy === "dots" ? "text-accent-secondary" : "text-text-muted"}`}>DOTS</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Federation</th>
            <th className="hidden lg:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const rank = startRank + i + 1;
            return (
              <tr
                key={entry.id}
                className={`border-b border-border/50 transition-colors hover:bg-bg-surface ${
                  rank <= 3 ? "bg-bg-surface" : ""
                }`}
              >
                <td className={`px-3 py-3 font-mono font-bold ${
                  rank === 1 ? "text-accent-secondary" :
                  rank === 2 ? "text-text-secondary" :
                  rank === 3 ? "text-accent-primary" :
                  "text-text-muted"
                }`}>
                  {rank}
                </td>
                <td className="px-3 py-3">
                  <span className="font-bold text-text-primary">
                    {entry.lifter_name}
                  </span>
                  {entry.country && (
                    <span className="ml-2 text-xs text-text-muted">{entry.country}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-muted">
                  {entry.bodyweight_kg?.toFixed(1) || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-primary">
                  {entry.best_squat?.toFixed(1) || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-primary">
                  {entry.best_bench?.toFixed(1) || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-primary">
                  {entry.best_deadlift?.toFixed(1) || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-accent-secondary">
                  {entry.total?.toFixed(1) || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-secondary">
                  {entry.dots?.toFixed(2) || "—"}
                </td>
                <td className="hidden md:table-cell px-3 py-3 text-xs text-text-muted">
                  {entry.federation}
                </td>
                <td className="hidden lg:table-cell px-3 py-3 text-xs text-text-muted">
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
