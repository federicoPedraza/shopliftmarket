import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function git(command: string): string | null {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

// Version = number of commits on the current branch. Every commit that
// lands on main bumps it by one when the deployment rebuilds.
// Requires full git history at build time (set VERCEL_DEEP_CLONE=true on
// Vercel — shallow clones undercount).
// APP_VERSION_OVERRIDE exists to simulate a stale client locally
// (e.g. APP_VERSION_OVERRIDE=1 bun run dev) — never set it on Vercel.
const version =
  process.env.APP_VERSION_OVERRIDE ?? git("git rev-list --count HEAD") ?? "0";

const commit =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  git("git rev-parse --short HEAD") ??
  "local";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: commit,
  },
};

export default nextConfig;
