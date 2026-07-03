import { defineField, defineType } from "sanity";

export const pageType = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "pageType", type: "string" }),
    defineField({ name: "eyebrow", type: "string" }),
    defineField({ name: "lead", type: "text" }),
    defineField({ name: "intro", type: "text" }),
    defineField({ name: "primaryLabel", type: "string" }),
    defineField({ name: "primaryHref", type: "string" }),
    defineField({
      name: "sections",
      type: "array",
      of: [
        defineField({
          name: "section",
          type: "object",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({ name: "body", type: "text" }),
            defineField({ name: "bullets", type: "array", of: [{ type: "string" }] }),
          ],
        }),
      ],
    }),
  ],
});
