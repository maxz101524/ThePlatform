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
      className={`px-8 py-3 rounded-lg font-heading font-bold uppercase transition-all backdrop-blur ${
        following
          ? "bg-white/10 text-white border border-white/10 hover:border-red-500 hover:text-red-500"
          : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {isPending ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
