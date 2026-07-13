"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MATSPAR_BOOKMARKLET_HREF,
  buildMatsparCartParam,
  buildMatsparOpenUrl,
  matsparProductId,
  type HandoffItem,
} from "@/lib/matspar-handoff";

interface Props {
  items: HandoffItem[];
}

/**
 * "Skicka till Matspar": primär CTA som öppnar matspar.se/start med varukorgen
 * kodad i URL:en. Engångssteget (spara bokmärket) ligger hopfällt så att
 * gränssnittet är rent för den som redan gjort det. Se src/lib/matspar-handoff.ts
 * för varför ett bokmärke behövs.
 */
export default function MatsparHandoff({ items }: Props) {
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const [showSetup, setShowSetup] = useState(false);

  const { param, includedCount } = useMemo(() => {
    const withId = items.filter((i) => matsparProductId(i.product) !== null);
    return { param: buildMatsparCartParam(withId), includedCount: withId.length };
  }, [items]);

  // React 19 blockerar javascript:-hrefs satta via JSX (XSS-skydd), så bokmärkets
  // href måste sättas imperativt via DOM-API:t.
  useEffect(() => {
    bookmarkletRef.current?.setAttribute("href", MATSPAR_BOOKMARKLET_HREF);
  }, []);

  if (includedCount === 0) return null;

  function openMatspar() {
    window.open(buildMatsparOpenUrl(param), "_blank", "noopener,noreferrer");
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <button
        type="button"
        onClick={openMatspar}
        className="w-full rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        🛒 Skicka {includedCount} {includedCount === 1 ? "vara" : "varor"} till Matspar →
      </button>
      <p className="mt-2 text-center text-xs text-emerald-800">
        Fyller din riktiga Matspar-varukorg – checka ut hos ICA, Coop, Willys m.fl.
      </p>

      <button
        type="button"
        onClick={() => setShowSetup((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
      >
        {showSetup ? "Dölj" : "Första gången? Så funkar det"} {showSetup ? "▲" : "▼"}
      </button>

      {showSetup && (
        <ol className="mt-3 space-y-2 border-t border-emerald-200 pt-3 text-sm text-emerald-900">
          <li className="flex flex-wrap items-center gap-2">
            <Step n={1} />
            <span>Dra det här bokmärket till din bokmärkesrad (bara en gång):</span>
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
            <Step n={2} />
            <span>Klicka på den gröna knappen ovan – Matspar öppnas.</span>
          </li>
          <li className="flex items-center gap-2">
            <Step n={3} />
            <span>Klicka på bokmärket på Matspar-fliken. Klart!</span>
          </li>
        </ol>
      )}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
      {n}
    </span>
  );
}
