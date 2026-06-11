"use client";

import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useConvex,
  useQuery as useConvexSubscription,
  type OptionalRestArgsOrSkip,
} from "convex/react";
import {
  getFunctionName,
  makeFunctionReference,
  type FunctionReference,
  type FunctionReturnType,
  type OptionalRestArgs,
} from "convex/server";
import { api } from "@/convex/_generated/api";
import type { DeprecationEntry } from "@/convex/versions";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// A non-finite or <= 0 version means git history was unavailable at build
// time (fresh local build) — those bundles are current, so route canonical.
const CLIENT_VERSION = Number(process.env.NEXT_PUBLIC_APP_VERSION ?? "");

export class FunctionRetiredError extends Error {
  constructor(fn: string) {
    super(
      `${fn} is no longer available for app version ${CLIENT_VERSION}. ` +
        "A new version of the app is available — refresh the page.",
    );
    this.name = "FunctionRetiredError";
  }
}

/**
 * Maps a canonical function reference to what this client version should
 * actually call: the reference itself, a deprecated replacement, or
 * "retired" when the old implementation has been dumped.
 */
function resolveRoutedReference<
  Ref extends FunctionReference<"query" | "mutation" | "action">,
>(
  ref: Ref,
  manifest: DeprecationEntry[],
  clientVersion: number,
): Ref | "retired" {
  if (!Number.isFinite(clientVersion) || clientVersion <= 0) {
    return ref;
  }
  const name = getFunctionName(ref);
  // Smallest lastSupportedVersion that still covers this client = the first
  // breaking change that happened after this bundle was built.
  let best: DeprecationEntry | null = null;
  for (const entry of manifest) {
    if (entry.fn !== name || clientVersion > entry.lastSupportedVersion) {
      continue;
    }
    if (best === null || entry.lastSupportedVersion < best.lastSupportedVersion) {
      best = entry;
    }
  }
  if (best === null) {
    return ref;
  }
  if (best.replacement === null) {
    return "retired";
  }
  // Sole type loosening of the routing system: the replacement intentionally
  // has the OLD runtime signature, and the only bundles routed here were
  // compiled against that signature, so their statically-checked args match.
  return makeFunctionReference(best.replacement) as unknown as Ref;
}

export type Database = {
  /** Run a query once and resolve with its result. */
  runQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
  /** Alias of runQuery, mirroring Convex's server-side naming. */
  fetchQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
  runMutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
    ...args: OptionalRestArgs<Mutation>
  ): Promise<FunctionReturnType<Mutation>>;
  runAction<Action extends FunctionReference<"action">>(
    action: Action,
    ...args: OptionalRestArgs<Action>
  ): Promise<FunctionReturnType<Action>>;
};

type Routing = {
  manifest: DeprecationEntry[] | undefined;
  refreshRequired: boolean;
  markRefreshRequired: () => void;
};

const DatabaseContext = createContext<Database | null>(null);
const RoutingContext = createContext<Routing | null>(null);

function createManifestStore() {
  let current: DeprecationEntry[] | undefined;
  let resolveFirst!: (manifest: DeprecationEntry[]) => void;
  const first = new Promise<DeprecationEntry[]>((resolve) => {
    resolveFirst = resolve;
  });
  return {
    set(manifest: DeprecationEntry[]) {
      const isFirst = current === undefined;
      current = manifest;
      if (isFirst) {
        resolveFirst(manifest);
      }
    },
    wait: () =>
      current !== undefined ? Promise.resolve(current) : first,
  };
}

/**
 * Catches the deploy-gap window: an active subscription can error server-side
 * after a new backend deploys but before the updated manifest reaches this
 * client. The boundary resets when the manifest changes, remounting children
 * under the new routing — self-healing without a reload.
 */
class RoutingErrorBoundary extends Component<
  { resetKey: unknown; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prevProps: { resetKey: unknown }) {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-mono text-sm tracking-widest uppercase opacity-60">
            Updating to the latest version…
          </p>
          <button
            onClick={() => window.location.reload()}
            className="border-2 border-current px-4 py-2 font-mono text-xs tracking-widest uppercase"
          >
            Refresh if this persists
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DatabaseBridge({ children }: { children: ReactNode }) {
  const client = useConvex();
  // Bootstrap subscription — bypasses routing by construction, because the
  // manifest query's contract is frozen and never needs routing itself.
  const manifest = useConvexSubscription(api.versions.manifest, {});
  const [store] = useState(createManifestStore);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const markRefreshRequired = useCallback(() => setRefreshRequired(true), []);

  useEffect(() => {
    if (manifest !== undefined) {
      store.set(manifest);
    }
  }, [manifest, store]);

  const db = useMemo<Database>(() => {
    const route = async <
      Ref extends FunctionReference<"query" | "mutation" | "action">,
    >(
      ref: Ref,
    ): Promise<Ref> => {
      const resolved = resolveRoutedReference(
        ref,
        await store.wait(),
        CLIENT_VERSION,
      );
      if (resolved === "retired") {
        markRefreshRequired();
        throw new FunctionRetiredError(getFunctionName(ref));
      }
      return resolved;
    };
    return {
      runQuery: async (query, ...args) =>
        client.query(await route(query), ...args),
      fetchQuery: async (query, ...args) =>
        client.query(await route(query), ...args),
      runMutation: async (mutation, ...args) =>
        client.mutation(await route(mutation), ...args),
      runAction: async (action, ...args) =>
        client.action(await route(action), ...args),
    };
  }, [client, store, markRefreshRequired]);

  const routing = useMemo<Routing>(
    () => ({ manifest, refreshRequired, markRefreshRequired }),
    [manifest, refreshRequired, markRefreshRequired],
  );

  return (
    <DatabaseContext.Provider value={db}>
      <RoutingContext.Provider value={routing}>
        <RoutingErrorBoundary resetKey={manifest}>
          {children}
        </RoutingErrorBoundary>
      </RoutingContext.Provider>
    </DatabaseContext.Provider>
  );
}

export default function DatabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <DatabaseBridge>{children}</DatabaseBridge>
    </ConvexProvider>
  );
}

export function useDatabase(): Database {
  const db = useContext(DatabaseContext);
  if (db === null) {
    throw new Error("useDatabase must be used inside <DatabaseProvider>");
  }
  return db;
}

function useRouting(): Routing {
  const routing = useContext(RoutingContext);
  if (routing === null) {
    throw new Error("useDatabaseQuery must be used inside <DatabaseProvider>");
  }
  return routing;
}

/** True when this bundle is too old for the backend — show a refresh prompt. */
export function useRefreshRequired(): boolean {
  return useRouting().refreshRequired;
}

/**
 * Live query subscription (re-renders when the underlying data changes),
 * routed through the deprecation manifest. Returns undefined until the
 * manifest has loaded, while the query loads, or when the function is
 * retired for this client version.
 */
export function useDatabaseQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): FunctionReturnType<Query> | undefined {
  const { manifest, markRefreshRequired } = useRouting();
  const callerSkip = args[0] === "skip";
  const resolved =
    manifest !== undefined && !callerSkip
      ? resolveRoutedReference(query, manifest, CLIENT_VERSION)
      : query;
  const retired = resolved === "retired";

  useEffect(() => {
    if (retired) {
      markRefreshRequired();
    }
  }, [retired, markRefreshRequired]);

  const skip = callerSkip || manifest === undefined || retired;
  return useConvexSubscription(
    retired ? query : (resolved as Query),
    ...([skip ? "skip" : (args[0] ?? {})] as OptionalRestArgsOrSkip<Query>),
  );
}
