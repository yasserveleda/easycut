import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { currency, formatDateShort } from "@/lib/format";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — SalonFlow" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const apts = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const [q, setQ] = useState("");

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; visits: number; total: number; last: string }>();
    apts.forEach((a) => {
      const key = a.clientPhone;
      const price = services.find((s) => s.id === a.serviceId)?.price ?? 0;
      const cur = map.get(key);
      if (cur) {
        cur.visits += 1; cur.total += price;
        if (a.date > cur.last) cur.last = a.date;
      } else {
        map.set(key, { name: a.clientName, phone: a.clientPhone, visits: 1, total: price, last: a.date });
      }
    });
    const list = [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
    const ql = q.toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(ql) || c.phone.includes(q)) : list;
  }, [apts, services, q]);

  return (
    <AdminShell title="Clientes">
      <Card>
        <CardContent className="p-5">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Telefone</th>
                  <th className="py-2 pr-4 font-medium">Visitas</th>
                  <th className="py-2 pr-4 font-medium">Último</th>
                  <th className="py-2 pr-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
                )}
                {clients.map((c) => (
                  <tr key={c.phone} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 pr-4 font-medium">{c.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{c.phone}</td>
                    <td className="py-3 pr-4"><Badge variant="outline">{c.visits}</Badge></td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(c.last)}</td>
                    <td className="py-3 pr-4 font-semibold text-right">{currency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
