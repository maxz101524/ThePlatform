"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" /></svg>
  ) : (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M9 21V12h6v9" /></svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6zm-8-9h2V3H2v3a4 4 0 0 0 4 4h.07A7 7 0 0 1 4 6zm16-3h-2v3a7 7 0 0 1-2.07 4H18a4 4 0 0 0 4-4V3zm-8 15a2 2 0 0 0-2 2h8a2 2 0 0 0-2-2h-1v-2.07a7 7 0 0 1-2 0V18h-1z" /></svg>
  ) : (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V4h4" /><path d="M18 9h2a2 2 0 0 0 2-2V4h-4" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.5 2a8.5 8.5 0 0 1 6.676 13.762l4.281 4.28a1 1 0 0 1-1.414 1.415l-4.281-4.281A8.5 8.5 0 1 1 10.5 2zm0 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z" clipRule="evenodd" /></svg>
  ) : (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" /></svg>
  ) : (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  );
}

const iconMap: Record<string, React.FC<{ active: boolean }>> = {
  Feed: HomeIcon,
  Rankings: TrophyIcon,
  Search: SearchIcon,
  Profile: ProfileIcon,
};

const navItems = [
  { label: "Feed", href: "/" },
  { label: "Rankings", href: "/leaderboard" },
  { label: "Search", href: "/search" },
];

interface MobileNavInnerProps {
  profileHref: string;
}

export function MobileNavInner({ profileHref }: MobileNavInnerProps) {
  const pathname = usePathname();

  const allItems = [
    ...navItems,
    { label: "Profile", href: profileHref },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/30 bg-[#131315]/90 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {allItems.map((item) => {
          const active = pathname === item.href;
          const Icon = iconMap[item.label];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active ? "text-accent-red" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {Icon && <Icon active={active} />}
              <span className="font-mono text-[10px] tracking-widest uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
