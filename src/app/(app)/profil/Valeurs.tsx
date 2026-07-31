"use client";

import { useState, useTransition } from "react";
import { ajouterValeur, supprimerValeur } from "@/lib/actions";

/**
 * Les valeurs cardinales, éditables ici.
 *
 * Le chat écrit dans la même table : ce qu'on lui confie apparaît donc à cet
 * endroit, et ce qu'on corrige ici est immédiatement su par l'IA. C'est la
 * condition pour que « enregistré » veuille dire quelque chose.
 */
export function Valeurs({ valeurs }: { valeurs: { id: string; label: string }[] }) {
  const [saisie, setSaisie] = useState("");
  const [encours, demarrer] = useTransition();
  const complet = valeurs.length >= 3;

  return (
    <section className="rounded-[22px] bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Tes valeurs cardinales
        </span>
        <span className="text-[11px] text-ink-faint">{valeurs.length} sur 3</span>
      </div>

      {valeurs.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {valeurs.map((v) => (
            <li
              key={v.id}
              className="step-enter flex items-center gap-2 rounded-full bg-gold-soft py-1.5 pl-3.5 pr-1.5 text-sm font-medium text-ink"
            >
              {v.label}
              <button
                type="button"
                aria-label={`Retirer ${v.label}`}
                onClick={() => demarrer(() => void supprimerValeur(v.id))}
                className="press flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-ink/10 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">
          Rien encore. Nomme-les ici, ou dis-les simplement en conversation — AMANA les
          retiendra.
        </p>
      )}

      {!complet && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = saisie;
            if (!v.trim()) return;
            setSaisie("");
            demarrer(() => void ajouterValeur(v));
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            maxLength={60}
            placeholder="Piété, ambition, transmission…"
            className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            disabled={encours || !saisie.trim()}
            className="press rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
          >
            Ajouter
          </button>
        </form>
      )}
    </section>
  );
}
