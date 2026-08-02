"use client";

import { useEffect, useState } from "react";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";

/**
 * L'ouverture de l'application.
 *
 * Au lancement, la marque s'éveille en grand : le carré arrive pivoté, se
 * redresse, les points s'allument un à un, l'or diffuse son halo. Puis le
 * voile se retire sur l'écran déjà prêt derrière.
 *
 * Une fois par session, pas à chaque navigation — une animation qu'on revoit
 * dix fois par jour cesse d'être un accueil et devient une attente.
 */
export function Ouverture() {
  // On part visible : sur un démarrage à froid, l'écran doit être là avant
  // même que React ait décidé quoi que ce soit.
  const [phase, setPhase] = useState<"visible" | "sortie" | "fini">("fini");

  useEffect(() => {
    let dejaVue = false;
    try {
      dejaVue = sessionStorage.getItem("amana.ouverture") === "1";
    } catch {
      /* sans stockage de session, on montrera l'ouverture : ce n'est pas grave */
    }
    if (dejaVue) return;

    try {
      sessionStorage.setItem("amana.ouverture", "1");
    } catch {
      /* idem */
    }

    const doux = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("visible");

    // Sans mouvement, on ne s'attarde pas : la marque se montre et s'efface.
    const t1 = setTimeout(() => setPhase("sortie"), doux ? 600 : 1750);
    const t2 = setTimeout(() => setPhase("fini"), doux ? 950 : 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "fini") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper transition-opacity duration-[450ms] ${
        phase === "sortie" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      <AmanaMark eveil className="h-24 w-24" />
      <span className="ouverture-nom mt-6">
        <Wordmark className="text-[15px] text-ink" />
      </span>
      <span className="ouverture-mot mt-3 text-[11px] uppercase tracking-[0.24em] text-ink-faint">
        Le dépôt confié
      </span>
    </div>
  );
}
