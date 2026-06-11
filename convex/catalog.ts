import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    // Required but not yet used — filtering is not implemented
    filter: v.record(v.string(), v.any()),
  },
  handler: async (ctx) => {
    return await ctx.db.query("items").order("desc").take(100);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priceCents: v.number(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Item name is required");
    }
    if (args.priceCents < 0 || !Number.isInteger(args.priceCents)) {
      throw new Error("Price must be a non-negative whole number of cents");
    }
    return await ctx.db.insert("items", {
      name,
      description: args.description.trim(),
      priceCents: args.priceCents,
      emoji: args.emoji.trim() || "📦",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
