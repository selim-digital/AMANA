"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { deleteAccount } from "@/lib/actions";

export function AccountActions() {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section className="flex flex-col gap-3">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold"
      >
        Se déconnecter
      </button>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="text-center text-sm text-ink-faint underline-offset-4 hover:underline"
        >
          Supprimer mon compte
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-[18px] border border-[#B8543F]/30 bg-surface p-4">
          <p className="text-sm text-ink-soft">
            Cette action supprime définitivement ton compte et toutes tes données. Irréversible.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => start(() => deleteAccount())}
              disabled={pending}
              className="flex-1 rounded-full bg-[#B8543F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
