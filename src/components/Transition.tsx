"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AmanaMark } from "@/components/AmanaMark";

/**
 * Le passage d'un écran à l'autre.
 *
 * Un changement de page instantané n'a pas de début : on cligne des yeux et
 * le contenu a changé. Un voile bref, avec la marque qui s'éveille au centre,
 * donne au passage une durée — et fait de la navigation un geste plutôt qu'un
 * saut.
 *
 * Volontairement court (520 ms) : au-delà, ce n'est plus une transition, c'est
 * une attente. Et jamais au premier affichage, où l'écran d'ouverture joue
 * déjà ce rôle.
 */
export function Transition() {
  const pathname = usePathname();
  const params = useSearchParams();
  const cle = `${pathname}?${params.toString()}`;

  const [actif, setActif] = useState(false);
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setActif(true);
    const t = setTimeout(() => setActif(false), 520);
    return () => clearTimeout(t);
  }, [cle]);

  if (!actif) return null;

  return (
    <div
      aria-hidden
      className="voile-passage pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-paper"
    >
      <AmanaMark eveil className="h-16 w-16" />
    </div>
  );
}
