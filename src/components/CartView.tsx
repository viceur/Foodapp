"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ResolvedCart } from "@/lib/types";
import { RECIPE_MAP } from "@/data/recipes";
import { formatAmount, formatPrice } from "@/lib/format";

const SELECTED_KEY = "matkassen:selected";
const PORTION_CHOICES = [2, 4, 6, 8];

export default function CartView() {
  const [recipeIds, setRecipeIds] = useState<string[] | null>(null);
  const [portions, setPortions] = useState(4);
  const [cart, setCart] = useState<ResolvedCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
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

  function removeRecipe(id: string) {
    const next = (recipeIds ?? []).filter((r) => r !== id);
    setRecipeIds(next);
    localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
  }

  const activeLines = useMemo(
    () => (cart ? cart.lines.filter((l) => !removed.has(l.ingredientKey)) : []),
    [cart, removed],
  );

  const total = useMemo(
    () =>
      activeLines.reduce((sum, line) => {
        const qty = quantities[line.ingredientKey] ?? line.quantity;
        return sum + (line.product ? line.product.price * qty : 0);
      }, 0),
    [activeLines, quantities],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof activeLines>();
    for (const line of activeLines) {
      const cat = line.product?.category ?? "Övrigt";
      const arr = map.get(cat) ?? [];
      arr.push(line);
      map.set(cat, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "sv"));
  }, [activeLines]);

  async function copyList() {
    if (!cart) return;
    const rows = activeLines.map((line) => {
      const qty = quantities[line.ingredientKey] ?? line.quantity;
      return line.product
        ? `${qty} × ${line.product.name} ${formatAmount(line.product.packSize, line.product.packUnit)} – ${formatPrice(line.product.price * qty)}`
        : `${line.ingredientName} – ${formatAmount(line.requiredAmount, line.unit)}`;
    });
    const pantry = cart.pantryItems.map((item) => `(hemma?) ${item.name} – ${formatAmount(item.amount, item.unit)}`);
    const text = [
      `Inköpslista – Matkassen (${portions} portioner)`,
      "",
      ...rows,
      "",
      "Kolla att du har hemma:",
      ...pantry,
      "",
      `Totalt: ${formatPrice(total)}`,
    ].join("\n");
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
    <div className="space-y-6">
      {/* Valda recept */}
      <section className="flex flex-wrap items-center gap-2">
        {(recipeIds ?? []).map((id) => {
          const recipe = RECIPE_MAP.get(id)!;
          return (
            <span
              key={id}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-3 pr-1 text-sm"
            >
              <span aria-hidden>{recipe.emoji}</span> {recipe.title}
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

      {/* Portionsväljare */}
      <section className="flex items-center gap-3">
        <span className="text-sm font-medium text-stone-700">Portioner per recept:</span>
        <div className="flex overflow-hidden rounded-full border border-stone-300 bg-white">
          {PORTION_CHOICES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPortions(n)}
              className={`px-4 py-1.5 text-sm font-medium ${
                portions === n ? "bg-emerald-600 text-white" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      )}

      {!loading && cart && (
        <>
          {grouped.map(([category, lines]) => (
            <section key={category} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <h2 className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700">
                {category}
              </h2>
              <ul className="divide-y divide-stone-100">
                {lines.map((line) => {
                  const qty = quantities[line.ingredientKey] ?? line.quantity;
                  return (
                    <li key={line.ingredientKey} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {line.product ? line.product.name : line.ingredientName}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {line.product && (
                            <>
                              {line.product.brand} · {formatAmount(line.product.packSize, line.product.packUnit)} ·{" "}
                              {formatPrice(line.product.price)}/st ·{" "}
                            </>
                          )}
                          behövs {formatAmount(line.requiredAmount, line.unit)} till{" "}
                          {line.recipeIds
                            .map((id) => RECIPE_MAP.get(id)?.title)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities((q) => ({ ...q, [line.ingredientKey]: Math.max(1, qty - 1) }))
                          }
                          className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                          aria-label="Minska antal"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQuantities((q) => ({ ...q, [line.ingredientKey]: qty + 1 }))}
                          className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                          aria-label="Öka antal"
                        >
                          +
                        </button>
                      </div>
                      <p className="w-20 text-right text-sm font-semibold">
                        {line.product ? formatPrice(line.product.price * qty) : "–"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setRemoved((r) => new Set(r).add(line.ingredientKey))}
                        className="rounded-full px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        aria-label={`Ta bort ${line.ingredientName}`}
                      >
                        🗑
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {cart.pantryItems.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-sm font-semibold text-amber-800">🏠 Kolla att du har hemma</h2>
              <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm text-amber-900 sm:grid-cols-2">
                {cart.pantryItems.map((item) => (
                  <li key={item.name} className="flex justify-between gap-2">
                    <span>{item.name}</span>
                    <span className="text-amber-700">{formatAmount(item.amount, item.unit)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="sticky bottom-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-stone-600">
                  {activeLines.length} varor · {(recipeIds ?? []).length} recept · {portions} portioner
                </p>
                <p className="text-2xl font-bold">{formatPrice(total)}</p>
              </div>
              <button
                type="button"
                onClick={copyList}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {copied ? "✓ Kopierad!" : "📋 Kopiera inköpslista"}
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              {cart.provider === "matspar"
                ? "Priser hämtade via Matspar."
                : "Priser från inbyggd demokatalog – koppla på Matspar via STORE_PROVIDER=matspar."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
