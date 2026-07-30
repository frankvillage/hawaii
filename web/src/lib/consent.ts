export const CONSENT_STORAGE_KEY = "hawaii-consent-v1";
export const CONSENT_CHANGE_EVENT = "hawaii-consent-change";

export type ConsentDecision = "accept" | "reject";

export function readStoredConsent(): ConsentDecision | null {
  const decision = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return decision === "accept" || decision === "reject" ? decision : null;
}

export function subscribeToConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
  };
}

export function storeConsent(decision: ConsentDecision) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: decision }));
}

export function clearStoredConsent() {
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT));
}
