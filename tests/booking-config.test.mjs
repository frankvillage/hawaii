import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  beachBookingUrl,
  buildWhatsAppUrl,
  bookingVenues,
  sportBooking,
  whatsappContacts,
  whatsappMessages,
} from "../web/src/lib/booking-config.ts";
import { muulabWineSections } from "../web/src/lib/muulab-wines.ts";

assert.deepEqual(bookingVenues.hawaii, {
  id: "hawaii",
  name: "Hawaii",
  whatsappUrl: buildWhatsAppUrl("393516900701", whatsappMessages.hawaiiTable),
  phoneDisplay: "085 9396664",
  phoneHref: "tel:+390859396664",
  theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  internalBookingPath: "/prenotazioni/ristorante",
});

assert.deepEqual(bookingVenues.muulab, {
  id: "muulab",
  name: "MUULab Riviera",
  whatsappUrl: buildWhatsAppUrl("393333440051", whatsappMessages.muulabTable),
  phoneDisplay: "085 9396485",
  phoneHref: "tel:+390859396485",
  theForkUrl: "https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1",
  internalBookingPath: "/prenotazioni/muulab",
});

assert.equal(
  beachBookingUrl,
  "https://new-widget.spiagge.it/stabilimenti-balneari/prenotazione/it-pe-65123-lido-hawaii/insertPeriod?yb_booking_license=it-pe-65123-lido-hawaii",
);

assert.equal(sportBooking.portalUrl, "https://wansport.com");
assert.equal(
  sportBooking.whatsappUrl,
  buildWhatsAppUrl("393513200049", whatsappMessages.padel),
);
assert.match(sportBooking.registrationNotice, /registrarsi/i);
assert.match(sportBooking.registrationNotice, /accedere/i);
assert.match(sportBooking.registrationNotice, /prenotare/i);
assert.doesNotMatch(sportBooking.portalUrl, /wansport\.com\/.+/);
assert.equal(
  whatsappContacts.events,
  buildWhatsAppUrl("393516900701", whatsappMessages.events),
);
assert.equal(
  whatsappContacts.privateEvents,
  buildWhatsAppUrl("393516900701", whatsappMessages.privateEvents),
);
assert.equal(
  new URL(bookingVenues.hawaii.whatsappUrl).searchParams.get("text"),
  "Ciao, vorrei prenotare un tavolo al ristorante Hawaii.",
);
assert.equal(
  new URL(bookingVenues.muulab.whatsappUrl).searchParams.get("text"),
  "Ciao, vorrei prenotare un tavolo sulla terrazza MUULab Riviera.",
);
assert.equal(
  new URL(sportBooking.whatsappUrl).searchParams.get("text"),
  "Ciao, vorrei prenotare un campo da padel.",
);

const serializedBookingModel = JSON.stringify({
  bookingVenues,
  beachBookingUrl,
  sportBooking,
  whatsappContacts,
});

assert.doesNotMatch(
  serializedBookingModel,
  /https:\/\/widget\.spiagge\.it\/stabilimenti-balneari\/prenotazione\/it-pe-65123-lido-hawaii\/\?ybnl=1/,
);
assert.doesNotMatch(serializedBookingModel, /sportclubby/i);
assert.doesNotMatch(serializedBookingModel, /393755175508/);

const muulabWines = muulabWineSections.flatMap((section) => section.wines);
assert.deepEqual(
  muulabWineSections.map((section) => section.title),
  [
    "Coravin al calice",
    "Bollicine",
    "Vini rossi italiani",
    "Francia",
    "Vini rosati",
    "Vini bianchi",
  ],
);
assert.equal(muulabWines.length, 156);
assert.equal(
  createHash("sha256").update(JSON.stringify(muulabWineSections)).digest("hex"),
  "f37445d0a2f38cc4c64c4c94d03fc120de541d8c05cc2c1355f7f3547ccb4670",
  "The complete reviewed MUULab wine names and prices must remain deterministic",
);

console.log("booking config checks passed");
