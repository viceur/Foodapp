"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product, ResolvedCart } from "@/lib/types";
import { RECIPE_MAP } from "@/data/recipes";
import { formatAmount, formatPrice } from "@/lib/format";
import MatsparHandoff from "@/components/MatsparHandoff";

const SELECTED_KEY = "matkassen:selected";
const PORTION_CHOICES = [2, 4, 6, 8];

type ViewMode = "recipe" | "category";

/** En rad som visas i korgen (från recept eller tillagd skafferivara). */
interface DisplayLine {
  key: string;
  name: string;
  unit: ResolvedCart["lines"][number]["unit"];
  requiredAmount: number;
  recipeIds: string[];
  product: Product | null;
  qty: number;
  isPantry: boolean;
}

export default function CartView() {
  const [recipeIds, setRecipeIds] = useState<string[] | null>(null);
  const [portions, setPortions] = useState(4);
  const [cart, setCart] = useState<ResolvedCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [addedPantry, setAddedPantry] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("recipe");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string" && RECIPE_MAP.has(id))
        : [];
      setRecipeIds(ids);
    } catch {
      setRecipeIds([]);
    }
  }, []);

  const fetchCart = useCallback(async (ids: string[], port: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipeIds: ids, portions: port }),
      });
      if (!res.ok) throw new Error(`Servern svarade ${res.status}`);
      const data: ResolvedCart = await res.json();
      setCart(data);
      setRemoved(new Set());
      setAddedPantry(new Set());
      setQuantities({});
    } catch {
      setError("Kunde inte hämta varukorgen. Försök igen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (recipeIds === null) return;
    if (recipeIds.length === 0) {
      setLoading(false);
      return;
    }
    fetchCart(recipeIds, portions);
  }, [recipeIds, portions, fetchCart]);

  function persistRecipes(next: string[]) {
    setRecipeIds(next);
    localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
  }

  function removeRecipe(id: string) {
    persistRecipes((recipeIds ?? []).filter((r) => r !== id));
  }

  function emptyCart() {
    persistRecipes([]);
    setCart(null);
  }

  // Aktiva rader: receptrader (ej borttagna) + tillagda skafferivaror.
  const activeLines: DisplayLine[] = useMemo(() => {
    if (!cart) return [];
    const fromRecipes: DisplayLine[] = cart.lines
      .filter((l) => !removed.has(l.ingredientKey))
      .map((l) => ({
        key: l.ingredientKey,
        name: l.product?.name ?? l.ingredientName,
        unit: l.unit,
        requiredAmount: l.requiredAmount,
        recipeIds: l.recipeIds,
        product: l.product,
        qty: quantities[l.ingredientKey] ?? l.quantity,
        isPantry: false,
      }));
    const fromPantry: DisplayLine[] = cart.pantryItems
      .filter((p) => addedPantry.has(p.key) && p.product)
      .map((p) => ({
        key: p.key,
        name: p.product?.name ?? p.name,
        unit: p.unit,
        requiredAmount: p.amount,
        recipeIds: p.recipeIds,
        product: p.product,
        qty: quantities[p.key] ?? 1,
        isPantry: true,
      }));
    return [...fromRecipes, ...fromPantry];
  }, [cart, removed, addedPantry, quantities]);

  const total = useMemo(
    () => activeLines.reduce((sum, l) => sum + (l.product ? l.product.price * l.qty : 0), 0),
    [activeLines],
  );

  const handoffItems = useMemo(
    () => activeLines.filter((l) => l.product).map((l) => ({ product: l.product!, qty: l.qty })),
    [activeLines],
  );

  const pantryNotAdded = useMemo(
    () => (cart ? cart.pantryItems.filter((p) => !addedPantry.has(p.key)) : []),
    [cart, addedPantry],
  );

  // Gruppering
  const byCategory = useMemo(() => {
    const map = new Map<string, DisplayLine[]>();
    for (const l of activeLines) {
      const cat = l.product?.category ?? "Övrigt";
      (map.get(cat) ?? map.set(cat, []).get(cat)!).push(l);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "sv"));
  }, [activeLines]);

  const byRecipe = useMemo(() => {
    const groups: { id: string; title: string; lines: DisplayLine[] }[] = [];
    for (const id of recipeIds ?? []) {
      const recipe = RECIPE_MAP.get(id);
      if (!recipe) continue;
      const lines = activeLines.filter((l) => l.recipeIds.includes(id));
      if (lines.length) groups.push({ id, title: recipe.title, lines });
    }
    return groups;
  }, [activeLines, recipeIds]);

  function setQty(key: string, qty: number) {
    setQuantities((q) => ({ ...q, [key]: Math.max(1, qty) }));
  }

  async function copyList() {
    const rows = activeLines.map((l) =>
      l.product
        ? `${l.qty} × ${l.product.name} ${formatAmount(l.product.packSize, l.product.packUnit)} – ${formatPrice(l.product.price * l.qty)}`
        : `${l.name} – ${formatAmount(l.requiredAmount, l.unit)}`,
    );
    const text = [`Inköpslista – Matkassen (${portions} portioner)`, "", ...rows, "", `Totalt: ${formatPrice(total)}`].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (recipeIds !== null && recipeIds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <p className="text-4xl">🛒</p>
        <h2 className="mt-2 text-lg font-semibold">Varukorgen är tom</h2>
        <p className="mt-1 text-sm text-stone-600">Välj några recept först, så bygger vi inköpslistan åt dig.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Till veckans förslag
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Valda recept + töm */}
      <section className="flex flex-wrap items-center gap-2">
        {(recipeIds ?? []).map((id) => {
          const recipe = RECIPE_MAP.get(id)!;
          return (
            <span
              key={id}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-3 pr-1 text-sm"
            >
              {recipe.title}
              <button
                type="button"
                onClick={() => removeRecipe(id)}
                className="rounded-full px-2 py-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label={`Ta bort ${recipe.title}`}
              >
                ✕
              </button>
            </span>
          );
        })}
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
          + Lägg till fler
        </Link>
      </section>

      {/* Kontroller: portioner + gruppering */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700">Portioner:</span>
          <div className="flex overflow-hidden rounded-full border border-stone-300 bg-white">
            {PORTION_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPortions(n)}
                className={`px-3 py-1.5 text-sm font-medium ${
                  portions === n ? "bg-emerald-600 text-white" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700">Gruppera:</span>
          <div className="flex overflow-hidden rounded-full border border-stone-300 bg-white">
            {(
              [
                ["recipe", "Per rätt"],
                ["category", "Per kategori"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium ${
                  viewMode === mode ? "bg-emerald-600 text-white" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      )}

      {!loading && cart && (
        <>
          {viewMode === "recipe"
            ? byRecipe.map((group) => (
                <CartSection
                  key={group.id}
                  title={group.title}
                  onRemove={() => removeRecipe(group.id)}
                  lines={group.lines}
                  showSharedNote
                  onQty={setQty}
                  onRemoveLine={(key) => setRemoved((r) => new Set(r).add(key))}
                />
              ))
            : byCategory.map(([category, lines]) => (
                <CartSection
                  key={category}
                  title={category}
                  lines={lines}
                  onQty={setQty}
                  onRemoveLine={(key) => setRemoved((r) => new Set(r).add(key))}
                />
              ))}

          {/* Skafferi-aside */}
          {pantryNotAdded.length > 0 && (
            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-sm font-semibold text-amber-900">🏠 Har du hemma?</h2>
              <p className="mt-0.5 text-xs text-amber-700">
                Kryddor och basvaror – behöver du köpa någon, lägg till den i korgen.
              </p>
              <ul className="mt-2 divide-y divide-amber-100">
                {pantryNotAdded.map((item) => (
                  <li key={item.key} className="flex items-center gap-2 py-1.5 text-sm text-amber-900">
                    <span className="flex-1">
                      {item.name} <span className="text-amber-600">· {formatAmount(item.amount, item.unit)}</span>
                    </span>
                    {item.product ? (
                      <button
                        type="button"
                        onClick={() => setAddedPantry((s) => new Set(s).add(item.key))}
                        className="rounded-full border border-amber-400 px-3 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                      >
                        + Lägg till
                      </button>
                    ) : (
                      <span className="text-xs text-amber-500">finns ej på Matspar</span>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Primär CTA: skicka till Matspar */}
          <MatsparHandoff items={handoffItems} />

          {/* Summering + sekundära åtgärder */}
          <section className="sticky bottom-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-stone-600">
                  {activeLines.length} varor · {(recipeIds ?? []).length} recept · {portions} portioner
                </p>
                <p className="text-2xl font-bold">{formatPrice(total)}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button type="button" onClick={copyList} className="font-medium text-stone-600 hover:text-stone-900">
                  {copied ? "✓ Kopierad" : "Kopiera lista"}
                </button>
                <button type="button" onClick={emptyCart} className="font-medium text-stone-400 hover:text-red-600">
                  Töm varukorg
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              {cart.provider === "matspar"
                ? "Produkter från matspar.se, valda för brett utbud (finns i de flesta butiker), lågt pris och svenskt ursprung 🇸🇪. Priser uppdateras med jämna mellanrum, inte live."
                : "Priser från inbyggd demokatalog."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  lines: DisplayLine[];
  onQty: (key: string, qty: number) => void;
  onRemoveLine: (key: string) => void;
  onRemove?: () => void;
  showSharedNote?: boolean;
}

function CartSection({ title, lines, onQty, onRemoveLine, onRemove, showSharedNote }: SectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-2">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-stone-400 hover:text-red-600">
            Ta bort rätt
          </button>
        )}
      </div>
      <ul className="divide-y divide-stone-100">
        {lines.map((line) => {
          const sharedWith = showSharedNote
            ? line.recipeIds.map((id) => RECIPE_MAP.get(id)?.title).filter((t): t is string => Boolean(t) && t !== title)
            : [];
          return (
            <li key={line.key} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {line.product?.url ? (
                    <a href={line.product.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {line.name} ↗
                    </a>
                  ) : (
                    line.name
                  )}
                  {line.product?.swedish && (
                    <span className="ml-1 align-middle" title="Svenskt ursprung">
                      🇸🇪
                    </span>
                  )}
                  {line.isPantry && <span className="ml-1 text-xs text-amber-600">(skafferi)</span>}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {line.product && (
                    <>
                      {line.product.brand} · {formatAmount(line.product.packSize, line.product.packUnit)} ·{" "}
                      {formatPrice(line.product.price)}/st
                    </>
                  )}
                  {sharedWith.length > 0 && <span className="text-emerald-600"> · delas med {sharedWith.join(", ")}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onQty(line.key, line.qty - 1)}
                  className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                  aria-label="Minska antal"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                <button
                  type="button"
                  onClick={() => onQty(line.key, line.qty + 1)}
                  className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                  aria-label="Öka antal"
                >
                  +
                </button>
              </div>
              <p className="w-20 text-right text-sm font-semibold">
                {line.product ? formatPrice(line.product.price * line.qty) : "–"}
              </p>
              <button
                type="button"
                onClick={() => onRemoveLine(line.key)}
                className="rounded-full px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                aria-label={`Ta bort ${line.name}`}
              >
                🗑
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
