import { defineField, defineType } from "sanity";

export const homepageType = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({ name: "heroHeadline", type: "string" }),
    defineField({ name: "heroSummary", type: "text" }),
    defineField({
      name: "chapters",
      type: "array",
      of: [{ type: "reference", to: [{ type: "narrativeChapter" }] }],
    }),
    defineField({ name: "seoTitle", type: "string" }),
    defineField({ name: "seoDescription", type: "text" }),
  ],
});
