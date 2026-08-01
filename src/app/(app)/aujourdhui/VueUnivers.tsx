"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions";

type Objet = {
  id: string;
  titre: string;
  detail: string | null;
  etat: "fait" | "encours" | "vide";
  href: string;
};
type EtapeFrise = {
  titre: string;
  etat: "fait" | "actuel" | "avenir";
  detail: string | null;
  href: string | null;
  /** Ce qui atteste le palier — dit pour qu'on sache ce qui est mesure. */
  preuve?: string | null;
  /** Ou en est la preuve quand elle se compte (« 2 sur 3 »). */
  avancement?: string | null;
  /** Une branche s'ouvre apres le socle : elle se distingue visuellement. */
  branche?: boolean;
  /** Le libelle du geste, quand il est plus precis que « En parler ». */
  action?: string | null;
};
type ActionVue = {
  id: string;
  titre: string;
  projet: string | null;
  age: number;
  faite: boolean;
};

/**
 * L'intérieur d'un univers : ce qu'on y manipule, le chemin, ce qui reste à
 * faire. Toujours dans cet ordre — les objets donnent le contexte, la frise
 * dit où l'on en est, les actions disent quoi faire maintenant.
 */
export function VueUnivers({
  libelleObjets,
  objets,
  etapes,
  actions,
  cochable,
}: {
  libelleObjets: string;
  objets: Objet[];
  etapes: EtapeFrise[];
  actions: ActionVue[];
  /** Les hypothèses de plongée ne se cochent pas : elles se tranchent ailleurs. */
  cochable: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {objets.length > 0 && <RangeeObjets libelle={libelleObjets} objets={objets} />}
      {etapes.length > 0 && <Frise etapes={etapes} />}
      {actions.length > 0 && <Actions actions={actions} cochable={cochable} />}
    </div>
  );
}

/** Les objets de l'univers, en rangée qui défile — on les balaie du pouce. */
export function RangeeObjets({ libelle, objets }: { libelle: string; objets: Objet[] }) {
  const teinte = {
    fait: "border-gold/45 bg-gold-soft",
    encours: "border-ink/15 bg-surface",
    vide: "border-dashed border-ink/20 bg-surface-2/50",
  } as const;

  return (
    <section className="enter min-w-0" style={{ "--i": 2 } as React.CSSProperties}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {libelle}
      </span>
      <div className="-mx-5 mt-2 flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {objets.map((o) => (
          <a
            key={o.id}
            href={o.href}
            className={`press lift flex w-40 flex-none flex-col rounded-[18px] border p-4 ${teinte[o.etat]}`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 flex-none rounded-full ${
                  o.etat === "fait" ? "bg-gold" : o.etat === "encours" ? "bg-ink/40" : "bg-ink/15"
                }`}
              />
              <span className="min-w-0 truncate text-sm font-semibold">{o.titre}</span>
            </span>
            <span className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-soft">
              {o.detail ?? "À renseigner"}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/** La frise verticale : d'où l'on part, où l'on en est, où l'on va. */
export function Frise({ etapes }: { etapes: EtapeFrise[] }) {
  const [ouvert, setOuvert] = useState<number | null>(
    etapes.findIndex((e) => e.etat === "actuel"),
  );

  return (
    <section className="enter" style={{ "--i": 3 } as React.CSSProperties}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Ton chemin ici
      </span>

      <ol className="relative mt-3 flex flex-col">
        {/* Le trait continu : on voit le chemin, pas une liste de puces. */}
        <span
          className="absolute bottom-4 left-[11px] top-4 w-px bg-gradient-to-b from-gold/60 via-ink/15 to-ink/5"
          aria-hidden
        />
        {etapes.map((e, i) => {
          const actif = ouvert === i;
          return (
            <li key={`${e.titre}-${i}`} className="relative pl-9">
              <button
                type="button"
                onClick={() => setOuvert(actif ? null : i)}
                aria-expanded={actif}
                className="press w-full py-2.5 text-left"
              >
                <span
                  className={`absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    e.etat === "fait"
                      ? "border-gold bg-gold"
                      : e.etat === "actuel"
                        ? "border-gold bg-paper"
                        : "border-ink/20 bg-paper"
                  }`}
                >
                  {e.etat === "fait" ? (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-[#12100D]" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6.5 4.5 9 10 3" />
                    </svg>
                  ) : e.etat === "actuel" ? (
                    <span className="nudge h-2 w-2 rounded-full bg-gold" />
                  ) : null}
                </span>

                <span className="flex items-baseline gap-2">
                  <span
                    className={`min-w-0 flex-1 text-[15px] ${
                      e.etat === "actuel"
                        ? "font-semibold text-ink"
                        : e.etat === "fait"
                          ? "text-ink-soft"
                          : "text-ink-faint"
                    }`}
                  >
                    {e.titre}
                  </span>
                  {/* L'avancement se voit sans déplier : c'est ce qui donne
                      envie de franchir le palier. */}
                  {e.avancement && e.etat !== "fait" && (
                    <span className="flex-none text-[11px] font-semibold text-gold-deep">
                      {e.avancement}
                    </span>
                  )}
                  {e.branche && (
                    <span className="flex-none rounded-full border border-ink/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-ink-faint">
                      option
                    </span>
                  )}
                </span>

                {actif && e.detail && (
                  <span className="step-enter mt-1 block text-[13px] leading-relaxed text-ink-soft">
                    {e.detail}
                  </span>
                )}

                {/* On dit ce qui est mesuré : un palier dont on ignore la
                    condition ne se travaille pas, il se subit. */}
                {actif && e.preuve && (
                  <span className="step-enter mt-1.5 block text-[11px] text-ink-faint">
                    {e.etat === "fait" ? "Acquis — " : "Ce qui l'atteste : "}
                    {e.preuve}
                  </span>
                )}
              </button>

              {actif && e.href && e.etat !== "fait" && (
                <a
                  href={e.href}
                  className="press step-enter mb-2 inline-flex rounded-full border border-gold/40 bg-gold-soft px-4 py-1.5 text-[11px] font-semibold text-gold-deep"
                >
                  {e.action || "En parler"}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Ce qui reste à faire ici, et rien d'autre. */
function Actions({ actions, cochable }: { actions: ActionVue[]; cochable: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [coche, setCoche] = useState<string | null>(null);

  const restantes = actions.filter((a) => !a.faite);
  const faites = actions.filter((a) => a.faite);

  return (
    <section className="enter flex flex-col gap-2" style={{ "--i": 4 } as React.CSSProperties}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {cochable ? "À mener ici" : "Hypothèses à trancher"}
      </span>

      {restantes.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3.5 text-sm"
        >
          {cochable ? (
            <button
              onClick={() => {
                setCoche(a.id);
                start(async () => {
                  await toggleTask(a.id);
                  router.refresh();
                  setTimeout(() => setCoche(null), 600);
                });
              }}
              disabled={pending}
              className="press flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className={`h-5 w-5 flex-none rounded-full border-2 border-ink-faint transition-transform ${
                  coche === a.id ? "scale-125 border-gold bg-gold" : ""
                }`}
              />
              <span className="min-w-0 flex-1">
                {a.titre}
                {a.projet && (
                  <span className="ml-1.5 text-xs text-ink-faint">· {a.projet}</span>
                )}
              </span>
            </button>
          ) : (
            <span className="min-w-0 flex-1">{a.titre}</span>
          )}

          {cochable && a.age >= 5 ? (
            <a
              href={`/conversation?mode=sonde&tache=${a.id}`}
              title={`En attente depuis ${a.age} jours`}
              className="press flex-none rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-semibold text-gold-deep"
            >
              Débloquer
            </a>
          ) : !cochable ? (
            <a
              href="/deepdive"
              className="press flex-none rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink-soft"
            >
              Trancher
            </a>
          ) : null}
        </div>
      ))}

      {/* Ce qui est fait reste visible : on peut revenir sur un clic accidentel. */}
      {faites.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 rounded-[16px] bg-surface-2/60 px-4 py-3 text-sm"
        >
          <span className="h-5 w-5 flex-none rounded-full border-2 border-gold bg-gold" />
          <span className="min-w-0 flex-1 text-ink-faint line-through">{a.titre}</span>
          <button
            onClick={() => start(async () => { await toggleTask(a.id); router.refresh(); })}
            disabled={pending}
            className="press flex-none rounded-full border border-ink/15 px-3 py-1 text-[11px] font-semibold text-ink-soft"
          >
            Annuler
          </button>
        </div>
      ))}
    </section>
  );
}
