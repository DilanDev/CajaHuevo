import { supabase } from "@/lib/supabase/client";
import type { MetodoPago, Venta, VentaConItems } from "@/types";
import type { Rango } from "@/lib/periodos";
import { traerTodo, verificarConfiguracion } from "@/lib/services/util";

export type ItemVentaInput = {
  producto_id: string;
  cantidad: number;
};

export type NuevaVentaInput = {
  items: ItemVentaInput[];
  cliente?: string;
  metodo_pago: MetodoPago;
  descuento: number;
  notas?: string;
};

export type ResultadoVenta = {
  id: string;
  subtotal: number;
  descuento: number;
  total: number;
  costo_total: number;
};

export async function registrarVenta(
  input: NuevaVentaInput
): Promise<ResultadoVenta> {
  verificarConfiguracion();

  const { data, error } = await supabase.rpc("registrar_venta", {
    p_items: input.items,
    p_cliente: input.cliente?.trim() || null,
    p_metodo_pago: input.metodo_pago,
    p_descuento: input.descuento,
    p_notas: input.notas?.trim() || null,
  });

  if (error) throw new Error(error.message);
  return data as ResultadoVenta;
}

export async function eliminarVenta(id: string): Promise<void> {
  verificarConfiguracion();

  const { error } = await supabase.rpc("eliminar_venta", {
    p_venta_id: id,
  });

  if (error) throw new Error(error.message);
}

export async function listarVentas(
  rango: Rango,
  opciones?: { limite?: number }
): Promise<VentaConItems[]> {
  verificarConfiguracion();

  const filas = await traerTodo<VentaConItems>(() =>
    supabase
      .from("ventas")
      .select("*, venta_items(*)")
      .gte("fecha", rango.desde.toISOString())
      .lte("fecha", rango.hasta.toISOString())
      .order("fecha", { ascending: false })
  );

  return opciones?.limite ? filas.slice(0, opciones.limite) : filas;
}

export async function listarVentasSinDetalle(rango: Rango): Promise<Venta[]> {
  verificarConfiguracion();

  return traerTodo<Venta>(() =>
    supabase
      .from("ventas")
      .select(
        "id, numero, fecha, cliente, metodo_pago, subtotal, descuento, total, costo_total, notas, created_at"
      )
      .gte("fecha", rango.desde.toISOString())
      .lte("fecha", rango.hasta.toISOString())
      .order("fecha", { ascending: false })
  );
}

export async function ultimasVentas(limite = 5): Promise<Venta[]> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("ventas")
    .select(
      "id, numero, fecha, cliente, metodo_pago, subtotal, descuento, total, costo_total, notas, created_at"
    )
    .order("fecha", { ascending: false })
    .limit(limite);

  if (error) throw new Error(error.message);
  return (data ?? []) as Venta[];
}
