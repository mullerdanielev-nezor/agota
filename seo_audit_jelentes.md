# SEO Audit – Loft of Beauty (loftofbeauty.hu)
**Dátum:** 2026-07-13 · **Terjedelem:** teljes oldal (10 él aktív oldal + 1 árva fájl) · **Típus:** helyi szolgáltató (kozmetika, Nyíregyháza)

Vizsgált oldalak: `index.html`, `foglalas.html`, `szolgaltatasok.html`, `hullammasszazs.html`, `radiofrekvencia.html`, `hiemt.html`, `kavitacio.html`, `rolam.html`, `referenciak.html`, `kapcsolat.html`. Külön megjegyzés a `kozmetika_hero (1).html` fájlról lentebb.

---

## Executive Summary

Az oldal **dizájn és tartalom szempontjából jó minőségű** (egyedi hangvétel, valós tulajdonos-történet, előtte/utána képek, vendégvélemények), de **technikai SEO alapok szinte teljesen hiányoznak**. Jelenleg a Google-nek gyakorlatilag semmilyen strukturált, gépileg értelmezhető jelzést nem ad az oldal arról, hogy ki, hol, mit kínál — ez helyi keresésnél (pl. "kozmetika Nyíregyháza") komoly hátrány.

**Top 5 legsürgősebb probléma:**
1. **Nincs meta description egyetlen oldalon sem** — a Google saját maga generál (gyakran esetlen) leírást a SERP-ben.
2. **Nincs `robots.txt` és `sitemap.xml`** — lassabb, kevésbé teljes indexelés.
3. **Nincs semmilyen structured data (JSON-LD)** — kimarad a LocalBusiness/Beauty Salon rich snippet, a csillagos értékelés a keresésben, a nyitvatartás megjelenítése stb.
4. **Nincs Open Graph / Twitter Card** — ha valaki megosztja a linket Facebookon/Messengeren/Instagramban, cím, kép és leírás nélkül, csúnyán jelenik meg.
5. **Óriási videófájlok** (10–28 MB, `.MP4`, tömörítetlen) közvetlenül a `images/` mappából töltődnek be, autoplay-jel — ez brutálisan lassítja az oldalt, ami Core Web Vitals és mobil rangsorolási hátrány.

Ezek mind **gyors, alacsony kockázatú javítások** — egy nap alatt megoldhatók, és a legnagyobb SEO-hatással bírnak az összes talált hiba közül.

---

## Technical SEO Findings

### 1. Hiányzó `robots.txt`
- **Hatás:** Közepes
- **Bizonyíték:** a gyökérkönyvtárban nincs `robots.txt` fájl.
- **Javaslat:** hozz létre egy minimál `robots.txt`-t, ami engedélyez mindent és hivatkozik a sitemapre:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://loftofbeauty.hu/sitemap.xml
  ```

### 2. Hiányzó `sitemap.xml`
- **Hatás:** Közepes
- **Bizonyíték:** nincs `sitemap.xml` a gyökérben, és a Search Console feltehetően nem kapja meg strukturáltan az URL-listát.
- **Javaslat:** generálj egy egyszerű XML sitemapot mind a 10 oldalra (lásd Prioritized Action Plan), és regisztráld Search Console-ban.

### 3. Nincs canonical tag egyetlen oldalon sem
- **Hatás:** Közepes
- **Bizonyíték:** egyik `<head>`-ben sincs `<link rel="canonical">` (index.html, foglalas.html, stb. mind).
- **Javaslat:** minden oldalra kerüljön önhivatkozó canonical, pl. index.html-re:
  `<link rel="canonical" href="https://loftofbeauty.hu/">`

### 4. Nincs structured data / JSON-LD schema
- **Hatás:** Magas (helyi vállalkozásnál ez az egyik legnagyobb SEO-lehetőség)
- **Bizonyíték:** egyik fájlban sincs `<script type="application/ld+json">`.
- **Javaslat:**
  - `index.html`-re **LocalBusiness / BeautySalon** schema (név, cím, telefonszám, nyitvatartás, geo-koordináták, `aggregateRating` a 4,9★/280+ vélemény alapján).
  - A `referenciak.html` egyedi véleményeihez **Review** schema.
  - A szolgáltatás-oldalakhoz (`hiemt.html`, `kavitacio.html` stb.) **Service** schema.
  - Ezek nélkül az oldal kimarad a Google helyi kereső rich snippetjeiből (csillagok, nyitvatartás a SERP-ben).

### 5. Nincs Open Graph / Twitter Card meta
- **Hatás:** Magas
- **Bizonyíték:** egyik `<head>`-ben sincs `og:title`, `og:description`, `og:image`, `twitter:card`.
- **Javaslat:** minden oldalra minimum:
  ```html
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:image" content="https://loftofbeauty.hu/images/rolam.webp">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="hu_HU">
  <meta name="twitter:card" content="summary_large_image">
  ```

### 6. Óriási, tömörítetlen videófájlok
- **Hatás:** Magas (Core Web Vitals: LCP, oldalsebesség, mobil adatforgalom)
- **Bizonyíték:**
  - `images/v24044gl0000d7ajjg7og65s0pmb35c0.MP4` — **~12 MB**, `index.html` és `szolgaltatasok.html` `autoplay`-jel tölti be.
  - `images/vegleges-szortelenites.mp4` — **~10,5 MB**, `szolgaltatasok.html`.
  - `images/szortelenites_eredeti_forras.mp4` — **~28 MB**, jelenleg egyetlen HTML fájlból sincs rá hivatkozás (feltehetően csak nyers forrásanyag a mappában — törölhető vagy ki kell zárni a publikált mappából).
  - `images/v24044gl0000d7ajjg7og65s0pmb35c0_original.MP4` (~12,3 MB) és `_prev.MP4` (~13,1 MB) szintén nincsenek beépítve egyetlen oldalba sem — feleslegesen foglalják a helyet/sávszélességet, ha véletlenül crawlelhetők.
- **Javaslat:**
  - Tömörítsd a ténylegesen használt két videót H.264/H.265-tel, cél <2–3 MB / videó (pl. `ffmpeg -crf 28`).
  - Töröld vagy mozgasd ki a publikált mappából a nem használt nyers videókat (`_original`, `_prev`, `szortelenites_eredeti_forras.mp4`), amíg nincs rájuk hivatkozás — feleslegesen crawlelhetők/indexelhetők.
  - Fontold meg `preload="none"` használatát `autoplay` helyett mobilon, vagy poster képet + kattintásra induló lejátszást.

### 7. Nem publikus/árva fájl a gyökérben: `kozmetika_hero (1).html`
- **Hatás:** Alacsony–Közepes
- **Bizonyíték:** ez egy korábbi, más márkanévvel ("SZÉPSÉG STUDIO") készült terv-verzió, `#` linkekkel, nincs sehonnan belinkelve az élő oldalról, és nem használja a `assets/site.css`-t.
- **Javaslat:** töröld a gyökérből, vagy mozgasd egy nem publikált mappába (pl. `drafts/`), mert ha véletlenül linkelve/crawlelve lenne, zavaró duplikált/eltérő márkajelzést adna a Google-nek.

### 8. Törött placeholder social linkek minden oldal láblécében
- **Hatás:** Alacsony (bizalmi/E-E-A-T jelzés, nem közvetlen ranking-faktor)
- **Bizonyíték:** minden oldal footerében `<a href="#" aria-label="Instagram">IG</a>` és ugyanígy a Facebook — nem mutatnak valós profilra.
- **Javaslat:** linkeld be a valódi Instagram/Facebook oldalakat, vagy vedd ki, ha nincs ilyen. A közösségimédia-linkek erősítik a helyi vállalkozás hitelességét (E-E-A-T) és extra crawlelési utat is adnak.

### 9. Hiányzó `width`/`height` attribútum a `<img>` tageken
- **Hatás:** Alacsony–Közepes (Cumulative Layout Shift)
- **Bizonyíték:** minden `<img>` csak `loading="lazy" decoding="async"`-et kap, explicit `width`/`height` sehol.
- **Javaslat:** add meg a natív képméreteket (vagy `aspect-ratio` CSS-ben, ami már részben megvan a konténereken) a CLS csökkentésére.

---

## On-Page SEO Findings

### 10. Nincs meta description **egyetlen** oldalon sem
- **Hatás:** Magas
- **Bizonyíték:** mind a 10 aktív HTML fájl `<head>`-jében hiányzik a `<meta name="description">`.
- **Javaslat:** írj egyedi, 150–160 karakteres leírást minden oldalra. Például:
  - `index.html`: "Loft of Beauty – prémium kozmetikai stúdió Nyíregyházán. Hullámmasszázs, rádiófrekvencia, HIEMT és kavitáció, 12+ év tapasztalattal. Foglalj időpontot online!"
  - `hiemt.html`: "HIEMT izomépítő kezelés Nyíregyházán a Loft of Beautyban. 30 perc alatt 30 000 izomösszehúzódás – alakformálás fájdalommentesen. Foglalj most!"
  - (a többi oldalra hasonló mintára, a Prioritized Action Plan 1. pontjában részletezve)

### 11. Title tagek — alapvetően jók, de van finomítani való
- **Hatás:** Alacsony
- **Bizonyíték:** minden oldal címe egyedi, ésszerű hosszúságú. Ugyanakkor a szolgáltatás-aloldalak (pl. "HIEMT izomépítés – Loft of Beauty") nem tartalmazzák a helymeghatározó kulcsszót ("Nyíregyháza"), miközben a főoldal ("Loft of Beauty – Nyíregyháza prémium kozmetikája") igen.
- **Javaslat:** egységesítsd, pl. `HIEMT izomépítés Nyíregyházán – Loft of Beauty` mintára minden szolgáltatás-oldalon (`hiemt.html`, `kavitacio.html`, `radiofrekvencia.html`, `hullammasszazs.html`), mert helyi keresésnél ("hiemt nyíregyháza") ez direkt relevancia-jelzés.

### 12. Heading-struktúra — rendben van
- **Hatás:** —
- **Megfigyelés:** minden oldalon pontosan egy H1 van, logikus H2-almenetekkel. Nincs teendő.

### 13. Alt-textek — jórészt jók, néhány helyen túl generikus
- **Hatás:** Alacsony
- **Bizonyíték:** `referenciak.html` és `index.html` galéria-blokkjaiban 5-6 kép is ugyanazt az alt szöveget kapja: `alt="Kezelés eredménye"` (galeria1–5.webp, utana-has.webp stb.)
- **Javaslat:** egyedibb, leíróbb alt szöveg képenként, pl. `alt="Kavitációs zsírbontás eredménye – has terület, Loft of Beauty"`.

### 14. Belső linkelés — jó
- **Hatás:** —
- **Megfigyelés:** a szolgáltatás-oldalak keresztlinkelik egymást ("Kapcsolódó kezelések"), a főoldal és a `szolgaltatasok.html` is minden aloldalra mutat, nincs árva oldal az aktív oldalak között. Nincs teendő.

### 15. `foglalas.html` — az űrlap nem küld ténylegesen sehova
- **Hatás:** Közepes (nem SEO, hanem konverziós/bizalmi kockázat, de érdemes jelezni)
- **Bizonyíték:** `submitBooking()` JS-függvény csak egy sikeresnek tűnő üzenetet jelenít meg (`hiemt.html:337-345` mintájú kód a `foglalas.html`-ben), de nincs backend/email-küldés — a felhasználó azt hiheti, elküldte a foglalást, valójában semmi nem érkezik be.
- **Javaslat:** kösd be egy tényleges form-küldő szolgáltatást (pl. Formspree, EmailJS, vagy saját backend), különben vendégek vesznek el.

---

## Content Findings

### 16. Nincs FAQ / gyakori kérdések tartalom
- **Hatás:** Közepes (hosszú távú lehetőség)
- **Megfigyelés:** egyik szolgáltatás-oldal sem tartalmaz GYIK-blokkot (pl. "Fáj a kezelés?", "Hány alkalom kell?", "Kinek nem ajánlott?").
- **Javaslat:** adj hozzá 3–5 kérdést oldalanként + `FAQPage` JSON-LD schema — ez extra helyet nyerhet a SERP-ben (kibontható kérdések).

### 17. Vélemények valós, de nem strukturált adatok
- **Hatás:** Közepes
- **Megfigyelés:** a `referenciak.html` és `index.html` 4,9★/280+ értékelést mutat statikus HTML-ként, de nincs `Review`/`AggregateRating` schema hozzájuk kapcsolva → a Google nem tudja ezt csillagos snippetként megjeleníteni a keresési találatban.
- **Javaslat:** lásd 4. pont — kösd össze LocalBusiness schema `aggregateRating` mezőjével.

### 18. E-E-A-T szempontból erős a `rolam.html`
- **Hatás:** pozitív, nincs teendő
- **Megfigyelés:** valós név (Hajdó Ágota), időrendi történet 2012-től, személyes hangvétel — ez jó alapja a Google E-E-A-T jelzéseinek. Érdemes lenne ezt még jobban kiaknázni schema-val (`Person`/`founder` a LocalBusiness-ben).

---

## Prioritized Action Plan

### 1. Kritikus (blokkolja az indexelést / rangsorolást) — csináld elsőként
- [ ] Meta description hozzáadása mind a 10 oldalhoz
- [ ] `robots.txt` létrehozása
- [ ] `sitemap.xml` létrehozása és beküldése Search Console-ba
- [ ] Canonical tag minden oldalra

### 2. Magas hatású fejlesztések
- [ ] LocalBusiness/BeautySalon JSON-LD schema az `index.html`-re (cím, telefon, nyitvatartás, aggregateRating)
- [ ] Open Graph + Twitter Card meta minden oldalra
- [ ] Videófájlok tömörítése (12 MB → cél <3 MB), felesleges nyers videók eltávolítása a `images/` mappából
- [ ] `kozmetika_hero (1).html` törlése vagy kimozgatása a gyökérből

### 3. Gyors győzelmek (könnyű, azonnali haszon)
- [ ] Title tagek egységesítése "Nyíregyháza" kulcsszóval a szolgáltatás-oldalakon
- [ ] Törött `href="#"` social linkek pótlása valós Instagram/Facebook URL-lel
- [ ] Generikus "Kezelés eredménye" alt-textek pontosítása a galériaképeken
- [ ] `width`/`height` attribútum az `<img>` tagekre a CLS csökkentésére

### 4. Hosszú távú ajánlások
- [ ] FAQ-blokk + `FAQPage` schema a szolgáltatás-oldalakra
- [ ] `Review`/`AggregateRating` schema a valós vendégvéleményekhez
- [ ] `foglalas.html` űrlap tényleges backend-bekötése (jelenleg nem küld el semmit)
- [ ] Blog / edukációs tartalom hosszabb távon a topikai lefedettség bővítésére (pl. "Mennyi idő alatt látszik a HIEMT eredménye?")

---

## Task-Specific megjegyzések
- Search Console / Analytics hozzáférés nem állt rendelkezésre ehhez az audithoz — a fenti javaslatok kizárólag a forráskód és fájlrendszer alapján készültek.
- A domainen élesben (HTTPS, DNS, valós robots/sitemap crawl) nem tudtam ellenőrizni, mert ez egy helyi fájlrendszeri másolat — a végleges telepítés után érdemes újra futtatni egy élő audit-ot (PageSpeed Insights, Rich Results Test) a tényleges Core Web Vitals és schema-validáció ellenőrzésére.
