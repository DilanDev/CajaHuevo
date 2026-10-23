"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  actualizarGasto,
  crearGasto,
  type GastoInput,
} from "@/lib/services/gastos";
import { mensajeDeError } from "@/lib/services/util";
import { fechaISOLocal, formatCOP } from "@/lib/format";
import {
  CATEGORIAS_GASTO,
  METODOS_PAGO,
  type Gasto,
  type MetodoPago,
} from "@/types";

type Formulario = {
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: string;
  metodo_pago: MetodoPago;
};

function formularioInicial(): Formulario {
  return {
    fecha: fechaISOLocal(),
    categoria: "Compra de mercancía",
    descripcion: "",
    monto: "",
    metodo_pago: "Efectivo",
  };
}

function aNumero(texto: string): number {
  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function formularioDesde(gasto: Gasto): Formulario {
  return {
    fecha: gasto.fecha.slice(0, 10),
    categoria: gasto.categoria,
    descripcion: gasto.descripcion,
    monto: String(gasto.monto),
    metodo_pago: gasto.metodo_pago,
  };
}

type GastoDialogProps = {
  open: boolean;
  onClose: () => void;
  gasto: Gasto | null;
  onSaved: () => void;
};

export function GastoDialog({ open, ...props }: GastoDialogProps) {
  if (!open) return null;
  return <FormularioGasto {...props} />;
}

function FormularioGasto({
  onClose,
  gasto,
  onSaved,
}: Omit<GastoDialogProps, "open">) {
  const [formulario, setFormulario] = useState<Formulario>(() =>
    gasto ? formularioDesde(gasto) : formularioInicial()
  );
  const [errores, setErrores] = useState<
    Partial<Record<keyof Formulario, string>>
  >({});
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(gasto);

  const categorias = gasto
    ? Array.from(new Set([...CATEGORIAS_GASTO, gasto.categoria]))
    : [...CATEGORIAS_GASTO];

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (errores[campo]) {
      setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
    }
  }

  function validar(): GastoInput | null {
    const nuevos: Partial<Record<keyof Formulario, string>> = {};
    const descripcion = formulario.descripcion.trim();
    const monto = aNumero(formulario.monto);

    if (!formulario.fecha) nuevos.fecha = "Selecciona una fecha.";
    if (!descripcion) nuevos.descripcion = "Describe en qué se gastó.";
    if (monto <= 0) nuevos.monto = "El monto debe ser mayor que cero.";

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return null;

    return {
      fecha: formulario.fecha,
      categoria: formulario.categoria,
      descripcion,
      monto,
      metodo_pago: formulario.metodo_pago,
    };
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const datos = validar();
    if (!datos) return;

    setGuardando(true);
    try {
      if (gasto) {
        await actualizarGasto(gasto.id, datos);
        toast.success("Gasto actualizado");
      } else {
        await crearGasto(datos);
        toast.success("Gasto registrado");
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
      title={editando ? "Editar gasto" : "Nuevo gasto"}
      description="Registra las salidas de dinero del negocio."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-gasto" loading={guardando}>
            {editando ? "Guardar cambios" : "Registrar gasto"}
          </Button>
        </>
      }
    >
      <form id="formulario-gasto" onSubmit={guardar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gasto-fecha">Fecha *</Label>
            <Input
              id="gasto-fecha"
              type="date"
              value={formulario.fecha}
              onChange={(evento) => actualizar("fecha", evento.target.value)}
            />
            <FieldError>{errores.fecha}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gasto-monto">Monto *</Label>
            <Input
              id="gasto-monto"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={formulario.monto}
              onChange={(evento) => actualizar("monto", evento.target.value)}
              placeholder="0"
            />
            <FieldError>{errores.monto}</FieldError>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gasto-categoria">Categoría</Label>
          <Select
            id="gasto-categoria"
            value={formulario.categoria}
            onChange={(evento) => actualizar("categoria", evento.target.value)}
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gasto-descripcion">Descripción *</Label>
          <Textarea
            id="gasto-descripcion"
            value={formulario.descripcion}
            onChange={(evento) =>
              actualizar("descripcion", evento.target.value)
            }
            placeholder="Ej. Flete de 20 cartones desde la granja"
            rows={3}
          />
          <FieldError>{errores.descripcion}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gasto-metodo">Método de pago</Label>
          <Select
            id="gasto-metodo"
            value={formulario.metodo_pago}
            onChange={(evento) =>
              actualizar("metodo_pago", evento.target.value as MetodoPago)
            }
          >
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Monto del gasto</span>
          <span className="font-bold tabular-nums text-destructive">
            −{formatCOP(aNumero(formulario.monto))}
          </span>
        </div>
      </form>
    </Dialog>
  );
}
