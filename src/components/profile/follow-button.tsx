"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/actions/follow";

interface FollowButtonProps {
  targetId: string;
  isFollowing: boolean;
}

export function FollowButton({ targetId, isFollowing: initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
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

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-4 py-2 text-sm font-heading uppercase tracking-wider transition-colors ${
        following
          ? "border border-border text-text-muted hover:border-red-500 hover:text-red-500"
          : "bg-accent-primary text-bg-primary hover:bg-accent-primary/80"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {isPending ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
