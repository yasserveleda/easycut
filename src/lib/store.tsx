import { useEffect } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { Services } from "@/services";
import type { Agendamento, AgendamentoOcupado } from "@/domain/agendamento/Agendamento";
import type { Bloqueio } from "@/domain/bloqueio/Bloqueio";
import type { Configuracao } from "@/domain/configuracao/Configuracao";
import type { Profissional } from "@/domain/profissional/Profissional";
import type { Servico } from "@/domain/servico/Servico";
import type {
  Appointment,
  BlockedSlot,
  Service,
  Settings,
  Staff,
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
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());
const update = (fn: (s: State) => State) => {
  state = fn(state);
  emit();
};

const getSnapshot = () => state;

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object),
      kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
        return false;
    }
    return true;
  }
  return false;
}

export const useStore = <T,>(selector: (s: State) => T): T =>
  useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, selector, shallowEqual);

// --- adaptadores domain → shape interno legado da store ---
const toService = (s: Servico): Service => ({
  id: s.id,
  name: s.nome,
  description: s.descricao,
  price: s.preco,
  durationMin: s.duracaoMin,
  category: s.categoria,
  color: s.cor,
  active: s.ativo,
});
const toStaff = (p: Profissional): Staff => ({
  id: p.id,
  name: p.nome,
  role: p.cargo,
  avatarColor: p.corAvatar,
  serviceIds: p.servicoIds,
});
const toAppointment = (a: Agendamento): Appointment => ({
  id: a.id,
  serviceId: a.servicoId,
  staffId: a.profissionalId,
  clientName: a.clienteNome,
  clientPhone: a.clienteTelefone,
  clientEmail: a.clienteEmail,
  date: a.data,
  startTime: a.horaInicio,
  durationMin: a.duracaoMin,
  status: a.status,
  notes: a.observacoes,
  createdAt: a.criadoEm,
});
const toBusyAppointment = (b: AgendamentoOcupado, i: number): Appointment => ({
  id: `busy-${i}`,
  serviceId: "",
  staffId: b.profissionalId,
  clientName: "Ocupado",
  clientPhone: "",
  date: b.data,
  startTime: b.horaInicio,
  durationMin: b.duracaoMin,
  status: b.status,
  createdAt: "",
});
const toBlocked = (b: Bloqueio): BlockedSlot => ({
  id: b.id,
  staffId: b.profissionalId,
  date: b.data,
  startTime: b.horaInicio,
  durationMin: b.duracaoMin,
  reason: b.motivo,
});
const toSettings = (c: Configuracao): Settings => ({
  salonName: c.nomeSalao,
  bufferMin: c.bufferMin,
  businessHours: c.horarios.length ? c.horarios : defaultBusinessHours(),
});

// --- loaders (delegam à camada de Services) ---
async function loadAll() {
  const [svc, st, ap, bl, se] = await Promise.all([
    Services.servico.listar(),
    Services.profissional.listar(),
    Services.agendamento.listar(),
    Services.bloqueio.listar(),
    Services.configuracao.obter(),
  ]);
  update((s) => ({
    ...s,
    services: svc.map(toService),
    staff: st.map(toStaff),
    appointments: ap.map(toAppointment),
    blocked: bl.map(toBlocked),
    settings: se ? toSettings(se) : s.settings,
    loaded: true,
  }));
}

async function loadBusySlots() {
  const today = new Date();
  today.setMonth(today.getMonth() - 1);
  const to = new Date();
  to.setMonth(to.getMonth() + 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const busy = await Services.agendamento.listarOcupados(iso(today), iso(to));
  update((s) => ({
    ...s,
    appointments: busy.map(toBusyAppointment),
    loaded: true,
  }));
}

async function loadPublicCatalog() {
  const [svc, st, bl, se] = await Promise.all([
    Services.servico.listar(),
    Services.profissional.listar(),
    Services.bloqueio.listar(),
    Services.configuracao.obter(),
  ]);
  update((s) => ({
    ...s,
    services: svc.map(toService),
    staff: st.map(toStaff),
    blocked: bl.map(toBlocked),
    settings: se ? toSettings(se) : s.settings,
  }));
  await loadBusySlots();
  update((s) => ({ ...s, loaded: true }));
}

let inited = false;
let unsubRealtime: (() => void) | null = null;

export function initStore(isAuthed: boolean) {
  if (inited) return;
  inited = true;
  if (isAuthed) loadAll();
  else loadPublicCatalog();

  unsubRealtime = Services.realtime.subscribe(
    ["services", "staff", "appointments", "blocked_slots", "settings"],
    () => refresh(isAuthed),
  );
}

function refresh(isAuthed: boolean) {
  if (isAuthed) loadAll();
  else loadBusySlots();
}

export function resetStore() {
  inited = false;
  if (unsubRealtime) {
    unsubRealtime();
    unsubRealtime = null;
  }
  update((s) => ({ ...s, appointments: [], loaded: false }));
}

export function useStoreInit(isAuthed: boolean) {
  useEffect(() => {
    initStore(isAuthed);
  }, [isAuthed]);
}
