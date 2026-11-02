# Handoff: Phase 2 (cart and package pricing UI), 21 Oct 2026

Nothing is committed; all changes are in the working tree on `main`, on top of the uncommitted Phase 1 work.

## Gates
- `npx tsc --noEmit -p .` clean
- `pnpm test` 54/54 (48 pricing, 6 new voice-intent tests)
- `pnpm build` passes (the existing "chunk over 500 kB" warning is unchanged)
- No visual check was done (by agreement). Layout, the sticky strip and the map are unverified in a browser.

## Done

### 2.1 Package step layout (`src/pages/book/Package.tsx`)
- Cards under the header; Silver and Gold carry an **album switch** ("A4 · 15 sheets" / "12×15 · 25 sheets +₹5,000", Gold "10×28 paperback · 25 sheets" / "12×36 · 35 sheets +₹5,000"). Card price follows the chosen variant.
- When the cards scroll out of view, a **slim glass strip** (name, price, tick) pins under the nav.
- Order is now packages, then the options list, then the voice assistant.
- Mobile dock shows the package label ("Gold package + Drone − Calendar") above the total.

### 2.2 Behaviour (`src/components/CartBuilder.tsx`, rewritten)
- One list: hours → traditional crew → candid photo styles → candid video styles → add-ons → album → frames and prints → special shoots → included. Each option card has a stock photo (`ITEM_PHOTO` in `src/lib/images.ts`), name, note, price and a toggle or stepper.
- Tapping a package selects it and scrolls to its first item; items carry an **"In Gold"** badge, and removed ones show "Taken out of Gold" so they can be added back. Tapping the active package again empties the cart (`store.clearCart`; an emptied custom cart is no longer auto-refilled).
- Removing a main item (or swapping the package album) opens a sheet: *"Removing A4 album · 15 sheets ends the Silver package. Continue?"*, with the saving amount when there is one (Gold: ₹4,000).
- Candid styles are photo chips with the bundle hint built from `BUNDLES`; the saving line springs in when the second style is picked.
- **Album configurator:** soft-only, the package's own album, the four lines (CSS cover from `AlbumSurface`), and the 10×28. Then size, orientation, 25/35/45 sheets with the photo guide, colour swatches, and the wooden box (Acroluxe / Allura, 12×36 or 12×15 only). Cards read as the difference: on Silver the 12×15 line reads "+₹5,000". The spec is written to `cart.album`.
- Hours stepper (2–16) with the coverage sentence; on Silver/Gold it notes that the portrait hour is separate, so the 5th hour is never added twice.
- Summary panel: while the cart is a package it shows the package heading with its items and saving, then **Added**, then **Removed** (struck through), then travel/adjustments/tax.
- `Surface` moved from `dashboard/Album.tsx` to `src/components/AlbumSurface.tsx` (shared, no behaviour change).

### 2.3 Voice (`intent.ts`, `VoiceAssistant.tsx`)
- New intents: `hours` ("six hours", "10 h", "ஆறு மணி நேரம்", up to 16 in both languages), `albumLine` (Pixel Passage, Aura, Acroluxe, Allura).
- New items: the six candid styles (cinematic, documentary / interview, candid moments, couple portraits, family moments, candid guests), semi-candid, FPV, pendrive, reels, premium invite, wooden box, frame sizes, album sheets and 10×28.
- "Beach", "meadow", "traditional look", "Package 1/2", "Tier 2" are package words only for their own family; elsewhere "beach" adds the beach look as a shoot instead of switching to Silver.
- Sessions are spoken as hours (× 4). Replies read back the package label with the total and say when a change ends the package. Package-only items can be re-added if they belong to the cart's package.

### 2.4 Venue map (`Venue.tsx`, new `src/components/MapEmbed.tsx`)
- Keyless Google Maps iframe under the address (it waits 0.9 s after typing before reloading), "Open in Google Maps" link, and **Use my location** (browser geolocation). Coordinates are saved as `draft.venueCoords` and copied to the order. A pin can be removed.

### Engine helpers (`catalogue.ts`, all tested)
`variantDelta`, `albumDelta`, `endsPackage`, `cartPackageItems`, `cartSpec`, `setCartHours`; `defaultAlbumChoice` in `data.ts`; candid saving lines carry `bundle`.

## Watch-outs
- The strip uses `position: sticky`. If an ancestor of the step sets `overflow: hidden`, it will not pin. Check this on the device.
- Line cards on Gold add the 25-sheet album, which ends the package (with the warning). The in-package upgrade is the card's "12×36 · 35 sheets" switch.
- Album lines still have no real cover photos (the PDFs are not in the repo); covers are CSS materials in each line's first colour.
- The admin billing screen uses the same builder, so it also gets the package-ending sheet.

## Next
Review and commit, then Phase 3 (album/package disclaimer, voice guide clip) when you say go.
