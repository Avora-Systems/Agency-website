# AGENTS.md

## Project

**Avora Systems** marketing site — a single-page static site for a UK small-business agency offering AI automation (lead response, document handling, scheduling, invoicing) and website building. Primary call to action throughout is booking a free automation audit via Calendly.

## Stack

- Static HTML/CSS/vanilla JS — no framework, no build step, no package.json.
- `index.html` — the one-page site (hero, "how it works", problems, services, "what I could build for you", video showcase, testimonials [commented out], CTA, contact form, footer).
- `privacy.html` — privacy policy page (shares the header/overlay/footer markup and `css/styles.css`).
- `css/styles.css` — all styling. Typographic agency redesign: near-black ink + muted grey body + one accent (brand blue `#2563eb`). Type system is `--font-display` (Schibsted Grotesk), `--font-serif` (Newsreader italic — used only for the blue accent phrase in headlines), `--font-body` (Inter). Radii: pills `999px`, media/cards `12px`, inputs are underline-only.
- `fonts/` — three self-hosted variable `.woff2` files (Schibsted Grotesk, Newsreader italic, Inter), each `@font-face`'d with a weight range. Self-hosted rather than Google-CDN linked (UK GDPR + perf). Preloaded from the HTML `<head>`.
- `js/script.js` — header scroll state (`#site-header` → `.is-scrolled`), hamburger overlay menu (`#menu-toggle` / `#nav-overlay`, body scroll-lock, Esc to close), `IntersectionObserver` scroll-reveal (`.reveal` → `.is-visible`), a guarded testimonials slider (no-ops unless `#testimonials` exists), contact form submission. All respect `prefers-reduced-motion`.
- `images/` — SVG illustrations for service cards (`testimonial-placeholder.jpg` is referenced by the commented-out testimonials block and does not exist yet).
- `wrangler.jsonc` — deploys the directory as static assets via Cloudflare Workers (`compatibility_date: 2026-08-25`).

## Key integrations

- **Contact form** (`js/script.js`): posts JSON (`name`, `email`, `message`, `source`) to an n8n webhook at `https://n8n-production-7a6e1.up.railway.app/webhook/...`. No server code in this repo — the webhook is external.
- **Booking CTA**: links to a Calendly page (`calendly.com/tom-avora-systems/free-automation-audit-call`). Rendered as an understated animated-underline text link (`.text-link`), not a filled button — matches the redesign's typography-led style.
- **Video embeds**: Loom embeds for the automation demo and showcase videos (Speed Up Customer Enquiries, Document Screening, Scheduling).

## Conventions

- No build tooling — edit `index.html`/`privacy.html`/`css/styles.css`/`js/script.js` directly and reload.
- Deployed via `wrangler` (Cloudflare). No CI config present.
- Section pattern in `index.html`: each `<section>` has `class="section …"`, an `id`/`aria-labelledby`, a `.wrap` container, a `.section-head` block (optional `.eyebrow` + `h2` + `.section-lede`), and reveal-on-scroll elements marked with the `reveal` class.
- Headline accent treatment: wrap the outcome/benefit phrase in `<span class="accent-phrase">` — renders as Newsreader italic in brand blue against the grotesque display face.
- Eyebrows are rationed (only hero + the "what I could build for you" section use one) to avoid a templated rhythm.
- To enable testimonials: delete the two comment-marker lines around the `<section class="testimonials">` block in `index.html`, add real quotes/names/roles, and drop a real `images/testimonial-placeholder.jpg` (or per-person images). The slider JS activates automatically.

## Where to look

- Content/copy changes → `index.html`.
- Visual/theme changes → `css/styles.css`.
- Interaction/animation/form logic → `js/script.js`.
- Deployment config → `wrangler.jsonc`.
