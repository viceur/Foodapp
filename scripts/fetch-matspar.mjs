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
  farsk_ingefara: "ovriga-rotsaker",
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
  tortilla: "texmex",
  hamburgerbrod: "hamburgerbrod",
  pitabrod: "pitabrod",
  brod: "skivat-brod",
  haricots_verts: "gronsaker",
  falafel: "vegetariska-produkter",

  // Skafferivaror – hämtas så att de kan läggas till i varukorgen vid behov.
  buljong: "buljong",
  chiliflakes: "kryddor",
  currypulver: "kryddor",
  garam_masala: "kryddor",
  oregano: "kryddor",
  paprikapulver: "kryddor",
  spiskummin: "kryddor",
  svartpeppar: "kryddor",
  sesamfron: "kryddor",
  salt: "salt",
  honung: "socker-sirap-honung",
  ketchup: "ketchup-senap",
  majonnas: "dressing-bearnaise-majonnas",
  olivolja: "olivolja",
  sesamolja: "ovrig-olja",
  soja: "soja",
  vetemjol: "mjol-gryn",
  fisksas: "asien",
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
  tacokrydda: ["taco"],
  lingonsylt: ["lingon"],
  parmesan: ["parmesan"],
  fetaost: ["feta"],
  sockerartor: ["sockerärt", "sugarsnap", "sugar snap"],
  isbergssallad: ["isberg"],
  roda_linser: ["röd", "red"],
  tortilla: ["tortilla"],
  // Skafferivaror – matchas exakt på namn i sina (breda) kryddkategorier.
  chiliflakes: ["chili"],
  currypulver: ["curry"],
  garam_masala: ["garam"],
  oregano: ["oregano"],
  paprikapulver: ["paprikapulver", "paprika"],
  spiskummin: ["spiskummin"],
  svartpeppar: ["svartpeppar"],
  sesamfron: ["sesam"],
  honung: ["honung"],
  ketchup: ["ketchup"],
  majonnas: ["majonnäs"],
  sesamolja: ["sesam"],
  vetemjol: ["vetemjöl"],
  fisksas: ["fisksås", "fish sauce"],
};

/** Produktnamn som alltid utesluts för dessa ingredienser (köttprodukter -> inga veganalternativ). */
const NAME_EXCLUDE = {
  bacon: ["vegan", "vegetarisk", "plant"],
  notfars: ["vegan", "vegetarisk", "plant"],
  flaskfars: ["vegan", "vegetarisk", "plant"],
  kycklingfile: ["vegan", "vegetarisk", "plant", "marinerad", "grillad", "rökt", "kokt"],
  brod: ["glutenfri", "glutenfritt", "rostbröd", "rostbrod"],
  kottbullar: ["vegan", "vegetarisk", "plant"],
  falukorv: ["vegan", "vegetarisk", "plant"],
  kassler: ["vegan", "vegetarisk", "plant"],
  laxfile: ["vegan", "vegetarisk", "plant"],
  torskfile: ["vegan", "vegetarisk", "plant"],
  cheddarost: ["vegan", "veganost"],
  riven_ost: ["vegan", "vegansk"],
  sallad_mix: ["spenat"],
  tortilla: ["chips", "strips", "nacho", "dip", "salsa", "taco", "krydd", "sås"],
  soltorkade_tomater: ["färskost", "creme", "crème", "dressing", "pesto"],
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

/**
 * Rimliga maxstorlekar per förpackning – filtrerar bort både felparsade
 * jätteförpackningar och storpack/cateringstorlekar som är billiga per kilo men
 * opraktiska för ett hushåll (t.ex. 4 kg ris).
 */
const MAX_PACK = { g: 2000, ml: 2000, st: 30 };

/**
 * Nycklar där vi hellre hoppar över (och faller tillbaka på mock-katalogen) än
 * väljer en orelaterad produkt när nyckelordsfiltret inte hittar något – annars
 * kan t.ex. "falafel" landa på en havredryck i en bred vegokategori.
 */
const STRICT_KEYS = new Set(["falafel"]);

/** Svenskt ursprung enligt Matspars egna flaggor. */
function isSwedish(p) {
  const filters = p.filters || [];
  return (
    p.country_from === "Sverige" ||
    filters.includes("from_sweden") ||
    filters.some((f) => typeof f === "string" && f.includes("fran_sverige"))
  );
}

/** Antal butiker som lagerför produkten (w_prices har en nyckel per butik). */
function storeCount(p) {
  return p.w_prices ? Object.keys(p.w_prices).length : 1;
}

/** Rimliga minsta förpackningar – undviker att pytteförpackningar (smakprover) vinner på lågt pris. */
const MIN_PACK = { g: 90, ml: 90, st: 1 };

/**
 * Väljer produkt per ingrediens med tre mål, i prioritetsordning:
 *  1. Bred tillgänglighet – produkten ska finnas i så många butiker som möjligt
 *     så att varukorgen fungerar oavsett vilken butik man checkar ut hos (annars
 *     får man välja om halva korgen när man byter från t.ex. ICA till Coop).
 *  2. Lägsta pris för en NORMAL förpackning (det man faktiskt lägger i korgen).
 *     Vi sorterar på förpackningspris, inte jämförpris per kilo – annars vinner
 *     storpack som är billiga per kilo men dyra och opraktiska styckvis (t.ex.
 *     ett kilo fetaost för 150 g fetaost).
 *  3. Svenskt ursprung premieras – ett svenskt alternativ får kosta ~15 % mer
 *     och ändå vinna.
 */
const SWEDISH_PRICE_BONUS = 0.85; // svenskt pris viktas ned 15 % vid rankning

function pickProduct(products, key) {
  const mustInclude = NAME_MUST_INCLUDE[key];
  const exclude = NAME_EXCLUDE[key];

  let candidates = products;
  if (mustInclude) {
    const filtered = candidates.filter((p) =>
      mustInclude.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase())),
    );
    if (filtered.length > 0) candidates = filtered;
    else if (STRICT_KEYS.has(key)) return null;
  }
  if (exclude) {
    const filtered = candidates.filter(
      (p) => !exclude.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase())),
    );
    if (filtered.length > 0) candidates = filtered;
  }

  let parsed = candidates
    .map((p) => ({ p, weight: parseWeight(p.weight_pretty), stores: storeCount(p), swedish: isSwedish(p) }))
    .filter((x) => x.weight && x.p.price > 0 && x.weight.amount <= (MAX_PACK[x.weight.unit] ?? Infinity));
  if (parsed.length === 0) return null;

  // Sålla bort pytteförpackningar (om det finns normalstora kvar).
  const normalSized = parsed.filter((x) => x.weight.amount >= (MIN_PACK[x.weight.unit] ?? 0));
  if (normalSized.length > 0) parsed = normalSized;

  // Steg 1: behåll bara brett tillgängliga produkter (finns i minst hälften så
  // många butiker som den mest spridda kandidaten). Faller tillbaka på allt om
  // kategorin bara har nischade produkter.
  const maxStores = Math.max(...parsed.map((x) => x.stores));
  const broad = parsed.filter((x) => x.stores >= Math.max(2, maxStores * 0.5));
  const pool = broad.length > 0 ? broad : parsed;

  // Steg 2+3: lägsta förpackningspris med svensk bonus, tiebreak på spridning.
  const effPrice = (x) => x.p.price * (x.swedish ? SWEDISH_PRICE_BONUS : 1);
  pool.sort((a, b) => {
    const diff = effPrice(a) - effPrice(b);
    if (Math.abs(diff) > 1e-9) return diff;
    if (b.stores !== a.stores) return b.stores - a.stores;
    return (b.swedish ? 1 : 0) - (a.swedish ? 1 : 0);
  });
  return pool[0];
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
        const { p, weight, swedish, stores } = picked;
        results.push({
          ingredientKey: key,
          id: `matspar-${p.productid}`,
          name: p.name.trim(),
          brand: p.brand?.trim() || "Matspar",
          packSize: Math.round(weight.amount * 10) / 10,
          packUnit: weight.unit,
          price: Math.round(p.price) / 100,
          slug: p.slug,
          swedish,
          stores,
        });
        console.log(
          `${p.name} – ${(p.price / 100).toFixed(2)} kr  ${swedish ? "🇸🇪" : "  "} (${stores} butiker)`,
        );
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
    buljong: "Skafferi",
    chiliflakes: "Skafferi",
    currypulver: "Skafferi",
    garam_masala: "Skafferi",
    oregano: "Skafferi",
    paprikapulver: "Skafferi",
    spiskummin: "Skafferi",
    svartpeppar: "Skafferi",
    sesamfron: "Skafferi",
    salt: "Skafferi",
    honung: "Skafferi",
    ketchup: "Skafferi",
    majonnas: "Skafferi",
    olivolja: "Skafferi",
    sesamolja: "Skafferi",
    soja: "Skafferi",
    vetemjol: "Skafferi",
    fisksas: "Skafferi",
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
      swedish: r.swedish,
      stores: r.stores,
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
