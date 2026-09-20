# Build plan

This plan implements the architecture in [`design.md`](./design.md) iteratively. Each step leaves
the repo in a deployable state and can be validated locally with a single command
(`just serve`) before moving on to the next step.

## Local tooling

Local development runs through the Netlify CLI (`netlify dev`), wrapped by a `.justfile`. This is
adopted from Step 1 onward and stays the one command for the whole project lifecycle: it serves
static files today, and once Functions/Blobs exist (Step 4) it also proxies and emulates those
locally, honoring `netlify.toml` redirects/headers the same way production does.

```
# .justfile
install:
    npm install

serve: install
    npx netlify dev
```

`package.json` holds `netlify-cli` as a devDependency only — a local tool, not runtime weight for
the shipped game.

Git is initialized in Step 1 so each step's work is committable — commits happen only when
explicitly requested, not automatically per step.

## Steps

### Step 1 — Local dev tooling

- `git init`
- Minimal `package.json` (netlify-cli devDependency)
- `netlify.toml`
- `.justfile`
- No application changes — `index.html` stays exactly as it is today.

**Validate:** `just serve` starts a local server and the existing game (unchanged) works exactly as
it does today, at `localhost:8888`.

### Step 2 — SPA shell + routing: real Landing + Play, dummy Settings + Stats

- Split into `index.html` (shell + mount point), `css/styles.css`, `js/router.js` (hash routing:
  `#/`, `#/play`, `#/settings`, `#/stats`).
- `js/views/landing.js` — the 3-button landing page (Play / Settings / Stats).
- `js/views/play.js` — today's game logic relocated near-verbatim (no settings integration yet, all
  numbers 1–10 active, matching current behavior).
- `js/views/settings.js`, `js/views/stats.js` — placeholder "Coming soon" views, just enough to
  prove routing works end-to-end.

**Validate:** `just serve` → landing page loads at `#/`; Play button goes to a working game
identical to today's; Settings/Stats buttons show placeholders; browser back/forward and direct
URL hash-loads all work.

### Step 3 — Real Settings page, localStorage-backed

- Number 1–10 toggle UI in `js/views/settings.js`, persisted to `localStorage` (deliberately not
  the backend yet, so this step is validatable without Functions/Blobs).
- `js/views/play.js` reads enabled numbers (times tables) from `localStorage`: one equation factor
  is drawn from the enabled set, the other is a random 1–10, with position randomized for variety.
  Settings UI enforces a minimum of 2 enabled numbers.

**Validate:** toggle some numbers off, play, confirm every equation includes at least one enabled
table; try disabling down to 1 and confirm it's blocked; reload the page and confirm settings
persisted.

### Step 4 — PIN auth + Netlify Functions + Blobs backend

- `netlify/functions/save-data.js` and `load-data.js`, storing the single `player-data` blob
  (`{ settings: { enabledNumbers }, days: {} }`, per `design.md`).
- `js/auth.js` — PIN entry screen shown when no valid PIN is stored; PIN kept in `localStorage` and
  sent as a header on every Functions call; functions validate against a `PLAYER_PIN` env var.
- Settings migrates from `localStorage` to the backend (load on entry, save on toggle).
- Play page session time tracking: ~30s heartbeat + flush on `visibilitychange`/`pagehide`, writing
  today's accumulated minutes into the blob's `days` map.

**Validate:** set `PLAYER_PIN` in a local `.env` (gitignored); `just serve` prompts for the PIN
before showing the app; wrong PIN is rejected; toggle a setting, open the app in a second (private)
browser window with the same PIN, confirm the setting is shared; play for a bit and confirm today's
`days` entry increases (inspectable via the local Blobs emulation files, or a temporary debug log).

### Step 5 — Real Stats page

- Github-style contribution matrix and streak counter in `js/views/stats.js`, reading `days` from
  the backend via `load-data.js`.
- Color tiers: empty/gray (0 min), then 3 intermediate green tiers up to 15+ min (full green).
- Streak: consecutive days with any playtime, anchored at today (or yesterday if today has none
  yet).

**Validate:** after Step 4's local play session, Stats shows today colored appropriately and a
streak of at least 1; manually edit the local Blobs emulation data to add a few fabricated past days
to confirm the matrix renders multiple days correctly and the streak count/break logic is correct.
