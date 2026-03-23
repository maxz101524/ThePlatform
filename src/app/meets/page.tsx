import Link from "next/link";
import { getMeets } from "@/lib/queries/meets";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function MeetsIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const meets = await getMeets({
    search: params.q,
    federation: params.fed,
    year: params.year ? parseInt(params.year) : undefined,
    limit: 50,
    offset: parseInt(params.offset || "0"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl font-bold uppercase text-text-primary md:text-5xl">
        Meet Hub
      </h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Meet</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Federation</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Date</th>
              <th className="px-3 py-3 font-heading text-xs uppercase tracking-wider text-text-muted">Location</th>
            </tr>
          </thead>
          <tbody>
            {meets.map((meet) => (
              <tr key={meet.id} className="border-b border-border/50 hover:bg-bg-surface transition-colors">
                <td className="px-3 py-3">
                  <Link
                    href={`/meet/${meet.slug}`}
                    className="font-bold text-text-primary hover:text-accent-primary transition-colors"
                  >
                    {meet.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-text-muted">{meet.federation}</td>
                <td className="px-3 py-3 text-text-muted whitespace-nowrap">{meet.date}</td>
                <td className="px-3 py-3 text-text-muted">
                  {[meet.city, meet.state, meet.country].filter(Boolean).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
