# Handoff: Phase 1 (catalogue and pricing engine), 20 Oct 2026

Timeboxed run: 22:09 → 22:19 of work, handoff written at 22:20. Nothing is committed; all changes are in the working tree on `main`.

## Gates at handoff
- `npx tsc --noEmit -p .` clean
- `pnpm test` (vitest, new) 30/30 passing
- `pnpm build` passes

## Done

### Engine (`src/lib/catalogue.ts`, `src/lib/pricing.ts`, rewritten)
- **1.1 Hours → multiplier.** `hoursMultiplier(h)` = `floor(h/4) + {0:0, 1:0.35, 2:0.65, 3:1}[h mod 4]`, clamped 2–16. `droneMultiplier` = `ceil(h/4)` (no mini). `coverageFor(h)` gives `{ hours, multiplier, label: Bi }` with the sentence *"6 hours = 1 session + 2 hours overtime (+65 %)"* in both languages. `OVERTIME_NOTE` is the summary text.
- **Cart** gains `hours?: number`. `sessions` stays for every existing caller and old orders; the engine reads `cartHours(cart)` = `hours ?? sessions × 4`. `EMPTY_CART` is 4 h.
- **1.2 Candid styles.** Six style items (`candid_couple/family/guests`, `vid_documentary/moments/cinematic`) with `bundle: 'candid_photo' | 'candid_video'`. `BUNDLES` holds the rules, `bundlePrice()` the maths. The engine emits one line per style then a negative **"Candid bundle saving"** line with `kind: 'saving'`. Bundle first, then the hours multiplier.
- **1.3 Add-ons.** `drone` 13K (noMini), `drone_fpv` 20K, `pendrive` 1K, `semi_candid_video` 10K, `reels` 7K (`requiresOutdoor`), `einvite` 0, `einvite_premium` 1.5K. `ledwall / photobooth / selfie360` are `onRequest: true`, price 0, never add to the total. Two new included rows: `hard_disk_copy` and `online_gallery` (the two sentences from the roadmap sit in their notes). `addable(item)` tells the UI what the customer may toggle.
- **1.4 Albums.** `album_25/35/45` 6.5K / 10K / 14.5K, `album_1028_25/35/45` 34,999 / 37,999 / 39,999, `album_a4_15` and `album_1028_pkg_25` as `packageOnly`, `wooden_box` and `album_dual` at ₹786 pending. Old `album_30/40/50/60` removed. `ALBUM_LINES` and `ALBUM_PHOTO_GUIDE` (real §8b figures) added to `data.ts`; Acroluxe and Allura are `pending: true` with empty colours.
- **1.5 Frames.** `frame_a4` 750, `frame_a3` 1,250, `frame_12x18/16x24/20x30` at 786, all pending. Premium frames dropped. `calendar` 749 package-only. Magazine and mini book flagged pending.
- **1.6 Packages.** Presets keep the `basic / standard / premium` keys (so every caller compiles) but display as **Bronze / Silver / Gold**. Family presets carry `target` and `main`. Engine adds a **"Package saving"** line = `target − sum` while the package is intact. `setCartQty` now keeps the tier unless a main item is removed or the package album is swapped, which drops to `custom`. `computeQuote().package` returns `{ key, name, target, saving, removed, added, label }`; label reads *"Gold package + Drone − Calendar"*.
  - Gold's items sum to **33,999**, not the 34,000 in the roadmap, so the saving is exactly **₹4,000**. Bronze 12,500 and Silver 19,999 sum exactly with no saving line. Tests lock all three.
- **1.7 Commercial and baby.** `commercial_brand` 25K and `commercial_school` 35K with `unit: 'month'`. `EventType.bookable?: boolean`; `babyshoot` is `bookable: false` and hidden from `/book/event`.
- **1.8 Output.** `Quote` has `coverage` and `package?`; saving lines carry `kind: 'saving'`. Crew lines read *"× 1.65 (6 h)"*.
- **1.9 Tests.** `src/lib/pricing.test.ts`: multiplier table, drone, coverage labels, bundles (1/2/3 picks, mini session), every targeted preset sums to its target, non-main removal keeps saving, main removal drops it, album swap ends package, ₹786 items all pending, on-request items free, legacy carts without `hours`.

### UI touched (minimum to keep the engine honest)
- `src/pages/book/Event.tsx`: slider 2–16 h, writes `cart.hours`, shows the coverage sentence and the overtime note. Crowd note now says it helps plan the crew.
- `src/lib/data.ts`: `CROWDS[].add` all 0.
- `src/pages/admin/Cms.tsx` price tab: a **Packages** panel (options sum, target, saving, amber drift warning when the sum drops below target) and a **Prices to confirm** panel listing every pending / ₹786 item. `per month` unit label.
- `src/components/CartBuilder.tsx` and `store.setSessions`: the sessions stepper now also writes `hours = sessions × 4`, and the crew subtotal uses the multiplier, so the builder agrees with the engine.
- `src/pages/book/intent.ts`: ids remapped (`candid_photo → candid_family`, `candid_video → vid_cinematic`, album sheet words → 25/35/45). The voice assistant still only knows these coarse matches; Phase 2.3 teaches it the styles.
- `package.json`: `vitest 3.2.4`, scripts `test` and `typecheck`.

## Second run (21 Oct 2026): the nine open items, all closed
Gates after this run: `tsc` clean, 43/43 tests, `pnpm build` passes.

1. **Album studio** uses 25/35/45 tiers. `albumUpgradeCost(cart, sheets)` charges the price difference (Silver A4 → 25 sheets = +₹5,000; 10×28 albums move within 10×28 tiers). `ALBUM.sheetPrice` is gone. Services album copy shows the three tier prices.
2. **`cart.album`** (`AlbumChoice`: line, size, orientation, colour, box) is on the `Cart` type. Nothing writes it yet; Phase 2's configurator does.
3. **Package variants.** `variants: [{ label, swap, target }]` on presets; `cart.variant`. Silver option 2 = 24,999, Gold option 2 = 34,999 (same ₹4,000 saving). Picking the variant album keeps the package and switches variant; picking the base album switches back; any other album ends it.
4. **Wedding, engagement, reception** use a new `wedding` kind: Package 1, Package 2, Tier 2, all `target: 786, pending: true`. **Outdoor** uses an `outdoor` kind: traditional / beach / meadow looks at ₹10,000 each, with `outdoor_mini` 6,500 and reels as options. `OUTDOOR_VENUES` and `OUTDOOR_SLOTS` (same price, pending) in `data.ts`. **Baby shower** moved to the family Bronze/Silver/Gold, per notes §6a. Carts now remember `kind`, and labels use `presetName` / `cartTierName`.
5. **Admin packages panel** lists every targeted package and variant by kind, with sum, target, saving, the negative-saving warning, and a "changed since last review" warning against `cms.catalogue.savings`. A button records the current savings.
6. **Services:** baby shoot shows "Contact us" instead of a price; commercial shows the two monthly plans with Enquire buttons; the package cards are the family Bronze/Silver/Gold with the option-2 price; add-ons show "Ask us" or "Included". **Home** links the baby shoot to Contact. A `?event=babyshoot` deep link no longer enters the booking draft.
7. **"Sessions" wording** replaced with hours in Summary, Invoice and Order detail. The voice assistant prices additions as the real quote difference, refuses on-request and package-only items, sets hours with sessions, reads back the package label, and maps "bronze / silver / gold" to the right packages.
8. **Reels** are refused without an outdoor item and dropped when the last one goes.
9. **Rate card** has an "All items / Prices to confirm" filter.

Also fixed along the way:
- Picking a package used to rebuild hours from `sessions` (6 h became 8 h). Every `tierCart` call now passes the real hours.
- The cart builder's crew subtotal now uses the same multiplier and bundle maths as the engine, and hides package-only, on-request and monthly items unless they are already in the cart.
- `formatINR` prints negatives as `−₹4,000`. Saving lines are styled in ruby in Summary, Invoice and Order detail.
- Store `version: 5` reseeds demo orders and the booking draft, so old browsers drop removed ids like `album_30`.
- The overtime note sits under the summary lines; the package step's commercial plans come first.

## Watch-outs
- **Wedding packages total ₹786** everywhere until the client sends prices, including seeded demo wedding orders. The Services hero "from" price skips pending packages.
- Silver and Gold are 5 hours in the notes. The 5th hour is the `portrait_hour` item, so the package carts stay at 4 h for the multiplier. Phase 2's hours control must not add the 5th hour twice.
- Tier 2 contents are a guess (coverage + 10×28 album, notes §6b ❓). Package 2's outdoor shoot uses the traditional look.
- `/contact?plan=` is linked but the Contact page does not read the parameter yet.
- The variant switch has no UI yet; that is Phase 2.1.
- Open client questions are unchanged: see "Still needed from you" in `docs/roadmap.md`.

## Next
Review and commit, then start Phase 2 (cart and package pricing UI) when you say go.
