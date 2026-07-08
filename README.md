# 🥕 Matkassen – bygg din egen matkasse

En matkasse à la HelloFresh/Linas – fast **du handlar själv**. Du får fem
middagsförslag, byter ut de du inte gillar (🎲 reroll) och lägger sedan alla
ingredienser direkt i en varukorg, som på Matspar eller ICA:s webbhandel.

## Flöde

1. **Veckans fem förslag** – fem slumpade recept ur en bank med 30 svenska
   vardagsfavoriter (4 portioner som bas).
2. **🎲 Byt ut** – gillar du inte ett förslag rullas ett nytt fram; nyligen
   visade recept undviks tills banken är genombläddrad.
3. **Välj** de recept du vill laga och gå till **varukorgen**.
4. Ingredienserna slås ihop över recepten, matchas mot butiksprodukter och
   antalet förpackningar beräknas. Skafferivaror (salt, olja, kryddor…) listas
   separat under "kolla att du har hemma".
5. Justera portioner (2/4/6/8) och antal, se totalpris och kopiera
   inköpslistan.
6. **Skicka till Matspar** – fyller din riktiga Matspar-varukorg, redo för
   deras vanliga utcheckning mot ICA, Coop, Willys m.fl. Se avsnittet nedan
   för hur och varför det är byggt som ett bokmärke.

## Kom igång

```bash
npm install
npm run dev        # http://localhost:3000
npm run check:data # validerar att recept och katalog hänger ihop
```

## Butiksdata: Matspar (default) vs. mock

Varukorgen byggs mot en `StoreProvider` (`src/lib/store/provider.ts`):

- **`matspar`** (default) – riktiga produkter, märken och priser från
  matspar.se, med länk vidare till produktsidan. Matspar har inget publikt
  API, så datan kommer från `src/data/matspar-snapshot.ts` – en genererad
  ögonblicksbild, inte en live-fråga per request (det finns ingen stabil
  dold endpoint att fråga, och att gissa oss fram vid varje sidladdning vore
  opålitligt och otrevligt mot Matspars servrar). Kör `npm run fetch:matspar`
  för att uppdatera priserna (tar ~1 minut, gör ~70 sidhämtningar mot
  matspar.se).
- **`mock`** – handskriven katalog (`src/data/catalog.ts`), används som
  säkerhetsnät för enstaka ingredienser som saknas i snapshotet.

```bash
STORE_PROVIDER=mock npm run dev   # tvinga fram mock-katalogen
npm run fetch:matspar             # uppdatera Matspar-snapshotet
```

**Känd begränsning:** matchningen mellan ingrediens och Matspar-produkt görs
per kategori + nyckelord (se `scripts/fetch-matspar.mjs`), inte en riktig
textsökning. De flesta träffar är exakta (t.ex. "Nötfärs", "Torskfilé MSC"),
men enstaka kan bli lite fel om Matspars kategorier är breda – just nu gäller
det `falafel`, som inte hittade ett eget falafelprodukt i sin kategori och
föll tillbaka på en annan vegetarisk produkt.

## "Skicka till Matspar" – varför ett bokmärke?

Målet är att en knapptryckning i Matkassen ska landa i en **riktig, ifylld
Matspar-varukorg**, redo för deras befintliga utcheckning mot ICA/Coop/Willys.
Det går inte att göra det osynligt från vår server, av skäl som är värda att
förstå innan man petar i koden:

- Matspars varukorg är knuten till en sessionscookie på `matspar.se`. Ingen
  server på en annan domän kan sätta en cookie åt `matspar.se` – det är en
  grundläggande webbläsarbegränsning, inte något Matspar råkat missa.
- Deras API tillåter bara anrop (CORS) från `https://www.matspar.se`, så vår
  sida kan inte anropa det direkt från användarens webbläsare heller.
- Deras `cart/add-products-to-cart`-endpoint kräver en CSRF-token som måste
  skickas som en header – vanliga `<form>`-POST:ar (det knep Matspar själva
  använder för att skicka vidare till t.ex. Coop) kan inte sätta headers, så
  den vägen är stängd också. Detta bekräftades genom att testa mot deras
  riktiga (odokumenterade) API.

Lösningen: ett **bokmärke** (bookmarklet). Det är ett litet skript som
användaren sparar en gång i sin bokmärkesrad. När de klickar på det medan
matspar.se är öppet i fliken körs skriptet i den sidans egen kontext – samma
ursprung, samma riktiga sessionscookie, riktig CSRF-token. Det är exakt vad
som skulle hänt om Matspars egen kod gjort anropet, bara triggat av
användaren själv. Se `src/lib/matspar-handoff.ts` för koden och
`src/components/MatsparHandoff.tsx` för UI:t (tre steg: spara bokmärket →
öppna Matspar med varukorgen kodad i URL:en → klicka bokmärket där).

Hela kedjan (URL-generering → bokmärkets CSRF-hantering → verkligt ifylld
varukorg) har testats mot matspar.se:s riktiga API under utvecklingen.

## Struktur

| Fil | Innehåll |
| --- | --- |
| `src/data/recipes.ts` | Receptbanken (30 recept, mängder i g/ml/st för 4 port) |
| `src/data/catalog.ts` | Mock-katalogen (säkerhetsnät) |
| `src/data/matspar-snapshot.ts` | Genererad ögonblicksbild av riktiga Matspar-produkter |
| `scripts/fetch-matspar.mjs` | Hämtar & genererar Matspar-snapshotet |
| `src/lib/cart.ts` | Slår ihop ingredienser → produkter → förpackningar |
| `src/lib/store/provider.ts` | Provider-abstraktionen (matspar/mock) |
| `src/app/api/cart/resolve` | POST: recept-id:n + portioner → varukorg |
| `src/app/api/products/search` | GET: fritextsök i butiken |
| `src/components/RecipePicker.tsx` | 5 kort, reroll, val (localStorage) |
| `src/components/CartView.tsx` | Varukorgen med antal, portioner och totalpris |
| `src/lib/matspar-handoff.ts` | Bokmärkets källkod + URL-byggare för "Skicka till Matspar" |
| `src/components/MatsparHandoff.tsx` | UI för de tre stegen i handoff-flödet |
