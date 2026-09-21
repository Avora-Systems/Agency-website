"use client";

import {
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
import { useIsTouchDevice } from "./hooks/useIsTouchDevice";
import { useReducedMotion } from "./hooks/useReducedMotion";

interface MagneticButtonOwnProps {
  children: ReactNode;
  /** How far the element travels toward the cursor, 0-1 of the raw offset. */
  strength?: number;
  /** Extra px beyond the element's own bounds where attraction kicks in. */
  radius?: number;
  /** Follow-tween duration in seconds. */
  ease?: number;
  /** Release-tween easing once the cursor leaves. */
  releaseEase?: string;
}

type MagneticButtonAsButton = MagneticButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    as?: "button";
  };

type MagneticButtonAsAnchor = MagneticButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    as: "a";
  };

export type MagneticButtonProps = MagneticButtonAsButton | MagneticButtonAsAnchor;

/**
 * Pulls itself toward the cursor within an activation radius, and springs
 * back on release. Fully inert on touch devices and when
 * `prefers-reduced-motion` is set — it renders as a plain button/link with
 * no transform applied.
 */
export function MagneticButton(props: MagneticButtonProps) {
  const {
    children,
    strength = 0.4,
    radius = 60,
    ease = 0.4,
    releaseEase = "elastic.out(1, 0.4)",
    className,
    style,
    as = "button",
    ...rest
  } = props;

  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const disabled = prefersReducedMotion || isTouch;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const quickX = gsap.quickTo(el, "x", { duration: ease, ease: "power3" });
    const quickY = gsap.quickTo(el, "y", { duration: ease, ease: "power3" });

    const handleMouseMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;
      const distance = Math.hypot(distanceX, distanceY);
      const activationRadius = Math.max(rect.width, rect.height) / 2 + radius;

      if (distance < activationRadius) {
        quickX(distanceX * strength);
        quickY(distanceY * strength);
      } else {
        quickX(0);
        quickY(0);
      }
    };

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: releaseEase });
    };

    window.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [disabled, strength, radius, ease, releaseEase]);

  const mergedStyle = { display: "inline-block", ...style };

  if (as === "a") {
    return (
      <a
        ref={ref}
        className={className}
        style={mergedStyle}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      className={className}
      style={mergedStyle}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
