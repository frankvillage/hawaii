"use client";

import { useState, useSyncExternalStore } from "react";

import type { BookingVenue } from "@/lib/booking-config";

const THEFORK_CONSENT_KEY = "hawaii-thefork-consent-v1";

function readStoredConsent() {
  return window.localStorage.getItem(THEFORK_CONSENT_KEY) === "granted";
}

export function TheForkBooking({ venue }: { venue: BookingVenue }) {
  const [activated, setActivated] = useState(false);
  const storedConsent = useSyncExternalStore(
    () => () => undefined,
    readStoredConsent,
    () => false,
  );
  const canLoadTheFork = activated || storedConsent;

  const activateTheFork = () => {
    window.localStorage.setItem(THEFORK_CONSENT_KEY, "granted");
    setActivated(true);
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
      <div className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white p-6 shadow-[0_14px_40px_rgba(23,32,34,0.07)] sm:p-8">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
          Assistenza diretta
        </p>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-[#16292d]">
          Prenotazioni telefoniche con assistente virtuale
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#4c5453]">
          Per supporto sulla prenotazione puoi chiamare {venue.name} o scriverci su
          WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <a href={venue.phoneHref} className="cta justify-center">
            {venue.phoneDisplay}
          </a>
          <a
            href={venue.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-ghost justify-center border-[#16292d]/20 text-[#16292d]"
          >
            WhatsApp {venue.name}
          </a>
        </div>

        {!canLoadTheFork ? (
          <div className="mt-8 border-t border-[#1c2b2e]/10 pt-6">
            <p className="text-sm leading-7 text-[#4c5453]">
              Il modulo esterno resta bloccato finché non scegli di caricarlo. Attivandolo,
              il browser contatterà TheFork.
            </p>
            <button type="button" onClick={activateTheFork} className="cta mt-5">
              Carica il modulo TheFork
            </button>
          </div>
        ) : null}

        <a
          data-testid="thefork-direct-link"
          href={venue.theForkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex text-sm font-semibold text-[#8b612b] underline decoration-[#8b612b]/35 underline-offset-4"
        >
          Apri direttamente TheFork
        </a>
      </div>

      <div className="min-w-0 overflow-hidden rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)]">
        {canLoadTheFork ? (
          <iframe
            src={venue.theForkUrl}
            title={`Prenotazione ${venue.name} con TheFork`}
            allow="payment *"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full border-0"
            style={{ height: "max(800px, calc(100svh - 7rem))" }}
          />
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <p className="font-serif text-3xl text-[#16292d]">TheFork è in attesa.</p>
              <p className="mt-4 text-sm leading-7 text-[#4c5453]">
                Usa il controllo di attivazione per mostrare qui il calendario di
                prenotazione.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
