# Times Tables Practice

A small single-page game for practicing multiplication tables, with a PIN-gated backend
(Netlify Functions + Blobs) so settings and playtime stats sync across devices. See
[`docs/design.md`](docs/design.md) for the design and [`docs/plan.md`](docs/plan.md) for how it was
built.

## Local development

Requires [Node.js](https://nodejs.org/) and [`just`](https://github.com/casey/just).

```
just serve
```

This installs dependencies and runs `netlify dev`, which serves the app and emulates Functions/Blobs
locally at `http://localhost:8888`. Set a `PLAYER_PIN` in a `.env` file first (gitignored) so the PIN
gate has something to check against:

```
echo "PLAYER_PIN=1234" > .env
```

### Testing locally

With `just serve` running, open `http://localhost:8888` and enter the PIN from `.env`. Then check:

- **Settings:** turn tables off until one is left. The last one can't be turned off. Reload the page:
  your selection should still be there.
- **Play:** every equation, including the first, should use one of the tables you left on.
- **Stats:** play for a minute or two, then open Stats and check that today's square has filled in.

To see what's stored, run this in a second terminal while `just serve` is running:

```
just data
```

It prints the stored JSON (`settings.enabledNumbers` and the minutes played per day), read from local
Blobs rather than production. It needs [`jq`](https://jqlang.org/).

`just serve` stops any old dev server still using port 3999 or 8888, so you can safely run it again.

## Deploying to Netlify

This app needs Netlify Functions and Blobs, not just static hosting, so the drag-and-drop upload UI
on netlify.com won't work — it only accepts static files. Use one of the two options below instead.

### Option A — CLI deploy (quickest way to test)

From the project root:

```
npx netlify login                        # one-time browser auth
npx netlify init                         # creates/links a Netlify site for this folder
npx netlify env:set PLAYER_PIN <your-pin>  # sets the PIN on the actual site (separate from .env)
npx netlify deploy                       # draft deploy: unique preview URL, prod untouched
```

Open the printed draft URL and confirm the PIN gate, settings, and stats work against real
Functions/Blobs. When you're happy with it:

```
npx netlify deploy --prod
```

### Option B — Git-linked continuous deployment

Push this repo to GitHub, then in the Netlify dashboard use "Import an existing project" and pick the
repo. If you already created a site via `netlify init` above, link to that same site rather than
creating a new one. Every push to the default branch then deploys automatically.

Either way, make sure `PLAYER_PIN` is set as an environment variable on the site (Site settings →
Environment variables, or `netlify env:set` as above) — without it the Functions will reject every
request.
