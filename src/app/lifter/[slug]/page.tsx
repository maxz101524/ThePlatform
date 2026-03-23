import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLifterBySlug, getLifterResults, getLifterBests } from "@/lib/queries/lifter";
import { StatBlock } from "@/components/ui/stat-block";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ProgressionChart } from "./progression-chart";
import { CompetitionHistory } from "./competition-history";
import { TableSkeleton } from "@/components/ui/loading";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LifterDossierPage({ params }: Props) {
  const { slug } = await params;
  const lifter = await getLifterBySlug(slug);
  if (!lifter) notFound();

  const [results, bests] = await Promise.all([
    getLifterResults(lifter.id),
    getLifterBests(lifter.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {bests?.weight_class_kg && <Chip>{bests.weight_class_kg}kg</Chip>}
          {bests?.equipment && <Chip>{bests.equipment}</Chip>}
          {lifter.instagram && (
            <a
              href={`https://instagram.com/${lifter.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              @{lifter.instagram} ↗
            </a>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-6xl">
            {lifter.name}
          </h1>
          <Button variant="primary" size="md">
            Follow Lifter
          </Button>
        </div>
      </div>

      {/* Stats */}
      {bests && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBlock label="Squat" value={bests.best_squat?.toFixed(1) || "—"} />
          <StatBlock label="Bench" value={bests.best_bench?.toFixed(1) || "—"} />
          <StatBlock label="Deadlift" value={bests.best_deadlift?.toFixed(1) || "—"} />
          <StatBlock label="Total" value={bests.total?.toFixed(1) || "—"} highlight />
        </div>
      )}

      {/* Progression Chart */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-bg-surface" />}>
        <ProgressionChart results={results} />
      </Suspense>

      {/* Competition History */}
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <CompetitionHistory results={results} />
      </Suspense>
    </div>
  );
}
