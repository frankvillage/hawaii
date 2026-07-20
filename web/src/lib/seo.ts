import type { Metadata } from "next";

import { bookingVenues } from "@/lib/booking-config";
import type { EntityPage, FaqItem } from "@/lib/site-content";
import { siteMeta } from "@/lib/site-content";

const baseUrl = "https://www.hawaiipescara.it";

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = `${baseUrl}${input.path ?? ""}`;

  return {
    title: `${input.title} | ${siteMeta.name}`,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${input.title} | ${siteMeta.name}`,
      description: input.description,
      url,
      siteName: siteMeta.name,
      locale: "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${siteMeta.name}`,
      description: input.description,
    },
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteMeta.name,
    slogan: siteMeta.payoff,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Viale della Riviera 154",
      addressLocality: "Pescara",
      postalCode: "65123",
      addressCountry: "IT",
    },
    telephone: siteMeta.restaurantPhone,
    email: siteMeta.email,
    url: "https://www.hawaiipescara.it",
    servesCuisine: ["Seafood", "Mediterranean", "Grill", "Cocktails"],
  };
}

export function entitySchema(page: EntityPage) {
  const url = `${baseUrl}/${page.slug}`;
  const bookingVenue = page.bookingVenueId
    ? bookingVenues[page.bookingVenueId]
    : undefined;
  const base = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    name: `${siteMeta.name} - ${page.navLabel}`,
    description: page.intro,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Viale della Riviera 154",
      addressLocality: "Pescara",
      postalCode: "65123",
      addressCountry: "IT",
    },
    telephone: siteMeta.restaurantPhone,
    email: siteMeta.email,
  };

  if (page.schemaType === "Restaurant") {
    if (!bookingVenue) {
      throw new Error(`Restaurant ${page.slug} requires a booking venue`);
    }

    return {
      ...base,
      telephone: bookingVenue.phoneDisplay,
      acceptsReservations: true,
      potentialAction: {
        "@type": "ReserveAction",
        target: bookingVenue.internalBookingPath,
      },
      servesCuisine:
        bookingVenue.id === "muulab"
          ? ["Steakhouse", "Grill", "Creative Cuisine", "Cocktails"]
          : ["Seafood", "Mediterranean", "Cocktails"],
    };
  }

  if (page.schemaType === "SportsActivityLocation") {
    return {
      ...base,
      sport: ["Padel", "CrossFit"],
    };
  }

  if (page.schemaType === "EventVenue") {
    return {
      ...base,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    };
  }

  return base;
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
