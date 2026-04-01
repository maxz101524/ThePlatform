import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, display_name, opl_name, sex, weight_class_kg, equipment")
    .eq("id", user.id)
    .single();

  return { ...user, profile };
}
