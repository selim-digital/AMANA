"use client";

import { useState } from "react";
import { ParlerModale } from "@/components/ParlerModale";

/**
 * Le geste central, sans barre pour l'accueillir.
 *
 * Le menu a disparu : on entre par les univers. Mais parler reste le seul
 * geste qui doit être atteignable de partout et sans réfléchir — il devient
 * donc un bouton flottant, posé en bas, avec son anneau qui respire.
 */
export function MicroFlottant() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <ParlerModale ouvert={ouvert} fermer={() => setOuvert(false)} />
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Parler à AMANA"
        className="press fixed bottom-6 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gold text-[#12100D] shadow-lg shadow-gold/30"
      >
        <span className="halo pointer-events-none absolute inset-0 rounded-full bg-gold" aria-hidden />
        <svg
          viewBox="0 0 24 24"
          className="relative h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
    </>
  );
}
