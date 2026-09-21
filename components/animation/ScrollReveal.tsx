"use client";

import { useRef, type ComponentType, type CSSProperties, type ElementType, type ReactNode, type Ref } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollRevealProps {
  children: ReactNode;
  /** Tag or component to render as, e.g. "div" | "li" | "h2". Defaults to "div". */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Starting tween values. */
  from?: gsap.TweenVars;
  /** Ending tween values. */
  to?: gsap.TweenVars;
  duration?: number;
  delay?: number;
  ease?: string;
  /** ScrollTrigger `start` position, e.g. "top 85%". */
  start?: string;
  end?: string;
  scrub?: boolean | number;
  /** Play once and never reverse (default) vs. replay on re-entry. */
  once?: boolean;
  markers?: boolean;
}

const DEFAULT_FROM: gsap.TweenVars = { opacity: 0, y: 40 };
const DEFAULT_TO: gsap.TweenVars = { opacity: 1, y: 0 };

/**
 * Reveals its children when they scroll into view. `from`/`to` are read once
 * per mount (typical for a reveal-on-scroll pattern) — pass stable
 * references (module-level constants or memoized objects) if they need to
 * change between renders.
 */
export function ScrollReveal({
  children,
  as: Tag = "div",
  className,
  style,
  from = DEFAULT_FROM,
  to = DEFAULT_TO,
  duration = 0.8,
  delay = 0,
  ease = "power3.out",
  start = "top 85%",
  end,
  scrub = false,
  once = true,
  markers = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(el, from, {
        ...to,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
          markers,
        },
      });
    });

    return () => ctx.revert();
  }, [prefersReducedMotion, duration, delay, ease, start, end, scrub, once, markers]);

  // `as` accepts any tag/component, so its exact prop shape can't be known
  // statically here; the public props above (from/to/duration/...) stay
  // fully typed regardless.
  const Component = Tag as ComponentType<{
    ref?: Ref<HTMLElement>;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }>;

  return (
    <Component ref={ref} className={className} style={style}>
      {children}
    </Component>
  );
}
