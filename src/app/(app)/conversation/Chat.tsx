"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { creerActionDepuisChat } from "@/lib/actions";
import { preparerFichier, type PieceJointe } from "@/lib/fichiers";

type Msg = { role: "user" | "assistant"; content: string };
type Historique = { id: string; title: string; projet: string | null; nb: number; date: string };
type Cadrage = { titre: string; sousTitre: string; ouverture: string; amorces: string[] };
type Sujet = { projet?: string; tache?: string; etape?: string; mode?: string };

/** Détecte la proposition d'action dans la réponse (l'IA annonce, l'UI valide). */
function actionProposee(texte: string): { titre: string; projet?: string } | null {
  const m = texte.match(/«\s*([^»]{6,120})\s*»/);
  if (!m) return null;
  const avant = texte.slice(0, m.index ?? 0).toLowerCase();
  if (!/(propos|action|valider|juste en dessous|ajouter)/.test(avant)) return null;
  return { titre: m[1].trim() };
}

export function Chat({
  cadrage,
  sujet,
  projetLie,
  conversationId,
  messagesInitiaux,
  historique,
}: {
  cadrage: Cadrage;
  sujet: Sujet;
  projetLie: { id: string; name: string } | null;
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
  const [ajoutee, setAjoutee] = useState<string | null>(null);
  const [pieces, setPieces] = useState<PieceJointe[]>([]);
  const [texteJoint, setTexteJoint] = useState("");
  const [refus, setRefus] = useState<string | null>(null);
  const [attenteLongue, setAttenteLongue] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: content + texteJoint }];
    setMessages(next);
    setInput("");
    setBusy(true);
    // Au-delà de six secondes, on dit ce qui se passe : une attente muette inquiète.
    const minuteur = setTimeout(() => setAttenteLongue(true), 6000);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, conversationId: convId, fichiers: pieces, ...sujet }),
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
      clearTimeout(minuteur);
      setAttenteLongue(false);
      setBusy(false);
      setPieces([]);
      setTexteJoint("");
    }
  }

  /** Prépare les fichiers choisis : images et PDF transmis tels quels,
   *  texte intégré au message, le reste refusé avec une explication. */
  async function joindre(liste: FileList | null) {
    if (!liste) return;
    setRefus(null);
    for (const f of Array.from(liste)) {
      const r = await preparerFichier(f);
      if (!r.ok) {
        setRefus(r.raison);
        continue;
      }
      if (r.piece) setPieces((ps) => [...ps, r.piece!]);
      if (r.texte) {
        setTexteJoint((t) => t + r.texte!);
        setPieces((ps) => [...ps, { nom: f.name, type: "text/plain", donnees: "" }]);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const derniere = messages[messages.length - 1];
  const proposition =
    derniere?.role === "assistant" && !busy ? actionProposee(derniere.content) : null;

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col lg:h-[calc(100dvh-3rem)]">
      <header className="flex items-center gap-3 border-b border-ink/10 px-5 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="voice-amana text-lg leading-tight">{cadrage.titre}</h1>
          {projetLie ? (
            <Link href="/projets" className="truncate text-xs font-semibold text-gold-deep hover:underline">
              {projetLie.name} →
            </Link>
          ) : (
            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {cadrage.sousTitre}
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
            href="/conversation"
            className="press rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-paper"
          >
            Nouveau
          </Link>
        )}
      </header>

      {voirHistorique && (
        <div className="step-enter scroll-soft max-h-64 overflow-y-auto border-b border-ink/10 bg-surface-2/60 px-5 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Tes échanges
          </p>
          <ul className="flex flex-col gap-1.5">
            {historique.map((h) => (
              <li key={h.id}>
                <Link href={`/conversation?c=${h.id}`} className="press block rounded-[14px] bg-surface px-3.5 py-2.5">
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
            <p className="voice-amana text-center text-lg text-ink-soft">{cadrage.ouverture}</p>
            {cadrage.amorces.map((a, i) => (
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
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="nudge inline-block h-1.5 w-1.5 rounded-full bg-ink-faint"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </span>
                {/* Une attente muette inquiète : au-delà de six secondes, on dit
                    ce qui se passe. */}
                {attenteLongue && (
                  <span className="step-enter text-xs text-ink-faint">
                    AMANA prend le temps de chercher…
                  </span>
                )}
              </span>
            )}
          </div>
        ))}

        {/* La proposition d'action ne devient réelle que si TU la valides. */}
        {proposition && !ajoutee && (
          <div className="step-enter rounded-[18px] border border-gold/40 bg-gold-soft p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
              Action proposée
            </span>
            <p className="mt-1 text-[15px] font-semibold">{proposition.titre}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["aujourd'hui", "demain", "cette semaine"] as const).map((quand) => (
                <button
                  key={quand}
                  onClick={() =>
                    start(async () => {
                      await creerActionDepuisChat(proposition.titre, projetLie?.id, quand);
                      setAjoutee(proposition.titre);
                      router.refresh();
                    })
                  }
                  className="press rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#12100D]"
                >
                  {quand}
                </button>
              ))}
              <button
                onClick={() => setAjoutee(proposition.titre)}
                className="press rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink-soft"
              >
                Pas maintenant
              </button>
            </div>
          </div>
        )}

        {ajoutee && (
          <p className="step-enter text-center text-xs text-gold-deep">
            Ajouté à tes priorités. Tu le retrouveras dans « Aujourd&apos;hui ».
          </p>
        )}

        <div ref={endRef} />
      </div>

      {/* Ce qui est joint, et pourquoi un fichier a été refusé. */}
      {(pieces.length > 0 || refus) && (
        <div className="step-enter flex flex-col gap-2 border-t border-ink/10 px-4 pt-3">
          {pieces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pieces.map((f, n) => (
                <span key={n} className="flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs">
                  {f.nom}
                  <button
                    type="button"
                    onClick={() => setPieces((ps) => ps.filter((_, k) => k !== n))}
                    aria-label={`Retirer ${f.nom}`}
                    className="text-ink-faint"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          {refus && <p className="text-xs text-[#B8543F]">{refus}</p>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-ink/10 px-4 py-3"
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => joindre(e.target.files)}
          accept="image/*,application/pdf,text/*,.md,.csv,.json,.yml,.yaml,.log"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Joindre un fichier"
          className="press flex h-11 w-11 flex-none items-center justify-center rounded-full border border-ink/15 text-ink-soft"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l8.49-8.49a3.67 3.67 0 1 1 5.18 5.18l-8.49 8.49a1.83 1.83 0 1 1-2.6-2.6l7.79-7.78" />
          </svg>
        </button>
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
