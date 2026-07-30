"use client";

import { clearStoredConsent } from "@/lib/consent";

export function ConsentPreferencesButton() {
  return (
    <button type="button" onClick={clearStoredConsent} className="cta mt-6">
      Modifica preferenze cookie
    </button>
  );
}
