"use client";

import { Suspense, type CSSProperties, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useReducedMotion } from "./hooks/useReducedMotion";

export interface SceneCanvasProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  camera?: CanvasProps["camera"];
  dpr?: CanvasProps["dpr"];
  shadows?: boolean;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
  /** Shown while children (e.g. a `Model`) are suspended during load. */
  fallback?: ReactNode;
  /** Defaults to "demand" under reduced motion (renders only when something
   * changes) and "always" otherwise. */
  frameloop?: CanvasProps["frameloop"];
}

const DEFAULT_CAMERA: CanvasProps["camera"] = { position: [0, 0, 5], fov: 45, near: 0.1, far: 100 };

/**
 * A sensible React Three Fiber canvas foundation: capped DPR, basic
 * three-point-ish lighting (ambient + one directional), and a Suspense
 * boundary for async assets (GLTF models, textures). Scenes are composed by
 * passing children (meshes, a `Model`, etc.). Deliberately has no
 * dependency on @react-three/drei — its adaptive-perf helpers aren't worth
 * the extra bundle weight on top of the fixed `dpr` cap below.
 */
export function SceneCanvas({
  children,
  className,
  style,
  camera = DEFAULT_CAMERA,
  dpr = [1, 2],
  shadows = false,
  ambientLightIntensity = 0.6,
  directionalLightIntensity = 1,
  fallback = null,
  frameloop,
}: SceneCanvasProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Canvas
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      camera={camera}
      dpr={dpr}
      shadows={shadows}
      frameloop={frameloop ?? (prefersReducedMotion ? "demand" : "always")}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={ambientLightIntensity} />
      <directionalLight intensity={directionalLightIntensity} position={[5, 8, 5]} castShadow={shadows} />
      <Suspense fallback={fallback}>{children}</Suspense>
    </Canvas>
  );
}
