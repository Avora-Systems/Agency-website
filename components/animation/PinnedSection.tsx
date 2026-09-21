"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export interface PinnedSectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** How many viewport-heights of scroll the pin lasts for. */
  distance?: number;
  pinSpacing?: boolean;
  scrub?: boolean | number;
  anticipatePin?: number;
  /** Called on every ScrollTrigger update with progress in [0, 1]. Use this
   * to drive step indices, horizontal scroll offsets, etc. */
  onUpdate?: (progress: number) => void;
  /** Skip pinning entirely when the user prefers reduced motion (default true). */
  disableOnReducedMotion?: boolean;
}

/**
 * Pins its children in place for a configurable scroll distance, exposing
 * scroll progress via `onUpdate` so the caller can drive its own animation
 * (horizontal scroll, step reveals, scrubbed timelines, ...).
 */
export function PinnedSection({
  children,
  className,
  style,
  distance = 1,
  pinSpacing = true,
  scrub = true,
  anticipatePin = 1,
  onUpdate,
  disableOnReducedMotion = true,
}: PinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const prefersReducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (disableOnReducedMotion && prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => `+=${el.offsetHeight * distance}`,
      pin: true,
      pinSpacing,
      scrub,
      anticipatePin,
      onUpdate: (self) => onUpdateRef.current?.(self.progress),
    });

    return () => trigger.kill();
  }, [distance, pinSpacing, scrub, anticipatePin, disableOnReducedMotion, prefersReducedMotion]);

  return (
    <div ref={sectionRef} className={className} style={style}>
      {children}
    </div>
  );
}
