import { createClient } from "@/lib/supabase/server";

export async function searchLifters(query: string, limit = 20) {
  const supabase = await createClient();
  const tsquery = query.split(/\s+/).join(" & ");

  const { data } = await supabase
    .from("lifters")
    .select("id, opl_name, name, sex, country")
    .textSearch("name_search", tsquery)
    .limit(limit);

  return (data || []).map((l) => ({
    id: l.id,
    name: l.name,
    slug: encodeURIComponent(l.opl_name.toLowerCase().replace(/ /g, "-")),
    sex: l.sex,
    country: l.country,
  }));
}

export async function searchMeets(query: string, limit = 10) {
  const supabase = await createClient();
  const tsquery = query.split(/\s+/).join(" & ");

  const { data } = await supabase
    .from("meets")
    .select("id, opl_meet_path, name, federation, date")
    .textSearch("name_search", tsquery)
    .limit(limit);

  return (data || []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: encodeURIComponent(m.opl_meet_path.toLowerCase().replace(/\//g, "-")),
    federation: m.federation,
    date: m.date,
  }));
}
