# Photographer SaaS v2 — plan for execution

Written 5 Nov 2026 for the model that will build this. Frontend-only (Zustand persist + IndexedDB), same as everything else. Checks are `npx -y pnpm@12.14.0 typecheck`, `... test`, `... build`. Never screenshot or load the site.

Read `docs/album-selection-plan.md` first for what v1 built (S1, S2, S2b, S2c, Studio OS, portal). This plan **changes** v1; it does not restart it.

Owned files: `src/saas/**`, `src/pages/admin/photographers/**`, `src/pages/admin/AdminLayout.tsx`, `src/pages/admin/Overview.tsx`, `src/pages/dashboard/**`, `src/lib/store.ts`, plus the new routes in `src/App.tsx`. One small mount in `src/pages/admin/OrderDetail.tsx` (Phase 7) is also needed; it is not on the forbidden list. **Do not touch** `src/pages/Home.tsx`, `Services.tsx`, `src/lib/landing.ts`, `Nav.tsx`, `Footer.tsx`, `src/pages/admin/Cms.tsx`. Re-read `App.tsx` right before each edit to it; another chat edits that file too. Keep every edit small.

---

## 0. What exists vs. what is missing

| Feature (from the brief) | Exists today | Missing |
|---|---|---|
| Photographer signup + OTP login | `src/saas/studio/StudioLogin.tsx` (phone → OTP → signup form: name, owner, city, email). `Onboarding.tsx` asks logo/accent/watermark after signup. | Logo **required at signup**; plan choice at signup. |
| Admin-gated login | `StudioLayout.tsx:129` blocks `pending`/`cancelled` studios with a waiting screen. Admin approves/declines/pauses in `admin/photographers/Approvals.tsx`, `StudioDetail.tsx`. | A **payment status** (Pending / Paid / Revoked) that is the real gate, with the thumbs-up control, and the status shown to the photographer. |
| Plans | `DEFAULT_PLANS` = 4 tiers by clients/month at ₹786 (`src/saas/store.ts:37`); monthly statements in `src/saas/usage.ts`. | **Replace** with 1 / 6 / 12-month terms at ₹1300 / ₹999 / ₹899 per month, totals shown; term-based billing. |
| Photographer dashboard | `/studio/*` Studio OS: Dashboard, Enquiries, Projects (9-tab editor), Post Production (galleries), Data (drives), Team, Finances, Client Requests, Subscription, Profile, Settings, How. | **Remove** Enquiries, Team, Finances, Client Requests pages. Add per-customer **theme, religion, feature toggles, work stage**. |
| RAW → JPEG upload | `src/saas/upload.ts` + `studio/tabs/UploadTab.tsx` inside `/studio/events/:id`. Works, tested. | Must live **inside the project** (create project → upload there → copy link). |
| Gallery selector for customers | `/s/:code` (`src/saas/client/ClientGallery.tsx`), picks persist in `useStudioStore.picks` (localStorage) so leaving and returning works. Has a "table" toggle = swipe light table. | New route **`/gallery/:orderId`** keyed by project code; swipe mode hidden unless admin allows; submit → project stage advances. |
| Pose chooser | TTC-only: `src/lib/poses.ts` (POSES, `posesFor(event, faiths)`, Faith = hindu/christian/muslim), `src/pages/dashboard/Poses.tsx` (customer yes/no picker), `src/pages/admin/PosesPanel.tsx` (admin picks faiths + sends). | White-labelled **`/poses/:orderId`** for photographer customers; "Poses" step in the project editor; religion drives the set. |
| White-label | Client gallery and portal use studio accent, name, logo; `document.title` = event · studio. | Remove **"Powered by Treasure Capture Studio"** from the gate (`client/ui.tsx:155`); dynamic **favicon + meta** on customer routes; audit share text. |
| Master admin two areas | `AdminLayout.tsx` already has nav groups "Events" and "Photographers"; Overview has studio tiles. | Rename to **"Manage customers"** / **"Manage photography clients"**; add payment control, picker version, feature toggles, per-customer overrides, studio settings override. Theme/religion/toggles on **our own** orders too. |
| Data isolation | Everything is filtered by `studioId`. | A test that asserts it; nothing else. |

---

## 1. Data model changes

### `src/saas/types.ts`

```ts
export type PlanKey = 'm1' | 'm6' | 'm12'
export interface Plan {
  key: PlanKey
  name: string            // '1 month' | '6 months' | '12 months'
  months: 1 | 6 | 12
  pricePerMonth: number   // 1300 | 999 | 899  (confirmed by the client, not ₹786)
}
export const planTotal = (p: Plan) => p.pricePerMonth * p.months   // 1300 / 5994 / 10788

export type PaymentStatus = 'pending' | 'paid' | 'revoked'
export interface Subscription {
  plan: PlanKey
  payment: PaymentStatus
  /** Set when admin marks Paid. endsAt = startedAt + plan.months. */
  startedAt?: string
  endsAt?: string
  /** Who flipped it last and when, for the admin log. */
  changedAt: string
}
export type PickerVersion = 'normal' | 'swipe'
export interface FeatureFlags { gallery: boolean; poses: boolean; invite: boolean; portal: boolean }

// Studio: add
  sub: Subscription
  pickerVersion: PickerVersion        // admin-only; default 'normal'
  featureDefaults: FeatureFlags       // applied to new customers; admin can edit
  portalBanner: boolean               // "Sign up as a photographer" banner on the portal; default false (brief says no TTC copy on customer pages)
// Studio: logoUrl becomes required (string, data URL ≤ 256 px)
// Studio: drop clientsPerMonth quota logic (plans no longer cap customers); keep defaultQuota (photos per gallery)
```

Keep `status: StudioStatus` but derive it: `pending` until Paid, `active` while Paid and not expired, `paused` when Revoked or expired, `cancelled` on decline. Write `deriveStatus(studio, now)` in `usage.ts` and use it everywhere `status` is read; stop writing `status` by hand except for `cancelled`.

Remove `planHistory`, `StudioPayment.period`, `clientsPerMonth`. Replace `StudioPayment` with a term record:

```ts
export interface StudioTerm { id: string; studioId: string; plan: PlanKey; amount: number; from: string; to: string; paidAt: string; mode: 'upi' | 'cash' | 'bank'; note: string }
```

### `src/saas/os/types.ts` (Project)

```ts
import type { Faith } from '../../lib/poses'
export type WorkStage = 'booked' | 'shoot_done' | 'culling' | 'selection_sent' | 'selection_received' | 'editing' | 'album_design' | 'delivered'
export const WORK_STAGES: WorkStage[] = [...in that order]
export interface PosePlan { faiths: Faith[]; eventKey: EventKey; ids: string[]; sentAt?: string; picks: Record<string, 'yes' | 'no'>; submittedAt?: string }

// Project: add
  theme: string                  // free text, e.g. "Chettinad traditional", shown to the customer on the portal/gallery headers
  religion?: Faith               // drives posesFor() and the invite theme list
  features: FeatureFlags         // copied from studio.featureDefaults at creation; admin and studio can toggle
  pickerOverride?: PickerVersion // admin-only; undefined = use studio.pickerVersion
  stage: WorkStage               // starts 'booked'
  poses?: PosePlan
// Project: galleryEventId becomes required (created with the project, see Phase 3)
// Project: remove crewIds and ProjectEvent.crewIds (Team is gone)
```

Remove `TeamMember`, `Enquiry`, `ClientRequest` types **only after** their screens are gone (Phase 2). Keep `ClientRequest` if the portal Deliverables "New request" stays (it does; requests are read inside the project Deliverables tab).

### `src/lib/store.ts` (our own customers)

```ts
// Order: add
  theme?: string
  religion?: Faith          // when set, PosesPanel defaults poses.faiths to [religion]
  features?: FeatureFlags   // undefined = all on (today's behaviour)
```

Add actions `setOrderTheme(id, theme)`, `setOrderReligion(id, faith)`, `setOrderFeatures(id, patch)`. Dashboard pages (`/dashboard/poses`, `/photos`, `/invite`) hide their nav item and route body when the matching flag is false.

---

## 2. Routes (App.tsx)

| Route | Component | Note |
|---|---|---|
| `/gallery/:orderId` | `src/saas/client/ClientGallery.tsx` | Resolve `orderId` → Project by `code` → `galleryEventId`. Accept a legacy event code too, so `/s/demo4821` keeps working. |
| `/s/:code` | same | keep as alias |
| `/poses/:orderId` | new `src/saas/poses/PoseChooser.tsx` | |
| `/p/:code/*` | portal | unchanged |
| `/studio/enquiries`, `/studio/team`, `/studio/finances`, `/studio/requests` | **delete** | |
| `/studio/events/:id` | `Navigate` to `/studio/projects/:projectId?tab=gallery` (look up the project by `galleryEventId`; if none, fall back to the old page) | |
| `/admin/photographers/:id/customers/:code` | new `CustomerDetail.tsx` | admin edits one photographer's customer |

The public route `/gallery` (TTC's own gallery) and `/gallery/:slug` (stories) already exist inside `SiteLayout`. **Conflict:** `/gallery/:orderId` would shadow `/gallery/:slug`. Resolution: mount the customer gallery at `gallery/:orderId` **outside** SiteLayout and make its loader fall through: if no project or event matches the code, render the existing `Story` page instead (import `Story` lazily and render it). Order codes are 8 lowercase alphanumerics; story slugs are hyphenated words, so collisions are not realistic. Write a unit test for `resolveGalleryCode()`.

---

## 3. Phases (each ends green on typecheck + test + build)

### Phase 1 — Plans, subscription, admin payment gate
Files: `src/saas/types.ts`, `src/saas/store.ts`, `src/saas/usage.ts` (+test), `src/saas/studio/StudioLogin.tsx`, `Onboarding.tsx`, `StudioLayout.tsx`, `Account.tsx`, `Landing.tsx`, `admin/photographers/{Plans,Approvals,StudioDetail,Studios,helpers}.tsx`.

1. Replace `DEFAULT_PLANS` with the three terms. `Plans.tsx` shows per-month price, months and total; editing stays (admin may change prices later).
2. `usage.ts`: delete `billableMonths`, `priceForMonth`, `statements`, `clientsInMonth`, `canOpenGallery` monthly logic. Add `deriveStatus`, `daysLeft(studio, now)`, `termFor(studio, plans, startedAt)` → `{from, to, amount}`, `linksLive` = payment paid and not expired (keep the 7-day grace after expiry). Rewrite `usage.test.ts` for these.
3. Store actions: `markPaid(studioId, mode, note)` (sets `sub.payment='paid'`, `startedAt=now`, `endsAt`, pushes a `StudioTerm`), `markPending(studioId)`, `revokePaid(studioId)`, `changePlan(studioId, plan)` (takes effect at next Paid), keep `declineStudio`, `cancelStudio`, `viewAsStudio`. Delete `approveStudio`, `pauseStudio`, `resumeStudio`, `addStudioPayment`, `removeStudioPayment`, `updatePlan` price history. Seed: st_lens paid 12 months from 2026-10-01; st_kural revoked; st_nila pending.
4. Signup (`StudioLogin.tsx` step `signup`): add **logo** (file input → canvas resize to 256 px → data URL; required; also accept a URL) and a **plan** radio showing the three totals. `signupStudio` sets `sub = {plan, payment:'pending', changedAt}`. Onboarding no longer asks for the logo (it already has one) but still does accent + watermark.
5. `StudioLayout.tsx` gate: allow in only when `deriveStatus()==='active'`. The waiting screen shows: plan chosen, amount due, how to pay (TTC support WhatsApp button with a prefilled message), and the current status pill: *Pending — waiting for payment confirmation* / *Payment revoked* / *Expired on …*. Add "Change plan" link to `/studio/welcome`-style small form.
6. Admin: `Approvals.tsx` lists `payment==='pending'` studios with a 👍 **Paid** button (opens a tiny form: mode, note) and **Decline**. `StudioDetail.tsx` header: status pill + three buttons Pending / Paid / Revoke, term history list, days left. Remove the monthly statement table and `PrintableStatement`; replace with a printable **receipt** per term (same component, different rows).
7. `Account.tsx` (photographer's Subscription page): plan, paid until, days left, term history, "ask to renew" WhatsApp button. Drop the clients-per-month meter.

Tests: `usage.test.ts` (deriveStatus across pending/paid/expired/grace/revoked; term dates for 1/6/12 months incl. month-end rollover; totals 1300/5994/10788).

### Phase 2 — Remove Enquiries, Team, Finances, Client Requests
Files: `src/saas/os/screens/{Enquiries,Team,Finances,Requests}.tsx` (delete), `project/CrewTab.tsx` (delete), `src/saas/portal/sections/Team.tsx` (delete), `StudioLayout.tsx` nav, `Dashboard.tsx`, `Projects.tsx`, `ProjectEditor.tsx`, `progress.ts` (+test), `os/store.ts`, `os/types.ts`, `os/money.ts` (+test), `os/calendar.ts`, `Portal.tsx`, `App.tsx`.

1. Delete the four screens, the Crew tab, the portal Team section and their routes/nav/badges.
2. `PROJECT_TABS` becomes `['overview','schedule','quote','deliverables','payments','contract','moodboard','gallery','poses','calendar']` (gallery/poses are added in Phases 3–4; add them to the type now with `tabDone` returning false until then).
3. Dashboard: remove "New enquiries", "Open requests", "Recent client requests" tiles and `useEnquiries`/`useTeam`. Add tiles: *Galleries awaiting selection*, *Poses awaiting choice*, *Payments overdue* (reuse `financeSummary`).
4. Store: remove enquiry/team slices, `convertEnquiry`, `crewIds` writes, `addTeamMember` etc. Keep `addRequest`/`updateRequest` (portal still files requests; the studio answers them inside the Deliverables tab — add a small "Requests" list at the bottom of `DeliverablesTab.tsx` if it isn't there).
5. `money.ts`: keep everything project-level. Delete only functions used solely by `Finances.tsx` (`collectionsByMonth`, `paymentsInMonth`, `ledger`) **and** their tests.
6. ScheduleTab: remove the crew picker column.

### Phase 3 — Project-centred gallery (RAW upload inside the project, copy link)
Files: `os/store.ts` `createProject`, `os/types.ts`, new `os/screens/project/GalleryTab.tsx`, `studio/tabs/{UploadTab,SelectionTab,ShareTab,SettingsTab,ProgressTab}.tsx` (make them take `eventId` props if they don't already), `client/ClientGallery.tsx`, new `src/saas/links.ts` (+test), `App.tsx`, `portal/sections/Dashboard.tsx`, `PostProduction.tsx`.

1. `createProject` also calls `useStudioStore.getState().createEvent(studioId, {...})` and stores `galleryEventId`. `deleteProject` deletes the event. Migrate seed projects: ev_sharma ↔ divya2rk already linked; create events for the others.
2. `src/saas/links.ts`: `galleryLink(code)`, `posesLink(code)`, `portalLink(code)` → absolute URLs using `window.location.origin` (SSR-safe), `whatsappShare(studio, project, kind)` text in the studio's name only. Test the text contains no "Treasure".
3. `GalleryTab.tsx` = the existing Upload + Selection + Share pieces stacked: dropzone (RAW→JPEG, progress, failures), chapter list, quota and deadline, **Copy gallery link** + WhatsApp button, selection results + Lightroom list + drive locator once submitted. Reuse the tab components; do not rewrite them.
4. `ClientGallery.tsx`: resolve by project code first (Section 2). Hide the gallery/table toggle unless `(project.pickerOverride ?? studio.pickerVersion) === 'swipe'`. Header shows `project.theme` under the title when set. On submit: `submitSelection(eventId)` **and** `setStage(projectId, 'selection_received')`; the done screen says the selection has gone to *{studio.name}* only.
5. `features.gallery === false` → `/gallery/:code` shows a short "not enabled" card in the studio's brand; the Gallery tab in the editor shows a disabled note.
6. `PostProduction.tsx` keeps listing galleries but links into `/studio/projects/:id?tab=gallery`.

Tests: `links.test.ts`; `progress.test.ts` for `tabDone('gallery')` (true when the event is `submitted`/`closed`).

### Phase 4 — Poses for photographer customers
Files: new `src/saas/poses/{PoseChooser.tsx, logic.ts, logic.test.ts}`, new `os/screens/project/PosesTab.tsx`, `os/store.ts` actions `setPosePlan`, `togglePoseSend`, `submitPoses(projectId, picks)`, `App.tsx`.

1. `PosesTab.tsx`: pick event type (`POSE_EVENTS` from `lib/poses`) and religion (`project.religion`, editable here and in Overview). "Fill from library" → `posesFor(eventKey, [religion])` ids. Grid with `PoseImage` and `HowToPose`; remove/reorder; **Send** sets `sentAt` and `stage` stays. **Copy poses link** + WhatsApp. After submit: yes/no summary, printable shot list (reuse the layout idea of `admin/Poses.tsx` `ShotList`, but new code under `src/saas/poses`; do not import TTC admin kit here).
2. `PoseChooser.tsx` at `/poses/:orderId`: PIN gate (reuse `client/Gate.tsx` + `useClientSession`), studio brand, one pose at a time or grid with Yes/No, progress, persist picks to the store as they go (same leave-and-return behaviour as the gallery), **Submit** → `submitPoses`. Tamil + English copy file `src/saas/poses/copy.ts`.
3. `logic.ts`: `poseSetFor(eventKey, religion)`, `poseProgress(plan)`, `shotList(plan)`; tests.
4. `features.poses === false` → not-enabled card, tab disabled note.

### Phase 5 — Work stages and per-customer settings
Files: `os/types.ts`, `os/store.ts` (`setStage`, `setFeatures`, `setReligion`, `setTheme`), `project/OverviewTab.tsx`, `Projects.tsx`, `portal/sections/Dashboard.tsx`, `progress.ts`, `os/screens/Settings.tsx`.

1. Overview tab gets: Theme (text), Religion (select hindu/christian/muslim/none), Feature toggles (gallery, poses, invite, portal), and a **Work progress** stepper over `WORK_STAGES` that unlocks once `paidTotal > 0` (use `money.ts`). Before that it reads "Progress unlocks after the first payment is recorded".
2. Portal dashboard shows the stepper read-only; hides cards whose feature is off. If `features.portal` is false the portal shows the not-enabled card.
3. `Projects.tsx` list: stage pill column.
4. `Settings.tsx`: edit `featureDefaults` (what new customers get). Picker version is shown read-only with "set by TTC".

### Phase 6 — White-label audit
Files: `client/ui.tsx`, `client/copy.ts`, `portal/Portal.tsx`, `portal/ui.tsx`, `src/saas/theme.tsx` (new `useBrandHead`), `brand.ts`.

1. Delete the "Powered by …" line and `PRODUCT` import from `client/ui.tsx`. Grep `src/saas/client`, `src/saas/portal`, `src/saas/poses` for `Treasure|TTC|PRODUCT|LogoMark|ttc-` and remove every hit from rendered output (comments are fine).
2. `useBrandHead(studio, title)` in `theme.tsx`: sets `document.title`, swaps `<link rel="icon">` to `studio.logoUrl` (create the link element if absent, restore the old href on unmount), sets `meta[name=description]`, `og:title`, `og:image`, `theme-color = studio.accent`. Use it in ClientGallery, Portal, PoseChooser. Note in the plan status: the static `index.html` title still says TTC until JS runs; the prerenderer does not prerender these dynamic routes, so this is the limit of a frontend-only build.
3. Portal "Sign up as a photographer" banner renders only when `studio.portalBanner` is true (default false).
4. Test: `copy.ts`/`portal` strings snapshot: `Object.values(copy).flatMap(v => Object.values(v)).every(s => !/treasure/i.test(s))`.

### Phase 7 — Master admin
Files: `AdminLayout.tsx`, `Overview.tsx`, `admin/photographers/{Studios,StudioDetail,Approvals,Plans,shared,helpers}.tsx`, new `admin/photographers/CustomerDetail.tsx`, new `admin/photographers/CustomerControls.tsx`, `OrderDetail.tsx` (one mount line), `src/lib/store.ts`.

1. Nav group labels → "Manage customers" (en) / "வாடிக்கையாளர்கள்" and "Manage photography clients" / "புகைப்படக் கலைஞர் வாடிக்கையாளர்கள்". Overview tiles: pending payments, active studios, expiring in 14 days, galleries awaiting selection across studios.
2. `StudioDetail.tsx` sections: Payment (Phase 1) · **Controls**: picker version (normal/swipe), feature defaults, portal banner, override any `OsSettings` field (tax on/off, %, milestones, deliverables, contract body, WhatsApp group) via the same form the studio uses (extract that form from `os/screens/Settings.tsx` into `os/screens/SettingsForm.tsx` taking `studioId`) · **Customers**: table of that studio's projects (name, date, stage, features, picker, gallery status) linking to `CustomerDetail`.
3. `CustomerDetail.tsx`: `CustomerControls` (theme, religion, feature toggles, picker override, stage) + read-only summary (gallery count/picks, poses progress, payments). Same component is mounted in `OrderDetail.tsx` for our own customers, bound to `Order` through a tiny adapter (`{theme, religion, features, onChange}`); for orders the picker version writes `useProofingVersion` (already exists, `src/pages/dashboard/proofing.tsx:18`) and stage is hidden (orders already have `status`).
4. `helpers.ts` `wingTotals`: recompute with the new subscription model; update `helpers.test.ts`.

### Phase 8 — Isolation test, demo data, docs
1. `src/saas/isolation.test.ts`: seed two studios, assert every selector used by `/studio/*` screens (`useProjects`, events, proofs, picks, drives, terms) returns only rows with the session's `studioId`, and that `resolveGalleryCode('divya2rk')` returns only st_lens data.
2. Seed: st_lens gets two projects with galleries and one with poses sent; `/poses/divya2rk` works with PIN 4821. Update `resetStudioDemo` / `resetOsDemo` and the demo credentials in `docs/album-selection-plan.md` Status.
3. Update the Status section in `docs/album-selection-plan.md` and the memory note.
4. List every new, renamed or removed store action (useStudioStore, useOsStore, useStore) for the backend chat; it maps each one to an endpoint in `docs/backend-plan.md` §5.

---

## 4. Decisions taken unless the user says otherwise
- **orderId = `Project.code`** (existing 8-char code). One code opens `/gallery`, `/poses` and `/p`. Portal PIN also guards gallery and poses.
- Plans are **terms** (1 / 6 / 12 months), not monthly statements. Photographer count is not capped.
- A **revoked or expired** studio loses `/studio` login; its customers' links stay live for 7 days (existing `GRACE_DAYS`), then show "ask your photographer".
- **Swipe picker** is off for photographer customers unless TTC admin turns it on per studio or per customer.
- Religion = existing `Faith` type (hindu / christian / muslim). It feeds `posesFor()`. For **invite designs**, map religion → invite theme keys (see the exported theme list in `src/pages/invite/themes.ts`; import the type only, never the TTC art) in a small table in `src/saas/poses/logic.ts`; ❓ the actual mapping is a content decision for the user, so ship it with a sensible default and flag it.
- The portal's "Sign up as a photographer" banner conflicts with "no TTC on customer pages". Default **off**; admin can turn it on per studio.
- "Invite" feature toggle exists from Phase 5, but the white-labelled invite builder for photographer customers is **not** in this plan (it needs the invite work another chat owns). The toggle only shows/hides the Invite card on the portal.
- Keep `/p/:code` portal; keep `/studio/galleries` (Post Production) as a cross-project list.

## 5. Order of work and size
Phases 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Phases 3 and 4 can run in parallel agents after 2; Phase 6 can run alongside 5. Roughly: 1 and 7 are the largest (store + admin UI); 2 is mostly deletion; 3 is wiring existing pieces; 4 is the only new customer-facing screen.

Every phase: run typecheck, `vitest run`, `vite build`. Fix before moving on. Do not run `build:static` until Phase 8 (slow); `scripts/prerender.mjs` prerenders only `seo.indexablePaths()` / `PUBLIC_ROUTES`, so do not add `/gallery/:orderId`, `/poses/:orderId` or `/p/:code` there. `EventKey` comes from `src/lib/data.ts`.

---

## Phase 9 — Photographer landing: packages, three services, a page per service (OWNED BY THE AUDIT CHAT, skip here)
Added 5 Nov 2026 from the user's original brief. Files: `src/saas/studio/Landing.tsx`, new `src/saas/studio/ServicePage.tsx`, new `src/saas/studio/services.ts` (copy + feature lists, bilingual), route lines in `App.tsx` inside SiteLayout next to `for-photographers`.

1. `/for-photographers` gets: a short intro to the **three services** (Gallery photo choosing, Storage manager, Pose manager), each a card linking to its page; a **Packages** section showing the three plans from the store (`useStudioStore.plans`, so admin price edits show up): per-month price, months, total, "Best value" on 12 months, CTA to `/studio/login`. Explain that login opens once TTC confirms payment.
2. `/for-photographers/:service` with `service ∈ gallery | storage | poses` → `ServicePage.tsx`: what it does, how it works in 3–4 steps, what the photographer's customer sees (white-labelled, their logo only), limits stated honestly (e.g. RAW preview sizes, Chrome/Edge for drive memory, iPhone can't pick folders). Unknown service → `Navigate` to `/for-photographers`.
3. These are TTC marketing pages, so TTC branding is fine here (unlike customer pages). Add the four paths to `seo` only if `src/lib/seo*` is in an owned file; otherwise leave prerender as is and note it.

## Phase 10 — Admin edits every photo on the site (blocked on file ownership)
The brief wants all site photos changeable from the admin UI. `src/pages/admin/Cms.tsx` already edits gallery/images, but it is on the do-not-edit list because another chat is working there, and so are Home/Services/landing. **Do not build this here.** At the end, check whether Cms.tsx covers every image slot in `src/lib/images.ts` (`IMG` keys) and report the uncovered slots to the user so the other chat can add them.
