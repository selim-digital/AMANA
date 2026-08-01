"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerRegle, definirRegles } from "@/lib/actions";

export type RegleVue = {
  id: string;
  label: string;
  tenueAujourdhui: boolean;
  /** Les sept derniers jours, du plus ancien au plus récent. */
  semaine: boolean[];
};

const EXEMPLES = [
  "Me coucher à minuit au plus tard",
  "45 minutes de sport ou d'étirements",
  "Commencer ma journée à 9 h au plus tard",
  "Une sieste de 20 minutes après le repas",
  "Une activité avec chaque membre de ma famille",
];

/**
 * Les cinq règles de vie.
 *
 * Ce ne sont ni des projets ni des tâches : ce sont les conditions dans
 * lesquelles tout le reste devient possible. Elles se cochent d'un geste, sans
 * quitter l'écran, et la semaine se lit d'un coup d'œil — c'est la régularité
 * qu'on regarde, pas la performance du jour.
 *
 * Cinq au maximum. Au-delà, on ne tient plus : on liste.
 */
export function Regles({ regles }: { regles: RegleVue[] }) {
  const router = useRouter();
  const [edition, setEdition] = useState(regles.length === 0);
  const [champs, setChamps] = useState<string[]>(
    regles.length ? regles.map((r) => r.label) : ["", "", "", "", ""],
  );
  const [encours, demarrer] = useTransition();

  const tenues = regles.filter((r) => r.tenueAujourdhui).length;

  // ── Définir ou revoir ses règles ──
  if (edition) {
    return (
      <section className="enter rounded-[22px] border border-gold/30 bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Tes règles de vie
        </span>
        <p className="mt-1.5 text-sm text-ink-soft">
          Cinq engagements du quotidien, tenus ou non. Ce ne sont pas des projets : ce sont les
          conditions qui rendent le reste possible.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {champs.map((v, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-faint">
                {i + 1}
              </span>
              <input
                value={v}
                onChange={(e) =>
                  setChamps((c) => c.map((x, k) => (k === i ? e.target.value : x)))
                }
                maxLength={120}
                placeholder={EXEMPLES[i]}
                className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() =>
              demarrer(async () => {
                await definirRegles(champs);
                setEdition(false);
                router.refresh();
              })
            }
            disabled={encours || champs.every((c) => !c.trim())}
            className="press flex-1 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
          >
            Enregistrer
          </button>
          {regles.length > 0 && (
            <button
              onClick={() => {
                setChamps(regles.map((r) => r.label));
                setEdition(false);
              }}
              className="press flex-none rounded-full px-4 py-3 text-xs text-ink-faint"
            >
              Annuler
            </button>
          )}
        </div>
      </section>
    );
  }

  // ── Le suivi du jour ──
  return (
    <section className="enter rounded-[22px] bg-surface p-5" style={{ "--i": 2 } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Tes règles · {tenues} / {regles.length} aujourd&apos;hui
        </span>
        <button
          onClick={() => setEdition(true)}
          className="press flex-none text-[11px] text-ink-faint underline underline-offset-4"
        >
          Revoir
        </button>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {regles.map((r) => (
          <li key={r.id}>
            <button
              onClick={() =>
                demarrer(async () => {
                  await basculerRegle(r.id);
                  router.refresh();
                })
              }
              disabled={encours}
              className="press flex w-full items-center gap-3 rounded-[14px] px-1 py-2 text-left"
            >
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-transform ${
                  r.tenueAujourdhui
                    ? "scale-105 border-gold bg-gold"
                    : "border-ink/25 bg-transparent"
                }`}
              >
                {r.tenueAujourdhui && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-[#12100D]" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6.5 4.5 9 10 3" />
                  </svg>
                )}
              </span>

              <span
                className={`min-w-0 flex-1 text-sm ${
                  r.tenueAujourdhui ? "text-ink" : "text-ink-soft"
                }`}
              >
                {r.label}
              </span>

              {/* La semaine d'un coup d'œil : c'est la régularité qu'on
                  regarde, pas la journée isolée. */}
              <span className="flex flex-none gap-[3px]" aria-hidden>
                {r.semaine.map((jour, i) => (
                  <span
                    key={i}
                    className={`h-4 w-1.5 rounded-full ${jour ? "bg-gold" : "bg-ink/10"}`}
                  />
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
