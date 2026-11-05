# Running the site on the studio Wi-Fi

The laptop runs the whole site. Every phone and laptop on the same Wi-Fi can use it. Nothing goes to the internet, and there's no Docker.

## First time (once)

```sh
npm install                 # site packages (if not done already)
npm run server:setup        # server packages (server/node_modules)
```

## Starting it

```sh
npm run lan:start
```

This builds the site, then starts the server on port **8080**. The terminal prints:

- `http://localhost:8080`, for this laptop;
- `http://192.168.x.x:8080`, for phones on the Wi-Fi, with a **QR code** to scan;
- on the very first start only, the **admin name and password**. Write them down.

Keep the laptop awake while people use it:

```sh
caffeinate -i npm run lan:start
```

Stop with `Ctrl+C`. Data stays in `server/data/` (`ttc.db` + `media/`).

## Who logs in how

| Who | Where | How |
|---|---|---|
| Studio admin | `/admin/login` | Name and password from the first start |
| Customer (our bookings) | `/login` | Phone, then a 4-digit code. The code pops up on every admin screen; staff read it out |
| Photographer | `/studio/login` | Phone, then a code (same pop-up). A new phone goes on to sign-up; admin marks them **Paid** before they get in |
| Photographer's customer | the link (`/gallery/…`, `/poses/…`, `/p/…`) | The project's 4-digit PIN |

Someone who sends an enquiry can follow it on that same phone straight away. To see their other bookings, they log in with the code.

## The live photo flow

1. The photographer opens a project and uploads photos or RAW files. The laptop makes small watermarked previews; originals stay on their disk.
2. Each photo appears **on the customer's phone while the upload is still running**.
3. Each heart the customer taps shows up on the photographer's screen. Two family members on the same link stay in sync.
4. The customer submits. The gallery locks, the project moves to "selection received", and the photographer copies the Lightroom list.

## Things to know

- **The laptop's address changes per Wi-Fi network.** Rescan the QR each time you move.
- **Wi-Fi "client isolation" / "AP isolation" must be off**, or phones cannot reach the laptop. Guest networks often have it on.
- macOS asks once to "allow incoming connections" for `node`. Click **Allow**.
- Over plain `http://` on the Wi-Fi, phones cannot record the voice note on the booking page. Copy buttons still work. Everything works on the laptop itself (`localhost`).
- Drive scanning (storage manager) works in Chrome or Edge **on the laptop**.

## Handy commands

```sh
npm --prefix server run admin -- password          # new admin password (stop the server first)
npm --prefix server run admin -- seed demo         # wipe and reload the demo data
npm --prefix server run admin -- seed empty        # wipe to a clean site (CMS + plans only)
```

To start with an empty site instead of the demo, delete `server/data/` and start once with `SEED=empty npm run lan:start`.

**Backups:** set `BACKUP_DIR=/Volumes/YourDrive/ttc-backups` in `server/.env` (copy `server/.env.example`). The server copies the database and new photos there every night at 02:00 and keeps 14 copies. To restore: stop the server, copy a `ttc-*.db` back to `server/data/ttc.db` and `media/` back to `server/data/media/`, then start.

## For development

Two terminals:

```sh
npm run server:dev          # API on :8787, reloads on change
npm run dev:lan             # site on :8443 in LAN mode (Vite proxies /api and /media)
```

`npm run dev` (no `:lan`) is the old browser-only mock, which is what the Figma Make preview uses.

Tests: `npm run server:test` (server) and `npm test` (site).
