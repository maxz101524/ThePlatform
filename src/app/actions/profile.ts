"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(
  _prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Must be logged in" };

  const display_name = (formData.get("display_name") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const instagram = (formData.get("instagram") as string)?.replace(/^@/, "") || null;
  const sex = (formData.get("sex") as string) || null;
  const weight_class_kg = (formData.get("weight_class_kg") as string) || null;
  const equipment = (formData.get("equipment") as string) || null;

  const best_squat = parseNum(formData.get("best_squat") as string);
  const best_bench = parseNum(formData.get("best_bench") as string);
  const best_deadlift = parseNum(formData.get("best_deadlift") as string);
  const best_total = parseNum(formData.get("best_total") as string);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      bio,
      instagram,
      sex,
      weight_class_kg,
      equipment,
      best_squat,
      best_bench,
      best_deadlift,
      best_total,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Get username to revalidate the profile page
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile) revalidatePath(`/u/${profile.username}`);
  return { error: null };
}

function parseNum(val: string | null): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export async function completeOnboarding(
  _prevState: { error: string | null },
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Must be logged in" };

  const display_name = (formData.get("display_name") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const weight_class_kg = (formData.get("weight_class_kg") as string) || null;
  const equipment = (formData.get("equipment") as string) || null;
  const opl_name = (formData.get("opl_name") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, sex, weight_class_kg, equipment, opl_name })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}
