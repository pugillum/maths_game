# Initial design

This repo contains a game for learning maths.  The current implementation is simple:
- There's random selection of numbers between 1 and 10
- The multiplication equation is shown at the bottom of the screen
- 4 to 5 numbers are displayed floating in the screen
- The player selects the number they think is the correct answer
  - If it's wrong it fades away
  - If it's right it shows green with a small confetti effect

The game is intended for hosting on Netlify and is currently stateless.

# Extending the design

The game is for a single player, but must be usable from multiple devices/browsers, so player
data (settings and stats) needs to live centrally rather than only in the browser. The decisions
below were made with that constraint in mind, favoring the simplest and cheapest option that still
works across devices.

## Application shape

The game moves from a single self-contained `index.html` to a small single-page app (SPA) with
client-side routing: one `index.html` shell, with JS swapping views into a mount point rather than
separate static pages per section. This also gives a natural place to add the small serverless API
described under [Retaining data](#retaining-data) — Netlify Functions need a `netlify.toml` regardless,
so splitting the assets out at the same time keeps things tidy.

Proposed file structure:

```
index.html                   # shell: header/nav + #app mount point
css/styles.css                # all styles (from current inline <style>)
js/router.js                  # hash-based router (#/, #/play, #/settings, #/stats), swaps views into #app
js/views/landing.js
js/views/play.js              # current game logic (randInt, generateDistractors, placeBalls, fireworks etc.),
                               # adapted to respect the enabled-numbers setting
js/views/settings.js
js/views/stats.js
js/api.js                     # wraps fetch calls to the Netlify Functions, attaches the PIN header
js/auth.js                    # PIN prompt/gate, localStorage token handling
netlify/functions/save-data.js
netlify/functions/load-data.js
netlify.toml
```

The existing game logic in `index.html` (ball placement, distractor generation, fade/confetti
handling) carries over largely as-is into `js/views/play.js` — this is a relocation, not a rewrite,
plus reading the enabled-numbers list from settings before generating `a`/`b`.

## Multi page

The game supports four views, reached via hash-based client-side routes:
1. Landing page (`#/`)
2. Play page (`#/play`)
3. Settings page (`#/settings`)
4. Stats page (`#/stats`)

### The landing page

Contains 3 buttons centered:
- Play - routes to `#/play`
- Settings - routes to `#/settings`
- Stats - routes to `#/stats`

### The play page

The page the game currently displays, but taking the settings into account (see below) and
tracking session time (see [Retaining data](#retaining-data)).

Equation generation reads `settings.enabledNumbers`, which represent the times tables the player is
practicing, not a shared pool for both factors: one factor is drawn from the enabled set (the
table), the other is a random number 1-10 (which position each occupies is randomized, for
variety). E.g. enabling 8 makes 1x8, 2x8, ... 10x8 all eligible questions. If fewer than 2 numbers
are somehow enabled, fall back to the full 1-10 range as a safety net so the game never gets stuck
unable to generate a question.

### The settings page

Contains a list of numbers, 1 - 10, displayed as buttons. The player can toggle each number on or
off; enabled numbers are the times tables practiced on the Play page (see above). At least 1 number
must stay enabled at all times - the UI blocks disabling below that - so equations remain
generatable. Changes save immediately (see [Retaining data](#retaining-data)).

### The stats page

A Github-style contribution matrix showing the days the player played, colored by amount of time
played that day:
- 0 minutes: empty/gray
- 1-5 minutes
- 5-10 minutes
- 10-15 minutes
- 15+ minutes: full green

(Four non-empty color tiers, matching Github's own contribution-graph convention.)

Also shows a streak counter, in days. A day counts toward the streak if the player played at all
that day (no minimum time required - the 15-minute threshold only affects the matrix color, not the
streak). The streak is the number of consecutive days with playtime, counted backward from today -
or from yesterday if today has no playtime yet, so an in-progress day doesn't prematurely break the
streak.

## Authentication

Login is a single shared PIN/passcode rather than a full account system - enough to gate access and
identify "this is the player" across devices, without the overhead of a real auth provider for a
single-player game.

- The PIN is set as a Netlify environment variable (`PLAYER_PIN`), never committed to the repo.
- On first load (or whenever no valid PIN is stored), the app shows a PIN entry screen before
  anything else.
- On correct entry, the PIN is stored in `localStorage` on that device and sent as a header (e.g.
  `x-player-pin`) on every call to the Netlify Functions. Each function compares it server-side
  against `PLAYER_PIN` and rejects with 401 if it doesn't match.
- This gives "login once, session stays open" per device without needing session/token
  infrastructure. Logging in on a new device just means entering the PIN there once too.

## Retaining data

Data is stored server-side via Netlify Blobs, accessed through two small Netlify Functions, so it's
available from any device rather than being stuck in one browser's local storage. This stays
entirely within Netlify's free tier and avoids standing up a separate backend/account for what is,
structurally, a single JSON record.

A single fixed blob key (e.g. `player-data`) holds:

```json
{
  "settings": { "enabledNumbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  "days": { "2026-09-20": 12, "2026-09-19": 18 }
}
```

- `enabledNumbers` - the times tables toggled on in Settings.
- `days` - a map of date to total minutes played that day. Minutes are aggregated per day (not
  stored per session) to keep the blob small.

`save-data.js` performs an authenticated read-modify-write; `load-data.js` performs an
authenticated read. The store is opened with `consistency: "strong"`. With the default eventual
consistency, a playtime save shortly after a settings change could read the old blob and write
the old settings back. Both settings changes and playtime updates go through `save-data.js`.

### Session time tracking

While the Play view is active, elapsed time is tracked with a periodic heartbeat (every ~30s) that
adds elapsed minutes to today's `days` entry via `save-data.js`, plus a final flush on
`visibilitychange`/`pagehide` so a session isn't lost if the tab is closed abruptly.

## Extra design questions

- ~~Is a single HTML page optimal for Netlify use?~~ Resolved above under
  [Application shape](#application-shape): moving to a small SPA with split JS/CSS/HTML files, which
  also accommodates the Netlify Functions needed for data retention.
