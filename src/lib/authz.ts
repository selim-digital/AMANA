// Helpers serveur pour protéger les pages et récupérer l'utilisateur courant.
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Renvoie la session ou redirige vers /login si non connecté. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Renvoie la session admin ou redirige (login si anonyme, dashboard si non-admin). */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/aujourdhui");
  return session;
}
