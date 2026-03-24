"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Feed", href: "/", icon: "◉" },
  { label: "Rankings", href: "/leaderboard", icon: "◈" },
  { label: "Search", href: "/search", icon: "⌕" },
];

interface MobileNavInnerProps {
  profileHref: string;
}

export function MobileNavInner({ profileHref }: MobileNavInnerProps) {
  const pathname = usePathname();

  const allItems = [
    ...navItems,
    { label: "Profile", href: profileHref, icon: "◎" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-primary/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around">
        {allItems.map((item) => (
          <Link
            key={item.label}
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
