import type { Product } from "@/lib/types";
import { productForIngredient, searchCatalog } from "@/data/catalog";
import { MATSPAR_PRODUCTS } from "@/data/matspar-snapshot";

/**
 * Abstraktion över "butiken" som varukorgen byggs mot.
 *
 * - `matspar` (default) – riktiga produkter och priser hämtade från matspar.se.
 *   Matspar har inget publikt/dokumenterat API – priserna kommer från en
 *   ögonblicksbild (`src/data/matspar-snapshot.ts`) som genereras av
 *   `npm run fetch:matspar`. Snapshotet läser produktdata som Matspars egna
 *   kategorisidor bäddar in server-side (`window.__PAGEDATA__`). Detta är
 *   medvetet INTE en livefråga per request: Matspar publicerar ingen sådan
 *   endpoint, och att gissa oss fram till en dold sådan vid varje sidladdning
 *   vore både opålitligt och otrevligt mot deras servrar.
 * - `mock` – handskriven katalog som alltid finns kvar som säkerhetsnät för
 *   ingredienser snapshotet saknar.
 *
 * Välj provider med env-variabeln STORE_PROVIDER=mock|matspar (default matspar).
 */
export interface StoreProvider {
  readonly name: "mock" | "matspar";
  searchProducts(query: string): Promise<Product[]>;
  productForIngredient(key: string, displayName: string): Promise<Product | null>;
}

const mockProvider: StoreProvider = {
  name: "mock",
  async searchProducts(query) {
    return searchCatalog(query);
  },
  async productForIngredient(key) {
    return productForIngredient(key);
  },
};

const matsparByKey = new Map<string, Product>();
for (const product of MATSPAR_PRODUCTS) {
  for (const key of product.ingredientKeys) matsparByKey.set(key, product);
}

const matsparProvider: StoreProvider = {
  name: "matspar",
  async searchProducts(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits = MATSPAR_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
    return hits.length > 0 ? hits : mockProvider.searchProducts(query);
  },
  async productForIngredient(key, displayName) {
    return matsparByKey.get(key) ?? mockProvider.productForIngredient(key, displayName);
  },
};

export function getStoreProvider(): StoreProvider {
  return process.env.STORE_PROVIDER === "mock" ? mockProvider : matsparProvider;
}
