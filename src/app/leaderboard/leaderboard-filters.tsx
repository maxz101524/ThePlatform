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

  const subtitle = [
    currentSex === "F" ? "Women" : "Men",
    currentEquip !== "All" ? currentEquip : null,
    currentTested === "true" ? "Tested" : currentTested === "false" ? "Untested" : null,
    currentClass !== "All" ? `${currentClass} kg` : null,
    currentFed !== "All" ? currentFed : "All Federations",
  ]
    .filter(Boolean)
    .join(" · ");

  const hasActiveFilters = currentFed !== "All" || currentEquip !== "All" || currentTested !== "" || currentClass !== "All" || currentSex !== "M";

  return (
    <div>
      <p className="mb-4 text-sm text-text-on-dark-muted">{subtitle}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
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
            className={`py-3 px-4 rounded-lg font-heading text-xs uppercase tracking-widest transition-colors ${
              hasActiveFilters
                ? "bg-bg-dark-elevated text-white hover:bg-bg-dark-subtle"
                : "bg-bg-dark-elevated text-zinc-600 cursor-default"
            }`}
            disabled={!hasActiveFilters}
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
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-bg-dark-elevated border border-white/10 text-text-on-dark font-heading font-semibold text-xs rounded-lg focus:ring-1 focus:ring-accent-red focus:border-accent-red py-3 pl-3 pr-8 cursor-pointer"
        >
          {options.map((opt, i) => (
            <option key={opt} value={opt}>
              {labels ? labels[i] : opt}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
