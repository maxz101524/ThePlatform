"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CompetitionResult } from "@/lib/types";

interface Props {
  results: CompetitionResult[];
}

export function ProgressionChart({ results }: Props) {
  const [range, setRange] = useState<"all" | "last8">("all");

  const sorted = [...results]
    .filter((r) => r.total && r.total > 0)
    .sort((a, b) => a.meet_date.localeCompare(b.meet_date));

  const data = (range === "last8" ? sorted.slice(-8) : sorted).map((r) => ({
    date: r.meet_date,
    total: r.total,
    squat: r.best_squat,
    bench: r.best_bench,
    deadlift: r.best_deadlift,
    meet: r.meet_name,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-text-primary">
          Progression & History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setRange("all")}
            className={`rounded px-3 py-1 text-xs font-heading uppercase ${
              range === "all" ? "bg-bg-surface text-text-primary" : "text-text-muted"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setRange("last8")}
            className={`rounded px-3 py-1 text-xs font-heading uppercase ${
              range === "last8" ? "bg-bg-surface text-text-primary" : "text-text-muted"
            }`}
          >
            Last 8 Meets
          </button>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis
              dataKey="date"
              stroke="#666666"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#666666" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: 8,
                color: "#FFFFFF",
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#E8491A"
              strokeWidth={2}
              dot={{ fill: "#FFFFFF", r: 4 }}
              activeDot={{ fill: "#E8491A", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
