import { createClient } from "@/lib/supabase/server";
import { MeetSummary, CompetitionResult } from "@/lib/types";

export async function getMeets(filters: {
  search?: string;
  federation?: string;
  year?: number;
  limit?: number;
  offset?: number;
}): Promise<MeetSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, country, city, state")
    .order("date", { ascending: false })
    .limit(filters.limit || 50)
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

  if (filters.search) {
    query = query.textSearch("name_search", filters.search);
  }
  if (filters.federation) {
    query = query.eq("federation", filters.federation);
  }
  if (filters.year) {
    query = query.gte("date", `${filters.year}-01-01`).lte("date", `${filters.year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Meets query failed: ${error.message}`);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
    country: m.country,
    city: m.city,
    state: m.state,
  }));
}

export async function getMeetBySlug(slug: string) {
  const supabase = await createClient();
  const meetPath = decodeURIComponent(slug).replace(/-/g, "/");

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date, country, city, state")
    .ilike("opl_meet_path", meetPath)
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: encodeURIComponent(data.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: data.federation,
    date: data.date,
    country: data.country,
    city: data.city,
    state: data.state,
  };
}

export async function getMeetResults(meetId: string): Promise<CompetitionResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("results")
    .select(`
      id, lifter_id, meet_id, weight_class_kg, bodyweight_kg, equipment,
      squat_1, squat_2, squat_3, bench_1, bench_2, bench_3,
      deadlift_1, deadlift_2, deadlift_3,
      best_squat, best_bench, best_deadlift, total, dots, wilks, place,
      lifters!inner(name, opl_name),
      meets!inner(name, opl_meet_path, date)
    `)
    .eq("meet_id", meetId)
    .order("weight_class_kg")
    .order("place");

  if (error) throw new Error(`Meet results query failed: ${error.message}`);

  return (data || []).map((row: Record<string, unknown>) => {
    const lifter = row.lifters as Record<string, string>;
    const meet = row.meets as Record<string, string>;
    return {
      id: row.id as string,
      lifter_id: row.lifter_id as string,
      lifter_name: lifter.name,
      lifter_slug: encodeURIComponent(lifter.opl_name.toLowerCase().replace(/ /g, "-")),
      meet_id: row.meet_id as string,
      meet_name: meet.name,
      meet_slug: encodeURIComponent(meet.opl_meet_path.toLowerCase().replace(/\//g, "-")),
      meet_date: meet.date,
      weight_class_kg: row.weight_class_kg as string,
      bodyweight_kg: row.bodyweight_kg as number | null,
      equipment: row.equipment as string,
      squat_1: row.squat_1 as number | null,
      squat_2: row.squat_2 as number | null,
      squat_3: row.squat_3 as number | null,
      bench_1: row.bench_1 as number | null,
      bench_2: row.bench_2 as number | null,
      bench_3: row.bench_3 as number | null,
      deadlift_1: row.deadlift_1 as number | null,
      deadlift_2: row.deadlift_2 as number | null,
      deadlift_3: row.deadlift_3 as number | null,
      best_squat: row.best_squat as number | null,
      best_bench: row.best_bench as number | null,
      best_deadlift: row.best_deadlift as number | null,
      total: row.total as number | null,
      dots: row.dots as number | null,
      wilks: row.wilks as number | null,
      place: row.place as string,
    };
  });
}
