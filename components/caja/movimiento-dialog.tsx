"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { crearMovimientoCaja } from "@/lib/services/caja";
import { mensajeDeError } from "@/lib/services/util";
import { fechaISOLocal, formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tipo = "ingreso" | "egreso";

function aNumero(texto: string): number {
  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function fechaParaGuardar(fechaISO: string): string {
  if (fechaISO === fechaISOLocal()) return new Date().toISOString();
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return new Date().toISOString();
  return new Date(anio, mes - 1, dia, 12, 0, 0).toISOString();
}

type MovimientoDialogProps = {
  open: boolean;
  onClose: () => void;
  tipoInicial?: Tipo;
  onSaved: () => void;
};

export function MovimientoDialog({ open, ...props }: MovimientoDialogProps) {
  if (!open) return null;
  return <FormularioMovimiento {...props} />;
}

function FormularioMovimiento({
  onClose,
  tipoInicial = "ingreso",
  onSaved,
}: Omit<MovimientoDialogProps, "open">) {
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(fechaISOLocal());
  const [errores, setErrores] = useState<{ concepto?: string; monto?: string }>(
    {}
  );
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const nuevos: { concepto?: string; monto?: string } = {};
    const montoNumero = aNumero(monto);

    if (!concepto.trim()) nuevos.concepto = "Escribe el concepto del movimiento.";
    if (montoNumero <= 0) nuevos.monto = "El monto debe ser mayor que cero.";

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      await crearMovimientoCaja({
        tipo,
        concepto: concepto.trim(),
        monto: montoNumero,
        fecha: fechaParaGuardar(fecha),
      });
      toast.success(
        tipo === "ingreso"
          ? "Ingreso registrado en caja"
          : "Egreso registrado en caja"
      );
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
      title="Movimiento de caja menor"
      description="Registra el dinero que entra o sale del fondo."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-caja" loading={guardando}>
            Guardar movimiento
          </Button>
        </>
      }
    >
      <form id="formulario-caja" onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo("ingreso")}
            aria-pressed={tipo === "ingreso"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              tipo === "ingreso"
                ? "border-[#b7ddc5] bg-[#eef9f2] text-success"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setTipo("egreso")}
            aria-pressed={tipo === "egreso"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              tipo === "egreso"
                ? "border-[#f0c5c0] bg-[#fdf2f1] text-destructive"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            Egreso
          </button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="caja-concepto">Concepto *</Label>
          <Input
            id="caja-concepto"
            value={concepto}
            onChange={(evento) => {
              setConcepto(evento.target.value);
              setErrores((anterior) => ({ ...anterior, concepto: undefined }));
            }}
            placeholder={
              tipo === "ingreso"
                ? "Ej. Reposición del fondo"
                : "Ej. Compra de bolsas y empaques"
            }
            autoFocus
          />
          <FieldError>{errores.concepto}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="caja-monto">Monto *</Label>
            <Input
              id="caja-monto"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={monto}
              onChange={(evento) => {
                setMonto(evento.target.value);
                setErrores((anterior) => ({ ...anterior, monto: undefined }));
              }}
              placeholder="0"
            />
            <FieldError>{errores.monto}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caja-fecha">Fecha</Label>
            <Input
              id="caja-fecha"
              type="date"
              value={fecha}
              max={fechaISOLocal()}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </div>
        </div>

        <FieldHint>
          La caja menor es un fondo aparte. No mezcles aquí ventas ni gastos
          generales.
        </FieldHint>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {tipo === "ingreso" ? "Entra a caja" : "Sale de caja"}
          </span>
          <span
            className={cn(
              "font-bold tabular-nums",
              tipo === "ingreso" ? "text-success" : "text-destructive"
            )}
          >
            {tipo === "ingreso" ? "+" : "−"}
            {formatCOP(aNumero(monto))}
          </span>
        </div>
      </form>
    </Dialog>
  );
}
