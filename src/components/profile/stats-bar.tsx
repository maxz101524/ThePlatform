import { StatBlock } from "@/components/ui/stat-block";
import type { UserProfile } from "@/lib/types";

interface StatsBarProps {
  profile: UserProfile;
}

export function StatsBar({ profile }: StatsBarProps) {
  const hasStats = profile.best_squat || profile.best_bench || profile.best_deadlift || profile.best_total;

  if (!hasStats) return null;

  return (
    <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-bg-surface p-4">
      {profile.best_squat && <StatBlock label="Squat" value={profile.best_squat} />}
      {profile.best_bench && <StatBlock label="Bench" value={profile.best_bench} />}
      {profile.best_deadlift && <StatBlock label="Deadlift" value={profile.best_deadlift} />}
      {profile.best_total && <StatBlock label="Total" value={profile.best_total} highlight />}
      {profile.dots && <StatBlock label="DOTS" value={profile.dots.toFixed(2)} unit="" />}
      <div className="flex items-end gap-2">
        {profile.weight_class_kg && (
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-heading uppercase tracking-wider text-text-muted">
            {profile.weight_class_kg} kg
          </span>
        )}
        {profile.equipment && (
          <span className="inline-flex items-center rounded-full border border-accent-primary px-3 py-1 text-xs font-heading uppercase tracking-wider text-accent-primary">
            {profile.equipment}
          </span>
        )}
      </div>
    </div>
  );
}
