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
| `/admin` | **Kitchen dashboard** — orders, product editing, business settings and a setup checker |

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

You are emailed the moment an order arrives, and the customer gets a
confirmation plus an email each time you move their order along.

If the API is ever unreachable, the order is saved in the customer's browser,
they still get their code, and the confirmation page pushes them to the WhatsApp
hand-off — an order is never silently lost.

### Running the bakery from the dashboard

`/admin` has four tabs:

- **Orders** — the kitchen queue, newest date first. Move an order through
  _New → Confirmed → In the kitchen → Ready → Completed_, search it, call or
  WhatsApp the customer, export the lot to CSV. It refreshes itself every 20
  seconds, so new orders appear without touching anything.
- **Products** — add, edit, duplicate, reorder, hide or delete anything on the
  menu. Every price, size, flavour, finish, add-on, photo, lead time and tag is
  editable, with a live preview. Changes reach the website immediately.
- **Settings** — delivery fee, free-delivery threshold, deposit percentage,
  lead times, delivery zones, payment methods, phone, WhatsApp, Instagram,
  email, opening hours and the brand lines. These drive the storefront, the
  checkout totals and the emails at once.
- **Setup** — a plain-language check of your database, dashboard password and
  email, with the exact steps to fix anything missing.

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
npm run test:api     # order, catalogue and settings APIs (45 checks)
npm run test:e2e     # browser walk-through of ordering (13 checks)
npm run test:admin   # browser walk-through of the dashboard (14 checks)
```

`npm run dev` serves the front end only. To get the API as well, run both:

```bash
npm run dev:api      # /api on http://localhost:3000
npm run dev          # site on http://localhost:5173, proxying /api
```

`dev:api` loads the very same handlers Vercel deploys, so local behaviour
matches production. Set `DATABASE_URL` in `.env.local` to develop against a real
database; without one it uses an in-memory store that lasts as long as the
process. `npx vercel dev` also works if you prefer it.

The browser tests expect the dev servers to already be running.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo. The framework preset
   (Vite) and `vercel.json` are already configured — no build settings to
   change.
3. Add the environment variables below.
4. Deploy.

### Setting up the database

**You need one.** Vercel runs your site across many short-lived server
instances: without a database an order is written into one instance's memory and
is gone by the time you open the dashboard. That is the single most common
reason for an empty orders list.

Any Postgres works. [Neon](https://neon.com) is the easiest free option and is
what these steps use:

1. Sign up at **neon.com** and create a project. Copy the connection string it
   shows you — it begins `postgresql://`.
2. In Vercel, open **Settings → Environment Variables** and add
   `DATABASE_URL` with that string.
3. Add `ADMIN_KEY` too — any long phrase. That becomes the `/admin` password.
4. Redeploy.

On the first request the tables are created and the menu in this repo is copied
into the database, so the dashboard opens with your products ready to edit.
Nothing else to run — no migrations, no SQL.

Supabase, Railway, Render or a Postgres you host yourself all work the same way:
paste the connection string into `DATABASE_URL`.

**A note on free tiers:** Neon's free plan has no expiry and its compute simply
sleeps when idle, waking on the next request. Free plans do change, so keep a
backup — the dashboard's **Export CSV** covers orders, and your menu lives in
this repository as well as in the database.

### Environment variables

Copy `.env.example` for the full list. The ones that matter:

| Variable | Why |
| --- | --- |
| `DATABASE_URL` | Where orders, products and settings live. **Required** for anything to be saved. |
| `ADMIN_KEY` | The password for `/admin`. **Set this before going live** — while unset, any value opens the dashboard, and the dashboard says so on screen. |
| `RESEND_API_KEY` + `ORDER_NOTIFY_EMAIL` | Email alerts on new orders, plus confirmations and status updates to customers. Free account at [resend.com](https://resend.com). |
| `ALLOWED_ORIGIN` | Optional. Locks the API to your own domain. |

---

## Using your own photographs

Every product ships with hand-built SVG artwork (see `src/art/CreationArt.jsx`),
so the site is complete and nothing is ever missing or broken. To use your own
photos instead:

1. Put the image in `public/images/`, e.g. `public/images/chocolate-drip.jpg`,
   and push it.
2. In the dashboard, open the product, go to **Display**, and put
   `/images/chocolate-drip.jpg` in the **Photo** field. A full `https://` link to
   an image hosted elsewhere works too.

The photo takes over everywhere that product appears — cards, product page,
basket, confirmation. If a file is ever missing or fails to load, the
illustration comes back automatically, so a broken image never reaches a
customer.

Square or 4:3 images at roughly 1200px wide work best.

---

## Changing the content

**Day to day, use the dashboard** — `/admin` edits products and settings live,
with no deploy. The files below are the defaults a fresh database is seeded
from, and the fallback the site uses if the API is ever unreachable:

| File | Contains |
| --- | --- |
| `src/data/site.js` | Phone, WhatsApp, Instagram, email, hours, delivery zones and fees, lead times, deposit % |
| `src/data/catalog.js` | Every product, its sizes and prices (RWF), flavours, finishes, add-ons, categories and occasions |
| `src/data/content.js` | Story copy, values, process steps, reviews, FAQ, stats, gallery captions |

Change a price or a phone number in one place and it updates across the whole
site, including the order flow and the dashboard.

### Adding a product

Use **Products → New product** in the dashboard. To change the defaults a fresh
database starts from, append an entry to `PRODUCTS` in `src/data/catalog.js`. `art` picks one of the illustrations
(`dripCake`, `tieredCake`, `cupcake`, `cookieStack`, `cakeSlice`, `macarons`,
`donut`, `brownies`, `cheesecake`, `celebrationCake`) and `flavorArt` picks its
colour palette from `src/art/palettes.js`.

---

## Project structure

```
api/                  Vercel serverless functions
  orders.js             POST create · GET list (admin)
  orders/[code].js      GET track · PATCH status (admin)
  catalog.js            GET menu · POST create/reorder (admin)
  catalog/[slug].js     GET one · PUT/PATCH/DELETE (admin)
  settings.js           GET settings · PATCH/DELETE (admin)
  health.js             setup check shown in the dashboard
  _lib/                 Postgres store, HTTP helpers, validation, emails
src/
  art/                  SVG artwork system, palettes, logo
  components/           Nav, footer, cart drawer, product card, form fields, UI kit
  sections/             Home page sections
  pages/                Route components
  components/admin/     Dashboard panels: orders, products, settings
  context/CartContext   Basket state, persisted to localStorage
  context/CatalogContext  Live menu and settings, with static fallback
  data/                 Site config, catalogue, editorial content
  lib/                  Formatting, order client, page meta
scripts/dev-api.mjs   Local stand-in for the Vercel runtime
scripts/test-api.mjs  API checks
scripts/e2e.mjs       Browser test of the ordering path
scripts/e2e-admin.mjs Browser test of the dashboard
```

---

## Notes

- Prices are in Rwandan francs and formatted through `src/lib/format.js`.
- Nothing is charged online — the site takes bookings, and payment is arranged
  directly (MoMo, Airtel Money, transfer or cash), which is how the bakery
  already works.
- The site respects `prefers-reduced-motion`, is keyboard navigable, and carries
  a skip link, focus rings, breadcrumbs and per-page metadata.
