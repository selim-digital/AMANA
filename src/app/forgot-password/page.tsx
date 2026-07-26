"use client";

import { useState } from "react";
import Link from "next/link";
import { AmanaMark } from "@/components/AmanaMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <AmanaMark className="h-14 w-14" />
      {sent ? (
        <div className="flex max-w-sm flex-col gap-3 rounded-[22px] bg-surface p-6 text-center">
          <h1 className="voice-amana text-xl">C&apos;est envoyé.</h1>
          <p className="text-sm text-ink-soft">
            Si un compte existe pour <b>{email}</b>, tu recevras un lien pour choisir un nouveau mot
            de passe (valable 1 heure).
          </p>
          <Link href="/login" className="text-sm text-gold-deep underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <div className="text-center">
            <h1 className="voice-amana text-xl">Mot de passe oublié</h1>
            <p className="mt-1 text-sm text-ink-soft">On t&apos;envoie un lien pour le réinitialiser.</p>
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            className="rounded-full border border-ink/20 bg-surface px-5 py-3 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
          >
            {busy ? "…" : "Envoyer le lien"}
          </button>
          <Link href="/login" className="text-center text-sm text-ink-faint underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </form>
      )}
    </main>
  );
}
