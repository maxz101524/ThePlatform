import { notFound } from "next/navigation";
import { getProfileByUsername, getUserResults, getUserPosts, getProfileMedia } from "@/lib/queries/profile";
import { isFollowing } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StatsBar } from "@/components/profile/stats-bar";
import { MediaShowcase } from "@/components/profile/media-showcase";
import { CompetitionHistory } from "@/components/profile/competition-history";
import { PostCard } from "@/components/content/post-card";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function postKey(
  post: {
    id?: string | null;
    created_at: string;
    body_text: string;
    profiles: { username: string };
  },
  index: number,
): string {
  return post.id ?? `${post.profiles.username}-${post.created_at}-${post.body_text.slice(0, 24)}-${index}`;
}

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab = "posts" } = await searchParams;
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
    <>
      {/* Dark Hero */}
      <div className="-mx-4 -mt-4 bg-bg-dark pt-20 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={userIsFollowing}
            isLoggedIn={!!currentUser}
          />
          <StatsBar profile={profile} />
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-4 bg-bg-dark">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={null}>
            <ProfileTabs username={username} />
          </Suspense>
        </div>
      </div>

      {/* Tab Content */}
      <div className="-mx-4 bg-bg-dark min-h-[400px]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          {tab === "posts" && (
            <section>
              {posts.length > 0 ? (
                <div className="max-w-[600px] divide-y divide-white/10">
                  {posts.map((post, index) => (
                    <PostCard
                      key={postKey(post, index)}
                      postId={post.id}
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
              ) : (
                <p className="text-zinc-500 text-sm py-8">
                  {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                </p>
              )}
            </section>
          )}

          {tab === "media" && (
            <MediaShowcase media={media} isOwnProfile={isOwnProfile} />
          )}

          {tab === "competition" && (
            <section>
              <CompetitionHistory results={results} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
