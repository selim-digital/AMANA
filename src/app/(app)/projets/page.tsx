import { auth } from "@/auth";
import { getProjectsByStatus } from "@/lib/data";

const GROUPES: { statut: string; key: string; note?: string }[] = [
  { statut: "Actifs", key: "ACTIVE", note: "3 max — pour rester concentré" },
  { statut: "Secondaires", key: "SECONDARY" },
  { statut: "En attente", key: "WAITING" },
  { statut: "Futurs — boîte à idées", key: "IDEA" },
  { statut: "Abandonnés", key: "ARCHIVED" },
];

export default async function ProjetsPage() {
  const session = await auth();
  const projects = await getProjectsByStatus(session!.user.id);

  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="voice-amana text-2xl">Projets</h1>
        <a
          href="/deposer"
          className="rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#12100D]"
        >
          Nouveau
        </a>
      </header>

      {projects.length === 0 && (
        <p className="rounded-[16px] bg-surface-2 px-4 py-4 text-sm text-ink-soft">
          Pas encore de projet. Dépose ce que tu as en tête — AMANA t&apos;aidera à en faire des
          projets clairs.
        </p>
      )}

      {GROUPES.map((g) => {
        const list = projects.filter((p) => p.status === g.key);
        if (list.length === 0 && g.key !== "ACTIVE") return null;
        return (
          <section key={g.key} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {g.statut}
              </h2>
              {g.note && <span className="text-[11px] text-ink-faint">· {g.note}</span>}
            </div>
            {list.length === 0 ? (
              <p className="rounded-[16px] bg-surface-2 px-4 py-3 text-sm text-ink-faint">
                Rien ici pour l&apos;instant — et c&apos;est très bien.
              </p>
            ) : (
              list.map((p) => (
                <div key={p.id} className="rounded-[18px] border border-ink/10 bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs tabular-nums text-ink-faint">{p.progress} %</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${p.progress}%` }} />
                  </div>
                  {p.objective && (
                    <p className="mt-2 text-sm text-ink-soft">Prochaine action : {p.objective}</p>
                  )}
                </div>
              ))
            )}
          </section>
        );
      })}
    </main>
  );
}
