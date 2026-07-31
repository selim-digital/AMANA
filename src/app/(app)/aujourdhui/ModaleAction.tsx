"use client";

import { useEffect, useState } from "react";
import { AmanaMark } from "@/components/AmanaMark";

/**
 * La modale d'arrivée : AMANA propose UNE action en entrant sur le tableau de
 * bord. Elle ne s'affiche qu'une fois par jour, se ferme d'un geste, et ne
 * culpabilise jamais. Aucun appel IA : le message est déjà calculé côté serveur.
 */
export function ModaleAction({
  titre,
  texte,
  cta,
  href,
  cle,
}: {
  titre: string;
  texte: string;
  cta: string;
  href: string;
  /** Change chaque jour : la modale ne réapparaît pas dans la journée. */
  cle: string;
}) {
  const [ouverte, setOuverte] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("amana.modale") === cle) return;
    } catch {}
    // Petit délai : on laisse le tableau de bord se poser avant d'interpeller.
    const t = setTimeout(() => setOuverte(true), 900);
    return () => clearTimeout(t);
  }, [cle]);

  function fermer() {
    try {
      localStorage.setItem("amana.modale", cle);
    } catch {}
    setOuverte(false);
  }

  if (!ouverte) return null;

  return (
    <div
      className="veil-enter fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={fermer}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        className="sheet-enter w-full max-w-md rounded-[28px] bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AmanaMark className="h-10 w-10 flex-none" />
          <div className="flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {titre}
            </span>
            <p className="voice-amana mt-1.5 text-[17px] leading-snug">{texte}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={href}
            onClick={fermer}
            className="press rounded-full bg-gold px-6 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-[#12100D]"
          >
            {cta}
          </a>
          <button
            onClick={fermer}
            className="press rounded-full px-6 py-2.5 text-sm text-ink-faint"
          >
            Pas maintenant
          </button>
        </div>
      </div>
    </div>
  );
}
