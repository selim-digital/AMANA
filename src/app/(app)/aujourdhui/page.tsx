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
      <header className="enter flex items-center justify-between lg:hidden" style={{ "--i": 0 } as React.CSSProperties}>
        <Wordmark className="text-sm" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-xs font-bold">
          {initiale}
        </span>
      </header>

      <div className="enter" style={{ "--i": 1 } as React.CSSProperties}>
        <h1 className="voice-amana text-2xl lg:text-3xl">Bonjour {prenom}</h1>
        <p className="text-sm text-ink-faint">Ton chemin du jour.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
      <section
        className="enter rounded-r-[16px] border-l-[3px] border-gold bg-surface-2 px-4 py-3.5"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          Intention du jour
        </span>
        <p className="voice-amana mt-1 text-[15px]">
          « Qu&apos;est-ce qui, aujourd&apos;hui, mérite vraiment ton énergie ? »
        </p>
      </section>

      <div className="enter" style={{ "--i": 3 } as React.CSSProperties}>
        <PriorityList items={priorities} />
      </div>
        </div>

        <div className="flex flex-col gap-5">
      <a href="/chemin" aria-label="Ouvrir ton chemin" className="enter press block" style={{ "--i": 4 } as React.CSSProperties}>
        <span className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Ton chemin
          </span>
          <span className="text-[11px] text-gold-deep">Explorer →</span>
        </span>
        <Chemin done={Math.min(2 + activeCount, 4)} total={5} />
      </a>

      {projet ? (
        <a
          href="/projets"
          className="enter press block rounded-[20px] bg-panel p-5 text-panel-text"
          style={{ "--i": 5 } as React.CSSProperties}
        >
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
        <a
          href="/deposer"
          className="enter press block rounded-[20px] border border-ink/10 bg-surface p-5"
          style={{ "--i": 5 } as React.CSSProperties}
        >
          <p className="voice-amana text-[15px]">Pas encore de projet actif.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Vide ta tête : AMANA t&apos;aidera à en faire des projets clairs.
          </p>
        </a>
      )}

      <section className="enter grid grid-cols-3 gap-2.5" style={{ "--i": 6 } as React.CSSProperties}>
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
        <section className="enter rounded-[20px] border border-ink/10 bg-surface p-5" style={{ "--i": 7 } as React.CSSProperties}>
          <p className="voice-amana text-[15px]">La journée se termine — deux minutes pour la clore ?</p>
          <p className="mt-1 text-xs text-ink-faint">Accompli, appris, à ajuster, lâcher-prise.</p>
        </section>
      )}
        </div>
      </div>
    </main>
  );
}
