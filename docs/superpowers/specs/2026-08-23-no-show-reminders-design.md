# No-show elleni emlékeztető és visszaigazolás rendszer

Státusz: jóváhagyva, implementációs tervre vár.

## Cél

Csökkenteni a be nem jelentkező (no-show) foglalásokat automatikus emlékeztetőkkel és
kötelező visszaigazolással, a meglévő Firestore + Brevo email infrastruktúrára építve.
Csak email csatorna (nincs SMS). Ágota (a stúdió) mostantól sem kap plusz emailt a
visszaigazolás miatt — kizárólag a foglaláskori értesítőt kapja, ahogy jelenleg is; a
visszaigazolatlan foglalásokat az admin felületen látja.

## 1. Adatmodell (Firestore `bookings`)

Új mezők minden újonnan létrejövő foglaláshoz:

- `status`: `"pending"` → `"confirmed"` / `"cancelled"` (cancelled csak admin kézi
  törlés/jelölés útján)
- `confirmToken`: véletlen string, ez kerül a visszaigazoló linkbe
- `remindersSent`: `{ r48: bool, r24: bool, r3: bool, r1: bool }` — hogy egy foglalás
  sose kapja meg kétszer ugyanazt az emailt

A `foglalas.html` foglalás-létrehozó tranzakciója egészül ki ezekkel a mezőkkel.

## 2. Emlékeztető-ütemezés

- **48 órával a foglalás előtt**: emlékeztető email a vendégnek + "Erősítsd meg"
  gomb (link a `confirmToken`-nel).
- **24 órával előtte**: ha a vendég még nem erősítette meg → sürgető email csak a
  vendégnek ("erősítsd meg, különben..."). **Ágotának ekkor nem megy email.**
- **3 órával előtte**: rövid emlékeztető a vendégnek, a visszaigazolási státusztól
  függetlenül.
- **1 órával előtte**: utolsó emlékeztető a vendégnek, ugyanígy függetlenül a
  visszaigazolástól.

Ha a vendég a 48h-s vagy 24h-s emailben a linkre kattint → `status: confirmed`,
`remindersSent` ettől függetlenül követi a saját logikáját (a 3h/1h emlékeztető
mindenképp kimegy).

Ha egy foglalás `status: cancelled`, egyetlen emlékeztető sem megy ki rá.

## 3. Visszaigazoló link és biztonság

Új szerver végpont: `/api/confirm-booking.js`.

Link formátum: `https://loftofbeauty.hu/api/confirm-booking?id=<bookingId>&token=<confirmToken>`

A végpont Firebase Admin SDK-t használ (service account, kizárólag szerver oldalon,
Vercel környezeti változóként tárolva — soha nem kerül a kódba vagy a böngészőbe).
Ellenőrzi, hogy a `token` egyezik-e a foglaláshoz tárolt `confirmToken`-nel, majd
frissíti a Firestore `bookings/{id}` dokumentumot `status: "confirmed"`-ra. Ez a
kliens oldali Firestore szabályok miatt (`allow update: if false` a `bookings`
gyűjteményen) csak szerver oldalról, admin jogosultsággal végezhető el.

Sikeres visszaigazolás után egyszerű statikus "Köszönjük, visszaigazoltad az
időpontod!" oldal jelenik meg. Érvénytelen vagy már felhasznált token esetén
hibaüzenet, de nem árulja el a foglalás részleteit.

## 4. Ütemezés (cron)

Új végpont: `/api/send-reminders.js`. Minden meghíváskor átnézi a következő ~50 órán
belüli, `cancelled`-nek nem jelölt foglalásokat, és minden olyanra, amelyiknek a
`remindersSent` megfelelő mezője még `false`, és eljött az ideje (48h/24h/3h/1h
ablak), elküldi az adott emailt a Brevón keresztül, majd frissíti a
`remindersSent` mezőt.

A végpontot egy ingyenes külső ütemező (cron-job.org) hívja **óránként** (a Vercel
Hobby csomag beépített Crona csak napi 1 futást enged, ami nem elég a 3h/1h
ablakokhoz). A végpont egy titkos fejléc/query paraméter (pl.
`x-cron-secret: <VERCEL env var>`) ellenőrzésével védett, hogy más ne tudja
meghívni és emaileket kiváltani.

## 5. Admin felület (`admin.html`)

Minden foglalás mellett jelzés a visszaigazolás állapotáról:

- ✅ megerősítve
- ⏳ még nincs megerősítve (48–24 óra van hátra)
- ⚠️ 24 órán belül és nincs visszaigazolva — ez a jel hívja fel Ágota figyelmét,
  hogy érdemes lehet felhívnia a vendéget

Ágota emailt erről **nem** kap, csak az admin felületen látja élőben.

## 6. Új beállítási lépések (nálad, nem kód)

1. Firebase service account JSON létrehozása (Firebase Console → Project Settings
   → Service Accounts → Generate new private key), majd a tartalma bekerül a
   Vercel projekt környezeti változói közé (pl. `FIREBASE_SERVICE_ACCOUNT`).
2. Ingyenes cron-job.org fiók létrehozása, óránkénti HTTP hívás beállítva a
   `/api/send-reminders` végpontra, a titkos header/token megadásával.
3. A titkos cron-token generálása és felvétele Vercel env variable-ként (pl.
   `CRON_SECRET`).

## Kizárva a scope-ból

- SMS csatorna
- Anyagi biztosíték / előleg / bankkártya-garancia
- Automatikus foglalás-törlés visszaigazolás hiányában (a foglalás marad, csak
  jelzés van róla az adminnak)
