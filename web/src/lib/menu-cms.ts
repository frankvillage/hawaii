import "server-only";

import { readFile } from "node:fs/promises";

import { z } from "zod";

import { areUniqueAllergenCodes, isMenuPrice, menuCategoryKeys } from "../../../shared/menu-contract";
import { venueMenus, type MenuCategory, type VenueMenu } from "./site-content";

type MenuDocumentId = keyof typeof menuCategoryKeys;
type MenuCategoryKey<DocumentId extends MenuDocumentId> =
  Extract<
    (typeof menuCategoryKeys)[DocumentId][keyof (typeof menuCategoryKeys)[DocumentId]],
    string
  >;
type LocalCategoryTitlesByKey = {
  [DocumentId in MenuDocumentId]: Record<MenuCategoryKey<DocumentId>, string>;
};

const menuQuery =
  '*[_type == "menu" && _id in ["menu-hawaii", "menu-muulab"]]{_id, _rev, _updatedAt, venue, categories[]{_key, title, note, dishes[]{_key, name, note, price, allergens, available}}}';

const requiredText = z.string().min(1);
const optionalPrice = z.string().refine(isMenuPrice).optional();
const optionalAllergens = z
  .array(z.number())
  .refine(areUniqueAllergenCodes)
  .optional();

const menuDishSchema = z
  .object({
    _key: requiredText,
    name: requiredText,
    note: z.string().optional(),
    price: optionalPrice,
    allergens: optionalAllergens,
    available: z.boolean(),
  })
  .strict();

function addDuplicateKeyIssues(
  values: readonly { _key: string }[],
  context: z.RefinementCtx,
) {
  const seen = new Set<string>();

  values.forEach(({ _key }, index) => {
    if (seen.has(_key)) {
      context.addIssue({
        code: "custom",
        message: "Sanity array keys must be unique.",
        path: [index, "_key"],
      });
    }
    seen.add(_key);
  });
}

const menuDishesSchema = z
  .array(menuDishSchema)
  .superRefine(addDuplicateKeyIssues);

const menuCategorySchema = z
  .object({
    _key: requiredText,
    title: requiredText,
    note: z.string().optional(),
    dishes: menuDishesSchema,
  })
  .strict();

const menuCategoriesSchema = z
  .array(menuCategorySchema)
  .min(1)
  .superRefine(addDuplicateKeyIssues);

const menuDocumentSchema = z.discriminatedUnion("_id", [
  z
    .object({
      _id: z.literal("menu-hawaii"),
      _rev: requiredText,
      _updatedAt: z.string().datetime().nullable(),
      venue: z.literal("hawaii"),
      categories: menuCategoriesSchema,
    })
    .strict(),
  z
    .object({
      _id: z.literal("menu-muulab"),
      _rev: requiredText,
      _updatedAt: z.string().datetime().nullable(),
      venue: z.literal("muulab"),
      categories: menuCategoriesSchema,
    })
    .strict(),
]);

const menuDocumentsSchema = z
  .array(menuDocumentSchema)
  .length(2)
  .superRefine((result, context) => {
    const documentIds = new Set(result.map(({ _id }) => _id));

    if (
      documentIds.size !== 2 ||
      !documentIds.has("menu-hawaii") ||
      !documentIds.has("menu-muulab")
    ) {
      context.addIssue({
        code: "custom",
        message: "Both fixed menu documents are required exactly once.",
      });
    }
  });

const menuResponseSchema = z
  .object({
    result: menuDocumentsSchema,
  })
  .passthrough();

const menuSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    source: z.enum(["sanity", "local-fallback"]),
    result: menuDocumentsSchema,
  })
  .strict();

const menuEnvironmentSchema = z
  .object({
    SANITY_PROJECT_ID: z.string().regex(/^[a-z0-9-]+$/),
    SANITY_DATASET: z.string().regex(/^[A-Za-z0-9_-]+$/),
    SANITY_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    SANITY_API_TOKEN: z.string().min(1),
  })
  .strip();

const defaultEnvironment = {
  MENU_CMS_SNAPSHOT_PATH: process.env.MENU_CMS_SNAPSHOT_PATH,
  SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
  SANITY_DATASET: process.env.SANITY_DATASET,
  SANITY_API_VERSION: process.env.SANITY_API_VERSION,
  SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
};

type MenuCmsEnvironment = Partial<Record<keyof typeof defaultEnvironment, string>>;

type MenuCmsDependencies = {
  env?: MenuCmsEnvironment;
  fetcher?: typeof fetch;
  readSnapshot?: (snapshotPath: string) => Promise<string>;
  warn?: (message: string) => void;
};

type MenuDocument = z.infer<typeof menuDocumentSchema>;
type MenuCategoryDocument = z.infer<typeof menuCategorySchema>;

type FallbackReason =
  | "missing-config"
  | "fetch-failed"
  | "http-error"
  | "invalid-json"
  | "invalid-schema"
  | "snapshot-read-failed";

function fallbackToLocalMenus(
  reason: FallbackReason,
  warn: (message: string) => void,
): VenueMenu[] {
  warn(`[menu-cms] Using local menu fallback (${reason}).`);
  return venueMenus;
}

function mapCategory(
  category: MenuCategoryDocument,
  localCategory: MenuCategory | undefined,
): MenuCategory {
  return {
    ...localCategory,
    title: category.title,
    note: category.note,
    dishes: category.dishes
      .filter(({ available }) => available)
      .map(({ allergens, name, note, price }) => ({
        name,
        price,
        allergens,
        note,
      })),
  };
}

const localCategoryTitlesByKey = {
  "menu-hawaii": {
    [menuCategoryKeys["menu-hawaii"].antipasti]: "Antipasti",
    [menuCategoryKeys["menu-hawaii"].primi]: "I primi",
    [menuCategoryKeys["menu-hawaii"].secondiGriglia]: "Secondi e griglia",
    [menuCategoryKeys["menu-hawaii"].contorni]: "Contorni",
    [menuCategoryKeys["menu-hawaii"].pizzaCena]: "La pizza, a cena",
    [menuCategoryKeys["menu-hawaii"].dessert]: "I dessert",
    [menuCategoryKeys["menu-hawaii"].cantina]: "Bevande, birre e cantina",
  },
  "menu-muulab": {
    [menuCategoryKeys["menu-muulab"].perCominciare]: "Per cominciare",
    [menuCategoryKeys["menu-muulab"].crudiCarne]: "Crudi di carne",
    [menuCategoryKeys["menu-muulab"].secondiBrace]: "I secondi alla brace",
    [menuCategoryKeys["menu-muulab"].tagliBrace]: "Tagli alla brace",
    [menuCategoryKeys["menu-muulab"].contorni]: "Contorni",
    [menuCategoryKeys["menu-muulab"].dolci]: "Dolci",
    [menuCategoryKeys["menu-muulab"].cocktailAperitivo]:
      "Cocktail e aperitivo",
    [menuCategoryKeys["menu-muulab"].cantinaCoravin]: "Cantina e Coravin",
  },
} as const satisfies LocalCategoryTitlesByKey;

function findLocalCategory(
  documentId: MenuDocumentId,
  categoryKey: string,
  localMenu: VenueMenu,
): MenuCategory | undefined {
  const categoryTitles: Record<string, string> =
    localCategoryTitlesByKey[documentId];
  const categoryTitle = categoryTitles[categoryKey];

  if (!categoryTitle) return undefined;

  return localMenu.categories.find(({ title }) => title === categoryTitle);
}

function mapDocument(document: MenuDocument): VenueMenu {
  const localMenuId =
    document._id === "menu-hawaii" ? "ristorante-mare" : "muulab";
  const localMenu = venueMenus.find(({ id }) => id === localMenuId);

  if (!localMenu) {
    throw new Error("Missing fixed local menu metadata.");
  }

  return {
    ...localMenu,
    categories: document.categories.map((category) =>
      mapCategory(
        category,
        findLocalCategory(document._id, category._key, localMenu),
      ),
    ),
  };
}

function mapValidatedPayload(
  payload: unknown,
  schema: typeof menuResponseSchema | typeof menuSnapshotSchema,
): VenueMenu[] | null {
  const documents = schema.safeParse(payload);
  if (!documents.success) return null;

  try {
    return ["menu-hawaii", "menu-muulab"].map((documentId) =>
      mapDocument(
        documents.data.result.find(({ _id }) => _id === documentId) as MenuDocument,
      ),
    );
  } catch {
    return null;
  }
}

export async function loadBuildMenuContent({
  env = defaultEnvironment,
  fetcher = fetch,
  readSnapshot = (snapshotPath) => readFile(snapshotPath, "utf8"),
  warn = (message) => console.warn(message),
}: MenuCmsDependencies = {}): Promise<VenueMenu[]> {
  const snapshotPath = env.MENU_CMS_SNAPSHOT_PATH?.trim();

  if (snapshotPath) {
    let payload: unknown;
    try {
      payload = JSON.parse(await readSnapshot(snapshotPath));
    } catch {
      throw new Error("[menu-cms] Required build snapshot could not be read.");
    }

    const snapshotMenus = mapValidatedPayload(payload, menuSnapshotSchema);
    if (!snapshotMenus) {
      throw new Error("[menu-cms] Required build snapshot is invalid.");
    }
    return snapshotMenus;
  }

  const config = menuEnvironmentSchema.safeParse(env);

  if (!config.success) {
    return fallbackToLocalMenus("missing-config", warn);
  }

  const { SANITY_API_TOKEN, SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } =
    config.data;
  const endpoint = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  endpoint.searchParams.set("query", menuQuery);
  endpoint.searchParams.set("perspective", "published");

  let response: Response;
  try {
    response = await fetcher(endpoint.toString(), {
      cache: "force-cache",
      headers: {
        Authorization: `Bearer ${SANITY_API_TOKEN}`,
      },
    });
  } catch {
    return fallbackToLocalMenus("fetch-failed", warn);
  }

  if (!response.ok) {
    return fallbackToLocalMenus("http-error", warn);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return fallbackToLocalMenus("invalid-json", warn);
  }

  return (
    mapValidatedPayload(payload, menuResponseSchema) ??
    fallbackToLocalMenus("invalid-schema", warn)
  );
}
