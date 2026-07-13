# AI-keresésre felkészítés (AEO/GEO/LLMO) – Loft of Beauty
**Dátum:** 2026-07-13 · **Cél:** hogy az oldal ne csak a Google hagyományos találati listájában, hanem az AI-alapú keresőkben (ChatGPT, Perplexity, Google AI Overviews, Gemini, Copilot, Claude) is megjelenjen és hivatkozott forrásként szerepeljen.

---

## Fontos alapelv, mielőtt belemegyünk a részletekbe

A Google hivatalos állásfoglalása szerint (Search Central, AI features optimization guide) **nincs külön "AI SEO" — a jó, emberek számára írt, jól strukturált, E-E-A-T-elveket követő tartalom ugyanaz, ami a hagyományos Google-találatokban és az AI Overviews-ban is jól teljesít.** A Google kifejezetten óva int attól, hogy a tartalmat mesterségesen "AI-falatokra" daraboljuk, vagy külön verziót írjunk a robotoknak — ez akár "scaled content abuse" büntetést is vonhat maga után.

**Amit viszont a más motorok (ChatGPT, Perplexity, Claude) ténylegesen jutalmaznak, és a Google-t sem zavarja:**
- kivonatolható, önmagában is értelmezhető bekezdések
- FAQ-blokkok természetes nyelvű kérdésekkel
- strukturált adat (schema.org)
- gépileg olvasható kontextus-fájlok (pl. `llms.txt`)
- valódi, ellenőrizhető statisztikák és szakértői hitelesség

Ez alapján dolgoztam — semmi nem "AI-nak írt" trükk, minden ugyanazt a valós, már meglévő tartalmat teszi jobban kivonatolhatóvá és gépileg értelmezhetővé.

---

## Amit elvégeztem

### 1. `llms.txt` létrehozása (gyökérkönyvtár)
Egy rövid, strukturált kontextus-fájl, amit az AI-rendszerek (ChatGPT, Claude, Perplexity) képesek beolvasni, hogy gyorsan megértsék: ki a vállalkozás, mit csinál, hol van, mit kínál, és hova mutatnak a fő oldalak. Tartalmazza a valós céges adatokat (cím, telefon, nyitvatartás, 5,0★/7 vélemény, közösségi média), és egy explicit megjegyzést arról, hogy az oldal minden állítása valós, ellenőrzött adat — nincs felfújt statisztika.

### 2. FAQ-szekciók + `FAQPage` schema mind az 5 releváns oldalon
- `hiemt.html`, `hullammasszazs.html`, `kavitacio.html`, `radiofrekvencia.html`: 4-4 kérdés (fájdalom, ajánlott alkalomszám, kombinálhatóság, kinek nem ajánlott) — mind a már meglévő, valós info-strip adatokra (kezelés hossza, ajánlott kúra) építve, semmi kitalált.
- `szolgaltatasok.html`: 4 átfogó kérdés (melyik kezelés kinek való, árazás, foglalás módja, cím).
- Minden FAQ **látható tartalomként is megjelenik az oldalon** (nem csak a schema-ban rejtve) — ez fontos, mert a Google kifejezetten megköveteli, hogy a structured data tükrözze a látható tartalmat.
- Az árazásnál **szándékosan nem találtam ki konkrét összegeket** — az oldalon eddig sem szerepelt árlista, ezért az FAQ válasza is őszintén "hívj minket, személyre szabott ajánlatot adunk" irányba mutat, nem fabrikált számokkal.

### 3. `Service` schema minden kezelés-oldalon
A 4 kezelés-aloldal (`hiemt`, `hullammasszazs`, `kavitacio`, `radiofrekvencia`) mindegyike kapott egy önálló `Service` JSON-LD blokkot (szolgáltatás neve, leírása, a szolgáltató cég adatai, működési terület). Ez segít az AI-rendszereknek pontosan beazonosítani az egyes szolgáltatásokat különálló, kereshető entitásként — nemcsak mint "egy oldal a sok közül".

### 4. `hasOfferCatalog` a főoldal LocalBusiness schema-jában
Az `index.html` már meglévő `BeautySalon` schema-ja most tartalmaz egy `OfferCatalog`-ot, ami mind az 5 szolgáltatást (a 4 gépi kezelés + a szőrtelenítés) felsorolja, linkkel. Így már a főoldal önmagában is teljes, gépileg értelmezhető képet ad a teljes kínálatról — nem kell minden aloldalt külön "megtalálnia" az AI-nak ahhoz, hogy tudja, mit kínál a stúdió.

### 5. AI-botok hozzáférésének ellenőrzése
A `robots.txt` már eleve `User-agent: * / Allow: /` szabállyal mindent enged (csak az `/admin.html` van kizárva) — ez azt jelenti, hogy a **GPTBot** (ChatGPT), **PerplexityBot**, **ClaudeBot** (Claude/Anthropic), **Google-Extended** (Gemini/AI Overviews) és **Bingbot** (Copilot) mind szabadon hozzáférnek és idézhetik az oldalt. Nincs blokkolás — ez a leggyakoribb hiba, amit más oldalak elkövetnek, nálunk ez már eleve rendben volt.

### 6. Kivonatolhatósági ellenőrzés (extractability audit)
Átnéztem minden kezelés-oldal nyitó bekezdését ("Mi ez?" szekció) — ezek már eleve jól teljesítenek: rövid, önmagában is értelmezhető, definíció-jellegű mondattal indulnak (pl. *"A hullámmasszázs egy kíméletes, gépi nyirokmasszázs, amely..."*), nem igényeltek átírást.

---

## Amit szándékosan NEM csináltam meg, és miért

| Elem | Miért nem |
|---|---|
| **`/pricing.md` fájl** | Nincs publikus árlista az oldalon — kitalált árak feltöltése hamis, félrevezető adatot adna az AI-ügynököknek, akik esetleg vásárlási döntést hoznának rá. Ha lesz hivatalos árlista, ezt érdemes pótolni. |
| **Konkrét eredmény-időtartam állítások** (pl. "X hónapig tart a hatás") | Nincs erre vonatkozó, általunk ellenőrzött adat — inkább kihagytam, mint kitaláltam volna. |
| **OKF (Open Knowledge Format) bundle** | Ez egy nagyon friss (2026 júniusi), még nem bizonyított rangsorolási jelzés — egy ilyen kis, helyi vállalkozásnál egyelőre nem éri meg a plusz karbantartási terhet. Ha stabilizálódik és elterjed, érdemes lehet később visszatérni rá. |
| **`Article`/`BlogPosting` schema** | Az oldalnak nincs blogja/cikk-tartalma, ez a schema-típus itt nem releváns. |

---

## Ellenőrzés

- Mind a 9 új JSON-LD blokk (`index.html` + 4 kezelés-oldal × 2 blokk + `szolgaltatasok.html`) szintaktikailag validált (`JSON.parse` teszttel).
- Minden FAQ-tartalom **valós, már meglévő adatra épül** (info-strip számok, meglévő szöveges tartalom) — nincs kitalált statisztika vagy állítás.
- A `robots.txt` már eleve engedi az összes fő AI-crawlert.

## Következő lépések (opcionális, később)

1. Ha lesz hivatalos árlista → `/pricing.md` létrehozása.
2. Vendégvélemények szöveges tartalommal (jelenleg csak név + csillag van, szöveg nélkül, mert a valós Google-profilon sincs írott szöveg) — ha a jövőben érkeznek szöveges Google-vélemények, érdemes azokat is FAQ/Review formában megjeleníteni.
3. Havi manuális AI-láthatósági ellenőrzés: rákeresni ChatGPT-ben/Perplexity-ben olyan kérdésekre, mint "HIEMT kezelés Nyíregyházán" vagy "testkezelés stúdió Nyíregyháza", és megnézni, megjelenik-e a Loft of Beauty forrásként.
