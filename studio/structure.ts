import type { StructureBuilder, StructureResolver } from "sanity/structure";

const menuSingletons = [
  {
    documentId: "menu-hawaii",
    title: "Hawaii Ristorante - Piano terra",
    subtitle: "Pesce, pizza serale, bevande e carta vini",
  },
  {
    documentId: "menu-muulab",
    title: "MUULab Riviera - Terrazza",
    subtitle: "Brace, cucina della terrazza, bevande e carta vini",
  },
] as const;

type MenuSingleton = (typeof menuSingletons)[number];

function menuSingletonItem(
  S: StructureBuilder,
  { documentId, subtitle, title }: MenuSingleton,
) {
  return S.listItem()
    .id(documentId)
    .title(title)
    .child(
      S.document()
        .schemaType("menu")
        .documentId(documentId)
        .title(`${title} | ${subtitle}`),
    );
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Gestione menu")
    .items(menuSingletons.map((singleton) => menuSingletonItem(S, singleton)));
