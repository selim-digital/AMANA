import { auth } from "@/auth";
import { getDashboard } from "@/lib/data";
import { Wordmark } from "@/components/AmanaMark";
import { Chemin } from "@/components/Scenes";
import { PriorityList, type Priority } from "./PriorityList";
import { MicroProfil } from "./MicroProfil";
import { ModaleAction } from "./ModaleAction";
import { questionsRestantes } from "@/lib/coaching/profils";

/** SCR-DASH — « Aujourd'hui » : ce qui compte, et une seule invitation à agir. */
export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const { user, profile, tasks, projects, activeCount, indices, nudge } = await getDashboard(userId);

  // Une question de profil à la fois, au fil de l'eau — jamais une série.
  const restantes = questionsRestantes({
    disc: (profile?.disc as Record<string, string>) ?? {},
    wpmot: (profile?.wpmot as Record<string, string>) ?? {},
    ego: (profile?.ego as Record<string, string>) ?? {},
  });
  // Une série de trois questions — jamais une seule, jamais toute la batterie.
  const serie = restantes.slice(0, 3).map((r) => ({
    cle: r.instrument.cle,
    instrument: r.instrument.nom,
    id: r.question.id,
    texte: r.question.texte,
    options: r.question.options,
  }));

  const prenom = user?.name?.trim().split(" ")[0] || "toi";
  const initiale = (user?.name?.trim()[0] || "A").toUpperCase();
  const projet = projects[0];

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

  const jour = new Date().toISOString().slice(0, 10);

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      {/* AMANA interpelle une fois par jour, sans jamais culpabiliser. */}
      <ModaleAction
        titre="Une chose pour aujourd'hui"
        texte={nudge.texte}
        cta={nudge.cta}
        href={nudge.href}
        cle={`${jour}-${nudge.cta}`}
      />
      <header
        className="enter flex items-center justify-between lg:hidden"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <Wordmark className="text-sm" />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/30 text-xs font-bold">
          {initiale}
        </span>
      </header>

      <div className="enter" style={{ "--i": 1 } as React.CSSProperties}>
        <h1 className="voice-amana text-2xl lg:text-3xl">Bonjour {prenom}</h1>
        <p className="text-sm text-ink-faint">Ton chemin du jour.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        {/* ─────────── Colonne principale : ce qu'on fait aujourd'hui ─────────── */}
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

          {/* Le nudge : une seule invitation, choisie selon l'état réel. */}
          <a
            href={nudge.href}
            className="enter press lift flex items-center gap-4 rounded-[20px] border border-gold/30 bg-surface p-5"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-soft">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-deep" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5c3.5-1.2 4.5-4.5 7-6.5s4-4.5 6-7" />
                <circle cx="17.5" cy="5.5" r="2.2" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block text-[15px] leading-snug">{nudge.texte}</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-gold-deep">
                {nudge.cta} →
              </span>
            </span>
          </a>

          {serie.length > 0 && (
            <div className="enter" style={{ "--i": 5 } as React.CSSProperties}>
              <MicroProfil questions={serie} restantes={restantes.length} />
            </div>
          )}

          {/* Gestes rapides : on n'a jamais à chercher quoi faire ensuite. */}
          <section
            className="enter grid grid-cols-3 gap-2.5"
            style={{ "--i": 5 } as React.CSSProperties}
          >
            {[
              { href: "/deposer", label: "Déposer", d: "M12 4v10m0 0-4-4m4 4 4-4M5 18h14" },
              { href: "/conversation", label: "En parler", d: "M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" },
              { href: "/projets", label: "Projets", d: "M4 20V6.5A2.5 2.5 0 0 1 6.5 4H20M7.5 16.5 12 12l4.5-4.5" },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="press lift flex flex-col items-center gap-2 rounded-[16px] border border-ink/10 bg-surface px-2 py-4 text-center"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.d} />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  {a.label}
                </span>
              </a>
            ))}
          </section>
        </div>

        {/* ─────────── Colonne d'appui : où j'en suis ─────────── */}
        <div className="flex flex-col gap-5">
          <a
            href="/chemin"
            aria-label="Ouvrir ton chemin"
            className="enter press block"
            style={{ "--i": 4 } as React.CSSProperties}
          >
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
              className="enter press lift block rounded-[20px] bg-panel p-5 text-panel-text"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              <span className="text-[11px] uppercase tracking-[0.14em] opacity-60">
                Projet actif · {activeCount} / 3
              </span>
              <h2 className="mt-1.5 text-lg font-semibold">{projet.name}</h2>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="bar-fill h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(projet.progress ?? 0, 3)}%` }}
                />
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
              className="enter press lift block rounded-[20px] border border-ink/10 bg-surface p-5"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              <p className="voice-amana text-[15px]">Pas encore de projet actif.</p>
              <p className="mt-1 text-sm text-ink-soft">
                Vide ta tête : AMANA t&apos;aidera à en faire des projets clairs.
              </p>
            </a>
          )}

          <section
            className="enter grid grid-cols-3 gap-2.5"
            style={{ "--i": 6 } as React.CSSProperties}
          >
            {rings.map((k, i) => {
              const off = 151 - (k.value / 100) * 151;
              return (
                <div
                  key={k.label}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-surface-2 px-2 py-3.5"
                >
                  <svg viewBox="0 0 58 58" className="h-14 w-14" aria-label={`${k.label} ${k.value} %`}>
                    <circle cx="29" cy="29" r="24" fill="none" className="stroke-ink/10" strokeWidth="5" />
                    <circle
                      cx="29"
                      cy="29"
                      r="24"
                      fill="none"
                      className={`ring-draw ${k.cls}`}
                      strokeWidth="5"
                      strokeLinecap="round"
                      transform="rotate(-90 29 29)"
                      style={{ "--off": off, "--i": i } as React.CSSProperties}
                    />
                  </svg>
                  <span className="text-sm font-bold tabular-nums">{k.value} %</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft">{k.label}</span>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
