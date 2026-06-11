"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useConvex,
  useQuery as useConvexSubscription,
} from "convex/react";
import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

const DatabaseContext = createContext<Database | null>(null);

function DatabaseBridge({ children }: { children: ReactNode }) {
  const client = useConvex();
  const db = useMemo<Database>(
    () => ({
      runQuery: (query, ...args) => client.query(query, ...args),
      fetchQuery: (query, ...args) => client.query(query, ...args),
      runMutation: (mutation, ...args) => client.mutation(mutation, ...args),
      runAction: (action, ...args) => client.action(action, ...args),
    }),
    [client],
  );
  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
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

/**
 * Live query subscription (re-renders when the underlying data changes).
 * Kept as a hook because subscriptions tie into the component lifecycle,
 * unlike the one-shot db.runQuery.
 */
export const useDatabaseQuery = useConvexSubscription;
