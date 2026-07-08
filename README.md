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

## Kom igång

```bash
npm install
npm run dev        # http://localhost:3000
npm run check:data # validerar att recept och katalog hänger ihop
```

## Butiksdata: mock vs. Matspar

Varukorgen byggs mot en `StoreProvider` (`src/lib/store/provider.ts`):

- **`mock`** (default) – inbyggd katalog med ~70 svenska matvaror och
  realistiska priser (`src/data/catalog.ts`). Fungerar alltid.
- **`matspar`** (experimentell) – klient mot Matspars *inofficiella* API.
  Matspar har inget publikt API, så endpoint/format kan ändras när som helst;
  vid fel faller appen automatiskt tillbaka på mock-katalogen.

```bash
STORE_PROVIDER=matspar npm run dev
# ev. annan endpoint: MATSPAR_API_BASE=https://api.matspar.se
```

## Struktur

| Fil | Innehåll |
| --- | --- |
| `src/data/recipes.ts` | Receptbanken (30 recept, mängder i g/ml/st för 4 port) |
| `src/data/catalog.ts` | Butikskatalogen (mock-produkter med priser) |
| `src/lib/cart.ts` | Slår ihop ingredienser → produkter → förpackningar |
| `src/lib/store/provider.ts` | Provider-abstraktionen (mock/matspar) |
| `src/app/api/cart/resolve` | POST: recept-id:n + portioner → varukorg |
| `src/app/api/products/search` | GET: fritextsök i butiken |
| `src/components/RecipePicker.tsx` | 5 kort, reroll, val (localStorage) |
| `src/components/CartView.tsx` | Varukorgen med antal, portioner och totalpris |
