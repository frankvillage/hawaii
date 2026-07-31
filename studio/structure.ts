import type { StructureBuilder, StructureResolver } from "sanity/structure";

const menuSingletons = [
  { documentId: "menu-hawaii", title: "Menu Hawaii" },
  { documentId: "menu-muulab", title: "Menu MUULab" },
] as const;

type MenuSingleton = (typeof menuSingletons)[number];

function menuSingletonItem(
  S: StructureBuilder,
  { documentId, title }: MenuSingleton,
) {
  return S.listItem()
    .id(documentId)
    .title(title)
    .child(S.document().schemaType("menu").documentId(documentId).title(title));
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      ...menuSingletons.map((singleton) => menuSingletonItem(S, singleton)),
      S.divider(),
      ...S.documentTypeListItems().filter((listItem) => listItem.getId() !== "menu"),
    ]);
