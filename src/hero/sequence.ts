// Data model for the Avora hero: a business automation FLOW, not a
// dashboard. Five stations (Enquiry -> AI -> CRM -> Calendar -> Booked) sit
// at staggered heights along one continuous curved path — Avora itself is
// represented by that connecting current, not by a central node, so nothing
// here reads as "one big object with things orbiting it."

export type Point = [number, number];

export type StationId = "enquiry" | "ai" | "crm" | "calendar" | "booked";

export interface Station {
  id: StationId;
  label: string;
  position: Point;
}

// A near-square stage (see hero.css aspect-ratio), 0-100 coordinate space.
// Heights deliberately vary (30 / 66 / 26 / 64 / 34) so the path through
// them is a wave, not a straight pipeline — the brief specifically asked
// for varied heights and overlapping depth rather than a flowchart.
export const STATIONS: Station[] = [
  { id: "enquiry", label: "Enquiry", position: [9, 30] },
  { id: "ai", label: "AI", position: [31, 68] },
  { id: "crm", label: "CRM", position: [56, 24] },
  { id: "calendar", label: "Calendar", position: [79, 64] },
  { id: "booked", label: "Booked", position: [93, 32] },
];

export interface Branch {
  id: string;
  label: string;
  from: Point;
  to: Point;
  /** Index into STATIONS whose active phase briefly lights this branch. */
  duringIndex: number;
}

/** Ghost branch targets — never a primary stop, just a brief pulse while
 * their parent station is active, to suggest Avora reaches more of the
 * business than the one path being told right now. Deliberately never more
 * than two lit at once (each is tied to a single phase), so this reads as
 * "expandable" rather than the old 8-item wall of equal-priority icons. */
export const BRANCHES: Branch[] = [
  { id: "whatsapp", label: "WhatsApp", from: STATIONS[1]!.position, to: [16, 74], duringIndex: 1 },
  { id: "email", label: "Email", from: STATIONS[1]!.position, to: [44, 77], duringIndex: 1 },
  { id: "documents", label: "Documents", from: STATIONS[2]!.position, to: [69, 6], duringIndex: 2 },
  { id: "invoicing", label: "Invoicing", from: STATIONS[4]!.position, to: [79, 9], duringIndex: 4 },
];

/** A faint, always-present backbone connecting the first and last station
 * directly — a shallow arc well above the main wave, distinct from it, read
 * as "the system stays connected end-to-end" rather than another journey to
 * follow. Static and very dim; never brightens or carries the signal. */
export const BACKBONE_PATH_D = `M ${STATIONS[0]!.position[0]},${STATIONS[0]!.position[1]} C 35,2 65,2 ${STATIONS[4]!.position[0]},${STATIONS[4]!.position[1]}`;

/** Uniform Catmull-Rom -> cubic-bezier conversion (tension 1/6), duplicating
 * the end points so the curve doesn't overshoot at the first/last station.
 * Produces one smooth path through every station in order. */
export function smoothPathD(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0]![0]},${points[0]![1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export const RAIL_PATH_D = smoothPathD(STATIONS.map((s) => s.position));

export interface HeroPhase {
  range: [number, number];
  status: string;
  detail: string;
  /** Index into STATIONS currently receiving the signal, or -1 before the
   * first enquiry arrives. */
  activeIndex: number;
}

export const HERO_PHASES: HeroPhase[] = [
  { range: [0, 0.12], status: "Avora is connected", detail: "Watching every channel for new enquiries", activeIndex: -1 },
  { range: [0.12, 0.3], status: "New enquiry", detail: "Website enquiry received", activeIndex: 0 },
  { range: [0.3, 0.48], status: "Reply generated", detail: "AI drafts a response and checks availability", activeIndex: 1 },
  { range: [0.48, 0.64], status: "Lead updated", detail: "CRM logged automatically", activeIndex: 2 },
  { range: [0.64, 0.82], status: "Slot found", detail: "A calendar slot is held automatically", activeIndex: 3 },
  { range: [0.82, 1.01], status: "Booking confirmed", detail: "Customer notified automatically", activeIndex: 4 },
];

export interface PhaseState {
  phase: HeroPhase;
  index: number;
  local: number;
}

export function phaseForProgress(progress: number): PhaseState {
  const clamped = Math.min(0.999, Math.max(0, progress));
  const index = HERO_PHASES.findIndex((p) => clamped >= p.range[0] && clamped < p.range[1]);
  const safeIndex = index === -1 ? HERO_PHASES.length - 1 : index;
  const phase = HERO_PHASES[safeIndex]!;
  const [start, end] = phase.range;
  const local = (clamped - start) / (end - start);
  return { phase, index: safeIndex, local };
}

/** Station status is derived rather than stored per phase: "upcoming" (not
 * reached yet), "active" (receiving the signal right now, shows the phase's
 * status bubble), or "handled" (signal already passed through, settles to a
 * steady lit state with a small check). */
export type StationStatus = "upcoming" | "active" | "handled";

export function statusForStation(stationIndex: number, activeIndex: number): StationStatus {
  if (stationIndex === activeIndex) return "active";
  if (stationIndex < activeIndex) return "handled";
  return "upcoming";
}

/** Keeps the status bubble from overflowing the panel edge for stations
 * near the left/right sides (Enquiry at x=9, Booked at x=93). */
export type BubbleAlign = "start" | "center" | "end";

export function bubbleAlignFor(x: number): BubbleAlign {
  if (x < 20) return "start";
  if (x > 80) return "end";
  return "center";
}
