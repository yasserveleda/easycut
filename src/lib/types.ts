export type ServiceCategory = "cabelo" | "barba" | "estetica" | "combo" | "outros";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number; // múltiplo de 15
  category: ServiceCategory;
  color: string; // hex
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  serviceIds: string[];
}

export type AppointmentStatus = "pendente" | "confirmado" | "cancelado" | "finalizado";

export interface Appointment {
  id: string;
  serviceId: string;
  staffId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  /** ISO date string yyyy-mm-dd */
  date: string;
  /** "HH:mm" */
  startTime: string;
  durationMin: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface BusinessHours {
  /** 0=domingo ... 6=sábado */
  weekday: number;
  open: boolean;
  /** "HH:mm" */
  start: string;
  /** "HH:mm" */
  end: string;
}

export interface BlockedSlot {
  id: string;
  staffId?: string; // se vazio, bloqueia todos
  date: string;
  startTime: string;
  durationMin: number;
  reason?: string;
}

export interface Settings {
  salonName: string;
  bufferMin: number; // intervalo entre atendimentos
  businessHours: BusinessHours[];
}
