import { EntityPageView } from "@/components/pages/entity-page";
import { buildMetadata } from "@/lib/seo";
import { pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Beach | Hawaii Pescara",
  description: "Spiaggia ampia, comfort, servizi e prenotazione beach sul mare di Pescara.",
  path: "/beach",
});

export default function BeachPage() {
  return <EntityPageView page={pages["beach"]} />;
}
