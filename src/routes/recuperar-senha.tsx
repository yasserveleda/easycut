import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Services } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — SalonFlow" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Services.usuario.recuperarSenha({
        email,
        redirectUrl: window.location.origin + "/reset-password",
      });
      toast.success("Enviamos um link para o seu e-mail.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar e-mail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="font-display text-2xl font-semibold">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Enviaremos um link para redefinir sua senha.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</Button>
          </form>
          <p className="mt-6 text-center text-sm"><Link to="/login" className="text-accent font-medium">Voltar ao login</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
