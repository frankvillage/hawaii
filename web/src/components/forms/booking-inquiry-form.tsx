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
      className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6 backdrop-blur-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[#4c5453] sm:col-span-2">
          Cosa vuoi prenotare
          <select
            name="requestType"
            required
            defaultValue={requestTypes[0]}
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          >
            {requestTypes.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#4c5453]">
          Nome
          <input
            name="name"
            required
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[#4c5453]">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#4c5453]">
          Telefono
          <input
            name="phone"
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[#4c5453]">
          Data preferita
          <input
            name="preferredDate"
            type="date"
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[#4c5453] sm:max-w-[11rem]">
          Persone
          <input
            name="guestCount"
            type="number"
            min="1"
            className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#4c5453]">
        Note
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-[1.5rem] border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
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
        <p className="text-sm text-[#5d6a68]">
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
