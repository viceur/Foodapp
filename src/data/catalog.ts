import type { Product } from "@/lib/types";

/**
 * Inbyggd butikskatalog med svenska matvaror och realistiska priser (2026).
 * Fungerar som fallback/demo när Matspar-API:t inte är tillgängligt.
 * Priser i kronor per förpackning.
 */

type P = Omit<Product, "source">;

const p = (x: P): Product => ({ ...x, source: "mock" });

export const CATALOG: Product[] = [
  // ── Kött, fågel & chark ────────────────────────────────────────
  p({ id: "notfars-500", name: "Nötfärs 12%", brand: "Svenskt Butikskött", packSize: 500, packUnit: "g", price: 62.9, category: "Kött & Fågel", ingredientKeys: ["notfars"] }),
  p({ id: "flaskfars-500", name: "Fläskfärs", brand: "Scan", packSize: 500, packUnit: "g", price: 44.9, category: "Kött & Fågel", ingredientKeys: ["flaskfars"] }),
  p({ id: "kycklingfile-700", name: "Kycklingfilé", brand: "Kronfågel", packSize: 700, packUnit: "g", price: 89.9, category: "Kött & Fågel", ingredientKeys: ["kycklingfile"] }),
  p({ id: "falukorv-800", name: "Falukorv", brand: "Scan", packSize: 800, packUnit: "g", price: 42.5, category: "Kött & Fågel", ingredientKeys: ["falukorv"] }),
  p({ id: "kottbullar-500", name: "Köttbullar färdigstekta", brand: "Mamma Scan", packSize: 500, packUnit: "g", price: 49.9, category: "Kött & Fågel", ingredientKeys: ["kottbullar"] }),
  p({ id: "bacon-140", name: "Bacon skivat", brand: "Tulip", packSize: 140, packUnit: "g", price: 24.9, category: "Kött & Fågel", ingredientKeys: ["bacon"] }),
  p({ id: "kassler-500", name: "Kassler benfri", brand: "Scan", packSize: 500, packUnit: "g", price: 64.9, category: "Kött & Fågel", ingredientKeys: ["kassler"] }),

  // ── Fisk & skaldjur ────────────────────────────────────────────
  p({ id: "laxfile-600", name: "Laxfilé portionsbitar", brand: "Fiskeriet", packSize: 600, packUnit: "g", price: 119, category: "Fisk & Skaldjur", ingredientKeys: ["laxfile"] }),
  p({ id: "torskfile-600", name: "Torskfilé MSC", brand: "Fiskeriet", packSize: 600, packUnit: "g", price: 109, category: "Fisk & Skaldjur", ingredientKeys: ["torskfile"] }),
  p({ id: "rakor-400", name: "Räkor skalade frysta", brand: "Polar Seafood", packSize: 400, packUnit: "g", price: 79.9, category: "Fisk & Skaldjur", ingredientKeys: ["rakor"] }),

  // ── Mejeri & ägg ───────────────────────────────────────────────
  p({ id: "mjolk-1000", name: "Mellanmjölk 1,5%", brand: "Arla", packSize: 1000, packUnit: "ml", price: 17.5, category: "Mejeri", ingredientKeys: ["mjolk"] }),
  p({ id: "gradde-250", name: "Matlagningsgrädde 15%", brand: "Arla", packSize: 250, packUnit: "ml", price: 16.9, category: "Mejeri", ingredientKeys: ["matlagningsgradde"] }),
  p({ id: "cremefraiche-200", name: "Crème fraiche 34%", brand: "Arla", packSize: 200, packUnit: "ml", price: 18.9, category: "Mejeri", ingredientKeys: ["creme_fraiche"] }),
  p({ id: "yoghurt-500", name: "Turkisk yoghurt 10%", brand: "Lindahls", packSize: 500, packUnit: "ml", price: 23.9, category: "Mejeri", ingredientKeys: ["matyoghurt"] }),
  p({ id: "agg-6", name: "Ägg frigående M", brand: "Kronägg", packSize: 6, packUnit: "st", price: 27.9, category: "Mejeri", ingredientKeys: ["agg"] }),
  p({ id: "rivenost-150", name: "Riven ost 31%", brand: "Arla Köket", packSize: 150, packUnit: "g", price: 26.9, category: "Mejeri", ingredientKeys: ["riven_ost"] }),
  p({ id: "parmesan-80", name: "Parmesan riven", brand: "Zanetti", packSize: 80, packUnit: "g", price: 32.9, category: "Mejeri", ingredientKeys: ["parmesan"] }),
  p({ id: "cheddar-150", name: "Cheddar skivad", brand: "Fjällbrynt", packSize: 150, packUnit: "g", price: 24.9, category: "Mejeri", ingredientKeys: ["cheddarost"] }),
  p({ id: "mozzarella-125", name: "Mozzarella", brand: "Galbani", packSize: 125, packUnit: "g", price: 16.9, category: "Mejeri", ingredientKeys: ["mozzarella"] }),
  p({ id: "fetaost-150", name: "Fetaost", brand: "Apetina", packSize: 150, packUnit: "g", price: 27.5, category: "Mejeri", ingredientKeys: ["fetaost"] }),
  p({ id: "halloumi-200", name: "Halloumi", brand: "Fontana", packSize: 200, packUnit: "g", price: 32.9, category: "Mejeri", ingredientKeys: ["halloumi"] }),
  p({ id: "smor-500", name: "Smör normalsaltat", brand: "Bregott", packSize: 500, packUnit: "g", price: 54.9, category: "Mejeri", ingredientKeys: ["smor"] }),

  // ── Frukt & grönt (lösvikt/styck) ──────────────────────────────
  p({ id: "gullok-st", name: "Gul lök", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 3.5, category: "Frukt & Grönt", ingredientKeys: ["gul_lok"] }),
  p({ id: "rodlok-st", name: "Rödlök", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 4, category: "Frukt & Grönt", ingredientKeys: ["rodlok"] }),
  p({ id: "vitlok-st", name: "Vitlök, hel (ca 10 klyftor)", brand: "Lösvikt", packSize: 10, packUnit: "st", price: 6.9, category: "Frukt & Grönt", ingredientKeys: ["vitlok"] }),
  p({ id: "morot-st", name: "Morot", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 3, category: "Frukt & Grönt", ingredientKeys: ["morot"] }),
  p({ id: "tomat-st", name: "Tomat kvist", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 6.5, category: "Frukt & Grönt", ingredientKeys: ["tomat"] }),
  p({ id: "gurka-st", name: "Gurka", brand: "Svensk", packSize: 1, packUnit: "st", price: 16.9, category: "Frukt & Grönt", ingredientKeys: ["gurka"] }),
  p({ id: "paprika-st", name: "Paprika röd", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 12.9, category: "Frukt & Grönt", ingredientKeys: ["paprika"] }),
  p({ id: "citron-st", name: "Citron", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 5.9, category: "Frukt & Grönt", ingredientKeys: ["citron"] }),
  p({ id: "lime-st", name: "Lime", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 4.9, category: "Frukt & Grönt", ingredientKeys: ["lime"] }),
  p({ id: "isbergssallad-st", name: "Isbergssallad", brand: "Svensk", packSize: 1, packUnit: "st", price: 18.9, category: "Frukt & Grönt", ingredientKeys: ["isbergssallad"] }),
  p({ id: "salladmix-65", name: "Babyspenat & mangold mix", brand: "Sallad AB", packSize: 65, packUnit: "g", price: 21.9, category: "Frukt & Grönt", ingredientKeys: ["sallad_mix"] }),
  p({ id: "spenat-200", name: "Babyspenat", brand: "Sallad AB", packSize: 200, packUnit: "g", price: 29.9, category: "Frukt & Grönt", ingredientKeys: ["spenat"] }),
  p({ id: "potatis-900", name: "Potatis fast", brand: "Svensk", packSize: 900, packUnit: "g", price: 19.9, category: "Frukt & Grönt", ingredientKeys: ["potatis"] }),
  p({ id: "champinjoner-250", name: "Champinjoner", brand: "Svensk", packSize: 250, packUnit: "g", price: 22.9, category: "Frukt & Grönt", ingredientKeys: ["champinjoner"] }),
  p({ id: "broccoli-st", name: "Broccoli", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 14.9, category: "Frukt & Grönt", ingredientKeys: ["broccoli"] }),
  p({ id: "sockerartor-150", name: "Sockerärtor", brand: "Import", packSize: 150, packUnit: "g", price: 24.9, category: "Frukt & Grönt", ingredientKeys: ["sockerartor"] }),
  p({ id: "ingefara-st", name: "Färsk ingefära, bit", brand: "Lösvikt", packSize: 1, packUnit: "st", price: 8.9, category: "Frukt & Grönt", ingredientKeys: ["farsk_ingefara"] }),
  p({ id: "salladslok-st", name: "Salladslök, knippe", brand: "Svensk", packSize: 1, packUnit: "st", price: 12.9, category: "Frukt & Grönt", ingredientKeys: ["salladslok"] }),
  p({ id: "dill-st", name: "Dill, kruka", brand: "Svegro", packSize: 1, packUnit: "st", price: 22.9, category: "Frukt & Grönt", ingredientKeys: ["dill"] }),
  p({ id: "persilja-st", name: "Persilja, kruka", brand: "Svegro", packSize: 1, packUnit: "st", price: 22.9, category: "Frukt & Grönt", ingredientKeys: ["persilja"] }),
  p({ id: "basilika-st", name: "Basilika, kruka", brand: "Svegro", packSize: 1, packUnit: "st", price: 22.9, category: "Frukt & Grönt", ingredientKeys: ["basilika"] }),
  p({ id: "koriander-st", name: "Koriander, kruka", brand: "Svegro", packSize: 1, packUnit: "st", price: 22.9, category: "Frukt & Grönt", ingredientKeys: ["koriander"] }),

  // ── Skafferi & konserver ───────────────────────────────────────
  p({ id: "ris-1000", name: "Jasminris", brand: "Risenta", packSize: 1000, packUnit: "g", price: 36.9, category: "Skafferi", ingredientKeys: ["ris"] }),
  p({ id: "arborio-500", name: "Arborioris", brand: "Zeta", packSize: 500, packUnit: "g", price: 39.9, category: "Skafferi", ingredientKeys: ["arborioris"] }),
  p({ id: "spaghetti-500", name: "Spaghetti", brand: "Barilla", packSize: 500, packUnit: "g", price: 18.9, category: "Skafferi", ingredientKeys: ["spaghetti"] }),
  p({ id: "penne-500", name: "Penne", brand: "Barilla", packSize: 500, packUnit: "g", price: 18.9, category: "Skafferi", ingredientKeys: ["pasta"] }),
  p({ id: "nudlar-250", name: "Äggnudlar", brand: "Blue Dragon", packSize: 250, packUnit: "g", price: 22.9, category: "Skafferi", ingredientKeys: ["nudlar"] }),
  p({ id: "gnocchi-500", name: "Gnocchi färsk", brand: "Rana", packSize: 500, packUnit: "g", price: 32.9, category: "Skafferi", ingredientKeys: ["gnocchi"] }),
  p({ id: "krossade-400", name: "Krossade tomater", brand: "Mutti", packSize: 400, packUnit: "g", price: 15.9, category: "Skafferi", ingredientKeys: ["krossade_tomater"] }),
  p({ id: "tomatpure-200", name: "Tomatpuré, tub", brand: "Felix", packSize: 200, packUnit: "ml", price: 14.9, category: "Skafferi", ingredientKeys: ["tomatpure"] }),
  p({ id: "kokosmjolk-400", name: "Kokosmjölk", brand: "Blue Dragon", packSize: 400, packUnit: "ml", price: 18.9, category: "Skafferi", ingredientKeys: ["kokosmjolk"] }),
  p({ id: "kidneybonor-380", name: "Kidneybönor", brand: "GoGreen", packSize: 380, packUnit: "g", price: 12.9, category: "Skafferi", ingredientKeys: ["kidneybonor"] }),
  p({ id: "rodalinser-500", name: "Röda linser", brand: "GoGreen", packSize: 500, packUnit: "g", price: 27.9, category: "Skafferi", ingredientKeys: ["roda_linser"] }),
  p({ id: "majs-340", name: "Majs, burk", brand: "Green Giant", packSize: 340, packUnit: "g", price: 15.9, category: "Skafferi", ingredientKeys: ["majs"] }),
  p({ id: "rodbetor-500", name: "Rödbetor skivade, burk", brand: "Felix", packSize: 500, packUnit: "g", price: 21.9, category: "Skafferi", ingredientKeys: ["rodbetor"] }),
  p({ id: "soltorkade-285", name: "Soltorkade tomater i olja", brand: "Zeta", packSize: 285, packUnit: "g", price: 34.9, category: "Skafferi", ingredientKeys: ["soltorkade_tomater"] }),
  p({ id: "currypasta-165", name: "Röd currypasta", brand: "Blue Dragon", packSize: 165, packUnit: "g", price: 27.9, category: "Skafferi", ingredientKeys: ["rod_currypasta"] }),
  p({ id: "tacokrydda-st", name: "Tacokrydda, påse", brand: "Santa Maria", packSize: 1, packUnit: "st", price: 12.9, category: "Skafferi", ingredientKeys: ["tacokrydda"] }),
  p({ id: "lingonsylt-400", name: "Lingonsylt", brand: "Felix", packSize: 400, packUnit: "g", price: 29.9, category: "Skafferi", ingredientKeys: ["lingonsylt"] }),
  p({ id: "oliver-200", name: "Kalamataoliver", brand: "Zeta", packSize: 200, packUnit: "g", price: 29.9, category: "Skafferi", ingredientKeys: ["oliver"] }),

  // ── Bröd ───────────────────────────────────────────────────────
  p({ id: "tortilla-8", name: "Tortillabröd medium 8-pack", brand: "Santa Maria", packSize: 8, packUnit: "st", price: 26.9, category: "Bröd", ingredientKeys: ["tortilla"] }),
  p({ id: "hamburgerbrod-4", name: "Hamburgerbröd brioche 4-pack", brand: "Korvbrödsbagarn", packSize: 4, packUnit: "st", price: 24.9, category: "Bröd", ingredientKeys: ["hamburgerbrod"] }),
  p({ id: "pitabrod-4", name: "Pitabröd 4-pack", brand: "Polarbröd", packSize: 4, packUnit: "st", price: 18.9, category: "Bröd", ingredientKeys: ["pitabrod"] }),
  p({ id: "surdegsbrod-st", name: "Surdegsbröd levain", brand: "Bageri", packSize: 1, packUnit: "st", price: 34.9, category: "Bröd", ingredientKeys: ["brod"] }),

  // ── Fryst ──────────────────────────────────────────────────────
  p({ id: "haricots-450", name: "Haricots verts frysta", brand: "Findus", packSize: 450, packUnit: "g", price: 24.9, category: "Fryst", ingredientKeys: ["haricots_verts"] }),
  p({ id: "falafel-600", name: "Falafel fryst", brand: "GoGreen", packSize: 600, packUnit: "g", price: 36.9, category: "Fryst", ingredientKeys: ["falafel"] }),
];

/** Enkel sökning i katalogen (namn, märke, kategori). */
export function searchCatalog(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG.filter(
    (prod) =>
      prod.name.toLowerCase().includes(q) ||
      prod.brand.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.ingredientKeys.some((k) => k.includes(q.replace(/\s+/g, "_"))),
  );
}

/** Hitta bästa produkt för en ingrediensnyckel. */
export function productForIngredient(key: string): Product | null {
  return CATALOG.find((prod) => prod.ingredientKeys.includes(key)) ?? null;
}
