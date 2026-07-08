/**
 * Konsistenskontroll av receptbanken mot butikskatalogen.
 * Körs med: npm run check:data
 *
 * Kontrollerar att varje icke-skafferiingrediens har en produkt i katalogen
 * och att ingrediensens enhet matchar produktens förpackningsenhet.
 */
import { RECIPES } from "../src/data/recipes";
import { CATALOG, productForIngredient } from "../src/data/catalog";
import { MATSPAR_PRODUCTS, MATSPAR_SNAPSHOT_DATE } from "../src/data/matspar-snapshot";

let errors = 0;

const ids = new Set<string>();
for (const recipe of RECIPES) {
  if (ids.has(recipe.id)) {
    console.error(`Dubblett av recept-id: ${recipe.id}`);
    errors++;
  }
  ids.add(recipe.id);

  for (const ing of recipe.ingredients) {
    if (ing.pantry) continue;
    const product = productForIngredient(ing.key);
    if (!product) {
      console.error(`${recipe.id}: ingen produkt för ingrediens "${ing.key}" (${ing.name})`);
      errors++;
      continue;
    }
    if (product.packUnit !== ing.unit) {
      console.error(
        `${recipe.id}: enhetskrock för "${ing.key}" – recept anger ${ing.unit}, produkt ${product.id} säljs i ${product.packUnit}`,
      );
      errors++;
    }
  }
}

const productIds = new Set<string>();
for (const product of CATALOG) {
  if (productIds.has(product.id)) {
    console.error(`Dubblett av produkt-id: ${product.id}`);
    errors++;
  }
  productIds.add(product.id);
}

const matsparKeys = new Set(MATSPAR_PRODUCTS.flatMap((p) => p.ingredientKeys));
let missingFromMatspar = 0;
for (const recipe of RECIPES) {
  for (const ing of recipe.ingredients) {
    if (ing.pantry) continue;
    if (!matsparKeys.has(ing.key)) missingFromMatspar++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} fel hittades.`);
  process.exit(1);
}
console.log(`OK: ${RECIPES.length} recept och ${CATALOG.length} produkter är konsistenta.`);
console.log(
  `Matspar-snapshot (${MATSPAR_SNAPSHOT_DATE}): ${MATSPAR_PRODUCTS.length} produkter, ${missingFromMatspar} ingrediensrader saknar Matspar-match (faller tillbaka på mock).`,
);
