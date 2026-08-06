import { defineArrayMember, defineField, defineType } from "sanity";
import type { ValidationContext } from "sanity";

import { allergenDefinitions, areUniqueAllergenCodes, isMenuPrice } from "../../shared/menu-contract";

const menuDocumentIds = {
  hawaii: "menu-hawaii",
  muulab: "menu-muulab",
} as const;

type MenuVenue = keyof typeof menuDocumentIds;

const menuVenueOptions = [
  { title: "Hawaii Ristorante - Piano terra", value: "hawaii" },
  { title: "MUULab Riviera - Terrazza", value: "muulab" },
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
    return "Questo menu non è associato correttamente al locale. Contattare l'amministratore.";
  }

  const documentId = context.document?._id?.replace(/^drafts\./, "");
  const expectedDocumentId = menuDocumentIds[venue];

  return (
    documentId === expectedDocumentId ||
    "Questo menu non è associato correttamente al documento previsto. Contattare l'amministratore."
  );
}

function validateMenuPrice(price: unknown): true | string {
  return (
    price === undefined ||
    isMenuPrice(price) ||
    "Usa formati come € 8, € 8,50, da € 8 oppure € 12 l'etto."
  );
}

function validateAllergens(allergens: unknown): true | string {
  return (
    allergens === undefined ||
    areUniqueAllergenCodes(allergens) ||
    "Seleziona ogni allergene una sola volta."
  );
}

const menuDish = defineArrayMember({
  name: "menuDish",
  title: "Piatto o voce del menu",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Nome del piatto o della voce",
      type: "string",
      description: "È il nome che sarà mostrato sul sito.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Prezzo",
      type: "string",
      description: "Esempi: € 8, € 8,50, da € 8, € 12 l'etto. Può restare vuoto.",
      validation: (Rule) => Rule.custom(validateMenuPrice),
    }),
    defineField({
      name: "note",
      title: "Ingredienti o descrizione",
      type: "text",
      rows: 2,
      description:
        "Per le pizze, indica tutti gli ingredienti. Per gli altri piatti puoi aggiungere una breve descrizione.",
    }),
    defineField({
      name: "available",
      title: "Visibile sul sito",
      type: "boolean",
      description: "Disattiva per nascondere questa voce dal sito senza eliminarla.",
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "allergens",
      title: "Allergeni",
      type: "array",
      description: "Seleziona solo gli allergeni presenti nella voce originale del menu.",
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
        title: name || "Voce senza nome",
        subtitle: [available === false ? "Non visibile sul sito" : "", price]
          .filter(Boolean)
          .join(" - "),
      };
    },
  },
});

const menuCategory = defineArrayMember({
  name: "menuCategory",
  title: "Sezione del menu",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Titolo della sezione",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "note",
      title: "Nota introduttiva (facoltativa)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "dishes",
      title: "Piatti e voci",
      type: "array",
      of: [menuDish],
      description: "Aggiungi, ordina o modifica le voci visualizzate in questa sezione.",
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
        title: title || "Sezione senza titolo",
        subtitle: `${dishCount} ${dishCount === 1 ? "voce" : "voci"}`,
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
      title: "Nome dell'etichetta o della bevanda",
      type: "string",
      description: "Inserisci il nome completo che deve apparire nella carta.",
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
      title: "Visibile sul sito",
      type: "boolean",
      description: "Disattiva per nascondere questa voce dal sito senza eliminarla.",
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
        subtitle: [available === false ? "Non visibile sul sito" : "", price]
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
      description: "Aggiungi, ordina o modifica le etichette di questa sezione.",
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
  title: "Menu del locale",
  type: "document",
  fields: [
    defineField({
      name: "venue",
      title: "Locale associato",
      type: "string",
      hidden: true,
      readOnly: true,
      options: {
        list: menuVenueOptions,
        layout: "radio",
      },
      validation: (Rule) => Rule.required().custom(validateVenueDocumentPair),
    }),
    defineField({
      name: "categories",
      title: "Menu: piatti e categorie",
      type: "array",
      of: [menuCategory],
      description:
        "Gestisci le sezioni nell'ordine in cui appariranno sul sito. Apri una sezione per modificare piatti, prezzi, ingredienti e allergeni.",
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
        title: option?.title || "Menu del locale",
        subtitle: "Menu, bevande e carta vini",
      };
    },
  },
});
