"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DesertScene, ForestScene, OceanScene } from "@/components/Scenes";
import { Pastille } from "@/components/Pastille";

export type CarteUnivers = {
  cle: string;
  nom: string;
  sujet: string;
  matiere: string;
  decor: "desert" | "forest" | "ocean";
  ciel: string;
  pastille: number;
  motifs: string[];
};

const SCENES = { desert: DesertScene, forest: ForestScene, ocean: OceanScene } as const;

/**
 * L'entrée de l'application : le paquet des trois univers.
 *
 * Ce n'est pas un tableau de bord. On voit un paysage en grand, les deux
 * autres empilés derrière, et l'on glisse pour changer de monde. On n'agit
 * jamais depuis ici — on choisit où entrer.
 *
 * L'orientation d'AMANA dit pourquoi commencer par celui-ci. Elle arrive
 * après le paysage : la carte doit être là avant qu'on la commente.
 */
export function Deck({
  cartes,
  conseille,
}: {
  cartes: CarteUnivers[];
  /** L'univers qu'AMANA met en avant — c'est celui qu'on présente en premier. */
  conseille: string;
}) {
  const router = useRouter();
  const depart = Math.max(
    0,
    cartes.findIndex((c) => c.cle === conseille),
  );

  const [i, setI] = useState(depart);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [sortie, setSortie] = useState(0);
  const [fige, setFige] = useState(false);
  const x0 = useRef(0);
  const n = cartes.length;

  function onDown(e: React.PointerEvent) {
    setDrag(true);
    x0.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (drag) setDx(e.clientX - x0.current);
  }
  function onUp() {
    if (!drag) return;
    setDrag(false);
    if (Math.abs(dx) > 90) {
      const dir = dx < 0 ? 1 : -1;
      setSortie(dir);
      setTimeout(() => {
        // On bascule sans transition : les cartes sont déjà à leur nouvelle
        // place, seul le contenu change.
        setFige(true);
        setI((k) => (k + dir + n) % n);
        setSortie(0);
        setDx(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setFige(false)));
      }, 260);
    } else setDx(0);
  }

  const devant = cartes[i];

  return (
    <main className="relative flex min-h-[calc(100dvh-8rem)] flex-col">
      <div className="px-5 pt-5">
        <h1 className="voice-amana text-2xl">Par où entrer</h1>
        <p className="mt-0.5 text-sm text-ink-faint">
          Glisse pour changer de monde. Touche pour entrer.
        </p>
      </div>

      <div className="relative mt-4 flex-1 px-5">
        {[2, 1, 0].map((profondeur) => {
          const idx = (i + profondeur) % n;
          const c = cartes[idx];
          const Scene = SCENES[c.decor];
          const dessus = profondeur === 0;
          const rang = dessus ? 0 : profondeur - (sortie ? 1 : 0);

          const style: React.CSSProperties = dessus
            ? {
                transform: sortie
                  ? `translate3d(${sortie * 560}px, 0, 0) rotate(${sortie * 18}deg)`
                  : `translate3d(${dx}px, 0, 0) rotate(${dx * 0.05}deg)`,
                opacity: sortie ? 0 : 1,
                transition:
                  drag || fige
                    ? "none"
                    : "transform .26s var(--ease-out), opacity .26s var(--ease-out)",
                willChange: "transform",
              }
            : {
                transform: `translate3d(0, ${rang * 14}px, 0) scale(${1 - rang * 0.05})`,
                transition: fige ? "none" : "transform .26s var(--ease-out)",
                willChange: "transform",
              };

          return (
            <article
              key={profondeur}
              style={{ ...style, zIndex: 3 - profondeur }}
              className="absolute inset-x-0 top-0 bottom-6 touch-none select-none overflow-hidden rounded-[28px] border border-ink/10 bg-surface shadow-xl"
              {...(dessus
                ? {
                    onPointerDown: onDown,
                    onPointerMove: onMove,
                    onPointerUp: onUp,
                    onPointerCancel: onUp,
                    onClick: () =>
                      Math.abs(dx) < 8 && !sortie && router.push(`/aujourdhui?u=${c.cle}`),
                    role: "button" as const,
                    tabIndex: 0,
                    "aria-label": `Entrer dans ${c.nom}`,
                  }
                : { "aria-hidden": true })}
            >
              {/* Le paysage : c'est lui qui fait qu'on n'est pas devant un
                  tableau de bord. */}
              <div className="relative h-[46%] overflow-hidden" style={{ background: c.ciel }}>
                <Scene className="absolute inset-0 h-full w-full" />
                <span className="absolute right-4 top-4">
                  <Pastille nombre={c.pastille} />
                </span>
              </div>

              <div className="flex flex-col p-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
                  {c.matiere}
                </span>
                <h2 className="voice-amana mt-1 text-[28px] leading-tight">{c.nom}</h2>
                <p className="mt-1 text-sm text-ink-soft">{c.sujet}</p>

                {c.motifs.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1.5">
                    {c.motifs.slice(0, 3).map((m, k) => (
                      <li key={k} className="flex gap-2.5 text-[13px] leading-snug text-ink-soft">
                        <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                        <span className="flex-1">{m}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {dessus && (
                  <span className="press mt-5 self-start rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-paper">
                    Entrer
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* L'orientation d'AMANA, sous le paquet — jamais par-dessus le paysage. */}
      <div className="px-5 pb-2">
        <div className="mb-3 flex justify-center gap-1.5">
          {cartes.map((c, k) => (
            <button
              key={c.cle}
              type="button"
              aria-label={`Voir ${c.nom}`}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                k === i ? "w-6 bg-gold" : "w-1.5 bg-ink/20"
              }`}
            />
          ))}
        </div>

        {/* Ce qui attend dans le monde presente : calcule, jamais ecrit par
            le modele. Un appel par jour pour deux phrases descriptives etait
            un cout sans contrepartie. */}
        {devant.motifs.length > 0 && (
          <p className="rounded-[16px] border-l-[3px] border-gold bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            <b className="font-semibold text-ink">{devant.motifs[0]}</b>
            {devant.motifs.length > 1 &&
              ` — et ${devant.motifs.length - 1} autre${devant.motifs.length > 2 ? "s" : ""} ici.`}
          </p>
        )}
      </div>
    </main>
  );
}
