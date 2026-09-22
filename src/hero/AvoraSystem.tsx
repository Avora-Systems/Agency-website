import { useEffect, useRef, type ReactElement } from "react";
import gsap from "gsap";
import {
  BACKBONE_PATH_D,
  BRANCHES,
  RAIL_PATH_D,
  STATIONS,
  bubbleAlignFor,
  statusForStation,
  type HeroPhase,
  type StationId,
} from "./sequence";

const COMPACT_POSITION: [number, number] = [50, 68];

/** Small, consistent-stroke line icons — kept inline rather than an icon
 * package dependency for five one-off glyphs. Two elements carry their own
 * class hook (flow-icon__dot, flow-icon__check-path) for the per-station
 * micro-interactions below (a calendar dot pulse, a checkmark draw-in). */
const STATION_ICONS: Record<StationId, ReactElement> = {
  enquiry: (
    <path d="M2.5 3.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8l-3 2.5V11.5H2.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
  ),
  ai: <path d="M8 1.8 9.3 6 13.5 7.3 9.3 8.6 8 12.8 6.7 8.6 2.5 7.3 6.7 6 8 1.8Z" />,
  crm: (
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.4" />
      <circle cx="6" cy="7.4" r="1.4" />
      <path d="M3.8 10.6c.4-1 1.2-1.5 2.2-1.5s1.8.5 2.2 1.5M9.8 6.6h3M9.8 9h3" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.5" y="3" width="11" height="10.5" rx="1.4" />
      <path d="M2.5 6.2h11M5.3 1.8v2.6M10.7 1.8v2.6" />
      <circle className="flow-icon__dot" cx="8" cy="9.6" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  booked: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <path className="flow-icon__check-path" d="M5.3 8.1 7.1 9.9 10.8 6.2" />
    </>
  ),
};

interface AvoraSystemProps {
  phase: HeroPhase;
  progress: number;
  motionEnabled: boolean;
  compact: boolean;
}

export function AvoraSystem({ phase, progress, motionEnabled, compact }: AvoraSystemProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);
  const branchRefs = useRef<(SVGPathElement | null)[]>([]);
  const signalRef = useRef<SVGCircleElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const backboneRef = useRef<SVGPathElement>(null);
  const ambientRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const prevActiveIndex = useRef(-1);
  const { activeIndex } = phase;
  const activeStation = activeIndex >= 0 ? STATIONS[activeIndex] : null;

  // Cursor-linked tilt on the whole stage, same restrained idiom as the
  // rest of the site's depth cues — desktop, fine-pointer only.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !motionEnabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const handleMove = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--tilt-x", `${py * -5}deg`);
      stage.style.setProperty("--tilt-y", `${px * 7}deg`);
      // A second, shallower depth plane: the ambient glow drifts less than
      // the foreground rail/stations, which is what actually reads as
      // "layers" rather than one flat card tilting as a unit.
      stage.style.setProperty("--tilt-x-far", `${py * -2}deg`);
      stage.style.setProperty("--tilt-y-far", `${px * 3}deg`);
    };
    const handleLeave = () => {
      stage.style.setProperty("--tilt-x", "0deg");
      stage.style.setProperty("--tilt-y", "0deg");
      stage.style.setProperty("--tilt-x-far", "0deg");
      stage.style.setProperty("--tilt-y-far", "0deg");
    };

    stage.addEventListener("mousemove", handleMove);
    stage.addEventListener("mouseleave", handleLeave);
    return () => {
      stage.removeEventListener("mousemove", handleMove);
      stage.removeEventListener("mouseleave", handleLeave);
    };
  }, [motionEnabled]);

  // The bright overlay on the rail: how far the current signal has
  // travelled, continuously tied to scroll/autoplay progress rather than
  // jumping station to station.
  useEffect(() => {
    const path = progressPathRef.current;
    if (!path) return;
    gsap.killTweensOf(path);
    if (!motionEnabled) {
      gsap.set(path, { drawSVG: `${progress * 100}%` });
      return;
    }
    gsap.to(path, { drawSVG: `${progress * 100}%`, duration: 0.4, ease: "power1.out" });
  }, [progress, motionEnabled]);

  // Two dim particles loop the background backbone continuously, so the
  // panel never reads as fully frozen between phases — independent of the
  // signal, which only ever travels the foreground rail during a handoff.
  useEffect(() => {
    const backbone = backboneRef.current;
    const dots = ambientRefs.current;
    if (!backbone) return;
    if (!motionEnabled) {
      dots.forEach((dot) => dot && gsap.set(dot, { opacity: 0 }));
      return;
    }
    const tweens = dots.map((dot, i) => {
      if (!dot) return null;
      gsap.set(dot, { opacity: 0 });
      return gsap.to(dot, {
        motionPath: { path: backbone, start: 0, end: 1 },
        duration: i === 0 ? 13 : 17,
        delay: i * 4,
        repeat: -1,
        ease: "none",
        onStart: () => gsap.to(dot, { opacity: 0.4, duration: 1 }),
      });
    });
    return () => tweens.forEach((t) => t?.kill());
  }, [motionEnabled]);

  // The branch paths (WhatsApp/Email off AI, Documents off CRM, Invoicing
  // off Booked): a brief, partial reveal while their parent station is
  // active, suggesting more of the business is connected than the one path
  // being told right now — never more than two lit at once.
  useEffect(() => {
    branchRefs.current.forEach((el, i) => {
      if (!el) return;
      const branch = BRANCHES[i]!;
      const target = branch.duringIndex === activeIndex ? 68 : 0;
      // Kill first: prefers-reduced-motion resolves one render after mount
      // (see useReducedMotion), so a motionEnabled=true tween can already be
      // in flight when the reduced-motion render's gsap.set fires — without
      // this, the still-running tween keeps overwriting that set every
      // frame until it finishes, silently winning the race.
      gsap.killTweensOf(el);
      if (!motionEnabled) {
        gsap.set(el, { drawSVG: `${target}%` });
        return;
      }
      gsap.to(el, { drawSVG: `${target}%`, duration: 0.6, ease: "power2.out" });
    });
  }, [activeIndex, motionEnabled]);

  // The signal itself: hops from station to station along the exact rail
  // curve (not a straight line) whenever the active station changes.
  useEffect(() => {
    const dot = signalRef.current;
    const rail = railRef.current;
    if (!dot || !rail) return;
    const total = STATIONS.length - 1;
    const fractionFor = (i: number) => Math.max(0, i) / total;

    if (activeIndex === -1) {
      gsap.set(dot, { opacity: 0 });
      prevActiveIndex.current = -1;
      return;
    }

    const from = fractionFor(prevActiveIndex.current === -1 ? 0 : prevActiveIndex.current);
    const to = fractionFor(activeIndex);

    if (!motionEnabled) {
      gsap.set(dot, { opacity: 1, motionPath: { path: rail, start: to, end: to } });
    } else {
      gsap.killTweensOf(dot);
      gsap.set(dot, { opacity: 1, motionPath: { path: rail, start: from, end: from } });
      gsap.to(dot, {
        motionPath: { path: rail, start: from, end: to },
        duration: 0.85,
        ease: "power2.inOut",
      });
    }
    prevActiveIndex.current = activeIndex;
  }, [activeIndex, motionEnabled]);

  // A soft glow eases toward whichever station is active (or the panel
  // centre at idle), reading as ambient light rather than another marker —
  // it's what gives the composition a foreground/background plane.
  useEffect(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    const target = activeStation ? activeStation.position : [50, 46];
    if (!motionEnabled) {
      gsap.set(spotlight, { left: `${target[0]}%`, top: `${target[1]}%` });
      return;
    }
    gsap.to(spotlight, { left: `${target[0]}%`, top: `${target[1]}%`, duration: 1.1, ease: "power2.out" });
  }, [activeStation, motionEnabled]);

  return (
    <div
      className={`flow${motionEnabled ? "" : " no-motion"}${compact ? " is-compact" : ""}`}
      ref={stageRef}
    >
      <div className="flow__spotlight" ref={spotlightRef} aria-hidden="true" />

      <svg className="flow__rail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path ref={backboneRef} className="flow__backbone" d={BACKBONE_PATH_D} />
        <path ref={railRef} className="flow__rail-base" d={RAIL_PATH_D} />
        {/* strokeDasharray placeholder avoids a one-frame flash of a fully
            drawn line before the mount effect below hands control to
            DrawSVGPlugin, which fully replaces this attribute anyway. */}
        <path ref={progressPathRef} className="flow__rail-progress" d={RAIL_PATH_D} strokeDasharray="0.01 1000" />
        {BRANCHES.map((branch, i) => (
          <path
            key={branch.id}
            ref={(el) => {
              branchRefs.current[i] = el;
            }}
            className="flow__branch"
            strokeDasharray="0.01 1000"
            d={`M ${branch.from[0]},${branch.from[1]} C ${branch.from[0] - 4},${branch.from[1] + 11} ${branch.to[0] + 3},${branch.to[1] - 9} ${branch.to[0]},${branch.to[1]}`}
          />
        ))}
        <circle
          ref={(el) => {
            ambientRefs.current[0] = el;
          }}
          className="flow__ambient"
          r="0.55"
        />
        <circle
          ref={(el) => {
            ambientRefs.current[1] = el;
          }}
          className="flow__ambient"
          r="0.4"
        />
        <circle ref={signalRef} className="flow__signal" r="1.15" opacity="0" />
      </svg>

      {BRANCHES.map((branch) => (
        <span
          key={branch.id}
          className={`flow__branch-label${branch.duringIndex === activeIndex ? " is-active" : ""}`}
          style={{ left: `${branch.to[0]}%`, top: `${branch.to[1]}%` }}
        >
          {branch.label}
        </span>
      ))}

      {!compact &&
        STATIONS.map((station, i) => {
          const status = statusForStation(i, activeIndex);
          // Stations low in the panel (>50%) show their bubble above (the
          // default) since there's little room below before the status bar;
          // stations in the upper half show it below instead. Edge stations
          // (Enquiry, Booked) also anchor left/right instead of centering,
          // so the bubble grows inward rather than off the panel.
          const bubbleBelow = station.position[1] <= 50;
          const align = bubbleAlignFor(station.position[0]);
          return (
            <div
              key={station.id}
              className={`flow-station flow-station--${status} flow-station--${station.id}`}
              style={{ left: `${station.position[0]}%`, top: `${station.position[1]}%` }}
            >
              {status === "active" && (
                <span
                  className={`flow-station__bubble${bubbleBelow ? " flow-station__bubble--below" : ""}${align !== "center" ? ` flow-station__bubble--${align}` : ""}`}
                >
                  {phase.status}
                </span>
              )}
              <span className="flow-station__node">
                <span className="flow-station__led" aria-hidden="true" />
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  {STATION_ICONS[station.id]}
                </svg>
                {status === "handled" && (
                  <svg className="flow-station__check" width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="flow-station__label">{station.label}</span>
            </div>
          );
        })}

      {compact && (
        <>
          {STATIONS.map((station, i) => {
            const status = statusForStation(i, activeIndex);
            if (status === "active") return null;
            return (
              <span
                key={station.id}
                className={`flow-station__dot flow-station__dot--${status}`}
                style={{ left: `${station.position[0]}%`, top: `${station.position[1]}%` }}
              />
            );
          })}
          {activeIndex >= 0 && (
            <div
              className={`flow-station flow-station--active flow-station--compact flow-station--${STATIONS[activeIndex]!.id}`}
              style={{ left: `${COMPACT_POSITION[0]}%`, top: `${COMPACT_POSITION[1]}%` }}
            >
              <span className="flow-station__bubble">{phase.status}</span>
              <span className="flow-station__node">
                <span className="flow-station__led" aria-hidden="true" />
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  {STATION_ICONS[STATIONS[activeIndex]!.id]}
                </svg>
              </span>
              <span className="flow-station__label">{STATIONS[activeIndex]!.label}</span>
            </div>
          )}
          <ul className="flow__checklist">
            {STATIONS.filter((_, i) => statusForStation(i, activeIndex) === "handled").map((station) => (
              <li key={station.id}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {station.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
