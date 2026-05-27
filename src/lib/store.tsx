import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment, BlockedSlot, Service, ServiceCategory, Settings, Staff,
} from "./types";
import { defaultBusinessHours } from "./scheduling";

interface State {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  blocked: BlockedSlot[];
  settings: Settings;
  loaded: boolean;
}

let state: State = {
  services: [],
  staff: [],
  appointments: [],
  blocked: [],
  settings: { salonName: "Atelier Estúdio", bufferMin: 0, businessHours: defaultBusinessHours() },
  loaded: false,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const update = (fn: (s: State) => State) => { state = fn(state); emit(); };

export const useStore = <T,>(selector: (s: State) => T): T =>
  useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

// --- mappers ---
const mapService = (r: any): Service => ({
  id: r.id, name: r.name, description: r.description ?? "",
  price: Number(r.price), durationMin: r.duration_min,
  category: r.category as ServiceCategory, color: r.color, active: r.active,
});
const mapStaff = (r: any): Staff => ({
  id: r.id, name: r.name, role: r.role ?? "",
  avatarColor: r.avatar_color, serviceIds: r.service_ids ?? [],
});
const mapAppt = (r: any): Appointment => ({
  id: r.id, serviceId: r.service_id, staffId: r.staff_id,
  clientName: r.client_name, clientPhone: r.client_phone, clientEmail: r.client_email ?? undefined,
  date: r.date, startTime: r.start_time, durationMin: r.duration_min,
  status: r.status, notes: r.notes ?? undefined, createdAt: r.created_at,
});
const mapBlocked = (r: any): BlockedSlot => ({
  id: r.id, staffId: r.staff_id ?? undefined, date: r.date,
  startTime: r.start_time, durationMin: r.duration_min, reason: r.reason ?? undefined,
});

// --- loaders ---
async function loadAll() {
  const [svc, st, ap, bl, se] = await Promise.all([
    supabase.from("services").select("*").order("name"),
    supabase.from("staff").select("*").order("name"),
    supabase.from("appointments").select("*"),
    supabase.from("blocked_slots").select("*"),
    supabase.from("settings").select("*").eq("id", "default").maybeSingle(),
  ]);
  update((s) => ({
    ...s,
    services: (svc.data ?? []).map(mapService),
    staff: (st.data ?? []).map(mapStaff),
    appointments: (ap.data ?? []).map(mapAppt),
    blocked: (bl.data ?? []).map(mapBlocked),
    settings: se.data ? {
      salonName: se.data.salon_name,
      bufferMin: se.data.buffer_min,
      businessHours: (se.data.business_hours as any) ?? defaultBusinessHours(),
    } : s.settings,
    loaded: true,
  }));
}

async function loadBusySlots() {
  // Public-safe: only occupied slots, no PII. Used when not signed in.
  const today = new Date(); today.setMonth(today.getMonth() - 1);
  const to = new Date(); to.setMonth(to.getMonth() + 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const { data } = await supabase.rpc("get_busy_slots", { _from: iso(today), _to: iso(to) });
  update((s) => ({
    ...s,
    appointments: (data ?? []).map((r: any, i: number) => ({
      id: `busy-${i}`, serviceId: "", staffId: r.staff_id, clientName: "Ocupado",
      clientPhone: "", date: r.date, startTime: r.start_time,
      durationMin: r.duration_min, status: r.status as any, createdAt: "",
    })),
    loaded: true,
  }));
}

let inited = false;
let unsubRealtime: (() => void) | null = null;

export function initStore(isAuthed: boolean) {
  if (inited) return;
  inited = true;
  (isAuthed ? loadAll() : Promise.all([
    supabase.from("services").select("*").order("name").then((r) => update((s) => ({ ...s, services: (r.data ?? []).map(mapService) }))),
    supabase.from("staff").select("*").order("name").then((r) => update((s) => ({ ...s, staff: (r.data ?? []).map(mapStaff) }))),
    supabase.from("blocked_slots").select("*").then((r) => update((s) => ({ ...s, blocked: (r.data ?? []).map(mapBlocked) }))),
    supabase.from("settings").select("*").eq("id", "default").maybeSingle().then((r) => {
      if (r.data) update((s) => ({ ...s, settings: {
        salonName: r.data!.salon_name, bufferMin: r.data!.buffer_min,
        businessHours: (r.data!.business_hours as any) ?? defaultBusinessHours(),
      }}));
    }),
    loadBusySlots(),
  ]).then(() => update((s) => ({ ...s, loaded: true }))));

  const channel = supabase
    .channel("salon-db")
    .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => refresh(isAuthed))
    .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => refresh(isAuthed))
    .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => refresh(isAuthed))
    .on("postgres_changes", { event: "*", schema: "public", table: "blocked_slots" }, () => refresh(isAuthed))
    .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => refresh(isAuthed))
    .subscribe();
  unsubRealtime = () => { supabase.removeChannel(channel); };
}

function refresh(isAuthed: boolean) {
  if (isAuthed) loadAll(); else loadBusySlots();
}

export function resetStore() {
  inited = false;
  if (unsubRealtime) { unsubRealtime(); unsubRealtime = null; }
  update((s) => ({ ...s, appointments: [], loaded: false }));
}

export function useStoreInit(isAuthed: boolean) {
  useEffect(() => {
    initStore(isAuthed);
  }, [isAuthed]);
}

// --- actions ---
export const actions = {
  upsertService: async (svc: Omit<Service, "id"> & { id?: string }) => {
    const payload = {
      name: svc.name, description: svc.description, price: svc.price,
      duration_min: svc.durationMin, category: svc.category, color: svc.color, active: svc.active,
    };
    if (svc.id) await supabase.from("services").update(payload).eq("id", svc.id);
    else await supabase.from("services").insert(payload);
  },
  deleteService: async (id: string) => { await supabase.from("services").delete().eq("id", id); },

  createAppointment: async (a: Omit<Appointment, "id" | "createdAt" | "status"> & { status?: Appointment["status"] }) => {
    const { data, error } = await supabase.from("appointments").insert({
      service_id: a.serviceId, staff_id: a.staffId,
      client_name: a.clientName, client_phone: a.clientPhone, client_email: a.clientEmail ?? null,
      date: a.date, start_time: a.startTime, duration_min: a.durationMin,
      status: a.status ?? "pendente",
    }).select().single();
    if (error) throw error;
    return mapAppt(data);
  },
  setAppointmentStatus: async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
  },

  addBlocked: async (b: Omit<BlockedSlot, "id">) => {
    await supabase.from("blocked_slots").insert({
      staff_id: b.staffId ?? null, date: b.date, start_time: b.startTime,
      duration_min: b.durationMin, reason: b.reason ?? null,
    });
  },
  removeBlocked: async (id: string) => { await supabase.from("blocked_slots").delete().eq("id", id); },

  updateSettings: async (patch: Partial<Settings>) => {
    const cur = state.settings;
    const next = { ...cur, ...patch };
    await supabase.from("settings").update({
      salon_name: next.salonName, buffer_min: next.bufferMin,
      business_hours: next.businessHours as any, updated_at: new Date().toISOString(),
    }).eq("id", "default");
  },
};
