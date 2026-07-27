// ════════════════════════════════════════════════════════════════════════════
// AMANA — Configuration NextAuth v5
// Providers : Google (OAuth) · Resend (lien magique) · Credentials (email + mot de passe)
// Persistance : adapter Prisma (Neon) · Sessions : JWT (forcé, requis par Credentials)
// ════════════════════════════════════════════════════════════════════════════

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Routes publiques (accessibles sans être connecté).
const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/scenes",
  "/api/auth",
];
const PUBLIC_EXACT = ["/"];

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // OBLIGATOIRE : avec un adapter, la stratégie par défaut serait "database",
  // ce qui casse le provider Credentials. On force donc "jwt".
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  pages: { signIn: "/login" },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  providers: [
    Google,
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "AMANA <onboarding@resend.dev>",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });

        // Comparaison à temps constant (hash factice si l'utilisateur n'existe pas).
        const dummy = "$2a$12$0000000000000000000000uGHEwFwQGaHGaLOBHbGym.UPbwVOIGG";
        const ok = await bcrypt.compare(parsed.data.password, user?.hashedPassword ?? dummy);

        if (!user || !user.hashedPassword || !ok) return null;

        await prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // À la connexion, on grave id + role dans le token JWT.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },

    // On propage id + role dans la session lue côté app.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role | undefined) ?? "USER";
      }
      return session;
    },

    // Protection des routes (exécutée dans proxy.ts).
    authorized({ auth: session, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isLoggedIn = !!session?.user;
      const isPublic =
        PUBLIC_EXACT.includes(pathname) ||
        PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

      // Déjà connecté sur /login → vers le tableau de bord.
      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/aujourdhui", nextUrl));
      }

      if (isPublic) return true;

      // Non connecté sur une route protégée → login.
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // /admin réservé au rôle ADMIN.
      if (pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
        return Response.redirect(new URL("/aujourdhui", nextUrl));
      }

      return true;
    },
  },
});
