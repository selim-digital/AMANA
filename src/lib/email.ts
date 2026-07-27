// Envoi d'emails transactionnels via Resend (hors lien magique NextAuth).
import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "AMANA <onboarding@resend.dev>";

function client() {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return null;
  return new Resend(key);
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
