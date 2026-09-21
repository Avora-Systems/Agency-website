"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollContext = createContext<Lenis | null>(null);

/**
 * Access the active Lenis instance, e.g. to call `lenis.scrollTo(target)`
 * from a nested nav link. Returns `null` when rendered outside a
 * `SmoothScroll` provider, or when smooth scrolling is disabled
 * (reduced motion, or the `disabled` prop).
 */
export function useLenis(): Lenis | null {
  return useContext(SmoothScrollContext);
}

export interface SmoothScrollProps {
  children: ReactNode;
  /** Scroll ease duration in seconds. */
  duration?: number;
  easing?: (t: number) => number;
  smoothWheel?: boolean;
  touchMultiplier?: number;
  /** Enables smoothing for touch input too (off by default; native touch scroll usually feels better). */
  syncTouch?: boolean;
  /** Manual escape hatch in addition to the automatic `prefers-reduced-motion` check. */
  disabled?: boolean;
  onScroll?: (lenis: Lenis) => void;
}

const DEFAULT_EASE = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

/**
 * Wires Lenis' smoothed scroll position into GSAP's ScrollTrigger so the two
 * stay in sync. This does NOT enable smooth scrolling anywhere by itself —
 * it only takes effect for the subtree of a page that is deliberately
 * wrapped in `<SmoothScroll>`.
 */
export function SmoothScroll({
  children,
  duration = 1.2,
  easing = DEFAULT_EASE,
  smoothWheel = true,
  touchMultiplier = 2,
  syncTouch = false,
  disabled = false,
  onScroll,
}: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || prefersReducedMotion;

  useEffect(() => {
    if (isDisabled) return;

    const instance = new Lenis({
      duration,
      easing,
      smoothWheel,
      touchMultiplier,
      syncTouch,
    });

    const handleScroll = () => onScrollRef.current?.(instance);
    instance.on("scroll", ScrollTrigger.update);
    instance.on("scroll", handleScroll);

    const tick = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.off("scroll", ScrollTrigger.update);
      instance.off("scroll", handleScroll);
      instance.destroy();
      setLenis(null);
    };
    // `easing` is expected to be a stable reference (module-level or memoized).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled, duration, easing, smoothWheel, touchMultiplier, syncTouch]);

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
