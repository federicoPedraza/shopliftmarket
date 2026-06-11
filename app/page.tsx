"use client";

import {
  useDatabase,
  useDatabaseQuery,
} from "@/components/DatabaseProvider";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { FormEvent, useEffect, useState } from "react";

const QUICK_EMOJI = ["🍎", "🧀", "🥖", "🫙", "🧦", "🕯️", "📻", "🪴", "🧼", "🎁"];

const TINTS = ["#f6dcc4", "#dee8cd", "#f3e6ae", "#d6e4ec", "#eed7df"];

function tintFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return TINTS[sum % TINTS.length];
}

function tiltFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum * 31 + id.charCodeAt(i)) % 997;
  return ((sum % 5) - 2) * 0.4;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const items = useDatabaseQuery(api.catalog.list, { search: debouncedSearch });

  return (
    <main className="min-h-screen">
      <Ticker />
      <div className="mx-auto max-w-6xl px-5 pb-12">
        <Header count={items?.length} search={search} onSearchChange={setSearch} />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[340px_1fr]">
          <AddItemForm />
          <Shelf items={items} search={debouncedSearch} />
        </div>
      </div>
    </main>
  );
}

function Ticker() {
  const phrase =
    "SHOPLIFT GENERAL STORE — OPEN ALL HOURS — EVERYTHING MUST GO — STOCKED BY YOU — ";
  return (
    <div className="overflow-hidden border-b-2 border-ink bg-accent text-cream">
      <div className="ticker-track">
        {[0, 1].map((i) => (
          <span
            key={i}
            aria-hidden={i === 1}
            className="px-2 py-1.5 font-mono text-[11px] font-medium tracking-[0.25em] whitespace-nowrap"
          >
            {phrase.repeat(3)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({
  count,
  search,
  onSearchChange,
}: {
  count: number | undefined;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pt-12 pb-8">
      <div>
        <h1 className="font-display text-6xl leading-none font-black tracking-tight sm:text-8xl">
          Shoplift<span className="text-accent">*</span>
        </h1>
        <p className="mt-3 max-w-md text-lg leading-snug">
          The general store you stock yourself.{" "}
          <span className="text-ink/60">
            *Nothing is actually for sale. Or stolen.
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-2 border-ink bg-cream px-4 py-3 font-mono text-sm shadow-[5px_5px_0_0_var(--color-ink)]">
          <span className="text-accent font-semibold">
            {count === undefined ? "—" : count}
          </span>{" "}
          item{count === 1 ? "" : "s"} on the shelf
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search the shelf…"
          aria-label="Search items by name"
          className="w-48 border-2 border-ink bg-cream px-4 py-3 font-mono text-sm shadow-[5px_5px_0_0_var(--color-ink)] outline-none placeholder:text-ink/40 focus:shadow-[5px_5px_0_0_var(--color-accent)] sm:w-60"
        />
      </div>
    </header>
  );
}

function AddItemForm() {
  const db = useDatabase();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🍎");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError("Price needs to be a number, like 4.99.");
      return;
    }
    setSaving(true);
    try {
      await db.runMutation(api.catalog.add, {
        name,
        description,
        priceCents,
        emoji,
      });
      setName("");
      setPrice("");
      setDescription("");
    } catch {
      setError("Couldn't save the item. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border-2 border-ink bg-paper px-3 py-2 text-base outline-none placeholder:text-ink/40 focus:bg-cream focus:shadow-[3px_3px_0_0_var(--color-accent)] transition-shadow";

  return (
    <aside className="h-fit lg:sticky lg:top-6">
      <form
        onSubmit={handleSubmit}
        className="border-2 border-ink bg-cream p-5 shadow-[7px_7px_0_0_var(--color-ink)]"
      >
        <h2 className="font-mono text-xs font-semibold tracking-[0.25em] text-accent uppercase">
          ▚ Stock the shelf
        </h2>

        <label className="mt-5 block">
          <span className="font-mono text-xs tracking-widest uppercase">
            Item name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Heirloom tomato"
            className={`${inputClass} mt-1.5`}
            maxLength={60}
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono text-xs tracking-widest uppercase">
            Price (USD)
          </span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="4.99"
            inputMode="decimal"
            className={`${inputClass} mt-1.5 font-mono`}
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono text-xs tracking-widest uppercase">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Grown out back. Suspiciously perfect."
            rows={3}
            className={`${inputClass} mt-1.5 resize-none`}
            maxLength={200}
          />
        </label>

        <fieldset className="mt-4">
          <legend className="font-mono text-xs tracking-widest uppercase">
            Sticker
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUICK_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                className={`flex h-9 w-9 items-center justify-center border-2 text-lg transition-transform hover:-translate-y-0.5 ${
                  emoji === e
                    ? "border-accent bg-accent/10 shadow-[2px_2px_0_0_var(--color-accent)]"
                    : "border-ink/25 bg-paper"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="border-accent bg-accent/10 mt-4 border-l-4 px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-cream hover:bg-accent mt-5 w-full border-2 border-ink px-4 py-3 font-mono text-sm font-semibold tracking-[0.2em] uppercase transition-colors disabled:opacity-50"
        >
          {saving ? "Stocking…" : "Put it on the shelf →"}
        </button>
      </form>
    </aside>
  );
}

function Shelf({
  items,
  search,
}: {
  items: Doc<"items">[] | undefined;
  search: string;
}) {
  if (items === undefined) {
    return (
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse border-2 border-ink/15 bg-cream/60"
          />
        ))}
      </section>
    );
  }

  if (items.length === 0) {
    if (search.trim() !== "") {
      return (
        <section className="flex min-h-64 flex-col items-center justify-center border-2 border-dashed border-ink/40 p-10 text-center">
          <p className="font-display text-4xl font-bold">
            Nothing matches &ldquo;{search.trim()}&rdquo;.
          </p>
          <p className="text-ink/60 mt-2 max-w-sm">
            Try a different name, or stock it yourself with the form.
          </p>
        </section>
      );
    }
    return (
      <section className="flex min-h-64 flex-col items-center justify-center border-2 border-dashed border-ink/40 p-10 text-center">
        <p className="font-display text-4xl font-bold">The shelves are bare.</p>
        <p className="text-ink/60 mt-2 max-w-sm">
          A store with nothing in it is just a room. Stock your first item with
          the form.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard key={item._id} item={item} index={i} />
      ))}
    </section>
  );
}

function ItemCard({ item, index }: { item: Doc<"items">; index: number }) {
  const db = useDatabase();
  const [removing, setRemoving] = useState(false);

  async function handleRemove(id: Id<"items">) {
    setRemoving(true);
    try {
      await db.runMutation(api.catalog.remove, { id });
    } catch {
      setRemoving(false);
    }
  }

  return (
    <article
      className={`card-rise group relative flex flex-col border-2 border-ink bg-cream shadow-[5px_5px_0_0_var(--color-ink)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_0_var(--color-accent)] ${
        removing ? "opacity-40" : ""
      }`}
      style={{
        animationDelay: `${Math.min(index, 11) * 50}ms`,
        rotate: `${tiltFor(item._id)}deg`,
      }}
    >
      <button
        onClick={() => handleRemove(item._id)}
        disabled={removing}
        aria-label={`Remove ${item.name}`}
        title="Remove from shelf"
        className="bg-cream text-ink hover:bg-accent hover:text-cream absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-ink font-mono text-sm leading-none opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100"
      >
        ✕
      </button>

      <div
        className="flex h-36 items-center justify-center border-b-2 border-ink text-6xl"
        style={{ backgroundColor: tintFor(item._id) }}
      >
        <span className="drop-shadow-[2px_3px_0_rgba(33,29,24,0.18)] transition-transform group-hover:scale-110 group-hover:-rotate-6">
          {item.emoji}
        </span>
      </div>

      <div className="flex grow flex-col p-4">
        <h3 className="font-display text-2xl leading-tight font-bold">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-ink/70 mt-1.5 text-sm leading-snug">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="bg-accent text-cream px-2.5 py-1 font-mono text-sm font-semibold">
            {formatPrice(item.priceCents)}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
            № {String(item._creationTime).slice(-4)}
          </span>
        </div>
      </div>
    </article>
  );
}
