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
 * un service tiers, rien à facturer. Là où le navigateur ne la propose pas,
 * le bouton ne s'affiche pas — jamais un bouton mort.
 *
 * ── Pourquoi le texte se répétait ──
 *
 * Deux causes, corrigées l'une après l'autre.
 *
 * La première : on accumulait les segments définitifs au fil des événements,
 * alors que le moteur relivre régulièrement des résultats déjà transmis. La
 * transcription est désormais RECONSTRUITE depuis le premier résultat à chaque
 * événement — une opération idempotente ne peut pas dupliquer.
 *
 * La seconde, plus insidieuse : au redémarrage du moteur, on versait dans le
 * socle le texte affiché, PROVISOIRE COMPRIS. Or le provisoire n'est qu'un
 * aperçu de ce que le moteur croit entendre. En repartant, il réentendait la
 * même fin de phrase et la confirmait — on l'avait deux fois. Seul le
 * définitif rejoint le socle ; l'aperçu est jeté.
 *
 * Enfin `continuous` est abandonné : sur Android il fait boucler le moteur sur
 * lui-même. Une session par phrase, relancée à la main, est prévisible partout.
 */

type Reco = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
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

/** Recolle deux morceaux sans coller les mots ni doubler les espaces. */
function joindre(a: string, b: string) {
  if (!a) return b;
  if (!b) return a;
  return `${a.replace(/\s+$/, "")} ${b.replace(/^\s+/, "")}`;
}

export function Dictee({
  onTexte,
  onDebut,
  onFin,
  auto = false,
  className = "",
}: {
  /** Reçoit la transcription COMPLÈTE de la session, à remplacer telle quelle. */
  onTexte: (texte: string, definitif: boolean) => void;
  /** Appelé au démarrage — pour retenir ce qui était déjà saisi. */
  onDebut?: () => void;
  /** Appelé quand la dictée s'arrête pour de bon. */
  onFin?: () => void;
  /** Démarre dès l'affichage — pour un écran ouvert exprès pour dicter. */
  auto?: boolean;
  className?: string;
}) {
  const [dispo, setDispo] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recoRef = useRef<Reco | null>(null);
  /** Ce qui a été dit avant le dernier redémarrage du moteur. */
  const socleRef = useRef("");
  /** L'intention de la personne : le moteur peut s'arrêter, pas elle. */
  const vouluRef = useRef(false);
  /** Le definitif de la session EN COURS. Le provisoire n'y entre jamais. */
  const confirmeRef = useRef("");
  /** La derniere transcription emise, pour la restituer en fin de dictee. */
  const derniereRef = useRef("");
  const onTexteRef = useRef(onTexte);
  onTexteRef.current = onTexte;

  /** Emet la transcription et la retient. */
  const emettre = (t: string, definitif: boolean) => {
    derniereRef.current = t;
    onTexteRef.current(t, definitif);
  };
  const emettreRef = useRef(emettre);
  emettreRef.current = emettre;

  useEffect(() => {
    const M = moteur();
    if (!M) return;
    setDispo(true);

    const reco = new M();
    reco.lang = "fr-FR";
    // `continuous` était le cœur du problème : sur Android, il fait boucler le
    // moteur sur lui-même et relivrer des segments déjà transmis. Une session
    // par phrase, relancée à la main, est prévisible partout.
    reco.continuous = false;
    reco.interimResults = true;
    reco.maxAlternatives = 1;

    reco.onresult = (e) => {
      // On sépare strictement le définitif du provisoire. Le provisoire n'est
      // qu'un aperçu : il s'affiche, mais il ne rejoint JAMAIS le socle — le
      // moteur va le réentendre et le confirmer, et on l'aurait deux fois.
      let definitif = "";
      let provisoire = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) definitif = joindre(definitif, r[0].transcript);
        else provisoire = joindre(provisoire, r[0].transcript);
      }
      confirmeRef.current = definitif;
      emettreRef.current(joindre(joindre(socleRef.current, definitif), provisoire).trim(), false);
    };

    reco.onerror = (e) => {
      // Un refus de micro se dit ; un silence n'est pas une erreur.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setErreur("Micro refusé. Autorise-le dans les réglages du navigateur.");
        vouluRef.current = false;
      } else if (e.error && e.error !== "no-speech" && e.error !== "aborted") {
        setErreur("La dictée s'est interrompue.");
      }
    };

    reco.onend = () => {
      // Fin de session : SEUL le définitif rejoint le socle. C'est la règle qui
      // interdit les doublons — ce qui n'était qu'un aperçu est jeté, et la
      // session suivante le réentendra proprement.
      socleRef.current = joindre(socleRef.current, confirmeRef.current).trim();
      confirmeRef.current = "";

      if (vouluRef.current) {
        try {
          reco.start();
          return;
        } catch {
          /* le moteur refuse de repartir : on s'arrête proprement */
        }
      }

      setEcoute(false);
      if (socleRef.current) emettreRef.current(socleRef.current, true);
      onFin?.();
    };

    recoRef.current = reco;
    return () => {
      vouluRef.current = false;
      reco.onresult = null;
      reco.onerror = null;
      reco.onend = null;
      try {
        reco.abort();
      } catch {
        /* déjà arrêtée */
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
      vouluRef.current = false;
      reco.stop();
      return;
    }

    socleRef.current = "";
    confirmeRef.current = "";
    derniereRef.current = "";
    vouluRef.current = true;
    onDebut?.();
    try {
      reco.start();
      setEcoute(true);
    } catch {
      // Un double démarrage lève : l'état est déjà bon.
      setEcoute(true);
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
        className={`press relative flex h-11 w-11 flex-none items-center justify-center rounded-full border transition-colors ${
          ecoute
            ? "border-gold bg-gold text-[#12100D]"
            : "border-ink/15 bg-surface text-ink-soft hover:border-gold"
        }`}
      >
        {ecoute && (
          <span className="onde absolute inset-0 rounded-full bg-gold" aria-hidden />
        )}
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      {erreur && (
        <span className="mt-1 max-w-[10rem] text-center text-[10px] text-[#B8543F]">{erreur}</span>
      )}
    </div>
  );
}
