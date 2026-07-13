"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RECIPES, RECIPE_MAP } from "@/data/recipes";
import RecipeCard from "@/components/RecipeCard";

const SHOWN_KEY = "matkassen:shown";
const SELECTED_KEY = "matkassen:selected";
const SLOTS = 5;

function drawRandom(exclude: Set<string>): string {
  const pool = RECIPES.filter((r) => !exclude.has(r.id));
  const source = pool.length > 0 ? pool : RECIPES;
  return source[Math.floor(Math.random() * source.length)].id;
}

function drawInitial(): string[] {
  const shown: string[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < SLOTS; i++) {
    const id = drawRandom(taken);
    shown.push(id);
    taken.add(id);
  }
  return shown;
}

function readStored(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter((id): id is string => typeof id === "string" && RECIPE_MAP.has(id));
    return ids;
  } catch {
    return null;
  }
}

export default function RecipePicker() {
  // null = inte hydrerad ännu (slumpen får inte köras på servern)
  const [shown, setShown] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rollingSlot, setRollingSlot] = useState<number | null>(null);
  // Recept som redan visats – undviker att samma förslag kommer tillbaka direkt
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const storedShown = readStored(SHOWN_KEY);
    const shownIds = storedShown && storedShown.length === SLOTS ? storedShown : drawInitial();
    setShown(shownIds);
    seenRef.current = new Set(shownIds);
    const storedSelected = readStored(SELECTED_KEY);
    if (storedSelected) setSelected(new Set(storedSelected));
  }, []);

  useEffect(() => {
    if (shown) localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));
  }, [shown]);

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, JSON.stringify([...selected]));
  }, [selected]);

  function reroll(slot: number) {
    if (!shown || rollingSlot !== null) return;
    const exclude = new Set([...seenRef.current, ...shown]);
    // Börja om när nästan hela banken är genombläddrad
    if (exclude.size >= RECIPES.length - 1) {
      seenRef.current = new Set(shown);
    }
    const next = drawRandom(new Set([...seenRef.current, ...shown]));
    seenRef.current.add(next);
    setRollingSlot(slot);
    setTimeout(() => {
      setShown((prev) => {
        if (!prev) return prev;
        const copy = [...prev];
        const replaced = copy[slot];
        copy[slot] = next;
        // Avmarkera receptet som byttes bort
        setSelected((sel) => {
          if (!sel.has(replaced)) return sel;
          const nextSel = new Set(sel);
          nextSel.delete(replaced);
          return nextSel;
        });
        return copy;
      });
      setRollingSlot(null);
    }, 180);
  }

  function toggleSelect(id: string) {
    setSelected((sel) => {
      const next = new Set(sel);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!shown) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: SLOTS }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const recipes = shown.map((id) => RECIPE_MAP.get(id)!);

  return (
    <div className="space-y-6 pb-24">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {recipes.map((recipe, slot) => (
          <RecipeCard
            key={`${slot}-${recipe.id}`}
            recipe={recipe}
            selected={selected.has(recipe.id)}
            onToggleSelect={() => toggleSelect(recipe.id)}
            onReroll={() => reroll(slot)}
            rolling={rollingSlot === slot}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{selected.size}</span>{" "}
            {selected.size === 1 ? "recept valt" : "recept valda"}
          </p>
          {selected.size > 0 ? (
            <Link
              href="/varukorg"
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Lägg ingredienser i varukorgen →
            </Link>
          ) : (
            <span className="rounded-full bg-stone-200 px-6 py-2.5 text-sm font-semibold text-stone-400">
              Välj minst ett recept
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
