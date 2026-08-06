import type { StructureBuilder, StructureResolver } from "sanity/structure";

const menuSingletons = [
  {
    documentId: "menu-hawaii",
    initialValueTemplate: "menu-hawaii",
    title: "Hawaii Ristorante - Piano terra",
  },
  {
    documentId: "menu-muulab",
    initialValueTemplate: "menu-muulab",
    title: "MUULab Riviera - Terrazza",
  },
] as const;

type MenuSingleton = (typeof menuSingletons)[number];

function menuSingletonItem(
  S: StructureBuilder,
  { documentId, initialValueTemplate, title }: MenuSingleton,
) {
  return S.listItem()
    .id(documentId)
    .title(title)
    .child(
      S.document()
        .schemaType("menu")
        .documentId(documentId)
        .initialValueTemplate(initialValueTemplate)
        .title(`Modifica: ${title}`),
    );
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Gestione menu")
    .items(menuSingletons.map((singleton) => menuSingletonItem(S, singleton)));
