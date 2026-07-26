"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AmanaMark, Wordmark } from "@/components/AmanaMark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    // Sprint 1 : magic link Supabase branché dès que les clés sont dans .env.local.
    setSent(true);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <AmanaMark className="h-16 w-16" />
        <Wordmark />
        <p className="voice-amana max-w-xs text-lg text-ink-soft">
          Décharger. Clarifier. Avancer.
        </p>
      </div>

      {sent ? (
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-[22px] bg-surface p-6 text-center">
          <p className="voice-amana text-lg">Ton lien de connexion arrive par email.</p>
          <p className="text-sm text-ink-soft">
            La connexion réelle sera active dès le branchement Supabase. En attendant, tu peux
            explorer le parcours :
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#12100D]"
          >
            Continuer la découverte
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
          <button
            type="button"
            className="rounded-full border border-ink/20 bg-surface px-6 py-3 text-sm font-semibold"
          >
            Continuer avec Google
          </button>
          <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-faint">
            <span className="h-px flex-1 bg-ink/10" />
            ou
            <span className="h-px flex-1 bg-ink/10" />
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
            className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#12100D]"
          >
            Recevoir mon lien
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Tes données restent les tiennes — hébergées en Europe, supprimables à tout moment.
          </p>
        </form>
      )}
    </main>
  );
}
