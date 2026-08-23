# Nap letiltása foglalásra (admin)

Státusz: jóváhagyva, implementációs tervre vár.

## Cél

Ágota egy kattintással letilthasson egy adott napot a foglalási naptárban (pl. szabadnap,
zárvatartás), hogy vendégek ne tudjanak arra a napra új időpontot foglalni. A már meglévő
foglalásokat nem érinti.

## Adatmodell

Új Firestore gyűjtemény: `blockedDays`. Dokumentum ID formátuma: `"YYYY-MM-DD"` (ugyanaz a
formátum, mint a `bookings`/`slots` `date` mezője). Tartalma:

```
{ blocked: true, createdAt: <server timestamp> }
```

Ez teljesen független a `slots` és `bookings` gyűjteményektől — letiltáskor semmilyen
meglévő adatot nem módosít vagy töröl.

## Foglalási oldal (`foglalas.html`)

A naptár a `slots`-hoz hasonlóan élőben (onSnapshot) figyeli a látható hónap
`blockedDays` bejegyzéseit. Ha egy nap le van tiltva, a naptárban ugyanúgy inaktívként
(`.off` osztály, nem kattintható) jelenik meg, mint a már teljesen betelt vagy múltbeli
napok — a vendég nem tud rá kattintani, nem lát elérhető időpontot.

## Admin felület (`admin.html`)

A meglévő naptárban egy napra kattintva (ez már most is szűri a foglalás-táblázatot)
megjelenik egy akció-gomb a kiválasztott nap mellett:

- Ha a nap **nincs** letiltva: **"Ezen a napon ne lehessen foglalni"** gomb. Kattintásra,
  ha van a napon foglalás, megerősítő ablak jelenik meg a foglalások számával
  ("Ezen a napon már van N foglalás — ezek megmaradnak, csak új nem jöhet létre.
  Folytatod?"), különben azonnal létrehozza a `blockedDays/{date}` dokumentumot.
- Ha a nap **le van tiltva**: **"Foglalás engedélyezése újra"** gomb, ami törli a
  `blockedDays/{date}` dokumentumot.

A naptár napjain egy vizuális jelzés (pl. piros pötty vagy áthúzás) mutatja, mely napok
vannak letiltva, hogy Ágota hónapról hónapra átlátja anélkül, hogy minden napra rá kellene
kattintania.

## Firestore szabályok (`firestore.rules`)

Új `blockedDays` blokk, a `slots` mintáját követve:

```
match /blockedDays/{dayId} {
  allow get, list: if true;
  allow create, delete: if request.auth != null;
  allow update: if false;
}
```

Bárki olvashatja (ez teszi lehetővé, hogy a `foglalas.html` a bejelentkezés nélküli
vendégek előtt is helyesen mutassa a letiltott napokat), de csak bejelentkezett admin
hozhatja létre vagy törölheti.

## Kizárva a scope-ból

- Részleges (csak bizonyos időpontok) letiltása egy napon belül — ez a meglévő
  admin "foglalás törlése" funkcióval már megoldható esetenként, ha kell.
- Visszatérő / ismétlődő szabadnapok (pl. "minden vasárnap") — csak egyedi napok
  letiltása.
- Automatikus értesítés a vendégeknek, ha egy már foglalt napot utólag letiltanak —
  a meglévő foglalások változatlanul megmaradnak, a letiltás csak az új foglalásokat
  akadályozza meg.
