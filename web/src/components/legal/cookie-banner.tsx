"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "hawaii-consent-v1";

async function persistConsent(decision: "accept" | "reject") {
  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, source: "cookie-banner" }),
    });
  } catch {
    // no-op: banner must not break navigation
  }
}

export function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);
  const visible = useSyncExternalStore(
    () => () => undefined,
    () => !window.localStorage.getItem(STORAGE_KEY),
    () => false,
  );

  if (!visible || dismissed) {
    return null;
  }

  const decide = (decision: "accept" | "reject") => {
    window.localStorage.setItem(STORAGE_KEY, decision);
    void persistConsent(decision);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto flex w-full max-w-[23rem] flex-col gap-3 rounded-[1.4rem] border border-white/10 bg-[rgba(9,17,26,0.92)] p-4 shadow-2xl backdrop-blur-xl sm:max-w-3xl sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:p-5">
        <div className="max-w-xl">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Cookie & analytics
          </p>
          <p className="mt-2 text-[0.95rem] leading-6 text-[#d9e2e7] sm:text-sm">
            Usiamo solo strumenti tecnici finché non esprimi una scelta. I cookie di
            misurazione e marketing restano bloccati fino al consenso.
          </p>
        </div>
        <div className="flex gap-2 sm:min-w-[235px] sm:flex-col sm:gap-3">
          <button
            type="button"
            onClick={() => decide("accept")}
            className="min-w-0 flex-1 rounded-full bg-[#bf7148] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cb7f57]"
          >
            Accetta
          </button>
          <button
            type="button"
            onClick={() => decide("reject")}
            className="min-w-0 flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#d9e2e7] transition hover:border-white/30 hover:text-white"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  );
}
