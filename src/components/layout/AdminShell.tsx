import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarDays, Scissors, Users, Wallet, Settings as SettingsIcon, Menu,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/configuracoes", label: "Configurações", icon: SettingsIcon },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const loc = useLocation();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to as never}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, title, actions }: { children: React.ReactNode; title: string; actions?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border font-display font-semibold tracking-tight">
          <span className="grid place-items-center h-8 w-8 rounded-md bg-accent text-accent-foreground mr-2">
            <Scissors className="h-4 w-4" />
          </span>
          SalonFlow
        </div>
        <NavList />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground">
                <div className="h-16 flex items-center px-5 border-b border-sidebar-border font-display font-semibold">
                  SalonFlow
                </div>
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
