"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";
import { ParlerModale } from "@/components/ParlerModale";

type Item = { href: string; label: string; short: string; icon: React.ReactNode };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Trois horizons, un geste.
 *
 * On ne navigue plus entre des objets (projets, profil, chemin) mais entre des
 * temporalités : ce que je fais maintenant, ce que je vise ce trimestre, ce que
 * je deviens. Les portes n'étaient pas de même nature — un geste, un réglage,
 * une vue, un objet au même rang — et c'est ce qui obligeait à réfléchir.
 *
 * Projets rejoint « Cette semaine », la plongée et le profil rejoignent
 * « Mon histoire », les réglages passent sous l'avatar.
 */
const items: Item[] = [
  {
    href: "/aujourdhui",
    label: "Maintenant",
    short: "Maintenant",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
        <circle cx="12" cy="12" r="1.6" className="fill-gold" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/semaine",
    label: "Cette semaine",
    short: "Semaine",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M4 20V4M4 20h16" />
        <path d="M8 20v-5M12 20v-9M16 20v-4" />
        <circle cx="20" cy="6.5" r="2" className="fill-gold" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/chemin",
    label: "Mon histoire",
    short: "Histoire",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
        <path d="M5 20c2.5-2 3-6 6-8s4-4.5 8-8" />
        <circle cx="5" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="11" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="19" cy="4" r="2.2" className="fill-gold" stroke="none" />
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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [parler, setParler] = useState(false);
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <ParlerModale ouvert={parler} fermer={() => setParler(false)} />

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

        <button
          type="button"
          onClick={() => setParler(true)}
          className="press mt-6 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          Parler
        </button>

        <div className="mt-auto flex flex-col gap-2">
          {/* Ce qui n'est pas un horizon : un réglage, une exploration. */}
          <Link
            href="/profil"
            className={`press flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm ${
              isActive("/profil") ? "bg-gold-soft font-semibold text-ink" : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/30 text-[10px] font-bold">
              {(session?.user?.name?.trim()[0] || "A").toUpperCase()}
            </span>
            Mon profil
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`press flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm ${
                isActive("/admin") ? "bg-gold-soft font-semibold text-ink" : "text-ink-soft hover:bg-surface-2"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
                <path d="M4 19V5m5 14V9m5 10v-6m5 6V7" />
              </svg>
              Administration
            </Link>
          )}
          <Link
            href="/conversation"
            className="press flex items-center gap-3 rounded-[14px] border border-ink/15 px-3 py-2.5 text-sm text-ink-soft"
          >
            <ConversationIcon />
            En parler
          </Link>
        </div>
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
        {/* Deux horizons, le geste au centre, le troisième horizon. Le geste
            reste au milieu parce que c'est le seul qui ne se contemple pas. */}
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          <NavTab item={items[0]} active={isActive(items[0].href)} />
          <NavTab item={items[1]} active={isActive(items[1].href)} />

          <MicroCentral onClick={() => setParler(true)} />

          <NavTab item={items[2]} active={isActive(items[2].href)} />

          {/* Le réglage se range sous l'avatar, là où tout le monde le cherche. */}
          <Link
            href="/profil"
            aria-current={isActive("/profil") ? "page" : undefined}
            aria-label="Mon profil"
            className={`press flex flex-col items-center gap-0.5 px-2 py-1.5 ${
              isActive("/profil") ? "text-ink" : "text-ink-faint"
            }`}
          >
            <span
              className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[10px] font-bold ${
                isActive("/profil") ? "border-gold bg-gold-soft text-ink" : "border-ink/30"
              }`}
            >
              {(session?.user?.name?.trim()[0] || "A").toUpperCase()}
            </span>
            <span className="text-[10px] uppercase tracking-wider">Moi</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

/**
 * Le geste central, dit par son icône.
 *
 * Une flèche vers le bas ne se devine pas — on ne savait pas ce que « Déposer »
 * faisait. Un micro qui respire dit exactement ce qu'il propose : parle, et
 * AMANA range. L'anneau pulse en continu, doucement, pour appeler sans presser.
 */
function MicroCentral({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Parler à AMANA"
      className="press relative -mt-5 flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gold text-[#12100D] shadow-lg shadow-gold/30"
    >
      <span className="halo pointer-events-none absolute inset-0 rounded-full bg-gold" aria-hidden />
      <svg
        viewBox="0 0 24 24"
        className="relative h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
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
