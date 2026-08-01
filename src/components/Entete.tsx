"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";

/**
 * La seule barre de l'application.
 *
 * Il n'y a plus de menu : on entre par les univers, et tout se fait à
 * l'intérieur de celui où l'on est. Ne restent ici que la marque, et
 * l'initiale — qui ouvre les réglages, là où tout le monde les cherche.
 */
export function Entete() {
  const { data: session } = useSession();
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const isAdmin = session?.user?.role === "ADMIN";
  const initiale = (session?.user?.name?.trim()[0] || "A").toUpperCase();

  useEffect(() => {
    if (!ouvert) return;
    function dehors(e: MouseEvent) {
      if (!zone.current?.contains(e.target as Node)) setOuvert(false);
    }
    function echap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/8 bg-paper/85 px-5 py-3 backdrop-blur">
      <Link href="/aujourdhui" className="flex items-center gap-2.5" aria-label="Retour aux univers">
        <AmanaMark className="h-7 w-7" />
        <Wordmark className="text-[12px]" />
      </Link>

      <div ref={zone} className="relative">
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={ouvert}
          aria-label="Mon compte"
          className={`press flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
            ouvert ? "border-gold bg-gold-soft text-ink" : "border-ink/30 text-ink-soft"
          }`}
        >
          {initiale}
        </button>

        {ouvert && (
          <div
            role="menu"
            className="step-enter absolute right-0 top-11 w-56 overflow-hidden rounded-[18px] border border-ink/10 bg-surface shadow-xl"
          >
            <div className="border-b border-ink/8 px-4 py-3">
              <p className="truncate text-sm font-semibold">
                {session?.user?.name || "Compte AMANA"}
              </p>
              <p className="truncate text-xs text-ink-faint">{session?.user?.email}</p>
            </div>

            <Link
              href="/profil"
              onClick={() => setOuvert(false)}
              role="menuitem"
              className="block px-4 py-3 text-sm text-ink-soft hover:bg-surface-2"
            >
              Mon profil
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOuvert(false)}
                role="menuitem"
                className="block px-4 py-3 text-sm text-ink-soft hover:bg-surface-2"
              >
                Administration
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full border-t border-ink/8 px-4 py-3 text-left text-sm text-ink-faint hover:bg-surface-2"
            >
              Me déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
