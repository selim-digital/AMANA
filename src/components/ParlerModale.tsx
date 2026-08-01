"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dictee } from "@/components/Dictee";

/**
 * Le geste central de l'app : parler.
 *
 * L'icône « Déposer » ne disait rien — une flèche vers le bas ne se devine
 * pas. Un micro qui pulse dit exactement ce qu'il fait, et ouvre la seule
 * porte qui ne demande aucun effort : dire ce qu'on a en tête à voix haute.
 *
 * Ce qui en sort n'est pas une note jetée dans une boîte : c'est le début
 * d'un échange où AMANA range, priorise et ramène vers l'action du jour.
 */

const AMORCES = [
  "J'ai trop de choses en tête",
  "Je ne sais pas par quoi commencer",
  "Je bloque sur quelque chose",
];

export function ParlerModale({ ouvert, fermer }: { ouvert: boolean; fermer: () => void }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");

  if (!ouvert) return null;

  function envoyer(contenu: string) {
    const t = contenu.trim();
    if (!t) return;
    fermer();
    setTexte("");
    router.push(`/conversation?depot=${encodeURIComponent(t.slice(0, 1500))}`);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onClick={fermer}
      role="dialog"
      aria-modal="true"
      aria-label="Parler à AMANA"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="step-enter w-full max-w-md rounded-t-[28px] bg-paper p-6 pb-8 shadow-2xl sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="voice-amana text-xl">Dis-moi ce que tu as en tête</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Parle librement. Je range, je te rends l&apos;essentiel, et on repart avec une
              action.
            </p>
          </div>
          <button
            onClick={fermer}
            aria-label="Fermer"
            className="press -mr-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full text-ink-faint hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Le micro démarre seul : la modale n'est ouverte que pour ça. */}
        <div className="mt-6 flex flex-col items-center">
          <Dictee auto onTexte={(t) => setTexte(t)} className="scale-150" />
          <p className="mt-5 text-center text-xs text-ink-faint">
            Touche le micro pour arrêter ou reprendre
          </p>
        </div>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={3}
          placeholder="…ou écris ici"
          className="mt-4 w-full resize-none rounded-[18px] border border-ink/15 bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
        />

        {!texte.trim() && (
          <div className="mt-3 flex flex-wrap gap-2">
            {AMORCES.map((a) => (
              <button
                key={a}
                onClick={() => envoyer(a)}
                className="press rounded-full border border-ink/15 px-3.5 py-2 text-xs text-ink-soft"
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => envoyer(texte)}
            disabled={!texte.trim()}
            className="press flex-1 rounded-full bg-gold px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
          >
            En parler
          </button>
          <a
            href="/deposer"
            onClick={fermer}
            className="press flex-none rounded-full border border-ink/20 px-5 py-3.5 text-xs font-semibold text-ink-soft"
          >
            Tout déposer
          </a>
        </div>
      </div>
    </div>
  );
}
