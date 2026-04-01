"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";
import { logout } from "@/app/actions/auth";

const navItems = [
  { label: "Feed", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Search", href: "/search" },
];

interface TopNavInnerProps {
  user: { username: string; displayName: string | null } | null;
}

export function TopNavInner({ user }: TopNavInnerProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-50 w-[95%] mx-auto rounded-full bg-bg-dark border border-white/10 shadow-2xl shadow-black/50">
      <div className="flex h-14 items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/">
            <span className="text-2xl font-black text-white after:content-['.'] after:text-accent-red">THE PLATFORM</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-heading text-sm uppercase tracking-wider font-bold transition-colors ${
                  pathname === item.href
                    ? "text-white border-b-2 border-accent-red pb-1"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/u/${user.username}`}
                className="font-heading text-sm uppercase tracking-wider text-accent-red hover:bg-white/10 px-3 py-1 rounded-full transition-all"
              >
                {user.displayName || user.username}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="font-heading text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Log Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="font-heading text-sm uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
