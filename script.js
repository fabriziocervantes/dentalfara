(function () {
  'use strict';

  var PHONE = '526566349717';
  var NARROW = window.matchMedia('(max-width: 759px)');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wa(text) {
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
  }

  // WhatsApp links with the pre-written message
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = wa('Hola, me gustaría agendar una cita en Fara Dental.');
  });
  document.querySelectorAll('[data-wa-topic]').forEach(function (a) {
    a.href = wa('Hola, me gustaría información sobre ' + a.getAttribute('data-wa-topic') + ' en Fara Dental.');
  });

  // ---- Live opening hours (Ciudad Juárez time) ----
  var DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  function juarezNow() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Ciudad_Juarez', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
    var day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    var mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    return { day: day < 0 ? 0 : day, mins: mins };
  }

  var daysEl = document.querySelector('[data-days]');
  var dotEl = document.querySelector('[data-live-dot]');
  var headerStatusEl = document.querySelector('[data-header-status]');

  function renderStatus() {
    var now = juarezNow();
    var weekend = now.day >= 5;
    var close = weekend ? 17 * 60 : 19 * 60;
    var open = now.mins >= 540 && now.mins < close;
    var closeTxt = weekend ? '5 p.m.' : '7 p.m.';
    var statusLine = open ? 'Abierto · Cierra a las ' + closeTxt
      : now.mins < 540 ? 'Cerrado · Abre hoy a las 9 a.m.' : 'Cerrado · Abre mañana a las 9 a.m.';

    dotEl.classList.toggle('is-open', open);
    headerStatusEl.textContent = NARROW.matches
      ? (open ? 'Abierto' : 'Cerrado')
      : (open ? 'Abierto ahora · hasta ' + closeTxt : statusLine);

    daysEl.innerHTML = DAY_NAMES.map(function (name, i) {
      var hours = i >= 5 ? '9 a.m. – 5 p.m.' : '9 a.m. – 7 p.m.';
      if (i === now.day) {
        return '<div class="day is-today" aria-current="date">' +
          '<div class="day-name">HOY · ' + name + '</div>' +
          '<div class="day-status">' + statusLine + '</div>' +
          '<div class="day-hours">' + hours + '</div></div>';
      }
      return '<div class="day"><div class="day-name">' + name + '</div><div class="day-hours">' + hours + '</div></div>';
    }).join('');
  }

  renderStatus();
  // On narrow screens the strip scrolls horizontally: bring today's card into view
  var todayEl = daysEl.querySelector('.is-today');
  if (todayEl && daysEl.scrollWidth > daysEl.clientWidth) {
    daysEl.scrollLeft = todayEl.offsetLeft - daysEl.offsetLeft;
  }
  setInterval(renderStatus, 30000);
  NARROW.addEventListener ? NARROW.addEventListener('change', renderStatus) : NARROW.addListener(renderStatus);

  // ---- Treatments accordion (one open at a time) ----
  var toggles = document.querySelectorAll('.t-toggle');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      toggles.forEach(function (other) {
        other.setAttribute('aria-expanded', 'false');
        document.getElementById(other.getAttribute('aria-controls')).hidden = true;
      });
      if (willOpen) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
      }
    });
  });

  // ---- "La línea que te acompaña": stroke drawing + reveals ----
  if (REDUCED) return;

  document.querySelectorAll('[data-draw]').forEach(function (el) {
    if (el.tagName.toLowerCase() === 'path') {
      el.style.strokeDasharray = '1';
      el.style.strokeDashoffset = '1';
    } else {
      el.style.transformOrigin = 'top';
      el.style.transform = 'scaleY(0)';
    }
  });

  var hero = document.querySelector('[data-draw="load"]');
  if (hero) {
    setTimeout(function () {
      hero.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(.55,0,.2,1)';
      hero.style.strokeDashoffset = '0';
    }, 250);
  }

  var scrollLines = document.querySelectorAll('[data-draw="scroll"]');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;
    scrollLines.forEach(function (el) {
      var box = (el.closest('[data-draw-box]') || el).getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.85 - box.top) / (box.height * 0.8 + 1)));
      if (el.tagName.toLowerCase() === 'path') el.style.strokeDashoffset = String(1 - p);
      else el.style.transform = 'scaleY(' + p + ')';
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity .9s ease, transform .9s ease';
    io.observe(el);
  });
})();
