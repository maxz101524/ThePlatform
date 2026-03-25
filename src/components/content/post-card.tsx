"use client";

import { Card } from "@/components/ui/card";
import { VoteButtons } from "./vote-buttons";
import { getTimeAgo } from "@/lib/utils";
import Link from "next/link";

interface PostCardProps {
  postId: string;
  username: string;
  bodyText: string;
  linkUrl?: string | null;
  linkPreview?: { title?: string; description?: string; thumbnail?: string; domain?: string } | null;
  voteCount: number;
  commentCount: number;
  createdAt: string;
}

export function PostCard({ postId, username, bodyText, linkUrl, linkPreview, voteCount, commentCount, createdAt }: PostCardProps) {
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className="space-y-3">
      <Link href={`/post/${postId}`} className="block space-y-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-bold text-text-secondary">{username}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
        <p className="text-sm text-text-primary">{bodyText}</p>
      </Link>
      {linkPreview && (
        <a
          href={linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 border border-border p-3 transition-colors hover:border-accent-primary"
        >
          {linkPreview.thumbnail && (
            <img src={linkPreview.thumbnail} alt="" className="h-16 w-24 object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{linkPreview.title}</p>
            <p className="text-xs text-text-muted truncate">{linkPreview.description}</p>
            <p className="text-xs text-text-muted mt-1">{linkPreview.domain}</p>
          </div>
        </a>
      )}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <VoteButtons postId={postId} voteCount={voteCount} />
        <Link href={`/post/${postId}`} className="hover:text-accent-primary transition-colors">
          💬 {commentCount}
        </Link>
      </div>
    </Card>
  );
}

