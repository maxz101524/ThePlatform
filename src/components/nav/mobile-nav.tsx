"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Feed", href: "/", icon: "◉" },
  { label: "Rankings", href: "/leaderboard", icon: "◈" },
  { label: "Search", href: "/search", icon: "⌕" },
  { label: "Profile", href: "/login", icon: "◎" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-primary/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-xs ${
              pathname === item.href
                ? "text-accent-primary"
                : "text-text-muted"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-heading uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
