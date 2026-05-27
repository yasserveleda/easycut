import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { currency, todayISO, minutesToLabel } from "@/lib/format";
import { CalendarDays, DollarSign, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — SalonFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const apts = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const today = todayISO();
  const month = today.slice(0, 7);

  const todays = apts.filter((a) => a.date === today && a.status !== "cancelado");
  const monthly = apts.filter((a) => a.date.startsWith(month) && a.status !== "cancelado");
  const revToday = todays.reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0);
  const revMonth = monthly.reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0);
  const ticket = monthly.length ? revMonth / monthly.length : 0;
  const uniqueClients = new Set(monthly.map((a) => a.clientPhone)).size;

  return (
    <AdminShell title="Dashboard" actions={<Button asChild size="sm"><Link to="/admin/agenda">Ver agenda</Link></Button>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={CalendarDays} label="Hoje" value={String(todays.length)} hint="agendamentos" />
        <Kpi icon={DollarSign} label="Faturamento hoje" value={currency(revToday)} hint={`${todays.length} serviços`} />
        <Kpi icon={TrendingUp} label="Faturamento mês" value={currency(revMonth)} hint={`Ticket médio ${currency(ticket)}`} />
        <Kpi icon={Users} label="Clientes (mês)" value={String(uniqueClients)} hint="únicos" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold">Agendamentos de hoje</h2>
              <Badge variant="outline">{todays.length}</Badge>
            </div>
            <div className="space-y-2">
              {todays.length === 0 && <p className="text-sm text-muted-foreground">Sem agendamentos hoje.</p>}
              {todays.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((a) => {
                const svc = services.find((s) => s.id === a.serviceId)!;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card">
                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: svc.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{a.clientName}</p>
                      <p className="text-xs text-muted-foreground">{svc.name} · {minutesToLabel(a.durationMin)}</p>
                    </div>
                    <span className="font-mono text-sm">{a.startTime}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display font-semibold mb-4">Serviços mais agendados</h2>
            <TopServices />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof DollarSign; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="grid place-items-center h-8 w-8 rounded-md bg-accent/15 text-accent"><Icon className="h-4 w-4" /></span>
        </div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TopServices() {
  const apts = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const counts = new Map<string, number>();
  apts.forEach((a) => counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1));
  const max = Math.max(1, ...counts.values());
  const top = [...counts.entries()]
    .map(([id, n]) => ({ svc: services.find((s) => s.id === id)!, n }))
    .filter((x) => x.svc)
    .sort((a, b) => b.n - a.n).slice(0, 5);

  if (top.length === 0) return <p className="text-sm text-muted-foreground">Ainda sem dados.</p>;
  return (
    <div className="space-y-3">
      {top.map(({ svc, n }) => (
        <div key={svc.id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{svc.name}</span>
            <span className="text-muted-foreground">{n}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: svc.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
