/* Isaac Young — site script. No trackers, no external requests. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Pixel LED meter + scope waveform (recreates signature concept A) ---- */
  var cv = document.getElementById('meter');
  var ctx = cv && cv.getContext && cv.getContext('2d');
  if (!ctx) { doc.classList.add('no-canvas'); }
  else {
    var W = 100, H = 18, CELL = 8, DOT = 6, NB = 14, N = 32;
    var C = { green: '#0aa37f', greenHi: '#19d39f', amber: '#f0a500', red: '#e63946', cyan: '#0f8fbf', cyanHi: '#22c3f0', off: 'rgba(255,255,255,0.045)' };
    var peaks = new Array(NB).fill(0), peakHold = new Array(NB).fill(0);

    function level(b, t) {
      var p = 2 * Math.PI * t / N;
      var v = 0.55 + 0.25 * Math.sin(p * 2 + b * 0.9) + 0.18 * Math.sin(p * 4 + b * 2.3) + 0.1 * Math.sin(p * 6 + b * b * 0.37);
      v *= 1 - 0.35 * (b / NB);
      return Math.max(0.05, Math.min(1, v));
    }
    function px(x, y, c) {
      var o = (CELL - DOT) / 2;
      ctx.fillStyle = c;
      ctx.fillRect(x * CELL + o, y * CELL + o, DOT, DOT);
    }
    function draw(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.shadowBlur = 0;
      // unlit LED grid behind the bars (HD hardware look)
      for (var b = 0; b < NB; b++) for (var yy = 0; yy < 16; yy++) for (var dx = 0; dx < 2; dx++) px(b * 3 + dx, H - 1 - yy, C.off);
      for (b = 0; b < NB; b++) {
        var lv = Math.round(level(b, t) * 16);
        if (lv >= peaks[b]) { peaks[b] = lv; peakHold[b] = 4; }
        else if (peakHold[b] > 0) peakHold[b] -= 0.5;
        else peaks[b] = Math.max(lv, peaks[b] - 0.5);
        for (yy = 0; yy < lv; yy++) {
          var c = yy < 9 ? C.green : (yy < 13 ? C.amber : C.red);
          ctx.shadowColor = c; ctx.shadowBlur = 6;
          for (dx = 0; dx < 2; dx++) px(b * 3 + dx, H - 1 - yy, c);
        }
        var pk = Math.round(peaks[b]);
        if (pk > lv) { ctx.shadowColor = C.cyanHi; ctx.shadowBlur = 8; for (dx = 0; dx < 2; dx++) px(b * 3 + dx, H - 1 - pk, C.cyanHi); }
      }
      // scope waveform
      ctx.shadowColor = C.cyanHi; ctx.shadowBlur = 8;
      var x0 = 44, prev = null;
      for (var x = x0; x < W; x++) {
        var k = x - x0, env = Math.sin(Math.PI * k / (W - x0 - 1));
        var y = Math.round(8.5 + 7.5 * env * (0.65 * Math.sin(2 * Math.PI * (k / 18 - t / N)) + 0.35 * Math.sin(2 * Math.PI * (k / 7 - 2 * t / N))));
        if (prev === null) prev = y;
        var lo = Math.min(prev, y), hi = Math.max(prev, y);
        if (hi - lo > 1) { if (y > prev) lo++; else hi--; }
        for (var q = lo; q <= hi; q++) px(x, q, C.cyanHi);
        prev = y;
      }
      ctx.shadowBlur = 0;
    }

    if (reduce) { draw(6); }
    else {
      var t = 0, last = 0, running = true;
      var loop = function (ts) {
        if (running && ts - last > 70) { last = ts; draw(t); t = (t + 0.5) % N; }
        requestAnimationFrame(loop);
      };
      // pause when hero is off-screen (saves battery)
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { running = e[0].isIntersecting; }).observe(cv);
      }
      requestAnimationFrame(loop);
    }
  }

  /* ---- Reveal-on-scroll ---- */
  var els = document.querySelectorAll('.section h2, .pillars li, .card, .cert, .skill-groups > div, .about-portrait, .edu');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }
})();
