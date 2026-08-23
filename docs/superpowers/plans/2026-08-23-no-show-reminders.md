# No-show Emlékeztető és Visszaigazolás Implementációs Terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatikus emlékeztető emailek (48h/24h/3h/1h) és kötelező visszaigazolás bevezetése a Loft of Beauty foglalási rendszerébe, hogy csökkenjen a no-show arány, a meglévő Firestore + Brevo infrastruktúrára építve.

**Architecture:** Két új Vercel serverless végpont (`/api/confirm-booking`, `/api/send-reminders`), amelyek Firebase Admin SDK-val írják a Firestore `bookings` gyűjteményt (a kliens szabályok tiltják a közvetlen update-et). A `foglalas.html` foglalás-létrehozó tranzakciója új mezőkkel bővül. A `send-reminders` végpontot egy külső ütemező (cron-job.org) hívja óránként, titkos header-rel védve. Az `admin.html` új oszlopban mutatja a visszaigazolás állapotát.

**Tech Stack:** Vanilla JS (statikus HTML oldalak), Vercel serverless functions (Node.js, CommonJS), Firebase Firestore + Firebase Admin SDK, Brevo transactional email API. A projektben nincs automata teszt-keretrendszer — a meglévő `api/send-booking.js` mintáját követve a végpontokat `curl`-lal, kézi behívással ellenőrizzük.

---

## Fájlszerkezet

- **Create:** `package.json` — a `firebase-admin` függőség deklarálásához (eddig nem volt package.json a repóban).
- **Create:** `api/_lib/firebase-admin.js` — Firebase Admin SDK inicializálás, `getDb()` export, amit mindkét új végpont újrahasznál.
- **Create:** `api/_lib/reminder-email.js` — a `send-booking.js`-hez hasonló stílusú emlékeztető email HTML-sablonok (48h/24h/3h/1h), Brevo-küldő függvény.
- **Create:** `api/confirm-booking.js` — GET végpont, ami a linkből érkező `id`+`token` alapján `status: "confirmed"`-ra állítja a foglalást.
- **Create:** `api/send-reminders.js` — a cron-job.org által óránként hívott végpont, ami átnézi a következő ~50 órás foglalásokat és kiküldi az esedékes emlékeztetőket.
- **Modify:** `foglalas.html:536-540` — a foglalás-létrehozó tranzakció kiegészül `status`, `confirmToken`, `remindersSent` mezőkkel.
- **Modify:** `admin.html` — a foglalási táblázatokban (`bookRows` és `allRows`) új oszlop a visszaigazolás állapotának jelzésére.

---

### Task 1: Firebase Admin SDK alapok (`package.json` + `api/_lib/firebase-admin.js`)

**Files:**
- Create: `package.json`
- Create: `api/_lib/firebase-admin.js`

- [ ] **Step 1: `package.json` létrehozása a `firebase-admin` függőséggel**

```json
{
  "name": "loft-of-beauty",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "firebase-admin": "^12.6.0"
  }
}
```

- [ ] **Step 2: Függőségek telepítése**

Run: `npm install`
Expected: létrejön a `node_modules/` és a `package-lock.json`, hibaüzenet nélkül.

- [ ] **Step 3: `api/_lib/firebase-admin.js` megírása**

A service account JSON-t egy Vercel környezeti változóból (`FIREBASE_SERVICE_ACCOUNT`, a teljes JSON stringként) olvassuk be, hogy a kulcs soha ne kerüljön a kódba.

```js
// api/_lib/firebase-admin.js
const admin = require('firebase-admin');

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT nincs beállítva a környezeti változók között');
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  dbInstance = admin.firestore();
  return dbInstance;
}

module.exports = { getDb };
```

- [ ] **Step 4: Helyi ellenőrzés modul-betöltésre**

Run: `node -e "require('./api/_lib/firebase-admin.js'); console.log('OK: modul betöltve')"`
Expected: `OK: modul betöltve` (a `getDb()` hívás nélkül nem dob hibát, mert csak a `require` fut le itt).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json api/_lib/firebase-admin.js
git commit -m "feat: firebase-admin alapok a szerveroldali foglalás-frissítéshez"
```

---

### Task 2: Foglalás-létrehozás bővítése új mezőkkel (`foglalas.html`)

**Files:**
- Modify: `foglalas.html:524-541`

- [ ] **Step 1: `confirmToken` generálása és a tranzakció bővítése**

A jelenlegi kód (`foglalas.html:524-541`):

```js
    var id = slotId(selectedDate, selectedSlot);
    var dKey = dateKey(selectedDate);

    try{
      await runTransaction(db, async function(transaction){
        var slotRef = doc(db, 'slots', id);
        var slotSnap = await transaction.get(slotRef);
        if(slotSnap.exists()){
          throw new Error('TAKEN');
        }
        var bookingRef = doc(db, 'bookings', id);
        transaction.set(slotRef, { taken: true, createdAt: serverTimestamp() });
        transaction.set(bookingRef, {
          svc: selectedSvc, date: dKey, time: selectedSlot,
          name: name, phone: phone, email: email, note: note,
          createdAt: serverTimestamp()
        });
      });
    }catch(err){
```

Cseréld erre:

```js
    var id = slotId(selectedDate, selectedSlot);
    var dKey = dateKey(selectedDate);
    var confirmToken = crypto.randomUUID();

    try{
      await runTransaction(db, async function(transaction){
        var slotRef = doc(db, 'slots', id);
        var slotSnap = await transaction.get(slotRef);
        if(slotSnap.exists()){
          throw new Error('TAKEN');
        }
        var bookingRef = doc(db, 'bookings', id);
        transaction.set(slotRef, { taken: true, createdAt: serverTimestamp() });
        transaction.set(bookingRef, {
          svc: selectedSvc, date: dKey, time: selectedSlot,
          name: name, phone: phone, email: email, note: note,
          createdAt: serverTimestamp(),
          status: 'pending',
          confirmToken: confirmToken,
          remindersSent: { r48: false, r24: false, r3: false, r1: false }
        });
      });
    }catch(err){
```

- [ ] **Step 2: Kézi ellenőrzés böngészőben**

Nyisd meg helyi szerverrel (`npx serve .` vagy `vercel dev`) a `foglalas.html`-t, csinálj egy teszt-foglalást, majd a Firebase konzol Firestore nézetében ellenőrizd, hogy az új `bookings/{id}` dokumentumon megjelent-e a `status: "pending"`, `confirmToken` (egy UUID string) és `remindersSent: {r48:false, r24:false, r3:false, r1:false}` mező.
Expected: mind a három új mező jelen van a várt értékekkel, és a foglalás emailje (`api/send-booking.js`) továbbra is kimegy, ahogy eddig.

- [ ] **Step 3: Commit**

```bash
git add foglalas.html
git commit -m "feat: foglaláshoz visszaigazoló token és emlékeztető-státusz mezők"
```

---

### Task 3: Emlékeztető email sablonok (`api/_lib/reminder-email.js`)

**Files:**
- Create: `api/_lib/reminder-email.js`

- [ ] **Step 1: Sablon és Brevo-küldő megírása**

A `api/send-booking.js`-ben látott design (`#FCE9ED` háttér, `#3A0E1C` fejléc, `#E03E63` kiemelés) újrahasznosítva, de saját, önálló modulban — a `send-booking.js`-t nem módosítjuk, hogy a jelenleg is éles foglalás-visszaigazolás ne törhessen el.

```js
// api/_lib/reminder-email.js
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER = { name: 'Loft of Beauty', email: 'foglalas@loftofbeauty.hu' };
const STUDIO_PHONE = '+36305039156';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderReminderEmail(d) {
  var confirmButton = d.confirmUrl
    ? '<tr><td style="padding:0 32px 24px;text-align:center;">' +
      '<a href="' + esc(d.confirmUrl) + '" style="display:inline-block;background-color:#E03E63;color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">Erősítsd meg az időpontod</a>' +
      '</td></tr>'
    : '';

  return `<div style="margin:0;padding:0;background-color:#FCE9ED;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FCE9ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(122,26,52,0.10);">
          <tr>
            <td style="background-color:#3A0E1C;padding:28px 32px;text-align:center;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:2px;color:#FFFFFF;">
                LOFT <span style="color:#E03E63;">&middot;</span> OF BEAUTY
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;text-align:center;">
              <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E03E63;margin-bottom:10px;">${esc(d.headline)}</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#3A0E1C;">${esc(d.name)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FCE9ED;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;width:120px;">Kezelés</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.svc)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;">Dátum</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.date)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A85C72;">Időpont</td>
                        <td style="padding:8px 0;font-size:15px;color:#3A0E1C;font-weight:600;">${esc(d.time)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${confirmButton}
          <tr>
            <td style="background-color:#FCE9ED;padding:20px 32px;text-align:center;">
              <div style="font-size:11px;color:#A85C72;line-height:1.6;">
                Loft of Beauty &middot; Nyíregyháza, Meggyes u. 11.<br>
                Kérdés esetén hívj minket: <a href="tel:${esc(STUDIO_PHONE)}" style="color:#E03E63;text-decoration:none;">${esc(STUDIO_PHONE)}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

async function sendReminderEmail(booking, opts) {
  var payload = {
    sender: SENDER,
    to: [{ email: booking.email, name: booking.name }],
    subject: opts.subject,
    htmlContent: renderReminderEmail({
      headline: opts.headline,
      svc: booking.svc,
      date: booking.date,
      time: booking.time,
      name: booking.name,
      confirmUrl: opts.confirmUrl || null
    })
  };
  var res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Brevo ' + res.status + ': ' + (await res.text()));
  }
}

module.exports = { sendReminderEmail };
```

- [ ] **Step 2: Modul-betöltés ellenőrzése**

Run: `node -e "var m = require('./api/_lib/reminder-email.js'); console.log(typeof m.sendReminderEmail === 'function' ? 'OK' : 'HIBA')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add api/_lib/reminder-email.js
git commit -m "feat: emlékeztető email sablon és Brevo-küldő"
```

---

### Task 4: Visszaigazoló végpont (`api/confirm-booking.js`)

**Files:**
- Create: `api/confirm-booking.js`

- [ ] **Step 1: Végpont megírása**

```js
// api/confirm-booking.js
const { getDb } = require('./_lib/firebase-admin');

function htmlPage(title, message) {
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8">
<title>${title} — Loft of Beauty</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#FCE9ED;color:#3A0E1C;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .card{max-width:420px;background:#fff;border-radius:16px;padding:40px 32px;text-align:center;
        box-shadow:0 12px 30px rgba(122,26,52,0.10);}
  h1{font-family:Georgia,serif;font-size:22px;margin:0 0 12px;}
  p{font-size:15px;line-height:1.6;color:#A85C72;margin:0;}
  a{color:#E03E63;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send(htmlPage('Hiba', 'Érvénytelen kérés.'));
  }

  var id = typeof req.query.id === 'string' ? req.query.id : '';
  var token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!id || !token) {
    return res.status(400).send(htmlPage('Hiba', 'Hiányzó adatok a visszaigazoló linkben.'));
  }

  var db;
  try {
    db = getDb();
  } catch (err) {
    console.error('Firebase Admin nincs konfigurálva:', err);
    return res.status(500).send(htmlPage('Hiba', 'A rendszer jelenleg nem elérhető. Kérünk hívj minket telefonon.'));
  }

  var bookingRef = db.collection('bookings').doc(id);
  var snap = await bookingRef.get();

  if (!snap.exists) {
    return res.status(404).send(htmlPage('Nem található', 'Ez a foglalás nem található — lehet, hogy már törölve lett.'));
  }

  var booking = snap.data();

  if (!booking.confirmToken || booking.confirmToken !== token) {
    return res.status(403).send(htmlPage('Érvénytelen link', 'Ez a visszaigazoló link nem érvényes.'));
  }

  if (booking.status === 'cancelled') {
    return res.status(410).send(htmlPage('Foglalás lemondva', 'Ez a foglalás már le lett mondva.'));
  }

  await bookingRef.update({ status: 'confirmed' });

  return res.status(200).send(htmlPage(
    'Visszaigazolva!',
    'Köszönjük, ' + (booking.name || '') + '! Az időpontod (' + (booking.date || '') + ' ' + (booking.time || '') + ') megerősítve. Várunk szeretettel!'
  ));
};
```

- [ ] **Step 2: Helyi ellenőrzés `vercel dev`-vel**

Run: `vercel dev` (külön terminálban), majd egy másik terminálban:
`curl -i "http://localhost:3000/api/confirm-booking?id=nemletezik&token=xxx"`
Expected: `HTTP/1.1 404`, a válasz törzsében a "Nem található" szöveg.

Ezután hozz létre egy teszt-dokumentumot a Firestore `bookings` gyűjteményben (kézzel, a Firebase konzolból) egy ismert `confirmToken`-nel, és:
`curl -i "http://localhost:3000/api/confirm-booking?id=<a teszt id>&token=<a teszt token>"`
Expected: `HTTP/1.1 200`, "Visszaigazolva!" szöveg, és a Firestore dokumentumon `status` mezője `"confirmed"`-re változik.

- [ ] **Step 3: Commit**

```bash
git add api/confirm-booking.js
git commit -m "feat: visszaigazoló végpont a foglalás emailekhez"
```

---

### Task 5: Emlékeztető-küldő cron végpont (`api/send-reminders.js`)

**Files:**
- Create: `api/send-reminders.js`

- [ ] **Step 1: Végpont megírása**

Az órányi ablakok: 48h/24h/3h/1h. A 48h és 24h emlékeztető csak akkor tartalmaz visszaigazoló linket (és csak akkor küldjük ki), ha a foglaláson van `confirmToken` (a bevezetés előtt létrejött régi foglalásokon nincs). A 3h és 1h emlékeztető mindig egyszerű emlékeztető, visszaigazolástól függetlenül.

```js
// api/send-reminders.js
const { getDb } = require('./_lib/firebase-admin');
const { sendReminderEmail } = require('./_lib/reminder-email');

const SITE_URL = 'https://loftofbeauty.hu';

function pad2(n){ return n < 10 ? '0' + n : '' + n; }
function dateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }

function bookingDateTime(b) {
  var parts = String(b.date || '').split('-');
  var t = String(b.time || '00:00').split(':');
  if (parts.length !== 3) return null;
  return new Date(
    parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10),
    parseInt(t[0], 10) || 0, parseInt(t[1], 10) || 0, 0, 0
  );
}

var WINDOWS = [
  { key: 'r48', hours: 48, headline: 'Közelgő időpontod', needsConfirm: true,
    subject: function(b){ return 'Emlékeztető: ' + b.date + ' ' + b.time + ' — Loft of Beauty'; } },
  { key: 'r24', hours: 24, headline: 'Erősítsd meg az időpontod', needsConfirm: true,
    subject: function(b){ return 'Kérünk erősítsd meg: holnap ' + b.time + ' — Loft of Beauty'; } },
  { key: 'r3', hours: 3, headline: 'Hamarosan itt az időpontod', needsConfirm: false,
    subject: function(b){ return 'Ma ' + b.time + '-kor várunk — Loft of Beauty'; } },
  { key: 'r1', hours: 1, headline: 'Egy óra múlva várunk', needsConfirm: false,
    subject: function(b){ return 'Egy óra múlva ('+ b.time +') várunk — Loft of Beauty'; } }
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var expectedSecret = process.env.CRON_SECRET;
  var providedSecret = req.headers['x-cron-secret'];
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var db;
  try {
    db = getDb();
  } catch (err) {
    console.error('Firebase Admin nincs konfigurálva:', err);
    return res.status(500).json({ error: 'Firebase Admin nincs konfigurálva' });
  }

  var now = new Date();
  var todayKey = dateKey(now);
  var horizon = new Date(now.getTime() + 50 * 60 * 60 * 1000);
  var horizonKey = dateKey(horizon);

  var snap = await db.collection('bookings')
    .where('date', '>=', todayKey)
    .where('date', '<=', horizonKey)
    .get();

  var sent = { r48: 0, r24: 0, r3: 0, r1: 0 };
  var errors = [];

  for (var i = 0; i < snap.docs.length; i++) {
    var docSnap = snap.docs[i];
    var booking = docSnap.data();

    if (booking.status === 'cancelled') continue;

    var dt = bookingDateTime(booking);
    if (!dt) continue;
    var hoursUntil = (dt.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hoursUntil < 0) continue;

    var remindersSent = booking.remindersSent || {};

    for (var w = 0; w < WINDOWS.length; w++) {
      var win = WINDOWS[w];
      if (hoursUntil > win.hours) continue;
      if (remindersSent[win.key]) continue;
      if (win.needsConfirm && !booking.confirmToken) continue;
      if (win.needsConfirm && booking.status === 'confirmed') continue;

      var confirmUrl = win.needsConfirm
        ? SITE_URL + '/api/confirm-booking?id=' + encodeURIComponent(docSnap.id) + '&token=' + encodeURIComponent(booking.confirmToken)
        : null;

      try {
        await sendReminderEmail(booking, {
          headline: win.headline,
          subject: win.subject(booking),
          confirmUrl: confirmUrl
        });
        var update = {};
        update['remindersSent.' + win.key] = true;
        await docSnap.ref.update(update);
        sent[win.key]++;
      } catch (err) {
        console.error('Emlékeztető küldése sikertelen (' + docSnap.id + ', ' + win.key + '):', err);
        errors.push({ id: docSnap.id, window: win.key, error: String(err) });
      }
    }
  }

  return res.status(200).json({ ok: errors.length === 0, sent: sent, errors: errors });
};
```

- [ ] **Step 2: Helyi ellenőrzés hamis titokkal**

Run: `curl -i -X POST http://localhost:3000/api/send-reminders`
Expected: `HTTP/1.1 401`, `{"error":"Unauthorized"}`

- [ ] **Step 3: Helyi ellenőrzés helyes titokkal, teszt-foglalással**

Állíts be egy ideiglenes `.env.local`-ban egy `CRON_SECRET` értéket, majd hozz létre a Firestore-ban egy teszt-foglalást úgy, hogy `date`/`time` kb. 47 órával legyen a jelen időponttól (hogy az `r48` ablakba essen), `email` egy általad olvasható valódi címre mutasson, `confirmToken` legyen kitöltve, `remindersSent: {r48:false,r24:false,r3:false,r1:false}`.

Run: `curl -i -X POST http://localhost:3000/api/send-reminders -H "x-cron-secret: <a te CRON_SECRET értéked>"`
Expected: `HTTP/1.1 200`, a válaszban `"sent":{"r48":1,...}`, és megérkezik a teszt email a visszaigazoló linkkel. A Firestore dokumentumon `remindersSent.r48` mostantól `true`.

Futtasd újra ugyanazt a curl parancsot.
Expected: `"sent":{"r48":0,...}` — nem küldi ki duplán.

- [ ] **Step 4: Commit**

```bash
git add api/send-reminders.js
git commit -m "feat: óránkénti emlékeztető-küldő cron végpont"
```

---

### Task 6: Admin felület — visszaigazolás állapot jelzése (`admin.html`)

**Files:**
- Modify: `admin.html:224` (bookRows tábla fejléc)
- Modify: `admin.html:366-384` (renderTable — bookRows sorok)
- Modify: `admin.html:199` (allRows tábla fejléc)
- Modify: `admin.html:552-573` (renderStats — allRows sorok)

- [ ] **Step 1: Segédfüggvény a jelzéshez**

A `escapeHtml` függvény fölé (`admin.html:592` előtti sorba, a `</script>` előtti szekcióba, de mivel függvényeket hívunk előbb is, tedd a `pad2` mellé kb. `admin.html:291` után) illeszd be:

```js
    function confirmBadge(b){
      var dt = null;
      if(b.date && b.time){
        var dp = b.date.split('-'), tp = b.time.split(':');
        if(dp.length === 3) dt = new Date(+dp[0], +dp[1]-1, +dp[2], +(tp[0]||0), +(tp[1]||0));
      }
      if(!b.confirmToken){
        return '<span class="badge badge-muted" title="Ez a foglalás a visszaigazolás bevezetése előtt jött létre">—</span>';
      }
      if(b.status === 'confirmed'){
        return '<span class="badge badge-ok">✅ megerősítve</span>';
      }
      if(dt && (dt.getTime() - Date.now()) <= 24*60*60*1000){
        return '<span class="badge badge-warn">⚠️ nincs visszaigazolva</span>';
      }
      return '<span class="badge badge-pending">⏳ vár visszaigazolásra</span>';
    }
```

- [ ] **Step 2: Badge CSS hozzáadása**

Keresd meg a `<style>` blokkot az `admin.html` fejlécében, és a végéhez add hozzá:

```css
    .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;}
    .badge-ok{background:#E6F4EA;color:#1E7E34;}
    .badge-warn{background:#FDECEA;color:#C0392B;}
    .badge-pending{background:#FCE9ED;color:#A85C72;}
    .badge-muted{background:#F1F1F1;color:#999;}
```

- [ ] **Step 3: Oszlop hozzáadása a `bookRows` táblához**

A `admin.html:224` fejléc sora:

```html
                <tr><th>Dátum</th><th>Idő</th><th>Kezelés</th><th>Név</th><th>Telefon</th><th>Megjegyzés</th><th></th></tr>
```

cseréld erre:

```html
                <tr><th>Dátum</th><th>Idő</th><th>Kezelés</th><th>Név</th><th>Telefon</th><th>Megjegyzés</th><th>Visszaigazolás</th><th></th></tr>
```

A `renderTable()` függvényben (`admin.html:366-375`) a sor-építést:

```js
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(b.date || '') + '</td>' +
          '<td>' + escapeHtml(b.time || '') + '</td>' +
          '<td>' + escapeHtml(b.svc || '') + '</td>' +
          '<td class="name">' + escapeHtml(b.name || '') + '</td>' +
          '<td><a href="tel:' + escapeHtml(b.phone || '') + '">' + escapeHtml(b.phone || '') + '</a></td>' +
          '<td>' + escapeHtml(b.note || '—') + '</td>' +
          '<td></td>';
```

cseréld erre:

```js
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(b.date || '') + '</td>' +
          '<td>' + escapeHtml(b.time || '') + '</td>' +
          '<td>' + escapeHtml(b.svc || '') + '</td>' +
          '<td class="name">' + escapeHtml(b.name || '') + '</td>' +
          '<td><a href="tel:' + escapeHtml(b.phone || '') + '">' + escapeHtml(b.phone || '') + '</a></td>' +
          '<td>' + escapeHtml(b.note || '—') + '</td>' +
          '<td>' + confirmBadge(b) + '</td>' +
          '<td></td>';
```

- [ ] **Step 4: Oszlop hozzáadása az `allRows` (Összegzés → Összes foglalás) táblához**

A `admin.html:199` fejléc sora:

```html
              <thead><tr><th>Leadva</th><th>Dátum</th><th>Idő</th><th>Kezelés</th><th>Név</th><th>Telefon</th><th>Email</th><th>Megjegyzés</th></tr></thead>
```

cseréld erre:

```html
              <thead><tr><th>Leadva</th><th>Dátum</th><th>Idő</th><th>Kezelés</th><th>Név</th><th>Telefon</th><th>Email</th><th>Megjegyzés</th><th>Visszaigazolás</th></tr></thead>
```

A `renderStats()` függvényben (`admin.html:560-571`) a sor-építést:

```js
        allBookings.forEach(function(b){
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td class="muted">' + escapeHtml(fmtDateTime(createdDate(b))) + '</td>' +
            '<td>' + escapeHtml(b.date || '') + '</td>' +
            '<td>' + escapeHtml(b.time || '') + '</td>' +
            '<td>' + escapeHtml(b.svc || '') + '</td>' +
            '<td class="name">' + escapeHtml(b.name || '') + '</td>' +
            '<td><a href="tel:' + escapeHtml(b.phone || '') + '">' + escapeHtml(b.phone || '') + '</a></td>' +
            '<td>' + escapeHtml(b.email || '—') + '</td>' +
            '<td>' + escapeHtml(b.note || '—') + '</td>';
          aRows.appendChild(tr);
        });
```

cseréld erre:

```js
        allBookings.forEach(function(b){
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td class="muted">' + escapeHtml(fmtDateTime(createdDate(b))) + '</td>' +
            '<td>' + escapeHtml(b.date || '') + '</td>' +
            '<td>' + escapeHtml(b.time || '') + '</td>' +
            '<td>' + escapeHtml(b.svc || '') + '</td>' +
            '<td class="name">' + escapeHtml(b.name || '') + '</td>' +
            '<td><a href="tel:' + escapeHtml(b.phone || '') + '">' + escapeHtml(b.phone || '') + '</a></td>' +
            '<td>' + escapeHtml(b.email || '—') + '</td>' +
            '<td>' + escapeHtml(b.note || '—') + '</td>' +
            '<td>' + confirmBadge(b) + '</td>';
          aRows.appendChild(tr);
        });
```

- [ ] **Step 5: Kézi ellenőrzés böngészőben**

Nyisd meg az `admin.html`-t, jelentkezz be, és ellenőrizd mindkét nézetben (Naptár nézet és Összegzés → Összes foglalás):
- egy `status:"confirmed"` teszt-foglalás ✅ megerősítve jelzést kap
- egy `confirmToken`-nel rendelkező, 24 órán belüli, nem megerősített foglalás ⚠️ jelzést kap
- egy `confirmToken`-nel rendelkező, 24 óránál távolabbi, nem megerősített foglalás ⏳ jelzést kap
- egy régi (confirmToken nélküli) foglalás — jelzést kap

Expected: mind a négy eset a fentiek szerint jelenik meg, a táblázat elrendezése nem törik el.

- [ ] **Step 6: Commit**

```bash
git add admin.html
git commit -m "feat: visszaigazolás állapotának jelzése az admin felületen"
```

---

### Task 7: Éles beállítás (nem kód — checklista)

**Files:** nincs (Vercel/Firebase/cron-job.org konfiguráció)

- [ ] **Step 1: Firebase service account létrehozása**

Firebase Console → `loftofbeauty-2bd70` projekt → Project Settings → Service Accounts fül → "Generate new private key". A letöltött JSON fájl teljes tartalmát (egy sorban, escapelt formában) másold a Vercel projekt Settings → Environment Variables közé, névvel: `FIREBASE_SERVICE_ACCOUNT`. Alkalmazd Production és Preview környezetre is.

- [ ] **Step 2: Cron titok generálása**

Run: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`

A kapott stringet vedd fel Vercel env variable-ként `CRON_SECRET` néven (Production + Preview).

- [ ] **Step 3: Deploy Vercelre**

```bash
git push
```

Ellenőrizd a Vercel dashboardon, hogy a deploy sikeres, és az új env variable-ök (`FIREBASE_SERVICE_ACCOUNT`, `CRON_SECRET`) élesben is be vannak állítva (ha korábban csak lokálisan adtad meg őket, itt is fel kell venni).

- [ ] **Step 4: cron-job.org beállítása**

Regisztrálj egy ingyenes fiókot a https://cron-job.org oldalon. Hozz létre egy új cron jobot:
- URL: `https://loftofbeauty.hu/api/send-reminders`
- Ütemezés: óránként (every hour)
- HTTP metódus: POST
- Egyedi header: `x-cron-secret: <a Task 7 Step 2-ben generált érték>`

- [ ] **Step 5: Éles ellenőrzés**

A cron-job.org felületén futtasd le manuálisan egyszer a jobot ("Run now" / teszt-végrehajtás gomb), és ellenőrizd a válasz kódját (200) és a Vercel function logokat (Vercel dashboard → Deployments → Functions → `send-reminders` logs).
Expected: `200`-as válasz, a logban nincs hibaüzenet, `sent` objektum megjelenik a válaszban.

- [ ] **Step 6: Dokumentálás a specben**

A `docs/superpowers/specs/2026-08-23-no-show-reminders-design.md` "Új beállítási lépések" szekciója alá írd be a tényleges cron-job.org job azonosítóját/nevét, hogy később visszakereshető legyen. Commitold.

```bash
git add docs/superpowers/specs/2026-08-23-no-show-reminders-design.md
git commit -m "docs: cron-job.org beállítás rögzítve a specben"
```

---

## Self-review megjegyzések

- **Spec lefedettség:** 1. adatmodell → Task 2; 2. emlékeztető-ütemezés → Task 5 (WINDOWS tömb, hoursUntil logika); 3. visszaigazoló link+biztonság → Task 4; 4. cron → Task 5 + Task 7; 5. admin felület → Task 6; 6. beállítási lépések → Task 7. Mind lefedve.
- **Ágotának nincs plusz email:** a Task 5 `send-reminders` végpont kizárólag a vendég (`booking.email`) címére küld — ez szándékos, a spec explicit döntése alapján.
- **Régi foglalások (confirmToken nélkül):** a Task 5 `needsConfirm` ág kihagyja a 48h/24h emailt, ha nincs `confirmToken`; a 3h/1h emlékeztető ezekre is megy, mert az nem függ a visszaigazolástól.
