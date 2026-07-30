"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import {
  clearStoredConsent,
  readStoredConsent,
  storeConsent,
  subscribeToConsent,
  type ConsentDecision,
} from "@/lib/consent";

export function CookieBanner() {
  const [showPreferences, setShowPreferences] = useState(false);
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readStoredConsent,
    () => null,
  );

  if (consent && !showPreferences) {
    return null;
  }

  const decide = (decision: ConsentDecision) => {
    storeConsent(decision);
    setShowPreferences(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto w-full max-w-[23rem] rounded-[1.4rem] border border-white/10 bg-[rgba(9,17,26,0.92)] p-4 shadow-2xl backdrop-blur-xl sm:max-w-3xl sm:p-5">
        <div className="max-w-xl">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Cookie e servizi esterni
          </p>
          <p className="mt-2 text-[0.95rem] leading-6 text-[#dbdbd6] sm:text-sm">
            Usiamo una preferenza tecnica per ricordare la tua scelta. I servizi
            esterni restano bloccati fino al consenso.
          </p>
          <p className="mt-3 text-xs leading-5 text-[#b7c0be]">
            <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>
            <span aria-hidden> · </span>
            <Link href="/cookie" className="underline underline-offset-4">Cookie</Link>
          </p>
        </div>
        {showPreferences ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#dbdbd6]">
            <p className="font-medium text-white">Preferenze</p>
            <p className="mt-1 leading-6">La preferenza tecnica locale resta attiva. I servizi esterni, incluso il calendario di prenotazione, si caricano solo con il tuo consenso.</p>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => {
              clearStoredConsent();
              setShowPreferences(true);
            }}
            className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#d6b887] underline underline-offset-4 sm:mr-auto"
          >
            Gestisci preferenze
          </button>
          <button
            type="button"
            onClick={() => decide("accept")}
            className="cta cta-sm min-w-0"
          >
            Accetta
          </button>
          <button
            type="button"
            onClick={() => decide("reject")}
            className="cta cta-sm min-w-0"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  );
}
