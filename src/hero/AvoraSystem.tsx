import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  COMPACT_CARD_POSITION,
  DOCK_CONTENT,
  DOCK_POSITIONS,
  FUNCTION_TAGS,
  MODULE_POSITION,
  activeDockFor,
  moduleLineFor,
  type DockId,
  type HeroPhase,
} from "./sequence";

const DOCK_IDS = Object.keys(DOCK_POSITIONS) as DockId[];

interface AvoraSystemProps {
  phase: HeroPhase;
  index: number;
  local: number;
  /** False under prefers-reduced-motion: skips entrance keyframes, the
   * particle travel tween, and the cursor-tilt effect entirely. */
  motionEnabled: boolean;
  /** True on narrow viewports: fixed card content doesn't shrink with the
   * container, so four accumulated corner cards start overlapping below
   * ~600px wide. Compact mode shows only the current card, full size, plus
   * a small checklist for what's already been handled — simpler, and a
   * better fit for "simplified" mobile per the brief besides. */
  compact: boolean;
}

export function AvoraSystem({ phase, index, local, motionEnabled, compact }: AvoraSystemProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<Partial<Record<DockId, HTMLDivElement | null>>>({});
  const prevActiveDock = useRef<DockId | null>(null);
  const activeDock = activeDockFor(index, local);
  const moduleLine = moduleLineFor(index, local);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !motionEnabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const handleMove = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--tilt-x", `${py * -6}deg`);
      stage.style.setProperty("--tilt-y", `${px * 8}deg`);
    };
    const handleLeave = () => {
      stage.style.setProperty("--tilt-x", "0deg");
      stage.style.setProperty("--tilt-y", "0deg");
    };

    stage.addEventListener("mousemove", handleMove);
    stage.addEventListener("mouseleave", handleLeave);
    return () => {
      stage.removeEventListener("mousemove", handleMove);
      stage.removeEventListener("mouseleave", handleLeave);
    };
  }, [motionEnabled]);

  useEffect(() => {
    if (motionEnabled && activeDock && activeDock !== prevActiveDock.current) {
      const dot = particleRefs.current[activeDock];
      const target = compact ? COMPACT_CARD_POSITION : DOCK_POSITIONS[activeDock];
      if (dot) {
        gsap.killTweensOf(dot);
        gsap.set(dot, { left: `${MODULE_POSITION.left}%`, top: `${MODULE_POSITION.top}%`, opacity: 1 });
        gsap.to(dot, {
          left: `${target.left}%`,
          top: `${target.top}%`,
          duration: 0.9,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.to(dot, { opacity: 0, duration: 0.4, delay: 0.2 });
          },
        });
      }
    }
    prevActiveDock.current = activeDock;
  }, [activeDock, motionEnabled, compact]);

  const handledDocks = phase.visibleDocks.filter((id) => id !== activeDock);

  return (
    <div className={`avora-system${motionEnabled ? "" : " no-motion"}${compact ? " is-compact" : ""}`} ref={stageRef}>
      <svg className="avora-system__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {compact
          ? activeDock && (
              <line
                x1={MODULE_POSITION.left}
                y1={MODULE_POSITION.top}
                x2={COMPACT_CARD_POSITION.left}
                y2={COMPACT_CARD_POSITION.top}
                className="is-active"
              />
            )
          : phase.visibleDocks.map((dockId) => (
              <line
                key={dockId}
                x1={MODULE_POSITION.left}
                y1={MODULE_POSITION.top}
                x2={DOCK_POSITIONS[dockId].left}
                y2={DOCK_POSITIONS[dockId].top}
                className={dockId === activeDock ? "is-active" : ""}
              />
            ))}
      </svg>

      {(compact ? (activeDock ? [activeDock] : []) : phase.visibleDocks).map((dockId) => (
        <div
          key={dockId}
          ref={(el) => {
            particleRefs.current[dockId] = el;
          }}
          className="avora-system__particle"
          aria-hidden="true"
        />
      ))}

      <div className="avora-system__module" style={{ left: `${MODULE_POSITION.left}%`, top: `${MODULE_POSITION.top}%` }}>
        <span className="avora-system__module-mark">AVORA</span>
        <span className="avora-system__module-line">{moduleLine}</span>
      </div>

      {compact
        ? activeDock && (
            <div
              className="avora-system__card avora-system__card--compact is-active"
              style={{ left: `${COMPACT_CARD_POSITION.left}%`, top: `${COMPACT_CARD_POSITION.top}%` }}
            >
              <span className="avora-system__card-title">{DOCK_CONTENT[activeDock].title}</span>
              {DOCK_CONTENT[activeDock].lines.map((line, i) => (
                <span className="avora-system__card-line" key={i}>
                  {line.label ? <b>{line.label}</b> : null}
                  {line.value}
                </span>
              ))}
              {DOCK_CONTENT[activeDock].footer && (
                <span className="avora-system__card-footer">{DOCK_CONTENT[activeDock].footer}</span>
              )}
            </div>
          )
        : DOCK_IDS.filter((id) => phase.visibleDocks.includes(id)).map((dockId) => {
            const content = DOCK_CONTENT[dockId];
            const pos = DOCK_POSITIONS[dockId];
            const isActive = dockId === activeDock;
            return (
              <div
                key={dockId}
                className={`avora-system__card avora-system__card--${dockId} ${isActive ? "is-active" : "is-muted"}`}
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              >
                <span className="avora-system__card-title">
                  {content.title}
                  {!isActive && (
                    <svg className="avora-system__card-check" width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {content.lines.map((line, i) => (
                  <span className="avora-system__card-line" key={i}>
                    {line.label ? <b>{line.label}</b> : null}
                    {line.value}
                  </span>
                ))}
                {content.footer && <span className="avora-system__card-footer">{content.footer}</span>}
              </div>
            );
          })}

      {compact && handledDocks.length > 0 && (
        <ul className="avora-system__checklist">
          {handledDocks.map((dockId) => (
            <li key={dockId}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {DOCK_CONTENT[dockId].title}
            </li>
          ))}
        </ul>
      )}

      <div className="avora-system__tags">
        {FUNCTION_TAGS.map((tag) => (
          <span key={tag} className={phase.activeTags.includes(tag) ? "is-active" : ""}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
