"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeOnboarding } from "@/app/actions/profile";

const WEIGHT_CLASSES: Record<string, string[]> = {
  M: ["53", "59", "66", "74", "83", "93", "105", "120", "120+"],
  F: ["43", "47", "52", "57", "63", "69", "76", "84", "84+"],
  Mx: ["43", "47", "52", "53", "57", "59", "63", "66", "69", "74", "76", "83", "84", "84+", "93", "105", "120", "120+"],
};
const ALL_WEIGHT_CLASSES = WEIGHT_CLASSES.Mx;

const EQUIPMENT = ["Raw", "Wraps", "Single-ply", "Multi-ply"];
const SEXES = ["M", "F", "Mx"];

interface OnboardingFormProps {
  oplName: string | null;
}

export function OnboardingForm({ oplName }: OnboardingFormProps) {
  const [sex, setSex] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const weightOptions = sex ? WEIGHT_CLASSES[sex] : ALL_WEIGHT_CLASSES;

  function handleSubmit(formData: FormData) {
    // Inject chip selections into formData (they're not real inputs)
    formData.set("sex", sex);
    formData.set("equipment", equipment);
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-bg-dark min-h-screen -mx-4 -mt-4 flex items-start justify-center pb-20">
      <div className="w-full max-w-md pt-16 px-4">
        {/* Wordmark */}
        <p className="text-center font-heading font-black text-white text-xl mb-10 after:content-['.'] after:text-accent-red">
          THE PLATFORM
        </p>

        <div className="bg-bg-dark-elevated border border-white/10 rounded-xl p-8 space-y-7">
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-3xl font-bold uppercase text-white tracking-tight">
              Set Up Your Profile
            </h1>
            <p className="text-sm text-zinc-500">
              Help us personalize your feed and suggestions.
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {/* Display name */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Display Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                name="display_name"
                type="text"
                placeholder="Your real name or nickname"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <span className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Sex
              </span>
              <div className="flex gap-2">
                {SEXES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(sex === s ? "" : s)}
                    className={`px-5 py-2 rounded-md font-heading text-xs font-bold uppercase tracking-wider border transition-colors ${
                      sex === s
                        ? "bg-accent-red border-accent-red text-white"
                        : "border-white/20 text-zinc-400 hover:border-white/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight class */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Weight Class (kg)
              </label>
              <select
                name="weight_class_kg"
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Select weight class</option>
                {weightOptions.map((wc) => (
                  <option key={wc} value={wc}>{wc} kg</option>
                ))}
              </select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <span className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                Equipment
              </span>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setEquipment(equipment === eq ? "" : eq)}
                    className={`px-4 py-2 rounded-md font-heading text-xs font-bold uppercase tracking-wider border transition-colors ${
                      equipment === eq
                        ? "bg-accent-red border-accent-red text-white"
                        : "border-white/20 text-zinc-400 hover:border-white/40"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* OPL name */}
            <div className="space-y-1.5">
              <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
                OpenPowerlifting Name <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                name="opl_name"
                type="text"
                placeholder="e.g. John Haack"
                defaultValue={oplName ?? ""}
                className="w-full border border-white/10 bg-bg-dark rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none placeholder:text-zinc-600"
              />
              <p className="text-[11px] text-zinc-600">
                Links your account to competition history from OpenPowerlifting.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-accent-red text-white font-heading font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-accent-red/90 disabled:opacity-50 transition-colors text-sm"
              >
                {isPending ? "Saving..." : "Let's Go"}
              </button>
              <div className="text-center">
                <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Skip for now →
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
