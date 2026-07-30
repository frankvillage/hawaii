import { whatsappContacts } from "@/lib/booking-config";

/* Floating WhatsApp chat, as on the current WordPress site — the client
   relies on it. Sits above the soul rail on mobile. */
export function WhatsAppButton() {
  const nationalNumber = whatsappContacts.general
    .replace("https://wa.me/", "")
    .split("?")[0]
    .replace(/^39/, "");
  const displayNumber = `${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3)}`;

  return (
    <a
      data-testid="whatsapp-button"
      href={whatsappContacts.general}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp Hawaii: ${displayNumber}`}
      className="fixed bottom-20 right-4 z-40 inline-flex items-center justify-center rounded-full bg-[#e8c89e] text-[#0d3d43] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0b444b] hover:text-[#e8c89e] sm:bottom-6 sm:right-6"
      style={{ width: "3.25rem", height: "3.25rem" }}
    >
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden fill="currentColor">
        <path d="M16.04 4.5c-6.36 0-11.52 5.13-11.52 11.45 0 2.02.53 3.99 1.55 5.72L4.5 27.5l5.99-1.56a11.6 11.6 0 0 0 5.55 1.41h.01c6.35 0 11.51-5.13 11.51-11.45 0-3.06-1.2-5.94-3.37-8.1a11.44 11.44 0 0 0-8.15-3.3zm0 20.9h-.01a9.63 9.63 0 0 1-4.9-1.34l-.35-.21-3.55.93.95-3.45-.23-.36a9.42 9.42 0 0 1-1.47-5.02c0-5.25 4.3-9.52 9.57-9.52 2.55 0 4.95.99 6.76 2.79a9.42 9.42 0 0 1 2.8 6.74c0 5.25-4.3 9.53-9.57 9.53zm5.25-7.13c-.29-.14-1.7-.84-1.97-.93-.26-.1-.46-.14-.65.14-.19.29-.74.93-.91 1.12-.17.19-.34.22-.62.07-.29-.14-1.21-.44-2.31-1.42-.85-.75-1.43-1.69-1.6-1.97-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.65-1.55-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.19 0-.5.07-.77.36-.26.29-1 .98-1 2.38 0 1.4 1.03 2.76 1.17 2.95.14.19 2.03 3.08 4.91 4.32.69.29 1.22.47 1.64.6.69.22 1.31.19 1.81.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z" />
      </svg>
    </a>
  );
}
