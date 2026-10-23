"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Info,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonFilas } from "@/components/ui/skeleton";
import { MovimientoDialog } from "@/components/caja/movimiento-dialog";
import { useConsulta } from "@/lib/hooks/use-consulta";
import {
  calcularSaldoCaja,
  eliminarMovimientoCaja,
  listarMovimientosCaja,
} from "@/lib/services/caja";
import { mensajeDeError } from "@/lib/services/util";
import { formatCOP, formatFechaHora, formatNumero } from "@/lib/format";
import type { CajaMovimiento } from "@/types";
import { cn } from "@/lib/utils";

export default function CajaPage() {
  const { datos, cargando, error, recargar } = useConsulta<CajaMovimiento[]>(
    () => listarMovimientosCaja(),
    []
  );

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [tipoInicial, setTipoInicial] = useState<"ingreso" | "egreso">(
    "ingreso"
  );
  const [movimientoEliminar, setMovimientoEliminar] =
    useState<CajaMovimiento | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const movimientos = useMemo(() => datos ?? [], [datos]);
  const resumen = useMemo(() => calcularSaldoCaja(movimientos), [movimientos]);

  function abrir(tipo: "ingreso" | "egreso") {
    setTipoInicial(tipo);
    setDialogoAbierto(true);
  }

  async function confirmarEliminacion() {
    if (!movimientoEliminar) return;
    setEliminando(true);
    try {
      await eliminarMovimientoCaja(movimientoEliminar.id);
      toast.success("Movimiento eliminado");
      setMovimientoEliminar(null);
      await recargar(false);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="animar-entrada">
      <PageHeader
        title="Caja menor"
        description="El fondo de efectivo para los gastos pequeños del día a día."
        actions={
          <Button onClick={() => abrir("ingreso")}>
            <Plus className="h-4 w-4" />
            Registrar movimiento
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-3xl bg-sidebar p-6 text-[#f4ecdf] shadow-lg lg:col-span-2 md:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#f6c453]/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-[#f6c453]/[0.07] blur-xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#cbbcaa]">
              <Wallet className="h-4 w-4 text-[#f6c453]" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                Saldo disponible
              </span>
            </div>
            <p className="mt-2 text-4xl font-bold tracking-tight md:text-[2.75rem]">
              {formatCOP(resumen.saldo)}
            </p>
            <p className="mt-1 text-sm text-[#a9998a]">
              {formatNumero(resumen.cantidad)} movimiento
              {resumen.cantidad === 1 ? "" : "s"} registrado
              {resumen.cantidad === 1 ? "" : "s"}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => abrir("ingreso")}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#f6c453] px-4 text-sm font-bold text-[#3a2a0a] transition hover:bg-[#efba3c]"
              >
                <ArrowDownLeft className="h-4 w-4" />
                Ingresar dinero
              </button>
              <button
                type="button"
                onClick={() => abrir("egreso")}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-[#f4ecdf] transition hover:bg-white/[0.12]"
              >
                <ArrowUpRight className="h-4 w-4" />
                Registrar egreso
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#8f8173]">
                  Ingresos
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#8fddab]">
                  +{formatCOP(resumen.ingresos)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#8f8173]">
                  Egresos
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#f0a49e]">
                  −{formatCOP(resumen.egresos)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <StatCard
            label="Ingresos a caja"
            value={formatCOP(resumen.ingresos)}
            icon={ArrowDownLeft}
            acento="success"
            sub="Reposiciones y entradas"
          />
          <StatCard
            label="Egresos de caja"
            value={formatCOP(resumen.egresos)}
            icon={ArrowUpRight}
            acento="danger"
            sub="Gastos pagados del fondo"
          />
          <StatCard
            label="Movimientos"
            value={formatNumero(resumen.cantidad)}
            icon={Hash}
            acento="neutral"
            sub="Historial completo"
          />
        </div>
      </div>

      <Alert variant="info" className="mt-4">
        <span className="inline-flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            La caja menor es un fondo independiente para gastos pequeños. Las
            ventas se registran en <strong>Ventas</strong> y los gastos
            generales en <strong>Gastos</strong>.
          </span>
        </span>
      </Alert>

      <div className="tarjeta mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-bold">Movimientos de caja</h2>
          <span className="text-xs text-muted-foreground">
            Saldo: <strong className="text-foreground">{formatCOP(resumen.saldo)}</strong>
          </span>
        </div>

        {cargando && !datos ? (
          <SkeletonFilas filas={4} />
        ) : movimientos.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="La caja está sin movimientos"
            description="Empieza registrando el saldo inicial del fondo o un primer ingreso."
            action={
              <Button onClick={() => abrir("ingreso")}>
                <Plus className="h-4 w-4" />
                Registrar saldo inicial
              </Button>
            }
          />
        ) : (
          <div className="divide-y">
            {movimientos.map((movimiento) => {
              const ingreso = movimiento.tipo === "ingreso";
              return (
                <div
                  key={movimiento.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20 md:px-5"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      ingreso
                        ? "bg-[#eaf7ef] text-success"
                        : "bg-[#fdf1f0] text-destructive"
                    )}
                  >
                    {ingreso ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {movimiento.concepto}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFechaHora(movimiento.fecha)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        ingreso ? "text-success" : "text-destructive"
                      )}
                    >
                      {ingreso ? "+" : "−"}
                      {formatCOP(movimiento.monto)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMovimientoEliminar(movimiento)}
                      aria-label={`Eliminar movimiento: ${movimiento.concepto}`}
                      title="Eliminar"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-[17px] w-[17px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MovimientoDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        tipoInicial={tipoInicial}
        onSaved={() => void recargar(false)}
      />

      <ConfirmDialog
        open={Boolean(movimientoEliminar)}
        onClose={() => setMovimientoEliminar(null)}
        onConfirm={confirmarEliminacion}
        loading={eliminando}
        title="Eliminar movimiento"
        description={movimientoEliminar?.concepto}
      >
        <p className="text-sm text-muted-foreground">
          Se eliminará este movimiento por{" "}
          <strong className="text-foreground">
            {formatCOP(movimientoEliminar?.monto ?? 0)}
          </strong>{" "}
          y el saldo de caja se recalculará.
        </p>
      </ConfirmDialog>
    </div>
  );
}
