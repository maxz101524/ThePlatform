import { createClient } from "@/lib/supabase/server";
import { LifterProfile, CompetitionResult } from "@/lib/types";

export async function getLifterBySlug(slug: string): Promise<LifterProfile | null> {
  const supabase = await createClient();
  const oplName = decodeURIComponent(slug).replace(/-/g, " ");

  const { data } = await supabase
    .from("lifters")
    .select("id, opl_name, name, sex, country, birth_year, instagram")
    .ilike("opl_name", oplName)
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: encodeURIComponent(data.opl_name.toLowerCase().replace(/ /g, "-")),
    sex: data.sex,
    country: data.country,
    birth_year: data.birth_year,
    instagram: data.instagram,
  };
}

export async function getLifterResults(lifterId: string): Promise<CompetitionResult[]> {
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
    .eq("lifter_id", lifterId)
    .order("meets(date)", { ascending: false });

  if (error) throw new Error(`Lifter results query failed: ${error.message}`);

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

export async function getLifterBests(lifterId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("results")
    .select("best_squat, best_bench, best_deadlift, total, equipment, weight_class_kg")
    .eq("lifter_id", lifterId)
    .not("total", "is", null)
    .order("total", { ascending: false })
    .limit(1)
    .single();

  return data;
}
