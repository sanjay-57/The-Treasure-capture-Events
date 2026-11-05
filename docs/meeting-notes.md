# Meeting notes — cleaned up

Sources: `The tce notes.txt`, `add ons.txt`, `TODO.txt` (Oct 2026 client meeting).
Compared against: `src/lib/catalogue.ts`, `src/lib/pricing.ts`, `src/lib/data.ts`.
Status: **draft**. More context from the audio recording still to come. Items marked ❓ are open questions.

All prices are in ₹. "K" = thousand.

## 0. Decisions so far (20 Oct 2026). These override anything below.

- **Unconfirmed prices go in as ₹786.** Code and the admin can then find them as placeholders.
- **10×28 album with wooden box and personalised cover** is the price of the **album alone**: 25 sheets **34,999**, 35 **37,999**, 45 **39,999**.
- **Morning vs evening outdoor shoot:** on hold. Same price for both until the client confirms.
- **Mini outdoor session** follows the 65 % rule: 10K × 65 % = **6,500**. This replaces the 4K in `add ons.txt`.
- **E-invite:** the default designs are **free** and should look decent. The premium designs come **with a caricature at 1,500** and should look good enough that people choose them.
- **Frames:** sizes and prices come later. Use assumed sizes at ₹786 for now.
- **Calendar, A4 album, A3 / A4 frames in packages:** not sold on their own. They come free inside the packages that list them.
- **"Couple portrait" in Silver and Gold** means **close family**: parents and the baby, partners where there are any, and siblings.
- **Sub-brands:** **Cradle Captures** (baby), **Bumpy Tales** (pregnancy), **Shotcut** (details later). Keep these in mind; nothing to build yet.
- **"Ma'am's photos"** are photos the client will supply later. Until then, use free stock photos (Unsplash / Pexels).
- **Business focus:** Madurai first, for SEO and defaults.

---

## 1. Session rules (apply to everything)

| Rule | Value |
|---|---|
| One session | **exactly 4 hours** |
| Mini session | 2 hours, **65 %** of the session price |
| Overtime, +1 hour on a 4-hour session | +35 % of the session price |
| Overtime, +2 hours | +65 % (same as a mini session) |
| Crowd size | **does not change the price**. Only the time on site does. |
| Customer choice | either make the session longer, or add a new session |

- Overtime is billed per hour started, so 4h10m on site counts as 5 hours.
- **Site today:** a session is "4–5 hours", hours are rounded to 5-hour blocks (`sessionsForHours`), and `CROWDS` adds ₹2.5K–12K. Both disagree with the notes.

---

## 2. Candid videography (one session; choose one or more styles)

The notes say to show these as a dropdown with several options.

| # | Style | What's in it | Price |
|---|---|---|---|
| 1 | Documentary | Interview / Q&A with the family and the groom | 13.5K |
| 2 | Candid moments | Rituals, special and emotional moments, montages | 14.5K |
| 3 | Cinematic | Cinematic intros of the bride and groom, cinematic rituals, couple montages | 15.5K |

- Any 2 styles: **25K** · all 3: **35K** (one session).
- The important people are already chosen for the candid coverage. Crowd size does not change the price.
- **Semi-candid video (add-on): 10K.** Covers the important rituals and the couple's candid moments. Final film is 10–15 min.
  - ❓ The Gold package describes the same thing as a "10–20 min" film. Which length is right?

## 3. Candid photography (one session; choose one or more)

| # | Style | Price |
|---|---|---|
| 1 | Couple portraits | 6K |
| 2 | Candid moments, couple and families | 12K |
| 3 | Guests' candid moments | 7.5K |

- Any 2 styles: **25 % off** their combined price. The numbers in the notes check out: 1+3 = 10,125, 1+2 = 13,500, 2+3 = 14,625.
- All 3: **20K** flat.
- The price depends on the session length, not the crowd. A mini session (2 h) costs 65 %.

**Site today:** there is one `candid_photo` item (12K per session) and one `candid_video` item (20K). They need to become style options with bundle pricing.

---

## 4. Add-ons

| Add-on | Price | Notes | Site today |
|---|---|---|---|
| Drone, slow-motion only, no fast moves | 13K per session | **No mini session for drone** | 6K |
| FPV drone | 20K | | missing |
| E-invite, basic | **Free** | | 1.5K |
| E-invite with caricature | 1.5K ❓ | "carry catcher" in the notes is almost certainly **caricature**. TODO.txt says 500. Which price is right? | missing |
| Pendrive | 1K | In every package | missing |
| Semi-candid video | 10K | See §2 | missing |
| Mini outdoor session (2 h) | 4K | Listed in `add ons.txt` under special shoots. ❓ 65 % of a 10K outdoor shoot would be 6.5K, not 4K. | missing |
| Reels + song recreation | 7K | Only with an outdoor shoot | missing |
| LED wall | **on hold** | Hide it, or show "price on request" | 12K |
| 360° selfie booth | **on hold** | Same | 14K |
| Photo booth | **on hold** | Same | 12K |

**E-invite scope** (from TODO): fortune-cookie reveal, countdown, caricature, venue, date, names ("X weds Y"), and a QR code that opens the location in Google Maps.

**Note to show somewhere:** customers can bring their own hard disk and get a copy of the files on it.

---

## 5. Cart behaviour (`add ons.txt`)

- The cart lists **every** option (all add-ons, deliverables and so on). Nothing is hidden behind a package.
- Picking a package **pre-ticks the add-ons it includes**. The customer can then add more.

---

## 6. Packages

### 6a. Family functions: baby shower, birthday, naming ceremony, puberty, ear piercing

These replace Basic / Standard / Premium with **Bronze / Silver / Gold**.

"Traditional base" below means:
- traditional photography: stage, rituals, 5–10 traditional individual portraits
- soft copies in a gallery on our website that customers can download, valid for **6 months**

| | Bronze | Silver | Gold |
|---|---|---|---|
| Hours | 4 (1 session) | 5 | 5 |
| Traditional base | ✓ | ✓ | ✓ |
| Dedicated portrait hour before the event | – | ✓ | ✓ |
| Candid individual shots | – | 20–25 | 20–25 |
| Album (individual shots only, boxed) | – | A4, 15 sheets | 10×28, 25 sheets |
| Calendar | – | ✓ | ✓ |
| Frame | – | A4 | A3 |
| Semi-candid video (10–20 min) | – | – | ✓ |
| **Price** | **12.5K** | **19,999** | **29,999** |
| Option 2: bigger album | – | 12×15, 25 sheets → **24,999** | 12×36, 35 sheets → **34,999** |
| Pendrive add-on | 1K | 1K | 1K |

- ❓ The notes say "special **couple** portrait" for Silver and Gold. For a birthday, naming or puberty function that probably means a portrait of the person being celebrated or of the family. Can we confirm the wording?
- The extra 5th hour in Silver and Gold is the portrait hour before the event.

### 6b. Wedding, engagement, reception (1 session = 4 h)

**Tier 1**

| | Package 1 | Package 2 |
|---|---|---|
| Traditional base | ✓ | ✓ |
| Traditional video, same 4 h, 30-min full film, stage coverage | ✓ | ✓ |
| Outdoor shoot | 2 h (mini) | 4 h (full session) |
| 1-hour couple portrait session | – | ✓ |
| A3 photo frame | – | ✓ |
| Pendrive add-on | 1K | 1K |
| **Price** | ❓ not given | ❓ not given |

**Tier 2**: left blank in the notes ("add on"). ❓

**"Single album"**: 10×28 with a wooden box and a personalised cover on both the box and the album. 25 sheets A3 → **34,999**, 35 → **37,999**, 45 → **39,999**.
- ❓ These prices are far above the album rate card in §8 (25 sheets = 6.5K), so this is probably the **Tier 2 package price** (coverage plus this album), not the price of the album alone. Can we confirm?

**Site today:** `trad_film` says "2 hr on pendrive". The notes say a 30-minute full film for weddings.

---

## 7. Special shoots: outdoor (a separate module)

Three looks, all at the same price:

| Look | Location | Photos | + Reels & song recreation |
|---|---|---|---|
| Traditional attire | Traditional venue / temple | 10K | +7K |
| Freestyle attire | Beach | 10K | +7K |
| Freestyle attire | Early-morning meadow / garden | 10K | +7K |

- Morning and evening slots are priced differently. ❓ What is the difference?
- The page has two columns: **"with an idea"** and **"without an idea"**. ❓ Our understanding: either the couple brings their own concept, or we plan the concept for them. Is that right, and do the two cost the same?
- **Paid venues in Madurai.** The customer pays the venue fee directly; it is never on our invoice.

| Venue | Fee |
|---|---|
| Sangeet Wedding Village | 8K for 4 h |
| Thiruparankundram park | ₹300 per camera |
| Kadambavanam resort | TBD |
| Titan resort | TBD |

**Not now:** newborn shoots. Newborn and toddler shoots appear as a **gallery with a "contact us" button only**, with no booking.
**Sub-brands:** **Cradle Captures** for baby photography, **Bumpy Tales** for pregnancy / maternity.

---

## 8. Albums

### 8a. Formats

- Every album comes with a carrying box.
- **A4, 10×12 portrait**: paperback, paper box.
- **A3** comes in three patterns:
  1. 12×36 landscape, large, rexin finish (wooden box is an add-on)
  2. 12×15 portrait, book style, rexin finish (wooden box is an add-on)
  3. 10×28 landscape, medium, paperback, **comes with a wooden box**

### 8b. Rate card for Acroluxe, Aura, Allura, Pixel Passage

This rate card does **not** apply to A4 or 10×28.
The price is the same for every size and for both orientations.

| Sheets | Pages | Price | Landscape: photos (group shots) | Portrait: photos (group shots) |
|---|---|---|---|---|
| 25 | 50 | **6.5K** | 150–160 (90–110) | 100–130 (50–60) |
| 35 | 70 | **10K** | 200–225 (150–175) | 150–170 (75–90) |
| 45 | 90 | **14.5K** | 280–300 (200–240) | 200–220 (110–130) |

- **Landscape** (best when there are many group photos): 12×36, 12×15, 12×12.
- **Portrait** (best for candids; group photos are still possible): 12×18, 12×15, 12×12.
- ❓ 12×15 appears under both orientations. Is the landscape one really 15×12?
- Copy for the site: *"Need more or fewer photos? We'll customise it with you on a call. Everything is designed from your input, the way you like it."*

### 8c. The product lines

Each of these is a different maker's product.

- **Pixel Passage**: colours stone blue, sunflower yellow, coffee brown, tan brown, mulberry red (no change in price).
  - The cover PDF has been received for the "with box" option. The PDF for the other option is still pending.
- **Acroluxe**: 25, 35 or 45 sheets. Wooden pad with a soft rexin finish. **This pack alone** includes a free calendar and a leather album bag.
- **Allura**: with box, 25 sheets.
- **Aura**: no box, hard leather, luxury material.
- Answered: Aura, Allura, Acroluxe and Pixel Passage are **separate Canvera lines** (see §11).

**Album layouts** will come from the Canvera website (TODO).

**Site today:** six album items (25–60 sheets, flat ₹500 per sheet, 10K for 25 sheets). They need to become **product line × size × 25/35/45 sheets**, plus colour and box options. The album studio in `/dashboard/album` already has controls for material, colour and size.

### 8d. Package ↔ album disclaimer (TODO)

We need one clear explanation of how packages and albums relate. Show it as a disclaimer next to packages, and have the voice assistant read it out. Draft:

> *Packages that include an album come with the size and sheet count listed. You can upgrade to a bigger album, or a different product line, and pay only the difference. The album holds individual and candid shots chosen from your gallery. The final layout is designed with you.*

### 8e. E-album viewer (added 5 Nov 2026)

The client's chosen photos play as a cinematic virtual album at `/dashboard/album/view` (linked from the album studio and the submitted-photos page). Sequence: closed album seen from above on a velvet table → cover lifts on its spine (no hands) → title page → each spread is toured, the camera gliding into every photo → the leaf flips on its own → colophon → back cover closes. Transport bar, arrow keys, tap a photo to look closer. Pages use the studio's sample layouts and the saved cover, colour, paper and font; the real album-maker design replaces them later. ❓ A shareable private link for family is promised on the page but not built.

---

## 9. Commercial: monthly retainers, under agreement

| Plan | Scope | Price / month |
|---|---|---|
| **Brands** | 2 shoots a month, 8 h in total · 10 reels · 7 promotional posters · 17 stories · script, editing, page management with moderation. No boosting, no Google Ads (quoted separately if needed). We collect content from the brand over 30 days. | **25K** |
| **Schools** | 7 shoots of 2 h each · 3 reels and 3 posters a week ("congratulations"-style posts) · 15 reels and 15 posters in total | **35K** |

- ❓ For schools the notes say "1 month" and also "5 weeks". Which one is the plan length?
- **Site today:** `commercial_shoot` is an 18K one-off (pending). Change it to these two plans, shown as an enquiry or agreement rather than a cart purchase.

---

## 10. Other TODOs from the meeting

- **Catalogue first.** Do it as soon as possible; most of this document feeds `catalogue.ts`.
- **Cart refresh** using the photos ma'am shared.
- **Gallery delivery.** Clients view and download from our website (like the example reel in the WhatsApp group). It stays valid for 6 months.
- **Admin billing.** Staff can build a quote while on a phone call (`/admin/billing`).
- **Booking background.** Event photos sit behind the booking steps, with a horizontal strip titled *"Here are our pictorial tales"*.
- **Tamil copy** should sound warm and close, like everyday spoken Tamil, not formal or literary.
- **SEO keyword plan** (event × district, e.g. "wedding photographer Madurai", "மஞ்சள் நீராட்டு விழா photography").
- "Shotcut" ❓ What does this refer to: keyboard shortcuts in admin, or Shotcut the video editor?

---

## 11. Canvera product research

All five lines are **Canvera** products. Sources: `35 Aura catalogue.pdf`, `Pixel Passage Catalogue08012026.pdf`, a colour-swatch screenshot, and a pasted Canvera price list.

### Specs

| | Aura | Pixel Passage | Acroluxe | Allura | Dualuxe |
|---|---|---|---|---|---|
| Material | Leather | Leather, with a photo window on the cover | Soft rexin on a wooden pad (our notes) | ❓ | ❓ |
| Box | Matching box (kraft "Memories" box in the PDF) | Matching leather box, **with name and date etched on it** (2 font styles) | Fusion box | Fusion box | Included |
| Bag | Matching leather bag | Matching leather bag | Leather bag (475) | Bag (475) | Included |
| Sizes | 12×18, 12×15, 12×12 | 12×18, 12×15, 12×12 | 12×36, 12×15, 12×12 (our notes) | ❓ | ❓ |
| Orientation | Landscape only | Landscape **and** portrait | Both (our notes) | ❓ | ❓ |
| Colours | Linen Beige, Cherry, Cranberry, Espresso | Marigold, Mulberry Red, Stone Blue, Umber Brown, Saddle Brown | – | – | – |
| Print / binding | Indi Pro · Layflat & Absolute Layflat | Indi Pro · Layflat | ❓ | ❓ | ❓ |

- **Pixel Passage colours.** Our notes say "sunflower yellow, coffee brown, tan brown". Canvera's names are **Marigold, Saddle Brown, Umber Brown**. Use Canvera's names on the site.
- **The colour-swatch screenshot** is the Pixel Passage colour chart: Marigold, Mulberry Red, Stone Blue, Umber Brown, Saddle Brown. "Frame outer part" means the leather border around the cover's photo window, and the box and bag come in the same colour.
- ❓ **Aura and boxes.** Our notes say "Aura: no box, hard leather", but Canvera's catalogue shows a matching box and bag. Which is right for us?
- **Dualuxe** is a fifth line that isn't in the meeting notes. Should it be on the site?

### Canvera price list: "Dual books with a single box"

| Line | 2 covers | 1 box (Fusion) | 1 bag | 25 sheets | 35 sheets | 45 sheets |
|---|---|---|---|---|---|---|
| Acroluxe | 2 × 1,400 = 2,800 | 1,600 | 475 | 7,240 | 8,020 | 8,800 |
| Aura | 2 × 1,450 = 2,900 | 1,600 | 475 | 7,930 | 8,770 | 9,620 |
| Allura | 2 × 1,700 = 3,400 | 1,600 | 475 | 7,540 | 8,840 | 9,640 |
| Dualuxe | 4,100 for covers, box and bag together | | | 7,320 | 8,200 | 9,100 |

- ❓ This looks like **Canvera's price to the studio** for a pair of albums (for example, one for each family) sharing one box. A 25-sheet Acroluxe pair would cost 2,800 + 1,600 + 475 + 7,240 = 12,115. Our customer prices (25 sheets = 6.5K, from §8b) are for a single book. To check:
  1. Is this the studio's cost or the customer price?
  2. Are the sheet prices for both books together, or for each book?
  3. Do we sell a "dual book" option to customers, and at what price?
- Until those answers come in, the site uses the §8b customer rate card. The dual-book option is priced at ₹786.
