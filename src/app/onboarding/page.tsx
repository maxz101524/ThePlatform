import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Already onboarded — skip back to feed
  if (user.profile?.weight_class_kg && user.profile?.equipment) {
    redirect("/");
  }

  return (
    <OnboardingForm oplName={user.profile?.opl_name ?? null} />
  );
}
