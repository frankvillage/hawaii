# Hawaii Contact and Booking Integration Design

**Date:** 2026-07-17  
**Status:** Approved in conversation  
**Scope:** Contact details, booking destinations, TheFork embeds, sport access and related security/SEO updates.

## Objective

Replace the provisional contact and booking paths with the official channels supplied by the venue owner. Hawaii and MUULab Riviera must remain clearly separated, while `/prenotazioni` acts as the single lightweight entry point for every service.

## Canonical Contacts

### Hawaii

- Information and nightlife WhatsApp: `https://wa.me/393516900701`
- Restaurant booking phone: `085 9396664` (`tel:+390859396664`)
- Restaurant TheFork: `https://widget.thefork.com/0248d215-d9e7-4ae2-b2fa-af52577eb540`
- Beach booking: `https://new-widget.spiagge.it/stabilimenti-balneari/prenotazione/it-pe-65123-lido-hawaii/insertPeriod?yb_booking_license=it-pe-65123-lido-hawaii`
- Padel assistance WhatsApp: `https://wa.me/393513200049`
- Padel portal: `https://wansport.com`

### MUULab Riviera

- WhatsApp: `https://wa.me/393333440051`
- Restaurant booking phone: `085 9396485` (`tel:+390859396485`)
- TheFork: `https://widget.thefork.com/cbc67fa3-b6fd-4e02-9891-572334c016d1`

## Information Architecture

`/prenotazioni` remains the booking hub and routes users by intent:

- Hawaii restaurant -> `/prenotazioni/ristorante`
- MUULab Riviera -> `/prenotazioni/muulab`
- Beach -> the official Spiagge.it flow
- Padel -> Wansport, with a clear registration/login requirement and WhatsApp assistance
- Events and private parties -> the correct WhatsApp or the existing private-event enquiry route

Two new first-party routes host the full-height TheFork experiences. Entity pages link to the corresponding internal route rather than embedding third-party UI inside their editorial content.

The canonical content model exposes separate keyed records, never one shared restaurant object:

```ts
type BookingVenue = {
  id: "hawaii" | "muulab";
  name: string;
  whatsappUrl: string;
  phoneDisplay: string;
  phoneHref: string;
  theForkUrl: string;
  internalBookingPath: string;
};
```

Every restaurant CTA and structured-data builder receives a venue key explicitly.

## Booking Page Behavior

Each TheFork route contains:

- concise venue identity and telephone/WhatsApp alternatives;
- a consent placeholder on first visit instead of an immediately loaded third-party frame;
- an explicit `Carica il modulo TheFork` control that records TheFork-specific consent before mounting the iframe;
- a full-width iframe with `height: max(800px, calc(100svh - 7rem))`;
- the vendor-provided `allow="payment *"`, a descriptive `title`, lazy loading and `referrerPolicy="strict-origin-when-cross-origin"`;
- an always-visible styled external button targeting the exact TheFork URL for that venue, because cross-origin blocking cannot be detected reliably.

The embed must not be rendered before the booking route is opened and the visitor explicitly enables TheFork, keeping the homepage and entity pages light and avoiding non-essential third-party requests before consent. Rejecting the global cookie banner must leave the iframe unmounted; the user may still follow the explicit external link.

## Content Rules

- The global WhatsApp button always represents Hawaii information and events, not restaurant table booking.
- Restaurant table CTAs use TheFork or the dedicated AI-assisted telephone number.
- MUULab CTAs never use Hawaii contacts.
- Beach CTAs link directly to the new Spiagge.it URL.
- Padel copy states that Wansport registration or login is required before a field can be booked.
- The generic enquiry form is retained for information, events and private requests, not presented as the primary restaurant booking method.

## Security and Privacy

- Add only `https://widget.thefork.com` to `frame-src` in the production CSP.
- Keep `frame-ancestors 'none'`, existing secure headers and `rel="noopener noreferrer"` on external links.
- Do not inject the owner-provided inline style or third-party script. Recreate the button with the existing design system.
- No personal data passes through Hawaii forms during a TheFork booking; the iframe remains a separate third-party context.
- The privacy and cookie pages identify TheFork unconditionally as an external booking provider and explain the network-data transfer caused by loading its iframe.
- The iframe is consent-gated unless a documented audit proves that all of its storage is strictly necessary. The initial implementation assumes consent is required.
- `allow="payment *"` is retained only because it is part of the owner-supplied official widget contract. Tests pin the value so it can be narrowed later if TheFork confirms support for `payment 'src'` or an explicit origin.

## SEO and Discoverability

- Add both booking routes to the sitemap with descriptive metadata.
- Update each Restaurant entity with its venue-specific `telephone`, `acceptsReservations: true` and a `ReserveAction` whose target is the corresponding internal canonical booking route.
- Keep booking pages indexable but concise; entity pages remain the primary organic landing pages.
- Internal links use explicit labels such as `Prenota Hawaii su TheFork` and `Prenota MUULab su TheFork`.

## Testing

- Static tests assert every canonical number and URL and reject the replaced contacts.
- Static tests verify the Wansport registration/login copy, the generic `https://wansport.com` destination and the absence of any invented venue-specific Wansport path.
- Component/browser tests verify that no TheFork request occurs before explicit consent, then verify the exact iframe source, title, `allow="payment *"`, referrer policy and full-height style.
- Component/browser tests verify an always-visible fallback button with `target="_blank"` and `rel="noopener noreferrer"` for the correct venue.
- Smoke tests verify that Hawaii and MUULab CTAs, AI-assisted phone labels and structured data do not cross-link.
- Build verification checks CSP, sitemap and static-export compatibility.

## Reversibility

Implementation is split into small commits after this specification:

1. canonical booking/contact model and regression tests;
2. TheFork routes and CSP/SEO support;
3. CTA/content propagation and browser verification.

No existing page is deleted. Reverting those commits restores the current booking experience without affecting the mobile video playback work.
