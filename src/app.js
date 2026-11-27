(function () {
  var R = window.React, useState = R.useState, useEffect = R.useEffect, useRef = R.useRef;
  var html = window.htm.bind(R.createElement);
  var D = window.Daju;
  var PHOTO = 'blue-sea-salt.jpg';
  var PHOTO_ALT = 'The real Matcha Blue Sea Salt: a clear cup of matcha topped with blue sea-salt foam and ice, DA JU hand-lettered in black marker, decorated with colourful butterfly charms';

  /* ---------- Menu (prices stay placeholders until the menu is final) ---------- */
  var MENU = [
    { id: 'bss', cat: 'Matcha', name: 'Matcha Blue Sea Salt', flavor: 'Blue Sea Salt', note: 'Creamy matcha meets a hint of sea salt.', price: null, status: 'weekly', image: PHOTO,
      imageAlt: 'Matcha Blue Sea Salt in a clear cup with blue sea-salt foam, DA JU in marker and butterfly charms', tilt: -2 },
    { id: 'latte', cat: 'Matcha', name: 'Matcha Latte', flavor: 'Latte', note: 'Earthy matcha, creamy comfort. Simple, smooth, soul-soothing.', price: null, status: 'available', image: 'matcha-latte.jpg',
      imageAlt: 'Matcha Latte: bright green matcha swirling down into cold milk and ice, DA JU printed on the cup', tilt: 1 },
    { id: 'strawberry', cat: 'Matcha', name: 'Matcha Strawberry', flavor: 'Strawberry', note: 'Sweet strawberry, fruity and refreshing, under a layer of matcha.', price: null, status: 'available', image: 'matcha-strawberry.jpg',
      imageAlt: 'Matcha Strawberry: green matcha on top of pink strawberry milk with a red strawberry layer at the bottom', tilt: -1 },
    { id: 'coconut', cat: 'Matcha', name: 'Matcha Coconut', flavor: 'Coconut', note: 'Refreshing coconut, smooth matcha, perfect balance. Light and creamy.', price: null, status: 'available', image: 'matcha-coconut.jpg',
      imageAlt: 'Matcha Coconut: a layer of deep green matcha floating over clear coconut water and ice', tilt: 2 },
    { id: 'coffee-salt', cat: 'Coffee', name: 'Coffee Sea Salt', flavor: 'Sea Salt', note: 'Iced coffee under a thick salted cream cap, dusted with cinnamon.', price: null, status: 'available', image: 'coffee-sea-salt.jpg',
      imageAlt: 'Coffee Sea Salt: iced coffee topped with a thick sea-salt cream and a dusting of cinnamon, DA JU written in marker', tilt: -1 },
    { id: 'coffee-latte', cat: 'Coffee', name: 'Coffee Latte', flavor: 'Latte', note: 'Smooth coffee and cold milk over ice. An easy everyday cup.', price: null, status: 'available', tilt: 1 }
  ];
  /* Social links: paste the real profile URLs here when they're ready (until then the footer shows plain text, not a dead link) */
  var SOCIAL = { instagram: { url: '', handle: '[@handle]' }, tiktok: { url: '', handle: '[@handle]' } };
  var MAX_CUPS = 10;   /* "Up to 10 per order" */
  var CATS = ['Matcha', 'Coffee'];
  var WEEKLY = MENU.filter(function (m) { return m.status === 'weekly'; })[0] || MENU[0];
  function drinkById(id) { return MENU.filter(function (m) { return m.id === id; })[0] || WEEKLY; }
  /* the illustrated cup is recoloured per drink (see .cup-* in page.css) */
  function cupClass(id) { return 'cup-' + (id || WEEKLY.id); }
  function DrinkThumb(p) {
    var m = p.drink;
    return html`<${D.CupPreview} width=${p.size || 40} name="" charm="none" className=${cupClass(m.id)} alt="" />`;
  }
  var FLAIR = { butterfly: 'Butterfly Charms', ribbon: 'Ribbon', both: 'Butterfly Charms + Ribbon', none: 'None' };
  var FLAIR_OPTS = [{ value: 'butterfly', label: 'Butterfly charms', icon: 'butterfly' }, { value: 'ribbon', label: 'Ribbon', icon: 'bow' }, { value: 'both', label: 'Both', icon: 'sparkle' }];
  var TWO = ['Normal', 'Less'];
  var DAY_OPTS = [{ value: 'weekday', label: 'Weekdays' }, { value: 'weekend', label: 'Weekend' }];
  var MODE_OPTS = [{ value: 'PICK_UP', label: 'Pick Up', icon: 'bag' }, { value: 'GRAB_EXPRESS', label: 'Grab Express', icon: 'scooter' }, { value: 'COD', label: 'COD', icon: 'car' }];
  var GRAB_WEEKEND = ['9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '1:00 PM – 3:00 PM', '3:00 PM – 4:00 PM'];
  var MODE_NAME = { PICK_UP: 'Pick Up', GRAB_EXPRESS: 'Grab Express', COD: 'COD' };

  function priceText(p) { return p == null ? '[RM price]' : 'RM ' + p.toFixed(2); }
  function subtotalText(items) {
    if (!items.length) return 'RM 0.00';
    var sum = 0; for (var i = 0; i < items.length; i++) { if (items[i].price == null) return '[RM subtotal]'; sum += items[i].price; }
    return 'RM ' + sum.toFixed(2);
  }

  /* ---------- Malaysia time (UTC+8) ---------- */
  /* KK has no daylight saving: the time there is always UTC+8. myt() returns a Date shifted by 8 hours that is read
     with the UTC getters below, so the visitor's own time zone (and its DST changes) never leaks in. */
  function myt() { return new Date(Date.now() + 8 * 3600000); }
  function mins(d) { return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function dow(d) { return d.getUTCDay(); }
  function isWeekend(d) { var g = dow(d); return g === 0 || g === 6; }
  function clock(d) { var h = d.getUTCHours(), m = d.getUTCMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM'); }
  /* Order cut-offs (minutes after midnight, KK time) */
  var LUNCH_CUTOFF = 750;     /* weekday Centre Point / Grab pre-orders close when pickup starts, 12:30 PM */
  var WEEKEND_GRAB_END = 960; /* weekend Grab Express dispatch ends 4:00 PM */
  /* Each visitor gets their own reference (DJ-MMDD-XXXX); the 4-character code is random, without look-alike letters */
  function refCode() {
    var A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', out = '', r = null;
    try { r = new Uint32Array(4); window.crypto.getRandomValues(r); } catch (e) { r = null; }
    for (var i = 0; i < 4; i++) out += A[(r ? r[i] : Math.floor(Math.random() * 1e9)) % A.length];
    return out;
  }
  function orderRef(d, code) { var mm = d.getUTCMonth() + 1, dd = d.getUTCDate(); return 'DJ-' + (mm < 10 ? '0' : '') + mm + (dd < 10 ? '0' : '') + dd + '-' + code; }
  /* #38: the bag and form survive a reload or an app switch, on this device only (sessionStorage, never sent anywhere) */
  var SAVE_KEY = 'daju-order-v1';
  function loadSaved() { try { var x = JSON.parse(window.sessionStorage.getItem(SAVE_KEY) || 'null'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } }
  function storeSaved(o) { try { window.sessionStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} }
  /* #41: Malaysian mobile (01x…, 601x…, +601x…), or any other international number written with + and a country code */
  function phoneOk(raw) {
    var t = String(raw || '').trim(), d = t.replace(/\D/g, '');
    if (/^(?:60|0)1\d{8,9}$/.test(d)) return true;
    return /^\+/.test(t) && !/^60/.test(d) && d.length >= 8 && d.length <= 15;
  }

  function useMedia(q) {
    var get = function () { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
    var s = useState(get), v = s[0], set = s[1];
    useEffect(function () {
      var mq; try { mq = window.matchMedia(q); } catch (e) { return; }
      var on = function () { set(mq.matches); }; on();
      if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
      return function () { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
    }, [q]);
    return v;
  }

  /* Arrow keys / Home / End move between tabs or radio buttons and focus the new one (roving tabindex) */
  function tabKeys(e, cur, n, pick, sel) {
    var k = e.key, i = cur;
    if (k === 'ArrowRight' || k === 'ArrowDown') i = (cur + 1) % n;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') i = (cur - 1 + n) % n;
    else if (k === 'Home') i = 0; else if (k === 'End') i = n - 1; else return;
    e.preventDefault(); pick(i);
    var box = e.currentTarget;
    setTimeout(function () { var b = box.querySelectorAll(sel || '[role="tab"]')[i]; if (b) b.focus(); }, 0);
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }

  /* Old-style copy through a hidden textarea: works in Instagram/TikTok in-app browsers that have no clipboard API */
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
      document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = document.execCommand('copy'); ta.remove(); return !!ok;
    } catch (e) { return false; }
  }
  function copyText(text, onDone, onFail) {
    function fallback() { if (legacyCopy(text)) onDone(); else onFail(); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) navigator.clipboard.writeText(text).then(onDone, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }


  /* ---------- Ticket as an image (PNG drawn on a canvas, same look as the on-screen ticket) ---------- */
  var SCHED_NAME = { WEEKDAY: 'Weekday', WEEKEND: 'Weekend' };
  function ticketCanvas(o) {
    var probe = document.querySelector('.dj-ticket') || document.body;
    var cs = getComputedStyle(probe);
    function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
    var C = {
      paper: (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ? cs.backgroundColor : '#fffdf6',
      ink: cs.color || '#163a1e', muted: v('--text-muted', '#5b6b5e'), heading: v('--heading', '#163a1e'),
      line: v('--line-strong', '#9bb09f'), active: v('--active', '#2e7d32'), alert: v('--alert', '#b3261e'), bg: '#e9efe6'
    };
    var MONO = v('--font-mono', '"Courier Prime", ui-monospace, monospace');
    var SERIF = v('--font-editorial', 'Georgia, serif');
    var MARK = v('--font-marker', '"Permanent Marker", cursive');
    var S = 2, W = 400, PAD = 28, IN = W - PAD * 2, KEYW = 84;
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    function font(f) { ctx.font = f; }
    /* Wraps on spaces, keeps the visitor's own line breaks, and splits anything too long for a line (a pasted
       Maps link, say) at the character level so nothing runs off the ticket */
    function wrap(text, maxW) {
      var lines = [];
      String(text).split(/\r?\n/).forEach(function (para) {
        var cur = '';
        para.split(/\s+/).filter(Boolean).forEach(function (w) {
          if (ctx.measureText(w).width > maxW) {
            if (cur) { lines.push(cur); cur = ''; }
            while (w.length > 1 && ctx.measureText(w).width > maxW) {
              var n = 1; while (n < w.length && ctx.measureText(w.slice(0, n + 1)).width <= maxW) n++;
              lines.push(w.slice(0, n)); w = w.slice(n);
            }
          }
          var t = cur ? cur + ' ' + w : w;
          if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
        });
        lines.push(cur);
      });
      while (lines.length > 1 && !lines[lines.length - 1]) lines.pop();
      return lines;
    }
    function layout(draw) {
      var y = 34;
      function txt(s, x, yy, color, align) { if (draw) { ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.fillText(s, x, yy); } }
      function dash(yy) { if (draw) { ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(PAD, yy); ctx.lineTo(W - PAD, yy); ctx.stroke(); ctx.restore(); } }
      /* head */
      font('700 30px ' + SERIF); txt('DA | JU', W / 2, y + 22, C.heading, 'center'); y += 34;
      y += 8;
      font('italic 500 17px ' + SERIF); txt('Freshly Made. Made For You.', W / 2, y + 12, C.heading, 'center'); y += 26;
      if (o.orderRef) { font('400 12px ' + MONO); txt('Ref ' + o.orderRef, W / 2, y + 10, C.muted, 'center'); y += 22; }
      y += 6; dash(y); y += 18;
      /* meta */
      var rows = [['Customer', o.customer && (o.customer + (o.phone ? ' · ' + o.phone : ''))],
        ['Mode', o.mode && ((MODE_NAME[o.mode] || o.mode) + ' — ' + (SCHED_NAME[o.schedule] || o.schedule || ''))],
        ['Where', o.location], ['When', o.time], ['Notes', o.address]];
      rows.forEach(function (r) {
        if (!r[1]) return;
        font('400 14px ' + MONO); txt(r[0], PAD, y + 11, C.muted);
        font('700 14px ' + MONO); wrap(r[1], IN - KEYW).forEach(function (ln) { txt(ln, PAD + KEYW, y + 11, C.ink); y += 21; });
      });
      y += 4; dash(y); y += 18;
      /* items */
      (o.items || []).forEach(function (it) {
        font('700 14px ' + MONO);
        var price = it.price || '', pw = price ? ctx.measureText(price).width + 10 : 0;
        if (price) txt(price, W - PAD, y + 11, C.ink, 'right');
        wrap((it.qty || 1) + '× ' + it.name, IN - pw).forEach(function (ln) { txt(ln, PAD, y + 11, C.ink); y += 21; });
        font('400 13px ' + MONO);
        wrap('Ice ' + (it.ice || 'Normal') + ' · Sweetness ' + (it.sweetness || 'Normal') + (it.flair ? ' · ' + it.flair : ''), IN).forEach(function (ln) { txt(ln, PAD, y + 10, C.muted); y += 19; });
        if (it.cupName) { font('400 20px ' + MARK); txt(it.cupName, PAD, y + 18, C.ink); y += 26; }
        y += 10;
      });
      y -= 4; dash(y); y += 14;
      if (o.mode === 'GRAB_EXPRESS') {
        font((o.feeAck ? '400' : '700') + ' 12px ' + MONO);
        wrap(o.feeAck ? 'Grab Express fee borne by customer — acknowledged' : 'Grab Express fee not acknowledged', IN).forEach(function (ln) { txt(ln, PAD, y + 10, o.feeAck ? C.active : C.alert); y += 18; });
        y += 6;
      }
      font('400 15px ' + MONO); txt('Estimated subtotal', PAD, y + 16, C.ink);
      font('700 20px ' + MONO); txt(o.subtotal || '', W - PAD, y + 16, C.ink, 'right'); y += 26;
      if (o.mode === 'GRAB_EXPRESS') { font('400 12px ' + MONO); txt('Excl. any Grab Express fee', W - PAD, y + 8, C.muted, 'right'); y += 18; }
      return y + 26;
    }
    font('14px ' + MONO);
    var H = Math.ceil(layout(false)), M = 20;
    cv.width = (W + M * 2) * S; cv.height = (H + M * 2) * S;
    ctx.scale(S, S);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W + M * 2, H + M * 2);
    ctx.translate(M, M);
    /* paper with zigzag top and bottom edges, like a torn receipt */
    ctx.save(); ctx.shadowColor = 'rgba(22,58,30,.18)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
    ctx.fillStyle = C.paper; ctx.beginPath();
    var Z = 10, n = Math.round(W / Z);
    ctx.moveTo(0, 6); for (var i = 0; i < n; i++) { ctx.lineTo(i * Z + Z / 2, 0); ctx.lineTo((i + 1) * Z, 6); }
    ctx.lineTo(W, H - 6); for (var j = n; j > 0; j--) { ctx.lineTo(j * Z - Z / 2, H); ctx.lineTo((j - 1) * Z, H - 6); }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.textBaseline = 'alphabetic';
    layout(true);
    return cv;
  }

  /* WhatsApp message: short sections with blank lines between them (WhatsApp shows *text* as bold) */
  function orderMessage(o) {
    var L = ['*DAJU MATCHA · ORDER TICKET*', 'Ref: ' + (o.orderRef || ''), '',
      '*Contact*', 'Name: ' + (o.customer || ''), 'Phone: ' + (o.phone || ''), '',
      '*Order*'];
    (o.items || []).forEach(function (it, i) {
      if (i) L.push('');
      L.push((it.qty || 1) + '× ' + it.name + (it.price ? ' · ' + it.price : ''));
      L.push('   Ice: ' + (it.ice || 'Normal') + ' · Sweetness: ' + (it.sweetness || 'Normal'));
      if (it.flair) L.push('   Flair: ' + it.flair);
      if (it.cupName) L.push('   Cup name: "' + it.cupName + '"');
    });
    L.push('', '*' + (o.mode === 'PICK_UP' ? 'Pickup' : 'Delivery') + '*',
      'Method: ' + (MODE_NAME[o.mode] || o.mode || '') + (o.schedule ? ' (' + (SCHED_NAME[o.schedule] || o.schedule) + ')' : ''),
      (o.mode === 'PICK_UP' ? 'Location: ' : 'Deliver to: ') + (o.location || ''),
      'Time: ' + (o.time || ''));
    if (o.address) L.push('Address notes: ' + o.address);
    if (o.mode === 'GRAB_EXPRESS') L.push('Grab Express fee paid by customer: ' + (o.feeAck ? 'Acknowledged' : 'NOT acknowledged'));
    L.push('', '*Estimated subtotal:* ' + (o.subtotal || '') + (o.mode === 'GRAB_EXPRESS' ? ' (excl. Grab Express fee)' : ''));
    return L.join('\n');
  }
  /* The ticket fonts are loaded before drawing (the canvas can't wait for them by itself) */
  var TICKET_FONTS = ['400 14px "Courier Prime"', '700 14px "Courier Prime"', '700 30px "Cormorant Garamond"', 'italic 500 17px "Cormorant Garamond"', '400 20px "Permanent Marker"'];
  function ticketFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      Promise.all(TICKET_FONTS.map(function (f) { return document.fonts.load(f).catch(function () {}); })),
      new Promise(function (r) { setTimeout(r, 2500); })
    ]);
  }
  function ticketBlob(o) {
    return ticketFonts().then(function () {
      return new Promise(function (res, rej) { ticketCanvas(o).toBlob(function (b) { b ? res(b) : rej(new Error('no image')); }, 'image/png'); });
    });
  }
  /* The image is made ahead of time (as soon as the ticket is on screen), so a tap on Share can open the share sheet
     straight away. iPhone Safari refuses to share when the tap is followed by a long wait. */
  var ticketCache = { key: '', blob: null, job: null };
  function ticketKey(o) { return JSON.stringify(o); }
  function prepareTicket(o) {
    var key = ticketKey(o);
    if (ticketCache.key === key) return ticketCache.job;
    ticketCache.key = key; ticketCache.blob = null;
    var job = ticketBlob(o).then(function (b) { if (ticketCache.key === key) ticketCache.blob = b; return b; });
    job.catch(function () { if (ticketCache.key === key) ticketCache.key = ''; });
    ticketCache.job = job;
    return job;
  }
  function usePreparedTicket(o, on) {
    var key = ticketKey(o);
    useEffect(function () {
      if (!on) return;
      var t = setTimeout(function () { prepareTicket(o); }, 350);
      return function () { clearTimeout(t); };
    }, [key, on]);
  }
  /* Phone share sheet (pick WhatsApp) when the browser allows it; otherwise save the PNG so it can be attached in the chat */
  function shareTicketImage(o, text, toast) {
    var name = 'DAJU-ticket-' + String(o.orderRef || 'order').replace(/[^\w-]/g, '') + '.png';
    var ready = ticketCache.key === ticketKey(o) && ticketCache.blob;
    function go(blob) {
      var file = null;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      var canShare = false;
      try { canShare = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
      /* the image only: iPhone Safari often fails when files and text are shared together (the text goes by WhatsApp's own button) */
      var shared = Promise.resolve('failed');
      if (canShare) { try { shared = navigator.share({ files: [file] }).then(function () { return 'shared'; }, function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; }); } catch (e) {} }
      return shared.then(function (r) {
        if (r !== 'failed') return r;
        return saveBlob(blob, name).then(function (ok) {
          if (ok) toast('Ticket image saved. Attach it in the DAJU WhatsApp chat');
          else toast('Could not save the image here. Use Copy ticket text instead');
          return ok ? 'saved' : 'failed';
        });
      });
    }
    if (ready) return go(ready);   /* share is called inside the tap itself */
    return prepareTicket(o).then(go, function () { toast('Could not make the image. Use Copy ticket text instead'); return 'failed'; });
  }
  function saveBlob(blob, name) {
    var viaClaude = (window.claude && window.claude.use) ? window.claude.use('downloads') : Promise.resolve(null);
    return Promise.resolve(viaClaude).catch(function () { return null; }).then(function (dl) {
      if (dl) return dl.save({ filename: name, data: blob }).then(function () { return true; }, function () { return false; });
      try {
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);   /* iPhone keeps showing its download prompt for a while */
        return true;
      } catch (e) { return false; }
    });
  }

  /* ---------- Small pieces ---------- */
  function Burst(p) {
    if (!p.n) return null;
    var dirs = [[-70, -40], [64, -52], [-48, 40], [72, 30], [0, -78]];
    return html`<div className="burst" key=${p.n} aria-hidden="true">${dirs.map(function (d, i) {
      return html`<span key=${i} style=${{ '--bx': d[0] + 'px', '--by': d[1] + 'px', animationDelay: (i * 30) + 'ms' }}><${D.Doodle} name="sparkle" size=${28} /></span>`;
    })}</div>`;
  }

  function Toast(p) {
    return html`<${R.Fragment}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">${p.msg}</div>
      ${p.msg ? html`<div className=${'toast' + (p.out ? ' is-leaving' : '')} aria-hidden="true"><${D.Doodle} name="sparkle" size=${20} />${p.msg}</div>` : null}
    <//>`;
  }

  /* ---------- Image placeholder (real photos go back in later) ---------- */
  function Ph(p) {
    return html`<div className=${'ph' + (p.className ? ' ' + p.className : '')} role="img" aria-label=${p.label || 'Image placeholder'} style=${p.ratio ? { aspectRatio: p.ratio } : null}>
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="9" cy="10" r="2" fill="currentColor" /><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
</div>`;
  }

  /* ---------- Home: hero ---------- */
  function Hero(p) {
    return html`
      <section id="drop" className="band hero fx-hero" data-theme="forest" ref=${p.heroRef}>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <${D.StickerHeadline} as="h1" size="xl">This week<br />special<//>
            <p className="fx-hero-flavor"><span className="editorial-md">Matcha</span> <span className="flavor-script" aria-hidden="true">Blue Sea Salt</span></p>
            <div className="hero-actions">
              <${D.Button} variant="sticker" size="lg" icon="sparkle" onClick=${function () { p.onCustomize(WEEKLY); }}>Customize & add<//>
              <${D.Button} variant="secondary" size="lg" href="#order">How to order<//>
            </div>
          </div>
          <div className="hero-cup fx-hero-media">
            <${Ph} className="fx-hero-ph" ratio="4 / 5" text="Hero photo · Matcha Blue Sea Salt" label=${PHOTO_ALT} />
            <${D.Stamp} tone="forest" rotate=${-4} className="stamp-pink fx-hero-stamp">Matcha of the Week<//>
            <div className="fx-hero-whisk" aria-hidden="true"><${HeroWhisk} size=${p.narrow ? 120 : 170} /></div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Home: ticker strip ---------- */
  function Ticker() {
    /* A slow, endless sideways carousel. The items are rendered twice so the loop has no gap;
       the second copy is hidden from screen readers. */
    var items = MENU.map(function (m) { return m.name; });   /* every drink on the menu, in menu order */
    function set(copy) {
      return html`<div className="fx-ticker-set" aria-hidden=${copy ? 'true' : undefined}>
        ${items.map(function (t, i) { return html`<${R.Fragment} key=${i}><span>${t}</span><span className="fx-ticker-dot" aria-hidden="true"></span><//>`; })}
      </div>`;
    }
    return html`<div className="fx-ticker" data-theme="forest"><div className="fx-ticker-track">${set(false)}${set(true)}</div></div>`;
  }

  /* ---------- Home: best sellers (three drinks, zig-zag rows) ----------
     The first row is always this week's Matcha of the Week (whichever drink has status 'weekly' in MENU),
     followed by the next two drinks on the menu. */
  function Lineup(p) {
    var picks = [WEEKLY].concat(MENU.filter(function (m) { return m !== WEEKLY && m.status !== 'soldout'; })).slice(0, 3);
    return html`
      <section id="lineup" className="band fx-lineup" aria-labelledby="lineup-title">
        <div className="wrap">
          <div className="fx-sec-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="lineup-title">Our best seller</span><//>
          </div>
          <div className="fx-zig">
            ${picks.map(function (m, i) {
              return html`<article key=${m.id} className=${'fx-zig-row' + (i % 2 ? ' is-flip' : '')}>
                <div className="fx-zig-media">
                  <${Ph} ratio="1 / 1" label=${m.imageAlt || ('Photo of ' + m.name)} />
                  ${m.status === 'weekly' ? html`<${D.Stamp} tone="forest" rotate=${-4} className="stamp-pink fx-zig-stamp">Matcha of the Week<//>` : null}
                </div>
                <div className="fx-zig-body">
                  <h3 className="fx-zig-name">${m.name}</h3>
                  <p className="fx-zig-note">${m.note}</p>
                  <p className="fx-zig-price">${m.status === 'weekly' ? WEEKLY_PRICE : priceText(m.price)}</p>
                </div>
              </article>`;
            })}
          </div>
          <div className="fx-center"><${D.Button} variant="primary" size="lg" href="#menu">See the full menu<//></div>
        </div>
      </section>`;
  }

  /* ---------- Home: follow us (photo grid, placeholders for now) ---------- */
  function Follow() {
    var ig = SOCIAL.instagram, tt = SOCIAL.tiktok;
    return html`
      <section id="follow" className="band fx-follow" aria-labelledby="follow-title">
        <div className="wrap">
          <div className="fx-sec-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="follow-title">From your eyes, to our page</span><//>
          </div>
        </div>
        <div className="fx-follow-row" role="list" aria-label="Customer posts that tag DAJU on Instagram">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return html`<div key=${n} className="fx-follow-item" role="listitem"><${Ph} ratio="4 / 5" label=${'Customer post ' + n + ' (placeholder)'} /></div>`; })}
        </div>
        <div className="wrap">
          <div className="fx-center fx-follow-links">
            ${ig.url ? html`<${D.Button} variant="secondary" href=${ig.url} target="_blank" rel="noopener">Instagram ${ig.handle}<//>` : html`<span className="label foot-soon">Instagram ${ig.handle}</span>`}
            ${tt.url ? html`<${D.Button} variant="secondary" href=${tt.url} target="_blank" rel="noopener">TikTok ${tt.handle}<//>` : html`<span className="label foot-soon">TikTok ${tt.handle}</span>`}
          </div>
        </div>
      </section>`;
  }

  /* ---------- Home: order-ahead band ---------- */
  function SkipBand() {
    return html`
      <section id="skip" className="band fx-skip" aria-label="Order ahead">
        <div className="wrap fx-skip-row" data-theme="forest">
          <p className="fx-skip-text">Skip the queue: build your cup now and pick it up when you visit.</p>
          <${D.Button} variant="sticker" size="lg" icon="bag" href="#studio">Build your cup<//>
        </div>
      </section>`;
  }

  /* ---------- Visit: how to reach us ---------- */
  function Contact() {
    return html`
      <section id="contact" className="band fx-contact" aria-labelledby="contact-title">
        <div className="wrap fx-contact-grid">
          <div className="fx-sec-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="contact-title">Order on WhatsApp</span><//>
          </div>
          <div className="fx-contact-card">
            <${D.Doodle} name="bag" size=${28} />
            <p className="fx-contact-big"><a href=${'https://wa.me/' + WA_NUMBER} target="_blank" rel="noopener">WhatsApp ${WA_DISPLAY}</a></p>
            <div className="fx-contact-btns">
              <${D.Button} variant="primary" className="btn-pink" size="lg" icon="bag" href="#studio">Build your cup<//>
              <${D.Button} variant="secondary" href="#order">How to order<//>
            </div>
          </div>
        </div>
      </section>`;
  }


  /* Hero whisk with sparkles (line art from DAJU's own graphic) */
  function HeroWhisk(p) {
    return html`<svg className="hero-whisk" width=${p.size} viewBox="20 40 300 230" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M66 161Q66 178 83 178Q66 178 66 195Q66 178 49 178Q66 178 66 161Z" />
      <path d="M53.5 156.3L48.5 147.7M78.5 156.3L83.5 147.7M42.5 186.6L33.1 190.0M88.7 188.6L97.7 192.8" />
      <path d="M42.5 232.5L34.7 224.7M49.5 232.5L57.3 224.7M49.5 239.5L57.3 247.3M42.5 239.5L34.7 247.3" />
      <path d="M264.5 184.5L257.4 177.4M271.5 184.5L278.6 177.4M271.5 191.5L278.6 198.6M264.5 191.5L257.4 198.6" />
      <path d="M304 183Q304 196 317 196Q304 196 304 209Q304 196 291 196Q304 196 304 183Z" />
      <g className="whisk"><g transform="translate(180 170) rotate(30)">
        <rect x="-15" y="-112" width="30" height="58" rx="9" />
        <path d="M-9 -104v38M-15 -54h30M-13 -54l-2 14h30l-2 -14" />
        <path d="M-14.4 -40Q-53.1 18 -49.2 54Q-45.3 64 -35.4 58M-12.0 -40Q-44.3 18 -41.0 54Q-37.7 64 -29.5 58M-9.6 -40Q-35.4 18 -32.8 54Q-30.2 64 -23.6 58M-7.2 -40Q-26.6 18 -24.6 54Q-22.6 64 -17.7 58M-4.8 -40Q-17.7 18 -16.4 54Q-15.1 64 -11.8 58M-2.4 -40Q-8.9 18 -8.2 54Q-7.5 64 -5.9 58M0.0 -40Q0.0 18 0.0 54Q0.0 64 0.0 58M2.4 -40Q8.9 18 8.2 54Q7.5 64 5.9 58M4.8 -40Q17.7 18 16.4 54Q15.1 64 11.8 58M7.2 -40Q26.6 18 24.6 54Q22.6 64 17.7 58M9.6 -40Q35.4 18 32.8 54Q30.2 64 23.6 58M12.0 -40Q44.3 18 41.0 54Q37.7 64 29.5 58M14.4 -40Q53.1 18 49.2 54Q45.3 64 35.4 58" />
      </g></g>
    </svg>`;
  }
  /* ---------- Ch.2 ---------- */
  var LAYERS = ['Clear cup & DA JU', 'Ice drops in', 'Matcha swirls up', 'Sea-salt foam', 'Bow & butterflies'];
  /* ---------- Matcha of the Week story (plays after the cup is built, inside the same pinned scroll) ---------- */
  var WEEKLY_PRICE = 'RM8.99';
  var WA_NUMBER = '60185768476', WA_DISPLAY = '+60 18-576 8476';  /* DAJU WhatsApp Business */
  var BUILD_END = 0.24;                         /* share of the pinned scroll spent building the cup */
  var STORY = [
    { at: 0.34, kind: 'title' },
    { at: 0.45, n: 1, head: 'Every week,', body: 'we randomly pick one of our matcha creations to be your Matcha of the Week.', icon: 'whisk' },
    { at: 0.56, n: 2, head: 'How do we pick?', body: 'Every week, we roll for your Matcha of the Week on our IG Stories.', icon: 'dice' },
    { at: 0.67, n: 3, head: 'And guess what?', body: 'price' , icon: 'sparkle' }
  ];
  var STORY_SPAN = 0.11, BOOM_AT = 0.8, LAST_EXIT = 0.035;
  var STORY_EASE = 7, STORY_MAX_RATE = STORY_SPAN / 1.2;  /* each card gets at least ~1.2s, however fast you scroll */
  /* Swipe resting spots (share of the pinned scroll): one per cup layer, one per story card once it's fully in,
     then the price tag (the last one, which can't be glided past) */
  var STOP_AT = [0, 1, 2, 3, 4].map(function (k) { return (k + 0.5) * BUILD_END / 5.2; })
    .concat(STORY.map(function (it) { return it.at + STORY_SPAN * 0.45; }))
    .concat([BOOM_AT]);
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function Dice(p) {
    return html`<svg width=${p.size || 26} height=${p.size || 26} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></svg>`;
  }
  function storyBody(it) {
    if (it.body !== 'price') return it.body;
    return html`That week's pick is only <b className="motw-price-inline">${WEEKLY_PRICE}</b>!`;
  }
  function StoryCard(p) {
    var it = p.it;
    if (it.kind === 'title') return html`<div className="motw-card motw-title-card">
      <p className="motw-kicker">What is</p>
      <p className="motw-title">“Matcha of the Week”?</p></div>`;
    return html`<div className="motw-card">
      <span className="motw-n" aria-hidden="true">${it.n}</span>
      <p className="motw-head">${it.head}</p>
      <p className="motw-body">${storyBody(it)}</p></div>`;
  }
  var SPARKS = Array.from({ length: 16 }).map(function (_, i) {
    var a = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : 0), d = 120 + (i % 3) * 38;
    return { x: Math.round(Math.cos(a) * d), y: Math.round(Math.sin(a) * d), c: ['ribbon', 'seasalt', 'whisk', 'doodle'][i % 4], s: 8 + (i % 3) * 4, delay: (i % 4) * 25 };
  });
  function PriceTag(p) {
    return html`<div className=${'motw-boom' + (p.on ? ' is-on' : '')} aria-hidden=${p.on ? undefined : 'true'}>
      <span className="boom-rays" aria-hidden="true">${Array.from({ length: 12 }).map(function (_, i) { return html`<i key=${i} style=${{ '--r': (i * 30) + 'deg' }}></i>`; })}</span>
      <span className="boom-sparks" aria-hidden="true">${SPARKS.map(function (k, i) { return html`<i key=${i} className=${'is-' + k.c} style=${{ '--bx': k.x + 'px', '--by': k.y + 'px', '--bs': k.s + 'px', animationDelay: k.delay + 'ms' }}></i>`; })}</span>
      <div className="price-tag">
        <span className="price-tag-price"><span className="price-rm">${WEEKLY_PRICE.slice(0, 2)}</span>${WEEKLY_PRICE.slice(2)}</span>
      </div>
    </div>`;
  }

  /* Phones: the section opens on the "What is Matcha of the Week?" card. As the visitor scrolls, cards 1, 2 and 3
     slide out from under it one at a time; once all three are open, the RM8.99 tag pops with its burst.
     Only transforms change, so the page never jumps; scrolling back up closes the cards again. */
  function StoryStack() {
    var box = useRef(null), tag = useRef(null);
    var popS = useState(false), popped = popS[0], setPopped = popS[1];
    useEffect(function () {
      var el = box.current; if (!el) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var cards = el.querySelectorAll('.motw-spread-card'), raf = 0, tops = [];
      function measure() {
        for (var i = 0; i < cards.length; i++) { cards[i].style.transform = 'none'; }
        tops = Array.prototype.map.call(cards, function (c) { return c.offsetTop; });
        tick();
      }
      function tick() {
        raf = 0;
        var vh = window.innerHeight, r = el.getBoundingClientRect();
        /* overall progress: starts when the block's top is 70% down the screen, done when it is near the top */
        var P = reduce ? 1 : clamp01((vh * 0.7 - r.top) / (vh * 0.62));
        var y = 0;   /* where the previous card currently sits, relative to the title card */
        for (var i = 1; i < cards.length; i++) {
          var o = easeOut(clamp01(P * (cards.length - 1) - (i - 1)));   /* card i opens during its own third */
          var gap = tops[i] - tops[i - 1];
          var tucked = y + 10;            /* hidden just under the card above it */
          var target = tucked + (y + gap - tucked) * o;
          cards[i].style.transform = 'translateY(' + (target - (tops[i] - tops[0])).toFixed(1) + 'px) scale(' + (0.92 + 0.08 * o).toFixed(3) + ')';
          cards[i].style.opacity = (o > 0 ? 1 : 0);
          y = target;
        }
        var t = tag.current ? tag.current.getBoundingClientRect() : null;
        setPopped(P >= 1 && !!t && t.top < vh * 0.8);
      }
      function on() { if (!raf) raf = requestAnimationFrame(tick); }
      measure();
      window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', measure);
      return function () { window.removeEventListener('scroll', on); window.removeEventListener('resize', measure); if (raf) cancelAnimationFrame(raf); };
    }, []);
    /* when the tag pops, it flies out of the small "RM8.99" in card 3 and grows into place, then bursts */
    useEffect(function () {
      if (!popped || !box.current || !tag.current) return;
      var big = tag.current.querySelector('.price-tag'), small = box.current.querySelector('.motw-price-inline');
      if (!big || !small || !big.animate) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var a = small.getBoundingClientRect(), z = big.getBoundingClientRect();
      var dx = (a.left + a.width / 2) - (z.left + z.width / 2), dy = (a.top + a.height / 2) - (z.top + z.height / 2);
      var k = Math.max(0.08, a.width / Math.max(1, z.width));
      var anim = big.animate([
        { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px)) rotate(0deg) scale(' + k.toFixed(3) + ')', opacity: 1 },
        { offset: 0.72, transform: 'translate(-50%, -50%) rotate(-3deg) scale(1.14)', opacity: 1 },
        { transform: 'translate(-50%, -50%) rotate(-6deg) scale(1)', opacity: 1 }
      ], { duration: 560, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' });
      small.classList.add('is-launch');
      var t = setTimeout(function () { small.classList.remove('is-launch'); }, 400);
      return function () { anim.cancel(); clearTimeout(t); small.classList.remove('is-launch'); };
    }, [popped]);
    return html`<${R.Fragment}>
      <div className="motw-spread" ref=${box}>
        ${STORY.map(function (it, i) {
          return html`<div key=${i} className="motw-spread-card" style=${{ zIndex: STORY.length - i, opacity: i ? 0 : 1 }}><${StoryCard} it=${it} /></div>`;
        })}
      </div>
      <div className=${'motw-pop-tag' + (popped ? ' is-popped' : '')} ref=${tag}><${PriceTag} on=${popped} /></div>
    <//>`;
  }

  function Assembly(p) {
    var pinned = p.pinned, layer = p.layer, narrow = p.narrow;
    /* the story waits until the last layer (bow and butterflies) has finished animating in, however fast you scroll */
    var rdy = useState(false), settled = rdy[0], setSettled = rdy[1];
    useEffect(function () {
      if (layer < 5) { setSettled(false); return; }
      var t = setTimeout(function () { setSettled(true); }, p.reduce ? 0 : 1100);
      return function () { clearTimeout(t); };
    }, [layer >= 5]);
    /* The cards follow an eased copy of the scroll progress, never the raw value. If you scroll fast while the
       cup is finishing, the story starts from the first card and plays through each one in turn instead of
       jumping straight to wherever the scroll has already reached. */
    var target = pinned ? (settled ? p.progress : Math.min(p.progress, BUILD_END)) : 1;
    var dpS = useState(target), pr = dpS[0], setPr = dpS[1];
    var cur = useRef(target), goal = useRef(target), raf = useRef(0), last = useRef(0);
    goal.current = target;
    useEffect(function () {
      if (!pinned || p.reduce) { cur.current = target; setPr(target); return; }
      if (raf.current) return;
      last.current = 0;
      function step(now) {
        var dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 1 / 60; last.current = now;
        var d = goal.current - cur.current, ad = Math.abs(d);
        if (ad < 0.0004) { cur.current = goal.current; setPr(goal.current); raf.current = 0; return; }
        cur.current += (d > 0 ? 1 : -1) * Math.min(ad, Math.max(0.06, Math.min(ad * STORY_EASE, STORY_MAX_RATE * (cur.current < STORY[0].at - 0.02 ? 4 : 1))) * dt);
        setPr(cur.current);
        raf.current = requestAnimationFrame(step);
      }
      raf.current = requestAnimationFrame(step);
    }, [target, pinned, p.reduce]);
    useEffect(function () { return function () { if (raf.current) cancelAnimationFrame(raf.current); }; }, []);
    var story = pinned && settled && pr > BUILD_END + 0.06, boom = pinned && settled && pr >= BOOM_AT;
    if (p.doneRef) p.doneRef.current = !pinned || boom;   /* the page holds the scroll here until the price tag has popped */
    var s = useState(-1), pin = s[0], setPin = s[1];
    var playS = useState(false), playing = playS[0], setPlaying = playS[1];
    var stage = useRef(null), chips = useRef(null), played = useRef(false);
    useEffect(function () { if (layer < 5) setPin(-1); }, [layer]);
    function play() {
      if (playing) return;
      setPlaying(true); p.setLayer(1);
      var n = 1, t = setInterval(function () { n += 1; p.setLayer(n); if (n >= 5) { clearInterval(t); setPlaying(false); } }, 700);
    }
    /* phones: build the cup once, automatically, the first time it scrolls into view */
    useEffect(function () {
      if (pinned || p.reduce || !stage.current || !('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !played.current) { played.current = true; play(); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(stage.current); return function () { io.disconnect(); };
    }, [pinned, p.reduce]);
    /* keep the current step chip in view */
    useEffect(function () {
      var row = chips.current; if (!row || !narrow) return;
      var el = row.querySelector('.is-current'); if (!el) return;
      row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: p.reduce ? 'auto' : 'smooth' });
    }, [layer, narrow]);
    var steps = html`<ol className="steps" ref=${chips} aria-label="Cup layers">
      ${LAYERS.map(function (label, i) {
        var n = i + 1, cls = 'step' + (n < layer ? ' is-done' : '') + (n === layer ? ' is-current' : '');
        var inner = html`<span className="step-n">${n}</span><span>${label}</span>`;
        return html`<li key=${n}>${pinned
          ? html`<div className=${cls} aria-current=${n === layer ? 'step' : undefined}>${inner}</div>`
          : html`<button type="button" className=${cls} aria-pressed=${n === layer} onClick=${function () { buzz(); p.setLayer(n); }}>${inner}</button>`}</li>`;
      })}
    </ol>`;
    return html`
      <section id="assembly" className=${'assembly' + (pinned ? ' is-pinned' : '')} ref=${p.secRef} aria-label="Matcha of the Week">
        ${pinned ? STOP_AT.map(function (_, k) { return html`<div key=${k} className=${'story-stop' + (k === STOP_AT.length - 1 ? ' is-tag' : '')} aria-hidden="true"></div>`; }) : null}
        <div className="assembly-stick" ref=${p.stickRef}>
          <div className="wrap assembly-grid">
            <div className="assembly-stage" ref=${stage}>
              ${pinned ? html`<div className="sr-only">
                  <h3>What is “Matcha of the Week”?</h3>
                  <ol>${STORY.slice(1).map(function (it) { return html`<li key=${it.n}>${it.head} ${it.body === 'price' ? "That week's pick is only " + WEEKLY_PRICE + '!' : it.body}</li>`; })}</ol>
                  <p>${WEEKLY.name} is this week's Matcha of the Week at ${WEEKLY_PRICE}.</p></div>` : html`<div className="motw-static">
                  ${narrow ? html`<${StoryStack} />` : html`<${R.Fragment}>
                    <${StoryCard} it=${STORY[0]} />
                    ${STORY.slice(1).map(function (it) { return html`<${StoryCard} key=${it.n} it=${it} />`; })}
                    <${PriceTag} on=${true} />
                  <//>`}
                </div>`}
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.3 ---------- */
  function Menu(p) {
    /* tab = the highlighted tab (changes at once); cat = the drinks on show. Switching tabs closes the current cards
       (fade + shrink, 160ms), swaps them, then opens the new ones (staggered rise, ~280ms) while the grid's height
       glides from the old size to the new one, so the page below never jumps. Instant under reduced motion. */
    var catS = useState('Matcha'), cat = catS[0], setCatNow = catS[1];
    var tabS = useState('Matcha'), tab = tabS[0], setTab = tabS[1];
    var phaseS = useState(''), phase = phaseS[0], setPhase = phaseS[1];
    var gridRef = useRef(null), fromH = useRef(0), timers = useRef([]);
    function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }
    useEffect(function () { return function () { timers.current.forEach(clearTimeout); }; }, []);
    function setCat(c) {
      if (c === tab) return;
      setTab(c);
      var g = gridRef.current;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      timers.current.forEach(clearTimeout); timers.current = [];
      if (!g || reduce) { setCatNow(c); setPhase(''); if (g) g.style.height = ''; return; }
      fromH.current = g.offsetHeight;
      g.style.height = fromH.current + 'px';
      setPhase('is-closing');
      later(function () { setCatNow(c); setPhase('is-opening'); }, 160);
    }
    R.useLayoutEffect(function () {
      var g = gridRef.current;
      if (!g || phase !== 'is-opening') return;
      g.style.height = 'auto';
      var to = g.offsetHeight;
      g.style.height = fromH.current + 'px';
      void g.offsetHeight;   /* commit the old height before gliding */
      g.style.height = to + 'px';
      later(function () { g.style.height = ''; setPhase(''); }, 420);
    }, [cat, phase]);
    var list = MENU.filter(function (m) { return m.cat === cat; });
    return html`
      <section id="menu" className="band menu fx-menu" aria-labelledby="menu-title">
        <div className="wrap">
          <div className="fx-sec-head fx-menu-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="menu-title">Collection menu</span><//>
            <div className="menu-tabs" role="tablist" aria-label="Menu category" onKeyDown=${function (e) { tabKeys(e, CATS.indexOf(tab), CATS.length, function (i) { setCat(CATS[i]); }); }}>
              ${CATS.map(function (c) {
                var n = MENU.filter(function (m) { return m.cat === c; }).length;
                return html`<button key=${c} id=${'menu-tab-' + c} type="button" role="tab" tabIndex=${tab === c ? 0 : -1} aria-controls="menu-panel" className=${'menu-tab' + (tab === c ? ' is-on' : '')} aria-selected=${tab === c} onClick=${function () { buzz(); setCat(c); }}>${c}<span className="menu-tab-n">${n}</span></button>`;
              })}
            </div>
          </div>
          <div ref=${gridRef} className=${'fx-menu-grid' + (phase ? ' ' + phase : '')} id="menu-panel" role="tabpanel" aria-labelledby=${'menu-tab-' + cat}>
            ${list.map(function (m, i) {
              var art = html`<${Ph} text=${m.name} label=${m.imageAlt || ('Photo of ' + m.name)} />`;
              return html`<div key=${m.id} className=${'fx-menu-card drink-' + m.id} style=${{ '--i': i }}><${D.ProductCard} name=${m.name} note=${m.note} price=${m.status === 'weekly' ? WEEKLY_PRICE : priceText(m.price)} status=${m.status} category=${m.cat}
                suggestion=${m.suggestion} art=${art}
                onAdd=${m.status === 'soldout' ? undefined : function () { p.onCustomize(m); }} /></div>`;
            })}
            ${cat === 'Matcha' ? html`<div className="coming-wrap fx-menu-card" style=${{ '--i': list.length }}><div className="coming">
              <p className="script">New menu to come...</p>
            </div></div>` : null}
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.4 ---------- */
  function Studio(p) {
    var st = p.studio, narrow = p.narrow, each = st.qty > 1 && st.mode === 'each';
    var c = each ? st.cups[st.active] : st.cups[0];
    var cupName = (c.name || '').trim() || 'DA JU';   /* a name of only spaces falls back to DA JU */
    var room = Math.max(0, MAX_CUPS - (p.bagCount || 0)), maxQty = Math.max(1, Math.min(MAX_CUPS, room)), full = room <= 0;
    var head = html`<div className="studio-head">
      <p className="fx-step">Step 1 of 3</p>
      <${D.StickerHeadline} size="lg" className="chapter-title"><span id="studio-title">Build your cup</span><//>
    </div>`;
    var caption = 'Ice ' + c.ice.toLowerCase() + ' · sweetness ' + c.sweet.toLowerCase();
    var reads = st.qty === 1 ? 'Your cup reads' : each ? 'Cup ' + (st.active + 1) + ' of ' + st.qty + ' reads' : 'All ' + st.qty + ' cups read';
    var drink = drinkById(st.drink);
    var lineTotal = drink.price == null ? '[RM price] each' : 'RM ' + (drink.price * st.qty).toFixed(2);
    return html`
      <section id="studio" className="band" aria-labelledby="studio-title">
        <div className="wrap studio">
          ${narrow ? head : null}
          <div className="studio-cup">
            <div className="studio-doodles" aria-hidden="true"><${D.Doodle} name="sparkle" size=${36} /><${D.Doodle} name="daisy" size=${36} /></div>
            <div className="cup-stack">
              <${D.CupPreview} width=${narrow ? 86 : 260} name=${cupName} charm=${c.flair} className=${cupClass(drink.id)} alt=${'Illustrated ' + drink.name + ' with "' + cupName + '" written on the cup'} caption=${narrow ? undefined : (st.qty > 1 ? reads.replace(' reads', '').replace(' read', '') + ' · ' : '') + caption} />
              ${st.qty > 1 ? html`<span className="qty-badge" aria-hidden="true">×${st.qty}</span>` : null}
            </div>
            <div className="studio-cup-meta" aria-live="polite">
              <span className="studio-drink-name">${drink.name}</span>
              <span className="small">${reads}</span>
              <span className="marker">${cupName}</span>
              <span className="small">${caption} · ${FLAIR[c.flair]}</span>
            </div>
            <${Burst} n=${p.burst} />
          </div>
          <div className="studio-form">
            ${narrow ? null : head}
            <div className="drink-pick-wrap">
              <p className="dj-field-label p0" id="drink-label">Drink</p>
              <div className="drink-pick" role="radiogroup" aria-labelledby="drink-label" onKeyDown=${function (e) {
                  var ok = MENU.filter(function (m) { return m.status !== 'soldout'; });
                  tabKeys(e, Math.max(0, ok.indexOf(drink)), ok.length, function (i) { p.setDrink(ok[i].id); }, '[role="radio"]:not([disabled])');
                }}>
                ${MENU.map(function (m) {
                  var on = m.id === drink.id, sold = m.status === 'soldout';
                  return html`<button key=${m.id} type="button" role="radio" aria-checked=${on} tabIndex=${on ? 0 : -1} disabled=${sold} className=${'drink-chip' + (on ? ' is-on' : '')}
                    onClick=${function (e) { buzz(); p.setDrink(m.id); var b = e.currentTarget, row = b.parentNode; if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: b.offsetLeft - 16, behavior: 'smooth' }); }}>
                    <span className="drink-thumb"><${DrinkThumb} drink=${m} size=${34} /></span>
                    <span className="drink-chip-text"><span className="drink-chip-name">${m.name}</span>${m.status === 'weekly' || sold ? html`<span className="drink-chip-cat">${sold ? 'Sold out today' : 'Matcha of the Week'}</span>` : null}</span>
                  </button>`;
                })}
              </div>
            </div>
            <div className="qty-row">
              <div>
                <p className="dj-field-label p0" id="qty-label">How many cups?</p>
                <p className="fine">Up to ${MAX_CUPS} per order${p.bagCount ? ' (' + (full ? 'your bag is full' : room + ' more fit in your bag') + ')' : ''}. ${st.qty > 1 ? 'All ' + st.qty + ' are ' + drink.name + '.' : drink.name + '.'}</p>
              </div>
              <div className="stepper" role="group" aria-labelledby="qty-label">
                <button type="button" className="step-btn" aria-label="One cup fewer" disabled=${st.qty <= 1} onClick=${function () { p.setQty(st.qty - 1); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
                <output className="qty-num" aria-live="polite"><span className="qty-pop" key=${st.qty}>${st.qty}</span></output>
                <button type="button" className="step-btn" aria-label="One cup more" disabled=${st.qty >= maxQty} onClick=${function () { p.setQty(st.qty + 1); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
              </div>
            </div>
            ${st.qty > 1 ? html`<${D.ChoicePills} label="Customization" className="full-seg" value=${st.mode}
                options=${[{ value: 'same', label: 'Same for all cups' }, { value: 'each', label: 'Customize each cup' }]} onChange=${p.setMode} />` : null}
            ${each ? html`<div className="cup-tabs-wrap">
                <p className="dj-field-label p0">Editing cup ${st.active + 1} of ${st.qty}</p>
                <div className="cup-tabs" role="group" aria-label="Choose a cup to customize">
                  ${st.cups.map(function (cc, i) {
                    return html`<button key=${i} type="button" className=${'cup-tab' + (i === st.active ? ' is-on' : '')} aria-pressed=${i === st.active} onClick=${function () { buzz(); p.setActive(i); }}>
                      <span className="cup-tab-n">Cup ${i + 1}</span><span className="cup-tab-name">${(cc.name || '').trim() || 'DA JU'}</span></button>`;
                  })}
                </div>
              </div>` : null}
            <${D.TextField} key=${'name-' + (each ? st.active : 'all')} label=${each ? 'Name on cup ' + (st.active + 1) : st.qty > 1 ? 'Name on every cup' : 'Name on the cup'} hint="Up to 12 characters, written in marker." maxLength=${12} placeholder="DA JU" value=${c.name} autoComplete="off"
              onChange=${function (e) { p.setCup({ name: e.target.value.slice(0, 12) }, true); }} />
            <${D.ChoicePills} label="Ice" options=${TWO} value=${c.ice} className="full-seg" onChange=${function (v) { p.setCup({ ice: v }); }} />
            <${D.ChoicePills} label="Sweetness" options=${TWO} value=${c.sweet} className="full-seg" onChange=${function (v) { p.setCup({ sweet: v }); }} />
            <${D.ChoicePills} label="Cup flair" options=${FLAIR_OPTS} value=${c.flair} className="mode-pills" onChange=${function (v) { p.setCup({ flair: v }); }} />
            ${each && st.active < st.qty - 1 ? html`<${D.Button} variant="secondary" onClick=${function () { buzz(); p.setActive(st.active + 1); }}>Next: cup ${st.active + 2}<//>` : null}
            <div className="studio-add">
              <${D.Button} variant="primary" className="btn-pink" size="lg" icon="bag" disabled=${full} onClick=${p.onAdd}>${full ? 'Bag full (' + MAX_CUPS + ' cups max)' : st.qty === 1 ? 'Add to bag' : 'Add ' + Math.min(st.qty, room) + ' cups to bag'}<//>
              <span className="label muted">${lineTotal} · ${p.bagCount ? p.bagCount + (p.bagCount === 1 ? ' cup' : ' cups') + ' in your bag' : 'Your bag is empty'}</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.5 ---------- */
  function Fold(p) {
    var st = useState(!!p.open), settled = st[0], setSettled = st[1];
    useEffect(function () {
      if (!p.open) { setSettled(false); return; }
      var t = setTimeout(function () { setSettled(true); }, 330);   /* the unfold takes 320ms */
      return function () { clearTimeout(t); };
    }, [p.open]);
    return html`<div className=${'fold' + (p.open ? ' is-open' : '') + (p.open && settled ? ' is-settled' : '') + (p.className ? ' ' + p.className : '')} inert=${p.open ? undefined : ''} aria-hidden=${p.open ? undefined : 'true'}>
      <div className="fold-inner">${p.children}</div></div>`;
  }
  function Route(p) {
    var stations = [['PICK_UP', 'bag'], ['GRAB_EXPRESS', 'scooter'], ['COD', 'car']];
    var details = p.step !== 'pick', nErr = Object.keys(p.errors).length;
    var icon = stations.filter(function (s) { return s[0] === p.mode; })[0][1];
    return html`
      <section id="order" className="band" aria-labelledby="order-title">
        <div className="wrap"><div className="route-wrap fx-order-card">
          <div className="route-head">
            <p className="fx-step">Step 2 of 3</p>
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="order-title">Delivery or pickup</span><//>
          </div>
          <${Fold} open=${!details} className="no-flip">
            <div className="day-toggle-static">
              <${D.ChoicePills} variant="segmented" label="Show schedule for" options=${DAY_OPTS} value=${p.day} onChange=${p.setDay} />
            </div>
          <//>
          <div className=${'route' + (details ? ' is-focused' : '')}>
            <span className="rider" aria-hidden="true"><${D.Doodle} name=${icon} size=${22} /></span>
            ${stations.map(function (s) {
              var mine = p.mode === s[0], open = p.step === 'details' && mine, folded = details && !open;
              var chosen = mine && p.saved && !details;
              var d = D.schedule[s[0]];
              return html`<div key=${s[0]} id=${'station-' + s[0]} className=${'station' + (mine && (details || p.saved) ? ' is-chosen' : '') + (folded ? ' is-folded' : '') + (open ? ' is-open' : '')}>
                <span className="station-icon" aria-hidden="true"><${D.Doodle} name=${s[1]} size=${26} /></span>
                <${Fold} open=${folded}>
                  <button type="button" className="station-bar" onClick=${function () { p.onChoose(s[0]); }} aria-label=${'Switch to ' + d.title}>
                    <span className="station-bar-n">${d.step}</span>
                    <span className="station-bar-title">${d.title}</span>
                    <span className="station-bar-cta">Switch<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  </button>
                <//>
                <${Fold} open=${!folded}>
                  <div className=${'station-card' + (open ? ' is-open' : '')}>
                    <${D.ChannelCard} channel=${s[0]} active=${open ? (p.f.day) : p.day} selected=${mine && (details || p.saved)} />
                  </div>
                  <${Fold} open=${!details}>
                    <div className="choose-row"><button type="button" className="chip-btn" aria-pressed=${chosen} aria-expanded=${open} onClick=${function () { p.onChoose(s[0]); }}>
                      ${chosen ? html`<${D.Doodle} name="sparkle" size=${18} />` : null}${chosen ? MODE_NAME[s[0]] + ' chosen · edit details' : 'Choose ' + MODE_NAME[s[0]]}
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
                  <//>
                <//>
                ${mine ? html`<${Fold} open=${open} className="fold-details">
                  <form className="details-form" noValidate=${true} onSubmit=${function (e) { e.preventDefault(); p.onSave(); }} aria-label=${d.title + ' details'}>
                    <div className="details-form-head">
                      <p className="caption p0 eyebrow">Your details for ${d.title}</p>
                      <button type="button" className="back-btn" onClick=${p.onBack}>
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Change method</button>
                    </div>
                    <${FulfillFields} f=${p.f} set=${p.setF} tried=${p.tried} err=${p.errors} now=${p.now} showMode=${false} />
                    ${p.tried && nErr ? html`<p className="fine" style=${{ color: 'var(--alert)', fontWeight: 600 }} role="alert">Fix the highlighted ${nErr === 1 ? 'field' : 'fields'} to finish your ticket.</p>` : null}
                    <${D.Button} type="submit" variant="primary" size="lg" block=${true} icon="sparkle" disabled=${p.mode === 'COD' && p.f.zone === 'OTHER'}>Save details & see my ticket<//>
                  </form>
                <//>` : null}
              </div>`;
            })}
          </div>
          <${Fold} open=${!details} className="no-flip">
            ${p.day === 'weekend'
              ? html`<${D.Notice} tone="availability" title="Weekend notes">Maang Apartment pickups are by arrangement, so add your preferred time at checkout. Weekend COD is based on order & availability, and we'll confirm before dispatch.<//>`
              : html`<${D.Notice} tone="info" title="Order before the window closes">Pre-orders for the 12:30 PM – 1:25 PM Centre Point slot close at 12:30 PM, when pickup starts. Miss it and Weekday COD (after 6:30 PM) is next.<//>`}
          <//>
        </div></div>
      </section>`;
  }

  /* ---------- Ch.6 ---------- */
  function SignOff(p) {
    var bz = useState(false), busy = bz[0], setBusy = bz[1];
    usePreparedTicket(p.order, p.complete);
    return html`
      <section id="ticket" className="band" aria-labelledby="ticket-title">
        <div className="wrap signoff">
          <div className="signoff-copy">
            <p className="fx-step">Step 3 of 3</p>
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="ticket-title">Here’s your receipt</span><//>
          </div>
          <div className="signoff-ticket">
            <p className=${'ticket-state' + (p.complete ? ' is-ok' : '')} role="status">
              <${D.Doodle} name=${p.complete ? 'sparkle' : 'clock'} size=${18} />${p.complete ? 'Details saved. This is the ticket we will receive.' : 'Live preview. It fills in as you build your cups and add your details.'}</p>
            <div className="ticket-live" key=${p.flash}><${D.OrderTicket} ...${p.order} /></div>
            <div className="btns">
              ${p.hasBag
                ? html`<${D.Button} variant="primary" size="lg" icon="bag" block=${true} onClick=${p.onReview}>Review & send order<//>`
                : html`<${D.Button} variant="primary" className="btn-pink" size="lg" icon="bag" block=${true} onClick=${p.onAddStudio}>${p.studioQty > 1 ? 'Add these ' + p.studioQty + ' cups to bag' : 'Add this cup to bag'}<//>`}
              ${p.complete ? null : html`<${D.Button} variant="sticker" block=${true} icon="pin" onClick=${p.onDetails}>Add my details<//>`}
              ${p.complete ? html`<${D.Button} variant="sticker" block=${true} icon="sparkle" disabled=${busy} onClick=${function () { if (busy) return; setBusy(true); shareTicketImage(p.order, orderMessage(p.order), p.toast).then(function () { setBusy(false); }); }}>${busy ? 'Making your ticket image…' : 'Share ticket as image'}<//>` : null}
              <${D.Button} variant="secondary" block=${true} onClick=${p.onCopy}>Copy ticket text<//>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Pop-ups (above the footer) ----------
     To add a pop-up, add a line to POPUPS. Dates are YYYY-MM-DD in KK time; past pop-ups hide themselves. */
  var POPUPS = [
    { start: '2026-11-21', end: '2026-11-22', days: 'Sat 21 – Sun 22 Nov', time: '10 AM – 8 PM', venue: 'Palm Square', place: 'Centre Point, Kota Kinabalu' }
  ];
  function ymd(d) { return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
  var DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function parseHM(t) { var m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(t || ''); return m ? (+m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + (+m[2] || 0) : null; }
  function popHours(pu) { var t = String(pu.time).split(/\s*[–-]\s*/); return { open: parseHM(t[0]), close: parseHM(t[1]), openText: (t[0] || '').trim() }; }
  /* a pop-up is listed until it closes on its last day */
  function popLive(pu, now) { var today = ymd(now), h = popHours(pu); return pu.end > today || (pu.end === today && (h.close == null || mins(now) < h.close)); }
  function popBadge(pu, now) {
    var today = ymd(now), m = mins(now), h = popHours(pu);
    if (pu.start <= today && today <= pu.end) {
      if (h.open != null && m < h.open) return 'Opens today at ' + h.openText;
      if (h.close == null || m < h.close) return 'Happening now';
      return 'Back tomorrow at ' + h.openText;
    }
    var days = Math.round((Date.parse(pu.start + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
    var sd = new Date(pu.start + 'T00:00:00Z').getUTCDay(), weekendStart = sd === 0 || sd === 6;
    if (days === 1) return 'Tomorrow';
    if (days <= 6) return weekendStart && !isWeekend(now) ? 'This weekend' : 'This ' + DAY_NAME[sd];
    if (days <= 13) return 'Next week';
    return 'Coming up';
  }
  function mapsUrl(pu) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pu.venue + ', ' + pu.place); }
  function PopUps(p) {
    var now = p.now;
    var list = POPUPS.filter(function (pu) { return popLive(pu, now); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    var next = list[0], later = list.slice(1, 4);
    return html`
      <section id="popups" className="band popups" aria-labelledby="popups-title">
        <div className="wrap popups-wrap">
          <div className="popups-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="popups-title">${next ? 'Find us at our next pop-up' : 'Next pop-up coming soon'}</span><//>
          </div>
          ${next ? html`
            <article className="popup-card">
              <span className="popup-badge">${popBadge(next, now)}</span>
              <p className="popup-venue">${next.venue}</p>
              <p className="popup-place">${next.place}</p>
              <ul className="popup-meta">
                <li><${D.Doodle} name="clock" size=${20} /><span><b>${next.days}</b><br />${next.time}</span></li>
                <li><${D.Doodle} name="pin" size=${20} /><span>Look for the DAJU stall at <b>${next.venue}</b>, ${next.place}</span></li>
              </ul>
              <div className="popup-btns">
                <${D.Button} variant="primary" className="btn-pink" size="lg" icon="pin" block=${true} href=${mapsUrl(next)} target="_blank" rel="noopener">Get directions<//>
                <${D.Button} variant="secondary" block=${true} icon="bag" onClick=${function () { p.onPreorder(next); }}>Pre-order for pickup at the stall<//>
              </div>
              <p className="popup-skip">Skip the queue: build your cup now and pick it up when you visit.</p>
            </article>` : html`
            <article className="popup-card is-empty">
              <p className="popup-venue">We're planning the next one</p>
              <p className="popup-place">Watch our IG Stories for the date and place.</p>
            </article>`}
          ${later.length ? html`
            <div className="popup-later">
              <p className="label">Also coming up</p>
              <ul>${later.map(function (pu) { return html`<li key=${pu.start}><span className="popup-later-date">${pu.days}</span><span>${pu.venue}, ${pu.place} · ${pu.time}</span><a href=${mapsUrl(pu)} target="_blank" rel="noopener" className="label">Map</a></li>`; })}</ul>
            </div>` : null}
        </div>
      </section>`;
  }

  /* ---------- Visit page: pop-up and WhatsApp side by side (one section, two equal cards; 2 columns on every screen) ---------- */
  function Visit(p) {
    var now = p.now;
    var list = POPUPS.filter(function (pu) { return popLive(pu, now); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    var next = list[0], later = list.slice(1, 4);
    return html`
      <section id="visit-main" className="band fx-visit" aria-labelledby="visit-title">
        <div className="wrap">
          <div className="fx-sec-head">
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="visit-title">Come say hi</span><//>
          </div>
          <div className="fx-visit-grid">
            <article id="popups" className=${'fx-visit-card' + (next ? '' : ' is-empty')} aria-labelledby="popups-title">
              <div className="fx-visit-top">
                <span className="fx-visit-icon"><${D.Doodle} name="pin" size=${22} /></span>
                <p className="fx-visit-eyebrow" id="popups-title">${next ? 'Next pop-up' : 'Pop-ups'}</p>
              </div>
              ${next ? html`
                <span className="fx-visit-badge">${popBadge(next, now)}</span>
                <p className="fx-visit-title">${next.venue}</p>
                <ul className="fx-visit-meta">
                  <li><${D.Doodle} name="clock" size=${16} /><span><b>${next.days}</b><br />${next.time}</span></li>
                  <li><${D.Doodle} name="pin" size=${16} /><span>${next.place}</span></li>
                </ul>
                <div className="fx-visit-btns">
                  <${D.Button} variant="primary" className="btn-pink" block=${true} href=${mapsUrl(next)} target="_blank" rel="noopener">Directions<//>
                  <${D.Button} variant="secondary" block=${true} onClick=${function () { p.onPreorder(next); }}>Pre-order<//>
                </div>` : html`
                <p className="fx-visit-title">Coming soon</p>
                <p className="fx-visit-text">We're planning the next one. Watch our IG Stories for the date and place.</p>`}
            </article>
            <article id="contact" className="fx-visit-card" aria-labelledby="contact-title">
              <div className="fx-visit-top">
                <span className="fx-visit-icon"><${D.Doodle} name="bag" size=${22} /></span>
                <p className="fx-visit-eyebrow" id="contact-title">Order anytime</p>
              </div>
              <p className="fx-visit-title">WhatsApp</p>
              <p className="fx-visit-text"><a href=${'https://wa.me/' + WA_NUMBER} target="_blank" rel="noopener">${WA_DISPLAY}</a></p>
              <p className="fx-visit-text fx-visit-sub">Build your cup here, then send the order to us in one tap.</p>
              <div className="fx-visit-btns">
                <${D.Button} variant="primary" className="btn-pink" block=${true} href="#studio">Build your cup<//>
                <${D.Button} variant="secondary" block=${true} href="#order">How to order<//>
              </div>
            </article>
          </div>
          ${later.length ? html`
            <div className="popup-later fx-visit-later">
              <p className="label">Also coming up</p>
              <ul>${later.map(function (pu) { return html`<li key=${pu.start}><span className="popup-later-date">${pu.days}</span><span>${pu.venue}, ${pu.place} · ${pu.time}</span><a href=${mapsUrl(pu)} target="_blank" rel="noopener" className="label">Map</a></li>`; })}</ul>
            </div>` : null}
        </div>
      </section>`;
  }

  function Footer() {
    var ig = SOCIAL.instagram, tt = SOCIAL.tiktok;
    return html`
      <footer className="foot fx-foot" data-theme="forest" style=${{ background: 'var(--surface)', color: 'var(--text)' }}>
        <div className="wrap fx-foot-min">
          <${D.Wordmark} size="sm" />
          <p className="script">One week. One matcha. A little surprise</p>
          <nav aria-label="Contact and social" className="fx-foot-links">
            <a href=${'https://wa.me/' + WA_NUMBER} target="_blank" rel="noopener" className="label">WhatsApp</a>
            ${ig.url ? html`<a href=${ig.url} target="_blank" rel="noopener" className="label">Instagram</a>` : html`<span className="label foot-soon">Instagram</span>`}
            ${tt.url ? html`<a href=${tt.url} target="_blank" rel="noopener" className="label">TikTok</a>` : html`<span className="label foot-soon">TikTok</span>`}
          </nav>
        </div>
      </footer>`;
  }

  /* ---------- Drawers ---------- */
  function CustomizeDrawer(p) {
    var it = p.item;
    var s = useState({ name: '', ice: 'Normal', sweet: 'Normal', flair: 'butterfly' }), c = s[0], set = s[1];
    var qS = useState(1), qty = qS[0], setQty = qS[1];
    var bS = useState(false), busy = bS[0], setBusy = bS[1];
    useEffect(function () { if (it) set({ name: '', ice: 'Normal', sweet: 'Normal', flair: it.charm || 'butterfly' }); setQty(1); setBusy(false); }, [it && it.id, p.open]);
    if (!it) return null;
    function up(o) { set(Object.assign({}, c, o)); }
    var room = Math.max(0, p.room == null ? MAX_CUPS : p.room), n = Math.max(1, Math.min(qty, room));
    var cupName = (c.name || '').trim() || 'DA JU';
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} title="Customize your cup" step=${it.name}
      footer=${html`<${D.Button} variant="primary" className="btn-pink" size="lg" icon="bag" block=${true} disabled=${busy || !room}
        onClick=${function () { if (busy || !room) return; setBusy(true); p.onAdd(it, c, n); }}>${!room ? 'Bag full (' + MAX_CUPS + ' cups max)' : (n > 1 ? 'Add ' + n + ' cups' : 'Add to bag') + ' · ' + (it.price == null ? priceText(null) + (n > 1 ? ' each' : '') : 'RM ' + (it.price * n).toFixed(2))}<//>`}>
      <div className="custom-cup"><${D.CupPreview} width=${p.side === "bottom" ? 130 : 170} name=${cupName} charm=${c.flair} className=${cupClass(it.id)} alt=${'Illustrated ' + it.name + ' with "' + cupName + '" written on the cup'} /></div>
      <div className="custom-qty">
        <p className="dj-field-label p0" id="custom-qty-label">How many cups?</p>
        <div className="stepper" role="group" aria-labelledby="custom-qty-label">
          <button type="button" className="step-btn" aria-label="One cup fewer" disabled=${n <= 1} onClick=${function () { setQty(n - 1); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
          <output className="qty-num" aria-live="polite"><span className="qty-pop" key=${n}>${n}</span></output>
          <button type="button" className="step-btn" aria-label="One cup more" disabled=${n >= room} onClick=${function () { setQty(n + 1); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
        </div>
      </div>
      <${D.TextField} label=${n > 1 ? 'Name on every cup' : 'Name on the cup'} hint="Up to 12 characters, written in marker." maxLength=${12} placeholder="DA JU" value=${c.name} autoComplete="off" onChange=${function (e) { up({ name: e.target.value.slice(0, 12) }); }} />
      <${D.ChoicePills} label="Ice" options=${TWO} value=${c.ice} className="full-seg" onChange=${function (v) { up({ ice: v }); }} />
      <${D.ChoicePills} label="Sweetness" options=${TWO} value=${c.sweet} className="full-seg" onChange=${function (v) { up({ sweet: v }); }} />
      <${D.ChoicePills} label="Cup flair" options=${FLAIR_OPTS} value=${c.flair} className="mode-pills" onChange=${function (v) { up({ flair: v }); }} />
    <//>`;
  }

  function BagDrawer(p) {
    var items = p.items;
    var cS = useState(false), confirmClear = cS[0], setConfirmClear = cS[1];
    useEffect(function () { if (!p.open) setConfirmClear(false); }, [p.open]);
    var groups = [], gi = {};
    items.forEach(function (it) {
      var k = [it.id, it.ice, it.sweet, it.cupName, it.flair].join('|');
      if (gi[k] == null) { gi[k] = groups.length; groups.push({ k: k, it: it, keys: [] }); }
      groups[gi[k]].keys.push(it.key);
    });
    var full = items.length >= MAX_CUPS;
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} className="checkout-drawer" title="Build your cup" step="Step 1 of 3"
      footer=${items.length ? html`<div className="drawer-stack" style=${{ gap: 12 }}>
        <div className="sum-row"><span>Estimated subtotal</span><span>${subtotalText(items)}</span></div>
        ${p.ready ? html`<div className="method-summary">
            <span className="method-summary-icon" aria-hidden="true"><${D.Doodle} name=${p.modeIcon} size=${22} /></span>
            <span className="method-summary-text"><b>${p.modeName}</b><span>${p.slot}</span></span>
            <button type="button" className="text-btn" onClick=${p.onNext}>Change</button>
          </div>
          <${D.Button} variant="primary" size="lg" icon="sparkle" block=${true} onClick=${p.onReview}>Review my order<//>`
        : html`<${D.Button} variant="primary" size="lg" block=${true} onClick=${p.onNext}>${p.saved ? 'Finish my delivery details' : 'Next: delivery or pickup'}<//>`}</div>` : null}>
      ${items.length ? html`<${R.Fragment}><ul className="bag-list">${groups.map(function (g) {
        var it = g.it, q = g.keys.length;
        return html`<li key=${g.keys[0]} className="bag-item">
          <${D.CupPreview} width=${56} name=${it.cupName || 'DA JU'} charm=${it.flair} className=${cupClass(it.id)} alt="" />
          <div>
            <h3>${it.name}</h3>
            <p>Ice ${it.ice.toLowerCase()} · sweetness ${it.sweet.toLowerCase()} · ${FLAIR[it.flair]}</p>
            ${it.cupName ? html`<p className="cupname">${it.cupName}</p>` : null}
            <p style=${{ fontVariantNumeric: 'tabular-nums' }}>${it.price == null ? priceText(null) + (q > 1 ? ' each' : '') : 'RM ' + (it.price * q).toFixed(2)}</p>
            <div className="bag-qty stepper" role="group" aria-label=${'Number of ' + it.name + (it.cupName ? ' "' + it.cupName + '"' : '')}>
              <button type="button" className="step-btn" aria-label=${q > 1 ? 'One fewer' : 'Remove ' + it.name} onClick=${function () { p.onRemove(g.keys[g.keys.length - 1]); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
              <output aria-live="polite">${q}</output>
              <button type="button" className="step-btn" aria-label="One more" disabled=${full} onClick=${function () { p.onMore(it); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label=${'Remove ' + (q > 1 ? 'all ' + q + ' ' : '') + it.name} onClick=${function () { p.onRemoveMany(g.keys); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </li>`;
      })}</ul>
      ${full ? html`<p className="fine">That's ${MAX_CUPS} cups, the most we can take in one order.</p>` : null}
      <${D.Button} variant="ghost" className="bag-clear" onClick=${function () { if (!confirmClear) { setConfirmClear(true); return; } setConfirmClear(false); p.onClear(); }}>${confirmClear ? 'Tap again to empty your bag' : 'Clear bag'}<//>
      <//>` : html`<div className="empty">
        <${D.Doodle} name="bag" size=${48} />
        <p className="body p0">Your bag is empty. Pick a matcha and make it yours.</p>
        <${D.Button} variant="sticker" icon="sparkle" onClick=${p.onBrowse}>Browse the menu<//>
      </div>`}
    <//>`;
  }

  function FulfillFields(p) {
    var f = p.f, set = p.set, tried = p.tried, err = p.err;
    var sched = D.schedule[f.mode][f.day];
    var slot = f.mode === 'PICK_UP' ? sched.location + ' · ' + sched.time : f.mode === 'GRAB_EXPRESS' ? sched.label + ' ' + sched.time : sched.time + ' · ' + sched.area.replace(/ \| /g, ', ');
    var now = p.now, popup = f.mode === 'PICK_UP' ? f.popup : null;
    /* #11: weekday lunch pre-orders close at 12:30 PM (when pickup starts); weekend Grab Express dispatch ends at 4:00 PM */
    var weekdayMissed = !popup && f.day === 'weekday' && !isWeekend(now) && mins(now) >= LUNCH_CUTOFF && f.mode !== 'COD';
    var weekendGrabMissed = f.mode === 'GRAB_EXPRESS' && f.day === 'weekend' && isWeekend(now) && mins(now) >= WEEKEND_GRAB_END;
    var codOther = f.mode === 'COD' && f.zone === 'OTHER';
    if (popup) slot = 'Pop-up stall · ' + popup.venue + ' · ' + popup.days + ', ' + popup.time;
    return html`<${R.Fragment}>
      ${p.showMode ? html`<${D.ChoicePills} label="Fulfillment" options=${MODE_OPTS} value=${f.mode} className="mode-pills" onChange=${function (v) { set({ mode: v }); }} />` : null}
      <${D.ChoicePills} variant="segmented" label="When" options=${DAY_OPTS} value=${f.day} className="full-seg" onChange=${function (v) { set({ day: v }); }} />
      <p className="slot-line"><${D.Doodle} name="clock" size=${20} />${slot}</p>
      ${weekdayMissed ? html`<${D.Notice} tone="info" title=${"Today's lunch window has closed"}
          action=${html`<${D.Button} variant="secondary" icon="car" onClick=${function () { set({ mode: 'COD' }); }}>Switch to COD tonight<//>`}>
          It's ${clock(now)} in KK. Pre-orders for today's 12:30 PM – 1:25 PM window closed at 12:30 PM, so this order will go to the next weekday window. Or switch to Weekday COD (after 6:30 PM).<//>` : null}
      ${weekendGrabMissed ? html`<${D.Notice} tone="info" title=${"Today's Grab Express window has closed"}>
          It's ${clock(now)} in KK, after the 9:00 AM – 4:00 PM weekend dispatch window. ${dow(now) === 6 ? "We'll send it in tomorrow's window." : "We'll send it in next weekend's window, or pick Weekdays for a lunchtime Grab."}<//>` : null}
      ${popup ? html`<${D.Notice} tone="availability" title=${'Pickup at our pop-up stall'}
          action=${html`<${D.Button} variant="secondary" onClick=${function () { set({ popup: null }); }}>Pick up at ${sched.location} instead<//>`}>
          Collect your cups at the DAJU stall at ${popup.venue}, ${popup.place} (${popup.days}, ${popup.time}). Show your ticket and skip the queue.<//>` : null}

      ${f.mode === 'PICK_UP' && f.day === 'weekend' && !popup ? html`
        <${D.Notice} tone="availability" title="Pending time confirmation">Weekend pickups at Maang Apartment are by arrangement. Tell us a time and we'll confirm or suggest another.<//>
        <${D.TextField} label="Preferred pickup time" required=${true} placeholder="e.g. Saturday, 3:00 PM" value=${f.prefTime} error=${tried ? err.prefTime : undefined}
          onChange=${function (e) { set({ prefTime: e.target.value }); }} />` : null}

      ${f.mode === 'GRAB_EXPRESS' && f.day === 'weekend' ? html`
        <${D.ChoicePills} label="Dispatch window (9:00 AM – 4:00 PM)" className="window-pills" options=${GRAB_WEEKEND} value=${f.grabWindow} onChange=${function (v) { set({ grabWindow: v }); }} />` : null}

      ${f.mode === 'COD' ? html`
        <${D.ZonePicker} value=${f.zone} onChange=${function (z) { set({ zone: z }); }} onSwitchToGrab=${function () { set({ mode: 'GRAB_EXPRESS' }); }} />
        ${tried && err.zone ? html`<p className="dj-field-error" role="alert"><${D.Doodle} name="sparkle" size=${16} />${err.zone}</p>` : null}
        ${f.day === 'weekend' ? html`<${D.Notice} tone="availability">Weekend COD is based on order & availability. We'll confirm before dispatch.<//>` : null}` : null}

      ${f.mode !== 'PICK_UP' && !codOther ? html`
        <${D.TextField} label=${f.mode === 'COD' ? 'Exact drop-off address' : 'Delivery address'} required=${true} multiline=${true} rows=${2} autoComplete="street-address"
          placeholder="Street, building, unit" value=${f.address} error=${tried ? err.address : undefined} onChange=${function (e) { set({ address: e.target.value }); }} />
        <${D.TextField} label="Address notes" hint="Optional. A landmark helps the rider." placeholder="Blue gate, beside the bakery" value=${f.notes} onChange=${function (e) { set({ notes: e.target.value }); }} />` : null}

      ${f.mode === 'GRAB_EXPRESS' ? html`<${D.FeeAck} checked=${f.feeAck} onChange=${function (v) { set({ feeAck: v }); }} error=${tried && !!err.feeAck} />` : null}

      <${D.TextField} label="Your name" required=${true} autoComplete="name" placeholder="Aina" value=${f.customer} error=${tried ? err.customer : undefined} onChange=${function (e) { set({ customer: e.target.value }); }} />
      <${D.TextField} label="WhatsApp number" required=${true} type="tel" inputMode="tel" autoComplete="tel" placeholder="012-345 6789" hint="We confirm your order here." value=${f.phone} error=${tried ? err.phone : undefined} onChange=${function (e) { set({ phone: e.target.value }); }} />
    <//>`;
  }

  function FulfillDrawer(p) {
    var f = p.f, set = p.setF, tried = p.tried, err = p.errors;
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} className="checkout-drawer" title="Delivery or pickup" step="Step 2 of 3"
      footer=${html`<div className="drawer-stack" style=${{ gap: 10 }}>
        ${tried && Object.keys(err).length ? html`<p className="fine" style=${{ color: 'var(--alert)', fontWeight: 600 }} role="alert">Fix the highlighted ${Object.keys(err).length === 1 ? 'field' : 'fields'} to see your ticket.</p>` : null}
        <${D.Button} variant="primary" size="lg" block=${true} disabled=${f.mode === 'COD' && f.zone === 'OTHER'} onClick=${p.onNext}>Review ticket<//>
        <${D.Button} variant="ghost" block=${true} onClick=${p.onBack}>Back to bag<//></div>`}>
      <${FulfillFields} f=${f} set=${set} tried=${tried} err=${err} now=${p.now} showMode=${true} />
    <//>`;
  }

  function TicketDrawer(p) {
    var s = useState(false), showRaw = s[0], setRaw = s[1];
    var ta = useRef(null);
    var bz = useState(false), busy = bz[0], setBusy = bz[1];
    useEffect(function () { if (!p.open) setRaw(false); }, [p.open]);
    useEffect(function () { if (showRaw && ta.current) { ta.current.focus(); ta.current.select(); } }, [showRaw]);
    usePreparedTicket(p.order, p.open);
    var text = orderMessage(p.order);
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} className="checkout-drawer" title="Here’s your receipt" step="Step 3 of 3"
      footer=${html`<div className="drawer-stack" style=${{ gap: 10 }}>
        <${D.Button} variant="primary" size="lg" icon="bubble" block=${true} href=${'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text)} target="_blank" rel="noopener">Send via WhatsApp<//>
        <${D.Button} variant="sticker" block=${true} icon="sparkle" disabled=${busy} onClick=${function () { if (busy) return; setBusy(true); shareTicketImage(p.order, text, p.toast).then(function () { setBusy(false); }); }}>${busy ? 'Making your ticket image…' : 'Share ticket as image'}<//>
        <${D.Button} variant="secondary" block=${true} onClick=${function () { copyText(text, function () { p.toast('Ticket copied'); }, function () { setRaw(true); }); }}>Copy ticket text<//>
        <${D.Button} variant="ghost" block=${true} onClick=${p.onBack}>Edit details<//></div>`}>
      <div className="ticket-center"><${D.OrderTicket} ...${p.order} /></div>
      <p className="fine">Send via WhatsApp opens the chat with this ticket typed in. Prefer a picture? Share ticket as image sends it as a PNG from your phone\'s share menu (pick WhatsApp, then the DAJU chat, ${WA_DISPLAY}). We\'ll reply to confirm your slot.</p>
      ${showRaw ? html`<div style=${{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="dj-field-label" htmlFor="raw-ticket">Ticket text (selected, copy it from here)</label>
        <textarea id="raw-ticket" ref=${ta} className="copy-fallback" readOnly=${true} value=${text}></textarea></div>` : null}
    <//>`;
  }

  /* ---------- Bottom tab bar (phones) ---------- */
  /* Pages (one file, three views): which page each section lives on */
  var PAGE_OF = { home: 'home', top: 'home', drop: 'home', assembly: 'home', lineup: 'home', follow: 'home', skip: 'home',
    menu: 'menu', studio: 'menu', order: 'menu', ticket: 'menu', visit: 'visit', popups: 'visit', contact: 'visit' };
  function hashId() { try { return decodeURIComponent((location.hash || '').slice(1)) || 'home'; } catch (e) { return 'home'; } }
  var PAGES = [['home', 'Home', 'sparkle'], ['menu', 'Menu', 'whisk'], ['visit', 'Visit', 'pin']];
  /* Sliding highlight under the current page link: measures the active link and moves one shared pill to it,
     so tapping Home / Menu / Visit glides the highlight across instead of jumping. */
  function useGlide(page, activeSel) {
    var ref = useRef(null);
    R.useLayoutEffect(function () {
      var nav = ref.current; if (!nav) return;
      function place() {
        var a = nav.querySelector(activeSel); if (!a) return;
        nav.style.setProperty('--gx', a.offsetLeft + 'px');
        nav.style.setProperty('--gw', a.offsetWidth + 'px');
      }
      place();
      if (!nav.classList.contains('glide-ready')) requestAnimationFrame(function () { nav.classList.add('glide-ready'); });  /* no slide on first paint */
      window.addEventListener('resize', place);
      return function () { window.removeEventListener('resize', place); };
    }, [page]);
    return ref;
  }
  function TabBar(p) {
    var ref = useGlide(p.page, '.tab.is-here');
    return html`<nav className="tabbar fx-tabbar" aria-label="Pages" ref=${ref}>
      <span className="glide glide-tab" aria-hidden="true"></span>
      ${PAGES.map(function (t) {
        var here = p.page === t[0];
        return html`<a key=${t[0]} href=${'#' + t[0]} className=${'tab' + (here ? ' is-here' : '')} aria-current=${here ? 'page' : undefined}><${D.Doodle} name=${t[2]} size=${24} />${t[1]}</a>`;
      })}
    </nav>`;
  }
  /* Top bar: logo, page links, and an Order button that always shows how many cups are in the bag */
  function Header(p) {
    /* Hides when the visitor scrolls down, and comes straight back on even a small scroll up. */
    var hidS = useState(false), hidden = hidS[0], setHidden = hidS[1];
    var glideRef = useGlide(p.page, 'a.is-on');
    useEffect(function () {
      var last = window.scrollY, ticking = false;
      function check() {
        ticking = false;
        var y = Math.max(0, window.scrollY), dy = y - last;
        if (y < 80) setHidden(false);                 /* always shown near the top of the page */
        else if (dy > 6) setHidden(true);             /* scrolling down */
        else if (dy < -3) setHidden(false);           /* a tiny scroll up brings it back */
        if (Math.abs(dy) > 3) last = y;
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
      window.addEventListener('scroll', onScroll, { passive: true });
      return function () { window.removeEventListener('scroll', onScroll); };
    }, []);
    useEffect(function () { setHidden(false); }, [p.page]);
    return html`<header className=${'fx-head' + (hidden ? ' is-hidden' : '')}>
      <div className="fx-head-row">
        <a className="fx-brand" href="#home" aria-label="DA JU home"><${D.Wordmark} size="sm" /></a>
        <nav className="fx-links" aria-label="Pages" ref=${glideRef}>
          <span className="glide glide-link" aria-hidden="true"></span>
          ${PAGES.map(function (t) { return html`<a key=${t[0]} href=${'#' + t[0]} className=${p.page === t[0] ? 'is-on' : ''} aria-current=${p.page === t[0] ? 'page' : undefined}>${t[1]}</a>`; })}
        </nav>
        <button type="button" className="fx-order" onClick=${p.onBag} aria-label=${'Order bag, ' + p.count + (p.count === 1 ? ' item' : ' items')}>
          <${D.Doodle} name="bag" size=${18} /><span>Bag</span><span className="fx-order-n">${p.count}</span>
        </button>
      </div>
    </header>`;
  }

  /* ---------- App ---------- */
  /* Checkout pop-up on phones: drag down from the top (the handle / title area) to close it.
     The pop-up has no X button any more; tapping outside it also closes it (the scrim does that). */
  function useSwipeToClose() {
    useEffect(function () {
      var sheet = null, scrim = null, head = null, y0 = 0, t0 = 0, dy = 0, h = 1, dragging = false;
      function start(e) {
        var hd = e.target.closest && e.target.closest('.dj-drawer-bottom .dj-drawer-head');
        if (!hd) return;
        head = hd; sheet = hd.closest('.dj-drawer'); scrim = sheet.closest('.dj-drawer-scrim');
        y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; h = sheet.offsetHeight || 1; dragging = false;
      }
      function move(e) {
        if (!sheet) return;
        dy = Math.max(0, e.touches[0].clientY - y0);
        if (!dragging && dy > 2) {
          dragging = true;
          /* the open animation must not fight the finger: freeze it and follow the touch 1:1 */
          sheet.style.animation = 'none'; sheet.style.transition = 'none';
          if (scrim) { scrim.style.animation = 'none'; scrim.style.transition = 'none'; }
        }
        if (!dragging) return;
        sheet.style.transform = 'translate3d(0,' + dy + 'px,0)';
        if (scrim) scrim.style.backgroundColor = 'rgb(22 58 30 / ' + (0.45 * Math.max(0, 1 - dy / h)).toFixed(3) + ')';
        if (e.cancelable) e.preventDefault();
      }
      function end() {
        if (!sheet) return;
        var s = sheet, sc = scrim, hd = head, wasDrag = dragging;
        var v = dy / Math.max(1, Date.now() - t0), close = dy > Math.min(120, h * 0.25) || (dy > 30 && v > 0.6);
        sheet = null; scrim = null; head = null; dragging = false;
        if (!wasDrag) return;
        var ease = 'cubic-bezier(.2,.8,.2,1)';
        if (close) {
          /* keep going down from where the finger let go, fade the backdrop, then close for real */
          var ms = Math.round(Math.max(140, Math.min(260, (h - dy) / Math.max(v, 1.2))));
          s.style.transition = 'transform ' + ms + 'ms ' + ease;
          s.style.transform = 'translate3d(0,' + (h + 40) + 'px,0)';
          if (sc) { sc.style.transition = 'background-color ' + ms + 'ms linear'; sc.style.backgroundColor = 'rgb(22 58 30 / 0)'; }
          setTimeout(function () {
            /* the pop-up is already off-screen: skip the usual close animation so it can't jump back */
            s.style.opacity = '0'; if (sc) sc.style.opacity = '0';
            var btn = hd.querySelector('.dj-drawer-close'); if (btn) btn.click();
          }, ms);
        } else {
          s.style.transition = 'transform .24s ' + ease;
          s.style.transform = 'translate3d(0,0,0)';
          if (sc) { sc.style.transition = 'background-color .24s linear'; sc.style.backgroundColor = ''; }
        }
      }
      document.addEventListener('touchstart', start, { passive: true });
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', end); document.addEventListener('touchcancel', end);
      return function () {
        document.removeEventListener('touchstart', start); document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', end); document.removeEventListener('touchcancel', end);
      };
    }, []);
  }

  function App() {
    useSwipeToClose();
    var now0 = myt();
    var boot = useRef(null); if (!boot.current) boot.current = loadSaved();   /* what this visitor had before a reload */
    var B = boot.current;
    var nowS = useState(now0), now = nowS[0], setNow = nowS[1];
    var refS = useState(function () { return /^[A-Z0-9]{4}$/.test(B.ref || '') ? B.ref : refCode(); }), refC = refS[0];
    var bagS = useState(function () {
      return (Array.isArray(B.bag) ? B.bag : []).filter(function (it) { return it && MENU.some(function (m) { return m.id === it.id; }); }).slice(0, MAX_CUPS)
        .map(function (it) { var m = drinkById(it.id); return Object.assign({}, it, { name: m.name, price: m.price }); });   /* names and prices always come from today's menu */
    }), bag = bagS[0], setBag = bagS[1];
    var studioS = useState(function () {
      var d = { drink: WEEKLY.id, qty: 1, mode: 'same', active: 0, eachEdited: false, cups: [{ name: '', ice: 'Normal', sweet: 'Normal', flair: 'butterfly' }] };
      var x = B.studio; return x && Array.isArray(x.cups) && x.cups.length && x.qty >= 1 && x.qty <= MAX_CUPS ? Object.assign(d, x) : d;
    }), studio = studioS[0], setStudio = studioS[1];
    var stepS = useState('pick'), orderStep = stepS[0], setOrderStep = stepS[1];
    var savedS = useState(!!B.saved), saved = savedS[0], setSaved = savedS[1];
    var secTriedS = useState(false), secTried = secTriedS[0], setSecTried = secTriedS[1];
    var flashS = useState(0), flash = flashS[0], setFlash = flashS[1];
    var burstS = useState(0), burst = burstS[0], setBurst = burstS[1];
    var fS = useState(function () {
      var d = { mode: 'PICK_UP', day: isWeekend(now0) ? 'weekend' : 'weekday', zone: null, address: '', notes: '', prefTime: '', grabWindow: GRAB_WEEKEND[0], feeAck: false, customer: '', phone: '', popup: null };
      var x = B.f && typeof B.f === 'object' ? B.f : {}, out = Object.assign({}, d);
      Object.keys(d).forEach(function (k) { if (x[k] != null && typeof x[k] === typeof d[k]) out[k] = x[k]; });
      if (x.zone && D.codZones.concat(['OTHER']).indexOf(x.zone) >= 0) out.zone = x.zone;
      if (x.popup && x.popup.venue && popLive(x.popup, now0)) out.popup = x.popup;
      if (!D.schedule[out.mode] || ['weekday', 'weekend'].indexOf(out.day) < 0) { out.mode = d.mode; out.day = d.day; }
      return out;
    }), f = fS[0], setFRaw = fS[1];
    var day = f.day;   /* #42: one day setting shared by Step 1 and Step 2 */
    var drawerS = useState(null), drawer = drawerS[0], setDrawer = drawerS[1];
    var custS = useState(null), custItem = custS[0], setCustItem = custS[1];
    var triedS = useState(false), tried = triedS[0], setTried = triedS[1];
    var toastS = useState(''), toast = toastS[0], setToast = toastS[1];
    var toastOutS = useState(false), toastOut = toastOutS[0], setToastOut = toastOutS[1];
    var layerS = useState(5), layer = layerS[0], setLayer = layerS[1];
    var progS = useState(1), progress = progS[0], setProgress = progS[1];

    var pageS = useState(function () { return PAGE_OF[hashId()] || 'home'; }), page = pageS[0], setPage = pageS[1];
    /* Which way the new page glides in: from the right when moving to a tab further right (Home → Menu → Visit), from the left when going back */
    var prevPage = useRef(page), glideDir = useRef('');
    if (prevPage.current !== page) {
      var order = PAGES.map(function (t) { return t[0]; });
      glideDir.current = order.indexOf(page) > order.indexOf(prevPage.current) ? ' glide-in-right' : ' glide-in-left';
      prevPage.current = page;
    }
    var narrow = useMedia('(max-width: 720px)');
    var reduce = useMedia('(prefers-reduced-motion: reduce)');
    var pinned = false;  /* this layout shows the cup story as a normal section (it builds once when it scrolls into view) */
    var side = narrow ? 'bottom' : 'right';

    var storyDone = useRef(false), heroRef = useRef(null), secRef = useRef(null), stickRef = useRef(null), toastT = useRef(null), toastT2 = useRef(null);
    var keyN = useRef(bag.reduce(function (m, it) { return Math.max(m, +it.key || 0); }, 0));
    var closeT = useRef(0), switchT = useRef(0), switchTok = useRef(0), saveT = useRef(0);
    useEffect(function () { storeSaved({ ref: refC, bag: bag, studio: studio, f: f, saved: saved }); }, [refC, bag, studio, f, saved]);
    useEffect(function () { return function () { clearTimeout(closeT.current); clearTimeout(switchT.current); clearTimeout(saveT.current); }; }, []);

    useEffect(function () { var t = setInterval(function () { setNow(myt()); }, 30000); return function () { clearInterval(t); }; }, []);
    useEffect(function () { document.body.classList.toggle('is-locked', !!drawer); }, [drawer]);
    useEffect(function () { document.body.classList.toggle('has-bag', bag.length > 0); }, [bag.length]);

    /* scroll choreography: whisk figure-eight (Ch.1) and the pinned cup assembly (Ch.2) */
    useEffect(function () {
      if (pinned) setLayer(1); else { setLayer(5); setProgress(1); }
      var raf = 0;
      function tick() {
        raf = 0;
        var hero = heroRef.current;
        if (hero && !reduce) {
          var hr = hero.getBoundingClientRect(), hp = Math.max(0, Math.min(1, -hr.top / Math.max(1, hr.height)));
          var a = hp * Math.PI * 2;
          hero.style.setProperty('--wr', (Math.sin(a) * 28).toFixed(1) + 'deg');
          hero.style.setProperty('--wx', (Math.sin(a) * 14).toFixed(1) + 'px');
          hero.style.setProperty('--wy', (Math.sin(a * 2) * 8).toFixed(1) + 'px');
        }
        var sec = secRef.current, st = stickRef.current, lastY = prevY; prevY = window.scrollY;
        if (pinned && sec && st) {
          var r = sec.getBoundingClientRect(), total = sec.offsetHeight - st.offsetHeight;
          var top0 = narrow ? 0 : 64, pr = Math.max(0, Math.min(1, (top0 - r.top) / Math.max(1, total)));
          /* Hold the screen on this section until the Matcha of the Week story has played to the RM8.99 tag:
             scrolling down stops at the tag's spot and the cards keep playing; scrolling up is always free. */
          var stopAt = Math.ceil(total * BOOM_AT) + 2, hold = Math.round(window.scrollY + r.top - top0) + stopAt;
          holdY = storyDone.current ? -1 : hold;
          /* Phones: a native snap stop at the price-tag spot catches even a long, gliding swipe (scrolling code can't
             stop the glide on iPhone, and fighting it makes the page jump). Switched on only while the story is
             unfinished; with no resting spot past the tag, the page simply can't go further until it pops. */
          var stopKey = total + ':' + pad + ':' + top0;
          if (stopKey !== lastStops) {   /* only re-placed when the layout changes, not on every frame */
            lastStops = stopKey;
            var stops = sec.querySelectorAll('.story-stop');
            for (var k = 0; k < stops.length; k++) {
              /* resting spots for each cup layer and story card, then the price-tag spot (the only one you can't glide past) */
              var at = k < stops.length - 1 ? Math.round(total * STOP_AT[k]) : stopAt;
              stops[k].style.top = (at + pad) + 'px'; stops[k].style.scrollMarginTop = top0 + 'px';
            }
          }
          var inSec = r.top <= top0 + 2 && r.bottom > 0;
          setBlocking(holdY >= 0 && inSec);
          if (holdY >= 0) startPoll(); else stopPoll();
          document.documentElement.classList.toggle('story-snap', holdY >= 0 && input === 'touch' && inSec);
          if (holdY >= 0 && input !== 'touch' && input !== 'tap' && window.scrollY > holdY + 1 && r.top <= top0 + 1 && Date.now() - userAt < 1600 && lastY <= holdY + 2) { window.scrollTo({ top: holdY, behavior: 'instant' }); prevY = holdY; pr = BOOM_AT; }
          setProgress(pr);
          setLayer(Math.min(5, 1 + Math.floor((pr / BUILD_END) * 5.2)));
        }
      }
      function on() { if (!raf) raf = requestAnimationFrame(tick); }
      var holdY = -1, ty = 0, userAt = 0, input = '', prevY = window.scrollY;  /* only hold for the visitor's own scrolling, never for menu/tab jumps */
      var pad = 0, lastStops = '';
      function measure() { pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0; }   /* read once, and again on resize */
      function onResize() { measure(); on(); }
      function holding() { return pinned && holdY >= 0 && !storyDone.current && Math.abs(window.scrollY - holdY) <= 3; }
      /* Passive listeners only note what kind of scrolling the visitor is doing; they never block it */
      function onKey(e) { if (/^(ArrowDown|PageDown|End| |Spacebar)$/.test(e.key)) { userAt = Date.now(); input = 'key'; } }
      function onWheel() { userAt = Date.now(); input = 'wheel'; }
      function onTouchStart(e) { ty = e.touches[0].clientY; input = 'tap'; userAt = Date.now(); }  /* a tap (tab or link) isn't a swipe */
      function onTouchMove(e) { userAt = Date.now(); if (input !== 'touch') { input = 'touch'; on(); } }
      /* The blocking listeners (the story hold) are only attached while the pinned section is on screen and the story
         isn't finished. Everywhere else on the page, scrolling has no non-passive listener at all. */
      function blockWheel(e) { if (e.deltaY > 0 && holding()) e.preventDefault(); }
      function blockTouch(e) { var y = e.touches[0].clientY, up = y > ty; ty = y; if (!up && holding()) e.preventDefault(); }
      var blocking = false;
      function setBlocking(v) {
        if (v === blocking) return; blocking = v;
        if (v) { window.addEventListener('wheel', blockWheel, { passive: false }); window.addEventListener('touchmove', blockTouch, { passive: false }); }
        else { window.removeEventListener('wheel', blockWheel); window.removeEventListener('touchmove', blockTouch); }
      }
      /* while holding, re-check every 120ms so the page lets go as soon as the price tag pops (no timer otherwise) */
      var poll = 0;
      function startPoll() { if (!poll) poll = setInterval(function () { if (storyDone.current) on(); }, 120); }
      function stopPoll() { if (poll) { clearInterval(poll); poll = 0; } }
      /* a tap on a tab, link or button may jump the page: drop the resting spots first so the jump isn't caught */
      function onClick() { input = 'tap'; document.documentElement.classList.remove('story-snap'); }
      measure();
      window.addEventListener('wheel', onWheel, { passive: true }); window.addEventListener('keydown', onKey);
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true }); document.addEventListener('click', onClick, true);
      window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', onResize);
      tick();
      return function () { stopPoll(); setBlocking(false); window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); document.removeEventListener('click', onClick, true); window.removeEventListener('scroll', on); window.removeEventListener('resize', onResize); document.documentElement.classList.remove('story-snap'); if (raf) cancelAnimationFrame(raf); };
    }, [pinned, reduce, narrow]);

    function showToast(m) {
      setToast(m); setToastOut(false); clearTimeout(toastT.current); clearTimeout(toastT2.current);
      toastT2.current = setTimeout(function () { setToastOut(true); }, 2400);
      toastT.current = setTimeout(function () { setToast(''); setToastOut(false); }, 2620);
    }
    /* #7: one pending close at a time. Opening a drawer cancels a close that is still running, and anything that has to
       happen after the close (like scrolling) waits until the page is unlocked. */
    function openDrawer(name) {
      clearTimeout(closeT.current); closeT.current = 0;
      document.body.classList.remove('is-closing');
      setDrawer(name);
    }
    function closeDrawer(after) {
      clearTimeout(closeT.current);
      function done() { closeT.current = 0; document.body.classList.remove('is-closing'); setDrawer(null); if (after) setTimeout(after, 30); }
      if (reduce) { done(); return; }
      document.body.classList.add('is-closing');
      closeT.current = setTimeout(done, 200);
    }
    function setCup(o, quiet) {
      setStudio(function (st) {
        var i = st.qty > 1 && st.mode === 'each' ? st.active : 0;
        var cups = st.cups.slice(); cups[i] = Object.assign({}, cups[i], o);
        return Object.assign({}, st, { cups: cups, eachEdited: st.eachEdited || (st.qty > 1 && st.mode === 'each') });
      });
      if (!quiet) setBurst(function (n) { return n + 1; });
    }
    function setQty(n) {
      buzz();
      setStudio(function (st) {
        var cups = st.cups.slice(0, n);
        while (cups.length < n) cups.push(Object.assign({}, st.mode === 'each' ? cups[cups.length - 1] : st.cups[0]));
        return Object.assign({}, st, { qty: n, cups: cups, active: Math.min(st.active, n - 1) });
      });
    }
    function setStudioMode(m) {
      buzz();
      setStudio(function (st) {
        var cups = st.cups.slice();
        /* the first time, every cup starts from the shared choice; after that, cups you already customized keep their edits (#13) */
        if (m === 'each' && !st.eachEdited) cups = cups.map(function () { return Object.assign({}, st.cups[0]); });
        return Object.assign({}, st, { mode: m, cups: cups, active: 0 });
      });
    }
    function studioCups() {
      var out = []; for (var i = 0; i < studio.qty; i++) out.push(studio.mode === 'each' ? studio.cups[i] : studio.cups[0]);
      return out;
    }
    /* Going to a section: switch to its page first, then scroll there (a page name goes to the top of that page) */
    var goRef = useRef(null);
    goRef.current = function (id, smooth) {
      var pg = PAGE_OF[id] || 'home', changing = pg !== page;
      setPage(pg);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        var el = id === pg || id === 'top' ? null : document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: smooth && !changing && !reduce ? 'smooth' : 'auto', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'auto' });
      }); });
    };
    function scrollToId(id) {
      if (location.hash === '#' + id) goRef.current(id, true);
      else location.hash = id;   /* the hashchange listener below does the rest, and Back returns to the previous page */
    }
    useEffect(function () {
      function onHash() { goRef.current(hashId(), true); }
      window.addEventListener('hashchange', onHash);
      return function () { window.removeEventListener('hashchange', onHash); };
    }, []);
    /* a link to the section you are already on (same #hash) does not fire hashchange; catch those clicks too */
    useEffect(function () {
      function onClick(e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        var id = a.getAttribute('href').slice(1);
        if (id && location.hash === '#' + id) { e.preventDefault(); goRef.current(id, true); }
      }
      document.addEventListener('click', onClick);
      return function () { document.removeEventListener('click', onClick); };
    }, []);
    function setF(o) {
      setFRaw(function (x) {
        var n = Object.assign({}, x, o);
        if (o.mode && o.mode !== x.mode) {
          if (o.mode !== 'COD') n.zone = null;          /* #3: leaving COD drops the COD area ("Somewhere else" can't trap Grab) */
          if (o.mode !== 'PICK_UP' && !('popup' in o)) n.popup = null;
        }
        return n;
      });
    }
    function setDay(v) { setF({ day: v }); }
    function setMode(m) { setF({ mode: m }); buzz(); }
    /* Keep a method's header steady on screen while cards fold around it: every frame, scroll by
       however much the header moved, easing it toward the top of the screen. */
    var followRaf = useRef(0);
    function followHeader(m, dur) {
      cancelAnimationFrame(followRaf.current);
      var el = document.getElementById('station-' + m); if (!el) return;
      var navH = narrow ? 0 : 64, endY = navH + 12 + (parseFloat(getComputedStyle(document.documentElement).paddingTop) || 0);
      var startY = el.getBoundingClientRect().top, vh = window.innerHeight;
      if (startY < -vh || startY > vh * 1.5) startY = Math.max(-vh, Math.min(startY, vh * 1.5)); // far off screen: start one screen away, then glide
      var t0 = performance.now(), D2 = reduce ? 0 : dur;
      function stop() { cancelAnimationFrame(followRaf.current); off(); }
      function off() { window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop); }
      window.addEventListener('wheel', stop, { passive: true }); window.addEventListener('touchstart', stop, { passive: true }); window.addEventListener('keydown', stop);
      function ease(x) { return 1 - Math.pow(1 - x, 3); }
      function frame(now) {
        var e = document.getElementById('station-' + m); if (!e) return;
        var p = D2 ? Math.min(1, (now - t0) / D2) : 1;
        var want = startY + (endY - startY) * ease(p);
        var diff = e.getBoundingClientRect().top - want;
        if (Math.abs(diff) > 0.5) window.scrollTo({ top: window.scrollY + diff, behavior: 'instant' });
        if (p < 1) followRaf.current = requestAnimationFrame(frame); else off();
      }
      followRaf.current = requestAnimationFrame(frame);
    }
    function chooseMethod(m) {
      buzz(); setSecTried(false);
      var switching = orderStep === 'details' && m !== f.mode;
      if (switching) setOrderStep('closing');         // fold the open form; every card is a bar for a moment
      followHeader(m, switching ? 700 : 420);
      clearTimeout(switchT.current);
      var tok = ++switchTok.current;   /* #42: "Change method" (or another tap) cancels this, so the form can't reopen by itself */
      switchT.current = setTimeout(function () {
        switchT.current = 0; if (tok !== switchTok.current) return;
        setF({ mode: m });
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (tok === switchTok.current) setOrderStep('details'); }); });
      }, switching && !reduce ? 280 : 0);
    }
    function addItems(menuItem, list) {
      var room = MAX_CUPS - bag.length;   /* #13: "Up to 10 per order" is a real limit */
      if (room <= 0) { showToast('Your bag is full: ' + MAX_CUPS + ' cups is the most per order'); return 0; }
      if (list.length > room) { list = list.slice(0, room); setTimeout(function () { showToast('Added ' + room + (room === 1 ? ' cup' : ' cups') + '. Your bag is now full (' + MAX_CUPS + ' max)'); }, 0); }
      var its = list.map(function (c) { keyN.current += 1; return { key: keyN.current, id: menuItem.id, name: menuItem.name, price: menuItem.price, ice: c.ice, sweet: c.sweet, cupName: (c.name || '').trim(), flair: c.flair }; });
      setBag(function (b) { return b.concat(its); });
      setFlash(function (n) { return n + 1; });
      setBurst(function (n) { return n + 1; });
      buzz();
      return its.length;
    }

    var errors = {};
    if (!f.customer.trim()) errors.customer = 'Add your name so we can label the cup bag.';
    if (!f.phone.trim()) errors.phone = 'Add a WhatsApp number so we can confirm your order.';
    else if (!phoneOk(f.phone)) errors.phone = 'Check the number: a Malaysian mobile like 012-345 6789, or +country code for other countries.';
    var popup = f.mode === 'PICK_UP' && f.popup && popLive(f.popup, now) ? f.popup : null;
    if (f.mode === 'PICK_UP' && f.day === 'weekend' && !popup && !f.prefTime.trim()) errors.prefTime = 'Add a time so we can confirm or suggest another.';
    /* #3 / #9: the address is only required when its field is on screen (not for COD "Somewhere else") */
    if (f.mode !== 'PICK_UP' && !(f.mode === 'COD' && f.zone === 'OTHER') && !f.address.trim()) errors.address = 'Add the address the rider should bring your cup to.';
    if (f.mode === 'GRAB_EXPRESS' && !f.feeAck) errors.feeAck = true;
    if (f.mode === 'COD' && !f.zone) errors.zone = 'Pick your COD area.';
    if (f.mode === 'COD' && f.zone === 'OTHER') errors.zone = 'COD covers four areas only.';

    var sch = D.schedule[f.mode][f.day];
    var where = popup ? 'Pop-up stall: ' + popup.venue + ', ' + popup.place : f.mode === 'PICK_UP' ? sch.location : f.mode === 'COD' ? [f.address.trim(), f.zone && f.zone !== 'OTHER' ? f.zone : ''].filter(Boolean).join(', ') : f.address.trim();
    var when = popup ? popup.days + ', ' + popup.time : f.mode === 'PICK_UP' && f.day === 'weekend' ? (f.prefTime.trim() || 'Time by arrangement') + ' (pending time confirmation)'
      : f.mode === 'GRAB_EXPRESS' && f.day === 'weekend' ? f.grabWindow : sch.time;
    function ticketItems(items) {
      var out = [], idx = {};
      items.forEach(function (it) {
        var k = [it.name, it.ice, it.sweet, it.cupName, it.flair, it.price].join('|');
        if (idx[k] != null) { out[idx[k]].qty += 1; out[idx[k]].price = it.price == null ? '[RM price] each' : 'RM ' + (it.price * out[idx[k]].qty).toFixed(2); return; }
        idx[k] = out.length;
        out.push({ qty: 1, name: it.name, ice: it.ice, sweetness: it.sweet, cupName: it.cupName || undefined, flair: FLAIR[it.flair], price: priceText(it.price) });
      });
      return out;
    }
    var liveOrder = { orderRef: orderRef(now, refC), customer: f.customer.trim(), phone: f.phone.trim(), mode: f.mode, schedule: f.day === 'weekend' ? 'WEEKEND' : 'WEEKDAY',
      location: where, time: when, address: f.mode !== 'PICK_UP' ? f.notes.trim() : '', items: ticketItems(bag), feeAck: f.feeAck, subtotal: subtotalText(bag) };

    var studioDrink = drinkById(studio.drink);
    var studioItems = studioCups().map(function (c) { return { id: studioDrink.id, name: studioDrink.name, price: studioDrink.price, ice: c.ice, sweet: c.sweet, cupName: (c.name || '').trim(), flair: c.flair }; });
    var shown = bag.length ? bag : studioItems;
    var pageOrder = Object.assign({}, liveOrder, {
      customer: liveOrder.customer || '[Your name]', phone: liveOrder.phone || '[Your phone]',
      location: liveOrder.location || (f.mode === 'PICK_UP' ? sch.location : f.mode === 'COD' && f.zone === 'OTHER' ? '[Outside the COD areas]' : '[Your address]'),
      items: ticketItems(shown), subtotal: subtotalText(shown) });
    var detailsReady = saved && !Object.keys(errors).length;
    var detailsComplete = detailsReady && bag.length > 0;   /* #8: an empty bag is never a finished order */

    var slotLine = MODE_NAME[f.mode] + ' · ' + (popup ? 'Pop-up stall · ' + popup.venue + ' · ' : f.mode === 'PICK_UP' ? sch.location + ' · ' : '') + (f.mode === 'PICK_UP' && f.day === 'weekend' && !popup ? 'Time by arrangement' : when);

    return html`
      <div id="top">
        <${Header} page=${page} count=${bag.length} onBag=${function () { buzz(); openDrawer('bag'); }} />
        <main key=${page} className=${"fx-page" + glideDir.current}>
          ${page === 'home' ? html`<${R.Fragment}>
          <${Hero} narrow=${narrow} heroRef=${heroRef} onCustomize=${function (m) { setCustItem(m); openDrawer('custom'); }} />
          <${Ticker} />
          <${Assembly} narrow=${narrow} reduce=${reduce} pinned=${pinned} layer=${layer} setLayer=${setLayer} progress=${progress} doneRef=${storyDone} secRef=${secRef} stickRef=${stickRef} />
          <${Lineup} />
          <${Follow} />
          <${SkipBand} />
          <//>` : null}
          ${page === 'menu' ? html`<${R.Fragment}>
          <${Menu} narrow=${narrow} onCustomize=${function (m) { setCustItem(m); openDrawer('custom'); }} />
          <${Studio} narrow=${narrow} studio=${studio} setCup=${setCup} setQty=${setQty} setMode=${setStudioMode} setActive=${function (i) { setStudio(function (st) { return Object.assign({}, st, { active: i }); }); }} setDrink=${function (id) { setStudio(function (st) { return Object.assign({}, st, { drink: id }); }); }} burst=${burst} bagCount=${bag.length}
            onAdd=${function () { var l = studioCups(); if (l.length > MAX_CUPS - bag.length) { addItems(studioDrink, l); return; } var n = addItems(studioDrink, l); if (n) showToast(n === 1 ? 'Added to your bag' : 'Added ' + n + ' cups to your bag'); }} />
          <${Route} day=${day} setDay=${setDay} mode=${f.mode} saved=${saved} step=${orderStep} onChoose=${chooseMethod}
            onBack=${function () { buzz(); clearTimeout(switchT.current); switchTok.current++; followHeader(f.mode, 420); setOrderStep('pick'); }}
            f=${f} setF=${setF} tried=${secTried} errors=${errors} now=${now}
            onSave=${function () { setSecTried(true); if (Object.keys(errors).length) { buzz(); return; } setSaved(true); setOrderStep('pick'); setFlash(function (n) { return n + 1; }); showToast('Details saved to your ticket');
              /* #12: scroll once the form has folded away (320ms), so the ticket lands where it should */
              clearTimeout(saveT.current); saveT.current = setTimeout(function () { scrollToId('ticket'); }, reduce ? 0 : 340); }} />
          <${SignOff} order=${pageOrder} hasBag=${bag.length > 0} complete=${detailsComplete} flash=${flash} studioQty=${studio.qty} toast=${showToast}
            onDetails=${function () { chooseMethod(f.mode); }}
            onReview=${function () { openDrawer(detailsComplete ? 'ticket' : 'bag'); }}
            onAddStudio=${function () { addItems(studioDrink, studioCups()); openDrawer('bag'); }}
            onCopy=${function () { copyText(orderMessage(pageOrder), function () { showToast('Ticket copied'); }, function () { showToast('Copy is blocked here. Open your bag to select the text.'); }); }} />
          <//>` : null}
          ${page === 'visit' ? html`<${R.Fragment}>
          <${Visit} now=${now} onPreorder=${function (pu) {
            /* #4: pickup at the pop-up stall, not the usual Centre Point / Maang Apartment spot */
            setF({ mode: 'PICK_UP', popup: pu }); setOrderStep('pick');
            showToast('Pickup set to the ' + pu.venue + ' stall. Build your cup!'); scrollToId('studio');
          }} />
          <//>` : null}
        </main>
        <${Footer} />
        ${narrow ? html`<${TabBar} page=${page} count=${bag.length} onBag=${function () { buzz(); openDrawer('bag'); }} />` : null}
        ${bag.length && narrow && !drawer ? html`<${D.CheckoutBar} className="is-entering" count=${bag.length} total=${subtotalText(bag)} slot=${slotLine} onCheckout=${function () { openDrawer('bag'); }} />` : null}

        <${CustomizeDrawer} open=${drawer === 'custom'} item=${custItem} side=${side} room=${MAX_CUPS - bag.length} onClose=${function () { closeDrawer(); }}
          onAdd=${function (m, c, n) { var list = []; for (var i = 0; i < (n || 1); i++) list.push(c); var k = addItems(m, list); closeDrawer(); if (k && k === list.length) showToast(k === 1 ? 'Added to your bag' : 'Added ' + k + ' cups to your bag'); }} />
        <${BagDrawer} open=${drawer === 'bag'} side=${side} items=${bag} onClose=${function () { closeDrawer(); }}
          onRemove=${function (k) { setBag(function (b) { return b.filter(function (x) { return x.key !== k; }); }); }}
          onRemoveMany=${function (ks) { setBag(function (b) { return b.filter(function (x) { return ks.indexOf(x.key) < 0; }); }); }}
          onMore=${function (it) { addItems(drinkById(it.id), [{ ice: it.ice, sweet: it.sweet, name: it.cupName, flair: it.flair }]); }}
          onClear=${function () { setBag([]); showToast('Your bag is empty'); }}
          onBrowse=${function () { closeDrawer(function () { scrollToId('menu'); }); }}
          onNext=${function () { setTried(false); openDrawer('fulfill'); }}
          ready=${detailsComplete} saved=${saved} modeName=${MODE_NAME[f.mode]} modeIcon=${{ PICK_UP: 'bag', GRAB_EXPRESS: 'scooter', COD: 'car' }[f.mode]}
          slot=${(f.mode === 'PICK_UP' ? sch.location : where) + ' · ' + when}
          onReview=${function () { buzz(); openDrawer('ticket'); }} />
        <${FulfillDrawer} open=${drawer === 'fulfill'} side=${side} f=${f} setF=${setF} tried=${tried} errors=${errors} now=${now}
          onClose=${function () { closeDrawer(); }} onBack=${function () { openDrawer('bag'); }}
          onNext=${function () { setTried(true); if (!Object.keys(errors).length) { setSaved(true); openDrawer('ticket'); } }} />
        <${TicketDrawer} open=${drawer === 'ticket'} side=${side} order=${liveOrder} toast=${showToast}
          onClose=${function () { closeDrawer(); }} onBack=${function () { openDrawer('fulfill'); }} />
        <${Toast} msg=${toast} out=${toastOut} />
      </div>`;
  }

  /* #48: if anything in the page crashes, show a way to order on WhatsApp instead of a blank screen */
  function Boundary(props) { R.Component.call(this, props); this.state = { failed: false }; }
  Boundary.prototype = Object.create(R.Component.prototype);
  Boundary.prototype.constructor = Boundary;
  Boundary.getDerivedStateFromError = function () { return { failed: true }; };
  Boundary.prototype.componentDidCatch = function (err) { try { console.error(err); } catch (e) {} };
  Boundary.prototype.render = function () {
    if (!this.state.failed) return this.props.children;
    return html`<div className="noscript-card" role="alert">
      <p style=${{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>DA | JU</p>
      <p>Sorry, something went wrong on this page.</p>
      <p>You can still order: message us on WhatsApp with your drinks, name and pickup or delivery choice.</p>
      <p><a href=${'https://wa.me/' + WA_NUMBER} target="_blank" rel="noopener">Order on WhatsApp (${WA_DISPLAY})</a></p>
      <p><button type="button" onClick=${function () { try { sessionStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }}>Reload the page</button></p>
    </div>`;
  };

  /* ---------- Soft layout motion (FLIP) ----------
     Whenever the DOM changes, children of these containers that moved glide from their old spot (240ms),
     and newly added children fade and rise in (200ms). Nothing runs under prefers-reduced-motion.
     The scroll-driven cup story (#assembly) is left out: its frame-by-frame changes never trigger a measuring pass. */
  var FLIP_SEL = '.studio-form, .studio, .studio-add, .qty-row, .cup-tabs-wrap, .studio-cup-meta, .details-form, ' +
    '.dj-drawer-body, .drawer-stack, .bag-list, .dj-tk-meta, .dj-tk-items, .dj-ticket, .signoff-ticket, .btns, .dj-zones, .dj-fee, .dj-field, ' +
    '.hero-actions, .dj-notice-body, .play-row, .empty';
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  function startFlip() {
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var cache = new WeakMap(), ready = false, busy = false, active = 0;
    function kids() {
      var out = [];
      document.querySelectorAll(FLIP_SEL).forEach(function (c) { for (var i = 0; i < c.children.length; i++) out.push([c, c.children[i]]); });
      return out;
    }
    function rel(c, el) { var a = el.getBoundingClientRect(), b = c.getBoundingClientRect(); return { x: a.left - b.left + c.scrollLeft, y: a.top - b.top + c.scrollTop, w: a.width, h: a.height }; }
    function pinned(el) { var p = getComputedStyle(el).position; return p === 'sticky' || p === 'fixed'; }
    function snapshot() { kids().forEach(function (k) { if (k[1].isConnected) cache.set(k[1], { c: k[0], r: rel(k[0], k[1]) }); }); }
    function pass() {
      if (busy) return; busy = true;
      var reduce = mq && mq.matches;
      kids().forEach(function (k) {
        var c = k[0], el = k[1];
        if (el.offsetParent === null || pinned(el)) return;
        var prev = cache.get(el);
        if (el._flipIn) { cache.set(el, { c: c, r: rel(c, el) }); return; }   // let a fade-in finish
        var start = prev && prev.c === c ? prev.r : null;
        if (el._flip) { start = rel(c, el); el._flip.cancel(); el._flip = null; } // continue from where it is on screen
        var now = rel(c, el);
        if (!reduce && ready) {
          if (!start) {
            if (!el.classList.contains('no-flip')) {
              el._flipIn = el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE });
              active++; el._flipIn.onfinish = el._flipIn.oncancel = (function (e) { return function () { e._flipIn = null; active--; if (active <= 0) later(); }; })(el);
            }
          } else {
            var dx = start.x - now.x, dy = start.y - now.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              el._flip = el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: Math.min(320, 180 + Math.hypot(dx, dy) * 0.4), easing: EASE });
              active++; el._flip.onfinish = el._flip.oncancel = (function (e) { return function () { e._flip = null; active--; if (active <= 0) later(); }; })(el);
            }
          }
        }
        cache.set(el, { c: c, r: now });
      });
      busy = false;
    }
    var pending = false;
    var snapT = 0;
    function later() { clearTimeout(snapT); snapT = setTimeout(function () { if (!document.hidden && active <= 0) { active = 0; snapshot(); } }, 120); }
    var mo = new MutationObserver(function (recs) {
      var relevant = false;
      for (var i = 0; i < recs.length && !relevant; i++) { var t = recs[i].target, el = t.nodeType === 1 ? t : t.parentElement; if (!el || !el.closest || !el.closest('#assembly')) relevant = true; }
      if (!relevant || pending) return;
      pending = true; Promise.resolve().then(function () { pending = false; pass(); });
    });
    mo.observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'checked'] });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(snapshot, 150); });
    document.fonts && document.fonts.ready.then(snapshot);
    setTimeout(function () { snapshot(); ready = true; }, 600);
    /* re-measure after CSS transitions settle (folds, drawers) and after images load, instead of polling */
    document.addEventListener('transitionend', function (e) { var t = e.target; if (t && t.closest && !t.closest('#assembly')) later(); }, true);
    document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IMG') later(); }, true);
  }

  /* index.html may hold a pre-rendered first screen (see build.py). React replaces it; carry the
     hero's entrance animations over at the same point so they do not restart. */
  var rootEl = document.getElementById('root'), ANIM_SEL = '#drop .hero-cutout, #drop .draw path';
  var carry = [];
  function mount() {
    if (rootEl.firstChild && rootEl.querySelectorAll) {
      Array.prototype.forEach.call(rootEl.querySelectorAll(ANIM_SEL), function (el, i) {
        var a = el.getAnimations ? el.getAnimations() : []; carry[i] = a.length ? a[0].currentTime : null;
      });
    }
    var appRoot = ReactDOM.createRoot(rootEl);
    ReactDOM.flushSync(function () { appRoot.render(html`<${Boundary}><${App} /><//>`); });
    document.documentElement.classList.remove('has-shell');   /* the snapshot is gone, React owns the page now */
    Array.prototype.forEach.call(rootEl.querySelectorAll(ANIM_SEL), function (el, i) {
      var a = el.getAnimations ? el.getAnimations() : [];
      if (a.length && carry[i] != null) a[0].currentTime = carry[i];
    });
    /* FLIP starts after the hand-over, so swapping out the snapshot does not count as new content */
    if ('MutationObserver' in window && Element.prototype.animate) startFlip();
    /* #31: a link like /#menu or /#popups arrives before those sections exist; jump there once they do */
    var id = decodeURIComponent((location.hash || '').slice(1));
    if (id && id !== 'top' && id !== 'drop' && /^[\w-]+$/.test(id)) {
      requestAnimationFrame(function () { var t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' }); });
    }
  }
  /* #34: with a pre-rendered first screen, hand over to React as soon as that screen has painted once
     (no waiting for fonts, which load the same either way), so the buttons work straight away. */
  if (rootEl.firstChild && window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(mount, 0); });
  else mount();
})();
