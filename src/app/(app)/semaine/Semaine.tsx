"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirOkr, pointerResultat, decalerProjet } from "@/lib/actions";

export type ProjetSemaine = {
  id: string;
  nom: string;
  statut: string;
  dormanceJours: number;
  cap: {
    objectif: string;
    resultats: { id: string; label: string; cible: string | null; valeur: number }[];
  } | null;
};

type CapPropose = {
  projetId: string;
  projet: string;
  objectif: string;
  resultats: { intitule: string; cible: string }[];
  pourquoi: string;
};

/**
 * SCR-SEMAINE — l'horizon intermédiaire.
 *
 * Le risque de cet écran est le vide : sans cap trimestriel renseigné, il ne
 * montre rien et fait paraître l'app inachevée. On le comble par des caps
 * PROPOSÉS, construits depuis ses projets et ses objectifs d'année — mais
 * toujours affichés comme des propositions. Une donnée inventée qui se ferait
 * passer pour la sienne rendrait tout le reste suspect.
 */
export function Semaine({
  projets,
  objectifsAnnee,
  periode,
}: {
  projets: ProjetSemaine[];
  objectifsAnnee: string[];
  periode: string;
}) {
  const router = useRouter();
  const [proposes, setProposes] = useState<CapPropose[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, start] = useTransition();

  const avecCap = projets.filter((p) => p.cap);
  const sansCap = projets.filter((p) => !p.cap);

  // Dès qu'un projet actif n'a pas de cap, AMANA en propose un : l'écran ne
  // doit jamais accueillir avec une zone morte.
  useEffect(() => {
    if (!sansCap.length || proposes.length || chargement) return;
    setChargement(true);
    fetch("/api/okr/suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetIds: sansCap.map((p) => p.id) }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErreur(d.error);
        else setProposes(d.caps ?? []);
      })
      .catch(() => setErreur("Les propositions n'ont pas pu être chargées."))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sansCap.length]);

  function adopter(c: CapPropose) {
    start(async () => {
      await definirOkr(
        c.projetId,
        c.objectif,
        c.resultats.map((r) => ({ label: r.intitule, target: r.cible })),
      );
      setProposes((liste) => liste.filter((x) => x.projetId !== c.projetId));
      router.refresh();
    });
  }

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header className="enter">
        <h1 className="voice-amana text-2xl lg:text-3xl">Cette semaine</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Ton cap du trimestre {periode.replace("-", " · ")}, et où tu en es.
        </p>
      </header>

      {objectifsAnnee.length > 0 && (
        <section
          className="enter rounded-[18px] border-l-[3px] border-gold bg-surface-2 px-4 py-3.5"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            Ce que vise ton année
          </span>
          <p className="mt-1 text-sm text-ink-soft">{objectifsAnnee.join(" · ")}</p>
        </section>
      )}

      {/* ─────────── Les caps posés : on pointe où on en est ─────────── */}
      {avecCap.map((p, i) => (
        <section
          key={p.id}
          className="enter rounded-[22px] bg-surface p-5"
          style={{ "--i": 2 + i } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">{p.nom}</h2>
            <a
              href={`/conversation?projet=${p.id}`}
              className="press flex-none text-[11px] font-semibold uppercase tracking-widest text-gold-deep"
            >
              En parler →
            </a>
          </div>
          <p className="voice-amana mt-1.5 text-[15px] leading-snug">{p.cap!.objectif}</p>

          <div className="mt-4 flex flex-col gap-3">
            {p.cap!.resultats.map((r) => (
              <Pointage key={r.id} resultat={r} />
            ))}
          </div>
        </section>
      ))}

      {/* ─────────── Les caps proposés : jamais confondus avec les siens ─────────── */}
      {chargement && sansCap.length > 0 && (
        <section className="enter rounded-[22px] border border-dashed border-ink/20 bg-surface-2/60 px-5 py-8 text-center">
          <p className="text-sm text-ink-soft">
            AMANA relit tes projets pour te proposer un cap…
          </p>
        </section>
      )}

      {proposes.map((c, i) => (
        <section
          key={c.projetId}
          className="enter rounded-[22px] border border-dashed border-gold/50 bg-surface p-5"
          style={{ "--i": i } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">{c.projet}</h2>
            <span className="flex-none rounded-full bg-gold-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-deep">
              Proposition
            </span>
          </div>

          <p className="voice-amana mt-1.5 text-[15px] leading-snug">{c.objectif}</p>

          <ul className="mt-3 flex flex-col gap-2">
            {c.resultats.map((r, n) => (
              <li key={n} className="flex gap-2.5 text-sm text-ink-soft">
                <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                <span className="flex-1">
                  {r.intitule}
                  {r.cible && <b className="ml-1 font-semibold text-ink">— {r.cible}</b>}
                </span>
              </li>
            ))}
          </ul>

          {c.pourquoi && (
            <p className="mt-3 rounded-[12px] bg-surface-2 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              Pourquoi je te propose ça : {c.pourquoi}
            </p>
          )}

          <p className="mt-3 text-xs text-ink-faint">
            Ce cap vient de moi, pas de toi. Adopte-le tel quel, ou dis-moi de vive voix ce que
            tu veux vraiment viser — c&apos;est plus rapide qu&apos;au clavier.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => adopter(c)}
              className="press rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D]"
            >
              Adopter ce cap
            </button>
            <a
              href={`/conversation?projet=${c.projetId}&mode=cap`}
              className="press flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold text-ink-soft"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              Le dire à l&apos;oral
            </a>
            <button
              onClick={() => start(async () => { await decalerProjet(c.projetId); router.refresh(); })}
              className="press rounded-full px-4 py-2.5 text-xs text-ink-faint underline underline-offset-4"
            >
              Pas ce trimestre
            </button>
          </div>
        </section>
      ))}

      {erreur && <p className="text-sm text-[#B8543F]">{erreur}</p>}

      {/* ─────────── Ce qui dort ─────────── */}
      {projets.filter((p) => p.dormanceJours > 14).length > 0 && (
        <section className="enter rounded-[20px] bg-surface-2 px-5 py-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Sans mouvement
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {projets
              .filter((p) => p.dormanceJours > 14)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{p.nom}</span>
                  <span className="flex-none text-xs text-ink-faint">
                    {p.dormanceJours} jours
                  </span>
                  <a
                    href={`/conversation?projet=${p.id}`}
                    className="press flex-none rounded-full border border-ink/15 px-3 py-1 text-[11px] font-semibold text-ink-soft"
                  >
                    En parler
                  </a>
                </div>
              ))}
          </div>
        </section>
      )}

      {projets.length === 0 && (
        <section className="rounded-[20px] border border-dashed border-ink/20 bg-surface-2/60 px-5 py-8 text-center">
          <p className="voice-amana text-[17px]">Pas encore de projet à cadrer.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Dépose ce que tu as en tête : AMANA en fera des projets, puis des caps.
          </p>
          <a
            href="/deposer"
            className="press mt-4 inline-block rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
          >
            Vider ma tête
          </a>
        </section>
      )}
    </main>
  );
}

/** Le pointage hebdomadaire d'un résultat clé — un geste, pas un formulaire. */
function Pointage({
  resultat,
}: {
  resultat: { id: string; label: string; cible: string | null; valeur: number };
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(resultat.valeur);
  const [, start] = useTransition();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 text-sm">
          {resultat.label}
          {resultat.cible && <b className="ml-1 text-xs font-semibold text-ink-faint">({resultat.cible})</b>}
        </span>
        <span className="flex-none text-xs font-bold text-gold-deep">{valeur} %</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={valeur}
        onChange={(e) => setValeur(Number(e.target.value))}
        onPointerUp={() => start(async () => { await pointerResultat(resultat.id, valeur); router.refresh(); })}
        onKeyUp={() => start(async () => { await pointerResultat(resultat.id, valeur); router.refresh(); })}
        aria-label={`Avancement de ${resultat.label}`}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-[#C2A05C]"
      />
    </div>
  );
}
