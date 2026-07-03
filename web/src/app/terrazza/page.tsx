import { EntityPageView } from "@/components/pages/entity-page";
import { buildMetadata } from "@/lib/seo";
import { pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Terrazza MUULab Riviera | Hawaii Pescara",
  description: "Vista mare, tramonto, cucina creativa e brace per la sera di Hawaii.",
  path: "/terrazza",
});

export default function TerracePage() {
  return <EntityPageView page={pages["terrazza"]} />;
}
