import type { Product } from "@/lib/types";
import { productForIngredient, searchCatalog } from "@/data/catalog";

/**
 * Abstraktion över "butiken" som varukorgen byggs mot.
 *
 * - `mock`   – inbyggd katalog (default). Fungerar alltid, realistiska priser.
 * - `matspar` – experimentell klient mot Matspars inofficiella API. Matspar har
 *   inget publikt API, så endpoint och svarformat kan ändras när som helst.
 *   Vid fel faller vi alltid tillbaka på mock-katalogen.
 *
 * Välj provider med env-variabeln STORE_PROVIDER=matspar|mock.
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

/** Bas-URL kan pekas om via env om Matspar flyttar sitt API. */
const MATSPAR_BASE = process.env.MATSPAR_API_BASE ?? "https://api.matspar.se";
const MATSPAR_TIMEOUT_MS = 5000;

interface MatsparHit {
  id?: number | string;
  name?: string;
  title?: string;
  brand?: string;
  manufacturer?: string;
  price?: number;
  current_price?: number;
  amount?: number;
  unit?: string;
  category?: string;
}

function parseMatsparHit(hit: MatsparHit): Product | null {
  const name = hit.name ?? hit.title;
  const price = hit.price ?? hit.current_price;
  if (!name || typeof price !== "number") return null;
  const unit = hit.unit === "ml" || hit.unit === "l" ? "ml" : hit.unit === "kg" || hit.unit === "g" ? "g" : "st";
  const rawAmount = typeof hit.amount === "number" && hit.amount > 0 ? hit.amount : 1;
  const packSize = hit.unit === "kg" || hit.unit === "l" ? rawAmount * 1000 : rawAmount;
  return {
    id: `matspar-${hit.id ?? name}`,
    name,
    brand: hit.brand ?? hit.manufacturer ?? "Matspar",
    packSize,
    packUnit: unit,
    price,
    category: hit.category ?? "Övrigt",
    ingredientKeys: [],
    source: "matspar",
  };
}

async function matsparSearch(query: string): Promise<Product[]> {
  const res = await fetch(`${MATSPAR_BASE}/search?query=${encodeURIComponent(query)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(MATSPAR_TIMEOUT_MS),
    // Produktdata ändras sällan under en session
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Matspar svarade ${res.status}`);
  const body: unknown = await res.json();
  const hits: MatsparHit[] = Array.isArray(body)
    ? (body as MatsparHit[])
    : Array.isArray((body as { products?: MatsparHit[] }).products)
      ? (body as { products: MatsparHit[] }).products
      : Array.isArray((body as { hits?: MatsparHit[] }).hits)
        ? (body as { hits: MatsparHit[] }).hits
        : [];
  return hits.map(parseMatsparHit).filter((prod): prod is Product => prod !== null);
}

const matsparProvider: StoreProvider = {
  name: "matspar",
  async searchProducts(query) {
    try {
      const hits = await matsparSearch(query);
      if (hits.length > 0) return hits;
    } catch {
      // Faller tillbaka på mock nedan
    }
    return mockProvider.searchProducts(query);
  },
  async productForIngredient(key, displayName) {
    try {
      const hits = await matsparSearch(displayName);
      if (hits.length > 0) return { ...hits[0], ingredientKeys: [key] };
    } catch {
      // Faller tillbaka på mock nedan
    }
    return mockProvider.productForIngredient(key, displayName);
  },
};

export function getStoreProvider(): StoreProvider {
  return process.env.STORE_PROVIDER === "matspar" ? matsparProvider : mockProvider;
}
