import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = "https://www.hawaiipescara.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { route: "", changeFrequency: "weekly", priority: 1 },
    { route: "/villaggio", changeFrequency: "monthly", priority: 0.8 },
    { route: "/beach", changeFrequency: "monthly", priority: 0.8 },
    { route: "/ristorante-mare", changeFrequency: "monthly", priority: 0.8 },
    { route: "/terrazza", changeFrequency: "monthly", priority: 0.8 },
    { route: "/sport", changeFrequency: "monthly", priority: 0.8 },
    { route: "/eventi", changeFrequency: "monthly", priority: 0.8 },
    { route: "/feste-private", changeFrequency: "monthly", priority: 0.8 },
    { route: "/menu", changeFrequency: "monthly", priority: 0.8 },
    { route: "/prenotazioni", changeFrequency: "monthly", priority: 0.8 },
    {
      route: "/prenotazioni/ristorante",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      route: "/prenotazioni/muulab",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { route: "/faq", changeFrequency: "monthly", priority: 0.8 },
    { route: "/contatti", changeFrequency: "monthly", priority: 0.8 },
    { route: "/privacy", changeFrequency: "monthly", priority: 0.8 },
    { route: "/cookie", changeFrequency: "monthly", priority: 0.8 },
  ] as const;

  return routes.map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
