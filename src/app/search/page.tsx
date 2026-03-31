import Link from "next/link";
import { searchProfiles } from "@/lib/queries/search";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  if (!q) {
    return (
      <div className="bg-bg-light min-h-screen -mx-4 -mt-4 pb-20 md:pb-6 flex items-center justify-center">
        <p className="text-zinc-500">Search for users</p>
      </div>
    );
  }

  const profiles = await searchProfiles(q);

  return (
    <div className="bg-bg-light min-h-screen -mx-4 -mt-4 pb-20 md:pb-6">
      <div className="space-y-8">
        <h1 className="font-heading text-3xl font-bold uppercase text-zinc-900">
          Results for &ldquo;{q}&rdquo;
        </h1>

        {profiles.length > 0 ? (
          <div className="space-y-1">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/u/${p.username}`}
                className="flex items-center justify-between border border-zinc-200 bg-white rounded-lg px-4 py-3 transition-colors hover:border-accent-red"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 bg-zinc-100 border border-zinc-200 rounded-md flex items-center justify-center text-xs font-heading text-zinc-500 uppercase">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-md object-cover" />
                    ) : (
                      p.username[0]
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900">{p.display_name || p.username}</span>
                    <span className="ml-2 text-xs text-zinc-500">@{p.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {p.best_total && (
                    <span className="font-mono text-accent-yellow">{p.best_total}kg</span>
                  )}
                  {p.weight_class_kg && (
                    <span className="border border-zinc-200 rounded-sm px-2 py-0.5">{p.weight_class_kg}kg</span>
                  )}
                  {p.equipment && (
                    <span className="border border-zinc-200 rounded-sm px-2 py-0.5">{p.equipment}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No users found for &ldquo;{q}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
