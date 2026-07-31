"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cloturerPlongee, descendreNiveau, rendreVerdict } from "@/lib/actions";

export type SignalVue = {
  id: string;
  niveau: number;
  hypothese: string;
  fondement: string | null;
  verdict: "EN_ATTENTE" | "VALIDE" | "NUANCE" | "INVALIDE";
  verbatim: string | null;
};

const NIVEAUX = [
  { n: 1, nom: "Les faits", quoi: "ce que tu as écrit" },
  { n: 2, nom: "Les croisements", quoi: "les dates, les absences, les écarts" },
  { n: 3, nom: "Tes artefacts", quoi: "ce que tu écris pour toi-même" },
  { n: 4, nom: "Ta manière", quoi: "la forme de tes réponses" },
];

const VERDICTS = [
  { cle: "VALIDE", label: "Juste", couleur: "border-gold bg-gold-soft" },
  { cle: "NUANCE", label: "En partie", couleur: "border-ink/30 bg-surface-2" },
  { cle: "INVALIDE", label: "Faux", couleur: "border-ink/20 bg-surface" },
] as const;

export function Plongee({
  sessionId,
  niveau,
  signaux,
  close,
}: {
  sessionId: string | null;
  niveau: number;
  signaux: SignalVue[];
  close: boolean;
}) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [mot, setMot] = useState("");
  const [, start] = useTransition();

  const enAttente = signaux.filter((s) => s.verdict === "EN_ATTENTE");
  const tranches = signaux.filter((s) => s.verdict !== "EN_ATTENTE");
  const niveauCourant = NIVEAUX.find((x) => x.n === niveau) ?? NIVEAUX[0];

  async function plonger() {
    setErreur(null);
    setChargement(true);
    try {
      const r = await fetch("/api/deepdive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "La plongée a échoué.");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  function trancher(id: string, v: "VALIDE" | "NUANCE" | "INVALIDE") {
    start(async () => {
      await rendreVerdict(id, v, ouvert === id ? mot : undefined);
      setOuvert(null);
      setMot("");
      router.refresh();
    });
  }

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header className="enter">
        <h1 className="voice-amana text-2xl">La plongée</h1>
        <p className="mt-1 text-sm text-ink-soft">
          AMANA propose des hypothèses sur ce que tu portes sans le voir. Tu es le seul juge :
          chacune attend ton verdict.
        </p>
      </header>

      {/* Les quatre terrains — on change de matière, pas d'intensité. */}
      <section className="enter flex flex-col gap-1.5" style={{ "--i": 1 } as React.CSSProperties}>
        {NIVEAUX.map((x) => (
          <div
            key={x.n}
            className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm ${
              x.n === niveau ? "bg-gold-soft font-semibold" : x.n < niveau ? "bg-surface-2" : "opacity-45"
            }`}
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                x.n < niveau ? "bg-ink text-paper" : x.n === niveau ? "bg-gold text-[#12100D]" : "border border-ink/20"
              }`}
            >
              {x.n}
            </span>
            <span className="flex-1">{x.nom}</span>
            <span className="text-xs text-ink-faint">{x.quoi}</span>
          </div>
        ))}
      </section>

      {erreur && <p className="step-enter text-sm text-[#B8543F]">{erreur}</p>}

      {/* Les hypothèses en attente de verdict */}
      {enAttente.map((s, i) => (
        <section
          key={s.id}
          className="enter rounded-[20px] border border-gold/30 bg-surface p-5"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
            Hypothèse
          </span>
          <p className="voice-amana mt-1.5 text-[16px] leading-snug">{s.hypothese}</p>
          {s.fondement && (
            <p className="mt-2 rounded-[12px] bg-surface-2 px-3 py-2 text-xs text-ink-soft">
              Ce sur quoi je m&apos;appuie : {s.fondement}
            </p>
          )}

          {ouvert === s.id && (
            <textarea
              value={mot}
              onChange={(e) => setMot(e.target.value)}
              rows={2}
              placeholder="Tes mots, si tu veux préciser (facultatif)"
              className="step-enter mt-3 w-full resize-none rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {VERDICTS.map((v) => (
              <button
                key={v.cle}
                onClick={() => trancher(s.id, v.cle)}
                className={`press rounded-full border px-5 py-2.5 text-xs font-semibold ${v.couleur}`}
              >
                {v.label}
              </button>
            ))}
            {ouvert !== s.id && (
              <button
                onClick={() => setOuvert(s.id)}
                className="press rounded-full px-4 py-2.5 text-xs text-ink-faint underline-offset-4 hover:underline"
              >
                Préciser
              </button>
            )}
          </div>
        </section>
      ))}

      {/* Ce qui a été tranché */}
      {tranches.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Tes verdicts · {tranches.length}
          </h2>
          {tranches.map((s) => (
            <div key={s.id} className="rounded-[16px] bg-surface-2 px-4 py-3">
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    s.verdict === "VALIDE"
                      ? "bg-gold text-[#12100D]"
                      : s.verdict === "NUANCE"
                        ? "bg-surface text-ink-soft"
                        : "bg-surface text-ink-faint"
                  }`}
                >
                  {s.verdict === "VALIDE" ? "Juste" : s.verdict === "NUANCE" ? "En partie" : "Faux"}
                </span>
                <p className="flex-1 text-sm text-ink-soft">{s.hypothese}</p>
              </div>
              {s.verbatim && (
                <p className="voice-amana mt-1.5 pl-1 text-sm italic text-ink-faint">
                  « {s.verbatim} »
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* La suite : plonger, descendre, ou s'arrêter */}
      {!close && (
        <section className="flex flex-col gap-2">
          {enAttente.length === 0 && (
            <button
              onClick={plonger}
              disabled={chargement}
              className="press rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
            >
              {chargement
                ? "AMANA cherche…"
                : signaux.length === 0
                  ? "Commencer la plongée"
                  : `Poursuivre — ${niveauCourant.nom}`}
            </button>
          )}

          {enAttente.length === 0 && signaux.length > 0 && niveau < 4 && (
            <button
              onClick={() => start(async () => { await descendreNiveau(sessionId!); router.refresh(); })}
              className="press rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold"
            >
              Descendre d&apos;un niveau
            </button>
          )}

          {signaux.length > 0 && (
            <button
              onClick={() => start(async () => { await cloturerPlongee(sessionId!); router.refresh(); })}
              className="press rounded-full px-6 py-2.5 text-sm text-ink-faint"
            >
              Clore cette plongée
            </button>
          )}
        </section>
      )}

      {/* La frontière — elle n'est pas une limite technique, elle est le cadre. */}
      <section className="rounded-[20px] bg-panel p-5 text-panel-text">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
          Là où AMANA s&apos;arrête
        </span>
        <p className="voice-amana mt-1.5 text-[15px] leading-relaxed opacity-90">
          L&apos;analyse peut éclairer tes comportements. Elle ne peut ni sonder tes intentions, ni
          choisir ta direction de vie, ni trancher une question de religion. Ce qui reste après la
          dernière hypothèse ne relève plus de l&apos;examen — mais de la prière, du conseil, et de
          ce que tu sais déjà au fond.
        </p>
      </section>
    </main>
  );
}
