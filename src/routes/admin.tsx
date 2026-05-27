import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminGuard,
});

function AdminGuard() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground mt-2">Sua conta não tem permissão de administrador.</p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
