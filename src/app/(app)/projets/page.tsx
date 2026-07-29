import { auth } from "@/auth";
import { getProjectsByStatus } from "@/lib/data";
import { ProjectBoard, type Projet } from "./ProjectBoard";

export default async function ProjetsPage() {
  const session = await auth();
  const projects = await getProjectsByStatus(session!.user.id);

  const projets: Projet[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    vision: p.vision,
    objective: p.objective,
    domain: p.domain,
    progress: p.progress,
  }));

  const actifs = projets.filter((p) => p.status === "ACTIVE").length;

  return (
    <main className="flex flex-col gap-4 px-5 py-6">
      <header className="enter flex items-center justify-between gap-3">
        <div>
          <h1 className="voice-amana text-2xl">Projets</h1>
          <p className="text-sm text-ink-faint">
            {actifs} actif{actifs > 1 ? "s" : ""} sur 3
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
    </main>
  );
}
