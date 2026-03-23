import Link from "next/link";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

export function CompetitionHistory({ results }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Squat</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Bench</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Deadlift</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-accent-secondary text-right">Total</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">DOTS</th>
            <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Place</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
              <td className="px-3 py-3 text-text-muted whitespace-nowrap">{r.meet_date}</td>
              <td className="px-3 py-3">
                <Link
                  href={`/meet/${r.meet_slug}`}
                  className="text-text-primary hover:text-accent-primary transition-colors"
                >
                  {r.meet_name}
                </Link>
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">
                {r.bodyweight_kg?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_squat?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_bench?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-primary">
                {r.best_deadlift?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-accent-secondary">
                {r.total?.toFixed(1) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-secondary">
                {r.dots?.toFixed(2) || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-text-muted">{r.place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
