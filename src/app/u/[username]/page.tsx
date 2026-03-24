import { notFound } from "next/navigation";
import { getProfileByUsername, getUserResults, getUserPosts } from "@/lib/queries/profile";
import { isFollowing } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { StatsBar } from "@/components/profile/stats-bar";
import { CompetitionHistory } from "@/components/profile/competition-history";
import { FollowButton } from "@/components/profile/follow-button";
import { PostCard } from "@/components/content/post-card";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [results, posts, currentUser] = await Promise.all([
    getUserResults(profile.id),
    getUserPosts(profile.id),
    getUser(),
  ]);

  const isOwnProfile = currentUser?.id === profile.id;
  const userIsFollowing = currentUser && !isOwnProfile
    ? await isFollowing(currentUser.id, profile.id)
    : false;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 rounded-full bg-bg-surface border border-border flex items-center justify-center text-2xl font-heading text-text-muted uppercase">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            profile.username[0]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold uppercase text-text-primary truncate">
              {profile.display_name || profile.username}
            </h1>
            {currentUser && !isOwnProfile && (
              <FollowButton targetId={profile.id} isFollowing={userIsFollowing} />
            )}
          </div>
          <p className="text-sm text-text-muted">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-2 text-sm text-text-secondary max-w-lg">{profile.bio}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
            <span><strong className="text-text-primary">{profile.follower_count}</strong> followers</span>
            <span><strong className="text-text-primary">{profile.following_count}</strong> following</span>
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                @{profile.instagram}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar profile={profile} />

      {/* Competition History */}
      <div>
        <h2 className="font-heading text-xl font-bold uppercase text-text-primary mb-3">
          Competition History
        </h2>
        <CompetitionHistory results={results} />
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-bold uppercase text-text-primary mb-3">
            Posts
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                username={post.profiles.username}
                bodyText={post.body_text}
                linkUrl={post.link_url}
                linkPreview={post.link_preview}
                voteCount={post.vote_count}
                commentCount={post.comment_count}
                createdAt={post.created_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
