import type { Appointment, BlockedSlot, BusinessHours } from "./types";

export const SLOT_MIN = 15;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Arredonda para o próximo múltiplo de 15min */
export const ceilToSlot = (min: number): number => Math.ceil(min / SLOT_MIN) * SLOT_MIN;

export interface SlotConflictArgs {
  date: string;
  startMin: number;
  durationMin: number;
  staffId: string;
  appointments: Appointment[];
  blocked: BlockedSlot[];
}

export const hasConflict = ({
  date, startMin, durationMin, staffId, appointments, blocked,
}: SlotConflictArgs): boolean => {
  const endMin = startMin + durationMin;
  const overlaps = (aStart: number, aDur: number) => {
    const aEnd = aStart + aDur;
    return startMin < aEnd && endMin > aStart;
  };
  for (const a of appointments) {
    if (a.date !== date) continue;
    if (a.staffId !== staffId) continue;
    if (a.status === "cancelado") continue;
    if (overlaps(toMinutes(a.startTime), a.durationMin)) return true;
  }
  for (const b of blocked) {
    if (b.date !== date) continue;
    if (b.staffId && b.staffId !== staffId) continue;
    if (overlaps(toMinutes(b.startTime), b.durationMin)) return true;
  }
  return false;
};

export interface GenerateSlotsArgs {
  date: string;
  staffId: string;
  serviceDurationMin: number;
  bufferMin: number;
  businessHours: BusinessHours[];
  appointments: Appointment[];
  blocked: BlockedSlot[];
  /** Se true, ignora horários passados (para o cliente). */
  excludePast?: boolean;
}

/** Gera lista de horários iniciais disponíveis em múltiplos de 15min. */
export const generateAvailableSlots = ({
  date, staffId, serviceDurationMin, bufferMin, businessHours,
  appointments, blocked, excludePast = true,
}: GenerateSlotsArgs): string[] => {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.getDay();
  const hours = businessHours.find((h) => h.weekday === weekday);
  if (!hours || !hours.open) return [];

  const startMin = toMinutes(hours.start);
  const endMin = toMinutes(hours.end);
  const now = new Date();
  const isToday = excludePast && dateMatches(dt, now);
  const nowMin = isToday ? ceilToSlot(now.getHours() * 60 + now.getMinutes()) : 0;

  const dur = serviceDurationMin + bufferMin;
  const slots: string[] = [];
  for (let s = startMin; s + serviceDurationMin <= endMin; s += SLOT_MIN) {
    if (isToday && s < nowMin) continue;
    if (hasConflict({ date, startMin: s, durationMin: dur, staffId, appointments, blocked })) continue;
    slots.push(fromMinutes(s));
  }
  return slots;
};

const dateMatches = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const defaultBusinessHours = (): BusinessHours[] => [
  { weekday: 0, open: false, start: "09:00", end: "18:00" },
  { weekday: 1, open: true, start: "09:00", end: "19:00" },
  { weekday: 2, open: true, start: "09:00", end: "19:00" },
  { weekday: 3, open: true, start: "09:00", end: "19:00" },
  { weekday: 4, open: true, start: "09:00", end: "20:00" },
  { weekday: 5, open: true, start: "09:00", end: "20:00" },
  { weekday: 6, open: true, start: "08:00", end: "17:00" },
];
