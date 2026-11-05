# Photographer section: plan (5 Nov 2026, updated same day)

A new section of the TTC site for other photographers, with two tools under one login:
1. **Album photo selector**: the couple picks in the browser, the photographer gets the filename list
   (see `docs/album-selection-costs.pdf`, `docs/photographer-guide/`).
2. **Storage devices manager**: a catalogue of which photo or video sits on which physical drive.
   The photographer plugs a drive into their own computer, opens our site, and the browser reads the
   drive and sends only the metadata to us. Later they search the site instead of plugging in drives.
TTC becomes tenant number one; `/dashboard/photos` later reads from the same API.

The **main TTC admin** (`/admin`) gets two wings: **Events** (everything that exists today: orders,
leads, billing, showroom, team, CMS) and **Photographers** (the studios subscribed to the tools above).

Rules carried over from `docs/roadmap.md`: no visual testing (tsc + build + vitest), ₹786 for
unconfirmed prices, phases start only when you name them. Nothing here has started.

---

## What exists already (reused, not rebuilt)
- `src/pages/dashboard/Photos.tsx` (chapter gallery) and `PhotosLightTable.tsx` (keep/pass culling),
  `proofing.tsx` (quota status, watermark, submit modal), `components/Lightbox.tsx`, `ui.tsx`.
  All are TTC-branded (ruby, Tamil ornaments, "© The Treasure Capture" watermark) and read the TTC order store.
- `docs/photographer-guide` fixes the contract: proofs are 2048 px JPEGs named exactly like the RAWs;
  the output is one line `DSC_4821, DSC_4830, …` with no extensions, pasted into Lightroom's filter.
- `plan.txt` §9–10 already sketches the API/DB (Fastify + Prisma + Postgres, signed URLs).
- No server code exists anywhere in the repo. Figma Make only runs the Vite dev server.

## Shape
- Same repo, isolated under `src/saas/` (routes, store, theme, copy) so it shares `ui.tsx`, motion and
  the Lightbox, and can be split into its own repo when it is sold. Nothing in `src/saas/` imports TTC data.
- Three route groups in `App.tsx`:
  - `/s/:code` client selection (public link + optional PIN)
  - `/studio/login`, `/studio/*` photographer panel
  - `/studio/drives/*` storage devices manager
  - `/studio/account` plan and usage
- White-label theme per studio: name, logo, accent colour, watermark text, WhatsApp number. The TTC
  ornaments stay out of `src/saas/`.
- Same pattern as `src/lib/store.ts`: a persisted Zustand mock first, with every action annotated with
  the endpoint that replaces it; `src/saas/api.ts` is the single swap point.

## Data model (`src/saas/types.ts`, later Prisma)
```
Studio    { id, name, slug, logoUrl?, accent, watermark, phone, whatsapp, lang: 'en'|'ta', plan, createdAt }
Event     { id, studioId, code (8-char share code), pin?, title, date, clientNames, clientPhone,
            quota, deadline, status: draft|uploading|open|submitted|closed|archived,
            chapters: [{ key, name, sort }], coverId?, createdAt, submittedAt?, reopenedAt? }
Proof     { id, eventId, chapter, filename (no ext), ext, w, h, bytes, previewKey, thumbKey, sort }
Selection { eventId, proofId, by?: string, note?: string, at }          // only ids + notes are kept
Activity  { eventId, kind: opened|selected|submitted|reopened|exported, at, meta }

Drive     { id, studioId, label, markerId (uuid written to the drive root), capacityBytes?, usedBytes?,
            kept: string ("shelf 2, red case"), notes, lastScanAt, fileCount, status: ok|missing|retired }
Asset     { id, driveId, path, filename, ext, kind: photo|video|raw|other, bytes, modifiedAt,
            takenAt?, camera?, lens?, w?, h?, durationSec?, codec?, fingerprint (size + first 1 MB hash),
            eventId?, thumbKey? }
Scan      { id, driveId, at, added, removed, changed, durationSec }
```

---

## Phase S1: Client selection interface (`/s/:code`)
Files: `src/saas/client/*` (Gate, Gallery, LightTable, Lightbox wrapper, Tray, Submit), `src/saas/store.ts`, `src/saas/theme.tsx`.

1. **Entry.** Studio logo and name, event title, date, "Enter PIN" if set, "Who is choosing?" chip
   (optional name, stored on each pick). Language toggle EN / TA.
2. **Gallery.** Chapters = upload folders. Masonry with true aspect ratios, lazy load in pages of 60,
   heart to select, long-press for multi-select, filter all / selected / not selected, chapter jump list.
   Port of `Photos.tsx` with the TTC brand removed.
3. **Light table mode.** Port of `PhotosLightTable.tsx` (keep / pass, swipe, keyboard, undo) as a toggle.
4. **Lightbox.** Swipe, keyboard, pinch-zoom, "compare" two-up, per-photo note ("crop tighter", "remove uncle").
5. **Quota and submit.** Ring + sticky bar; over-quota allowed but flagged; submit modal; after submit the
   gallery is read-only with "Ask the studio to reopen" (prefilled WhatsApp to the studio).
6. **Resilience.** Picks are saved locally at once and synced with a debounced PUT; conflict rule is
   last-write-wins per proof. Works on a flaky 4G connection.
7. **Protection.** Watermark burned into the preview at upload (S2.3), signed preview URLs, no-download soft blocks.

Tests: quota status, filter counts, local/remote merge of selections.

## Phase S2: Photographer admin panel (`/studio/*`)
Files: `src/saas/studio/*` (Login, Onboarding, Events, EventNew, Upload, Share, Progress, Selection, Account), `src/saas/upload.ts`, `src/saas/lightroom.ts`.

1. **Login and onboarding.** Phone OTP (mock: any code). First run asks name, logo, accent, WhatsApp, default quota, default window (days).
2. **Events list.** Cards: status, proof count, selected / quota, days left, storage used, last client activity. Search and filter by status.
3. **New event and upload.**
   - Form: title, date, client names, phone, PIN, quota, deadline, language.
   - Drag-and-drop files or folders; folders become chapters (rename and reorder).
   - **Browser-side preparation** before upload: resize to 2048 px long edge, JPEG quality 80, burn the
     studio watermark (Canvas), make a 400 px thumbnail, keep the original filename.
     This is the "previews only" sizing from the cost sheet, about 340 MB per event instead of 10 GB.
   - **RAW files are accepted in the same drop zone.** Every RAW (CR2, CR3, NEF, ARW, DNG) carries a full-size
     JPEG preview inside it; the browser pulls that out with `exifr`, resizes it as above, and uploads only the
     1 MB JPG. The RAW itself never uploads. So the photographer can drag the card folder straight in, which is
     what the client asked for, without the 75–180 GB per wedding that a real RAW upload would cost
     (see the FotoOwl comparison in the chat of 5 Nov: FotoOwl takes JPGs only). The preview shows the
     straight-from-camera look, not Lightroom edits; the guide's Lightroom export path stays for photographers
     who want edited proofs. **Decided 5 Nov 2026: this is the only path; no RAW cloud backup.** Camera serial and capture time from EXIF are stored with each proof so two cameras
     both producing `IMG_0001` do not collide; the Lightroom list is split per camera when that happens.
   - Four parallel uploads, retry with backoff, resume after a reload (queue in IndexedDB), duplicate-name detection, progress per file and total.
4. **Share.** Link + PIN, prefilled WhatsApp message in the client's language, QR code (reuse `components/Qr.tsx`).
5. **Progress and selection.** Opened / selected / submitted timeline; grid of the chosen proofs with notes;
   **Copy for Lightroom** (one line, comma + space, no extensions, exactly as the guide says), split per chapter
   when filenames repeat across cameras; download TXT / CSV; reopen; close; archive (previews deleted after 45 days).
6. **Account.** Plan tier and usage (clients this month, storage), tiers from the cost sheet with unconfirmed
   prices at ₹786 and flagged; payment is manual UPI for now (in-house billing rule).

Tests: Lightroom string formatting, chapter split, upload queue state machine, resize math.

## Phase S2b: Storage devices manager (`/studio/drives`)
Files: `src/saas/drives/*` (Drives, DriveDetail, Scan, Search), `src/saas/scan.ts`, `src/saas/meta.ts`.

How the browser reads a drive:
- **File System Access API** (`showDirectoryPicker`): Chrome and Edge on desktop. The photographer picks
  the drive's root folder once; the browser walks every folder and reads names, sizes and dates without
  uploading a single file. Firefox and Safari do not support it; those browsers get a read-only catalogue
  and a note to scan from Chrome. A small desktop helper can come later if that limit bites.
- **Drive identity.** Browsers do not expose serial numbers, so the first scan writes a tiny marker file
  `.tce-drive.json` with a UUID to the drive root (the API asks the user for write permission once).
  Every later scan reads the marker and knows it is the same drive even if the label changed.
- **Metadata read locally** from the first few hundred KB of each file, not the whole file:
  EXIF for JPEG and RAW (CR2, NEF, ARW, DNG; `exifr` library): taken-at, camera, lens, dimensions;
  for MP4 and MOV the duration, resolution and codec from the file header. A thumbnail (320 px) is made
  for JPEGs and optionally for RAW embedded previews; videos get a frame via a hidden `<video>` element
  for formats the browser can decode. A fingerprint (size + hash of the first 1 MB) finds duplicates across drives.
- **Speed and resilience.** A 2 TB drive with 200k files scans in minutes for names and sizes; EXIF adds
  a pass that can be paused and resumed. Progress and partial results are kept in IndexedDB, then sent to
  the server in batches of 500 assets. Rescans diff against the last scan (added, removed, changed).

Screens:
1. **Drives list.** Label, kept-where note, capacity bar, file and event counts, last scan, status
   (ok, missing from last scan, retired). "Add a drive" opens the picker and runs the first scan.
2. **Drive detail.** Folder tree with counts, events detected from folder names and dates, duplicates panel,
   "move to" and "retire" actions, scan history.
3. **Search.** Across every drive: filename, event, date range, camera, kind (photo, video, raw).
   Result rows say "Drive B, `/2026/Sharma wedding/RAW/DSC_4821.NEF`, shelf 2". Export to CSV.
4. **Link to the selector.** When a couple submits a selection, the manager matches the filenames and
   shows "all 180 chosen files are on Drive B in `/Sharma wedding/RAW`", or lists what it cannot find.
5. **Health.** Drives not seen for 6 months are flagged; optional "verify" rescan compares sizes to catch bit rot or deletions.

Server cost is small: metadata only, roughly 300 bytes per asset, so 1 million files is about 300 MB in Postgres; thumbnails are optional and off by default.

Tests: folder walk diff, EXIF field mapping, fingerprint, Lightroom-list to asset matching.

## Phase S2c: TTC admin, Photographers wing (`/admin/photographers`)
Files: `src/pages/admin/AdminLayout.tsx` (nav split into Events / Photographers), `src/pages/admin/photographers/*`
(Studios, StudioDetail, Plans, Approvals), `src/saas/store.ts` (admin actions).

1. **Nav split.** The admin sidebar shows two groups: Events (unchanged) and Photographers. The admin
   overview adds a tile row for the new wing: active studios, events open this month, storage used, dues.
2. **Studios list.** Name, owner phone, plan, status (pending, active, paused, cancelled), clients this
   month against the tier limit, storage used, last activity, amount due. Search and filter.
3. **Studio detail.** Profile and branding, plan history, usage charts by month, payments logged by hand
   (UPI, cash, bank, same pattern as orders), their events and drives at a glance (counts and status only;
   client photos are not browsed from here), notes, WhatsApp message log, and "Open their panel" to see
   the studio exactly as they see it, with a banner that says you are viewing as admin.
4. **Approvals.** New sign-ups wait here; approve, set the plan, or decline. Pause a studio for non-payment:
   their panel shows a notice and the client links keep working for 7 days.
5. **Plans.** The tiers (20 / 50 / 100 / 150 clients a month) with prices (₹786 until confirmed), limits
   and what counts as a client. Changing a price here changes what new studios see.
6. **Dues and reminders.** Monthly statement per studio, "Send reminder on WhatsApp" with a prefilled message,
   mark paid. Reuses `InvoiceDoc` for a printable statement.

Tests: usage counting against the tier, pause and grace period, statement totals.

## Phase S3: Server (`server/`, runs on the VPS, not inside Figma Make)
- Fastify + TypeScript, Prisma + Postgres, Backblaze B2 via S3 presigned PUT (per the cost sheet; GCS stays possible by swapping one adapter).
- Endpoints: `POST /auth/otp/request|verify`, `CRUD /studio/events`, `POST /events/:id/proofs/presign`,
  `POST /events/:id/proofs/complete`, `GET /s/:code` (gate), `GET /s/:code/proofs` (signed URLs, 15 min),
  `PUT /s/:code/selection`, `POST /s/:code/submit`, `POST /events/:id/reopen`, `GET /events/:id/export`,
  `CRUD /studio/drives`, `POST /drives/:id/scans` (batched assets), `GET /studio/assets?q=`, `GET /events/:id/locate`.
  Admin: `GET /admin/studios`, `PATCH /admin/studios/:id` (plan, status), `POST /admin/studios/:id/payments`,
  `GET /admin/studios/:id/usage`, `POST /admin/studios/:id/impersonate` (short-lived token).
- Jobs: expiry of previews, deadline reminders on WhatsApp, usage counters.
- Security: rate limits on OTP and PIN, studio-scoped queries everywhere, no raw originals ever stored.
- Deploy: Caddy + systemd on the GoDaddy VPS; `.env` for B2 keys; a `pnpm server:dev` script; a load test before launch.
- `src/saas/api.ts` switches from the mock to `fetch` behind `VITE_SAAS_API`.

## Phase S4: TTC becomes tenant one
- `/dashboard/photos` reads proofs and writes selections through the same API; `gcsPath` and the stock
  proof sets go. `OrderDetail` shows the Lightroom list and the upload screen for TTC's own orders.
- Photographer guide screenshots come from the real upload screen.

---

## Decisions taken unless you say otherwise
1. Same repo, under `src/saas/`, not a new repo.
2. S1 and S2 are built on a mock store first (works in the Figma Make preview), S3 follows.
3. Storage is Backblaze B2 as in the cost sheet, not GCS.
4. Languages EN and TA only.
5. Previews are made in the browser, including from RAW files via their embedded JPEG; originals never leave
   the photographer's disk. No RAW cloud backup tier (decided 5 Nov 2026).

## Questions (none block S1)
- Do photographers sign up themselves and wait for approval, or does TTC create every studio by hand?
- Can TTC admin open a studio's panel ("view as"), or only see counts and payments?
- Storage manager: is scanning from Chrome or Edge on the photographer's desktop acceptable, with a desktop helper later for Firefox and Safari?
- Should thumbnails be stored on our server (costs storage) or stay metadata-only (default)?
- Writing a small marker file to each drive: fine, or must drives stay untouched?
- Is this product **Shotcut**, the sub-brand with details TBD? If so the name and wordmark go in now.
- Plan prices for photographers: confirm the cost-sheet tiers (20 / 50 / 100 / 150 clients a month), else ₹786.
- Can several family members pick on one link (per-person names on hearts), or one shared selection only?
- Preview retention after submit: 45 days as in the cost sheet?

---

## Status (5 Nov 2026, after the v2 plan)
Built on the mock stores (no server yet), checked with tsc, vitest (281 tests) and both builds; nothing tested visually.
- S1 client selection (src/saas/client) · S2 photographer panel `/studio/*` with in-browser RAW→JPEG (src/saas/studio, src/saas/upload.ts) · S2b drives `/studio/drives` (src/saas/drives) · S2c TTC admin wing `/admin/photographers*`. Studio OS (src/saas/os) and the couple's portal `/p/:code` (src/saas/portal).
- **v2 plan done** (`docs/photographer-saas-plan.md`, phases 1–10): term plans ₹1300/₹999/₹899 a month with the admin Paid/Pending/Revoke gate; Enquiries/Team/Finances/Requests removed; gallery and poses live inside the project, customer links `/gallery/:code` (alias `/s/:code`) and `/poses/:code`; per-customer theme/religion/features/work stage; white-label `<head>` on customer pages (`useBrandHead` in src/saas/theme.tsx); admin groups "Manage customers" / "Manage photography clients" with studio Controls (picker version, feature defaults, portal banner, settings override), a Customers list and `/admin/photographers/:id/customers/:code`; the same Customer settings panel on our own orders (`/admin/orders/:id`). Tenant scoping in src/saas/scope.ts, asserted by src/saas/isolation.test.ts.
- **Copy chosen originals (5 Nov 2026):** the event's Selection tab › "Where are the originals?" now copies the matched RAWs (plus `.xmp` sidecars) from each scanned drive into `<event>-chosen` in a folder the photographer picks. Chrome / Edge desktop only (File System Access); checks the drive marker so the wrong drive is refused, skips files already copied at the same size (re-run resumes), stops on a full disk. src/saas/drives/copyOut.ts + CopyChosen.tsx, tests in copyOut.test.ts. Not yet tried on a real drive.
- **Demo:** photographer +91 90000 11111 (any OTP), Lens & Light (paid 12 months). Kural Frames is revoked, Nila Weddings is pending (approve it in `/admin/photographers/approvals`). One code per customer: `/gallery/divya2rk`, `/poses/divya2rk`, `/p/divya2rk`, all PIN 4821; the second customer is `meera7wq` (PIN 1234, gallery still a draft). Legacy `/s/demo4821` PIN 2026 still opens the Divya gallery.
- **Limit of a frontend-only build:** the static `index.html` title, favicon and og tags still name TTC until JS runs, and link-preview bots that don't run JS see those. The prerenderer does not prerender the customer routes, so this needs the server (S3) to fix.
- Open: S3 server, S4 TTC as tenant one; real TTC support WhatsApp (`TTC_SUPPORT_WA` placeholder); product name (`src/saas/brand.ts`); ❓ religion → invite theme table `INVITE_THEMES_FOR` in src/saas/poses/logic.ts is a guess; order picker switch writes the browser-wide `useProofingVersion` until the backend stores it per order; admin CMS can't change most fixed photo slots (Phase 10 report).
