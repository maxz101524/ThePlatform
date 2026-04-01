"use client";

import { VoteButtons } from "./vote-buttons";
import { getTimeAgo } from "@/lib/utils";
import { getAvatarColor, getAvatarInitial } from "@/lib/avatar";
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
    <article className="px-4 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/u/${username}`} className="shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-bold text-sm"
            style={{ backgroundColor: getAvatarColor(username) }}
          >
            {getAvatarInitial(username)}
          </div>
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <Link href={`/post/${postId}`} className="block space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading text-[15px] font-bold text-white">{username}</span>
              <span className="text-zinc-600 text-xs">@{username}</span>
              <span className="text-zinc-600">&middot;</span>
              <span className="font-mono text-xs text-zinc-500">{timeAgo}</span>
            </div>
            <p className="text-[15px] text-zinc-300 leading-relaxed">{bodyText}</p>
          </Link>

          {linkPreview && (
            <a
              href={linkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-white/10 rounded-xl overflow-hidden bg-bg-dark-subtle hover:bg-bg-dark-elevated transition-colors"
            >
              {linkPreview.thumbnail && (
                <img src={linkPreview.thumbnail} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-3 space-y-0.5">
                <p className="text-xs text-zinc-500">{linkPreview.domain}</p>
                <p className="text-sm font-bold text-white truncate">{linkPreview.title}</p>
                {linkPreview.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{linkPreview.description}</p>
                )}
              </div>
            </a>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-6 pt-1 -ml-2">
            <VoteButtons postId={postId} voteCount={voteCount} />
            <Link
              href={`/post/${postId}`}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-accent-blue transition-colors group"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs font-mono">{commentCount}</span>
            </Link>
            <button className="text-zinc-500 hover:text-accent-green transition-colors" aria-label="Share">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
