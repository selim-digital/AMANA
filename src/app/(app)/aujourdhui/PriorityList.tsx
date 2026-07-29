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

  function toggle(id: string, done: boolean) {
    if (!done) setCelebre(id); // le geste est confirmé avant même le serveur
    start(async () => {
      await toggleTask(id);
      router.refresh();
      setTimeout(() => setCelebre(null), 600);
    });
  }

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

  const [essentielle, ...secondaires] = items;

  return (
    <section className="flex flex-col gap-3" aria-label="Ce qui compte aujourd'hui">
      {/* La priorité essentielle : grande, dorée, avec une invitation claire. */}
      <button
        onClick={() => toggle(essentielle.id, essentielle.done)}
        disabled={pending}
        className={`press group relative overflow-hidden rounded-[22px] bg-gold-soft p-5 text-left transition-opacity ${
          essentielle.done ? "opacity-55" : ""
        }`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
          L&apos;essentiel du jour
        </span>

        <span className="mt-2 flex items-start gap-3">
          <Case done={essentielle.done} celebre={celebre === essentielle.id} accent />
          <span
            className={`flex-1 text-[17px] font-semibold leading-snug lg:text-xl ${
              essentielle.done ? "line-through" : ""
            }`}
          >
            {essentielle.title}
          </span>
        </span>

        {!essentielle.done && (
          <span className="mt-3 flex items-center gap-2 text-xs text-gold-deep">
            <span className="nudge inline-block h-1.5 w-1.5 rounded-full bg-gold-deep" />
            Touche pour la marquer faite
          </span>
        )}
      </button>

      {secondaires.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ensuite
          </span>
          {secondaires.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id, p.done)}
              disabled={pending}
              className={`press flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3.5 text-left text-sm ${
                p.done ? "opacity-55" : ""
              }`}
            >
              <Case done={p.done} celebre={celebre === p.id} />
              <span className={`flex-1 ${p.done ? "line-through" : ""}`}>{p.title}</span>
              {LIBELLE[p.kind] && (
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                  {LIBELLE[p.kind]}
                </span>
              )}
            </button>
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
