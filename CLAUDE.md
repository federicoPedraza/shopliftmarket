<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

Before changing or deleting any public Convex function's signature, follow the
deprecation workflow in `convex/deprecated/README.md` — old frontend bundles
keep calling old signatures, and `DatabaseProvider` routes them to deprecated
copies based on the client version manifest in `convex/versions.ts`.
