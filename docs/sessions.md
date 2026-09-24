# Session log

## 2026-09-20 — Design, plan, and Steps 1-5

Fleshed out `docs/design.md` from a list of open questions into concrete decisions, then built the
game iteratively per a new `docs/plan.md`, committing after each validated step.

**Design decisions resolved:** single player usable across multiple devices; PIN/passcode auth
(no full account system); Netlify Blobs + Functions for storage (stays inside Netlify's free tier,
avoids a third-party backend); SPA with client-side hash routing instead of separate static pages;
streak counts any day with playtime, not gated on the 15-minute "full green" threshold.

**docs/plan.md:** a 5-step build sequence, each step deployable and locally checkable via a single
`just serve` command (Netlify CLI wrapped by a `.justfile`).

- **Step 1 - Local dev tooling.** `git init`, `package.json` (netlify-cli), `netlify.toml`,
  `.justfile`. Node.js wasn't installed on the machine - installed via Homebrew. Had to bump
  netlify-cli from an initially-pinned `^17` to `^27`; the old version crashed under this Node
  version.
- **Step 2 - SPA shell + routing.** Split the single `index.html` into a shell + hash router
  (`#/`, `#/play`, `#/settings`, `#/stats`), with the existing game logic relocated near-verbatim
  into `js/views/play.js`. Settings/Stats were placeholders at this point. Also restyled the whole
  app from glossy radial-gradient balls/buttons to flat solid colors, per request.
- **Step 3 - Real Settings page (localStorage-backed).** Number 1-10 toggle grid, minimum 2 enabled.
  First pass wrongly restricted *both* equation factors to the enabled set; corrected after
  feedback that enabling a number should surface its whole times table (one factor drawn from the
  enabled set, the other free 1-10, position randomized) - fixed in code and in both design docs.
- **Step 4 - PIN auth + Netlify Functions + Blobs backend.** `netlify/functions/{load,save}-data.js`
  gated by an `x-player-pin` header checked against `PLAYER_PIN`; client-side gate in `js/auth.js`;
  fetch wrapper in `js/api.js` that force-clears and reloads on a 401. Settings and Play migrated
  off `localStorage` onto this backend, plus a 30s playtime heartbeat with flush on
  tab-hide/close/navigate-away. Needed `"type": "module"` in `package.json` so Netlify's runtime
  recognized the functions as ES modules instead of legacy CommonJS. Added a `just data` recipe to
  inspect the live blob; its first version silently swallowed connection failures because
  `curl | jq` masks curl's exit code - rewritten as a script recipe that checks curl's status
  directly.
- **Step 5 - Real Stats page.** Github-style contribution grid (20 weeks, Sunday-aligned columns)
  plus a streak counter, both reading from the backend. Verified the grid/streak logic with Node
  simulations and against the real dev server (including fabricated past days added via
  `save-data` to test multi-day rendering and a streak-breaking gap). The grid first rendered
  squished/uneven - root cause was missing `flex: none` on the grid cells, so flexbox's default
  shrink behavior was compressing them instead of letting the wrapper scroll. Found and fixed by
  comparing against a working Github-style heatmap component from another local project. Confirmed
  visually once the Chrome extension was connected for browser automation.

**State at end of session:** Steps 1-4 committed. Step 5 implemented and verified but not yet
committed.
