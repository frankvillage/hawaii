export type BookingVenueId = "hawaii" | "muulab";

export type BookingVenue = {
  readonly id: BookingVenueId;
  readonly name: string;
  readonly whatsappUrl: string;
  readonly phoneDisplay: string;
  readonly phoneHref: string;
  readonly theForkUrl: string;
  readonly internalBookingPath: string;
};

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: "Ciao, vorrei ricevere informazioni su Hawaii.",
  hawaiiTable: "Ciao, vorrei prenotare un tavolo al ristorante Hawaii.",
  muulabTable: "Ciao, vorrei prenotare un tavolo sulla terrazza MUULab Riviera.",
  padel: "Ciao, vorrei prenotare un campo da padel.",
  events: "Ciao, vorrei ricevere informazioni sugli eventi Hawaii.",
  privateEvents: "Ciao, vorrei organizzare una festa o un evento privato da Hawaii.",
} as const;

const whatsappNumbers = {
  hawaii: "393516900701",
  muulab: "393333440051",
  padel: "393513200049",
} as const;

export const bookingVenues = {
  hawaii: {
    id: "hawaii",
    name: "Hawaii",
    whatsappUrl: buildWhatsAppUrl(
      whatsappNumbers.hawaii,
      whatsappMessages.hawaiiTable,
    ),
    phoneDisplay: "085 9396664",
    phoneHref: "tel:+390859396664",
    theForkUrl:
      "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
    internalBookingPath: "/prenotazioni/ristorante",
  },
  muulab: {
    id: "muulab",
    name: "MUULab Riviera",
    whatsappUrl: buildWhatsAppUrl(
      whatsappNumbers.muulab,
      whatsappMessages.muulabTable,
    ),
    phoneDisplay: "085 9396485",
    phoneHref: "tel:+390859396485",
    theForkUrl:
      "https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1",
    internalBookingPath: "/prenotazioni/muulab",
  },
} as const satisfies Readonly<Record<BookingVenueId, BookingVenue>>;

export const beachBookingUrl =
  "https://new-widget.spiagge.it/stabilimenti-balneari/prenotazione/it-pe-65123-lido-hawaii/insertPeriod?yb_booking_license=it-pe-65123-lido-hawaii";

export const sportBooking = {
  portalUrl: "https://wansport.com",
  whatsappUrl: buildWhatsAppUrl(whatsappNumbers.padel, whatsappMessages.padel),
  registrationNotice: "Registrarsi o accedere a Wansport per prenotare.",
} as const;

export const whatsappContacts = {
  general: buildWhatsAppUrl(whatsappNumbers.hawaii, whatsappMessages.general),
  events: buildWhatsAppUrl(whatsappNumbers.hawaii, whatsappMessages.events),
  privateEvents: buildWhatsAppUrl(
    whatsappNumbers.hawaii,
    whatsappMessages.privateEvents,
  ),
} as const;
