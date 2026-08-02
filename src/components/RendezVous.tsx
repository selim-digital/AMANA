"use client";

import { useCallback, useEffect, useState } from "react";
import { AmanaMark } from "@/components/AmanaMark";
import { creneauCourant, type Methode } from "@/lib/priere";

/**
 * Les cinq rendez-vous du jour.
 *
 * Ils sont calés sur les horaires de prière, calculés sur l'appareil à partir
 * de la position. Rien n'en est dit à la personne : elle constate seulement
 * qu'AMANA arrive au bon moment. Un bon rythme ne s'annonce pas.
 *
 * Un créneau atteint ouvre au plus un message, écrit par l'IA à partir de ce
 * qui l'attend réellement. Une fois vu, il ne revient pas.
 */

type Push = {
  id: string;
  titre: string;
  texte: string;
  cta: string;
  href: string;
  univers: string;
  pourquoiMaintenant?: string;
};

const CLE = "amana.rdv";

export function RendezVous({
  lat,
  lng,
  methode,
  ombre,
}: {
  lat: number | null;
  lng: number | null;
  methode: string | null;
  ombre: number;
}) {
  const [push, setPush] = useState<Push | null>(null);

  const demander = useCallback(async (creneau: string) => {
    try {
      if (localStorage.getItem(CLE) === creneau) return;
    } catch {
      // Stockage indisponible : on préfère un message de trop qu'aucun.
    }
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creneau }),
      });
      if (!res.ok) return;
      const d = await res.json();
      if (d.push) {
        setPush(d.push);
        try {
          localStorage.setItem(CLE, creneau);
        } catch {
          /* sans mémoire locale, le serveur dédoublonne déjà */
        }
      }
    } catch {
      // Un rendez-vous manqué ne casse rien : le suivant viendra.
    }
  }, []);

  useEffect(() => {
    if (lat === null || lng === null) return;

    function verifier() {
      const maintenant = new Date();
      const c = creneauCourant(
        maintenant,
        lat as number,
        lng as number,
        (methode as Methode) ?? "mwl",
        ombre === 2 ? 2 : 1,
      );
      if (!c) return;
      const jour = maintenant.toISOString().slice(0, 10);
      void demander(`${jour}-${c}`);
    }

    verifier();
    // L'app reste ouverte des heures : on repasse un créneau sans recharger.
    const t = setInterval(verifier, 5 * 60_000);
    const auRetour = () => document.visibilityState === "visible" && verifier();
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [lat, lng, methode, ombre, demander]);

  if (!push) return null;

  return (
    <div
      className="veil-enter fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/45 p-4 backdrop-blur-[2px]"
      onClick={() => setPush(null)}
      role="dialog"
      aria-modal="true"
      aria-label={push.titre}
    >
      <div
        className="sheet-enter w-full max-w-md rounded-[28px] bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AmanaMark className="h-10 w-10 flex-none" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {push.titre}
            </span>
            <p className="voice-amana mt-1.5 text-[17px] leading-snug">{push.texte}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={push.href}
            onClick={() => setPush(null)}
            className="press rounded-full bg-gold px-6 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-[#12100D]"
          >
            {push.cta}
          </a>
          <button
            onClick={() => setPush(null)}
            className="press rounded-full px-6 py-2.5 text-sm text-ink-faint"
          >
            Pas maintenant
          </button>
        </div>
      </div>
    </div>
  );
}
