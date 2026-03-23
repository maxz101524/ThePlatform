"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

const FEDERATIONS = ["All", "IPF", "USAPL", "USPA", "SPF", "WRPF", "RPS", "APF", "WPC"];
const EQUIPMENT = ["All", "Raw", "Wraps", "Single-ply", "Multi-ply"];
const SORT_OPTIONS = [
  { label: "Total", value: "total" },
  { label: "DOTS", value: "dots" },
  { label: "Wilks", value: "wilks" },
  { label: "Squat", value: "best_squat" },
  { label: "Bench", value: "best_bench" },
  { label: "Deadlift", value: "best_deadlift" },
];

export function LeaderboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFed = searchParams.get("fed") || "All";
  const currentSex = searchParams.get("sex") || "M";
  const currentEquip = searchParams.get("equip") || "All";
  const currentSort = searchParams.get("sort") || "total";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("offset"); // reset pagination on filter change
      router.push(`/leaderboard?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-surface p-4">
      <FilterSelect label="Federation" value={currentFed} options={FEDERATIONS} onChange={(v) => updateFilter("fed", v)} />
      <FilterSelect label="Sex" value={currentSex} options={["M", "F"]} onChange={(v) => updateFilter("sex", v)} />
      <FilterSelect label="Equipment" value={currentEquip} options={EQUIPMENT} onChange={(v) => updateFilter("equip", v)} />
      <FilterSelect label="Sort By" value={currentSort} options={SORT_OPTIONS.map((s) => s.value)} labels={SORT_OPTIONS.map((s) => s.label)} onChange={(v) => updateFilter("sort", v)} />
      <Button variant="primary" size="sm" onClick={() => router.push("/leaderboard")}>
        Reset
      </Button>
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-heading uppercase tracking-wider text-text-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
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
