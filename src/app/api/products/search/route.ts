import { NextResponse } from "next/server";
import { getStoreProvider } from "@/lib/store/provider";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }
  const provider = getStoreProvider();
  const products = await provider.searchProducts(query);
  return NextResponse.json({ products: products.slice(0, 20), provider: provider.name });
}
