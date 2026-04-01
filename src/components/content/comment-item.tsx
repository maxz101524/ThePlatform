"use client";

import { useState } from "react";
import { deleteComment } from "@/app/actions/comments";
import { CommentForm } from "./comment-form";
import { getTimeAgo } from "@/lib/utils";
import { getAvatarColor, getAvatarInitial } from "@/lib/avatar";
import type { Comment } from "@/lib/types";

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  postId: string;
  depth: number;
}

export function CommentItem({ comment, currentUserId, postId, depth }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const timeAgo = getTimeAgo(comment.created_at);
  const canReply = currentUserId && depth < 3;
  const isOwner = currentUserId === comment.user_id;
  const displayName = comment.profiles.display_name || comment.profiles.username;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-heading font-bold text-xs mt-0.5"
          style={{ backgroundColor: getAvatarColor(comment.profiles.username) }}
        >
          {getAvatarInitial(comment.profiles.username)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm font-bold text-white">
              {displayName}
            </span>
            <span className="text-zinc-600">&middot;</span>
            <span className="font-mono text-xs text-zinc-500">{timeAgo}</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{comment.body_text}</p>
          <div className="flex items-center gap-3 pt-0.5">
            {canReply && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-zinc-500 hover:text-accent-red transition-colors"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => deleteComment(comment.id, postId)}
                className="text-xs text-zinc-500 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          {showReply && (
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onCancel={() => setShowReply(false)}
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  );
}
