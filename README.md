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
| `/admin` | **Kitchen dashboard** — overview, orders, products, photos, settings and a setup checker |

The site ships with two looks, switched from the little toggle in the navbar and
remembered between visits: **Bright** (the default, warm ivory) and
**Chocolate** (the darker original). The home page hero is a real 3D cake built
in three.js — drag it to turn it. It only loads on desktop machines with WebGL;
phones, low-powered devices and anyone who has asked for reduced motion get the
drawn cake instead, so the page stays fast.

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

You are told the moment an order arrives — by email, on WhatsApp, or both — and
the customer gets a confirmation plus an email each time you move their order
along.

If the API is ever unreachable, the order is saved in the customer's browser,
they still get their code, and the confirmation page pushes them to the WhatsApp
hand-off — an order is never silently lost.

### Running the bakery from the dashboard

`/admin` has six tabs:

- **Overview** — what you look at first thing. What is due today and tomorrow,
  which orders still need a reply from you, money over the last week and month,
  and what has been selling.
- **Orders** — the kitchen queue, soonest date first. Move an order through
  _New → Confirmed → In the kitchen → Ready → Completed_, search it, call or
  WhatsApp the customer, export the lot to CSV. It refreshes itself every 20
  seconds, so new orders turn up on their own.
- **Products** — add, edit, duplicate, reorder, hide or delete anything on the
  menu. Every price, size, flavour, finish, extra, photo, lead time and tag,
  with a live preview. Saves show on the website straight away.
- **Photos** — everything you have uploaded, in one place. Drag files in, see
  what is being used where, copy a link, delete what you no longer need.
- **Settings** — delivery fee, free-delivery threshold, deposit, lead times,
  delivery zones, payment methods, phone, WhatsApp, Instagram, email, opening
  hours, the photos on the home page, and the brand lines.
- **Setup** — a plain check of your database, dashboard password and email,
  with the steps to fix anything missing.

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
npm run test:api     # orders, catalogue, settings, photos, WhatsApp (80 checks)
npm run test:e2e     # browser walk-through of ordering (13 checks)
npm run test:admin   # browser walk-through of the dashboard (21 checks)
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
| `DATABASE_URL` | Where orders, products, photos and settings live. **Required** for anything to be saved. |
| `ADMIN_KEY` | The password for `/admin`. **Set this before going live** — while unset, any value opens the dashboard, and the dashboard says so on screen. |
| `RESEND_API_KEY` + `ORDER_NOTIFY_EMAIL` | Email alerts on new orders, plus confirmations and status updates to customers. Free account at [resend.com](https://resend.com). |
| `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` + `WHATSAPP_TO` | Sends orders to your WhatsApp and lets you reply with commands. See the WhatsApp section above. |
| `WHATSAPP_CUSTOMER_TEMPLATE` + `WHATSAPP_STATUS_TEMPLATE` | Names of the two approved templates that let customers be messaged their confirmation and status updates. See [Updates for the customer](#updates-for-the-customer-on-whatsapp). |
| `ALLOWED_ORIGIN` | Optional. Locks the API to your own domain. |

---

## Orders on WhatsApp

Every order can land on your WhatsApp the second it is placed, and you can move
orders along by replying, without opening the dashboard:

```
today                  what is due today
tomorrow               what is due tomorrow
new                    orders waiting for you
DBL-K2XMQ4A            show that order
confirm DBL-K2XMQ4A    accept it
baking DBL-K2XMQ4A     it is in the oven
ready DBL-K2XMQ4A      boxed and waiting
done DBL-K2XMQ4A       delivered or collected
cancel DBL-K2XMQ4A     called off
help                   this list
```

The customer gets the same update they would if you had clicked the button in the
dashboard — the email, and a WhatsApp message on their own number. See
[Updates for the customer](#updates-for-the-customer-on-whatsapp) below.

### Setting it up

1. At [developers.facebook.com](https://developers.facebook.com), create an app
   and add the **WhatsApp** product. Meta gives you a free test number to try it
   with before you connect your own.
2. Add `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` and `WHATSAPP_TO` (your number,
   digits only, e.g. `250788722064`).
3. Under **Configuration → Webhook**, set the callback URL to
   `https://yourdomain.com/api/whatsapp` and use the same words for the verify
   token as `WHATSAPP_VERIFY_TOKEN`. Subscribe to the `messages` field.
4. Add `WHATSAPP_APP_SECRET` so we can check each webhook really came from Meta.
5. Send one message to your business number to open the chat, then place a test
   order.

Only the number in `WHATSAPP_TO` (plus anything in `WHATSAPP_ADMINS`) can send
commands. Messages from anyone else are ignored.

### What it costs, and the one catch

There is no monthly fee. Meta charges per message you start, priced by country;
Rwanda sits in the "Rest of Africa" band, which is fractions of a US cent per
message. At bakery volumes this is very small.

The catch: Meta only lets a business send a plain text message within 24 hours of
your last message to it. Because you reply to these notifications, that window
normally stays open on its own. If it does close, the send is refused and the log
says so — send any message to your business number to reopen it, or set
`WHATSAPP_TEMPLATE` to an approved template name to send through it.

### Updates for the customer on WhatsApp

The customer gets their own messages too, on the number they typed at checkout:

- **the moment they order** — a confirmation with their order code, slot and total
- **every time you move the order** — confirmed, in the kitchen, ready, done, cancelled

It works whether you moved the order from the dashboard or by replying `confirm
DBL-K2XMQ4A` on your phone. Both paths send the same message. There is a tickbox
on the checkout page, on by default, so anyone who would rather not be messaged
can say so; the dashboard records their choice with the order.

**You have to create two templates first.** Meta will not let a business message
someone who has not messaged it in the last 24 hours, and a customer who has just
ordered on the website has never messaged you. The way through is a template Meta
has approved in advance.

Go to **WhatsApp Manager → Message templates → Create template**, pick category
**Utility** (not Marketing — Utility is cheaper and approved faster), and paste
these in exactly.

**1. Name: `dussa_order_confirmation`**

```
Hi {{1}}, thank you. Dussa BakeLab has received your order.

Order code: {{2}}
{{3}}: {{4}} at {{5}}
Total: {{6}}

Kindly make payment to MTN Mobile Money: {{7}}

After paying, reply to this WhatsApp conversation with the word PAID and attach a screenshot of the payment confirmation.

We will confirm your order once the payment has been verified.
```

Sample values, for the boxes Meta asks for: `Keza`, `DBL-K2XMQ4A`, `Delivery`,
`Sat, 22 Aug`, `14:00 – 16:00`, `RWF 68,000`, `+250 788 722 064`.

The MoMo number is `{{7}}` rather than typed into the template so you can change
it in **Dashboard → Settings → Mobile Money number** without submitting a new
template for approval. If you would rather have it fixed, type the number in
place of `{{7}}` and drop the seventh sample value — everything else still
works.

**2. Name: `dussa_order_status`**

```
Hi {{1}}, an update on your order {{2}}.

{{3}}

{{4}}: {{5}} at {{6}}

Dussa BakeLab · Kigali
```

Sample values: `Keza`, `DBL-K2XMQ4A`, `Your order is confirmed and booked into
the kitchen.`, `Delivery`, `Sat, 22 Aug`, `14:00 – 16:00`.

Then set:

```
WHATSAPP_CUSTOMER_TEMPLATE=dussa_order_confirmation
WHATSAPP_STATUS_TEMPLATE=dussa_order_status
WHATSAPP_TEMPLATE_LANG=en
```

`WHATSAPP_TEMPLATE_LANG` has to match the language you picked when creating the
templates, or Meta refuses the send with error 132001. If you chose "English
(US)" the code is `en_US`, not `en`.

Two things that will get a template rejected, worth knowing before you edit the
wording: a body cannot start or end with a `{{n}}`, and two parameters cannot sit
next to each other. Keep some words between them.

Until the templates exist we still try to send, as plain text — which only lands
for a customer who happens to have messaged you in the last 24 hours. Nothing
breaks either way; the Setup tab in the dashboard tells you which of the two
you're on, and the server log says which path each message took.

### When WhatsApp is not delivering

Open **Dashboard → Setup → Why is WhatsApp not delivering?** and press **Run the
checks**. Everything it reports comes from Meta, not from us: whether the token
is still alive, what the sending number is, and — if `WHATSAPP_WABA_ID` is set —
whether each template exists under that exact name and language and takes the
number of `{{n}}` the site actually sends.

Underneath it there is a **test send**. Put in your own number, pick which
message, press Send. Either Meta accepts it or you get the rejection in Meta's
own words with an explanation. That is usually the fastest way to the answer.

In rough order of likelihood, when "everything is set" but nothing arrives:

1. **The token expired.** The token on the app dashboard is temporary and dies
   24 hours after it is generated. This catches almost everyone once. Fix it
   properly: Business Settings → Users → System users → add a system user, give
   it the WhatsApp Business Messaging permission, generate a token with no
   expiry, and put that in `WHATSAPP_TOKEN`.
2. **The recipient is not on the allowed list.** A Meta *test* number can only
   message numbers you have added under API Setup. Real business numbers have no
   such limit.
3. **A variable was added but not deployed.** Vercel only picks up environment
   variables on a new deployment — adding one to a running project changes
   nothing until you redeploy.
4. **Language mismatch.** `en` and `en_US` are different templates to Meta.
   `WHATSAPP_TEMPLATE_LANG` has to match exactly what the template was created
   with.
5. **Parameter count mismatch.** If the template wording was edited, the number
   of `{{n}}` may no longer match. The confirmation sends 7 and the status update
   sends 6; the check names both.
6. **No payment method on the Meta account.** Template messages are billed, and
   sends fail once the free allowance runs out.

### Taking payment over WhatsApp

The confirmation asks the customer to pay by Mobile Money and reply `PAID` with
a screenshot. What happens then:

1. Their reply reaches `/api/whatsapp`. We match their number to their newest
   open order — no order, no action.
2. If they attached a photo we download it from Meta and store it against that
   order as proof.
3. The order is marked **payment reported**. It does *not* move status. Anyone
   can type "PAID", so nothing is taken on trust.
4. You get a WhatsApp message and an email straight away, both saying which
   order and how much.
5. The website updates: the customer's tracking page says the payment is being
   checked, and your dashboard shows the claim with the screenshot.
6. You check your MoMo statement and press **Money received — verify** in the
   dashboard. That confirms the order and sends the customer their confirmation
   message. If the money is not there, press **Not there — reset** and the
   claim clears so they can try again.

"PAID" is not the only thing that works — `nishyuye`, `payé`, `payment sent`
and `done` are all understood, and a bare screenshot with no words counts too.

Payment screenshots are kept out of your media library and are **not** public
like product photos are: they need your dashboard key, since they carry
somebody's phone number and how much they paid.

Nothing is charged automatically, and no card or MoMo API is involved — this is
a record of a payment you confirm by eye. If you later want the money collected
without you checking, MTN's MoMo API has a Request-to-Pay call that pushes a PIN
prompt to the customer's phone and tells us when it succeeds; that would slot in
where the verify button is now.

### Could customers order entirely inside WhatsApp?

Technically yes, and it is a bigger job than it sounds. You would need Meta
business verification, an approved message template for every kind of message,
and a chat flow that walks someone through 16 products with sizes, flavours,
finishes and add-ons. A chat menu handles that much worse than a page does.

**Paying inside WhatsApp is not available in Rwanda.** WhatsApp Pay only works in
India and Singapore; Meta scaled back the Brazilian business programme in January
2026. What works here is what the site already does: agree the order, then take
payment by MTN Mobile Money or Airtel Money. If you want that automated later,
MTN publishes a MoMo API with a Request-to-Pay call that pushes a PIN prompt to
the customer's phone, and it can be triggered from the site or from a WhatsApp
reply.

The setup that actually suits this business: **the website builds the order, and
WhatsApp carries the conversation.** That is what is wired up here.

---

## Brand assets

The supplied Dussa BakeLab logo has web versions in `public/brand/`:

- `dussa-bakelab-logo.png`: the full logo and tagline, used on the About page, in the footer and in sharing metadata.
- `dussa-bakelab-mark.png`: the compact D, whisk and bowl, used in navigation, loading screens, dashboard sign-in and the browser tab.

The assets were prepared from the supplied logo reference. The compact mark has an ivory background so it remains readable in both themes. The full logo sits on an ivory panel. Shared rendering lives in `src/components/BrandMark.jsx`; brand wording and asset paths live in `src/data/site.js`.

To replace the logo later, open **Settings → Your logo** in the dashboard. Tick **My logo includes the business name** to hide the separate wordmark. Clearing the upload restores the bundled Dussa logo. This also restores the default browser icon. Sharing metadata uses the bundled full logo in `index.html`.

Use plain, friendly language for customer copy. Explain the next step directly and keep product details, ordering instructions and notification messages consistent. Keep product URLs and option IDs stable when editing wording.

## Adding your photos

Open **Photos** in the dashboard and drag your pictures in. That is the whole
job. You can drop several at once, straight off a phone.

Photos are stored in the same database as your orders, so there is no second
account to sign up for and no folder to manage. Each one gets its own address
like `/api/images/abc123.webp`, which you can copy and use anywhere.

Big camera photos get shrunk in your browser before they are sent, so a 6 MB
picture arrives at a few hundred kilobytes and the site stays quick on mobile
data. Longest edge is capped at 1600px.

To put a photo on a product: **Products → edit → Display**, then either upload a
new one, pick one you have already uploaded, or paste a link to a picture hosted
somewhere else.

To put photos on the moving strip on the home page: **Settings → Photos on the
home page**. Leave it empty and the drawings are used instead.

Every product also ships with hand-drawn artwork (see `src/art/CreationArt.jsx`),
which is what shows before you add a photo. If a photo ever fails to load, the
drawing comes back on its own, so a customer never sees a broken picture.

Square or 4:3 pictures work best.

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
  images.js             GET list · POST upload · DELETE (admin)
  images/[id].js        serves an uploaded photo
  settings.js           GET settings · PATCH/DELETE (admin)
  whatsapp.js           WhatsApp webhook: verify, receive, run commands
  health.js             setup check shown in the dashboard
  _lib/                 Postgres store, HTTP helpers, validation, emails
src/
  art/                  SVG artwork system, palettes, logo
  components/           Nav, footer, cart drawer, product card, form fields, UI kit
  sections/             Home page sections
  pages/                Route components
  components/admin/     Dashboard panels: overview, orders, products, photos, settings
  context/CartContext   Basket state, persisted to localStorage
  context/CatalogContext  Live menu and settings, with static fallback
  context/ThemeContext  Bright / Chocolate, saved between visits
  three/CakeScene       The 3D cake on the home page
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


### Bakery photography and copy (2026 update)

The storefront displays real, licensed Unsplash photographs in place of the old SVG cake drawings and 3D hero. **These are example photos, not verified photographs of Dussa BakeLab orders.** Image mappings and credits guidance live in `src/data/photography.js` (photo license: https://unsplash.com/license). Owner-uploaded product and gallery photos always take priority. Use photographs of actual Dussa products before presenting the menu or gallery as the bakery's own work. Default testimonial sections and unsupported review/celebration figures have been removed from the homepage. Confirm menu details, prices, hours, delivery policies and claims with the owner before publishing.


### Homepage cake video

The homepage film is **[this video on YouTube](https://www.youtube.com/watch?v=HTXB6flODww)**, played through YouTube's official privacy-enhanced embed — not downloaded or re-hosted. It is credited as third-party footage, not film made by Dussa BakeLab. All of it lives in `src/components/HeroCake.jsx`, with the sizing in `src/index.css` under "Homepage film".

**What the film is.** It's a marketing film for Ira Bakes, a bakery in Finland, shot by Säynevirta Photography — so the cakes in it are theirs, not Dussa's. Its last four seconds (from about 38s) carry a large "IRA BAKES" logo. The site therefore only ever plays 3.5s–37s: each loop fades back to the photo before 37s and rewinds to the flour falling through the sieve, which is also the shot that frames best on a phone. If the YouTube player stops at its own end marker instead, the site restarts the window itself. It is embedded, never downloaded or re-hosted; self-hosting it would need written permission from Säynevirta Photography or Ira Bakes.

**Why it fills the screen.** The footage is cinemascope, about 2.39:1, and YouTube plays it inside a 16:9 player with black bars above and below. Sizing the *player* to cover the hero leaves those bars on screen, which is what the first version did. The film layer is a CSS size container, and the player is made wide enough that its *picture* covers the layer — so the bars, YouTube's title strip and its logo all land outside the frame. The picture measures 1920×818 inside the 1920×1080 file — 2.35:1 — so 2.39 leaves a small margin. If the video is ever swapped for one with a different shape, change `239cqh` in that rule (2.39 × 100): `178cqh` for ordinary 16:9 footage, and update `FILM_START`/`FILM_END` in `HeroCake.jsx`.

**Why it feels fast.** The cake photo is preloaded in `index.html` and painted first, at a size matched to the screen. The YouTube player is only fetched once the page has settled, and it stays invisible until YouTube itself reports that the film is playing — so there is no black player or spinner, ever. Between loops, when paused, or when scrolled out of view it fades back to the photo rather than showing YouTube's pause or end screens, and it stops streaming while off screen.

**On phones** it plays too, in a band across the top two-thirds of the screen that fades into the headline, with a small pause button in the film's corner. (Full-height, a 2.39:1 film would have to be blown up five times over to fill a portrait screen; the band keeps it sharp.) Autoplay is skipped for reduced-motion and data-saver settings and on 2G, which get the photo and a play button.

Some phones refuse to autoplay any video: iPhones in Low Power Mode, Android data saver, and the Instagram and Facebook in-app browsers, which is where many visitors arrive from. In those, a button on our page cannot start the film either, because browsers only allow a tap *inside* YouTube's frame to start playback. So when YouTube reports that it was refused, the player itself is shown with a "Tap the film to play" hint, and the hero lets taps through to it. One tap starts it and the normal controls come back.

`npm run test:film` checks all of this against a stand-in player that letterboxes the same way YouTube does: no black rows at desktop, short-laptop, ultrawide, tablet and phone sizes, no reveal before playback, pause and resume, phone autoplay, save-data, and the refused-autoplay path where the tap has to reach the player.

For the cleanest result, replace it with Dussa's own footage: a short (10–20 s) muted MP4, compressed to a few megabytes and played from the site itself, starts faster than any embed and has no third-party branding at all.
