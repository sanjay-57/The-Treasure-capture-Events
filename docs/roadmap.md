# Roadmap: TODO.txt into phases (refined, 20 Oct 2026)

Facts and prices: `docs/meeting-notes.md`.
Rules that apply everywhere:
- **Unconfirmed price = ₹786**, plus a `pending` flag. The admin catalogue tab lists every pending item in one place.
- **Photos** are free stock (Unsplash / Pexels) until the client sends hers. Every photo is one key in `src/lib/images.ts`, so a swap is one line.
- **No visual testing.** Each phase ends with `tsc` and `pnpm build` passing, and with unit tests for anything that touches money.
- **Phases start only when you say so.** Order below is the natural order; 1 → 2 → 3 are tightly coupled, 4–7 can be reordered.

---

## Phase 1: Catalogue and pricing engine

Files: `src/lib/catalogue.ts` (rewrite), `src/lib/pricing.ts` (rewrite), `src/lib/data.ts` (events, crowd, album constants), `src/pages/admin/Cms.tsx` (price tab), `src/pages/book/Event.tsx` (hours slider). Add **vitest** and `src/lib/pricing.test.ts`.

### 1.1 Time: hours → price multiplier
The customer picks **hours** (2 to 16, in the event step). The engine turns hours into a multiplier for every "per session" item:

| Hours | Means | Multiplier |
|---|---|---|
| 2 | mini session | 0.65 |
| 3 | mini + 1 h overtime (0.65 + 0.35) | 1.00, so it rounds up to a session |
| 4 | one session | 1.00 |
| 5 | session + 1 h | 1.35 |
| 6 | session + 2 h | 1.65 |
| 7 | rounds up | 2.00 |
| 8 | two sessions | 2.00 |

Formula: `full = floor(h / 4)`, `rem = h mod 4`, `multiplier = full + {0: 0, 1: 0.35, 2: 0.65, 3: 1}[rem]`.
- The event step shows the result in words: *"6 hours = 1 session + 2 hours overtime (+65 %)"*, in both languages.
- The crew subtotal in the cart says *"× 1.65 (6 h)"* instead of *"× 2 sessions"*.
- **Drone has no mini session:** its multiplier is `ceil(h / 4)`.
- The crowd choice stays in the event step but adds **₹0**. The text changes to *"so we plan the crew"*.
- A note on the summary: *"Running over on the day is charged per extra hour started: +35 % for one hour, +65 % for two."*

### 1.2 Crew and candid styles
- `trad_photo` and `trad_video` stay as per-session items. `trad_video` includes the 30-min full film (replaces the "2 hr on pendrive" line).
- Candid becomes **style items** inside a **bundle group**:

| Group | Items | Bundle rule |
|---|---|---|
| `candid_photo` | couple portraits 6K · couple & family moments 12K · guests 7.5K | any 2: 25 % off their sum · all 3: 20K flat |
| `candid_video` | documentary 13.5K · candid moments 14.5K · cinematic 15.5K | any 2: 25K flat · all 3: 35K flat |

- The engine emits one line per style, then a negative **"Candid bundle saving"** line, so the customer sees both the à-la-carte price and the saving.
- Bundle first, then the hours multiplier.
- `semi_candid_video` 10K is a separate add-on (10–15 min film), not part of the group.

### 1.3 Add-ons
| Item | Price | Unit |
|---|---|---|
| Drone (slow-motion) | 13,000 | per session, no mini |
| FPV drone | 20,000 | per session |
| Pendrive | 1,000 | each |
| Semi-candid video | 10,000 | each |
| Reels + song recreation | 7,000 | each, only with an outdoor shoot |
| E-invite, default designs | 0 | included |
| E-invite, premium with caricature | 1,500 | each |
| LED wall · photo booth · 360° booth | on request | shown with "Ask us" instead of a price, not addable to the cart |

Text to show once, in the deliverables section: *"Bring your own hard disk and we'll copy every file onto it."* and *"Your online gallery stays open for 6 months."*

### 1.4 Albums
Catalogue items carry the **price by sheet count**; the chosen **line, size, orientation, colour and box** are a spec stored next to the cart (`cart.album`), so the admin price editor stays a short list and the client's album studio reads the same spec.

| Item id | What | Price |
|---|---|---|
| `album_25 / 35 / 45` | Acroluxe, Aura, Allura, Pixel Passage (any size, any orientation) | 6,500 / 10,000 / 14,500 |
| `album_1028_25 / 35 / 45` | 10×28, wooden box, personalised cover on box and album | 34,999 / 37,999 / 39,999 |
| `album_a4_15` | A4, 15 sheets, paper box | package-only (see 1.6) |
| `album_1028_pkg_25` | 10×28 paperback with wooden box, as in Gold | package-only |
| `wooden_box` | Wooden box for 12×36 or 12×15 | 786 |
| `album_dual` | Dual books, one box (Canvera list) | 786 |

Line data (`ALBUM_LINES` in `data.ts`), from the Canvera catalogues:
- **Pixel Passage:** 12×18 · 12×15 · 12×12, landscape **or** portrait, leather with a photo window, matching box with etched names (2 fonts), matching bag. Colours: Marigold, Mulberry Red, Stone Blue, Umber Brown, Saddle Brown.
- **Aura:** 12×18 · 12×15 · 12×12, landscape only, leather, matching box and bag. Colours: Linen Beige, Cherry, Cranberry, Espresso.
- **Acroluxe:** 12×36 · 12×15 · 12×12, soft rexin on a wooden pad. Free calendar and leather bag with this line. Colours: ❓ (none until the catalogue arrives).
- **Allura:** sizes and colours ❓.
- Photo-count guidance per sheet tier (landscape vs portrait) is shown under the sheet picker, straight from §8b of the notes.
- The old `album_30/40/50/60` ids go. The client album studio (`dashboard/Album.tsx`) moves from `ALBUM.sheetPrice × extra sheets` to the 25/35/45 tiers.

### 1.5 Frames and prints (placeholders)
- `frame_a4`, `frame_a3`, `frame_12x18`, `frame_16x24`, `frame_20x30` at 786, with the five Pixel Passage swatches as the frame colour choice (your screenshot) until the real frame screenshots arrive.
- Calendar: package-only.
- Magazine and mini book: keep at their current prices, flagged pending.

### 1.6 Packages = lists of options + a target price
```
Package { key, name, event kinds, items: {id: qty}, target: ₹, main: id[], variants?: [{label, swap: {from, to}, target}] }
```
- **The card price is the sum of its items.** If that sum differs from the target, the engine adds one line, **"Package saving"**, equal to `target − sum`. The customer sees what the package saves them against à-la-carte.
- Remove a non-main item → price drops by that item's price, saving unchanged, label becomes *"Gold package − Calendar"*.
- Remove a **main** item (crew, a candid style, the album, semi-candid video) → the cart becomes **Custom**, the saving line is removed, and the customer is warned first: *"Removing the album ends the Gold package and its ₹4,000 saving. Continue?"*
- **Admin warning:** in the price tab, each package shows `sum`, `target` and `saving`. If saving goes **negative** (options now cost less than the target) or changes from its last value, it shows an amber warning: *"Gold no longer adds up: options ₹31,499, target ₹29,999."*

**Proposed option prices, so the sums work.** These make Bronze and Silver add up exactly with no saving line, and give Gold a constant ₹4,000 saving in both variants (see the note under Phase 2 for why Gold can't be exact):

| Option | Price | Where |
|---|---|---|
| Traditional photography, 4 h session | 12,500 | Bronze = just this |
| Portrait hour before the event (close family) | 2,250 | Silver, Gold |
| 20–25 candid individual shots | 2,250 | Silver, Gold |
| Calendar | 749 | Silver, Gold |
| A4 frame | 750 | Silver |
| A3 frame | 1,250 | Gold |
| A4 album, 15 sheets | 1,500 | Silver |
| 12×15 album, 25 sheets | 6,500 | Silver option 2 (rate card) |
| 10×28 paperback, wooden box, 25 sheets | 5,000 | Gold |
| 12×36 album, 35 sheets | 10,000 | Gold option 2 (rate card) |
| Semi-candid video | 10,000 | Gold |

- Bronze = 12,500 ✔
- Silver = 12,500 + 2,250 + 2,250 + 1,500 + 749 + 750 = **19,999** ✔
- Silver opt 2 = swap A4 → 12×15: **24,999** ✔
- Gold = 12,500 + 2,250 + 2,250 + 5,000 + 749 + 1,250 + 10,000 = 34,000 − saving **4,001** = 29,999
- Gold opt 2 = swap 10×28 → 12×36 35 sh: 39,000 − 4,001 = 34,999 ✔

Wedding tier 1 packages 1 and 2 and tier 2: items as in the notes, target **786** each. Outdoor-shoot event: the three looks act as the packages (10K each); reels, mini session (6,500), morning/evening (same price for now) and the paid-venue list are the options.

### 1.7 Commercial and baby
- `commercial_brand` 25K / month and `commercial_school` 35K / month: `unit: 'month'`, shown on the Services page as plans with an **Enquire** button, not in the cart. The `commercial` event stays bookable but its package step shows the two plans.
- `babyshoot` (newborn / toddler) gets `bookable: false`: the Services and Home pages show it as a gallery with **Contact us**, and `/book/event` hides it.

### 1.8 Engine output
`computeQuote` returns the same `Quote` shape plus:
- `coverage: { hours, multiplier, label: Bi }`
- `package?: { key, name, target, saving, removed: id[], added: id[] }` for the label and the summary heading
- bundle and saving lines carry `kind: 'saving'` so the invoice can style them.

### 1.9 Tests (vitest)
Hours → multiplier table · candid bundles (1, 2, 3 picks, with mini session) · every package sums to its target · removing a non-main item keeps the saving · removing a main item drops it · 786 items are all flagged pending.

---

## Phase 2: Cart and package pricing UI

Files: `src/pages/book/Package.tsx`, `src/components/CartBuilder.tsx`, `src/pages/book/Summary.tsx`, `src/pages/book/intent.ts` (voice), `src/pages/book/VoiceAssistant.tsx`.

### 2.1 Layout of the package step
- **Sticky package bar.** The 3 cards (Bronze / Silver / Gold, or Package 1 / 2 / Tier 2, or the 3 outdoor looks) sit under the step header. On scroll they collapse into a slim glass strip showing name, price and a tick, so they're always one tap away. Silver and Gold cards carry the **album variant switch** ("A4 · 15 sheets" / "12×15 · 25 sheets +₹5,000").
- **One scrolling list of options**, in this order: coverage hours → traditional photo / video → candid photo styles → candid video styles → add-ons → album → frames and prints → special shoots → included items. Each option is a card with a stock photo, name, one-line note, price and a toggle or stepper.
- **Sticky total bar** at the bottom on mobile (already partly there in `Summary.tsx`): package label, total, and "Continue".

### 2.2 Behaviour
- Tapping a package selects its items, highlights them in the list with an **"In Gold"** badge, and scrolls the list to the first included card.
- Tapping the active package again clears the cart.
- Any toggle or stepper updates the label: *"Gold package + Drone − Calendar"*. The summary panel shows the package as a heading, its items under it, then "Added" and "Removed" groups.
- Main-item removal shows the warning sheet from 1.6 before switching to Custom.
- Candid style cards are chips in a row with a hint: *"Pick any 2 and save 25 %. All 3 for ₹20,000."* The saving line animates in when the second is picked.
- Album section is a small configurator: line (4 cards with the real cover photo from the PDFs) → size and orientation → sheets (25/35/45 with photo-count guidance) → colour swatches (real hex values from the catalogues) → box option. A mini 3D cover preview reuses `Surface` from the album studio.
- Upgrades show the difference: on Silver, the 12×15 album card reads *"+₹5,000"* not *"₹6,500"*.

### 2.3 Voice assistant
`intent.ts` learns the new ids: package names (*"gold"*, *"கோல்ட்"*), candid styles (*"cinematic"*, *"interview"*, *"couple portraits"*), album lines and sheets (*"Aura 35 sheets"*), hours (*"six hours"*, *"ஆறு மணி நேரம்"*). The reply reads back the package label and the total.

### 2.4 Venue step map
Moved here from Phase 6 so it ships with the cart: see 6.5 for the map approach. The venue step gets a map preview under the address and a "Use my location" button.

### Why Gold can't be an exact sum (decision needed, default below)
Your notes fix four prices: Silver 19,999, Silver opt 2 24,999, Gold 29,999, Gold opt 2 34,999, and the rate card fixes 12×15 (25 sh) = 6,500 and 12×36 (35 sh) = 10,000. Working through the arithmetic, Silver can add up exactly, but **Gold can only add up if the semi-candid video inside it is worth about ₹6,000 instead of its ₹10,000 add-on price**, or if the A3 frame is cheaper than the A4 one. One price per option can't satisfy both.
**Default I'll build:** the "Package saving" line (1.6). It keeps your rule that the price comes only from the options, hits your exact numbers, and shows the customer a real reason to pick Gold. If you'd rather the add-on price of semi-candid video be ₹6,000 everywhere (so Gold sums exactly), say so and the saving line stays at zero.

---

## Phase 3: Album and package disclaimer, voice guide

Files: `src/pages/book/Package.tsx`, `src/pages/Services.tsx`, `src/pages/book/voiceScripts.ts`, `src/pages/book/VoiceGuide.tsx`, `scripts/voice-clips.mjs`.

- One bilingual block, `PACKAGE_ALBUM_NOTE`, shown as a collapsible "How packages and albums work" card under the sticky package bar, on the Services packages section, and in the client album studio. Draft:
  > *Every package that lists an album includes that size and sheet count. You can move up to a bigger album or another line and pay only the difference. The package album holds individual and candid portraits chosen from your online gallery; group photos go in a landscape album. Running over on the day is charged per extra hour. Your gallery stays open for six months.*
- The voice guide's `step-package` clip is rewritten to read this note after explaining the three packages. Clips regenerate with `pnpm voice:clips` (needs the Gemini key in `.env.local`; falls back to live speech if the clip is missing).
- The cart assistant answers *"what's in Gold?"* and *"album எவ்வளவு?"* from the same source.

---

## Phase 4: Admin showroom and quick billing

Files: new `src/pages/admin/Showroom.tsx`, `src/pages/admin/AdminLayout.tsx` (nav), `src/App.tsx` (route), `src/lib/store.ts` (one new action), `src/components/InvoiceDoc.tsx`.

### 4.1 `/admin/showroom`, tablet-first
1. **Customer card:** name, mobile, email (optional), event, date, district, venue name. Mobile number is the key; typing one that already exists offers to load that lead or order.
2. **Present mode:** one tap hides the admin sidebar and chrome, enlarges type and touch targets (44 px minimum, 56 px for the package cards), and shows the same sticky packages + options list as the public cart, with the running total always visible. The language toggle sits in the corner so ma'am can flip to Tamil for the family.
3. **Save as quote:** creates a Lead (source "showroom"), an Order with status ENQUIRY, a snapshot `Quote`, and a draft invoice; the existing WhatsApp outbox gets a "quote" message; a **Send on WhatsApp** button opens `wa.me/<mobile>?text=…` with the itemised quote in the customer's language; **Print / PDF** uses `InvoiceDoc`.
4. **Recent quotes** rail at the top of the page for returning customers.
- `/admin/billing` stays for orders that already exist; the showroom links through to it after saving.

### 4.2 Admin price tab additions (small, but needed now)
- "Prices to confirm" filter listing every ₹786 / pending item.
- Package table with sum, target, saving and the drift warning from 1.6.

---

## Phase 5: Smaller pages and sub-brands

Files: `src/pages/book/BookLayout.tsx`, `src/pages/book/shared.tsx`, `src/lib/gallery.ts`, `src/pages/Gallery.tsx`, `src/pages/Services.tsx`, `src/pages/dashboard/Album.tsx`, `src/lib/images.ts`.

- **Booking backgrounds:** `BookLayout` paints a full-bleed, slightly blurred photo of the chosen event behind each step (traditional set in Tamil mode), with the glass panel on top. Below the step content, a horizontal **"Here are our pictorial tales"** strip (pinned horizontal scroll on desktop, swipe on mobile) pulls 10 gallery items for that event's category.
- **Sub-brands as gallery categories:** `cradle` (**Cradle Captures**, newborn and toddler) and `bumpy` (**Bumpy Tales**, maternity) with their own header, wordmark lock-up and **Contact us** CTA instead of **Book**. Shotcut is noted but not built.
- **Album layouts:** `ALBUM.layouts[]` (name, thumbnail, spreads) and a layout picker step in the album studio, once the Canvera layouts arrive. Until then the picker shows 4 stock layout thumbnails marked "sample".
- **Stock photos:** replace placeholder keys for the new options (candid styles, drone, FPV, album lines, outdoor looks, Madurai venues) with curated Unsplash / Pexels images, plus a `credits.md` in `docs/` so attribution is tidy.

---

## Phase 6: E-invites

Files: new `src/lib/invite.ts`, `src/lib/fortunes.ts`, `src/pages/invite/*`, `src/pages/dashboard/Invite.tsx`, `src/components/Qr.tsx`, `src/components/MapEmbed.tsx`.

### 6.1 Product
- **Free:** 5 default themes, no caricature. Decent, calm, one accent colour each.
- **Premium (₹1,500):** 5 themes with the couple's **caricature** as the hero, richer motion, music toggle, parallax, custom monogram. These must visibly out-class the free ones; the free set deliberately uses flat colour and one typeface pairing.

| Free | Premium |
|---|---|
| Classic Ivory, serif, hairline rules | Temple Gopuram Night: deep ink, gold line gopuram, lamp flicker |
| Jasmine Minimal: white, soft green, jasmine string | Kanjivaram Silk: woven texture, zari border, ruby and gold |
| Kolam Line: single-line kolam that draws itself | Royal Ruby & Gold: the studio palette, foil shimmer |
| Modern Mono: black and white, big type | Banana-leaf Feast: green leaf, sadhya illustration, playful |
| Marigold Simple: warm orange, petals | Monsoon Garden: dusk blue, rain streaks, fireflies |

### 6.2 Every invite contains
- **"X weds Y"**, names in English and Tamil at matched optical sizes (Cormorant Garamond ↔ Noto Serif Tamil, with a per-pair size ratio so the Tamil line never looks smaller), parents' names optional.
- **Date, muhurtham time** and a **live countdown** (days · hours · minutes · seconds) with Tamil labels in Tamil mode.
- **Venue** with an embedded map and a one-tap **Directions** button.
- **QR code** that opens the venue in Google Maps (for printed cards and WhatsApp forwards).
- **RSVP on WhatsApp** (`wa.me` to the couple's number with a prefilled "We'll be there" message).
- **Fortune cookie** section (6.3).
- Share sheet: copy link, WhatsApp, download as image (the invite's first screen rendered to PNG).

### 6.3 Fortune cookies
- **67 fortunes** in `fortunes.ts`, each `{ en, ta, tone }`. Written natively in both languages, not translated line by line. Tones spread across: blessings (15), playful (15), poetic (12), food and home (8), travel and adventure (7), elders' wisdom with a Tamil proverb flavour (10). No duplicates in meaning, nothing that could land badly for any family (no jokes about in-laws, money or children).
- **Animation:** the cookie rests on a plate; tap → it rocks, cracks along a seam, the halves spring apart with crumbs, and the paper slip slides out and unrolls to reveal the fortune in the current language with the other language in a smaller line below. "Another cookie" shuffles without repeats until all 67 are seen (per device, in localStorage, wrapped in try/catch).
- The fortune shown is seeded by the guest's device so a forwarded link doesn't give everyone the same first fortune. Reduced-motion users get a simple crossfade.

### 6.4 Sharing without a server
- Route `/i/<theme>#<payload>` where the payload is base64url JSON (names, date, venue, coordinates, phone, theme, caricature URL). About 300 bytes, well under any share limit; a WhatsApp preview still renders because the page sets OG tags from the payload at runtime.
- When the backend lands, the same page reads from `/api/invite/<code>` and links shrink to `/i/abc123`.
- **Builder:** `/dashboard/invite` for the couple (unlocked when the e-invite is in their order) and inside the admin showroom. Theme picker with live preview; premium themes are locked until the add-on is in the cart; caricature upload field on premium (the AI prompt you'll send decides how the caricature is made).

### 6.5 Google Maps, in the invite and the venue step
- **No key needed:** map display via the keyless `google.com/maps?q=<lat>,<lng>&output=embed` iframe; the Directions link and the QR target are plain Google Maps URLs.
- **Needs a key:** venue search with suggestions as you type (mahal names) via the Places API, and exact road distance via Distance Matrix (today it's a stand-in estimate in `pricing.ts`). Google bills these with a free monthly allowance that a studio this size won't exceed.
- **Fallback with no key:** OpenStreetMap Nominatim search (free, needs attribution, knows fewer Madurai mahals) and straight-line distance × 1.3 as the travel estimate.
- The venue step gets: search box → pick a result → pin on the map → "Use my location" → coordinates saved on the draft and order.

### 6.6 Example first
Before the rest: one finished premium invite (Temple Gopuram Night) with made-up names, a stock caricature, a real Madurai venue pin and 10 of the 67 fortunes, so the client can react before the remaining themes are built.

---

## Phase 7: Tamil and SEO

### 7.1 Tamil register
- Target: the Tamil a Madurai photographer would use with a family on the phone. Written, but close to speech: simple verbs, everyday nouns, no literary or Sanskrit-heavy words, respectful "நீங்கள் / உங்கள்" throughout, no slang.
- A glossary `docs/tamil-glossary.md` fixes one word per concept (cart, package, session, album, candid, frame, quote, advance) so every page says the same thing. Examples of the shift: *"தனிப்பயனாக்கப்பட்டது"* → *"நீங்களே மாற்றியது"*; *"மதிப்பீடு"* → *"விலை"* where it means the price shown.
- Pass over every `copy` dict (about 50 files), the voice scripts, the legal pages' summaries (the full T&C stays formal), and the 67 fortunes.

### 7.2 SEO, Madurai first
- A small `<Seo>` component per route: title, description, canonical, Open Graph image, in the current language with `hreflang` for the other.
- JSON-LD: `LocalBusiness` + `Photographer` with address, phone, opening hours, `areaServed` (Madurai and the 7 districts), `sameAs` (Instagram, Google Business), and `Product` snippets for the packages with price.
- `public/sitemap.xml` and `robots.txt` generated at build from the route list and the gallery stories.
- **Landing pages from data:** `/photography/:district/:event` (8 districts × bookable events, ~90 pages) built from the existing `DISTRICTS` and `EVENTS` data with unique copy per pair, linking into the booking flow with `?district=&event=`. This is where "wedding photographer Madurai" and "மஞ்சள் நீராட்டு விழா photography Madurai" rank.
- **Pre-rendering:** the public routes are rendered to static HTML at build time (vite SSG plugin) so crawlers get real text. Checked against the Figma Make deploy step before switching on.
- Default keyword map (expanded as the client sends terms): wedding photographer Madurai · candid photography Madurai · wedding videography Madurai · pre-wedding shoot Madurai · outdoor couple shoot Madurai · baby shower / வளைகாப்பு photography Madurai · puberty function / மஞ்சள் நீராட்டு விழா photography · திருமண புகைப்படக் கலைஞர் மதுரை · wedding album Madurai · drone wedding shoot Madurai · Tamil wedding e-invite · newborn photography Madurai (Cradle Captures) · maternity shoot Madurai (Bumpy Tales).

---

## Still needed from you (nothing blocks starting Phase 1)
1. **Gold:** OK with the "Package saving" line, or should semi-candid video be ₹6,000 everywhere?
2. Real prices for anything at 786: wedding tiers, frames, wooden box, dual books, morning/evening difference, LED wall and booths.
3. Canvera list: studio cost or customer price? sheet prices per book or per pair? sell dual books?
4. Aura: box or no box for us? Dualuxe on the site?
5. Allura and Acroluxe catalogues (sizes, colours).
6. A Google Maps API key (optional; the fallback works without it).
7. Later: client photos, frame screenshots, Canvera layouts, business details for SEO, the caricature AI prompt, the couple's WhatsApp number format for RSVP.
