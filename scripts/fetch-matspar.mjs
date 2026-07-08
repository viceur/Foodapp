#!/usr/bin/env node
/**
 * Hämtar riktiga produkter och priser från matspar.se och genererar
 * src/data/matspar-snapshot.ts.
 *
 * Matspar har inget publikt/dokumenterat API. Deras kategorisidor är dock
 * server-renderade och har produktdata inbäddad i sidan som
 * `window.__PAGEDATA__ = JSON.parse("...")`. Det här skriptet hämtar en
 * kategorisida per ingrediens (mappningen nedan är byggd mot Matspars
 * verkliga kategoriträd) och plockar ut en representativ produkt.
 *
 * Kör om: node scripts/fetch-matspar.mjs
 * (Uppdaterar priserna – bra att köra då och då, men INTE på varje request:
 * det vore otrevligt mot Matspars servrar och sidan kan ändra struktur när
 * som helst utan varning.)
 */

/** ingrediensnyckel -> Matspar-kategoriväg (utan "kategori/"-prefix) */
const CATEGORY_MAP = {
  notfars: "notfars",
  flaskfars: "flaskfars",
  kycklingfile: "kycklingfile",
  falukorv: "falukorv",
  kottbullar: "kottbullar",
  bacon: "bacon",
  kassler: "kassler",
  laxfile: "farsk-fisk",
  torskfile: "farsk-fisk",
  rakor: "frysta-skaldjur",
  mjolk: "mellanmjolk",
  matlagningsgradde: "matlagningsgradde",
  creme_fraiche: "creme-fraiche-naturell",
  matyoghurt: "yoghurt-naturell",
  agg: "agg",
  riven_ost: "hardost-riven",
  parmesan: "parmesan",
  cheddarost: "hardost-skivad",
  mozzarella: "mozzarella",
  fetaost: "fetaost-salladsost",
  halloumi: "halloumi-grillost",
  smor: "smor",
  gul_lok: "gul-lok",
  rodlok: "rod-lok",
  vitlok: "vitlok",
  morot: "morotter",
  tomat: "tomat",
  gurka: "gurka",
  paprika: "paprika",
  citron: "citron",
  lime: "lime",
  isbergssallad: "sallat",
  sallad_mix: "forpackad-sallad",
  spenat: "spenat",
  potatis: "potatis",
  champinjoner: "svamp",
  broccoli: "broccoli",
  sockerartor: "artor-bonor",
  farsk_ingefara: "ovriga-kryddvaxter-orter",
  salladslok: "salladslok",
  dill: "dill",
  persilja: "persilja",
  basilika: "basilika",
  koriander: "koriander",
  ris: "jasminris",
  arborioris: "ovrigt-ris",
  spaghetti: "spaghetti",
  pasta: "penne",
  nudlar: "aggnudlar",
  gnocchi: "gnocchi",
  krossade_tomater: "krossade-tomater",
  tomatpure: "tomatpure",
  kokosmjolk: "asien",
  kidneybonor: "bonor",
  roda_linser: "linser",
  majs: "majs",
  rodbetor: "gronsakskonserver",
  soltorkade_tomater: "soltorkade-tomater",
  rod_currypasta: "asien",
  tacokrydda: "texmex",
  lingonsylt: "sylt",
  oliver: "oliver",
  tortilla: "tortilla-nachochips",
  hamburgerbrod: "hamburgerbrod",
  pitabrod: "pitabrod",
  brod: "bageribrod",
  haricots_verts: "gronsaker",
  falafel: "vegetariska-produkter",
};

/**
 * Nyckelord som produktnamnet måste innehålla (case-insensitive) för vissa
 * ingredienser – behövs när kategorin är bred eller delas mellan flera
 * ingredienser (t.ex. "farsk-fisk" innehåller både lax och torsk).
 */
const NAME_MUST_INCLUDE = {
  laxfile: ["lax"],
  torskfile: ["torsk"],
  rakor: ["räk"],
  kokosmjolk: ["kokos"],
  rod_currypasta: ["curry"],
  rodbetor: ["rödbet", "rodbet"],
  haricots_verts: ["haricot", "gröna bön", "skärböna"],
  falafel: ["falafel"],
  kidneybonor: ["kidney", "röda bön"],
  farsk_ingefara: ["ingefär"],
  arborioris: ["arborio"],
  brod: ["surdeg", "levain"],
  tacokrydda: ["taco"],
  falafel: ["falafel"],
  lingonsylt: ["lingon"],
  parmesan: ["parmesan"],
};

/** Produktnamn som alltid utesluts för dessa ingredienser (köttprodukter -> inga veganalternativ). */
const NAME_EXCLUDE = {
  bacon: ["vegan", "vegetarisk", "plant"],
  notfars: ["vegan", "vegetarisk", "plant"],
  flaskfars: ["vegan", "vegetarisk", "plant"],
  kycklingfile: ["vegan", "vegetarisk", "plant"],
  kottbullar: ["vegan", "vegetarisk", "plant"],
  falukorv: ["vegan", "vegetarisk", "plant"],
  kassler: ["vegan", "vegetarisk", "plant"],
  laxfile: ["vegan", "vegetarisk", "plant"],
  torskfile: ["vegan", "vegetarisk", "plant"],
  cheddarost: ["vegan", "veganost"],
};

const BASE = "https://www.matspar.se";
const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extraherar window.__PAGEDATA__ ur en HTML-sida (JS-escapad JSON-sträng). */
function extractPageData(html) {
  const m = html.match(/window\.__PAGEDATA__\s*=\s*JSON\.parse\("(.*?)"\);/s);
  if (!m) return null;
  try {
    return JSON.parse(JSON.parse(`"${m[1]}"`));
  } catch {
    return null;
  }
}

/** Tolkar Matspars "weight_pretty" (t.ex. "500g", "1,5l", "15st") till {amount, unit}. */
function parseWeight(weightPretty) {
  if (!weightPretty) return null;
  const cleaned = weightPretty.trim().replace(",", ".");
  const m = cleaned.match(/^([\d.]+)\s*(kg|g|ml|cl|dl|l|st)$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "kg") return { amount: value * 1000, unit: "g" };
  if (unit === "g") return { amount: value, unit: "g" };
  if (unit === "l") return { amount: value * 1000, unit: "ml" };
  if (unit === "dl") return { amount: value * 100, unit: "ml" };
  if (unit === "cl") return { amount: value * 10, unit: "ml" };
  if (unit === "ml") return { amount: value, unit: "ml" };
  if (unit === "st") return { amount: value, unit: "st" };
  return null;
}

/** Väljer en representativ produkt: mitten av prisintervallet, rimlig förpackningsstorlek. */
function pickProduct(products, key) {
  const mustInclude = NAME_MUST_INCLUDE[key];
  const exclude = NAME_EXCLUDE[key];

  let candidates = products;
  if (mustInclude) {
    const filtered = candidates.filter((p) =>
      mustInclude.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase())),
    );
    if (filtered.length > 0) candidates = filtered;
  }
  if (exclude) {
    const filtered = candidates.filter(
      (p) => !exclude.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase())),
    );
    if (filtered.length > 0) candidates = filtered;
  }

  const parsed = candidates
    .map((p) => ({ p, weight: parseWeight(p.weight_pretty) }))
    .filter((x) => x.weight && x.p.price > 0);
  if (parsed.length === 0) return null;
  parsed.sort((a, b) => a.p.price - b.p.price);
  return parsed[Math.floor(parsed.length / 2)];
}

async function fetchCategory(slug) {
  const res = await fetch(`${BASE}/kategori/${slug}`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; MatkassenBot/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const data = extractPageData(html);
  const products = data?.payload?.products;
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("inga produkter i payload");
  }
  return products;
}

async function main() {
  const results = [];
  const entries = Object.entries(CATEGORY_MAP);
  for (let i = 0; i < entries.length; i++) {
    const [key, slug] = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${key} (${slug}) ... `);
    try {
      const products = await fetchCategory(slug);
      const picked = pickProduct(products, key);
      if (!picked) {
        console.log("ingen produkt med tolkbar vikt, hoppar över");
      } else {
        const { p, weight } = picked;
        results.push({
          ingredientKey: key,
          id: `matspar-${p.productid}`,
          name: p.name.trim(),
          brand: p.brand?.trim() || "Matspar",
          packSize: Math.round(weight.amount * 10) / 10,
          packUnit: weight.unit,
          price: Math.round(p.price) / 100,
          slug: p.slug,
        });
        console.log(`${p.name} – ${(p.price / 100).toFixed(2)} kr`);
      }
    } catch (err) {
      console.log(`FEL: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  const categoryLabel = {
    notfars: "Kött & Fågel",
    flaskfars: "Kött & Fågel",
    kycklingfile: "Kött & Fågel",
    falukorv: "Kött & Fågel",
    kottbullar: "Kött & Fågel",
    bacon: "Kött & Fågel",
    kassler: "Kött & Fågel",
    laxfile: "Fisk & Skaldjur",
    torskfile: "Fisk & Skaldjur",
    rakor: "Fisk & Skaldjur",
    mjolk: "Mejeri",
    matlagningsgradde: "Mejeri",
    creme_fraiche: "Mejeri",
    matyoghurt: "Mejeri",
    agg: "Mejeri",
    riven_ost: "Mejeri",
    parmesan: "Mejeri",
    cheddarost: "Mejeri",
    mozzarella: "Mejeri",
    fetaost: "Mejeri",
    halloumi: "Mejeri",
    smor: "Mejeri",
    gul_lok: "Frukt & Grönt",
    rodlok: "Frukt & Grönt",
    vitlok: "Frukt & Grönt",
    morot: "Frukt & Grönt",
    tomat: "Frukt & Grönt",
    gurka: "Frukt & Grönt",
    paprika: "Frukt & Grönt",
    citron: "Frukt & Grönt",
    lime: "Frukt & Grönt",
    isbergssallad: "Frukt & Grönt",
    sallad_mix: "Frukt & Grönt",
    spenat: "Frukt & Grönt",
    potatis: "Frukt & Grönt",
    champinjoner: "Frukt & Grönt",
    broccoli: "Frukt & Grönt",
    sockerartor: "Frukt & Grönt",
    farsk_ingefara: "Frukt & Grönt",
    salladslok: "Frukt & Grönt",
    dill: "Frukt & Grönt",
    persilja: "Frukt & Grönt",
    basilika: "Frukt & Grönt",
    koriander: "Frukt & Grönt",
    ris: "Skafferi",
    arborioris: "Skafferi",
    spaghetti: "Skafferi",
    pasta: "Skafferi",
    nudlar: "Skafferi",
    gnocchi: "Skafferi",
    krossade_tomater: "Skafferi",
    tomatpure: "Skafferi",
    kokosmjolk: "Skafferi",
    kidneybonor: "Skafferi",
    roda_linser: "Skafferi",
    majs: "Skafferi",
    rodbetor: "Skafferi",
    soltorkade_tomater: "Skafferi",
    rod_currypasta: "Skafferi",
    tacokrydda: "Skafferi",
    lingonsylt: "Skafferi",
    oliver: "Skafferi",
    tortilla: "Bröd",
    hamburgerbrod: "Bröd",
    pitabrod: "Bröd",
    brod: "Bröd",
    haricots_verts: "Fryst",
    falafel: "Fryst",
  };

  const header = `// Genererad av scripts/fetch-matspar.mjs – kör om skriptet för att uppdatera priserna.
// Källa: matspar.se (kategorisidornas inbäddade produktdata). Inget officiellt API.
import type { Product } from "@/lib/types";

export const MATSPAR_SNAPSHOT_DATE = ${JSON.stringify(new Date().toISOString().slice(0, 10))};

export const MATSPAR_PRODUCTS: Product[] = ${JSON.stringify(
    results.map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      packSize: r.packSize,
      packUnit: r.packUnit,
      price: r.price,
      category: categoryLabel[r.ingredientKey] ?? "Övrigt",
      ingredientKeys: [r.ingredientKey],
      source: "matspar",
      url: `https://www.matspar.se/${r.slug}`,
    })),
    null,
    2,
  )};
`;

  const fs = await import("node:fs/promises");
  await fs.writeFile(new URL("../src/data/matspar-snapshot.ts", import.meta.url), header);
  console.log(`\nKlart: ${results.length}/${entries.length} ingredienser matchade mot riktiga Matspar-produkter.`);
  console.log("Skrev src/data/matspar-snapshot.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
