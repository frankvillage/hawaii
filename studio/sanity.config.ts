import { defineConfig } from "sanity";

import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "Hawaii Urban Village",
  projectId: process.env.SANITY_PROJECT_ID || "project-id",
  dataset: process.env.SANITY_DATASET || "production",
  schema: {
    types: schemaTypes,
  },
});
