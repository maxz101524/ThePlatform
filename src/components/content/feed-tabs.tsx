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
    <div className="flex gap-0 bg-bg-surface mb-4">
      <button
        onClick={() => setTab("for-you")}
        className={`px-4 py-2 text-sm font-heading uppercase tracking-wider transition-colors ${
          activeTab === "for-you"
            ? "text-accent-primary border-b-2 border-accent-primary"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        For You
      </button>
      <button
        onClick={() => setTab("following")}
        className={`px-4 py-2 text-sm font-heading uppercase tracking-wider transition-colors ${
          activeTab === "following"
            ? "text-accent-primary border-b-2 border-accent-primary"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        Following
      </button>
    </div>
  );
}
