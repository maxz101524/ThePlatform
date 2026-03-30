import { LeaderboardEntry } from "@/lib/types";
import { TagChip } from "@/components/ui/chip";
import { isRecent, formatDate } from "./utils";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

function PodiumCardFirst({ entry }: { entry: LeaderboardEntry }) {
  const recent = isRecent(entry.meet_date);

  return (
    <div className="bg-bg-dark-elevated rounded-t-xl relative overflow-hidden flex flex-col justify-end h-[480px] border-b-8 border-rank-gold shadow-glow-gold ring-1 ring-white/5">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-rank-gold/15 rounded-full blur-[100px]" />

      {/* Rank background number */}
      <span className="absolute top-4 left-8 font-mono text-[10rem] font-black text-rank-gold/10 italic leading-none select-none">
        1
      </span>

      {/* Content */}
      <div className="relative p-10">
        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-heading border border-rank-gold/30 px-3 py-1 rounded-sm text-rank-gold font-bold uppercase tracking-wider">
            {entry.equipment}
          </span>
          {entry.tested && (
            <span className="text-[10px] font-heading border border-rank-gold/30 px-3 py-1 rounded-sm text-rank-gold font-bold uppercase tracking-wider">
              Tested
            </span>
          )}
          {recent && (
            <span className="text-[10px] font-heading border border-rank-gold/30 px-3 py-1 rounded-sm text-rank-gold font-bold uppercase tracking-wider">
              New
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-display text-5xl font-extrabold leading-none tracking-tight text-white">
          {entry.lifter_name}
        </h3>
        {entry.country && (
          <span className="text-xs text-zinc-500 mt-1 block">{entry.country}</span>
        )}

        {/* Total */}
        <div className="mt-6">
          <span className="font-mono text-7xl font-black text-rank-gold">
            {entry.total.toFixed(1)}
          </span>
          <span className="text-2xl font-heading opacity-60 text-rank-gold ml-1">KG</span>
        </div>

        {/* S/B/D grid */}
        <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8 mt-8">
          <div>
            <p className="text-[10px] font-heading text-zinc-400 uppercase font-bold tracking-widest mb-2">Squat</p>
            <p className="font-mono text-3xl font-bold text-accent-red">
              {entry.best_squat?.toFixed(1) ?? "---"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-heading text-zinc-400 uppercase font-bold tracking-widest mb-2">Bench</p>
            <p className="font-mono text-3xl font-bold text-accent-blue">
              {entry.best_bench?.toFixed(1) ?? "---"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-heading text-zinc-400 uppercase font-bold tracking-widest mb-2">Deadlift</p>
            <p className="font-mono text-3xl font-bold text-accent-yellow">
              {entry.best_deadlift?.toFixed(1) ?? "---"}
            </p>
          </div>
        </div>

        {/* DOTS + Fed + Date */}
        <div className="mt-6 flex items-center gap-3 text-zinc-500 font-mono text-xs">
          {entry.dots && <span>{entry.dots.toFixed(2)} DOTS</span>}
          <span>{entry.federation}</span>
          <span>{formatDate(entry.meet_date)}</span>
        </div>
      </div>
    </div>
  );
}

function PodiumCardRunnerUp({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: 2 | 3;
}) {
  const recent = isRecent(entry.meet_date);
  const isSecond = rank === 2;

  const borderColor = isSecond ? "border-rank-silver" : "border-rank-bronze";
  const totalColor = isSecond ? "text-rank-silver" : "text-rank-bronze";
  const glowBg = isSecond ? "bg-rank-silver/10" : "bg-rank-bronze/10";
  const rankTextColor = isSecond ? "text-rank-silver/10" : "text-rank-bronze/10";

  return (
    <div className={`bg-bg-dark-elevated rounded-t-xl relative overflow-hidden flex flex-col justify-end h-[360px] border-b-4 ${borderColor} shadow-lg`}>
      {/* Glow */}
      <div className={`absolute -top-10 -right-10 w-48 h-48 ${glowBg} rounded-full blur-[60px]`} />

      {/* Rank background number */}
      <span className={`absolute top-4 left-6 font-mono text-8xl font-black ${rankTextColor} italic leading-none select-none`}>
        {rank}
      </span>

      {/* Content */}
      <div className="relative p-8">
        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] font-heading border border-white/10 px-2 py-0.5 rounded-sm text-zinc-400 uppercase tracking-wider">
            {entry.equipment}
          </span>
          {entry.tested && (
            <span className="text-[10px] font-heading border border-white/10 px-2 py-0.5 rounded-sm text-zinc-400 uppercase tracking-wider">
              Tested
            </span>
          )}
          {recent && (
            <span className="text-[10px] font-heading border border-white/10 px-2 py-0.5 rounded-sm text-zinc-400 uppercase tracking-wider">
              New
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-display text-2xl font-bold leading-tight text-white">
          {entry.lifter_name}
        </h3>
        {entry.country && (
          <span className="text-xs text-zinc-500 mt-0.5 block">{entry.country}</span>
        )}

        {/* Total */}
        <div className="mt-4">
          <span className={`font-mono text-5xl font-bold ${totalColor}`}>
            {entry.total.toFixed(1)}
          </span>
          <span className={`text-sm font-heading opacity-50 ${totalColor} ml-1`}>KG</span>
        </div>

        {/* S/B/D grid */}
        <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-6 mt-6">
          <div>
            <p className="text-[10px] font-heading text-zinc-500 uppercase font-bold tracking-widest mb-1">Squat</p>
            <p className="font-mono text-lg font-bold text-accent-red">
              {entry.best_squat?.toFixed(1) ?? "---"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-heading text-zinc-500 uppercase font-bold tracking-widest mb-1">Bench</p>
            <p className="font-mono text-lg font-bold text-accent-blue">
              {entry.best_bench?.toFixed(1) ?? "---"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-heading text-zinc-500 uppercase font-bold tracking-widest mb-1">Deadlift</p>
            <p className="font-mono text-lg font-bold text-accent-yellow">
              {entry.best_deadlift?.toFixed(1) ?? "---"}
            </p>
          </div>
        </div>

        {/* DOTS + Fed + Date */}
        <div className="mt-4 flex items-center gap-3 text-zinc-500 font-mono text-xs">
          {entry.dots && <span>{entry.dots.toFixed(2)} DOTS</span>}
          <span>{entry.federation}</span>
          <span>{formatDate(entry.meet_date)}</span>
        </div>
      </div>
    </div>
  );
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length < 3) return null;

  // Podium order: 2nd - 1st - 3rd
  const [first, second, third] = entries;

  return (
    <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4">
      {/* #2 — left side */}
      <div className="w-full md:w-[30%] order-2 md:order-1">
        <PodiumCardRunnerUp entry={second} rank={2} />
      </div>
      {/* #1 — center, tallest */}
      <div className="w-full md:w-[40%] order-1 md:order-2 z-20">
        <PodiumCardFirst entry={first} />
      </div>
      {/* #3 — right side */}
      <div className="w-full md:w-[30%] order-3">
        <PodiumCardRunnerUp entry={third} rank={3} />
      </div>
    </div>
  );
}
