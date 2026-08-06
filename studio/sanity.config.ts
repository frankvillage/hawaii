import { itITLocale } from "@sanity/locale-it-it";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

export default defineConfig({
  name: "default",
  title: "Hawaii Urban Village",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET || "your-dataset",
  plugins: [structureTool({ structure }), itITLocale()],
  schema: {
    types: schemaTypes,
    templates: () => [
      {
        id: "menu-hawaii",
        title: "Ripristina Hawaii Ristorante - Piano terra",
        schemaType: "menu",
        value: { venue: "hawaii" },
      },
      {
        id: "menu-muulab",
        title: "Ripristina MUULab Riviera - Terrazza",
        schemaType: "menu",
        value: { venue: "muulab" },
      },
    ],
  },
  document: {
    newDocumentOptions: () => [],
    actions: (actions, context) =>
      context.schemaType === "menu"
        ? actions.filter(
            ({ action }) => !["delete", "duplicate", "unpublish"].includes(action ?? ""),
          )
        : actions,
  },
});
