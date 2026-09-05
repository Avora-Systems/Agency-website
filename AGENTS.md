# AGENTS.md

## Project

**Avora Systems** marketing site — a single-page static site for a UK small-business agency offering AI automation (lead response, document handling, scheduling, invoicing) and website building. Primary call to action throughout is booking a free automation audit via Calendly.

## Stack

- Static HTML/CSS/vanilla JS — no framework, no build step, no package.json.
- `index.html` — the one-page site (hero, "how it works", problems, services, video showcase, CTA banner, contact form, footer).
- `privacy.html` — privacy policy page.
- `css/styles.css` — all styling (~1,077 lines), light/blue theme.
- `js/script.js` — navbar scroll state, `IntersectionObserver`-based scroll-reveal animations, hero parallax blobs, contact form submission (all respect `prefers-reduced-motion`).
- `images/` — SVG illustrations for service cards.
- `wrangler.jsonc` — deploys the directory as static assets via Cloudflare Workers (`compatibility_date: 2026-08-25`).

## Key integrations

- **Contact form** (`js/script.js`): posts JSON (`name`, `email`, `message`, `source`) to an n8n webhook at `https://n8n-production-7a6e1.up.railway.app/webhook/...`. No server code in this repo — the webhook is external.
- **Booking CTA**: links to a Calendly page (`calendly.com/tom-avora-systems/free-automation-audit-call`).
- **Video embeds**: Loom embeds for the automation demo and showcase videos (Speed Up Customer Enquiries, Document Screening, Scheduling).

## Conventions

- No build tooling — edit `index.html`/`privacy.html`/`css/styles.css`/`js/script.js` directly and reload.
- Deployed via `wrangler` (Cloudflare). No CI config present.
- Section pattern in `index.html`: each `<section>` has an `id`/`aria-labelledby`, a `.section-inner` wrapper, and reveal-on-scroll elements marked with the `reveal` class.
- Git history shows the site evolving incrementally section-by-section (hero → problems → services → contact form → privacy page → theme swap → "how it works").

## Where to look

- Content/copy changes → `index.html`.
- Visual/theme changes → `css/styles.css`.
- Interaction/animation/form logic → `js/script.js`.
- Deployment config → `wrangler.jsonc`.
