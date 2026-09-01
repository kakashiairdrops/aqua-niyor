/* =============================================================
   AQUA NIYOR — single place to edit business details & pricing
   ============================================================= */

export const BRAND = {
  name: 'Aqua Niyor',
  tagline: 'Packaged Drinking Water',
  city: 'Nagaon, Assam',

  // --- swap the logo here -------------------------------------
  // Drop your logo file into  assets/  and point this at it.
  // logo     = the full lockup (droplet + wordmark), used in the
  //            header and the loading screen
  // logoMark = the droplet on its own, used for the favicon and
  //            the 3D bottle label; falls back to logo if unset
  logo: 'assets/logo.png',
  logoMark: 'assets/logo-mark.png',

  // the blue sampled from the logo artwork — the site's accent
  color: '#0289ca',

  phone: '+91 91010 33546',
  phoneDial: '+919101033546',
  whatsapp: '919101033546',            // digits only, with country code
  email: 'debashreeaqua@gmail.com',
  mapUrl: 'https://share.google/OW5BY2M8Pigvt3sqj',
};

/* Products ------------------------------------------------------
   An ORDERED array — display order is exactly this order.
   (A plain object keyed by "500"/"700" would get silently
   re-sorted numerically by the JS engine.)
   bottlesPerCrate is used only for the "x bottles" line in the
   quotation — change it to your real packing count.            */
export const PRODUCTS = [
  {
    id: '500',
    label: '500 ml',
    name: 'Aqua Niyor 500 ml',
    blurb: 'The slender format. Laid at each place setting, carried through meetings, handed out at gatherings.',
    bottlesPerCrate: 24,
    slabs: [
      { min: 1,   max: 29,       rate: 125 },
      { min: 30,  max: 50,       rate: 115 },
      { min: 51,  max: 120,      rate: 110 },
      { min: 121, max: Infinity, rate: 108 },
    ],
  },
  {
    id: '700',
    label: '700 ml',
    name: 'Aqua Niyor 700 ml',
    blurb: 'The everyday bottle. Sized for the counter, the office desk and the long afternoon.',
    bottlesPerCrate: 24,
    slabs: [
      { min: 1,   max: 29,       rate: 130 },
      { min: 30,  max: 50,       rate: 120 },
      { min: 51,  max: 120,      rate: 115 },
      { min: 121, max: Infinity, rate: 112 },
    ],
  },
];

/** Which size the booking form starts on. */
export const DEFAULT_SIZE = '700';

/** Look up a product by its id ('500' | '700'). */
export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === String(id)) || PRODUCTS[0];
}

export const PROCESS = [
  { n: 'I',   t: 'The Source', d: 'Groundwater drawn from a protected bore beneath Nagaon.' },
  { n: 'II',  t: 'Sand & Carbon', d: 'Sediment, colour and odour taken out in successive beds.' },
  { n: 'III', t: 'Reverse Osmosis', d: 'Membrane filtration down to dissolved salts and heavy metals.' },
  { n: 'IV',  t: 'Ultraviolet & Ozone', d: 'A double disinfection, so nothing living passes through.' },
  { n: 'V',   t: 'Rinse, Fill, Seal', d: 'Bottles rinsed, filled and capped without a hand touching them.' },
  { n: 'VI',  t: 'Batch Testing', d: 'TDS, pH and microbiology recorded for every single batch.' },
  { n: 'VII', t: 'Delivered', d: 'Crates loaded and carried across Nagaon and the district around it.' },
];

/** Rate per crate for a given size + crate count. */
export function rateFor(sizeId, crates) {
  const p = getProduct(sizeId);
  if (!p || crates < 1) return 0;
  const slab = p.slabs.find((s) => crates >= s.min && crates <= s.max);
  return slab ? slab.rate : p.slabs[p.slabs.length - 1].rate;
}

/** The slab a crate count falls into. */
export function slabFor(sizeId, crates) {
  const p = getProduct(sizeId);
  return p.slabs.find((s) => crates >= s.min && crates <= s.max) || p.slabs[p.slabs.length - 1];
}

/** Highest (1-crate) rate, used to show how much bulk saves. */
export function baseRate(sizeId) {
  return getProduct(sizeId).slabs[0].rate;
}

/** Cheapest rate across every product — for the hero stat. */
export function lowestRate() {
  return Math.min(...PRODUCTS.flatMap((p) => p.slabs.map((s) => s.rate)));
}

export function slabLabel(slab) {
  return slab.max === Infinity ? `${slab.min}+ crates` : `${slab.min}–${slab.max} crates`;
}

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
