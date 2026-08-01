"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCheminData, type CheminData } from "@/lib/actions";
import { DesertScene, ForestScene, OceanScene } from "@/components/Scenes";

/** SCR-CHEMIN — navigation en 3 dimensions :
 *  · Horizontale : paquet de cartes, on glisse pour changer de monde
 *  · Verticale   : le chemin du monde, étape par étape, du départ à la destination
 *  · Profondeur  : on touche une étape → sa fiche monte */

type Etat = "fait" | "actuel" | "avenir";
type Etape = {
  titre: string;
  etat: Etat;
  type?: "depart" | "destination";
  /** La porte vers la conversation : un projet précis, ou l'étape elle-même. */
  projetId?: string;
  detail?: { label: string; vision?: string; objectif?: string; action?: string; date?: string };
};

type Univers = {
  nom: string;
  monde: string;
  sujet: string;
  ciel: string;
  decor: "desert" | "forest" | "ocean";
  etapes: Etape[];
};

const UNIVERS: Univers[] = [
  {
    nom: "La Source",
    monde: "01 · Conscience · Vision · Intention",
    sujet: "Ce qui fonde tes choix",
    ciel: "linear-gradient(#FBF1DE,#F0D9AE)",
    decor: "desert",
    etapes: [
      { titre: "Ton histoire", etat: "fait", type: "depart", detail: { label: "Fondation", vision: "Ta synthèse d'accueil : qui tu es, ce que tu portes." } },
      { titre: "Ta vision", etat: "fait", detail: { label: "Fondation", vision: "Là où tu veux aller." } },
      { titre: "Tes valeurs", etat: "actuel", detail: { label: "En cours", objectif: "Choisir tes 3 valeurs cardinales.", action: "En parler", date: "cette semaine" } },
      { titre: "Ta mission", etat: "avenir", detail: { label: "À venir", objectif: "Formuler ta mission personnelle en une phrase." } },
      { titre: "Clarté", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Une vue d'ensemble apaisée de ce qui t'est confié." } },
    ],
  },
  {
    nom: "Build",
    monde: "02 · Projets · Famille · Entreprise",
    sujet: "Ce que tu construis",
    ciel: "linear-gradient(#F4F5E6,#DCE5CB)",
    decor: "forest",
    etapes: [
      { titre: "Décharge validée", etat: "avenir", type: "depart", detail: { label: "Départ", vision: "Vide ta tête : AMANA en fera des projets clairs." } },
      { titre: "Tes projets actifs", etat: "avenir", detail: { label: "À venir", vision: "Ils apparaîtront ici." } },
      { titre: "Objectifs de l'année", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Tes projets menés au bout, avec constance." } },
    ],
  },
  {
    nom: "Align",
    monde: "03 · Impact · Transmission · Élévation",
    sujet: "Ce que tu transmets",
    ciel: "linear-gradient(#E2EEF1,#F4DFB2)",
    decor: "ocean",
    etapes: [
      { titre: "Bilan du soir", etat: "actuel", type: "depart", detail: { label: "Chaque jour", vision: "Accompli · appris · à ajuster · lâcher-prise.", action: "Clore la journée", date: "ce soir" } },
      { titre: "Bilan de la semaine", etat: "avenir", detail: { label: "Dimanche", objectif: "Accomplissements, apprentissages, blocages, priorités." } },
      { titre: "Bilan du mois", etat: "avenir", detail: { label: "Fin de mois", objectif: "Recul stratégique sur tes domaines." } },
      { titre: "Transmission", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Le phare : éclairer le chemin des autres." } },
    ],
  },
];

const SCENES = { desert: DesertScene, forest: ForestScene, ocean: OceanScene } as const;

/** Injecte les données réelles dans les mondes. */
function universVivants(data: CheminData): Univers[] {
  const base = structuredClone(UNIVERS);

  // La Source suit le profil : vision, puis valeurs réellement enregistrées.
  const src = base[0].etapes;
  src[1].etat = data.vision ? "fait" : "actuel";
  if (data.vision) src[1].detail = { label: "Fondation", vision: data.vision };

  const nb = data.values.length;
  if (nb) {
    // Ce qu'elle a confié doit se voir ici, sinon l'enregistrement ne veut rien dire.
    src[2].etat = nb >= 3 ? "fait" : "actuel";
    src[2].detail = {
      label: nb >= 3 ? "Fondation" : "En cours",
      vision: data.values.join(" · "),
      objectif:
        nb >= 3 ? undefined : `${nb} valeur${nb > 1 ? "s" : ""} posée${nb > 1 ? "s" : ""} sur 3.`,
      action: nb >= 3 ? undefined : "En parler",
    };
    src[3].etat = nb >= 3 ? "actuel" : "avenir";
  } else {
    src[2].etat = data.vision ? "actuel" : "avenir";
  }

  // Build suit les projets réels, ordonnés : actifs, puis secondaires, puis idées.
  const rang = { ACTIVE: 0, SECONDARY: 1, WAITING: 2, IDEA: 3, ARCHIVED: 4 } as const;
  const libelle = {
    ACTIVE: "Projet actif",
    SECONDARY: "Projet secondaire",
    WAITING: "En attente",
    IDEA: "Boîte à idées",
    ARCHIVED: "Abandonné",
  } as const;

  const projets = [...data.projects].sort(
    (a, b) =>
      (rang[a.status as keyof typeof rang] ?? 9) - (rang[b.status as keyof typeof rang] ?? 9),
  );

  if (projets.length) {
    const etapes: Etape[] = [
      {
        titre: "Décharge validée",
        etat: "fait",
        type: "depart",
        detail: {
          label: "Fait",
          vision: `${data.taskCount + projets.length} éléments structurés et validés par toi.`,
        },
      },
      ...projets.map((p, i) => ({
        titre: p.name,
        projetId: p.id,
        etat: (p.status === "ACTIVE" && i === 0 ? "actuel" : "avenir") as Etat,
        detail: {
          label: `${libelle[p.status as keyof typeof libelle] ?? "Projet"}${p.progress ? ` · ${p.progress} %` : ""}`,
          vision: p.vision ?? undefined,
          objectif: p.objective ?? undefined,
          action: p.objective ?? "Définir la prochaine action",
          date: "à dater",
        },
      })),
      base[1].etapes[base[1].etapes.length - 1],
    ];
    base[1].etapes = etapes;
  }

  // La destination de Build, ce sont ses objectifs de l'année — pas une phrase générique.
  if (data.objectifsAnnee.length) {
    const fin = base[1].etapes[base[1].etapes.length - 1];
    fin.detail = { label: "Destination", vision: data.objectifsAnnee.join(" · ") };
  }
  return base;
}

export default function CheminPage() {
  const [mondes, setMondes] = useState<Univers[]>(UNIVERS);
  const [univers, setUnivers] = useState(0);
  const [mode, setMode] = useState<"deck" | "path">("deck");
  const [zoom, setZoom] = useState<Etape | null>(null);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [leaving, setLeaving] = useState(0);
  const startX = useRef(0);

  useEffect(() => {
    getCheminData()
      .then((d) => setMondes(universVivants(d)))
      .catch(() => {});
  }, []);

  const n = mondes.length;
  const u = mondes[Math.min(univers, n - 1)];

  function onDown(e: React.PointerEvent) {
    setDrag(true);
    startX.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (drag) setDx(e.clientX - startX.current);
  }
  function onUp() {
    if (!drag) return;
    setDrag(false);
    if (Math.abs(dx) > 90) {
      const dir = dx < 0 ? 1 : -1;
      setLeaving(dir);
      setTimeout(() => {
        setUnivers((i) => (i + dir + n) % n);
        setLeaving(0);
        setDx(0);
      }, 260);
    } else setDx(0);
  }

  // ─────────────────────── Le paquet de mondes ───────────────────────
  if (mode === "deck") {
    return (
      <main className="relative flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden lg:min-h-[calc(100dvh-4rem)]">
        <header className="z-10 flex items-center justify-between px-5 py-4">
          <div>
            <h1 className="voice-amana text-xl leading-tight">Tes mondes</h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Trois univers, un même chemin
            </p>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`Monde ${univers + 1} sur ${n}`}>
            {mondes.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === univers ? "w-5 bg-gold" : "w-2 bg-ink/20"}`}
              />
            ))}
          </div>
        </header>

        <div className="relative flex-1 px-5 pb-12">
          {[2, 1, 0].map((depth) => {
            const idx = (univers + depth) % n;
            const uv = mondes[idx];
            const Scene = SCENES[uv.decor];
            const top = depth === 0;
            const faites = uv.etapes.filter((e) => e.etat === "fait").length;
            const actuelle = uv.etapes.find((e) => e.etat === "actuel");
            const style: React.CSSProperties = top
              ? {
                  transform: leaving
                    ? `translateX(${leaving * 560}px) rotate(${leaving * 20}deg)`
                    : `translateX(${dx}px) rotate(${dx * 0.055}deg)`,
                  opacity: leaving ? 0 : 1,
                  transition: drag
                    ? "none"
                    : "transform .26s var(--ease-out), opacity .26s var(--ease-out)",
                  willChange: "transform",
                }
              : {
                  transform: `translate3d(0, ${depth * 14}px, 0) scale(${1 - depth * 0.05})`,
                  transition: "transform .26s var(--ease-out)",
                  willChange: "transform",
                };
            return (
              <div
                key={depth}
                className="absolute inset-x-5 top-0 bottom-12 mx-auto max-w-md touch-none select-none overflow-hidden rounded-[28px] border border-ink/10 bg-surface shadow-xl"
                style={{ ...style, zIndex: 3 - depth }}
                {...(top
                  ? {
                      onPointerDown: onDown,
                      onPointerMove: onMove,
                      onPointerUp: onUp,
                      onPointerCancel: onUp,
                      onClick: () => Math.abs(dx) < 8 && !leaving && setMode("path"),
                      role: "button",
                      "aria-label": `Ouvrir ${uv.nom}`,
                    }
                  : {})}
              >
                <Scene className="h-[54%] w-full" />
                <div className="flex h-[46%] flex-col gap-1.5 p-5">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{uv.monde}</span>
                  <h2 className="voice-amana text-2xl leading-tight">{uv.nom}</h2>
                  <p className="text-sm text-ink-soft">{uv.sujet}</p>
                  <p className="text-xs text-ink-faint">
                    {faites} / {uv.etapes.length} étapes franchies
                    {actuelle ? ` · en cours : ${actuelle.titre}` : ""}
                  </p>
                  <span className="press mt-auto self-start rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D]">
                    Parcourir ce monde
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          ← glisser · toucher pour entrer →
        </p>
      </main>
    );
  }

  // ─────────────────────── Le chemin d'un monde ───────────────────────
  const total = u.etapes.length;
  const franchies = u.etapes.filter((e) => e.etat === "fait").length;

  return (
    <main className="relative pb-6">
      <div className="relative">
        <div className="h-28 w-full overflow-hidden sm:h-36" style={{ background: u.ciel }}>
          {(() => {
            const Scene = SCENES[u.decor];
            return <Scene className="h-full w-full" />;
          })()}
        </div>

        <header className="absolute inset-x-0 top-0 flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => setMode("deck")}
            aria-label="Revenir aux mondes"
            className="press flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 bg-surface/85 text-lg backdrop-blur"
          >
            ‹
          </button>
          <div>
            <h1 className="voice-amana text-xl leading-tight">{u.nom}</h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">{u.monde}</p>
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-md px-5">
        <p className="enter py-4 text-xs uppercase tracking-[0.14em] text-ink-faint">
          {franchies} / {total} étapes franchies
        </p>

        <ol className="flex flex-col">
          {u.etapes.map((e, i) => {
            const dernier = i === total - 1;
            const dest = e.type === "destination";
            return (
              <li
                key={`${e.titre}-${i}`}
                className="enter relative flex gap-4"
                style={{ "--i": i } as React.CSSProperties}
              >
                {/* Le rail : pastille + trait pointillé vers l'étape suivante */}
                <div className="flex flex-none flex-col items-center">
                  <span
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ${
                      e.etat === "fait"
                        ? "bg-ink text-paper"
                        : e.etat === "actuel"
                          ? "bg-gold text-[#12100D] ring-4 ring-gold/25"
                          : dest
                            ? "border-2 border-gold bg-surface text-gold-deep"
                            : "border-2 border-ink/20 bg-surface text-ink-faint"
                    }`}
                  >
                    {e.etat === "fait" ? (
                      <svg viewBox="0 0 12 12" className="h-4 w-4 stroke-paper" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6.5 4.5 9 10 3" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {!dernier && <span className="my-1 w-px flex-1 border-l-2 border-dashed border-gold/45" />}
                </div>

                {/* La fiche de l'étape */}
                <button
                  onClick={() => setZoom(e)}
                  className={`press lift mb-3 flex-1 rounded-[18px] border p-4 text-left ${
                    e.etat === "actuel"
                      ? "border-gold/40 bg-gold-soft"
                      : dest
                        ? "border-gold/30 bg-surface"
                        : "border-ink/10 bg-surface"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {e.type === "depart" ? "Départ" : dest ? "Destination" : (e.detail?.label ?? "Étape")}
                  </span>
                  <p className={`mt-0.5 text-[15px] ${e.etat === "avenir" ? "text-ink-soft" : "font-semibold"}`}>
                    {e.titre}
                  </p>
                  {e.etat === "actuel" && e.detail?.action && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                      <span className="h-4 w-4 flex-none rounded-full border-2 border-gold-deep" />
                      {e.detail.action}
                      {e.detail.date && <span className="ml-auto text-ink-faint">{e.detail.date}</span>}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Profondeur : la fiche détaillée */}
      {zoom && (
        <div className="veil-enter fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-[2px]" onClick={() => setZoom(null)}>
          <div
            className="sheet-enter mx-auto w-full max-w-md rounded-t-[28px] bg-surface p-6 pb-8 lg:mb-6 lg:rounded-[28px]"
            onClick={(ev) => ev.stopPropagation()}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {zoom.detail?.label ?? "Étape"}
            </span>
            <h2 className="voice-amana mt-1 text-2xl">{zoom.titre}</h2>
            {zoom.detail?.vision && <p className="voice-amana mt-3 text-[15px] text-ink-soft">{zoom.detail.vision}</p>}
            {zoom.detail?.objectif && (
              <p className="mt-3 text-sm">
                <span className="font-semibold">Objectif : </span>
                {zoom.detail.objectif}
              </p>
            )}
            {zoom.detail?.action && (
              <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-gold-soft px-4 py-3.5">
                <span className="h-5 w-5 flex-none rounded-full border-2 border-gold-deep" />
                <span className="flex-1 text-sm font-semibold">{zoom.detail.action}</span>
                <span className="text-xs text-ink-soft">{zoom.detail.date}</span>
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <Link
                href={
                  // La conversation s'ouvre SUR le sujet : sans cela, l'IA
                  // redemande ce que l'écran affichait déjà.
                  zoom.projetId
                    ? `/conversation?projet=${zoom.projetId}`
                    : `/conversation?etape=${encodeURIComponent(zoom.titre)}`
                }
                className="press flex-1 rounded-full bg-ink px-5 py-3 text-center text-sm font-bold uppercase tracking-widest text-paper"
              >
                En parler
              </Link>
              <Link
                href="/deepdive"
                className="press flex-1 rounded-full border border-gold/40 bg-gold-soft px-5 py-3 text-center text-sm font-semibold"
              >
                Plonger
              </Link>
              <button onClick={() => setZoom(null)} className="press flex-1 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
