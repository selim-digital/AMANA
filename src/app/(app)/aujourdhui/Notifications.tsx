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
          className="step-enter relative flex items-start gap-3 overflow-hidden rounded-[18px] border-2 border-gold/60 bg-gold-soft p-4 shadow-sm"
        >
          {/* Une notification non lue doit accrocher l'oeil : la pastille
              respire tant qu'on ne l'a pas traitee. */}
          <span className="relative mt-1 flex h-2.5 w-2.5 flex-none items-center justify-center">
            <span className="halo absolute inset-0 rounded-full bg-gold-deep" aria-hidden />
            <span className="relative h-2.5 w-2.5 rounded-full bg-gold-deep" />
          </span>
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
