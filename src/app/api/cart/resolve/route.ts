import { NextResponse } from "next/server";
import { RECIPE_MAP } from "@/data/recipes";
import { resolveCart } from "@/lib/cart";

interface ResolveRequest {
  recipeIds?: unknown;
  portions?: unknown;
}

export async function POST(request: Request) {
  let body: ResolveRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.recipeIds) ? body.recipeIds.filter((id): id is string => typeof id === "string") : [];
  const recipes = ids.map((id) => RECIPE_MAP.get(id)).filter((r) => r !== undefined);
  if (recipes.length === 0) {
    return NextResponse.json({ error: "Inga giltiga recept angivna" }, { status: 400 });
  }

  const portions = typeof body.portions === "number" && body.portions >= 1 && body.portions <= 12 ? body.portions : 4;

  const cart = await resolveCart(recipes, portions);
  return NextResponse.json(cart);
}
