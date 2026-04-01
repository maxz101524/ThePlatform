"use client";

import { useState, useTransition } from "react";
import { addProfileMedia, removeProfileMedia } from "@/app/actions/media";
import { MediaEmbed } from "@/components/profile/media-embed";
import type { ProfileMedia } from "@/lib/types";

interface MediaShowcaseProps {
  media: ProfileMedia[];
  isOwnProfile: boolean;
}

function mediaKey(item: ProfileMedia, index: number): string {
  return item.id || `${item.platform}-${item.url}-${item.sort_order}-${index}`;
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-white">
          Media
        </h2>
        {isOwnProfile && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-bg-dark-elevated border border-white/10 text-zinc-400 hover:border-accent-red hover:text-accent-red font-heading uppercase rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Add Media
          </button>
        )}
      </div>

      {/* Add media form */}
      {showForm && (
        <div className="bg-bg-dark-elevated rounded-xl border border-white/10 p-4 mb-6 space-y-3">
          <form action={handleAdd} className="space-y-3">
            <input
              name="url"
              type="url"
              placeholder="Paste a YouTube, Instagram, or TikTok URL"
              required
              className="w-full border border-white/10 bg-bg-dark-elevated text-white rounded-lg px-4 py-3 text-sm focus:border-accent-red focus:outline-none placeholder:text-zinc-500"
            />
            <input
              name="title"
              type="text"
              placeholder="Caption (optional)"
              maxLength={100}
              className="w-full border border-white/10 bg-bg-dark-elevated text-white rounded-lg px-4 py-3 text-sm focus:border-accent-red focus:outline-none placeholder:text-zinc-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="px-4 py-2 text-sm font-heading uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-accent-red text-white font-heading uppercase rounded-lg px-4 py-2 text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
          <p className="text-xs text-zinc-500">
            Supported: YouTube videos/shorts, Instagram posts/reels (public only — use Share → Copy link),
            TikTok videos
          </p>
        </div>
      )}

      {/* Media grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {media.map((item, index) => (
            <div key={mediaKey(item, index)} className="relative bg-bg-dark-elevated rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
              <MediaEmbed media={item} />
              {item.title && (
                <p className="px-3 py-2 text-xs text-zinc-300 truncate">{item.title}</p>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="absolute top-2 right-2 bg-black/60 rounded-sm text-zinc-500 hover:text-red-500 px-2 py-1 text-xs transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : isOwnProfile ? (
        <div className="bg-bg-dark-elevated rounded-xl border border-white/10 p-8 text-center">
          <p className="text-zinc-500 text-sm">
            Showcase your training footage, competition highlights, and more.
          </p>
        </div>
      ) : null}
    </div>
  );
}
