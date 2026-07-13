// Mobil menü nyitás/zárás
document.addEventListener('DOMContentLoaded', function(){
  var burger = document.querySelector('.burger');
  var mm = document.getElementById('mm');
  if(burger && mm){
    burger.addEventListener('click', function(){ mm.classList.add('open'); });
    mm.querySelectorAll('a, .mclose').forEach(function(el){
      el.addEventListener('click', function(){ mm.classList.remove('open'); });
    });
  }

  // Lágy megjelenés görgetésre
  var els = document.querySelectorAll('.reveal');
  if(els.length){
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in')}); }
    else{
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.15 });
      els.forEach(function(e){ io.observe(e); });
    }
  }

  // Előtte-utána csúszka (ahol van)
  document.querySelectorAll('.ba, .ba-single').forEach(function(box){
    var afterWrap = box.querySelector('.after-wrap');
    var handle = box.querySelector('.handle');
    var dragging = false;
    function setPos(clientX){
      var rect = box.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      afterWrap.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
    }
    box.addEventListener('mousedown', function(e){ dragging = true; setPos(e.clientX); });
    window.addEventListener('mousemove', function(e){ if(dragging) setPos(e.clientX); });
    window.addEventListener('mouseup', function(){ dragging = false; });
    box.addEventListener('touchstart', function(e){ dragging = true; setPos(e.touches[0].clientX); }, {passive:true});
    box.addEventListener('touchmove', function(e){ if(dragging) setPos(e.touches[0].clientX); }, {passive:true});
    box.addEventListener('touchend', function(){ dragging = false; });
  });

  // ===== Süti-sáv + Google Térkép zárolás elfogadásig =====
  var COOKIE_KEY = 'lob_cookie_consent'; // 'accepted' | 'declined'

  function loadMaps(){
    document.querySelectorAll('.gdpr-map').forEach(function(box){
      var iframe = box.querySelector('iframe[data-src]');
      if(iframe && !iframe.src){
        iframe.src = iframe.getAttribute('data-src');
        box.classList.add('loaded');
      }
    });
  }

  var consent = null;
  try { consent = localStorage.getItem(COOKIE_KEY); } catch(e){}

  if(consent === 'accepted'){
    loadMaps();
  } else if(consent !== 'declined'){
    var bar = document.createElement('div');
    bar.id = 'cookieBar';
    bar.innerHTML =
      '<p>A weboldal a Google Térkép megjelenítéséhez és a betűtípusok betöltéséhez a Google szolgáltatásait használja, amik sütiket helyezhetnek el. Bővebben az <a href="adatvedelem.html">Adatkezelési tájékoztatóban</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="cookie-decline">Elutasítom</button>' +
      '<button type="button" class="cookie-accept">Elfogadom</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.cookie-accept').addEventListener('click', function(){
      try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch(e){}
      loadMaps();
      bar.remove();
    });
    bar.querySelector('.cookie-decline').addEventListener('click', function(){
      try { localStorage.setItem(COOKIE_KEY, 'declined'); } catch(e){}
      bar.remove();
    });
  }

  // Manuális "Térkép megjelenítése" gomb (elutasítás után is elérhető marad)
  document.querySelectorAll('.gdpr-map-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch(e){}
      loadMaps();
      var existingBar = document.getElementById('cookieBar');
      if(existingBar) existingBar.remove();
    });
  });
});
