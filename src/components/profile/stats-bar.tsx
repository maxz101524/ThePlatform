import { StatBlock } from "@/components/ui/stat-block";
import type { UserProfile } from "@/lib/types";

interface StatsBarProps {
  profile: UserProfile;
}

export function StatsBar({ profile }: StatsBarProps) {
  const hasStats = profile.best_squat || profile.best_bench || profile.best_deadlift || profile.best_total;

  if (!hasStats) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {profile.best_squat && <StatBlock label="Squat" value={profile.best_squat} accent="red" />}
        {profile.best_bench && <StatBlock label="Bench" value={profile.best_bench} accent="blue" />}
        {profile.best_deadlift && <StatBlock label="Deadlift" value={profile.best_deadlift} accent="yellow" />}
        {profile.best_total && <StatBlock label="Total" value={profile.best_total} accent="default" />}
        {profile.dots && <StatBlock label="DOTS" value={profile.dots.toFixed(2)} unit="" />}
      </div>
      {(profile.weight_class_kg || profile.equipment) && (
        <div className="flex gap-2">
          {profile.weight_class_kg && (
            <span className="font-heading text-xs border border-white/10 px-3 py-1 rounded-sm text-zinc-400 uppercase">
              {profile.weight_class_kg} kg
            </span>
          )}
          {profile.equipment && (
            <span className="font-heading text-xs border border-white/10 px-3 py-1 rounded-sm text-zinc-400 uppercase">
              {profile.equipment}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
