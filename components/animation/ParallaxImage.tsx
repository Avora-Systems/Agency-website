"use client";

import { useRef, type CSSProperties, type ImgHTMLAttributes } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export interface ParallaxImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "style"> {
  alt: string;
  /** Total px of vertical travel across the scroll range. */
  strength?: number;
  direction?: "up" | "down";
  scrub?: boolean | number;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  imgStyle?: CSSProperties;
}

/**
 * Wraps an <img> in an overflow-hidden container and translates it slower
 * (or faster) than the page scroll, oversizing the image so no gap is ever
 * exposed at the edges of its travel.
 */
export function ParallaxImage({
  strength = 80,
  direction = "up",
  scrub = true,
  containerClassName,
  containerStyle,
  imgStyle,
  className,
  ...imgProps
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || prefersReducedMotion) return;

    const travel = direction === "up" ? -strength : strength;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        image,
        { y: -travel / 2 },
        {
          y: travel / 2,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, [strength, direction, scrub, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={{ position: "relative", overflow: "hidden", ...containerStyle }}
    >
      <img
        ref={imageRef}
        className={className}
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          height: `calc(100% + ${strength}px)`,
          top: `-${strength / 2}px`,
          objectFit: "cover",
          willChange: "transform",
          ...imgStyle,
        }}
        {...imgProps}
      />
    </div>
  );
}
