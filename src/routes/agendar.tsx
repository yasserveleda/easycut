import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { actions, useStore } from "@/lib/store";
import { currency, dateToISO, formatDateLong, minutesToLabel } from "@/lib/format";
import { generateAvailableSlots } from "@/lib/scheduling";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BookingSearch {
  servico?: string;
}

export const Route = createFileRoute("/agendar")({
  validateSearch: (search: Record<string, unknown>): BookingSearch => ({
    servico: typeof search.servico === "string" ? search.servico : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Agendar — Atelier Estúdio" },
      { name: "description", content: "Escolha serviço, profissional e horário em poucos cliques." },
    ],
  }),
  component: BookingPage,
});

type Step = 1 | 2 | 3 | 4;

function BookingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const services = useStore((s) => s.services.filter((x) => x.active));
  const staff = useStore((s) => s.staff);
  const appointments = useStore((s) => s.appointments);
  const blocked = useStore((s) => s.blocked);
  const settings = useStore((s) => s.settings);

  const [step, setStep] = useState<Step>(search.servico ? 2 : 1);
  const [serviceId, setServiceId] = useState<string | undefined>(search.servico);
  const [staffId, setStaffId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const eligibleStaff = useMemo(
    () => (serviceId ? staff.filter((p) => p.serviceIds.includes(serviceId)) : []),
    [serviceId, staff],
  );

  const slots = useMemo(() => {
    if (!service || !staffId || !date) return [];
    return generateAvailableSlots({
      date: dateToISO(date),
      staffId,
      serviceDurationMin: service.durationMin,
      bufferMin: settings.bufferMin,
      businessHours: settings.businessHours,
      appointments,
      blocked,
    });
  }, [service, staffId, date, appointments, blocked, settings]);

  const canConfirm = clientName.trim().length >= 2 && clientPhone.replace(/\D/g, "").length >= 10;

  const handleConfirm = async () => {
    if (!service || !staffId || !date || !time) return;
    try {
      const apt = await actions.createAppointment({
        serviceId: service.id,
        staffId,
        clientName: clientName.trim(),
        clientPhone,
        clientEmail: clientEmail || undefined,
        date: dateToISO(date),
        startTime: time,
        durationMin: service.durationMin,
      });
      setConfirmed(apt.id);
      toast.success("Agendamento confirmado!");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao agendar");
    }
  };

  if (confirmed && service && staffId && date && time) {
    const sp = staff.find((s) => s.id === staffId)!;
    return (
      <PublicShell>
        <section className="container mx-auto px-4 py-16 max-w-xl">
          <Card className="border-success/40">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-success grid place-items-center mb-4">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="font-display text-2xl font-semibold">Agendamento recebido</h1>
              <p className="text-muted-foreground mt-1">Seu horário está reservado e aguardando confirmação.</p>
              <div className="mt-6 rounded-lg border bg-muted/40 p-5 text-left space-y-2">
                <Row k="Serviço" v={service.name} />
                <Row k="Profissional" v={sp.name} />
                <Row k="Data" v={formatDateLong(dateToISO(date))} />
                <Row k="Horário" v={`${time} (${minutesToLabel(service.durationMin)})`} />
                <Row k="Valor" v={currency(service.price)} />
              </div>
              <div className="mt-6 flex gap-2 justify-center">
                <Button asChild variant="outline"><Link to="/">Início</Link></Button>
                <Button asChild><Link to="/meus-agendamentos" search={{ telefone: clientPhone } as never}>Meus agendamentos</Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="container mx-auto px-4 py-10 sm:py-14 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Agendar horário</h1>
          <Stepper step={step} />
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => { setServiceId(svc.id); setStaffId(undefined); setStep(2); navigate({ to: "/agendar", search: { servico: svc.id } }); }}
                className={cn(
                  "text-left rounded-xl border bg-card p-5 transition-all hover:shadow-[var(--shadow-soft)] hover:border-accent/60",
                  serviceId === svc.id && "border-accent ring-2 ring-accent/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{svc.name}</h3>
                  <span className="h-3 w-3 rounded-full mt-1.5" style={{ backgroundColor: svc.color }} />
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{svc.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Badge variant="outline">{minutesToLabel(svc.durationMin)}</Badge>
                  <span className="font-display font-semibold text-base">{currency(svc.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && service && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligibleStaff.map((p) => (
              <button
                key={p.id}
                onClick={() => { setStaffId(p.id); setStep(3); }}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:shadow-[var(--shadow-soft)] hover:border-accent/60",
                  staffId === p.id && "border-accent ring-2 ring-accent/30",
                )}
              >
                <div className="h-12 w-12 rounded-full grid place-items-center text-white font-semibold" style={{ backgroundColor: p.avatarColor }}>
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.role}</p>
                </div>
              </button>
            ))}
            {eligibleStaff.length === 0 && (
              <p className="text-muted-foreground col-span-full">Nenhum profissional disponível para este serviço.</p>
            )}
          </div>
        )}

        {step === 3 && service && staffId && (
          <div className="grid md:grid-cols-[auto_1fr] gap-6">
            <Card>
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(undefined); }}
                  disabled={(d) => d < new Date(new Date().toDateString())}
                  className="p-3 pointer-events-auto"
                />
              </CardContent>
            </Card>
            <div>
              <h3 className="font-display font-semibold mb-3">
                {date ? formatDateLong(dateToISO(date)) : "Escolha uma data"}
              </h3>
              {!date && <p className="text-sm text-muted-foreground">Selecione um dia no calendário.</p>}
              {date && slots.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum horário disponível neste dia.</p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot}
                    variant={time === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setTime(slot); setStep(4); }}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && service && staffId && date && time && (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input id="name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Como podemos te chamar?" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input id="phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input id="email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="voce@email.com" />
                </div>
                <Button className="w-full" size="lg" disabled={!canConfirm} onClick={handleConfirm}>
                  Confirmar agendamento
                </Button>
              </CardContent>
            </Card>
            <Card className="h-fit">
              <CardContent className="p-5 space-y-2 text-sm">
                <h4 className="font-display font-semibold text-base mb-3">Resumo</h4>
                <Row k="Serviço" v={service.name} />
                <Row k="Profissional" v={staff.find((s) => s.id === staffId)!.name} />
                <Row k="Data" v={formatDateLong(dateToISO(date))} />
                <Row k="Horário" v={`${time} (${minutesToLabel(service.durationMin)})`} />
                <div className="border-t my-2" />
                <div className="flex justify-between font-display font-semibold text-base">
                  <span>Total</span><span>{currency(service.price)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as Step)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          {step < 4 && (
            <Button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={
                (step === 1 && !serviceId) ||
                (step === 2 && !staffId) ||
                (step === 3 && !(date && time))
              }
            >
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Serviço", "Profissional", "Data e hora", "Confirmação"];
  return (
    <div className="mt-4 flex items-center gap-2 sm:gap-3 overflow-x-auto">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "h-7 w-7 grid place-items-center rounded-full text-xs font-semibold border",
              done && "bg-success text-success-foreground border-success",
              active && "bg-primary text-primary-foreground border-primary",
              !done && !active && "bg-muted text-muted-foreground",
            )}>
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span className={cn("text-sm", active ? "font-semibold" : "text-muted-foreground")}>{l}</span>
            {i < labels.length - 1 && <div className="w-6 sm:w-10 h-px bg-border ml-1" />}
          </div>
        );
      })}
    </div>
  );
}
