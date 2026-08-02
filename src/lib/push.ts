import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Les notifications poussées.
 *
 * C'est le seul canal qui atteint quelqu'un qui n'a pas ouvert l'application.
 * Tout le reste — rendez-vous, pastilles, bandeaux — suppose une visite, donc
 * ne sert à rien le jour où l'on oublie AMANA. Or c'est précisément ce jour-là
 * qu'un rappel a de la valeur.
 *
 * Les clés VAPID identifient le serveur auprès des navigateurs. Elles se
 * génèrent une fois : `npx web-push generate-vapid-keys`.
 */

let pret = false;

function configurer() {
  if (pret) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contact@amana-life.app",
    pub,
    priv,
  );
  pret = true;
  return true;
}

export function pushDisponible() {
  return !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
}

export type Poussee = {
  titre: string;
  corps: string;
  href?: string;
  /** Les envois d'un même fil se remplacent au lieu de s'empiler. */
  fil?: string;
};

/**
 * Envoie à tous les appareils d'une personne.
 *
 * Un abonnement peut être devenu invalide — application désinstallée,
 * navigateur réinitialisé. On ne le supprime pas au premier refus (une panne
 * réseau ne vaut pas une désinscription) mais au bout de trois, ou aussitôt
 * si le serveur de poussée le déclare mort (404, 410).
 */
export async function pousser(userId: string, p: Poussee): Promise<number> {
  if (!configurer()) return 0;

  const abonnements = await prisma.abonnement.findMany({ where: { userId } });
  if (!abonnements.length) return 0;

  const charge = JSON.stringify({
    titre: p.titre,
    corps: p.corps,
    href: p.href ?? "/aujourdhui",
    fil: p.fil ?? "amana",
  });

  let envoyees = 0;

  await Promise.all(
    abonnements.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          charge,
        );
        envoyees += 1;
        if (a.echecs) await prisma.abonnement.update({ where: { id: a.id }, data: { echecs: 0 } });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        const mort = code === 404 || code === 410;
        if (mort || a.echecs >= 2) {
          await prisma.abonnement.delete({ where: { id: a.id } }).catch(() => {});
        } else {
          await prisma.abonnement.update({
            where: { id: a.id },
            data: { echecs: { increment: 1 } },
          });
        }
      }
    }),
  );

  return envoyees;
}
