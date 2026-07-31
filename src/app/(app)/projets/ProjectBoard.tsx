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

const GAP = 8; // gap-2

type Drag = { id: string; from: number; dy: number; h: number };

export function ProjectBoard({ projets: initiaux }: { projets: Projet[] }) {
  const router = useRouter();
  const [projets, setProjets] = useState(initiaux);
  const [edite, setEdite] = useState<string | null>(null);
  const [confirme, setConfirme] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, start] = useTransition();

  const [drag, setDrag] = useState<Drag | null>(null);
  const startY = useRef(0);
  const refs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => setProjets(initiaux), [initiaux]);

  /** Index visé, déduit du déplacement vertical. */
  const cible = drag
    ? Math.max(0, Math.min(projets.length - 1, drag.from + Math.round(drag.dy / drag.h)))
    : null;

  function onPointerDown(e: React.PointerEvent, id: string, from: number) {
    e.preventDefault();
    // On replie toute carte ouverte : les hauteurs redeviennent uniformes,
    // donc le calcul de décalage est juste.
    setEdite(null);
    setConfirme(null);
    const el = refs.current.get(id);
    const h = (el?.offsetHeight ?? 72) + GAP;
    startY.current = e.clientY;
    setDrag({ id, from, dy: 0, h });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dy = e.clientY - startY.current;
    setDrag((d) => (d ? { ...d, dy } : d));

    // Défilement automatique quand on approche des bords : on peut déplacer
    // un projet au-delà de l'écran visible.
    const marge = 90;
    if (e.clientY < marge) window.scrollBy({ top: -12 });
    else if (e.clientY > window.innerHeight - marge) window.scrollBy({ top: 12 });
  }

  function onPointerUp() {
    if (!drag) return;
    if (cible !== null && cible !== drag.from) {
      const suivant = [...projets];
      const [item] = suivant.splice(drag.from, 1);
      suivant.splice(cible, 0, item);
      setProjets(suivant);
      start(async () => {
        await reorderProjects(suivant.map((p) => p.id));
        router.refresh();
      });
    }
    setDrag(null);
  }

  /** De combien cette carte doit-elle s'écarter pour laisser la place ? */
  function decalage(i: number): number {
    if (!drag || cible === null || i === drag.from) return 0;
    if (drag.from < cible && i > drag.from && i <= cible) return -drag.h;
    if (drag.from > cible && i < drag.from && i >= cible) return drag.h;
    return 0;
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
      if (r && "error" in r && r.error) setErreur(r.error);
      router.refresh();
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
        Pas encore de projet. Dépose ce que tu as en tête — AMANA t&apos;aidera à en faire des
        projets clairs.
      </div>
    );
  }

  return (
    <>
      {erreur && (
        <p className="step-enter mb-2 rounded-[14px] bg-gold-soft px-4 py-3 text-sm">{erreur}</p>
      )}

      <p className="mb-2 text-xs text-ink-faint">
        Glisse un projet par la poignée pour le réordonner. Touche-le pour le préciser.
      </p>

      <ul
        className="flex flex-col gap-2"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {projets.map((p, i) => {
          const porte = drag?.id === p.id;
          const shift = decalage(i);
          return (
            <li
              key={p.id}
              ref={(el) => {
                if (el) refs.current.set(p.id, el);
                else refs.current.delete(p.id);
              }}
              style={{
                transform: porte
                  ? `translateY(${drag!.dy}px) scale(1.03) rotate(${Math.max(-2.5, Math.min(2.5, drag!.dy * 0.02))}deg)`
                  : `translateY(${shift}px)`,
                // La carte portée suit le doigt sans latence ; les autres glissent.
                transition: porte ? "none" : "transform 240ms var(--ease-out)",
                zIndex: porte ? 30 : 1,
                position: "relative",
                touchAction: "pan-y",
                willChange: porte || shift ? "transform" : undefined,
              }}
              className={`overflow-hidden rounded-[18px] border bg-surface ${
                porte ? "border-gold shadow-2xl" : "border-ink/10"
              }`}
            >
              <div className="flex items-center gap-1">
                {/* Poignée : seule zone qui déclenche le glissement. */}
                <span
                  onPointerDown={(e) => onPointerDown(e, p.id, i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Déplacer ${p.name}`}
                  className="flex h-12 w-10 flex-none cursor-grab touch-none items-center justify-center text-ink-faint active:cursor-grabbing"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                    <circle cx="6" cy="4" r="1.4" /><circle cx="10" cy="4" r="1.4" />
                    <circle cx="6" cy="8" r="1.4" /><circle cx="10" cy="8" r="1.4" />
                    <circle cx="6" cy="12" r="1.4" /><circle cx="10" cy="12" r="1.4" />
                  </svg>
                </span>

                <button
                  onClick={() => setEdite(edite === p.id ? null : p.id)}
                  className="press flex flex-1 items-center gap-3 py-3 pr-4 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-ink-faint">
                      {STATUTS.find((s) => s.key === p.status)?.label}
                      {p.domain ? ` · ${p.domain}` : ""}
                    </span>
                  </span>
                  <span className="text-ink-faint">{edite === p.id ? "▾" : "▸"}</span>
                </button>
              </div>

              {edite === p.id && (
                <div className="step-enter flex flex-col gap-3 border-t border-ink/10 px-4 py-4">
                  <Champ label="Nom" value={p.name} onSave={(v) => enregistrer(p.id, { name: v })} />
                  <Champ
                    label="Vision — à quoi ça ressemble une fois réussi"
                    value={p.vision ?? ""}
                    multi
                    onSave={(v) => enregistrer(p.id, { vision: v })}
                  />
                  <Champ
                    label="Prochaine action"
                    value={p.objective ?? ""}
                    onSave={(v) => enregistrer(p.id, { objective: v })}
                  />

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Domaine
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
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Statut
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUTS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => enregistrer(p.id, { status: s.key })}
                          className={`press rounded-full px-3 py-1.5 text-xs ${
                            p.status === s.key
                              ? "bg-gold font-semibold text-[#12100D]"
                              : "bg-surface-2 text-ink-soft"
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
                      <button
                        onClick={() => supprimer(p.id)}
                        className="press rounded-full bg-[#B8543F] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => setConfirme(null)}
                        className="press rounded-full border border-ink/20 px-4 py-2 text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      {/* La porte : on parle de CE projet, AMANA le sait déjà. */}
                      <a
                        href={`/conversation?projet=${p.id}`}
                        className="press rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                      >
                        En parler
                      </a>
                      <button
                        onClick={() => setConfirme(p.id)}
                        className="text-xs text-ink-faint underline-offset-4 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
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
  multi,
  onSave,
}: {
  label: string;
  value: string;
  multi?: boolean;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const cls =
    "rounded-[14px] border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </span>
      {multi ? (
        <textarea
          rows={2}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onSave(v)}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onSave(v)}
          className={cls}
        />
      )}
    </label>
  );
}
