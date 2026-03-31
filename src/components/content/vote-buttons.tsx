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
    <div className={`flex items-center gap-1 bg-zinc-50 rounded-lg px-2 py-1 ${isPending ? "opacity-50" : ""}`}>
      <button
        onClick={() => handleVote(1)}
        className="text-zinc-400 hover:text-accent-red transition-colors text-lg"
        disabled={isPending}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="font-mono text-xs font-bold text-zinc-700 min-w-[1.5rem] text-center">{voteCount}</span>
      <button
        onClick={() => handleVote(-1)}
        className="text-zinc-400 hover:text-accent-blue transition-colors text-lg"
        disabled={isPending}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
