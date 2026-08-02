import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/email";
import { pousser } from "@/lib/push";

export const maxDuration = 300;

/**
 * Le point de fin de journée.
 *
 * Vers 17 h, AMANA fait le compte : ce qui a été mené, ce qui reste, ce qui
 * demande encore un geste. C'est le seul moment où l'application prend
 * l'initiative de revenir vers la personne pour lui rendre sa journée.
 *
 * Aucun appel au modèle : le texte se calcule à partir des faits. Un envoi
 * quotidien qui coûterait un appel par personne serait le poste le plus cher
 * du produit, pour un contenu que l'arithmétique suffit à écrire.
 */

export async function GET(req: Request) {
  const attendu = process.env.CRON_SECRET;
  if (attendu && req.headers.get("authorization") !== `Bearer ${attendu}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const debutJour = new Date(new Date().setHours(0, 0, 0, 0));

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, notifyEmail: true },
  });

  let creees = 0;
  let envoyees = 0;
  let poussees = 0;

  for (const u of users) {
    const [faites, restantes, intention, aValider] = await Promise.all([
      prisma.task.count({
        where: { userId: u.id, deletedAt: null, status: "DONE", updatedAt: { gte: debutJour } },
      }),
      prisma.task.findMany({
        where: { userId: u.id, deletedAt: null, status: { notIn: ["DONE"] } },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        take: 3,
        select: { title: true },
      }),
      prisma.task.findFirst({
        where: { userId: u.id, deletedAt: null, intentionDu: { gte: debutJour } },
        select: { title: true, status: true },
      }),
      // Les hypothèses de plongée en attente : un geste dû, pas une tâche.
      prisma.signal.count({
        where: { session: { userId: u.id }, verdict: "EN_ATTENTE" },
      }),
    ]);

    // Une journée sans aucune matière ne mérite pas qu'on écrive.
    if (!faites && !restantes.length && !intention && !aValider) continue;

    const prenom = u.name?.trim().split(" ")[0] ?? "toi";
    const lignes: string[] = [];

    if (intention) {
      lignes.push(
        intention.status === "DONE"
          ? `Ton essentiel du jour est fait : « ${intention.title} ».`
          : `Ton essentiel du jour attend encore : « ${intention.title} ».`,
      );
    }

    if (faites) {
      lignes.push(`${faites} action${faites > 1 ? "s" : ""} menée${faites > 1 ? "s" : ""} à son terme aujourd'hui.`);
    } else if (!intention) {
      lignes.push("Rien de coché aujourd'hui — ça arrive, et ça ne se rattrape pas ce soir.");
    }

    if (restantes.length) {
      lignes.push(
        `Il reste : ${restantes.map((t) => `« ${t.title} »`).join(", ")}.`,
      );
    }

    if (aValider) {
      lignes.push(
        `${aValider} hypothèse${aValider > 1 ? "s" : ""} de plongée attend${aValider > 1 ? "ent" : ""} ton verdict.`,
      );
    }

    const titre = intention?.status === "DONE"
      ? "L'essentiel est fait"
      : faites
        ? `${faites} action${faites > 1 ? "s" : ""} menée${faites > 1 ? "s" : ""} aujourd'hui`
        : "Le point de fin de journée";

    const corps = `${prenom},\n\n${lignes.join("\n")}\n\nDeux minutes pour clore ta journée, et demain sera plus clair.`;

    const notif = await prisma.notification.create({
      data: {
        userId: u.id,
        kind: "bilan",
        title: titre,
        body: lignes.join(" "),
        href: "/conversation?mode=bilan",
      },
    });
    creees += 1;

    // La notification poussee atteint qui n'ouvre pas l'application — le seul
    // canal qui vaille le jour ou l'on a oublie AMANA.
    poussees += await pousser(u.id, {
      titre,
      corps: lignes.join(" "),
      href: "/conversation?mode=bilan",
      fil: "bilan",
    });

    // L'email de fin de journée est le seul quotidien : il ne se cumule donc
    // pas avec les relances d'absence, plafonnées ailleurs.
    if (u.notifyEmail && u.email) {
      const ok = await sendNotification(u.email, titre, corps, "/conversation?mode=bilan");
      if (ok) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { emailedAt: new Date() },
        });
        envoyees += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, examines: users.length, creees, envoyees, poussees });
}
