import { defineField, defineType } from "sanity";

export const faqItemType = defineType({
  name: "faqItem",
  title: "FAQ item",
  type: "document",
  fields: [
    defineField({ name: "question", type: "string" }),
    defineField({ name: "answer", type: "text" }),
    defineField({ name: "category", type: "string" }),
  ],
});
