"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Calculator,
  Hash,
  Home,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ShoppingBasket,
  Tag,
  Trash2,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PeriodoSelector } from "@/components/ui/periodo-selector";
import { SkeletonFilas, SkeletonTarjetas } from "@/components/ui/skeleton";
import { GastoDialog } from "@/components/gastos/gasto-dialog";
import { useConsulta } from "@/lib/hooks/use-consulta";
import { eliminarGasto, listarGastos } from "@/lib/services/gastos";
import { mensajeDeError } from "@/lib/services/util";
import { formatCOP, formatFecha, formatNumero } from "@/lib/format";
import { crearPeriodo, type Periodo } from "@/lib/periodos";
import type { Gasto } from "@/types";
import { cn } from "@/lib/utils";

const ICONOS_CATEGORIA: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Compra de mercancía": ShoppingBasket,
  Transporte: Truck,
  Servicios: Zap,
  Arriendo: Home,
  Empaques: Box,
  Mantenimiento: Wrench,
  Otros: ReceiptText,
};

export default function GastosPage() {
  const [periodo, setPeriodo] = useState<Periodo>(() => crearPeriodo("mes"));
  const { datos, cargando, error, recargar } = useConsulta<Gasto[]>(
    () => listarGastos(periodo),
    [periodo.desde.getTime(), periodo.hasta.getTime()]
  );

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null);
  const [gastoEliminar, setGastoEliminar] = useState<Gasto | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const gastos = useMemo(() => datos ?? [], [datos]);

  const categorias = useMemo(() => {
    const set = new Set(gastos.map((gasto) => gasto.categoria));
    return ["Todas", ...Array.from(set)];
  }, [gastos]);

  const resumen = useMemo(() => {
    const total = gastos.reduce((suma, gasto) => suma + Number(gasto.monto), 0);
    const porCategoria = new Map<string, number>();
    for (const gasto of gastos) {
      porCategoria.set(
        gasto.categoria,
        (porCategoria.get(gasto.categoria) ?? 0) + Number(gasto.monto)
      );
    }
    const top = Array.from(porCategoria.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      total,
      cantidad: gastos.length,
      promedio: gastos.length > 0 ? total / gastos.length : 0,
      topCategoria: top?.[0] ?? "—",
      topMonto: top?.[1] ?? 0,
    };
  }, [gastos]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return gastos.filter(
      (gasto) =>
        (categoria === "Todas" || gasto.categoria === categoria) &&
        (!texto ||
          gasto.descripcion.toLowerCase().includes(texto) ||
          gasto.categoria.toLowerCase().includes(texto))
    );
  }, [gastos, busqueda, categoria]);

  const totalFiltrado = filtrados.reduce(
    (suma, gasto) => suma + Number(gasto.monto),
    0
  );

  function abrirNuevo() {
    setGastoEditar(null);
    setDialogoAbierto(true);
  }

  function abrirEditar(gasto: Gasto) {
    setGastoEditar(gasto);
    setDialogoAbierto(true);
  }

  async function confirmarEliminacion() {
    if (!gastoEliminar) return;
    setEliminando(true);
    try {
      await eliminarGasto(gastoEliminar.id);
      toast.success("Gasto eliminado");
      setGastoEliminar(null);
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
        title="Gastos"
        description="Registra y clasifica las salidas de dinero del negocio."
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        }
      />

      <PeriodoSelector periodo={periodo} onChange={setPeriodo} />

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      {cargando && !datos ? (
        <div className="mt-5 space-y-5">
          <SkeletonTarjetas />
          <div className="tarjeta">
            <SkeletonFilas filas={5} />
          </div>
        </div>
      ) : (
        <div className={cn(cargando && "opacity-60 transition-opacity")}>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total gastos"
              value={formatCOP(resumen.total)}
              icon={ReceiptText}
              acento="danger"
              sub={periodo.etiqueta}
              valueClassName="text-destructive"
            />
            <StatCard
              label="Registros"
              value={formatNumero(resumen.cantidad)}
              icon={Hash}
              acento="neutral"
              sub="Gastos del período"
            />
            <StatCard
              label="Promedio"
              value={formatCOP(resumen.promedio)}
              icon={Calculator}
              acento="info"
              sub="Por gasto"
            />
            <StatCard
              label="Categoría principal"
              value={resumen.topCategoria}
              icon={Tag}
              acento="primary"
              sub={resumen.topMonto > 0 ? formatCOP(resumen.topMonto) : "Sin gastos"}
              valueClassName="text-lg md:text-xl"
            />
          </div>

          <div className="mt-5 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar gasto…"
                aria-label="Buscar gasto"
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categorias.map((item) => {
                const activo = categoria === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategoria(item)}
                    aria-pressed={activo}
                    className={cn(
                      "h-8 rounded-full border px-3 text-xs font-semibold transition",
                      activo
                        ? "border-[#241c14] bg-[#241c14] text-[#fffdf8]"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tarjeta mt-3 overflow-hidden">
            {gastos.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="Sin gastos en este período"
                description="Anota compras de mercancía, transporte, servicios y más."
                action={
                  <Button onClick={abrirNuevo}>
                    <Plus className="h-4 w-4" />
                    Registrar gasto
                  </Button>
                }
              />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="Prueba con otra búsqueda o categoría."
              />
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto] gap-4 border-b bg-muted/45 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Descripción</span>
                  <span>Categoría</span>
                  <span>Fecha</span>
                  <span className="text-right">Monto</span>
                  <span className="w-20 text-right">Acciones</span>
                </div>

                <div className="divide-y">
                  {filtrados.map((gasto) => {
                    const Icono =
                      ICONOS_CATEGORIA[gasto.categoria] ?? ReceiptText;
                    return (
                      <div
                        key={gasto.id}
                        className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto] md:items-center md:gap-4 md:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fdf1e2] text-primary">
                            <Icono className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {gasto.descripcion}
                            </p>
                            <p className="text-[11px] text-muted-foreground md:hidden">
                              {gasto.categoria} · {formatFecha(gasto.fecha)} ·{" "}
                              {gasto.metodo_pago}
                            </p>
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <Badge tono="neutral">{gasto.categoria}</Badge>
                        </div>

                        <div className="hidden text-sm text-muted-foreground md:block">
                          {formatFecha(gasto.fecha)}
                        </div>

                        <div className="hidden text-right text-sm font-semibold tabular-nums text-destructive md:block">
                          −{formatCOP(gasto.monto)}
                        </div>

                        <div className="flex items-center justify-between gap-1 md:justify-end">
                          <span className="text-sm font-semibold tabular-nums text-destructive md:hidden">
                            −{formatCOP(gasto.monto)}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => abrirEditar(gasto)}
                              aria-label={`Editar gasto: ${gasto.descripcion}`}
                              title="Editar"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-[17px] w-[17px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setGastoEliminar(gasto)}
                              aria-label={`Eliminar gasto: ${gasto.descripcion}`}
                              title="Eliminar"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
                            >
                              <Trash2 className="h-[17px] w-[17px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {formatNumero(filtrados.length)} gasto
                    {filtrados.length === 1 ? "" : "s"}
                  </span>
                  <span className="font-bold tabular-nums">
                    Total: {formatCOP(totalFiltrado)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <GastoDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        gasto={gastoEditar}
        onSaved={() => void recargar(false)}
      />

      <ConfirmDialog
        open={Boolean(gastoEliminar)}
        onClose={() => setGastoEliminar(null)}
        onConfirm={confirmarEliminacion}
        loading={eliminando}
        title="Eliminar gasto"
        description={gastoEliminar?.descripcion}
      >
        <p className="text-sm text-muted-foreground">
          Se eliminará este gasto por{" "}
          <strong className="text-foreground">
            {formatCOP(gastoEliminar?.monto ?? 0)}
          </strong>
          . Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
