"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  Minus,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingBasket,
  Smartphone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsulta } from "@/lib/hooks/use-consulta";
import { listarProductos } from "@/lib/services/productos";
import {
  registrarVenta,
  type ResultadoVenta,
} from "@/lib/services/ventas";
import { mensajeDeError } from "@/lib/services/util";
import { formatCOP, formatNumero } from "@/lib/format";
import {
  METODOS_PAGO,
  type ItemCarrito,
  type MetodoPago,
  type Producto,
} from "@/types";
import { cn } from "@/lib/utils";

const ICONOS_METODO = {
  Efectivo: Banknote,
  Nequi: Smartphone,
  Daviplata: Smartphone,
  Transferencia: ArrowLeftRight,
  Otro: MoreHorizontal,
} as const;

function aNumero(texto: string): number {
  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const { datos, cargando, error: errorCarga, recargar } = useConsulta<Producto[]>(
    () => listarProductos({ soloActivos: true }),
    []
  );

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [descuento, setDescuento] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ventaRegistrada, setVentaRegistrada] =
    useState<ResultadoVenta | null>(null);
  const [vistaMovil, setVistaMovil] = useState<"productos" | "carrito">(
    "productos"
  );

  const productos = useMemo(() => datos ?? [], [datos]);

  const categorias = useMemo(() => {
    const set = new Set(productos.map((producto) => producto.categoria));
    return ["Todos", ...Array.from(set)];
  }, [productos]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto);
      const coincideCategoria =
        categoria === "Todos" || producto.categoria === categoria;
      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  const subtotal = useMemo(
    () =>
      carrito.reduce(
        (total, item) =>
          total + Number(item.producto.precio_venta) * item.cantidad,
        0
      ),
    [carrito]
  );

  const descuentoNumero = Math.min(
    Math.max(aNumero(descuento), 0),
    subtotal
  );
  const total = Math.max(subtotal - descuentoNumero, 0);
  const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  function cantidadEnCarrito(id: string) {
    return carrito.find((item) => item.producto.id === id)?.cantidad ?? 0;
  }

  function agregar(producto: Producto) {
    if (producto.stock <= 0) {
      toast.warning("Este producto está agotado.");
      return;
    }

    const existente = carrito.find(
      (item) => item.producto.id === producto.id
    );

    if (existente) {
      if (existente.cantidad >= producto.stock) {
        toast.warning(
          `Solo hay ${formatNumero(producto.stock)} unidades de ${producto.nombre}.`
        );
        return;
      }
      setCarrito((anterior) =>
        anterior.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito((anterior) => [...anterior, { producto, cantidad: 1 }]);
    }

    setError(null);
  }

  function cambiarCantidad(id: string, delta: number) {
    const item = carrito.find((linea) => linea.producto.id === id);
    if (!item) return;

    const nueva = item.cantidad + delta;

    if (nueva <= 0) {
      quitar(id);
      return;
    }

    if (nueva > item.producto.stock) {
      toast.warning(
        `Solo hay ${formatNumero(item.producto.stock)} unidades disponibles.`
      );
      return;
    }

    setCarrito((anterior) =>
      anterior.map((linea) =>
        linea.producto.id === id ? { ...linea, cantidad: nueva } : linea
      )
    );
  }

  function quitar(id: string) {
    setCarrito((anterior) =>
      anterior.filter((item) => item.producto.id !== id)
    );
  }

  function limpiarVenta() {
    setCarrito([]);
    setCliente("");
    setDescuento("");
    setNotas("");
    setError(null);
  }

  async function cobrar() {
    setError(null);

    if (carrito.length === 0) {
      setError("Agrega al menos un producto para registrar la venta.");
      return;
    }

    setGuardando(true);
    try {
      const resultado = await registrarVenta({
        items: carrito.map((item) => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
        })),
        cliente: cliente.trim() || undefined,
        metodo_pago: metodoPago,
        descuento: descuentoNumero,
        notas: notas.trim() || undefined,
      });

      setVentaRegistrada(resultado);
      limpiarVenta();
      await recargar(false);
    } catch (err) {
      const mensaje = mensajeDeError(err);
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="animar-entrada pb-24 lg:pb-0">
      <PageHeader
        title="Nueva venta"
        description="Selecciona los productos y confirma el cobro."
        actions={
          <Link href="/ventas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Volver a ventas
            </Button>
          </Link>
        }
      />

      {/* Selector móvil */}
      <div className="mb-4 grid grid-cols-2 rounded-xl border bg-card p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setVistaMovil("productos")}
          aria-pressed={vistaMovil === "productos"}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition",
            vistaMovil === "productos"
              ? "bg-[#241c14] text-[#fffdf8]"
              : "text-muted-foreground"
          )}
        >
          <Package className="h-4 w-4" />
          Productos
        </button>
        <button
          type="button"
          onClick={() => setVistaMovil("carrito")}
          aria-pressed={vistaMovil === "carrito"}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition",
            vistaMovil === "carrito"
              ? "bg-[#241c14] text-[#fffdf8]"
              : "text-muted-foreground"
          )}
        >
          <ShoppingBasket className="h-4 w-4" />
          Carrito
          {unidades > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                vistaMovil === "carrito"
                  ? "bg-white/20"
                  : "bg-primary/10 text-primary"
              )}
            >
              {unidades}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Catálogo */}
        <section
          className={cn(
            "min-w-0",
            vistaMovil === "carrito" && "hidden lg:block"
          )}
        >
          <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar producto…"
                aria-label="Buscar producto para vender"
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
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
                      ? "border-primary bg-[#fdf1e2] text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {errorCarga && (
            <Alert variant="error" className="mb-4">
              {errorCarga}
            </Alert>
          )}

          {cargando && !datos ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, indice) => (
                <Skeleton key={indice} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="tarjeta">
              <EmptyState
                icon={Package}
                title="No hay productos activos"
                description="Primero crea un producto con existencias para poder venderlo."
                action={
                  <Link href="/productos">
                    <Button>Ir a productos</Button>
                  </Link>
                }
              />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="tarjeta">
              <EmptyState
                icon={Search}
                title="Sin resultados"
                description="Prueba con otro nombre o categoría."
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtrados.map((producto) => {
                const agotado = producto.stock <= 0;
                const enCarrito = cantidadEnCarrito(producto.id);

                return (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => agregar(producto)}
                    disabled={agotado}
                    className={cn(
                      "group relative flex min-h-32 flex-col justify-between rounded-2xl border bg-card p-3.5 text-left shadow-sm transition",
                      agotado
                        ? "cursor-not-allowed opacity-55"
                        : "hover:-translate-y-0.5 hover:border-[#d8b989] hover:shadow-md active:translate-y-0",
                      enCarrito > 0 && "border-primary/45 ring-1 ring-primary/20"
                    )}
                  >
                    <div>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdf1e2] text-primary">
                          <Package className="h-4 w-4" />
                        </span>
                        {enCarrito > 0 ? (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                            {enCarrito}
                          </span>
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground/50 transition group-hover:text-primary" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug">
                        {producto.nombre}
                      </p>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCOP(producto.precio_venta)}
                      </span>
                      <span
                        className={cn(
                          "text-[10.5px] font-medium",
                          agotado
                            ? "text-destructive"
                            : producto.stock <= producto.stock_minimo
                              ? "text-warning"
                              : "text-muted-foreground"
                        )}
                      >
                        {agotado
                          ? "Agotado"
                          : `${formatNumero(producto.stock)} disp.`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Carrito */}
        <aside
          className={cn(
            "min-w-0",
            vistaMovil === "productos" && "hidden lg:block"
          )}
        >
          <div className="tarjeta lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b px-4 py-3.5">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-[18px] w-[18px] text-primary" />
                <h2 className="text-sm font-bold">Resumen de venta</h2>
              </div>
              {carrito.length > 0 && (
                <button
                  type="button"
                  onClick={limpiarVenta}
                  className="text-xs font-medium text-muted-foreground transition hover:text-destructive"
                >
                  Vaciar
                </button>
              )}
            </div>

            {carrito.length === 0 ? (
              <EmptyState
                icon={ShoppingBasket}
                title="El carrito está vacío"
                description="Toca los productos para agregarlos a la venta."
                className="py-9"
              />
            ) : (
              <div className="max-h-[19rem] divide-y overflow-y-auto">
                {carrito.map((item) => (
                  <div key={item.producto.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">
                        {item.producto.nombre}
                      </p>
                      <button
                        type="button"
                        onClick={() => quitar(item.producto.id)}
                        aria-label={`Quitar ${item.producto.nombre}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            cambiarCantidad(item.producto.id, -1)
                          }
                          aria-label={`Quitar una unidad de ${item.producto.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border bg-card text-muted-foreground transition hover:bg-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.producto.id, 1)}
                          aria-label={`Agregar una unidad de ${item.producto.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border bg-card text-muted-foreground transition hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums">
                        {formatCOP(
                          Number(item.producto.precio_venta) * item.cantidad
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3.5 border-t p-4">
              <div className="space-y-1.5">
                <Label htmlFor="venta-cliente">Cliente (opcional)</Label>
                <Input
                  id="venta-cliente"
                  value={cliente}
                  onChange={(evento) => setCliente(evento.target.value)}
                  placeholder="Nombre del cliente"
                  className="h-10"
                />
              </div>

              <div>
                <Label className="mb-1.5">Método de pago</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {METODOS_PAGO.map((metodo) => {
                    const Icono = ICONOS_METODO[metodo];
                    const activo = metodoPago === metodo;
                    return (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setMetodoPago(metodo)}
                        aria-pressed={activo}
                        className={cn(
                          "flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition",
                          activo
                            ? "border-primary bg-[#fdf1e2] text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                          metodo === "Otro" && "col-span-2"
                        )}
                      >
                        <Icono className="h-3.5 w-3.5" />
                        {metodo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venta-descuento">Descuento (opcional)</Label>
                <Input
                  id="venta-descuento"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={subtotal}
                  step="any"
                  value={descuento}
                  onChange={(evento) => setDescuento(evento.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venta-notas">Nota (opcional)</Label>
                <Textarea
                  id="venta-notas"
                  value={notas}
                  onChange={(evento) => setNotas(evento.target.value)}
                  placeholder="Ej. Entrega en la tarde"
                  rows={2}
                  className="min-h-16"
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="space-y-1.5 border-t pt-3.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCOP(subtotal)}</span>
                </div>
                {descuentoNumero > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento</span>
                    <span className="tabular-nums text-destructive">
                      −{formatCOP(descuentoNumero)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatCOP(total)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatNumero(unidades)} unidad
                  {unidades === 1 ? "" : "es"} en la venta
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={cobrar}
                loading={guardando}
                disabled={carrito.length === 0}
              >
                {guardando
                  ? "Registrando…"
                  : `Registrar venta · ${formatCOP(total)}`}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Barra de carrito móvil */}
      {vistaMovil === "productos" && carrito.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">
                {formatNumero(unidades)} unidad{unidades === 1 ? "" : "es"}
              </p>
              <p className="text-lg font-bold leading-tight tabular-nums">
                {formatCOP(total)}
              </p>
            </div>
            <Button onClick={() => setVistaMovil("carrito")}>
              Ver carrito
              <ShoppingBasket className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(ventaRegistrada)}
        onClose={() => setVentaRegistrada(null)}
        title="Venta registrada"
        description="El inventario se actualizó automáticamente."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setVentaRegistrada(null);
                router.push("/ventas");
              }}
            >
              Ver ventas
            </Button>
            <Button onClick={() => setVentaRegistrada(null)}>
              Nueva venta
            </Button>
          </>
        }
      >
        {ventaRegistrada && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7ef] text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total cobrado</p>
              <p className="font-display text-3xl font-semibold tabular-nums">
                {formatCOP(ventaRegistrada.total)}
              </p>
            </div>
            <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3 text-left text-sm">
              {ventaRegistrada.descuento > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Descuento aplicado</span>
                  <span className="tabular-nums">
                    {formatCOP(ventaRegistrada.descuento)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Método de pago</span>
                <span className="font-medium text-foreground">{metodoPago}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
