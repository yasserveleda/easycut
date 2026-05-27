import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — SalonFlow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    nav({ to: "/admin" });
  };

  const handleGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/admin" });
    if (r.error) toast.error("Falha ao entrar com Google");
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
          <h1 className="font-display text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse o painel administrativo do salão.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          </form>
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div></div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>Entrar com Google</Button>
          <div className="mt-6 flex justify-between text-sm">
            <Link to="/recuperar-senha" className="text-muted-foreground hover:text-foreground">Esqueci a senha</Link>
            <Link to="/cadastro" className="text-accent font-medium">Criar conta</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
