"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marquerNotificationLue } from "@/lib/actions";

export type Notif = { id: string; title: string; body: string; href: string | null };

/** Les signaux non lus, dans l'app — une carte sobre, refermable d'un geste. */
export function Notifications({ notifs }: { notifs: Notif[] }) {
  const router = useRouter();
  const [masquees, setMasquees] = useState<string[]>([]);
  const [, start] = useTransition();

  const visibles = notifs.filter((n) => !masquees.includes(n.id));
  if (visibles.length === 0) return null;

  function fermer(id: string) {
    setMasquees((m) => [...m, id]);
    start(async () => {
      await marquerNotificationLue(id);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-2">
      {visibles.map((n) => (
        <div
          key={n.id}
          className="step-enter flex items-start gap-3 rounded-[18px] border border-gold/30 bg-surface p-4"
        >
          <span className="mt-1 h-2 w-2 flex-none rounded-full bg-gold" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
              {n.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{n.body}</p>
            {n.href && (
              <a
                href={n.href}
                onClick={() => fermer(n.id)}
                className="mt-2 inline-block text-xs font-semibold text-gold-deep underline-offset-4 hover:underline"
              >
                Y aller →
              </a>
            )}
          </div>
          <button
            onClick={() => fermer(n.id)}
            aria-label="Masquer"
            className="press text-ink-faint"
          >
            ✕
          </button>
        </div>
      ))}
    </section>
  );
}
