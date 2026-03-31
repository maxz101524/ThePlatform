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
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-bold text-zinc-900 uppercase">{username}</span>
          <span className="text-zinc-300">·</span>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">{timeAgo}</span>
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed">{bodyText}</p>
      </Link>
      {linkPreview && (
        <a
          href={linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-zinc-100 rounded-xl overflow-hidden flex bg-zinc-50 hover:bg-zinc-100 transition-colors"
        >
          {linkPreview.thumbnail && (
            <img src={linkPreview.thumbnail} alt="" className="h-16 w-24 object-cover" />
          )}
          <div className="flex-1 min-w-0 p-3">
            <p className="text-sm font-bold text-zinc-900 truncate">{linkPreview.title}</p>
            <p className="text-xs text-zinc-500 truncate">{linkPreview.description}</p>
            <p className="text-xs text-zinc-400 mt-1">{linkPreview.domain}</p>
          </div>
        </a>
      )}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <VoteButtons postId={postId} voteCount={voteCount} />
        <Link href={`/post/${postId}`} className="hover:text-accent-red transition-colors">
          💬 {commentCount}
        </Link>
      </div>
    </Card>
  );
}

