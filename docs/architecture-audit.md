# Architecture audit — 5 Nov 2026

Checked the site against the nine-point spec from the client brief (landing packages, three services, customer dashboard, admin split, CMS, white-label photographer product). Evidence is `file:line` as of branch `alterdes`.

**Owner chat:** `A` = this audit chat (public pages, Nav/Footer, CMS, docs). `B` = the features chat (`src/saas/**`, `src/pages/admin/photographers/**`, `AdminLayout.tsx`, `src/lib/store.ts`, dashboard, new `/poses` and `/gallery` routes). `—` = nobody yet; needs a decision.

| # | Item | Status | Evidence | Fix needed | Owner |
|---|------|--------|----------|------------|-------|
| 1a | Photographer landing shows the packages (1 / 6 / 12 months) | **Done** | `/for-photographers` → `src/saas/studio/Landing.tsx` plans section reads `useStudioStore(s => s.plans)` and shows `pricePerMonth` + `planTotal` (₹1300 / ₹5,994 / ₹10,788; `src/saas/types.ts:10-20`, `src/saas/store.ts:38-42`). Chat B moved the data model; A added the "Best value" badge on 12 months. | None. | A + B ✅ |
| 1b | Short intro to the 3 photographer services | **Fixed** (was 2 of 3) | Landing described two tools (album selector, storage manager); no pose manager. | New `src/saas/studio/services.ts` defines **Gallery photo choosing / Storage manager / Pose manager** (bilingual copy, steps, what the customer sees, honest limits). Landing lead and card grid now show all three, each linking to its page. Pose manager went live with B's Phase 4 (customer link `/poses/<project code>`, Yes/No per pose, answers saved, shot list to the studio). | A ✅ |
| 2 | Detail page per service | **Fixed** (was missing) | Only `/for-photographers` existed. | New `src/saas/studio/ServicePage.tsx` at `/for-photographers/:service` (`gallery` \| `storage` \| `poses`; unknown → redirect). Route added in `src/App.tsx`. Not in `PUBLIC_ROUTES` for the sitemap (`src/lib/seo.ts:15`); that file is unowned, one-line add. | A ✅ / sitemap — |
| 3 | Customers log in → own dashboard | **Done** | `/login` by phone → `loginClient` (`src/pages/Login.tsx:75,115`); `/dashboard` wrapped in `RequireClient` (`src/App.tsx:122`); session is `{ role:'client', orderId }` (`src/lib/store.ts:218`). | None. Admin enable/disable of a customer login is not modelled (any order phone can sign in). | B |
| 4 | Dashboard: gallery choosing, poses, album, progress | **Done** | Routes `poses`, `track`, `photos`, `album`, `album/view`, `billing`, `review`, `invite` (`src/App.tsx:124-131`). | None. | — |
| 5 | Shareable links that keep state | **Partly** | Our customers: picks persist via zustand `persist` → `localStorage` (`src/lib/store.ts:544,769`) so they survive reloads, but only on the same device; there is no link with an order id in it, only phone login. Photographer customers: `/s/:code` resolves by code + PIN, picks persist in `localStorage` key `ttc-studio-v1` (`src/saas/store.ts:367`), name in localStorage (`src/saas/client/session.ts:9-15`); `syncQueue.ts` is a stub for a future backend. | Frontend-only means state is per-device until a backend exists. The brief's `/gallery/<orderId>` and `/poses/<orderId>` routes don't exist yet. | B |
| 6 | Admin split: "Manage customers" / "Manage photography clients" | **Partly** | Nav is already in two groups but labelled `copy.events` and `copy.photographers` (`src/pages/admin/AdminLayout.tsx:70-74`). | Rename the two group labels. Page map below. | B |
| 7 | CMS can change every public photo | **Fixed** (was hero + gallery only) | New `cms.images` override map in `CmsState` (`src/lib/store.ts`) with `setSiteImage(key, url \| null)`; `photoUrl` / `photoSrcSet` read it (`src/lib/images.ts`), and `Img` subscribes so swaps are live (`src/components/ui.tsx`). New **Site photos** tab in `/admin/cms` lists all 216 slots (filter by contemporary / traditional / districts / other / replaced, search by name or description), click → replace by URL, preview, reset to stock. Covers every call site because all of them go through `photoUrl`. | File upload (rather than URL paste) waits for the backend. | A ✅ |
| 8 | Photographer product is white-labelled | **Leak** | Client gallery shows "Powered by TC Studio": `src/saas/client/ui.tsx:151-155` renders `PRODUCT.short` (`src/saas/brand.ts:8`), used on `Gate.tsx:29` and `ClientGallery.tsx:191`. The comment in `brand.ts:4` says galleries never show it; the code does. Title is fine (`ClientGallery.tsx:44`, `Portal.tsx:101` set `document.title` to studio name). Favicon, `<meta>` and `apple-mobile-web-app-title` are the TTCE ones from `index.html:6-14` for every route, including `/s` and `/p`. WhatsApp texts use the studio's number (`client/logic.ts:73-77`), no TTCE text found. | Remove `PoweredBy` from client-facing screens (or make it the studio's own logo). Swap favicon / theme meta per route in `/s`, `/p` and the coming `/gallery`, `/poses` pages (set `<link rel=icon>` to the studio logo in an effect). `index.html` is unowned; the per-route swap can live in `src/saas`. | B |
| 9 | Data isolation | **Done (frontend)** | Studio screens filter by `studioId` everywhere: `src/saas/studio/Events.tsx:46`, `EventDetail.tsx:38`, `os/screens/parts.tsx:20-32`, `ProjectEditor.tsx:49`, `drives/*.tsx`. Clients resolve a single event by code (`client/ClientGallery.tsx:31`), portal a single project (`portal/Portal.tsx:92`). Our customers are scoped by `session.orderId`. | Holds only as a UI contract: all data is one localStorage blob, so anyone with devtools sees everything. Real isolation needs the backend. Admin "view as studio" (`src/saas/store.ts:258-260`) is intentional. | B / backend |

## Admin page map (item 6)

| Page | Route | Area |
|------|-------|------|
| Overview | `/admin` | Both (top) |
| Orders, Order detail | `/admin/orders`, `/admin/orders/:id` | Manage customers |
| Team | `/admin/team` | Manage customers (our crew) |
| Poses, Shot list | `/admin/poses`, `/admin/poses/:id` | Manage customers |
| Messages | `/admin/messages` | Manage customers |
| Leads | `/admin/leads` | Manage customers |
| Showroom | `/admin/showroom` | Manage customers (walk-in quotes) |
| Billing, Billing detail | `/admin/billing`, `/admin/billing/:id` | Manage customers |
| CMS | `/admin/cms` | Site (fits under neither; keep in the top group) |
| Studios, Studio detail | `/admin/photographers`, `/admin/photographers/:id` | Manage photography clients |
| Approvals | `/admin/photographers/approvals` | Manage photography clients |
| Plans | `/admin/photographers/plans` | Manage photography clients |

Missing from the brief for the photography area: per-studio picker version (normal vs swipe), per-customer theme / religion / feature toggles, payment thumbs-up gating the login. All B.

## Hardcoded images not editable in the CMS (item 7)

Everything is an `ImgKey` into `src/lib/images.ts`, so no raw URLs exist outside that file; but none of these sites can be changed from `/admin/cms`:

- `src/pages/Home.tsx`: `HOME_STORY_COVER`, `HOME_EVENT_IMG`, `HOME_MOSAIC`, service covers (new).
- `src/pages/Services.tsx`: event covers in `EVENT_DETAIL`, album craft shots, district cards.
- `src/pages/About.tsx`, `src/pages/Story.tsx`, `src/pages/content/shared.tsx`.
- `src/lib/data.ts` (event and district images), `src/lib/gallery.ts` (gallery seed), `src/lib/images.ts` (`DISTRICT_GALLERY`, `ITEM_PHOTO`).
- `src/lib/services.ts` (service covers), `src/components/ui.tsx` (`CrossfadeImg` keys), `src/components/EAlbumViewer.tsx`, `AlbumSurface.tsx`, dashboard demo photos (`src/pages/dashboard/*`), `src/saas/store.ts` demo proofs.
- `index.html`: favicon and social meta are static.

One override map keyed by `ImgKey` fixes all of the above at once, since every site goes through `photoUrl`.

## What this chat changed

Split agreed with chat B (see `docs/photographer-saas-plan.md` Phase 9): A owns `Landing.tsx`, `services.ts`, `ServicePage.tsx` and the one route line; B owns the rest of `src/saas/**` and `src/pages/admin/**`.

- `src/saas/studio/services.ts` (new): the three photographer services, bilingual.
- `src/saas/studio/ServicePage.tsx` (new): `/for-photographers/:service`.
- `src/saas/studio/Landing.tsx`: lead copy, three-service card grid linking to the pages, "Best value" on the 12-month plan.
- `src/App.tsx`: lazy import + `for-photographers/:service` route.
- An earlier pass added service pages to the *public* site (`/services/:slug`, Home sections); that misread the brief and has been fully reverted.

## Open questions (❓)

1. Who owns `index.html` and `src/lib/seo.ts` edits (favicon swap for customer pages, sitemap entries for the four photographer paths)?
