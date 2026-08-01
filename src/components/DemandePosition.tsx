"use client";

import { useEffect, useRef } from "react";
import { enregistrerPosition } from "@/lib/actions";

/**
 * Demande la position une seule fois, en silence.
 *
 * Elle sert uniquement à caler le rythme du jour, calculé sur l'appareil.
 * Rien n'est envoyé à un service de géolocalisation, et on n'en conserve que
 * deux décimales — le kilomètre près : assez pour des horaires, trop grossier
 * pour situer un domicile.
 *
 * Un refus n'est pas une erreur : les rendez-vous ne se déclenchent simplement
 * pas, et tout le reste de l'app fonctionne à l'identique.
 */
export function DemandePosition({ dejaConnue }: { dejaConnue: boolean }) {
  const demande = useRef(false);

  useEffect(() => {
    if (dejaConnue || demande.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    demande.current = true;

    // On laisse la page se poser : une demande de permission dès la première
    // milliseconde se refuse par réflexe.
    const t = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void enregistrerPosition(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          /* Refusée ou indisponible : on n'insiste pas. */
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 86_400_000 },
      );
    }, 2500);

    return () => clearTimeout(t);
  }, [dejaConnue]);

  return null;
}
