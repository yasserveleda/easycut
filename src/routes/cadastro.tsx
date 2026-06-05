import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Services } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — SalonFlow" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Services.usuario.cadastrar({
        nome: name,
        email,
        senha: password,
        redirectUrl: window.location.origin + "/admin",
      });
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      nav({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold mb-6">
            <span className="grid place-items-center h-8 w-8 rounded-md bg-accent text-accent-foreground">
              <Scissors className="h-4 w-4" />
            </span>
            SalonFlow
          </Link>
          <h1 className="font-display text-2xl font-semibold">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">O primeiro cadastro será o administrador do salão.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><Label htmlFor="n">Nome</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p">Senha</Label><Input id="p" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-accent font-medium">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
