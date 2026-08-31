// ============================================================================
// COOKIE / MARKETING-HOZZÁJÁRULÁS KEZELŐ
// ============================================================================
// A Meta Pixel (Facebook/Instagram hirdetéskövetés) NEM elengedhetetlenül
// szükséges süti/technológia, ezért csak a látogató kifejezett hozzájárulása
// UTÁN töltődhet be. Ez a szkript:
//   1) megjelenít egy egyszerű sáv-bannert, ha a látogató még nem döntött,
//   2) csak "Elfogadom" kattintásra tölti be ténylegesen a Meta Pixelt,
//   3) a döntést localStorage-ban jegyzi meg (nem kérdez rá minden oldalon),
//   4) biztosítja a window.fbTrack() dedupe-oló segédfüggvényt minden oldalon
//      (a form-oldalak ezt hívják Lead/Schedule/InitiateCheckout eseményekhez
//      — ez a hívás automatikusan néma marad, ha nincs hozzájárulás, mert a
//      Pixel ilyenkor nincs betöltve).
//
// Használat: minden oldal <head>-jében a korábbi, közvetlenül futó
// "Meta Pixel Code" <script> blokk helyett csak ennyi kell:
//   <script src="assets/consent.js"></script>
// ============================================================================
(function(){
  var PIXEL_ID = '1361354709500714';
  var STORAGE_KEY = 'lb_cookie_consent'; // 'accepted' | 'rejected'

  // ---- fbTrack: biztonságos, dedupe-olt esemény-küldés (mindig elérhető,
  // de csak akkor csinál bármit is, ha a Pixel már be van töltve) ----
  window.__fbFired = window.__fbFired || {};
  window.fbTrack = window.fbTrack || function(name, params){
    try{
      if(window.__fbFired[name]) return;
      window.__fbFired[name] = true;
      if(typeof fbq === 'function') fbq('track', name, params || {});
    }catch(e){}
  };

  function loadMetaPixel(){
    if(window.fbq) return; // már be van töltve
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
  }

  function getConsent(){
    try{ return localStorage.getItem(STORAGE_KEY); }catch(e){ return null; }
  }
  function setConsent(v){
    try{ localStorage.setItem(STORAGE_KEY, v); }catch(e){}
  }

  function injectStyles(){
    if(document.getElementById('ccStyles')) return;
    var css =
      '#cookieConsent{position:fixed;left:0;right:0;bottom:0;z-index:9999;'+
      'background:rgba(255,255,255,.98);backdrop-filter:blur(10px);'+
      '-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(224,62,99,.18);'+
      'box-shadow:0 -10px 30px -12px rgba(122,26,52,.25);'+
      'padding:1rem 1.4rem;font-family:\'Nunito Sans\',sans-serif}'+
      '#cookieConsent .cc-inner{max-width:1080px;margin:0 auto;display:flex;'+
      'align-items:center;justify-content:space-between;gap:1.4rem;flex-wrap:wrap}'+
      '#cookieConsent p{margin:0;font-size:.84rem;line-height:1.6;color:#3A0E1C;flex:1;min-width:240px}'+
      '#cookieConsent a{color:#E03E63;text-decoration:underline}'+
      '#cookieConsent .cc-actions{display:flex;gap:.6rem;flex-wrap:wrap}'+
      '#cookieConsent button{font-family:\'Nunito Sans\',sans-serif;font-size:.78rem;'+
      'font-weight:700;letter-spacing:.02em;padding:.7rem 1.3rem;border-radius:999px;'+
      'cursor:pointer;white-space:nowrap;transition:.2s}'+
      '#cookieConsent .cc-accept{background:#E03E63;color:#fff;border:none}'+
      '#cookieConsent .cc-accept:hover{background:#7A1A34}'+
      '#cookieConsent .cc-reject{background:none;color:#A85C72;border:1px solid rgba(224,62,99,.35)}'+
      '#cookieConsent .cc-reject:hover{border-color:#E03E63;color:#E03E63}'+
      '@media(max-width:600px){#cookieConsent .cc-actions{width:100%}'+
      '#cookieConsent .cc-actions button{flex:1}}';
    var style = document.createElement('style');
    style.id = 'ccStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBanner(){
    injectStyles();
    var bar = document.createElement('div');
    bar.id = 'cookieConsent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Süti-hozzájárulás');
    bar.innerHTML =
      '<div class="cc-inner">' +
        '<p>A weboldal a Meta (Facebook/Instagram) hirdetéskövető kódját (Meta Pixel) csak a hozzájárulásoddal használja, a hirdetéseink teljesítményének méréséhez. ' +
        '<a href="adatvedelem.html">Adatkezelési tájékoztató</a></p>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-reject">Elutasítom</button>' +
          '<button type="button" class="cc-accept">Elfogadom</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.cc-accept').addEventListener('click', function(){
      setConsent('accepted');
      loadMetaPixel();
      bar.remove();
    });
    bar.querySelector('.cc-reject').addEventListener('click', function(){
      setConsent('rejected');
      bar.remove();
    });
  }

  function init(){
    var consent = getConsent();
    if(consent === 'accepted'){
      loadMetaPixel();
    }else if(consent !== 'rejected'){
      showBanner();
    }
    // 'rejected' esetén szándékosan nem történik semmi — a Pixel nem töltődik be.
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
