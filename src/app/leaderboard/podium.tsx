import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";
import { isRecent, formatDate } from "./utils";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

const RANK_COLORS = {
  1: { accent: "bg-rank-gold", text: "text-rank-gold", border: "border-t-rank-gold" },
  2: { accent: "bg-rank-silver", text: "text-rank-silver", border: "border-t-rank-silver" },
  3: { accent: "bg-rank-bronze", text: "text-rank-bronze", border: "border-t-rank-bronze" },
} as const;

function PodiumCard({
  entry,
  rank,
  isCenter,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  isCenter: boolean;
}) {
  const colors = RANK_COLORS[rank];
  const recent = isRecent(entry.meet_date);

  return (
    <div
      className={`flex flex-col bg-bg-surface border-t-2 ${colors.border} p-5 ${
        isCenter ? "md:py-8" : ""
      }`}
    >
      {/* Rank number */}
      <span className={`font-heading text-6xl font-bold ${colors.text} leading-none`}>
        {rank}
      </span>

      {/* Name + country */}
      <h3 className="mt-3 font-heading text-xl font-bold uppercase text-text-primary">
        {entry.lifter_name}
      </h3>
      {entry.country && (
        <span className="text-xs text-text-muted">{entry.country}</span>
      )}

      {/* Chips */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TagChip variant="equipment">{entry.equipment}</TagChip>
        {entry.tested && <TagChip variant="tested">Tested</TagChip>}
        {recent && <TagChip variant="fresh">New</TagChip>}
      </div>

      {/* Total — hero number */}
      <div className="mt-4">
        <span className="font-mono text-3xl font-bold text-accent-secondary">
          {entry.total.toFixed(1)}
        </span>
        <span className="ml-1 text-xs text-text-muted">kg</span>
      </div>

      {/* S/B/D breakdown */}
      <p className="mt-1 font-mono text-xs text-text-muted">
        S: {entry.best_squat?.toFixed(1) ?? "—"} · B:{" "}
        {entry.best_bench?.toFixed(1) ?? "—"} · D:{" "}
        {entry.best_deadlift?.toFixed(1) ?? "—"}
      </p>

      {/* DOTS */}
      {entry.dots && (
        <p className="mt-1 font-mono text-xs text-text-secondary">
          {entry.dots.toFixed(2)} DOTS
        </p>
      )}

      {/* Federation + date */}
      <p className="mt-auto pt-3 text-xs text-text-muted">
        {entry.federation} · {formatDate(entry.meet_date)}
      </p>
    </div>
  );
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length < 3) return null;

  // Podium order: 2nd - 1st - 3rd
  const [first, second, third] = entries;

  return (
    <div className="grid grid-cols-2 gap-px md:grid-cols-3">
      {/* Mobile: #1 full width on top, #2/#3 side by side below */}
      {/* Desktop: 2nd - 1st - 3rd podium arrangement */}
      <div className="order-2 md:order-1">
        <PodiumCard entry={second} rank={2} isCenter={false} />
      </div>
      <div className="col-span-2 order-1 md:col-span-1 md:order-2">
        <PodiumCard entry={first} rank={1} isCenter={true} />
      </div>
      <div className="order-3">
        <PodiumCard entry={third} rank={3} isCenter={false} />
      </div>
    </div>
  );
}
