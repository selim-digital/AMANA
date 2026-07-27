// Next 16 : la convention `middleware.ts` est renommée `proxy.ts` (runtime Node.js).
// NextAuth applique ici le callback `authorized` défini dans src/auth.ts.
export { auth as proxy } from "@/auth";

export const config = {
  // On exclut les assets statiques et les fichiers publics.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
