import "server-only";

import { z } from "zod";

import { areUniqueAllergenCodes, isMenuPrice } from "../../../shared/menu-contract";
import { venueMenus, type MenuCategory, type VenueMenu } from "./site-content";

const menuQuery =
  '*[_type == "menu" && _id in ["menu-hawaii", "menu-muulab"]]{_id, venue, categories[]{_key, title, note, dishes[]{_key, name, note, price, allergens, available}}}';

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

const menuCategorySchema = z
  .object({
    _key: requiredText,
    title: requiredText,
    note: z.string().optional(),
    dishes: z.array(menuDishSchema),
  })
  .strict();

const menuDocumentSchema = z.discriminatedUnion("_id", [
  z
    .object({
      _id: z.literal("menu-hawaii"),
      venue: z.literal("hawaii"),
      categories: z.array(menuCategorySchema),
    })
    .strict(),
  z
    .object({
      _id: z.literal("menu-muulab"),
      venue: z.literal("muulab"),
      categories: z.array(menuCategorySchema),
    })
    .strict(),
]);

const menuResponseSchema = z
  .object({
    result: z.array(menuDocumentSchema).length(2),
  })
  .passthrough()
  .superRefine(({ result }, context) => {
    const documentIds = new Set(result.map(({ _id }) => _id));

    if (
      documentIds.size !== 2 ||
      !documentIds.has("menu-hawaii") ||
      !documentIds.has("menu-muulab")
    ) {
      context.addIssue({
        code: "custom",
        message: "Both fixed menu documents are required exactly once.",
        path: ["result"],
      });
    }
  });

const menuEnvironmentSchema = z
  .object({
    SANITY_PROJECT_ID: z.string().regex(/^[a-z0-9-]+$/),
    SANITY_DATASET: z.string().regex(/^[A-Za-z0-9_-]+$/),
    SANITY_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    SANITY_API_TOKEN: z.string().min(1),
  })
  .strip();

const defaultEnvironment = {
  SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
  SANITY_DATASET: process.env.SANITY_DATASET,
  SANITY_API_VERSION: process.env.SANITY_API_VERSION,
  SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
};

type MenuCmsEnvironment = Partial<Record<keyof typeof defaultEnvironment, string>>;

type MenuCmsDependencies = {
  env?: MenuCmsEnvironment;
  fetcher?: typeof fetch;
  warn?: (message: string) => void;
};

type MenuDocument = z.infer<typeof menuDocumentSchema>;
type MenuCategoryDocument = z.infer<typeof menuCategorySchema>;

type FallbackReason =
  | "missing-config"
  | "fetch-failed"
  | "http-error"
  | "invalid-json"
  | "invalid-schema";

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

function mapDocument(document: MenuDocument): VenueMenu {
  const localMenuId =
    document._id === "menu-hawaii" ? "ristorante-mare" : "muulab";
  const localMenu = venueMenus.find(({ id }) => id === localMenuId);

  if (!localMenu) {
    throw new Error("Missing fixed local menu metadata.");
  }

  return {
    ...localMenu,
    categories: document.categories.map((category, index) =>
      mapCategory(category, localMenu.categories[index]),
    ),
  };
}

export async function loadBuildMenuContent({
  env = defaultEnvironment,
  fetcher = fetch,
  warn = (message) => console.warn(message),
}: MenuCmsDependencies = {}): Promise<VenueMenu[]> {
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
      cache: "no-store",
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

  const documents = menuResponseSchema.safeParse(payload);
  if (!documents.success) {
    return fallbackToLocalMenus("invalid-schema", warn);
  }

  try {
    return ["menu-hawaii", "menu-muulab"].map((documentId) =>
      mapDocument(
        documents.data.result.find(({ _id }) => _id === documentId) as MenuDocument,
      ),
    );
  } catch {
    return fallbackToLocalMenus("invalid-schema", warn);
  }
}
