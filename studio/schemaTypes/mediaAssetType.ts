import { defineField, defineType } from "sanity";

export const mediaAssetType = defineType({
  name: "mediaAsset",
  title: "Media asset",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "assetType", type: "string" }),
    defineField({ name: "altText", type: "string" }),
    defineField({ name: "caption", type: "text" }),
  ],
});
