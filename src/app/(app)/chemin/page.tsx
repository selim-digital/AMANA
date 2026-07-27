"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCheminData, type CheminData } from "@/lib/actions";
import { DesertScene, ForestScene, OceanScene, fir } from "@/components/Scenes";

/** SCR-CHEMIN — la navigation en 3 dimensions du blueprint (§8) :
 *  · Horizontale : swipe entre les univers (La Source / Build / Align)
 *  · Verticale   : le chemin remonté étape par étape, départ en bas
 *  · Profondeur  : clic sur une étape → zoom (détail, prochaine action)
 *  Sprint 1 : données de démonstration. */

type Etat = "fait" | "actuel" | "avenir";
type Etape = {
  titre: string;
  etat: Etat;
  type?: "depart" | "destination";
  detail?: { label: string; vision?: string; objectif?: string; action?: string; date?: string };
};

type Univers = {
  nom: string;
  monde: string;
  sky: string;
  bandes: [string, string];
  pathColor: string;
  decor: "desert" | "forest" | "ocean";
  etapes: Etape[]; // du départ (bas) à la destination (haut)
};

const UNIVERS: Univers[] = [
  {
    nom: "La Source",
    monde: "01 · Conscience · Vision · Intention",
    sky: "linear-gradient(#F7E9CF,#EFD3A0)",
    bandes: ["#C89A58", "#A97940"],
    pathColor: "#F7EFDC",
    decor: "desert",
    etapes: [
      { titre: "Ton histoire", etat: "fait", type: "depart", detail: { label: "Fondation", vision: "Ta synthèse d'accueil : qui tu es, ce que tu portes." } },
      { titre: "Ta vision", etat: "fait", detail: { label: "Fondation", vision: "Une famille épanouie, une entreprise utile, et transmettre." } },
      { titre: "Tes valeurs", etat: "actuel", detail: { label: "En cours", objectif: "Choisir tes 3 valeurs cardinales.", action: "En discuter avec AMANA", date: "cette semaine" } },
      { titre: "Ta mission", etat: "avenir", detail: { label: "À venir", objectif: "Formuler ta mission personnelle en une phrase." } },
      { titre: "Clarté", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Une vue d'ensemble apaisée de ce qui t'est confié." } },
    ],
  },
  {
    nom: "Build",
    monde: "02 · Projets · Famille · Entreprise",
    sky: "linear-gradient(#EEF0E0,#DCE5CE)",
    bandes: ["#54714B", "#33512F"],
    pathColor: "#EFD9A0",
    decor: "forest",
    etapes: [
      { titre: "Décharge validée", etat: "fait", type: "depart", detail: { label: "Fait", vision: "5 éléments structurés depuis ta dernière décharge." } },
      { titre: "Développement AMANA", etat: "actuel", detail: { label: "Projet actif · 72 %", vision: "Une app qui aide à prendre soin de ce qui est confié.", objectif: "MVP prêt pour la bêta fermée.", action: "Valider le périmètre MVP", date: "vendredi" } },
      { titre: "W&D Invest", etat: "avenir", detail: { label: "En attente", objectif: "Structurer la société — reprise après le MVP." } },
      { titre: "Boîte à idées", etat: "avenir", detail: { label: "Futurs", vision: "Programme ambassadeurs, et ce qui mûrit encore." } },
      { titre: "Objectifs de l'année", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Tes 3 projets menés au bout, avec constance." } },
    ],
  },
  {
    nom: "Align",
    monde: "03 · Impact · Transmission · Élévation",
    sky: "linear-gradient(#E4EEF0,#F2E7CC)",
    bandes: ["#7FA6AE", "#6B5940"],
    pathColor: "#F2DCA4",
    decor: "ocean",
    etapes: [
      { titre: "Bilan du soir", etat: "actuel", type: "depart", detail: { label: "Chaque jour", vision: "Accompli · appris · à ajuster · lâcher-prise.", action: "Clore la journée", date: "ce soir" } },
      { titre: "Bilan de la semaine", etat: "avenir", detail: { label: "Dimanche", objectif: "Accomplissements, apprentissages, blocages, priorités." } },
      { titre: "Bilan du mois", etat: "avenir", detail: { label: "Fin de mois", objectif: "Recul stratégique sur les 3 domaines." } },
      { titre: "Contribution", etat: "avenir", detail: { label: "À venir", vision: "Ce que tu transmets autour de toi." } },
      { titre: "Transmission", etat: "avenir", type: "destination", detail: { label: "Destination", vision: "Le phare : éclairer le chemin des autres." } },
    ],
  },
];

const STEP_H = 170;
const PAD_TOP = 150;
const PAD_BOTTOM = 90;

function VerticalPath({ u, onZoom }: { u: Univers; onZoom: (e: Etape) => void }) {
  const n = u.etapes.length;
  const H = PAD_TOP + PAD_BOTTOM + (n - 1) * STEP_H;
  // Départ en bas, zigzag gauche/droite en remontant.
  const pts: [number, number][] = u.etapes.map((_, i) => [
    i % 2 === 0 ? 120 : 270,
    H - PAD_BOTTOM - i * STEP_H,
  ]);
  const d =
    `M ${pts[0][0]} ${pts[0][1]} ` +
    pts
      .slice(1)
      .map(([x, y], i) => {
        const [px, py] = pts[i];
        return `C ${px} ${py - STEP_H / 2}, ${x} ${y + STEP_H / 2}, ${x} ${y}`;
      })
      .join(" ");

  const k = u.decor; // clé des ids de dégradés
  const dest = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 390 ${H}`} className="block w-full" style={{ height: "auto" }}>
      <defs>
        <radialGradient id={`v-${k}-halo`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F0C377" stopOpacity=".85" />
          <stop offset="1" stopColor="#F0C377" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`v-${k}-b1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={u.bandes[0]} stopOpacity=".55" />
          <stop offset="1" stopColor={u.bandes[0]} stopOpacity=".28" />
        </linearGradient>
        <linearGradient id={`v-${k}-b2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={u.bandes[1]} stopOpacity=".5" />
          <stop offset="1" stopColor={u.bandes[1]} stopOpacity=".3" />
        </linearGradient>
        <filter id={`v-${k}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
        </filter>
        <filter id={`v-${k}-blur`}><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* soleil et halo */}
      <circle cx="322" cy="70" r="95" fill={`url(#v-${k}-halo)`} className="anim-halo" />
      <circle cx="322" cy="70" r="30" fill="#E9B25E" opacity=".95" />

      {/* relief : deux vagues de terrain en dégradé, avec lumière de crête */}
      <path d={`M0 ${H * 0.34} C 90 ${H * 0.32}, 200 ${H * 0.37}, 290 ${H * 0.345} C 330 ${H * 0.335}, 365 ${H * 0.345}, 390 ${H * 0.34} V${H} H0 Z`} fill={`url(#v-${k}-b1)`} />
      <path d={`M0 ${H * 0.34} C 90 ${H * 0.32}, 200 ${H * 0.37}, 290 ${H * 0.345} C 330 ${H * 0.335}, 365 ${H * 0.345}, 390 ${H * 0.34}`} fill="none" stroke={u.pathColor} strokeWidth="2.5" opacity=".5" />
      <path d={`M0 ${H * 0.68} C 100 ${H * 0.66}, 220 ${H * 0.71}, 320 ${H * 0.685} C 350 ${H * 0.678}, 375 ${H * 0.685}, 390 ${H * 0.68} V${H} H0 Z`} fill={`url(#v-${k}-b2)`} />
      <path d={`M0 ${H * 0.68} C 100 ${H * 0.66}, 220 ${H * 0.71}, 320 ${H * 0.685} C 350 ${H * 0.678}, 375 ${H * 0.685}, 390 ${H * 0.68}`} fill="none" stroke={u.pathColor} strokeWidth="2" opacity=".4" />

      {u.decor === "desert" && (
        <>
          <path d={`M0 ${H * 0.19} C 60 ${H * 0.175}, 120 ${H * 0.185}, 180 ${H * 0.168} C 250 ${H * 0.15}, 320 ${H * 0.175}, 390 ${H * 0.16} V${H * 0.24} H0 Z`} fill="#E5CB9E" opacity=".7" />
          <g stroke="#6E5024" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".55">
            <path d={`M46 ${H - 60} C 43 ${H - 72} 43 ${H - 79} 47 ${H - 89} M53 ${H - 59} C 53 ${H - 71} 55 ${H - 78} 60 ${H - 85}`} />
            <path d={`M340 ${H * 0.52} C 337 ${H * 0.52 - 12} 337 ${H * 0.52 - 18} 341 ${H * 0.52 - 26}`} />
          </g>
          <g stroke="#7A5A2E" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".55" className="anim-birds">
            <path d="M80 150 Q 90 141 100 150 M 112 158 Q 120 151 128 158" />
          </g>
        </>
      )}

      {u.decor === "forest" && (
        <>
          <g fill="#C6D0B2" opacity=".8">
            {[30, 120, 250, 350].map((x, i) => <path key={i} d={fir(x, H * 0.3, 60 + ((i * 23) % 30))} />)}
          </g>
          <rect x="-20" y={H * 0.3 - 26} width="430" height="34" fill="#EFF2E0" opacity=".45" filter={`url(#v-${k}-blur)`} className="anim-mist" />
          <g fill="#93A67E">
            {[20, 365].map((x, i) => <path key={i} d={fir(x, H * 0.52, 100 + i * 26)} />)}
          </g>
          <g fill="#4E6A45">
            {[35, 355].map((x, i) => <path key={i} d={fir(x, H * 0.78, 130 + i * 30)} />)}
            <path d={fir(15, H - 20, 170)} />
            <path d={fir(378, H - 36, 150)} />
          </g>
        </>
      )}

      {u.decor === "ocean" && (
        <>
          <path d={`M20 ${H * 0.34} C 55 ${H * 0.325}, 100 ${H * 0.322}, 135 ${H * 0.34} Z`} fill="#9DB3AC" opacity=".6" />
          <g stroke="#E2EFEA" fill="none" strokeLinecap="round" opacity=".7" className="anim-waves">
            <path d={`M40 ${H * 0.42} Q 75 ${H * 0.415} 110 ${H * 0.42} T 180 ${H * 0.42}`} strokeWidth="3.5" />
            <path d={`M220 ${H * 0.55} Q 260 ${H * 0.545} 300 ${H * 0.55} T 380 ${H * 0.55}`} strokeWidth="3.5" />
            <path d={`M60 ${H * 0.62} Q 100 ${H * 0.615} 140 ${H * 0.62} T 220 ${H * 0.62}`} strokeWidth="3" />
          </g>
          <g stroke="#F2D9A0" strokeLinecap="round" opacity=".75" className="anim-shimmer">
            <path d={`M300 ${H * 0.37} H344`} strokeWidth="4" />
            <path d={`M308 ${H * 0.395} H336`} strokeWidth="3" />
          </g>
          <g stroke="#2E2A24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".6" className="anim-birds">
            <path d="M70 140 Q 79 132 88 140 M 100 148 Q 107 142 114 148" />
          </g>
        </>
      )}

      {/* halo de la destination (le sommet est une lumière) */}
      <circle cx={dest[0]} cy={dest[1]} r="70" fill={`url(#v-${k}-halo)`} className="anim-beam" />

      {/* le chemin */}
      <path d={d} fill="none" stroke={u.pathColor} strokeWidth="6" strokeDasharray="2 20" strokeLinecap="round" className="anim-path" />

      {/* grain */}
      <rect width="390" height={H} filter={`url(#v-${k}-grain)`} />

      {/* les étapes */}
      {u.etapes.map((e, i) => {
        const [x, y] = pts[i];
        const dest = e.type === "destination";
        return (
          <g key={e.titre} onClick={() => onZoom(e)} style={{ cursor: "pointer" }}>
            {dest && <circle cx={x} cy={y} r="36" fill="none" stroke="#E4AE55" strokeWidth="3" opacity=".55" />}
            <circle
              cx={x} cy={y} r={dest ? 26 : 22}
              fill={e.etat === "fait" ? "#161310" : e.etat === "actuel" ? "#DCA94F" : "#FDFBF6"}
              stroke="#161310" strokeWidth="4"
            />
            {e.etat === "fait" ? (
              <path d={`M ${x - 8} ${y} l 6 7 l 11 -13`} fill="none" stroke="#F5F1E8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={e.etat === "actuel" ? "#161310" : "#8E8574"} fontFamily="system-ui">
                {i + 1}
              </text>
            )}
            <text
              x={x + (x < 195 ? 42 : -42)} y={y + 5}
              textAnchor={x < 195 ? "start" : "end"}
              fontSize="15" fontWeight="650" fill="#161310" fontFamily="system-ui"
              stroke="#F5F1E8" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round"
            >
              {e.titre}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Fusionne les données réelles (profil, projets) dans les univers. */
function universVivants(data: CheminData): Univers[] {
  const projets = data.projects;
  const base = structuredClone(UNIVERS);

  // La Source suit le profil réel.
  const src = base[0].etapes;
  src[0].etat = "fait";
  src[1].etat = data.vision ? "fait" : "actuel";
  if (data.vision) src[1].detail = { label: "Fondation", vision: data.vision };
  src[2].etat = data.vision ? "actuel" : "avenir";

  // Build suit les projets réellement validés depuis la décharge.
  if (projets.length) {
    const actifs = projets.filter((p) => p.status === "ACTIVE");
    const futurs = projets.filter((p) => p.status === "IDEA");
    const etapes: Etape[] = [
      {
        titre: "Décharge validée",
        etat: data.taskCount || projets.length ? "fait" : "avenir",
        type: "depart",
        detail: { label: "Fait", vision: `${data.taskCount + projets.length} éléments structurés et validés par toi.` },
      },
      ...actifs.slice(0, 3).map((p, i) => ({
        titre: p.name,
        etat: (i === 0 ? "actuel" : "avenir") as Etat,
        detail: {
          label: `Projet actif${p.progress ? ` · ${p.progress} %` : ""}`,
          vision: p.vision ?? undefined,
          objectif: p.objective ?? undefined,
          action: p.objective ?? "Définir la prochaine action",
          date: "à dater",
        },
      })),
      {
        titre: "Boîte à idées",
        etat: "avenir",
        detail: {
          label: "Futurs",
          vision: futurs.length
            ? futurs.map((p) => p.name).join(" · ")
            : "Ce qui mûrit encore, sans pression.",
        },
      },
      base[1].etapes[base[1].etapes.length - 1],
    ];
    base[1].etapes = etapes;
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
  const [leaving, setLeaving] = useState(0); // -1 gauche · 0 · 1 droite
  const startX = useRef(0);
  const colRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCheminData()
      .then((d) => setMondes(universVivants(d)))
      .catch(() => {});
  }, []);

  // En entrant dans un monde, le départ est en bas du chemin.
  useEffect(() => {
    if (mode === "path")
      requestAnimationFrame(() => {
        const c = colRef.current;
        if (c) c.scrollTop = c.scrollHeight;
      });
  }, [mode, univers]);

  const n = mondes.length;
  const u = mondes[Math.min(univers, n - 1)];
  const SCENES = { desert: DesertScene, forest: ForestScene, ocean: OceanScene } as const;

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
      }, 220);
    } else {
      setDx(0);
    }
  }
  function entrer() {
    if (Math.abs(dx) < 8 && !leaving) setMode("path");
  }

  return (
    <main className="relative flex h-[calc(100dvh-72px)] flex-col overflow-hidden">
      {mode === "deck" ? (
        <>
          <header className="z-10 flex items-center justify-between px-5 py-4">
            <div>
              <h1 className="voice-amana text-xl leading-tight">Tes mondes</h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Trois univers, un même chemin
              </p>
            </div>
            <div className="flex items-center gap-1.5" aria-label={`Monde ${univers + 1} sur ${n}`}>
              {mondes.map((_, i) => (
                <span key={i} className={`h-2 rounded-full transition-all ${i === univers ? "w-5 bg-gold" : "w-2 bg-ink/20"}`} />
              ))}
            </div>
          </header>

          {/* Le paquet de cartes : glisser pour changer de monde, toucher pour entrer */}
          <div className="relative flex-1 px-5 pb-10 pt-2">
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
                    transition: drag ? "none" : "transform .24s ease, opacity .24s ease",
                  }
                : {
                    transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                    transition: "transform .24s ease",
                  };
              return (
                <div
                  key={uv.nom}
                  className="absolute inset-x-5 top-2 bottom-10 touch-none select-none overflow-hidden rounded-[28px] border border-ink/10 bg-surface shadow-xl"
                  style={{ ...style, zIndex: 3 - depth }}
                  {...(top
                    ? {
                        onPointerDown: onDown,
                        onPointerMove: onMove,
                        onPointerUp: onUp,
                        onPointerCancel: onUp,
                        onClick: entrer,
                        role: "button",
                        "aria-label": `Entrer dans ${uv.nom} — glisser pour changer de monde`,
                      }
                    : {})}
                >
                  <Scene className="h-[58%] w-full" />
                  <div className="flex h-[42%] flex-col gap-2 p-5">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{uv.monde}</span>
                    <h2 className="voice-amana text-3xl leading-tight">{uv.nom}</h2>
                    <p className="text-sm text-ink-soft">
                      {faites} / {uv.etapes.length} étapes franchies
                      {actuelle ? ` · en cours : ${actuelle.titre}` : ""}
                    </p>
                    <span className="mt-auto self-start rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]">
                      Parcourir ce monde
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            ← glisser la carte · toucher pour entrer →
          </p>
        </>
      ) : (
        <>
          <header className="z-10 flex items-center gap-3 px-5 py-4">
            <button
              onClick={() => setMode("deck")}
              aria-label="Revenir aux mondes"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-lg"
            >
              ‹
            </button>
            <div>
              <h1 className="voice-amana text-xl leading-tight">{u.nom}</h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">{u.monde}</p>
            </div>
          </header>

          {/* Dimension verticale : le chemin remonté depuis le bas */}
          <div ref={colRef} className="flex-1 overflow-y-auto" style={{ background: u.sky }}>
            <VerticalPath u={u} onZoom={setZoom} />
          </div>

          <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            remonter le chemin · toucher une étape
          </p>
        </>
      )}

      {/* Dimension profondeur : zoom sur une étape */}
      {zoom && (
        <div className="veil-enter absolute inset-0 z-20 flex items-end bg-ink/40 backdrop-blur-[2px]" onClick={() => setZoom(null)}>
          <div className="sheet-enter w-full rounded-t-[28px] bg-surface p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              {zoom.detail?.label ?? "Étape"}
            </span>
            <h2 className="voice-amana mt-1 text-2xl">{zoom.titre}</h2>
            {zoom.detail?.vision && <p className="voice-amana mt-3 text-[15px] text-ink-soft">{zoom.detail.vision}</p>}
            {zoom.detail?.objectif && (
              <p className="mt-3 text-sm"><span className="font-semibold">Objectif : </span>{zoom.detail.objectif}</p>
            )}
            {zoom.detail?.action && (
              <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-gold-soft px-4 py-3.5">
                <span className="h-5 w-5 flex-none rounded-full border-2 border-gold-deep" />
                <span className="flex-1 text-sm font-semibold">{zoom.detail.action}</span>
                <span className="text-xs text-ink-soft">{zoom.detail.date}</span>
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <Link href="/conversation" className="flex-1 rounded-full bg-ink px-5 py-3 text-center text-sm font-bold uppercase tracking-widest text-paper">
                En parler
              </Link>
              <button onClick={() => setZoom(null)} className="flex-1 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
