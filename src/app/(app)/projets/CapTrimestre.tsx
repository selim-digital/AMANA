"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decalerProjet, definirOkr, pointerResultat } from "@/lib/actions";

export type ResultatCle = { id: string; label: string; target: string | null; current: number };
export type Cap = {
  projetId: string;
  projet: string;
  periode: string;
  objectif: string | null;
  resultats: ResultatCle[];
};

/**
 * Le cap du trimestre d'un projet : un objectif, jusqu'à trois résultats
 * mesurables, et un point chaque semaine. Un projet actif sans cap est
 * signalé — on assume de le poser, ou on décale le projet.
 */
export function CapTrimestre({ cap }: { cap: Cap }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [objectif, setObjectif] = useState("");
  const [krs, setKrs] = useState([
    { label: "", target: "" },
    { label: "", target: "" },
    { label: "", target: "" },
  ]);
  const [saving, start] = useTransition();

  function enregistrer() {
    start(async () => {
      await definirOkr(cap.projetId, objectif, krs);
      setOuvert(false);
      router.refresh();
    });
  }

  function pointer(id: string, valeur: number) {
    start(async () => {
      await pointerResultat(id, valeur);
      router.refresh();
    });
  }

  // ─────────── Le projet a un cap : on suit ───────────
  if (cap.objectif) {
    return (
      <section className="rounded-[18px] border border-ink/10 bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {cap.projet}
          </span>
          <span className="text-[11px] text-ink-faint">{cap.periode}</span>
        </div>
        <p className="voice-amana mt-1 text-[15px] leading-snug">{cap.objectif}</p>

        <div className="mt-3 flex flex-col gap-3">
          {cap.resultats.map((r) => (
            <div key={r.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex-1">{r.label}</span>
                <span className="text-xs tabular-nums text-ink-faint">
                  {r.target ? `${r.current} % · ${r.target}` : `${r.current} %`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, r.current))}%` }}
                />
              </div>
              {/* Le point de la semaine : un geste, pas un formulaire. */}
              <div className="mt-2 flex gap-1.5">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => pointer(r.id, v)}
                    disabled={saving}
                    className={`press flex-1 rounded-full border py-1.5 text-[11px] font-semibold ${
                      r.current === v
                        ? "border-gold bg-gold-soft text-ink"
                        : "border-ink/15 text-ink-faint"
                    }`}
                  >
                    {v} %
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOuvert(true)}
          className="mt-3 text-xs text-ink-faint underline-offset-4 hover:underline"
        >
          Redéfinir le cap
        </button>

        {ouvert && <Formulaire {...{ objectif, setObjectif, krs, setKrs, enregistrer, saving, fermer: () => setOuvert(false) }} />}
      </section>
    );
  }

  // ─────────── Pas de cap : on pousse, sans culpabiliser ───────────
  return (
    <section className="rounded-[18px] border border-gold/30 bg-surface p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
        {cap.projet}
      </span>
      <p className="voice-amana mt-1 text-[15px] leading-snug">
        Ce projet est actif mais n&apos;a pas de cap sur ce trimestre.
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Un projet sans objectif à trois mois avance rarement. Pose un cap — ou décale-le
        assumément, ce n&apos;est pas un échec.
      </p>

      {!ouvert ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setOuvert(true)}
            className="press rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D]"
          >
            Définir un cap
          </button>
          <button
            onClick={() => start(async () => { await decalerProjet(cap.projetId); router.refresh(); })}
            disabled={saving}
            className="press rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold text-ink-soft"
          >
            Décaler ce projet
          </button>
        </div>
      ) : (
        <Formulaire {...{ objectif, setObjectif, krs, setKrs, enregistrer, saving, fermer: () => setOuvert(false) }} />
      )}
    </section>
  );
}

function Formulaire({
  objectif,
  setObjectif,
  krs,
  setKrs,
  enregistrer,
  saving,
  fermer,
}: {
  objectif: string;
  setObjectif: (v: string) => void;
  krs: { label: string; target: string }[];
  setKrs: (v: { label: string; target: string }[]) => void;
  enregistrer: () => void;
  saving: boolean;
  fermer: () => void;
}) {
  const champ =
    "w-full rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  return (
    <div className="step-enter mt-3 flex flex-col gap-3 border-t border-ink/10 pt-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          L&apos;objectif du trimestre
        </span>
        <input
          value={objectif}
          onChange={(e) => setObjectif(e.target.value)}
          placeholder="Ex. Valider l'intérêt du marché auprès de vrais utilisateurs"
          className={champ}
        />
      </label>

      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        À quoi tu sauras que c&apos;est atteint (3 max)
      </span>
      {krs.map((k, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={k.label}
            onChange={(e) => {
              const n = [...krs];
              n[i] = { ...n[i], label: e.target.value };
              setKrs(n);
            }}
            placeholder={i === 0 ? "Ex. 12 entretiens menés" : "Résultat mesurable"}
            className={champ}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={enregistrer}
          disabled={saving || !objectif.trim()}
          className="press flex-1 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
        >
          {saving ? "Enregistrement…" : "Poser ce cap"}
        </button>
        <button onClick={fermer} className="press rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold">
          Annuler
        </button>
      </div>
    </div>
  );
}
