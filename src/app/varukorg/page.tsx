import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Varukorg – Matkassen",
};

export default function CartPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Din varukorg</h1>
        <p className="text-stone-600">
          Ingredienserna från dina valda recept, ihopslagna och matchade mot butikens produkter.
        </p>
      </section>
      <CartView />
    </div>
  );
}
