import { auth } from "@/auth";
import { getDashboard } from "@/lib/data";
import { Wordmark } from "@/components/AmanaMark";
import { Chemin } from "@/components/Scenes";
import { PriorityList, type Priority } from "./PriorityList";

/** SCR-DASH — « Aujourd'hui » : fenêtre claire sur ce qui compte (données réelles). */
export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { user, tasks, projects, activeCount, indices } = await getDashboard(userId);

  const prenom = user?.name?.trim().split(" ")[0] || "toi";
  const initiale = (user?.name?.trim()[0] || "A").toUpperCase();
  const projet = projects[0];
  const soir = new Date().getHours() >= 18;

  const priorities: Priority[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind,
    done: t.status === "DONE",
  }));

  const rings = [
    { label: "Clarté", value: indices.clarte, cls: "stroke-ink" },
    { label: "Action", value: indices.action, cls: "stroke-ink-soft" },
    { label: "Alignement", value: indices.alignement, cls: "stroke-gold" },
  ];

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <Wordmark className="text-sm" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-xs font-bold">
          {initiale}
        </span>
      </header>

      <div>
        <h1 className="voice-amana text-2xl">Bonjour {prenom}</h1>
        <p className="text-sm text-ink-faint">Ton chemin du jour.</p>
      </div>

      <section className="rounded-r-[16px] border-l-[3px] border-gold bg-surface-2 px-4 py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Intention du jour
        </span>
        <p className="voice-amana mt-1 text-[15px]">
          « Qu&apos;est-ce qui, aujourd&apos;hui, mérite vraiment ton énergie ? »
        </p>
      </section>

      <PriorityList items={priorities} />

      <a href="/chemin" aria-label="Ouvrir ton chemin" className="block">
        <span className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ton chemin
          </span>
          <span className="text-[11px] text-gold-deep">Explorer →</span>
        </span>
        <Chemin done={Math.min(2 + activeCount, 4)} total={5} />
      </a>

      {projet ? (
        <a href="/projets" className="block rounded-[20px] bg-panel p-5 text-panel-text">
          <span className="text-[11px] uppercase tracking-[0.14em] opacity-60">
            Projet actif · {activeCount} / 3
          </span>
          <h2 className="mt-1.5 text-lg font-semibold">{projet.name}</h2>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gold" style={{ width: `${projet.progress ?? 0}%` }} />
          </div>
          <p className="mt-3 text-[13px] opacity-80">
            Prochaine étape :{" "}
            <b className="font-semibold opacity-100">
              {projet.objective || "définir la prochaine action"}
            </b>
          </p>
        </a>
      ) : (
        <a href="/deposer" className="block rounded-[20px] border border-ink/10 bg-surface p-5">
          <p className="voice-amana text-[15px]">Pas encore de projet actif.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Vide ta tête : AMANA t&apos;aidera à en faire des projets clairs.
          </p>
        </a>
      )}

      <section className="grid grid-cols-3 gap-2.5">
        {rings.map((k) => (
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
