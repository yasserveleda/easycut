import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { currency, todayISO } from "@/lib/format";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — SalonFlow" }] }),
  component: FinancePage,
});

function FinancePage() {
  const apts = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const today = todayISO();
  const month = today.slice(0, 7);

  const monthly = apts.filter((a) => a.date.startsWith(month) && a.status !== "cancelado");
  const revMonth = monthly.reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0);
  const revToday = apts.filter((a) => a.date === today && a.status !== "cancelado")
    .reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0);

  const last30 = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const total = apts.filter((a) => a.date === iso && a.status !== "cancelado")
        .reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0);
      days.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, total });
    }
    return days;
  }, [apts, services]);

  return (
    <AdminShell title="Financeiro">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Hoje" value={currency(revToday)} />
        <Stat label="Este mês" value={currency(revMonth)} />
        <Stat label="Atendimentos no mês" value={String(monthly.length)} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="font-display font-semibold mb-4">Faturamento dos últimos 30 dias</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  formatter={(v: number) => currency(v)}
                />
                <Bar dataKey="total" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1">{value}</p>
    </CardContent></Card>
  );
}
