"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Plus,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonTarjetas, Skeleton } from "@/components/ui/skeleton";
import { VentasGastosChart } from "@/components/charts/ventas-gastos-chart";
import { useConsulta } from "@/lib/hooks/use-consulta";
import { useAuth } from "@/lib/auth";
import {
  obtenerResumenFinanciero,
  obtenerSerieDiaria,
  type DiaContabilidad,
} from "@/lib/services/finanzas";
import { listarProductos } from "@/lib/services/productos";
import { ultimasVentas } from "@/lib/services/ventas";
import { calcularSaldoCaja, listarMovimientosCaja } from "@/lib/services/caja";
import {
  finDelDia,
  formatCOP,
  formatFechaHora,
  formatFechaLarga,
  formatNumero,
  formatPorcentaje,
  inicioDelDia,
  sumarDias,
  variacion,
} from "@/lib/format";
import { crearPeriodo } from "@/lib/periodos";
import type {
  CajaMovimiento,
  Producto,
  ResumenFinanciero,
  Venta,
} from "@/types";
import { cn } from "@/lib/utils";

type DatosDashboard = {
  hoy: ResumenFinanciero;
  mes: ResumenFinanciero;
  mesAnterior: ResumenFinanciero;
  serie: DiaContabilidad[];
  productos: Producto[];
  ventas: Venta[];
  caja: CajaMovimiento[];
};

const TONO_METODO = {
  Efectivo: "success",
  Nequi: "info",
  Daviplata: "primary",
  Transferencia: "neutral",
  Otro: "neutral",
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { datos, cargando, error, recargar } = useConsulta<DatosDashboard>(
    async () => {
      const hoy = crearPeriodo("hoy");
      const mes = crearPeriodo("mes");
      const anterior = crearPeriodo("mes_anterior");
      const desdeSerie = inicioDelDia(sumarDias(new Date(), -13));
      const hastaSerie = finDelDia(new Date());

      const [
        resumenHoy,
        resumenMes,
        resumenAnterior,
        serie,
        productos,
        ventas,
        caja,
      ] = await Promise.all([
        obtenerResumenFinanciero(hoy),
        obtenerResumenFinanciero(mes),
        obtenerResumenFinanciero(anterior),
        obtenerSerieDiaria({ desde: desdeSerie, hasta: hastaSerie }),
        listarProductos({ soloActivos: true }),
        ultimasVentas(5),
        listarMovimientosCaja(),
      ]);

      return {
        hoy: resumenHoy,
        mes: resumenMes,
        mesAnterior: resumenAnterior,
        serie,
        productos,
        ventas,
        caja,
      };
    },
    []
  );

  const [ahora] = useState(() => new Date());
  const hora = ahora.getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const fechaLarga = formatFechaLarga(ahora);

  const nombre = useMemo(() => {
    const base = (user?.email ?? "administrador").split("@")[0];
    const limpio = base.replace(/[._-]+/g, " ");
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }, [user]);

  const productosBajoStock = useMemo(() => {
    return (datos?.productos ?? [])
      .filter((producto) => producto.stock <= producto.stock_minimo)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);
  }, [datos]);

  const saldoCaja = useMemo(
    () => calcularSaldoCaja(datos?.caja ?? []),
    [datos]
  );

  const mes = datos?.mes;
  const anterior = datos?.mesAnterior;

  const tendenciaIngresos =
    anterior && anterior.ingresos > 0
      ? variacion(mes?.ingresos ?? 0, anterior.ingresos)
      : null;
  const tendenciaGastos =
    anterior && anterior.gastos > 0
      ? variacion(mes?.gastos ?? 0, anterior.gastos)
      : null;
  const tendenciaUtilidad =
    anterior && anterior.utilidadNeta > 0
      ? variacion(mes?.utilidadNeta ?? 0, anterior.utilidadNeta)
      : null;

  return (
    <div className="animar-entrada">
      <PageHeader
        title={`${saludo}, ${nombre}`}
        description={`${fechaLarga} · Este es el resumen de tu tienda.`}
        actions={
          <Link href="/ventas/nueva">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva venta
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="error" className="mb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void recargar()}
              className="w-fit"
            >
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {cargando && !datos ? (
        <div className="space-y-5">
          <SkeletonTarjetas />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      ) : (
        datos && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Ventas de hoy"
                value={formatCOP(datos.hoy.ingresos)}
                icon={ShoppingCart}
                sub={`${formatNumero(datos.hoy.numeroVentas)} venta${
                  datos.hoy.numeroVentas === 1 ? "" : "s"
                }`}
              />
              <StatCard
                label="Ingresos del mes"
                value={formatCOP(datos.mes.ingresos)}
                icon={TrendingUp}
                acento="success"
                tendencia={tendenciaIngresos}
                sub="vs. mes anterior"
              />
              <StatCard
                label="Gastos del mes"
                value={formatCOP(datos.mes.gastos)}
                icon={ReceiptText}
                acento="danger"
                tendencia={tendenciaGastos}
                tendenciaInversa
                sub="vs. mes anterior"
              />
              <StatCard
                label="Ganancia neta del mes"
                value={formatCOP(datos.mes.utilidadNeta)}
                icon={Wallet}
                acento={
                  datos.mes.utilidadNeta >= 0 ? "success" : "danger"
                }
                tendencia={tendenciaUtilidad}
                sub={
                  datos.mes.ingresos > 0
                    ? `Margen ${formatPorcentaje(datos.mes.margen)}`
                    : "Sin ingresos aún"
                }
                valueClassName={
                  datos.mes.utilidadNeta < 0 ? "text-destructive" : undefined
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link
                href="/ventas/nueva"
                className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm transition hover:border-[#d8b989] hover:bg-[#fffdf8]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fdf1e2] text-primary">
                  <Plus className="h-4 w-4" />
                </span>
                Nueva venta
              </Link>
              <Link
                href="/gastos"
                className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm transition hover:border-[#d8b989] hover:bg-[#fffdf8]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fdf1f0] text-destructive">
                  <ReceiptText className="h-4 w-4" />
                </span>
                Gasto
              </Link>
              <Link
                href="/caja"
                className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm transition hover:border-[#d8b989] hover:bg-[#fffdf8]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf7ef] text-success">
                  <Wallet className="h-4 w-4" />
                </span>
                Caja menor
              </Link>
              <Link
                href="/contabilidad"
                className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm transition hover:border-[#d8b989] hover:bg-[#fffdf8]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf7f9] text-[#0f6b78]">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Contabilidad
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>Últimos 14 días</CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Ventas y gastos diarios
                    </p>
                  </div>
                  <Link
                    href="/contabilidad"
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver reporte
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <VentasGastosChart
                    datos={datos.serie}
                    titulo="Ventas y gastos de los últimos 14 días"
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Link
                  href="/caja"
                  className="group block rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(36,28,20,0.04),0_8px_24px_-16px_rgba(36,28,20,0.12)] transition hover:border-[#d8b989]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fdf1e2] text-primary">
                      <Wallet className="h-[18px] w-[18px]" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                    Saldo de caja menor
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-2xl font-bold tracking-tight",
                      saldoCaja.saldo < 0 && "text-destructive"
                    )}
                  >
                    {formatCOP(saldoCaja.saldo)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumero(saldoCaja.cantidad)} movimiento
                    {saldoCaja.cantidad === 1 ? "" : "s"}
                  </p>
                </Link>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-[15px]">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          productosBajoStock.length > 0
                            ? "text-warning"
                            : "text-success"
                        )}
                      />
                      Stock bajo
                    </CardTitle>
                    <Link
                      href="/productos"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Ver todo
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {productosBajoStock.length === 0 ? (
                      <div className="flex items-center gap-2.5 rounded-xl bg-[#f0faf4] px-3.5 py-3 text-sm text-[#116336]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Todo tiene stock suficiente.
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {productosBajoStock.map((producto) => (
                          <li
                            key={producto.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="min-w-0 truncate text-[13px] font-medium">
                              {producto.nombre}
                            </span>
                            <Badge
                              tono={producto.stock <= 0 ? "danger" : "warning"}
                              className="shrink-0"
                            >
                              {producto.stock <= 0
                                ? "Agotado"
                                : `${formatNumero(producto.stock)} uds.`}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>Últimas ventas</CardTitle>
                  <Link
                    href="/ventas"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver todas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="pt-3">
                  {datos.ventas.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Aún no hay ventas registradas.
                      </p>
                      <Link href="/ventas/nueva">
                        <Button size="sm">
                          <Plus className="h-4 w-4" />
                          Registrar la primera
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {datos.ventas.map((venta) => (
                        <li
                          key={venta.id}
                          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold tabular-nums text-muted-foreground">
                            #{String(venta.numero).padStart(3, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold">
                              {venta.cliente?.trim() || "Cliente general"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatFechaHora(venta.fecha)}
                            </p>
                          </div>
                          <Badge tono={TONO_METODO[venta.metodo_pago]}>
                            {venta.metodo_pago}
                          </Badge>
                          <span className="shrink-0 text-sm font-bold tabular-nums">
                            {formatCOP(venta.total)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Cómo va el mes
                  </CardTitle>
                  <Link
                    href="/contabilidad"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Detalle
                  </Link>
                </CardHeader>
                <CardContent className="pt-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Ingresos</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatCOP(datos.mes.ingresos)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">
                        Costo de mercancía
                      </dt>
                      <dd className="tabular-nums text-muted-foreground">
                        −{formatCOP(datos.mes.costoVentas)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-t pt-2">
                      <dt className="text-muted-foreground">Utilidad bruta</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatCOP(datos.mes.utilidadBruta)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Gastos</dt>
                      <dd className="tabular-nums text-muted-foreground">
                        −{formatCOP(datos.mes.gastos)}
                      </dd>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                      <dt className="text-[13px] font-semibold">
                        Ganancia neta
                      </dt>
                      <dd
                        className={cn(
                          "text-base font-bold tabular-nums",
                          datos.mes.utilidadNeta >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {formatCOP(datos.mes.utilidadNeta)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5" />
                    {formatNumero(datos.mes.numeroVentas)} ventas · ticket{" "}
                    {formatCOP(datos.mes.ticketPromedio)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
