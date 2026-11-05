# Animation plan — site-wide motion and the "fly to cart" moment

Written 5 Nov 2026 for whoever executes it next (a cheaper model is fine). Every step names the file,
the component and the check that proves it works. Keep to the order; do not reinterpret.

## Hard rules for the executor

- **Do not touch** files another session is editing right now: `src/pages/dashboard/**`, `src/components/PinMap.tsx`,
  `src/App.tsx`, `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `src/components/EAlbumViewer.tsx`,
  `src/saas/**`, `docs/meeting-notes.md`. Never stage or commit them.
- **No screenshots, no loading the site.** Verify with `node_modules/.bin/tsc --noEmit -p .`, `node_modules/.bin/vite build`,
  `node_modules/.bin/vitest run`. The user tests visually and reports back.
- One motion language: the site's `EASE` curve from `src/components/motion.tsx`, springs around stiffness 300–420 / damping 22–34,
  durations 0.4–0.9 s. Ruby for "yours", gold for "in the package". Everything degrades to a plain fade under
  `prefers-reduced-motion` (use `useReducedMotion()` from `motion/react`).
- Touch screens get no hover tilt or magnetic pull; they get the tap feedback (pluck, bump, chip) instead.

## Step 0 — Find out why nothing was visible (do this first, 15 min)

Facts established on 5 Nov: the dev server on `http://localhost:8443` (pid 54390, started 00:40) serves the new
`src/components/CartFlight.tsx` and the updated `CartBuilder.tsx`; typecheck, build and all 106 tests pass;
`setCartQty` returns a fresh `items` object, so the change-watcher fires. Nothing was found wrong by reading the code.
So the first job is to make the failure visible rather than guess:

1. **Dev-only console tracing.** In `src/components/CartFlight.tsx`, inside `flyToCart`, add
   `if (import.meta.env.DEV) console.info('[cart-flight]', id, direction, { target: !!to, origin: !!origin })` before the early
   returns. In `useCartFlights` (`CartBuilder.tsx`) log `added` / `removed` the same way. The user then opens the browser console
   on `/book/package`, toggles "Traditional video" and reads the lines. Three outcomes:
   - no `[cart-flight]` line at all → the browser is not running this code (wrong URL, Figma hosted preview, or the GitHub deploy;
     a deploy needs `git commit` + `git push` of the animation files only). Ask which URL they use.
   - `target: false` → no `[data-cart-target]` on screen; check `Summary.tsx` CartTarget wrappers rendered for that breakpoint.
   - `origin: false` → `#opt-<id>` / `[data-opt]` lookup failed; check the card ids.
   - lines fine but nothing moves → `prefers-reduced-motion` is on (macOS Accessibility › Display › Reduce motion, or iOS).
     The site honours it strictly (`src/index.css` zeroes every duration). Say so to the user; do not disable the rule.
2. Remove the console lines once the cause is known.

## Step 1 — Cart: make the add-to-cart moment unmistakable (CartBuilder, CartFlight, Summary)

Already built: photo lifts off the card (pluck + ruby ring), arcs to the live total, total bumps with ruby/gold sparks and a
"+1", new quote line glows ruby; removal flies back out with "−1"; picking a package pours up to six items in; voice
assistant changes fly too. Polish, in order:

1. **Trail.** In `Sprite` (`CartFlight.tsx`) render two ghost copies behind the photo: same path, `delay + 0.05` and `+ 0.1`,
   opacity 0.45 / 0.25, scale × 0.85 / 0.7, no gold spark, no ring. Check: three circles in a comet line.
2. **Phone receipt chip.** Phones hide the quote lines in the sheet, so landing needs words. Add `lastChange` to the
   `useCartFlight` store: `{ label: string; amount: number; direction; n: number }`, set from `useCartFlights` (it has the
   catalogue item and `usePrices()`; pass label/amount through `flyToCart` options). New `CartToast` component in
   `CartFlight.tsx`, rendered inside `MobileQuoteBar` above the dock (`lg:hidden`): glass pill, "+ Drone · ₹5,000" or
   "− Drone", slides up 12 px and fades after 2.2 s (`AnimatePresence`, key on `n`). Appears only after the flight lands
   (subscribe to `pulse`, not to the flight start).
3. **Dock badge.** In `MobileQuoteBar`'s quote button, a small ruby count of customer-added items (`quote.package?.added.length`
   or custom cart line count); `motion.span` with `key={count}` scale 0.6→1 spring. Check: number pops on every add.
4. **"+" pop on new lines.** `LineList` in `Summary.tsx`: the `+` prefix becomes `motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}`
   spring 420/22. Check: plus sign springs in with the line.
5. **Prices roll on every card.** `OptionCard` price: replace the formatted number in `priceText` with `<AnimatedINR value={price} />`
   plus the unit text, so hour changes roll every per-session price. `AnimatedINR` lives in `src/pages/book/shared.tsx`; move it
   to `src/components/motion.tsx` (keep a re-export in shared.tsx) to avoid a components→pages import.
6. **Total flashes colour.** In `AnimatedINR`, on value change animate `color` from ruby (`#9b111e`) on increase or grey
   (`#6b6b72`) on decrease back to the computed colour captured on mount (`getComputedStyle(el).color`), 1.1 s, EASE.
7. **Crew subtotal bar** (`CartBuilder.tsx`, the ink bar): `AnimatedINR` for the figure and a `<Sweep trigger={crewSubtotal} />`
   with `tone="rgba(255,255,255,0.18)"`; the bar needs `relative overflow-hidden`.
8. **Bundle saving banner:** add `<Sweep trigger={saving} tone="rgba(155,17,30,0.18)" />` inside the `motion.p` (make it `relative overflow-hidden`)
   and rotate the sparkle icon once (`motion.span animate={{ rotate: 360 }}` keyed on `saving`).
9. **Package badges pop.** `PackageBadge`: wrap in `motion.span` with `initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}`,
   keyed on `on`, spring. When a package is picked all gold badges pop one after another: add `style={{ transitionDelay }}` is not enough;
   pass an `index` from the parent map and use `transition={{ delay: index * 0.04 }}`.
10. **Included section:** make the `ul` a `Stagger` and each `li` a `StaggerItem y={10}`; the check icon spins in
    (`motion.span initial={{ rotate: -90, scale: 0 }}`).
11. **Album cover colour:** in `CoverPreview`, key the `motion.div` on `hex` too, so a colour change re-plays the tilt-in. Check: cover
    turns on its spine when a swatch is tapped.

## Step 2 — Booking flow, the other four steps

1. **Magnetic Continue.** Add `Magnetic` to `motion.tsx`: wrapper `motion.div` with `x`/`y` springs (stiffness 180, damping 16),
   pointer move sets offset × 0.28 from centre, leave resets; mouse/pen only. Wrap the Continue `Button` in `StepNav`
   (`src/pages/book/shared.tsx`). Check: the button leans toward the cursor.
2. **District cards** (`District.tsx`): wrap each `motion.button` in `<Tilt className="h-full rounded-[22px]" max={6}>`.
   On pick, before the 260 ms navigate, the check badge pops (already transitions; add `key={picked}` scale spring).
3. **Event cards** (`Event.tsx`): `<Tilt className="h-full rounded-[22px]" max={6}>` around each button and
   `{active && <Sweep trigger={e.key} tone="rgba(155,17,30,0.22)" />}` inside it (button is `relative overflow-hidden`).
   Crowd `ChoiceCard`s: `Tilt` with `max={4}`.
4. **Venue** (`Venue.tsx`, not `PinMap.tsx`): when `venueCoords` changes, `Sweep` across the distance card and the km number
   rolls (it is a `motion.span`; use `AnimatedINR`-style `useMotionValue` → `useTransform` to whole km).
5. **Details** (`Details.tsx`): the submit button gets `Magnetic`; while `busy`, the ruby button shows the existing spinner.
   On the Confirmed page add a one-time spark burst around the booking-reference card on mount: export `Burst` from
   `CartFlight.tsx` and render `<Burst kind="in" />` inside a `relative` wrapper 400 ms after mount.
6. **Step indicator** (`Steps` in `ui.tsx`): the active bar already fills to 45 %; add a soft pulse on the active segment
   (`animate={{ opacity: [1, 0.7, 1] }}`, 2.4 s, `repeat: Infinity`), off under reduced motion.

## Step 3 — Public pages

1. **Buttons everywhere:** add `magnetic?: boolean` to `Button` (`ui.tsx`); when true, wrap the rendered element in `Magnetic`.
   Set it on the hero CTAs in `Home.tsx` (lines ~200–201) and on the Services package `Button`s. Not on `full` buttons.
2. **Home:** district `Tilt` is in. Add a `Sweep` over the "Most loved" badge on Services and the head-studio badge on Home
   when they scroll into view (`useInView(ref, { once: true })` → trigger state).
3. **Services:** package and add-on `Tilt` are in. The popular package card: `Sweep` with gold tone once in view.
4. **Gallery / About / Contact:** already dense with reveals; only the `Button magnetic` prop applies. Leave them otherwise.
5. **Nav / Footer:** leave.

## Step 4 — Definition of done

- `tsc`, `vite build`, `vitest run` all pass. `git status` shows changes only in: `src/components/CartFlight.tsx`,
  `src/components/CartBuilder.tsx`, `src/components/motion.tsx`, `src/components/ui.tsx`, `src/pages/book/*.tsx`,
  `src/pages/Home.tsx`, `src/pages/Services.tsx`, `docs/animation-plan.md`.
- Manual checklist for the user (desktop then phone):
  1. `/book/package`: toggle Traditional video → photo flies with a trail, total bumps, sparks, "+1", quote line glows.
  2. Toggle it off → flies back, "−1".
  3. Tap Gold → gold sweep on the card, several photos pour in, badges pop in sequence.
  4. Change hours → every per-session price rolls, crew bar sweeps, total flashes ruby.
  5. Phone: same toggle → chip "+ Traditional video · ₹10,000" above the dock, dock count pops.
  6. Home / Services: cards lean toward the mouse with a glare; CTAs pull toward the cursor.
  7. Event step: picked card sweeps; Continue button is magnetic.
  8. With Reduce Motion on: everything still works, nothing flies, only fades.
