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
 * ── Pourquoi le voile est rendu côté serveur ──
 *
 * Android garde son propre écran de démarrage — icône géante sur fond uni —
 * tant que la page n'a rien peint. Si l'ouverture n'apparaissait qu'après
 * l'hydratation de React, l'écran système couvrait précisément le moment de
 * l'animation, et on ne la voyait jamais.
 *
 * Le voile fait donc partie du HTML initial : la première peinture a lieu
 * immédiatement, Android rend la main aussitôt, et l'animation démarre à
 * l'image où l'écran système disparaît. Le petit script juste en dessous
 * l'efface sans attendre React quand la session l'a déjà vu — sinon on
 * verrait un éclair blanc à chaque rechargement.
 *
 * Une fois par session, pas à chaque navigation : une animation qu'on revoit
 * dix fois par jour cesse d'être un accueil et devient une attente.
 */

const CLE = "amana.ouverture";

/** Exécuté avant toute peinture : c'est la condition pour qu'il n'y ait pas d'éclair. */
const EFFACER_SI_DEJA_VUE = `try{if(sessionStorage.getItem(${JSON.stringify(CLE)})==="1"){var e=document.getElementById("amana-ouverture");if(e)e.style.display="none"}else{sessionStorage.setItem(${JSON.stringify(CLE)},"1")}}catch(_){}`;

export function Ouverture() {
  const [phase, setPhase] = useState<"visible" | "sortie" | "fini">("visible");

  useEffect(() => {
    // Le script en ligne a déjà masqué le voile : rien à animer.
    const noeud = document.getElementById("amana-ouverture");
    if (noeud && noeud.style.display === "none") {
      setPhase("fini");
      return;
    }

    const doux = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase("sortie"), doux ? 600 : 1750);
    const t2 = setTimeout(() => setPhase("fini"), doux ? 950 : 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "fini") return null;

  return (
    <>
      <div
        id="amana-ouverture"
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
      <script dangerouslySetInnerHTML={{ __html: EFFACER_SI_DEJA_VUE }} />
    </>
  );
}
