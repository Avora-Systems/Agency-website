# AGENTS.md

## Project

**Avora Systems** marketing site — a single-page site for a UK small-business agency offering AI automation (lead response, document handling, scheduling, invoicing) and website building. Primary call to action throughout is booking a free automation audit by scrolling to the contact form, which feeds an AI scheduling automation.

## Stack

The site is still fundamentally static HTML/CSS/vanilla JS — there is no server, no templating, no app-wide framework. A small Vite/React build produces one additional island (the hero's "Avora System" visual) that is mounted into that static HTML; everything else stays vanilla by design, per the architecture note below.

- `index.html` — the one-page site (hero, "how it works", problems, services, "what I could build for you", "see it in action", website styles, CTA, contact form, footer).
- `privacy.html`, `terms.html`, `refund-policy.html`, `cookies.html` — legal pages, share the header/overlay/footer markup and `css/styles.css`.
- `css/styles.css` — all styling. Light theme: near-black ink (`--ink`) on white/off-white paper, one accent (brand blue `--accent: #2563eb`). Type system is `--font-display` (Schibsted Grotesk), `--font-serif` (Newsreader italic — accent phrase only), `--font-body` (Inter). Radii: pills `999px`, media/cards `12px`. The one deliberately dark surface on the site is the Avora System hero panel (`src/hero/hero.css`), a restrained exception rather than a site-wide inversion.
- `fonts/` — three self-hosted variable `.woff2` files, preloaded from `<head>`.
- `js/script.js` — a single classic-turned-module script (see "GSAP" below) handling: header scroll state, hamburger overlay menu, GSAP `ScrollTrigger.batch` scroll-reveal for `.reveal` elements, a scroll progress bar, a custom cursor (dot + lagging ring, desktop fine-pointer only — now also activates over `.avora-core`), magnetic-button hover (`[data-magnetic]`), cursor-tracked card glow (`[data-glow]`), a masked line-reveal entrance for the hero title (GSAP SplitText), the Avora System hero's scroll-pin + progress dispatch, the "How it works" pinned system-diagram animation, the automation-examples and website-styles tab switchers, the illustrative demo animations (chat/document/calendar), and contact form submission. All motion is gated behind `prefers-reduced-motion` and, where relevant, `(hover: hover)`/`(pointer: fine)`.
- `wrangler.jsonc` — deploys the repo root as static assets via Cloudflare Workers (`assets.directory: "."`). `.assetsignore` excludes source (`components/`, `src/`, config files) and tooling directories from what actually gets served — only the built `app-dist/` output and the static site files are public.

## The React/Vite island (Avora System hero)

- `components/animation/` — a small, reusable React/TypeScript animation toolkit (`SmoothScroll`/`useLenis`, `ScrollReveal`, `SplitText`, `MagneticButton`, `ParallaxImage`, `PinnedSection`, `SceneCanvas`, `Model`, `CustomCursor`, `PageTransition`). Type-checked by `tsconfig.json` but otherwise **not itself wired into the shipped site** — it exists so a genuinely React/3D-shaped feature can adopt it without a rewrite. Nothing currently shipped uses Three.js/React-Three-Fiber at all (see below).
- `src/` — the one thing actually built and shipped: `src/main.tsx` is the Vite entry. It registers GSAP + ScrollTrigger + SplitText + DrawSVGPlugin + MotionPathPlugin **once** and exposes them as `window.gsap` / `window.ScrollTrigger` / etc., then mounts `src/hero/HeroExperience.tsx` into `#avora-hero-root`. `src/hero/sequence.ts` defines the workflow data (module/dock positions, card content, the 5 phases: idle → new enquiry → AI processing → CRM/calendar connect → booking confirmed) and `src/hero/AvoraSystem.tsx` renders it.
- **The hero is plain DOM/CSS, not WebGL.** It was originally a Three.js/React-Three-Fiber "core" (a faceted sphere with orbiting nodes); that was removed and replaced with a layered composition of real interface cards (a chat bubble, a CRM card, a calendar card, an AI-response card) connected by SVG lines to a central "Avora" module, with CSS `perspective`/`rotateX`/`rotateY` (cursor-linked) for depth instead of a 3D mesh. Real typography reads far better than anything WebGL renders, and dropping Three.js cut the hero bundle from ~365KB gzip to ~122KB gzip and fixed a real bug (WebGL-unavailable visitors previously got a blank dark box with no fallback). `AvoraSystem` has three modes, chosen by `HeroExperience`: **scroll** (desktop, driven by the page's scroll-pin), **autoplay** (mobile/narrow, or any viewport too short to pin safely — plays the sequence once automatically), and **static** (reduced motion — renders the resolved "booking confirmed" end state with no animation at all). Below 600px wide it also renders in **compact** mode: one active card at a time plus a small checklist of completed steps, instead of four accumulated corner cards (which start overlapping at phone widths — content size doesn't scale down with the container).
- **The scroll-pin has a height guard, and this matters if you touch pinned sections at all**: GSAP's `pin: true` uses `position: fixed`, which clips to the *viewport*, not the pinned element's own height. If a pinned section's natural content is taller than the viewport (common on 1366×768-class laptops), pinning it makes whatever's below the viewport's edge permanently unreachable — scrolling doesn't reveal more of a fixed element. Both `js/script.js` (before creating the hero's and How It Works' pins) and `HeroExperience`'s own mode selection check `section.offsetHeight <= window.innerHeight` first and skip pinning if it doesn't fit, so this degrades safely instead of eating the CTA.
- **Why only the hero is React**: the rest of the site is static markup that predates the toolkit, and converting it wholesale would be the highest-risk, lowest-value option. Everything else that *looks* interactive (the "How it works" diagram, the automation-examples switcher, the website-styles switcher) is deliberately plain GSAP/CSS/vanilla JS in `js/script.js`, consistent with the rest of the codebase and requiring no bundler.
- **Build**: `npm run build` (`vite build`) compiles `src/main.tsx` into `app-dist/avora-app.js` + `app-dist/avora-app.css` with fixed filenames (no hashing — `index.html` references them directly). `npm run typecheck` runs `tsc --noEmit` over `components/**` and `src/**`. `app-dist/` is gitignored (regenerated, not committed).
- **Load order matters**: `index.html` loads `app-dist/avora-app.js` as `type="module"` *before* `js/script.js` (also `type="module"`, so their relative order is preserved). This guarantees `window.gsap` etc. exist before `js/script.js`'s top-level `gsap.registerPlugin`/`ScrollTrigger` calls run. There is intentionally no CDN `<script>` for GSAP anymore — a second copy would mean a second ScrollTrigger registry and ticker fighting the bundle's.
- **Deploying**: `npm run deploy` runs `vite build && wrangler deploy` in one step so the build is never accidentally skipped. Deploying by hand requires `npm run build` first — the static site alone does not include the hero visual without it.

## Key integrations

- **Contact form** (`js/script.js`): posts JSON (`name`, `email`, `message`, `source`) to an n8n webhook. No server code in this repo — the webhook is external.
- **Booking CTA**: scrolls to the `#contact` form. Primary CTAs render as a filled pill `.btn.btn--primary` with a magnetic hover pull; secondary/nav links use the animated-underline `.text-link` style.
- **No video embeds / no cookie banner**: illustrative animations only (CSS/GSAP), so the site sets no non-essential cookies.

## Progressive-enhancement pattern used throughout

Several sections follow the same shape: real, complete content in the HTML (works with zero JS), enhanced into an interactive switcher only once `js/script.js` runs and adds an `is-enhanced` class:

- **Automation examples** (`#build`): `.build-switcher` — without JS, it's the full vertical list of five examples (as it always was). With JS, a tab rail (`[data-build-tab]`) switches between them (`[data-build-item]`), same single stage.
- **Website styles** (`#styles`): `.style-switcher` — without JS, the original horizontal-scroll gallery of four style concepts. With JS, tabs plus one "browser mockup" frame (`.browser-chrome`) crossfade between the same four images.

**Important CSS detail**: inactive items in both switchers are hidden with `opacity: 0; visibility: hidden; position: absolute` rather than `display: none`. Chromium has been observed to never paint a `loading="lazy"` `<img>` whose ancestor toggles `display: none → block/grid` via a stylesheet rule, even after the image has fully decoded (`naturalWidth` is correct, it just never composites). Toggling opacity/visibility instead avoids that failure mode entirely. If you add another switcher like these, follow the same pattern rather than `display: none`.

## Conventions

- Section pattern in `index.html`: each `<section>` has `class="section …"`, an `id`/`aria-labelledby`, a `.wrap` container, a `.section-head` block (optional `.eyebrow` + `h2` + `.section-lede`), and reveal-on-scroll elements marked with the `reveal` class.
- Headline accent treatment: wrap the outcome/benefit phrase in `<span class="accent-phrase">` — renders as Newsreader italic in brand blue.
- To enable testimonials: delete the two comment-marker lines around the `<section class="testimonials">` block in `index.html`, add real quotes/names/roles, and drop a real `images/testimonial-placeholder.jpg`.

## Where to look

- Content/copy changes → `index.html`.
- Visual/theme changes → `css/styles.css` (site-wide) or `src/hero/hero.css` (hero panel only).
- Interaction/animation/form logic outside the hero → `js/script.js`.
- The Avora System hero itself → `src/hero/` (React, plain DOM/CSS) + `src/main.tsx` (entry/GSAP setup).
- Reusable animation primitives (not currently wired into the shipped site) → `components/animation/`.
- Build config → `vite.config.ts`, `tsconfig.json`.
- Deployment config → `wrangler.jsonc`, `.assetsignore`.
