"use client";

import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useReducedMotion } from "./hooks/useReducedMotion";

export interface PageTransitionProps {
  children: ReactNode;
  /** A key that changes per route/page (e.g. pathname). Required for
   * enter/exit transitions to trigger — this component is router-agnostic
   * and doesn't read any router itself. */
  pageKey: string;
  variants?: Variants;
  transition?: Transition;
  mode?: "sync" | "wait" | "popLayout";
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_VARIANTS: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const REDUCED_MOTION_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const DEFAULT_TRANSITION: Transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };
const REDUCED_MOTION_TRANSITION: Transition = { duration: 0.2 };

/**
 * A router-agnostic page-transition foundation. Not wired into any routing
 * yet — the caller supplies `pageKey` (e.g. from whichever router gets
 * adopted later) and wraps the routed content with it.
 */
export function PageTransition({
  children,
  pageKey,
  variants,
  transition,
  mode = "wait",
  className,
  style,
}: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const activeVariants = variants ?? (prefersReducedMotion ? REDUCED_MOTION_VARIANTS : DEFAULT_VARIANTS);
  const activeTransition = transition ?? (prefersReducedMotion ? REDUCED_MOTION_TRANSITION : DEFAULT_TRANSITION);

  return (
    <AnimatePresence mode={mode} initial={false}>
      <motion.div
        key={pageKey}
        className={className}
        style={style}
        variants={activeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={activeTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
