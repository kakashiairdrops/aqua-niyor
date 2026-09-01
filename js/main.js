/* =============================================================
   AQUA NIYOR — page logic: rendering, live quotation, WhatsApp
   ============================================================= */
import {
  BRAND, PRODUCTS, PROCESS, DEFAULT_SIZE,
  getProduct, rateFor, slabFor, baseRate, lowestRate, slabLabel, inr,
} from './config.js';
import { initScene, webglOK } from './scene.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- boot ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyBrand();
  renderProducts();
  renderProcess();
  renderSizeChoices();
  renderContact();
  wireNav();
  wireForm();
  wireReveal();
  wireFab();
  update();

  if (webglOK()) {
    try { initScene($('#scene')); }
    catch (err) { console.warn('3D scene unavailable:', err); staticBackdrop(); }
  } else {
    staticBackdrop();
  }

  // let the first paint settle, then lift the loader
  setTimeout(() => $('#loader').classList.add('done'), 1000);
});

/* ---------------- brand plumbing ---------------- */
function applyBrand() {
  $$('#brandLogo, #loader img').forEach((img) => { img.src = BRAND.logo; });
  $('#yr').textContent = new Date().getFullYear();
  $('#callBtn').href = `tel:${BRAND.phoneDial}`;

  const lowest = lowestRate();
  $('#stat1').textContent = inr(lowest);
  $('#stat2').textContent = PROCESS.length;
  // bottles per crate — identical across sizes, so show the figure itself
  const perCrate = [...new Set(PRODUCTS.map((p) => p.bottlesPerCrate))];
  $('#stat3').textContent = perCrate.length === 1 ? perCrate[0] : PRODUCTS.length;

  // minimum date = today
  const d = new Date();
  $('#date').min = d.toISOString().slice(0, 10);
}

/* ---------------- product cards ---------------- */
function renderProducts() {
  $('#prodGrid').innerHTML = PRODUCTS.map((p) => {
    const [num, unit] = p.label.split(' ');
    return `
    <article class="prod reveal">
      <div class="size">${num}<em>${unit}</em></div>
      <p>${p.blurb}</p>
      <table class="slab-table">
        <thead><tr><th>Quantity</th><th style="text-align:right">Per crate</th></tr></thead>
        <tbody>
          ${p.slabs.map((s) => `<tr><td>${slabLabel(s)}</td><td>${inr(s.rate)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap">
        <span class="chip">${p.bottlesPerCrate} bottles per crate</span>
        <button class="btn btn-ghost" type="button" data-pick="${p.id}">Select ${p.label}</button>
      </div>
    </article>`;
  }).join('');

  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    const input = $(`input[name="size"][value="${b.dataset.pick}"]`);
    if (input) { input.checked = true; update(); }
    $('#book').scrollIntoView({ behavior: 'smooth' });
  }));
}

function renderProcess() {
  $('#steps').innerHTML = PROCESS.map((s) => `
    <div class="step reveal">
      <b>${s.n}</b>
      <div><h4>${s.t}</h4><p>${s.d}</p></div>
    </div>
  `).join('');
}

function renderSizeChoices() {
  $('#sizeSeg').innerHTML = PRODUCTS.map((p) => `
    <label>
      <input type="radio" name="size" value="${p.id}" ${p.id === DEFAULT_SIZE ? 'checked' : ''} />
      <b>${p.label}</b>
      <span>from ${inr(p.slabs[p.slabs.length - 1].rate)} a crate</span>
    </label>
  `).join('');
  $$('input[name="size"]').forEach((r) => r.addEventListener('change', update));
}

function renderContact() {
  const items = [
    { s: 'Call or WhatsApp', b: BRAND.phone, e: 'Tap to dial', href: `tel:${BRAND.phoneDial}` },
    { s: 'Email', b: BRAND.email, e: 'Orders & invoices', href: `mailto:${BRAND.email}` },
    { s: 'The plant', b: BRAND.city, e: 'Open in Maps', href: BRAND.mapUrl, ext: true },
  ];
  $('#contactGrid').innerHTML = items.map((i) => `
    <a class="cc" href="${i.href}" ${i.ext ? 'target="_blank" rel="noopener"' : ''}>
      <span>${i.s}</span><b>${i.b}</b><em>${i.e}</em>
    </a>
  `).join('');
}

/* ---------------- nav / scroll chrome ---------------- */
function wireNav() {
  const nav = $('#nav'), links = $('#navLinks'), burger = $('#burger');
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
}

function wireReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px' });
  $$('.reveal').forEach((el, i) => {
    // gentle stagger — slower and more even than a snappy UI would use
    el.style.transitionDelay = `${Math.min(i % 5, 4) * 110}ms`;
    io.observe(el);
  });
}

function wireFab() {
  const fab = $('#fab');
  fab.href = waLink(
    `Hello Aqua Niyor, I would like to enquire about your ${PRODUCTS.map((p) => p.label).join(' and ')} water crates.`
  );
  const onScroll = () => fab.classList.toggle('show', window.scrollY > 460);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- quotation ---------------- */
function readState() {
  const size = ($('input[name="size"]:checked') || {}).value || DEFAULT_SIZE;
  const crates = Math.max(0, Math.floor(Number($('#crates').value) || 0));
  return { size, crates, product: getProduct(size) };
}

function update() {
  const { size, crates, product } = readState();
  const safe = Math.max(crates, 1);
  const rate = rateFor(size, safe);
  const total = rate * safe;
  const bottles = product.bottlesPerCrate * safe;
  const slab = slabFor(size, safe);

  $('#slabChip').textContent = slabLabel(slab);
  $('#total').firstChild.nodeValue = inr(total);
  $('#totalSub').textContent = `${safe} crate${safe > 1 ? 's' : ''} · ${product.label}`;

  $('#sumList').innerHTML = `
    <li><span>Product</span><b>${product.name}</b></li>
    <li><span>Crates</span><b>${safe}</b></li>
    <li><span>Bottles</span><b>${bottles.toLocaleString('en-IN')}</b></li>
    <li><span>Rate applied</span><b>${inr(rate)} per crate</b></li>
    <li><span>Estimated total</span><b>${inr(total)}</b></li>
  `;

  // savings against the 1-crate rate
  const base = baseRate(size);
  const saved = (base - rate) * safe;
  const note = $('#saveNote');
  if (saved > 0) {
    note.hidden = false;
    note.textContent = `Bulk rate applied — ${inr(saved)} below the ${inr(base)} single-crate rate.`;
  } else {
    const first = product.slabs[1];
    note.hidden = false;
    note.textContent = first
      ? `Standard rate ${inr(base)} per crate. At ${first.min} crates it eases to ${inr(first.rate)}.`
      : `Standard rate ${inr(base)} per crate.`;
  }

  // nudge toward the next slab
  const nextSlab = product.slabs.find((s) => s.min > safe);
  const nx = $('#nextSlab');
  if (nextSlab) {
    const need = nextSlab.min - safe;
    nx.hidden = false;
    nx.textContent = `${need} crate${need > 1 ? 's' : ''} more — ${nextSlab.min} in total — brings the rate to ${inr(nextSlab.rate)}.`;
  } else {
    nx.hidden = true;
  }

  $('#rateFine').textContent = `Per crate of ${product.bottlesPerCrate} × ${product.label} bottles, ex-Nagaon. Delivery on larger orders is confirmed on WhatsApp.`;
  $('#fab').href = waLink(quotationText({ ...readState(), rate, total, bottles }, {}));
}

function quotationText(q, cust) {
  const p = getProduct(q.size);
  const crates = Math.max(q.crates, 1);
  const L = [
    '*AQUA NIYOR — ORDER REQUEST*',
    '',
    `*Product:* ${p.name}`,
    `*Crates:* ${crates}`,
    `*Bottles:* ${p.bottlesPerCrate * crates}`,
    `*Rate:* ${inr(q.rate)} per crate`,
    `*Estimated total:* ${inr(q.total)}`,
  ];
  if (cust.name)  L.push('', `*Name:* ${cust.name}`);
  if (cust.phone) L.push(`*Phone:* ${cust.phone}`);
  if (cust.ptype) L.push(`*Ordering for:* ${cust.ptype}`);
  if (cust.date)  L.push(`*Required by:* ${cust.date}`);
  if (cust.addr)  L.push(`*Delivery address:* ${cust.addr}`);
  if (cust.note)  L.push(`*Note:* ${cust.note}`);
  L.push('', 'Please confirm availability and delivery. Thank you.');
  return L.join('\n');
}

function waLink(text) {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}

/* ---------------- form ---------------- */
function wireForm() {
  const crates = $('#crates');

  crates.addEventListener('input', update);
  $('#minus').addEventListener('click', () => bump(-1));
  $('#plus').addEventListener('click', () => bump(+1));
  $$('.quick button').forEach((b) => b.addEventListener('click', () => {
    crates.value = b.dataset.q; update(); flash(crates);
  }));

  function bump(d) {
    const step = Math.abs(Number(crates.value) || 0) >= 50 ? 10 : 1;
    crates.value = Math.max(1, (Number(crates.value) || 0) + d * step);
    update();
  }

  $('#copyBtn').addEventListener('click', async () => {
    const { size, crates: c } = readState();
    const n = Math.max(c, 1), rate = rateFor(size, n);
    const txt = quotationText({ size, crates: n, rate, total: rate * n }, gather());
    try {
      await navigator.clipboard.writeText(txt);
      toast('Quotation copied to clipboard');
    } catch {
      toast('Copy failed — long-press to select instead');
    }
  });

  $('#orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { size, crates: c } = readState();
    const n = Math.max(c, 1), rate = rateFor(size, n);
    const url = waLink(quotationText({ size, crates: n, rate, total: rate * n }, gather()));
    toast('Opening WhatsApp with your quotation…');
    window.open(url, '_blank', 'noopener');
  });
}

function gather() {
  const raw = $('#date').value;
  return {
    name: $('#name').value.trim(),
    phone: $('#phone').value.trim(),
    ptype: $('#ptype').value,
    date: raw ? new Date(raw + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    addr: $('#addr').value.trim().replace(/\s*\n\s*/g, ', '),
    note: $('#note').value.trim(),
  };
}

function validate() {
  let ok = true;
  const set = (errId, bad, field) => {
    $(errId).classList.toggle('show', bad);
    if (bad) { ok = false; if (field) flash($(field)); }
  };

  const n = Number($('#crates').value);
  set('#cratesErr', !Number.isFinite(n) || n < 1, '#crates');
  set('#nameErr', $('#name').value.trim().length < 2, '#name');

  const digits = $('#phone').value.replace(/\D/g, '');
  set('#phoneErr', !(digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))), '#phone');

  set('#addrErr', $('#addr').value.trim().length < 6, '#addr');

  if (!ok) {
    const firstErr = $('.err.show');
    firstErr?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }
  return ok;
}

function flash(el) {
  if (!el) return;
  const prev = el.style.borderBottomColor;
  el.style.transition = 'border-color .35s ease';
  el.style.borderBottomColor = '#cbb083';
  setTimeout(() => { el.style.borderBottomColor = prev; }, 750);
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------------- fallback backdrop (no WebGL) ---------------- */
function staticBackdrop() {
  $('#scene').style.background =
    'radial-gradient(56% 58% at 74% 40%, rgba(203,176,131,.16), transparent 68%),' +
    'radial-gradient(44% 48% at 22% 66%, rgba(127,212,232,.10), transparent 72%),' +
    'linear-gradient(168deg, #0b1220, #05070d 72%)';
}
