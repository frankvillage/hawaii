import type { MetadataRoute } from "next";

const baseUrl = "https://www.hawaiipescara.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/villaggio",
    "/beach",
    "/ristorante-mare",
    "/terrazza",
    "/sport",
    "/eventi",
    "/feste-private",
    "/menu",
    "/prenotazioni",
    "/faq",
    "/contatti",
    "/privacy",
    "/cookie",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
