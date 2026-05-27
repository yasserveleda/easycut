import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, Shield, Sparkles, Star, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { currency, minutesToLabel } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier Estúdio — Agendamento online" },
      { name: "description", content: "Reserve seu horário em segundos. Cortes, barba e estética com profissionais premiados." },
      { property: "og:title", content: "Atelier Estúdio" },
      { property: "og:description", content: "Agendamento online elegante e simples." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const services = useStore((s) => s.services.filter((x) => x.active));
  const staff = useStore((s) => s.staff);
  const salonName = useStore((s) => s.settings.salonName);
  return (
    <PublicShell>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 py-20 sm:py-28 relative">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> Agendamento premium
          </Badge>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl">
            {salonName}.
            <br />
            <span className="text-accent">Seu horário, sem fricção.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Reserve em menos de 30 segundos. Escolha o serviço, o profissional e o horário.
            Confirmação imediata, sem precisar de cadastro.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/agendar">Agendar agora <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/meus-agendamentos">Meus agendamentos</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Disponível 24h</span>
            <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-accent" /> Confirmação instantânea</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Sem cadastro</span>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">Nossos serviços</h2>
            <p className="text-muted-foreground mt-2">Tudo o que você precisa, com a qualidade que merece.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/agendar">Ver todos <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.slice(0, 6).map((svc) => (
            <Card key={svc.id} className="overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all border-border/60">
              <div className="h-1.5" style={{ backgroundColor: svc.color }} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-semibold text-lg">{svc.name}</h3>
                  <Badge variant="outline" className="shrink-0">{minutesToLabel(svc.durationMin)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{svc.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-xl font-semibold">{currency(svc.price)}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/agendar" search={{ servico: svc.id } as never}>
                      Agendar <ChevronRight className="ml-0.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Profissionais */}
      <section className="bg-muted/40 border-y">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-10">Profissionais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {staff.map((p) => (
              <Card key={p.id} className="border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-full grid place-items-center text-white font-display font-semibold text-lg"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.role}</p>
                    <div className="flex gap-0.5 mt-1 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold max-w-2xl mx-auto">
          Pronto para ficar no ponto?
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Agendamento online, sem filas, sem ligação. Em 4 passos rápidos.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/agendar">Agendar meu horário</Link>
        </Button>
      </section>
    </PublicShell>
  );
}
