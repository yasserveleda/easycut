import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const salonName = useStore((s) => s.settings.salonName);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid place-items-center h-8 w-8 rounded-md bg-accent text-accent-foreground">
              <Scissors className="h-4 w-4" />
            </span>
            {salonName}
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/meus-agendamentos">Meus agendamentos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/admin">Sou do salão</Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to="/agendar">Agendar</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col sm:flex-row gap-3 justify-between">
          <span>© {new Date().getFullYear()} {salonName}. Todos os direitos reservados.</span>
          <span>Powered by SalonFlow</span>
        </div>
      </footer>
    </div>
  );
}
