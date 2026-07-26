"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/AmanaMark";
import { Chemin } from "@/components/Scenes";
import { basculerTache, getOnboarding, getProjets, getTaches, type Projet, type Tache } from "@/lib/store";

/** SCR-DASH — « Aujourd'hui » : fenêtre claire sur ce qui compte, pas un centre de contrôle.
 *  Sprint 1 : données de démonstration ; branchement API au Sprint 2. */

const indices = [
  { label: "Clarté", value: 72, cls: "stroke-ink" },
  { label: "Action", value: 58, cls: "stroke-ink-soft" },
  { label: "Alignement", value: 91, cls: "stroke-gold" },
];

const prioritesDemo: Tache[] = [
  { id: "p1", titre: "Clarifier la stratégie d'acquisition", type: "tache", faite: false },
  { id: "p2", titre: "Relire le brief MVP", type: "tache", faite: false },
  { id: "p3", titre: "Appeler le cabinet comptable", type: "tache", faite: false },
];

const projetDemo: Projet = {
  id: "demo",
  nom: "Développement AMANA",
  statut: "actif",
  action: "valider le périmètre MVP",
  pct: 72,
};

export default function DashboardPage() {
  const [prenom, setPrenom] = useState("");
  const [taches, setTaches] = useState<Tache[]>(prioritesDemo);
  const [projet, setProjet] = useState<Projet>(projetDemo);
  const [nbActifs, setNbActifs] = useState(1);
  const [demo, setDemo] = useState(true);
  const [soir, setSoir] = useState(false);

  useEffect(() => {
    setPrenom(getOnboarding().prenom ?? "");
    const vraies = getTaches().filter((t) => !t.faite);
    if (vraies.length) {
      setTaches(vraies.slice(0, 3));
      setDemo(false);
    }
    const actifs = getProjets().filter((p) => p.statut === "actif");
    if (actifs.length) {
      setProjet(actifs[0]);
      setNbActifs(actifs.length);
      setDemo(false);
    }
    setSoir(new Date().getHours() >= 18);
  }, []);

  const toggle = (id: string) => {
    if (demo) {
      setTaches((ts) => ts.map((t) => (t.id === id ? { ...t, faite: !t.faite } : t)));
    } else {
      const maj = basculerTache(id);
      setTaches(maj.filter((t) => !t.faite || t.id === id).slice(0, 3));
    }
  };

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <Wordmark className="text-sm" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-xs font-bold">
          {(prenom || "A")[0].toUpperCase()}
        </span>
      </header>

      <div>
        <h1 className="voice-amana text-2xl">Bonjour {prenom || "toi"}</h1>
        <p className="text-sm text-ink-faint">Ton chemin du jour.</p>
      </div>

      <section className="rounded-r-[16px] border-l-[3px] border-gold bg-surface-2 px-4 py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Intention du jour
        </span>
        <p className="voice-amana mt-1 text-[15px]">
          « Qu'est-ce qui, aujourd'hui, mérite vraiment ton énergie ? »
        </p>
      </section>

      <section className="flex flex-col gap-2" aria-label="Ce qui compte aujourd'hui">
        {taches.map((p, i) => {
          const essential = i === 0;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-3 rounded-[16px] px-4 py-3.5 text-left text-sm ${
                essential ? "bg-gold-soft font-semibold" : "bg-surface-2"
              } ${p.faite ? "opacity-50" : ""}`}
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                  essential ? "border-gold-deep" : "border-ink-faint"
                } ${p.faite ? "bg-gold border-gold" : ""}`}
              >
                {p.faite && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 stroke-[#12100D]" fill="none" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M2 6.5 4.5 9 10 3" />
                  </svg>
                )}
              </span>
              <span className={p.faite ? "line-through" : ""}>{p.titre}</span>
              {p.type !== "tache" && (
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-faint">
                  {p.type === "rappel" ? "Rappel" : "Décision"}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <a href="/chemin" aria-label="Ouvrir ton chemin" className="block">
        <span className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ton chemin
          </span>
          <span className="text-[11px] text-gold-deep">Explorer →</span>
        </span>
        <Chemin done={2} total={5} />
      </a>

      <section className="rounded-[20px] bg-panel p-5 text-panel-text">
        <span className="text-[11px] uppercase tracking-[0.14em] opacity-60">
          Projet actif · {nbActifs} / 3
        </span>
        <h2 className="mt-1.5 text-lg font-semibold">{projet.nom}</h2>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-gold" style={{ width: `${projet.pct ?? 0}%` }} />
        </div>
        <p className="mt-3 text-[13px] opacity-80">
          Prochaine étape :{" "}
          <b className="font-semibold opacity-100">{projet.action ?? "définir la prochaine action"}</b>
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        {indices.map((k) => (
          <div key={k.label} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-surface-2 px-2 py-3.5">
            <svg viewBox="0 0 58 58" className="h-14 w-14" aria-label={`${k.label} ${k.value} %`}>
              <circle cx="29" cy="29" r="24" fill="none" className="stroke-ink/10" strokeWidth="5" />
              <circle
                cx="29" cy="29" r="24" fill="none"
                className={k.cls}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${(k.value / 100) * 150.8} 150.8`}
                transform="rotate(-90 29 29)"
              />
            </svg>
            <span className="text-sm font-bold tabular-nums">{k.value} %</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-soft">{k.label}</span>
          </div>
        ))}
      </section>

      {soir && (
        <section className="rounded-[20px] border border-ink/10 bg-surface p-5">
          <p className="voice-amana text-[15px]">La journée se termine — deux minutes pour la clore ?</p>
          <p className="mt-1 text-xs text-ink-faint">Accompli, appris, à ajuster, lâcher-prise.</p>
        </section>
      )}
    </main>
  );
}
