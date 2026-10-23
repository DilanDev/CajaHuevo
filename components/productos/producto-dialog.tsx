"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  actualizarProducto,
  crearProducto,
  type ProductoInput,
} from "@/lib/services/productos";
import { mensajeDeError } from "@/lib/services/util";
import { formatCOP, formatPorcentaje } from "@/lib/format";
import { CATEGORIAS_PRODUCTO, type Producto } from "@/types";

type Formulario = {
  nombre: string;
  categoria: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  stock: string;
  stock_minimo: string;
};

const FORMULARIO_VACIO: Formulario = {
  nombre: "",
  categoria: "Cartón de huevos",
  descripcion: "",
  precio_compra: "",
  precio_venta: "",
  stock: "0",
  stock_minimo: "5",
};

function aNumero(texto: string): number {
  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function formularioDesde(producto: Producto): Formulario {
  return {
    nombre: producto.nombre,
    categoria: producto.categoria,
    descripcion: producto.descripcion ?? "",
    precio_compra: String(producto.precio_compra),
    precio_venta: String(producto.precio_venta),
    stock: String(producto.stock),
    stock_minimo: String(producto.stock_minimo),
  };
}

type ProductoDialogProps = {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSaved: () => void;
};

export function ProductoDialog({ open, ...props }: ProductoDialogProps) {
  if (!open) return null;
  return <FormularioProducto {...props} />;
}

function FormularioProducto({
  onClose,
  producto,
  onSaved,
}: Omit<ProductoDialogProps, "open">) {
  const [formulario, setFormulario] = useState<Formulario>(() =>
    producto ? formularioDesde(producto) : FORMULARIO_VACIO
  );
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(producto);

  const margen = useMemo(() => {
    const compra = aNumero(formulario.precio_compra);
    const venta = aNumero(formulario.precio_venta);
    if (venta <= 0) return null;
    return (venta - compra) / venta;
  }, [formulario.precio_compra, formulario.precio_venta]);

  function actualizar(campo: keyof Formulario, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (errores[campo]) {
      setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
    }
  }

  function validar(): ProductoInput | null {
    const nuevosErrores: Partial<Record<keyof Formulario, string>> = {};
    const nombre = formulario.nombre.trim();
    const precioCompra = aNumero(formulario.precio_compra);
    const precioVenta = aNumero(formulario.precio_venta);
    const stock = Math.trunc(aNumero(formulario.stock));
    const stockMinimo = Math.trunc(aNumero(formulario.stock_minimo));

    if (!nombre) nuevosErrores.nombre = "Escribe el nombre del producto.";
    if (precioVenta <= 0)
      nuevosErrores.precio_venta = "El precio de venta debe ser mayor que cero.";
    if (precioCompra < 0)
      nuevosErrores.precio_compra = "El costo no puede ser negativo.";
    if (stock < 0) nuevosErrores.stock = "El stock no puede ser negativo.";
    if (stockMinimo < 0)
      nuevosErrores.stock_minimo = "El mínimo no puede ser negativo.";

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return null;

    return {
      nombre,
      descripcion: formulario.descripcion.trim() || null,
      categoria: formulario.categoria,
      precio_compra: precioCompra,
      precio_venta: precioVenta,
      stock,
      stock_minimo: stockMinimo,
    };
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const datos = validar();
    if (!datos) return;

    setGuardando(true);
    try {
      if (producto) {
        await actualizarProducto(producto.id, datos);
        toast.success("Producto actualizado");
      } else {
        await crearProducto(datos);
        toast.success("Producto creado");
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editando ? "Editar producto" : "Nuevo producto"}
      description={
        editando
          ? "Actualiza los datos del producto y su inventario."
          : "Agrega lo que vendes y define su precio y existencias."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-producto" loading={guardando}>
            {editando ? "Guardar cambios" : "Crear producto"}
          </Button>
        </>
      }
    >
      <form
        id="formulario-producto"
        onSubmit={guardar}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="producto-nombre">Nombre del producto *</Label>
          <Input
            id="producto-nombre"
            value={formulario.nombre}
            onChange={(evento) => actualizar("nombre", evento.target.value)}
            placeholder="Ej. Cartón de huevos AA x 30"
            autoFocus
          />
          <FieldError>{errores.nombre}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="producto-categoria">Tipo</Label>
            <Select
              id="producto-categoria"
              value={formulario.categoria}
              onChange={(evento) => actualizar("categoria", evento.target.value)}
            >
              {CATEGORIAS_PRODUCTO.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="producto-stock-minimo">Stock mínimo</Label>
            <Input
              id="producto-stock-minimo"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={formulario.stock_minimo}
              onChange={(evento) => actualizar("stock_minimo", evento.target.value)}
            />
            <FieldError>{errores.stock_minimo}</FieldError>
            <FieldHint>Te avisaremos cuando quede en este nivel.</FieldHint>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="producto-descripcion">Descripción</Label>
          <Textarea
            id="producto-descripcion"
            value={formulario.descripcion}
            onChange={(evento) => actualizar("descripcion", evento.target.value)}
            placeholder="Opcional: tamaño, marca, presentación…"
            rows={2}
          />
        </div>

        <div className="rounded-xl border bg-muted/40 p-3.5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Precios en pesos colombianos
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="producto-compra">Precio de compra</Label>
              <Input
                id="producto-compra"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={formulario.precio_compra}
                onChange={(evento) => actualizar("precio_compra", evento.target.value)}
                placeholder="0"
              />
              <FieldError>{errores.precio_compra}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="producto-venta">Precio de venta *</Label>
              <Input
                id="producto-venta"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={formulario.precio_venta}
                onChange={(evento) => actualizar("precio_venta", evento.target.value)}
                placeholder="0"
              />
              <FieldError>{errores.precio_venta}</FieldError>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <span className="text-muted-foreground">
              Ganancia por unidad:{" "}
              <strong className="text-foreground">
                {formatCOP(
                  aNumero(formulario.precio_venta) -
                    aNumero(formulario.precio_compra)
                )}
              </strong>
            </span>
            {margen !== null && (
              <span
                className={
                  margen >= 0
                    ? "font-semibold text-success"
                    : "font-semibold text-destructive"
                }
              >
                Margen {formatPorcentaje(margen)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="producto-stock">
            {editando ? "Stock actual" : "Stock inicial"}
          </Label>
          <Input
            id="producto-stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={formulario.stock}
            onChange={(evento) => actualizar("stock", evento.target.value)}
          />
          <FieldError>{errores.stock}</FieldError>
          <FieldHint>
            {editando
              ? "Si cambias este valor, reemplaza el stock actual. Para sumar o restar unidades usa “Ajustar stock”."
              : "Unidades disponibles para vender desde ya."}
          </FieldHint>
        </div>
      </form>
    </Dialog>
  );
}
