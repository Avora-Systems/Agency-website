// Data model for the Avora System hero: a real business workflow
// (enquiry -> processing -> CRM/calendar -> response -> booking confirmed),
// not a decorative visual. Positions are percentages of the stage box, so
// the whole composition scales with it responsively.

export const FUNCTION_TAGS = [
  "Enquiry",
  "Email",
  "WhatsApp",
  "AI",
  "CRM",
  "Calendar",
  "Invoicing",
  "Documents",
] as const;

export type FunctionTag = (typeof FUNCTION_TAGS)[number];

export type DockId = "enquiry" | "crm" | "calendar" | "response";

export interface DockPosition {
  left: number;
  top: number;
}

// A near-square stage (see hero.css aspect-ratio) — percentages below are
// close enough to true angles/distances for restrained decorative lines.
// The top ~14% is reserved for the function-tags header and the bottom
// ~30% for the status chip (a sibling of this layout, not part of it), so
// the module/docks live in the band between. Positions are chosen so the
// module (26% wide, centered) and every card (capped at 138px) clear each
// other with margin at the panel's smallest supported width — verified by
// hand, not just by eye, since this composition must never overlap itself.
export const MODULE_POSITION: DockPosition = { left: 50, top: 43 };

/** Where the single active card sits in compact mode (see AvoraSystem) —
 * independent of the desktop dock positions below. */
export const COMPACT_CARD_POSITION: DockPosition = { left: 50, top: 66 };

export const DOCK_POSITIONS: Record<DockId, DockPosition> = {
  enquiry: { left: 7, top: 12 },
  crm: { left: 93, top: 22 },
  calendar: { left: 90, top: 60 },
  response: { left: 10, top: 63 },
};

export interface DockContentLine {
  label?: string;
  value: string;
}

export interface DockContent {
  title: string;
  lines: DockContentLine[];
  footer?: string;
}

export const DOCK_CONTENT: Record<DockId, DockContent> = {
  enquiry: {
    title: "Website enquiry",
    lines: [{ value: "“Hi, could you quote for a bathroom re-fit next week?”" }],
    footer: "Just now",
  },
  crm: {
    title: "CRM",
    lines: [
      { label: "Lead", value: "James Carter" },
      { label: "Job", value: "Bathroom re-fit" },
      { label: "Status", value: "New lead" },
    ],
  },
  calendar: {
    title: "Calendar",
    lines: [
      { label: "Tuesday", value: "10:30 AM" },
      { value: "Site visit available" },
    ],
  },
  response: {
    title: "AI response",
    lines: [{ label: "Draft", value: "Ready to send" }],
    footer: "Send response",
  },
};

export const PROCESSING_STEPS = [
  "Enquiry received",
  "Customer details extracted",
  "Availability checked",
  "Response generated",
];

export interface HeroPhase {
  range: [number, number];
  status: string;
  detail: string;
  activeTags: FunctionTag[];
  visibleDocks: DockId[];
}

export const HERO_PHASES: HeroPhase[] = [
  { range: [0, 0.16], status: "Avora is connected", detail: "Watching every channel for new enquiries", activeTags: [], visibleDocks: [] },
  { range: [0.16, 0.36], status: "New enquiry received", detail: "Bathroom re-fit quote request", activeTags: ["Enquiry"], visibleDocks: ["enquiry"] },
  { range: [0.36, 0.56], status: "AI processing", detail: "Extracting details, checking availability", activeTags: ["AI"], visibleDocks: ["enquiry"] },
  { range: [0.56, 0.8], status: "Calendar & CRM updated", detail: "Slot held, lead logged automatically", activeTags: ["CRM", "Calendar"], visibleDocks: ["enquiry", "crm", "calendar"] },
  { range: [0.8, 1.01], status: "Booking confirmed", detail: "Reply sent · CRM updated", activeTags: ["Email"], visibleDocks: ["enquiry", "crm", "calendar", "response"] },
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

/** Which dock (if any) has full prominence right now — as opposed to
 * merely being visible/"handled" — derived rather than stored per phase
 * since phase 3 (connect) hands prominence between CRM and Calendar. */
export function activeDockFor(index: number, local: number): DockId | null {
  if (index === 1 || index === 2) return "enquiry";
  if (index === 3) return local < 0.5 ? "crm" : "calendar";
  if (index === 4) return "response";
  return null;
}

/** The module's own short internal status line — a system log, not the
 * plain-language headline shown in the bottom status chip. */
export function moduleLineFor(index: number, local: number): string {
  if (index === 0) return "Monitoring";
  if (index === 1) return "Reading enquiry";
  if (index === 2) {
    const step = Math.min(PROCESSING_STEPS.length - 1, Math.floor(local * PROCESSING_STEPS.length));
    return PROCESSING_STEPS[step]!;
  }
  if (index === 3) return "Syncing systems";
  return "Complete";
}
