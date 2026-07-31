import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectsByStatus } from "@/lib/data";
import { ProjectBoard, type Projet } from "./ProjectBoard";
import { CapTrimestre, type Cap } from "./CapTrimestre";

export const dynamic = "force-dynamic";

function trimestreCourant(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

export default async function ProjetsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const periode = trimestreCourant();

  const [projects, okrs] = await Promise.all([
    getProjectsByStatus(userId),
    prisma.okr.findMany({
      where: { period: periode, project: { userId, deletedAt: null } },
      include: { keyResults: { orderBy: { order: "asc" } } },
    }),
  ]);

  const projets: Projet[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    vision: p.vision,
    objective: p.objective,
    domain: p.domain,
    progress: p.progress,
  }));

  const actifs = projets.filter((p) => p.status === "ACTIVE");

  // Un cap par projet actif : celui du trimestre, ou l'invitation à le poser.
  const caps: Cap[] = actifs.map((p) => {
    const okr = okrs.find((o) => o.projectId === p.id);
    return {
      projetId: p.id,
      projet: p.name,
      periode,
      objectif: okr?.objective ?? null,
      resultats:
        okr?.keyResults.map((k) => ({
          id: k.id,
          label: k.label,
          target: k.target,
          current: k.current,
        })) ?? [],
    };
  });

  const sansCap = caps.filter((c) => !c.objectif).length;

  return (
    <main className="flex flex-col gap-4 px-5 py-6">
      <header className="enter flex items-center justify-between gap-3">
        <div>
          <h1 className="voice-amana text-2xl">Projets</h1>
          <p className="text-sm text-ink-faint">
            {actifs.length} actif{actifs.length > 1 ? "s" : ""} sur 3
          </p>
        </div>
        <a
          href="/deposer"
          className="press rounded-full bg-gold px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Déposer
        </a>
      </header>

      <div className="enter" style={{ "--i": 1 } as React.CSSProperties}>
        <ProjectBoard projets={projets} />
      </div>

      {caps.length > 0 && (
        <section
          className="enter flex flex-col gap-3 pt-2"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Caps du trimestre · {periode}
            </h2>
            {sansCap > 0 && (
              <span className="text-[11px] text-gold-deep">
                {sansCap} projet{sansCap > 1 ? "s" : ""} sans cap
              </span>
            )}
          </div>

          {caps.map((c) => (
            <CapTrimestre key={c.projetId} cap={c} />
          ))}
        </section>
      )}
    </main>
  );
}
