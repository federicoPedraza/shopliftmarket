import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...convexPlugin.configs.recommended,
  {
    // All Convex calls must go through DatabaseProvider so they pass the
    // version-routing manifest (see convex/deprecated/README.md).
    files: ["app/**", "components/**"],
    ignores: ["components/DatabaseProvider.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "convex/react",
              message:
                "Use useDatabase/useDatabaseQuery from components/DatabaseProvider so calls go through version routing.",
            },
          ],
        },
      ],
    },
  },
]);
