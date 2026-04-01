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
    <div className={`flex items-center gap-1 ${isPending ? "opacity-50" : ""}`}>
      <button
        onClick={() => handleVote(1)}
        className="p-1.5 rounded-full text-zinc-500 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
        disabled={isPending}
        aria-label="Upvote"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <span className="font-mono text-xs font-bold text-zinc-300 min-w-[1.5rem] text-center">{voteCount}</span>
      <button
        onClick={() => handleVote(-1)}
        className="p-1.5 rounded-full text-zinc-500 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
        disabled={isPending}
        aria-label="Downvote"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
