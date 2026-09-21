"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { useIsTouchDevice } from "./hooks/useIsTouchDevice";
import { useReducedMotion } from "./hooks/useReducedMotion";

export interface CustomCursorProps {
  dotSize?: number;
  ringSize?: number;
  /** Ring follow-lag duration in seconds. */
  ringEase?: number;
  dotColor?: string;
  ringColor?: string;
  hideNativeCursor?: boolean;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  /** CSS selector for elements that should enlarge the ring on hover. */
  interactiveSelector?: string;
  interactiveScale?: number;
}

/**
 * A dot + lagging-ring custom cursor. Renders nothing (and attaches no
 * listeners) on touch devices or when `prefers-reduced-motion` is set, so
 * mounting it is always safe — it self-disables where it doesn't belong.
 * Not activated anywhere by default; mount it explicitly where wanted.
 */
export function CustomCursor({
  dotSize = 8,
  ringSize = 36,
  ringEase = 0.15,
  dotColor = "currentColor",
  ringColor = "currentColor",
  hideNativeCursor = true,
  mixBlendMode,
  interactiveSelector = "a, button, [data-cursor-interactive]",
  interactiveScale = 1.6,
}: CustomCursorProps) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const disabled = prefersReducedMotion || isTouch;

  useEffect(() => {
    if (disabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const quickDotX = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3" });
    const quickDotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3" });
    const quickRingX = gsap.quickTo(ring, "x", { duration: ringEase, ease: "power3" });
    const quickRingY = gsap.quickTo(ring, "y", { duration: ringEase, ease: "power3" });

    const handleMove = (event: MouseEvent) => {
      quickDotX(event.clientX);
      quickDotY(event.clientY);
      quickRingX(event.clientX);
      quickRingY(event.clientY);
    };

    const handleEnter = () => gsap.to(ring, { scale: interactiveScale, duration: 0.3, ease: "power3.out" });
    const handleLeave = () => gsap.to(ring, { scale: 1, duration: 0.3, ease: "power3.out" });

    window.addEventListener("mousemove", handleMove);

    const interactiveEls = Array.from(document.querySelectorAll<HTMLElement>(interactiveSelector));
    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    const originalCursor = document.body.style.cursor;
    if (hideNativeCursor) document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", handleMove);
      interactiveEls.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
      if (hideNativeCursor) document.body.style.cursor = originalCursor;
      gsap.killTweensOf([dot, ring]);
    };
  }, [disabled, ringEase, interactiveSelector, interactiveScale, hideNativeCursor]);

  if (disabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: dotColor,
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode,
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `1px solid ${ringColor}`,
          pointerEvents: "none",
          zIndex: 9998,
          mixBlendMode,
        }}
      />
    </>
  );
}
