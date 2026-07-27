"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions";

export type Priority = {
  id: string;
  title: string;
  kind: "TASK" | "REMINDER" | "DECISION";
  done: boolean;
};

export function PriorityList({ items }: { items: Priority[] }) {
  const [, start] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    start(async () => {
      await toggleTask(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[16px] bg-surface-2 px-4 py-4 text-sm text-ink-soft">
        Rien de prévu aujourd&apos;hui. Dépose ce que tu as en tête, et AMANA t&apos;aidera à choisir
        l&apos;essentiel.
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2" aria-label="Ce qui compte aujourd'hui">
      {items.map((p, i) => {
        const essential = i === 0;
        return (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`flex items-center gap-3 rounded-[16px] px-4 py-3.5 text-left text-sm ${
              essential ? "bg-gold-soft font-semibold" : "bg-surface-2"
            } ${p.done ? "opacity-50" : ""}`}
          >
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                essential ? "border-gold-deep" : "border-ink-faint"
              } ${p.done ? "border-gold bg-gold" : ""}`}
            >
              {p.done && (
                <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-[#12100D]" fill="none" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 6.5 4.5 9 10 3" />
                </svg>
              )}
            </span>
            <span className={p.done ? "line-through" : ""}>{p.title}</span>
            {p.kind !== "TASK" && (
              <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                {p.kind === "REMINDER" ? "Rappel" : "Décision"}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
