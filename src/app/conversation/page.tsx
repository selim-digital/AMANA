"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/AmanaMark";

type Msg = { role: "user" | "assistant"; content: string };

const amorces = [
  "Je suis perdu, aide-moi à y voir clair",
  "J'ai trop de choses en tête",
  "Je veux clarifier un projet",
];

export default function ConversationPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("réseau");
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
        endRef.current?.scrollIntoView({ block: "end" });
      }
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
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <Link href="/aujourdhui" aria-label="Retour" className="text-ink-soft">←</Link>
        <Wordmark className="text-sm" />
        <span className="w-4" />
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 pt-10">
            <p className="voice-amana text-center text-lg text-ink-soft">
              De quoi as-tu besoin de parler ?
            </p>
            {amorces.map((a) => (
              <button
                key={a}
                onClick={() => send(a)}
                className="rounded-[18px] border border-ink/15 bg-surface px-5 py-3 text-left text-sm text-ink-soft"
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
            {m.content || "…"}
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
          className="flex-1 rounded-full border border-ink/15 bg-surface px-5 py-3 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Envoyer"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
