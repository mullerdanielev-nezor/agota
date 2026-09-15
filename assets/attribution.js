// ============================================================================
// HIRDETÉSI FORRÁS (UTM / fbclid) A FOGLALÁSOKHOZ
// ============================================================================
// A hirdetés linkjében érkező paramétereket (utm_source, utm_campaign stb.,
// illetve a Facebook által automatikusan hozzáfűzött fbclid-et) a foglalás
// mellé mentjük, így az admin felületen minden foglalásnál látszik, honnan
// jött — akkor is, ha a látogató elutasította a sütiket.
//
// Semmit NEM tárol a böngészőben (se süti, se localStorage): a paraméterek
// az URL-ben utaznak tovább. Ehhez az oldalon belüli linkekhez hozzáfűzzük
// őket, a JS-es átirányításoknál pedig a lbAttribution.link() segít.
// Tartalékként ugyanarról a domainről érkező előző oldal címét (referrer)
// is megnézzük.
//
// Használat:
//   lbAttribution.get()        → { utm_source, utm_medium, utm_campaign,
//                                  utm_content, utm_term, fbclid: true/false }
//   lbAttribution.link('x.html') → a link, a paraméterekkel kiegészítve
// ============================================================================
(function(){
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];

  function pick(search){
    var out = {};
    try{
      var p = new URLSearchParams(search || '');
      KEYS.forEach(function(k){
        var v = p.get(k);
        if(v) out[k] = v.trim().slice(0, 150);
      });
    }catch(e){}
    return out;
  }

  function fromReferrer(){
    try{
      var r = new URL(document.referrer);
      if(r.origin === location.origin) return pick(r.search);
    }catch(e){}
    return {};
  }

  var attr = pick(location.search);
  if(!Object.keys(attr).length) attr = fromReferrer();

  function get(){
    return {
      utm_source: attr.utm_source || null,
      utm_medium: attr.utm_medium || null,
      utm_campaign: attr.utm_campaign || null,
      utm_content: attr.utm_content || null,
      utm_term: attr.utm_term || null,
      fbclid: !!attr.fbclid
    };
  }

  function link(href){
    if(!Object.keys(attr).length) return href;
    try{
      var u = new URL(href, location.href);
      if(u.origin !== location.origin) return href;
      KEYS.forEach(function(k){
        if(attr[k] && !u.searchParams.has(k)) u.searchParams.set(k, attr[k]);
      });
      return u.pathname + u.search + u.hash;
    }catch(e){
      return href;
    }
  }

  function decorateLinks(){
    if(!Object.keys(attr).length) return;
    document.querySelectorAll('a[href]').forEach(function(a){
      var h = a.getAttribute('href');
      if(!h || h.charAt(0) === '#' || /^(tel|mailto|sms|javascript):/i.test(h)) return;
      var n = link(h);
      if(n !== h) a.setAttribute('href', n);
    });
  }

  window.lbAttribution = { get: get, link: link };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', decorateLinks);
  }else{
    decorateLinks();
  }
})();
