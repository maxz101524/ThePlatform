import { notFound } from "next/navigation";
import { getMeetBySlug, getMeetResults } from "@/lib/queries/meets";
import { Chip } from "@/components/ui/chip";
import { MeetResultsTable } from "./meet-results-table";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MeetPage({ params }: Props) {
  const { slug } = await params;
  const meet = await getMeetBySlug(slug);
  if (!meet) notFound();

  const results = await getMeetResults(meet.id);

  const location = [meet.city, meet.state, meet.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Chip>{meet.federation}</Chip>
        <h1 className="mt-2 font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
          {meet.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {meet.date} · {location} · {results.length} lifters
        </p>
      </div>

      <MeetResultsTable results={results} />
    </div>
  );
}
