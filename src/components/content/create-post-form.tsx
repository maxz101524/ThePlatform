"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/app/actions/posts";
import { getAvatarColor, getAvatarInitial } from "@/lib/avatar";

interface CreatePostFormProps {
  username: string;
}

export function CreatePostForm({ username }: CreatePostFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!expanded) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-white/10 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(true)}
      >
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-heading font-bold text-sm"
          style={{ backgroundColor: getAvatarColor(username) }}
        >
          {getAvatarInitial(username)}
        </div>
        <span className="text-[15px] text-zinc-500">What&apos;s on your mind?</span>
      </div>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPost({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setExpanded(false);
      }
    });
  }

  return (
    <div className="px-4 py-4 border-b border-white/10">
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-heading font-bold text-sm"
          style={{ backgroundColor: getAvatarColor(username) }}
        >
          {getAvatarInitial(username)}
        </div>
        <form action={handleSubmit} className="flex-1 min-w-0 space-y-3">
          <textarea
            name="body_text"
            placeholder="Share a take, link a video, start a discussion..."
            className="w-full border-none focus:ring-0 p-0 text-[15px] text-white bg-transparent placeholder:text-zinc-500 resize-none focus:outline-none"
            rows={3}
            maxLength={2000}
            required
            autoFocus
          />
          <input
            name="link_url"
            type="url"
            placeholder="Paste a link (optional)"
            className="w-full border border-white/10 bg-bg-dark-subtle rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-accent-red focus:outline-none"
          />
          {error && (
            <p className="text-sm text-semantic-error">{error}</p>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-zinc-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setExpanded(false)} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors px-3 py-1.5">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-accent-red text-white font-heading px-6 py-1.5 rounded-full hover:bg-accent-red/90 font-bold tracking-tight uppercase text-sm disabled:opacity-50 transition-colors"
              >
                {isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
