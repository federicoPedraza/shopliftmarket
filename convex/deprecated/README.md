# Deprecated Convex functions

Old browser tabs run old frontend bundles for hours or days, and the Convex
backend deploys *before* the frontend on Vercel. Any incompatible change to a
public function's args or behavior will crash those clients unless you follow
this workflow. `DatabaseProvider` routes each client to the right function
generation using the manifest in `convex/versions.ts`, which clients subscribe
to over the websocket — already-open tabs reroute instantly when a new backend
deploys.

## Deprecating or deleting a public query/mutation

Do all of this in the SAME commit as the breaking change:

1. Copy the current implementation to
   `convex/deprecated/<module>_<fn>_v<N>.ts`, importing from
   `"../_generated/server"`. Its public signature (args/return shape) is
   frozen forever. Its *body* may later be adapted if the schema changes under
   it — it runs against the live database.
2. Determine `N`: with your breaking change staged but **not yet committed**,
   run `git rev-list --count HEAD`. That is the version of the last bundle
   built with the old call sites. If you rebase before merging, re-run it and
   update the entry.
3. Add an entry to `DEPRECATIONS` in `convex/versions.ts`:
   ```ts
   { fn: "<module>:<fn>", lastSupportedVersion: N,
     replacement: "deprecated/<module>_<fn>_v<N>:<fn>",
     deprecatedAt: "<today>" }
   ```
   For a function deleted outright with no old-client support, use
   `replacement: null` — old clients get a "refresh" prompt instead.
4. Now make the breaking change to the canonical function and its call sites.
   Commit everything together.

If the same function breaks again later, add another entry with the new
`lastSupportedVersion`; the router picks the entry with the smallest
`lastSupportedVersion >=` the client's version, falling back to the canonical
function.

## Cleanup (after ~3 weeks)

Delete the `convex/deprecated/` file and set the entry's `replacement` to
`null` in the same commit. **Keep the null entry permanently** — it is the
tombstone that shows ancient tabs a refresh prompt instead of a crash.

## Local development

`next dev` reports app version 0, which the router treats as "current" —
dev always calls canonical functions, because a dirty working tree has the
newest call sites but the *parent commit's* count, which would otherwise
mis-route new calls to old validators. To simulate a stale client, run
`APP_VERSION_OVERRIDE=<version> bun run dev` (and temporarily revert the
call sites to that version's shape).

## Invariants

- Never change `versions:manifest`'s name, args, or entry shape; only add
  optional fields. It bootstraps routing for every client version ever
  shipped.
- Routing only protects calls made through `useDatabaseQuery` /
  `useDatabase()` — never import `useQuery` from `convex/react` in app code
  (ESLint enforces this).
- Bundles deployed before this system existed bypass it entirely; protection
  starts with the first build containing the router.
