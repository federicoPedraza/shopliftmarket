export default function VersionBadge() {
  return (
    <div
      title={`build ${process.env.NEXT_PUBLIC_APP_COMMIT}`}
      className="fixed right-3 bottom-2 z-50 font-mono text-[10px] tracking-widest opacity-30 select-none"
    >
      v{process.env.NEXT_PUBLIC_APP_VERSION}
    </div>
  );
}
