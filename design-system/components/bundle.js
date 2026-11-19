/* @ds-bundle: {"format":4,"namespace":"Daju","components":[{"name":"Wordmark"},{"name":"StickerHeadline"},{"name":"SpeechBubble"},{"name":"Doodle"},{"name":"Stamp"},{"name":"NavBar"},{"name":"StatusPill"},{"name":"CheckoutBar"},{"name":"Button"},{"name":"ChoicePills"},{"name":"TextField"},{"name":"FeeAck"},{"name":"ZonePicker"},{"name":"ProductCard"},{"name":"CupPreview"},{"name":"ChannelCard"},{"name":"Notice"},{"name":"OrderTicket"},{"name":"Drawer"}]} */
(function () {
  /* React is looked up at render time, so the bundle may load before React does. */
  function h() { var R = window.React; return R.createElement.apply(R, arguments); }
  function useState(v) { return window.React.useState(v); }
  function useEffect(f, d) { return window.React.useEffect(f, d); }
  function useRef(v) { return window.React.useRef(v); }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  var uid = 0; function useId(p) { var r = useRef(null); if (r.current === null) r.current = (p || 'dj') + '-' + (++uid); return r.current; }
  function useControlled(value, initial, onChange) {
    var s = useState(initial), inner = s[0], setInner = s[1];
    var controlled = value !== undefined;
    return [controlled ? value : inner, function (v) { if (!controlled) setInner(v); if (onChange) onChange(v); }];
  }

  /* ---------- data: verbatim from the official poster (PRD §6.1) ---------- */
  var schedule = {
    PICK_UP: { step: 1, title: 'Pick Up', icon: 'bag',
      weekday: { days: 'Monday – Friday', location: 'Centre Point', time: '12:30 PM – 1:25 PM' },
      weekend: { days: 'Saturday – Sunday', location: 'Maang Apartment', time: 'Time by arrangement' } },
    GRAB_EXPRESS: { step: 2, title: 'Grab Express', icon: 'scooter', note: '*Delivery fee is borne by customer.',
      weekday: { days: 'Monday – Friday', label: 'Pickup starts', time: '12:30 PM – 1:25 PM' },
      weekend: { days: 'Saturday – Sunday', label: 'Pickup starts', time: '9:00 AM – 4:00 PM' } },
    COD: { step: 3, title: 'COD', icon: 'car',
      weekday: { days: 'Monday – Friday', time: 'After 6:30 PM', area: 'KK | Penampang | Putatan | Kepayan' },
      weekend: { days: 'Saturday – Sunday', time: 'Based on order & availability', area: 'KK | Penampang | Putatan | Kepayan' } }
  };
  var codZones = ['KK', 'Penampang', 'Putatan', 'Kepayan'];

  /* ---------- Doodle ---------- */
  var ICONS = {"bag":[["path",{"d":"M12 18h24l-2.5 22h-19z"}],["path",{"d":"M18 18v-3a6 6 0 0 1 12 0v3"}]],"scooter":[["circle",{"cx":13,"cy":35,"r":5}],["circle",{"cx":36,"cy":35,"r":5}],["path",{"d":"M8 30c0-4 3.5-7 8-7h5l3 8h7"}],["path",{"d":"M33 33l-5-17h6"}],["path",{"d":"M13 19h8"}]],"car":[["path",{"d":"M7 32v-6c0-1.6 1-3 2.6-3.6L13.5 16h21l3.9 6.4C40 23 41 24.4 41 26v6z"}],["path",{"d":"M16 18.5l-2 4h20l-2-4z"}],["circle",{"cx":15,"cy":32,"r":3.5}],["circle",{"cx":33,"cy":32,"r":3.5}]],"pin":[["path",{"d":"M24 42s-12-10.5-12-20a12 12 0 0 1 24 0c0 9.5-12 20-12 20z"}],["circle",{"cx":24,"cy":22,"r":4}]],"clock":[["circle",{"cx":24,"cy":24,"r":16}],["path",{"d":"M24 14v10l7 4"}]],"sprig":[["path",{"d":"M24 38V18"}],["path",{"d":"M24 27c-5 0-8-3-8-8 5 0 8 3 8 8z"}],["path",{"d":"M24 27c5 0 8-3 8-8-5 0-8 3-8 8z"}],["path",{"d":"M8 30h10M30 30h10"}]],"whisk":[["path",{"d":"M24 4v13"}],["path",{"d":"M17 17h14"}],["path",{"d":"M18.5 17c-3.5 8-4.5 16-3.5 24"}],["path",{"d":"M22 17c-1 8-1.2 16-.4 24"}],["path",{"d":"M26 17c1 8 1.2 16 .4 24"}],["path",{"d":"M29.5 17c3.5 8 4.5 16 3.5 24"}],["path",{"d":"M15 41c6 2.2 12 2.2 18 0"}]],"sparkle":[["path",{"d":"M22 6c1 10 4 14 14 17-10 3-13 7-14 17-1-10-4-14-14-17 10-3 13-7 14-17z"}],["path",{"d":"M39 6v8M35 10h8"}]],"bubble":[["path",{"d":"M24 8c10 0 18 6.3 18 14s-8 14-18 14c-2.2 0-4.2-.3-6.1-.8L9 40l2.6-7.4C7.9 30 6 26.2 6 22 6 14.3 14 8 24 8z"}]],"arrow":[["path",{"d":"M7 35c8-14 19-19 32-15"}],["path",{"d":"M32 14l7.5 6-6 7"}]],"route":[["path",{"d":"M6 42c12 0 7-18 18-18s6-18 18-18","strokeDasharray":"1 6"}]],"butterfly":[["path",{"d":"M24 17v19"}],["path",{"d":"M24 21c-4-8.5-15-11-15-2.5 0 5.5 6.5 7.5 15 4.5z"}],["path",{"d":"M24 21c4-8.5 15-11 15-2.5 0 5.5-6.5 7.5-15 4.5z"}],["path",{"d":"M24 27c-3.5 1.5-10.5 4-9.5 9 .8 4 7 2.5 9.5-5z"}],["path",{"d":"M24 27c3.5 1.5 10.5 4 9.5 9-.8 4-7 2.5-9.5-5z"}],["path",{"d":"M24 17l-3.5-6M24 17l3.5-6"}]],"bow":[["path",{"d":"M24 21c-6-6.5-15-8.5-15-2s9 6.5 15 2z"}],["path",{"d":"M24 21c6-6.5 15-8.5 15-2s-9 6.5-15 2z"}],["circle",{"cx":24,"cy":21,"r":2.6}],["path",{"d":"M22.5 23.5L16 41M25.5 23.5L32 41"}]],"daisy":[["circle",{"cx":24,"cy":24,"r":4}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(0 24 24)"}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(60 24 24)"}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(120 24 24)"}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(180 24 24)"}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(240 24 24)"}],["ellipse",{"cx":24,"cy":13,"rx":4,"ry":6.5,"transform":"rotate(300 24 24)"}]]};
  function Doodle(p) {
    var def = ICONS[p.name || 'sparkle']; if (!def) return null;
    var size = p.size || 24;
    return h('svg', { className: cx('dj-doodle', p.className), width: size, height: size, viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor',
      strokeWidth: p.strokeWidth || 2.25, strokeLinecap: 'round', strokeLinejoin: 'round', style: p.style,
      role: p.label ? 'img' : undefined, 'aria-label': p.label, 'aria-hidden': p.label ? undefined : true, focusable: 'false' },
      def.map(function (e, i) { return h(e[0], Object.assign({ key: i }, e[1])); }));
  }

  /* ---------- Brand ---------- */
  function Wordmark(p) {
    var size = p.size || 'md';
    return h('span', { className: cx('dj-wordmark', 'dj-wordmark-' + size, p.className), role: 'img', 'aria-label': 'DA JU Matcha' },
      h('span', { className: 'dj-wm-main', 'aria-hidden': true }, 'DA', h('span', { className: 'dj-wm-bar' }), 'JU'),
      p.sub === false ? null : h('span', { className: 'dj-wm-sub', 'aria-hidden': true }, 'Matcha'));
  }
  function StickerHeadline(p) {
    var Tag = p.as || 'h2';
    return h(Tag, { className: cx('dj-sticker', 'dj-sticker-' + (p.size || 'lg'), p.className), style: p.style }, p.children);
  }
  function SpeechBubble(p) {
    var size = p.size || 156;
    return h('div', { className: cx('dj-bubble', p.className), style: { width: size, height: size } },
      h(Doodle, { name: 'bubble', size: size, strokeWidth: 1.6, className: 'dj-bubble-line' }),
      h('span', { className: 'dj-bubble-text', style: { fontSize: Math.round(size * 0.145), transform: 'rotate(' + (p.tilt == null ? -14 : p.tilt) + 'deg)' } }, p.children));
  }
  function Stamp(p) {
    return h('span', { className: cx('dj-stamp', 'dj-stamp-' + (p.tone || 'alert'), p.className), style: { transform: 'rotate(' + (p.rotate == null ? -8 : p.rotate) + 'deg)' } },
      h('span', { className: 'dj-stamp-inner' }, p.children));
  }

  /* ---------- Navigation ---------- */
  function StatusPill(p) {
    var state = p.state || 'open';
    return h('span', { className: cx('dj-status', 'dj-status-' + state, p.className), role: 'status' },
      h('span', { className: 'dj-status-dot', 'aria-hidden': true }),
      h('span', { className: 'dj-status-label' }, p.label),
      p.time ? h('span', { className: 'dj-status-time' }, p.time) : null);
  }
  function NavBar(p) {
    var links = p.links || [{ label: 'Weekly Drop', href: '#drop' }, { label: 'Matcha Menu', href: '#menu' }, { label: 'How to Order', href: '#order' }];
    return h('header', { className: cx('dj-nav', p.className) },
      h('a', { className: 'dj-nav-brand', href: p.homeHref || '#top' }, h(Wordmark, { size: 'sm' })),
      p.status ? h('div', { className: 'dj-nav-status' }, h(StatusPill, p.status)) : h('span'),
      h('nav', { className: 'dj-nav-right', 'aria-label': 'Sections' },
        h('ul', { className: 'dj-nav-links' }, links.map(function (l) { return h('li', { key: l.label }, h('a', { href: l.href }, l.label)); })),
        h('button', { type: 'button', className: 'dj-bag', onClick: p.onBag, 'aria-label': 'Order bag, ' + (p.bagCount || 0) + ' items' },
          h(Doodle, { name: 'bag', size: 22 }), h('span', { className: 'dj-bag-count' }, p.bagCount || 0))));
  }
  function CheckoutBar(p) {
    return h('div', { className: cx('dj-checkout', p.inline && 'dj-checkout-inline', p.className), role: 'region', 'aria-label': 'Checkout' },
      h('div', { className: 'dj-checkout-info' },
        h('span', { className: 'dj-checkout-count' }, h(Doodle, { name: 'bag', size: 20 }), (p.count || 0) + (p.count === 1 ? ' cup' : ' cups'), h('b', null, p.total)),
        p.slot ? h('span', { className: 'dj-checkout-slot' }, p.slot) : null),
      h(Button, { variant: 'primary', onClick: p.onCheckout }, p.cta || 'Review order'));
  }

  /* ---------- Actions & inputs ---------- */
  function Button(p) {
    var rest = Object.assign({}, p); ['variant', 'size', 'icon', 'className', 'children', 'block'].forEach(function (k) { delete rest[k]; });
    var Tag = p.href ? 'a' : 'button';
    if (!p.href && !rest.type) rest.type = 'button';
    return h(Tag, Object.assign(rest, { className: cx('dj-btn', 'dj-btn-' + (p.variant || 'primary'), 'dj-btn-' + (p.size || 'md'), p.block && 'dj-btn-block', p.className) }),
      p.icon ? h(Doodle, { name: p.icon, size: p.size === 'lg' ? 22 : 18 }) : null, h('span', null, p.children));
  }
  function ChoicePills(p) {
    var name = useId('pills');
    var opts = (p.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
    var st = useControlled(p.value, p.defaultValue !== undefined ? p.defaultValue : (opts[0] && opts[0].value), p.onChange), val = st[0], set = st[1];
    return h('fieldset', { className: cx('dj-pills', 'dj-pills-' + (p.variant || 'pills'), p.className) },
      p.label ? h('legend', { className: 'dj-field-label' }, p.label) : null,
      h('div', { className: 'dj-pills-row' }, opts.map(function (o) {
        var on = o.value === val;
        return h('label', { key: o.value, className: cx('dj-pill', on && 'is-on', o.disabled && 'is-disabled') },
          h('input', { type: 'radio', name: name, value: o.value, checked: on, disabled: o.disabled, onChange: function () { set(o.value); } }),
          o.icon ? h(Doodle, { name: o.icon, size: 18 }) : null,
          h('span', null, o.label), o.hint ? h('small', null, o.hint) : null);
      })));
  }
  function TextField(p) {
    var id = useId('field'), hintId = id + '-hint';
    var Ctl = p.multiline ? 'textarea' : 'input';
    var ctl = { id: id, className: 'dj-input', value: p.value, defaultValue: p.defaultValue, placeholder: p.placeholder, required: p.required, maxLength: p.maxLength,
      onChange: p.onChange, 'aria-invalid': p.error ? true : undefined, 'aria-describedby': (p.error || p.hint) ? hintId : undefined, inputMode: p.inputMode, autoComplete: p.autoComplete };
    if (!p.multiline) ctl.type = p.type || 'text'; else ctl.rows = p.rows || 3;
    return h('div', { className: cx('dj-field', p.error && 'is-invalid', p.className) },
      h('label', { className: 'dj-field-label', htmlFor: id }, p.label, p.required ? h('span', { className: 'dj-req', 'aria-hidden': true }, ' *') : null),
      h(Ctl, ctl),
      p.error ? h('p', { id: hintId, className: 'dj-field-error' }, h(Doodle, { name: 'sparkle', size: 16 }), p.error)
        : p.hint ? h('p', { id: hintId, className: 'dj-field-hint' }, p.hint) : null);
  }
  function FeeAck(p) {
    var st = useControlled(p.checked, !!p.defaultChecked, p.onChange), on = st[0], set = st[1];
    var id = useId('fee');
    return h('div', { className: cx('dj-fee', p.error && !on && 'is-invalid', p.className) },
      h('p', { className: 'dj-fee-note' }, '*Delivery fee is borne by customer.'),
      h('label', { className: 'dj-check', htmlFor: id },
        h('input', { id: id, type: 'checkbox', checked: on, onChange: function (e) { set(e.target.checked); }, 'aria-invalid': p.error && !on ? true : undefined }),
        h('span', { className: 'dj-check-box', 'aria-hidden': true }, h('svg', { viewBox: '0 0 16 16', width: 14, height: 14 }, h('path', { d: 'M3 8.5l3.2 3L13 4.5', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))),
        h('span', null, 'I understand that the Grab Express delivery fee is borne by the customer.')),
      p.error && !on ? h('p', { className: 'dj-field-error' }, h(Doodle, { name: 'sparkle', size: 16 }), 'Please tick this to send a Grab Express order.') : null);
  }
  function ZonePicker(p) {
    var st = useControlled(p.value, p.defaultValue, p.onChange), val = st[0], set = st[1];
    var opts = codZones.map(function (z) { return { value: z, label: z }; }).concat([{ value: 'OTHER', label: 'Somewhere else' }]);
    return h('div', { className: cx('dj-zones', p.className) },
      h(ChoicePills, { label: p.label || 'COD delivery area', options: opts, value: val === undefined ? null : val, onChange: set }),
      val === 'OTHER' ? h(Notice, { tone: 'alert', title: 'COD covers four areas only',
        action: h(Button, { variant: 'secondary', size: 'md', icon: 'scooter', onClick: p.onSwitchToGrab }, 'Switch to Grab Express') },
        'We deliver cash-on-delivery to KK, Penampang, Putatan and Kepayan. Grab Express can reach you anywhere else.') : null);
  }

  /* ---------- Menu ---------- */
  function CupPreview(p) {
    var layers = p.layers == null ? 5 : p.layers;
    var charm = p.charm || 'butterfly';
    var name = (p.name == null ? 'DA JU' : String(p.name)).slice(0, 14).trim();
    var words = name.split(/\s+/), lines = name.length > 4 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name];
    var fs = Math.max(18, Math.min(40, 132 / (0.7 * Math.max.apply(null, lines.map(function (l) { return l.length || 1; })))));
    var cid = useId('cup');
    var cup = 'M34 52 L54 246 Q100 254 146 246 L166 52 Z';
    function fly(x, y, r, cls, k) {
      return h('g', { key: k, transform: 'translate(' + x + ' ' + y + ') rotate(' + r + ') scale(.42)', className: 'dj-cup-fly ' + cls },
        h('path', { d: 'M0 -2c-4-8.5-15-11-15-2.5 0 5.5 6.5 7.5 15 4.5z M0 -2c4-8.5 15-11 15-2.5 0 5.5-6.5 7.5-15 4.5z M0 4c-3.5 1.5-10.5 4-9.5 9 .8 4 7 2.5 9.5-5z M0 4c3.5 1.5 10.5 4 9.5 9-.8 4-7 2.5-9.5-5z' }),
        h('path', { d: 'M0 -6v18', className: 'dj-cup-fly-body' }));
    }
    return h('figure', { className: cx('dj-cup', p.className), style: { width: p.width || 220 } },
      h('svg', { viewBox: '0 0 200 270', role: 'img', 'aria-label': p.alt || ('Illustrated iced matcha cup' + (name ? ' with "' + name + '" written on it' : '') + (charm !== 'none' ? ', decorated with ' + (charm === 'ribbon' ? 'a pink ribbon' : charm === 'both' ? 'a ribbon and butterfly charms' : 'butterfly charms') : '')) },
        h('defs', null, h('clipPath', { id: cid }, h('path', { d: cup }))),
        h('g', { clipPath: 'url(#' + cid + ')' },
          h('rect', { className: 'dj-cup-clear', x: 0, y: 40, width: 200, height: 232 }),
          layers >= 3 ? h(window.React.Fragment, null,
            h('rect', { className: 'dj-cup-milk', x: 0, y: 92, width: 200, height: 180 }),
            h('path', { className: 'dj-cup-matcha', d: 'M0 140 C40 118 70 160 110 138 S170 120 200 132 V272 H0 Z' }),
            h('path', { className: 'dj-cup-swirl', d: 'M58 150 C80 140 96 168 124 150 M70 196 C92 184 112 210 140 192' })) : null,
          layers >= 4 ? h('path', { className: 'dj-cup-foam', d: 'M0 50 H200 V96 C186 104 172 92 158 100 S130 92 116 100 S88 92 74 100 S46 92 32 100 S8 94 0 98 Z' }) : null,
          layers >= 2 ? h('g', { className: 'dj-cup-ice' },
            h('rect', { x: 52, y: 60, width: 30, height: 28, rx: 7, transform: 'rotate(-12 67 74)' }),
            h('rect', { x: 92, y: 56, width: 30, height: 28, rx: 7, transform: 'rotate(8 107 70)' }),
            h('rect', { x: 128, y: 64, width: 26, height: 24, rx: 6, transform: 'rotate(-6 141 76)' }),
            h('rect', { x: 74, y: 98, width: 26, height: 24, rx: 6, transform: 'rotate(14 87 110)', className: 'dj-cup-ice-low' })) : null),
        h('path', { className: 'dj-cup-glass', d: cup }),
        h('ellipse', { className: 'dj-cup-rim', cx: 100, cy: 52, rx: 68, ry: 7 }),
        name ? h('text', { className: 'dj-cup-name', x: 100, y: lines.length > 1 ? 172 : 190, textAnchor: 'middle', fontSize: fs, transform: 'rotate(-5 100 180)' },
          lines.map(function (l, i) { return h('tspan', { key: i, x: 100, dy: i ? fs * 1.05 : 0 }, l); })) : null,
        layers >= 5 && (charm === 'ribbon' || charm === 'both') ? h('g', { className: 'dj-cup-bow', transform: 'translate(100 118)' },
          h('path', { d: 'M0 0c-10-11-27-14-27-3s17 11 27 3z M0 0c10-11 27-14 27-3s-17 11-27 3z' }),
          h('path', { className: 'dj-cup-bow-tail', d: 'M-2 3l-12 34 M2 3l12 34' }),
          h('circle', { r: 4.5 })) : null,
        layers >= 5 && (charm === 'butterfly' || charm === 'both') ? h('g', null,
          fly(52, 128, -18, 'is-ribbon', 1), fly(146, 112, 14, 'is-seasalt', 2), fly(140, 210, -10, 'is-doodle', 3), fly(64, 222, 12, 'is-seasalt', 4), fly(104, 236, 0, 'is-ribbon', 5)) : null),
      p.caption ? h('figcaption', { className: 'dj-cup-caption' }, p.caption) : null);
  }
  function ProductCard(p) {
    var status = p.status || 'available';
    var sold = status === 'soldout';
    var st = useState(false), photo = st[0], setPhoto = st[1];
    var canFlip = !!(p.image && (p.art !== null));
    return h('article', { className: cx('dj-card', sold && 'is-soldout', p.className), style: p.tilt ? { '--dj-tilt': p.tilt + 'deg' } : null },
      h('div', { className: cx('dj-card-media', photo && 'show-photo') },
        h('div', { className: 'dj-card-art' }, p.art !== undefined ? p.art : h(CupPreview, { width: 150, name: 'DA JU', charm: 'butterfly' })),
        p.image ? h('img', { className: 'dj-card-photo', src: p.image, alt: p.imageAlt || ('Photo of ' + p.name), loading: 'lazy' }) : null,
        canFlip ? h('button', { type: 'button', className: 'dj-card-flip', 'aria-pressed': photo, onClick: function () { setPhoto(!photo); } }, photo ? 'See the art' : 'See the real cup') : null,
        status === 'weekly' ? h(Stamp, { tone: 'seasalt', rotate: 6, className: 'dj-card-stamp' }, 'Matcha of the Week') : null,
        sold ? h(Stamp, { tone: 'alert', className: 'dj-card-stamp dj-card-stamp-big' }, 'Sold out for today') : null),
      h('div', { className: 'dj-card-body' },
        h('p', { className: 'dj-card-cat' }, p.category || 'Matcha'),
        h('h3', { className: 'dj-card-title' }, p.flavor ? h('span', { className: 'dj-card-script', 'aria-hidden': true }, p.flavor) : null, h('span', { className: p.flavor ? 'dj-card-name' : 'dj-card-name dj-card-name-lg' }, p.name)),
        p.note ? h('p', { className: 'dj-card-note' }, p.note) : null,
        h('div', { className: 'dj-card-foot' },
          h('span', { className: 'dj-card-price' }, p.price),
          h(Button, { variant: 'sticker', icon: sold ? null : 'sparkle', disabled: sold, onClick: p.onAdd }, sold ? 'Sold out' : (p.cta || 'Customize & add'))),
        sold && p.suggestion ? h('p', { className: 'dj-card-suggest' }, p.suggestion) : null));
  }

  /* ---------- Ordering ---------- */
  function ChannelCard(p) {
    var key = p.channel || 'PICK_UP', d = schedule[key];
    function col(kind) {
      var c = d[kind], on = p.active === kind;
      return h('div', { className: cx('dj-chan-col', on && 'is-active') },
        h('span', { className: 'dj-chan-badge' }, kind === 'weekday' ? 'Weekdays' : 'Weekend'),
        h('p', { className: 'dj-chan-days' }, c.days),
        c.location ? h('p', { className: 'dj-chan-line' }, h(Doodle, { name: 'pin', size: 16 }), c.location) : null,
        c.label ? h('p', { className: 'dj-chan-sub' }, c.label) : null,
        h('p', { className: 'dj-chan-time' }, c.time),
        c.area ? h('p', { className: 'dj-chan-sub' }, 'Cover area: ' + c.area) : null);
    }
    return h('section', { className: cx('dj-chan', p.selected && 'is-selected', p.className), 'aria-label': d.title },
      h('div', { className: 'dj-chan-head' },
        h('span', { className: 'dj-chan-step' }, d.step),
        h('span', { className: 'dj-chan-icon' }, h(Doodle, { name: d.icon, size: 34 })),
        h('h3', { className: 'dj-chan-title' }, d.title)),
      h('div', { className: 'dj-chan-cols' }, col('weekday'), col('weekend')),
      d.note ? h('p', { className: 'dj-chan-note' }, d.note) : null);
  }
  var NOTICE_ICON = { info: 'sparkle', alert: 'sparkle', availability: 'clock', success: 'sparkle' };
  function Notice(p) {
    var tone = p.tone || 'info';
    return h('div', { className: cx('dj-notice', 'dj-notice-' + tone, p.className), role: tone === 'alert' ? 'alert' : 'status' },
      h('span', { className: 'dj-notice-icon' }, h(Doodle, { name: p.icon || NOTICE_ICON[tone], size: 22 })),
      h('div', { className: 'dj-notice-body' },
        p.title ? h('p', { className: 'dj-notice-title' }, p.title) : null,
        h('div', { className: 'dj-notice-text' }, p.children),
        p.action ? h('div', { className: 'dj-notice-action' }, p.action) : null));
  }
  var MODE_LABEL = { PICK_UP: 'Pick Up', GRAB_EXPRESS: 'Grab Express', COD: 'COD' };
  var SCHED_LABEL = { WEEKDAY: 'Weekday', WEEKEND: 'Weekend' };
  function ticketText(o) {
    var L = ['=== DAJU MATCHA ORDER TICKET ===',
      'Ref: ' + (o.orderRef || ''),
      'Customer: ' + (o.customer || '') + ' (' + (o.phone || '') + ')',
      'Mode: ' + (MODE_LABEL[o.mode] || o.mode || '') + ' — ' + (SCHED_LABEL[o.schedule] || o.schedule || ''),
      'Location / Zone: ' + (o.location || ''),
      'Time Window: ' + String(o.time || '').replace(/ – /g, '-').replace(/ (AM|PM)/g, '$1')];
    if (o.address) L.push('Address Notes: ' + o.address);
    L.push('ITEMS:');
    (o.items || []).forEach(function (it) {
      L.push((it.qty || 1) + 'x ' + it.name);
      L.push('  - Ice: ' + (it.ice || 'Normal') + ' | Sweetness: ' + (it.sweetness || 'Normal'));
      if (it.cupName || it.flair) L.push('  - Cup Name: "' + (it.cupName || '') + '" | Flair: ' + (it.flair || 'None'));
    });
    if (o.mode === 'GRAB_EXPRESS') L.push('Policy Note: Grab Express delivery fee borne by customer — ' + (o.feeAck ? 'Acknowledged' : 'NOT acknowledged'));
    L.push('Estimated Subtotal: ' + (o.subtotal || '') + (o.mode === 'GRAB_EXPRESS' ? ' (Excl. any Grab Express fee)' : ''));
    L.push('================================');
    return L.join('\n');
  }
  function OrderTicket(p) {
    function row(k, v) { return v ? h('div', { className: 'dj-tk-row', key: k }, h('dt', null, k), h('dd', null, v)) : null; }
    return h('article', { className: cx('dj-ticket', p.className), 'aria-label': 'Order ticket ' + (p.orderRef || '') },
      h('header', { className: 'dj-tk-head' },
        h(Wordmark, { size: 'sm' }),
        h('p', { className: 'dj-tk-motto' }, 'Freshly Made. Made For You.'),
        p.orderRef ? h('p', { className: 'dj-tk-ref' }, 'Ref ' + p.orderRef) : null),
      h('dl', { className: 'dj-tk-meta' },
        row('Customer', p.customer && (p.customer + (p.phone ? ' · ' + p.phone : ''))),
        row('Mode', p.mode && ((MODE_LABEL[p.mode] || p.mode) + ' — ' + (SCHED_LABEL[p.schedule] || p.schedule || ''))),
        row('Where', p.location), row('When', p.time), row('Notes', p.address)),
      h('ul', { className: 'dj-tk-items' }, (p.items || []).map(function (it, i) {
        return h('li', { key: i },
          h('div', { className: 'dj-tk-item' }, h('span', null, (it.qty || 1) + '× ' + it.name), it.price ? h('span', null, it.price) : null),
          h('p', { className: 'dj-tk-mods' }, 'Ice ' + (it.ice || 'Normal') + ' · Sweetness ' + (it.sweetness || 'Normal') + (it.flair ? ' · ' + it.flair : '')),
          it.cupName ? h('p', { className: 'dj-tk-cupname' }, it.cupName) : null);
      })),
      p.mode === 'GRAB_EXPRESS' ? h('p', { className: cx('dj-tk-policy', !p.feeAck && 'is-missing') }, p.feeAck ? 'Grab Express fee borne by customer — acknowledged' : 'Grab Express fee not acknowledged') : null,
      h('div', { className: 'dj-tk-total' }, h('span', null, 'Estimated subtotal'), h('b', null, p.subtotal)),
      p.mode === 'GRAB_EXPRESS' ? h('p', { className: 'dj-tk-fine' }, 'Excl. any Grab Express fee') : null,
      p.actions ? h('div', { className: 'dj-tk-actions' }, p.actions) : null);
  }
  function Drawer(p) {
    var ref = useRef(null);
    useEffect(function () {
      if (!p.open || p.inline) return;
      var el = ref.current; if (el) { var f = el.querySelector('button, [href], input, select, textarea'); if (f) f.focus(); }
      function onKey(e) { if (e.key === 'Escape' && p.onClose) p.onClose(); }
      document.addEventListener('keydown', onKey); return function () { document.removeEventListener('keydown', onKey); };
    }, [p.open, p.inline]);
    if (!p.open && !p.inline) return null;
    var panel = h('div', { ref: ref, className: cx('dj-drawer', 'dj-drawer-' + (p.side || 'right'), p.inline && 'dj-drawer-inline', p.className), role: 'dialog', 'aria-modal': p.inline ? undefined : true, 'aria-label': p.title },
      h('div', { className: 'dj-drawer-head' },
        p.step ? h('p', { className: 'dj-drawer-step' }, p.step) : null,
        h('h2', { className: 'dj-drawer-title' }, p.title),
        h('button', { type: 'button', className: 'dj-drawer-close', onClick: p.onClose, 'aria-label': 'Close' }, h('svg', { viewBox: '0 0 24 24', width: 20, height: 20 }, h('path', { d: 'M6 6l12 12M18 6L6 18', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' })))),
      h('div', { className: 'dj-drawer-body' }, p.children),
      p.footer ? h('div', { className: 'dj-drawer-foot' }, p.footer) : null);
    return p.inline ? panel : h('div', { className: 'dj-drawer-scrim', onClick: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } }, panel);
  }

  var api = { Wordmark: Wordmark, StickerHeadline: StickerHeadline, SpeechBubble: SpeechBubble, Doodle: Doodle, Stamp: Stamp, NavBar: NavBar, StatusPill: StatusPill, CheckoutBar: CheckoutBar,
    Button: Button, ChoicePills: ChoicePills, TextField: TextField, FeeAck: FeeAck, ZonePicker: ZonePicker, ProductCard: ProductCard, CupPreview: CupPreview,
    ChannelCard: ChannelCard, Notice: Notice, OrderTicket: OrderTicket, Drawer: Drawer, schedule: schedule, codZones: codZones, ticketText: ticketText, icons: Object.keys(ICONS) };
  window.Daju = Object.assign(window.Daju || {}, api);
})();
