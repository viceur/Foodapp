"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MATSPAR_BOOKMARKLET_HREF,
  buildMatsparCartParam,
  buildMatsparOpenUrl,
  matsparProductId,
  normalizeZipcode,
  type HandoffItem,
} from "@/lib/matspar-handoff";

const ZIPCODE_KEY = "matkassen:matspar-zipcode";

interface Props {
  items: HandoffItem[];
}

/**
 * "Skicka till Matspar": öppnar matspar.se med varukorgen kodad i URL:en och
 * guidar användaren att köra det sparade bokmärket där, som fyller den RIKTIGA
 * Matspar-varukorgen (deras session, deras cookies) redo för deras vanliga
 * utcheckning mot ICA/Coop/Willys m.fl. Se src/lib/matspar-handoff.ts för varför
 * det måste göras just så här.
 *
 * Postnumret skickas med och sätts av bokmärket INNAN varukorgen fylls –
 * annars visar Matspar sin "välj leveransområde"-ruta varje gång. Sparas i
 * localStorage så det bara behöver anges en gång.
 */
export default function MatsparHandoff({ items }: Props) {
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [zipcode, setZipcode] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(ZIPCODE_KEY);
    if (stored) setZipcode(stored);
  }, []);

  const { param, includedCount, excludedCount } = useMemo(() => {
    const withId = items.filter((i) => matsparProductId(i.product) !== null);
    return {
      param: buildMatsparCartParam(withId),
      includedCount: withId.length,
      excludedCount: items.length - withId.length,
    };
  }, [items]);

  // React 19 blocks javascript: hrefs set via JSX as an XSS precaution, so the
  // bookmarklet link (a legitimate, statically-defined javascript: URI) has to
  // be assigned imperatively via the DOM API instead.
  useEffect(() => {
    bookmarkletRef.current?.setAttribute("href", MATSPAR_BOOKMARKLET_HREF);
  }, []);

  if (includedCount === 0) return null;

  const validZip = normalizeZipcode(zipcode);

  function handleZipChange(value: string) {
    setZipcode(value);
    const normalized = normalizeZipcode(value);
    if (normalized) localStorage.setItem(ZIPCODE_KEY, normalized);
  }

  function openMatspar() {
    window.open(buildMatsparOpenUrl(param, validZip ?? undefined), "_blank", "noopener,noreferrer");
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="text-sm font-semibold text-emerald-900">🛒 Skicka till Matspar</h2>
      <p className="mt-1 text-sm text-emerald-800">
        Fyller din riktiga Matspar-varukorg ({includedCount} {includedCount === 1 ? "vara" : "varor"}), redo att
        checka ut hos ICA, Coop, Willys m.fl. Kräver ett litet engångssteg första gången.
      </p>
      {excludedCount > 0 && (
        <p className="mt-1 text-xs text-emerald-700">
          {excludedCount} {excludedCount === 1 ? "vara finns" : "varor finns"} inte i Matspars katalog just nu och
          måste läggas till manuellt.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="matspar-zip" className="text-sm text-emerald-900">
          Ditt postnummer (så Matspar inte frågar varje gång):
        </label>
        <input
          id="matspar-zip"
          type="text"
          inputMode="numeric"
          placeholder="118 53"
          value={zipcode}
          onChange={(e) => handleZipChange(e.target.value)}
          className="w-24 rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm text-emerald-900"
          maxLength={6}
        />
      </div>

      <ol className="mt-3 space-y-3 text-sm text-emerald-900">
        <li className="flex flex-wrap items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            1
          </span>
          <span>Spara bokmärket (dra till din bokmärkesrad) – görs bara en gång:</span>
          <a
            ref={bookmarkletRef}
            href="#"
            draggable
            className="cursor-move rounded-full border-2 border-dashed border-emerald-600 bg-white px-3 py-1 text-xs font-semibold text-emerald-700"
            title="Dra denna till bokmärkesraden i din webbläsare"
          >
            🔖 Lägg i Matspar-korg
          </a>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            2
          </span>
          <button
            type="button"
            onClick={openMatspar}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Öppna Matspar med din lista ↗
          </button>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            3
          </span>
          <span>På Matspar-fliken: klicka på bokmärket du sparade i steg 1.</span>
        </li>
      </ol>

      {!validZip && zipcode.length > 0 && (
        <p className="mt-2 text-xs text-red-600">Postnumret ska vara 5 siffror.</p>
      )}
      <p className="mt-3 text-xs text-emerald-700">
        Tips: dra knappen i steg 1 till bokmärkesraden – ett vanligt klick på den här sidan gör inget, eftersom du
        inte står på matspar.se.
      </p>
    </section>
  );
}
