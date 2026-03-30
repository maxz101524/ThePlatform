"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const FEDERATIONS = ["All", "IPF", "USAPL", "USPA", "SPF", "WRPF", "RPS", "APF", "WPC"];
const EQUIPMENT = ["All", "Raw", "Wraps", "Single-ply", "Multi-ply"];
const TESTED_OPTIONS = [
  { label: "All", value: "" },
  { label: "Tested", value: "true" },
  { label: "Untested", value: "false" },
];
const SORT_OPTIONS = [
  { label: "Total", value: "total" },
  { label: "DOTS", value: "dots" },
  { label: "Wilks", value: "wilks" },
  { label: "Squat", value: "best_squat" },
  { label: "Bench", value: "best_bench" },
  { label: "Deadlift", value: "best_deadlift" },
];

interface LeaderboardFiltersProps {
  weightClasses?: string[];
}

export function LeaderboardFilters({ weightClasses = [] }: LeaderboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFed = searchParams.get("fed") || "All";
  const currentSex = searchParams.get("sex") || "M";
  const currentEquip = searchParams.get("equip") || "All";
  const currentSort = searchParams.get("sort") || "total";
  const currentTested = searchParams.get("tested") || "";
  const currentClass = searchParams.get("class") || "All";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("offset");
      router.push(`/leaderboard?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Build dynamic subtitle from active filters
  const subtitle = [
    currentSex === "F" ? "Women" : "Men",
    currentEquip !== "All" ? currentEquip : null,
    currentTested === "true" ? "Tested" : currentTested === "false" ? "Untested" : null,
    currentClass !== "All" ? `${currentClass} kg` : null,
    currentFed !== "All" ? currentFed : "All Federations",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {/* Dynamic subtitle */}
      <p className="mb-4 text-sm text-text-on-dark-muted">{subtitle}</p>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-16">
        <FilterSelect label="Federation" value={currentFed} options={FEDERATIONS} onChange={(v) => updateFilter("fed", v)} />
        <FilterSelect label="Sex" value={currentSex} options={["M", "F"]} onChange={(v) => updateFilter("sex", v)} />
        <FilterSelect label="Equipment" value={currentEquip} options={EQUIPMENT} onChange={(v) => updateFilter("equip", v)} />
        <FilterSelect
          label="Tested"
          value={currentTested}
          options={TESTED_OPTIONS.map((t) => t.value)}
          labels={TESTED_OPTIONS.map((t) => t.label)}
          onChange={(v) => updateFilter("tested", v)}
        />
        {weightClasses.length > 0 && (
          <FilterSelect
            label="Weight Class"
            value={currentClass}
            options={["All", ...weightClasses]}
            labels={["All", ...weightClasses.map((wc) => `${wc} kg`)]}
            onChange={(v) => updateFilter("class", v)}
          />
        )}
        <FilterSelect
          label="Sort By"
          value={currentSort}
          options={SORT_OPTIONS.map((s) => s.value)}
          labels={SORT_OPTIONS.map((s) => s.label)}
          onChange={(v) => updateFilter("sort", v)}
        />
        <div className="flex flex-col justify-end">
          <button
            onClick={() => router.push("/leaderboard")}
            className="py-3 px-4 bg-bg-dark-elevated rounded-lg font-heading text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block font-heading uppercase text-[10px] font-bold tracking-widest text-zinc-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-dark-elevated border-none text-text-on-dark font-heading font-semibold text-xs rounded-lg focus:ring-1 focus:ring-accent-red py-3 px-3"
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>
            {labels ? labels[i] : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
