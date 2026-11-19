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
    { id: 'latte', cat: 'Matcha', name: 'Matcha Latte', flavor: 'Latte', note: 'Earthy matcha, creamy comfort. Simple, smooth, soul-soothing.', price: null, status: 'available', photo: 'matcha-latte.jpg',
      imageAlt: 'Matcha Latte: bright green matcha swirling down into cold milk and ice, DA JU printed on the cup', tilt: 1 },
    { id: 'strawberry', cat: 'Matcha', name: 'Matcha Strawberry', flavor: 'Strawberry', note: 'Sweet strawberry, fruity and refreshing, under a layer of matcha.', price: null, status: 'available', photo: 'matcha-strawberry.jpg',
      imageAlt: 'Matcha Strawberry: green matcha on top of pink strawberry milk with a red strawberry layer at the bottom', tilt: -1 },
    { id: 'coconut', cat: 'Matcha', name: 'Matcha Coconut', flavor: 'Coconut', note: 'Refreshing coconut, smooth matcha, perfect balance. Light and creamy.', price: null, status: 'available', photo: 'matcha-coconut.jpg',
      imageAlt: 'Matcha Coconut: a layer of deep green matcha floating over clear coconut water and ice', tilt: 2 },
    { id: 'coffee-salt', cat: 'Coffee', name: 'Coffee Sea Salt', flavor: 'Sea Salt', note: 'Iced coffee under a thick salted cream cap, dusted with cinnamon.', price: null, status: 'available', photo: 'coffee-sea-salt.jpg',
      imageAlt: 'Coffee Sea Salt: iced coffee topped with a thick sea-salt cream and a dusting of cinnamon, DA JU written in marker', tilt: -1 },
    { id: 'coffee-latte', cat: 'Coffee', name: 'Coffee Latte', flavor: 'Latte', note: 'Smooth coffee and cold milk over ice. An easy everyday cup.', price: null, status: 'available', tilt: 1 }
  ];
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
  function myt() { var d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000); }
  function mins(d) { return d.getHours() * 60 + d.getMinutes(); }
  function isWeekend(d) { var g = d.getDay(); return g === 0 || g === 6; }
  function clock(d) { var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM'); }
  function statusNow(d) {
    var m = mins(d);
    if (isWeekend(d)) {
      if (m >= 540 && m < 960) return { state: 'open', label: 'Grab Express pickups now', time: 'until 4:00 PM' };
      return { state: 'soon', label: 'Weekend Pick Up: Maang Apartment', time: 'by arrangement' };
    }
    if (m < 750) return { state: 'open', label: 'Next Pick Up: Centre Point', time: '12:30 PM' };
    if (m < 805) return { state: 'open', label: 'Pick Up open: Centre Point', time: 'until 1:25 PM' };
    if (m < 1110) return { state: 'soon', label: 'Next: COD', time: 'after 6:30 PM' };
    return { state: 'open', label: 'COD out now', time: 'KK · Penampang · Putatan · Kepayan' };
  }
  function orderRef(d) { var mm = d.getMonth() + 1, dd = d.getDate(); return 'DJ-' + (mm < 10 ? '0' : '') + mm + (dd < 10 ? '0' : '') + dd + '-001'; }

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

  function buzz() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }

  function copyText(text, onDone, onFail) {
    try {
      navigator.clipboard.writeText(text).then(onDone, onFail);
    } catch (e) { onFail(); }
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
    function wrap(text, maxW) {
      var words = String(text).split(' '), lines = [], cur = '';
      words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
      if (cur) lines.push(cur); return lines;
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
        font('700 14px ' + MONO); wrap(r[1], IN - KEYW).forEach(function (ln, i) { txt(ln, PAD + KEYW, y + 11 + i * 21, C.ink); y += i ? 21 : 0; });
        y += 21;
      });
      y += 4; dash(y); y += 18;
      /* items */
      (o.items || []).forEach(function (it) {
        font('700 14px ' + MONO);
        var price = it.price || '', pw = price ? ctx.measureText(price).width + 10 : 0;
        if (price) txt(price, W - PAD, y + 11, C.ink, 'right');
        wrap((it.qty || 1) + '× ' + it.name, IN - pw).forEach(function (ln, i) { txt(ln, PAD, y + 11 + i * 21, C.ink); y += i ? 21 : 0; });
        y += 21;
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
  function ticketBlob(o) {
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return ready.then(function () {
      return new Promise(function (res, rej) { ticketCanvas(o).toBlob(function (b) { b ? res(b) : rej(new Error('no image')); }, 'image/png'); });
    });
  }
  /* Phone share sheet (pick WhatsApp) when the browser allows it; otherwise save the PNG so it can be attached in the chat */
  function shareTicketImage(o, text, toast) {
    var name = 'DAJU-ticket-' + String(o.orderRef || 'order').replace(/[^\w-]/g, '') + '.png';
    return ticketBlob(o).then(function (blob) {
      var file = null;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      var canShare = false;
      try { canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
      var shared = canShare
        ? navigator.share({ files: [file], text: text }).then(function () { return 'shared'; }, function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; })
        : Promise.resolve('failed');
      return shared.then(function (r) {
        if (r !== 'failed') return r;
        return saveBlob(blob, name).then(function (ok) {
          if (ok) toast('Ticket image saved. Attach it in the DAJU WhatsApp chat');
          else toast('Could not save the image here. Use Copy ticket text instead');
          return ok ? 'saved' : 'failed';
        });
      });
    }, function () { toast('Could not make the image. Use Copy ticket text instead'); return 'failed'; });
  }
  function saveBlob(blob, name) {
    var viaClaude = (window.claude && window.claude.use) ? window.claude.use('downloads') : Promise.resolve(null);
    return Promise.resolve(viaClaude).catch(function () { return null; }).then(function (dl) {
      if (dl) return dl.save({ filename: name, data: blob }).then(function () { return true; }, function () { return false; });
      try {
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
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
    if (!p.msg) return null;
    return html`<div className=${'toast' + (p.out ? ' is-leaving' : '')} role="status"><${D.Doodle} name="sparkle" size=${20} />${p.msg}</div>`;
  }

  /* ---------- Ch.1 ---------- */
  function Hero(p) {
    return html`
      <section id="drop" className="band hero" data-theme="forest" ref=${p.heroRef}>
        <span className="hero-float desk-only" style=${{ right: '6%', top: '14%' }} aria-hidden="true"><${D.Doodle} name="sparkle" size=${28} className="draw" /></span>
        <span className="hero-float desk-only" style=${{ left: '46%', bottom: '10%' }} aria-hidden="true"><${D.Doodle} name="arrow" size=${56} className="draw" /></span>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="hero-doodles">
              <${D.SpeechBubble} size=${p.narrow ? 100 : 150} tilt=${-14}>something special, every week<//>
              <span className="whisk" aria-hidden="true"><${D.Doodle} name="whisk" size=${p.narrow ? 70 : 92} className="draw" /></span>
              <${D.Doodle} name="sparkle" size=${36} className="draw" />
            </div>
            <${D.StickerHeadline} as="h1" size="xl">Matcha<br />of the week?<//>
            <div className="hero-actions">
              <${D.Button} variant="sticker" size="lg" icon="sparkle" onClick=${function () { p.onCustomize(WEEKLY); }}>Customize & add<//>
              <${D.Button} variant="secondary" size="lg" href="#order">How to order<//>
            </div>
          </div>
          <div className="hero-cup">
            <p className="editorial-md p0" style=${{ textTransform: 'uppercase', color: 'var(--heading)', letterSpacing: '0.32em' }}>Matcha</p>
            <p className="flavor-script" aria-hidden="true">Blue Sea Salt</p>
            <img className="hero-cutout" src="blue-sea-salt-cutout.png" width="433" height="521" alt=${PHOTO_ALT} />
            <div style=${{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
              <${D.Stamp} tone="forest" rotate=${-4}>Matcha of the Week<//>
              <span className="time" style=${{ color: 'var(--heading)' }}>${priceText(WEEKLY.price)}</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.2 ---------- */
  var LAYERS = ['Clear cup & DA JU', 'Ice drops in', 'Matcha swirls up', 'Sea-salt foam', 'Bow & butterflies'];
  var PINS = [[26, 47], [73, 41], [70, 78]];
  /* ---------- Matcha of the Week story (plays after the cup is built, inside the same pinned scroll) ---------- */
  var WEEKLY_PRICE = 'RM8.99';
  var BUILD_END = 0.24;                         /* share of the pinned scroll spent building the cup */
  var STORY = [
    { at: 0.34, kind: 'title' },
    { at: 0.45, n: 1, head: 'Every week,', body: 'we randomly pick one of our matcha creations to be your Matcha of the Week.', icon: 'whisk' },
    { at: 0.56, n: 2, head: 'And guess what?', body: 'price' , icon: 'sparkle' },
    { at: 0.67, n: 3, head: 'How do we pick?', body: 'Every week, we roll for your Matcha of the Week on our IG Stories.', icon: 'dice' }
  ];
  var STORY_SPAN = 0.11, BOOM_AT = 0.8;
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
      <span className="motw-icon" aria-hidden="true">${it.icon === 'dice' ? html`<${Dice} size=${26} />` : html`<${D.Doodle} name=${it.icon} size=${28} />`}</span>
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
        <span className="price-tag-kicker">Matcha of the Week</span>
        <span className="price-tag-price">${WEEKLY_PRICE}</span>
        <span className="price-tag-drink">${WEEKLY.name} · this week only</span>
      </div>
    </div>`;
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
    var pr = pinned ? (settled ? p.progress : Math.min(p.progress, BUILD_END)) : 1, story = pinned && settled && pr > BUILD_END + 0.06, boom = pinned && settled && pr >= BOOM_AT;
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
      <section id="assembly" className=${'assembly' + (pinned ? ' is-pinned' : '')} ref=${p.secRef} aria-labelledby="assembly-title">
        <div className="assembly-stick" ref=${p.stickRef}>
          <div className="wrap assembly-grid">
            <div className="assembly-title">
              <p className="caption eyebrow">Chapter 2 · Living cup assembly</p>
              <${D.StickerHeadline} size="lg" className="chapter-title"><span id="assembly-title">Watch it come together</span><//>
            </div>
            <div className="assembly-stage" ref=${stage}>
              <div className="stage-inner">
                <svg className="watercolor" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
                  <defs>
                    <filter id="wc-bleed" x="-30%" y="-30%" width="160%" height="160%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="n" />
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="38" xChannelSelector="R" yChannelSelector="G" result="d" />
                      <feGaussianBlur in="d" stdDeviation="7" result="b" />
                      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain" />
                      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1" result="g" />
                      <feComposite in="b" in2="g" operator="in" />
                    </filter>
                  </defs>
                  <g filter="url(#wc-bleed)">
                    <ellipse className="wc-a" cx="200" cy="215" rx="150" ry="135" />
                    <ellipse className="wc-b" cx="150" cy="150" rx="95" ry="80" />
                    <ellipse className="wc-c" cx="265" cy="275" rx="90" ry="70" />
                    <ellipse className="wc-d" cx="255" cy="135" rx="55" ry="45" />
                  </g>
                </svg>
                <div className=${'cup-wrap' + (story ? ' is-dim' : '')}><${D.CupPreview} width=${narrow ? 200 : 260} layers=${layer} name="DA JU" charm="both" alt=${'Illustrated Matcha Blue Sea Salt, layer ' + layer + ' of 5: ' + LAYERS[layer - 1]} /></div>
                ${pinned ? html`<div className="motw-stack" aria-hidden="true">
                  ${STORY.map(function (it, i) {
                    var t = clamp01((pr - it.at) / STORY_SPAN), last = i === STORY.length - 1;
                    var e = easeOut(clamp01(t / 0.35)), x = clamp01((t - 0.72) / 0.28);
                    if (last && pr < BOOM_AT) x = 0;
                    if (last && pr >= BOOM_AT) x = 1;
                    var op = e * (1 - x);
                    if (op <= 0.001) return null;
                    var st = { opacity: op, transform: 'translate(-50%, -50%) translateY(' + ((1 - e) * 36 - x * 80).toFixed(1) + 'px) scale(' + (0.12 + 0.88 * e + x * 0.06).toFixed(3) + ')' };
                    return html`<div key=${i} className="motw-item" style=${st}><${StoryCard} it=${it} /></div>`;
                  })}
                  <${PriceTag} on=${boom} />
                </div>` : null}
              </div>
              ${pinned ? html`<div className="sr-only">
                  <h3>What is “Matcha of the Week”?</h3>
                  <ol>${STORY.slice(1).map(function (it) { return html`<li key=${it.n}>${it.head} ${it.body === 'price' ? "That week's pick is only " + WEEKLY_PRICE + '!' : it.body}</li>`; })}</ol>
                  <p>${WEEKLY.name} is this week's Matcha of the Week at ${WEEKLY_PRICE}.</p></div>` : html`<div className="motw-static">
                  <${StoryCard} it=${STORY[0]} />
                  ${STORY.slice(1).map(function (it) { return html`<${StoryCard} key=${it.n} it=${it} />`; })}
                  <${PriceTag} on=${true} />
                </div>`}
              ${!pinned ? html`<div className="play-row"><${D.Button} variant="secondary" icon="sparkle" onClick=${function () { buzz(); play(); }} disabled=${playing}>${playing ? 'Building…' : 'Build it again'}<//></div>` : null}
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.3 ---------- */
  function Menu(p) {
    var deck = useRef(null);
    var idxS = useState(0), idx = idxS[0], setIdx = idxS[1];
    var catS = useState('Matcha'), cat = catS[0], setCat = catS[1];
    var list = MENU.filter(function (m) { return m.cat === cat; });
    var COUNT = list.length + (cat === 'Matcha' ? 1 : 0);
    useEffect(function () { var el = deck.current; if (el) el.scrollTo({ left: 0, behavior: 'instant' }); setIdx(0); }, [cat]);
    useEffect(function () {
      var el = deck.current; if (!el) return;
      function track() {
        var kids = el.querySelectorAll('.deck-row > *'), mid = el.scrollLeft + el.clientWidth / 2, best = 0, bd = 1e9;
        for (var i = 0; i < kids.length; i++) { var c = kids[i].offsetLeft + kids[i].offsetWidth / 2, d = Math.abs(c - mid); if (d < bd) { bd = d; best = i; } }
        setIdx(best);
      }
      el.addEventListener('scroll', track, { passive: true });
      return function () { el.removeEventListener('scroll', track); };
    }, []);
    function goTo(i) {
      var el = deck.current; if (!el) return; var k = el.querySelectorAll('.deck-row > *')[i]; if (!k) return;
      el.scrollTo({ left: k.offsetLeft - (el.clientWidth - k.offsetWidth) / 2, behavior: 'smooth' });
    }
    useEffect(function () {
      var el = deck.current; if (!el) return;
      var last = el.scrollLeft, t = null;
      function on() {
        var v = el.scrollLeft - last; last = el.scrollLeft;
        var lean = Math.max(-4, Math.min(4, -v * 0.25));
        el.style.setProperty('--lean', lean.toFixed(2) + 'deg'); el.classList.add('is-moving');
        clearTimeout(t); t = setTimeout(function () { el.classList.remove('is-moving'); }, 140);
      }
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      el.addEventListener('scroll', on, { passive: true });
      return function () { el.removeEventListener('scroll', on); clearTimeout(t); };
    }, []);
    function nudge(dir) { var el = deck.current; if (el) el.scrollBy({ left: dir * 300, behavior: 'smooth' }); }
    return html`
      <section id="menu" className="band menu" aria-labelledby="menu-title">
        <div className="wrap menu-head">
          <div>
            <p className="caption eyebrow">Chapter 3 · The DAJU Collection</p>
            <h2 id="menu-title" className="editorial-lg p0" style=${{ textTransform: 'uppercase', color: 'var(--heading)' }}>Collection menu</h2>
            <p className="body p0 muted" style=${{ maxWidth: 480 }}>Four matchas and two coffees, all whisked or pulled to order, plus a Matcha of the Week.</p>
            <div className="menu-tabs" role="tablist" aria-label="Menu category">
              ${CATS.map(function (c) {
                var n = MENU.filter(function (m) { return m.cat === c; }).length;
                return html`<button key=${c} type="button" role="tab" className=${'menu-tab' + (cat === c ? ' is-on' : '')} aria-selected=${cat === c} onClick=${function () { buzz(); setCat(c); }}>${c}<span className="menu-tab-n">${n}</span></button>`;
              })}
            </div>
          </div>
          <span className="swipe-hint label" aria-hidden="true">Swipe <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          ${p.narrow ? null : html`<div className="deck-btns">
            <button type="button" className="round-btn" aria-label="Scroll menu left" onClick=${function () { nudge(-1); }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            <button type="button" className="round-btn" aria-label="Scroll menu right" onClick=${function () { nudge(1); }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>`}
        </div>
        <div className="deck" ref=${deck} tabIndex="0" aria-label=${cat + ' menu cards'}>
          <div className="deck-row">
            ${list.map(function (m) {
              var art = html`<${D.CupPreview} width=${150} name="DA JU" charm="butterfly" className=${cupClass(m.id)} alt=${'Illustrated ' + m.name + ' with DA JU in marker and butterfly charms'} />`;
              return html`<div key=${m.id} className=${'deck-card drink-' + m.id}><${D.ProductCard} name=${m.name} flavor=${m.flavor} note=${m.note} price=${priceText(m.price)} status=${m.status} category=${m.cat}
                tilt=${m.tilt} suggestion=${m.suggestion} art=${art}
                onAdd=${m.status === 'soldout' ? undefined : function () { p.onCustomize(m); }} /></div>`;
            })}
            ${cat === 'Matcha' ? html`<div className="coming-wrap"><div className="coming">
              <${D.Doodle} name="sparkle" size=${36} />
              <p className="script">something special, every week</p>
              <p className="body p0 muted">A new drop every week. Follow us for the reveal.</p>
            </div></div>` : null}
          </div>
        </div>
        <div className="dots" role="group" aria-label="Menu cards">
          ${Array.from({ length: COUNT }).map(function (_, i) {
            return html`<button key=${i} type="button" className="dot" aria-label=${'Card ' + (i + 1) + ' of ' + COUNT} aria-current=${idx === i ? 'true' : 'false'} onClick=${function () { goTo(i); }}><span></span></button>`;
          })}
        </div>
      </section>`;
  }

  /* ---------- Ch.4 ---------- */
  function Studio(p) {
    var st = p.studio, narrow = p.narrow, each = st.qty > 1 && st.mode === 'each';
    var c = each ? st.cups[st.active] : st.cups[0];
    var head = html`<div className="studio-head">
      <p className="caption eyebrow">Chapter 4 · Cup studio</p>
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
              <${D.CupPreview} width=${narrow ? 86 : 260} name=${c.name || 'DA JU'} charm=${c.flair} className=${cupClass(drink.id)} alt=${'Illustrated ' + drink.name + ' with "' + (c.name || 'DA JU') + '" written on the cup'} caption=${narrow ? undefined : (st.qty > 1 ? reads.replace(' reads', '').replace(' read', '') + ' · ' : '') + caption} />
              ${st.qty > 1 ? html`<span className="qty-badge" aria-hidden="true">×${st.qty}</span>` : null}
            </div>
            <div className="studio-cup-meta" aria-live="polite">
              <span className="studio-drink-name">${drink.name}</span>
              <span className="small">${reads}</span>
              <span className="marker">${c.name || 'DA JU'}</span>
              <span className="small">${caption} · ${FLAIR[c.flair]}</span>
            </div>
            <${Burst} n=${p.burst} />
          </div>
          <div className="studio-form">
            ${narrow ? null : head}
            <div className="drink-pick-wrap">
              <p className="dj-field-label p0" id="drink-label">Drink</p>
              <div className="drink-pick" role="radiogroup" aria-labelledby="drink-label">
                ${MENU.map(function (m) {
                  var on = m.id === drink.id, sold = m.status === 'soldout';
                  return html`<button key=${m.id} type="button" role="radio" aria-checked=${on} disabled=${sold} className=${'drink-chip' + (on ? ' is-on' : '')}
                    onClick=${function (e) { buzz(); p.setDrink(m.id); var b = e.currentTarget, row = b.parentNode; if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: b.offsetLeft - 16, behavior: 'smooth' }); }}>
                    <span className="drink-thumb"><${DrinkThumb} drink=${m} size=${34} /></span>
                    <span className="drink-chip-text"><span className="drink-chip-name">${m.name}</span><span className="drink-chip-cat">${m.status === 'weekly' ? 'Matcha of the Week' : sold ? 'Sold out today' : m.cat}</span></span>
                  </button>`;
                })}
              </div>
            </div>
            <div className="qty-row">
              <div>
                <p className="dj-field-label p0" id="qty-label">How many cups?</p>
                <p className="fine">Up to 10 per order. ${st.qty > 1 ? 'All ' + st.qty + ' are ' + drink.name + '.' : drink.name + '.'}</p>
              </div>
              <div className="stepper" role="group" aria-labelledby="qty-label">
                <button type="button" className="step-btn" aria-label="One cup fewer" disabled=${st.qty <= 1} onClick=${function () { p.setQty(st.qty - 1); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
                <output className="qty-num" aria-live="polite"><span className="qty-pop" key=${st.qty}>${st.qty}</span></output>
                <button type="button" className="step-btn" aria-label="One cup more" disabled=${st.qty >= 10} onClick=${function () { p.setQty(st.qty + 1); }}>
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
                      <span className="cup-tab-n">Cup ${i + 1}</span><span className="cup-tab-name">${cc.name || 'DA JU'}</span></button>`;
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
              <${D.Button} variant="primary" size="lg" icon="bag" onClick=${p.onAdd}>${st.qty === 1 ? 'Add to bag' : 'Add ' + st.qty + ' cups to bag'}<//>
              <span className="label muted">${lineTotal} · ${p.bagCount ? p.bagCount + (p.bagCount === 1 ? ' cup' : ' cups') + ' in your bag' : 'Your bag is empty'}</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- Ch.5 ---------- */
  function Fold(p) {
    return html`<div className=${'fold' + (p.open ? ' is-open' : '') + (p.className ? ' ' + p.className : '')} inert=${p.open ? undefined : ''} aria-hidden=${p.open ? undefined : 'true'}>
      <div className="fold-inner">${p.children}</div></div>`;
  }
  function Route(p) {
    var stations = [['PICK_UP', 'bag'], ['GRAB_EXPRESS', 'scooter'], ['COD', 'car']];
    var details = p.step !== 'pick', nErr = Object.keys(p.errors).length;
    var icon = stations.filter(function (s) { return s[0] === p.mode; })[0][1];
    return html`
      <section id="order" className="band" data-theme="forest" aria-labelledby="order-title">
        <div className="route-wrap">
          <div className="route-head">
            <${D.Wordmark} size="md" />
            <h2 id="order-title" className="editorial-lg p0" style=${{ marginTop: 12, textTransform: 'uppercase', color: 'var(--heading)' }}>How to order</h2>
            <${D.Doodle} name="sprig" size=${40} />
            <p className="caption p0 muted" style=${{ textTransform: 'uppercase' }}>${details ? 'Step 2 of 2 · Your details' : 'Step 1 of 2 · Pick a method'}</p>
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
              : html`<${D.Notice} tone="info" title="Order before the window closes">Pre-orders for the 12:30 PM – 1:25 PM Centre Point slot close before pickup starts. Miss it and Weekday COD (after 6:30 PM) is next.<//>`}
          <//>
        </div>
      </section>`;
  }

  /* ---------- Ch.6 ---------- */
  function SignOff(p) {
    var bz = useState(false), busy = bz[0], setBusy = bz[1];
    return html`
      <section id="ticket" className="band" aria-labelledby="ticket-title">
        <div className="wrap signoff">
          <div className="signoff-copy">
            <p className="caption eyebrow">Chapter 6 · Your ticket</p>
            <${D.StickerHeadline} size="lg" className="chapter-title"><span id="ticket-title">Ready when you are</span><//>
            <p className="body-lg p0 muted">Your cup, your slot and your subtotal on one ticket. Send it to us on WhatsApp in one tap, and we'll confirm and start whisking.</p>
            <p className="editorial-motto p0" style=${{ marginTop: 8, color: 'var(--heading)' }}>Freshly Made. Made For You.</p>
          </div>
          <div className="signoff-ticket">
            <p className=${'ticket-state' + (p.complete ? ' is-ok' : '')} role="status">
              <${D.Doodle} name=${p.complete ? 'sparkle' : 'clock'} size=${18} />${p.complete ? 'Details saved. This is the ticket we will receive.' : 'Live preview. It fills in as you build your cups and add your details.'}</p>
            <div className="ticket-live" key=${p.flash}><${D.OrderTicket} ...${p.order} /></div>
            <div className="btns">
              ${p.hasBag
                ? html`<${D.Button} variant="primary" size="lg" icon="bag" block=${true} onClick=${p.onReview}>Review & send order<//>`
                : html`<${D.Button} variant="primary" size="lg" icon="bag" block=${true} onClick=${p.onAddStudio}>${p.studioQty > 1 ? 'Add these ' + p.studioQty + ' cups to bag' : 'Add this cup to bag'}<//>`}
              ${p.complete ? null : html`<${D.Button} variant="sticker" block=${true} icon="pin" onClick=${p.onDetails}>Add my details<//>`}
              ${p.complete ? html`<${D.Button} variant="sticker" block=${true} icon="sparkle" disabled=${busy} onClick=${function () { if (busy) return; setBusy(true); shareTicketImage(p.order, orderMessage(p.order), p.toast).then(function () { setBusy(false); }); }}>${busy ? 'Making your ticket image…' : 'Share ticket as image'}<//>` : null}
              <${D.Button} variant="secondary" block=${true} onClick=${p.onCopy}>Copy ticket text<//>
            </div>
          </div>
        </div>
      </section>`;
  }

  function Footer() {
    return html`
      <footer className="foot" data-theme="forest" style=${{ background: 'var(--surface)', color: 'var(--text)' }}>
        <div className="wrap foot-grid">
          <div style=${{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <${D.Wordmark} size="sm" />
            <p className="script">something special, every week</p>
          </div>
          <nav aria-label="Footer">
            <a href="#drop" className="label">Weekly Drop</a>
            <a href="#menu" className="label">Matcha Menu</a>
            <a href="#order" className="label">How to Order</a>
            <a href="#top" className="label">Instagram [@handle]</a>
            <a href="#top" className="label">TikTok [@handle]</a>
            <a href="#top" className="label">WhatsApp [number]</a>
          </nav>
        </div>
        <p className="caption muted" style=${{ maxWidth: 1200, margin: '32px auto 0' }}>DAJU Matcha · pop-up · Pick Up, Grab Express & COD to KK, Penampang, Putatan, Kepayan</p>
      </footer>`;
  }

  /* ---------- Drawers ---------- */
  function CustomizeDrawer(p) {
    var it = p.item;
    var s = useState({ name: '', ice: 'Normal', sweet: 'Normal', flair: 'butterfly' }), c = s[0], set = s[1];
    useEffect(function () { if (it) set({ name: '', ice: 'Normal', sweet: 'Normal', flair: it.charm || 'butterfly' }); }, [it && it.id, p.open]);
    if (!it) return null;
    function up(o) { set(Object.assign({}, c, o)); }
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} title="Customize your cup" step=${it.name}
      footer=${html`<${D.Button} variant="primary" size="lg" icon="bag" block=${true} onClick=${function () { p.onAdd(it, c); }}>Add to bag · ${priceText(it.price)}<//>`}>
      <div className="custom-cup"><${D.CupPreview} width=${p.side === "bottom" ? 130 : 170} name=${c.name || 'DA JU'} charm=${c.flair} className=${cupClass(it.id)} alt=${'Illustrated ' + it.name + ' with "' + (c.name || 'DA JU') + '" written on the cup'} /></div>
      <${D.TextField} label="Name on the cup" hint="Up to 12 characters, written in marker." maxLength=${12} placeholder="DA JU" value=${c.name} onChange=${function (e) { up({ name: e.target.value.slice(0, 12) }); }} />
      <${D.ChoicePills} label="Ice" options=${TWO} value=${c.ice} className="full-seg" onChange=${function (v) { up({ ice: v }); }} />
      <${D.ChoicePills} label="Sweetness" options=${TWO} value=${c.sweet} className="full-seg" onChange=${function (v) { up({ sweet: v }); }} />
      <${D.ChoicePills} label="Cup flair" options=${FLAIR_OPTS} value=${c.flair} className="mode-pills" onChange=${function (v) { up({ flair: v }); }} />
    <//>`;
  }

  function BagDrawer(p) {
    var items = p.items;
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} title="Your order bag" step="Step 1 of 3"
      footer=${items.length ? html`<div className="drawer-stack" style=${{ gap: 12 }}>
        <div className="sum-row"><span>Estimated subtotal</span><span>${subtotalText(items)}</span></div>
        ${p.ready ? html`<div className="method-summary">
            <span className="method-summary-icon" aria-hidden="true"><${D.Doodle} name=${p.modeIcon} size=${22} /></span>
            <span className="method-summary-text"><b>${p.modeName}</b><span>${p.slot}</span></span>
            <button type="button" className="text-btn" onClick=${p.onNext}>Change</button>
          </div>
          <${D.Button} variant="primary" size="lg" icon="sparkle" block=${true} onClick=${p.onReview}>Review my order<//>`
        : html`<${D.Button} variant="primary" size="lg" block=${true} onClick=${p.onNext}>${p.saved ? 'Finish my delivery details' : 'Choose pickup or delivery'}<//>`}</div>` : null}>
      ${items.length ? html`<ul className="bag-list">${items.map(function (it) {
        return html`<li key=${it.key} className="bag-item">
          <${D.CupPreview} width=${56} name=${it.cupName || 'DA JU'} charm=${it.flair} className=${cupClass(it.id)} alt="" />
          <div>
            <h3>${it.name}</h3>
            <p>Ice ${it.ice.toLowerCase()} · sweetness ${it.sweet.toLowerCase()} · ${FLAIR[it.flair]}</p>
            ${it.cupName ? html`<p className="cupname">${it.cupName}</p>` : null}
            <p style=${{ fontVariantNumeric: 'tabular-nums' }}>${priceText(it.price)}</p>
          </div>
          <button type="button" className="icon-btn" aria-label=${'Remove ' + it.name} onClick=${function () { p.onRemove(it.key); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </li>`;
      })}</ul>` : html`<div className="empty">
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
    var now = p.now, weekdayMissed = f.day === 'weekday' && !isWeekend(now) && mins(now) >= 805 && f.mode !== 'COD';
    return html`<${R.Fragment}>
      ${p.showMode ? html`<${D.ChoicePills} label="Fulfillment" options=${MODE_OPTS} value=${f.mode} className="mode-pills" onChange=${function (v) { set({ mode: v }); }} />` : null}
      <${D.ChoicePills} variant="segmented" label="When" options=${DAY_OPTS} value=${f.day} className="full-seg" onChange=${function (v) { set({ day: v }); }} />
      <p className="slot-line"><${D.Doodle} name="clock" size=${20} />${slot}</p>
      ${weekdayMissed ? html`<${D.Notice} tone="info" title=${"Today's lunch window has closed"}
          action=${html`<${D.Button} variant="secondary" icon="car" onClick=${function () { set({ mode: 'COD' }); }}>Switch to COD tonight<//>`}>
          It's ${clock(now)} in KK, after the 12:30 PM – 1:25 PM window. This order will go to the next weekday window, or switch to Weekday COD (after 6:30 PM).<//>` : null}

      ${f.mode === 'PICK_UP' && f.day === 'weekend' ? html`
        <${D.Notice} tone="availability" title="Pending time confirmation">Weekend pickups at Maang Apartment are by arrangement. Tell us a time and we'll confirm or suggest another.<//>
        <${D.TextField} label="Preferred pickup time" required=${true} placeholder="e.g. Saturday, 3:00 PM" value=${f.prefTime} error=${tried ? err.prefTime : undefined}
          onChange=${function (e) { set({ prefTime: e.target.value }); }} />` : null}

      ${f.mode === 'GRAB_EXPRESS' && f.day === 'weekend' ? html`
        <${D.ChoicePills} label="Dispatch window (9:00 AM – 4:00 PM)" className="window-pills" options=${GRAB_WEEKEND} value=${f.grabWindow} onChange=${function (v) { set({ grabWindow: v }); }} />` : null}

      ${f.mode === 'COD' ? html`
        <${D.ZonePicker} value=${f.zone} onChange=${function (z) { set({ zone: z }); }} onSwitchToGrab=${function () { set({ mode: 'GRAB_EXPRESS', zone: undefined }); }} />
        ${tried && err.zone ? html`<p className="dj-field-error" role="alert"><${D.Doodle} name="sparkle" size=${16} />${err.zone}</p>` : null}
        ${f.day === 'weekend' ? html`<${D.Notice} tone="availability">Weekend COD is based on order & availability. We'll confirm before dispatch.<//>` : null}` : null}

      ${f.mode !== 'PICK_UP' && f.zone !== 'OTHER' ? html`
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
    var sched = D.schedule[f.mode][f.day];
    var slot = f.mode === 'PICK_UP' ? sched.location + ' · ' + sched.time : f.mode === 'GRAB_EXPRESS' ? sched.label + ' ' + sched.time : sched.time + ' · ' + sched.area.replace(/ \| /g, ', ');
    var now = p.now, weekdayMissed = f.day === 'weekday' && !isWeekend(now) && mins(now) >= 805 && f.mode !== 'COD';
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} title="How should we get it to you?" step="Step 2 of 3"
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
    var text = orderMessage(p.order);
    return html`<${D.Drawer} open=${p.open} onClose=${p.onClose} side=${p.side} title="Your order ticket" step="Step 3 of 3"
      footer=${html`<div className="drawer-stack" style=${{ gap: 10 }}>
        <${D.Button} variant="primary" size="lg" icon="bubble" block=${true} href=${'https://wa.me/?text=' + encodeURIComponent(text)} target="_blank" rel="noopener">Send via WhatsApp<//>
        <${D.Button} variant="sticker" block=${true} icon="sparkle" disabled=${busy} onClick=${function () { if (busy) return; setBusy(true); shareTicketImage(p.order, text, p.toast).then(function () { setBusy(false); }); }}>${busy ? 'Making your ticket image…' : 'Share ticket as image'}<//>
        <${D.Button} variant="secondary" block=${true} onClick=${function () { copyText(text, function () { p.toast('Ticket copied'); }, function () { setRaw(true); }); }}>Copy ticket text<//>
        <${D.Button} variant="ghost" block=${true} onClick=${p.onBack}>Edit details<//></div>`}>
      <div className="ticket-center"><${D.OrderTicket} ...${p.order} /></div>
      <p className="fine">Send via WhatsApp opens the chat with this ticket typed in. Prefer a picture? Share ticket as image sends it as a PNG from your phone\'s share menu (pick WhatsApp, then the DAJU chat, [number]). We\'ll reply to confirm your slot.</p>
      ${showRaw ? html`<div style=${{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="dj-field-label" htmlFor="raw-ticket">Ticket text (selected, copy it from here)</label>
        <textarea id="raw-ticket" ref=${ta} className="copy-fallback" readOnly=${true} value=${text}></textarea></div>` : null}
    <//>`;
  }

  /* ---------- Bottom tab bar (phones) ---------- */
  var TABS = [['drop', 'Drop', 'sparkle'], ['menu', 'Menu', 'whisk'], ['studio', 'Studio', 'daisy'], ['order', 'Order', 'scooter']];
  function TabBar(p) {
    var s = useState('drop'), here = s[0], setHere = s[1];
    useEffect(function () {
      if (!('IntersectionObserver' in window)) return;
      var map = { drop: 'drop', assembly: 'drop', menu: 'menu', studio: 'studio', order: 'order' };
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setHere(map[e.target.id]); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
      return function () { io.disconnect(); };
    }, []);
    return html`<nav className="tabbar" aria-label="Quick navigation">
      ${TABS.map(function (t) {
        return html`<a key=${t[0]} href=${'#' + t[0]} className=${'tab' + (here === t[0] ? ' is-here' : '')} aria-current=${here === t[0] ? 'location' : undefined}><${D.Doodle} name=${t[2]} size=${24} />${t[1]}</a>`;
      })}
      <button type="button" className="tab" onClick=${p.onBag} aria-label=${'Order bag, ' + p.count + (p.count === 1 ? ' item' : ' items')}>
        <${D.Doodle} name="bag" size=${24} />Bag
        ${p.count ? html`<span className="tab-count bump" key=${p.count}>${p.count}</span>` : null}
      </button>
    </nav>`;
  }

  /* ---------- App ---------- */
  function App() {
    var now0 = myt();
    var nowS = useState(now0), now = nowS[0], setNow = nowS[1];
    var bagS = useState([]), bag = bagS[0], setBag = bagS[1];
    var studioS = useState({ drink: WEEKLY.id, qty: 1, mode: 'same', active: 0, cups: [{ name: '', ice: 'Normal', sweet: 'Normal', flair: 'butterfly' }] }), studio = studioS[0], setStudio = studioS[1];
    var stepS = useState('pick'), orderStep = stepS[0], setOrderStep = stepS[1];
    var savedS = useState(false), saved = savedS[0], setSaved = savedS[1];
    var secTriedS = useState(false), secTried = secTriedS[0], setSecTried = secTriedS[1];
    var flashS = useState(0), flash = flashS[0], setFlash = flashS[1];
    var burstS = useState(0), burst = burstS[0], setBurst = burstS[1];
    var dayS = useState(isWeekend(now0) ? 'weekend' : 'weekday'), day = dayS[0], setDayRaw = dayS[1];
    var fS = useState({ mode: 'PICK_UP', day: isWeekend(now0) ? 'weekend' : 'weekday', zone: undefined, address: '', notes: '', prefTime: '', grabWindow: GRAB_WEEKEND[0], feeAck: false, customer: '', phone: '' }), f = fS[0], setFRaw = fS[1];
    var drawerS = useState(null), drawer = drawerS[0], setDrawer = drawerS[1];
    var custS = useState(null), custItem = custS[0], setCustItem = custS[1];
    var triedS = useState(false), tried = triedS[0], setTried = triedS[1];
    var toastS = useState(''), toast = toastS[0], setToast = toastS[1];
    var toastOutS = useState(false), toastOut = toastOutS[0], setToastOut = toastOutS[1];
    var layerS = useState(5), layer = layerS[0], setLayer = layerS[1];
    var progS = useState(1), progress = progS[0], setProgress = progS[1];

    var narrow = useMedia('(max-width: 720px)');
    var reduce = useMedia('(prefers-reduced-motion: reduce)');
    var pinned = !reduce;  /* the cup stays centred and builds with the scroll on phones and desktop */
    var side = narrow ? 'bottom' : 'right';

    var heroRef = useRef(null), secRef = useRef(null), stickRef = useRef(null), toastT = useRef(null), toastT2 = useRef(null), keyN = useRef(0);

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
        var sec = secRef.current, st = stickRef.current;
        if (pinned && sec && st) {
          var r = sec.getBoundingClientRect(), total = sec.offsetHeight - st.offsetHeight;
          var top0 = narrow ? 0 : 64, pr = Math.max(0, Math.min(1, (top0 - r.top) / Math.max(1, total)));
          setProgress(pr);
          setLayer(Math.min(5, 1 + Math.floor((pr / BUILD_END) * 5.2)));
        }
      }
      function on() { if (!raf) raf = requestAnimationFrame(tick); }
      window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
      tick();
      return function () { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
    }, [pinned, reduce, narrow]);

    function showToast(m) {
      setToast(m); setToastOut(false); clearTimeout(toastT.current); clearTimeout(toastT2.current);
      toastT2.current = setTimeout(function () { setToastOut(true); }, 2400);
      toastT.current = setTimeout(function () { setToast(''); setToastOut(false); }, 2620);
    }
    function closeDrawer() {
      if (reduce) { setDrawer(null); return; }
      document.body.classList.add('is-closing');
      setTimeout(function () { document.body.classList.remove('is-closing'); setDrawer(null); }, 200);
    }
    function setCup(o, quiet) {
      setStudio(function (st) {
        var i = st.qty > 1 && st.mode === 'each' ? st.active : 0;
        var cups = st.cups.slice(); cups[i] = Object.assign({}, cups[i], o);
        return Object.assign({}, st, { cups: cups });
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
        if (m === 'each') cups = cups.map(function () { return Object.assign({}, st.cups[0]); }); // start every cup from the shared choice
        return Object.assign({}, st, { mode: m, cups: cups, active: 0 });
      });
    }
    function studioCups() {
      var out = []; for (var i = 0; i < studio.qty; i++) out.push(studio.mode === 'each' ? studio.cups[i] : studio.cups[0]);
      return out;
    }
    function scrollToId(id) { setTimeout(function () { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 30); }
    function setF(o) { setFRaw(function (x) { return Object.assign({}, x, o); }); }
    function setDay(v) { setDayRaw(v); setF({ day: v }); }
    function setMode(m) { setF({ mode: m }); buzz(); }
    /* Keep a method's header steady on screen while cards fold around it: every frame, scroll by
       however much the header moved, easing it toward the top of the screen. */
    var followRaf = useRef(0);
    function followHeader(m, dur) {
      cancelAnimationFrame(followRaf.current);
      var el = document.getElementById('station-' + m); if (!el) return;
      var navH = narrow ? 0 : 64, endY = navH + 12 + (parseFloat(getComputedStyle(document.documentElement).paddingTop) || 0);
      var startY = el.getBoundingClientRect().top;
      if (startY < endY - 4 || startY > window.innerHeight - 80) startY = Math.max(endY, Math.min(startY, window.innerHeight - 80)); // off screen: bring it in
      var t0 = performance.now(), D2 = reduce ? 0 : dur;
      function ease(x) { return 1 - Math.pow(1 - x, 3); }
      function frame(now) {
        var e = document.getElementById('station-' + m); if (!e) return;
        var p = D2 ? Math.min(1, (now - t0) / D2) : 1;
        var want = startY + (endY - startY) * ease(p);
        var diff = e.getBoundingClientRect().top - want;
        if (Math.abs(diff) > 0.5) window.scrollTo({ top: window.scrollY + diff, behavior: 'instant' });
        if (p < 1) followRaf.current = requestAnimationFrame(frame);
      }
      followRaf.current = requestAnimationFrame(frame);
    }
    function chooseMethod(m) {
      buzz(); setSecTried(false);
      var switching = orderStep === 'details' && m !== f.mode;
      if (switching) setOrderStep('closing');         // fold the open form; every card is a bar for a moment
      followHeader(m, switching ? 700 : 420);
      setTimeout(function () {
        setF({ mode: m, day: switching ? f.day : day });
        requestAnimationFrame(function () { requestAnimationFrame(function () { setOrderStep('details'); }); });
      }, switching && !reduce ? 280 : 0);
    }
    function addItem(menuItem, c) { addItems(menuItem, [c]); }
    function addItems(menuItem, list) {
      var its = list.map(function (c) { keyN.current += 1; return { key: keyN.current, id: menuItem.id, name: menuItem.name, price: menuItem.price, ice: c.ice, sweet: c.sweet, cupName: (c.name || '').trim(), flair: c.flair }; });
      setBag(function (b) { return b.concat(its); });
      setFlash(function (n) { return n + 1; });
      setBurst(function (n) { return n + 1; });
      buzz();
    }

    var errors = {};
    if (!f.customer.trim()) errors.customer = 'Add your name so we can label the cup bag.';
    if (!/\d{7,}/.test(f.phone.replace(/\D/g, ''))) errors.phone = 'Add a WhatsApp number so we can confirm your order.';
    if (f.mode === 'PICK_UP' && f.day === 'weekend' && !f.prefTime.trim()) errors.prefTime = 'Add a time so we can confirm or suggest another.';
    if (f.mode !== 'PICK_UP' && !f.address.trim()) errors.address = 'Add the address the rider should bring your cup to.';
    if (f.mode === 'GRAB_EXPRESS' && !f.feeAck) errors.feeAck = true;
    if (f.mode === 'COD' && !f.zone) errors.zone = 'Pick your COD area.';
    if (f.mode === 'COD' && f.zone === 'OTHER') errors.zone = 'COD covers four areas only.';

    var sch = D.schedule[f.mode][f.day];
    var where = f.mode === 'PICK_UP' ? sch.location : f.mode === 'COD' ? [f.address.trim(), f.zone && f.zone !== 'OTHER' ? f.zone : ''].filter(Boolean).join(', ') : f.address.trim();
    var when = f.mode === 'PICK_UP' && f.day === 'weekend' ? (f.prefTime.trim() || 'Time by arrangement') + ' (pending time confirmation)'
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
    var liveOrder = { orderRef: orderRef(now), customer: f.customer.trim(), phone: f.phone.trim(), mode: f.mode, schedule: f.day === 'weekend' ? 'WEEKEND' : 'WEEKDAY',
      location: where, time: when, address: f.mode !== 'PICK_UP' ? f.notes.trim() : '', items: ticketItems(bag), feeAck: f.feeAck, subtotal: subtotalText(bag) };

    var studioDrink = drinkById(studio.drink);
    var studioItems = studioCups().map(function (c) { return { id: studioDrink.id, name: studioDrink.name, price: studioDrink.price, ice: c.ice, sweet: c.sweet, cupName: (c.name || '').trim(), flair: c.flair }; });
    var shown = bag.length ? bag : studioItems;
    var pageOrder = Object.assign({}, liveOrder, {
      customer: liveOrder.customer || '[Your name]', phone: liveOrder.phone || '[Your phone]',
      location: liveOrder.location || (f.mode === 'PICK_UP' ? sch.location : '[Your address]'),
      items: ticketItems(shown), subtotal: subtotalText(shown) });
    var detailsComplete = saved && !Object.keys(errors).length;

    var slotLine = MODE_NAME[f.mode] + ' · ' + (f.mode === 'PICK_UP' ? sch.location + ' · ' : '') + (f.mode === 'PICK_UP' && f.day === 'weekend' ? 'Time by arrangement' : when);

    return html`
      <div id="top">
        <div className="preview-strip"><b>Website preview</b><span>Prices, social handles and the WhatsApp number are placeholders until the menu is final.</span></div>
        <${D.NavBar} className="nav-centered" bagCount=${bag.length} onBag=${function () { setDrawer('bag'); }} />
        <main>
          <${Hero} narrow=${narrow} heroRef=${heroRef} onCustomize=${function (m) { setCustItem(m); setDrawer('custom'); }} />
          <${Assembly} narrow=${narrow} reduce=${reduce} pinned=${pinned} layer=${layer} setLayer=${setLayer} progress=${progress} secRef=${secRef} stickRef=${stickRef} />
          <${Menu} narrow=${narrow} onCustomize=${function (m) { setCustItem(m); setDrawer('custom'); }} />
          <${Studio} narrow=${narrow} studio=${studio} setCup=${setCup} setQty=${setQty} setMode=${setStudioMode} setActive=${function (i) { setStudio(function (st) { return Object.assign({}, st, { active: i }); }); }} setDrink=${function (id) { setStudio(function (st) { return Object.assign({}, st, { drink: id }); }); }} burst=${burst} bagCount=${bag.length}
            onAdd=${function () { var l = studioCups(); addItems(studioDrink, l); showToast(l.length === 1 ? 'Added to your bag' : 'Added ' + l.length + ' cups to your bag'); }} />
          <${Route} day=${day} setDay=${setDay} mode=${f.mode} saved=${saved} step=${orderStep} onChoose=${chooseMethod}
            onBack=${function () { buzz(); followHeader(f.mode, 420); setOrderStep('pick'); }}
            f=${f} setF=${setF} tried=${secTried} errors=${errors} now=${now}
            onSave=${function () { setSecTried(true); if (Object.keys(errors).length) { buzz(); return; } setSaved(true); setOrderStep('pick'); setFlash(function (n) { return n + 1; }); showToast('Details saved to your ticket'); scrollToId('ticket'); }} />
          <${SignOff} order=${pageOrder} hasBag=${bag.length > 0} complete=${detailsComplete} flash=${flash} studioQty=${studio.qty} toast=${showToast}
            onDetails=${function () { chooseMethod(f.mode); }}
            onReview=${function () { setDrawer('bag'); }}
            onAddStudio=${function () { addItems(studioDrink, studioCups()); setDrawer('bag'); }}
            onCopy=${function () { copyText(orderMessage(pageOrder), function () { showToast('Ticket copied'); }, function () { showToast('Copy is blocked here. Open your bag to select the text.'); }); }} />
        </main>
        <${Footer} />
        ${narrow ? html`<${TabBar} count=${bag.length} onBag=${function () { buzz(); setDrawer('bag'); }} />` : null}
        ${bag.length && narrow && !drawer ? html`<${D.CheckoutBar} className="is-entering" count=${bag.length} total=${subtotalText(bag)} slot=${slotLine} onCheckout=${function () { setDrawer('bag'); }} />` : null}

        <${CustomizeDrawer} open=${drawer === 'custom'} item=${custItem} side=${side} onClose=${function () { closeDrawer(); }}
          onAdd=${function (m, c) { addItem(m, c); closeDrawer(); showToast('Added to your bag'); }} />
        <${BagDrawer} open=${drawer === 'bag'} side=${side} items=${bag} onClose=${function () { closeDrawer(); }}
          onRemove=${function (k) { setBag(function (b) { return b.filter(function (x) { return x.key !== k; }); }); }}
          onBrowse=${function () { closeDrawer(); setTimeout(function () { var m = document.getElementById('menu'); if (m) m.scrollIntoView(); }, 0); }}
          onNext=${function () { setTried(false); setDrawer('fulfill'); }}
          ready=${detailsComplete} saved=${saved} modeName=${MODE_NAME[f.mode]} modeIcon=${{ PICK_UP: 'bag', GRAB_EXPRESS: 'scooter', COD: 'car' }[f.mode]}
          slot=${(f.mode === 'PICK_UP' ? sch.location : where) + ' · ' + when}
          onReview=${function () { buzz(); setDrawer('ticket'); }} />
        <${FulfillDrawer} open=${drawer === 'fulfill'} side=${side} f=${f} setF=${setF} tried=${tried} errors=${errors} now=${now}
          onClose=${function () { closeDrawer(); }} onBack=${function () { setDrawer('bag'); }}
          onNext=${function () { setTried(true); if (!Object.keys(errors).length) { setSaved(true); setDrawer('ticket'); } }} />
        <${TicketDrawer} open=${drawer === 'ticket'} side=${side} order=${liveOrder} toast=${showToast}
          onClose=${function () { closeDrawer(); }} onBack=${function () { setDrawer('fulfill'); }} />
        <${Toast} msg=${toast} out=${toastOut} />
      </div>`;
  }

  /* ---------- Soft layout motion (FLIP) ----------
     Whenever the DOM changes, children of these containers that moved glide from their old spot (240ms),
     and newly added children fade and rise in (200ms). Nothing runs under prefers-reduced-motion. */
  var FLIP_SEL = '.studio-form, .studio, .studio-add, .qty-row, .cup-tabs-wrap, .studio-cup-meta, .details-form, ' +
    '.dj-drawer-body, .drawer-stack, .bag-list, .dj-tk-meta, .dj-tk-items, .dj-ticket, .signoff-ticket, .btns, .dj-zones, .dj-fee, .dj-field, .assembly-stage, ' +
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
              active++; el._flipIn.onfinish = el._flipIn.oncancel = (function (e) { return function () { e._flipIn = null; active--; }; })(el);
            }
          } else {
            var dx = start.x - now.x, dy = start.y - now.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              el._flip = el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: Math.min(320, 180 + Math.hypot(dx, dy) * 0.4), easing: EASE });
              active++; el._flip.onfinish = el._flip.oncancel = (function (e) { return function () { e._flip = null; active--; }; })(el);
            }
          }
        }
        cache.set(el, { c: c, r: now });
      });
      busy = false;
    }
    var pending = false;
    var mo = new MutationObserver(function () { if (pending) return; pending = true; Promise.resolve().then(function () { pending = false; pass(); }); });
    mo.observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'checked'] });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(snapshot, 150); });
    document.fonts && document.fonts.ready.then(snapshot);
    setTimeout(function () { snapshot(); ready = true; }, 600);
    setInterval(function () { if (!document.hidden && active <= 0) { active = 0; snapshot(); } }, 1500);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
  if ('MutationObserver' in window && Element.prototype.animate) startFlip();
})();
