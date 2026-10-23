"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth";
import { iniciales } from "@/lib/format";
import { cn } from "@/lib/utils";

const grupos = [
  {
    titulo: "Operación",
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
      { href: "/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/productos", label: "Productos", icon: Package },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { href: "/gastos", label: "Gastos", icon: ReceiptText },
      { href: "/caja", label: "Caja menor", icon: Wallet },
      { href: "/contabilidad", label: "Contabilidad", icon: BarChart3 },
    ],
  },
];

const navMovil = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/gastos", label: "Gastos", icon: ReceiptText },
  { href: "/contabilidad", label: "Contabilidad", icon: BarChart3 },
];

function esActivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const correo = user?.email ?? "";
  const nombre = correo.split("@")[0]?.replace(/[._-]+/g, " ") || "Administrador";

  async function cerrarSesion() {
    try {
      await signOut();
      toast.success("Sesión cerrada");
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  }

  return (
    <>
      {/* Barra superior móvil */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-sidebar px-4 md:hidden">
        <Link href="/dashboard" aria-label="Ir al inicio">
          <Logo tono="oscuro" />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/caja"
            aria-label="Caja menor"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-[#cbbcaa] transition hover:bg-white/[0.07] hover:text-[#f6c453]",
              esActivo(pathname, "/caja") && "bg-white/[0.07] text-[#f6c453]"
            )}
          >
            <Wallet className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={cerrarSesion}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#cbbcaa] transition hover:bg-white/[0.07] hover:text-[#f6c453]"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Navegación inferior móvil */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {navMovil.map((item) => {
            const activo = esActivo(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.6rem] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors",
                  activo ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-10 items-center justify-center rounded-full transition-colors",
                    activo && "bg-primary/10"
                  )}
                >
                  <item.icon className="h-[21px] w-[21px]" strokeWidth={activo ? 2.3 : 1.9} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Barra lateral escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-[4.6rem] items-center border-b border-white/5 px-5">
          <Link href="/dashboard" aria-label="Ir al inicio">
            <Logo tono="oscuro" />
          </Link>
        </div>

        <div className="px-3 pt-4">
          <Link
            href="/ventas/nueva"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f6c453] text-sm font-bold text-[#3a2a0a] shadow-sm transition hover:bg-[#efba3c] active:bg-[#e5af2d]"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} />
            Nueva venta
          </Link>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {grupos.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d7063]">
                {grupo.titulo}
              </p>
              <div className="space-y-1">
                {grupo.items.map((item) => {
                  const activo = esActivo(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        activo
                          ? "bg-sidebar-active text-[#f6c453]"
                          : "text-[#cbbcaa] hover:bg-sidebar-hover hover:text-[#f4ecdf]"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          activo
                            ? "text-[#f6c453]"
                            : "text-[#8f8173] group-hover:text-[#cbbcaa]"
                        )}
                        strokeWidth={activo ? 2.3 : 1.9}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6c453]/15 text-xs font-bold uppercase text-[#f6c453]">
              {iniciales(correo) || "AD"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold capitalize text-[#f4ecdf]">
                {nombre}
              </p>
              <p className="truncate text-[11px] text-[#8f8173]">{correo}</p>
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8f8173] transition hover:bg-white/[0.07] hover:text-[#f6c453]"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
