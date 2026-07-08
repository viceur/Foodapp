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

export function buildMatsparOpenUrl(cartParam: string): string {
  const url = new URL("https://www.matspar.se/");
  url.searchParams.set("mk_cart", cartParam);
  return url.toString();
}

/**
 * Bokmärkets källkod (läsbar). Körs i matspar.se:s egen sida när användaren
 * klickar på det sparade bokmärket där. Se README för hur det verifierades
 * mot Matspars riktiga (odokumenterade) API.
 */
export const MATSPAR_BOOKMARKLET_SOURCE = `(function(){try{if(!/(^|\\.)matspar\\.se$/.test(location.hostname)){alert("Öppna först Matspar via knappen i Matkassen — klicka sedan på det här bokmärket på den fliken.");return}var params=new URLSearchParams(location.search);var raw=params.get("mk_cart");if(!raw){alert("Hittade ingen varukorg att lägga till. Öppna Matspar via knappen i Matkassen igen.");return}var productids={};raw.split(",").forEach(function(pair){var parts=pair.split(":");var id=parseInt(parts[0],10);var qty=parseInt(parts[1],10)||1;if(id>0)productids[id]=qty});if(!Object.keys(productids).length){alert("Kunde inte tolka varukorgen.");return}function addToCart(token){return fetch("https://api.matspar.se/cart/add-products-to-cart",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-Api-Version":"2022-09-13","X-CSRF-Token":token||""},body:JSON.stringify({productids:productids})}).then(function(r){return r.json()})}addToCart(window.csrf_token).then(function(data){if(data&&data.status==="csrf_token_invalid"&&data.csrf_token){return addToCart(data.csrf_token)}return data}).then(function(data){if(data&&data.cart){var missing=(data.missing&&data.missing.length)||0;alert("Klart! Produkterna är tillagda i din Matspar-varukorg."+(missing?" ("+missing+" kunde inte läggas till.)":""));location.href="https://www.matspar.se/kundvagn"}else{alert("Något gick fel. Försök igen eller lägg till varorna manuellt på Matspar.")}}).catch(function(){alert("Något gick fel vid anropet till Matspar. Försök igen.")})}catch(e){alert("Något gick fel: "+e.message)}})();`;

export const MATSPAR_BOOKMARKLET_HREF = `javascript:${encodeURIComponent(MATSPAR_BOOKMARKLET_SOURCE)}`;
