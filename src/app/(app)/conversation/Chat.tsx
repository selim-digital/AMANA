"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };
type Historique = { id: string; title: string; projet: string | null; nb: number; date: string };

const AMORCES = [
  "Je suis perdu, aide-moi à y voir clair",
  "J'ai trop de choses en tête",
  "Je bloque sur quelque chose",
];

export function Chat({
  projet,
  conversationId,
  messagesInitiaux,
  historique,
}: {
  projet: { id: string; name: string } | null;
  conversationId?: string;
  messagesInitiaux: Msg[];
  historique: Historique[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(messagesInitiaux);
  const [convId, setConvId] = useState(conversationId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voirHistorique, setVoirHistorique] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, conversationId: convId, projectId: projet?.id }),
      });
      if (!res.ok || !res.body) throw new Error("réseau");

      const id = res.headers.get("X-Conversation-Id");
      if (id && id !== convId) setConvId(id);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const current = acc;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: current }]);
      }
      // Les actions créées pendant l'échange doivent apparaître ailleurs.
      router.refresh();
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "La connexion a échoué — ton message est conservé, tu peux réessayer.",
        },
      ]);
      setInput(content);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col lg:h-[calc(100dvh-3rem)]">
      {/* En-tête : le lien avec le projet est visible en permanence. */}
      <header className="flex items-center gap-3 border-b border-ink/10 px-5 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="voice-amana text-lg leading-tight">
            {projet ? "À propos de ce projet" : "En parler"}
          </h1>
          {projet ? (
            <Link
              href="/projets"
              className="truncate text-xs font-semibold text-gold-deep hover:underline"
            >
              {projet.name} →
            </Link>
          ) : (
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              AMANA connaît tes projets
            </p>
          )}
        </div>

        {historique.length > 0 && (
          <button
            onClick={() => setVoirHistorique((v) => !v)}
            className="press rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink-soft"
          >
            {voirHistorique ? "Fermer" : "Échanges"}
          </button>
        )}
        {messages.length > 0 && (
          <Link
            href={projet ? `/conversation?projet=${projet.id}` : "/conversation"}
            className="press rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-paper"
          >
            Nouveau
          </Link>
        )}
      </header>

      {/* Historique : les échanges passés sont retrouvables. */}
      {voirHistorique && (
        <div className="step-enter scroll-soft max-h-64 overflow-y-auto border-b border-ink/10 bg-surface-2/60 px-5 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Tes échanges
          </p>
          <ul className="flex flex-col gap-1.5">
            {historique.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/conversation?c=${h.id}`}
                  className="press block rounded-[14px] bg-surface px-3.5 py-2.5"
                >
                  <span className="block truncate text-sm">{h.title}</span>
                  <span className="text-xs text-ink-faint">
                    {h.projet ? `${h.projet} · ` : ""}
                    {h.nb} message{h.nb > 1 ? "s" : ""} · {h.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="scroll-soft flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 pt-8">
            <p className="voice-amana text-center text-lg text-ink-soft">
              {projet ? `Où en es-tu sur « ${projet.name} » ?` : "De quoi as-tu besoin de parler ?"}
            </p>
            {AMORCES.map((a, i) => (
              <button
                key={a}
                onClick={() => send(a)}
                style={{ "--i": i } as React.CSSProperties}
                className="press enter rounded-[18px] border border-ink/15 bg-surface px-5 py-3 text-left text-sm text-ink-soft"
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[15px] leading-relaxed ${
              m.role === "user" ? "ml-auto bg-gold-soft" : "bg-surface"
            }`}
          >
            {m.content || (
              <span className="inline-flex gap-1">
                <span className="nudge inline-block h-1.5 w-1.5 rounded-full bg-ink-faint" />
                <span className="nudge inline-block h-1.5 w-1.5 rounded-full bg-ink-faint" style={{ animationDelay: "0.2s" }} />
                <span className="nudge inline-block h-1.5 w-1.5 rounded-full bg-ink-faint" style={{ animationDelay: "0.4s" }} />
              </span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-ink/10 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris librement…"
          className="flex-1 rounded-full border border-ink/15 bg-surface px-5 py-3 text-sm outline-none transition-colors focus:border-gold"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Envoyer"
          className="press flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
