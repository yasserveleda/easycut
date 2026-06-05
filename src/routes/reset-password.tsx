import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Services } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — SalonFlow" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Services.usuario.redefinirSenha({ senha: password });
      toast.success("Senha atualizada!");
      nav({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="font-display text-2xl font-semibold">Definir nova senha</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><Label htmlFor="p">Nova senha</Label><Input id="p" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
