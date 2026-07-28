"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DesertScene, ForestScene, OceanScene, PathBanner } from "@/components/Scenes";
import { saveOnboarding } from "@/lib/actions";

/**
 * Onboarding narratif (SCR-ONB-1 → 13) — ≤ 10 min, jamais présenté comme un test.
 * Les réponses sont enregistrées dans le profil (Neon) via `saveOnboarding`.
 */

type Answers = {
  prenom: string;
  situation: string;
  vision: string;
  domaines: string[];
  projets: string;
  charge: string;
  style: string;
  disc: string[];
  motivation: string;
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

const DISC_CARDS = [
  {
    q: "Quand une opportunité apparaît, ta première réaction :",
    options: [
      "Je fonce et je cherche le résultat",
      "Je partage et j'entraîne les autres",
      "Je construis avec patience",
      "Je cherche d'abord à comprendre",
    ],
  },
  {
    q: "Face à un défi important, tu préfères :",
    options: [
      "Décider rapidement",
      "Mobiliser les personnes autour de toi",
      "Avancer progressivement",
      "Analyser toutes les possibilités",
    ],
  },
  {
    q: "Ce qui te pèse le plus :",
    options: [
      "Perdre du temps",
      "Être isolé",
      "Être bousculé",
      "Le flou et l'imprécision",
    ],
  },
];

const empty: Answers = {
  prenom: "",
  situation: "",
  vision: "",
  domaines: [],
  projets: "",
  charge: "",
  style: "",
  disc: [],
  motivation: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(empty);
  const [saving, startSaving] = useTransition();

  const totalSteps = 12; // hors portes finales
  const next = () => setStep((s) => s + 1);

  const synthese = useMemo(() => {
    const domaines = a.domaines.length ? a.domaines.slice(0, 3).join(", ").toLowerCase() : "ce qui compte pour toi";
    return `${a.prenom || "Toi"}, tu portes plusieurs responsabilités — ${domaines}. ` +
      `Ta vision : ${a.vision || "encore à préciser, et c'est très bien ainsi"}. ` +
      `Ce qui te met en mouvement : ${a.motivation || "avancer sur ce qui a du sens"}. ` +
      `AMANA t'accompagnera à ton rythme : déposer ce qui encombre, clarifier, puis avancer une action à la fois.`;
  }, [a]);

  function finish(porte: string) {
    startSaving(async () => {
      await saveOnboarding({ ...a, porte });
      router.push(porte === "projet" ? "/conversation" : "/chemin");
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* La progression est la position sur le chemin — pas de pourcentage. */}
      <PathBanner progress={Math.min(step, totalSteps) / totalSteps} />

      {/* key={step} : chaque étape entre en fondu-glissé, jamais de saut sec. */}
      <div key={step} className="step-enter flex flex-1 flex-col justify-center gap-6 px-6 py-8">
        {step === 0 && (
          <Etape titre="Voici ce qui va se passer.">
            <p className="text-[15px] text-ink-soft">
              Quelques questions courtes pour comprendre ce que tu portes. Trois minutes, pas plus —
              et tu pourras tout ajuster ensuite.
            </p>

            <ol className="flex flex-col gap-3">
              {[
                {
                  t: "Déposer",
                  d: "Tu vides ta tête. Tout ce qui t'occupe a sa place ici.",
                  icon: (
                    <path d="M12 4v10m0 0-4-4m4 4 4-4M5 18h14" />
                  ),
                },
                {
                  t: "Clarifier",
                  d: "AMANA structure : projets, actions, décisions, rappels.",
                  icon: <path d="M4 7h16M4 12h11M4 17h7" />,
                },
                {
                  t: "Avancer",
                  d: "Une seule chose essentielle par jour. Puis la suivante.",
                  icon: (
                    <>
                      <path d="M4 19.5c3.5-1.2 4.5-4.5 7-6.5s4-4.5 6-7" />
                      <circle cx="4" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
                      <circle cx="11" cy="13" r="1.5" fill="currentColor" stroke="none" />
                      <circle cx="17.5" cy="5.5" r="2.2" fill="currentColor" stroke="none" />
                    </>
                  ),
                },
              ].map((s, i) => (
                <li
                  key={s.t}
                  className="enter flex items-start gap-3 rounded-[18px] bg-surface p-4"
                  style={{ "--i": i + 1 } as React.CSSProperties}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-5 w-5 flex-none text-gold-deep"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {s.icon}
                  </svg>
                  <span>
                    <b className="block text-[15px]">{s.t}</b>
                    <span className="text-sm text-ink-soft">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>

            <Continuer onClick={next} label="Commencer" />
          </Etape>
        )}

        {step === 1 && (
          <Etape titre="Amana : le dépôt confié.">
            <p className="voice-amana text-lg text-ink-soft">
              Ton temps, ta santé, tes relations, tes projets — autant de choses qui t&apos;ont été
              confiées. AMANA t&apos;aide à en prendre soin, sans jamais décider à ta place.
            </p>
            <Continuer onClick={next} />
          </Etape>
        )}

        {step === 2 && (
          <Etape titre="Comment veux-tu qu'on t'appelle ?">
            <input
              value={a.prenom}
              onChange={(e) => setA({ ...a, prenom: e.target.value })}
              placeholder="Ton prénom"
              className="rounded-full border border-ink/20 bg-surface px-5 py-3 outline-none focus:border-gold"
            />
            <Continuer onClick={next} disabled={!a.prenom.trim()} />
          </Etape>
        )}

        {step === 3 && (
          <Choix
            titre={`${a.prenom}, où en es-tu aujourd'hui ?`}
            options={[
              "J'entreprends / je porte une entreprise",
              "Je porte de fortes responsabilités",
              "Je me construis (études, transition)",
              "Un peu tout ça à la fois",
            ]}
            value={a.situation}
            onSelect={(v) => setA({ ...a, situation: v })}
            onNext={next}
          />
        )}

        {step === 4 && (
          <Etape titre="Dans quelques années, à quoi ressemble une vie réussie pour toi ?">
            <textarea
              value={a.vision}
              onChange={(e) => setA({ ...a, vision: e.target.value })}
              rows={4}
              placeholder="Quelques mots suffisent…"
              className="rounded-[22px] border border-ink/20 bg-surface px-5 py-4 outline-none focus:border-gold"
            />
            <Continuer onClick={next} />
            <PlusTard onClick={next} />
          </Etape>
        )}

        {step === 5 && (
          <Etape titre="Quels domaines comptent le plus en ce moment ?">
            <div className="flex flex-wrap gap-2">
              {DOMAINES.map((d) => {
                const on = a.domaines.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      setA({
                        ...a,
                        domaines: on ? a.domaines.filter((x) => x !== d) : [...a.domaines, d],
                      })
                    }
                    className={`rounded-full border px-4 py-2 text-sm ${
                      on
                        ? "border-gold bg-gold-soft font-semibold"
                        : "border-ink/15 bg-surface text-ink-soft"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <Continuer onClick={next} disabled={a.domaines.length === 0} />
          </Etape>
        )}

        {step === 6 && (
          <Etape titre="Quels projets occupent ton esprit en ce moment ?">
            <textarea
              value={a.projets}
              onChange={(e) => setA({ ...a, projets: e.target.value })}
              rows={4}
              placeholder="En vrac, sans structure — c'est justement le but."
              className="rounded-[22px] border border-ink/20 bg-surface px-5 py-4 outline-none focus:border-gold"
            />
            <Continuer onClick={next} />
            <PlusTard onClick={next} />
          </Etape>
        )}

        {step === 7 && (
          <Choix
            titre="Et ta tête, en ce moment ?"
            options={[
              "Claire — je sais où je vais",
              "Chargée mais je gère",
              "Trop pleine — j'oublie des choses",
              "Saturée — j'ai besoin de déposer",
            ]}
            value={a.charge}
            onSelect={(v) => setA({ ...a, charge: v })}
            onNext={next}
          />
        )}

        {step === 8 && (
          <Choix
            titre="Comment aimes-tu être accompagné ?"
            options={[
              "Direct — va droit au but",
              "Motivant — donne-moi de l'élan",
              "Doux — étape par étape",
              "Structuré — explique-moi le pourquoi",
            ]}
            value={a.style}
            onSelect={(v) => setA({ ...a, style: v })}
            onNext={next}
          />
        )}

        {step >= 9 && step <= 11 && (
          <Choix
            titre={DISC_CARDS[step - 9].q}
            options={DISC_CARDS[step - 9].options}
            value={a.disc[step - 9] ?? ""}
            onSelect={(v) => {
              const disc = [...a.disc];
              disc[step - 9] = v;
              setA({ ...a, disc });
            }}
            onNext={next}
          />
        )}

        {step === 12 && (
          <Etape titre="Ton chemin se dessine.">
            <p className="voice-amana rounded-[22px] bg-surface p-5 text-lg leading-relaxed text-ink">
              {synthese}
            </p>
            <p className="text-xs text-ink-faint">
              Cette synthèse t'appartient — tu pourras l'ajuster à tout moment depuis ton profil.
            </p>
            <Continuer onClick={next} label="C'est bien moi" />
          </Etape>
        )}

        {step === 13 && (
          <Etape titre="Par où veux-tu commencer ?">
            <div className="flex flex-col gap-3">
              <Porte
                label="Commencer par un projet"
                detail="Clarifier un projet qui compte, maintenant"
                scene={<ForestScene className="h-full w-full object-cover" />}
                gold
                onClick={() => finish("projet")}
              />
              <Porte
                label="Architecturer ma vie"
                detail="Poser une vue d'ensemble, en douceur"
                scene={<DesertScene className="h-full w-full object-cover" />}
                onClick={() => finish("vie")}
              />
              <Porte
                label="Architecturer un domaine"
                detail="Un seul domaine, en profondeur"
                scene={<OceanScene className="h-full w-full object-cover" />}
                onClick={() => finish("domaine")}
              />
            </div>
          </Etape>
        )}
      </div>
    </main>
  );
}

function Etape({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="voice-amana text-balance text-2xl leading-snug">{titre}</h1>
      {children}
    </div>
  );
}

function Choix({
  titre,
  options,
  value,
  onSelect,
  onNext,
}: {
  titre: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <Etape titre={titre}>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            onClick={() => onSelect(o)}
            style={{ "--i": i } as React.CSSProperties}
            className={`press enter rounded-[18px] border px-5 py-3.5 text-left text-sm ${
              value === o
                ? "border-gold bg-gold-soft font-semibold text-ink"
                : "border-ink/15 bg-surface text-ink-soft"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <Continuer onClick={onNext} disabled={!value} />
    </Etape>
  );
}

function Continuer({
  onClick,
  disabled,
  label = "Continuer",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="press rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function PlusTard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-ink-faint underline-offset-4 hover:underline">
      Répondre plus tard
    </button>
  );
}

function Porte({
  label,
  detail,
  scene,
  gold,
  onClick,
}: {
  label: string;
  detail: string;
  scene: React.ReactNode;
  gold?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`press lift overflow-hidden rounded-[22px] text-left ${
        gold ? "bg-gold text-[#12100D]" : "border border-ink/15 bg-surface"
      }`}
    >
      <div className="h-24 w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full">{scene}</div>
      <div className="p-4">
        <span className="block font-bold">{label}</span>
        <span className={`text-sm ${gold ? "opacity-80" : "text-ink-soft"}`}>{detail}</span>
      </div>
    </button>
  );
}
