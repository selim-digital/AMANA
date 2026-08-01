"use client";

import { useEffect, useState } from "react";

export type ProjetCarte = {
  id: string;
  name: string;
  progress: number;
  objective: string | null;
};

/**
 * Les projets actifs défilent, un toutes les trois secondes.
 *
 * Avec trois projets au maximum, n'en montrer qu'un revenait à en cacher deux.
 * Le défilement les fait tous exister sans coûter de place — et il s'arrête
 * dès qu'on survole ou qu'on prend la main, parce qu'un carrousel qui bouge
 * sous le doigt est une gêne, pas une animation.
 */
export function ProjetsSlider({ projets, actifs }: { projets: ProjetCarte[]; actifs: number }) {
  const [i, setI] = useState(0);
  const [fige, setFige] = useState(false);

  useEffect(() => {
    if (projets.length < 2 || fige) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % projets.length), 3000);
    return () => clearInterval(t);
  }, [projets.length, fige]);

  if (!projets.length) return null;
  const p = projets[Math.min(i, projets.length - 1)];

  return (
    <div
      className="enter"
      style={{ "--i": 5 } as React.CSSProperties}
      onMouseEnter={() => setFige(true)}
      onMouseLeave={() => setFige(false)}
      onFocusCapture={() => setFige(true)}
      onBlurCapture={() => setFige(false)}
    >
      <a
        href={`/conversation?projet=${p.id}`}
        className="press lift block rounded-[20px] bg-panel p-5 text-panel-text"
      >
        <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] opacity-60">
          <span>Projet actif · {actifs} / 3</span>
          <span>En parler →</span>
        </span>

        {/* La clé force le remontage : chaque projet entre au lieu de se
            substituer sèchement au précédent. */}
        <div key={p.id} className="fade-swap">
          <h2 className="mt-1.5 text-lg font-semibold">{p.name}</h2>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="bar-fill h-full rounded-full bg-gold"
              style={{ width: `${Math.max(p.progress ?? 0, 3)}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] opacity-80">
            Prochaine étape :{" "}
            <b className="font-semibold opacity-100">
              {p.objective || "définir la prochaine action"}
            </b>
          </p>
        </div>
      </a>

      {projets.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {projets.map((q, n) => (
            <button
              key={q.id}
              type="button"
              aria-label={`Voir ${q.name}`}
              onClick={() => {
                setI(n);
                setFige(true);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === i ? "w-6 bg-gold" : "w-1.5 bg-ink/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
