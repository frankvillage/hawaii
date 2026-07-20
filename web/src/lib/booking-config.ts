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

export const bookingVenues = {
  hawaii: {
    id: "hawaii",
    name: "Hawaii",
    whatsappUrl: "https://wa.me/393516900701",
    phoneDisplay: "085 9396664",
    phoneHref: "tel:+390859396664",
    theForkUrl:
      "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
    internalBookingPath: "/prenotazioni/ristorante",
  },
  muulab: {
    id: "muulab",
    name: "MUULab Riviera",
    whatsappUrl: "https://wa.me/393333440051",
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
  whatsappUrl: "https://wa.me/393513200049",
  registrationNotice: "Registrarsi o accedere a Wansport per prenotare.",
} as const;
