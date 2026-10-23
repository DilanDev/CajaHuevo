"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Download,
  Info,
  Package,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PeriodoSelector } from "@/components/ui/periodo-selector";
import { Skeleton, SkeletonTarjetas } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VentasGastosChart } from "@/components/charts/ventas-gastos-chart";
import { BarrasDesglose } from "@/components/charts/barras-desglose";
import { useConsulta } from "@/lib/hooks/use-consulta";
import { obtenerDatosContabilidad } from "@/lib/services/finanzas";
import type { DatosContabilidad } from "@/lib/services/finanzas";
import { descargarCSV } from "@/lib/export";
import {
  fechaISOLocal,
  formatCOP,
  formatFecha,
  formatNumero,
  formatPorcentaje,
} from "@/lib/format";
import { crearPeriodo, type Periodo } from "@/lib/periodos";
import { cn } from "@/lib/utils";

export default function ContabilidadPage() {
  const [periodo, setPeriodo] = useState<Periodo>(() => crearPeriodo("mes"));
  const { datos, cargando, error, recargar } =
    useConsulta<DatosContabilidad>(
      () => obtenerDatosContabilidad(periodo),
      [periodo.desde.getTime(), periodo.hasta.getTime()]
    );

  const porMetodo = useMemo(
    () =>
      (datos?.porMetodo ?? []).map((item) => ({
        etiqueta: item.metodo,
        valor: item.total,
        detalle: `${formatNumero(item.cantidad)} venta${
          item.cantidad === 1 ? "" : "s"
        }`,
      })),
    [datos]
  );

  const porCategoria = useMemo(
    () =>
      (datos?.porCategoriaGasto ?? []).map((item) => ({
        etiqueta: item.categoria,
        valor: item.total,
        detalle: `${formatNumero(item.cantidad)} registro${
          item.cantidad === 1 ? "" : "s"
        }`,
      })),
    [datos]
  );

  const topProductos = (datos?.topProductos ?? []).slice(0, 8);

  function exportar() {
    if (!datos) return;
    const { resumen, porMetodo, porCategoriaGasto, topProductos } = datos;
    const filas: (string | number)[][] = [
      ["Reporte contable — CajaHuevo"],
      ["Período", periodo.etiqueta],
      ["Desde", fechaISOLocal(periodo.desde)],
      ["Hasta", fechaISOLocal(periodo.hasta)],
      [],
      ["Estado de resultados"],
      ["Concepto", "Valor"],
      ["Ingresos por ventas", resumen.ingresos],
      ["Costo de mercancía vendida", resumen.costoVentas],
      ["Utilidad bruta", resumen.utilidadBruta],
      ["Gastos operativos", resumen.gastos],
      ["Ganancia neta", resumen.utilidadNeta],
      ["Margen neto", formatPorcentaje(resumen.margen)],
      [],
      ["Indicadores"],
      ["Número de ventas", resumen.numeroVentas],
      ["Unidades vendidas", resumen.unidadesVendidas],
      ["Ticket promedio", resumen.ticketPromedio],
      [],
      ["Ventas por método de pago"],
      ["Método", "Total", "Ventas"],
      ...porMetodo.map((item) => [item.metodo, item.total, item.cantidad]),
      [],
      ["Gastos por categoría"],
      ["Categoría", "Total", "Registros"],
      ...porCategoriaGasto.map((item) => [
        item.categoria,
        item.total,
        item.cantidad,
      ]),
      [],
      ["Productos más vendidos"],
      ["Producto", "Unidades", "Ingresos", "Utilidad"],
      ...topProductos.map((item) => [
        item.nombre,
        item.cantidad,
        item.ingresos,
        item.utilidad,
      ]),
    ];

    descargarCSV(
      `contabilidad-${fechaISOLocal(periodo.desde)}-${fechaISOLocal(periodo.hasta)}`,
      filas
    );
    toast.success("Reporte descargado");
  }

  const resumen = datos?.resumen;
  const margenBruto =
    resumen && resumen.ingresos > 0
      ? resumen.utilidadBruta / resumen.ingresos
      : 0;

  return (
    <div className="animar-entrada">
      <PageHeader
        title="Contabilidad"
        description="Ingresos, costos, gastos y ganancia neta de tu negocio."
        actions={
          <Button
            variant="outline"
            onClick={exportar}
            disabled={!datos || cargando}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <PeriodoSelector periodo={periodo} onChange={setPeriodo} />

      {error && (
        <Alert variant="error" className="mt-4">
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
        <div className="mt-5 space-y-5">
          <SkeletonTarjetas />
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : (
        datos &&
        resumen && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Ingresos por ventas"
                value={formatCOP(resumen.ingresos)}
                icon={TrendingUp}
                acento="success"
                sub={periodo.etiqueta}
              />
              <StatCard
                label="Costo de mercancía"
                value={formatCOP(resumen.costoVentas)}
                icon={Coins}
                acento="neutral"
                sub="Lo que costó lo vendido"
              />
              <StatCard
                label="Gastos operativos"
                value={formatCOP(resumen.gastos)}
                icon={ReceiptText}
                acento="danger"
                sub={`${formatNumero(
                  datos.porCategoriaGasto.reduce(
                    (total, item) => total + item.cantidad,
                    0
                  )
                )} registros`}
              />
              <StatCard
                label="Ganancia neta"
                value={formatCOP(resumen.utilidadNeta)}
                icon={Wallet}
                acento={resumen.utilidadNeta >= 0 ? "success" : "danger"}
                sub={`Margen ${formatPorcentaje(resumen.margen)}`}
                valueClassName={
                  resumen.utilidadNeta < 0 ? "text-destructive" : undefined
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Estado de resultados</CardTitle>
                  <CardDescription>
                    {formatFecha(fechaISOLocal(periodo.desde))} —{" "}
                    {formatFecha(fechaISOLocal(periodo.hasta))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <dl className="text-sm">
                    <div className="flex items-center justify-between gap-4 py-2">
                      <dt className="text-muted-foreground">
                        Ingresos por ventas
                      </dt>
                      <dd className="font-semibold tabular-nums">
                        {formatCOP(resumen.ingresos)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2">
                      <dt className="text-muted-foreground">
                        Costo de mercancía vendida
                      </dt>
                      <dd className="tabular-nums text-muted-foreground">
                        −{formatCOP(resumen.costoVentas)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t py-2.5">
                      <dt className="font-semibold">Utilidad bruta</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatCOP(resumen.utilidadBruta)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2">
                      <dt className="text-muted-foreground">
                        Gastos operativos
                      </dt>
                      <dd className="tabular-nums text-muted-foreground">
                        −{formatCOP(resumen.gastos)}
                      </dd>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4 rounded-xl bg-[#f6f0e5] px-4 py-3">
                      <dt className="text-sm font-bold">Ganancia neta</dt>
                      <dd
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          resumen.utilidadNeta >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {formatCOP(resumen.utilidadNeta)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Margen bruto</p>
                      <p className="font-semibold tabular-nums">
                        {formatPorcentaje(margenBruto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margen neto</p>
                      <p className="font-semibold tabular-nums">
                        {formatPorcentaje(resumen.margen)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ventas</p>
                      <p className="font-semibold tabular-nums">
                        {formatNumero(resumen.numeroVentas)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ticket promedio</p>
                      <p className="font-semibold tabular-nums">
                        {formatCOP(resumen.ticketPromedio)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Ventas y gastos</CardTitle>
                  <CardDescription>
                    Evolución diaria dentro del período
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <VentasGastosChart
                    datos={datos.serie}
                    titulo={`Ventas y gastos de ${periodo.etiqueta.toLowerCase()}`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por método de pago</CardTitle>
                  <CardDescription>
                    Cómo están pagando tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <BarrasDesglose
                    items={porMetodo}
                    color="#b45309"
                    vacio="Aún no hay ventas en este período."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gastos por categoría</CardTitle>
                  <CardDescription>
                    En qué se está yendo el dinero
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <BarrasDesglose
                    items={porCategoria}
                    color="#2a78d6"
                    vacio="Aún no hay gastos en este período."
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Productos más vendidos</CardTitle>
                  <CardDescription>
                    Por ingresos generados en el período
                  </CardDescription>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {formatNumero(resumen.unidadesVendidas)} uds. vendidas
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                {topProductos.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Sin productos vendidos"
                    description="Cuando registres ventas verás aquí el ranking de tus productos."
                    className="py-8"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/45 text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2 text-left font-semibold">
                            Producto
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Unidades
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Ingresos
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Utilidad
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProductos.map((producto) => (
                          <tr
                            key={producto.nombre}
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-2.5 font-medium">
                              {producto.nombre}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                              {formatNumero(producto.cantidad)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                              {formatCOP(producto.ingresos)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right font-semibold tabular-nums",
                                producto.utilidad >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              )}
                            >
                              {formatCOP(producto.utilidad)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert variant="info">
              <span className="inline-flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  La <strong>caja menor</strong> es un fondo aparte y no forma
                  parte de este estado de resultados. Consúltala en{" "}
                  <Link href="/caja" className="font-semibold underline">
                    Caja menor
                  </Link>
                  .
                </span>
              </span>
            </Alert>
          </div>
        )
      )}
    </div>
  );
}
