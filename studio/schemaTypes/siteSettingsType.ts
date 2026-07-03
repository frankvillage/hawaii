import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "siteTitle", type: "string" }),
    defineField({ name: "payoff", type: "string" }),
    defineField({ name: "restaurantPhone", type: "string" }),
    defineField({ name: "beachPhone", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "address", type: "text" }),
    defineField({ name: "instagramUrl", type: "url" }),
    defineField({ name: "facebookUrl", type: "url" }),
  ],
});
