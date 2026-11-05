// Builds the A3 customer catalogue (catalogue.html). Render to PDF with render.ps1.
// Copy, prices and photos mirror src/lib/catalogue.ts, src/lib/data.ts and src/lib/images.ts.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const IMG = {
  m_couple_bokeh: '1722952934708-749c22eb2e58',
  m_couple_pinksky: '1631621583126-ed10a80f62b1',
  m_couple_field: '1743685102554-ef8e4eb11415',
  m_couple_mist: '1744891471728-5f0c9476424e',
  m_hands_rings: '1597157639073-69284dc0fdaf',
  m_ring_hands: '1529519195486-16945f0fb37f',
  m_rec_stage: '1587271407850-8d438ca9fdf2',
  m_rec_hall: '1712314947761-a8d718bd8c32',
  m_haldi_seated: '1703044412425-b1977e3f793f',
  m_baby_smile: '1649880210584-3365f4c4c08b',
  m_baby_wrap: '1610901137736-d7cc46657b11',
  m_baby_hat: '1610901158532-d246c011729e',
  m_bday_girl: '1544155892-b2b6c64204fc',
  m_mehndi_hands: '1619734089700-842e56497353',
  m_bride_studio: '1684868265715-03e19a3e0e00',
  m_cam_dark: '1575876402495-fe202e1d3732',
  m_cam_silhouette: '1497316730643-415fac54a2af',
  m_album_open: '1784722237781-88d640eee061',
  m_album_bw: '1784722237779-7fd5be91c980',
  m_album_black: '1621413412189-c1b47c66f70b',
  m_decor_lights: '1723832348105-2e69f948135a',
  t_couple_garland: '1733759414886-6b3a5423ceb3',
  t_bride_silk: '1673413349218-ba4de23c2958',
  t_jasmine_garland: '1772127822454-8566c23084df',
  t_marigold_strings: '1789971649652-ae5dfeeaa7b4',
  t_ritual_garland: '1647949940712-bfcf82015d9b',
  t_diya_glow: '1730406586742-6fb92613ad46',
  t_lamp_many: '1771929712047-3e7022669175',
  t_couple_seated: '1741201864879-c5e7f81c98b0',
  e_commercial: '1697301439930-2405c5347e1f',
  e_corporate: '1775113586139-b583cc93517f',
  d_madurai: '1677434654722-69e7ba88b4ef',
}

/** Unsplash URL cropped to the slot, at roughly 150 dpi for A3 print. */
const img = (key, wmm, hmm) => {
  const w = Math.round(wmm * 6), h = Math.round(hmm * 6)
  return `https://images.unsplash.com/photo-${IMG[key]}?w=${w}&h=${h}&fit=crop&crop=faces,entropy&q=82&auto=format`
}
const pic = (key, wmm, hmm, cls = '') => `<img class="${cls}" src="${img(key, wmm, hmm)}" alt="">`
const inr = n => '₹' + n.toLocaleString('en-IN')

const BRAND = 'The Treasure Capture Events'
const STUDIO = {
  phone: '+91 98940 12345',
  email: 'hello@treasurecaptureevents.in',
  address: '14, West Masi Street, Madurai 625001',
  hours: 'Mon–Sat · 9:30 am – 8 pm',
}

const head = (n, section) => `
  <header class="runhead">
    <span class="wm">${BRAND}</span>
    <span class="rh-right"><span>${section}</span><span class="pn">${String(n).padStart(2, '0')}</span></span>
  </header>`

const foot = `<footer class="runfoot"><span>${STUDIO.phone}</span><span>${STUDIO.email}</span><span>${STUDIO.address}</span></footer>`

// ─── Data ────────────────────────────────────────────────────────────────────

const FAMILY_EVENTS = [
  ['Wedding', 'திருமணம்', 'Muhurtham to reception, every ritual', 't_ritual_garland'],
  ['Engagement', 'நிச்சயதார்த்தம்', 'Rings, families and first promises', 'm_ring_hands'],
  ['Reception', 'வரவேற்பு', 'Stage, lights and the whole guest list', 'm_rec_stage'],
  ['Puberty ceremony', 'மஞ்சள் நீராட்டு விழா', 'Manjal Neerattu Vizha, with warmth', 'm_haldi_seated'],
  ['Ear piercing', 'காதுகுத்து', 'Kaadhu Kuthu at home or temple', 'm_baby_smile'],
  ['Naming ceremony', 'பெயர் சூட்டு விழா', 'Peyar Soottu — the first celebration', 'm_baby_wrap'],
  ['Birthday', 'பிறந்தநாள்', 'Cakes, candles and candid chaos', 'm_bday_girl'],
]
const MATERNITY_EVENTS = [
  ['Baby shower', 'வளைகாப்பு', 'Valaikappu bangles and blessings', 'm_mehndi_hands'],
  ['Baby shoot', 'குழந்தை படப்பிடிப்பு', 'Newborn and milestone portraits', 'm_baby_hat'],
]

const FAMILY_TIERS = [
  { name: 'Basic', price: 33000, pitch: 'Traditional photo and video with a 30-sheet album.',
    items: ['Traditional photographer', 'Traditional videographer', 'Album · 30 sheets'],
    incl: ['All photos · soft copies', 'Edited photos · soft copies', 'Traditional video · 2 hr on pendrive'] },
  { name: 'Standard', price: 52200, popular: true, pitch: 'Adds a candid photographer, a bigger album and a frame.',
    items: ['Traditional photographer', 'Traditional videographer', 'Candid photographer', 'Album · 40 sheets', 'Frame · 16×24 in'],
    incl: ['All photos · soft copies', 'Edited photos · soft copies', 'Traditional video · 2 hr on pendrive'] },
  { name: 'Premium', price: 88500, pitch: 'All four cameras, drone, highlight film and the full print set.',
    items: ['Traditional photographer', 'Traditional videographer', 'Candid photographer', 'Candid videographer', 'Drone coverage', 'Album · 50 sheets', 'Frame · 24×36 in', 'Printed magazine'],
    incl: ['All photos · soft copies', 'Edited photos · soft copies', 'Traditional video · 2 hr on pendrive', 'Candid highlight film · 3–4 min'] },
]
const MATERNITY_TIERS = [
  { name: 'Basic', price: 8000, pitch: 'One photographer, every photo delivered digitally.', items: ['Traditional photographer', 'All & edited soft copies'] },
  { name: 'Standard', price: 23500, popular: true, pitch: 'Candid coverage too, plus a mini book to keep.', items: ['Traditional + candid photographer', 'Mini book', 'All & edited soft copies'] },
  { name: 'Premium', price: 51200, pitch: 'Photo, candid video, an album and a framed print.', items: ['Traditional + candid photographer', 'Candid videographer + highlight film', 'Album · 25 sheets', 'Frame · 12×18 in'] },
]

const SPECIAL = [
  ['Pre / post-wedding shoot', 'Half-day, one location', 15000],
  ['Outdoor couple shoot', 'On location, golden hour', 6000],
  ['Outdoor baby shoot', 'Parks, beaches, home gardens', 5000],
  ['Outdoor maternity shoot', 'Soft light, on location', 5000],
  ['Model portfolio shoot', 'Studio or outdoor, half-day', 12000],
  ['Commercial / ad shoot', 'Products, interiors, campaigns', 18000],
]
const CORPORATE = [
  ['Basic', 8000, 'Event photography, delivered same week.'],
  ['Standard', 18000, 'Photo and full-length video coverage.'],
  ['Premium', 68000, 'Four cameras, drone and a live LED wall.'],
]

const CREW = [
  ['Traditional photography', 'Stage, rituals and family portraits', 8000],
  ['Traditional videography', 'Full-length coverage of the function', 10000],
  ['Candid photography', 'Unposed, storytelling frames', 12000],
  ['Candid videography', 'Cinematic coverage for the highlight film', 20000],
]
const ADDONS = [
  ['Drone coverage', 'Aerial stills & video', 6000],
  ['E-invite', 'Designed digital invitation', 1500],
  ['LED wall · 6×8 ft', 'Live feed for guests', 12000],
  ['Photo booth', 'Instant printed keepsakes', 12000],
  ['360° selfie booth', 'Slow-motion spinning videos', 14000],
]
const ALBUMS = [[25, 10000], [30, 15000], [35, 17500], [40, 20000], [50, 25000], [60, 30000]]
const FRAMES = [['12×18 in', 1200, 1900], ['16×24 in', 2200, 3500], ['20×30 in', 3500, 5600], ['24×36 in', 5000, 8000]]
const PRINTS = [
  ['Magazine', 'Editorial-style printed magazine', 2500],
  ['Mini book', 'Pocket-size album for parents', 3500],
  ['Calendar', 'Desk or wall calendar', 1500],
]
const INCLUDED = [
  ['All photos · soft copies', 'Every frame we shoot, unedited'],
  ['Edited photos · soft copies', 'Curated and colour-graded'],
  ['Traditional video · 2 hr', 'On pendrive, with traditional videography'],
  ['Candid highlight · 3–4 min', 'With candid videography'],
]
const PROCESS = [
  ['Your auspicious day', 'Share your muhurtham date and hometown — we will hold it dear.'],
  ['Meet as family', 'We sit with you to plan the rituals, the timings and every cherished moment.'],
  ['The day', 'Our crew arrives early and stays until the last guest.'],
  ['Pick favourites', 'Choose album photos in your private online gallery.'],
  ['Your album', 'Design the cover, paper and type — delivered to your door.'],
]
const DISTRICTS = [
  ['Madurai', 'Head studio · Temple city'], ['Chennai', 'Coastal & city weddings'], ['Coimbatore', 'Western ghats backdrops'],
  ['Thanjavur', 'Big Temple heritage'], ['Salem', 'Yercaud hills & grand mahals'], ['Tirunelveli', 'Nellaiappar & river ghats'],
  ['Theni', 'Hills, farms & outdoor shoots'], ['Dindigul', 'Kodaikanal pre-wedding trails'],
]

const rows = list => list.map(([name, note, price]) => `
  <div class="rate"><div><div class="rate-name">${name}</div><div class="rate-note">${note}</div></div><div class="dots"></div><div class="rate-price">${inr(price)}</div></div>`).join('')

// ─── Pages ───────────────────────────────────────────────────────────────────

const cover = `
<section class="page dark cover">
  ${pic('m_couple_bokeh', 297, 300, 'bleed')}
  <div class="cover-shade"></div>
  <div class="cover-top">
    <span class="wm wm-lg">${BRAND}</span>
    <span class="label">Catalogue · Packages & rates</span>
  </div>
  <div class="cover-body">
    <div class="eyebrow cover-eyebrow">Madurai · Est. 2018 · Eight districts</div>
    <h1 class="hero">Moments,<br><em>treasured</em><br>forever.</h1>
    <p class="ta cover-ta">காலத்தால் அழியாத நினைவுகள்.</p>
    <div class="cover-rule"></div>
    <p class="lead cover-lead">Wedding, ceremony and portrait photography across Tamil Nadu — documented quietly, edited with care, bound into albums built to outlive us.</p>
  </div>
  <div class="cover-foot">
    <span>Photography</span><i>✦</i><span>Cinematography</span><i>✦</i><span>Albums & prints</span><i>✦</i><span>Drone · LED · Booths</span>
  </div>
</section>`

const studio = `
<section class="page">
  ${head(2, 'The studio')}
  <div class="studio-top">
    <div class="studio-text">
      <div class="eyebrow ruby">01 — The studio · <span class="ta-inline">எங்கள் ஸ்டுடியோ</span></div>
      <h2 class="h1">Photographers, filmmakers and <em>album makers</em> from Madurai.</h2>
      <p class="lead">For eight years we have followed Tamil families through their most sacred days — quietly, respectfully, and with an eye for the moments nobody posed for.</p>
      <p class="body">From the first hello to an album your grandchildren will hold, one team plans, shoots, edits and designs every booking. You choose your favourite frames in a private online gallery, shape your album with us, and receive it at your door.</p>
    </div>
    <div class="studio-img">${pic('t_bride_silk', 118, 178)}<span class="cap">Muhurtham · Meenakshi Amman Temple, Madurai</span></div>
  </div>
  <div class="stats">
    <div><b>1,400<sup>+</sup></b><span>Events captured</span></div>
    <div><b>8</b><span>Districts served</span></div>
    <div><b>960<sup>+</sup></b><span>Albums delivered</span></div>
    <div><b>4.9<sup>★</sup></b><span>Average Google rating</span></div>
  </div>
  <div class="tradition">
    <div class="trad-imgs">
      ${pic('t_jasmine_garland', 62, 120)}
      ${pic('t_marigold_strings', 62, 120)}
    </div>
    <div class="trad-text">
      <div class="eyebrow ruby">Rooted in tradition · <span class="ta-inline">மரபில் வேரூன்றி</span></div>
      <h3 class="h2">We know the rituals before they begin.</h3>
      <p class="body">Maalai maatral, kanyadaanam, the tying of the thaali, the first kolam of a Manjal Neerattu morning — our crew is from here. We stand where the priest expects us to, and never where the family needs to be.</p>
      <blockquote>“They knew every ritual before we explained it. Amma was so relieved.”<cite>— Nila’s mother, Manjal Neerattu Vizha, Thanjavur</cite></blockquote>
    </div>
  </div>
  ${foot}
</section>`

const card = ([name, ta, blurb, key], from) => `
  <article class="ev">
    <div class="ev-img">${pic(key, 80, 84)}</div>
    <div class="ev-meta">
      <div class="ev-name">${name}</div>
      <div class="ta ev-ta">${ta}</div>
      <div class="ev-blurb">${blurb}</div>
      <div class="ev-from">from <b>${inr(from)}</b></div>
    </div>
  </article>`

const events = `
<section class="page">
  ${head(3, 'What we photograph')}
  <div class="page-title">
    <div class="eyebrow ruby">02 — What we photograph · <span class="ta-inline">நாங்கள் படம்பிடிப்பவை</span></div>
    <h2 class="h1">Every ceremony, <em>every family.</em></h2>
  </div>
  <div class="ev-grid">
    ${FAMILY_EVENTS.map(e => card(e, 33000)).join('')}
    ${MATERNITY_EVENTS.map(e => card(e, 8000)).join('')}
  </div>
  <p class="fineprint">Starting prices are the Basic package for one session (4–5 hours). Special shoots, portfolios and corporate events are on page 05.</p>
  ${foot}
</section>`

const tier = (t, big) => `
  <div class="tier ${t.popular ? 'tier-pop' : ''} ${big ? '' : 'tier-sm'}">
    ${t.popular ? '<span class="badge">Most chosen</span>' : ''}
    <div class="tier-name">${t.name}</div>
    <div class="tier-price">${inr(t.price)}</div>
    <div class="tier-unit">per event · one session</div>
    <p class="tier-pitch">${t.pitch}</p>
    <ul>${t.items.map(i => `<li>${i}</li>`).join('')}</ul>
    ${t.incl ? `<div class="tier-incl-h">Always included</div><ul class="incl">${t.incl.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
  </div>`

const packages = `
<section class="page dark ambient">
  ${head(4, 'Packages')}
  <div class="pk-hero">${pic('t_lamp_many', 261, 74)}<div class="pk-hero-shade"></div>
    <div class="pk-hero-text">
      <div class="eyebrow ruby-bright">03 — Packages · <span class="ta-inline">தொகுப்புகள்</span></div>
      <h2 class="h1">Wedding & family functions</h2>
      <p class="sub">Wedding · Engagement · Reception · Puberty ceremony · Ear piercing · Naming · Birthday</p>
    </div>
  </div>
  <div class="tiers">${FAMILY_TIERS.map(t => tier(t, true)).join('')}</div>
  <div class="pk-sub">
    <div>
      <div class="eyebrow ruby-bright">Baby & maternity · <span class="ta-inline">குழந்தை & வளைகாப்பு</span></div>
      <h3 class="h3">Valaikappu, newborns and first birthdays</h3>
    </div>
  </div>
  <div class="tiers">${MATERNITY_TIERS.map(t => tier(t, false)).join('')}</div>
  <p class="fineprint light">Prices are for one coverage session (4–5 hours). Each extra session adds the crew rates. Every package can be customised — add or remove anything from the rate card on page 06.</p>
  ${foot}
</section>`

const specials = `
<section class="page">
  ${head(5, 'Special shoots')}
  <div class="page-title">
    <div class="eyebrow ruby">04 — Special & commercial · <span class="ta-inline">சிறப்பு & வணிகம்</span></div>
    <h2 class="h1">Couple shoots, portfolios, <em>brands.</em></h2>
  </div>
  <div class="sp-grid">
    <div class="sp-imgs">
      <div class="sp-a">${pic('m_couple_pinksky', 128, 112)}<span class="cap light">Pre-wedding · Kodaikanal</span></div>
      <div class="sp-b">${pic('m_baby_hat', 62, 80)}</div>
      <div class="sp-c">${pic('m_bride_studio', 62, 80)}</div>
    </div>
    <div class="sp-list">
      <div class="block-h">Special shoots <span>priced per shoot</span></div>
      ${rows(SPECIAL)}
      <div class="upgrade">
        <div class="block-h small">Make it more</div>
        <div class="up"><b>Standard</b><span>Adds drone frames and a mini book</span><em>+ ${inr(9500)}</em></div>
        <div class="up"><b>Premium</b><span>Drone, album, a 20×30 frame and a magazine</span><em>+ ${inr(22000)}</em></div>
        <p class="note">All photos are delivered as soft copies with every shoot.</p>
      </div>
    </div>
  </div>
  <div class="corp">
    <div class="corp-img">${pic('e_corporate', 92, 110)}</div>
    <div class="corp-body">
      <div class="block-h">Corporate events</div><p class="note corp-note">Conferences, launches and team days.</p>
      <div class="corp-tiers">
        ${CORPORATE.map(([n, p, d]) => `<div class="ct"><div class="ct-n">${n}</div><div class="ct-p">${inr(p)}</div><div class="ct-d">${d}</div></div>`).join('')}
      </div>
    </div>
    <div class="corp-img">${pic('e_commercial', 56, 110)}</div>
  </div>
  ${foot}
</section>`

const rates = `
<section class="page">
  ${head(6, 'Rate card')}
  <div class="page-title">
    <div class="eyebrow ruby">05 — Rate card · <span class="ta-inline">விலைப் பட்டியல்</span></div>
    <h2 class="h1">Build your <em>own</em> coverage.</h2>
    <p class="lead narrow">Pick the crew you need, add what makes the day yours. We confirm the final quote with your family after the consultation.</p>
  </div>
  <div class="rc">
    <div class="rc-col">
      <div class="block-h">Crew <span>per person · per session (4–5 hrs)</span></div>
      ${rows(CREW)}
      <div class="rc-img">${pic('m_rec_hall', 124, 112)}</div>
    </div>
    <div class="rc-col">
      <div class="block-h">Add-ons <span>for the day itself</span></div>
      ${rows(ADDONS)}
      <div class="rc-img">${pic('m_decor_lights', 124, 88)}</div>
    </div>
  </div>
  <div class="gtk">
    <div class="block-h">Good to know</div>
    <div class="gtk-grid">
      <div><b>Venue</b><span>Home — no charge</span><span>Mahal / hall — + ${inr(3000)} <i>stage lighting kit & wide lenses</i></span></div>
      <div><b>Crowd size</b><span>Under 50 — no charge</span><span>50–150 — + ${inr(2500)}</span><span>150–400 — + ${inr(6000)} <i>+1 second photographer</i></span><span>400+ — + ${inr(12000)} <i>three-person team</i></span></div>
      <div><b>Travel</b><span>First 20 km — free</span><span>Beyond that — ${inr(40)} per km</span><b class="mt">Sessions</b><span>One session is 4–5 hours. Crew rates repeat for each session, up to four.</span></div>
    </div>
  </div>
  ${foot}
</section>`

const deliverables = `
<section class="page">
  ${head(7, 'Albums & prints')}
  <div class="dl-top">
    <div class="dl-img">${pic('m_album_open', 120, 168)}</div>
    <div class="dl-text">
      <div class="eyebrow ruby">06 — Albums & prints · <span class="ta-inline">ஆல்பங்கள் & அச்சுகள்</span></div>
      <h2 class="h1">Bound to <em>outlive</em> us.</h2>
      <p class="lead">You choose the photos, the cover, the paper and the typography. We design, print and deliver to your door.</p>
      <div class="block-h">Albums <span>one per booking</span></div>
      <div class="albums">
        ${ALBUMS.map(([s, p]) => `<div class="al"><b>${s}</b><span>${s === 25 ? 'up to 25' : s} sheets</span><em>${inr(p)}</em></div>`).join('')}
      </div>
    </div>
  </div>
  <div class="dl-bottom">
    <div>
      <div class="block-h">Frames <span>any quantity</span></div>
      <table class="frames">
        <thead><tr><th>Size</th><th>Classic</th><th>Premium<i>acrylic / glass</i></th></tr></thead>
        <tbody>${FRAMES.map(([s, a, b]) => `<tr><td>${s}</td><td>${inr(a)}</td><td>${inr(b)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="block-h mt">Prints</div>
      ${rows(PRINTS)}
    </div>
    <div>
      <div class="dl-mini">${pic('m_album_black', 120, 70)}</div>
      <div class="included">
        <div class="block-h">Included with every booking <span>no charge</span></div>
        ${INCLUDED.map(([n, d]) => `<div class="inc"><span class="tick">✦</span><div><b>${n}</b><span>${d}</span></div></div>`).join('')}
      </div>
    </div>
  </div>
  ${foot}
</section>`

const back = `
<section class="page dark ambient back">
  <div class="back-strip">
    ${pic('t_diya_glow', 62, 118)}${pic('m_hands_rings', 62, 118)}${pic('t_couple_garland', 62, 118)}${pic('m_couple_mist', 62, 118)}
  </div>
  <div class="back-process">
    <div class="eyebrow ruby-bright">07 — How it works · <span class="ta-inline">எப்படி செயல்படுகிறது</span></div>
    <h2 class="h2">From the first hello to an album your grandchildren will hold.</h2>
    <ol class="steps">${PROCESS.map(([t, d], i) => `<li><span class="sn">${String(i + 1).padStart(2, '0')}</span><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
  </div>
  <div class="back-districts">
    <div class="block-h light">We come to you <span>eight districts across Tamil Nadu</span></div>
    <div class="dists">${DISTRICTS.map(([n, d]) => `<div><b>${n}</b><span>${d}</span></div>`).join('')}</div>
  </div>
  <div class="back-cta">
    <div>
      <h2 class="h1">Let’s make something<br><em>worth treasuring.</em></h2>
      <p class="ta back-ta">போற்றிப் பாதுகாக்கும் நினைவுகளை உருவாக்குவோம்.</p>
      <p class="lead">Share your auspicious date with us. We’ll call your family within the day — to listen first, then plan together.</p>
    </div>
    <div class="contact">
      <div class="wm wm-lg">${BRAND}</div>
      <div class="c-row"><span>Call / WhatsApp</span><b>${STUDIO.phone}</b></div>
      <div class="c-row"><span>Email</span><b>${STUDIO.email}</b></div>
      <div class="c-row"><span>Studio</span><b>${STUDIO.address}</b></div>
      <div class="c-row"><span>Hours</span><b>${STUDIO.hours}</b></div>
    </div>
  </div>
  <p class="fineprint light back-fine">Prices in Indian rupees. Packages are a starting point — your final quote is confirmed after the family consultation.</p>
</section>`

// ─── Styles ──────────────────────────────────────────────────────────────────

const css = `
@page { size: 297mm 420mm; margin: 0; }
:root {
  --ink:#0a0a0b; --ink2:#141416; --ink3:#1f1f22; --paper:#fff; --mist:#f4f4f5; --smoke:#e7e7e9;
  --ruby:#9b111e; --ruby-deep:#6e0b1a; --ruby-bright:#c41e3a; --ruby-soft:#fbe9eb;
  --serif:'Cormorant Garamond','Times New Roman',serif; --sans:'Inter',system-ui,sans-serif; --ta:'Noto Serif Tamil',serif;
  --m:18mm;
}
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body { margin:0; padding:0; background:#d9d9dc; }
body { font-family:var(--sans); color:var(--ink); -webkit-font-smoothing:antialiased; }
@media screen { .page { margin:10mm auto; box-shadow:0 10px 40px rgba(0,0,0,.25); } }
@media print { html,body { background:#fff; } }
.page { width:297mm; height:420mm; position:relative; overflow:hidden; background:var(--paper); padding:30mm var(--m) 22mm; break-after:page; page-break-after:always; }
.page:last-child { break-after:auto; page-break-after:auto; }
.dark { background:var(--ink); color:#fff; }
.ambient { background:
  radial-gradient(55% 35% at 12% 0%, rgba(155,17,30,.42), transparent 70%),
  radial-gradient(45% 30% at 100% 70%, rgba(196,30,58,.20), transparent 70%), var(--ink); }
img { display:block; width:100%; height:100%; object-fit:cover; background:var(--smoke); }
.dark img { background:var(--ink3); }
em { font-style:italic; font-family:var(--serif); color:var(--ruby); }
.dark em { color:var(--ruby-bright); }

/* type */
.wm { font-family:var(--serif); font-weight:600; font-size:13pt; letter-spacing:-.01em; }
.wm-lg { font-size:17pt; }
.eyebrow { font-size:8pt; font-weight:600; letter-spacing:.24em; text-transform:uppercase; margin-bottom:5mm; }
.label { font-size:7.5pt; font-weight:600; letter-spacing:.18em; text-transform:uppercase; }
.ruby { color:var(--ruby); } .ruby-bright { color:var(--ruby-bright); }
.ta-inline { font-family:'Arima',var(--ta); letter-spacing:0; text-transform:none; font-weight:600; font-size:9pt; }
.ta { font-family:var(--ta); }
.hero { font-family:var(--serif); font-weight:500; font-size:122pt; line-height:.9; letter-spacing:-.025em; margin:0; }
.h1 { font-family:var(--serif); font-weight:500; font-size:50pt; line-height:1; letter-spacing:-.015em; margin:0; }
.h2 { font-family:var(--serif); font-weight:500; font-size:32pt; line-height:1.05; letter-spacing:-.01em; margin:0; }
.h3 { font-family:var(--serif); font-weight:600; font-size:21pt; line-height:1.15; margin:0; }
.lead { font-size:12.5pt; line-height:1.6; color:rgba(10,10,11,.68); margin:6mm 0 0; }
.dark .lead { color:rgba(255,255,255,.66); }
.lead.narrow { max-width:170mm; }
.body { font-size:10pt; line-height:1.7; color:rgba(10,10,11,.66); margin:5mm 0 0; }
.cap { display:block; font-size:7pt; letter-spacing:.14em; text-transform:uppercase; color:rgba(10,10,11,.5); margin-top:2.5mm; }
.fineprint { position:absolute; left:var(--m); right:var(--m); bottom:30mm; font-size:8pt; line-height:1.6; color:rgba(10,10,11,.5); margin:0; }
.fineprint.light, .dark .fineprint { color:rgba(255,255,255,.45); }

/* running head & foot */
.runhead { position:absolute; top:12mm; left:var(--m); right:var(--m); display:flex; justify-content:space-between; align-items:center; padding-bottom:3.5mm; border-bottom:.3mm solid rgba(10,10,11,.12); }
.dark .runhead { border-color:rgba(255,255,255,.14); }
.rh-right { display:flex; gap:6mm; align-items:center; font-size:7.5pt; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:rgba(10,10,11,.55); }
.dark .rh-right { color:rgba(255,255,255,.55); }
.pn { color:var(--ruby); font-size:9pt; } .dark .pn { color:var(--ruby-bright); }
.runfoot { position:absolute; bottom:11mm; left:var(--m); right:var(--m); display:flex; justify-content:space-between; font-size:7.5pt; letter-spacing:.06em; color:rgba(10,10,11,.45); padding-top:3.5mm; border-top:.3mm solid rgba(10,10,11,.12); }
.dark .runfoot { color:rgba(255,255,255,.42); border-color:rgba(255,255,255,.14); }

/* block headings & rate rows */
.block-h { font-size:8pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--ruby); padding-bottom:3mm; border-bottom:.5mm solid var(--ink); margin-bottom:1mm; display:flex; justify-content:space-between; align-items:baseline; gap:4mm; }
.block-h span { font-weight:500; letter-spacing:.06em; text-transform:none; color:rgba(10,10,11,.5); font-size:8.5pt; }
.block-h.small { border-bottom-width:.3mm; }
.block-h.light, .dark .block-h { color:var(--ruby-bright); border-color:rgba(255,255,255,.5); }
.block-h.light span, .dark .block-h span { color:rgba(255,255,255,.5); }
.mt { margin-top:8mm; }
.rate { display:flex; align-items:flex-end; gap:3mm; padding:3.6mm 0; border-bottom:.25mm solid rgba(10,10,11,.1); }
.rate-name { font-family:var(--serif); font-size:16pt; font-weight:600; line-height:1.1; }
.rate-note { font-size:8.5pt; color:rgba(10,10,11,.55); margin-top:1mm; }
.dots { flex:1; border-bottom:.35mm dotted rgba(10,10,11,.25); margin-bottom:2mm; }
.rate-price { font-family:var(--serif); font-size:18pt; font-weight:600; color:var(--ruby); white-space:nowrap; }

/* 1 · cover */
.cover { padding:0; }
.bleed { position:absolute; top:0; left:0; width:100%; height:300mm; object-position:50% 20%; }
.cover-shade { position:absolute; inset:0; background:
  linear-gradient(180deg, rgba(10,10,11,.7) 0%, rgba(10,10,11,0) 16%, rgba(10,10,11,0) 40%, rgba(10,10,11,.85) 62%, var(--ink) 72%),
  radial-gradient(70% 40% at 0% 100%, rgba(155,17,30,.5), transparent 70%); }
.cover-top { position:absolute; top:16mm; left:var(--m); right:var(--m); display:flex; justify-content:space-between; align-items:center; color:#fff; }
.cover-top .label { color:rgba(255,255,255,.7); }
.cover-body { position:absolute; left:var(--m); right:var(--m); bottom:36mm; }
.cover-ta { font-size:20pt; color:rgba(255,255,255,.82); margin:7mm 0 0; font-weight:500; }
.cover-rule { width:30mm; height:.6mm; background:var(--ruby-bright); margin:9mm 0 0; }
.cover-lead { max-width:175mm; font-size:13.5pt; color:rgba(255,255,255,.75); }
.cover-foot { position:absolute; bottom:16mm; left:var(--m); right:var(--m); display:flex; gap:5mm; align-items:center; font-size:8pt; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.6); padding-top:5mm; border-top:.3mm solid rgba(255,255,255,.2); }
.cover-foot i { color:var(--ruby-bright); font-style:normal; font-size:7pt; }

/* 2 · studio */
.studio-top { display:grid; grid-template-columns:1fr 118mm; gap:14mm; }
.studio-text { padding-top:8mm; }
.studio-text .h1 { font-size:54pt; }
.studio-img img { height:178mm; }
.stats { margin:12mm calc(-1 * var(--m)) 0; padding:10mm var(--m); background:var(--ink); color:#fff; display:grid; grid-template-columns:repeat(4,1fr);
  background:radial-gradient(60% 120% at 0% 0%, rgba(155,17,30,.55), transparent 70%), var(--ink); }
.stats div { border-left:.3mm solid rgba(255,255,255,.18); padding-left:6mm; }
.stats div:first-child { border:0; padding-left:0; }
.stats b { display:block; font-family:var(--serif); font-weight:500; font-size:46pt; line-height:1; }
.stats sup { color:var(--ruby-bright); font-size:24pt; vertical-align:top; margin-left:1mm; }
.stats span { display:block; margin-top:3mm; font-size:7.5pt; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.55); }
.tradition { display:grid; grid-template-columns:130mm 1fr; gap:12mm; margin-top:12mm; }
.trad-imgs { display:grid; grid-template-columns:1fr 1fr; gap:5mm; }
.trad-imgs img { height:120mm; }
.trad-imgs img:last-child { margin-top:12mm; height:108mm; }
.trad-text { padding-top:2mm; }
blockquote { margin:8mm 0 0; padding-left:6mm; border-left:.8mm solid var(--ruby); font-family:var(--serif); font-style:italic; font-size:17pt; line-height:1.3; }
cite { display:block; margin-top:3mm; font-family:var(--sans); font-style:normal; font-size:7.5pt; letter-spacing:.14em; text-transform:uppercase; color:rgba(10,10,11,.5); }

/* 3 · events */
.page-title { margin-bottom:8mm; }
.ev-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6mm 7mm; }
.ev-img { height:66mm; overflow:hidden; }
.ev-meta { padding-top:3.5mm; }
.ev-name { font-family:var(--serif); font-size:19pt; font-weight:600; line-height:1.05; }
.ev-ta { font-size:9pt; color:var(--ruby); margin-top:1mm; }
.ev-blurb { font-size:8.5pt; color:rgba(10,10,11,.58); margin-top:1.5mm; line-height:1.45; }
.ev-from { margin-top:2.5mm; font-size:7.5pt; letter-spacing:.14em; text-transform:uppercase; color:rgba(10,10,11,.5); }
.ev-from b { font-family:var(--serif); font-size:14pt; letter-spacing:0; color:var(--ink); text-transform:none; margin-left:1mm; }

/* 4 · packages */
.pk-hero { position:relative; height:74mm; overflow:hidden; }
.pk-hero-shade { position:absolute; inset:0; background:linear-gradient(90deg, rgba(10,10,11,.92) 0%, rgba(10,10,11,.55) 55%, rgba(10,10,11,.1) 100%); }
.pk-hero-text { position:absolute; left:10mm; bottom:9mm; right:60mm; }
.pk-hero-text .eyebrow { margin-bottom:3mm; }
.sub { margin:4mm 0 0; font-size:9pt; color:rgba(255,255,255,.6); letter-spacing:.04em; }
.tiers { display:grid; grid-template-columns:repeat(3,1fr); gap:6mm; margin-top:8mm; }
.tier { position:relative; border:.3mm solid rgba(255,255,255,.16); background:rgba(255,255,255,.035); padding:8mm 7mm 7mm; }
.tier-pop { background:linear-gradient(180deg, var(--ruby) 0%, var(--ruby-deep) 100%); border-color:var(--ruby-bright); }
.badge { position:absolute; top:-3.2mm; right:6mm; background:#fff; color:var(--ruby); font-size:6.8pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; padding:1.6mm 3mm; }
.tier-name { font-size:8pt; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.7); }
.tier-price { font-family:var(--serif); font-size:40pt; font-weight:500; line-height:1; margin-top:3mm; }
.tier-unit { font-size:7.5pt; color:rgba(255,255,255,.5); margin-top:1.5mm; letter-spacing:.04em; }
.tier-pop .tier-unit { color:rgba(255,255,255,.72); }
.tier-pitch { font-family:var(--serif); font-style:italic; font-size:13pt; line-height:1.3; color:rgba(255,255,255,.85); margin:5mm 0 4mm; min-height:11mm; }
.tier ul { list-style:none; margin:0; padding:0; }
.tier li { font-size:9pt; line-height:1.35; padding:1.9mm 0 1.9mm 5mm; border-top:.25mm solid rgba(255,255,255,.1); position:relative; }
.tier li::before { content:'✦'; position:absolute; left:0; top:2.1mm; font-size:6pt; color:var(--ruby-bright); }
.tier-pop li::before { color:#fff; }
.tier-incl-h { margin-top:4mm; font-size:6.8pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.5); }
.tier ul.incl li { font-size:8pt; color:rgba(255,255,255,.62); padding:1.2mm 0 1.2mm 5mm; border:0; }
.tier ul.incl li::before { content:'—'; font-size:8pt; top:1.1mm; color:rgba(255,255,255,.4); }
.tier-sm { padding:6mm 6mm 5mm; }
.tier-sm .tier-price { font-size:30pt; }
.tier-sm .tier-pitch { font-size:11pt; min-height:9mm; margin:3mm 0 2mm; }
.tier-sm li { font-size:8.5pt; padding:1.4mm 0 1.4mm 5mm; }
.pk-sub { margin-top:11mm; }
.pk-sub .eyebrow { margin-bottom:2mm; }

/* 5 · specials */
.sp-grid { display:grid; grid-template-columns:128mm 1fr; gap:11mm; }
.sp-imgs { display:grid; grid-template-columns:1fr 1fr; gap:4mm; }
.sp-a { grid-column:1 / -1; } .sp-a img { height:112mm; }
.sp-b img, .sp-c img { height:80mm; }
.cap.light { color:rgba(10,10,11,.5); }
.upgrade { margin-top:7mm; padding:5mm 5mm 4mm; background:var(--ruby-soft); }
.up { display:grid; grid-template-columns:22mm 1fr auto; gap:3mm; align-items:baseline; padding:2.4mm 0; border-bottom:.25mm solid rgba(155,17,30,.15); font-size:9pt; }
.up b { font-size:7.5pt; letter-spacing:.18em; text-transform:uppercase; color:var(--ruby); }
.up span { color:rgba(10,10,11,.7); }
.up em { font-style:normal; font-family:var(--serif); font-weight:600; font-size:15pt; color:var(--ruby); }
.note { margin:3mm 0 0; font-size:8pt; color:rgba(10,10,11,.55); }
.corp { display:grid; grid-template-columns:92mm 1fr 56mm; gap:8mm; margin-top:12mm; align-items:stretch; }
.corp-img img { height:110mm; }
.cover-eyebrow { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,.8); }
.corp-note { margin:2mm 0 2mm; }
.corp-tiers { display:grid; gap:0; }
.ct { display:grid; grid-template-columns:1fr auto; gap:1mm 4mm; align-items:baseline; padding:3.6mm 0; border-bottom:.25mm solid rgba(10,10,11,.1); }
.ct-n { font-size:7.5pt; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:rgba(10,10,11,.55); }
.ct-p { font-family:var(--serif); font-size:19pt; font-weight:600; color:var(--ruby); }
.ct-d { grid-column:1 / -1; font-size:8.5pt; color:rgba(10,10,11,.6); }

/* 6 · rates */
.rc { display:grid; grid-template-columns:1fr 1fr; gap:13mm; }
.rc-img { margin-top:7mm; }
.rc-col:first-child .rc-img img { height:112mm; }
.rc-col:last-child .rc-img img { height:88mm; }
.gtk { margin-top:10mm; }
.gtk-grid { display:grid; grid-template-columns:1fr 1.25fr 1.2fr; gap:9mm; margin-top:4mm; }
.gtk-grid b { display:block; font-family:var(--serif); font-size:15pt; font-weight:600; margin-bottom:2mm; }
.gtk-grid b.mt { margin-top:5mm; }
.gtk-grid span { display:block; font-size:9pt; line-height:1.5; color:rgba(10,10,11,.72); padding:1.1mm 0; }
.gtk-grid i { display:block; font-style:normal; font-size:7.8pt; color:rgba(10,10,11,.48); }

/* 7 · deliverables */
.dl-top { display:grid; grid-template-columns:120mm 1fr; gap:12mm; }
.dl-img img { height:168mm; }
.dl-text .lead { margin-bottom:9mm; }
.albums { display:grid; grid-template-columns:repeat(3,1fr); gap:3mm; margin-top:4mm; }
.al { border:.3mm solid rgba(10,10,11,.14); padding:4mm 4mm 3.5mm; }
.al b { display:block; font-family:var(--serif); font-size:30pt; font-weight:500; line-height:1; }
.al span { display:block; font-size:7.2pt; letter-spacing:.16em; text-transform:uppercase; color:rgba(10,10,11,.5); margin-top:1.5mm; }
.al em { display:block; font-style:normal; font-family:var(--serif); font-size:16pt; font-weight:600; color:var(--ruby); margin-top:2.5mm; }
.al:nth-child(4) { background:var(--ink); color:#fff; border-color:var(--ink); }
.al:nth-child(4) span { color:rgba(255,255,255,.55); } .al:nth-child(4) em { color:var(--ruby-bright); }
.dl-bottom { display:grid; grid-template-columns:1fr 120mm; gap:12mm; margin-top:11mm; }
.frames { width:100%; border-collapse:collapse; margin-top:1mm; }
.frames th { text-align:left; font-size:7.5pt; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(10,10,11,.5); padding:2.5mm 0; border-bottom:.25mm solid rgba(10,10,11,.15); vertical-align:bottom; }
.frames th i { display:block; font-style:normal; font-weight:500; letter-spacing:.04em; text-transform:none; font-size:7.5pt; }
.frames td { padding:2.8mm 0; border-bottom:.25mm solid rgba(10,10,11,.1); font-family:var(--serif); font-size:15pt; font-weight:600; }
.frames td:not(:first-child) { color:var(--ruby); }
.frames td:first-child { font-family:var(--sans); font-size:9.5pt; font-weight:500; }
.dl-mini img { height:70mm; }
.included { margin-top:7mm; background:var(--ink); color:#fff; padding:6mm; }
.included .block-h { color:var(--ruby-bright); border-color:rgba(255,255,255,.4); }
.included .block-h span { color:rgba(255,255,255,.5); }
.inc { display:flex; gap:3.5mm; padding:2.6mm 0; border-bottom:.25mm solid rgba(255,255,255,.1); }
.inc:last-child { border:0; }
.tick { color:var(--ruby-bright); font-size:7pt; padding-top:1.2mm; }
.inc b { display:block; font-family:var(--serif); font-size:14pt; font-weight:600; }
.inc span { display:block; font-size:8pt; color:rgba(255,255,255,.55); margin-top:.5mm; }

/* 8 · back */
.back { padding-top:0; }
.back-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:4mm; margin:0 calc(-1 * var(--m)); padding:0; }
.back-strip img { height:118mm; filter:saturate(.9); }
.back-process { margin-top:14mm; }
.back-process .h2 { max-width:200mm; }
.steps { list-style:none; padding:0; margin:9mm 0 0; display:grid; grid-template-columns:repeat(5,1fr); gap:5mm; }
.steps li { border-top:.5mm solid var(--ruby-bright); padding-top:4mm; }
.sn { display:block; font-family:var(--serif); font-size:24pt; color:var(--ruby-bright); line-height:1; }
.steps b { display:block; font-family:var(--serif); font-size:14.5pt; font-weight:600; margin-top:3mm; line-height:1.1; }
.steps li > span:last-child { display:block; font-size:8.3pt; line-height:1.5; color:rgba(255,255,255,.58); margin-top:2mm; }
.back-districts { margin-top:14mm; }
.dists { display:grid; grid-template-columns:repeat(4,1fr); gap:4mm 6mm; margin-top:4mm; }
.dists b { display:block; font-family:var(--serif); font-size:16pt; font-weight:600; }
.dists span { display:block; font-size:7.8pt; color:rgba(255,255,255,.5); margin-top:.5mm; }
.dists div:first-child b { color:var(--ruby-bright); }
.back-cta { position:absolute; left:var(--m); right:var(--m); bottom:36mm; display:grid; grid-template-columns:1fr 104mm; gap:12mm; align-items:end; padding-top:10mm; border-top:.3mm solid rgba(255,255,255,.16); }
.back-cta .h1 { font-size:46pt; }
.back-ta { font-size:13pt; color:rgba(255,255,255,.75); margin:5mm 0 0; }
.back-cta .lead { font-size:11pt; margin-top:4mm; }
.contact { background:#fff; color:var(--ink); padding:8mm 7mm 6mm; }
.contact .wm { margin-bottom:4mm; display:block; }
.c-row { padding:2.5mm 0; border-top:.25mm solid rgba(10,10,11,.1); }
.c-row span { display:block; font-size:6.8pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--ruby); }
.c-row b { display:block; font-size:10pt; font-weight:600; margin-top:.8mm; }
.back-fine { bottom:14mm; }
`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRAND} — Catalogue</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Tamil:wght@400;500;600;700&family=Arima:wght@400;500;600;700&display=block" rel="stylesheet">
<style>${css}</style>
</head>
<body>
${cover}${studio}${events}${packages}${specials}${rates}${deliverables}${back}
</body>
</html>`

writeFileSync(fileURLToPath(new URL('./catalogue.html', import.meta.url)), html)
console.log('catalogue.html written')
