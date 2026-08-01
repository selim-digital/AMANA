"use client";

import Link from "next/link";
import { DesertScene, ForestScene, OceanScene } from "@/components/Scenes";

export type VueUnivers = {
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
 * Le bandeau des deux autres univers, à l'intérieur d'un univers.
 *
 * Ce ne sont pas des onglets : chacun garde son paysage, en réduction. On doit
 * reconnaître le monde d'un coup d'œil, comme sur le paquet — sinon changer
 * d'univers redeviendrait une opération abstraite.
 */
export function BandeauUnivers({
  univers,
  actif,
}: {
  univers: VueUnivers[];
  actif: string;
}) {
  const courant = univers.find((u) => u.cle === actif) ?? univers[0];
  const autres = univers.filter((u) => u.cle !== actif);
  const Scene = SCENES[courant.decor];

  return (
    <section className="enter" style={{ "--i": 1 } as React.CSSProperties}>
      {/* L'univers où l'on est : son paysage en bandeau, pour ne jamais perdre
          le fil de l'endroit. */}
      <div
        className="relative overflow-hidden rounded-[22px] border border-ink/10"
        style={{ background: courant.ciel }}
      >
        <Scene className="absolute inset-0 h-full w-full opacity-90" />
        <div className="relative flex items-end justify-between gap-3 px-5 pb-4 pt-16">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/70">
              {courant.matiere}
            </span>
            <h2 className="voice-amana text-2xl leading-tight text-ink">{courant.nom}</h2>
          </div>
          <Link
            href="/aujourdhui"
            className="press flex-none rounded-full bg-paper/85 px-3.5 py-1.5 text-[11px] font-semibold text-ink backdrop-blur"
          >
            Changer
          </Link>
        </div>
      </div>

      {/* Les deux autres, en miniature — un clic pour basculer. */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {autres.map((u) => {
          const S = SCENES[u.decor];
          return (
            <Link
              key={u.cle}
              href={`/aujourdhui?u=${u.cle}`}
              className="press lift relative overflow-hidden rounded-[16px] border border-ink/10"
              style={{ background: u.ciel }}
            >
              <S className="absolute inset-0 h-full w-full opacity-80" />
              <span className="relative flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-9">
                <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                  {u.nom}
                </span>
                {u.pastille > 0 && (
                  <span className="flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-paper">
                    {u.pastille > 9 ? "9+" : u.pastille}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
