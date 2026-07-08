import RecipePicker from "@/components/RecipePicker";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Veckans fem förslag</h1>
        <p className="max-w-2xl text-stone-600">
          Som en matkasse – fast du handlar själv. Gillar du inte ett förslag? Tryck på{" "}
          <span className="font-medium text-stone-900">🎲 Byt ut</span> tills det känns rätt, välj
          recepten du vill laga och lägg alla ingredienser direkt i varukorgen.
        </p>
      </section>
      <RecipePicker />
    </div>
  );
}
