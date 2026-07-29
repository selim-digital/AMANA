"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { repondreProfil } from "@/lib/actions";

/**
 * Une seule question, posée au fil de l'eau — jamais un test, jamais une série.
 * Elle affine la lecture que fait AMANA de la personne.
 */
export function MicroProfil({
  cle,
  titre,
  question,
  questionId,
  options,
  restantes,
}: {
  cle: "disc" | "wpmot" | "ego";
  titre: string;
  question: string;
  questionId: string;
  options: { texte: string; axe: string }[];
  restantes: number;
}) {
  const router = useRouter();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [masque, setMasque] = useState(false);
  const [, start] = useTransition();

  if (masque) return null;

  function repondre(axe: string) {
    setChoisi(axe);
    start(async () => {
      await repondreProfil(cle, questionId, axe);
      setTimeout(() => router.refresh(), 450);
    });
  }

  return (
    <section className="rounded-[20px] border border-ink/10 bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          {titre}
        </span>
        <button
          onClick={() => setMasque(true)}
          className="text-xs text-ink-faint underline-offset-4 hover:underline"
        >
          Plus tard
        </button>
      </div>

      <p className="voice-amana mt-2 text-[16px] leading-snug">{question}</p>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((o, i) => (
          <button
            key={o.axe + i}
            onClick={() => repondre(o.axe)}
            disabled={!!choisi}
            style={{ "--i": i } as React.CSSProperties}
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

      <p className="mt-3 text-xs text-ink-faint">
        {choisi
          ? "C'est noté. AMANA s'ajuste."
          : `Une question de temps en temps — ${restantes} restante${restantes > 1 ? "s" : ""}.`}
      </p>
    </section>
  );
}
