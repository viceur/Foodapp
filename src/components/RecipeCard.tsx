"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";
import { formatAmount } from "@/lib/format";

interface Props {
  recipe: Recipe;
  selected: boolean;
  onToggleSelect: () => void;
  onReroll: () => void;
  /** Rullas kortet just nu? Ger en liten animation. */
  rolling: boolean;
}

export default function RecipeCard({ recipe, selected, onToggleSelect, onReroll, rolling }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        selected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-stone-200"
      } ${rolling ? "scale-95 opacity-40" : "scale-100 opacity-100"}`}
    >
      <div
        className="flex h-32 items-center justify-center text-6xl"
        style={{ background: `linear-gradient(135deg, ${recipe.gradient[0]}, ${recipe.gradient[1]})` }}
        aria-hidden
      >
        <span className="drop-shadow-lg">{recipe.emoji}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{recipe.title}</h3>
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            ⏱ {recipe.time} min
          </span>
        </div>
        <p className="text-sm text-stone-600">{recipe.description}</p>
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-start text-sm font-medium text-emerald-700 hover:underline"
        >
          {expanded ? "Dölj recept ▲" : "Visa recept ▼"}
        </button>

        {expanded && (
          <div className="mt-1 space-y-3 rounded-xl bg-stone-50 p-3 text-sm">
            <div>
              <h4 className="mb-1 font-semibold">Ingredienser (4 port)</h4>
              <ul className="space-y-0.5 text-stone-700">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.key} className="flex justify-between gap-2">
                    <span>
                      {ing.name}
                      {ing.pantry && <span className="text-stone-400"> (skafferi)</span>}
                    </span>
                    <span className="text-stone-500">{formatAmount(ing.amount, ing.unit)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Gör så här</h4>
              <ol className="list-decimal space-y-1 pl-4 text-stone-700">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={onReroll}
            className="flex-1 rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            title="Byt ut mot ett annat recept"
          >
            🎲 Byt ut
          </button>
          <button
            type="button"
            onClick={onToggleSelect}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              selected
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {selected ? "✓ Vald" : "Välj"}
          </button>
        </div>
      </div>
    </article>
  );
}
