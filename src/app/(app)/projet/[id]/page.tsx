import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MicroFlottant } from "@/components/MicroFlottant";

export const dynamic = "force-dynamic";

function trimestre(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

const STATUT = {
  ACTIVE: "Projet actif",
  SECONDARY: "Projet secondaire",
  WAITING: "En attente",
  IDEA: "Boîte à idées",
  ARCHIVED: "Archivé",
} as const;

/**
 * La fiche d'un projet — tout ce qui le concerne, au même endroit.
 *
 * C'était le seul objet du produit sans page à lui : sa vision, son cap, ses
 * actions et les échanges qu'on avait eus dessus vivaient dans quatre écrans
 * différents. Le cap trouve ici sa place naturelle — dedans, pas à côté.
 */
export default async function FicheProjet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const projet = await prisma.project.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      okrs: {
        where: { period: trimestre() },
        include: { keyResults: { orderBy: { order: "asc" } } },
      },
      tasks: {
        where: { deletedAt: null, status: { notIn: ["DONE"] } },
        orderBy: { createdAt: "asc" },
        take: 6,
      },
      conversations: { orderBy: { updatedAt: "desc" }, take: 4 },
    },
  });

  if (!projet) notFound();

  const cap = projet.okrs[0] ?? null;
  const jours = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const dormance = jours(projet.updatedAt);

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <MicroFlottant />

      <div className="enter">
        <Link
          href="/aujourdhui?u=build"
          className="press text-[11px] font-semibold uppercase tracking-widest text-ink-faint"
        >
          ← Build
        </Link>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          {STATUT[projet.status] ?? "Projet"}
          {dormance > 14 && ` · sans mouvement depuis ${dormance} jours`}
        </p>
        <h1 className="voice-amana mt-0.5 text-2xl leading-tight">{projet.name}</h1>
        {projet.vision && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{projet.vision}</p>
        )}
      </div>

      {/* ─────────── Le cap du trimestre : le cœur de la fiche ─────────── */}
      {cap ? (
        <section
          className="enter rounded-[22px] bg-panel p-5 text-panel-text"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
              Cap du trimestre
            </span>
            <span className="flex-none text-sm font-bold text-gold">{projet.progress} %</span>
          </div>
          <p className="voice-amana mt-1.5 text-[17px] leading-snug">{cap.objective}</p>

          <ul className="mt-5 flex flex-col gap-4">
            {cap.keyResults.map((k) => (
              <li key={k.id}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 flex-1">
                    {k.label}
                    {k.target && <span className="ml-1 opacity-60">— {k.target}</span>}
                  </span>
                  <span className="flex-none font-bold text-gold">{k.current} %</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="bar-fill h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(k.current, 2)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Le pointage passe par la parole : une question fait réfléchir,
              un curseur qu'on traîne ne fait rien réfléchir du tout. */}
          <Link
            href={`/conversation?projet=${projet.id}&mode=pointage`}
            className="press mt-5 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
            Dire où j&apos;en suis
          </Link>
        </section>
      ) : (
        <section
          className="enter rounded-[22px] border border-dashed border-gold/50 bg-surface p-5"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
            Aucun cap ce trimestre
          </span>
          <p className="voice-amana mt-1.5 text-[15px] leading-snug">
            Sans cap, ce projet avance sans qu&apos;on sache vers quoi. Trois questions suffisent
            à en poser un — tu peux répondre à l&apos;oral.
          </p>
          <Link
            href={`/conversation?projet=${projet.id}&mode=cap`}
            className="press mt-4 inline-flex rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#12100D]"
          >
            Poser le cap
          </Link>
        </section>
      )}

      {/* ─────────── Ce qui reste à faire ici ─────────── */}
      {projet.tasks.length > 0 && (
        <section className="enter flex flex-col gap-2" style={{ "--i": 2 } as React.CSSProperties}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Actions rattachées
          </span>
          {projet.tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3 text-sm"
            >
              <span className="min-w-0 flex-1">{t.title}</span>
              {jours(t.createdAt) >= 5 && (
                <Link
                  href={`/conversation?mode=sonde&tache=${t.id}`}
                  className="press flex-none rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-semibold text-gold-deep"
                >
                  Débloquer
                </Link>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ─────────── Ce qu'on s'est déjà dit dessus ─────────── */}
      {projet.conversations.length > 0 && (
        <section className="enter flex flex-col gap-2" style={{ "--i": 3 } as React.CSSProperties}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Vos échanges sur ce projet
          </span>
          {projet.conversations.map((c) => (
            <Link
              key={c.id}
              href={`/conversation?c=${c.id}`}
              className="press flex items-center gap-3 rounded-[16px] bg-surface px-4 py-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <span className="flex-none text-[11px] text-ink-faint">
                {jours(c.updatedAt) === 0 ? "aujourd'hui" : `il y a ${jours(c.updatedAt)} j`}
              </span>
            </Link>
          ))}
        </section>
      )}

      <div className="enter flex gap-2" style={{ "--i": 4 } as React.CSSProperties}>
        <Link
          href={`/conversation?projet=${projet.id}`}
          className="press flex-1 rounded-full bg-ink px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-paper"
        >
          En parler
        </Link>
        <Link
          href="/projets"
          className="press flex-none rounded-full border border-ink/20 px-5 py-3 text-xs font-semibold text-ink-soft"
        >
          Modifier
        </Link>
      </div>
    </main>
  );
}
