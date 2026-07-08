import type { Product } from "@/lib/types";

/**
 * "Skicka till Matspar"-flödet: fyller en RIKTIG Matspar-varukorg i användarens
 * egen webbläsare, redo för deras vanliga utcheckning (ICA, Coop, Willys...).
 *
 * Matspar har inget publikt API och deras cart-endpoint kräver en CSRF-header
 * kopplad till användarens egen sessionscookie – vår server kan alltså aldrig
 * fylla användarens riktiga varukorg (cookies kan inte sättas domänöverskridande,
 * och deras API tillåter bara anrop från www.matspar.se via CORS).
 *
 * Lösningen är ett bokmärke ("bookmarklet"): ett litet skript som användaren
 * sparar en gång i sin bokmärkesrad. När de klickar på det MEDAN de har
 * matspar.se öppet körs skriptet i den sidans egen kontext (samma ursprung,
 * riktiga cookies, riktig CSRF-token) – exakt som om Matspars egen kod gjorde
 * anropet. Det är därför den enda tekniskt hederliga vägen till en riktig,
 * ifylld varukorg: se CLAUDE.md/README för den fullständiga utredningen.
 *
 * Flöde:
 *  1. Bygg en kompakt "produktid:antal,produktid:antal"-sträng av varukorgen.
 *  2. Öppna matspar.se med strängen som query-param (?mk_cart=...).
 *  3. Användaren klickar på det sparade bokmärket på den fliken – det läser
 *     parametern och POST:ar till Matspars cart-API med rätt CSRF-token.
 */

export interface HandoffItem {
  product: Product;
  qty: number;
}

/** Matspar-produkter har id:t "matspar-<productid>". Returnerar det numeriska id:t. */
export function matsparProductId(product: Product): number | null {
  if (product.source !== "matspar") return null;
  const m = /^matspar-(\d+)$/.exec(product.id);
  return m ? Number(m[1]) : null;
}

/** Bygger "id:antal,id:antal"-strängen. Ignorerar produkter utan Matspar-id. */
export function buildMatsparCartParam(items: HandoffItem[]): string {
  const parts: string[] = [];
  for (const { product, qty } of items) {
    const id = matsparProductId(product);
    if (id && qty > 0) parts.push(`${id}:${Math.round(qty)}`);
  }
  return parts.join(",");
}

export function buildMatsparOpenUrl(cartParam: string, zipcode?: string): string {
  const url = new URL("https://www.matspar.se/");
  url.searchParams.set("mk_cart", cartParam);
  if (zipcode) url.searchParams.set("mk_zip", zipcode);
  return url.toString();
}

/** Normaliserar svenskt postnummer ("118 53" -> "11853"). Returnerar null om ogiltigt. */
export function normalizeZipcode(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length === 5 ? digits : null;
}

/**
 * Bokmärkets källkod (läsbar). Körs i matspar.se:s egen sida när användaren
 * klickar på det sparade bokmärket där. Se README för hur det verifierades
 * mot Matspars riktiga (odokumenterade) API.
 *
 * Sätter postnummer (om medskickat) INNAN varukorgen fylls – annars visar
 * Matspar sin egen "välj leveransområde"-ruta varje gång, eftersom deras
 * `has_chosen`-flagga (som styr det) aldrig blir sann utan den här anropet.
 * Verifierat: efter ett enda bokmärkeskörning håller det i sig i efterföljande
 * besök inom samma webbläsarsession (~60 dagar, Matspars sessionscookie).
 */
export const MATSPAR_BOOKMARKLET_SOURCE = `(function(){try{if(!/(^|\\.)matspar\\.se$/.test(location.hostname)){alert("Öppna först Matspar via knappen i Matkassen — klicka sedan på det här bokmärket på den fliken.");return}var params=new URLSearchParams(location.search);var raw=params.get("mk_cart");var zip=params.get("mk_zip");if(!raw){alert("Hittade ingen varukorg att lägga till. Öppna Matspar via knappen i Matkassen igen.");return}var productids={};raw.split(",").forEach(function(pair){var parts=pair.split(":");var id=parseInt(parts[0],10);var qty=parseInt(parts[1],10)||1;if(id>0)productids[id]=qty});if(!Object.keys(productids).length){alert("Kunde inte tolka varukorgen.");return}function call(path,body,token){return fetch("https://api.matspar.se/"+path,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-Api-Version":"2022-09-13","X-CSRF-Token":token||""},body:JSON.stringify(body)}).then(function(r){return r.json()})}function callWithRetry(path,body,token){return call(path,body,token).then(function(data){if(data&&data.status==="csrf_token_invalid"&&data.csrf_token){return call(path,body,data.csrf_token).then(function(d2){d2.__token=data.csrf_token;return d2})}data.__token=token;return data})}var chain;if(zip){chain=callWithRetry("zipcode",{zipcode:zip},window.csrf_token).then(function(zipData){return callWithRetry("cart/add-products-to-cart",{productids:productids},zipData.__token)})}else{chain=callWithRetry("cart/add-products-to-cart",{productids:productids},window.csrf_token)}chain.then(function(data){if(data&&data.cart){var missing=(data.missing&&data.missing.length)||0;alert("Klart! Produkterna är tillagda i din Matspar-varukorg."+(missing?" ("+missing+" kunde inte läggas till.)":""));location.href="https://www.matspar.se/kundvagn"}else{alert("Något gick fel. Försök igen eller lägg till varorna manuellt på Matspar.")}}).catch(function(){alert("Något gick fel vid anropet till Matspar. Försök igen.")})}catch(e){alert("Något gick fel: "+e.message)}})();`;

export const MATSPAR_BOOKMARKLET_HREF = `javascript:${encodeURIComponent(MATSPAR_BOOKMARKLET_SOURCE)}`;
