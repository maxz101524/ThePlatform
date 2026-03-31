"use client";

import { useState } from "react";
import { deleteComment } from "@/app/actions/comments";
import { CommentForm } from "./comment-form";
import { getTimeAgo } from "@/lib/utils";
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

  return (
    <div className={depth > 0 ? "ml-6 border-l border-zinc-200 pl-4" : ""}>
      <div className="space-y-1 py-3">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-bold text-zinc-900 uppercase">
            {comment.profiles.display_name || comment.profiles.username}
          </span>
          <span className="text-zinc-400">·</span>
          <span className="font-mono text-[10px] text-zinc-500">{timeAgo}</span>
        </div>
        <p className="text-sm text-zinc-700">{comment.body_text}</p>
        <div className="flex items-center gap-3">
          {canReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-zinc-400 hover:text-accent-red transition-colors"
            >
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => deleteComment(comment.id, postId)}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
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
  );
}

