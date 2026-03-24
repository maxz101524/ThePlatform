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

  query = query
    .order(filters.sortBy, { ascending: false, nullsFirst: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

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
