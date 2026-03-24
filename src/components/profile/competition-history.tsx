import type { UserResult } from "@/lib/types";

interface CompetitionHistoryProps {
  results: UserResult[];
}

export function CompetitionHistory({ results }: CompetitionHistoryProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-text-muted py-4">
        No competition history yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Fed</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-accent-secondary text-right">Total</th>
            <th className="hidden md:table-cell px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">DOTS</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Place</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
              <td className="px-3 py-3 text-text-muted whitespace-nowrap">{r.meet_date}</td>
              <td className="px-3 py-3 font-bold text-text-primary max-w-[200px] truncate">{r.meet_name}</td>
              <td className="hidden md:table-cell px-3 py-3 text-text-muted">{r.federation || "—"}</td>
              <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-text-muted">{r.bodyweight_kg?.toFixed(1) || "—"}</td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">{r.best_squat?.toFixed(1) || "—"}</td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">{r.best_bench?.toFixed(1) || "—"}</td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">{r.best_deadlift?.toFixed(1) || "—"}</td>
              <td className="px-3 py-3 text-right font-mono font-bold text-accent-secondary">{r.total?.toFixed(1) || "—"}</td>
              <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-text-secondary">{r.dots?.toFixed(2) || "—"}</td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">{r.place || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
