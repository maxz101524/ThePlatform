import { createClient } from "@/lib/supabase/server";

export async function searchProfiles(query: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, best_total, weight_class_kg, equipment")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit);

  if (error) return [];
  return data || [];
}
