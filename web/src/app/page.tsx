import { NarrativeHomepage } from "@/components/home/narrative-homepage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Hawaii Pescara | Urban Village",
  description:
    "Un’esperienza continua tra beach club, ristorante di mare, sport, terrazza, eventi e nightlife sul mare di Pescara.",
  path: "/",
});

export default function HomePage() {
  return <NarrativeHomepage />;
}
