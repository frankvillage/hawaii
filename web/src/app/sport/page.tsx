import { EntityPageView } from "@/components/pages/entity-page";
import { buildMetadata } from "@/lib/seo";
import { pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Sport | Hawaii Pescara",
  description: "Padel, crossfit outdoor e campi da gioco sul mare di Pescara.",
  path: "/sport",
});

export default function SportPage() {
  return <EntityPageView page={pages["sport"]} />;
}
