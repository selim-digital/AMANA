// Envoi d'emails transactionnels via Resend (hors lien magique NextAuth).
import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "AMANA <onboarding@resend.dev>";

function client() {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** Un signal envoyé par email — sobre, jamais culpabilisant, toujours désinscriptible. */
export async function sendNotification(
  email: string,
  titre: string,
  corps: string,
  href?: string,
): Promise<boolean> {
  const resend = client();
  const base = process.env.AUTH_URL ?? "https://amana-liard.vercel.app";
  const lien = `${base}${href ?? "/aujourdhui"}`;

  if (!resend) {
    console.warn(`[email] Resend non configuré. Notification pour ${email} : ${titre}`);
    return false;
  }

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: titre,
      text: `${corps}\n\nOuvrir AMANA : ${lien}\n\n—\nTu peux couper ces rappels depuis ton profil.`,
    });
    return true;
  } catch (e) {
    console.error("[email] envoi impossible", e);
    return false;
  }
}

export async function sendPasswordReset(email: string, url: string) {
  const resend = client();
  if (!resend) {
    // En développement sans clé : on trace le lien plutôt que d'échouer.
    console.warn(`[email] Resend non configuré. Lien de réinitialisation : ${url}`);
    return;
  }
  await resend.emails.send({
    from,
    to: email,
    subject: "Réinitialiser ton mot de passe AMANA",
    text: `Tu as demandé à réinitialiser ton mot de passe.\n\nOuvre ce lien (valable 1 heure) :\n${url}\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.`,
  });
}
