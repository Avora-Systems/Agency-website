import { useEffect, useState } from "react";
import { useReducedMotion } from "../../components/animation/hooks/useReducedMotion";
import { AvoraSystem } from "./AvoraSystem";
import { phaseForProgress } from "./sequence";
import "./hero.css";

function useHeroScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") setProgress(detail);
    };
    window.addEventListener("avora:hero-progress", handleProgress);
    return () => window.removeEventListener("avora:hero-progress", handleProgress);
  }, []);

  return progress;
}

/** Plays the sequence once, automatically, over `duration` ms — the mobile
 * substitute for the desktop scroll-pin (which feels bad on touch scroll
 * and isn't needed to tell the same story). */
function useAutoplayProgress(enabled: boolean, duration = 9000, startDelay = 500): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let startTime: number | null = null;

    const tick = (time: number) => {
      if (startTime === null) startTime = time + startDelay;
      const elapsed = Math.max(0, time - startTime);
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, duration, startDelay]);

  return progress;
}

/** Must agree with js/script.js's own decision to create (or skip) the
 * scroll-pin: pinning uses `position: fixed`, which clips to the viewport
 * regardless of the pinned element's own height. If the hero's natural
 * content is taller than the viewport (common on shorter laptop screens),
 * pinning it would make the CTA and stats unreachable for the whole pin
 * duration — so both sides fall back to the autoplay sequence instead. */
function useCanScrollPin(): boolean {
  const getSnapshot = () => {
    if (typeof window === "undefined") return true;
    const isDesktopViewport = window.matchMedia("(min-width: 921px)").matches;
    const hero = document.getElementById("top");
    const heroFitsViewport = hero ? hero.offsetHeight <= window.innerHeight : true;
    return isDesktopViewport && heroFitsViewport;
  };

  const [canPin, setCanPin] = useState(getSnapshot);

  useEffect(() => {
    const recompute = () => setCanPin(getSnapshot());
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  return canPin;
}

function useIsCompactViewport(): boolean {
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const handleChange = (event: MediaQueryListEvent) => setIsCompact(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isCompact;
}

export function HeroExperience() {
  const prefersReducedMotion = useReducedMotion();
  const canScrollPin = useCanScrollPin();
  const isCompact = useIsCompactViewport();
  const scrollProgress = useHeroScrollProgress();
  const autoProgress = useAutoplayProgress(!prefersReducedMotion && !canScrollPin);

  // Scroll-pin path: driven by the page's scroll-pin (js/script.js
  // dispatches it) when the viewport is wide and tall enough. Otherwise
  // (mobile, or a laptop screen too short to pin safely): plays once
  // automatically. Reduced motion: settle on the resolved end state and
  // never animate at all.
  const progress = prefersReducedMotion ? 1 : canScrollPin ? scrollProgress : autoProgress;
  const { phase, index, local } = phaseForProgress(progress);

  return (
    <div className="avora-core">
      <AvoraSystem phase={phase} index={index} local={local} motionEnabled={!prefersReducedMotion} compact={isCompact} />

      <div className="avora-core__status" role="status" aria-live="polite">
        <span className="avora-core__status-dot" aria-hidden="true"></span>
        <span className="avora-core__status-text">
          <strong>{phase.status}</strong>
          <span>{phase.detail}</span>
        </span>
      </div>
    </div>
  );
}
