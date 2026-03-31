"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";

export function CreatePostForm() {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!expanded) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 cursor-pointer text-zinc-400 hover:border-accent-red transition-colors"
        onClick={() => setExpanded(true)}
      >
        What&apos;s on your mind?
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
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
      <form action={handleSubmit} className="space-y-3">
        <textarea
          name="body_text"
          placeholder="Share a take, link a video, start a discussion..."
          className="w-full border-none focus:ring-0 p-0 text-zinc-800 placeholder:text-zinc-400 resize-none text-sm focus:outline-none"
          rows={3}
          maxLength={2000}
          required
        />
        <input
          name="link_url"
          type="url"
          placeholder="Paste a link (optional)"
          className="w-full border border-zinc-200 bg-zinc-50 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-accent-red focus:outline-none"
        />
        {error && (
          <p className="text-sm text-semantic-error">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={() => setExpanded(false)}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent-red text-white font-heading px-8 py-2 rounded-lg hover:bg-accent-red/90 font-bold tracking-tight uppercase text-sm disabled:opacity-50"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
