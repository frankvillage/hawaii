import { defineField, defineType } from "sanity";

export const menuType = defineType({
  name: "menu",
  title: "Menu",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "menuType", type: "string" }),
    defineField({ name: "shortDescription", type: "text" }),
    defineField({ name: "pdfUrl", type: "url" }),
  ],
});
