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
      className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6 backdrop-blur-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#4c5453]">
        Area di interesse
        <select
          name="topic"
          required
          defaultValue={topics[0]}
          className="rounded-2xl border border-[#1c2b2e]/10 bg-white px-4 py-3 text-[#16292d] outline-none transition focus:border-[#96703d]"
        >
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 flex flex-col gap-2 text-sm text-[#4c5453]">
        Messaggio
        <textarea
          name="message"
          required
          rows={6}
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
              : "Ti rispondiamo con il riferimento piu adatto alla tua richiesta."}
        </p>
      </div>
    </form>
  );
}
