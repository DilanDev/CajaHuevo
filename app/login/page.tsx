"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PackageCheck,
  ReceiptText,
  ShoppingBasket,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const beneficios = [
  {
    icon: PackageCheck,
    titulo: "Inventario bajo control",
    detalle: "Cada venta descuenta el stock automáticamente.",
  },
  {
    icon: ShoppingBasket,
    titulo: "Ventas en segundos",
    detalle: "Registra pedidos desde el celular o el computador.",
  },
  {
    icon: ReceiptText,
    titulo: "Contabilidad clara",
    detalle: "Ingresos, egresos y ganancia neta al día.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading: authLoading, configurado } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Logo />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-32 h-[34rem] w-[34rem] rounded-full border border-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-16 h-[26rem] w-[26rem] rounded-full border border-[#f6c453]/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-24 h-[30rem] w-[30rem] rounded-full bg-[#f6c453]/[0.06] blur-2xl"
        />

        <div className="relative">
          <Logo tono="oscuro" />
        </div>

        <div className="relative max-w-lg py-14">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#f6c453]">
            Control de tienda
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-balance">
            Tu negocio de huevos, en orden.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#cbbcaa]">
            Un solo lugar para saber qué vendiste, cuánto ganaste y cómo va tu
            caja. Sin cuadernos y sin cuentas sueltas.
          </p>

          <ul className="mt-10 space-y-5">
            {beneficios.map((beneficio) => (
              <li key={beneficio.titulo} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#f6c453]">
                  <beneficio.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#f4ecdf]">
                    {beneficio.titulo}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#a9998a]">
                    {beneficio.detalle}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#7d7063]">
          CajaHuevo · Administración simple para tu tienda
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[23rem]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-3xl font-semibold leading-tight">
            Hola de nuevo
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Inicia sesión con tu correo de administrador.
          </p>

          {!configurado && (
            <Alert variant="error" className="mt-6">
              Falta conectar Supabase. Agrega las variables de entorno en{" "}
              <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[12px]">
                .env.local
              </code>{" "}
              y reinicia la aplicación.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="admin@tutienda.com"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  className="pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((valor) => !valor)}
                  aria-label={
                    verPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {verPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              loading={enviando}
              disabled={!configurado}
            >
              {enviando ? "Ingresando…" : "Ingresar al panel"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Acceso privado para el administrador de la tienda.
            <br />
            Las cuentas se crean desde Supabase → Authentication.
          </p>
        </div>
      </section>
    </main>
  );
}
