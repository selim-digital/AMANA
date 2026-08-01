"use client";

import { useState } from "react";

export type Synthese = {
  constat: string;
  appuis: string[];
  frictions: string[];
  angleMort: string;
  orientation: string;
};

/**
 * L'analyse finale d'une plongée.
 *
 * Sans elle, on repartait avec une pile d'hypothèses tranchées et rien qui les
 * relie. Elle ne produit aucune hypothèse nouvelle : elle relit les verdicts
 * déjà rendus. C'est pourquoi une plongée déjà terminée peut être analysée
 * après coup — la matière n'a pas bougé.
 */
export function Analyse({
  sessionId,
  initiale,
  assezDeMatiere,
}: {
  sessionId: string;
  initiale: Synthese | null;
  assezDeMatiere: boolean;
}) {
  const [synthese, setSynthese] = useState<Synthese | null>(initiale);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function produire(refaire = false) {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch("/api/deepdive/synthese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, refaire }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "L'analyse n'a pas abouti.");
      setSynthese(data.synthese);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'analyse n'a pas abouti.");
    } finally {
      setChargement(false);
    }
  }

  if (!synthese) {
    return (
      <section className="enter rounded-[20px] border border-dashed border-gold/40 bg-surface px-5 py-6 text-center">
        <p className="voice-amana text-[16px]">L&apos;analyse finale</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          {assezDeMatiere
            ? "AMANA relit tes verdicts et en tire ce qui se tient. Rien de neuf n'est inventé : ce que tu as écarté reste écarté."
            : "Tranche au moins deux hypothèses pour qu'une analyse ait du sens."}
        </p>
        {erreur && <p className="mt-2 text-sm text-[#B8543F]">{erreur}</p>}
        <button
          onClick={() => produire(false)}
          disabled={chargement || !assezDeMatiere}
          className="press mt-4 rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
        >
          {chargement ? "AMANA relit…" : "Produire l'analyse"}
        </button>
      </section>
    );
  }

  return (
    <section className="enter flex flex-col gap-4 rounded-[22px] border border-gold/40 bg-surface p-5 lg:p-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
          L&apos;analyse finale
        </span>
        <p className="voice-amana mt-2 text-[16px] leading-relaxed">{synthese.constat}</p>
      </div>

      {synthese.appuis.length > 0 && (
        <Bloc titre="Sur quoi tu t'appuies" items={synthese.appuis} puce="bg-gold" />
      )}

      {synthese.frictions.length > 0 && (
        <Bloc titre="Ce qui frotte" items={synthese.frictions} puce="bg-ink/40" />
      )}

      {synthese.angleMort?.trim() && (
        <div className="rounded-[16px] bg-surface-2 px-4 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            La question qui reste
          </span>
          <p className="voice-amana mt-1.5 text-[15px] leading-snug">{synthese.angleMort}</p>
        </div>
      )}

      {synthese.orientation?.trim() && (
        <div className="rounded-[16px] border-l-[3px] border-gold bg-gold-soft px-4 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            Une orientation, pas dix
          </span>
          <p className="mt-1.5 text-[15px] leading-snug">{synthese.orientation}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`/conversation?etape=${encodeURIComponent("Ma plongée")}`}
          className="press rounded-full bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          En parler
        </a>
        <button
          onClick={() => produire(true)}
          disabled={chargement}
          className="press rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold text-ink-soft disabled:opacity-40"
        >
          {chargement ? "AMANA relit…" : "Refaire l'analyse"}
        </button>
      </div>
      {erreur && <p className="text-sm text-[#B8543F]">{erreur}</p>}
    </section>
  );
}

function Bloc({ titre, items, puce }: { titre: string; items: string[]; puce: string }) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {titre}
      </span>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span className={`mt-[7px] h-1.5 w-1.5 flex-none rounded-full ${puce}`} />
            <span className="flex-1">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
