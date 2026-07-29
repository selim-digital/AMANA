"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject, reorderProjects, updateProject } from "@/lib/actions";

export type Projet = {
  id: string;
  name: string;
  status: string;
  vision: string | null;
  objective: string | null;
  domain: string | null;
  progress: number;
};

const STATUTS: { key: Projet["status"]; label: string; note?: string }[] = [
  { key: "ACTIVE", label: "Actif", note: "3 max" },
  { key: "SECONDARY", label: "Secondaire" },
  { key: "WAITING", label: "En attente" },
  { key: "IDEA", label: "Idée" },
  { key: "ARCHIVED", label: "Abandonné" },
];

const DOMAINES = [
  "Spiritualité & sens",
  "Famille",
  "Santé",
  "Profession / entrepreneuriat",
  "Apprentissage",
  "Contribution",
  "Relations",
];

export function ProjectBoard({ projets: initiaux }: { projets: Projet[] }) {
  const router = useRouter();
  const [projets, setProjets] = useState(initiaux);
  const [edite, setEdite] = useState<string | null>(null);
  const [confirme, setConfirme] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, start] = useTransition();

  // Glisser-déposer (pointeur : marche à la souris comme au doigt).
  const [pris, setPris] = useState<string | null>(null);
  const [surIdx, setSurIdx] = useState<number | null>(null);
  const refs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => setProjets(initiaux), [initiaux]);

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    setPris(id);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pris) return;
    // Sur quelle carte se trouve le doigt ?
    let idx: number | null = null;
    projets.forEach((p, i) => {
      const el = refs.current.get(p.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) idx = i;
    });
    setSurIdx(idx);
  }

  function onPointerUp() {
    if (!pris) return;
    const from = projets.findIndex((p) => p.id === pris);
    if (surIdx !== null && surIdx !== from && from >= 0) {
      const suivant = [...projets];
      const [item] = suivant.splice(from, 1);
      suivant.splice(surIdx, 0, item);
      setProjets(suivant);
      start(async () => {
        await reorderProjects(suivant.map((p) => p.id));
        router.refresh();
      });
    }
    setPris(null);
    setSurIdx(null);
  }

  function enregistrer(id: string, champs: Partial<Projet>) {
    setErreur(null);
    setProjets((ps) => ps.map((p) => (p.id === id ? { ...p, ...champs } : p)));
    start(async () => {
      const r = await updateProject({
        id,
        name: champs.name,
        vision: champs.vision,
        objective: champs.objective,
        domain: champs.domain,
        status: champs.status as never,
      });
      if (r && "error" in r && r.error) {
        setErreur(r.error);
        router.refresh();
      } else router.refresh();
    });
  }

  function supprimer(id: string) {
    setProjets((ps) => ps.filter((p) => p.id !== id));
    setConfirme(null);
    start(async () => {
      await deleteProject(id);
      router.refresh();
    });
  }

  if (projets.length === 0) {
    return (
      <div className="rounded-[18px] bg-surface-2 px-4 py-5 text-sm text-ink-soft">
        Pas encore de projet. Dépose ce que tu as en tête — AMANA t&apos;aidera à en faire des projets
        clairs.
      </div>
    );
  }

  return (
    <>
      {erreur && <p className="step-enter rounded-[14px] bg-gold-soft px-4 py-3 text-sm">{erreur}</p>}

      <p className="text-xs text-ink-faint">
        Glisse un projet par la poignée pour le réordonner. Touche-le pour le préciser.
      </p>

      <ul className="flex touch-none flex-col gap-2" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {projets.map((p, i) => {
          const actif = pris === p.id;
          const cible = pris && surIdx === i && !actif;
          return (
            <li
              key={p.id}
              ref={(el) => {
                if (el) refs.current.set(p.id, el);
                else refs.current.delete(p.id);
              }}
              className={`overflow-hidden rounded-[18px] border bg-surface transition-[transform,opacity,border-color] ${
                actif ? "scale-[1.02] border-gold opacity-90 shadow-lg" : "border-ink/10"
              } ${cible ? "border-gold/60" : ""}`}
            >
              <div className="flex items-stretch">
                {/* Poignée de déplacement */}
                <button
                  onPointerDown={(e) => onPointerDown(e, p.id)}
                  aria-label={`Déplacer ${p.name}`}
                  className="flex w-11 flex-none cursor-grab touch-none items-center justify-center text-ink-faint active:cursor-grabbing"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                    <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                    <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                  </svg>
                </button>

                <button
                  onClick={() => setEdite(edite === p.id ? null : p.id)}
                  className="press flex flex-1 items-center gap-3 py-3.5 pr-4 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-ink-faint">
                      {STATUTS.find((s) => s.key === p.status)?.label ?? p.status}
                      {p.domain ? ` · ${p.domain}` : ""}
                    </span>
                  </span>
                  <span className="text-ink-faint">{edite === p.id ? "▾" : "▸"}</span>
                </button>
              </div>

              {edite === p.id && (
                <div className="step-enter flex flex-col gap-3 border-t border-ink/10 px-4 py-4">
                  <Champ label="Nom" value={p.name} onBlur={(v) => enregistrer(p.id, { name: v })} />
                  <Champ
                    label="Vision — à quoi ça ressemble une fois réussi"
                    value={p.vision ?? ""}
                    multi
                    onBlur={(v) => enregistrer(p.id, { vision: v })}
                  />
                  <Champ
                    label="Objectif concret"
                    value={p.objective ?? ""}
                    onBlur={(v) => enregistrer(p.id, { objective: v })}
                  />

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Domaine de vie
                    </span>
                    <select
                      value={p.domain ?? ""}
                      onChange={(e) => enregistrer(p.id, { domain: e.target.value })}
                      className="rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold"
                    >
                      <option value="">—</option>
                      {DOMAINES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Statut
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUTS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => enregistrer(p.id, { status: s.key })}
                          className={`press rounded-full border px-3 py-1.5 text-xs ${
                            p.status === s.key
                              ? "border-gold bg-gold-soft font-semibold"
                              : "border-ink/15 text-ink-soft"
                          }`}
                        >
                          {s.label}
                          {s.note && <span className="opacity-60"> · {s.note}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {confirme === p.id ? (
                    <div className="flex items-center gap-2 rounded-[14px] bg-surface-2 p-3">
                      <span className="flex-1 text-xs text-ink-soft">Supprimer ce projet ?</span>
                      <button onClick={() => supprimer(p.id)} className="press rounded-full bg-[#B8543F] px-4 py-1.5 text-xs font-semibold text-white">
                        Supprimer
                      </button>
                      <button onClick={() => setConfirme(null)} className="press rounded-full border border-ink/20 px-4 py-1.5 text-xs">
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirme(p.id)}
                      className="self-start text-xs text-ink-faint underline-offset-4 hover:underline"
                    >
                      Supprimer ce projet
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Champ({
  label,
  value,
  onBlur,
  multi,
}: {
  label: string;
  value: string;
  onBlur: (v: string) => void;
  multi?: boolean;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const cls =
    "rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      {multi ? (
        <textarea
          rows={2}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onBlur(v)}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onBlur(v)}
          className={cls}
        />
      )}
    </label>
  );
}
