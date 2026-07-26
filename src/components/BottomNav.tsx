"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/aujourdhui", label: "Aujourd'hui" },
  { href: "/projets", label: "Projets" },
  { href: "/deposer", label: "Déposer", central: true },
  { href: "/profil", label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Conversation — bouton flottant discret encre, accessible partout */}
      <Link
        href="/conversation"
        aria-label="Ouvrir la conversation"
        className="fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
        </svg>
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            if (item.central) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 rounded-full bg-gold px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#12100D]"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wider ${
                  active ? "font-bold text-ink" : "text-ink-faint"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
