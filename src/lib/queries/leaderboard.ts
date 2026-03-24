import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry, LeaderboardFilters } from "@/lib/types";

export async function getLeaderboard(
  filters: LeaderboardFilters
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("sex", filters.sex);

  if (filters.equipment) {
    query = query.eq("equipment", filters.equipment);
  }
  if (filters.weightClass) {
    query = query.eq("weight_class_kg", filters.weightClass);
  }
  if (filters.federation) {
    query = query.eq("federation", filters.federation);
  }

  query = query.order(filters.sortBy, { ascending: false, nullsFirst: false });

  // When viewing across all weight classes, a lifter can appear multiple times
  // (once per weight class). Fetch extra rows and deduplicate to show only each
  // lifter's best result, matching how OpenPowerlifting displays rankings.
  if (!filters.weightClass) {
    const overfetch = (filters.offset + filters.limit) * 3;
    query = query.range(0, overfetch - 1);

    const { data, error } = await query;
    if (error) {
      console.error("Leaderboard query error:", error.message);
      return [];
    }

    const seen = new Set<string>();
    const unique = (data as LeaderboardEntry[]).filter((entry) => {
      if (seen.has(entry.lifter_opl_name)) return false;
      seen.add(entry.lifter_opl_name);
      return true;
    });

    return unique.slice(filters.offset, filters.offset + filters.limit);
  }

  query = query.range(filters.offset, filters.offset + filters.limit - 1);

  const { data, error } = await query;
  if (error) {
    console.error("Leaderboard query error:", error.message);
    return [];
  }
  return (data as LeaderboardEntry[]) || [];
}

export async function getWeightClasses(
  sex: string,
  equipment?: string
): Promise<string[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leaderboard_entries")
    .select("weight_class_kg")
    .eq("sex", sex);

  if (equipment) query = query.eq("equipment", equipment);

  const { data } = await query;
  if (!data) return [];

  const unique = [...new Set(data.map((d) => d.weight_class_kg))];
  return unique.sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (isNaN(na) || isNaN(nb)) return a.localeCompare(b);
    return na - nb;
  });
}

export async function getFederations(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard_entries")
    .select("federation");

  if (!data) return [];
  return [...new Set(data.map((d) => d.federation))].sort();
}
