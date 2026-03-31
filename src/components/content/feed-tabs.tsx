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
    <div className="flex gap-8 mb-6 border-b border-zinc-200">
      <button
        onClick={() => setTab("for-you")}
        className={`font-heading text-lg font-bold uppercase transition-colors ${
          activeTab === "for-you"
            ? "text-zinc-900 border-b-4 border-accent-red pb-2"
            : "text-zinc-400 pb-2 hover:text-zinc-600"
        }`}
      >
        For You
      </button>
      <button
        onClick={() => setTab("following")}
        className={`font-heading text-lg font-bold uppercase transition-colors ${
          activeTab === "following"
            ? "text-zinc-900 border-b-4 border-accent-red pb-2"
            : "text-zinc-400 pb-2 hover:text-zinc-600"
        }`}
      >
        Following
      </button>
    </div>
  );
}
