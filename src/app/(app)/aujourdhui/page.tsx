import { auth } from "@/auth";
import { getDashboard, getRegles } from "@/lib/data";
import { Intention } from "./Intention";
import { ObjectifsAnnee } from "./ObjectifsAnnee";
import { Notifications } from "./Notifications";
import { Regles } from "./Regles";
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
import { Actions, Frise, RangeeObjets } from "./VueUnivers";
import { Outil } from "./Outil";
import { AttenteIci } from "./AttenteIci";
import { ProjetsBuild } from "./ProjetsBuild";
import { Deck } from "./Deck";
import { MicroFlottant } from "@/components/MicroFlottant";
import { RendezVous } from "@/components/RendezVous";
import { DemandePosition } from "@/components/DemandePosition";

/**
 * L'entree de l'application.
 *
 * Sans univers choisi : le paquet des trois mondes, en grand, avec le paysage.
 * Ce n'est pas un tableau de bord — on ne peut rien y faire, on choisit ou
 * entrer. Avec  : l'interieur de cet univers, et rien de ce qui appartient
 * aux deux autres.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const { user, profile, intention, projects, objectifsAnnee, notifications, bloquee, projetsTotal, dormants } =
    await getDashboard(userId);

  // On atterrit dans un univers — celui choisi, ou celui qui porte le plus
  // d'attente. Les deux autres restent a un doigt, avec leurs pastilles.
  const evts = await evenements(userId);
  const compte = pastilles(evts);
  const choisi = params.u && params.u in UNIVERS ? (params.u as CleUnivers) : null;
  const actif: CleUnivers = choisi ?? universDArrivee(evts);
  const vues: VueUnivers[] = ORDRE.map((c) => ({
    ...UNIVERS[c],
    pastille: compte[c],
    motifs: evts.filter((x) => x.univers === c).map((x) => x.motif),
  }));
  // Les regles ne se chargent que la ou elles s'affichent.
  const regles = choisi === "align" ? await getRegles(userId) : [];
  // Ce qui attend PRECISEMENT dans l'univers ou l'on est.
  const iciEvts = evts.filter((x) => x.univers === actif);
  const CALME = {
    source: "Rien n'attend ici. Tes fondations sont posees — reviens quand tu voudras les revoir.",
    build: "Rien n'attend ici. Tes projets sont a jour.",
    align: "Rien n'attend ici. Reviens ce soir pour clore ta journee.",
  } as const;
  // Une notification appartient a l'univers de l'ecran vers lequel elle mene.
  const universDuLien = (href: string | null): CleUnivers =>
    !href
      ? "build"
      : href.includes("u=source") || href.startsWith("/deepdive")
        ? "source"
        : href.includes("u=align") || href.includes("mode=bilan") || href.includes("mode=blocage")
          ? "align"
          : "build";
  const notifsIci = notifications.filter((n) => universDuLien(n.href) === actif);

  const raisonPlongee = evts.find(
    (x) => x.univers === "source" && x.href.startsWith("/deepdive"),
  )?.motif;

  // Une question de profil à la fois, au fil de l'eau — jamais une série.
  const restantes = questionsRestantes({
    disc: (profile?.disc as Record<string, string>) ?? {},
    wpmot: (profile?.wpmot as Record<string, string>) ?? {},
    ego: (profile?.ego as Record<string, string>) ?? {},
  });
  // Le parcours a besoin de savoir si les lectures de profil sont completes.
  const contenu = choisi
    ? await contenuUnivers(userId, actif, restantes.length === 0)
    : null;

  const prenom = user?.name?.trim().split(" ")[0] || "toi";
  const projets_actifs = projects.map((p) => ({
    id: p.id,
    name: p.name,
    progress: p.progress,
    objective: p.objective,
    cap: p.okrs[0]?.objective ?? null,
  }));


  // Les trois projets actifs ; le reste est compte, pas liste.
  const lignesProjets = projets_actifs.slice(0, 3).map((p) => ({
    id: p.id,
    nom: p.name,
    objectif: p.objective,
    cap: p.cap,
    avancement: p.progress,
  }));
  const autresProjets = Math.max(0, projetsTotal - projets_actifs.length);

  // Les rendez-vous et la position vivent des deux côtés de la bascule.
  const veille = (
    <>
      {/* Cinq rendez-vous par jour, ecrits par l'IA a partir de ce qui attend
          reellement. Le calage horaire ne se dit pas : il se constate. */}
      <DemandePosition dejaConnue={profile?.lat !== null && profile?.lat !== undefined} />
      <RendezVous
        lat={profile?.lat ?? null}
        lng={profile?.lng ?? null}
        methode={profile?.methode ?? null}
        ombre={profile?.ombre ?? 1}
      />
      <MicroFlottant />
    </>
  );

  // ─────────── Sans univers choisi : le paquet, et rien d'autre ───────────
  if (!choisi || !contenu) {
    return (
      <>
        {veille}
        <div className="px-5 pt-5">
          <p className="voice-amana text-lg">Paix sur toi, {prenom}</p>
        </div>
        <Deck cartes={vues} conseille={actif} />
      </>
    );
  }

  // ─────────── L'intérieur d'un univers : le strict nécessaire ───────────
  //
  // Un univers ouvert ne montre que quatre choses : où l'on est, la matière
  // propre au monde, son outil, et le micro. Tout le reste appartenait à un
  // tableau de bord — et c'est précisément ce qu'AMANA ne doit pas être.
  return (
    // Sur grand écran, l'univers tient dans la hauteur : on ne parcourt pas
    // un monde en faisant défiler. Le bandeau reste en tête, le reste se
    // répartit en deux colonnes qui défilent chacune de leur côté si besoin.
    <main className="flex flex-col gap-5 px-5 py-6 lg:h-[calc(100dvh-3.5rem)] lg:gap-4 lg:overflow-hidden lg:py-5">
      {veille}

      <BandeauUnivers univers={vues} actif={actif} />

      {/* Ce qui attend ICI, nomme. Une pastille annonce un nombre : elle ne
          dit pas ce qu'on vient faire. */}
      <AttenteIci
        motifs={iciEvts.map((x) => x.motif)}
        href={iciEvts[0]?.href ?? null}
        calme={CALME[actif]}
      />

      {/* Les notifications de cet univers seulement : les memes partout ne
          voulaient plus rien dire. */}
      {notifsIci.length > 0 && (
        <Notifications
          notifs={notifsIci.map((n) => ({ id: n.id, title: n.title, body: n.body, href: n.href }))}
        />
      )}

      <div className="flex min-h-0 flex-col gap-5 lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-start lg:gap-5 lg:overflow-hidden [&>*]:min-w-0 lg:[&>*]:max-h-full lg:[&>*]:overflow-y-auto">
      {/* ─────────── La Source : le chemin, et la plongée ─────────── */}
      {actif === "source" && (
        <>
          <Frise etapes={contenu.etapes} />
          <Outil
            nom="La plongée"
            quoi="AMANA relit ce que tu as déposé et te renvoie des hypothèses sur ce que tu portes sans le voir. Tu restes le seul juge."
            attente={
              compte.source > 0
                ? (raisonPlongee ?? null)
                : "Quatre terrains, une dizaine de minutes. Ce que tu reconnais est retenu."
            }
            cta={compte.source > 0 ? "Reprendre" : "Plonger"}
            href="/deepdive"
            icone={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              </svg>
            }
          />
        </>
      )}

      {/* ─────────── Build : l'action, les projets, le déprocrastinateur ─────────── */}
      {actif === "build" && (
        <>
          <Intention
            intention={
              intention
                ? { id: intention.id, title: intention.title, done: intention.status === "DONE" }
                : null
            }
          />
          {/* Ce qui reste a mener aujourd'hui. Son absence etait un oubli :
              l'intention demandait une nouvelle action sans jamais montrer
              celles qui attendaient deja. */}
          {contenu.actions.length > 0 && (
            <Actions actions={contenu.actions} cochable />
          )}
          <ProjetsBuild actifs={lignesProjets} autres={autresProjets} />
          <Outil
            nom="Le déprocrastinateur"
            quoi="Une action qui ne bouge pas n'a pas besoin d'être redécoupée mais comprise. On cherche la nature du blocage, puis on sort par une action réduite ou par un abandon assumé."
            attente={
              bloquee
                ? `« ${bloquee.title} » attend depuis ${Math.floor(
                    (Date.now() - bloquee.createdAt.getTime()) / 86_400_000,
                  )} jours.`
                : "Rien ne traîne en ce moment. Reviens quand quelque chose coince."
            }
            cta={bloquee ? "Débloquer" : "En parler quand même"}
            href={bloquee ? `/conversation?mode=sonde&tache=${bloquee.id}` : "/conversation?mode=sonde"}
            icone={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h9M11 8l4 4-4 4M17 4v16" />
              </svg>
            }
          />
        </>
      )}

      {/* ─────────── Align : les bilans, le blocage, l'année ─────────── */}
      {actif === "align" && (
        <>
          <RangeeObjets libelle={contenu.libelleObjets} objets={contenu.objets} />
          {/* Les cinq regles : les conditions qui rendent le reste possible.
              Elles vivent ici parce que c'est ou se mesure la constance, et
              que le bilan du soir les passe en revue. */}
          <Regles regles={regles} />
          <Outil
            nom="Mon blocage actuel"
            quoi="On ne cherche pas une tâche coincée, mais le schéma qui se répète au-dessus. Une hypothèse à la fois, ton verdict fait autorité, et on sort par le plus petit levier qui le déplace."
            attente={
              dormants > 0
                ? `${dormants} projet${dormants > 1 ? "s" : ""} actif${dormants > 1 ? "s" : ""} sans mouvement depuis plus de trois semaines.`
                : null
            }
            cta="Regarder ce qui revient"
            href="/conversation?mode=blocage"
            icone={
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20c2-6 6-9 8-11M20 4c-2 6-6 9-8 11" />
                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              </svg>
            }
          />
          <ObjectifsAnnee
            objectifs={objectifsAnnee.map((o) => ({ id: o.id, label: o.label, why: o.why }))}
            annee={new Date().getFullYear()}
          />
        </>
      )}
      </div>
    </main>
  );
}
