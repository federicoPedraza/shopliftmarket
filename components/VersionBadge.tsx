"use client";

import { useRefreshRequired } from "@/components/DatabaseProvider";

export default function VersionBadge() {
  const refreshRequired = useRefreshRequired();

  if (refreshRequired) {
    return (
      <button
        onClick={() => window.location.reload()}
        className="bg-ink text-cream fixed right-3 bottom-2 z-50 border-2 border-ink px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase shadow-[3px_3px_0_0_var(--color-accent)] transition-transform hover:-translate-y-0.5"
      >
        v{process.env.NEXT_PUBLIC_APP_VERSION} — new version available, refresh
      </button>
    );
  }

  return (
    <div
      title={`build ${process.env.NEXT_PUBLIC_APP_COMMIT}`}
      className="fixed right-3 bottom-2 z-50 font-mono text-[10px] tracking-widest opacity-30 select-none"
    >
      v{process.env.NEXT_PUBLIC_APP_VERSION}
    </div>
  );
}
