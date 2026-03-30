"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        placeholder="SEARCH USERS..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-white/10 border-none text-white rounded-full pl-3 pr-4 py-2 w-48 text-xs font-heading uppercase tracking-widest focus:ring-1 focus:ring-accent-red focus:outline-none placeholder:text-zinc-500"
      />
    </form>
  );
}
