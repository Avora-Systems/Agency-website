import { useEffect, useState } from "react";

/**
 * True for coarse-pointer / no-hover devices (touch), where cursor-following
 * effects (magnetic buttons, custom cursors) don't make sense and should be
 * skipped in favour of native touch behaviour.
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    setIsTouch(query.matches);

    const handleChange = (event: MediaQueryListEvent) => setIsTouch(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isTouch;
}
