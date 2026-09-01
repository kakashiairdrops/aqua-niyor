# Aqua Niyor — website

3D animated site for Aqua Niyor packaged drinking water, Nagaon (Assam).
Plain HTML/CSS/JS modules with a vendored three.js — no build step, no install.

## Run it locally

```bash
cd aqua-niyor
python3 -m http.server 8899
# open http://127.0.0.1:8899
```

Serve it over http:// rather than opening the file directly — the JavaScript
uses ES modules, which browsers block on `file://`.

## Things you'll want to change

Everything business-related lives in one file: `js/config.js`.

**Logo** — your artwork is already in place, keyed off its white background
into transparent PNGs:

```js
logo:     'assets/logo.png',       // full lockup — header, bottle label
logoMark: 'assets/logo-mark.png',  // droplet alone — favicon, loader, footer
```

Both were cut from `assets/photo_2026-09-01_16-16-30.jpg` (kept as the
original). If you get a vector version later, drop the SVG into `assets/` and
repoint these two lines — nothing else needs touching.

**Prices** — edit the `slabs` arrays. Current rates, per crate:

| Crates | 500 ml | 700 ml |
| --- | --- | --- |
| 1–29 | ₹125 | ₹130 |
| 30–50 | ₹115 | ₹120 |
| 51–120 | ₹110 | ₹115 |
| 121+ | ₹108 | ₹112 |

Both sizes pack **24 bottles to a crate** (`bottlesPerCrate`).

**Contact / WhatsApp** — `BRAND.phone`, `BRAND.whatsapp` (digits with country
code, no `+`), `BRAND.email`, `BRAND.mapUrl`.

## How booking works

The visitor picks a size and crate count; the quotation panel recalculates the
slab rate, total, saving and next-tier hint live. On submit the form validates,
builds a formatted order message and opens `wa.me/919101033546` with it
prefilled — the customer presses send and the order lands in your WhatsApp.

There is no server and no database, so nothing is stored on the site and no
payment is taken. Every order arrives via WhatsApp only. Saving orders to a
sheet or emailing them automatically would need a small backend added.

## The look

A "still water" treatment: near-black indigo ground, hairline rules,
Cormorant Garamond display type over Jost, and a fine film grain. Motion is
deliberately slow — long easings, a 1.1s reveal.

The accent is `#0289ca`, sampled directly from the logo artwork, and it is the
only accent — set once as `--brand` in `css/style.css` (with `--brand-lt` and
`--brand-dp` derived from it) and mirrored in `js/scene.js`.

The hero is a three.js scene: a crystal bottle with a steel-blue closure and a
dark label carrying your logo, standing on a reflective stage lit by a white
key and a blue softbox. It rotates slowly, tilts toward the cursor, spins
further when dragged, and lifts as you scroll. Without WebGL it falls back to a
static gradient.

## Files

```
index.html        page markup
css/style.css     the theme — colour, type, layout
js/config.js      brand details + pricing  ← edit this
js/main.js        rendering, live quotation, WhatsApp message
js/scene.js       the 3D hero (three.js) + label artwork
vendor/three.js   pinned three.js r169
assets/logo.png   full lockup, transparent
assets/logo-mark.png  droplet only, transparent
```

## Deploying

Upload the whole `aqua-niyor` folder to any static host — Netlify, Vercel,
Cloudflare Pages, GitHub Pages or ordinary cPanel hosting. No configuration
needed.

## Picking this up later

Done so far: full page, premium theme in the brand blue, real logo wired
through (header, favicon, loader, footer and the 3D bottle label), 3D hero,
live quotation with all eight rate slabs, WhatsApp ordering, mobile layout.

Open items:

- Confirm delivery radius wording and any minimum order.
- Optional: photographs of the plant for the Purity section.
- Optional: a backend if orders should also be logged or emailed.
