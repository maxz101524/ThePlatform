"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/actions/follow";

interface FollowButtonProps {
  targetId: string;
  isFollowing: boolean;
}

export function FollowButton({ targetId, isFollowing: initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [hovering, setHovering] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (following) {
        await unfollowUser(targetId);
        setFollowing(false);
      } else {
        await followUser(targetId);
        setFollowing(true);
      }
    });
  }

  const label = isPending ? "..." : following ? (hovering ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={isPending}
      className={`px-4 py-1.5 rounded-full font-heading text-xs font-bold uppercase tracking-wider transition-all ${
        following
          ? hovering
            ? "bg-transparent border border-red-500/50 text-red-500"
            : "bg-transparent border border-white/20 text-zinc-400"
          : "bg-white text-bg-dark border border-white hover:bg-zinc-200"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {label}
    </button>
  );
}
