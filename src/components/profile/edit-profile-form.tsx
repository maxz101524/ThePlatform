"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";
import type { UserProfile } from "@/lib/types";

interface EditProfileFormProps {
  profile: UserProfile;
  onClose: () => void;
}

const sexOptions = [
  { value: "", label: "Not specified" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "Mx", label: "Mx" },
];

const equipmentOptions = [
  { value: "", label: "Not specified" },
  { value: "Raw", label: "Raw" },
  { value: "Wraps", label: "Wraps" },
  { value: "Single-ply", label: "Single-ply" },
  { value: "Multi-ply", label: "Multi-ply" },
];

export function EditProfileForm({ profile, onClose }: EditProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="bg-bg-dark-elevated rounded-lg p-6 space-y-4 border border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-white">
          Edit Profile
        </h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white font-heading uppercase text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* Identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display Name" name="display_name" defaultValue={profile.display_name} placeholder="Your name" />
          <Field label="Instagram" name="instagram" defaultValue={profile.instagram} placeholder="handle (without @)" />
        </div>

        <div>
          <label className="block text-zinc-400 font-heading uppercase text-xs tracking-wider mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            defaultValue={profile.bio || ""}
            placeholder="Tell the community about yourself..."
            rows={3}
            maxLength={300}
            className="w-full bg-bg-dark-elevated border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-zinc-500 focus:border-accent-red focus:outline-none"
          />
        </div>

        {/* Lifting identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Sex" name="sex" defaultValue={profile.sex || ""} options={sexOptions} />
          <Field label="Weight Class (kg)" name="weight_class_kg" defaultValue={profile.weight_class_kg} placeholder="e.g. 93" />
          <Select label="Equipment" name="equipment" defaultValue={profile.equipment || ""} options={equipmentOptions} />
        </div>

        {/* Best lifts */}
        <div>
          <p className="text-zinc-400 font-heading uppercase text-xs tracking-wider mb-2">
            Best Lifts (kg)
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumField label="Squat" name="best_squat" defaultValue={profile.best_squat} />
            <NumField label="Bench" name="best_bench" defaultValue={profile.best_bench} />
            <NumField label="Deadlift" name="best_deadlift" defaultValue={profile.best_deadlift} />
            <NumField label="Total" name="best_total" defaultValue={profile.best_total} />
          </div>
        </div>

        {error && <p className="text-sm text-semantic-error">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent-red text-white font-heading uppercase rounded-lg px-8 py-3 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string | null; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-zinc-400 font-heading uppercase text-xs tracking-wider mb-1">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full bg-bg-dark-elevated border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-accent-red focus:outline-none"
      />
    </div>
  );
}

function NumField({ label, name, defaultValue }: {
  label: string; name: string; defaultValue: number | null;
}) {
  return (
    <div>
      <label className="block text-zinc-400 font-heading uppercase text-xs tracking-wider mb-1">
        {label}
      </label>
      <input
        name={name}
        type="number"
        step="0.5"
        defaultValue={defaultValue ?? ""}
        className="w-full bg-bg-dark-elevated border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-500 focus:border-accent-red focus:outline-none"
      />
    </div>
  );
}

function Select({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue: string; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-zinc-400 font-heading uppercase text-xs tracking-wider mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-bg-dark-elevated border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-red focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
