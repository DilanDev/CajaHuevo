"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigurado } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configurado: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mensajeError(error: unknown): Error {
  const texto =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (texto.includes("invalid login credentials")) {
    return new Error("Correo o contraseña incorrectos.");
  }
  if (texto.includes("email not confirmed")) {
    return new Error(
      "El correo aún no está confirmado. Confírmalo en Supabase → Authentication."
    );
  }
  if (texto.includes("too many requests")) {
    return new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
  }
  if (texto.includes("fetch") || texto.includes("network")) {
    return new Error("No se pudo conectar con Supabase. Revisa tu conexión.");
  }
  return new Error("No se pudo iniciar sesión. Inténtalo de nuevo.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigurado);

  useEffect(() => {
    if (!supabaseConfigurado) return;

    let activo = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!activo) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (activo) setUser(null);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (!activo) return;
      setSession(sesion);
      setUser(sesion?.user ?? null);
      setLoading(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw mensajeError(error);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("No se pudo cerrar la sesión.");
  }, []);

  const valor = useMemo(
    () => ({
      user,
      session,
      loading,
      configurado: supabaseConfigurado,
      signIn,
      signOut,
    }),
    [user, session, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
