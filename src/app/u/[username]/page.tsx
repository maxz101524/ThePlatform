import { notFound } from "next/navigation";
import { getProfileByUsername, getUserResults, getUserPosts, getProfileMedia } from "@/lib/queries/profile";
import { isFollowing } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StatsBar } from "@/components/profile/stats-bar";
import { MediaShowcase } from "@/components/profile/media-showcase";
import { CompetitionHistory } from "@/components/profile/competition-history";
import { PostCard } from "@/components/content/post-card";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [results, posts, media, currentUser] = await Promise.all([
    getUserResults(profile.id),
    getUserPosts(profile.id),
    getProfileMedia(profile.id),
    getUser(),
  ]);

  const isOwnProfile = currentUser?.id === profile.id;
  const userIsFollowing = currentUser && !isOwnProfile
    ? await isFollowing(currentUser.id, profile.id)
    : false;

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={userIsFollowing}
        isLoggedIn={!!currentUser}
      />

      {/* Stats */}
      <StatsBar profile={profile} />

      {/* Media */}
      <MediaShowcase media={media} isOwnProfile={isOwnProfile} />

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
