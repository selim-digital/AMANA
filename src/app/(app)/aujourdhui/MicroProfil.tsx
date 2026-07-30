"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { repondreProfil } from "@/lib/actions";

/**
 * Une série de trois questions, posée au fil de l'eau — jamais un test.
 * À la fin de la série : une clôture encourageante, puis la carte s'efface.
 */

export type QuestionProfil = {
  cle: "disc" | "wpmot" | "ego";
  instrument: string;
  id: string;
  texte: string;
  options: { texte: string; axe: string }[];
};

const CLOTURES = [
  "AMANA te lit un peu mieux. C'est tout ce qu'il fallait.",
  "Trois réponses de plus, et l'accompagnement s'ajuste.",
  "C'est noté. Rien à retenir de ton côté.",
];

export function MicroProfil({
  questions,
  restantes,
}: {
  questions: QuestionProfil[];
  restantes: number;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [fini, setFini] = useState(false);
  const [masque, setMasque] = useState(false);
  const [, start] = useTransition();

  if (masque || questions.length === 0) return null;

  const q = questions[i];
  const dernier = i === questions.length - 1;

  function repondre(axe: string) {
    setChoisi(axe);
    start(async () => {
      await repondreProfil(q.cle, q.id, axe);
      setTimeout(() => {
        if (dernier) {
          setFini(true);
          // On laisse la clôture se jouer avant de rafraîchir l'écran.
          setTimeout(() => router.refresh(), 2600);
        } else {
          setI((n) => n + 1);
          setChoisi(null);
        }
      }, 380);
    });
  }

  // ─────────────── La clôture de série ───────────────
  if (fini) {
    const reste = Math.max(0, restantes - questions.length);
    return (
      <section className="flex flex-col items-center gap-3 rounded-[20px] border border-gold/40 bg-surface px-5 py-7 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
            <circle
              cx="32" cy="32" r="28" fill="none"
              className="cercle-ferme stroke-gold" strokeWidth="3" strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
            <path
              d="M21 33.5 28.5 41 43 24"
              fill="none" className="coche-trace stroke-gold-deep"
              strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          {/* Trois éclats sobres, pas de confettis. */}
          {[
            { dx: "-26px", dy: "-20px" },
            { dx: "24px", dy: "-24px" },
            { dx: "18px", dy: "22px" },
          ].map((e, n) => (
            <span
              key={n}
              className="eclat absolute h-1.5 w-1.5 rounded-full bg-gold"
              style={{ "--dx": e.dx, "--dy": e.dy, "--i": n } as React.CSSProperties}
            />
          ))}
        </span>

        <p className="voice-amana monte-doux text-[17px]" style={{ "--i": 0 } as React.CSSProperties}>
          {CLOTURES[Math.floor(Math.random() * CLOTURES.length)]}
        </p>
        <p className="monte-doux text-xs text-ink-faint" style={{ "--i": 1 } as React.CSSProperties}>
          {reste > 0
            ? `${reste} question${reste > 1 ? "s" : ""} restante${reste > 1 ? "s" : ""} — un autre jour.`
            : "Ta lecture est complète. Elle continuera d'évoluer avec toi."}
        </p>
      </section>
    );
  }

  // ─────────────── La série en cours ───────────────
  return (
    <section className="rounded-[20px] border border-ink/10 bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          {q.instrument}
        </span>
        <button
          onClick={() => setMasque(true)}
          className="text-xs text-ink-faint underline-offset-4 hover:underline"
        >
          Plus tard
        </button>
      </div>

      {/* Progression de la série : trois traits, pas un pourcentage. */}
      <div className="mt-2 flex gap-1.5" aria-label={`Question ${i + 1} sur ${questions.length}`}>
        {questions.map((_, n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              n < i ? "bg-gold" : n === i ? "bg-gold/50" : "bg-ink/10"
            }`}
          />
        ))}
      </div>

      <div key={q.id} className="step-enter mt-3">
        <p className="voice-amana text-[16px] leading-snug">{q.texte}</p>

        <div className="mt-3 flex flex-col gap-2">
          {q.options.map((o, n) => (
            <button
              key={o.axe + n}
              onClick={() => repondre(o.axe)}
              disabled={!!choisi}
              style={{ "--i": n } as React.CSSProperties}
              className={`press enter rounded-[16px] border px-4 py-3 text-left text-sm transition-colors ${
                choisi === o.axe
                  ? "border-gold bg-gold-soft font-semibold"
                  : "border-ink/15 bg-paper text-ink-soft"
              } ${choisi && choisi !== o.axe ? "opacity-40" : ""}`}
            >
              {o.texte}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-faint">
        Question {i + 1} sur {questions.length} — quelques secondes, rien de plus.
      </p>
    </section>
  );
}
