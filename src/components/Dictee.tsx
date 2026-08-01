"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Parler plutôt qu'écrire.
 *
 * Décrire un cap trimestriel au clavier demande un effort que beaucoup ne
 * fournissent pas — on abandonne, et l'écran reste vide. À l'oral, la même
 * chose se dit en quinze secondes.
 *
 * On s'appuie sur la reconnaissance vocale du navigateur : rien ne part vers
 * un service tiers, rien à facturer, et ça marche hors ligne sur certains
 * appareils. Là où le navigateur ne la propose pas, le bouton ne s'affiche
 * simplement pas — jamais un bouton mort.
 */

type Reco = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } };
};

function moteur(): (new () => Reco) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Reco;
    webkitSpeechRecognition?: new () => Reco;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function Dictee({
  onTexte,
  onFin,
  auto = false,
  className = "",
}: {
  /** Reçoit le texte reconnu, au fil de la parole. */
  onTexte: (texte: string, definitif: boolean) => void;
  /** Appelé quand la dictée s'arrête d'elle-même. */
  onFin?: () => void;
  /** Démarre dès l'affichage — pour un écran ouvert exprès pour dicter. */
  auto?: boolean;
  className?: string;
}) {
  const [dispo, setDispo] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const recoRef = useRef<Reco | null>(null);
  const acquisRef = useRef("");

  useEffect(() => {
    const M = moteur();
    if (!M) return;
    setDispo(true);

    const reco = new M();
    reco.lang = "fr-FR";
    reco.continuous = true;
    reco.interimResults = true;

    reco.onresult = (e) => {
      let provisoire = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const bout = e.results[i][0].transcript;
        if (e.results[i].isFinal) acquisRef.current += bout;
        else provisoire += bout;
      }
      onTexte((acquisRef.current + provisoire).trim(), false);
    };

    reco.onerror = (e) => {
      // Un refus de micro doit se dire ; un silence n'est pas une erreur.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setErreur("Micro refusé. Autorise-le dans les réglages du navigateur.");
      } else if (e.error && e.error !== "no-speech" && e.error !== "aborted") {
        setErreur("La dictée s'est interrompue.");
      }
      setEcoute(false);
    };

    reco.onend = () => {
      setEcoute(false);
      if (acquisRef.current.trim()) onTexte(acquisRef.current.trim(), true);
      onFin?.();
    };

    recoRef.current = reco;
    return () => {
      reco.onresult = null;
      reco.onerror = null;
      reco.onend = null;
      try {
        reco.stop();
      } catch {
        // Déjà arrêtée : rien à faire.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (auto && dispo && !ecoute) basculer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, dispo]);

  function basculer() {
    const reco = recoRef.current;
    if (!reco) return;
    setErreur(null);
    if (ecoute) {
      reco.stop();
      return;
    }
    acquisRef.current = "";
    try {
      reco.start();
      setEcoute(true);
    } catch {
      // Un double démarrage lève : on ignore, l'état est déjà bon.
    }
  }

  if (!dispo) return null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={basculer}
        aria-label={ecoute ? "Arrêter la dictée" : "Dicter à la voix"}
        aria-pressed={ecoute}
        className={`press flex h-11 w-11 flex-none items-center justify-center rounded-full border transition-colors ${
          ecoute
            ? "border-gold bg-gold text-[#12100D]"
            : "border-ink/15 bg-surface text-ink-soft hover:border-gold"
        }`}
      >
        {ecoute && (
          <span className="absolute h-11 w-11 animate-ping rounded-full bg-gold/40" aria-hidden />
        )}
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      {erreur && <span className="mt-1 max-w-[10rem] text-center text-[10px] text-[#B8543F]">{erreur}</span>}
    </div>
  );
}
