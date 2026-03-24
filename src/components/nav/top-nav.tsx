"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";

const navItems = [
  { label: "Feed", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Search", href: "/search" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-accent-primary text-lg">⏣</span>
            <span className="font-heading text-lg font-bold uppercase text-text-primary">
              The Platform
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-heading text-sm uppercase tracking-wider transition-colors ${
                  pathname === item.href
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
