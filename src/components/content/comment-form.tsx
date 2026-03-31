"use client";

import { addComment } from "@/app/actions/comments";
import { useState, useTransition } from "react";

interface CommentFormProps {
  postId: string;
  parentCommentId?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentCommentId, onCancel, autoFocus }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await addComment(postId, body, parentCommentId);
        setBody("");
        onCancel?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        maxLength={1000}
        autoFocus={autoFocus}
        className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-accent-red placeholder:text-zinc-400"
        rows={3}
      />
      {error && <p className="text-xs text-semantic-error">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="px-4 py-1.5 text-xs font-heading uppercase tracking-wider rounded-lg bg-accent-red text-white hover:bg-accent-red/80 transition-colors disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
