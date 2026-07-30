"use client";

import { useSyncExternalStore } from "react";

import type { BookingVenue } from "@/lib/booking-config";
import { readStoredConsent, subscribeToConsent } from "@/lib/consent";

export function TheForkBooking({ venue }: { venue: BookingVenue }) {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readStoredConsent,
    () => null,
  );
  const canLoadTheFork = consent === "accept";

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
      </div>

      <div className="min-w-0 overflow-hidden rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)]">
        {canLoadTheFork ? (
          <iframe
            src={venue.theForkUrl}
            title={`Prenotazione ${venue.name} con TheFork`}
            allow="payment *"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full border-0"
            style={{ height: "max(800px, calc(100svh - 7rem))" }}
          />
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <p className="font-serif text-3xl text-[#16292d]">
                Calendario di prenotazione
              </p>
              <p className="mt-4 text-sm leading-7 text-[#4c5453]">
                {consent === "reject"
                  ? "Per prenotare usa l'assistenza telefonica o WhatsApp."
                  : "Accetta i cookie dal banner per caricare automaticamente il calendario."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
