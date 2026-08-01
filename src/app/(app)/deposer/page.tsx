"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commitDecharge, type ProjetPropose, type TachePropose } from "@/lib/actions";
import { Dictee } from "@/components/Dictee";

/** SCR-DUMP + SCR-DUMP-REVIEW — déposer, puis valider ce qu'AMANA a structuré.
 *  La structuration est faite par Claude (/api/decharge) ; rien n'est créé sans validation. */

type Resultat = {
  projets: (ProjetPropose & { extrait?: string })[];
  taches: (TachePropose & { extrait?: string })[];
  resume: string;
};

const DOMAINES = [
  "Spiritualité & sens",
  "Famille",
  "Santé",
  "Profession / entrepreneuriat",
  "Apprentissage",
  "Contribution",
  "Relations",
];

const LIBELLE_KIND = { tache: "Tâche", rappel: "Rappel", decision: "Décision" } as const;

export default function DeposerPage() {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [res, setRes] = useState<Resultat | null>(null);
  const [ouvert, setOuvert] = useState<number | null>(0);
  const [analyse, setAnalyse] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  async function structurer() {
    setErreur(null);
    setAnalyse(true);
    try {
      const r = await fetch("/api/decharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "La structuration a échoué.");
      setRes(data);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setAnalyse(false);
    }
  }

  function majProjet(i: number, champ: keyof ProjetPropose, valeur: string) {
    if (!res) return;
    const projets = [...res.projets];
    projets[i] = { ...projets[i], [champ]: valeur };
    setRes({ ...res, projets });
  }

  // ─────────────────────── Écran de saisie ───────────────────────
  if (!res) {
    return (
      <main className="flex min-h-[70dvh] flex-col gap-4 px-5 py-6">
        <div className="enter">
          <h1 className="voice-amana text-2xl">Dépose ce que tu as en tête</h1>
          <p className="mt-1 text-sm text-ink-soft">
            En vrac, sans ordre. AMANA rangera — tu garderas le dernier mot.
          </p>
        </div>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          disabled={analyse}
          placeholder="Tout ce qui occupe ton esprit a sa place ici. Les projets, les choses à ne pas oublier, les décisions en suspens…"
          className="voice-amana enter min-h-[38vh] flex-1 resize-none rounded-[22px] border border-ink/10 bg-surface p-5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-ink-faint focus:border-gold disabled:opacity-60"
          style={{ "--i": 1 } as React.CSSProperties}
        />

        {erreur && <p className="step-enter text-sm text-[#B8543F]">{erreur}</p>}

        {/* Vider sa tête au clavier demande un effort que beaucoup ne
            fournissent pas. À l'oral, le vrac sort tel qu'il vient. */}
        <div className="flex items-center gap-3">
          <Dictee
            onTexte={(t) => setTexte((avant) => (avant.trim() ? `${avant.trim()}\n${t}` : t))}
          />
          <button
            onClick={structurer}
            disabled={texte.trim().length < 4 || analyse}
            className="press flex-1 rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
          >
            {analyse ? "AMANA structure…" : "Déposer"}
          </button>
        </div>

        {analyse && (
          <p className="step-enter text-center text-xs text-ink-faint">
            Quelques secondes — le temps de distinguer projets, tâches, décisions et rappels.
          </p>
        )}
      </main>
    );
  }

  // ─────────────────────── Écran de validation ───────────────────────
  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <div className="enter">
        <h1 className="voice-amana text-2xl">Voici ce qu&apos;AMANA propose</h1>
        <p className="mt-1 text-sm text-ink-soft">{res.resume}</p>
      </div>

      {res.projets.length > 0 && (
        <section className="enter flex flex-col gap-2" style={{ "--i": 1 } as React.CSSProperties}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Projets · {res.projets.length}
          </h2>
          <p className="text-xs text-ink-faint">
            Touche un projet pour préciser sa vision, son objectif et sa prochaine action.
          </p>

          {res.projets.map((p, i) => (
            <div key={i} className="overflow-hidden rounded-[18px] border border-ink/10 bg-surface">
              <button
                onClick={() => setOuvert(ouvert === i ? null : i)}
                className="press flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-deep">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{p.nom}</span>
                  <span className="text-xs text-ink-faint">{p.domaine}</span>
                </span>
                <span className="text-ink-faint">{ouvert === i ? "▾" : "▸"}</span>
              </button>

              {ouvert === i && (
                <div className="step-enter flex flex-col gap-3 border-t border-ink/10 px-4 py-4">
                  <Champ label="Nom" value={p.nom} onChange={(v) => majProjet(i, "nom", v)} />
                  <Champ
                    label="Vision — à quoi ça ressemble une fois réussi"
                    value={p.vision ?? ""}
                    onChange={(v) => majProjet(i, "vision", v)}
                    multi
                  />
                  <Champ
                    label="Objectif concret"
                    value={p.objectif ?? ""}
                    onChange={(v) => majProjet(i, "objectif", v)}
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Domaine de vie
                    </span>
                    <select
                      value={p.domaine ?? ""}
                      onChange={(e) => majProjet(i, "domaine", e.target.value)}
                      className="rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold"
                    >
                      {DOMAINES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Champ
                    label="Prochaine action (30 min max)"
                    value={p.prochaineAction ?? ""}
                    onChange={(v) => majProjet(i, "prochaineAction", v)}
                  />
                  {p.extrait && (
                    <p className="rounded-[12px] bg-surface-2 px-3 py-2 text-xs italic text-ink-faint">
                      « {p.extrait} »
                    </p>
                  )}
                  <button
                    onClick={() => setRes({ ...res, projets: res.projets.filter((_, j) => j !== i) })}
                    className="self-start text-xs text-ink-faint underline-offset-4 hover:underline"
                  >
                    Retirer ce projet
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {res.taches.length > 0 && (
        <section className="enter flex flex-col gap-2" style={{ "--i": 2 } as React.CSSProperties}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Actions · {res.taches.length}
          </h2>
          {res.taches.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-surface px-4 py-3"
            >
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                {LIBELLE_KIND[t.kind] ?? "Tâche"}
              </span>
              <span className="flex-1 text-sm">
                {t.titre}
                {t.projet && <span className="block text-xs text-ink-faint">→ {t.projet}</span>}
              </span>
              <button
                onClick={() => setRes({ ...res, taches: res.taches.filter((_, j) => j !== i) })}
                aria-label="Retirer"
                className="press text-ink-faint"
              >
                ✕
              </button>
            </div>
          ))}
        </section>
      )}

      {res.projets.length === 0 && res.taches.length === 0 && (
        <p className="rounded-[16px] bg-surface-2 px-4 py-4 text-sm text-ink-soft">
          Rien n&apos;a pu être structuré à partir de ce texte. Reformule, ou reviens en arrière pour
          le compléter.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={() =>
            startSaving(async () => {
              await commitDecharge(
                res.projets.map(({ extrait: _e, ...p }) => p),
                res.taches.map(({ extrait: _e, ...t }) => t),
              );
              router.push("/aujourdhui");
            })
          }
          disabled={saving}
          className="press rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Tout valider"}
        </button>
        <button onClick={() => setRes(null)} className="press text-sm text-ink-faint">
          Revenir au texte
        </button>
      </div>
    </main>
  );
}

function Champ({
  label,
  value,
  onChange,
  multi,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const cls =
    "rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </span>
      {multi ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}
