# Dussa BakeLab

The website for **Dussa BakeLab** — a bakery in Kigali, Rwanda making handcrafted
cakes, cupcakes, cookies and custom creations.

> _Made with the finest ingredients, baked to be loved._

Built with **Vite + React**, **Tailwind CSS v4** and **Framer Motion**, with a
serverless order API designed to run on **Vercel**.

---

## What's in here

| Route | What it does |
| --- | --- |
| `/` | Home — hero, categories, story, bestsellers, process, occasion finder, gallery, reviews, info cards |
| `/creations` | Full catalogue with search, category, occasion and sort filters (all shareable via the URL) |
| `/creations/:slug` | Product page with a live customiser — size, flavour, finish, add-ons, cake message, quantity |
| `/order` | Four-step booking: basket → date & fulfilment → contact → review → submit |
| `/order/confirmed/:code` | Confirmation with the order code, progress timeline and a WhatsApp hand-off |
| `/track` · `/track/:code` | Public order tracking by code |
| `/about` · `/contact` | Brand story, principles, timeline; contact channels, delivery zones, FAQ |
| `/admin` | **Kitchen dashboard** — incoming orders, live refresh, status pipeline, search, CSV export |

### How ordering works

1. A customer builds a basket and submits the booking form.
2. The site `POST`s the order to `/api/orders`, which stores it and returns a
   short code like `DBL-K2XMQ4A`.
3. The order **appears in `/admin` automatically** — the dashboard polls every
   20 seconds, so nothing needs refreshing.
4. The customer gets the code plus a one-tap WhatsApp message pre-filled with
   the whole order, so the bakery is notified instantly either way.
5. The kitchen moves the order through _New → Confirmed → In the kitchen →
   Ready → Completed_, and the customer sees that live on `/track`.

If the API is ever unreachable, the order is saved in the customer's browser,
they still get their code, and the confirmation page pushes them to the WhatsApp
hand-off — an order is never silently lost.

---

## Running it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build into dist/
npm run preview      # serve the production build
npm run lint         # oxlint
npm run test:api     # exercises the order API end-to-end (21 checks)
```

`npm run dev` serves the front end only. To run the serverless functions too:

```bash
npx vercel dev       # front end + /api on http://localhost:3000
```

The Vite dev server proxies `/api` to port 3000, so both approaches work side by
side. Without an API running, the site falls back to local storage.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo. The framework preset
   (Vite) and `vercel.json` are already configured — no build settings to
   change.
3. Add the environment variables below.
4. Deploy.

### Environment variables

Copy `.env.example` for the full list. The two that matter:

| Variable | Why |
| --- | --- |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Where orders are stored. Add **Vercel KV** from the Storage tab and Vercel injects both for you; any Upstash Redis REST database also works (`UPSTASH_REDIS_REST_URL` / `_TOKEN` are read as a fallback). |
| `ADMIN_KEY` | The password for `/admin`. **Set this before going live** — while it is unset, any value opens the dashboard, and the dashboard says so on screen. |

Optional: `RESEND_API_KEY` + `ORDER_NOTIFY_EMAIL` to be emailed on every new
order, and `ALLOWED_ORIGIN` to lock the API to your own domain.

**Without a database** the API still works, but orders live in the serverless
function's memory and disappear when it goes cold. Fine for a demo, not for real
orders — the dashboard shows a warning until you connect one.

---

## Using your own photographs

Every product currently ships with hand-built SVG artwork (see
`src/art/CreationArt.jsx`), so the site is complete and nothing is ever missing
or broken. Swapping in real photos is a one-line change per product:

1. Drop the image in `public/images/`, e.g. `public/images/chocolate-drip.jpg`.
2. Add a `photo` field to that product in `src/data/catalog.js`:

```js
{
  slug: 'signature-chocolate-drip',
  name: 'Signature Chocolate Drip',
  photo: '/images/chocolate-drip.jpg',   // ← add this line
  ...
}
```

The photo takes over everywhere that product appears — cards, product page,
basket, confirmation. If a file is ever missing or fails to load, the
illustration comes back automatically, so a broken image never reaches a
customer.

Square or 4:3 images at roughly 1200px wide work best.

---

## Changing the content

Almost everything is data, not markup:

| File | Contains |
| --- | --- |
| `src/data/site.js` | Phone, WhatsApp, Instagram, email, hours, delivery zones and fees, lead times, deposit % |
| `src/data/catalog.js` | Every product, its sizes and prices (RWF), flavours, finishes, add-ons, categories and occasions |
| `src/data/content.js` | Story copy, values, process steps, reviews, FAQ, stats, gallery captions |

Change a price or a phone number in one place and it updates across the whole
site, including the order flow and the dashboard.

### Adding a product

Append an entry to `PRODUCTS` in `src/data/catalog.js`. It appears in the
catalogue, search, occasion finder and order flow immediately — no other file
needs touching. `art` picks one of the illustrations
(`dripCake`, `tieredCake`, `cupcake`, `cookieStack`, `cakeSlice`, `macarons`,
`donut`, `brownies`, `cheesecake`, `celebrationCake`) and `flavorArt` picks its
colour palette from `src/art/palettes.js`.

---

## Project structure

```
api/                  Vercel serverless functions
  orders.js             POST create · GET list (admin)
  orders/[code].js      GET track · PATCH status (admin)
  _lib/                 storage adapter, HTTP helpers, email notifications
src/
  art/                  SVG artwork system, palettes, logo
  components/           Nav, footer, cart drawer, product card, form fields, UI kit
  sections/             Home page sections
  pages/                Route components
  context/CartContext   Basket state, persisted to localStorage
  data/                 Site config, catalogue, editorial content
  lib/                  Formatting, order client, page meta
scripts/test-api.mjs  End-to-end API checks
```

---

## Notes

- Prices are in Rwandan francs and formatted through `src/lib/format.js`.
- Nothing is charged online — the site takes bookings, and payment is arranged
  directly (MoMo, Airtel Money, transfer or cash), which is how the bakery
  already works.
- The site respects `prefers-reduced-motion`, is keyboard navigable, and carries
  a skip link, focus rings, breadcrumbs and per-page metadata.
