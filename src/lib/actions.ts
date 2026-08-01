"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

async function logEvent(userId: string, type: string, payload?: Record<string, unknown>) {
  await prisma.event
    .create({
      data: { userId, type, payload: (payload ?? Prisma.JsonNull) as Prisma.InputJsonValue },
    })
    .catch(() => {});
}

// ─────────────────────────── Onboarding ───────────────────────────

export type OnboardingInput = {
  prenom: string;
  situation?: string;
  vision?: string;
  domaines?: string[];
  projets?: string;
  charge?: string;
  style?: string;
  disc?: string[];
  motivation?: string;
  porte?: string;
};

export async function saveOnboarding(input: OnboardingInput) {
  const userId = await requireUserId();

  // Le prénom devient le nom affiché s'il n'est pas déjà défini.
  if (input.prenom?.trim()) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: input.prenom.trim() },
    });
  }

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      situation: input.situation,
      vision: input.vision,
      domaines: input.domaines ?? [],
      style: input.style,
      motivation: input.motivation,
      disc: { reponses: input.disc ?? [], charge: input.charge ?? null },
    },
    update: {
      situation: input.situation,
      vision: input.vision,
      domaines: input.domaines ?? [],
      style: input.style,
      motivation: input.motivation,
      disc: { reponses: input.disc ?? [], charge: input.charge ?? null },
    },
  });

  await logEvent(userId, "onboarding_completed", {
    domaines: input.domaines,
    porte: input.porte,
  });

  revalidatePath("/aujourdhui");
}

// ─────────────────────────── Décharge mentale ───────────────────────────

export type ProjetPropose = {
  nom: string;
  vision?: string;
  objectif?: string;
  domaine?: string;
  prochaineAction?: string;
  echeance?: string;
};

export type TachePropose = {
  titre: string;
  kind: "tache" | "rappel" | "decision";
  projet?: string;
  echeance?: string;
};

const KIND = { tache: "TASK", rappel: "REMINDER", decision: "DECISION" } as const;

export async function commitDecharge(projets: ProjetPropose[], taches: TachePropose[]) {
  const userId = await requireUserId();

  const existants = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, status: true },
  });
  let actifs = existants.filter((p) => p.status === "ACTIVE").length;

  // Nom de projet → identifiant, pour rattacher les tâches.
  const parNom = new Map(existants.map((p) => [p.name.toLowerCase(), p.id]));

  for (const p of projets) {
    if (parNom.has(p.nom.toLowerCase())) continue; // déjà présent : on ne duplique pas

    // Règle produit : au-delà de 3 projets actifs, le suivant part en boîte à idées.
    const status = actifs < 3 ? "ACTIVE" : "IDEA";
    if (status === "ACTIVE") actifs += 1;

    const cree = await prisma.project.create({
      data: {
        userId,
        name: p.nom,
        status,
        vision: p.vision || null,
        objective: p.objectif || null,
        domain: p.domaine || null,
      },
    });
    parNom.set(p.nom.toLowerCase(), cree.id);
    await logEvent(userId, "project_created", { status, domaine: p.domaine });

    // La prochaine action devient une vraie tâche rattachée au projet.
    if (p.prochaineAction) {
      await prisma.task.create({
        data: {
          userId,
          projectId: cree.id,
          title: p.prochaineAction,
          kind: "TASK",
          priority: "ESSENTIAL",
        },
      });
      await logEvent(userId, "task_created", { kind: "TASK", source: "prochaine_action" });
    }
  }

  for (const t of taches) {
    const projectId = t.projet ? (parNom.get(t.projet.toLowerCase()) ?? null) : null;
    await prisma.task.create({
      data: { userId, projectId, title: t.titre, kind: KIND[t.kind] ?? "TASK" },
    });
    await logEvent(userId, "task_created", { kind: KIND[t.kind] ?? "TASK" });
  }

  await logEvent(userId, "braindump_completed", {
    projets: projets.length,
    taches: taches.length,
  });
  revalidatePath("/aujourdhui");
  revalidatePath("/projets");
  revalidatePath("/chemin");
}

// ─────────────────────────── Tâches ───────────────────────────

export async function toggleTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;
  const done = task.status !== "DONE";
  await prisma.task.update({
    where: { id: taskId },
    data: { status: done ? "DONE" : "TODO" },
  });
  if (done) await logEvent(userId, "task_done", {});
  revalidatePath("/aujourdhui");
}

// ─────────────────────────── Depuis la conversation ───────────────────────────

/** L'action décidée en conversation, validée d'un geste par la personne. */
export async function creerActionDepuisChat(
  titre: string,
  projectId?: string,
  quand?: "aujourd'hui" | "demain" | "cette semaine",
) {
  const userId = await requireUserId();
  const jours = quand === "demain" ? 1 : quand === "cette semaine" ? 5 : 0;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + jours);
  dueAt.setHours(18, 0, 0, 0);

  await prisma.task.create({
    data: {
      userId,
      projectId: projectId ?? null,
      title: titre,
      kind: "TASK",
      priority: jours === 0 ? "ESSENTIAL" : "NORMAL",
      dueAt,
    },
  });
  await logEvent(userId, "task_created", { source: "conversation", quand });
  revalidatePath("/aujourdhui");
  revalidatePath("/projets");
}

// ─────────────────────────── Lecture de la personne ───────────────────────────

/** Enregistre une réponse de profil (DISC, WPMOT ou ÉGO), au fil de l'eau. */
export async function repondreProfil(cle: "disc" | "wpmot" | "ego", questionId: string, axe: string) {
  const userId = await requireUserId();
  const profil = await prisma.profile.findUnique({ where: { userId } });
  if (!profil) return;

  const actuel = (profil[cle] as Record<string, unknown> | null) ?? {};
  const maj = { ...actuel, [questionId]: axe };

  await prisma.profile.update({
    where: { userId },
    data: { [cle]: maj as Prisma.InputJsonValue },
  });
  await logEvent(userId, "profil_reponse", { instrument: cle, question: questionId });
  revalidatePath("/aujourdhui");
  revalidatePath("/profil");
}

// ─────────────────────────── Projets ───────────────────────────

export type ProjetMaj = {
  id: string;
  name?: string;
  vision?: string | null;
  objective?: string | null;
  domain?: string | null;
  status?: "ACTIVE" | "SECONDARY" | "WAITING" | "IDEA" | "ARCHIVED";
};

export async function updateProject(p: ProjetMaj) {
  const userId = await requireUserId();
  const projet = await prisma.project.findFirst({ where: { id: p.id, userId } });
  if (!projet) return;

  // Règle produit : pas plus de 3 projets actifs.
  if (p.status === "ACTIVE" && projet.status !== "ACTIVE") {
    const actifs = await prisma.project.count({
      where: { userId, deletedAt: null, status: "ACTIVE" },
    });
    if (actifs >= 3) {
      return { error: "Trois projets actifs au maximum. Déclasse-en un d'abord." };
    }
  }

  await prisma.project.update({
    where: { id: p.id },
    data: {
      name: p.name?.trim() || projet.name,
      vision: p.vision !== undefined ? p.vision || null : undefined,
      objective: p.objective !== undefined ? p.objective || null : undefined,
      domain: p.domain !== undefined ? p.domain || null : undefined,
      status: p.status ?? undefined,
    },
  });
  await logEvent(userId, "project_updated", { status: p.status });
  revalidatePath("/projets");
  revalidatePath("/aujourdhui");
  revalidatePath("/chemin");
}

export async function deleteProject(id: string) {
  const userId = await requireUserId();
  const projet = await prisma.project.findFirst({ where: { id, userId } });
  if (!projet) return;
  await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  await logEvent(userId, "project_deleted", {});
  revalidatePath("/projets");
  revalidatePath("/aujourdhui");
  revalidatePath("/chemin");
}

/** Enregistre le nouvel ordre après un glisser-déposer. */
export async function reorderProjects(ids: string[]) {
  const userId = await requireUserId();
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.project.updateMany({ where: { id, userId }, data: { order: i } }),
    ),
  );
  revalidatePath("/projets");
  revalidatePath("/chemin");
}

// ─────────────────────────── DeepDive ───────────────────────────

/** Le verdict de la personne sur une hypothèse : elle seule tranche. */
export async function rendreVerdict(
  signalId: string,
  verdict: "VALIDE" | "NUANCE" | "INVALIDE",
  verbatim?: string,
) {
  const userId = await requireUserId();
  const signal = await prisma.signal.findFirst({
    where: { id: signalId, session: { userId } },
  });
  if (!signal) return;

  await prisma.signal.update({
    where: { id: signalId },
    data: { verdict, verbatim: verbatim?.trim() || null },
  });
  await logEvent(userId, "deepdive_verdict", { verdict, niveau: signal.niveau });

  // Ce qu'elle reconnaît d'elle-même vaut plus que tout ce qu'on déduit :
  // ça entre en mémoire durable, et toutes les surfaces IA le verront.
  if (verdict !== "INVALIDE") {
    const { memoriser } = await import("@/lib/ia/memoire");
    await memoriser(
      userId,
      `${verdict === "VALIDE" ? "Elle a reconnu" : "Elle a nuancé"} : ${signal.hypothese}${
        verbatim?.trim() ? ` — dans ses mots : « ${verbatim.trim()} »` : ""
      }`,
      "LEARNING",
      "plongee",
    );
  }
  revalidatePath("/deepdive");
}

/** Descendre d'un niveau : on change de terrain, pas d'intensité. */
export async function descendreNiveau(sessionId: string) {
  const userId = await requireUserId();
  const s = await prisma.deepDiveSession.findFirst({ where: { id: sessionId, userId } });
  if (!s || s.niveau >= 4) return;

  await prisma.deepDiveSession.update({
    where: { id: sessionId },
    data: { niveau: s.niveau + 1 },
  });
  revalidatePath("/deepdive");
}

/** Clore la plongée — l'analyse s'arrête à la porte de l'intériorité. */
export async function cloturerPlongee(sessionId: string) {
  const userId = await requireUserId();
  await prisma.deepDiveSession.updateMany({
    where: { id: sessionId, userId },
    data: { status: "close", closedAt: new Date() },
  });
  await logEvent(userId, "deepdive_close", {});
  revalidatePath("/deepdive");
}

// ─────────────────────────── Notifications ───────────────────────────

export async function marquerNotificationLue(id: string) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  revalidatePath("/aujourdhui");
}

/** Couper ou rétablir les rappels par email. */
export async function reglerNotificationsEmail(actif: boolean) {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { notifyEmail: actif } });
  revalidatePath("/profil");
}

// ─────────────────── Objectifs de l'année & OKR ───────────────────

/** Le trimestre courant, au format « 2026-Q3 » (interne : ce fichier n'exporte
 *  que des actions serveur asynchrones). */
function trimestreCourant(d = new Date()) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/** Les 3 objectifs qui donneront le sentiment d'une année accomplie. */
export async function definirObjectifsAnnee(objectifs: { label: string; why?: string }[]) {
  const userId = await requireUserId();
  const year = new Date().getFullYear();

  await prisma.annualGoal.deleteMany({ where: { userId, year } });
  await prisma.annualGoal.createMany({
    data: objectifs
      .filter((o) => o.label.trim())
      .slice(0, 3)
      .map((o, i) => ({ userId, year, label: o.label.trim(), why: o.why?.trim() || null, order: i })),
  });

  await logEvent(userId, "annual_goals_set", { year, n: objectifs.length });
  revalidatePath("/aujourdhui");
}

/** Pose un cap trimestriel sur un projet : un objectif, jusqu'à 3 résultats clés. */
export async function definirOkr(
  projectId: string,
  objective: string,
  keyResults: { label: string; target?: string }[],
  period = trimestreCourant(),
) {
  const userId = await requireUserId();
  const projet = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!projet) return;

  const existant = await prisma.okr.findUnique({
    where: { projectId_period: { projectId, period } },
  });
  if (existant) await prisma.okr.delete({ where: { id: existant.id } });

  await prisma.okr.create({
    data: {
      projectId,
      period,
      objective: objective.trim(),
      keyResults: {
        create: keyResults
          .filter((k) => k.label.trim())
          .slice(0, 3)
          .map((k, i) => ({ label: k.label.trim(), target: k.target?.trim() || null, order: i })),
      },
    },
  });

  await logEvent(userId, "okr_defined", { projectId, period });
  revalidatePath("/projets");
  revalidatePath("/aujourdhui");
}

/** Le point de la semaine sur un résultat clé. */
export async function pointerResultat(keyResultId: string, value: number, note?: string) {
  const userId = await requireUserId();

  // Lundi de la semaine courante.
  const d = new Date();
  const jour = (d.getDay() + 6) % 7;
  const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate() - jour);

  await prisma.weeklyCheck.upsert({
    where: { keyResultId_weekOf: { keyResultId, weekOf: lundi } },
    create: { keyResultId, weekOf: lundi, value, note: note?.trim() || null },
    update: { value, note: note?.trim() || null },
  });
  await prisma.keyResult.update({ where: { id: keyResultId }, data: { current: value } });

  await logEvent(userId, "kpi_checked", { keyResultId, value });
  revalidatePath("/projets");
}

/** Décale un projet qui n'a pas de cap : mieux vaut l'assumer que le laisser traîner. */
export async function decalerProjet(projectId: string) {
  const userId = await requireUserId();
  await prisma.project.updateMany({
    where: { id: projectId, userId },
    data: { status: "WAITING" },
  });
  await logEvent(userId, "project_postponed", { projectId, raison: "sans_okr" });
  revalidatePath("/projets");
  revalidatePath("/aujourdhui");
}

// ─────────────────────────── Compte ───────────────────────────

export async function deleteAccount() {
  const userId = await requireUserId();
  await prisma.user.delete({ where: { id: userId } }); // cascade Prisma
  redirect("/login");
}

// ─────────────────────────── Lecture pour /chemin ───────────────────────────

export type CheminData = {
  vision: string | null;
  values: string[];
  objectifsAnnee: string[];
  taskCount: number;
  projects: {
    id: string;
    name: string;
    status: string;
    progress: number;
    objective: string | null;
    vision: string | null;
  }[];
};

export async function getCheminData(): Promise<CheminData> {
  const userId = await requireUserId();
  const [profile, projects, taskCount, valeurs, objectifs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.project.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.count({ where: { userId, deletedAt: null } }),
    prisma.value.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { label: true },
    }),
    prisma.annualGoal.findMany({
      where: { userId, year: new Date().getFullYear() },
      orderBy: { order: "asc" },
      select: { label: true },
    }),
  ]);
  return {
    vision: profile?.vision ?? null,
    values: valeurs.map((v) => v.label),
    objectifsAnnee: objectifs.map((o) => o.label),
    taskCount,
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      objective: p.objective,
      vision: p.vision,
    })),
  };
}

// ─────────────────────────── Valeurs ───────────────────────────

/** Ajoute une valeur cardinale. Le chat écrit aussi ici : même source, même vérité. */
export async function ajouterValeur(label: string) {
  const userId = await requireUserId();
  const propre = label.trim();
  if (propre.length < 2 || propre.length > 60) return;
  const deja = await prisma.value.findFirst({
    where: { userId, label: { equals: propre, mode: "insensitive" } },
  });
  if (deja) return;
  await prisma.value.create({ data: { userId, label: propre } });
  await logEvent(userId, "value_added", { source: "profil" });
  revalidatePath("/profil");
  revalidatePath("/chemin");
}

export async function supprimerValeur(id: string) {
  const userId = await requireUserId();
  await prisma.value.deleteMany({ where: { id, userId } });
  revalidatePath("/profil");
  revalidatePath("/chemin");
}

// ─────────────────────────── L'intention du jour ───────────────────────────

/**
 * « Si tu ne devais faire qu'UNE chose aujourd'hui, qu'est-ce que ce serait ? »
 *
 * Y répondre est le geste le plus structurant de la journée : accomplir sa
 * mission principale enclenche le reste. L'intention devient donc une vraie
 * action — datée, cochable — et non une phrase décorative.
 */
export async function definirIntention(texte: string) {
  const userId = await requireUserId();
  const titre = texte.trim();
  if (titre.length < 3 || titre.length > 200) return;

  const debut = new Date();
  debut.setHours(0, 0, 0, 0);

  // Une seule intention par jour : la nouvelle remplace celle qu'on redéfinit.
  const deja = await prisma.task.findFirst({
    where: { userId, deletedAt: null, intentionDu: { gte: debut } },
    orderBy: { createdAt: "desc" },
  });

  const dueAt = new Date();
  dueAt.setHours(18, 0, 0, 0);

  if (deja && deja.status !== "DONE") {
    await prisma.task.update({ where: { id: deja.id }, data: { title: titre } });
  } else {
    await prisma.task.create({
      data: {
        userId,
        title: titre,
        kind: "TASK",
        priority: "ESSENTIAL",
        intentionDu: new Date(),
        dueAt,
      },
    });
    await logEvent(userId, "intention_definie", {});
  }
  revalidatePath("/aujourdhui");
}
