import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Plus } from "lucide-react";
import { actions, useStore } from "@/lib/store";
import type { BusinessHours } from "@/lib/types";
import { weekdays, dateToISO, formatDateShort, minutesToLabel } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — SalonFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const staff = useStore((s) => s.staff);
  const blocked = useStore((s) => s.blocked);

  const [salonName, setSalonName] = useState(settings.salonName);
  const [buffer, setBuffer] = useState(settings.bufferMin);
  const [hours, setHours] = useState<BusinessHours[]>(settings.businessHours);

  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockDur, setBlockDur] = useState(60);
  const [blockStaff, setBlockStaff] = useState<string>("all");
  const [blockReason, setBlockReason] = useState("");

  const saveGeneral = () => {
    actions.updateSettings({ salonName, bufferMin: Number(buffer), businessHours: hours });
    toast.success("Configurações salvas");
  };

  const addBlock = () => {
    if (!blockDate) { toast.error("Escolha uma data"); return; }
    actions.addBlocked({
      date: dateToISO(blockDate),
      startTime: blockStart,
      durationMin: Number(blockDur),
      staffId: blockStaff === "all" ? undefined : blockStaff,
      reason: blockReason || undefined,
    });
    toast.success("Horário bloqueado");
    setBlockReason("");
  };

  return (
    <AdminShell title="Configurações">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-display font-semibold">Geral</h2>
            <div><Label>Nome do salão</Label><Input value={salonName} onChange={(e) => setSalonName(e.target.value)} /></div>
            <div>
              <Label>Intervalo entre atendimentos (min)</Label>
              <Select value={String(buffer)} onValueChange={(v) => setBuffer(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 5, 10, 15, 30].map((v) => <SelectItem key={v} value={String(v)}>{v} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveGeneral}>Salvar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display font-semibold mb-4">Horário de funcionamento</h2>
            <div className="space-y-2">
              {hours.map((h, i) => (
                <div key={h.weekday} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-medium">{weekdays[h.weekday]}</span>
                  <Switch
                    checked={h.open}
                    onCheckedChange={(v) => setHours((prev) => prev.map((x, idx) => idx === i ? { ...x, open: v } : x))}
                  />
                  <Input
                    type="time" step={900} value={h.start} disabled={!h.open}
                    onChange={(e) => setHours((prev) => prev.map((x, idx) => idx === i ? { ...x, start: e.target.value } : x))}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="time" step={900} value={h.end} disabled={!h.open}
                    onChange={(e) => setHours((prev) => prev.map((x, idx) => idx === i ? { ...x, end: e.target.value } : x))}
                    className="w-28"
                  />
                </div>
              ))}
            </div>
            <Button onClick={saveGeneral} className="mt-4">Salvar horários</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold mb-4">Bloquear horários</h2>
            <div className="grid lg:grid-cols-[auto_1fr] gap-6">
              <Calendar
                mode="single" selected={blockDate} onSelect={setBlockDate}
                className="p-3 pointer-events-auto rounded-md border"
              />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input type="time" step={900} value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <Select value={String(blockDur)} onValueChange={(v) => setBlockDur(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[15, 30, 60, 90, 120, 180, 240].map((m) => <SelectItem key={m} value={String(m)}>{minutesToLabel(m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Profissional</Label>
                  <Select value={blockStaff} onValueChange={setBlockStaff}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Motivo (opcional)</Label>
                  <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Almoço, evento, etc." />
                </div>
                <Button onClick={addBlock}><Plus className="h-4 w-4 mr-1" /> Bloquear</Button>
              </div>
            </div>

            {blocked.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Bloqueios ativos</h3>
                <div className="space-y-2">
                  {blocked.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                      <div className="text-sm">
                        <span className="font-medium">{formatDateShort(b.date)}</span>
                        <span className="text-muted-foreground"> · {b.startTime} ({minutesToLabel(b.durationMin)})</span>
                        {b.reason && <span className="text-muted-foreground"> · {b.reason}</span>}
                        <span className="text-muted-foreground"> · {b.staffId ? staff.find((s) => s.id === b.staffId)?.name : "Todos"}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => actions.removeBlocked(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
