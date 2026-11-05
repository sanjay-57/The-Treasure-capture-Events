# Invite art: Gemini prompts

Every story design already works with drawn SVG art. The assets below are optional upgrades. Each one drops into `public/invite/<theme>/` and is wired by a single line in `ASSETS` in `src/pages/invite/story/theme.ts`.

| Slot | File | Size | Where it shows |
|---|---|---|---|
| `frame` | `frame.webp` | 9:16, 1080×1920 | Behind the names on the story hero and the single card (replaces the drawn blooms) |
| `openerVideo` | `open.mp4` | 9:16, 6–8 s | Plays on tap instead of the CSS opener |
| `opener` | `open.webp` | 9:16 | Poster frame for the clip (first frame of the video) |
| `venue` | `venue.webp` | 4:3 | Venue section (replaces the line-drawn mandapam) |

**Priority:** frames first (biggest visual jump), then opener videos, then venues.

**Rules for every prompt:**
- No text, letters, numbers, logos or watermarks. Names are set by the app.
- Keep the centre ~60% of the frame **empty, flat paper**. Ornament stays in the corners and edges.
- For videos: a locked camera for the first second, then a slow push-in. The final frame should be bright and soft, because the page fades in over it.

Send me the raw files. I'll compress them (webp, h264 under 3 MB) and wire them in.

---

## Frames (Gemini image, 9:16)

Append this to every frame prompt:
> Vertical 9:16 wedding invitation background, 3D layered paper-craft illustration, soft studio light, shallow depth, crisp edges with subtle paper shadows, ornament only in the corners and borders, large empty smooth paper area in the centre for text, no text, no letters, no watermark.

1. **athangudi · Chettinad Doors**: Ivory lime-plaster card bordered with Athangudi tile patterns in ochre, teal and terracotta. Paper-craft marigold and jasmine garlands spill from the top-left and bottom-right corners, with a thin carved-teak edge and brass studs.
2. **kanjivaram · Kanjivaram Silk**: Deep magenta Kanjivaram silk texture with a wide gold zari temple border (a row of small temple-gopuram triangles) along the bottom. Jasmine strands and paper roses in the corners, with a soft sheen on the silk.
3. **lotus · Lotus Gatefold**: Blush-pink paper, large layered pink-and-white paper lotuses and peonies in the top-left and bottom-right corners, lotus leaves, and thin gold filigree lines on a pale gold inner border.
4. **ruby · Jharokha Arch**: Warm ivory wall with a Rajasthani jharokha arch outline in ruby red and gold. Magenta bougainvillea cascades over the top corners and blue painted tiles run along the bottom edge.
5. **moonlit · Moonlit Jasmine**: Midnight-navy paper with fine silver stars, a crescent moon top-right, and jasmine strands and white paper jasmine flowers trailing from the top-left and bottom corners. Moonlit glow.
6. **kolam · Kolam Gatefold**: Red-oxide floor texture with a white rice-flour kolam border, paper marigolds and brass diyas in the bottom corners, and mango leaves at the top.
7. **marigold · Marigold Strings**: Turmeric-yellow paper, dense strings of orange and yellow paper marigolds hanging from the top edge like a curtain fringe, rose petals scattered at the bottom, small brass bells.
8. **peacock · Mayil Peacock**: Deep teal paper with an antique-gold ornate frame. A paper-craft peacock perches on the top-left corner with its tail flowing down the left side, peacock feathers and pink paper roses bottom-right.
9. **emerald · Noor Arch**: Turquoise Mughal arch frame with fine gold geometric jali, large white paper roses at the top-left and bottom-right, hanging Moroccan lanterns at the top corners, a small crescent. Elegant and Nikah-appropriate, no figures.
10. **rangoli · Rangoli Envelope**: Cream paper, vivid paper-craft rangoli petals in pink, orange, yellow and teal bursting from the corners, confetti dots, a festive and joyful mood.
11. **lamp · Temple Doors**: Dark carved-teak temple wall texture with brass trim. A row of glowing brass deepam lamps along the bottom edge, jasmine and marigold garlands hanging from the top corners, warm firelight glow.

## Opener videos (Gemini / Veo, 9:16, 6–8 s, no audio needed)

Append this to every video prompt:
> Vertical 9:16, cinematic, photoreal with a soft painterly finish, locked-off camera for the first second, smooth slow motion, no text, no people, no watermark.

1. **athangudi**: Closed carved Chettinad teak double doors with rows of brass studs and brass ring knockers, a mango-leaf toran above and a white kolam on the threshold. The doors swing slowly inward and the camera glides through into a sunlit Athangudi-tiled courtyard with brass lamps; the light blooms bright at the end.
2. **kanjivaram**: Heavy magenta Kanjivaram silk curtains with a gold zari hem fill the frame. They part slowly from the centre and gather to the sides with the silk catching the light, revealing a warm golden glow that brightens to soft white.
3. **lotus**: A blush-pink gatefold card with paper lotuses and a round gold medallion where the two halves meet. The medallion splits, both panels fold open toward the camera, and pink petals drift out into soft light.
4. **ruby**: An arched blue painted wooden door in an ivory wall, framed by magenta bougainvillea. The door opens inward and the camera walks through into a candle-lit courtyard with hanging lanterns, fading to warm light.
5. **moonlit**: A midnight-navy envelope lies on dark velvet under starlight with a pearl-white wax seal pressed with jasmine. The seal cracks, the flap lifts, and a cream card rises out as tiny stars swirl, brightening to moonlight.
6. **kolam**: A red-oxide gatefold. A white kolam draws itself line by line across the seam, then the two panels swing open toward the camera to a glow of brass diyas.
7. **marigold**: A dense curtain of hanging orange and yellow marigold strings fills the frame and sways. It parts from the centre to both sides, marigold petals fall, and warm sunlight floods in.
8. **peacock**: A teal and antique-gold gatefold printed with peacock feathers, with a gold medallion at the centre seam. A peacock feather sweeps across, the medallion splits, and the panels fold open to a golden glow with drifting feathers.
9. **emerald**: A turquoise Mughal arch with carved wooden doors and white roses and hanging lanterns either side. The doors open to a lantern-lit courtyard with a fountain, fading to soft white.
10. **rangoli**: A bright pink envelope with a golden wax seal. The seal pops, the flap opens, and a burst of colourful rangoli powder and confetti fills the frame, then settles to cream.
11. **lamp**: Massive dark temple doors with brass studs at dusk, a row of lit deepams at their foot. The doors open slowly and the camera moves into a corridor of glowing lamps and jasmine garlands; the light blooms bright.

## Venue illustrations (Gemini image, 4:3, optional)

> Horizontal 4:3 watercolour illustration of a South Indian wedding mandapam: carved pillars, a banana-trunk entrance, mango-leaf toran, marigold garlands, a brass kuthuvilakku, soft morning light, painterly, no text, no people, no watermark. Palette: **<theme colours>**.

Theme colours to fill in: athangudi (ochre, teal, terracotta), kanjivaram (magenta, gold), lotus (blush, gold), ruby (ruby, ivory, blue tiles), moonlit (navy, silver, moonlight), kolam (red oxide, white), marigold (turmeric, orange), peacock (teal, gold), emerald (turquoise, white, gold; use a garden pavilion with lanterns instead of a mandapam), rangoli (pink, orange, teal), lamp (teak, brass, firelight).
