"use client";

import { useEffect, useState } from "react";

type Nudge = { accroche: string; texte: string; cta: string; href: string };

/**
 * Le coup de pouce flottant.
 *
 * Il monte du bas, au-dessus du micro, quelques secondes après l'arrivée —
 * le temps que l'écran se pose. Une seule fois par demi-journée : un coup de
 * pouce qui revient sans cesse cesse d'en être un.
 *
 * Il se ferme d'un geste et ne revient pas. C'est la condition pour qu'il
 * reste une invitation et jamais une réprimande.
 */
export function NudgeFlottant() {
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const d = new Date();
    const creneau = `${d.toISOString().slice(0, 10)}-${d.getHours() < 14 ? "matin" : "soir"}`;
    const cle = `amana.nudge.${creneau}`;

    try {
      if (localStorage.getItem(cle)) return;
    } catch {
      /* sans stockage local, on l'affichera à nouveau : ce n'est pas grave */
    }

    let vivant = true;
    const t = setTimeout(() => {
      fetch("/api/nudge", { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!vivant || !data?.nudge) return;
          setNudge(data.nudge);
          setVisible(true);
        })
        .catch(() => {
          /* l'app reste utilisable sans coup de pouce */
        });
    }, 2600);

    return () => {
      vivant = false;
      clearTimeout(t);
    };
  }, []);

  function fermer() {
    const d = new Date();
    const creneau = `${d.toISOString().slice(0, 10)}-${d.getHours() < 14 ? "matin" : "soir"}`;
    try {
      localStorage.setItem(`amana.nudge.${creneau}`, "1");
    } catch {
      /* idem */
    }
    setVisible(false);
  }

  if (!visible || !nudge) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="sheet-enter pointer-events-auto w-full max-w-md rounded-[22px] border border-gold/40 bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {nudge.accroche}
          </span>
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer"
            className="press -mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-faint hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="voice-amana mt-2 text-[15px] leading-snug">{nudge.texte}</p>

        <div className="mt-4 flex items-center gap-2">
          <a
            href={nudge.href}
            onClick={fermer}
            className="press flex-1 rounded-full bg-gold px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#12100D]"
          >
            {nudge.cta}
          </a>
          <button
            type="button"
            onClick={fermer}
            className="press flex-none rounded-full px-4 py-3 text-xs text-ink-faint"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
