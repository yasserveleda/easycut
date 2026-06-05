import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Services } from "@/services";
import type { SessaoUsuario, Usuario } from "@/domain/usuario/Usuario";
import { useStoreInit, resetStore } from "./store";

interface AuthCtx {
  user: Usuario | null;
  session: SessaoUsuario | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessaoUsuario | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    const checkRole = (userId: string) => {
      Services.usuario.ehAdmin(userId).then((admin) => {
        setIsAdmin(admin);
        setRoleChecked(true);
      });
    };

    const unsub = Services.usuario.onMudancaSessao((_event, s) => {
      setSession(s);
      setLoading(false);
      if (s?.usuario) {
        setRoleChecked(false);
        setTimeout(() => checkRole(s.usuario.id), 0);
      } else {
        setIsAdmin(false);
        setRoleChecked(true);
        resetStore();
      }
    });

    Services.usuario.obterSessao().then((s) => {
      setSession(s);
      setLoading(false);
      if (s?.usuario) checkRole(s.usuario.id);
      else setRoleChecked(true);
    });

    return () => unsub();
  }, []);

  useStoreInit(!!session);

  const signOut = async () => { await Services.usuario.sair(); };

  return (
    <Ctx.Provider value={{ user: session?.usuario ?? null, session, isAdmin, loading: loading || (!!session && !roleChecked), signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
