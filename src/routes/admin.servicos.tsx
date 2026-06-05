import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Services } from "@/services";
import { CategoriaServico } from "@/domain/servico/enums";
import { currency, minutesToLabel } from "@/lib/format";
import type { Service, ServiceCategory } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/servicos")({
  head: () => ({ meta: [{ title: "Serviços — SalonFlow" }] }),
  component: ServicesPage,
});

const categories: { value: ServiceCategory; label: string }[] = [
  { value: "cabelo", label: "Cabelo" },
  { value: "barba", label: "Barba" },
  { value: "estetica", label: "Estética" },
  { value: "combo", label: "Combo" },
  { value: "outros", label: "Outros" },
];

const palette = ["#D9A441", "#7B5E3B", "#A87C3B", "#5A8DA8", "#8E5A8C", "#C56E8E", "#3B7A57", "#B4513B"];

function ServicesPage() {
  const services = useStore((s) => s.services);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setOpen(true); };

  return (
    <AdminShell title="Serviços" actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo serviço</Button>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id} className="overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: s.color }} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold">{s.name}</h3>
                  <Badge variant="outline" className="mt-1 capitalize">{s.category}</Badge>
                </div>
                {!s.active && <Badge variant="secondary">Inativo</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-lg">{currency(s.price)}</p>
                  <p className="text-xs text-muted-foreground">{minutesToLabel(s.durationMin)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => {
                    await Services.servico.remover(s.id); toast.success("Serviço removido");
                  }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ServiceDialog open={open} onOpenChange={setOpen} editing={editing} />
    </AdminShell>
  );
}

function ServiceDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Service | null }) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(editing?.price ?? 0);
  const [duration, setDuration] = useState(editing?.durationMin ?? 30);
  const [category, setCategory] = useState<ServiceCategory>(editing?.category ?? "cabelo");
  const [color, setColor] = useState(editing?.color ?? palette[0]);
  const [active, setActive] = useState(editing?.active ?? true);

  // reset on open change
  if (open && editing && editing.id !== (editing as Service).id) { /* noop */ }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Informe um nome"); return; }
    if (duration % 15 !== 0) { toast.error("Duração deve ser múltipla de 15min"); return; }
    await Services.servico.salvar({
      id: editing?.id,
      nome: name.trim(),
      descricao: description,
      preco: Number(price) || 0,
      duracaoMin: Number(duration),
      categoria: category as CategoriaServico,
      cor: color,
      ativo: active,
    });
    toast.success(editing ? "Serviço atualizado" : "Serviço criado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) {
        setName(editing?.name ?? ""); setDescription(editing?.description ?? ""); setPrice(editing?.price ?? 0);
        setDuration(editing?.durationMin ?? 30); setCategory(editing?.category ?? "cabelo");
        setColor(editing?.color ?? palette[0]); setActive(editing?.active ?? true);
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Corte masculino" /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
            <div>
              <Label>Duração</Label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map((m) => (
                    <SelectItem key={m} value={String(m)}>{minutesToLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cor na agenda</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><Label>Ativo</Label><p className="text-xs text-muted-foreground">Exibir para clientes no agendamento.</p></div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
