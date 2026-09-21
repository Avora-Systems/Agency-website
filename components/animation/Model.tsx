"use client";

import { forwardRef } from "react";
import { Clone, useGLTF, type CloneProps } from "@react-three/drei";
import type { Group } from "three";

export interface ModelProps extends Omit<CloneProps, "object" | "ref"> {
  /** Path to a .gltf or .glb file, e.g. "/models/hero.glb". */
  src: string;
}

/**
 * Loads and renders a GLTF/GLB model. The forwarded ref points at the root
 * THREE.Group, ready to be driven later with `gsap.to(ref.current.rotation, {...})`
 * or similar — this component only loads/positions the asset, it doesn't
 * animate it. Preload with `preloadModel(src)` ahead of mount (e.g. on
 * hover of a trigger) to avoid a pop-in on first render.
 */
export const Model = forwardRef<Group, ModelProps>(function Model({ src, ...cloneProps }, forwardedRef) {
  const { scene } = useGLTF(src);

  return <Clone ref={forwardedRef} object={scene} {...cloneProps} />;
});

Model.displayName = "Model";

/** Warms the GLTF cache ahead of mount, e.g. on route/section hover. */
export function preloadModel(src: string) {
  useGLTF.preload(src);
}
