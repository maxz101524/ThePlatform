import { notFound } from "next/navigation";
import { getProfileByUsername, getUserResults, getUserPosts, getProfileMedia } from "@/lib/queries/profile";
import { isFollowing } from "@/lib/queries/follow";
import { getUser } from "@/lib/auth";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StatsBar } from "@/components/profile/stats-bar";
import { MediaShowcase } from "@/components/profile/media-showcase";
import { CompetitionHistory } from "@/components/profile/competition-history";
import { PostCard } from "@/components/content/post-card";

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
    <>
      {/* Dark Hero — break out of layout's max-w container */}
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

      {/* Light Content — break out of layout's max-w container */}
      <div className="-mx-4 bg-bg-light min-h-[500px]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 space-y-16">
          {/* Media */}
          <MediaShowcase media={media} isOwnProfile={isOwnProfile} />

          {/* Competition History */}
          <section>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-8">
              Competition History
            </h2>
            <CompetitionHistory results={results} />
          </section>

          {/* Posts */}
          {posts.length > 0 && (
            <section>
              <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-8">
                Posts
              </h2>
              <div className="space-y-4">
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
            </section>
          )}
        </div>
      </div>
    </>
  );
}
