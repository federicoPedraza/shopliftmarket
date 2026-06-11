import { query } from "./_generated/server";

export type DeprecationEntry = {
  /** Canonical function name in `getFunctionName` format, e.g. "catalog:list". */
  fn: string;
  /** Highest NEXT_PUBLIC_APP_VERSION whose bundles still call the OLD signature. */
  lastSupportedVersion: number;
  /**
   * Routed path under convex/, e.g. "deprecated/catalog_list_v1:list".
   * null = retired: the deprecated copy was dumped; old clients get a
   * "new version available — refresh" prompt instead of a crash.
   */
  replacement: string | null;
  /** ISO date the deprecation was recorded — drives cleanup timing. */
  deprecatedAt: string;
  note?: string;
};

// See convex/deprecated/README.md for the workflow that maintains this list.
export const DEPRECATIONS: DeprecationEntry[] = [
  {
    fn: "catalog:list",
    lastSupportedVersion: 1,
    replacement: "deprecated/catalog_list_v1:list",
    deprecatedAt: "2026-06-11",
    note: "`filter` arg became required",
  },
  {
    fn: "catalog:list",
    lastSupportedVersion: 5,
    replacement: "deprecated/catalog_list_v5:list",
    deprecatedAt: "2026-06-11",
    note: "`filter` arg removed again",
  },
];

/**
 * FROZEN CONTRACT — this query bootstraps function routing for every client
 * version ever shipped, so it can never itself be versioned. Its name, its
 * empty args, and the DeprecationEntry shape must never change incompatibly;
 * new entry fields must be optional.
 */
export const manifest = query({
  args: {},
  handler: async () => DEPRECATIONS,
});
