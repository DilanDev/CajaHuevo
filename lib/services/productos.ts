import { supabase } from "@/lib/supabase/client";
import type { Producto } from "@/types";
import { traerTodo, verificarConfiguracion } from "@/lib/services/util";

export type ProductoInput = {
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
};

export async function listarProductos(opciones?: {
  soloActivos?: boolean;
}): Promise<Producto[]> {
  verificarConfiguracion();

  return traerTodo<Producto>(() => {
    let consulta = supabase
      .from("productos")
      .select("*")
      .order("activo", { ascending: false })
      .order("nombre", { ascending: true });

    if (opciones?.soloActivos) {
      consulta = consulta.eq("activo", true);
    }

    return consulta;
  });
}

export async function crearProducto(input: ProductoInput): Promise<Producto> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("productos")
    .insert({
      ...input,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function actualizarProducto(
  id: string,
  input: ProductoInput
): Promise<Producto> {
  verificarConfiguracion();

  const { data, error } = await supabase
    .from("productos")
    .update({
      ...input,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function cambiarEstadoProducto(
  id: string,
  activo: boolean
): Promise<void> {
  verificarConfiguracion();

  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function ajustarStock(
  id: string,
  cantidad: number,
  tipo: "entrada" | "salida"
): Promise<void> {
  verificarConfiguracion();

  const { data, error: errorLectura } = await supabase
    .from("productos")
    .select("stock")
    .eq("id", id)
    .single();

  if (errorLectura) throw new Error(errorLectura.message);

  const stockActual = Number(data?.stock ?? 0);
  const nuevoStock =
    tipo === "entrada" ? stockActual + cantidad : stockActual - cantidad;

  if (nuevoStock < 0) {
    throw new Error("El stock no puede quedar en negativo.");
  }

  const { error } = await supabase
    .from("productos")
    .update({ stock: nuevoStock })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
