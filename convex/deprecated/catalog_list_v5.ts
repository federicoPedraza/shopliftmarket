// FROZEN COPY — do not change the public signature (args/return shape).
// catalog:list from when the `filter` arg was required (unused placeholder).
// Serves bundles with NEXT_PUBLIC_APP_VERSION 2..5.
// Deprecated 2026-06-11; eligible for dumping after ~2026-07-02
// (see convex/deprecated/README.md for the cleanup procedure).
import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
  args: {
    filter: v.record(v.string(), v.any()),
  },
  handler: async (ctx) => {
    return await ctx.db.query("items").order("desc").take(100);
  },
});
