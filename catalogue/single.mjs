// Builds the one-sheet A3 catalogue (single.html). Same data and look as build.mjs.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const IMG = {
  m_couple_bokeh: '1722952934708-749c22eb2e58',
  t_ritual_garland: '1647949940712-bfcf82015d9b',
  m_ring_hands: '1529519195486-16945f0fb37f',
  m_rec_stage: '1587271407850-8d438ca9fdf2',
  m_haldi_seated: '1703044412425-b1977e3f793f',
  m_baby_smile: '1649880210584-3365f4c4c08b',
  m_baby_wrap: '1610901137736-d7cc46657b11',
  m_bday_girl: '1544155892-b2b6c64204fc',
  m_mehndi_hands: '1619734089700-842e56497353',
  m_baby_hat: '1610901158532-d246c011729e',
  m_couple_pinksky: '1631621583126-ed10a80f62b1',
  e_corporate: '1775113586139-b583cc93517f',
  m_album_open: '1784722237781-88d640eee061',
}
const img = (key, wmm, hmm) =>
  `<img src="https://images.unsplash.com/photo-${IMG[key]}?w=${Math.round(wmm * 6)}&h=${Math.round(hmm * 6)}&fit=crop&crop=faces,entropy&q=82&auto=format" alt="">`
const inr = n => '₹' + n.toLocaleString('en-IN')

const BRAND = 'The Treasure Capture Events'
const STUDIO = { phone: '+91 98940 12345', email: 'hello@treasurecaptureevents.in', address: '14, West Masi Street, Madurai 625001', hours: 'Mon–Sat · 9:30 am – 8 pm' }

const EVENTS = [
  ['Wedding', 'திருமணம்', 't_ritual_garland'], ['Engagement', 'நிச்சயதார்த்தம்', 'm_ring_hands'], ['Reception', 'வரவேற்பு', 'm_rec_stage'],
  ['Puberty ceremony', 'மஞ்சள் நீராட்டு', 'm_haldi_seated'], ['Ear piercing', 'காதுகுத்து', 'm_baby_smile'], ['Naming', 'பெயர் சூட்டு', 'm_baby_wrap'],
  ['Birthday', 'பிறந்தநாள்', 'm_bday_girl'], ['Baby shower', 'வளைகாப்பு', 'm_mehndi_hands'], ['Baby shoot', 'குழந்தை', 'm_baby_hat'],
  ['Couple shoots', 'ஜோடி', 'm_couple_pinksky'], ['Corporate', 'நிறுவனம்', 'e_corporate'],
]
const FAMILY = [
  { n: 'Basic', p: 33000, d: 'Traditional photo and video with a 30-sheet album.', i: ['Traditional photographer', 'Traditional videographer', 'Album · 30 sheets'] },
  { n: 'Standard', p: 52200, pop: true, d: 'Adds a candid photographer, a bigger album and a frame.', i: ['Traditional photographer', 'Traditional videographer', 'Candid photographer', 'Album · 40 sheets', 'Frame · 16×24 in'] },
  { n: 'Premium', p: 88500, d: 'All four cameras, drone, highlight film and the full print set.', i: ['Traditional photo + video', 'Candid photo + video', 'Drone coverage', 'Album · 50 sheets', 'Frame · 24×36 in', 'Printed magazine'] },
]
const MATERNITY = [['Basic', 8000, 'One photographer'], ['Standard', 23500, 'Traditional + candid, mini book'], ['Premium', 51200, 'Photo, candid video, album, frame']]
const CORPORATE = [['Basic', 8000, 'Event photography'], ['Standard', 18000, 'Photo + full-length video'], ['Premium', 68000, 'Four cameras, drone, LED wall']]
const CREW = [['Traditional photography', 8000], ['Traditional videography', 10000], ['Candid photography', 12000], ['Candid videography', 20000]]
const ADDONS = [['Drone coverage', 6000], ['E-invite', 1500], ['LED wall · 6×8 ft', 12000], ['Photo booth', 12000], ['360° selfie booth', 14000]]
const SPECIAL = [['Pre / post-wedding', 15000], ['Outdoor couple', 6000], ['Outdoor baby', 5000], ['Outdoor maternity', 5000], ['Model portfolio', 12000], ['Commercial / ad', 18000]]
const ALBUMS = [[25, 10000], [30, 15000], [35, 17500], [40, 20000], [50, 25000], [60, 30000]]
const FRAMES = [['12×18', 1200, 1900], ['16×24', 2200, 3500], ['20×30', 3500, 5600], ['24×36', 5000, 8000]]
const PRINTS = [['Magazine', 2500], ['Mini book', 3500], ['Calendar', 1500]]
const PROCESS = ['Share your date', 'Meet as family', 'The day', 'Pick favourites', 'Your album']

const rows = list => list.map(([n, p]) => `<div class="r"><span>${n}</span><i></i><b>${inr(p)}</b></div>`).join('')
const h = (t, s = '') => `<div class="bh">${t}${s ? `<span>${s}</span>` : ''}</div>`

const body = `
<section class="page">
  <header class="hero">
    <div class="hero-img">${img('m_couple_bokeh', 140, 108)}</div>
    <div class="hero-text">
      <div class="top"><span class="wm">${BRAND}</span></div>
      <div class="eyebrow">Madurai · Est. 2018 · Eight districts</div>
      <h1>Moments, <em>treasured</em> forever.</h1>
      <p class="ta">காலத்தால் அழியாத நினைவுகள்.</p>
      <p class="lead">Wedding, ceremony and portrait photography across Tamil Nadu — documented quietly, edited with care, bound into albums built to outlive us.</p>
      <div class="stats">
        <div><b>1,400<sup>+</sup></b><span>Events</span></div>
        <div><b>8</b><span>Districts</span></div>
        <div><b>960<sup>+</sup></b><span>Albums</span></div>
        <div><b>4.9<sup>★</sup></b><span>Google</span></div>
      </div>
    </div>
  </header>

  <div class="events">
    ${EVENTS.map(([n, ta, k]) => `<figure>${img(k, 22, 26)}<figcaption>${n}<small>${ta}</small></figcaption></figure>`).join('')}
  </div>

  <div class="sec-title"><span class="num">01</span><h2>Wedding & family <em>packages</em></h2><p>Wedding · Engagement · Reception · Puberty · Ear piercing · Naming · Birthday</p></div>
  <div class="tiers">
    ${FAMILY.map(t => `
      <div class="tier ${t.pop ? 'pop' : ''}">
        ${t.pop ? '<span class="badge">Most chosen</span>' : ''}
        <div class="tn">${t.n}</div><div class="tp">${inr(t.p)}</div>
        <p class="td">${t.d}</p>
        <ul>${t.i.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>`).join('')}
  </div>
  <p class="incl">Every package includes all photos and edited photos as soft copies, the 2-hour traditional video on pendrive, and — with candid video — a 3–4 minute highlight film. Prices are for one session (4–5 hours).</p>

  <div class="cols">
    <div>
      <div class="blk">${h('02 · Baby & maternity', 'valaikappu, newborn')}
      ${MATERNITY.map(([n, p, d]) => `<div class="mt"><b>${n}</b><span>${d}</span><em>${inr(p)}</em></div>`).join('')}</div>
      <div class="blk">${h('05 · Crew', 'per person · per session')}${rows(CREW)}</div>
      <div class="blk">${h('08 · Albums', 'one per booking')}
      <div class="albums">${ALBUMS.map(([s, p]) => `<div><b>${s}</b><span>sheets</span><em>${inr(p)}</em></div>`).join('')}</div></div>
    </div>
    <div>
      <div class="blk">${h('03 · Corporate events', 'launches, conferences')}
      ${CORPORATE.map(([n, p, d]) => `<div class="mt"><b>${n}</b><span>${d}</span><em>${inr(p)}</em></div>`).join('')}</div>
      <div class="blk">${h('06 · Add-ons', 'for the day')}${rows(ADDONS)}</div>
      <div class="blk">${h('09 · Frames', 'classic · premium acrylic')}
      <table>${FRAMES.map(([s, a, b]) => `<tr><td>${s} in</td><td>${inr(a)}</td><td>${inr(b)}</td></tr>`).join('')}</table></div>
    </div>
    <div>
      <div class="blk">${h('04 · Special shoots', 'per shoot')}${rows(SPECIAL)}</div>
      <div class="blk">${h('07 · Prints', 'any quantity')}${rows(PRINTS)}</div>
      <div class="gtk"><b>Good to know</b>Mahal / hall + ${inr(3000)} · Crowd 50–150 + ${inr(2500)}, 150–400 + ${inr(6000)}, 400+ + ${inr(12000)} · Travel free up to 20 km, then ${inr(40)}/km · Extra sessions repeat the crew rates.</div>
      <div class="side-img">${img('m_album_open', 84, 40)}</div>
    </div>
  </div>

  <footer class="foot">
    <div class="steps">${PROCESS.map((s, i) => `<div><span>0${i + 1}</span>${s}</div>`).join('')}</div>
    <div class="cta">
      <div>
        <h2>Let’s make something <em>worth treasuring.</em></h2>
        <p>Madurai · Chennai · Coimbatore · Thanjavur · Salem · Tirunelveli · Theni · Dindigul</p>
      </div>
      <div class="contact">
        <div><span>Call / WhatsApp</span><b>${STUDIO.phone}</b></div>
        <div><span>Email</span><b>${STUDIO.email}</b></div>
        <div><span>Studio · ${STUDIO.hours}</span><b>${STUDIO.address}</b></div>
      </div>
    </div>
    <p class="fine">Prices in Indian rupees. Packages are a starting point — your final quote is confirmed after the family consultation.</p>
  </footer>
</section>`

const css = `
@page { size:297mm 420mm; margin:0; }
:root { --ink:#0a0a0b; --ink3:#1f1f22; --smoke:#e7e7e9; --ruby:#9b111e; --ruby-deep:#6e0b1a; --ruby-bright:#c41e3a; --ruby-soft:#fbe9eb;
  --serif:'Cormorant Garamond',serif; --sans:'Inter',system-ui,sans-serif; --ta:'Noto Serif Tamil',serif; --m:14mm; }
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html,body { margin:0; background:#d9d9dc; font-family:var(--sans); color:var(--ink); -webkit-font-smoothing:antialiased; }
@media screen { .page { margin:10mm auto; box-shadow:0 10px 40px rgba(0,0,0,.25); } }
@media print { html,body { background:#fff; } }
.page { width:297mm; height:420mm; overflow:hidden; position:relative; background:#fff; }
img { display:block; width:100%; height:100%; object-fit:cover; background:var(--smoke); }
em { font-family:var(--serif); font-style:italic; color:var(--ruby); }

/* hero */
.hero { position:relative; height:108mm; display:grid; grid-template-columns:1fr 140mm; color:#fff;
  background:radial-gradient(70% 80% at 0% 0%, rgba(155,17,30,.55), transparent 70%), var(--ink); }
.hero-img { order:2; position:relative; }
.hero-img::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg, var(--ink) 0%, rgba(10,10,11,0) 30%); }
.hero-text { padding:10mm var(--m) 8mm; display:flex; flex-direction:column; }
.wm { font-family:var(--serif); font-weight:600; font-size:15pt; }
.eyebrow { margin-top:auto; font-size:7pt; font-weight:600; letter-spacing:.24em; text-transform:uppercase; color:var(--ruby-bright); }
.hero h1 { font-family:var(--serif); font-weight:500; font-size:44pt; line-height:.95; letter-spacing:-.02em; margin:3mm 0 0; }
.hero em { color:var(--ruby-bright); }
.hero .ta { font-family:var(--ta); font-size:12pt; color:rgba(255,255,255,.8); margin:3mm 0 0; }
.hero .lead { font-size:8.5pt; line-height:1.55; color:rgba(255,255,255,.62); margin:3mm 0 0; max-width:120mm; }
.stats { display:grid; grid-template-columns:repeat(4,1fr); margin-top:5mm; padding-top:4mm; border-top:.3mm solid rgba(255,255,255,.18); }
.stats b { display:block; font-family:var(--serif); font-weight:500; font-size:21pt; line-height:1; }
.stats sup { color:var(--ruby-bright); font-size:11pt; }
.stats span { display:block; font-size:6pt; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.5); margin-top:1mm; }

/* events strip */
.events { display:grid; grid-template-columns:repeat(11,1fr); gap:2mm; padding:5mm var(--m) 0; }
.events figure { margin:0; }
.events img { height:22mm; }
.events figcaption { font-family:var(--serif); font-weight:600; font-size:8.5pt; line-height:1.1; margin-top:1.5mm; }
.events small { display:block; font-family:var(--ta); font-weight:500; font-size:6pt; color:var(--ruby); margin-top:.5mm; }

/* packages */
.sec-title { display:flex; align-items:baseline; gap:4mm; padding:5mm var(--m) 0; }
.num { font-family:var(--serif); font-size:16pt; color:var(--ruby); }
.sec-title h2 { font-family:var(--serif); font-weight:500; font-size:24pt; margin:0; letter-spacing:-.01em; }
.sec-title p { margin:0 0 0 auto; font-size:7pt; color:rgba(10,10,11,.5); letter-spacing:.04em; }
.tiers { display:grid; grid-template-columns:repeat(3,1fr); gap:4mm; padding:4mm var(--m) 0; }
.tier { position:relative; background:var(--ink); color:#fff; padding:5mm 5mm 4mm; }
.tier.pop { background:linear-gradient(180deg, var(--ruby), var(--ruby-deep)); }
.badge { position:absolute; top:-2.4mm; right:4mm; background:#fff; color:var(--ruby); font-size:5.5pt; font-weight:700; letter-spacing:.2em; text-transform:uppercase; padding:1.2mm 2.4mm; border:.3mm solid var(--ruby); }
.tn { font-size:6.5pt; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.65); }
.tp { font-family:var(--serif); font-size:27pt; font-weight:500; line-height:1; margin-top:1.5mm; }
.td { font-family:var(--serif); font-style:italic; font-size:9.5pt; line-height:1.25; color:rgba(255,255,255,.82); margin:2mm 0 2mm; min-height:8mm; }
.tier ul { list-style:none; margin:0; padding:0; columns:2; column-gap:3mm; }
.tier li { font-size:7pt; line-height:1.3; padding:.9mm 0 .9mm 3.5mm; position:relative; break-inside:avoid; }
.tier li::before { content:'✦'; position:absolute; left:0; top:1.1mm; font-size:4.5pt; color:var(--ruby-bright); }
.tier.pop li::before { color:#fff; }
.incl { margin:2.5mm var(--m) 0; font-size:7pt; line-height:1.5; color:rgba(10,10,11,.55); }

/* blocks */
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8mm; padding:6mm var(--m) 0; }
.grid3.rc { padding-top:5mm; }
.bh { font-size:6.8pt; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--ruby); padding-bottom:1.8mm; border-bottom:.45mm solid var(--ink); display:flex; justify-content:space-between; align-items:baseline; gap:2mm; }
.bh span { font-weight:500; letter-spacing:.03em; text-transform:none; color:rgba(10,10,11,.45); font-size:6.5pt; }
.r { display:flex; align-items:baseline; gap:2mm; padding:1.25mm 0; border-bottom:.2mm solid rgba(10,10,11,.09); }
.r span { font-family:var(--serif); font-size:10.5pt; font-weight:600; white-space:nowrap; }
.r i { flex:1; border-bottom:.3mm dotted rgba(10,10,11,.25); }
.r b { font-family:var(--serif); font-size:11pt; font-weight:600; color:var(--ruby); }
.mt { display:grid; grid-template-columns:15mm 1fr auto; gap:2mm; align-items:baseline; padding:1.5mm 0; border-bottom:.2mm solid rgba(10,10,11,.09); }
.mt b { font-size:6pt; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(10,10,11,.55); }
.mt span { font-size:7pt; color:rgba(10,10,11,.65); line-height:1.3; }
.mt em { font-style:normal; font-family:var(--serif); font-weight:600; font-size:12.5pt; color:var(--ruby); }
.gtk { margin-top:3mm; background:var(--ruby-soft); padding:2.5mm 3mm; font-size:6.6pt; line-height:1.5; color:rgba(10,10,11,.72); }
.gtk b { display:block; font-size:6pt; letter-spacing:.18em; text-transform:uppercase; color:var(--ruby); margin-bottom:.6mm; }

.cols { display:grid; grid-template-columns:repeat(3,1fr); gap:8mm; padding:5mm var(--m) 0; }
.blk + .blk { margin-top:4.5mm; }
.cols .gtk { margin-top:4.5mm; }
.side-img { margin-top:4.5mm; } .side-img img { height:40mm; }
/* deliverables */
.dl { display:grid; grid-template-columns:52mm 1fr 78mm; gap:8mm; padding:6mm var(--m) 0; }
.dl-img img { height:46mm; }
.albums { display:grid; grid-template-columns:repeat(3,1fr); gap:2mm; margin-top:2.5mm; }
.albums div { border:.25mm solid rgba(10,10,11,.14); padding:2mm 2.5mm; display:grid; grid-template-columns:auto 1fr; column-gap:1.5mm; align-items:baseline; }
.albums b { font-family:var(--serif); font-weight:500; font-size:17pt; line-height:1; }
.albums span { font-size:5.5pt; letter-spacing:.14em; text-transform:uppercase; color:rgba(10,10,11,.5); }
.albums em { grid-column:1 / -1; font-style:normal; font-family:var(--serif); font-weight:600; font-size:11pt; color:var(--ruby); }
.albums div:nth-child(4) { background:var(--ink); color:#fff; border-color:var(--ink); }
.albums div:nth-child(4) span { color:rgba(255,255,255,.55); } .albums div:nth-child(4) em { color:var(--ruby-bright); }
table { width:100%; border-collapse:collapse; margin-top:1mm; }
td { padding:1.5mm 0; border-bottom:.2mm solid rgba(10,10,11,.09); font-family:var(--serif); font-weight:600; font-size:11pt; color:var(--ruby); }
td:first-child { font-family:var(--sans); font-weight:500; font-size:7.5pt; color:var(--ink); }

/* footer */
.foot { position:absolute; left:0; right:0; bottom:0; height:50mm; color:#fff; padding:6mm var(--m) 0;
  background:radial-gradient(60% 120% at 100% 100%, rgba(155,17,30,.5), transparent 70%), var(--ink); }
.steps { display:grid; grid-template-columns:repeat(5,1fr); gap:3mm; }
.steps div { border-top:.4mm solid var(--ruby-bright); padding-top:1.8mm; font-family:var(--serif); font-size:10.5pt; font-weight:600; }
.steps span { color:var(--ruby-bright); margin-right:2mm; }
.cta { display:grid; grid-template-columns:1fr 104mm; gap:8mm; margin-top:4.5mm; align-items:start; }
.cta h2 { font-family:var(--serif); font-weight:500; font-size:22pt; line-height:1.02; margin:0; }
.cta em { color:var(--ruby-bright); }
.cta p { margin:3mm 0 0; font-size:7pt; letter-spacing:.06em; color:rgba(255,255,255,.55); line-height:1.5; }
.contact { background:#fff; color:var(--ink); padding:2.5mm 4mm; }
.contact div { padding:1mm 0; border-bottom:.2mm solid rgba(10,10,11,.1); }
.contact div:last-child { border:0; }
.contact span { display:block; font-size:5.5pt; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--ruby); }
.contact b { display:block; font-size:8.5pt; font-weight:600; margin-top:.3mm; }
.fine { position:absolute; bottom:4mm; left:var(--m); margin:0; font-size:6pt; color:rgba(255,255,255,.4); }
`

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRAND} — One-sheet catalogue</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Tamil:wght@400;500;600;700&display=block" rel="stylesheet">
<style>${css}</style></head><body>${body}</body></html>`

writeFileSync(fileURLToPath(new URL('./single.html', import.meta.url)), html)
console.log('single.html written')
