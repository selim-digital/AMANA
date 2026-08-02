"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirIntention, toggleTask } from "@/lib/actions";

/**
 * L'intention du jour — le geste le plus structurant de la journée.
 *
 * Ce n'était qu'une phrase décorative : une question posée à laquelle personne
 * ne répondait. Une personne qui a accompli sa mission principale enchaîne sur
 * une dynamique ; c'est cette bascule qu'on veut provoquer. La réponse devient
 * donc « l'essentiel du jour » : une vraie action, datée et cochable.
 */
export function Intention({
  intention,
}: {
  intention: { id: string; title: string; done: boolean } | null;
}) {
  const [saisie, setSaisie] = useState("");
  const [edition, setEdition] = useState(false);
  const [coche, setCoche] = useState(intention?.done ?? false);
  const [encours, demarrer] = useTransition();
  const router = useRouter();

  // ── Pas encore d'intention : on la demande, et on attend la réponse ──
  if (!intention || edition) {
    return (
      <section className="enter rounded-[22px] border border-gold/40 bg-surface p-5 lg:p-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Intention du jour
        </span>
        <p className="voice-amana mt-2 text-[17px] leading-snug lg:text-[19px]">
          Si tu ne devais faire qu&apos;UNE chose aujourd&apos;hui, qu&apos;est-ce que ce serait ?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = saisie;
            if (!v.trim()) return;
            setSaisie("");
            setEdition(false);
            // router.refresh() refait la page a l'URL COURANTE, ?u= compris.
            demarrer(async () => {
              await definirIntention(v);
              router.refresh();
            });
          }}
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
        >
          <input
            autoFocus={edition}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            maxLength={200}
            placeholder="Écris-la en une phrase…"
            className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-5 py-3 text-[15px] outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            disabled={encours || !saisie.trim()}
            className="press rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
          >
            C&apos;est parti
          </button>
        </form>
        {edition && (
          <button
            type="button"
            onClick={() => setEdition(false)}
            className="mt-2 text-xs text-ink-faint underline underline-offset-4"
          >
            Annuler
          </button>
        )}
      </section>
    );
  }

  // ── L'intention est posée : elle EST l'essentiel du jour ──
  return (
    <section
      className={`enter relative overflow-hidden rounded-[22px] border p-5 lg:p-6 ${
        coche ? "border-ink/10 bg-surface-2" : "border-gold/50 bg-gold-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          L&apos;essentiel du jour
        </span>
        {!coche && (
          <button
            type="button"
            onClick={() => setEdition(true)}
            className="text-[11px] text-ink-faint underline underline-offset-4"
          >
            Changer
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setCoche((c) => !c);
          demarrer(async () => {
            await toggleTask(intention.id);
            router.refresh();
          });
        }}
        className="press mt-3 flex w-full items-start gap-4 text-left"
      >
        <span
          className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 transition-transform duration-200 ${
            coche ? "scale-110 border-ink bg-ink text-paper" : "border-ink/35"
          }`}
        >
          {coche && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[17px] leading-snug lg:text-[20px] ${
              coche ? "text-ink-faint line-through" : "font-medium text-ink"
            }`}
          >
            {intention.title}
          </span>
          <span className="mt-1.5 block text-xs text-ink-soft">
            {coche ? "Accompli. Le reste sera plus léger." : "Touche pour la marquer faite"}
            {!coche && <span className="nudge ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold-deep align-middle" />}
          </span>
        </span>
      </button>

      <a
        href={`/conversation?tache=${intention.id}`}
        className="press mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-4 py-2 text-xs font-semibold text-ink-soft"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
        </svg>
        En parler
      </a>
    </section>
  );
}
