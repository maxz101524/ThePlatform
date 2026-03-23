"use client";

import { voteOnPost } from "@/app/actions/votes";
import { useTransition } from "react";

interface Props {
  postId: string;
  voteCount: number;
}

export function VoteButtons({ postId, voteCount }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleVote(value: 1 | -1) {
    startTransition(() => {
      voteOnPost(postId, value);
    });
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${isPending ? "opacity-50" : ""}`}>
      <button
        onClick={() => handleVote(1)}
        className="text-text-muted hover:text-accent-primary transition-colors"
        disabled={isPending}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="font-mono text-text-secondary min-w-[1.5rem] text-center">{voteCount}</span>
      <button
        onClick={() => handleVote(-1)}
        className="text-text-muted hover:text-accent-primary transition-colors"
        disabled={isPending}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
