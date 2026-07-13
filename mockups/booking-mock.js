// DEMO / MOCKUP SCRIPT — nem ír adatbázisba, csak vizuálisan demonstrálja a foglalás menetét.
(function(){
  var HU_MONTHS = ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
  var today = new Date(); today.setHours(0,0,0,0);
  var viewYear = today.getFullYear(), viewMonth = today.getMonth();
  var selectedDate = null, selectedSlot = null, selectedSvc = null;
  var ALL_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  var FAKE_TAKEN = ['11:00','15:00']; // csak demóhoz, hogy lássuk a "foglalt" állapotot is

  function renderCal(){
    var monthEl = document.getElementById('calMonth');
    if(!monthEl) return;
    monthEl.textContent = HU_MONTHS[viewMonth] + ' ' + viewYear;
    var first = new Date(viewYear, viewMonth, 1);
    var startCol = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var wrap = document.getElementById('calDays');
    wrap.innerHTML = '';
    for(var i=0;i<startCol;i++){
      var pad = document.createElement('div'); pad.className = 'day pad'; wrap.appendChild(pad);
    }
    for(var d=1; d<=daysInMonth; d++){
      var cell = document.createElement('div');
      var thisDate = new Date(viewYear, viewMonth, d);
      cell.className = 'day';
      cell.textContent = d;
      if(thisDate < today){ cell.classList.add('off'); }
      else{
        cell.addEventListener('click', (function(dt, el){
          return function(){
            document.querySelectorAll('.day.sel').forEach(function(x){x.classList.remove('sel')});
            el.classList.add('sel');
            selectedDate = dt;
            selectedSlot = null;
            document.querySelectorAll('.slot.sel').forEach(function(s){s.classList.remove('sel')});
            renderSlotsTaken();
            updateSummary();
            var dateLabel = document.getElementById('dateLabel');
            if(dateLabel) dateLabel.textContent = dt.toLocaleDateString('hu-HU');
            var step3 = document.getElementById('step3');
            if(step3) step3.classList.add('active');
          };
        })(thisDate, cell));
      }
      if(thisDate.getTime() === today.getTime()) cell.classList.add('today');
      if(selectedDate && thisDate.getTime() === selectedDate.getTime()) cell.classList.add('sel');
      wrap.appendChild(cell);
    }
    var prevBtn = document.getElementById('calPrev');
    if(prevBtn) prevBtn.disabled = (viewYear === today.getFullYear() && viewMonth === today.getMonth());
  }

  function renderSlotsTaken(){
    document.querySelectorAll('.slot').forEach(function(el){
      el.classList.toggle('taken', FAKE_TAKEN.indexOf(el.textContent) !== -1);
    });
  }

  function bindCalNav(){
    var prevBtn = document.getElementById('calPrev');
    var nextBtn = document.getElementById('calNext');
    if(prevBtn) prevBtn.addEventListener('click', function(){
      viewMonth--; if(viewMonth < 0){ viewMonth = 11; viewYear--; }
      renderCal();
    });
    if(nextBtn) nextBtn.addEventListener('click', function(){
      viewMonth++; if(viewMonth > 11){ viewMonth = 0; viewYear++; }
      renderCal();
    });
  }

  function bindSvc(){
    document.querySelectorAll('.svc-card').forEach(function(card){
      card.addEventListener('click', function(){
        document.querySelectorAll('.svc-card').forEach(function(c){c.classList.remove('sel')});
        card.classList.add('sel');
        selectedSvc = card.dataset.svc || card.querySelector('.t').textContent;
        updateSummary();
        var step2 = document.getElementById('step2');
        if(step2) step2.classList.add('active');
      });
    });
  }

  function bindSlots(){
    document.querySelectorAll('.slot').forEach(function(slot){
      slot.addEventListener('click', function(){
        if(slot.classList.contains('taken')) return;
        document.querySelectorAll('.slot.sel').forEach(function(s){s.classList.remove('sel')});
        slot.classList.add('sel');
        selectedSlot = slot.textContent;
        updateSummary();
        var step4 = document.getElementById('step4');
        if(step4) step4.classList.add('active');
      });
    });
  }

  function updateSummary(){
    var txt = document.getElementById('summaryText');
    var box = document.getElementById('summary');
    var parts = [];
    if(selectedSvc) parts.push(selectedSvc);
    if(selectedDate) parts.push(selectedDate.toLocaleDateString('hu-HU'));
    if(selectedSlot) parts.push(selectedSlot);
    if(txt) txt.textContent = parts.join(' · ');
    if(box) box.classList.toggle('show', parts.length > 0);
    var btn = document.getElementById('submitBtn');
    if(btn) btn.disabled = !(selectedSvc && selectedDate && selectedSlot);
  }

  function bindSubmit(){
    var form = document.getElementById('heroBookForm');
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = (document.getElementById('f-name') || {}).value || 'Kedves Vendég';
      var okName = document.getElementById('okName');
      var okDetails = document.getElementById('okDetails');
      if(okName) okName.textContent = name;
      if(okDetails) okDetails.textContent = selectedSvc + ' · ' + selectedDate.toLocaleDateString('hu-HU') + ' · ' + selectedSlot;
      form.style.display = 'none';
      var success = document.getElementById('bookSuccess');
      if(success) success.classList.add('show');
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderCal();
    renderSlotsTaken();
    bindCalNav();
    bindSvc();
    bindSlots();
    bindSubmit();
  });
})();
