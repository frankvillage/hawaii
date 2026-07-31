import { fileURLToPath } from "node:url";

import { createJiti } from "jiti";

import { menuCategoryKeys } from "../../shared/menu-contract";
import type { VenueMenu } from "../src/lib/site-content";

type MenuDocumentId = keyof typeof menuCategoryKeys;

const jiti = createJiti(import.meta.url, {
  alias: {
    "@": fileURLToPath(new URL("../src", import.meta.url)),
  },
  fsCache: false,
});
const { venueMenus } = await jiti.import<{ venueMenus: VenueMenu[] }>(
  "../src/lib/site-content.ts",
);

const seedDefinitions = [
  {
    documentId: "menu-hawaii",
    localMenuId: "ristorante-mare",
    venue: "hawaii",
    categoryKeys: Object.values(menuCategoryKeys["menu-hawaii"]),
  },
  {
    documentId: "menu-muulab",
    localMenuId: "muulab",
    venue: "muulab",
    categoryKeys: Object.values(menuCategoryKeys["menu-muulab"]),
  },
] as const satisfies readonly {
  documentId: MenuDocumentId;
  localMenuId: string;
  venue: "hawaii" | "muulab";
  categoryKeys: readonly string[];
}[];

function dishKey(categoryKey: string, dishIndex: number) {
  return `dish-${categoryKey}-${String(dishIndex + 1).padStart(2, "0")}`;
}

const documents = seedDefinitions.map(
  ({ categoryKeys, documentId, localMenuId, venue }) => {
    const localMenu = venueMenus.find(({ id }) => id === localMenuId);

    if (!localMenu || localMenu.categories.length !== categoryKeys.length) {
      throw new Error(`Local menu categories do not match ${documentId}.`);
    }

    return {
      _id: documentId,
      _type: "menu",
      venue,
      categories: localMenu.categories.map((category, categoryIndex) => ({
        _key: categoryKeys[categoryIndex],
        _type: "menuCategory",
        title: category.title,
        ...(category.note ? { note: category.note } : {}),
        dishes: category.dishes.map((dish, dishIndex) => ({
          _key: dishKey(categoryKeys[categoryIndex], dishIndex),
          _type: "menuDish",
          name: dish.name,
          ...(dish.price ? { price: dish.price } : {}),
          ...(dish.note ? { note: dish.note } : {}),
          ...(dish.allergens ? { allergens: [...dish.allergens] } : {}),
          available: true,
        })),
      })),
    };
  },
);

for (const document of documents) {
  console.log(JSON.stringify(document));
}
