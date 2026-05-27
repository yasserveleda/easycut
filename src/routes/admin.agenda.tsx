import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { actions, useStore } from "@/lib/store";
import { currency, dateToISO, formatDateLong, isoToDate, minutesToLabel, weekdays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toMinutes } from "@/lib/scheduling";
import type { Appointment } from "@/lib/types";
import { toast } from "sonner";

type View = "dia" | "semana" | "mes";

export const Route = createFileRoute("/admin/agenda")({
  head: () => ({ meta: [{ title: "Agenda — SalonFlow" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const [view, setView] = useState<View>("semana");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const staff = useStore((s) => s.staff);

  const shift = (delta: number) => {
    const d = new Date(anchor);
    if (view === "dia") d.setDate(d.getDate() + delta);
    if (view === "semana") d.setDate(d.getDate() + delta * 7);
    if (view === "mes") d.setMonth(d.getMonth() + delta);
    setAnchor(d);
  };

  return (
    <AdminShell
      title="Agenda"
      actions={
        <div className="hidden sm:flex items-center gap-2">
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
              <span className="ml-3 font-display font-semibold">{labelFor(view, anchor)}</span>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList>
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="sm:hidden mb-3">
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos profissionais</SelectItem>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {view === "dia" && <DayView date={anchor} staffFilter={staffFilter} onSelect={setSelected} />}
          {view === "semana" && <WeekView anchor={anchor} staffFilter={staffFilter} onSelect={setSelected} />}
          {view === "mes" && <MonthView anchor={anchor} staffFilter={staffFilter} onClickDay={(d) => { setAnchor(d); setView("dia"); }} />}
        </CardContent>
      </Card>

      <AppointmentDialog apt={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}

function labelFor(view: View, d: Date) {
  if (view === "dia") return formatDateLong(dateToISO(d));
  if (view === "mes") return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monday = startOfWeek(d);
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  return `${monday.getDate().toString().padStart(2, "0")}/${(monday.getMonth() + 1).toString().padStart(2, "0")} – ${sunday.getDate().toString().padStart(2, "0")}/${(sunday.getMonth() + 1).toString().padStart(2, "0")}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

const HOUR_PX = 56;
const START_HOUR = 7;
const END_HOUR = 22;

function useDayApts(date: string, staffFilter: string) {
  const apts = useStore((s) => s.appointments);
  return useMemo(
    () => apts.filter((a) => a.date === date && (staffFilter === "all" || a.staffId === staffFilter)),
    [apts, date, staffFilter],
  );
}

function DayView({ date, staffFilter, onSelect }: { date: Date; staffFilter: string; onSelect: (a: Appointment) => void }) {
  const iso = dateToISO(date);
  const apts = useDayApts(iso, staffFilter);
  return (
    <div className="flex border rounded-lg overflow-hidden">
      <TimeColumn />
      <div className="flex-1 relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
        {hourLines()}
        {apts.map((a) => <EventBlock key={a.id} apt={a} onClick={() => onSelect(a)} />)}
      </div>
    </div>
  );
}

function WeekView({ anchor, staffFilter, onSelect }: { anchor: Date; staffFilter: string; onSelect: (a: Appointment) => void }) {
  const monday = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; });
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[840px] border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[56px_repeat(7,_1fr)] border-b bg-muted/30">
          <div />
          {days.map((d) => {
            const isToday = dateToISO(d) === dateToISO(new Date());
            return (
              <div key={d.toISOString()} className={cn("p-2 text-center border-l text-sm", isToday && "bg-accent/10")}>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{weekdays[d.getDay()]}</div>
                <div className={cn("font-display font-semibold text-lg", isToday && "text-accent")}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[56px_repeat(7,_1fr)]" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
          <TimeColumn embedded />
          {days.map((d) => (
            <DayColumn key={d.toISOString()} date={dateToISO(d)} staffFilter={staffFilter} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({ date, staffFilter, onSelect }: { date: string; staffFilter: string; onSelect: (a: Appointment) => void }) {
  const apts = useDayApts(date, staffFilter);
  return (
    <div className="relative border-l">
      {hourLines()}
      {apts.map((a) => <EventBlock key={a.id} apt={a} compact onClick={() => onSelect(a)} />)}
    </div>
  );
}

function TimeColumn({ embedded }: { embedded?: boolean } = {}) {
  return (
    <div className={cn("w-14 shrink-0", !embedded && "border-r bg-muted/30")} style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
      {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
        <div key={i} className="text-[10px] text-muted-foreground text-right pr-2 -mt-2" style={{ height: HOUR_PX }}>
          {String(START_HOUR + i).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
}

function hourLines() {
  return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
    <div key={i} className="absolute left-0 right-0 border-t border-border/60" style={{ top: i * HOUR_PX }} />
  ));
}

function EventBlock({ apt, compact, onClick }: { apt: Appointment; compact?: boolean; onClick: () => void }) {
  const services = useStore((s) => s.services);
  const staff = useStore((s) => s.staff);
  const svc = services.find((s) => s.id === apt.serviceId);
  const sp = staff.find((s) => s.id === apt.staffId);
  if (!svc) return null;
  const top = ((toMinutes(apt.startTime) - START_HOUR * 60) / 60) * HOUR_PX;
  const height = (apt.durationMin / 60) * HOUR_PX;
  const isCanceled = apt.status === "cancelado";
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-md text-left p-1.5 overflow-hidden text-white text-xs shadow-sm transition-opacity",
        isCanceled && "opacity-40 line-through",
      )}
      style={{ top, height: Math.max(height, 26), backgroundColor: svc.color }}
    >
      <div className="font-semibold truncate">{apt.clientName}</div>
      {!compact && <div className="opacity-90 truncate">{svc.name}</div>}
      <div className="opacity-80 truncate text-[10px]">{apt.startTime} · {sp?.name.split(" ")[0]}</div>
    </button>
  );
}

function MonthView({ anchor, staffFilter, onClickDay }: { anchor: Date; staffFilter: string; onClickDay: (d: Date) => void }) {
  const apts = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
        {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => <div key={d} className="p-2 text-center border-l first:border-l-0">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((d, i) => {
          const iso = dateToISO(d);
          const inMonth = d.getMonth() === anchor.getMonth();
          const dayApts = apts.filter((a) => a.date === iso && (staffFilter === "all" || a.staffId === staffFilter) && a.status !== "cancelado");
          return (
            <button
              key={i}
              onClick={() => onClickDay(d)}
              className={cn(
                "min-h-[90px] border-l border-t p-1.5 text-left transition-colors hover:bg-accent/5",
                i % 7 === 0 && "border-l-0",
                i < 7 && "border-t-0",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div className="text-sm font-medium">{d.getDate()}</div>
              <div className="mt-1 space-y-0.5">
                {dayApts.slice(0, 3).map((a) => {
                  const svc = services.find((s) => s.id === a.serviceId)!;
                  return (
                    <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded text-white" style={{ backgroundColor: svc.color }}>
                      {a.startTime} {a.clientName}
                    </div>
                  );
                })}
                {dayApts.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayApts.length - 3} mais</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentDialog({ apt, onClose }: { apt: Appointment | null; onClose: () => void }) {
  const services = useStore((s) => s.services);
  const staff = useStore((s) => s.staff);
  if (!apt) return null;
  const svc = services.find((s) => s.id === apt.serviceId)!;
  const sp = staff.find((s) => s.id === apt.staffId)!;
  const setStatus = (status: Appointment["status"], label: string) => {
    actions.setAppointmentStatus(apt.id, status); toast.success(label); onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: svc.color }} />
            {svc.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <Row k="Cliente" v={apt.clientName} />
          <Row k="Telefone" v={apt.clientPhone} />
          <Row k="Profissional" v={sp.name} />
          <Row k="Data" v={formatDateLong(apt.date)} />
          <Row k="Horário" v={`${apt.startTime} (${minutesToLabel(apt.durationMin)})`} />
          <Row k="Valor" v={currency(svc.price)} />
          <Row k="Status" v={<Badge variant="outline" className="capitalize">{apt.status}</Badge>} />
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {apt.status === "pendente" && <Button onClick={() => setStatus("confirmado", "Agendamento aprovado")}>Aprovar</Button>}
          {apt.status !== "finalizado" && apt.status !== "cancelado" && (
            <Button variant="outline" onClick={() => setStatus("finalizado", "Atendimento finalizado")}>Finalizar</Button>
          )}
          {apt.status !== "cancelado" && (
            <Button variant="destructive" onClick={() => setStatus("cancelado", "Agendamento cancelado")}>Cancelar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
