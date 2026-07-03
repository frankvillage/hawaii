import { defineField, defineType } from "sanity";

export const eventType = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "eventType", type: "string" }),
    defineField({ name: "summary", type: "text" }),
    defineField({ name: "startDate", type: "datetime" }),
    defineField({ name: "endDate", type: "datetime" }),
    defineField({ name: "bookingLink", type: "url" }),
  ],
});
