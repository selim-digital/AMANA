import { auth } from "@/auth";
import { getDashboard } from "@/lib/data";
import { Wordmark } from "@/components/AmanaMark";
import { Chemin } from "@/components/Scenes";
import { Intention } from "./Intention";
import { ProjetsSlider } from "./ProjetsSlider";
import { MicroProfil } from "./MicroProfil";
import { ObjectifsAnnee } from "./ObjectifsAnnee";
import { Notifications } from "./Notifications";
import { questionsRestantes } from "@/lib/coaching/profils";
import {
  evenements,
  pastilles,
  universDArrivee,
  contenuUnivers,
  UNIVERS,
  ORDRE,
  type CleUnivers,
} from "@/lib/univers";
import { BandeauUnivers, type VueUnivers } from "./Univers";
import { VueUnivers as VueDeLUnivers } from "./VueUnivers";
import { RendezVous } from "@/components/RendezVous";
import { DemandePosition } from "@/components/DemandePosition";

/** SCR-DASH — « Aujourd'hui » : ce qui compte, et une seule invitation à agir. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const { user, profile, intention, tasks, projects, activeCount, objectifsAnnee, notifications, indices, nudge } =
    await getDashboard(userId);

  // On atterrit dans un univers — celui choisi, ou celui qui porte le plus
  // d'attente. Les deux autres restent a un doigt, avec leurs pastilles.
  const evts = await evenements(userId);
  const compte = pastilles(evts);
  const actif: CleUnivers =
    params.u && params.u in UNIVERS ? (params.u as CleUnivers) : universDArrivee(evts);
  const vues: VueUnivers[] = ORDRE.map((c) => ({
    ...UNIVERS[c],
    pastille: compte[c],
    motifs: evts.filter((x) => x.univers === c).map((x) => x.motif),
  }));
  const raison = evts.filter((x) => x.univers === actif).map((x) => x.motif);
  const contenu = await contenuUnivers(userId, actif);
  const raisonPlongee = evts.find(
    (x) => x.univers === "source" && x.href.startsWith("/deepdive"),
  )?.motif;

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
  const projets_actifs = projects.map((p) => ({
    id: p.id,
    name: p.name,
    progress: p.progress,
    objective: p.objective,
  }));

  const rings = [
    { label: "Clarté", value: indices.clarte, cls: "stroke-ink" },
    { label: "Action", value: indices.action, cls: "stroke-ink-soft" },
    { label: "Alignement", value: indices.alignement, cls: "stroke-gold" },
  ];

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      {/* Cinq rendez-vous par jour, ecrits par l'IA a partir de ce qui attend
          reellement. Le calage horaire ne se dit pas : il se constate. */}
      <DemandePosition dejaConnue={profile?.lat !== null && profile?.lat !== undefined} />
      <RendezVous
        lat={profile?.lat ?? null}
        lng={profile?.lng ?? null}
        methode={profile?.methode ?? null}
        ombre={profile?.ombre ?? 1}
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
        <h1 className="voice-amana text-2xl lg:text-3xl">Paix sur toi, {prenom}</h1>
        <p className="text-sm text-ink-faint">{UNIVERS[actif].sujet}.</p>
      </div>

      <BandeauUnivers univers={vues} actif={actif} raison={raison} />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        {/* ─────────── Colonne principale : ce qu'on fait aujourd'hui ─────────── */}
        <div className="flex flex-col gap-5">
          {/* L'intention du jour appartient a l'execution : elle n'a pas de
              sens dans La Source ni dans Align. */}
          {actif === "build" && (
            <Intention
              intention={
                intention
                  ? { id: intention.id, title: intention.title, done: intention.status === "DONE" }
                  : null
              }
            />
          )}

          {notifications.length > 0 && (
            <Notifications notifs={notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, href: n.href }))} />
          )}

          {/* Dans Build les projets sont deja la carte noire ci-dessous :
              on ne les repete pas en rangee. */}
          <VueDeLUnivers
            libelleObjets={contenu.libelleObjets}
            objets={actif === "build" ? [] : contenu.objets}
            etapes={contenu.etapes}
            actions={contenu.actions}
            cochable={actif !== "source"}
          />

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

          {/* Ce qui se construit passe avant les gestes : c'est le sujet, ils
              ne sont que des moyens. */}
          {actif === "build" && projets_actifs.length > 0 && (
            <ProjetsSlider projets={projets_actifs} actifs={activeCount} />
          )}

          {/* La plongée n'est pas un geste rapide parmi d'autres : c'est le
              seul endroit où l'on regarde ce qu'on ne voit pas. Elle sort du
              rang, et dit ce qui l'attend. */}
          <a
            href="/deepdive"
            className="enter press lift relative flex items-center gap-4 overflow-hidden rounded-[20px] bg-panel p-5 text-panel-text"
            style={{ "--i": 5 } as React.CSSProperties}
          >
            <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full border border-gold/50">
              <span className="halo absolute inset-0 rounded-full bg-gold/50" aria-hidden />
              <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] uppercase tracking-[0.16em] opacity-60">
                La plongée
              </span>
              <span className="mt-0.5 block text-[15px] leading-snug">
                {compte.source > 0
                  ? raisonPlongee ?? "Ce que tu portes sans le voir."
                  : "Ce que tu portes sans le voir. Dix minutes, quatre terrains."}
              </span>
            </span>
            <span className="flex-none text-gold">→</span>
          </a>

          {/* Gestes rapides : on n'a jamais à chercher quoi faire ensuite. */}
          <section
            className="enter grid grid-cols-2 gap-2.5"
            style={{ "--i": 6 } as React.CSSProperties}
          >
            {[
              { href: "/deposer", label: "Déposer", d: "M9 3h6v11a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3" },
              { href: "/conversation", label: "En parler", d: "M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" },
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

          {projets_actifs.length ? null : (
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

          <div className="enter" style={{ "--i": 6 } as React.CSSProperties}>
            <ObjectifsAnnee
              objectifs={objectifsAnnee.map((o) => ({ id: o.id, label: o.label, why: o.why }))}
              annee={new Date().getFullYear()}
            />
          </div>

          <section
            className="enter grid grid-cols-3 gap-2.5"
            style={{ "--i": 7 } as React.CSSProperties}
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
