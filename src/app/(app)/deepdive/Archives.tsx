"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nouvellePlongee } from "@/lib/actions";

export type PlongeePassee = {
  id: string;
  date: string;
  niveau: number;
  nbSignaux: number;
  constat: string | null;
};

/**
 * Les plongées passées, et la porte pour en rouvrir une.
 *
 * Une plongée est datée : ce qu'on a reconnu il y a trois mois n'est pas ce
 * qu'on reconnaîtrait aujourd'hui, et cet écart vaut plus que chaque plongée
 * prise séparément. Rien ne s'écrase donc — on empile.
 */
export function Archives({
  plongees,
  peutRelancer,
}: {
  plongees: PlongeePassee[];
  peutRelancer: boolean;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [encours, demarrer] = useTransition();

  function relancer() {
    demarrer(async () => {
      await nouvellePlongee();
      router.refresh();
    });
  }

  const dateFr = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="flex flex-col gap-4 px-5 pb-8">
      {peutRelancer && (
        <div className="rounded-[20px] border border-gold/30 bg-surface p-5">
          <p className="voice-amana text-[16px]">Replonger</p>
          <p className="mt-1.5 text-sm text-ink-soft">
            {plongees.length
              ? "Ton espace a bougé depuis la dernière fois. Une nouvelle plongée partira de ce qui est vrai aujourd'hui — l'ancienne reste consultable."
              : "Une nouvelle plongée partira de ce que ton espace contient aujourd'hui."}
          </p>
          <button
            onClick={relancer}
            disabled={encours}
            className="press mt-4 rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
          >
            {encours ? "Ouverture…" : "Nouvelle plongée"}
          </button>
        </div>
      )}

      {plongees.length > 0 && (
        <div>
          <button
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            className="press flex w-full items-center justify-between gap-3 rounded-[16px] bg-surface-2 px-4 py-3 text-left"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Tes plongées précédentes · {plongees.length}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 flex-none text-ink-faint transition-transform duration-200 ${
                ouvert ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {ouvert && (
            <div className="step-enter mt-2 flex flex-col gap-2">
              {plongees.map((p) => (
                <article key={p.id} className="rounded-[16px] bg-surface px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">{dateFr(p.date)}</span>
                    <span className="flex-none text-[11px] text-ink-faint">
                      niveau {p.niveau} · {p.nbSignaux} hypothèse{p.nbSignaux > 1 ? "s" : ""}
                    </span>
                  </div>
                  {p.constat ? (
                    <p className="voice-amana mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {p.constat}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs italic text-ink-faint">
                      Cette plongée n&apos;a pas été analysée.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
