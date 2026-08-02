"use client";

import { useEffect, useState } from "react";

/**
 * L'activation des notifications.
 *
 * On ne demande jamais l'autorisation à l'arrivée : une permission réclamée
 * avant d'avoir rendu le moindre service se refuse, et un refus est définitif
 * — le navigateur ne redemandera plus. On propose donc explicitement, depuis
 * le profil, une fois que la personne sait ce qu'AMANA lui apporte.
 */

/** La clé publique VAPID doit voyager en octets jusqu'au navigateur. */
function versOctets(base64: string) {
  const complet = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const brut = atob(complet);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

export function ActiverPush({ clePublique }: { clePublique: string | null }) {
  const [etat, setEtat] = useState<"inconnu" | "absent" | "refuse" | "actif" | "possible">(
    "inconnu",
  );
  const [encours, setEncours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!clePublique || typeof window === "undefined") return setEtat("absent");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEtat("absent");
    if (Notification.permission === "denied") return setEtat("refuse");

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "actif" : "possible"))
      .catch(() => setEtat("possible"));
  }, [clePublique]);

  async function activer() {
    if (!clePublique) return;
    setEncours(true);
    setErreur(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refuse" : "possible");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: versOctets(clePublique),
      });
      const res = await fetch("/api/abonnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("L'abonnement n'a pas été enregistré.");
      setEtat("actif");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'activation a échoué.");
    } finally {
      setEncours(false);
    }
  }

  async function couper() {
    setEncours(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/abonnement", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEtat("possible");
    } catch {
      setErreur("Impossible de couper les notifications.");
    } finally {
      setEncours(false);
    }
  }

  if (etat === "inconnu" || etat === "absent") return null;

  return (
    <section className="rounded-[22px] bg-surface p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
        Notifications
      </span>

      {etat === "refuse" ? (
        <p className="mt-2 text-sm text-ink-soft">
          Ton navigateur les a bloquées. Pour les rétablir, autorise les notifications pour AMANA
          dans ses réglages de site — depuis l&apos;application, on ne peut plus te le demander.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {etat === "actif"
              ? "Tu reçois le point de fin de journée sur cet appareil, même sans ouvrir AMANA."
              : "Reçois le point de fin de journée sur cet appareil, même sans ouvrir AMANA. Un envoi par jour au maximum."}
          </p>
          <button
            onClick={etat === "actif" ? couper : activer}
            disabled={encours}
            className={`press mt-4 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-40 ${
              etat === "actif"
                ? "border border-ink/20 text-ink-soft"
                : "bg-gold text-[#12100D]"
            }`}
          >
            {encours ? "…" : etat === "actif" ? "Couper sur cet appareil" : "Activer"}
          </button>
        </>
      )}

      {erreur && <p className="mt-2 text-sm text-[#B8543F]">{erreur}</p>}
    </section>
  );
}
