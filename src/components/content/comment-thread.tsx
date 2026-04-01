"use client";

import { CommentItem } from "./comment-item";
import type { Comment } from "@/lib/types";

interface CommentThreadProps {
  comments: Comment[];
  currentUserId: string | null;
  postId: string;
}

export function CommentThread({ comments, currentUserId, postId }: CommentThreadProps) {
  // Build tree from flat list
  const rootComments = comments.filter((c) => !c.parent_comment_id);
  const childMap = new Map<string, Comment[]>();

  for (const comment of comments) {
    if (comment.parent_comment_id) {
      const children = childMap.get(comment.parent_comment_id) || [];
      children.push(comment);
      childMap.set(comment.parent_comment_id, children);
    }
  }

  function renderComment(comment: Comment, depth: number) {
    const children = childMap.get(comment.id) || [];
    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          currentUserId={currentUserId}
          postId={postId}
          depth={depth}
        />
        {children.map((child) => renderComment(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-border">
      {rootComments.map((comment) => renderComment(comment, 0))}
    </div>
  );
}
