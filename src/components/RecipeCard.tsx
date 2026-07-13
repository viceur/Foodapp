"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [showRecipe, setShowRecipe] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <article
        className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
          selected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-stone-200"
        } ${rolling ? "scale-95 opacity-40" : "scale-100 opacity-100"}`}
      >
        <div className="relative h-36 w-full">
          {imgError ? (
            <div
              className="flex h-full w-full items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${recipe.gradient[0]}, ${recipe.gradient[1]})` }}
              aria-hidden
            >
              <span className="drop-shadow-lg">{recipe.emoji}</span>
            </div>
          ) : (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            ⏱ {recipe.time} min
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="font-semibold leading-tight">{recipe.title}</h3>
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                {tag}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowRecipe(true)}
            className="self-start text-xs font-medium text-emerald-700 hover:underline"
          >
            Visa recept
          </button>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onToggleSelect}
              className={`w-full rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {selected ? "✓ Vald" : "Välj"}
            </button>
            <button
              type="button"
              onClick={onReroll}
              className="w-full rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
              title="Byt ut mot ett annat recept"
            >
              🎲 Byt ut
            </button>
          </div>
        </div>
      </article>

      {showRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowRecipe(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52 w-full">
              {imgError ? (
                <div
                  className="flex h-full w-full items-center justify-center text-6xl"
                  style={{ background: `linear-gradient(135deg, ${recipe.gradient[0]}, ${recipe.gradient[1]})` }}
                  aria-hidden
                >
                  {recipe.emoji}
                </div>
              ) : (
                <Image src={recipe.image} alt={recipe.title} fill sizes="512px" className="object-cover" />
              )}
              <button
                type="button"
                onClick={() => setShowRecipe(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Stäng"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <h3 className="text-xl font-bold">{recipe.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{recipe.description}</p>
              </div>
              <div>
                <h4 className="mb-1 font-semibold">Ingredienser (4 port)</h4>
                <ul className="space-y-0.5 text-sm text-stone-700">
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
                <ol className="list-decimal space-y-1 pl-4 text-sm text-stone-700">
                  {recipe.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <button
                type="button"
                onClick={() => {
                  onToggleSelect();
                  setShowRecipe(false);
                }}
                className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold ${
                  selected ? "bg-emerald-600 text-white" : "border border-emerald-600 text-emerald-700"
                }`}
              >
                {selected ? "✓ Vald – ta bort" : "Välj detta recept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
