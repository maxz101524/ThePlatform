"use client";

import { useState, useTransition } from "react";
import { addProfileMedia, removeProfileMedia } from "@/app/actions/media";
import { MediaEmbed } from "@/components/profile/media-embed";
import { Button } from "@/components/ui/button";
import type { ProfileMedia } from "@/lib/types";

interface MediaShowcaseProps {
  media: ProfileMedia[];
  isOwnProfile: boolean;
}

export function MediaShowcase({ media, isOwnProfile }: MediaShowcaseProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addProfileMedia({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
      }
    });
  }

  function handleRemove(mediaId: string) {
    startTransition(async () => {
      await removeProfileMedia(mediaId);
    });
  }

  if (media.length === 0 && !isOwnProfile) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-xl font-bold uppercase text-text-primary">
          Media
        </h2>
        {isOwnProfile && !showForm && (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            Add Media
          </Button>
        )}
      </div>

      {/* Add media form */}
      {showForm && (
        <div className="bg-bg-surface p-4 mb-4 space-y-3">
          <form action={handleAdd} className="space-y-3">
            <input
              name="url"
              type="url"
              placeholder="Paste a YouTube, Instagram, or TikTok URL"
              required
              className="w-full border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
            <input
              name="title"
              type="text"
              placeholder="Caption (optional)"
              maxLength={100}
              className="w-full border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
            {error && <p className="text-sm text-semantic-error">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => { setShowForm(false); setError(null); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
          <p className="text-xs text-text-muted">
            Supported: YouTube videos/shorts, Instagram posts/reels, TikTok videos
          </p>
        </div>
      )}

      {/* Media grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {media.map((item) => (
            <div key={item.id} className="relative border border-border bg-bg-surface overflow-hidden">
              <MediaEmbed media={item} />
              {item.title && (
                <p className="px-3 py-2 text-xs text-text-secondary truncate">{item.title}</p>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="absolute top-2 right-2 bg-bg-primary/80 text-text-muted hover:text-semantic-error px-2 py-1 text-xs transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : isOwnProfile ? (
        <div className="border border-border bg-bg-surface p-8 text-center">
          <p className="text-text-muted text-sm">
            Showcase your training footage, competition highlights, and more.
          </p>
        </div>
      ) : null}
    </div>
  );
}
