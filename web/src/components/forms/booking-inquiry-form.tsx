"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const requestTypes = [
  "Prenota spiaggia",
  "Prenota tavolo mare",
  "Prenota terrazza",
  "Prenota sport",
  "Richiesta generale",
];

export function BookingInquiryForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const guestCountValue = String(formData.get("guestCount") || "").trim();

    const payload = {
      requestType: String(formData.get("requestType") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      preferredDate: String(formData.get("preferredDate") || ""),
      guestCount: guestCountValue ? Number(guestCountValue) : undefined,
      message: String(formData.get("message") || ""),
      honey: String(formData.get("honey") || ""),
    };

    const response = await fetch("/api/booking-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setState("error");
      setErrorMessage("Non siamo riusciti a inviare la richiesta. Riprova tra poco.");
      return;
    }

    setState("success");
    event.currentTarget.reset();
  }

  return (
    <form
      data-testid="booking-inquiry-form"
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[#dadad5] sm:col-span-2">
          Cosa vuoi prenotare
          <select
            name="requestType"
            required
            defaultValue={requestTypes[0]}
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          >
            {requestTypes.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#dadad5]">
          Nome
          <input
            name="name"
            required
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[#dadad5]">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#dadad5]">
          Telefono
          <input
            name="phone"
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[#dadad5]">
          Data preferita
          <input
            name="preferredDate"
            type="date"
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#dadad5] sm:max-w-[11rem]">
          Persone
          <input
            name="guestCount"
            type="number"
            min="1"
            className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#dadad5]">
        Note
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-[1.5rem] border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
        />
      </label>

      <input type="text" name="honey" tabIndex={-1} autoComplete="off" className="hidden" />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === "loading"}
          className="cta"
        >
          {state === "loading" ? "Invio in corso" : "Invia richiesta"}
        </button>
        <p className="text-sm text-[#b7c2c9]">
          {state === "success"
            ? "Richiesta inviata correttamente."
            : state === "error"
              ? errorMessage
              : "Ti guidiamo verso il punto giusto tra beach, tavolo, sport e terrazza."}
        </p>
      </div>
    </form>
  );
}
