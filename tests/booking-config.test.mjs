import assert from "node:assert/strict";

import {
  beachBookingUrl,
  bookingVenues,
  sportBooking,
} from "../web/src/lib/booking-config.ts";

assert.deepEqual(bookingVenues.hawaii, {
  id: "hawaii",
  name: "Hawaii",
  whatsappUrl: "https://wa.me/393516900701",
  phoneDisplay: "085 9396664",
  phoneHref: "tel:+390859396664",
  theForkUrl: "https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540",
  internalBookingPath: "/prenotazioni/ristorante",
});

assert.deepEqual(bookingVenues.muulab, {
  id: "muulab",
  name: "MUULab Riviera",
  whatsappUrl: "https://wa.me/393333440051",
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
assert.equal(sportBooking.whatsappUrl, "https://wa.me/393513200049");
assert.match(sportBooking.registrationNotice, /registrarsi/i);
assert.match(sportBooking.registrationNotice, /accedere/i);
assert.match(sportBooking.registrationNotice, /prenotare/i);
assert.doesNotMatch(sportBooking.portalUrl, /wansport\.com\/.+/);

const serializedBookingModel = JSON.stringify({
  bookingVenues,
  beachBookingUrl,
  sportBooking,
});

assert.doesNotMatch(
  serializedBookingModel,
  /https:\/\/widget\.spiagge\.it\/stabilimenti-balneari\/prenotazione\/it-pe-65123-lido-hawaii\/\?ybnl=1/,
);
assert.doesNotMatch(serializedBookingModel, /sportclubby/i);
assert.doesNotMatch(serializedBookingModel, /393755175508/);

console.log("booking config checks passed");
