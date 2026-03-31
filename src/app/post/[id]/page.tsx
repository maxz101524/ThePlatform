import { notFound } from "next/navigation";
import { getPostById } from "@/lib/queries/feed";
import { getComments } from "@/lib/queries/comments";
import { getUser } from "@/lib/auth";
import { PostCard } from "@/components/content/post-card";
import { CommentThread } from "@/components/content/comment-thread";
import { CommentForm } from "@/components/content/comment-form";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, comments, user] = await Promise.all([
    getPostById(id),
    getComments(id),
    getUser(),
  ]);

  if (!post) notFound();

  return (
    <div className="bg-bg-light min-h-screen">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          &larr; Back to feed
        </Link>

        <PostCard
          postId={post.id}
          username={post.profiles.username}
          bodyText={post.body_text}
          linkUrl={post.link_url}
          linkPreview={post.link_preview}
          voteCount={post.vote_count}
          commentCount={post.comment_count}
          createdAt={post.created_at}
        />

        <Card className="space-y-4">
          <h2 className="font-heading text-sm uppercase tracking-wider text-zinc-500">
            Comments ({post.comment_count})
          </h2>

          {user ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="text-sm text-zinc-500">
              <Link href="/login" className="text-accent-red hover:underline">
                Log in
              </Link>{" "}
              to comment
            </p>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">Be the first to comment</p>
          ) : (
            <CommentThread comments={comments} currentUserId={user?.id ?? null} postId={post.id} />
          )}
        </Card>
      </div>
    </div>
  );
}
