import type { UserResult } from "@/lib/types";

interface CompetitionHistoryProps {
  results: UserResult[];
}

function resultKey(result: UserResult, index: number): string {
  return result.id ?? `${result.meet_date}-${result.meet_name}-${result.place ?? "na"}-${index}`;
}

function placeColor(place: string | null | undefined): string {
  if (!place) return "text-zinc-500";
  if (place === "1") return "text-rank-gold font-bold";
  if (place === "2") return "text-rank-silver font-bold";
  if (place === "3") return "text-rank-bronze font-bold";
  return "text-zinc-500";
}

export function CompetitionHistory({ results }: CompetitionHistoryProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        No competition history yet.
      </p>
    );
  }

  return (
    <div className="bg-bg-dark-elevated rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-dark-subtle border-b border-white/5">
              <th className="px-3 py-3 text-left font-heading uppercase text-zinc-500 text-xs tracking-widest">Date</th>
              <th className="px-3 py-3 text-left font-heading uppercase text-zinc-500 text-xs tracking-widest">Meet</th>
              <th className="hidden md:table-cell px-3 py-3 text-left font-heading uppercase text-zinc-500 text-xs tracking-widest">Fed</th>
              <th className="hidden md:table-cell px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">BW</th>
              <th className="px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">Squat</th>
              <th className="px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">Bench</th>
              <th className="px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">Deadlift</th>
              <th className="px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">Total</th>
              <th className="hidden md:table-cell px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">DOTS</th>
              <th className="px-3 py-3 text-right font-heading uppercase text-zinc-500 text-xs tracking-widest">Place</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((r, index) => (
              <tr key={resultKey(r, index)} className="hover:bg-bg-dark-subtle transition-colors">
                <td className="px-3 py-3 text-zinc-500 font-mono whitespace-nowrap">{r.meet_date}</td>
                <td className="px-3 py-3 font-bold text-white max-w-[200px] truncate">{r.meet_name}</td>
                <td className="hidden md:table-cell px-3 py-3 text-zinc-500">{r.federation || "—"}</td>
                <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-zinc-500">{r.bodyweight_kg?.toFixed(1) || "—"}</td>
                <td className="px-3 py-3 text-right font-mono text-accent-red">{r.best_squat?.toFixed(1) || "—"}</td>
                <td className="px-3 py-3 text-right font-mono text-accent-blue">{r.best_bench?.toFixed(1) || "—"}</td>
                <td className="px-3 py-3 text-right font-mono text-accent-yellow">{r.best_deadlift?.toFixed(1) || "—"}</td>
                <td className="px-3 py-3 text-right font-mono font-extrabold text-accent-yellow">{r.total?.toFixed(1) || "—"}</td>
                <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-zinc-500">{r.dots?.toFixed(2) || "—"}</td>
                <td className={`px-3 py-3 text-right font-mono ${placeColor(r.place)}`}>{r.place || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
