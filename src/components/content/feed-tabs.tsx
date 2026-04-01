"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FeedTabs({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("feed") || "for-you";

  if (!isLoggedIn) return null;

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "for-you") {
      params.delete("feed");
    } else {
      params.set("feed", tab);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex gap-1 px-4 py-3 border-b border-white/10">
      <button
        onClick={() => setTab("for-you")}
        className={`font-heading text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-colors ${
          activeTab === "for-you"
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
        }`}
      >
        For You
      </button>
      <button
        onClick={() => setTab("following")}
        className={`font-heading text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-colors ${
          activeTab === "following"
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
        }`}
      >
        Following
      </button>
    </div>
  );
}
