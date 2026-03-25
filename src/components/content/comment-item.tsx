"use client";

import { useState } from "react";
import { deleteComment } from "@/app/actions/comments";
import { CommentForm } from "./comment-form";
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
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="space-y-1 py-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-bold text-text-secondary">
            {comment.profiles.display_name || comment.profiles.username}
          </span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
        <p className="text-sm text-text-primary">{comment.body_text}</p>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {canReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="hover:text-accent-primary transition-colors"
            >
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => deleteComment(comment.id, postId)}
              className="hover:text-semantic-error transition-colors"
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
