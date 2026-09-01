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

**Logo** — drop your file into `assets/` and point `BRAND.logo` at it:

```js
logo: 'assets/logo.png',   // currently a placeholder gold droplet
```

It feeds the header, the loading screen and the browser tab. The 3D bottle's
label is drawn in code (`labelTexture()` in `js/scene.js`) — once your real
logo arrives it can be painted onto that label too.

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
champagne-gold accents, Cormorant Garamond display type over Jost, and a fine
film grain. Motion is deliberately slow — long easings, a 1.1s reveal.

The hero is a three.js scene: a crystal bottle with a gold closure and a
gold-ruled label on a dark reflective stage, lit by a warm key and a cool fill.
It rotates slowly, tilts toward the cursor, spins further when dragged, and
lifts as you scroll. Without WebGL it falls back to a static gradient.

## Files

```
index.html        page markup
css/style.css     the theme — colour, type, layout
js/config.js      brand details + pricing  ← edit this
js/main.js        rendering, live quotation, WhatsApp message
js/scene.js       the 3D hero (three.js) + label artwork
vendor/three.js   pinned three.js r169
assets/logo.svg   placeholder logo
```

## Deploying

Upload the whole `aqua-niyor` folder to any static host — Netlify, Vercel,
Cloudflare Pages, GitHub Pages or ordinary cPanel hosting. No configuration
needed.

## Picking this up later

Done so far: full page, premium theme, 3D hero, live quotation with all eight
rate slabs, WhatsApp ordering, mobile layout.

Open items:

- Replace the placeholder logo, and paint the real mark on the 3D bottle label.
- Confirm delivery radius wording and any minimum order.
- Optional: photographs of the plant for the Purity section.
- Optional: a backend if orders should also be logged or emailed.
