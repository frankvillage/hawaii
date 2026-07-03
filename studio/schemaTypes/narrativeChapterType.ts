import { defineField, defineType } from "sanity";

export const narrativeChapterType = defineType({
  name: "narrativeChapter",
  title: "Narrative chapter",
  type: "document",
  fields: [
    defineField({ name: "internalName", type: "string" }),
    defineField({ name: "slug", type: "slug", options: { source: "internalName" } }),
    defineField({ name: "daypart", type: "string" }),
    defineField({ name: "soulType", type: "string" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "summary", type: "text" }),
    defineField({ name: "detail", type: "text" }),
    defineField({ name: "primaryLabel", type: "string" }),
    defineField({ name: "primaryHref", type: "string" }),
    defineField({ name: "secondaryLabel", type: "string" }),
    defineField({ name: "secondaryHref", type: "string" }),
  ],
});
