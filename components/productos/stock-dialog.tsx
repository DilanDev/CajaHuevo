"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { ajustarStock } from "@/lib/services/productos";
import { mensajeDeError } from "@/lib/services/util";
import { formatNumero } from "@/lib/format";
import type { Producto } from "@/types";
import { cn } from "@/lib/utils";

type StockDialogProps = {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onUpdated: () => void;
};

export function StockDialog({ open, ...props }: StockDialogProps) {
  if (!open) return null;
  return <FormularioStock {...props} />;
}

function FormularioStock({
  onClose,
  producto,
  onUpdated,
}: Omit<StockDialogProps, "open">) {
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const numero = Math.trunc(Number(cantidad));
  const stockActual = producto?.stock ?? 0;
  const nuevoStock = useMemo(() => {
    if (!Number.isFinite(numero) || numero <= 0) return stockActual;
    return tipo === "entrada" ? stockActual + numero : stockActual - numero;
  }, [numero, stockActual, tipo]);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!producto) return;

    if (!Number.isFinite(numero) || numero <= 0) {
      setError("Escribe una cantidad mayor que cero.");
      return;
    }
    if (tipo === "salida" && numero > producto.stock) {
      setError(`Solo hay ${formatNumero(producto.stock)} unidades disponibles.`);
      return;
    }

    setGuardando(true);
    try {
      await ajustarStock(producto.id, numero, tipo);
      toast.success(
        tipo === "entrada"
          ? `Entraron ${formatNumero(numero)} unidades`
          : `Salieron ${formatNumero(numero)} unidades`
      );
      onUpdated();
      onClose();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Ajustar stock"
      description={producto?.nombre}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-stock" loading={guardando}>
            Guardar ajuste
          </Button>
        </>
      }
    >
      <form id="formulario-stock" onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipo("entrada");
              setError(null);
            }}
            aria-pressed={tipo === "entrada"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              tipo === "entrada"
                ? "border-[#b7ddc5] bg-[#eef9f2] text-success"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo("salida");
              setError(null);
            }}
            aria-pressed={tipo === "salida"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              tipo === "salida"
                ? "border-[#f0c5c0] bg-[#fdf2f1] text-destructive"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            Salida
          </button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-cantidad">Cantidad</Label>
          <Input
            id="stock-cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={cantidad}
            onChange={(evento) => {
              setCantidad(evento.target.value);
              setError(null);
            }}
            placeholder="0"
            autoFocus
          />
          <FieldError>{error}</FieldError>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Stock resultante</span>
          <span
            className={cn(
              "font-bold tabular-nums",
              nuevoStock < 0
                ? "text-destructive"
                : nuevoStock === 0
                  ? "text-warning"
                  : "text-foreground"
            )}
          >
            {formatNumero(nuevoStock)} unidades
          </span>
        </div>
      </form>
    </Dialog>
  );
}
