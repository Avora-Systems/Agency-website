# AGENTS.md

## Project

**Avora Systems** marketing site — a single-page static site for a UK small-business agency offering AI automation (lead response, document handling, scheduling, invoicing) and website building. Primary call to action throughout is booking a free automation audit via Calendly.

## Stack

- Static HTML/CSS/vanilla JS — no framework, no build step, no package.json.
- `index.html` — the one-page site (hero, "how it works", problems, services, "what I could build for you", video showcase, testimonials [commented out], CTA, contact form, footer).
- `privacy.html` — privacy policy page (shares the header/overlay/footer markup and `css/styles.css`).
- `css/styles.css` — all styling. Typographic agency redesign: near-black ink + muted grey body + one accent (brand blue `#2563eb`). Type system is `--font-display` (Schibsted Grotesk), `--font-serif` (Newsreader italic — used only for the blue accent phrase in headlines), `--font-body` (Inter). Radii: pills `999px`, media/cards `12px`, inputs are underline-only.
- `fonts/` — three self-hosted variable `.woff2` files (Schibsted Grotesk, Newsreader italic, Inter), each `@font-face`'d with a weight range. Self-hosted rather than Google-CDN linked (UK GDPR + perf). Preloaded from the HTML `<head>`.
- `js/script.js` — header scroll state (`#site-header` → `.is-scrolled`), hamburger overlay menu (`#menu-toggle` / `#nav-overlay`, body scroll-lock, Esc to close), GSAP `ScrollTrigger.batch` scroll-reveal for `.reveal` elements (fade + rise with stagger; falls back to adding `.is-visible` to all `.reveal` when GSAP is unavailable or reduced motion is requested), a scroll progress bar, a custom cursor (dot + lagging ring, desktop fine-pointer only), magnetic-button hover (`[data-magnetic]`), cursor-tracked card glow (`[data-glow]`), a hero image tilt effect, GSAP-driven illustrative demo animations (chat/document/calendar, see below), a guarded testimonials slider (no-ops unless `#testimonials` exists), contact form submission. All motion features are gated behind `prefers-reduced-motion` and, where relevant, `(hover: hover)`/`(pointer: fine)` checks.
- **GSAP** (`gsap` + `ScrollTrigger`) is loaded via cdnjs `<script>` tags in `index.html` just before `js/script.js` — the only third-party CDN dependency. Pinned to 3.13.0. Other pages (`privacy.html` etc.) do not load it as they have no `.reveal` content.
- `images/` — SVG illustrations for service cards (`testimonial-placeholder.jpg` is referenced by the commented-out testimonials block and does not exist yet).
- `wrangler.jsonc` — deploys the directory as static assets via Cloudflare Workers (`compatibility_date: 2026-08-25`).

## Key integrations

- **Contact form** (`js/script.js`): posts JSON (`name`, `email`, `message`, `source`) to an n8n webhook at `https://n8n-production-7a6e1.up.railway.app/webhook/...`. No server code in this repo — the webhook is external.
- **Booking CTA**: links to a Calendly page (`calendly.com/tom-avora-systems/free-automation-audit-call`). Primary CTAs (hero, mid-page CTA section) render as a filled pill `.btn.btn--primary` with a magnetic hover pull; secondary/nav links keep the understated animated-underline `.text-link` style.
- **No video embeds**: the site no longer embeds Loom (or any third-party) video. The "What we build" AI Automation card and the "See it in action" section instead use small illustrative animations built from HTML/CSS/GSAP — an enquiry→AI→reply "flow" diagram, a chat-reply demo, a document-checklist demo, and a scheduling/calendar demo (`.flow-demo`, `.chat-demo`, `.doc-demo`, `.cal-demo` in `css/styles.css`, played once on scroll-into-view via `ScrollTrigger.create` in `js/script.js`). Because there's no embedded third-party content, the site sets no non-essential cookies and there is no cookie-consent bar — `cookies.html` reflects this.

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
