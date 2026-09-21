"use client";

import { useMemo, useRef, type ComponentType, type CSSProperties, type ReactNode, type Ref } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export type SplitTextMode = "words" | "chars";
export type SplitTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

export interface SplitTextProps {
  /** Plain text to split and animate. */
  children: string;
  as?: SplitTextTag;
  className?: string;
  style?: CSSProperties;
  mode?: SplitTextMode;
  animateOn?: "mount" | "scroll";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  /** ScrollTrigger `start` position, only used when `animateOn="scroll"`. */
  start?: string;
  once?: boolean;
}

const DEFAULT_FROM: gsap.TweenVars = { opacity: 0, yPercent: 100 };
const DEFAULT_TO: gsap.TweenVars = { opacity: 1, yPercent: 0 };

const wordMaskStyle: CSSProperties = { display: "inline-block", overflow: "hidden" };
const unitStyle: CSSProperties = { display: "inline-block", willChange: "transform" };

/**
 * Splits a string into word or character spans for staggered GSAP
 * animation, without the paid SplitText plugin. The full, unsplit string is
 * exposed to assistive tech via `aria-label` on the wrapper element, while
 * the animated per-unit spans are marked `aria-hidden`, so screen readers
 * announce the text once and normally instead of word-by-word or
 * letter-by-letter.
 */
export function SplitText({
  children,
  as: Tag = "div",
  className,
  style,
  mode = "words",
  animateOn = "scroll",
  from = DEFAULT_FROM,
  to = DEFAULT_TO,
  duration = 0.8,
  stagger = 0.03,
  delay = 0,
  ease = "power3.out",
  start = "top 85%",
  once = true,
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const wordTokens = useMemo(() => children.split(/(\s+)/).filter((token) => token.length > 0), [children]);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>("[data-split-unit]");
    if (targets.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(targets, { clearProps: "all" });
      return;
    }

    const ctx = gsap.context(() => {
      const vars: gsap.TweenVars = {
        ...to,
        duration,
        delay,
        stagger,
        ease,
      };

      if (animateOn === "scroll") {
        vars.scrollTrigger = {
          trigger: el,
          start,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        };
      }

      gsap.fromTo(targets, from, vars);
    }, el);

    return () => ctx.revert();
  }, [mode, animateOn, duration, stagger, delay, ease, start, once, prefersReducedMotion, wordTokens]);

  const renderUnits = (): ReactNode =>
    wordTokens.map((token, index) => {
      if (/^\s+$/.test(token)) {
        return <span key={index}>{token}</span>;
      }

      if (mode === "words") {
        return (
          <span key={index} style={wordMaskStyle}>
            <span data-split-unit style={unitStyle}>
              {token}
            </span>
          </span>
        );
      }

      return (
        <span key={index} style={wordMaskStyle}>
          {token.split("").map((char, charIndex) => (
            <span key={charIndex} data-split-unit style={unitStyle}>
              {char}
            </span>
          ))}
        </span>
      );
    });

  // `as` accepts any of the heading/text tags in SplitTextTag, so its exact
  // prop shape can't be known statically here.
  const Component = Tag as unknown as ComponentType<{
    ref?: Ref<HTMLElement>;
    className?: string;
    style?: CSSProperties;
    "aria-label"?: string;
    children?: ReactNode;
  }>;

  return (
    <Component ref={containerRef} className={className} style={style} aria-label={children}>
      <span aria-hidden="true">{renderUnits()}</span>
    </Component>
  );
}
