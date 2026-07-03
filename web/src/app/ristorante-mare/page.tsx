import { EntityPageView } from "@/components/pages/entity-page";
import { buildMetadata } from "@/lib/seo";
import { pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Ristorante Mare | Hawaii Pescara",
  description: "Pesce, menu à la carte, cocktail bar e tavoli sul mare al piano terra.",
  path: "/ristorante-mare",
});

export default function RestaurantPage() {
  return <EntityPageView page={pages["ristorante-mare"]} />;
}
