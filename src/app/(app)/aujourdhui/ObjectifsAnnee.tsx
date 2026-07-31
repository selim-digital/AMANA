"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirObjectifsAnnee } from "@/lib/actions";

export type ObjectifAnnee = { id: string; label: string; why: string | null };

/**
 * Les trois objectifs de l'année : ce qui donnera le sentiment d'une année
 * accomplie. Trois, pas plus — c'est la contrainte qui force à choisir.
 */
export function ObjectifsAnnee({
  objectifs,
  annee,
}: {
  objectifs: ObjectifAnnee[];
  annee: number;
}) {
  const router = useRouter();
  const [edite, setEdite] = useState(false);
  const [champs, setChamps] = useState(
    [0, 1, 2].map((i) => ({
      label: objectifs[i]?.label ?? "",
      why: objectifs[i]?.why ?? "",
    })),
  );
  const [saving, start] = useTransition();

  function enregistrer() {
    start(async () => {
      await definirObjectifsAnnee(champs);
      setEdite(false);
      router.refresh();
    });
  }

  // ─────────── Rien de défini : on pousse, sans culpabiliser ───────────
  if (objectifs.length === 0 && !edite) {
    return (
      <section className="rounded-[20px] border border-gold/30 bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
          Ton année {annee}
        </span>
        <p className="voice-amana mt-1.5 text-[16px] leading-snug">
          Quels sont les trois objectifs qui, atteints, te feront dire que cette année a compté ?
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Trois, pas plus. C&apos;est la contrainte qui oblige à choisir.
        </p>
        <button
          onClick={() => setEdite(true)}
          className="press mt-4 rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Les définir
        </button>
      </section>
    );
  }

  // ─────────── Saisie ───────────
  if (edite) {
    return (
      <section className="rounded-[20px] border border-gold/30 bg-surface p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
          Tes trois objectifs {annee}
        </span>

        <div className="mt-3 flex flex-col gap-4">
          {champs.map((c, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-soft text-[11px] font-bold text-gold-deep">
                  {i + 1}
                </span>
                <input
                  value={c.label}
                  onChange={(e) => {
                    const n = [...champs];
                    n[i] = { ...n[i], label: e.target.value };
                    setChamps(n);
                  }}
                  placeholder={
                    i === 0 ? "Ex. Lancer AMANA auprès de 30 utilisateurs" : "Un objectif qui compte"
                  }
                  className="flex-1 rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
                />
              </span>
              <input
                value={c.why}
                onChange={(e) => {
                  const n = [...champs];
                  n[i] = { ...n[i], why: e.target.value };
                  setChamps(n);
                }}
                placeholder="Pourquoi celui-là compte pour toi (facultatif)"
                className="ml-8 rounded-[14px] border border-ink/10 bg-paper px-3 py-2 text-xs text-ink-soft outline-none focus:border-gold"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={enregistrer}
            disabled={saving || !champs.some((c) => c.label.trim())}
            className="press flex-1 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={() => setEdite(false)}
            className="press rounded-full border border-ink/20 px-5 py-3 text-xs font-semibold"
          >
            Annuler
          </button>
        </div>
      </section>
    );
  }

  // ─────────── Affichage ───────────
  return (
    <section className="rounded-[20px] border border-ink/10 bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
          Ton année {annee}
        </span>
        <button
          onClick={() => setEdite(true)}
          className="text-xs text-ink-faint underline-offset-4 hover:underline"
        >
          Ajuster
        </button>
      </div>

      <ol className="mt-3 flex flex-col gap-2.5">
        {objectifs.map((o, i) => (
          <li key={o.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-soft text-[11px] font-bold text-gold-deep">
              {i + 1}
            </span>
            <span>
              <span className="block text-[15px] font-semibold leading-snug">{o.label}</span>
              {o.why && <span className="text-xs text-ink-faint">{o.why}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
