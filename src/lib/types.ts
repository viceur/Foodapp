// Basenheter för mängdberäkning: gram, milliliter eller styck.
export type BaseUnit = "g" | "ml" | "st";

export interface Ingredient {
  /** Nyckel som matchar produkter i butikskatalogen, t.ex. "kycklingfile" */
  key: string;
  /** Visningsnamn, t.ex. "Kycklingfilé" */
  name: string;
  /** Mängd för 4 portioner, i basenheten */
  amount: number;
  unit: BaseUnit;
  /** Skafferivara (salt, olja, kryddor) – köps sällan per recept */
  pantry?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  /** Tillagningstid i minuter */
  time: number;
  tags: string[];
  /** Emoji som "bild" + gradientfärger för kortet */
  emoji: string;
  gradient: [string, string];
  ingredients: Ingredient[];
  steps: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  /** Förpackningsstorlek i basenheten, t.ex. 500 (g) */
  packSize: number;
  packUnit: BaseUnit;
  /** Pris i kronor per förpackning */
  price: number;
  category: string;
  /** Ingrediensnycklar som produkten matchar */
  ingredientKeys: string[];
  /** Varifrån produkten kommer: "mock" eller "matspar" */
  source: "mock" | "matspar";
  /** Länk till produkten på matspar.se, om tillgänglig */
  url?: string;
}

/** En rad i varukorgen: en ingrediens matchad mot en produkt */
export interface CartLine {
  ingredientKey: string;
  ingredientName: string;
  /** Total mängd som recepten kräver */
  requiredAmount: number;
  unit: BaseUnit;
  /** Vilka recept som bidrar till raden */
  recipeIds: string[];
  product: Product | null;
  /** Antal förpackningar som behövs */
  quantity: number;
}

export interface ResolvedCart {
  lines: CartLine[];
  /** Skafferivaror listas separat – de flesta har dem hemma */
  pantryItems: { name: string; amount: number; unit: BaseUnit }[];
  totalPrice: number;
  provider: "mock" | "matspar";
}
