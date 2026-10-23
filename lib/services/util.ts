import { supabaseConfigurado } from "@/lib/supabase/client";

export function verificarConfiguracion() {
  if (!supabaseConfigurado) {
    throw new Error(
      "Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local."
    );
  }
}

export function mensajeDeError(error: unknown): string {
  const texto =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : error instanceof Error
        ? error.message
        : String(error ?? "");

  if (texto.includes("does not exist") && texto.includes("relation")) {
    return "La base de datos no tiene las tablas. Ejecuta supabase/schema.sql en Supabase.";
  }
  if (texto.includes("Could not find the function")) {
    return "Faltan las funciones de la base de datos. Vuelve a ejecutar supabase/schema.sql.";
  }
  if (texto.includes("row-level security")) {
    return "Tu sesión no tiene permisos. Inicia sesión nuevamente.";
  }
  if (texto.includes("Failed to fetch") || texto.includes("NetworkError")) {
    return "No se pudo conectar con Supabase. Revisa tu conexión.";
  }
  return texto || "Ocurrió un error inesperado.";
}

type ConsultaPaginada = {
  range: (
    desde: number,
    hasta: number
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Recorre todas las filas de una consulta en bloques de 1000
 * para superar el límite por defecto de PostgREST.
 */
export async function traerTodo<T>(
  crearConsulta: () => ConsultaPaginada
): Promise<T[]> {
  const tamano = 1000;
  const filas: T[] = [];

  for (let inicio = 0; ; inicio += tamano) {
    const { data, error } = await crearConsulta().range(
      inicio,
      inicio + tamano - 1
    );
    if (error) throw new Error(error.message);

    const lote = (data ?? []) as T[];
    filas.push(...lote);
    if (lote.length < tamano) break;
  }

  return filas;
}
