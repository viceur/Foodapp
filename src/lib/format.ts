import type { BaseUnit } from "@/lib/types";

/** Formatera mängd på svenskt matvis: 1500 g → "1,5 kg", 250 ml → "2,5 dl". */
export function formatAmount(amount: number, unit: BaseUnit): string {
  const nf = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });
  if (unit === "g") {
    return amount >= 1000 ? `${nf.format(amount / 1000)} kg` : `${nf.format(amount)} g`;
  }
  if (unit === "ml") {
    if (amount >= 1000) return `${nf.format(amount / 1000)} l`;
    if (amount >= 100) return `${nf.format(amount / 100)} dl`;
    return `${nf.format(amount)} ml`;
  }
  return `${nf.format(amount)} st`;
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} kr`;
}
