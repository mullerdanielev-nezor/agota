# Köszönjük oldal + Facebook Lead esemény

## Cél
Meta hirdetéshez megbízható konverziós esemény kell: dedikált URL-en (`koszonjuk.html`) sül el a `Lead` pixel esemény, hogy Ads Managerben URL-alapú konverzióként is beállítható legyen, ne csak inline JS eseményként.

## Érintett oldalak
`index.html`, `landing.html`, `foglalas.html` — mindhárom saját foglalási chat-widgetje sikeres foglalás után idáig irányít át.

## Változás
1. **Új `koszonjuk.html`**: Meta Pixel base kód, query paraméterekből (`svc`, `value`) egyszer lefuttatja `fbq('track','Lead', {...})` és `fbq('track','Schedule', {...})`. Egyszerű köszönő szöveg, link a főoldalra, `noindex` meta.
2. **A 3 foglalási oldalon**: sikeres foglalás után (Firestore-mentés + email-küldés lefutása után) `location.href = 'koszonjuk.html?svc=' + encodeURIComponent(...) + '&value=12000'` — azonnali redirect, nincs várakoztatás.
3. Az eddigi inline `fbTrack('Lead', ...)` / `fbTrack('Schedule', ...)` hívásokat eltávolítjuk ezekből a fájlokból (a régi sikeres-üzenet blokkból), hogy ne legyen dupla számolás — ezt átveszi a köszönjük oldal.
4. Az inline "Köszönjük, foglalásod..." üzenetblokk marad-e a régi oldalon vagy törlődik: törlődik, mivel azonnali redirect történik, a felhasználó nem látja.

## Nem változik
`InitiateCheckout` és `Subscribe` (popup) események helyben maradnak, nem ezekről szól ez a módosítás.
