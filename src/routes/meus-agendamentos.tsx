import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { Services } from "@/services";
import { AgendamentoStatus } from "@/domain/agendamento/enums";
import type { Agendamento } from "@/domain/agendamento/Agendamento";
import { currency, formatDateLong, minutesToLabel } from "@/lib/format";
import { CalendarX, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MySearch { telefone?: string }

export const Route = createFileRoute("/meus-agendamentos")({
  validateSearch: (s: Record<string, unknown>): MySearch => ({
    telefone: typeof s.telefone === "string" ? s.telefone : undefined,
  }),
  head: () => ({
    meta: [{ title: "Meus agendamentos — Atelier Estúdio" }],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const [phone, setPhone] = useState(search.telefone ?? "");
  const [submitted, setSubmitted] = useState(!!search.telefone);
  const [mine, setMine] = useState<Agendamento[]>([]);
  const [reloadTick, setReloadTick] = useState(0);
  const [debugTotal, setDebugTotal] = useState<number | null>(null);
  const services = useStore((s) => s.services);
  const staff = useStore((s) => s.staff);

  useEffect(() => {
    if (!submitted) { setMine([]); setDebugTotal(null); return; }
    let cancelled = false;
    Promise.all([
      Services.agendamento.listarPorTelefone(phone),
      Services.agendamento.listar(),
    ]).then(([list, all]) => {
      if (cancelled) return;
      setMine(list);
      setDebugTotal(all.length);
      // eslint-disable-next-line no-console
      console.info("[meus-agendamentos] busca", {
        telefoneDigitado: phone,
        digitos: phone.replace(/\D/g, ""),
        encontrados: list.length,
        totalArmazenados: all.length,
        telefonesArmazenados: all.map((a) => a.clienteTelefone),
      });
    });
    return () => { cancelled = true; };
  }, [submitted, phone, reloadTick]);

  return (
    <PublicShell>
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Meus agendamentos</h1>
        <p className="text-muted-foreground mt-2">Consulte e gerencie seus horários pelo seu telefone.</p>

        <Card className="mt-6">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Label htmlFor="t">Telefone</Label>
              <Input id="t" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <Button
              onClick={() => { setSubmitted(true); setReloadTick((t) => t + 1); }}
              disabled={phone.replace(/\D/g, "").length < 10}
            >
              <Search className="h-4 w-4 mr-1" /> Buscar
            </Button>
          </CardContent>
        </Card>

        {submitted && (
          <div className="mt-8 space-y-3">
            {mine.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <CalendarX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhum agendamento encontrado para este telefone.
                {debugTotal !== null && (
                  <p className="text-xs mt-2 opacity-70">
                    ({debugTotal} agendamento(s) armazenado(s) neste navegador no total)
                  </p>
                )}
                <div className="mt-4"><Button asChild><Link to="/agendar">Fazer um agendamento</Link></Button></div>
              </CardContent></Card>
            )}
            {mine.map((a) => {
              const svc = services.find((s) => s.id === a.servicoId);
              const sp = staff.find((s) => s.id === a.profissionalId);
              if (!svc || !sp) return null;
              const isPast = a.data < new Date().toISOString().slice(0, 10);
              return (
                <Card key={a.id} className={cn(a.status === "cancelado" && "opacity-60")}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md shrink-0" style={{ backgroundColor: svc.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{svc.name}</h3>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">com {sp.name}</p>
                      <p className="text-sm mt-1">{formatDateLong(a.data)} · {a.horaInicio} ({minutesToLabel(a.duracaoMin)})</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold">{currency(svc.price)}</p>
                      {!isPast && a.status !== "cancelado" && a.status !== "finalizado" && (
                        <Button
                          variant="ghost" size="sm" className="text-destructive mt-1"
                          onClick={async () => { await Services.agendamento.alterarStatus({ id: a.id, status: AgendamentoStatus.CANCELADO }); toast.success("Agendamento cancelado"); setReloadTick((t) => t + 1); }}
                        >Cancelar</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    confirmado: { label: "Confirmado", className: "bg-success/15 text-success border-success/30" },
    pendente: { label: "Pendente", className: "bg-warning/20 text-warning-foreground border-warning/40" },
    cancelado: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
    finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground" },
  };
  const m = map[status] ?? map.pendente;
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>;
}
