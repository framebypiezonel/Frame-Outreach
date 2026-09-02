# Frame Outreach Pipeline

Static tracker (`index.html`) backed by a Netlify Function (`netlify/functions/leads.js`)
that stores one shared JSON document in Netlify Blobs, so every device that opens the
site reads and writes the same pipeline state.

## One-time setup: Blobs credentials

On some Netlify sites, Blobs' automatic environment injection doesn't kick in and the
`/api/leads` function fails with `MissingBlobsEnvironmentError`. If that happens, set it
up manually:

1. Netlify → your avatar (bottom-left) → **User settings** → **Applications** →
   **Personal access tokens** → **New access token**. Give it any name, copy the token.
2. Site → **Site configuration** → **Environment variables** → **Add a variable**:
   - Key: `BLOBS_TOKEN`
   - Value: the token from step 1
   - Scopes: Functions (and Builds, if offered)
3. Trigger a redeploy (Deploys → Trigger deploy → Deploy site) so the function picks up
   the new environment variable.

`SITE_ID` does not need to be set manually — Netlify injects it into every function
automatically.

## Local structure

- `index.html` — the app. Talks to `/api/leads` instead of `localStorage`.
- `netlify/functions/leads.js` — GET returns the stored state, PUT/POST replaces it.
- `netlify.toml` — routes `/api/leads` to the function, points Netlify at this repo root.
