"use client";

import { useEffect, useState } from "react";
import { AmanaMark } from "@/components/AmanaMark";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED = "amana.install.dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Déjà installée, ou invitation déjà écartée → on ne redemande pas.
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(DISMISSED) === "1";
    if (installed || dismissed) return;

    // Enregistrement du service worker (condition d'installabilité).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Android/.test(ua);

    if (isIos && isSafari) {
      setIos(true);
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }

    // Android / Chrome : on capture l'invitation native.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function close() {
    localStorage.setItem(DISMISSED, "1");
    setOpen(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    close();
  }

  if (!open) return null;

  return (
    <div className="sheet-enter fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-[22px] border border-ink/10 bg-surface p-4 shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
      <div className="flex items-start gap-3">
        <AmanaMark className="h-10 w-10 flex-none" />
        <div className="flex-1">
          <p className="font-semibold">Garde AMANA à portée de main</p>
          {ios ? (
            <p className="mt-1 text-sm text-ink-soft">
              Appuie sur <b>Partager</b> <span aria-hidden>􀈂</span> en bas de Safari, puis choisis{" "}
              <b>« Sur l&apos;écran d&apos;accueil »</b>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">
              Installe-la sur ton téléphone : elle s&apos;ouvre en plein écran, comme une vraie
              application.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {!ios && (
              <button
                onClick={install}
                className="press rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#12100D]"
              >
                Installer
              </button>
            )}
            <button
              onClick={close}
              className="press rounded-full border border-ink/15 px-5 py-2.5 text-xs font-semibold text-ink-soft"
            >
              {ios ? "J'ai compris" : "Plus tard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
