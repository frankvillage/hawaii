import { defineArrayMember, defineField, defineType } from "sanity";
import type { ValidationContext } from "sanity";

import { allergenDefinitions, areUniqueAllergenCodes, isMenuPrice } from "../../shared/menu-contract";

const menuDocumentIds = {
  hawaii: "menu-hawaii",
  muulab: "menu-muulab",
} as const;

type MenuVenue = keyof typeof menuDocumentIds;

const menuVenueOptions = [
  { title: "Hawaii", value: "hawaii" },
  { title: "MUULab", value: "muulab" },
];

const allergenOptions = allergenDefinitions.map(({ code, label }) => ({
  title: `${code}. ${label}`,
  value: code,
}));

function validateVenueDocumentPair(
  venue: unknown,
  context: ValidationContext,
): true | string {
  if (venue !== "hawaii" && venue !== "muulab") {
    return "Select one of the supported venues.";
  }

  const documentId = context.document?._id?.replace(/^drafts\./, "");
  const expectedDocumentId = menuDocumentIds[venue];

  return (
    documentId === expectedDocumentId ||
    `The ${venue} menu must use the fixed document ID ${expectedDocumentId}.`
  );
}

function validateMenuPrice(price: unknown): true | string {
  return (
    price === undefined ||
    isMenuPrice(price) ||
    "Use a price such as EUR 8, EUR 8,50, da EUR 8 or EUR 12 l'etto, replacing EUR with the euro symbol."
  );
}

function validateAllergens(allergens: unknown): true | string {
  return (
    allergens === undefined ||
    areUniqueAllergenCodes(allergens) ||
    "Choose each official allergen code at most once."
  );
}

const menuDish = defineArrayMember({
  name: "menuDish",
  title: "Dish",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "Examples: EUR 8, EUR 8,50, da EUR 8, EUR 12 l'etto. Use the euro symbol.",
      validation: (Rule) => Rule.custom(validateMenuPrice),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "allergens",
      title: "Allergens",
      type: "array",
      of: [{ type: "number" }],
      options: {
        list: allergenOptions,
        layout: "grid",
      },
      validation: (Rule) => Rule.custom(validateAllergens),
    }),
  ],
  preview: {
    select: {
      available: "available",
      name: "name",
      price: "price",
    },
    prepare({ available, name, price }) {
      return {
        title: name || "Unnamed dish",
        subtitle: [available === false ? "Unavailable" : "", price].filter(Boolean).join(" - "),
      };
    },
  },
});

const menuCategory = defineArrayMember({
  name: "menuCategory",
  title: "Category",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "dishes",
      title: "Dishes",
      type: "array",
      of: [menuDish],
      description:
        "May be empty for code-owned wine-list sections that only expose a document link.",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      dishes: "dishes",
    },
    prepare({ dishes, title }) {
      const dishCount = Array.isArray(dishes) ? dishes.length : 0;
      return {
        title: title || "Unnamed category",
        subtitle: `${dishCount} ${dishCount === 1 ? "dish" : "dishes"}`,
      };
    },
  },
});

const wineEntry = defineArrayMember({
  name: "wineEntry",
  title: "Vino o bevanda",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Prezzo",
      type: "string",
      description: "Esempi: € 8, € 8,50, da € 8. Lasciare vuoto se il prezzo non è previsto.",
      validation: (Rule) => Rule.custom(validateMenuPrice),
    }),
    defineField({
      name: "available",
      title: "Disponibile",
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      available: "available",
      name: "name",
      price: "price",
    },
    prepare({ available, name, price }) {
      return {
        title: name || "Etichetta senza nome",
        subtitle: [available === false ? "Non disponibile" : "", price]
          .filter(Boolean)
          .join(" - "),
      };
    },
  },
});

const wineSection = defineArrayMember({
  name: "wineSection",
  title: "Sezione carta vini e bevande",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Titolo sezione",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "wines",
      title: "Vini e bevande",
      type: "array",
      of: [wineEntry],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: "title",
      wines: "wines",
    },
    prepare({ title, wines }) {
      const count = Array.isArray(wines) ? wines.length : 0;
      return {
        title: title || "Sezione senza nome",
        subtitle: `${count} ${count === 1 ? "voce" : "voci"}`,
      };
    },
  },
});

export const menuType = defineType({
  name: "menu",
  title: "Menu",
  type: "document",
  fields: [
    defineField({
      name: "venue",
      title: "Venue",
      type: "string",
      options: {
        list: menuVenueOptions,
        layout: "radio",
      },
      validation: (Rule) => Rule.required().custom(validateVenueDocumentPair),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [menuCategory],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "wineSections",
      title: "Carta vini e bevande",
      type: "array",
      of: [wineSection],
      description:
        "Sezioni e voci visualizzate nella carta del locale. È possibile ordinare, aggiungere, nascondere o rimuovere le etichette.",
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      venue: "venue",
    },
    prepare({ venue }) {
      const option = menuVenueOptions.find(({ value }) => value === (venue as MenuVenue));
      return {
        title: option?.title || "Menu",
        subtitle: venue ? menuDocumentIds[venue as MenuVenue] : "Select a venue",
      };
    },
  },
});
