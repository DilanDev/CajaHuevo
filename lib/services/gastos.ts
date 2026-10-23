import { supabase } from "@/lib/supabase/client";
import type { Gasto, MetodoPago } from "@/types";
import type { Rango } from "@/lib/periodos";
import { fechaISOLocal } from "@/lib/format";
import { traerTodo, verificarConfiguracion } from "@/lib/services/util";

export type GastoInput = {
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: MetodoPago;
};

export async function listarGastos(rango: Rango): Promise<Gasto[]> {
  verificarConfiguracion();

  return traerTodo<Gasto>(() =>
    supabase
      .from("gastos")
      .select("*")
      .gte("fecha", fechaISOLocal(rango.desde))
      .lte("fecha", fechaISOLocal(rango.hasta))
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
  );
}

export async function crearGasto(input: GastoInput): Promise<Gasto> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("gastos")
    .insert({
      ...input,
      descripcion: input.descripcion.trim(),
      categoria: input.categoria.trim() || "Otros",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Gasto;
}

export async function actualizarGasto(
  id: string,
  input: GastoInput
): Promise<Gasto> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("gastos")
    .update({
      ...input,
      descripcion: input.descripcion.trim(),
      categoria: input.categoria.trim() || "Otros",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Gasto;
}

export async function eliminarGasto(id: string): Promise<void> {
  verificarConfiguracion();

  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
