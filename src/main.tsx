import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { createRoot } from "react-dom/client";
import { HeroExperience } from "./hero/HeroExperience";

// This bundle is the single source of GSAP on the page: it registers the
// plugins once and exposes them as globals so the legacy, non-module
// js/script.js (loaded right after this file, see index.html) can keep using
// `gsap`/`ScrollTrigger` exactly as it did when they came from a CDN
// <script> tag. Do not also load GSAP from a CDN — a second copy would mean
// a second ScrollTrigger registry and a second ticker fighting this one.
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);

declare global {
  interface Window {
    gsap: typeof gsap;
    ScrollTrigger: typeof ScrollTrigger;
    SplitText: typeof SplitText;
    DrawSVGPlugin: typeof DrawSVGPlugin;
    MotionPathPlugin: typeof MotionPathPlugin;
  }
}

window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.SplitText = SplitText;
window.DrawSVGPlugin = DrawSVGPlugin;
window.MotionPathPlugin = MotionPathPlugin;

// The hero is plain DOM/CSS now (no WebGL), so it's cheap enough to mount
// everywhere — HeroExperience itself decides between the desktop scroll-pin,
// a mobile autoplay-once sequence, and a static resolved state under
// reduced motion. The static markup already in index.html is only ever
// seen pre-hydration or if this script fails to load at all.
const heroRoot = document.getElementById("avora-hero-root");
if (heroRoot) {
  createRoot(heroRoot).render(<HeroExperience />);
}
