"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const topics = [
  "Informazioni generali",
  "Beach",
  "Ristorante Mare",
  "Terrazza MUULab Riviera",
  "Sport",
  "Eventi",
];

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      topic: String(formData.get("topic") || ""),
      message: String(formData.get("message") || ""),
      honey: String(formData.get("honey") || ""),
    };

    const response = await fetch("/api/contact", {
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
      data-testid="contact-form"
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#dadad5]">
        Area di interesse
        <select
          name="topic"
          required
          defaultValue={topics[0]}
          className="rounded-2xl border border-white/10 bg-[#0b1620] px-4 py-3 text-[#f4ede4] outline-none transition focus:border-[#d6b887]"
        >
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#dadad5]">
        Messaggio
        <textarea
          name="message"
          required
          rows={6}
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
              : "Ti rispondiamo con il riferimento piu adatto alla tua richiesta."}
        </p>
      </div>
    </form>
  );
}
