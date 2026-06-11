import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    name: v.string(),
    description: v.string(),
    // Price in cents to avoid floating point issues
    priceCents: v.number(),
    emoji: v.string(),
  }).searchIndex("search_name", {
    searchField: "name",
  }),
});
