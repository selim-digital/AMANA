"use client";

import { useEffect, useState } from "react";

export type VueUnivers = {
  cle: string;
  nom: string;
  sujet: string;
  matiere: string;
  pastille: number;
  motifs: string[];
};

/**
 * Le bandeau des trois univers, et la modale d'arrivée.
 *
 * On n'atterrit pas devant trois portes fermées : on est déjà dans un univers,
 * et une action est cochable au premier écran. Les deux autres restent à un
 * doigt, avec ce qui les attend.
 *
 * La modale ne se contente pas d'annoncer où l'on est : elle dit POURQUOI cet
 * univers maintenant, en citant ce qui y attend. Sans cette raison, atterrir
 * quelque part serait arbitraire.
 */
export function BandeauUnivers({
  univers,
  actif,
  raison,
}: {
  univers: VueUnivers[];
  actif: string;
  raison: string[];
}) {
  const [modale, setModale] = useState(false);
  const courant = univers.find((u) => u.cle === actif) ?? univers[0];

  // Une fois par jour : on explique l'arrivée, on ne la commente pas à chaque
  // aller-retour dans l'application.
  useEffect(() => {
    const jour = new Date().toISOString().slice(0, 10);
    const cle = `amana.arrivee.${jour}.${actif}`;
    try {
      if (localStorage.getItem(cle)) return;
      localStorage.setItem(cle, "1");
    } catch {
      return;
    }
    const t = setTimeout(() => setModale(true), 700);
    return () => clearTimeout(t);
  }, [actif]);

  return (
    <>
      {modale && (
        <div
          className="veil-enter fixed inset-0 z-[65] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
          onClick={() => setModale(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Tu es dans ${courant.nom}`}
        >
          <div
            className="sheet-enter w-full max-w-md rounded-[28px] bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {courant.matiere}
            </span>
            <h2 className="voice-amana mt-1.5 text-2xl">{courant.nom}</h2>
            <p className="mt-1 text-sm text-ink-soft">{courant.sujet}</p>

            <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Pourquoi ici, maintenant
            </p>
            {raison.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {raison.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                    <span className="flex-1">{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Rien ne presse ici. C&apos;est l&apos;univers où tu construis — reste, ou passe
                à un autre.
              </p>
            )}

            <button
              onClick={() => setModale(false)}
              className="press mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D]"
            >
              J&apos;y suis
            </button>
          </div>
        </div>
      )}

      <nav
        className="enter -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Univers"
      >
        {univers.map((u) => {
          const ici = u.cle === actif;
          return (
            <a
              key={u.cle}
              href={`/aujourdhui?u=${u.cle}`}
              aria-current={ici ? "page" : undefined}
              className={`press relative flex-none rounded-[16px] border px-4 py-2.5 ${
                ici
                  ? "border-gold bg-gold-soft font-semibold text-ink"
                  : "border-ink/12 bg-surface text-ink-soft"
              }`}
            >
              <span className="block text-sm">{u.nom}</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-ink-faint">
                {u.sujet}
              </span>
              {u.pastille > 0 && !ici && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-paper">
                  {u.pastille > 9 ? "9+" : u.pastille}
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </>
  );
}
