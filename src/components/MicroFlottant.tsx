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

      {/* Un voile dégradé sous le bouton : sans lui, sur une page qui ne
          défile pas, le micro se confond avec le contenu au lieu de flotter
          au-dessus. `pb-[env(safe-area-inset-bottom)]` le tient au-dessus de
          la barre système sur iOS comme sur Android. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-10"
        style={{
          background:
            "linear-gradient(to top, var(--paper) 38%, color-mix(in srgb, var(--paper) 70%, transparent) 68%, transparent)",
        }}
      >
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Parler à AMANA"
          className="press pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-[#12100D] shadow-lg shadow-gold/30"
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
      </div>
    </>
  );
}
