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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/30 bg-[#131315]/90 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {allItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              pathname === item.href
                ? "text-accent-red"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-mono text-[10px] tracking-widest uppercase">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
