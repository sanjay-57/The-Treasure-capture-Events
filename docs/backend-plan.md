# Backend plan: LAN-first server (5 Nov 2026)

## Status: built 5 Nov 2026 (L0–L9 done, L10 later)
Run it: `docs/lan-setup.md`. Checks: root `tsc` + 290 tests + both builds; `server/` `tsc` + 23 tests; curl smoke test of the built site. **Not tried in a browser** (no visual testing), so the first real run may surface UI issues.

**What changed from the plan below while building (the code is the truth):**
- **One Action API instead of ~70 REST routes.** The browser sends `POST /api/act {store, action, args}`. The server loads only the records that action may touch (`server/src/engine/slice.ts`), runs **the same Zustand store action** the browser would (`server/src/engine/engine.ts`), saves what changed, and replies with the changes. Mock and LAN mode can't drift apart, and new actions other chats add work for admin with no server change (admin-only by default). Who may call what is in `server/src/policy/actions.ts`; who may see what is in `server/src/policy/scope.ts`.
- **Live** = every committed change goes over `GET /api/live` (SSE) to each open tab, filtered by that tab's session. No topics needed.
- **Storage** = one `docs` table holding every record in the frontend's own shape (JSON) plus lookup columns. Hand-written SQL migrations on better-sqlite3; no Drizzle.
- **Media** is served by cookie session (`/media/proofs/<event>/<proof>.jpg`), not signed URLs. The gallery cover opens before the PIN.
- **Logins:** admin = name + password; customers **and** photographers = phone + 4-digit code shown on the admin screen (`src/components/LoginCodes.tsx`); photographer's customers = project/gallery PIN (`POST /api/auth/gate`, `GET /api/gate/:code` for the pre-PIN screen). One device can hold several grants at once.
- **Browser side** (`src/api/`): `bindRemote()` swaps the store actions for server calls at runtime, so the store files are unchanged. `hydrate`/`applyChanges` fill the stores; `persist` keeps only device settings. Clipboard and `crypto.randomUUID` are polyfilled for plain HTTP. In LAN mode, actions that return a value return a Promise; their 9 call sites now `await`.
- Screens touched for LAN mode (each change does nothing in mock mode): `main.tsx`, `Login.tsx`, `AdminLogin.tsx`, `AdminLayout.tsx` (codes card), `book/Details.tsx`, `admin/Showroom.tsx`, `saas/studio/{StudioLogin,EventNew}.tsx`, `saas/drives/ScanFlow.tsx`, `saas/os/screens/{Projects,project/OverviewTab}.tsx`, `saas/client/{session.ts,Gate.tsx}`, `saas/portal/Portal.tsx`, `saas/poses/PoseChooser.tsx`, `saas/upload.ts`, `saas/studio/uploadQueue.ts`.

**Not done yet:**
1. **TTC's own orders on real uploads (S4).** `/dashboard/photos` still shows the stock proof sets. The server already lets a TTC customer see any gallery whose `clientPhone` matches their verified phone; it still needs an "upload" step for our own orders in `OrderDetail` and Photos reading that gallery.
2. **Drive catalogue rows** (`assets`) still live in the scanning browser's IndexedDB. Drives and scans sync, and `/api/drives/:id/assets` and `/api/assets/search` exist, but `src/saas/scan.ts` and the drive screens aren't wired to them.
3. ~~CMS photo upload button~~ **done** 5 Nov: in LAN mode the Site photos, hero and gallery forms in `Cms.tsx` get an "Upload photo" button (`/api/upload/file`).
4. ~~Admin accounts screen~~ **done** 5 Nov: `/admin/server` (`src/pages/admin/Server.tsx`) lists, adds and disables admins, changes your password, runs a backup and shows the audit log.
5. ~~Moving browser data onto the server~~ **done** 5 Nov: in mock mode `/admin/server` downloads this browser's data as a file; in LAN mode the same page imports it (`POST /api/admin/import`).
6. ~~Preview expiry~~ **done differently**: the studio screen says archiving deletes previews at once, so the server now deletes the event's preview files when it is archived (`server/src/app.ts`, test in `server/test/server.test.ts`). No 45-day job. Still open: the per-order picker version (`useProofingVersion` is still per browser).

Written for the model that will build it. **Nothing here has started; start a phase only when the user names it.**
Checks, as everywhere in this repo: typecheck, vitest, build. Never screenshot or load the site.

Goal: the whole site runs for real (accounts, enquiries, orders, photographer studios, gallery upload,
customers choosing photos **live**) for every phone and laptop on **one Wi-Fi network**, served from one
machine in the studio. No cloud, no SMS provider, no internet needed by the server. Later the same server
moves to the VPS + Backblaze B2 of `docs/album-selection-plan.md` S3 by swapping two adapters
(storage, OTP), not by rewriting.

Read before starting: `plan.txt` §6, §9, §10, §12 (original DB/API sketch, reused here),
`docs/album-selection-plan.md` (S1–S4), `docs/photographer-saas-plan.md` §1 (current SaaS data model).

---

## 0. Ownership and coordination (read first)

Other chats are editing the frontend right now. Agreed on 5 Nov 2026:

| Area | Owner | Rule for this plan |
|---|---|---|
| `server/**` (new) | **this plan** | free, build here |
| `src/api/**` (new) | **this plan** | free, the frontend swap layer |
| `vite.config.ts` (one `server.proxy` block) | unowned | one small edit, re-read before editing |
| `src/saas/**`, `src/lib/store.ts` | chat 21 (photographer SaaS) | **do not edit** until `docs/photographer-saas-plan.md` Phases 3–8 are marked done; then wire in Phase L8 |
| `src/pages/admin/photographers/**`, `AdminLayout.tsx`, `Overview.tsx`, `OrderDetail.tsx` | chat 21 | same |
| `src/lib/poses.ts`, `components/poses.tsx`, Poses pages, and the pose actions in `src/lib/store.ts` (`PosePlan`, `sendPoses`, `ratePose`, `submitPoses`, `reopenPoses`) | chat ba | read-only for us; L8 asks ba before wiring the pose actions |
| `Landing.tsx`, `services.ts`, `ServicePage.tsx` | chat 93 | not needed |
| `src/components/ui.tsx`, `src/pages/book/Venue.tsx`, `src/lib/muhurtham.ts` | chat 1e | not needed |

So phases **L0–L7 touch only `server/`, `src/api/` and the proxy line**, and can run now in parallel
with the other chats. L8 (wiring the stores) waits for chat 21. Before L8, send chat 21 a message and
re-read the then-current `src/saas/types.ts`, `src/saas/os/types.ts` and `src/lib/store.ts`.

---

## 1. How it runs on the Wi-Fi

```
 phones / laptops on studio Wi-Fi
        │  http://ttc.local:8080   (or http://192.168.1.50:8080, printed as a QR at boot)
        ▼
 ┌──────────────── host machine (studio Mac, always on) ────────────────┐
 │  Node 22 · Fastify  (one process, one port)                           │
 │   ├─ /            built site (dist/), SPA fallback to index.html      │
 │   ├─ /api/*       JSON API, cookie sessions                           │
 │   ├─ /api/live    Server-Sent Events (live gallery, orders, leads)    │
 │   └─ /media/*     photos from disk via short-lived signed links       │
 │  server/data/ttc.db         SQLite (one file)                          │
 │  server/data/media/         previews + thumbs + logos + voice notes   │
 │  server/data/backups/       nightly copy → external drive             │
 └───────────────────────────────────────────────────────────────────────┘
```

Decisions (taken unless the user says otherwise):
0. **No Docker** (user, 5 Nov 2026). Plain Node process on the user's **laptop**, started with `pnpm lan:start`.
   This is a working demo for now; customers choosing from home comes with the VPS phase (L10).
1. **One process, one origin.** Fastify serves the built frontend and the API on port 8080, so there is
   no CORS and cookies just work. In development, Vite (port 8443, already bound to `0.0.0.0`) proxies
   `/api`, `/media` to the server on 8787.
2. **SQLite** (`better-sqlite3`) with **Drizzle ORM** and Drizzle migrations. One file, trivial backup,
   plenty fast for one studio plus a few hundred photographer customers. Drizzle also targets Postgres, so
   the VPS move can keep SQLite or switch with a dialect change.
3. **Local disk storage** behind a `Storage` interface (`put`, `get stream`, `delete`, `signedUrl`).
   `LocalStorage` now; `B2Storage` (S3 presigned PUT/GET) later. Originals never upload: the browser
   already makes the 2048 px watermarked preview and 400 px thumb (`src/saas/upload.ts` `prepareFile`),
   about 340 MB per event, so a 500 GB disk holds roughly 1,400 events.
4. **Live updates via SSE**, not WebSockets: one `GET /api/live` stream per tab, topic-filtered, works over
   plain HTTP and through the Vite proxy, auto-reconnects with `Last-Event-ID`. Client falls back to a
   15 s poll if the stream drops.
5. **LAN-only guard.** A Fastify `onRequest` hook rejects any remote address outside `127.0.0.0/8`,
   `10/8`, `172.16/12`, `192.168/16`, `fd00::/8`, `::1`. So even an accidental router port-forward exposes
   nothing. Turned off by `LAN_ONLY=false` on the VPS.
6. **No SMS/WhatsApp provider needed.** Logins use passwords and PINs (section 4). WhatsApp messages stay
   as today: the server records them in the outbox and the admin taps a `wa.me` link from their own phone.
   An `OtpProvider` interface exists so the VPS phase can add real OTP.
7. **Mock mode stays.** `VITE_BACKEND` unset → the stores behave exactly as today (localStorage), so the
   Figma Make preview keeps working. `VITE_BACKEND=lan` → stores talk to `/api`.

### Plain-HTTP limits on the LAN (important)
Browsers treat `http://192.168.x.x` as **not secure**, and these APIs are then missing. Only
`http://localhost` on the host machine itself counts as secure.

| API | Used in the repo for | On LAN phones over HTTP | Plan |
|---|---|---|---|
| `navigator.clipboard` (8 files) | copy link, copy for Lightroom | missing | L7 adds `src/api/clipboard.ts` with a `textarea + execCommand('copy')` fallback; L8 swaps the calls |
| `crypto.randomUUID` (2 files) | ids | missing | ids come from the server in LAN mode; L7 adds an `uid()` fallback |
| `getUserMedia` (2 files) | booking voice note | missing | hide the mic button when `!window.isSecureContext`; works on the host and after L9b |
| `showDirectoryPicker` (1 file) | drive scanning | missing (Chrome desktop only anyway) | scan drives **on the host machine** at `http://localhost:8080`, which is secure |
| `crypto.subtle` (1 file) | drive file fingerprint | missing | same as above (host only) |
| `navigator.share`, geolocation | share sheet, "use my location" | missing | already optional; hide when unavailable |

**L9b (optional) makes it all work everywhere:** local HTTPS with `mkcert`. A one-time CA install on each
studio device (iPhone: profile + trust in Settings; Android: user CA, which Chrome honours; Mac/Windows:
double-click). Customers' own phones would see a warning, so keep HTTP as the default and use HTTPS for staff
devices only if the voice note or clipboard matter on phones.

---

## 2. Repository layout

```
server/
  package.json          own deps, NOT in the root package.json (native better-sqlite3 must not
                        break the Figma Make install). Not a pnpm workspace.
  tsconfig.json         extends ../tsconfig.json, includes ../src/lib for shared pure modules
  drizzle.config.ts
  src/
    index.ts            boot: config → migrate → app.listen(0.0.0.0) → print URL + QR
    app.ts              buildApp(config) → Fastify instance (used by tests via app.inject)
    config.ts           env: PORT, DATA_DIR, LAN_ONLY, SECRET, BACKEND_MODE, ADMIN_BOOTSTRAP_*
    lan.ts              private-IP guard, LAN address discovery, QR print (qrcode is already a root dep)
    db/
      schema.ts         Drizzle tables (section 3)
      client.ts         better-sqlite3, WAL mode, foreign_keys=ON
      migrations/       generated by drizzle-kit
      seed.ts           imports the current demo data (section 7)
    auth/
      password.ts       node:crypto scrypt hash/verify (no native argon2)
      session.ts        opaque token, sessions table, httpOnly cookie, sliding 30-day expiry
      guards.ts         requireRole('admin'|'staff'|'studio'|'customer'), scope helpers
      otp.ts            OtpProvider interface; LanOtp (code shown in admin outbox); WhatsAppOtp later
    storage/
      storage.ts        interface Storage
      local.ts          files under DATA_DIR/media/<tenant>/<event>/<proof>.{jpg,thumb.jpg}
      sign.ts           HMAC signed URLs: /media/<key>?exp=<unix>&sig=<hmac>, 15 min
    live/
      hub.ts            in-memory pub/sub, topic → Set<reply>; ring buffer of the last 500 events for replay
      sse.ts            GET /api/live handler, heartbeat every 20 s
    domain/             pure logic with tests: quote.ts (calls src/lib/pricing.ts), lightroom.ts
                        (calls src/saas/lightroom.ts), status.ts (allowed order transitions)
    routes/             one file per area, each exports a Fastify plugin (section 5)
    jobs/
      scheduler.ts      setInterval-based, no cron dep
      backup.ts         nightly `VACUUM INTO` + media rsync to BACKUP_DIR
      expiry.ts         previews of archived events deleted after 45 days
  test/                 vitest, in-memory SQLite, app.inject
  data/                 .gitignored: ttc.db, media/, backups/
src/api/                frontend swap layer (L7)
  client.ts             fetch wrapper: base '/api', credentials 'include', JSON, ApiError, 401 → logout
  mode.ts               export const BACKEND = import.meta.env.VITE_BACKEND === 'lan' ? 'lan' : 'mock'
  live.ts               useLive(topics, onEvent): EventSource + reconnect + poll fallback
  clipboard.ts, uid.ts  secure-context fallbacks
  ttc.ts, studio.ts, gallery.ts, drives.ts, auth.ts   typed endpoint functions
docs/lan-setup.md       runbook for the studio (L9)
```

Scripts in root `package.json` (one small edit, L0): `server:dev` (`pnpm -C server dev`, tsx watch),
`lan:start` (`vite build && pnpm -C server start`, served on 8080).

Shared code: the server imports **pure** modules from `src/lib` (pricing, catalogue, data, geo) and
`src/saas` (lightroom, money, usage) so quotes, money and Lightroom strings have one implementation.
L3 must first check that their import graph reaches no React, DOM or `images.ts`; if one does, move the
pure part into a new file next to it (tell the owner chat) rather than duplicating maths.

---

## 3. Data model (SQLite via Drizzle)

Principle: **normalise what is queried, scoped or joined; keep nested UI shapes as JSON columns.** The
frontend types are still changing (chat 21), so JSON columns absorb that churn without migrations.
All money is integer rupees, as in the frontend. Timestamps are ISO strings. Ids keep today's formats
(`TTC-2026-0142`, 8-char share codes) so links and seed data stay valid.

### Identity
```
account      id, kind: admin|staff|studio_owner|customer, name, phone (E.164, unique per kind),
             email?, password_hash?, pin_hash?, lang en|ta, disabled, created_at, last_login_at
session      token_hash (pk), account_id, role, scope_json ({orderId} | {studioId} | {projectCode}),
             view_as_studio_id?, created_at, expires_at, user_agent, ip
audit        id, account_id?, action, target, meta_json, at        -- every admin write
```

### TTC (our own customers): mirrors `src/lib/store.ts`
```
lead         id, name, contact, source, lang?, order_id?, at
order        id (TTC-YYYY-NNNN), customer_account_id, status (OrderStatus), source web|showroom,
             district, event_type, date, time, date_certainty, venue_json, distance_km,
             cart_json, adjustments_json, quote_json (server-computed snapshot), invoice_json,
             quote_history_json, notes, voice_note_key?, customer_id, invoice_id,
             album_json?, review_json?, poses_json?, delivery_json?, cover_json?,
             theme?, religion?, features_json?, gallery_event_id? (L8 / S4: TTC is tenant one),
             created_at, updated_at
order_status id, order_id, status, by_account_id?, at              -- history[]
payment      id, order_id, amount, mode, note, at
worker       id, name_en, name_ta, phone, role, district, freelance, available
assignment   order_id, worker_id, at   (pk both)
outbox       id, audience, to_phone, to_name, template, body, order_id?, studio_id?, at, opened_at?
cms          key (pk), value_json, updated_at                     -- banner, heroSlides, studio, catalogue, bank, images
```

### Photographer SaaS: mirrors `docs/photographer-saas-plan.md` §1
```
studio       id, slug, owner_account_id, profile_json (name, logo_key, accent, watermark, whatsapp, lang…),
             sub_json (plan, payment, startedAt, endsAt), picker_version, feature_defaults_json,
             portal_banner, os_settings_json, created_at
studio_term  id, studio_id, plan, amount, from, to, paid_at, mode, note
plan         key m1|m6|m12, name, months, price_per_month       -- admin-editable
project      id, studio_id, code (unique, 8 chars), pin_hash, client_json, status, stage,
             theme?, religion?, features_json, picker_override?, gallery_event_id,
             body_json (events, quote, milestones, deliverables, contract, moodboard, docs, poses),
             created_at, updated_at
project_payment id, project_id, amount, mode, note, at
client_request  id, project_id, text, status, at
```

### Gallery engine: shared by TTC orders and studio projects
```
gallery_event id, tenant ('ttc' | studio_id), code (unique), pin_hash?, title, date, client_names,
             quota, deadline, status draft|uploading|open|submitted|closed|archived,
             chapters_json, cover_proof_id?, created_at, submitted_at?, reopened_at?
proof        id, event_id, chapter, filename (no ext), ext, serial?, taken_at?, w, h, bytes,
             preview_key, thumb_key, sort, created_at        -- unique(event_id, filename, serial)
pick         event_id, proof_id, by?, note?, at   (pk event_id+proof_id)   -- last write wins
activity     id, event_id, kind, meta_json, at
```

### Drives (storage manager)
```
drive        id, studio_id, label, marker_id (unique), capacity, used, kept, notes, status, last_scan_at, file_count
asset        id, drive_id, path, filename, ext, kind, bytes, modified_at, taken_at?, camera?, lens?, w?, h?,
             duration_sec?, codec?, fingerprint, event_id?       -- index(filename), index(fingerprint)
scan         id, drive_id, at, added, removed, changed, duration_sec
```

Every studio-scoped table is read through one helper `scoped(table, session)` that adds
`where studio_id = session.studioId`; a test asserts every studio route uses it (section 8).

---

## 4. Accounts and login (no SMS on the LAN)

| Who | Created by | Logs in with | Session scope |
|---|---|---|---|
| **TTC admin** | bootstrap on first boot from `ADMIN_BOOTSTRAP_NAME/PASSWORD` in `server/.env`; then admin creates more | name + password at `/login` admin tab (replaces today's PIN 2026) | everything |
| **TTC staff** (optional) | admin, `/admin/team` | phone + password | orders assigned to them, read-only billing |
| **TTC customer** | automatically when an **enquiry** is submitted (`POST /api/enquiries`), or by admin in Showroom | phone + **one-time code** (decided 5 Nov 2026). `POST /auth/otp/request` makes a 6-digit code valid 5 min; `LanOtp` shows it on a live **"Login codes"** card in admin (and in the server console) for staff to read out. Phone + PIN comes later as a second provider | their own orders only (one phone can have several orders; picker if >1) |
| **Photographer (studio owner)** | self sign-up at `/studio/login` (logo + plan required, per v2 plan) | phone + password set at sign-up | own studio; **blocked** unless `deriveStatus()==='active'` (admin marks Paid) |
| **Photographer's customer** | studio creates a project → code + PIN | the link `/gallery/:code`, `/poses/:code`, `/p/:code` + PIN | that one project (and its gallery event) |
| **Admin "view as studio"** | admin button in Studio detail | existing admin session | `view_as_studio_id` set, writes are audited, banner shown |

Rules: passwords ≥ 8 chars, scrypt. PIN and password attempts rate-limited per phone/code and per IP
(5 per 10 min, then 15 min lock). Cookie `ttc_sid`, `HttpOnly`, `SameSite=Lax`, `Secure` only when HTTPS.
`OtpProvider` is wired but unused on the LAN; the VPS phase turns on WhatsApp OTP for customers.

---

## 5. API

Prefix `/api`. JSON in and out, validated with **zod** (shared schemas in `server/src/schemas/`).
Errors `{ error: code, message }`. Each line names the store action it replaces so L8 is mechanical.

### Auth and accounts
```
POST /auth/admin/login {name,password}            loginAdmin
POST /auth/customer/login {phone,pin}             loginClient
POST /auth/studio/signup {…, logo (multipart)}    signupStudio
POST /auth/studio/login {phone,password}
POST /auth/project/:code {pin}                    client Gate / useClientSession
POST /auth/logout                                 logout
GET  /me                                          session + profile (hydrates the store on load)
POST /admin/accounts · PATCH /admin/accounts/:id  staff accounts, disable, reset password
```

### TTC public and customer
```
POST /leads                                       captureLead
POST /quote/preview {draft}  → Quote              (server runs src/lib/pricing.ts; UI keeps local preview too)
POST /enquiries {draft, voiceNote?}  → {orderId, pin}   submitEnquiry (creates account + order + lead link)
GET  /me/orders · GET /me/orders/:id              useMyOrder
PUT  /me/orders/:id/selection {ids}               toggleSelection (debounced) ; POST …/selection/submit  submitSelection
PUT  /me/orders/:id/album {spec}                  saveAlbum
POST /me/orders/:id/review                        submitReview
PUT  /me/orders/:id/poses/:poseId {verdict}       ratePose ; POST …/poses/submit  submitPoses
GET  /cms                                         public CMS (banner, hero, studio, catalogue prices, gst)
```

### TTC admin
```
GET  /admin/orders?status&district&q · GET /admin/orders/:id
PATCH /admin/orders/:id                           updateOrderCart, setInvoiceMeta, setDelivery, setGalleryCover, theme/religion/features
POST /admin/orders/:id/status {status}            setStatus (validates the §6 pipeline), writes outbox message
POST /admin/orders/:id/payments · DELETE /admin/payments/:id      logPayment, removePayment
POST /admin/orders/:id/adjustments · DELETE …/:adjId              addAdjustment, removeAdjustment
POST /admin/orders/:id/invoice/send               sendInvoice
POST /admin/orders/:id/poses {ids,faiths} · …/poses/reopen        sendPoses, reopenPoses
POST /admin/orders/:id/assign {workerId} · DELETE …/assign/:wid   assignWorker, unassignWorker
POST /admin/showroom {draft}                      saveShowroomQuote
GET/PUT/DELETE /admin/workers[/:id]               upsertWorker, removeWorker
GET  /admin/leads · GET /admin/outbox · POST /admin/outbox        sendMessage
PUT  /admin/cms {patch} · PUT /admin/catalogue/:id {price}        updateCms, setCataloguePrice
POST /admin/media (multipart)  → {key, url}       CMS photo uploads (replaces "add by URL")
```

### Photographer studio
```
GET/PATCH /studio/me                              profile, onboarding, settings, feature defaults
GET  /studio/plans · POST /studio/plan {plan}     changePlan
GET/POST /studio/projects · GET/PATCH/DELETE /studio/projects/:id   (create also creates its gallery_event)
POST /studio/projects/:id/payments · /requests · /stage · /poses …   project editor tabs
GET  /studio/events/:id · PATCH (quota, deadline, chapters, pin, status: reopen/close/archive)
GET  /studio/events/:id/export?format=lightroom|txt|csv
```

### Gallery upload and live choosing (the core flow)
```
POST /studio/events/:id/proofs   multipart: meta (filename, ext, serial, takenAt, w, h, chapter) + preview + thumb
                                 → Proof (with signed urls). Duplicate (filename+serial) → 409 with the existing proof.
                                 Replaces sendPreview() in src/saas/upload.ts; the IndexedDB upload queue stays as the retry layer.
DELETE /studio/events/:id/proofs/:proofId
GET  /g/:code                    gate info (studio brand, title, needs PIN): public
GET  /g/:code/proofs?after=      proofs + signed urls (15 min), paged by 200; session from /auth/project/:code
PUT  /g/:code/picks/:proofId {on, by?, note?}     idempotent; server stamps `at`; last write wins
POST /g/:code/submit             locks picks, event → submitted, project stage → selection_received, outbox to studio
GET  /media/:key?exp&sig         streams the file; Cache-Control private, max-age=600; 403 when expired
```

### Live (SSE)
```
GET /api/live?topics=event:<id>,order:<id>,studio:<id>,admin
```
The server checks each topic against the session (a customer may only join their event/order; studio only
its own; `admin` only admins). Events published by the routes above:

| Event | Topic | Who sees it |
|---|---|---|
| `proof.added` / `proof.removed` `{proof}` | `event:<id>` | customer gallery grows **while the photographer is uploading** |
| `pick.changed` `{proofId, on, by, at}` | `event:<id>` | photographer's Selection tab ticks live; a second family member's phone stays in sync |
| `event.updated` `{status, quota, deadline}` | `event:<id>` | gallery locks on submit / reopens |
| `order.updated` `{id, status, …}` | `order:<id>`, `admin` | customer dashboard progress, admin lists |
| `lead.created`, `enquiry.created` | `admin` | admin badge counts |
| `studio.updated` `{payment}` | `studio:<id>`, `admin` | photographer's waiting screen opens the moment admin marks Paid |

Proof URLs inside live events are signed at publish time per subscriber.

### Drives
```
GET/POST /studio/drives · PATCH /studio/drives/:id
POST /studio/drives/:id/scans {added[], removed[], changed[]} (batches of 500)
GET  /studio/assets?q&kind&from&to&camera · GET /studio/events/:id/locate
```

### Photographer admin (TTC side)
```
GET /admin/studios · GET/PATCH /admin/studios/:id (controls, picker, features, settings override)
POST /admin/studios/:id/payment {status: paid|pending|revoked, mode, note}   markPaid, markPending, revokePaid
POST /admin/studios/:id/view-as · DELETE /admin/view-as
GET/PUT /admin/plans · GET /admin/studios/:id/projects · PATCH /admin/projects/:code
```

---

## 6. Frontend swap (how the stores change in L8)

Keep every store's **action signatures** so no screen changes. In `lan` mode:
1. On app load, `GET /me` → hydrate the session; each area fetches its slice (`/admin/orders`,
   `/studio/projects`, `/g/:code/proofs`…) into the existing Zustand state.
2. Actions do the same optimistic local update they do today, then call the API; on error they roll back
   and show the existing toast. Ids come back from the server.
3. `persist` keeps only device-local slices (`lang`, `draft`, `moodboard`, `leadPromptDone`); server-owned
   slices (orders, leads, workers, outbox, cms, studios, projects, events, proofs, picks) are no longer
   persisted, so devices can't drift.
4. `useLive(topics)` patches the store from SSE events.
5. `src/saas/blobs.ts` `previews` store is skipped in `lan` mode (images come from `/media`); the `uploads`
   queue stays (it is the resume-after-reload layer).
6. `mock` mode is untouched: `if (BACKEND === 'mock') return` guards each call.

---

## 7. Seed and migration
- `pnpm -C server seed` loads the demo data that exists today: the 8 TTC orders, workers, CMS defaults
  (from `src/lib/store.ts` seed functions; import them, don't copy) and the SaaS demo studios/projects/events
  (`st_lens`, `/s/demo4821` PIN 2026, `/p/divya2rk` PIN 4821). Demo logins keep working, now with
  passwords/PINs printed by the seed.
- `pnpm -C server seed --empty` = production start: only the bootstrap admin, plans and CMS defaults.
- **Importer for existing browser data**: admin page action "Import from this browser" posts the current
  `ttc-store-v2` / `ttc-studio-v2` / `ttc-studio-os-v2` localStorage blobs to `POST /admin/import`, so
  anything entered during the mock period is not lost. Ids preserved; duplicates skipped.

---

## 8. Tests (vitest, no browser)
- `server/test/*.test.ts` with `buildApp({ db: ':memory:' })` + `app.inject`.
- Auth: password and PIN verify, lockout after 5 tries, cookie flags, role guards (customer cannot read another order; studio A cannot read studio B; project PIN only opens its own event).
- **Isolation test**: walk every registered route under `/api/studio/*`, call it as studio A with studio B's ids → 404/403.
- Orders: enquiry creates account + order + PIN; server quote equals `src/lib/pricing.ts` for the seed drafts; status transitions follow plan.txt §6; client submit moves SELECT_PHOTOS → ALBUM_CUSTOMIZATION.
- Gallery: upload → `proof.added` published; duplicate 409; picks last-write-wins; submit locks; Lightroom export string matches `src/saas/lightroom.ts`.
- Media: signed URL expires; tampered sig → 403; path traversal in key rejected.
- LAN guard: public IP → 403, private IPs pass.
- SSE: subscriber receives only authorised topics; `Last-Event-ID` replay.
- Frontend: `src/api/*.test.ts` for the client wrapper and the clipboard/uid fallbacks.

---

## 9. Phases (each ends green on server tests + root typecheck/test/build)

| Phase | What | Touches | Can start |
|---|---|---|---|
| **L0** | Server skeleton: `server/` package, Fastify, config, LAN guard, health `/api/health`, static `dist/` + SPA fallback, boot QR, `server:dev` / `lan:start` scripts, Vite proxy block | `server/**`, root `package.json` scripts, `vite.config.ts` proxy | now |
| **L1** | Drizzle schema, migrations, `scoped()` helper, seed (demo + empty) | `server/**` | after L0 |
| **L2** | Accounts, sessions, guards, rate limits, audit, bootstrap admin | `server/**` | after L1 |
| **L3** | TTC: leads, enquiries (server quote), customer endpoints, admin orders/payments/status/workers/outbox/CMS/showroom | `server/**` | after L2 |
| **L4** | Studio SaaS: sign-up, plans, payment gate, projects, events, admin studios/view-as | `server/**` | after L2 (parallel with L3) |
| **L5** | Media + gallery engine: storage adapter, signed URLs, proof upload, gate, picks, submit, export, **SSE hub** + all live events | `server/**` | after L4 |
| **L6** | Drives catalogue endpoints | `server/**` | after L4 |
| **L7** | `src/api/**`: client, mode switch, `useLive`, typed endpoints, clipboard/uid fallbacks, tests | `src/api/**` | after L3 (needs real shapes) |
| **L8** | Wire stores in `lan` mode (section 6): `src/lib/store.ts`, `src/saas/store.ts`, `src/saas/os/store.ts`, `upload.ts sendPreview`, `blobs.ts`, Login screens, secure-context swaps; TTC orders get a gallery event (S4) so `/dashboard/photos` uses real uploads | files owned by chat 21 | **only after** chat 21's Phases 3–8 are done and they agree |
| **L9** | Ops: `docs/lan-setup.md` runbook, launchd autostart, nightly backup job, `--empty` production start, a load test (20 phones picking at once on one event) | `server/**`, `docs/` | after L5 |
| **L9b** | Optional local HTTPS (mkcert) for staff devices | `server/**`, `docs/` | on request |
| **L10** | VPS move: `B2Storage`, WhatsApp OTP, `LAN_ONLY=false`, Caddy TLS, Postgres if wanted (`album-selection-plan.md` S3) | `server/**` | later |

L3 and L4 can run as two parallel agents; L6 alongside L5.

### L9 runbook outline (`docs/lan-setup.md`)
1. Host: the studio Mac (or any always-on PC with ≥ 500 GB free). Install Node 22 + pnpm via `.mise.toml`.
2. Router: give the host a **DHCP reservation** (fixed IP, e.g. 192.168.1.50). Set the Mac's local name to
   `ttc` (`sudo scutil --set LocalHostName ttc`) → `http://ttc.local:8080` works on iPhones and Macs;
   Android and Windows use the IP or the QR code.
3. macOS: allow incoming connections for `node` in the firewall; `sudo pmset -c sleep 0` (no sleep on
   power); install the launchd plist (`server/ops/com.ttc.server.plist`) so the server starts at login and
   restarts on crash.
4. `cp server/.env.example server/.env`, set `SECRET` and the admin bootstrap password, `pnpm lan:start`.
5. Print the boot QR and stick it at the front desk; staff open it once and "Add to Home Screen".
6. Backups: plug an external drive, set `BACKUP_DIR`; nightly at 02:00 the job keeps 14 daily copies.
   Restore = stop server, copy `ttc.db` + `media/` back, start.
7. Wi-Fi notes: guest-network "client isolation" must be **off** on the network customers join, or phones
   can't reach the host. Use the 5 GHz band near the selection area; 20 phones loading 400 px thumbs is
   ~15 MB each, fine for any modern router.

---

## 10. Dependencies (server/package.json only)
`fastify`, `@fastify/static`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/rate-limit`,
`better-sqlite3`, `drizzle-orm`, `zod`, `qrcode` · dev: `drizzle-kit`, `tsx`, `vitest`, `@types/better-sqlite3`.
Pin exact versions. No auth library, no ORM-generated client binaries, no cron.

---

## 11. Answered 5 Nov 2026
- Host: the user's laptop (plenty of free disk). No Docker. No launchd autostart needed for the demo; L9 runbook
  covers `caffeinate -i pnpm lan:start` while demoing, and the boot QR because the laptop's IP changes per network.
- Customer login: staff read out a one-time code from the admin screen (`LanOtp`); phone + PIN later.
- Plain HTTP with the section 1 fallbacks; L9b HTTPS not planned.
- Customers will choose from home eventually → L10 (VPS). For now this is a LAN demo.
- Add `POST /auth/otp/request {phone}` · `POST /auth/otp/verify {phone, code}` to section 5 (replaces `POST /auth/customer/login`),
  and an `otp.issued` SSE event on the `admin` topic for the Login codes card.

## Original questions (kept for reference)
1. **Host machine**: the studio Mac that stays on? Roughly how much free disk?
2. **Customer login on the LAN**: phone + 4-digit PIN shown after the enquiry and re-sendable by admin
   (default), or an OTP that appears on the admin screen for staff to read out?
3. **Voice notes and copy buttons on phones** need HTTPS (section 1). Start with plain HTTP and fallbacks
   (default), or set up local HTTPS for staff devices now (L9b)?
4. Should customers' phones use the **studio Wi-Fi** to choose photos at the studio, or do they also need to
   choose from home? (Home use needs the VPS phase L10; LAN-only can't reach them.)
