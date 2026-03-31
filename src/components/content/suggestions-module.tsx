import { getSuggestedUsers } from "@/lib/queries/follow";
import { FollowButton } from "@/components/profile/follow-button";
import Link from "next/link";

interface SuggestionsModuleProps {
  userId: string;
  weightClass?: string | null;
  equipment?: string | null;
}

export async function SuggestionsModule({ userId, weightClass, equipment }: SuggestionsModuleProps) {
  const suggestions = await getSuggestedUsers(userId, weightClass, equipment);

  if (suggestions.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
        <h3 className="font-heading text-xs tracking-[0.2em] font-bold text-zinc-400 uppercase">
          Who to Follow
        </h3>
        <p className="text-xs text-zinc-500">
          Explore the{" "}
          <Link href="/leaderboard" className="text-accent-red hover:underline">
            leaderboard
          </Link>{" "}
          to discover top lifters. Profile linking coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
      <h3 className="font-heading text-xs tracking-[0.2em] font-bold text-zinc-400 uppercase">
        Who to Follow
      </h3>
      {suggestions.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <Link href={`/u/${user.username}`} className="flex-1 min-w-0">
            <p className="font-heading text-xs font-bold text-zinc-900 uppercase truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-zinc-500">
              {[user.weight_class_kg && `${user.weight_class_kg}kg`, user.best_total && `${user.best_total}kg total`]
                .filter(Boolean)
                .join(" · ") || `${user.follower_count} followers`}
            </p>
          </Link>
          <FollowButton targetId={user.id} isFollowing={false} />
        </div>
      ))}
    </div>
  );
}
