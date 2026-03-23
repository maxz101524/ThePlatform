import Link from "next/link";
import { LeaderboardEntry } from "@/lib/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: string;
}

export function LeaderboardTable({ entries, sortBy }: LeaderboardTableProps) {
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
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.lifter_id}-${entry.rank}`}
              className={`border-b border-border/50 transition-colors hover:bg-bg-surface ${
                entry.rank <= 3 ? "bg-bg-surface" : ""
              }`}
            >
              <td className={`px-3 py-3 font-mono font-bold ${
                entry.rank === 1 ? "text-accent-secondary" :
                entry.rank === 2 ? "text-text-secondary" :
                entry.rank === 3 ? "text-accent-primary" :
                "text-text-muted"
              }`}>
                {entry.rank}
              </td>
              <td className="px-3 py-3">
                <Link
                  href={`/lifter/${entry.lifter_slug}`}
                  className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                >
                  {entry.lifter_name}
                </Link>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
