import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server, so components
 * that measure or animate the DOM don't trigger the SSR "useLayoutEffect
 * does nothing on the server" warning if this library is later dropped into
 * a server-rendered framework.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
