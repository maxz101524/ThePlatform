import Link from "next/link";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

function AttemptCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted">—</span>;
  const failed = value < 0;
  return (
    <span className={failed ? "text-semantic-error" : "text-text-primary"}>
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export function MeetResultsTable({ results }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Pl</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Lifter</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">BW</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">Class</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">S3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">B3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D1</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D2</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">D3</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-accent-secondary text-right">Total</th>
            <th className="px-2 py-3 font-heading text-xs uppercase tracking-wider text-text-muted text-right">DOTS</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
              <td className="px-2 py-3 font-mono text-text-muted">{r.place}</td>
              <td className="px-2 py-3 whitespace-nowrap">
                <Link
                  href={`/lifter/${r.lifter_slug}`}
                  className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                >
                  {r.lifter_name}
                </Link>
              </td>
              <td className="px-2 py-3 text-right font-mono text-text-muted">{r.bodyweight_kg?.toFixed(1) || "—"}</td>
              <td className="px-2 py-3 text-right font-mono text-text-muted">{r.weight_class_kg || "—"}</td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.squat_3} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.bench_3} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_1} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_2} /></td>
              <td className="px-2 py-3 text-right font-mono"><AttemptCell value={r.deadlift_3} /></td>
              <td className="px-2 py-3 text-right font-mono font-bold text-accent-secondary">
                {r.total?.toFixed(1) || "—"}
              </td>
              <td className="px-2 py-3 text-right font-mono text-text-secondary">
                {r.dots?.toFixed(2) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
