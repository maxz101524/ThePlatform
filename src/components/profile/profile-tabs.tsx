"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "posts", label: "Posts" },
  { id: "media", label: "Media" },
  { id: "competition", label: "Competition" },
] as const;

interface ProfileTabsProps {
  username: string;
}

export function ProfileTabs({ username }: ProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "posts";

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "posts") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/u/${username}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex gap-1 border-b border-white/10 px-6 md:px-12">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setTab(tab.id)}
          className={`font-heading text-sm font-bold uppercase tracking-wider px-5 py-3 transition-colors ${
            activeTab === tab.id
              ? "text-white border-b-2 border-accent-red"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
