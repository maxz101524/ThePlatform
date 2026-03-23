import { createClient } from "@/lib/supabase/server";
import { LeaderboardFilters, LeaderboardEntry } from "@/lib/types";

export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_sex: filters.sex,
    p_equipment: filters.equipment || null,
    p_federation: filters.federation || null,
    p_weight_class: filters.weightClass || null,
    p_year_from: filters.yearFrom || null,
    p_year_to: filters.yearTo || null,
    p_sort_by: filters.sortBy,
    p_limit: filters.limit,
    p_offset: filters.offset,
  });

  if (error) throw new Error(`Leaderboard query failed: ${error.message}`);

  return (data || []).map((row: Record<string, unknown>, i: number) => ({
    rank: filters.offset + i + 1,
    lifter_id: row.lifter_id as string,
    lifter_name: row.lifter_name as string,
    lifter_slug: encodeURIComponent((row.lifter_opl_name as string).toLowerCase().replace(/ /g, "-")),
    bodyweight_kg: row.bodyweight_kg as number | null,
    best_squat: row.best_squat as number | null,
    best_bench: row.best_bench as number | null,
    best_deadlift: row.best_deadlift as number | null,
    total: row.total as number | null,
    dots: row.dots as number | null,
    equipment: row.equipment as string,
    meet_date: row.meet_date as string,
    meet_name: row.meet_name as string,
  }));
}
