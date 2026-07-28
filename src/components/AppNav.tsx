"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";

type Item = { href: string; label: string; short: string; icon: React.ReactNode };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const items: Item[] = [
  {
    href: "/aujourdhui",
    label: "Aujourd'hui",
    short: "Jour",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M4 19.5c3.5-1.2 4.5-4.5 7-6.5s4-4.5 6-7" />
        <circle cx="4" cy="19.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="11" cy="13" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18.5" cy="5" r="2.2" className="fill-gold" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/projets",
    label: "Projets",
    short: "Projets",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M4 20V6.5A2.5 2.5 0 0 1 6.5 4H20" />
        <path d="M7.5 16.5 12 12l4.5-4.5" />
        <circle cx="16.5" cy="7.5" r="2" className="fill-gold" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/chemin",
    label: "Mon chemin",
    short: "Chemin",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" />
        <circle cx="12" cy="12" r="2.4" className="fill-gold" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/profil",
    label: "Profil",
    short: "Profil",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
];

function ConversationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
      <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* ───────────── Desktop : barre latérale ───────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink/10 bg-surface/60 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/aujourdhui" className="mb-8 flex items-center gap-2.5 px-2">
          <AmanaMark className="h-8 w-8" />
          <Wordmark className="text-[13px]" />
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              aria-current={isActive(it.href) ? "page" : undefined}
              className={`press flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm ${
                isActive(it.href)
                  ? "bg-gold-soft font-semibold text-ink"
                  : "text-ink-soft hover:bg-surface-2"
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/deposer"
          className="press mt-6 rounded-full bg-gold px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Déposer
        </Link>

        <Link
          href="/conversation"
          className="press mt-auto flex items-center gap-3 rounded-[14px] border border-ink/15 px-3 py-2.5 text-sm text-ink-soft"
        >
          <ConversationIcon />
          En parler
        </Link>
      </aside>

      {/* ───────────── Mobile : conversation flottante + nav basse ───────────── */}
      <Link
        href="/conversation"
        aria-label="Ouvrir la conversation"
        className="press fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg lg:hidden"
      >
        <ConversationIcon />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.slice(0, 2).map((it) => (
            <NavTab key={it.href} item={it} active={isActive(it.href)} />
          ))}

          <Link
            href="/deposer"
            className="press flex flex-col items-center gap-1 rounded-full bg-gold px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#12100D]"
          >
            Déposer
          </Link>

          {items.slice(2).map((it) => (
            <NavTab key={it.href} item={it} active={isActive(it.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavTab({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`press flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] uppercase tracking-wider ${
        active ? "font-bold text-ink" : "text-ink-faint"
      }`}
    >
      {item.icon}
      <span>{item.short}</span>
    </Link>
  );
}
