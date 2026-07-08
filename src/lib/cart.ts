import type { CartLine, Recipe, ResolvedCart } from "@/lib/types";
import { getStoreProvider } from "@/lib/store/provider";

/**
 * Slår ihop ingredienser från valda recept till en inköpslista:
 * samma ingrediensnyckel summeras över recepten, matchas mot en produkt
 * och antalet förpackningar beräknas (avrundat uppåt).
 */
export async function resolveCart(recipes: Recipe[], portions: number): Promise<ResolvedCart> {
  const provider = getStoreProvider();
  const factor = portions / 4; // receptmängderna gäller 4 portioner

  const merged = new Map<
    string,
    { name: string; amount: number; unit: CartLine["unit"]; recipeIds: string[]; pantry: boolean }
  >();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const existing = merged.get(ing.key);
      if (existing) {
        existing.amount += ing.amount * factor;
        if (!existing.recipeIds.includes(recipe.id)) existing.recipeIds.push(recipe.id);
      } else {
        merged.set(ing.key, {
          name: ing.name,
          amount: ing.amount * factor,
          unit: ing.unit,
          recipeIds: [recipe.id],
          pantry: ing.pantry ?? false,
        });
      }
    }
  }

  const lines: CartLine[] = [];
  const pantryItems: ResolvedCart["pantryItems"] = [];

  for (const [key, item] of merged) {
    if (item.pantry) {
      pantryItems.push({ name: item.name, amount: Math.round(item.amount), unit: item.unit });
      continue;
    }
    const product = await provider.productForIngredient(key, item.name);
    // Ingredienser i "st" (lök, citron, morot...) räknas som ett paket per styck,
    // oavsett om butiken själv väger produkten i gram (t.ex. "Gullök i knippe 250g").
    const quantity = !product
      ? 1
      : item.unit === "st"
        ? Math.max(1, Math.ceil(item.amount))
        : product.packUnit === item.unit
          ? Math.max(1, Math.ceil(item.amount / product.packSize))
          : 1;
    lines.push({
      ingredientKey: key,
      ingredientName: item.name,
      requiredAmount: Math.round(item.amount * 10) / 10,
      unit: item.unit,
      recipeIds: item.recipeIds,
      product,
      quantity,
    });
  }

  lines.sort((a, b) => (a.product?.category ?? "Övrigt").localeCompare(b.product?.category ?? "Övrigt", "sv"));
  pantryItems.sort((a, b) => a.name.localeCompare(b.name, "sv"));

  const totalPrice = lines.reduce((sum, line) => sum + (line.product ? line.product.price * line.quantity : 0), 0);

  return { lines, pantryItems, totalPrice: Math.round(totalPrice * 100) / 100, provider: provider.name };
}
