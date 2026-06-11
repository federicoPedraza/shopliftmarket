// FROZEN COPY — do not change the public signature (args/return shape).
// catalog:list from before the `search` arg became required.
// Serves bundles with NEXT_PUBLIC_APP_VERSION == 6.
// Deprecated 2026-06-11; eligible for dumping after ~2026-07-02
// (see convex/deprecated/README.md for the cleanup procedure).
import { query } from "../_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("items").order("desc").take(100);
  },
});
