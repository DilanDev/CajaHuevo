"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Power,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { SkeletonFilas, SkeletonTarjetas } from "@/components/ui/skeleton";
import { ProductoDialog } from "@/components/productos/producto-dialog";
import { StockDialog } from "@/components/productos/stock-dialog";
import { useConsulta } from "@/lib/hooks/use-consulta";
import {
  cambiarEstadoProducto,
  listarProductos,
} from "@/lib/services/productos";
import { mensajeDeError } from "@/lib/services/util";
import { formatCOP, formatNumero, formatPorcentaje } from "@/lib/format";
import type { Producto } from "@/types";
import { cn } from "@/lib/utils";

type Filtro = "todos" | "activos" | "bajo" | "inactivos";

const FILTROS: { clave: Filtro; etiqueta: string }[] = [
  { clave: "todos", etiqueta: "Todos" },
  { clave: "activos", etiqueta: "Activos" },
  { clave: "bajo", etiqueta: "Bajo stock" },
  { clave: "inactivos", etiqueta: "Inactivos" },
];

function StockBadge({ producto }: { producto: Producto }) {
  if (producto.stock <= 0) {
    return <Badge tono="danger">Agotado</Badge>;
  }
  if (producto.stock <= producto.stock_minimo) {
    return <Badge tono="warning">{formatNumero(producto.stock)} · bajo</Badge>;
  }
  return <Badge tono="success">{formatNumero(producto.stock)} uds.</Badge>;
}

export default function ProductosPage() {
  const { datos, cargando, error, recargar } = useConsulta<Producto[]>(
    () => listarProductos(),
    []
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [stockProducto, setStockProducto] = useState<Producto | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  const productos = useMemo(() => datos ?? [], [datos]);

  const estadisticas = useMemo(() => {
    const activos = productos.filter((producto) => producto.activo);
    return {
      activos: activos.length,
      unidades: activos.reduce((total, producto) => total + producto.stock, 0),
      valorInventario: activos.reduce(
        (total, producto) => total + producto.stock * Number(producto.precio_compra),
        0
      ),
      alertas: activos.filter(
        (producto) => producto.stock <= producto.stock_minimo
      ).length,
    };
  }, [productos]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        (producto.descripcion ?? "").toLowerCase().includes(texto);

      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "activos" && producto.activo) ||
        (filtro === "inactivos" && !producto.activo) ||
        (filtro === "bajo" &&
          producto.activo &&
          producto.stock <= producto.stock_minimo);

      return coincideTexto && coincideFiltro;
    });
  }, [productos, busqueda, filtro]);

  const conteos = useMemo(
    () => ({
      todos: productos.length,
      activos: productos.filter((producto) => producto.activo).length,
      bajo: productos.filter(
        (producto) => producto.activo && producto.stock <= producto.stock_minimo
      ).length,
      inactivos: productos.filter((producto) => !producto.activo).length,
    }),
    [productos]
  );

  function abrirNuevo() {
    setProductoEditar(null);
    setDialogoAbierto(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditar(producto);
    setDialogoAbierto(true);
  }

  async function alternarEstado(producto: Producto) {
    setCambiando(producto.id);
    try {
      await cambiarEstadoProducto(producto.id, !producto.activo);
      toast.success(
        producto.activo
          ? "Producto desactivado"
          : "Producto reactivado"
      );
      await recargar(false);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setCambiando(null);
    }
  }

  return (
    <div className="animar-entrada">
      <PageHeader
        title="Productos"
        description="Controla precios, márgenes y existencias de lo que vendes."
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-5">
          {error}
        </Alert>
      )}

      {cargando && !datos ? (
        <div className="space-y-5">
          <SkeletonTarjetas />
          <div className="tarjeta">
            <SkeletonFilas filas={5} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Productos activos"
              value={formatNumero(estadisticas.activos)}
              icon={Package}
              sub={`${conteos.inactivos} inactivo${conteos.inactivos === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Unidades en stock"
              value={formatNumero(estadisticas.unidades)}
              icon={Boxes}
              acento="info"
              sub="Suma de existencias"
            />
            <StatCard
              label="Valor del inventario"
              value={formatCOP(estadisticas.valorInventario)}
              icon={DollarSign}
              acento="success"
              sub="A precio de compra"
            />
            <StatCard
              label="Alertas de stock"
              value={formatNumero(estadisticas.alertas)}
              icon={AlertTriangle}
              acento={estadisticas.alertas > 0 ? "danger" : "neutral"}
              sub="Productos por reponer"
              valueClassName={
                estadisticas.alertas > 0 ? "text-destructive" : undefined
              }
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar producto…"
                aria-label="Buscar producto"
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((item) => {
                const activo = filtro === item.clave;
                return (
                  <button
                    key={item.clave}
                    type="button"
                    onClick={() => setFiltro(item.clave)}
                    aria-pressed={activo}
                    className={cn(
                      "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition",
                      activo
                        ? "border-[#241c14] bg-[#241c14] text-[#fffdf8]"
                        : "border-border bg-card text-muted-foreground hover:border-[#c9b79d] hover:text-foreground"
                    )}
                  >
                    {item.etiqueta}
                    <span
                      className={cn(
                        "ml-1.5 text-[11px]",
                        activo ? "text-[#cbbcaa]" : "text-muted-foreground/70"
                      )}
                    >
                      {conteos[item.clave]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tarjeta mt-4 overflow-hidden">
            {productos.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Todavía no tienes productos"
                description="Crea tu primer producto para empezar a registrar ventas y llevar el inventario."
                action={
                  <Button onClick={abrirNuevo}>
                    <Plus className="h-4 w-4" />
                    Crear producto
                  </Button>
                }
              />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="Prueba con otro nombre o cambia el filtro."
              />
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] gap-4 border-b bg-muted/45 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Producto</span>
                  <span className="text-right">Compra</span>
                  <span className="text-right">Venta / margen</span>
                  <span className="text-center">Stock</span>
                  <span className="w-[6.5rem] text-right">Acciones</span>
                </div>

                <div className="divide-y">
                  {filtrados.map((producto) => {
                    const margen =
                      Number(producto.precio_venta) > 0
                        ? (Number(producto.precio_venta) -
                            Number(producto.precio_compra)) /
                          Number(producto.precio_venta)
                        : null;

                    return (
                      <div
                        key={producto.id}
                        className={cn(
                          "grid gap-3 px-4 py-4 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-4 md:px-5",
                          !producto.activo && "opacity-65"
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdf1e2] text-primary">
                            <Package className="h-[18px] w-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-foreground">
                                {producto.nombre}
                              </p>
                              {!producto.activo && (
                                <Badge tono="neutral">Inactivo</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {producto.categoria}
                              {producto.descripcion
                                ? ` · ${producto.descripcion}`
                                : ""}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground md:hidden">
                              Compra {formatCOP(producto.precio_compra)} · Venta{" "}
                              <span className="font-semibold text-foreground">
                                {formatCOP(producto.precio_venta)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="hidden text-right text-sm tabular-nums text-muted-foreground md:block">
                          {formatCOP(producto.precio_compra)}
                        </div>

                        <div className="hidden text-right md:block">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCOP(producto.precio_venta)}
                          </p>
                          {margen !== null && (
                            <p
                              className={cn(
                                "text-[11px] font-medium",
                                margen >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              )}
                            >
                              {formatPorcentaje(margen)}
                            </p>
                          )}
                        </div>

                        <div className="hidden justify-center md:flex">
                          <StockBadge producto={producto} />
                        </div>

                        <div className="flex items-center justify-between gap-2 md:justify-end">
                          <div className="md:hidden">
                            <StockBadge producto={producto} />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setStockProducto(producto)}
                              aria-label={`Ajustar stock de ${producto.nombre}`}
                              title="Ajustar stock"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <PackagePlus className="h-[18px] w-[18px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirEditar(producto)}
                              aria-label={`Editar ${producto.nombre}`}
                              title="Editar"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-[17px] w-[17px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => alternarEstado(producto)}
                              disabled={cambiando === producto.id}
                              aria-label={
                                producto.activo
                                  ? `Desactivar ${producto.nombre}`
                                  : `Reactivar ${producto.nombre}`
                              }
                              title={
                                producto.activo ? "Desactivar" : "Reactivar"
                              }
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-muted",
                                producto.activo
                                  ? "text-muted-foreground hover:text-destructive"
                                  : "text-success hover:text-success"
                              )}
                            >
                              <Power className="h-[17px] w-[17px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <ProductoDialog
        open={dialogoAbierto}
        onClose={() => setDialogoAbierto(false)}
        producto={productoEditar}
        onSaved={() => void recargar(false)}
      />

      <StockDialog
        open={Boolean(stockProducto)}
        onClose={() => setStockProducto(null)}
        producto={stockProducto}
        onUpdated={() => void recargar(false)}
      />
    </div>
  );
}
