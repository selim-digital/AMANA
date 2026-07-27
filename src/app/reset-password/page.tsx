"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AmanaMark } from "@/components/AmanaMark";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lien invalide ou expiré.");
    }
  }

  if (!token) {
    return (
      <p className="max-w-sm text-center text-sm text-ink-soft">
        Lien invalide. <Link href="/forgot-password" className="text-gold-deep underline">Redemander un lien</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <div className="flex max-w-sm flex-col gap-3 rounded-[22px] bg-surface p-6 text-center">
        <h1 className="voice-amana text-xl">Mot de passe mis à jour.</h1>
        <Link href="/login" className="text-sm text-gold-deep underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="text-center">
        <h1 className="voice-amana text-xl">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-ink-soft">Choisis un mot de passe (8 caractères minimum).</p>
      </div>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nouveau mot de passe"
        className="rounded-full border border-ink/20 bg-surface px-5 py-3 text-sm outline-none focus:border-gold"
      />
      {error && <p className="px-2 text-sm text-[#B8543F]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#12100D] disabled:opacity-50"
      >
        {busy ? "…" : "Valider"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <AmanaMark className="h-14 w-14" />
      <Suspense fallback={<p className="text-sm text-ink-faint">Chargement…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
