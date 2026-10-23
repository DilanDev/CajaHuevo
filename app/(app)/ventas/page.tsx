"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Eye,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PeriodoSelector } from "@/components/ui/periodo-selector";
import { SkeletonFilas, SkeletonTarjetas } from "@/components/ui/skeleton";
import { useConsulta } from "@/lib/hooks/use-consulta";
import { listarVentas, eliminarVenta } from "@/lib/services/ventas";
import { mensajeDeError } from "@/lib/services/util";
import {
  formatCOP,
  formatFechaHora,
  formatNumero,
  formatPorcentaje,
} from "@/lib/format";
import { crearPeriodo, type Periodo } from "@/lib/periodos";
import type { MetodoPago, VentaConItems } from "@/types";
import { cn } from "@/lib/utils";

const TONO_METODO: Record<
  MetodoPago,
  "success" | "info" | "primary" | "neutral"
> = {
  Efectivo: "success",
  Nequi: "info",
  Daviplata: "primary",
  Transferencia: "neutral",
  Otro: "neutral",
};

function folio(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

export default function VentasPage() {
  const [periodo, setPeriodo] = useState<Periodo>(() => crearPeriodo("mes"));
  const { datos, cargando, error, recargar } = useConsulta<VentaConItems[]>(
    () => listarVentas(periodo),
    [periodo.desde.getTime(), periodo.hasta.getTime()]
  );

  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<VentaConItems | null>(null);
  const [ventaEliminar, setVentaEliminar] = useState<VentaConItems | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const ventas = useMemo(() => datos ?? [], [datos]);

  const resumen = useMemo(() => {
    const total = ventas.reduce((suma, venta) => suma + Number(venta.total), 0);
    const costo = ventas.reduce(
      (suma, venta) => suma + Number(venta.costo_total),
      0
    );
    return {
      total,
      cantidad: ventas.length,
      ticket: ventas.length > 0 ? total / ventas.length : 0,
      utilidad: total - costo,
    };
  }, [ventas]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return ventas;
    return ventas.filter(
      (venta) =>
        (venta.cliente ?? "").toLowerCase().includes(texto) ||
        folio(venta.numero).includes(texto) ||
        venta.metodo_pago.toLowerCase().includes(texto)
    );
  }, [ventas, busqueda]);

  async function confirmarEliminacion() {
    if (!ventaEliminar) return;
    setEliminando(true);
    try {
      await eliminarVenta(ventaEliminar.id);
      toast.success(`Venta ${folio(ventaEliminar.numero)} eliminada`);
      setVentaEliminar(null);
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
        title="Ventas"
        description="Consulta las ventas del período y revisa cada comprobante."
        actions={
          <Link href="/ventas/nueva">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva venta
            </Button>
          </Link>
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
              label="Total vendido"
              value={formatCOP(resumen.total)}
              icon={ShoppingCart}
              sub={periodo.etiqueta}
            />
            <StatCard
              label="Número de ventas"
              value={formatNumero(resumen.cantidad)}
              icon={ReceiptText}
              acento="info"
              sub="Comprobantes registrados"
            />
            <StatCard
              label="Ticket promedio"
              value={formatCOP(resumen.ticket)}
              icon={Banknote}
              acento="neutral"
              sub="Por venta"
            />
            <StatCard
              label="Utilidad bruta"
              value={formatCOP(resumen.utilidad)}
              icon={TrendingUp}
              acento="success"
              sub={
                resumen.total > 0
                  ? `Margen ${formatPorcentaje(resumen.utilidad / resumen.total)}`
                  : "Sin ventas"
              }
              valueClassName={
                resumen.utilidad < 0 ? "text-destructive" : undefined
              }
            />
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por cliente o folio…"
                aria-label="Buscar venta"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumero(filtradas.length)} venta
              {filtradas.length === 1 ? "" : "s"} en {periodo.etiqueta.toLowerCase()}
            </p>
          </div>

          <div className="tarjeta mt-3 overflow-hidden">
            {ventas.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Sin ventas en este período"
                description="Registra tu primera venta y aquí verás el historial completo."
                action={
                  <Link href="/ventas/nueva">
                    <Button>
                      <Plus className="h-4 w-4" />
                      Registrar venta
                    </Button>
                  </Link>
                }
              />
            ) : filtradas.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="Prueba con otro cliente, folio o método de pago."
              />
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_auto] gap-4 border-b bg-muted/45 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Venta</span>
                  <span>Cliente</span>
                  <span>Pago</span>
                  <span className="text-center">Ítems</span>
                  <span className="text-right">Total</span>
                  <span className="w-20 text-right">Acción</span>
                </div>

                <div className="divide-y">
                  {filtradas.map((venta) => {
                    const unidades = (venta.venta_items ?? []).reduce(
                      (suma, item) => suma + item.cantidad,
                      0
                    );

                    return (
                      <div
                        key={venta.id}
                        className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-4 md:px-5"
                      >
                        <div>
                          <p className="text-sm font-bold tabular-nums">
                            {folio(venta.numero)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFechaHora(venta.fecha)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 md:block">
                          <p className="truncate text-sm font-medium">
                            {venta.cliente?.trim() || "Cliente general"}
                          </p>
                          <p className="text-[11px] text-muted-foreground md:hidden">
                            {formatNumero(unidades)} ítem
                            {unidades === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div>
                          <Badge tono={TONO_METODO[venta.metodo_pago]}>
                            {venta.metodo_pago}
                          </Badge>
                        </div>

                        <div className="hidden text-center text-sm tabular-nums text-muted-foreground md:block">
                          {formatNumero(unidades)}
                        </div>

                        <div className="hidden text-right text-sm font-bold tabular-nums md:block">
                          {formatCOP(venta.total)}
                        </div>

                        <div className="flex items-center justify-between gap-1 md:justify-end">
                          <span className="text-sm font-bold tabular-nums md:hidden">
                            {formatCOP(venta.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDetalle(venta)}
                            aria-label={`Ver detalle de la venta ${folio(venta.numero)}`}
                            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detalle de venta */}
      <Dialog
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        title={detalle ? `Venta ${folio(detalle.numero)}` : "Venta"}
        description={detalle ? formatFechaHora(detalle.fecha) : undefined}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDetalle(null)}
            >
              Cerrar
            </Button>
            {detalle && (
              <Button
                variant="destructive"
                onClick={() => {
                  const venta = detalle;
                  setDetalle(null);
                  setVentaEliminar(venta);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Anular venta
              </Button>
            )}
          </>
        }
      >
        {detalle && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tono={TONO_METODO[detalle.metodo_pago]}>
                {detalle.metodo_pago}
              </Badge>
              {detalle.cliente && (
                <Badge tono="neutral">{detalle.cliente}</Badge>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-center font-semibold">Cant.</th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detalle.venta_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-[13px]">
                        {item.producto_nombre}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {item.cantidad}
                      </td>
                      <td className="px-3 py-2 text-right text-[13px] tabular-nums text-muted-foreground">
                        {formatCOP(item.precio_unitario)}
                      </td>
                      <td className="px-3 py-2 text-right text-[13px] font-medium tabular-nums">
                        {formatCOP(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {formatCOP(detalle.subtotal)}
                </span>
              </div>
              {Number(detalle.descuento) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Descuento</span>
                  <span className="tabular-nums text-destructive">
                    −{formatCOP(detalle.descuento)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCOP(detalle.total)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-muted-foreground">
                <span>Ganancia de la venta</span>
                <span className="tabular-nums">
                  {formatCOP(
                    Number(detalle.total) - Number(detalle.costo_total)
                  )}
                </span>
              </div>
            </div>

            {detalle.notas && (
              <div className="rounded-xl border border-dashed px-4 py-3 text-sm">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Nota
                </p>
                <p>{detalle.notas}</p>
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Al anular la venta, las unidades vuelven al inventario.
            </p>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(ventaEliminar)}
        onClose={() => setVentaEliminar(null)}
        onConfirm={confirmarEliminacion}
        loading={eliminando}
        title="Anular venta"
        description={
          ventaEliminar
            ? `Se eliminará la venta ${folio(ventaEliminar.numero)} por ${formatCOP(ventaEliminar.total)}.`
            : undefined
        }
        confirmLabel="Sí, anular venta"
      >
        <p className="text-sm text-muted-foreground">
          Las unidades vendidas se devolverán al inventario y la venta dejará de
          contar en la contabilidad. Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
