import { supabase } from "@/lib/supabase/client";
import type { CajaMovimiento } from "@/types";
import { traerTodo, verificarConfiguracion } from "@/lib/services/util";

export type CajaMovimientoInput = {
  tipo: "ingreso" | "egreso";
  concepto: string;
  monto: number;
  fecha: string;
};

export async function listarMovimientosCaja(): Promise<CajaMovimiento[]> {
  verificarConfiguracion();

  return traerTodo<CajaMovimiento>(() =>
    supabase
      .from("caja_movimientos")
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
  );
}

export async function crearMovimientoCaja(
  input: CajaMovimientoInput
): Promise<CajaMovimiento> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("caja_movimientos")
    .insert({
      ...input,
      concepto: input.concepto.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CajaMovimiento;
}

export async function eliminarMovimientoCaja(id: string): Promise<void> {
  verificarConfiguracion();

  const { error } = await supabase
    .from("caja_movimientos")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function calcularSaldoCaja(movimientos: CajaMovimiento[]) {
  let ingresos = 0;
  let egresos = 0;

  for (const movimiento of movimientos) {
    const monto = Number(movimiento.monto) || 0;
    if (movimiento.tipo === "ingreso") ingresos += monto;
    else egresos += monto;
  }

  return {
    ingresos,
    egresos,
    saldo: ingresos - egresos,
    cantidad: movimientos.length,
  };
}
