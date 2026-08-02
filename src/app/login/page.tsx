"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";

type Mode = "signin" | "signup";
type EmailMethod = "magic" | "password";

const CALLBACK = "/aujourdhui";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<EmailMethod>("magic");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Inscription impossible.");
        }
        const r = await signIn("credentials", { email, password, redirect: false });
        if (r?.error) throw new Error("Compte créé, mais connexion impossible. Réessaie.");
        window.location.href = CALLBACK;
        return;
      }

      // mode === "signin"
      if (method === "magic") {
        const r = await signIn("resend", { email, redirect: false, callbackUrl: CALLBACK });
        if (r?.error) throw new Error("Envoi impossible. Vérifie ton email.");
        setMagicSent(true);
        return;
      }

      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.error) throw new Error("Email ou mot de passe incorrect.");
      window.location.href = CALLBACK;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (magicSent) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <AmanaMark eveil className="h-14 w-14" />
        <div className="step-enter flex max-w-sm flex-col gap-3 rounded-[22px] bg-surface p-6 text-center">
          <h1 className="voice-amana text-xl">Ton lien de connexion arrive.</h1>
          <p className="text-sm text-ink-soft">
            Ouvre l&apos;email envoyé à <b>{email}</b> et clique sur le lien pour entrer. Tu peux
            fermer cette page.
          </p>
          <button
            onClick={() => setMagicSent(false)}
            className="text-sm text-ink-faint underline-offset-4 hover:underline"
          >
            Utiliser une autre méthode
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-12">
      <div className="enter flex flex-col items-center gap-3 text-center">
        <AmanaMark eveil className="h-14 w-14" />
        <Wordmark />
        <p className="voice-amana max-w-xs text-lg text-ink-soft">Décharger. Clarifier. Avancer.</p>
      </div>

      <div className="enter flex w-full max-w-sm flex-col gap-3" style={{ "--i": 1 } as React.CSSProperties}>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: CALLBACK })}
          className="press rounded-full border border-ink/20 bg-surface px-6 py-3 text-sm font-semibold"
        >
          Continuer avec Google
        </button>

        <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-faint">
          <span className="h-px flex-1 bg-ink/10" />
          ou par email
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prénom"
              className="rounded-full border border-ink/20 bg-surface px-5 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            className="rounded-full border border-ink/20 bg-surface px-5 py-3 text-sm outline-none transition-colors focus:border-gold"
          />

          {(mode === "signup" || method === "password") && (
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Choisis un mot de passe (8+)" : "Mot de passe"}
              className="rounded-full border border-ink/20 bg-surface px-5 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          )}

          {error && <p className="step-enter px-2 text-sm text-[#B8543F]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="press rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
          >
            {busy
              ? "…"
              : mode === "signup"
                ? "Créer mon compte"
                : method === "magic"
                  ? "Recevoir mon lien"
                  : "Se connecter"}
          </button>
        </form>

        {mode === "signin" && (
          <div className="flex items-center justify-between px-2 text-xs text-ink-faint">
            <button
              onClick={() => {
                setMethod((m) => (m === "magic" ? "password" : "magic"));
                setError(null);
              }}
              className="underline-offset-4 hover:underline"
            >
              {method === "magic" ? "Utiliser un mot de passe" : "Recevoir un lien de connexion"}
            </button>
            {method === "password" && (
              <Link href="/forgot-password" className="underline-offset-4 hover:underline">
                Mot de passe oublié ?
              </Link>
            )}
          </div>
        )}

        <p className="mt-1 text-center text-sm text-ink-soft">
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
            }}
            className="font-semibold text-gold-deep underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>

        <p className="mt-1 text-center text-xs text-ink-faint">
          Tes données restent les tiennes — hébergées en Europe, supprimables à tout moment.
        </p>
      </div>
    </main>
  );
}
