# Handoff: Phases 3–7 timeboxed run, 21 Oct 2026

Run: 02:20 → 02:37 of work, handoff written at 02:37 (30-minute box). Nothing is committed. All changes are in the working tree on `main`, on top of the uncommitted Phase 1 and 2 work.

## Gates at handoff
- `npx tsc --noEmit -p .` clean
- `pnpm test` 65/65 (48 pricing, 9 voice intents, 2 showroom store, 7 invite and fortune)
- `pnpm build` passes (the existing "chunk over 500 kB" warning is unchanged)
- No visual check was done, as agreed. Nothing below has been seen in a browser.

## Status by phase
| Phase | Status |
|---|---|
| 3 Album/package note, voice guide | **Done**, except the audio clip needs regenerating (see "To do by hand") |
| 4 Admin showroom | **Done** (4.2 already shipped in Phase 1) |
| 5 Smaller pages, sub-brands | **Done**, except new curated stock photos |
| 6 E-invites | **6.6 example done**, plus the link, map, RSVP, countdown and fortune libraries. The other 9 themes, the builder, QR and PNG share wait for the client's reaction, as the roadmap says |
| 7 Tamil and SEO | **Started**: glossary draft, sitemap/robots, meta tags. Copy pass, JSON-LD, landing pages and pre-rendering not started |

---

## Phase 3: How packages and albums work
- **One source:** `src/lib/packageNote.ts` holds `PACKAGE_ALBUM_TITLE`, `PACKAGE_ALBUM_POINTS` (5 bilingual sentences from the roadmap draft) and `PACKAGE_ALBUM_NOTE` (the same as one paragraph, for speech). It has no React imports, so the clip script can load it.
- **Card:** `src/components/PackageAlbumNote.tsx`, a collapsible card (`tone="dark"` available). It appears:
  - under the package cards on the package step (not for commercial)
  - under the Services packages section
  - in the client album studio, under the preview
- **Voice guide:** the `step-package` text in `voiceScripts.ts` now explains Bronze / Silver / Gold for family functions, says weddings and outdoor shoots have their own three, then reads the note. It also suggests "what is in Gold".
- **Cart assistant** (`intent.ts`, `VoiceAssistant.tsx`): questions are answered and never change the cart.
  - `askPackage`: *"what's in Gold?"*, *"கோல்டில் என்ன இருக்கு"*, *"how much is silver"* → contents, price, saving, the option-2 difference, and the album note.
  - `askAlbum`: *"album எவ்வளவு?"*, *"how do albums work"* → the 25/35/45 prices, which album the current package includes, and the pay-the-difference rule.
  - `askItem`: *"how much is drone?"*, *"fpv எவ்வளவு"*, *"price of an A3 frame"* → that item's price ("Ask us" for on-request items). Before this, a price question added the item to the cart.
  - Any sentence ending in "?" counts as a question. Saying "add" or "remove" still orders. *"Add an album, what is the total"* still adds the album and reads the total.
  - New suggestion chip: "What's in Gold?".

## Phase 4: Showroom (`/admin/showroom`, new nav item)
- `src/pages/admin/Showroom.tsx`.
- **Customer card:** mobile, name, email, event, date, district, venue. When the mobile number matches an existing order or lead, a banner offers **Load** (an order loads the customer and its cart; a lead loads the name).
- **Builder:** compact package buttons (56 px) → the package note → the same `CartBuilder` as the public cart → a sticky ink total bar showing the package label.
- **Present mode:** a full-screen overlay above the admin chrome with larger type, the language toggle in the corner and an exit button. It scrolls with `data-lenis-prevent`. The save button is hidden there, so save after leaving present mode.
- **Save as quote** goes through the new store action `saveShowroomQuote(draft)`:
  - It creates a Lead (`source: 'showroom'`), an ENQUIRY order (`source: 'showroom'`) with a quote snapshot and draft invoice, and queues the `quote_sent` WhatsApp message.
  - It does not touch the visitor's booking draft or session.
  - After saving: **Send on WhatsApp** (a `wa.me` link with the itemised quote in the current language), **Print / PDF** (opens `/admin/billing/:id`, which already prints `InvoiceDoc`) and **New customer**.
- **Recent quotes:** a rail of the last 8 showroom orders, linking to billing.
- **Store refactor:** order building is now `buildOrder()` in `store.ts`, shared by `submitEnquiry` and the showroom. `submitEnquiry` behaves as before. `Order.source?: 'web' | 'showroom'` is optional, so old orders don't need a store version bump.

## Phase 5
- **Booking backgrounds:** `src/pages/book/EventBackdrop.tsx`.
  - `EventBackdrop` is a fixed, blurred photo of the chosen event (`ev.img[lang]`, so Tamil mode gets the traditional set), crossfaded and under a white wash so the glass stays readable.
  - `PictorialTales` is the "Here are our pictorial tales" strip under the steps: 10 gallery photos for the event, padded from all work when the category has fewer. It swipes or scrolls horizontally. There is no pinned horizontal scroll on desktop yet.
  - Both are wired into `BookLayout` and hidden on the confirmation page.
- **Sub-brands:**
  - `gallery.ts` gains the `cradle` (Cradle Captures) and `bumpy` (Bumpy Tales) categories and `SUB_BRANDS` (wordmark, tagline, note).
  - `EVENT_GALLERY_CAT` maps events to categories, and `eventGallery()` picks the photos.
  - The six `m_baby_*` photos moved from "little" (now just "Birthdays") to Cradle Captures.
  - The Gallery archive shows a wordmark header with **Contact us** for a sub-brand. Sub-brand chips show even when empty.
  - The lightbox button reads "Contact us" for sub-brand photos and links to `/contact?brand=`.
  - **Bumpy Tales has no photos.** There are no maternity images in `images.ts`, so the header says photos are on their way.
- **Contact page** now reads `?plan=` (monthly commercial plans) and `?brand=` and prefills the event and message. This closes the Phase 1 watch-out.
- **Album layouts:** `ALBUM.layouts` in `data.ts` holds 4 layouts (classic, panorama, story, collage), each marked `sample`, with cells drawn using the client's own photos. They appear as new step 6 "Page layout" in the album studio, and Typography and Cover text are now 7 and 8. `AlbumSpec.layout?` is optional; old specs default to classic. The layout is shown in the read-only spec.
- **`docs/credits.md`:** generated from `images.ts` (200 Unsplash placeholders). The links are CDN ids, so photographer names still need an Unsplash API lookup if the client wants credits on the site.
- **Not done: curated new stock photos** for the candid styles, drone, FPV, album lines, outdoor looks and Madurai venues. Picking real Unsplash/Pexels ids means browsing, which I didn't do. Swapping one is a single line in `ITEM_PHOTO` / `IMG`.

## Phase 6 (example first)
- **`src/lib/invite.ts`** (tested):
  - `Invite` type and the 10 theme keys (free / premium).
  - `encodeInvite` / `decodeInvite`: base64url JSON with short keys. A sample invite with Tamil names comes to under 400 characters; damaged links decode to `null`.
  - `invitePath`, `mapEmbedUrl` (keyless), `directionsUrl` (also the QR target), `rsvpUrl` (`wa.me`, prefilled in either language).
  - `countdown()` counts in India time.
- **`src/lib/fortunes.ts`** (tested): 10 of the 67 fortunes, spread across the six tones and written separately in each language. `nextFortune(seen, seed)` never repeats until all have been seen, and each device gets a different first fortune.
- **`/i/:theme`** (`src/pages/invite/Invite.tsx`) sits outside the site chrome. With no `#payload` it shows the **Temple Gopuram Night sample**: made-up names (Meera & Arjun) at a real venue pin (Meenakshi Amman Temple, Madurai). It has:
  - names in English and Tamil at matched optical sizes, with the other language underneath
  - parents line, date and muhurtham time
  - a live countdown with Tamil labels
  - gold gopuram skyline with flickering lamps
  - dark-styled map embed, Directions and RSVP on WhatsApp
  - fortune cookie: it rocks, cracks into two halves with crumbs, and the slip unrolls in both languages; "Another cookie"; seen list kept in localStorage behind try/catch; crossfade only for reduced motion
  - copy-link button
  - OG tags set from the payload at runtime
- **Not done:** the other 9 themes, 57 more fortunes, `Qr.tsx` (a QR encoder needs a dependency such as `qrcode`, which I didn't add without asking), download as PNG, the `/dashboard/invite` builder and the showroom hook-up, and the venue-step Places search (needs a key).

## Phase 7 (started)
- **`docs/tamil-glossary.md`**: one word per concept, words to avoid, and how often each appears today. Examples: அமர்வு 37 → "4 மணி நேரம்"; மதிப்பீடு 41 → விலைப்பட்டியல் / விலை; விசாரணை 21 (also means "police inquiry") → "உங்கள் கோரிக்கை"; Bronze is spelled two ways. **It needs a native-speaker review before the copy pass.** The pass itself (about 50 `copy` dicts) has not started.
- **`src/lib/seo.ts`** + **`scripts/sitemap.mjs`** (`pnpm seo:sitemap`) write `public/sitemap.xml` (8 routes + 6 stories) and `public/robots.txt` (blocks admin, dashboard, booking steps, invites and login). `SITE_URL` is `treasurecaptureevents.in`, the domain already used in WhatsApp messages; confirm it.
- **`useSeo(description)`** in `lib/ui.ts` sets the meta description, canonical, `og:title/description/url/locale` and `<html lang>`. Home, Services, Gallery, Contact and About have Madurai-first descriptions in both languages.
- **Not started:**
  - JSON-LD: the studio's real phone, address and hours aren't in the code, only demo crew numbers.
  - `hreflang`: the site switches language without separate URLs, so there's nothing to point at yet.
  - `/photography/:district/:event` landing pages.
  - Pre-rendering, which needs checking against the Figma Make deploy first.

## To do by hand
1. **Regenerate the package clip.** `public/voice/step-package.*` still holds the old narration and plays instead of the new text. Delete `public/voice/step-package.*`, then run `pnpm voice:clips` (needs the Gemini key in `.env.local`). Until you do, the guide speaks the old text from those files.
2. Review, then commit Phases 1–7 (nothing is committed yet).

## Watch-outs
- In present mode the save button is hidden on purpose, so the family sees only the total. Save after leaving present mode.
- The showroom keeps an unsaved customer and cart in component state only. Leaving the page loses them.
- `EventBackdrop` is `fixed -z-10` inside `BookLayout`'s `isolate` root. If the photo doesn't show, check that no ancestor sets an opaque background above it.
- Showroom quotes have no travel distance (`distanceKm: 0`). Billing can add an adjustment.

## Still needed from the client (added this run)
- Maternity photos for Bumpy Tales, and a few newborn ones of her own for Cradle Captures.
- Reaction to the sample invite at `/i/gopuram` before the other 9 themes are built.
- Studio phone, address, opening hours, Instagram and Google Business links for JSON-LD, and confirmation of the domain.
- A Tamil reviewer for `docs/tamil-glossary.md`.
- OK to add the `qrcode` package for invite QR codes.
- The older open items are unchanged: see "Still needed from you" in `docs/roadmap.md`.

---

## Follow-up, 21 Oct 2026 (afternoon): the "not done" list
Gates: `tsc` clean, 67/67 tests, build passes. Still no visual check.

- **Package clip regenerated** by you (`step-package.en/.ta`); the to-do above is closed.
- **Bumpy Tales has photos:** 7 free Unsplash maternity shots (`m_mat_*` in `images.ts`), 3 of them Indian and tagged `both` so they also show in Tamil mode. The sub-brand note no longer says photos are on their way. `outdoor_maternity` in the cart uses the blue-gown shot.
- **Cart photos:** Drone now shows a drone filming a couple (`m_drone_couple`); FPV shows a night aerial over an event crowd (`m_aerial_night`). The candid and video cards keep their current photos: the free Indian-wedding results were North Indian (turbans, lehengas), which doesn't suit a Madurai studio. Pick Tamil shots for these when the client sends hers.
- **`docs/credits.md`** regenerated (209 photos) with a Photographer column, filled for the 9 new photos.
- **QR code:** `qrcode@1.5.4` (+ `@types/qrcode`) added with the project's pinned pnpm 10.34.3. `src/components/Qr.tsx` draws it as SVG in any colour; the sample invite shows a gold "Scan for directions" QR under the map. Tested to produce a valid grid; not scanned with a phone.
- **JSON-LD:** `studioJsonLd()` in `seo.ts`, rendered once in the footer on every public page. It reads the phone, email and address from the admin CMS (`cms.studio`), the Mon–Sat 9:30–8 hours the site already shows, the 8 districts, and the Bronze / Silver / Gold prices as offers. **The CMS phone `+91 98940 12345` looks like a placeholder**: fix it in admin (Website CMS) and the JSON-LD follows. No `sameAs`: the footer's Instagram and YouTube links are `#`.
- **Still open:** the Tamil glossary review and the copy pass. That needs a native speaker first.

---

## Follow-up, 21 Oct 2026 (evening): the unblocked list, run in parallel
Gates: `tsc` clean, 103/103 tests, `vite build` and `build:static` pass (111/111 routes pre-rendered). Still no visual check.

- **Pictorial tales** pin and scroll sideways on desktop (`EventBackdrop.tsx`); swipe stays on touch, below `md` and for reduced motion.
- **Stock photos:** 3 outdoor looks and 4 venue/sangeet shots (Unsplash, in `credits.md`). `OUTDOOR_VENUES[].img` is set but no page shows that list yet.
- **Venue search:** Nominatim in `src/lib/geo.ts` (≥ 1 s between requests, district-biased, OSM attribution) on the venue step.
- **Travel distance:** haversine × 1.3 from `STUDIO_COORDS` (placeholder, West Masi St) to the pin, else to the district HQ (`DISTRICTS[].centre`). The showroom still quotes `distanceKm: 0`.
- **Invites:** `ShareSheet.tsx` (WhatsApp, native share, copy, PNG via `inviteImage.ts`), `InviteBuilder.tsx` used by `/dashboard/invite` and a showroom modal. Premium unlocks with `einvite_premium` in the cart. The caricature stays on the device (localStorage), so guests see it only if the invite carries an https caricature URL. The other 9 themes use the gopuram design until they're built.
- **Fortunes:** 67, tone counts tested. The Tamil reviewer list is in the session report (sungudi line, two spoken-Tamil quotes, kural 45/100 paraphrases).
- **Landing pages:** 96 at `/photography/:district/:event` (no babyshoot or commercial), plus a `/photography` index and footer "Areas we cover". Copy is in `src/lib/landing.ts`, district facts in `DISTRICT_FACTS`. The FAQ, breadcrumb and Service JSON-LD leave out offers while a price is ₹786.
- **hreflang:** Tamil = same path + `?lang=ta` (`LangSync` in `Shell.tsx`). `useSeo` writes canonical + en/ta/x-default links. The sitemap has 222 URLs.
- **Pre-rendering:** `pnpm build:static` (`src/entry-server.tsx`, `src/lib/ssrHead.ts`, `scripts/prerender.mjs`). `build` is unchanged. The deploy runs `pnpm run build` (`.figma/make/deploy:3`), but whether the host serves nested `index.html` is unknown. Confirm that before making it the default, and forward `--mode` to both vite builds.
- **Blocker for all SEO:** `.figma/make/site.json` has `robots.index: false`, which emits `Disallow: /` and noindex on every deploy.
- **Open:** Story and Legal pages don't call `useSeo`; a native-speaker review of the new Tamil (fortunes, landing copy) and of the district facts.

---

## Follow-up, 21 Oct 2026: mobile pass across the whole site
Gates: `tsc` clean, 103/103 tests, `vite build` and `build:static` (111/111) pass. No visual check.

- **Hover-only info now shows on touch** (`[@media(hover:none)]`): Home mosaic titles, Gallery captions, proof file names, admin delete/hide buttons.
- **Tap targets ≥ 44 px and text ≥ 12 px** on phones across public, booking, dashboard and admin; form fields fixed at 16 px so iOS doesn't zoom (the Tamil 93.75 % root made `text-base` 15 px).
- **Scroll:** `useScrollLock` in `ui.tsx` (Nav menu, Modal, Lightbox, showroom present mode); pinned sections use `svh`; chip rows and package cards swipe with snap; maps get a "Tap to move the map" cover (`MapGate` in `MapEmbed.tsx`, and the invite's own `MapFrame`).
- **New on phones:** Book/WhatsApp bar on public pages after the hero (`Shell.tsx`); Continue button inside the booking quote sheet; Details/Preview toggle in the invite builder; Lightbox double-tap zoom; Confirmed page WhatsApp/Call/Share.
- **Forms:** `Field` takes `autoComplete` / `enterKeyHint`; first invalid field scrolls into view (Contact, Details); blocked mic and location explained.
- **Speed:** booking, dashboard and login are lazy routes (`App.tsx`), so the first download dropped from 957 kB to 546 kB (155 kB gzip). Lighter blur and grain on small touch screens; phones fetch a small booking backdrop.
- **SEO:** Story and Legal now call `useSeo`.
- **Open:** `useListener` in `speech.ts` swallows mic errors, so "mic blocked" is detected separately; `pages/book/Confirmed.tsx` looks unused (Details goes to `/dashboard/track`). The `tamil-*.js` shared chunk (438 kB) still loads up front.
