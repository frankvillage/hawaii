import { defineField, defineType } from "sanity";

export const sportOfferingType = defineType({
  name: "sportOffering",
  title: "Sport offering",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "sportType", type: "string" }),
    defineField({ name: "summary", type: "text" }),
    defineField({ name: "bookingLink", type: "url" }),
  ],
});
