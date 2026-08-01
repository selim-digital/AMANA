"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions";

export type Priority = {
  id: string;
  title: string;
  kind: "TASK" | "REMINDER" | "DECISION";
  done: boolean;
};

const LIBELLE = { REMINDER: "Rappel", DECISION: "Décision", TASK: "" } as const;

export function PriorityList({ items }: { items: Priority[] }) {
  const [pending, start] = useTransition();
  const [celebre, setCelebre] = useState<string | null>(null);
  const router = useRouter();

  function basculer(id: string, done: boolean) {
    if (!done) setCelebre(id);
    start(async () => {
      await toggleTask(id);
      router.refresh();
      setTimeout(() => setCelebre(null), 600);
    });
  }

  const restantes = items.filter((i) => !i.done);
  const faites = items.filter((i) => i.done);

  if (items.length === 0) {
    return (
      <section className="rounded-[20px] border border-dashed border-ink/20 bg-surface-2/60 px-5 py-8 text-center">
        <p className="voice-amana text-[17px]">Rien de prévu aujourd&apos;hui.</p>
        <p className="mt-1 text-sm text-ink-soft">
          Dépose ce que tu as en tête : AMANA en fera des priorités claires.
        </p>
        <a
          href="/deposer"
          className="press mt-4 inline-block rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Vider ma tête
        </a>
      </section>
    );
  }

  // L'essentiel du jour est désormais l'intention, affichée au-dessus. Ici on
  // ne montre que la suite, et courte : trois lignes, pas un inventaire.
  const suivantes = restantes.slice(0, 3);
  const reste = restantes.length - suivantes.length;

  return (
    <section className="flex flex-col gap-3" aria-label="Ce qui compte aujourd'hui">
      {suivantes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ensuite
          </span>
          {suivantes.map((p) => (
            <button
              key={p.id}
              onClick={() => basculer(p.id, false)}
              disabled={pending}
              className="press flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3.5 text-left text-sm"
            >
              <Case done={false} celebre={celebre === p.id} />
              <span className="flex-1">{p.title}</span>
              {LIBELLE[p.kind] && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                  {LIBELLE[p.kind]}
                </span>
              )}
            </button>
          ))}
          {reste > 0 && (
            <a
              href="/projets"
              className="press self-start px-1 py-1 text-xs text-ink-faint underline underline-offset-4"
            >
              {reste} autre{reste > 1 ? "s" : ""} en attente
            </a>
          )}
        </div>
      )}

      {/* Ce qui est fait reste visible aujourd'hui : on peut toujours revenir
          sur un clic accidentel, et on voit ce qu'on a accompli. */}
      {faites.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Fait aujourd&apos;hui · {faites.length}
          </span>
          {faites.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-[16px] bg-surface-2/60 px-4 py-3 text-sm"
            >
              <Case done celebre={celebre === p.id} />
              <span className="flex-1 text-ink-faint line-through">{p.title}</span>
              <button
                onClick={() => basculer(p.id, true)}
                disabled={pending}
                className="press rounded-full border border-ink/15 px-3 py-1 text-[11px] font-semibold text-ink-soft"
              >
                Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Case({ done, celebre, accent }: { done: boolean; celebre: boolean; accent?: boolean }) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full border-2 transition-transform ${
        accent ? "mt-0.5 h-6 w-6" : "h-5 w-5"
      } ${done ? "border-gold bg-gold" : accent ? "border-gold-deep" : "border-ink-faint"} ${
        celebre ? "scale-125" : ""
      }`}
    >
      {done && (
        <svg
          viewBox="0 0 12 12"
          className={`stroke-[#12100D] ${accent ? "h-3.5 w-3.5" : "h-3 w-3"}`}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5 4.5 9 10 3" />
        </svg>
      )}
    </span>
  );
}
