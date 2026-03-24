"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
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
    <div className="bg-bg-surface p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-text-primary">
          Edit Profile
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* Identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display Name" name="display_name" defaultValue={profile.display_name} placeholder="Your name" />
          <Field label="Instagram" name="instagram" defaultValue={profile.instagram} placeholder="handle (without @)" />
        </div>

        <div>
          <label className="block text-xs font-heading uppercase tracking-wider text-text-muted mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            defaultValue={profile.bio || ""}
            placeholder="Tell the community about yourself..."
            rows={3}
            maxLength={300}
            className="w-full border border-border bg-bg-primary p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
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
          <p className="text-xs font-heading uppercase tracking-wider text-text-muted mb-2">
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
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
      <label className="block text-xs font-heading uppercase tracking-wider text-text-muted mb-1">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
      />
    </div>
  );
}

function NumField({ label, name, defaultValue }: {
  label: string; name: string; defaultValue: number | null;
}) {
  return (
    <div>
      <label className="block text-xs font-heading uppercase tracking-wider text-text-muted mb-1">
        {label}
      </label>
      <input
        name={name}
        type="number"
        step="0.5"
        defaultValue={defaultValue ?? ""}
        className="w-full border border-border bg-bg-primary px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
      />
    </div>
  );
}

function Select({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue: string; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-heading uppercase tracking-wider text-text-muted mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
