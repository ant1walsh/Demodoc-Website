# Demodoc-Website — production build

Static, prerendered, minified site for GitHub Pages (CNAME: demodoc.ai). Replace the repo root with this folder.

## What's here
- **Prerendered pages** (full HTML for crawlers, then React takes over): `/`, `/agentic-research/`, `/generative-content/`, `/forward-deploy/`, `/workshops/`, `/consult/` — each with its own title, description, canonical URL, Open Graph/Twitter tags. Home carries JSON-LD.
- `sitemap.xml`, `robots.txt`, `404.html` (GitHub Pages serves it for unknown paths), `error.html`, plus an in-app error boundary.
- Minified: `app.min.js`, `ds.min.js`, `dither.min.js`, `styles.min.css`; React production builds self-hosted in `vendor/` (no third-party CDN).
- `fonts/`, `assets/` (compressed headshot, client logos), `favicon.png`, `og-image.png`.

## Configure before launch
1. **Web3Forms** — access key is set (notifications go to anthony@demodoc.ai). In the Web3Forms dashboard, restrict the key to demodoc.ai. Confirmation copy: "Thanks — you'll get a response in 24 hours."
2. **PostHog** — project key is set (US cloud, `https://us.i.posthog.com`). Analytics and session replay are live once deployed.
   **Session replay** is enabled in code (all form inputs masked; email/password always masked; anything with `data-ph-mask` masked; Calendly iframe not recorded). Also turn on **Session replay** in PostHog → Project settings → Replay, and add `demodoc.ai` to Authorized domains.
   Events: `$pageview` (per route), `navigate`, `book_consultation_click`, `consultation_booked` (Calendly), `workshop_registration_submitted` / `_failed`, `page_not_found`, `$exception`.
3. In Google Search Console, add the property and submit `https://demodoc.ai/sitemap.xml`.

## Tests
```
npm install
npx playwright install
npm test
```
Playwright covers: prerendered HTML + meta on every page, sitemap/robots, minification, zero console errors, navigation + URLs + back button, consult CTA, mobile menu, 404, stack-pill hover highlighting, Calendly embed + personal-site link, Web3Forms submit (mocked) with 24-hour confirmation and failure state, skip link / lang / keyboard cards / alt text. Runs on desktop Chrome and iPhone Safari; CI workflow in `.github/workflows/test.yml`.

## Still recommended
- Privacy policy, terms, and a cookie notice (Calendly + PostHog set cookies).
- Quote attributions.
